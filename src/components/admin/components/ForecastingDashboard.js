import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Alert, Spinner, Badge, Button, Modal } from 'react-bootstrap';
import forecastingService, { forecastHelpers } from '../../../services/forecastingService';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import '../styles/ForecastingDashboard.css';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ForecastingDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);

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
    setShowDetailModal(true);
  };

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
      {/* Alert Detail Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
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
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ForecastingDashboard;
