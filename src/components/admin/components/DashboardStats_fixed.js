import React, { useMemo, memo, useState } from 'react';
import { Card, Row, Col, Tabs, Tab } from 'react-bootstrap';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, ArcElement } from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { useData } from '../../../context/DataContext';
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
  
  const {
    patientsData,
    familiesData,
    appointmentsData,
    sharedCheckupsData,
    unsortedMembersData
  } = useData();

  // Memoized calculations for performance
  const dashboardStats = useMemo(() => {
    const allPatients = [...patientsData, ...unsortedMembersData];
    const todaysCheckups = sharedCheckupsData || [];
    const pendingAppointments = appointmentsData.filter(apt => 
      apt.status === 'scheduled' || apt.status === 'pending'
    );

    return {
      totalPatients: allPatients.length,
      totalFamilies: familiesData.length,
      todaysCheckups: todaysCheckups.length,
      pendingAppointments: pendingAppointments.length,
      activeCheckups: todaysCheckups.filter(checkup => 
        checkup.status === 'in-progress' || checkup.status === 'checked-in'
      ).length
    };
  }, [patientsData, familiesData, appointmentsData, sharedCheckupsData, unsortedMembersData]);

  // Chart data calculations
  const chartData = useMemo(() => {
    const allPatients = [...patientsData, ...unsortedMembersData];
    const todaysCheckups = sharedCheckupsData || [];

    // Gender distribution
    const maleCount = allPatients.filter(p => p.gender === 'Male').length;
    const femaleCount = allPatients.filter(p => p.gender === 'Female').length;
    const otherCount = allPatients.filter(p => p.gender && p.gender !== 'Male' && p.gender !== 'Female').length;

    const demographics = {
      labels: otherCount > 0 ? ['Male', 'Female', 'Other'] : ['Male', 'Female'],
      datasets: [{
        label: 'Gender Distribution',
        data: otherCount > 0 ? [maleCount, femaleCount, otherCount] : [maleCount, femaleCount],
        backgroundColor: otherCount > 0 
          ? ['rgba(56, 189, 248, 0.6)', 'rgba(231, 76, 60, 0.6)', 'rgba(155, 89, 182, 0.6)']
          : ['rgba(56, 189, 248, 0.6)', 'rgba(231, 76, 60, 0.6)'],
        borderColor: otherCount > 0 
          ? ['rgba(56, 189, 248, 1)', 'rgba(231, 76, 60, 1)', 'rgba(155, 89, 182, 1)']
          : ['rgba(56, 189, 248, 1)', 'rgba(231, 76, 60, 1)'],
        borderWidth: 1,
      }]
    };

    // Checkup trends (weekly)
    const checkupTrends = {
      labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      datasets: [{
        label: 'Checkups Completed',
        data: [0, 0, 0, 0, 0, 0, 0], // Placeholder data
        borderColor: 'rgba(56, 189, 248, 1)',
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        tension: 0.1,
      }]
    };

    // Mock prescription data
    const prescriptions = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Prescriptions Dispensed',
        data: [25, 35, 48, 58, 75, 82],
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      }]
    };

    // Mock vaccination data
    const vaccinations = {
      labels: ['COVID-19', 'Influenza', 'Hepatitis B', 'Tetanus', 'Others'],
      datasets: [{
        label: 'Vaccinations Administered',
        data: [45, 25, 15, 10, 5],
        backgroundColor: [
          'rgba(59, 130, 246, 0.6)',
          'rgba(245, 158, 11, 0.6)',
          'rgba(239, 68, 68, 0.6)',
          'rgba(34, 197, 94, 0.6)',
          'rgba(147, 51, 234, 0.6)'
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(147, 51, 234, 1)'
        ],
        borderWidth: 1,
      }]
    };

    return {
      demographics,
      checkupTrends,
      prescriptions,
      vaccinations
    };
  }, [patientsData, unsortedMembersData, sharedCheckupsData]);

  return (
    <div className="dashboard-stats">
      {/* Simulation Badge */}
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
            {/* Statistics Cards */}
            <Row className="stats-cards mb-4">
              <Col lg={3} md={6} className="mb-3">
                <Card className="stat-card patients">
                  <Card.Body>
                    <div className="stat-icon">
                      <i className="bi bi-people"></i>
                    </div>
                    <div className="stat-content">
                      <div className="stat-number">{dashboardStats.totalPatients}</div>
                      <div className="stat-label">Total Patients</div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={3} md={6} className="mb-3">
                <Card className="stat-card families">
                  <Card.Body>
                    <div className="stat-icon">
                      <i className="bi bi-house"></i>
                    </div>
                    <div className="stat-content">
                      <div className="stat-number">{dashboardStats.totalFamilies}</div>
                      <div className="stat-label">Registered Families</div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={3} md={6} className="mb-3">
                <Card className="stat-card checkups">
                  <Card.Body>
                    <div className="stat-icon">
                      <i className="bi bi-clipboard2-check"></i>
                    </div>
                    <div className="stat-content">
                      <div className="stat-number">{dashboardStats.todaysCheckups}</div>
                      <div className="stat-label">Today's Checkups</div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={3} md={6} className="mb-3">
                <Card className="stat-card appointments">
                  <Card.Body>
                    <div className="stat-icon">
                      <i className="bi bi-calendar-check"></i>
                    </div>
                    <div className="stat-content">
                      <div className="stat-number">{dashboardStats.pendingAppointments}</div>
                      <div className="stat-label">Pending Appointments</div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Charts Section - 2 per row */}
            <Row className="charts-section mb-4">
              <Col md={6} className="mb-4">
                <Card className="chart-card">
                  <Card.Header>
                    <h5><i className="bi bi-graph-up me-2"></i>Weekly Checkup Trends</h5>
                  </Card.Header>
                  <Card.Body>
                    <Line 
                      data={chartData.checkupTrends} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { position: 'top' },
                          title: { display: false }
                        },
                        scales: {
                          y: { beginAtZero: true }
                        }
                      }}
                    />
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6} className="mb-4">
                <Card className="chart-card">
                  <Card.Header>
                    <h5><i className="bi bi-pie-chart me-2"></i>Patient Demographics</h5>
                  </Card.Header>
                  <Card.Body>
                    <Pie 
                      data={chartData.demographics} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { position: 'bottom' }
                        }
                      }}
                    />
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Row className="charts-section mb-4">
              <Col md={6} className="mb-4">
                <Card className="chart-card">
                  <Card.Header>
                    <h5><i className="bi bi-capsule me-2"></i>Prescription Usage</h5>
                  </Card.Header>
                  <Card.Body>
                    <Bar 
                      data={chartData.prescriptions} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { position: 'top' }
                        },
                        scales: {
                          y: { beginAtZero: true }
                        }
                      }}
                    />
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6} className="mb-4">
                <Card className="chart-card">
                  <Card.Header>
                    <h5><i className="bi bi-shield-check me-2"></i>Vaccination Usage</h5>
                  </Card.Header>
                  <Card.Body>
                    <Pie 
                      data={chartData.vaccinations} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { position: 'bottom' }
                        }
                      }}
                    />
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Quick Actions */}
            <Row className="quick-actions">
              <Col lg={12}>
                <Card className="action-card">
                  <Card.Header>
                    <h5><i className="bi bi-lightning me-2"></i>Quick Actions</h5>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={3} className="mb-3">
                        <button className="quick-action-btn patient-btn">
                          <i className="bi bi-person-plus"></i>
                          <span>Add Patient</span>
                        </button>
                      </Col>
                      <Col md={3} className="mb-3">
                        <button className="quick-action-btn appointment-btn">
                          <i className="bi bi-calendar-plus"></i>
                          <span>Schedule Appointment</span>
                        </button>
                      </Col>
                      <Col md={3} className="mb-3">
                        <button className="quick-action-btn checkup-btn">
                          <i className="bi bi-clipboard-check"></i>
                          <span>Start Checkup</span>
                        </button>
                      </Col>
                      <Col md={3} className="mb-3">
                        <button className="quick-action-btn report-btn">
                          <i className="bi bi-file-earmark-bar-graph"></i>
                          <span>Generate Report</span>
                        </button>
                      </Col>
                    </Row>
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
          <div className="forecasting-content">
            {/* Forecasting Cards */}
            <Row className="mb-4">
              <Col md={6} className="mb-3">
                <Card className="forecast-card">
                  <Card.Header>
                    <h5>
                      <i className="bi bi-people-fill"></i>
                      Patient Visit Forecast
                    </h5>
                    <small>Next 30 days prediction</small>
                  </Card.Header>
                  <Card.Body>
                    <div className="forecast-metrics">
                      <div className="forecast-metric">
                        <div className="metric-label">Predicted Daily Average</div>
                        <div className="metric-value forecast-up">18 <small>patients/day</small></div>
                        <div className="metric-trend">↗ 12% increase expected</div>
                      </div>
                      <div className="forecast-metric">
                        <div className="metric-label">Peak Days Expected</div>
                        <div className="metric-value">Tue, Thu</div>
                        <div className="metric-trend">Based on historical patterns</div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6} className="mb-3">
                <Card className="forecast-card">
                  <Card.Header>
                    <h5>
                      <i className="bi bi-graph-up-arrow"></i>
                      Appointment Demand
                    </h5>
                    <small>Predicted booking trends</small>
                  </Card.Header>
                  <Card.Body>
                    <div className="forecast-metrics">
                      <div className="forecast-metric">
                        <div className="metric-label">Expected Bookings</div>
                        <div className="metric-value forecast-stable">85 <small>this month</small></div>
                        <div className="metric-trend">→ Stable demand</div>
                      </div>
                      <div className="forecast-metric">
                        <div className="metric-label">High Demand Period</div>
                        <div className="metric-value">Week 3-4</div>
                        <div className="metric-trend">Plan additional resources</div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Row className="mb-4">
              <Col md={12}>
                <Card className="forecast-chart-card">
                  <Card.Header>
                    <h5>
                      <i className="bi bi-speedometer2"></i>
                      Predictive Analytics Dashboard
                    </h5>
                    <small>Machine learning powered forecasts</small>
                  </Card.Header>
                  <Card.Body>
                    <div className="forecast-chart-placeholder">
                      <div className="placeholder-content">
                        <i className="bi bi-graph-up-arrow placeholder-icon"></i>
                        <h6>Advanced Forecasting Charts</h6>
                        <p>Predictive models for patient flow, resource allocation, and demand forecasting</p>
                        <small className="text-muted">Charts will be populated with ML predictions</small>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Row className="mb-4">
              <Col md={4} className="mb-3">
                <Card className="insight-card">
                  <Card.Body>
                    <div className="insight-header">
                      <i className="bi bi-lightbulb text-warning"></i>
                      <h6>Key Insight</h6>
                    </div>
                    <p>Patient visits increase by 25% during flu season. Consider increasing staff during Oct-Feb.</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4} className="mb-3">
                <Card className="insight-card">
                  <Card.Body>
                    <div className="insight-header">
                      <i className="bi bi-exclamation-triangle text-info"></i>
                      <h6>Recommendation</h6>
                    </div>
                    <p>Vaccination inventory should be restocked by 15th of each month to meet predicted demand.</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4} className="mb-3">
                <Card className="insight-card">
                  <Card.Body>
                    <div className="insight-header">
                      <i className="bi bi-graph-up text-success"></i>
                      <h6>Trend Alert</h6>
                    </div>
                    <p>Chronic disease checkups showing 18% growth trend. Plan for additional consultation time.</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
});

DashboardStats.displayName = 'DashboardStats';

export default DashboardStats;
