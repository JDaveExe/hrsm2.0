/**
 * Weather Prescription Widget Component
 * Displays weather-based medication recommendations for Pasig City
 * Now includes enhanced 7-day forecast with weekly updates
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
  Tooltip,
  Tab,
  Tabs
} from 'react-bootstrap';
import enhancedWeatherService from '../../../services/enhancedWeatherService';
import enhancedForecastingService from '../../../services/enhancedForecastingService';
import './WeatherPrescriptionWidget.css';

const WeatherPrescriptionWidget = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [weeklyForecast, setWeeklyForecast] = useState(null);
  const [medicationData, setMedicationData] = useState(null);
  const [vaccineData, setVaccineData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showVaccineDetails, setShowVaccineDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('current');

  useEffect(() => {
    fetchWeatherData();
    // Set up auto-refresh every 6 hours
    const refreshInterval = setInterval(fetchWeatherData, 6 * 60 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, []);

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch enhanced weather data and medication/vaccine recommendations
      const [weatherSummary, medicationRecommendations, vaccineRecommendations] = await Promise.all([
        enhancedWeatherService.getHealthcareWeatherSummary(),
        enhancedForecastingService.getImmediateMedicationRecommendations().catch(() => null),
        fetchWetSeasonVaccineRecommendations().catch(() => null)
      ]);
      
      setWeatherData(weatherSummary);
      setWeeklyForecast(weatherSummary.weeklyForecast);
      setMedicationData(medicationRecommendations);
      setVaccineData(vaccineRecommendations);
    } catch (error) {
      console.error('Error fetching weather prescription data:', error);
      setError('Unable to fetch weather-based medication recommendations');
    } finally {
      setLoading(false);
    }
  };

  // Fetch wet season vaccine recommendations from inventory
  const fetchWetSeasonVaccineRecommendations = async () => {
    try {
      // This will be replaced with actual API call to vaccine inventory
      const response = await fetch('/api/vaccines/wet-season-recommendations');
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log('Using mock vaccine data');
    }
    
    // Mock vaccine data for wet season
    return {
      lastUpdated: new Date().toISOString(),
      nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      wetSeasonVaccines: [
        {
          name: 'Hepatitis A Vaccine',
          type: 'Viral vaccine',
          indication: 'Water-borne disease prevention',
          priority: 'high',
          currentStock: 45,
          expectedDemand: 120,
          stockNeeded: 75,
          forecastDays: 7,
          administrationRoute: 'Intramuscular',
          dosageInfo: '1.0 mL single dose',
          wetSeasonRisk: 'High contamination risk during floods'
        },
        {
          name: 'Typhoid Vaccine',
          type: 'Bacterial vaccine',
          indication: 'Typhoid fever prevention',
          priority: 'high',
          currentStock: 32,
          expectedDemand: 80,
          stockNeeded: 48,
          forecastDays: 7,
          administrationRoute: 'Intramuscular',
          dosageInfo: '0.5 mL single dose',
          wetSeasonRisk: 'Increased transmission via contaminated water'
        },
        {
          name: 'Japanese Encephalitis Vaccine',
          type: 'Viral vaccine', 
          indication: 'Vector-borne disease prevention',
          priority: 'medium',
          currentStock: 28,
          expectedDemand: 50,
          stockNeeded: 22,
          forecastDays: 7,
          administrationRoute: 'Intramuscular',
          dosageInfo: '0.5 mL, 2-dose series',
          wetSeasonRisk: 'Mosquito breeding in stagnant water'
        },
        {
          name: 'Cholera Vaccine',
          type: 'Bacterial vaccine',
          indication: 'Cholera prevention in high-risk areas',
          priority: 'medium',
          currentStock: 18,
          expectedDemand: 35,
          stockNeeded: 17,
          forecastDays: 7,
          administrationRoute: 'Oral',
          dosageInfo: '150 mL, 2-dose series',
          wetSeasonRisk: 'Waterborne transmission during flooding'
        }
      ]
    };
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
    if (!weatherData?.current) return null;

    const { current } = weatherData;
    
    return (
      <div className="weather-summary">
        <Row className="align-items-center mb-3">
          <Col xs={2}>
            <div className="weather-icon fs-1">
              {current.icon}
            </div>
          </Col>
          <Col xs={10}>
            <div className="weather-details text-start">
              <div className="weather-temp h4 mb-1">{current.temperature}°C</div>
              <div className="weather-desc text-capitalize mb-1">{current.description}</div>
              <div className="weather-metrics">
                <small className="text-muted">
                  Humidity: {current.humidity}% | Rain: {current.rainProbability}% | Wind: {current.windSpeed} m/s
                </small>
              </div>
              {weatherData.dataSource && (
                <div className="data-source mt-1">
                  <Badge bg="success" className="me-2">
                    <i className="bi bi-check-circle me-1"></i>
                    Live Data: {weatherData.dataSource.primary}
                  </Badge>
                  <small className="text-muted">
                    Updated: {new Date(weatherData.lastUpdated).toLocaleTimeString()}
                  </small>
                </div>
              )}
              {/* Typhoon Information */}
              {weatherData.typhoonInfo?.hasActiveTyphoon && (
                <div className="typhoon-info mt-2">
                  <Badge bg="danger" className="me-2">
                    <i className="bi bi-hurricane me-1"></i>
                    Typhoon {weatherData.typhoonInfo.typhoon.name}
                  </Badge>
                  <small className="text-danger">
                    {weatherData.typhoonInfo.typhoon.category} - {weatherData.typhoonInfo.typhoon.warning}
                  </small>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </div>
    );
  };

  const renderWeeklyForecast = () => {
    if (!weeklyForecast || weeklyForecast.length === 0) return null;

    return (
      <div className="weekly-forecast">
        <h6 className="mb-3">
          <i className="bi bi-calendar-week me-2"></i>
          7-Day Healthcare Weather Forecast
        </h6>
        <Row className="g-2">
          {weeklyForecast.map((day, index) => (
            <Col key={index} className="text-center">
              <Card className="h-100 forecast-day-card">
                <Card.Body className="p-2">
                  <div className="day-name text-muted small">{day.dayName}</div>
                  <div className="weather-icon my-1">{day.icon}</div>
                  <div className="temps">
                    <span className="temp-max fw-bold">{day.tempMax}°</span>
                    <span className="temp-min text-muted">/{day.tempMin}°</span>
                  </div>
                  <div className="rain-chance small text-primary">
                    {day.rainChance}% rain
                  </div>
                  <div className="description tiny text-muted text-truncate">
                    {day.description}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    );
  };

  const renderWeatherTrends = () => {
    if (!weatherData?.trends) return null;

    const { trends } = weatherData;
    
    return (
      <div className="weather-trends mt-3">
        <h6 className="mb-3">
          <i className="bi bi-graph-up me-2"></i>
          Weekly Weather Trends
        </h6>
        <Row className="g-3">
          <Col md={6}>
            <div className="trend-item">
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Temperature</span>
                <Badge bg={trends.temperatureTrend === 'increasing' ? 'warning' : 
                           trends.temperatureTrend === 'decreasing' ? 'info' : 'secondary'}>
                  {trends.temperatureTrend === 'increasing' ? '↗️ Rising' :
                   trends.temperatureTrend === 'decreasing' ? '↘️ Falling' : '→ Stable'}
                </Badge>
              </div>
              <div className="small text-muted">
                Avg: {trends.averageTemp}°C | Range: {trends.coolest}° - {trends.hottest}°C
              </div>
            </div>
          </Col>
          <Col md={6}>
            <div className="trend-item">
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Rainfall</span>
                <Badge bg={trends.rainTrend === 'increasing' ? 'primary' : 
                           trends.rainTrend === 'decreasing' ? 'success' : 'secondary'}>
                  {trends.rainTrend === 'increasing' ? '🌧️ Increasing' :
                   trends.rainTrend === 'decreasing' ? '☀️ Decreasing' : '→ Stable'}
                </Badge>
              </div>
              <div className="small text-muted">
                Rainy days expected: {trends.totalRainDays}/7
              </div>
            </div>
          </Col>
        </Row>
      </div>
    );
  };

  const renderHealthImplications = () => {
    if (!weatherData?.healthImplications || weatherData.healthImplications.length === 0) return null;

    return (
      <div className="health-implications mt-3">
        <h6 className="mb-3">
          <i className="bi bi-shield-check me-2"></i>
          Health & Medication Implications
        </h6>
        {weatherData.healthImplications.map((implication, index) => (
          <Alert 
            key={index} 
            variant={implication.severity === 'high' ? 'danger' : 
                     implication.severity === 'medium' ? 'warning' : 'info'}
            className="py-2"
          >
            <div className="fw-bold">{implication.message}</div>
            <div className="small mt-1">
              <strong>Recommendations:</strong>
              <ul className="mb-0 mt-1">
                {implication.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          </Alert>
        ))}
      </div>
    );
  };

  const renderWeatherAlerts = () => {
    if (!weatherData?.alerts || weatherData.alerts.length === 0) return null;

    return (
      <div className="weather-alerts mt-3">
        <h6 className="mb-3">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Weather Alerts & Warnings
        </h6>
        {weatherData.alerts.map((alert, index) => (
          <Alert 
            key={index} 
            variant={alert.severity === 'warning' ? 'danger' : 'warning'}
            className="py-2"
          >
            <div className="fw-bold">{alert.title || alert.type}</div>
            <div className="small">{alert.description}</div>
            {alert.source && (
              <div className="tiny text-muted mt-1">Source: {alert.source}</div>
            )}
          </Alert>
        ))}
      </div>
    );
  };

  const renderMedicationRecommendations = () => {
    // Check for dry season notice
    if (weatherData?.showMinimalRecommendations) {
      return (
        <Alert variant="info" className="mb-0 text-start">
          <Alert.Heading as="h6" className="mb-2">
            <i className="bi bi-info-circle me-2"></i>
            {weatherData.seasonalContext?.season} - Limited Medication Recommendations
          </Alert.Heading>
          <p className="mb-2">
            <strong>Current Period:</strong> {weatherData.seasonalContext?.months}
          </p>
          <p className="mb-2">
            Our wet season forecasting system is optimized for {weatherData.seasonalContext?.forecastingFocus}. 
            Since no significant rainfall or typhoon activity is forecasted, minimal wet season medication preparation is recommended.
          </p>
          <small className="text-muted">
            <strong>Note:</strong> This system focuses on wet season medication planning (June-November). 
            During dry season, monitor heat-related health advisories instead.
          </small>
        </Alert>
      );
    }

    if (!medicationData?.immediateRecommendations?.length) {
      return (
        <Alert variant="info" className="mb-0 text-start">
          <small>No immediate medication recommendations based on current weather conditions.</small>
        </Alert>
      );
    }

    const topRecommendations = medicationData.immediateRecommendations.slice(0, 3);

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

  const renderVaccineRecommendations = () => {
    // Check for dry season notice
    if (weatherData?.showMinimalRecommendations) {
      return (
        <Alert variant="info" className="mb-0 text-start">
          <Alert.Heading as="h6" className="mb-2">
            <i className="bi bi-info-circle me-2"></i>
            {weatherData.seasonalContext?.season} - Limited Vaccine Recommendations
          </Alert.Heading>
          <p className="mb-2">
            <strong>Current Period:</strong> {weatherData.seasonalContext?.months}
          </p>
          <p className="mb-2">
            Our wet season forecasting system is optimized for {weatherData.seasonalContext?.forecastingFocus}. 
            Since no significant rainfall or typhoon activity is forecasted, minimal wet season vaccine preparation is recommended.
          </p>
          <small className="text-muted">
            <strong>Note:</strong> This system focuses on wet season vaccine planning (June-November). 
            During dry season, monitor heat-related health advisories instead.
          </small>
        </Alert>
      );
    }

    if (!vaccineData?.wetSeasonVaccines?.length) {
      return (
        <Alert variant="info" className="mb-0 text-start">
          <small>No immediate vaccine recommendations based on current weather conditions.</small>
        </Alert>
      );
    }

    const topVaccines = vaccineData.wetSeasonVaccines.slice(0, 3);

    return (
      <ListGroup variant="flush" className="medication-list">
        {topVaccines.map((vaccine, index) => (
          <ListGroup.Item key={index} className="medication-item text-start">
            <Row className="align-items-center">
              <Col xs={8}>
                <div className="med-name">{vaccine.name}</div>
                <div className="med-details">
                  <small className="text-muted">{vaccine.dosageInfo} • {vaccine.administrationRoute}</small>
                </div>
                <div className="med-indication">
                  <small className="text-muted">{vaccine.indication}</small>
                </div>
                <div className="wet-season-risk">
                  <small className="text-info">
                    <i className="bi bi-droplet me-1"></i>
                    {vaccine.wetSeasonRisk}
                  </small>
                </div>
              </Col>
              <Col xs={4} className="text-end">
                <Badge variant={getPriorityBadgeVariant(vaccine.priority)} className="mb-1">
                  {vaccine.priority}
                </Badge>
                <div className="stock-info">
                  <small className="text-muted">Stock: {vaccine.currentStock}</small>
                </div>
              </Col>
            </Row>
            {vaccine.stockNeeded > 0 && (
              <div className="stock-alert mt-2 text-start">
                <ProgressBar 
                  variant="warning" 
                  now={Math.min((vaccine.currentStock / vaccine.expectedDemand) * 100, 100)} 
                  size="sm"
                />
                <small className="text-warning">
                  Need {vaccine.stockNeeded} more units (next {vaccine.forecastDays || 7} days)
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
            onClick={fetchWeatherData}
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
            <span>Weather-Based Healthcare Forecasting - Pasig City</span>
          </div>
          <div className="d-flex align-items-center">
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={fetchWeatherData}
              disabled={loading}
              className="me-2"
            >
              <i className="bi bi-arrow-clockwise"></i>
            </Button>
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Real-time weather data with 7-day healthcare forecasting using PAGASA and other reliable sources</Tooltip>}
            >
              <i className="bi bi-info-circle text-muted"></i>
            </OverlayTrigger>
          </div>
        </div>
      </Card.Header>
      <Card.Body className="widget-body text-start">
        {loading && (
          <div className="text-center py-4">
            <Spinner animation="border" size="sm" className="me-2" />
            Loading weather and health data...
          </div>
        )}

        {error && (
          <Alert variant="warning" className="mb-3">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}

        {weatherData && !loading && (
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3"
          >
            <Tab eventKey="current" title="Current Weather">
              {renderWeatherSummary()}
              {renderUrgentAlerts()}
              {renderWeatherAlerts()}
            </Tab>
            
            <Tab eventKey="forecast" title="7-Day Forecast">
              {renderWeeklyForecast()}
              {renderWeatherTrends()}
              {renderHealthImplications()}
            </Tab>
            
            <Tab eventKey="medications" title="Medication Planning">
              <div className="recommendations-section">
                <h6 className="section-title">
                  <i className="bi bi-capsule me-2"></i>
                  Recommended Medications
                </h6>
                {renderMedicationRecommendations()}
              </div>

              {medicationData?.immediateRecommendations?.length > 3 && (
                <div className="text-center mt-3">
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => setShowDetails(!showDetails)}
                  >
                    {showDetails ? 'Show Less' : `View All ${medicationData.immediateRecommendations.length} Recommendations`}
                  </Button>
                </div>
              )}

              {showDetails && medicationData?.immediateRecommendations?.length > 3 && (
                <div className="additional-recommendations mt-3 text-start">
                  <ListGroup variant="flush">
                    {medicationData.immediateRecommendations.slice(3).map((med, index) => (
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
            </Tab>
            
            <Tab eventKey="vaccines" title="Vaccine Planning">
              <div className="recommendations-section">
                <h6 className="section-title">
                  <i className="bi bi-shield-check me-2"></i>
                  Wet Season Vaccine Recommendations
                </h6>
                {renderVaccineRecommendations()}
              </div>

              {vaccineData?.wetSeasonVaccines?.length > 3 && !weatherData?.showMinimalRecommendations && (
                <div className="text-center mt-3">
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => setShowVaccineDetails(!showVaccineDetails)}
                  >
                    {showVaccineDetails ? 'Show Less' : `View All ${vaccineData.wetSeasonVaccines.length} Vaccines`}
                  </Button>
                </div>
              )}

              {showVaccineDetails && vaccineData?.wetSeasonVaccines?.length > 3 && !weatherData?.showMinimalRecommendations && (
                <div className="additional-recommendations mt-3 text-start">
                  <ListGroup variant="flush">
                    {vaccineData.wetSeasonVaccines.slice(3).map((vaccine, index) => (
                      <ListGroup.Item key={index + 3} className="medication-item-compact text-start">
                        <Row className="align-items-center">
                          <Col xs={9}>
                            <div className="med-name-compact">{vaccine.name}</div>
                            <small className="text-muted">{vaccine.type}</small>
                          </Col>
                          <Col xs={3} className="text-end">
                            <Badge variant={getPriorityBadgeVariant(vaccine.priority)} size="sm">
                              {vaccine.priority}
                            </Badge>
                          </Col>
                        </Row>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </div>
              )}

              {vaccineData?.lastUpdated && (
                <div className="mt-3 text-center">
                  <small className="text-muted">
                    <i className="bi bi-clock me-1"></i>
                    Vaccine inventory updated: {new Date(vaccineData.lastUpdated).toLocaleString()}
                    {vaccineData.nextUpdate && (
                      <span className="ms-2">
                        | Next update: {new Date(vaccineData.nextUpdate).toLocaleString()}
                      </span>
                    )}
                  </small>
                </div>
              )}
            </Tab>
          </Tabs>
        )}

        <div className="widget-footer mt-3">
          <Row>
            <Col xs={12} className="text-center">
              <small className="text-muted">
                <i className="bi bi-clock me-1"></i>
                {weatherData?.lastUpdated ? 
                  `Updated: ${new Date(weatherData.lastUpdated).toLocaleString()}` :
                  'Loading...'
                }
                {weatherData?.nextUpdate && (
                  <span className="ms-2">
                    | Next update: {new Date(weatherData.nextUpdate).toLocaleTimeString()}
                  </span>
                )}
              </small>
            </Col>
          </Row>
        </div>
      </Card.Body>
    </Card>
  );
};

export default WeatherPrescriptionWidget;