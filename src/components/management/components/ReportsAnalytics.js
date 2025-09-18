import React, { useState, useEffect } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import LoadingManagementBar from '../LoadingManagementBar';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const ReportsAnalytics = ({ currentDateTime, isDarkMode }) => {
  const [analyticsData, setAnalyticsData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading analytics data
    setTimeout(() => {
      setAnalyticsData({
        reportGeneration: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
          datasets: [{
            label: 'Reports Generated',
            data: [12, 19, 15, 25, 22, 18, 24, 20, 28],
            borderColor: '#007bff',
            backgroundColor: 'rgba(0, 123, 255, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        reportTypes: {
          labels: ['Inventory', 'Analytics', 'Medicine', 'Financial', 'Equipment'],
          datasets: [{
            data: [35, 25, 20, 15, 5],
            backgroundColor: ['#007bff', '#28a745', '#ffc107', '#17a2b8', '#6c757d'],
            borderWidth: 2
          }]
        },
        popularReports: {
          labels: ['Inventory Report', 'Patient Analytics', 'Medicine Usage', 'Financial Summary', 'Equipment Status'],
          datasets: [{
            label: 'Download Count',
            data: [45, 38, 32, 28, 15],
            backgroundColor: '#28a745',
            borderColor: '#1e7e34',
            borderWidth: 1
          }]
        }
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return <LoadingManagementBar message="Loading reports analytics data..." />;
  }

  return (
    <div className="reports-analytics">
      <Row>
        <Col md={12}>
          <h3 className="section-title">Reports Analytics</h3>
          <p className="section-description">Insights and statistics about your reporting activity</p>
        </Col>
      </Row>

      {/* Key Metrics Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="metric-card">
            <Card.Body>
              <div className="metric-content">
                <div className="metric-icon primary">
                  <i className="bi bi-file-earmark-bar-graph"></i>
                </div>
                <div className="metric-info">
                  <h6>Total Reports</h6>
                  <h3>156</h3>
                  <small className="text-success">+23% this month</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="metric-card">
            <Card.Body>
              <div className="metric-content">
                <div className="metric-icon success">
                  <i className="bi bi-download"></i>
                </div>
                <div className="metric-info">
                  <h6>Downloads</h6>
                  <h3>1,247</h3>
                  <small className="text-success">+15% this week</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="metric-card">
            <Card.Body>
              <div className="metric-content">
                <div className="metric-icon warning">
                  <i className="bi bi-clock"></i>
                </div>
                <div className="metric-info">
                  <h6>Avg. Gen Time</h6>
                  <h3>2.3s</h3>
                  <small className="text-success">-0.5s improved</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="metric-card">
            <Card.Body>
              <div className="metric-content">
                <div className="metric-icon info">
                  <i className="bi bi-hdd"></i>
                </div>
                <div className="metric-info">
                  <h6>Storage Used</h6>
                  <h3>247 MB</h3>
                  <small className="text-muted">of 1 GB limit</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row className="mb-4">
        <Col lg={8}>
          <Card>
            <Card.Header>
              <h5><i className="bi bi-graph-up me-2"></i>Report Generation Trends</h5>
            </Card.Header>
            <Card.Body>
              <Line
                data={analyticsData.reportGeneration}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: { display: true, text: 'Number of Reports' }
                    },
                    x: {
                      title: { display: true, text: 'Month' }
                    }
                  }
                }}
              />
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5><i className="bi bi-pie-chart me-2"></i>Report Types Distribution</h5>
            </Card.Header>
            <Card.Body>
              <Doughnut
                data={analyticsData.reportTypes}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'bottom' }
                  }
                }}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={12}>
          <Card>
            <Card.Header>
              <h5><i className="bi bi-star me-2"></i>Most Popular Reports</h5>
            </Card.Header>
            <Card.Body>
              <Bar
                data={analyticsData.popularReports}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: { display: true, text: 'Downloads' }
                    }
                  }
                }}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Row>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5><i className="bi bi-activity me-2"></i>Recent Activity</h5>
            </Card.Header>
            <Card.Body>
              <div className="activity-timeline">
                <div className="timeline-item">
                  <div className="timeline-marker bg-success"></div>
                  <div className="timeline-content">
                    <strong>Inventory Report</strong> generated
                    <small>5 minutes ago</small>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-marker bg-info"></div>
                  <div className="timeline-content">
                    <strong>Analytics Report</strong> downloaded by admin
                    <small>15 minutes ago</small>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-marker bg-warning"></div>
                  <div className="timeline-content">
                    <strong>Financial Report</strong> shared via email
                    <small>1 hour ago</small>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-marker bg-primary"></div>
                  <div className="timeline-content">
                    <strong>Custom Report</strong> template created
                    <small>2 hours ago</small>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Header>
              <h5><i className="bi bi-trophy me-2"></i>Performance Insights</h5>
            </Card.Header>
            <Card.Body>
              <div className="performance-metrics">
                <div className="performance-item">
                  <div className="performance-label">Report Accuracy</div>
                  <div className="performance-bar">
                    <div className="performance-fill" style={{width: '98%'}}></div>
                  </div>
                  <div className="performance-value">98%</div>
                </div>
                <div className="performance-item">
                  <div className="performance-label">Generation Speed</div>
                  <div className="performance-bar">
                    <div className="performance-fill" style={{width: '85%'}}></div>
                  </div>
                  <div className="performance-value">85%</div>
                </div>
                <div className="performance-item">
                  <div className="performance-label">User Satisfaction</div>
                  <div className="performance-bar">
                    <div className="performance-fill" style={{width: '92%'}}></div>
                  </div>
                  <div className="performance-value">92%</div>
                </div>
                <div className="performance-item">
                  <div className="performance-label">Data Coverage</div>
                  <div className="performance-bar">
                    <div className="performance-fill" style={{width: '76%'}}></div>
                  </div>
                  <div className="performance-value">76%</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ReportsAnalytics;
