import React, { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Alert, Spinner, Badge, Button, Modal, Tab, Tabs, Table, ButtonGroup } from 'react-bootstrap';
import forecastingService, { forecastHelpers } from '../../../services/forecastingService';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import FormulaExplanation from './FormulaExplanation';
import ConfidenceIntervals from './ConfidenceIntervals';
import '../styles/ForecastingDashboard.css';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

const ForecastingDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [chartTimeframe, setChartTimeframe] = useState('30days');

  // Load forecasting data
  const loadForecastingData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await forecastingService.getDashboardSummary();
      setDashboardData(data.data);
      setLastUpdated(new Date().toLocaleString());
    } catch (err) {
      console.error('Error loading forecasting data:', err);
      setError('Failed to load forecasting data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForecastingData();
    
    // Auto-refresh every 30 minutes
    const interval = setInterval(loadForecastingData, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAlertClick = (alert) => {
    setSelectedAlert(alert);
    setShowDetailModal('alert');
  };

  // Generate chart data for disease trends
  const diseaseChartData = useMemo(() => {
    if (!dashboardData?.diseaseRisks) return null;

    const diseases = Object.keys(dashboardData.diseaseRisks);
    const riskValues = diseases.map(disease => {
      const risk = dashboardData.diseaseRisks[disease];
      // Convert risk levels to numeric values for charting
      switch(risk.risk) {
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
        default: return 0;
      }
    });

    return {
      labels: diseases.map(disease => forecastHelpers.formatDiseaseName(disease)),
      datasets: [{
        label: 'Risk Level',
        data: riskValues,
        backgroundColor: diseases.map(disease => {
          const risk = dashboardData.diseaseRisks[disease].risk;
          switch(risk) {
            case 'high': return '#dc3545';
            case 'medium': return '#ffc107';
            case 'low': return '#28a745';
            default: return '#6c757d';
          }
        }),
        borderColor: '#ffffff',
        borderWidth: 2,
        borderRadius: 6
      }]
    };
  }, [dashboardData]);

  // Generate chart data for resource forecasting
  const resourceChartData = useMemo(() => {
    if (!dashboardData?.resourceForecasts) return null;

    const resources = Object.keys(dashboardData.resourceForecasts);
    const forecastValues = resources.map(resource => {
      const forecast = dashboardData.resourceForecasts[resource];
      return forecast.dailyForecast || Math.random() * 100; // Fallback for demo
    });

    return {
      labels: resources.map(resource => forecastHelpers.formatResourceName(resource)),
      datasets: [{
        label: 'Forecasted Usage',
        data: forecastValues,
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 205, 86, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 2
      }]
    };
  }, [dashboardData]);

  // Generate trend line chart data
  const trendChartData = useMemo(() => {
    // Generate mock trend data for now - will be replaced with real data
    const days = [];
    const diseaseData = [];
    const resourceData = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      
      // Mock data with seasonal patterns
      const month = date.getMonth() + 1;
      const isWetSeason = [6, 7, 8, 9, 10, 11].includes(month);
      
      diseaseData.push(Math.floor(Math.random() * 10) + (isWetSeason ? 5 : 2));
      resourceData.push(Math.floor(Math.random() * 50) + (isWetSeason ? 30 : 20));
    }

    return {
      labels: days,
      datasets: [
        {
          label: 'Disease Cases',
          data: diseaseData,
          borderColor: '#dc3545',
          backgroundColor: 'rgba(220, 53, 69, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Resource Usage',
          data: resourceData,
          borderColor: '#007bff',
          backgroundColor: 'rgba(0, 123, 255, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  }, [chartTimeframe]);

  if (loading) {
    return (
      <div className="forecasting-dashboard">
        <div className="text-center p-5">
          <Spinner animation="border" size="lg" className="mb-3" />
          <h5>Loading Forecasting Data...</h5>
          <p className="text-muted">Analyzing health patterns and generating predictions</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="forecasting-dashboard">
        <Alert variant="danger" className="mb-4">
          <Alert.Heading>
            <i className="bi bi-exclamation-triangle me-2"></i>
            Forecasting System Error
          </Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={loadForecastingData}>
            <i className="bi bi-arrow-clockwise me-2"></i>
            Retry Loading
          </Button>
        </Alert>
      </div>
    );
  }

  const { season, diseaseRisks, resourceForecasts, alerts, summary } = dashboardData || {};

  return (
    <div className="forecasting-dashboard">
      {/* Last Updated Info */}
      <Row className="mb-3">
        <Col md={12}>
          <div className="text-muted text-end">
            <small>Last updated: {lastUpdated}</small>
          </div>
        </Col>
      </Row>
      
      {/* Header with Season Info */}
      <Row className="mb-4">
        <Col md={12}>
          <Card className={`season-card border-${forecastHelpers.getSeasonColor(season?.season)}`}>
            <Card.Body>
              <Row className="align-items-center">
                <Col md={8}>
                  <div className="d-flex align-items-center">
                    <div className="season-icon me-3">
                      <i className={`bi ${season?.isTyphoonSeason ? 'bi-cloud-rain-heavy' : 'bi-sun'} text-${forecastHelpers.getSeasonColor(season?.season)} fs-2`}></i>
                    </div>
                    <div>
                      <h4 className="mb-1">
                        {season?.isTyphoonSeason ? 'Typhoon Season Active' : 'Dry Season'}
                        <Badge bg={season?.riskLevel === 'high' ? 'warning' : 'success'} className="ms-2">
                          {season?.riskLevel?.toUpperCase()} RISK
                        </Badge>
                      </h4>
                      <p className="mb-0 text-muted">
                        Current month: {new Date().toLocaleDateString('en-US', { month: 'long' })} | 
                        Preparedness level: <strong>{season?.preparednessLevel}</strong>
                      </p>
                    </div>
                  </div>
                </Col>
                <Col md={4} className="text-end">
                  <div className="forecast-summary">
                    <div className="summary-item">
                      <span className="summary-number text-danger">{summary?.totalAlerts || 0}</span>
                      <span className="summary-label">Active Alerts</span>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Active Alerts */}
      {alerts && alerts.length > 0 && (
        <Row className="mb-4">
          <Col md={12}>
            <Card className="alerts-card">
              <Card.Header>
                <h5>
                  <i className="bi bi-exclamation-triangle-fill text-warning me-2"></i>
                  Active Health Alerts
                </h5>
                <small>Immediate attention required</small>
              </Card.Header>
              <Card.Body>
                <Row>
                  {alerts.map((alert, index) => (
                    <Col md={6} key={index} className="mb-3">
                      <div 
                        className={`alert-item border-start border-4 border-${alert.level === 'high' ? 'danger' : 'warning'} p-3 bg-light cursor-pointer`}
                        onClick={() => handleAlertClick(alert)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <div className="alert-type">
                              <Badge bg={alert.type === 'disease' ? 'danger' : 'warning'} className="me-2">
                                {alert.type.toUpperCase()}
                              </Badge>
                              <Badge bg={alert.level === 'high' ? 'danger' : 'warning'}>
                                {alert.level.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="alert-message mt-2">
                              <strong>{alert.message}</strong>
                            </div>
                          </div>
                          <i className="bi bi-chevron-right text-muted"></i>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Disease Risk Assessment */}
      <Row className="mb-4">
        <Col md={12}>
          <Card className="disease-risks-card">
            <Card.Header>
              <h5>
                <i className="bi bi-virus me-2"></i>
                Disease Risk Assessment
              </h5>
              <small>Philippines-specific disease monitoring</small>
            </Card.Header>
            <Card.Body>
              <Row>
                {diseaseRisks && Object.entries(diseaseRisks).map(([disease, assessment]) => {
                  const riskInfo = forecastHelpers.formatRiskLevel(assessment.risk);
                  const changeInfo = forecastHelpers.formatPercentageChange(assessment.percentageChange || 0);
                  
                  return (
                    <Col md={4} key={disease} className="mb-3">
                      <div className={`disease-card border border-${riskInfo.color} h-100`}>
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="disease-name">
                              {forecastHelpers.formatDiseaseName(disease)}
                            </h6>
                            <Badge bg={riskInfo.color}>
                              <i className={`bi bi-${riskInfo.icon} me-1`}></i>
                              {riskInfo.text}
                            </Badge>
                          </div>
                          
                          <div className="disease-metrics">
                            <div className="metric-item mb-2">
                              <span className="metric-label">Trend:</span>
                              <span className={`metric-value text-${changeInfo.color} ms-2`}>
                                <i className={`bi bi-${changeInfo.icon} me-1`}></i>
                                {changeInfo.formatted}
                              </span>
                            </div>
                            
                            {assessment.seasonalFactor && (
                              <div className="seasonal-indicator">
                                <Badge bg="info" size="sm">
                                  <i className="bi bi-cloud-rain me-1"></i>
                                  Typhoon Risk
                                </Badge>
                              </div>
                            )}
                          </div>
                          
                          <div className="disease-message mt-2">
                            <small className="text-muted">{assessment.message}</small>
                          </div>
                          
                          {assessment.recommendation && (
                            <div className="disease-recommendation mt-2">
                              <small>
                                <strong>Action:</strong> {assessment.recommendation}
                              </small>
                            </div>
                          )}
                        </div>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Forecasting Analytics Charts */}
      <Row className="mb-4">
        <Col md={12}>
          <Card className="forecasting-charts-card">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">
                  <i className="bi bi-graph-up me-2"></i>
                  Forecasting Analytics
                </h5>
                <small className="text-muted">Interactive charts and trend analysis</small>
              </div>
              <div className="d-flex gap-2">
                <ButtonGroup size="sm">
                  <Button 
                    variant={chartTimeframe === '7days' ? 'primary' : 'outline-primary'}
                    onClick={() => setChartTimeframe('7days')}
                  >
                    7 Days
                  </Button>
                  <Button 
                    variant={chartTimeframe === '30days' ? 'primary' : 'outline-primary'}
                    onClick={() => setChartTimeframe('30days')}
                  >
                    30 Days
                  </Button>
                  <Button 
                    variant={chartTimeframe === '90days' ? 'primary' : 'outline-primary'}
                    onClick={() => setChartTimeframe('90days')}
                  >
                    90 Days
                  </Button>
                </ButtonGroup>
              </div>
            </Card.Header>
            <Card.Body>
              <Row className="mb-4">
                {/* Disease Risk Chart */}
                <Col lg={6} className="mb-4">
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-0">
                          <i className="bi bi-virus me-2 text-danger"></i>
                          Disease Risk Levels
                        </h6>
                        <small className="text-muted">Current risk assessment by disease type</small>
                      </div>
                      <Button 
                        variant="outline-light" 
                        size="sm"
                        onClick={() => setShowDetailModal('diseaseRisk')}
                        className="d-flex align-items-center forecasting-zoom-btn"
                        style={{ color: '#6c757d', borderColor: '#dee2e6' }}
                      >
                        <i className="bi bi-arrows-fullscreen me-1"></i>
                        Zoom
                      </Button>
                    </Card.Header>
                    <Card.Body style={{ height: '300px' }}>
                      {diseaseChartData ? (
                        <Bar
                          data={diseaseChartData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: { display: false },
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    const riskLabels = ['Unknown', 'Low Risk', 'Medium Risk', 'High Risk'];
                                    return `Risk Level: ${riskLabels[context.parsed.y]}`;
                                  }
                                }
                              }
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                max: 3,
                                ticks: {
                                  stepSize: 1,
                                  callback: function(value) {
                                    const labels = ['', 'Low', 'Medium', 'High'];
                                    return labels[value] || '';
                                  }
                                },
                                title: {
                                  display: true,
                                  text: 'Risk Level'
                                }
                              },
                              x: {
                                ticks: {
                                  maxRotation: 45,
                                  minRotation: 45
                                }
                              }
                            }
                          }}
                        />
                      ) : (
                        <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                          <div className="text-center">
                            <i className="bi bi-bar-chart display-4 mb-3"></i>
                            <p>Loading disease risk data...</p>
                          </div>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                {/* Resource Forecast Chart */}
                <Col lg={6} className="mb-4">
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-0">
                          <i className="bi bi-pie-chart me-2 text-info"></i>
                          Resource Usage Forecast
                        </h6>
                        <small className="text-muted">Predicted resource consumption</small>
                      </div>
                      <Button 
                        variant="outline-light" 
                        size="sm"
                        onClick={() => setShowDetailModal('resourceForecast')}
                        className="d-flex align-items-center forecasting-zoom-btn"
                        style={{ color: '#6c757d', borderColor: '#dee2e6' }}
                      >
                        <i className="bi bi-arrows-fullscreen me-1"></i>
                        Zoom
                      </Button>
                    </Card.Header>
                    <Card.Body style={{ height: '300px' }}>
                      {resourceChartData ? (
                        <Doughnut
                          data={resourceChartData}
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
                              },
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((context.parsed / total) * 100).toFixed(1);
                                    return `${context.label}: ${context.parsed.toFixed(1)} units (${percentage}%)`;
                                  }
                                }
                              }
                            },
                            cutout: '60%'
                          }}
                        />
                      ) : (
                        <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                          <div className="text-center">
                            <i className="bi bi-pie-chart display-4 mb-3"></i>
                            <p>Loading resource forecast data...</p>
                          </div>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Trend Analysis Chart */}
              <Row>
                <Col md={12}>
                  <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-0">
                          <i className="bi bi-graph-up-arrow me-2 text-success"></i>
                          Historical Trends & Predictions
                        </h6>
                        <small className="text-muted">Disease cases and resource usage over time</small>
                      </div>
                      <Button 
                        variant="outline-light" 
                        size="sm"
                        onClick={() => setShowDetailModal('trendAnalysis')}
                        className="d-flex align-items-center forecasting-zoom-btn"
                        style={{ color: '#6c757d', borderColor: '#dee2e6' }}
                      >
                        <i className="bi bi-arrows-fullscreen me-1"></i>
                        Zoom
                      </Button>
                    </Card.Header>
                    <Card.Body style={{ height: '400px' }}>
                      {trendChartData ? (
                        <Line
                          data={trendChartData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: { 
                                position: 'top',
                                labels: {
                                  usePointStyle: true,
                                  padding: 20
                                }
                              },
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
                                  text: 'Count / Usage'
                                }
                              },
                              x: {
                                title: {
                                  display: true,
                                  text: 'Date'
                                }
                              }
                            },
                            interaction: {
                              mode: 'nearest',
                              axis: 'x',
                              intersect: false
                            }
                          }}
                        />
                      ) : (
                        <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                          <div className="text-center">
                            <i className="bi bi-graph-up display-4 mb-3"></i>
                            <p>Loading trend analysis...</p>
                          </div>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Enhanced Calculation Explanations */}
      {(diseaseRisks || resourceForecasts) && (
        <Row className="mb-4">
          <Col md={12}>
            <Card className="calculation-details-card">
              <Card.Header>
                <h5>
                  <i className="bi bi-calculator-fill me-2"></i>
                  Forecasting Methodology & Calculations
                </h5>
                <small>Transparent algorithms and statistical methods</small>
              </Card.Header>
              <Card.Body>
                <Tabs defaultActiveKey="disease-calc" className="mb-3">
                  <Tab eventKey="disease-calc" title="Disease Risk Calculations">
                    {diseaseRisks && Object.entries(diseaseRisks).some(([_, assessment]) => assessment.calculation) ? (
                      <Row>
                        {Object.entries(diseaseRisks).slice(0, 2).map(([disease, assessment]) => (
                          assessment.calculation && (
                            <Col md={6} key={disease}>
                              <FormulaExplanation 
                                calculation={assessment.calculation}
                                type="disease"
                                title={`${forecastHelpers.formatDiseaseName(disease)} Risk Assessment`}
                              />
                            </Col>
                          )
                        ))}
                      </Row>
                    ) : (
                      <Alert variant="info">
                        Disease risk calculation details will appear here when data is available.
                      </Alert>
                    )}
                  </Tab>
                  
                  <Tab eventKey="resource-calc" title="Resource Forecasting">
                    {resourceForecasts && Object.entries(resourceForecasts).some(([_, forecast]) => forecast.calculation) ? (
                      <Row>
                        {Object.entries(resourceForecasts).slice(0, 2).map(([resource, forecast]) => (
                          forecast.calculation && (
                            <Col md={6} key={resource}>
                              <FormulaExplanation 
                                calculation={forecast.calculation}
                                type="resource"
                                title={`${forecastHelpers.formatResourceName(resource)} Forecast`}
                              />
                              {forecast.confidenceIntervals && (
                                <ConfidenceIntervals 
                                  intervals={forecast.confidenceIntervals}
                                  forecast={forecast.dailyForecast}
                                  title={`${forecastHelpers.formatResourceName(resource)} Confidence Intervals`}
                                />
                              )}
                            </Col>
                          )
                        ))}
                      </Row>
                    ) : (
                      <Alert variant="info">
                        Resource forecasting calculation details will appear here when data is available.
                      </Alert>
                    )}
                  </Tab>
                  
                  <Tab eventKey="statistics" title="Statistical Summary">
                    <Row>
                      {/* Disease Statistics */}
                      {diseaseRisks && Object.entries(diseaseRisks).some(([_, assessment]) => assessment.statistics) && (
                        <Col md={6}>
                          <Card className="formula-card">
                            <Card.Header>
                              <h6 className="mb-0">Disease Trend Statistics</h6>
                            </Card.Header>
                            <Card.Body>
                              {Object.entries(diseaseRisks).map(([disease, assessment]) => (
                                assessment.statistics && (
                                  <div key={disease} className="mb-3">
                                    <h6 className="text-primary">{forecastHelpers.formatDiseaseName(disease)}</h6>
                                    <Row>
                                      <Col xs={6}>
                                        <small className="text-muted">Recent Average:</small>
                                        <div className="fw-bold">{assessment.statistics.recentAverage}</div>
                                      </Col>
                                      <Col xs={6}>
                                        <small className="text-muted">Previous Average:</small>
                                        <div className="fw-bold">{assessment.statistics.previousAverage}</div>
                                      </Col>
                                      <Col xs={6}>
                                        <small className="text-muted">Trend:</small>
                                        <Badge bg={assessment.statistics.trendDirection === 'increasing' ? 'danger' : 'success'}>
                                          {assessment.statistics.trendDirection}
                                        </Badge>
                                      </Col>
                                      <Col xs={6}>
                                        <small className="text-muted">Volatility:</small>
                                        <Badge bg={assessment.statistics.volatility === 'high' ? 'warning' : 'info'}>
                                          {assessment.statistics.volatility}
                                        </Badge>
                                      </Col>
                                    </Row>
                                  </div>
                                )
                              ))}
                            </Card.Body>
                          </Card>
                        </Col>
                      )}
                      
                      {/* Resource Statistics */}
                      {resourceForecasts && Object.entries(resourceForecasts).some(([_, forecast]) => forecast.historicalAnalysis) && (
                        <Col md={6}>
                          <Card className="formula-card">
                            <Card.Header>
                              <h6 className="mb-0">Resource Usage Analysis</h6>
                            </Card.Header>
                            <Card.Body>
                              {Object.entries(resourceForecasts).map(([resource, forecast]) => (
                                forecast.historicalAnalysis && (
                                  <div key={resource} className="mb-3">
                                    <h6 className="text-primary">{forecastHelpers.formatResourceName(resource)}</h6>
                                    <Row>
                                      <Col xs={6}>
                                        <small className="text-muted">Trend:</small>
                                        <Badge bg={
                                          forecast.historicalAnalysis.trendDirection === 'increasing' ? 'warning' : 
                                          forecast.historicalAnalysis.trendDirection === 'decreasing' ? 'success' : 'info'
                                        }>
                                          {forecast.historicalAnalysis.trendDirection}
                                        </Badge>
                                      </Col>
                                      <Col xs={6}>
                                        <small className="text-muted">Volatility:</small>
                                        <Badge bg={forecast.historicalAnalysis.volatility === 'High' ? 'danger' : 'success'}>
                                          {forecast.historicalAnalysis.volatility}
                                        </Badge>
                                      </Col>
                                      <Col xs={6}>
                                        <small className="text-muted">Average Usage:</small>
                                        <div className="fw-bold">{forecast.historicalAnalysis.averageUsage}</div>
                                      </Col>
                                      <Col xs={6}>
                                        <small className="text-muted">Last Period:</small>
                                        <div className="fw-bold">{forecast.historicalAnalysis.lastPeriodUsage}</div>
                                      </Col>
                                    </Row>
                                  </div>
                                )
                              ))}
                            </Card.Body>
                          </Card>
                        </Col>
                      )}
                    </Row>
                  </Tab>
                </Tabs>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Resource Planning */}
      <Row className="mb-4">
        <Col md={12}>
          <Card className="resource-planning-card">
            <Card.Header>
              <h5>
                <i className="bi bi-box-seam me-2"></i>
                Resource Planning Forecast
              </h5>
              <small>30-day supply and inventory predictions</small>
            </Card.Header>
            <Card.Body>
              <Row>
                {resourceForecasts && Object.entries(resourceForecasts).map(([resource, forecast]) => {
                  const urgencyColor = forecastHelpers.getUrgencyColor(forecast.urgency);
                  
                  return (
                    <Col md={6} key={resource} className="mb-3">
                      <div className={`resource-card border border-${urgencyColor} h-100`}>
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="resource-name">
                              {forecastHelpers.formatResourceName(resource)}
                            </h6>
                            <Badge bg={urgencyColor}>
                              {forecast.urgency?.toUpperCase()} PRIORITY
                            </Badge>
                          </div>
                          
                          <div className="resource-metrics">
                            <Row className="mb-2">
                              <Col xs={6}>
                                <div className="metric-item">
                                  <div className="metric-number">{forecast.dailyForecast || 0}</div>
                                  <div className="metric-label">Daily Need</div>
                                </div>
                              </Col>
                              <Col xs={6}>
                                <div className="metric-item">
                                  <div className="metric-number">{forecast.totalNeed || 0}</div>
                                  <div className="metric-label">30-Day Total</div>
                                </div>
                              </Col>
                            </Row>
                            
                            {forecast.seasonalAdjustment > 1 && (
                              <div className="seasonal-adjustment mb-2">
                                <Badge bg="warning" size="sm">
                                  <i className="bi bi-arrow-up me-1"></i>
                                  {Math.round((forecast.seasonalAdjustment - 1) * 100)}% seasonal increase
                                </Badge>
                              </div>
                            )}
                          </div>
                          
                          {forecast.recommendations && forecast.recommendations.length > 0 && (
                            <div className="resource-recommendations">
                              <div className="recommendations-header mb-1">
                                <small><strong>Recommendations:</strong></small>
                              </div>
                              {forecast.recommendations.slice(0, 2).map((rec, index) => (
                                <div key={index} className="recommendation-item">
                                  <small className="text-muted">• {rec}</small>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Footer */}
      {/* Chart Zoom Modals */}
      
      {/* Disease Risk Chart Modal */}
      <Modal show={showDetailModal === 'diseaseRisk'} onHide={() => setShowDetailModal(null)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-virus me-2 text-danger"></i>
            Disease Risk Assessment - Detailed View
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ height: '500px' }}>
            {diseaseChartData && (
              <Bar
                data={diseaseChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { 
                      display: true,
                      position: 'top',
                      labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: { size: 14 }
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const riskLabels = ['Unknown', 'Low Risk', 'Medium Risk', 'High Risk'];
                          return `Risk Level: ${riskLabels[context.parsed.y]}`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 3,
                      ticks: {
                        stepSize: 1,
                        callback: function(value) {
                          const labels = ['', 'Low', 'Medium', 'High'];
                          return labels[value] || '';
                        }
                      },
                      title: {
                        display: true,
                        text: 'Risk Level',
                        font: { size: 16 }
                      }
                    },
                    x: {
                      title: {
                        display: true,
                        text: 'Disease Types',
                        font: { size: 16 }
                      }
                    }
                  }
                }}
              />
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(null)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Resource Forecast Chart Modal */}
      <Modal show={showDetailModal === 'resourceForecast'} onHide={() => setShowDetailModal(null)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-pie-chart me-2 text-info"></i>
            Resource Usage Forecast - Detailed View
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ height: '500px' }}>
            {resourceChartData && (
              <Doughnut
                data={resourceChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { 
                      position: 'right',
                      labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: { size: 14 }
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const total = context.dataset.data.reduce((a, b) => a + b, 0);
                          const percentage = ((context.parsed / total) * 100).toFixed(1);
                          return `${context.label}: ${context.parsed.toFixed(1)} units (${percentage}%)`;
                        }
                      }
                    }
                  },
                  cutout: '40%'
                }}
              />
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(null)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Trend Analysis Chart Modal */}
      <Modal show={showDetailModal === 'trendAnalysis'} onHide={() => setShowDetailModal(null)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-graph-up-arrow me-2 text-success"></i>
            Historical Trends & Predictions - Detailed View
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ height: '500px' }}>
            {trendChartData && (
              <Line
                data={trendChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { 
                      position: 'top',
                      labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: { size: 14 }
                      }
                    },
                    tooltip: {
                      mode: 'index',
                      intersect: false
                    },
                    title: {
                      display: true,
                      text: `Trends Analysis - ${chartTimeframe}`,
                      font: { size: 18, weight: 'bold' },
                      padding: 20
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Count / Usage',
                        font: { size: 16 }
                      }
                    },
                    x: {
                      title: {
                        display: true,
                        text: 'Date',
                        font: { size: 16 }
                      }
                    }
                  },
                  interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                  }
                }}
              />
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(null)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Alert Detail Modal */}
      <Modal show={showDetailModal === 'alert'} onHide={() => setShowDetailModal(null)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedAlert?.type === 'disease' ? 'Disease' : 'Resource'} Alert Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAlert && (
            <div>
              <div className="alert-header mb-3">
                <Badge bg={selectedAlert.level === 'high' ? 'danger' : 'warning'} className="me-2">
                  {selectedAlert.level.toUpperCase()} PRIORITY
                </Badge>
                <Badge bg={selectedAlert.type === 'disease' ? 'danger' : 'warning'}>
                  {selectedAlert.type.toUpperCase()}
                </Badge>
              </div>
              
              <h5>{selectedAlert.message}</h5>
              
              {selectedAlert.disease && (
                <div className="mt-3">
                  <h6>Disease Information:</h6>
                  <p>Monitoring patterns for {forecastHelpers.formatDiseaseName(selectedAlert.disease)}</p>
                </div>
              )}
              
              {selectedAlert.resource && (
                <div className="mt-3">
                  <h6>Resource Information:</h6>
                  <p>Immediate attention needed for {forecastHelpers.formatResourceName(selectedAlert.resource)}</p>
                </div>
              )}
              
              <div className="mt-3">
                <h6>Recommended Actions:</h6>
                <ul>
                  <li>Review current stock levels immediately</li>
                  <li>Contact suppliers for emergency orders</li>
                  <li>Implement conservation measures if needed</li>
                  <li>Monitor situation closely for next 48 hours</li>
                </ul>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(null)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ForecastingDashboard;
