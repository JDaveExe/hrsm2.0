import React, { useState, useMemo, useEffect } from 'react';
import { Card, Row, Col, Tabs, Tab } from 'react-bootstrap';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, ArcElement } from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';
import { useData } from '../../../context/DataContext';
import { useAnalyticsData } from '../../../hooks/useAnalyticsData';
import adminService from '../../../services/adminService';
import '../styles/ReportsManager.css';
import '../styles/AdminModals.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const ReportsManager = ({ simulationMode }) => {
  const [activeTab, setActiveTab] = useState('generate');
  const [showReportCenterModal, setShowReportCenterModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [currentModifyReport, setCurrentModifyReport] = useState(null);
  const [selectedChartType, setSelectedChartType] = useState('bar');
  const [showGeneratedChart, setShowGeneratedChart] = useState(false);
  const [generatedChartData, setGeneratedChartData] = useState(null);
  
  // Use shared analytics data hook
  const { chartData, chartOptions, isLoading: isLoadingAnalytics } = useAnalyticsData(simulationMode);
  
  // Real data from backend
  const [medicineUsageData, setMedicineUsageData] = useState({ labels: [], data: [] });
  const [vaccineUsageData, setVaccineUsageData] = useState({ labels: [], data: [] });
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Fetch real medicine and vaccine usage data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setIsLoadingData(true);
        
        // Fetch medicine usage data
        const medicineData = await adminService.getMedicineUsage();
        if (medicineData && medicineData.length > 0) {
          setMedicineUsageData({
            labels: medicineData.map(item => item.medicine_name),
            data: medicineData.map(item => item.usage_count)
          });
        }
        
        // Fetch vaccine usage data
        const vaccineData = await adminService.getVaccineUsage();
        if (vaccineData && vaccineData.length > 0) {
          setVaccineUsageData({
            labels: vaccineData.map(item => item.vaccine_name),
            data: vaccineData.map(item => item.usage_count)
          });
        }
        
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        // Fallback to sample data if API fails
        setMedicineUsageData({
          labels: ['Paracetamol', 'Amoxicillin', 'Ibuprofen', 'Cetirizine', 'Aspirin'],
          data: [25, 18, 15, 12, 8]
        });
        setVaccineUsageData({
          labels: ['COVID-19', 'Influenza', 'Hepatitis B', 'Tetanus', 'Pneumonia'],
          data: [45, 28, 20, 15, 12]
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchAnalyticsData();
  }, []);
  
  const {
    patientsData,
    familiesData,
    appointmentsData,
    sharedCheckupsData,
    unsortedMembersData
  } = useData();

  // Memoized stats calculation (consistent with dashboard StatCards)
  const reportStats = useMemo(() => {
    const allPatients = [...(patientsData || []), ...(unsortedMembersData || [])];
    const todaysCheckups = sharedCheckupsData || [];
    const pendingAppointments = (appointmentsData || []).filter(apt => 
      apt.status === 'scheduled' || apt.status === 'pending'
    );

    const hasRealData = patientsData && patientsData.length > 0;
    
    // Use the same fallback values as StatCards
    if (!hasRealData) {
      return {
        totalPatients: 3,
        totalFamilies: 50,
        todaysCheckups: 0,
        pendingAppointments: 0,
        activeCheckups: 0,
        completedCheckups: 0,
        malePatients: 2,
        femalePatients: 1
      };
    }

    return {
      totalPatients: allPatients.length,
      totalFamilies: (familiesData || []).length,
      todaysCheckups: todaysCheckups.filter(checkup => 
        checkup.status === 'completed' && 
        new Date(checkup.updatedAt || checkup.completedAt).toDateString() === new Date().toDateString()
      ).length,
      pendingAppointments: pendingAppointments.length,
      activeCheckups: todaysCheckups.filter(checkup => 
        checkup.status === 'in-progress' || checkup.status === 'checked-in'
      ).length,
      completedCheckups: todaysCheckups.filter(checkup => 
        checkup.status === 'completed'
      ).length,
      malePatients: allPatients.filter(p => p.gender === 'Male').length,
      femalePatients: allPatients.filter(p => p.gender === 'Female').length
    };
  }, [patientsData, familiesData, appointmentsData, sharedCheckupsData, unsortedMembersData]);

  // Additional chart data for demographics (using shared analytics for main charts)
  const demographicsData = useMemo(() => {
    return {
      demographics: {
        labels: ['Male', 'Female'],
        datasets: [{
          data: [reportStats.malePatients, reportStats.femalePatients],
          backgroundColor: ['#9bc4e2', '#ffa8a8'],
          borderWidth: 0
        }]
      }
    };
  }, [reportStats.malePatients, reportStats.femalePatients]);

  // Report generation functions
  const generateReport = (reportType, format) => {
    const timestamp = new Date().toISOString().split('T')[0];
    let content = '';
    
    switch (reportType) {
      case 'patient-statistics':
        content = `Patient Statistics Report - ${timestamp}\n\n`;
        content += `Total Patients: ${reportStats.totalPatients}\n`;
        content += `Total Families: ${reportStats.totalFamilies}\n`;
        content += `Active Checkups: ${reportStats.activeCheckups}\n`;
        content += `Completed Today: ${reportStats.completedCheckups}\n`;
        break;
      case 'checkup-trends':
        content = `Checkup Trends Report - ${timestamp}\n\n`;
        content += `Weekly Total: ${reportStats.todaysCheckups} checkups\n`;
        content += `Daily Average: ${Math.round(reportStats.todaysCheckups / 7)} checkups\n`;
        break;
      case 'demographics':
        content = `Demographics Report - ${timestamp}\n\n`;
        content += `Male: ${reportStats.malePatients} patients\n`;
        content += `Female: ${reportStats.femalePatients} patients\n`;
        break;
      case 'appointment-analysis':
        content = `Appointment Analysis Report - ${timestamp}\n\n`;
        content += `Total Scheduled: ${reportStats.pendingAppointments}\n`;
        content += `Today's Checkups: ${reportStats.todaysCheckups}\n`;
        content += `Completed: ${reportStats.completedCheckups}\n`;
        content += `Pending: ${reportStats.pendingAppointments}\n`;
        break;
      case 'prescription-usage':
        content = `Prescription Usage Report - ${timestamp}\n\n`;
        content += `Monthly Total: 327 prescriptions\n`;
        content += `Peak Month: Feb\n`;
        break;
      case 'vaccination-usage':
        content = `Vaccination Usage Report - ${timestamp}\n\n`;
        content += `Total Vaccines: 344 administered\n`;
        content += `Most Common: COVID-19\n`;
        break;
    }

    // Generate file download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-${timestamp}.${format === 'excel' ? 'csv' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    // Show success notification
    console.log(`${reportType} report generated successfully!`);
  };

  const exportAllReports = () => {
    const reportTypes = [
      'patient-statistics',
      'checkup-trends', 
      'demographics',
      'appointment-analysis',
      'prescription-usage',
      'vaccination-usage'
    ];
    
    reportTypes.forEach((type, index) => {
      setTimeout(() => {
        generateReport(type, 'pdf');
      }, index * 500);
    });
  };

  // Modify report functionality
  const handleModifyReport = (reportType) => {
    setCurrentModifyReport(reportType);
    setShowModifyModal(true);
  };

  const getReportTitle = (reportType) => {
    switch (reportType) {
      case 'patient-statistics': return 'Patient Statistics';
      case 'checkup-trends': return 'Checkup Trends';
      case 'demographics': return 'Demographics';
      case 'appointment-analysis': return 'Appointment Analysis';
      case 'prescription-usage': return 'Prescription Usage';
      case 'vaccination-usage': return 'Vaccination Usage';
      default: return reportType;
    }
  };

  const getChartSuggestions = (reportType) => {
    switch (reportType) {
      case 'patient-statistics':
        return [
          { type: 'bar', label: 'Bar Chart', description: 'Compare different patient statistics' },
          { type: 'pie', label: 'Pie Chart', description: 'Show patient distribution percentages' }
        ];
      case 'checkup-trends':
        return [
          { type: 'line', label: 'Line Chart', description: 'Track checkup trends over time' },
          { type: 'bar', label: 'Bar Chart', description: 'Compare checkup counts by period' }
        ];
      case 'demographics':
        return [
          { type: 'pie', label: 'Pie Chart', description: 'Show gender and age distribution' },
          { type: 'bar', label: 'Bar Chart', description: 'Compare demographic groups' }
        ];
      case 'appointment-analysis':
        return [
          { type: 'line', label: 'Line Chart', description: 'Track appointment trends over time' },
          { type: 'bar', label: 'Bar Chart', description: 'Compare appointment statuses' }
        ];
      case 'prescription-usage':
        return [
          { type: 'pie', label: 'Pie Chart', description: 'Show most prescribed medicines' },
          { type: 'line', label: 'Line Chart', description: 'Track prescription trends over time' },
          { type: 'bar', label: 'Bar Chart', description: 'Compare monthly prescription counts' }
        ];
      case 'vaccination-usage':
        return [
          { type: 'pie', label: 'Pie Chart', description: 'Show most administered vaccines' },
          { type: 'pie', label: 'Pie Chart', description: 'Show vaccine type distribution' },
          { type: 'bar', label: 'Bar Chart', description: 'Compare vaccination quantities' }
        ];
      default:
        return [];
    }
  };

  const generateModifiedReport = () => {
    let chartData = {};
    let chartTitle = '';
    
    if (currentModifyReport === 'patient-statistics') {
      chartTitle = 'Patient Statistics Analysis';
      
      if (selectedChartType === 'bar') {
        chartData = {
          labels: ['Total Patients', 'Active Checkups', 'Total Families', 'Completed Today'],
          datasets: [{
            label: 'Count',
            data: [
              reportStats.totalPatients, 
              reportStats.activeCheckups, 
              reportStats.totalFamilies, 
              reportStats.completedCheckups
            ],
            backgroundColor: ['#9bc4e2', '#10b981', '#f59e0b', '#ef4444'],
            borderColor: ['#6BA3D3', '#059669', '#d97706', '#dc2626'],
            borderWidth: 1
          }]
        };
      } else if (selectedChartType === 'pie') {
        chartData = {
          labels: ['Male Patients', 'Female Patients'],
          datasets: [{
            data: [reportStats.malePatients, reportStats.femalePatients],
            backgroundColor: ['#9bc4e2', '#ffa8a8'],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        };
      }
    } else if (currentModifyReport === 'appointment-analysis') {
      chartTitle = 'Appointment Analysis Trends';
      
      if (selectedChartType === 'line') {
        chartData = {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Appointments',
            data: [12, 8, 15, 10, 18, 6, 4],
            borderColor: '#9bc4e2',
            backgroundColor: 'rgba(155, 196, 226, 0.1)',
            tension: 0.4,
            fill: true
          }]
        };
      } else if (selectedChartType === 'bar') {
        chartData = {
          labels: ['Scheduled', 'Completed', 'Pending', 'Cancelled'],
          datasets: [{
            label: 'Count',
            data: [
              reportStats.pendingAppointments, 
              reportStats.completedCheckups, 
              reportStats.activeCheckups, 
              2
            ],
            backgroundColor: ['#9bc4e2', '#10b981', '#f59e0b', '#ef4444'],
            borderColor: ['#6BA3D3', '#059669', '#d97706', '#dc2626'],
            borderWidth: 1
          }]
        };
      }
    } else if (currentModifyReport === 'checkup-trends') {
      chartTitle = 'Checkup Trends Analysis';
      
      if (selectedChartType === 'line') {
        chartData = {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Checkups',
            data: [2, 4, 1, 6, 3, 2, 0],
            borderColor: '#9bc4e2',
            backgroundColor: 'rgba(155, 196, 226, 0.1)',
            tension: 0.4,
            fill: true
          }]
        };
      } else if (selectedChartType === 'bar') {
        chartData = {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Checkups',
            data: [2, 4, 1, 6, 3, 2, 0],
            backgroundColor: ['#9bc4e2', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'],
            borderWidth: 1
          }]
        };
      }
    } else if (currentModifyReport === 'demographics') {
      chartTitle = 'Demographics Analysis';
      
      if (selectedChartType === 'pie') {
        chartData = {
          labels: ['Male Patients', 'Female Patients'],
          datasets: [{
            data: [reportStats.malePatients, reportStats.femalePatients],
            backgroundColor: ['#9bc4e2', '#ffa8a8'],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        };
      } else if (selectedChartType === 'bar') {
        chartData = {
          labels: ['0-18 Years', '19-35 Years', '36-55 Years', '56+ Years', 'Male', 'Female'],
          datasets: [{
            label: 'Count',
            data: [15, 35, 45, 32, reportStats.malePatients, reportStats.femalePatients],
            backgroundColor: ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#9bc4e2', '#ffa8a8'],
            borderWidth: 1
          }]
        };
      }
    } else if (currentModifyReport === 'prescription-usage') {
      chartTitle = 'Prescription Usage Analysis';
      
      if (selectedChartType === 'pie') {
        chartData = {
          labels: medicineUsageData.labels.length > 0 ? medicineUsageData.labels : ['Paracetamol', 'Amoxicillin', 'Ibuprofen', 'Cetirizine', 'Aspirin'],
          datasets: [{
            data: medicineUsageData.data.length > 0 ? medicineUsageData.data : [25, 18, 15, 12, 8],
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        };
      } else if (selectedChartType === 'line') {
        chartData = {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Prescriptions',
            data: [65, 78, 52, 90, 67, 85],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true
          }]
        };
      } else if (selectedChartType === 'bar') {
        chartData = {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Prescriptions',
            data: [65, 78, 52, 90, 67, 85],
            backgroundColor: ['#10b981', '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d'],
            borderWidth: 1
          }]
        };
      }
    } else if (currentModifyReport === 'vaccination-usage') {
      chartTitle = 'Vaccination Usage Analysis';
      
      if (selectedChartType === 'pie') {
        chartData = {
          labels: vaccineUsageData.labels.length > 0 ? vaccineUsageData.labels : ['COVID-19', 'Influenza', 'Hepatitis B', 'Tetanus', 'Others'],
          datasets: [{
            data: vaccineUsageData.data.length > 0 ? vaccineUsageData.data : [45, 32, 28, 25, 18],
            backgroundColor: ['#60a5fa', '#fbbf24', '#ef4444', '#10b981', '#8b5cf6', '#84cc16', '#ec4899', '#6366f1'],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        };
      } else if (selectedChartType === 'bar') {
        chartData = {
          labels: vaccineUsageData.labels.length > 0 ? vaccineUsageData.labels : ['COVID-19', 'Influenza', 'Hepatitis B', 'Tetanus', 'Others'],
          datasets: [{
            label: 'Vaccinations',
            data: vaccineUsageData.data.length > 0 ? vaccineUsageData.data : [45, 32, 28, 25, 18],
            backgroundColor: ['#60a5fa', '#fbbf24', '#ef4444', '#10b981', '#8b5cf6', '#84cc16', '#ec4899', '#6366f1'],
            borderWidth: 1
          }]
        };
      }
    }
    
    setGeneratedChartData({
      data: chartData,
      type: selectedChartType,
      title: chartTitle,
      reportType: currentModifyReport
    });
    
    setShowModifyModal(false);
    setShowGeneratedChart(true);
  };

  return (
    <div className="reports-manager">
      {/* Simulation Badge */}
      {simulationMode?.isEnabled && (
        <div className="simulation-badge-container mb-3">
          <div className="simulation-badge">
            <i className="bi bi-flask"></i>
            Simulation Mode Active
          </div>
        </div>
      )}

      {/* Reports Tabs */}
      <div className="reports-tabs-container">
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="reports-tabs"
        >
          <Tab eventKey="generate" title={
            <span>
              <i className="bi bi-file-earmark-bar-graph me-2"></i>
              Generate Reports
            </span>
          }>
          </Tab>

          <Tab eventKey="history" title={
            <span>
              <i className="bi bi-clock-history me-2"></i>
              Reports History
            </span>
          }>
          </Tab>
        </Tabs>

        {/* Header Actions moved to right of tabs */}
        <div className="reports-header-actions">
          <button className="btn btn-primary me-2" onClick={() => setShowReportCenterModal(true)}>
            <i className="bi bi-gear me-2"></i>
            Report Center
          </button>
          <button className="btn btn-success" onClick={exportAllReports}>
            <i className="bi bi-download me-2"></i>
            Export All Reports
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content-wrapper">
        {activeTab === 'generate' && (
          <div className="generate-reports-content">
            {/* Reports Grid - 2x3 layout */}
            <div className="reports-grid">
              {/* First Row */}
              {/* Patient Statistics Report */}
              <div className="report-card">
                <div className="report-header">
                  <div className="report-icon stats">
                    <i className="bi bi-people"></i>
                  </div>
                  <div className="report-info">
                    <h3>Patient Statistics Report</h3>
                    <p>Comprehensive overview of patient demographics and statistics</p>
                  </div>
                </div>
                <div className="report-content">
                  <div className="report-preview">
                    <div className="preview-stats">
                      <div className="stat-item">
                        <span className="stat-label">Total Patients:</span>
                        <span className="stat-value">{reportStats.totalPatients}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Active Checkups:</span>
                        <span className="stat-value">{reportStats.activeCheckups}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Total Families:</span>
                        <span className="stat-value">{reportStats.totalFamilies}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Completed Today:</span>
                        <span className="stat-value">{reportStats.completedCheckups}</span>
                      </div>
                    </div>
                  </div>
                  <div className="report-actions has-modify">
                    <button className="btn-generate" onClick={() => generateReport('patient-statistics', 'pdf')}>
                      <i className="bi bi-file-earmark-pdf"></i>
                      Generate PDF
                    </button>
                    <button className="btn-generate excel" onClick={() => generateReport('patient-statistics', 'excel')}>
                      <i className="bi bi-file-earmark-excel"></i>
                      Generate Excel
                    </button>
                    <button className="btn-generate modify" onClick={() => handleModifyReport('patient-statistics')}>
                      <i className="bi bi-graph-up"></i>
                      Modify
                    </button>
                  </div>
                </div>
              </div>

              {/* Checkup Trends Report */}
              <div className="report-card">
                <div className="report-header">
                  <div className="report-icon trends">
                    <i className="bi bi-graph-up"></i>
                  </div>
                  <div className="report-info">
                    <h3>Checkup Trends Report</h3>
                    <p>Weekly and monthly patient checkup trends analysis</p>
                  </div>
                </div>
                <div className="report-content">
                  <div className="report-preview">
                    <div className="chart-mini" style={{height: '120px'}}>
                      <Line 
                        data={chartData.checkupTrends} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            title: { display: false }
                          },
                          scales: {
                            x: { display: false },
                            y: { 
                              display: false,
                              beginAtZero: true,
                              ticks: {
                                precision: 0,
                                callback: function(value) {
                                  if (value % 1 === 0) return value;
                                }
                              }
                            }
                          }
                        }} 
                      />
                    </div>
                    <div className="trend-summary">
                      <span>Weekly Total: {chartData.checkupTrends.datasets[0].data.reduce((a, b) => a + b, 0)} checkups</span>
                      <span>Daily Average: {Math.round(chartData.checkupTrends.datasets[0].data.reduce((a, b) => a + b, 0) / 7)} checkups</span>
                    </div>
                  </div>
                  <div className="report-actions has-modify">
                    <button className="btn-generate" onClick={() => generateReport('checkup-trends', 'pdf')}>
                      <i className="bi bi-file-earmark-pdf"></i>
                      Generate PDF
                    </button>
                    <button className="btn-generate excel" onClick={() => generateReport('checkup-trends', 'excel')}>
                      <i className="bi bi-file-earmark-excel"></i>
                      Generate Excel
                    </button>
                    <button className="btn-generate modify" onClick={() => handleModifyReport('checkup-trends')}>
                      <i className="bi bi-graph-up"></i>
                      Modify
                    </button>
                  </div>
                </div>
              </div>

              {/* Demographics Report */}
              <div className="report-card">
                <div className="report-header">
                  <div className="report-icon demographics">
                    <i className="bi bi-pie-chart"></i>
                  </div>
                  <div className="report-info">
                    <h3>Demographics Report</h3>
                    <p>Patient demographics breakdown by age and gender</p>
                  </div>
                </div>
                <div className="report-content">
                  <div className="report-preview">
                    <div className="chart-mini" style={{height: '120px'}}>
                      <Pie 
                        data={demographicsData.demographics} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            title: { display: false }
                          }
                        }}
                      />
                    </div>
                    <div className="demo-summary">
                      <span>Male: {reportStats.malePatients} patients</span>
                      <span>Female: {reportStats.femalePatients} patients</span>
                    </div>
                  </div>
                  <div className="report-actions has-modify">
                    <button className="btn-generate" onClick={() => generateReport('demographics', 'pdf')}>
                      <i className="bi bi-file-earmark-pdf"></i>
                      Generate PDF
                    </button>
                    <button className="btn-generate excel" onClick={() => generateReport('demographics', 'excel')}>
                      <i className="bi bi-file-earmark-excel"></i>
                      Generate Excel
                    </button>
                    <button className="btn-generate modify" onClick={() => handleModifyReport('demographics')}>
                      <i className="bi bi-graph-up"></i>
                      Modify
                    </button>
                  </div>
                </div>
              </div>

              {/* Second Row */}
              {/* Appointment Analysis Report */}
              <div className="report-card">
                <div className="report-header">
                  <div className="report-icon appointments">
                    <i className="bi bi-calendar-check"></i>
                  </div>
                  <div className="report-info">
                    <h3>Appointment Analysis</h3>
                    <p>Detailed analysis of appointment patterns and scheduling</p>
                  </div>
                </div>
                <div className="report-content">
                  <div className="report-preview">
                    <div className="appointment-stats">
                      <div className="appt-item">
                        <span className="appt-type">Total Scheduled:</span>
                        <span className="appt-count">{reportStats.pendingAppointments}</span>
                      </div>
                      <div className="appt-item">
                        <span className="appt-type">Today's Checkups:</span>
                        <span className="appt-count">{reportStats.todaysCheckups}</span>
                      </div>
                      <div className="appt-item">
                        <span className="appt-type">Completed:</span>
                        <span className="appt-count">{reportStats.completedCheckups}</span>
                      </div>
                      <div className="appt-item">
                        <span className="appt-type">Pending:</span>
                        <span className="appt-count">{reportStats.pendingAppointments}</span>
                      </div>
                    </div>
                  </div>
                  <div className="report-actions has-modify">
                    <button className="btn-generate" onClick={() => generateReport('appointment-analysis', 'pdf')}>
                      <i className="bi bi-file-earmark-pdf"></i>
                      Generate PDF
                    </button>
                    <button className="btn-generate excel" onClick={() => generateReport('appointment-analysis', 'excel')}>
                      <i className="bi bi-file-earmark-excel"></i>
                      Generate Excel
                    </button>
                    <button className="btn-generate modify" onClick={() => handleModifyReport('appointment-analysis')}>
                      <i className="bi bi-graph-up"></i>
                      Modify
                    </button>
                  </div>
                </div>
              </div>

              {/* Prescription Usage Report */}
              <div className="report-card">
                <div className="report-header">
                  <div className="report-icon prescriptions">
                    <i className="bi bi-capsule"></i>
                  </div>
                  <div className="report-info">
                    <h3>Prescription Usage Report</h3>
                    <p>Monthly analysis of prescription dispensing and medication trends</p>
                  </div>
                </div>
                <div className="report-content">
                  <div className="report-preview">
                    <div className="chart-mini" style={{height: '120px'}}>
                      <Pie 
                        data={chartData.medicineUsage} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            title: { display: false }
                          }
                        }} 
                      />
                    </div>
                    <div className="prescription-summary">
                      <span>Total Medicines: {chartData.medicineUsage.datasets[0].data.reduce((a, b) => a + b, 0)} prescribed</span>
                      <span>Most Used: {chartData.medicineUsage.labels[0]}</span>
                    </div>
                  </div>
                  <div className="report-actions has-modify">
                    <button className="btn-generate" onClick={() => generateReport('prescription-usage', 'pdf')}>
                      <i className="bi bi-file-earmark-pdf"></i>
                      Generate PDF
                    </button>
                    <button className="btn-generate excel" onClick={() => generateReport('prescription-usage', 'excel')}>
                      <i className="bi bi-file-earmark-excel"></i>
                      Generate Excel
                    </button>
                    <button className="btn-generate modify" onClick={() => handleModifyReport('prescription-usage')}>
                      <i className="bi bi-graph-up"></i>
                      Modify
                    </button>
                  </div>
                </div>
              </div>

              {/* Vaccination Usage Report */}
              <div className="report-card">
                <div className="report-header">
                  <div className="report-icon vaccinations">
                    <i className="bi bi-shield-check"></i>
                  </div>
                  <div className="report-info">
                    <h3>Vaccination Usage Report</h3>
                    <p>Distribution analysis of vaccination types and immunization tracking</p>
                  </div>
                </div>
                <div className="report-content">
                  <div className="report-preview">
                    <div className="chart-mini" style={{height: '120px'}}>
                      <Pie 
                        data={chartData.vaccineUsage} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            title: { display: false }
                          }
                        }}
                      />
                    </div>
                    <div className="vaccination-summary">
                      <span>Total Vaccines: {chartData.vaccineUsage.datasets[0].data.reduce((a, b) => a + b, 0)} administered</span>
                      <span>Most Common: {chartData.vaccineUsage.labels[0]}</span>
                    </div>
                  </div>
                  <div className="report-actions has-modify">
                    <button className="btn-generate" onClick={() => generateReport('vaccination-usage', 'pdf')}>
                      <i className="bi bi-file-earmark-pdf"></i>
                      Generate PDF
                    </button>
                    <button className="btn-generate excel" onClick={() => generateReport('vaccination-usage', 'excel')}>
                      <i className="bi bi-file-earmark-excel"></i>
                      Generate Excel
                    </button>
                    <button className="btn-generate modify" onClick={() => handleModifyReport('vaccination-usage')}>
                      <i className="bi bi-graph-up"></i>
                      Modify
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="reports-history-content">
            <div className="history-placeholder">
              <div className="placeholder-icon">
                <i className="bi bi-archive"></i>
              </div>
              <h4>Reports History</h4>
              <p>Previously generated reports will appear here.</p>
              <p className="text-muted">Generate your first report to see it in the history.</p>
            </div>
          </div>
        )}
      </div>

      {/* Report Center Modal */}
      {showReportCenterModal && (
        <div className="admin-modal-overlay" onClick={() => setShowReportCenterModal(false)}>
          <div className="admin-modal-content report-center-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h4>
                <i className="bi bi-gear me-2"></i>
                Report Center
              </h4>
              <button className="admin-modal-close-btn" onClick={() => setShowReportCenterModal(false)}>
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div className="admin-modal-body">
              {/* Date Range */}
              <div className="report-option-group">
                <div className="option-header">
                  <i className="bi bi-calendar-range"></i>
                  <span>Date Range</span>
                </div>
                <select className="form-select">
                  <option>Last 30 Days</option>
                  <option>Last 60 Days</option>
                  <option>Last 90 Days</option>
                  <option>Custom Range</option>
                </select>
              </div>

              {/* Export Format */}
              <div className="report-option-group">
                <div className="option-header">
                  <i className="bi bi-file-text"></i>
                  <span>Export Format</span>
                </div>
                <select className="form-select">
                  <option>PDF Document</option>
                  <option>Excel Spreadsheet</option>
                  <option>CSV File</option>
                </select>
              </div>

              {/* Report Quality */}
              <div className="report-option-group">
                <div className="option-header">
                  <i className="bi bi-star"></i>
                  <span>Report Quality</span>
                </div>
                <select className="form-select">
                  <option>Standard</option>
                  <option>High Quality</option>
                  <option>Premium</option>
                </select>
              </div>

              {/* Include Visual Analytics */}
              <div className="report-option-group">
                <div className="option-header">
                  <i className="bi bi-graph-up"></i>
                  <span>Include Visual Analytics</span>
                </div>
                <div className="checkbox-group">
                  <label className="checkbox-item">
                    <input type="checkbox" defaultChecked />
                    <span className="checkmark"></span>
                    Include charts and graphs
                  </label>
                </div>
              </div>

              {/* Report Sections */}
              <div className="report-sections">
                <h6>Select Report Sections:</h6>
                <div className="sections-grid">
                  <label className="section-item">
                    <input type="checkbox" defaultChecked />
                    <span className="checkmark"></span>
                    <i className="bi bi-people"></i>
                    <span>Patient Demographics</span>
                  </label>
                  <label className="section-item">
                    <input type="checkbox" defaultChecked />
                    <span className="checkmark"></span>
                    <i className="bi bi-graph-up"></i>
                    <span>Health Trends</span>
                  </label>
                  <label className="section-item">
                    <input type="checkbox" defaultChecked />
                    <span className="checkmark"></span>
                    <i className="bi bi-calendar-check"></i>
                    <span>Appointment Analytics</span>
                  </label>
                  <label className="section-item">
                    <input type="checkbox" />
                    <span className="checkmark"></span>
                    <i className="bi bi-tools"></i>
                    <span>Medication Reports</span>
                  </label>
                  <label className="section-item">
                    <input type="checkbox" />
                    <span className="checkmark"></span>
                    <i className="bi bi-currency-dollar"></i>
                    <span>Financial Summary</span>
                  </label>
                  <label className="section-item">
                    <input type="checkbox" />
                    <span className="checkmark"></span>
                    <i className="bi bi-speedometer2"></i>
                    <span>Performance Metrics</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-modal-btn admin-modal-btn-secondary" onClick={() => setShowReportCenterModal(false)}>
                Close
              </button>
              <button className="admin-modal-btn" style={{background: '#28a745', color: 'white'}}>
                <i className="bi bi-file-earmark-text me-2"></i>
                Generate Comprehensive Report
              </button>
              <button className="admin-modal-btn admin-modal-btn-primary">
                <i className="bi bi-download me-2"></i>
                Quick Export All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modify Report Modal */}
      {showModifyModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModifyModal(false)}>
          <div className="admin-modal-content modify-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h4>
                <i className="bi bi-graph-up me-2"></i>
                Modify Report: {getReportTitle(currentModifyReport)}
              </h4>
              <button className="admin-modal-close-btn" onClick={() => setShowModifyModal(false)}>
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="chart-selection">
                <h6>
                  <i className="bi bi-bar-chart me-2"></i>
                  Select Chart Type
                </h6>
                <p className="text-muted">Choose how you want to visualize your data:</p>
                
                <div className="chart-options">
                  {getChartSuggestions(currentModifyReport).map((suggestion) => (
                    <label key={suggestion.type} className="chart-option">
                      <input 
                        type="radio" 
                        name="chartType" 
                        value={suggestion.type}
                        checked={selectedChartType === suggestion.type}
                        onChange={(e) => setSelectedChartType(e.target.value)}
                      />
                      <div className="option-content">
                        <div className="option-header">
                          <i className={`bi bi-${suggestion.type === 'bar' ? 'bar-chart' : suggestion.type === 'line' ? 'graph-up' : 'pie-chart'}`}></i>
                          <span className="option-title">{suggestion.label}</span>
                        </div>
                        <p className="option-description">{suggestion.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-modal-btn admin-modal-btn-secondary" onClick={() => setShowModifyModal(false)}>
                Cancel
              </button>
              <button className="admin-modal-btn admin-modal-btn-primary" onClick={generateModifiedReport}>
                <i className="bi bi-graph-up me-2"></i>
                Generate Chart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Chart Modal */}
      {showGeneratedChart && generatedChartData && (
        <div className="admin-modal-overlay" onClick={() => setShowGeneratedChart(false)}>
          <div className="admin-modal-content chart-display-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h4>
                <i className="bi bi-graph-up me-2"></i>
                {generatedChartData.title}
              </h4>
              <button className="admin-modal-close-btn" onClick={() => setShowGeneratedChart(false)}>
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="chart-display">
                <div className="chart-container" style={{height: '400px', width: '100%'}}>
                  {generatedChartData.type === 'line' && (
                    <Line 
                      data={chartData.checkupTrends}
                      options={{
                        ...chartOptions.line,
                        plugins: {
                          ...chartOptions.line.plugins,
                          legend: {
                            display: true,
                            position: 'top'
                          },
                          title: {
                            display: true,
                            text: generatedChartData.title
                          }
                        }
                      }}
                    />
                  )}
                  {generatedChartData.type === 'pie' && (
                    <Pie 
                      data={generatedChartData.dataType === 'medicine' ? chartData.medicineUsage : chartData.vaccineUsage}
                      options={{
                        ...chartOptions.pie,
                        plugins: {
                          ...chartOptions.pie.plugins,
                          title: {
                            display: true,
                            text: generatedChartData.title
                          }
                        }
                      }}
                    />
                  )}
                  {generatedChartData.type === 'bar' && (
                    <Bar 
                      data={generatedChartData.data}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: true,
                            position: 'top'
                          },
                          title: {
                            display: true,
                            text: generatedChartData.title
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              stepSize: 1
                            }
                          }
                        }
                      }}
                    />
                  )}
                  {generatedChartData.type === 'line' && (
                    <Line 
                      data={generatedChartData.data}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: true,
                            position: 'top'
                          },
                          title: {
                            display: true,
                            text: generatedChartData.title
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              stepSize: 1
                            }
                          }
                        }
                      }}
                    />
                  )}
                </div>
                
                <div className="chart-actions mt-3">
                  <button className="btn btn-success me-2" onClick={() => {
                    // Download chart as image functionality could be added here
                    console.log('Download chart');
                  }}>
                    <i className="bi bi-download me-2"></i>
                    Download Chart
                  </button>
                  <button className="btn btn-primary" onClick={() => {
                    // Generate report with this chart functionality could be added here
                    console.log('Generate report with chart');
                  }}>
                    <i className="bi bi-file-earmark-pdf me-2"></i>
                    Generate Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsManager;
