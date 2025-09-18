import React, { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Tabs, Tab, Button, ButtonGroup, Badge } from 'react-bootstrap';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, ArcElement } from 'chart.js';
import { Line, Pie, Bar, Doughnut } from 'react-chartjs-2';
import inventoryService from '../../../services/inventoryService';
import LoadingManagementBar from '../LoadingManagementBar';
import '../styles/ReportsManager.css';

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

const ReportsManager = ({ isDarkMode }) => {
  const [activeTab, setActiveTab] = useState('prescription-usage');
  const [loading, setLoading] = useState(true);
  const [inventoryData, setInventoryData] = useState({
    medications: [],
    vaccines: []
  });
  const [timeFilter, setTimeFilter] = useState('monthly');
  const [prescriptionData, setPrescriptionData] = useState([]);

  // Load inventory data for reports
  useEffect(() => {
    const loadInventoryData = async () => {
      setLoading(true);
      try {
        const [medications, vaccines] = await Promise.all([
          inventoryService.getAllMedications().catch(() => []),
          inventoryService.getAllVaccines().catch(() => [])
        ]);

        setInventoryData({
          medications: Array.isArray(medications) ? medications : [],
          vaccines: Array.isArray(vaccines) ? vaccines : []
        });

        // Generate prescription usage data
        const mockPrescriptions = [
          { name: 'Paracetamol', quantity: 150, frequency: 45 },
          { name: 'Amoxicillin', quantity: 120, frequency: 38 },
          { name: 'Ibuprofen', quantity: 95, frequency: 32 },
          { name: 'Cetirizine', quantity: 80, frequency: 28 },
          { name: 'Omeprazole', quantity: 70, frequency: 24 },
          { name: 'Metformin', quantity: 65, frequency: 22 },
          { name: 'Losartan', quantity: 60, frequency: 20 },
          { name: 'Amlodipine', quantity: 55, frequency: 18 }
        ];
        setPrescriptionData(mockPrescriptions);
        
      } catch (error) {
        console.error('Error loading inventory data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInventoryData();
  }, []);

  // Generate prescription usage chart data
  const prescriptionUsageChart = useMemo(() => {
    if (!prescriptionData.length) return null;

    const filteredData = timeFilter === 'weekly' 
      ? prescriptionData.slice(0, 5)
      : timeFilter === 'monthly' 
      ? prescriptionData.slice(0, 8)
      : prescriptionData.slice(0, 6);

    return {
      labels: filteredData.map(item => item.name),
      datasets: [{
        label: 'Prescription Quantity',
        data: filteredData.map(item => item.quantity),
        backgroundColor: [
          '#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6', 
          '#1abc9c', '#34495e', '#f1c40f'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  }, [prescriptionData, timeFilter]);

  // Generate prescription trends chart
  const prescriptionTrendsChart = useMemo(() => {
    let labels = [];
    let data = [];
    
    switch (timeFilter) {
      case 'weekly':
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        data = [45, 52, 38, 49, 58, 28, 15];
        break;
      case 'monthly':
        labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        data = [180, 220, 195, 240];
        break;
      case 'yearly':
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        data = [850, 920, 780, 890, 950, 820, 880, 910, 870, 940, 980, 1020];
        break;
      default:
        labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        data = [180, 220, 195, 240];
    }

    return {
      labels,
      datasets: [{
        label: 'Prescriptions Dispensed',
        data,
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4
      }]
    };
  }, [timeFilter]);

  // Generate inventory status chart
  const inventoryStatusChart = useMemo(() => {
    const totalMeds = inventoryData.medications.length;
    const totalVaccines = inventoryData.vaccines.length;
    
    if (totalMeds === 0 && totalVaccines === 0) {
      return {
        labels: ['No Data'],
        datasets: [{
          data: [1],
          backgroundColor: ['#e0e0e0']
        }]
      };
    }

    return {
      labels: ['Medications', 'Vaccines'],
      datasets: [{
        data: [totalMeds, totalVaccines],
        backgroundColor: ['#2ecc71', '#3498db'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  }, [inventoryData]);

  if (loading) {
    return <LoadingManagementBar message="Loading reports data..." />;
  }

  return (
    <div className="reports-manager">
      <div className="reports-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2><i className="bi bi-file-earmark-bar-graph me-2"></i>Reports & Analytics</h2>
            <p className="text-muted">Comprehensive healthcare management reports</p>
          </div>
          <div className="time-filter-controls">
            <ButtonGroup size="sm">
              <Button 
                variant={timeFilter === 'weekly' ? 'primary' : 'outline-primary'}
                onClick={() => setTimeFilter('weekly')}
              >
                Weekly
              </Button>
              <Button 
                variant={timeFilter === 'monthly' ? 'primary' : 'outline-primary'}
                onClick={() => setTimeFilter('monthly')}
              >
                Monthly
              </Button>
              <Button 
                variant={timeFilter === 'yearly' ? 'primary' : 'outline-primary'}
                onClick={() => setTimeFilter('yearly')}
              >
                Yearly
              </Button>
            </ButtonGroup>
          </div>
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="reports-tabs mb-4"
      >
        <Tab eventKey="prescription-usage" title={
          <span>
            <i className="bi bi-capsule me-2"></i>
            Prescription Usage
          </span>
        }>
          <Row className="mb-4">
            <Col lg={8}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">
                    <i className="bi bi-graph-up me-2 text-primary"></i>
                    Prescription Trends ({timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)})
                  </h5>
                </Card.Header>
                <Card.Body style={{ height: '350px' }}>
                  {prescriptionTrendsChart && (
                    <Line
                      data={prescriptionTrendsChart}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            mode: 'index',
                            intersect: false
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Number of Prescriptions'
                            }
                          },
                          x: {
                            title: {
                              display: true,
                              text: timeFilter === 'weekly' ? 'Days' : timeFilter === 'monthly' ? 'Weeks' : 'Months'
                            }
                          }
                        }
                      }}
                    />
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">
                    <i className="bi bi-pie-chart me-2 text-success"></i>
                    Top Prescribed Medications
                  </h5>
                </Card.Header>
                <Card.Body style={{ height: '350px' }}>
                  {prescriptionUsageChart && (
                    <Doughnut
                      data={prescriptionUsageChart}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { 
                            position: 'bottom',
                            labels: {
                              usePointStyle: true,
                              padding: 15,
                              font: { size: 11 }
                            }
                          }
                        },
                        cutout: '60%'
                      }}
                    />
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Prescription Summary Cards */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="text-center">
                  <div className="text-primary mb-2">
                    <i className="bi bi-capsule display-6"></i>
                  </div>
                  <h4 className="text-primary">{prescriptionData.reduce((sum, item) => sum + item.quantity, 0)}</h4>
                  <p className="text-muted mb-0">Total Prescriptions</p>
                  <small className="text-success">+12% from last period</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="text-center">
                  <div className="text-success mb-2">
                    <i className="bi bi-graph-up-arrow display-6"></i>
                  </div>
                  <h4 className="text-success">{Math.round(prescriptionData.reduce((sum, item) => sum + item.frequency, 0) / prescriptionData.length)}</h4>
                  <p className="text-muted mb-0">Avg. Daily Usage</p>
                  <small className="text-success">+8% increase</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="text-center">
                  <div className="text-info mb-2">
                    <i className="bi bi-award display-6"></i>
                  </div>
                  <h4 className="text-info">{prescriptionData[0]?.name || 'N/A'}</h4>
                  <p className="text-muted mb-0">Most Prescribed</p>
                  <small className="text-info">{prescriptionData[0]?.frequency || 0} times/day</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="text-center">
                  <div className="text-warning mb-2">
                    <i className="bi bi-exclamation-triangle display-6"></i>
                  </div>
                  <h4 className="text-warning">5</h4>
                  <p className="text-muted mb-0">Low Stock Items</p>
                  <small className="text-warning">Need restocking</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="inventory-status" title={
          <span>
            <i className="bi bi-boxes me-2"></i>
            Inventory Status
          </span>
        }>
          <Row className="mb-4">
            <Col lg={6}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">
                    <i className="bi bi-pie-chart me-2 text-info"></i>
                    Inventory Distribution
                  </h5>
                </Card.Header>
                <Card.Body style={{ height: '300px' }}>
                  <Pie
                    data={inventoryStatusChart}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { 
                          position: 'bottom',
                          labels: {
                            usePointStyle: true,
                            padding: 20
                          }
                        }
                      }
                    }}
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col lg={6}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">
                    <i className="bi bi-list-check me-2 text-success"></i>
                    Inventory Summary
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex flex-column gap-4">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted">
                        <i className="bi bi-capsule me-2"></i>
                        Total Medications
                      </span>
                      <Badge bg="success" className="fs-6">{inventoryData.medications.length}</Badge>
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted">
                        <i className="bi bi-shield-plus me-2"></i>
                        Total Vaccines
                      </span>
                      <Badge bg="info" className="fs-6">{inventoryData.vaccines.length}</Badge>
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        Low Stock Alerts
                      </span>
                      <Badge bg="warning" className="fs-6">5</Badge>
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted">
                        <i className="bi bi-calendar-x me-2"></i>
                        Expiring Soon
                      </span>
                      <Badge bg="danger" className="fs-6">3</Badge>
                    </div>
                    
                    <hr />
                    
                    <div className="text-center">
                      <h6 className="text-muted mb-3">System Status</h6>
                      <Badge bg="success" className="px-3 py-2">
                        <i className="bi bi-check-circle me-1"></i>
                        All Systems Operational
                      </Badge>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>
    </div>
  );
}; 
      category: 'Doctor Performance',
      description: 'Scheduling optimization data',
      recommendedCharts: ['line', 'bar', 'area']
    },
    { 
      id: 'doctor-volume', 
      name: 'Doctor Patient Volume Trends', 
      category: 'Doctor Performance',
      description: 'Patients seen over time',
      recommendedCharts: ['line', 'area', 'bar']
    },
    
    // Inventory & Medication Management
    { 
      id: 'prescription-usage', 
      name: 'Prescription Usage Trends', 
      category: 'Inventory Management',
      description: 'Most prescribed medications',
      recommendedCharts: ['bar', 'pie', 'line']
    },
    { 
      id: 'vaccine-distribution', 
      name: 'Vaccine Distribution Analytics', 
      category: 'Inventory Management',
      description: 'Vaccination rates and trends',
      recommendedCharts: ['line', 'bar', 'pie']
    },
    { 
      id: 'expiry-management', 
      name: 'Expiry Date Management', 
      category: 'Inventory Management',
      description: 'Waste reduction metrics',
      recommendedCharts: ['bar', 'line', 'pie']
    },
    
    // Clinical Outcomes
    { 
      id: 'referral-patterns', 
      name: 'Referral Patterns', 
      category: 'Clinical Outcomes',
      description: 'Internal vs external referrals',
      recommendedCharts: ['pie', 'doughnut', 'bar']
    },
    { 
      id: 'health-conditions', 
      name: 'Health Condition Prevalence', 
      category: 'Clinical Outcomes',
      description: 'Most common conditions',
      recommendedCharts: ['bar', 'pie', 'horizontal-bar']
    }
  ];

  const chartTypes = [
    { id: 'bar', name: 'Bar Chart', icon: 'bi-bar-chart' },
    { id: 'line', name: 'Line Chart', icon: 'bi-graph-up' },
    { id: 'pie', name: 'Pie Chart', icon: 'bi-pie-chart' },
    { id: 'doughnut', name: 'Doughnut Chart', icon: 'bi-circle' },
    { id: 'horizontal-bar', name: 'Horizontal Bar', icon: 'bi-bar-chart-line' },
    { id: 'area', name: 'Area Chart', icon: 'bi-graph-up-arrow' },
    { id: 'radar', name: 'Radar Chart', icon: 'bi-pentagon' },
    { id: 'scatter', name: 'Scatter Plot', icon: 'bi-dots' }
  ];

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Debug function to manually refresh data
  const debugRefreshData = () => {
    console.log('🔄 Manual data refresh triggered');
    fetchAnalyticsData();
  };

  // Generate sample chart data based on report type
  const generateChartData = (reportType, chartType) => {
    const baseColors = ['#28a745', '#17a2b8', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14'];
    
    console.log(`📈 Generating chart data for ${reportType.id} (${chartType})`);
    console.log('Current loading state:', isLoadingData);
    console.log('Available data:', {
      dashboardStats: !!dashboardStats && Object.keys(dashboardStats),
      patientAnalytics: !!patientAnalytics && Object.keys(patientAnalytics),
      dashboardStatsPatients: dashboardStats?.patients,
      dashboardStatsAgeDistribution: dashboardStats?.ageDistribution
    });
    
    // If data is still loading, return placeholder
    if (isLoadingData) {
      console.log('⏳ Still loading data, returning placeholder...');
      return {
        labels: ['Loading...'],
        datasets: [{
          data: [1],
          backgroundColor: ['#e0e0e0'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      };
    }
    
    switch (reportType.id) {
      case 'patient-demographics':
        console.log('🎯 Patient Demographics case triggered');
        console.log('Chart type:', chartType);
        console.log('Dashboard stats:', dashboardStats);
        console.log('Dashboard stats patients:', dashboardStats?.patients);
        console.log('Dashboard stats age distribution:', dashboardStats?.ageDistribution);
        
        if (chartType === 'pie' || chartType === 'doughnut') {
          // Use real gender distribution from dashboard stats
          if (dashboardStats?.patients && (dashboardStats.patients.male || dashboardStats.patients.female)) {
            const genderData = {
              Male: dashboardStats.patients.male || 0,
              Female: dashboardStats.patients.female || 0
            };
            console.log('✅ Using real gender data:', genderData);
            return {
              labels: Object.keys(genderData),
              datasets: [{
                data: Object.values(genderData),
                backgroundColor: baseColors.slice(0, 2),
                borderWidth: 2,
                borderColor: '#fff'
              }]
            };
          } else {
            console.log('⚠️ Using fallback gender data - dashboardStats.patients:', dashboardStats?.patients);
            return {
              labels: ['Male', 'Female'],
              datasets: [{
                data: [45, 52],
                backgroundColor: baseColors.slice(0, 2),
                borderWidth: 2,
                borderColor: '#fff'
              }]
            };
          }
        } else {
          // Use real age distribution from dashboard stats
          if (dashboardStats?.ageDistribution && dashboardStats.ageDistribution.length > 0) {
            const ageData = dashboardStats.ageDistribution;
            console.log('✅ Using real age data:', ageData);
            return {
              labels: ageData.map(item => item.ageGroup),
              datasets: [{
                label: 'Patients by Age Group',
                data: ageData.map(item => item.count),
                backgroundColor: baseColors[0],
                borderColor: baseColors[0],
                borderWidth: 2
              }]
            };
          } else {
            console.log('⚠️ Using fallback age data - dashboardStats.ageDistribution:', dashboardStats?.ageDistribution);
            return {
              labels: ['0-18', '19-35', '36-50', '51-65', '65+'],
              datasets: [{
                label: 'Patients by Age Group',
                data: [12, 35, 28, 18, 15],
                backgroundColor: baseColors[0],
                borderColor: baseColors[0],
                borderWidth: 2
              }]
            };
          }
        }

      case 'patient-registration':
        // Use real checkup trends from dashboard stats (as requested to change registration analytics)
        if (dashboardStats?.checkupTrends && dashboardStats.checkupTrends.length > 0) {
          const checkupData = dashboardStats.checkupTrends;
          return {
            labels: checkupData.map(item => item.dayName),
            datasets: [{
              label: 'Daily Checkup Trends',
              data: checkupData.map(item => item.completedCheckups),
              backgroundColor: chartType === 'line' ? 'transparent' : baseColors[1],
              borderColor: baseColors[1],
              borderWidth: 3,
              fill: chartType === 'area',
              tension: 0.4
            }]
          };
        } else {
          return {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
              label: 'Daily Checkup Trends',
              data: [25, 32, 28, 41, 35, 45, 30],
              backgroundColor: chartType === 'line' ? 'transparent' : baseColors[1],
              borderColor: baseColors[1],
              borderWidth: 3,
              fill: chartType === 'area',
              tension: 0.4
            }]
          };
        }

      case 'patient-frequency':
        // Use real age distribution from dashboard stats (as requested to change frequency patient)
        if (dashboardStats?.ageDistribution && dashboardStats.ageDistribution.length > 0) {
          const ageData = dashboardStats.ageDistribution;
          return {
            labels: ageData.map(item => item.ageGroup),
            datasets: [{
              label: 'Age Distribution',
              data: ageData.map(item => item.count),
              backgroundColor: baseColors.slice(0, ageData.length),
              borderColor: '#fff',
              borderWidth: 2
            }]
          };
        } else {
          return {
            labels: ['0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61+'],
            datasets: [{
              label: 'Age Distribution',
              data: [8, 12, 15, 20, 18, 14, 10],
              backgroundColor: baseColors.slice(0, 7),
              borderColor: '#fff',
              borderWidth: 2
            }]
          };
        }

      case 'doctor-workload':
        return {
          labels: ['Dr. Smith', 'Dr. Johnson', 'Dr. Williams', 'Dr. Brown'],
          datasets: [{
            label: 'Daily Checkups',
            data: [8, 12, 6, 10],
            backgroundColor: baseColors[2],
            borderColor: baseColors[2],
            borderWidth: 2
          }]
        };

      case 'prescription-usage':
        return {
          labels: ['Amoxicillin', 'Ibuprofen', 'Paracetamol', 'Aspirin', 'Metformin'],
          datasets: [{
            label: 'Prescriptions Count',
            data: [85, 72, 95, 48, 63],
            backgroundColor: baseColors.slice(0, 5),
            borderColor: '#fff',
            borderWidth: 2
          }]
        };

      case 'vaccine-distribution':
        return {
          labels: ['COVID-19', 'Flu', 'Hepatitis B', 'MMR', 'Tetanus'],
          datasets: [{
            label: 'Vaccines Administered',
            data: [120, 85, 45, 32, 28],
            backgroundColor: baseColors[3],
            borderColor: baseColors[3],
            borderWidth: 2
          }]
        };

      default:
        return {
          labels: ['Category A', 'Category B', 'Category C', 'Category D'],
          datasets: [{
            label: 'Sample Data',
            data: [30, 45, 35, 25],
            backgroundColor: baseColors[0],
            borderColor: baseColors[0],
            borderWidth: 2
          }]
        };
    }
  };

  // Render chart component based on type
  const renderChart = (chartType, data, isZoomed = false) => {
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: isZoomed ? 'top' : 'bottom',
          labels: {
            padding: isZoomed ? 20 : 10,
            font: { size: isZoomed ? 14 : 10 }
          }
        },
        title: {
          display: isZoomed,
          text: isZoomed && zoomedReport ? reportTypes.find(r => r.id === zoomedReport.type.id)?.name : '',
          font: { size: 18, weight: 'bold' },
          padding: 20
        }
      },
      scales: chartType !== 'pie' && chartType !== 'doughnut' ? {
        y: {
          beginAtZero: true,
          grid: { display: isZoomed },
          ticks: { font: { size: isZoomed ? 12 : 10 } }
        },
        x: {
          grid: { display: isZoomed },
          ticks: { font: { size: isZoomed ? 12 : 10 } }
        }
      } : {}
    };

    switch (chartType) {
      case 'bar':
      case 'horizontal-bar':
        return <Bar data={data} options={options} />;
      case 'line':
      case 'area':
        return <Line data={data} options={options} />;
      case 'pie':
        return <Pie data={data} options={options} />;
      case 'doughnut':
        return <Pie data={data} options={options} />;
      default:
        return <Bar data={data} options={options} />;
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setIsLoadingData(true);
      
      console.log('🔄 Management Dashboard: Starting to fetch analytics data...');
      
      // Fetch analytics data including real dashboard stats
      const [medicationsData, vaccinesData, prescriptionData, patientData, dashboardData] = await Promise.all([
        inventoryService.getAllMedications(),
        inventoryService.getAllVaccines(),
        dashboardService.getPrescriptionAnalytics(),
        dashboardService.getPatientAnalytics(),
        dashboardService.getStats()
      ]);
      
      console.log('📊 Management Dashboard: Data fetched successfully!');
      console.log('  Medications:', Array.isArray(medicationsData) ? medicationsData.length : 'Not array');
      console.log('  Vaccines:', Array.isArray(vaccinesData) ? vaccinesData.length : 'Not array');
      console.log('  Prescription Analytics:', prescriptionData);
      console.log('  Patient Analytics:', patientData);
      console.log('  Dashboard Stats:', dashboardData);
      
      setInventoryData({
        medications: Array.isArray(medicationsData) ? medicationsData : [],
        vaccines: Array.isArray(vaccinesData) ? vaccinesData : []
      });
      
      setPrescriptionAnalytics(prescriptionData);
      setPatientAnalytics(patientData);
      setDashboardStats(dashboardData);
      
      console.log('✅ Management Dashboard: All state updated with real data');
      
      // Calculate report statistics
      calculateReportStats(medicationsData, vaccinesData, prescriptionData, patientData, dashboardData);
      
    } catch (error) {
      console.error('❌ Management Dashboard: Error fetching analytics data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const calculateReportStats = (medications, vaccines, prescriptions, patients, dashboardData) => {
    const totalMedications = Array.isArray(medications) ? medications.length : 0;
    const totalVaccines = Array.isArray(vaccines) ? vaccines.length : 0;
    const totalInventoryItems = totalMedications + totalVaccines;
    
    // Calculate inventory value
    const medicationValue = Array.isArray(medications) 
      ? medications.reduce((sum, med) => sum + (parseFloat(med.price || 0) * parseInt(med.quantity || 0)), 0)
      : 0;
    const vaccineValue = Array.isArray(vaccines)
      ? vaccines.reduce((sum, vac) => sum + (parseFloat(vac.price || 0) * parseInt(vac.quantity || 0)), 0)  
      : 0;
    const totalInventoryValue = medicationValue + vaccineValue;

    // Calculate low stock items
    const lowStockMedications = Array.isArray(medications) 
      ? medications.filter(med => parseInt(med.quantity || 0) < 10).length 
      : 0;
    const lowStockVaccines = Array.isArray(vaccines)
      ? vaccines.filter(vac => parseInt(vac.quantity || 0) < 10).length
      : 0;
    const lowStockItems = lowStockMedications + lowStockVaccines;

    // Calculate expiring items
    const today = new Date();
    const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const expiringMedications = Array.isArray(medications)
      ? medications.filter(med => {
          if (!med.expiryDate) return false;
          const expiryDate = new Date(med.expiryDate);
          return expiryDate <= next30Days && expiryDate >= today;
        }).length
      : 0;
      
    const expiringVaccines = Array.isArray(vaccines)
      ? vaccines.filter(vac => {
          if (!vac.expiryDate) return false;
          const expiryDate = new Date(vac.expiryDate);
          return expiryDate <= next30Days && expiryDate >= today;
        }).length
      : 0;
      
    const expiringSoon = expiringMedications + expiringVaccines;

    setReportStats({
      totalMedications,
      totalVaccines,
      totalInventoryItems,
      totalInventoryValue,
      medicationValue,
      lowStockItems,
      lowMedications: lowStockMedications,
      lowVaccines: lowStockVaccines,
      expiringSoon,
      expiringMedications,
      expiringVaccines,
      next30Days: expiringSoon,
      totalPrescriptions: prescriptions?.totalPrescriptions || 0,
      medicationsDispensed: prescriptions?.medicationsDispensed || 0,
      topMedication: prescriptions?.topMedication || 'N/A',
      dailyAverage: prescriptions?.dailyAverage || 0,
      monthlyVolume: prescriptions?.monthlyVolume || 0,
      averageItemValue: totalInventoryItems > 0 ? Math.round(totalInventoryValue / totalInventoryItems) : 0,
      monthlyChange: prescriptions?.monthlyChange || 0,
      peakDay: prescriptions?.peakDay || 'N/A',
      efficiencyRate: prescriptions?.efficiencyRate || 0
    });
  };

  // Report creation flow functions
  const handleSlotClick = (slotIndex) => {
    const globalSlotIndex = (currentPage - 1) * 9 + slotIndex;
    const existingReport = createdReports[globalSlotIndex];
    
    if (existingReport) {
      // If report exists, show zoom modal
      setZoomedReport(existingReport);
      setShowZoomModal(true);
    } else {
      // If empty slot, start creation flow
      setSelectedSlot(globalSlotIndex);
      setCurrentStep('confirm');
      setShowCreateModal(true);
    }
  };

  const handleZoomClose = () => {
    setShowZoomModal(false);
    setZoomedReport(null);
  };

  const handleRemoveReport = (reportToRemove) => {
    setReportToRemove(reportToRemove);
    setShowRemoveModal(true);
  };

  const confirmRemoveReport = () => {
    if (reportToRemove) {
      // Find the slot index for the report to remove
      const slotIndex = Object.keys(createdReports).find(
        key => createdReports[key].id === reportToRemove.id
      );
      
      if (slotIndex !== undefined) {
        // Remove the report from the createdReports state
        setCreatedReports(prev => {
          const updated = { ...prev };
          delete updated[slotIndex];
          return updated;
        });
        
        // Close both modals
        setShowZoomModal(false);
        setZoomedReport(null);
        setShowRemoveModal(false);
        setReportToRemove(null);
        
        console.log('Report removed successfully');
      }
    }
  };

  const cancelRemoveReport = () => {
    setShowRemoveModal(false);
    setReportToRemove(null);
  };

  const handleCreateConfirm = () => {
    setCurrentStep('select-report');
  };

  const handleReportTypeSelect = (reportType) => {
    setSelectedReportType(reportType);
    setCurrentStep('select-chart');
  };

  const handleChartTypeSelect = (chartType) => {
    setSelectedChartType(chartType);
    setCurrentStep('final-confirm');
  };

  const handleFinalConfirm = () => {
    // Create the report
    const newReport = {
      id: `report_${Date.now()}`,
      type: selectedReportType,
      chartType: selectedChartType,
      createdAt: new Date(),
      slot: selectedSlot
    };

    setCreatedReports(prev => ({
      ...prev,
      [selectedSlot]: newReport
    }));

    // Close modal and reset
    setShowCreateModal(false);
    setCurrentStep('confirm');
    setSelectedReportType(null);
    setSelectedSlot(null);
    setSelectedChartType('bar');
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setCurrentStep('confirm');
    setSelectedReportType(null);
    setSelectedSlot(null);
    setSelectedChartType('bar');
  };

  const getTotalPages = () => {
    return Math.ceil(Object.keys(createdReports).length / 9) + 1;
  };

  const hasAllSlotsOnCurrentPage = () => {
    const startIndex = (currentPage - 1) * 9;
    for (let i = 0; i < 9; i++) {
      if (!createdReports[startIndex + i]) {
        return false;
      }
    }
    return true;
  };

  const generateReport = async (reportType, format) => {
    try {
      console.log(`Generating ${reportType} report in ${format} format`);
      
      let content = '';
      const timestamp = new Date().toLocaleString();
      
      switch (reportType) {
        case 'inventory-overview':
          content = `Inventory Overview Report - ${timestamp}\\n\\n`;
          content += `Total Medications: ${reportStats.totalMedications || 0}\\n`;
          content += `Total Vaccines: ${reportStats.totalVaccines || 0}\\n`;
          content += `Total Items: ${reportStats.totalInventoryItems || 0}\\n`;
          content += `Estimated Value: $${(reportStats.totalInventoryValue || 0).toLocaleString()}\\n`;
          break;
          
        case 'stock-levels':
          content = `Stock Levels Analysis - ${timestamp}\\n\\n`;
          content += `Low Stock Items: ${reportStats.lowStockItems || 0}\\n`;
          content += `Low Medications: ${reportStats.lowMedications || 0}\\n`;
          content += `Low Vaccines: ${reportStats.lowVaccines || 0}\\n`;
          break;
          
        case 'expiry-analysis':
          content = `Expiry Analysis Report - ${timestamp}\\n\\n`;
          content += `Items Expiring Soon: ${reportStats.expiringSoon || 0}\\n`;
          content += `Expiring Medications: ${reportStats.expiringMedications || 0}\\n`;
          content += `Expiring Vaccines: ${reportStats.expiringVaccines || 0}\\n`;
          break;
          
        default:
          content = `${reportType} Report - ${timestamp}\\n\\nReport data will be generated here.`;
      }
      
      if (format === 'pdf') {
        // Create PDF blob
        const blob = new Blob([content], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'excel') {
        // Create Excel-like CSV
        const blob = new Blob([content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
      
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const handleModifyReport = (reportType) => {
    setCurrentModifyReport(reportType);
    setShowModifyModal(true);
  };

  const exportAllReports = async () => {
    try {
      console.log('Exporting all reports...');
      const reportTypes = ['inventory-overview', 'stock-levels', 'expiry-analysis'];
      
      for (const reportType of reportTypes) {
        await generateReport(reportType, 'pdf');
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
    } catch (error) {
      console.error('Error exporting all reports:', error);
    }
  };

  if (isLoadingData) {
    return <LoadingManagementBar message="Loading reports data..." duration="normal" />;
  }

  return (
    <div className="management-reports-manager">
      <div className="reports-container">
        {/* Debug Controls */}
        <div className="debug-controls mb-2">
          <button 
            className="btn btn-outline-info btn-sm"
            onClick={debugRefreshData}
            title="Debug: Refresh Data"
          >
            🔄 Refresh Data (Debug)
          </button>
          <span className="ms-2 text-muted small">
            Data Status: {isLoadingData ? 'Loading...' : 'Loaded'} | 
            Dashboard Stats: {dashboardStats?.patients ? 'Available' : 'Missing'} |
            Patients: {dashboardStats?.patients ? `${dashboardStats.patients.male}M/${dashboardStats.patients.female}F` : 'N/A'}
          </span>
        </div>
        
        {/* Tabs and Controls */}
        <div className="tabs-controls-wrapper">
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="reports-tabs"
          >
            <Tab eventKey="generate" title={
              <span>
                <i className="bi bi-plus-circle me-2"></i>
                Create Reports
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

          {/* Pagination and Create Button */}
          {activeTab === 'generate' && (
            <div className="page-controls">
              {getTotalPages() > 1 && (
                <div className="pagination-controls">
                  <button 
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  <span className="page-info">
                    Page {currentPage} of {getTotalPages()}
                  </span>
                  <button 
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setCurrentPage(prev => Math.min(getTotalPages(), prev + 1))}
                    disabled={currentPage === getTotalPages()}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              )}
              
              {hasAllSlotsOnCurrentPage() && (
                <button 
                  className="btn btn-success btn-sm"
                  onClick={() => {
                    setSelectedSlot(currentPage * 9);
                    setCurrentStep('confirm');
                    setShowCreateModal(true);
                  }}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Create Report
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="tab-content-wrapper">
          {activeTab === 'generate' && (
            <div className="generate-reports-content">
              {/* 3x3 Reports Grid */}
              <div className="reports-grid-3x3">
                {Array.from({ length: 9 }, (_, index) => {
                  const globalSlotIndex = (currentPage - 1) * 9 + index;
                  const existingReport = createdReports[globalSlotIndex];
                  
                  return (
                    <div 
                      key={index} 
                      className={`report-slot ${existingReport ? 'has-report' : ''}`}
                      onClick={() => handleSlotClick(index)}
                    >
                      <div className="report-slot-content">
                        {existingReport ? (
                          <div className="existing-report">
                            <div className="report-header-mini">
                              <h5>{reportTypes.find(r => r.id === existingReport.type.id)?.name}</h5>
                              <div className="header-icons">
                                <span className="chart-type-badge">
                                  <i className={chartTypes.find(c => c.id === existingReport.chartType)?.icon || 'bi-bar-chart'}></i>
                                </span>
                                <span className="zoom-indicator">
                                  <i className="bi bi-zoom-in"></i>
                                </span>
                              </div>
                            </div>
                            <div className="chart-container-mini">
                              {renderChart(
                                existingReport.chartType, 
                                generateChartData(existingReport.type, existingReport.chartType),
                                false
                              )}
                            </div>
                            <div className="report-footer-mini">
                              <small className="report-category">{existingReport.type.category}</small>
                              <small className="created-date">
                                {existingReport.createdAt.toLocaleDateString()}
                              </small>
                            </div>
                          </div>
                        ) : (
                          <div className="slot-placeholder">
                            <i className="bi bi-plus-circle-dotted"></i>
                            <h4>Create Report</h4>
                            <p>Click to add a new report to this slot</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="reports-history-content">
              <div className="history-placeholder">
                <i className="bi bi-file-earmark-text placeholder-icon"></i>
                <h4>No Reports Generated Yet</h4>
                <p>Your generated reports will appear here for easy access and download.</p>
                <p>Start by creating a report using the grid above!</p>
              </div>
            </div>
          )}
        </div>

        {/* Report Creation Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={handleModalClose}>
            <div className="create-report-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>
                  {currentStep === 'confirm' && 'Create New Report'}
                  {currentStep === 'select-report' && 'Select Report Type'}
                  {currentStep === 'select-chart' && 'Choose Chart Type'}
                  {currentStep === 'final-confirm' && 'Confirm Report Creation'}
                </h3>
                <button className="close-btn" onClick={handleModalClose}>
                  <i className="bi bi-x"></i>
                </button>
              </div>

              <div className="modal-body">
                {currentStep === 'confirm' && (
                  <div className="confirm-step">
                    <div className="step-icon">
                      <i className="bi bi-question-circle"></i>
                    </div>
                    <p>Are you sure you want to create a new report in this slot?</p>
                    <div className="step-actions">
                      <button className="btn btn-secondary" onClick={handleModalClose}>
                        Cancel
                      </button>
                      <button className="btn btn-success" onClick={handleCreateConfirm}>
                        Yes, Continue
                      </button>
                    </div>
                  </div>
                )}

                {currentStep === 'select-report' && (
                  <div className="select-report-step">
                    <p className="step-description">Choose the type of report you want to create:</p>
                    <div className="report-categories">
                      {Object.entries(
                        reportTypes.reduce((acc, report) => {
                          if (!acc[report.category]) acc[report.category] = [];
                          acc[report.category].push(report);
                          return acc;
                        }, {})
                      ).map(([category, reports]) => (
                        <div key={category} className="category-group">
                          <h5 className="category-title">{category}</h5>
                          <div className="reports-list">
                            {reports.map(report => (
                              <div 
                                key={report.id}
                                className="report-option"
                                onClick={() => handleReportTypeSelect(report)}
                              >
                                <h6>{report.name}</h6>
                                <p>{report.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 'select-chart' && selectedReportType && (
                  <div className="select-chart-step">
                    <div className="selected-report-info">
                      <h5>Selected Report: {selectedReportType.name}</h5>
                      <p>{selectedReportType.description}</p>
                    </div>
                    <p className="step-description">Choose the best chart type for this data:</p>
                    <div className="chart-options">
                      <div className="recommended-charts">
                        <h6>Recommended Charts:</h6>
                        <div className="charts-grid">
                          {selectedReportType.recommendedCharts.map(chartId => {
                            const chart = chartTypes.find(c => c.id === chartId);
                            return (
                              <div 
                                key={chartId}
                                className="chart-option recommended"
                                onClick={() => handleChartTypeSelect(chartId)}
                              >
                                <i className={chart.icon}></i>
                                <span>{chart.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 'final-confirm' && selectedReportType && (
                  <div className="final-confirm-step">
                    <div className="step-icon">
                      <i className="bi bi-check-circle"></i>
                    </div>
                    <h5>Confirm Report Creation</h5>
                    <div className="report-summary">
                      <div className="summary-item">
                        <strong>Report Type:</strong> {selectedReportType.name}
                      </div>
                      <div className="summary-item">
                        <strong>Category:</strong> {selectedReportType.category}
                      </div>
                      <div className="summary-item">
                        <strong>Chart Type:</strong> {chartTypes.find(c => c.id === selectedChartType)?.name}
                      </div>
                      <div className="summary-item">
                        <strong>Description:</strong> {selectedReportType.description}
                      </div>
                    </div>
                    <div className="step-actions">
                      <button className="btn btn-secondary" onClick={handleModalClose}>
                        Cancel
                      </button>
                      <button className="btn btn-success" onClick={handleFinalConfirm}>
                        Create Report
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Chart Zoom Modal */}
        {showZoomModal && zoomedReport && (
          <div className="modal-overlay" onClick={handleZoomClose}>
            <div className="zoom-modal" onClick={(e) => e.stopPropagation()}>
              <div className="zoom-modal-header">
                <div className="zoom-modal-title">
                  <h3>{reportTypes.find(r => r.id === zoomedReport.type.id)?.name}</h3>
                  <div className="zoom-modal-badges">
                    <span className="category-badge">{zoomedReport.type.category}</span>
                    <span className="chart-type-badge-large">
                      <i className={chartTypes.find(c => c.id === zoomedReport.chartType)?.icon || 'bi-bar-chart'}></i>
                      {chartTypes.find(c => c.id === zoomedReport.chartType)?.name}
                    </span>
                  </div>
                </div>
                <button className="close-btn" onClick={handleZoomClose}>
                  <i className="bi bi-x"></i>
                </button>
              </div>

              <div className="zoom-modal-body">
                <div className="chart-container-zoom">
                  {renderChart(
                    zoomedReport.chartType, 
                    generateChartData(zoomedReport.type, zoomedReport.chartType),
                    true
                  )}
                </div>
                
                <div className="zoom-modal-info">
                  <div className="info-section">
                    <h6>Report Details</h6>
                    <p><strong>Description:</strong> {zoomedReport.type.description}</p>
                    <p><strong>Created:</strong> {zoomedReport.createdAt.toLocaleString()}</p>
                    <p><strong>Chart Type:</strong> {chartTypes.find(c => c.id === zoomedReport.chartType)?.name}</p>
                  </div>
                  
                  <div className="zoom-actions">
                    <button className="btn btn-outline-success">
                      <i className="bi bi-download me-2"></i>
                      Export Chart
                    </button>
                    <button className="btn btn-outline-primary">
                      <i className="bi bi-printer me-2"></i>
                      Print Report
                    </button>
                    <button 
                      className="btn btn-outline-danger"
                      onClick={() => handleRemoveReport(zoomedReport)}
                    >
                      <i className="bi bi-trash me-2"></i>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Remove Confirmation Modal */}
        {showRemoveModal && reportToRemove && (
          <div className="modal-overlay" onClick={cancelRemoveReport}>
            <div className="remove-modal" onClick={(e) => e.stopPropagation()}>
              <div className="remove-modal-header">
                <div className="remove-icon">
                  <i className="bi bi-exclamation-triangle"></i>
                </div>
                <h3>Remove Report</h3>
                <button className="close-btn" onClick={cancelRemoveReport}>
                  <i className="bi bi-x"></i>
                </button>
              </div>

              <div className="remove-modal-body">
                <div className="remove-warning">
                  <p>Are you sure you want to remove this report?</p>
                  <div className="report-info-remove">
                    <div className="report-details">
                      <h5>{reportTypes.find(r => r.id === reportToRemove.type.id)?.name}</h5>
                      <p className="report-category-remove">{reportToRemove.type.category}</p>
                      <p className="report-description-remove">{reportToRemove.type.description}</p>
                      <small className="created-date-remove">
                        Created: {reportToRemove.createdAt.toLocaleString()}
                      </small>
                    </div>
                    <div className="chart-preview-remove">
                      <i className={chartTypes.find(c => c.id === reportToRemove.chartType)?.icon || 'bi-bar-chart'}></i>
                    </div>
                  </div>
                  <div className="warning-text">
                    <i className="bi bi-info-circle"></i>
                    <span>This action cannot be undone. The report will be permanently deleted.</span>
                  </div>
                </div>

                <div className="remove-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={cancelRemoveReport}
                  >
                    <i className="bi bi-x-circle me-2"></i>
                    Cancel
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={confirmRemoveReport}
                  >
                    <i className="bi bi-trash me-2"></i>
                    Remove Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsManager;
