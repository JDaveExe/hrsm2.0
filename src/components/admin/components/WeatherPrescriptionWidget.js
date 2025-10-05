/**
 * Weather Prescription Widget Component
 * Displays weather-based medication recommendations for Pasig City
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Alert, 
  Badge, 
  ListGroup, 
  Button, 
  Spinner, 
  Row, 
  Col,
  ProgressBar,
  OverlayTrigger,
  Tooltip
} from 'react-bootstrap';
import enhancedForecastingService from '../../../services/enhancedForecastingService';
import './WeatherPrescriptionWidget.css';

const WeatherPrescriptionWidget = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchWeatherPrescriptionData();
  }, []);

  const fetchWeatherPrescriptionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await enhancedForecastingService.getImmediateMedicationRecommendations();
      setWeatherData(data);
    } catch (error) {
      console.error('Error fetching weather prescription data:', error);
      setError('Unable to fetch weather-based medication recommendations');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadgeVariant = (priority) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getWeatherIcon = (description) => {
    if (description?.includes('rain') || description?.includes('shower')) return '🌧️';
    if (description?.includes('storm') || description?.includes('thunder')) return '⛈️';
    if (description?.includes('cloud')) return '☁️';
    if (description?.includes('clear') || description?.includes('sun')) return '☀️';
    return '🌤️';
  };

  const renderWeatherSummary = () => {
    if (!weatherData?.currentWeather) return null;

    const { currentWeather } = weatherData;
    
    return (
      <div className="weather-summary">
        <Row className="align-items-center">
          <Col xs={2}>
            <div className="weather-icon">
              {getWeatherIcon(currentWeather.description)}
            </div>
          </Col>
          <Col xs={10}>
            <div className="weather-details text-start">
              <div className="weather-temp">{Math.round(currentWeather.temperature)}°C</div>
              <div className="weather-desc">{currentWeather.description}</div>
              <div className="weather-humidity">
                <small className="text-muted">
                  Humidity: {currentWeather.humidity}% | Rain: {currentWeather.rainProbability}%
                </small>
              </div>
              {/* Typhoon Information */}
              {currentWeather.typhoonInfo?.hasActiveTyphoon && (
                <div className="typhoon-info mt-2">
                  <Badge bg="danger" className="me-2">
                    <i className="bi bi-hurricane me-1"></i>
                    Typhoon {currentWeather.typhoonInfo.typhoon.name}
                  </Badge>
                  <small className="text-danger">
                    {currentWeather.typhoonInfo.typhoon.category} - {currentWeather.typhoonInfo.typhoon.warning}
                  </small>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </div>
    );
  };

  const renderMedicationRecommendations = () => {
    if (!weatherData?.immediateRecommendations?.length) {
      return (
        <Alert variant="info" className="mb-0 text-start">
          <small>No immediate medication recommendations based on current weather conditions.</small>
        </Alert>
      );
    }

    const topRecommendations = weatherData.immediateRecommendations.slice(0, 3);

    return (
      <ListGroup variant="flush" className="medication-list">
        {topRecommendations.map((med, index) => (
          <ListGroup.Item key={index} className="medication-item text-start">
            <Row className="align-items-center">
              <Col xs={8}>
                <div className="med-name">{med.name}</div>
                <div className="med-details">
                  <small className="text-muted">{med.dosage || med.type || ''}</small>
                </div>
                <div className="med-indication">
                  <small className="text-muted">{med.indication}</small>
                </div>
              </Col>
              <Col xs={4} className="text-end">
                <Badge variant={getPriorityBadgeVariant(med.priority)} className="mb-1">
                  {med.priority}
                </Badge>
                <div className="stock-info">
                  <small className="text-muted">Stock: {med.currentStock}</small>
                </div>
              </Col>
            </Row>
            {med.stockNeeded > 0 && (
              <div className="stock-alert mt-2 text-start">
                <ProgressBar 
                  variant="warning" 
                  now={Math.min((med.currentStock / med.expectedDemand) * 100, 100)} 
                  size="sm"
                />
                <small className="text-warning">
                  Need {med.stockNeeded} more units (next {med.forecastDays || 7} days)
                </small>
              </div>
            )}
          </ListGroup.Item>
        ))}
      </ListGroup>
    );
  };

  const renderUrgentAlerts = () => {
    if (!weatherData?.urgentAlerts?.length) return null;

    return (
      <Alert variant="warning" className="mb-3 text-start">
        <Alert.Heading as="h6">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          Urgent Medication Alerts
        </Alert.Heading>
        {weatherData.urgentAlerts.map((alert, index) => (
          <div key={index} className="urgent-alert-item">
            <strong>{alert.name}</strong>: {alert.stockNeeded} units needed
          </div>
        ))}
      </Alert>
    );
  };

  if (loading) {
    return (
      <Card className="weather-prescription-widget">
        <Card.Header className="widget-header">
          <div className="d-flex align-items-center">
            <i className="bi bi-cloud-rain-fill me-2 text-primary"></i>
            <span>Weather-Based Prescriptions</span>
          </div>
        </Card.Header>
        <Card.Body className="p-4">
          <div className="text-center">
            <Spinner animation="border" size="sm" />
            <div className="mt-2">Loading weather data...</div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="weather-prescription-widget">
        <Card.Header className="widget-header">
          <div className="d-flex align-items-center">
            <i className="bi bi-cloud-rain-fill me-2 text-primary"></i>
            <span>Weather-Based Prescriptions</span>
          </div>
        </Card.Header>
        <Card.Body>
          <Alert variant="danger" className="mb-0 text-start">
            <small>{error}</small>
          </Alert>
          <Button 
            variant="outline-primary" 
            size="sm" 
            className="mt-2"
            onClick={fetchWeatherPrescriptionData}
          >
            Retry
          </Button>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="weather-prescription-widget">
      <Card.Header className="widget-header">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <i className="bi bi-cloud-rain-fill me-2 text-primary"></i>
            <span>Weather Prescriptions - Pasig City</span>
          </div>
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Weather-based medication recommendations for Pasig City during wet season</Tooltip>}
          >
            <i className="bi bi-info-circle text-muted"></i>
          </OverlayTrigger>
        </div>
      </Card.Header>
      <Card.Body className="widget-body text-start">
        {renderWeatherSummary()}
        
        {renderUrgentAlerts()}
        
        <div className="recommendations-section pb-0">
          <h6 className="section-title">
            <i className="bi bi-capsule me-2"></i>
            Recommended Medications
          </h6>
          {renderMedicationRecommendations()}
        </div>

        {weatherData?.immediateRecommendations?.length > 3 && (
          <div className="text-center mt-3">
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Show Less' : `View All ${weatherData.immediateRecommendations.length} Recommendations`}
            </Button>
          </div>
        )}

        {showDetails && weatherData?.immediateRecommendations?.length > 3 && (
          <div className="additional-recommendations mt-3 text-start">
            <ListGroup variant="flush">
              {weatherData.immediateRecommendations.slice(3).map((med, index) => (
                <ListGroup.Item key={index + 3} className="medication-item-compact text-start">
                  <Row className="align-items-center">
                    <Col xs={9}>
                      <div className="med-name-compact">{med.name}</div>
                    </Col>
                    <Col xs={3} className="text-end">
                      <Badge variant={getPriorityBadgeVariant(med.priority)} size="sm">
                        {med.priority}
                      </Badge>
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        )}

        <div className="widget-footer mt-3">
          <Row>
            <Col xs={12} className="text-center">
              <small className="text-muted">
                <i className="bi bi-clock me-1"></i>
                Updated: {new Date(weatherData?.timestamp).toLocaleTimeString()}
              </small>
            </Col>
          </Row>
        </div>
      </Card.Body>
    </Card>
  );
};

export default WeatherPrescriptionWidget;