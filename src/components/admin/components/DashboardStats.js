import React, { useMemo, memo, useState, useEffect } from 'react';
import { Card, Row, Col, Tabs, Tab, Spinner, Alert } from 'react-bootstrap';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, ArcElement } from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { useData } from '../../../context/DataContext';
import { useDashboardStats } from '../../../hooks/useDashboard';
import { useSimulation } from '../../../hooks/useSimulation';
import { useCommonAlerts } from './AlertUtils';
import ForecastingDashboard from './ForecastingDashboard';
import StatCards from './StatCards';
import '../styles/DashboardStats.css';

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

const DashboardStats = memo(({ currentDateTime, simulationMode }) => {
  const [dashboardTabKey, setDashboardTabKey] = useState('analytics');
  const [alertShown, setAlertShown] = useState({
    loading: false,
    error: false,
    success: false
  });
  
  const {
    showDataRefreshAlert,
    showDataRefreshError,
    showDataRefreshSuccess,
    renderAlerts,
    clearAllAlerts
  } = useCommonAlerts();
  
  // Simulation mode integration
  const { 
    isEnabled: simulationEnabled, 
    shouldSimulateCharts, 
    generateSimulatedData 
  } = useSimulation();
  
  const {
    patientsData,
    familiesData,
    appointmentsData,
    sharedCheckupsData,
    unsortedMembersData
  } = useData();

  // Fetch real dashboard statistics from database
  const { 
    data: dbStats, 
    isLoading: isLoadingStats, 
    error: statsError,
    refetch: refetchStats 
  } = useDashboardStats();

  // Memoized calculations for performance
  const dashboardStats = useMemo(() => {
    // If we have database stats, use them as the primary source
    if (dbStats) {
      return {
        totalPatients: dbStats.patients?.total || 0,
        totalFamilies: dbStats.families?.total || 0,
        todaysCheckups: dbStats.checkups?.completedToday || 0,
        pendingAppointments: dbStats.appointments?.scheduled || 0,
        activeCheckups: dbStats.checkups?.active || 0,
        completedToday: dbStats.checkups?.completedToday || 0,
        // Additional stats from database
        activeFamilies: dbStats.families?.active || 0,
        inactiveFamilies: dbStats.families?.inactive || 0,
        malePatients: dbStats.patients?.male || 0,
        femalePatients: dbStats.patients?.female || 0,
        totalMedicalRecords: dbStats.medicalRecords?.total || 0,
        recentRecords: dbStats.medicalRecords?.recent || 0,
        totalPrescriptions: dbStats.prescriptions?.total || 0,
        prescriptionsToday: dbStats.prescriptions?.today || 0
      };
    }

    // Fallback to context data if database stats are not available
    const allPatients = [...(patientsData || []), ...(unsortedMembersData || [])];
    const todaysCheckups = sharedCheckupsData || [];
    const pendingAppointments = (appointmentsData || []).filter(apt => 
      apt.status === 'scheduled' || apt.status === 'pending'
    );

    const hasRealData = patientsData !== null && patientsData !== undefined && 
                       familiesData !== null && familiesData !== undefined;
    
    console.log('Dashboard Data Debug:', {
      hasRealData,
      patientsDataLength: patientsData?.length || 0,
      familiesDataLength: familiesData?.length || 0,
      appointmentsDataLength: appointmentsData?.length || 0,
      sharedCheckupsDataLength: sharedCheckupsData?.length || 0,
      unsortedMembersDataLength: unsortedMembersData?.length || 0,
      dbStatsAvailable: !!dbStats
    });
    
    // Only show demo data if data hasn't been loaded at all yet
    if (!hasRealData) {
      return {
        totalPatients: 0,
        totalFamilies: 0,
        todaysCheckups: 0,
        pendingAppointments: 0,
        activeCheckups: 0,
        completedToday: 0
      };
    }

    return {
      totalPatients: allPatients.length,
      totalFamilies: (familiesData || []).length,
      todaysCheckups: todaysCheckups.length,
      pendingAppointments: pendingAppointments.length,
      activeCheckups: todaysCheckups.filter(checkup => 
        checkup.status === 'in-progress' || checkup.status === 'checked-in'
      ).length,
      completedToday: todaysCheckups.filter(checkup => 
        checkup.status === 'completed' && 
        new Date(checkup.updatedAt || checkup.completedAt).toDateString() === new Date().toDateString()
      ).length
    };
  }, [patientsData, familiesData, appointmentsData, sharedCheckupsData, unsortedMembersData, dbStats]);

  // Chart data calculations
  const chartData = useMemo(() => {
    // Use simulated data if chart simulation is enabled
    if (shouldSimulateCharts) {
      const simulatedPatientData = generateSimulatedData.patients();
      const simulatedAppointmentData = generateSimulatedData.appointments();
      const simulatedServiceData = generateSimulatedData.services();

      return {
        checkups: {
          labels: simulatedAppointmentData.labels,
          datasets: [{
            label: 'Daily Checkups (Simulated)',
            data: simulatedAppointmentData.datasets[0].data,
            backgroundColor: '#9BC4E2',
            borderColor: '#7FB5DC',
            borderWidth: 2,
            borderRadius: 5,
            barThickness: 40
          }]
        },
        gender: {
          labels: ['Male', 'Female'],
          datasets: [{
            data: [120, 130], // Simulated gender distribution
            backgroundColor: ['#9BC4E2', '#7FB5DC'],
            hoverBackgroundColor: ['#82B3DA', '#6AA8D7']
          }]
        },
        patientGrowth: simulatedPatientData,
        ageDistribution: {
          labels: ['0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61+'],
          datasets: [{
            label: 'Age Distribution (Simulated)',
            data: [45, 38, 52, 67, 43, 29, 18],
            backgroundColor: '#9BC4E2',
            borderColor: '#7FB5DC',
            borderWidth: 1,
            barThickness: 15,
            borderRadius: 3
          }]
        },
        serviceDistribution: simulatedServiceData
      };
    }

    // Process checkup trends data from database
    let checkupTrendsData = [0, 0, 0, 0, 0, 0, 0]; // Default for Mon-Sun
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    if (dbStats?.checkupTrends) {
      // Map database results to weekdays
      dbStats.checkupTrends.forEach(trend => {
        const dayIndex = weekDays.indexOf(trend.dayName);
        if (dayIndex !== -1) {
          checkupTrendsData[dayIndex] = trend.completedCheckups;
        }
      });
    }
    
    // Calculate real gender data - prioritize database stats
    let genderData = { male: 0, female: 0 };
    if (dbStats?.patients) {
      genderData = {
        male: dbStats.patients.male || 0,
        female: dbStats.patients.female || 0
      };
    } else {
      // Fallback to context data
      const allPatients = [...(patientsData || []), ...(unsortedMembersData || [])];
      genderData = {
        male: allPatients.filter(p => p.gender?.toLowerCase() === 'male').length,
        female: allPatients.filter(p => p.gender?.toLowerCase() === 'female').length
      };
    }

    // Calculate real age distribution - prioritize database stats
    const ageDistributionLabels = ['0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61+'];
    let ageDistributionData = ageDistributionLabels.map(() => 0);
    
    if (dbStats?.ageDistribution) {
      // Use database age distribution
      dbStats.ageDistribution.forEach(item => {
        const index = ageDistributionLabels.indexOf(item.ageGroup);
        if (index !== -1) {
          ageDistributionData[index] = item.count;
        }
      });
    } else {
      // Fallback to calculate from context data
      const allPatients = [...(patientsData || []), ...(unsortedMembersData || [])];
      allPatients.forEach(patient => {
        if (patient.age || patient.dateOfBirth) {
          let age = patient.age;
          if (!age && patient.dateOfBirth) {
            const today = new Date();
            const birthDate = new Date(patient.dateOfBirth);
            age = today.getFullYear() - birthDate.getFullYear();
          }
          
          if (age >= 0 && age <= 10) ageDistributionData[0]++;
          else if (age >= 11 && age <= 20) ageDistributionData[1]++;
          else if (age >= 21 && age <= 30) ageDistributionData[2]++;
          else if (age >= 31 && age <= 40) ageDistributionData[3]++;
          else if (age >= 41 && age <= 50) ageDistributionData[4]++;
          else if (age >= 51 && age <= 60) ageDistributionData[5]++;
          else if (age >= 61) ageDistributionData[6]++;
        }
      });
    }

    // Calculate vaccination status - prioritize database stats
    let vaccinationData = { up_to_date: 0, needs_update: 0, not_set: 0 };
    if (dbStats?.vaccinations) {
      vaccinationData = {
        up_to_date: dbStats.vaccinations.up_to_date || 0,
        needs_update: dbStats.vaccinations.needs_update || 0,
        not_set: dbStats.vaccinations.not_set || 0
      };
    } else {
      // Fallback to context data
      const allPatients = [...(patientsData || []), ...(unsortedMembersData || [])];
      allPatients.forEach(patient => {
        const status = patient.vaccinationStatus?.toLowerCase();
        if (status === 'up-to-date' || status === 'up_to_date') {
          vaccinationData.up_to_date++;
        } else if (status === 'needs-update' || status === 'needs_update') {
          vaccinationData.needs_update++;
        } else {
          vaccinationData.not_set++;
        }
      });
    }

    // Process prescription trends data from database
    let prescriptionTrendsData = [0, 0, 0, 0, 0, 0]; // Default for last 6 months
    const monthLabels = [];
    const today = new Date();
    
    // Generate last 6 months labels
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      monthLabels.push(date.toLocaleDateString('en-US', { month: 'short' }));
    }
    
    if (dbStats?.prescriptionTrends) {
      // Map database results to months
      dbStats.prescriptionTrends.forEach((trend, index) => {
        if (index < 6) {
          prescriptionTrendsData[index] = trend.prescriptionCount;
        }
      });
    }

    // Process prescription medicine usage data from database for pie chart
    let medicineUsageData = [];
    let medicineLabels = [];
    
    if (dbStats?.prescriptions?.medicineUsage && dbStats.prescriptions.medicineUsage.length > 0) {
      medicineLabels = dbStats.prescriptions.medicineUsage.map(item => 
        item.medicine_name.replace(/"/g, '') // Remove quotes from JSON extract
      );
      medicineUsageData = dbStats.prescriptions.medicineUsage.map(item => item.usage_count);
    } else {
      // Default/simulation data if no real data available
      medicineLabels = ['Paracetamol', 'Amoxicillin', 'Ibuprofen', 'Cetirizine', 'Aspirin'];
      medicineUsageData = [25, 18, 15, 12, 8];
    }

    const prescriptionData = prescriptionTrendsData.length > 0 ? prescriptionTrendsData : 
      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(() => Math.floor(Math.random() * 80) + 20);

    // Process vaccine usage data from database for pie chart
    let vaccineUsageData = [];
    let vaccineLabels = [];
    
    if (dbStats?.vaccinations?.vaccineUsage && dbStats.vaccinations.vaccineUsage.length > 0) {
      vaccineLabels = dbStats.vaccinations.vaccineUsage.map(item => 
        item.vaccine_name.replace(/"/g, '') // Remove quotes from JSON extract
      );
      vaccineUsageData = dbStats.vaccinations.vaccineUsage.map(item => item.usage_count);
    } else {
      // Default/simulation data if no real data available
      vaccineLabels = ['COVID-19', 'Influenza', 'Hepatitis B', 'Tetanus', 'Pneumonia'];
      vaccineUsageData = [45, 28, 20, 15, 12];
    }

    // Use calculated vaccination data instead of random data
    const vaccinationLabels = ['Up to Date', 'Needs Update', 'Not Set'];
    const vaccinationStatusData = [vaccinationData.up_to_date, vaccinationData.needs_update, vaccinationData.not_set];

    return {
      checkupTrends: {
        labels: weekDays,
        datasets: [{
          label: 'Checkups Completed',
          data: checkupTrendsData,
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: '#3b82f6',
          borderWidth: 3,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          tension: 0.4,
          fill: true
        }]
      },
      demographics: {
        labels: ['Male', 'Female'],
        datasets: [{
          data: [genderData.male, genderData.female],
          backgroundColor: ['#87ceeb', '#ffa8a8'],
          borderWidth: 0
        }]
      },
      ageDistribution: {
        labels: ageDistributionLabels,
        datasets: [{
          label: 'Number of Patients',
          data: ageDistributionData,
          backgroundColor: '#87ceeb',
          borderColor: '#87ceeb',
          borderWidth: 1,
          barThickness: 15,
        }]
      },
      prescriptions: {
        labels: medicineLabels,
        datasets: [{
          label: 'Medicine Usage',
          data: medicineUsageData,
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40',
            '#C9CBCF',
            '#4BC0C0',
            '#FF6384',
            '#36A2EB'
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      vaccinations: {
        labels: vaccineLabels,
        datasets: [{
          label: 'Vaccine Usage',
          data: vaccineUsageData,
          backgroundColor: [
            '#4ade80',
            '#06b6d4',
            '#8b5cf6',
            '#f59e0b',
            '#ef4444',
            '#ec4899',
            '#6366f1',
            '#10b981',
            '#f97316',
            '#84cc16'
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      }
    };
  }, [dashboardStats.totalPatients, patientsData, unsortedMembersData, shouldSimulateCharts, generateSimulatedData]);

  // Alert management effects - with proper state tracking to prevent continuous alerts
  useEffect(() => {
    if (isLoadingStats && !alertShown.loading) {
      clearAllAlerts(); // Clear previous alerts when starting new load
      showDataRefreshAlert();
      setAlertShown(prev => ({ ...prev, loading: true, error: false, success: false }));
    }
  }, [isLoadingStats, alertShown.loading, showDataRefreshAlert, clearAllAlerts]);

  useEffect(() => {
    if (statsError && !alertShown.error) {
      clearAllAlerts(); // Clear loading alerts
      showDataRefreshError(() => {
        setAlertShown({ loading: false, error: false, success: false });
        refetchStats();
      });
      setAlertShown(prev => ({ ...prev, error: true, loading: false }));
    }
  }, [statsError, alertShown.error, showDataRefreshError, refetchStats, clearAllAlerts]);

  useEffect(() => {
    if (dbStats && !isLoadingStats && !statsError && !alertShown.success) {
      clearAllAlerts(); // Clear loading/error alerts
      // Show success alert without refresh button since there's already one in the UI
      showDataRefreshSuccess(); // Remove the refresh action
      setAlertShown(prev => ({ ...prev, success: true, loading: false, error: false }));
    }
  }, [dbStats, isLoadingStats, statsError, alertShown.success, showDataRefreshSuccess, clearAllAlerts]);

  // Reset alert state when starting fresh
  useEffect(() => {
    if (!dbStats && !isLoadingStats && !statsError) {
      setAlertShown({ loading: false, error: false, success: false });
    }
  }, [dbStats, isLoadingStats, statsError]);

  return (
    <div className="dashboard-stats">
      {/* Smart Alert Management */}
      {renderAlerts()}

      {/* Simulation Mode Indicators */}
      {simulationEnabled && (
        <Alert variant="info" className="mb-3">
          <div className="d-flex justify-content-between align-items-center">
            <span>
              <i className="bi bi-lightning-charge me-2"></i>
              Simulation Mode Active
              {shouldSimulateCharts && (
                <span className="ms-2 badge bg-secondary">
                  Chart Simulation: ON
                </span>
              )}
            </span>
            <small className="text-muted">
              {shouldSimulateCharts ? 'Showing simulated chart data' : 'Showing real data with simulated time'}
            </small>
          </div>
        </Alert>
      )}

      {/* Legacy simulation badge for backward compatibility */}
      {simulationMode?.isEnabled && (
        <div className="simulation-badge-container mb-3">
          <div className="simulation-badge">
            <i className="bi bi-flask"></i>
            Simulation Mode Active
          </div>
        </div>
      )}

      {/* Dashboard Tabs */}
      <Tabs
        activeKey={dashboardTabKey}
        onSelect={(k) => setDashboardTabKey(k)}
        className="dashboard-tabs mb-3"
      >
        <Tab eventKey="analytics" title={
          <span>
            <i className="bi bi-speedometer2 me-2"></i>
            Analytics
          </span>
        }>
          <div className="analytics-content">
            {/* Statistics Cards - New Component */}
            <StatCards stats={{
              totalPatients: dashboardStats.totalPatients || 3,
              totalFamilies: dashboardStats.totalFamilies || 50,
              activeCheckups: dashboardStats.activeCheckups || 0,
              completedToday: dashboardStats.todaysCheckups || 0
            }} />

            {/* Charts Section */}
            <Row className="charts-section">
              <Col lg={6} className="mb-4 d-flex">
                <Card className="chart-card flex-fill">
                  <Card.Header>
                    <h5><i className="bi bi-graph-up me-2"></i>Patient Checkup Trends</h5>
                    <small>Weekly tracking of completed patient checkups</small>
                  </Card.Header>
                  <Card.Body className="d-flex flex-column">
                    <div className="chart-stats-summary mb-3">
                      <Row>
                        <Col xs={4} className="text-center">
                          <div className="stat-mini">
                            <div className="stat-number">0</div>
                            <div className="stat-label">Total to date</div>
                          </div>
                        </Col>
                        <Col xs={4} className="text-center">
                          <div className="stat-mini">
                            <div className="stat-number">0</div>
                            <div className="stat-label">Completed</div>
                          </div>
                        </Col>
                        <Col xs={4} className="text-center">
                          <div className="stat-mini">
                            <div className="stat-number">0</div>
                            <div className="stat-label">In Progress</div>
                          </div>
                        </Col>
                      </Row>
                    </div>
                    <div className="chart-container flex-grow-1">
                      <Line 
                        data={chartData.checkupTrends} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { 
                              position: 'top',
                              display: true,
                              labels: {
                                color: '#333',
                                font: {
                                  size: 12
                                }
                              }
                            },
                            title: { display: false }
                          },
                          scales: {
                            y: { 
                              beginAtZero: true,
                              max: (() => {
                                // Calculate dynamic max value with padding to prevent overlap
                                const dataValues = chartData.checkupTrends.datasets.flatMap(dataset => dataset.data);
                                const maxDataValue = Math.max(...dataValues, 0);
                                return maxDataValue === 0 ? 5 : Math.ceil(maxDataValue * 1.2); // Add 20% padding
                              })(),
                              ticks: {
                                stepSize: (() => {
                                  const dataValues = chartData.checkupTrends.datasets.flatMap(dataset => dataset.data);
                                  const maxDataValue = Math.max(...dataValues, 0);
                                  const dynamicMax = maxDataValue === 0 ? 5 : Math.ceil(maxDataValue * 1.2);
                                  return Math.max(1, Math.ceil(dynamicMax / 10)); // Dynamic step size
                                })(),
                                precision: 0,
                                color: '#333',
                                font: {
                                  size: 11
                                },
                                callback: function(value) {
                                  if (value % 1 === 0) {
                                    return value;
                                  }
                                }
                              },
                              grid: {
                                color: '#e9ecef'
                              }
                            },
                            x: {
                              ticks: {
                                color: '#333',
                                font: {
                                  size: 11
                                }
                              },
                              grid: {
                                display: false
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={6} className="mb-4 d-flex">
                <Card className="chart-card flex-fill">
                  <Card.Header>
                    <h5><i className="bi bi-pie-chart me-2"></i>Patient Demographics</h5>
                    <small>Distribution of patients by gender and age</small>
                  </Card.Header>
                  <Card.Body className="d-flex flex-column">
                    <Row className="flex-grow-1">
                      <Col md={6} className="d-flex flex-column justify-content-center">
                        <div className="chart-container h-100">
                          <Pie 
                            data={chartData.demographics} 
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { 
                                  position: 'bottom',
                                  labels: {
                                    usePointStyle: true,
                                    padding: 20,
                                    color: '#333',
                                    font: {
                                      size: 11
                                    }
                                  }
                                }
                              }
                            }}
                          />
                        </div>
                      </Col>
                      <Col md={6} className="d-flex flex-column">
                        <div className="age-distribution-chart flex-grow-1 d-flex flex-column">
                          <h6 className="text-center mb-2">Age Distribution</h6>
                          <div className="chart-container flex-grow-1">
                            <Bar
                              data={chartData.ageDistribution}
                              options={{
                                indexAxis: 'y',
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: { display: false },
                                  title: { display: false }
                                },
                                scales: {
                                  x: {
                                    beginAtZero: true,
                                    ticks: {
                                      stepSize: 1,
                                      max: 4.0,
                                      color: '#333',
                                      font: {
                                        size: 10
                                      }
                                    },
                                    grid: {
                                      color: '#e9ecef'
                                    }
                                  },
                                  y: {
                                    ticks: {
                                      color: '#333',
                                      font: {
                                        size: 10
                                      }
                                    },
                                    grid: {
                                      display: false
                                    }
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={6} className="mb-4 d-flex">
                <Card className="chart-card flex-fill">
                  <Card.Header>
                    <h5><i className="bi bi-capsule me-2"></i>Medicine Usage</h5>
                    <small>Most frequently prescribed medicines</small>
                  </Card.Header>
                  <Card.Body className="d-flex flex-column">
                    <div className="chart-container flex-grow-1">
                      <Pie 
                        data={chartData.prescriptions} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { 
                              position: 'right',
                              display: true,
                              labels: {
                                color: '#333',
                                font: {
                                  size: 12
                                },
                                usePointStyle: true,
                                padding: 15
                              }
                            },
                            title: { display: false },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                  const percentage = ((context.parsed / total) * 100).toFixed(1);
                                  return `${context.label}: ${context.parsed} (${percentage}%)`;
                                }
                              }
                            }
                          }
                        }} 
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={6} className="mb-4 d-flex">
                <Card className="chart-card flex-fill">
                  <Card.Header>
                    <h5><i className="bi bi-shield-check me-2"></i>Vaccine Usage</h5>
                    <small>Most frequently administered vaccines</small>
                  </Card.Header>
                  <Card.Body className="d-flex flex-column">
                    <div className="chart-container flex-grow-1">
                      <Pie 
                        data={chartData.vaccinations} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { 
                              position: 'right',
                              display: true,
                              labels: {
                                color: '#333',
                                font: {
                                  size: 12
                                },
                                usePointStyle: true,
                                padding: 15
                              }
                            },
                            title: { display: false },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                  const percentage = ((context.parsed / total) * 100).toFixed(1);
                                  return `${context.label}: ${context.parsed} (${percentage}%)`;
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </div>
        </Tab>

        <Tab eventKey="forecasting" title={
          <span>
            <i className="bi bi-graph-up-arrow me-2"></i>
            Forecasting
          </span>
        }>
          <ForecastingDashboard />
        </Tab>
      </Tabs>
    </div>
  );
});

DashboardStats.displayName = 'DashboardStats';

export default DashboardStats;
