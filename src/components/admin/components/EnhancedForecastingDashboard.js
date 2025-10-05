import React, { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Alert, Spinner, Badge, Button, Modal, ButtonGroup } from 'react-bootstrap';
import enhancedForecastingService, { enhancedForecastHelpers } from '../../../services/enhancedForecastingService';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import WeatherPrescriptionWidget from './WeatherPrescriptionWidget';
import '../styles/EnhancedForecastingDashboard.css';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const EnhancedForecastingDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedModel, setSelectedModel] = useState('ensemble');
  const [forecastPeriod, setForecastPeriod] = useState(14);
  const [showModelDetails, setShowModelDetails] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Load enhanced forecasting data
  const loadForecastingData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await enhancedForecastingService.getPatientVolumeForecast(forecastPeriod, 'auto');
      setDashboardData(data.data);
      setLastUpdated(new Date().toLocaleString());
    } catch (err) {
      console.error('Error loading enhanced forecasting data:', err);
      setError('Failed to load forecasting data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForecastingData();
  }, [forecastPeriod]);

  // Get best available model for display
  const getBestModel = () => {
    if (!dashboardData?.forecasts) return null;
    
    if (dashboardData.ensemble) return { ...dashboardData.ensemble, name: 'ensemble' };
    
    const models = Object.entries(dashboardData.forecasts);
    if (models.length === 0) return null;
    
    // Find model with highest accuracy
    const bestModel = models.reduce((best, [name, model]) => 
      (model.accuracy || 0) > (best[1].accuracy || 0) ? [name, model] : best
    );
    
    return { ...bestModel[1], name: bestModel[0] };
  };

  // Prepare chart data for forecasting visualization
  const prepareForecastChart = () => {
    const model = getBestModel();
    if (!model?.forecasts) return null;

    const labels = model.forecasts.map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() + index + 1);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const forecastData = model.forecasts.map(f => f.forecast);
    const confidenceUpper = model.forecasts.map(f => {
      const range = enhancedForecastHelpers.calculateForecastRange(f.forecast, dashboardData.metadata);
      return range.upper;
    });
    const confidenceLower = model.forecasts.map(f => {
      const range = enhancedForecastHelpers.calculateForecastRange(f.forecast, dashboardData.metadata);
      return range.lower;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Forecasted Patients',
          data: forecastData,
          borderColor: '#007bff',
          backgroundColor: 'rgba(0, 123, 255, 0.1)',
          fill: false,
          tension: 0.4,
          pointRadius: 6,
          pointHoverRadius: 8,
          borderWidth: 3
        },
        {
          label: 'Upper Confidence (95%)',
          data: confidenceUpper,
          borderColor: 'rgba(0, 123, 255, 0.3)',
          backgroundColor: 'transparent',
          fill: '+1',
          tension: 0.4,
          pointRadius: 0,
          borderDash: [5, 5],
          borderWidth: 1
        },
        {
          label: 'Lower Confidence (95%)',
          data: confidenceLower,
          borderColor: 'rgba(0, 123, 255, 0.3)',
          backgroundColor: 'rgba(0, 123, 255, 0.1)',
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          borderDash: [5, 5],
          borderWidth: 1
        }
      ]
    };
  };

  // Prepare model comparison chart
  const prepareModelComparisonChart = () => {
    if (!dashboardData?.forecasts) return null;

    const models = Object.entries(dashboardData.forecasts);
    const modelNames = models.map(([name]) => enhancedForecastHelpers.getModelDescription(name).shortName);
    const accuracies = models.map(([, model]) => (model.accuracy || 0) * 100);
    const reliabilityScores = models.map(([, model]) => {
      const reliability = model.reliability || 'medium';
      const scores = { excellent: 100, good: 80, medium: 60, low: 40, very_low: 20 };
      return scores[reliability] || 60;
    });

    return {
      labels: modelNames,
      datasets: [
        {
          label: 'Accuracy (%)',
          data: accuracies,
          backgroundColor: 'rgba(40, 167, 69, 0.8)',
          borderColor: 'rgba(40, 167, 69, 1)',
          borderWidth: 2
        },
        {
          label: 'Reliability Score',
          data: reliabilityScores,
          backgroundColor: 'rgba(23, 162, 184, 0.8)',
          borderColor: 'rgba(23, 162, 184, 1)',
          borderWidth: 2
        }
      ]
    };
  };

  if (loading) {
    return (
      <div className="enhanced-forecasting-dashboard">
        <div className="text-center p-5">
          <Spinner animation="border" size="lg" className="mb-3" style={{ color: '#007bff' }} />
          <h5 className="text-dark">Loading Advanced Forecasting Models...</h5>
          <p className="text-muted">Analyzing patient data and generating predictions</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="enhanced-forecasting-dashboard">
        <Alert variant="danger" className="mb-4">
          <Alert.Heading>
            <i className="bi bi-exclamation-triangle me-2"></i>
            Enhanced Forecasting System Error
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

  const bestModel = getBestModel();
  const dataQuality = enhancedForecastHelpers.getDataQualityInfo(dashboardData.metadata?.dataQuality);
  const warnings = enhancedForecastHelpers.checkForecastWarnings(dashboardData);

  return (
    <div className="enhanced-forecasting-dashboard">
      {/* Data Quality & Warnings */}
      {warnings.hasWarnings && (
        <Alert variant={warnings.highestLevel} className="mb-3 py-2">
          <div className="d-flex align-items-center">
            <i className="bi bi-info-circle-fill me-2"></i>
            <span className="small">
              <strong>Forecast Information:</strong> {warnings.warnings.map(w => w.message).join(', ')}
            </span>
          </div>
        </Alert>
      )}

      {/* Filter Buttons and Controls */}
      {activeTab === 'overview' && (
        <div className="d-flex justify-content-between align-items-center mb-4">
          <ButtonGroup size="sm">
            <Button 
              variant={activeTab === 'overview' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveTab('overview')}
            >
              <i className="bi bi-house me-1"></i>
              Overview
            </Button>
            <Button 
              variant={activeTab === 'weather-prescriptions' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveTab('weather-prescriptions')}
            >
              <i className="bi bi-cloud-rain me-1"></i>
              Weather-Based Prescriptions
            </Button>
            <Button 
              variant={activeTab === 'quality' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveTab('quality')}
            >
              <i className="bi bi-clipboard-data me-1"></i>
              Data Quality
            </Button>
            <Button 
              variant={activeTab === 'comparison' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveTab('comparison')}
            >
              <i className="bi bi-bar-chart me-1"></i>
              Model Comparison
            </Button>
          </ButtonGroup>
          
          <div className="d-flex gap-2">
            <ButtonGroup size="sm">
              <Button 
                variant={forecastPeriod === 7 ? "primary" : "outline-primary"}
                onClick={() => setForecastPeriod(7)}
              >
                7 Days
              </Button>
              <Button 
                variant={forecastPeriod === 14 ? "primary" : "outline-primary"}
                onClick={() => setForecastPeriod(14)}
              >
                14 Days
              </Button>
              <Button 
                variant={forecastPeriod === 30 ? "primary" : "outline-primary"}
                onClick={() => setForecastPeriod(30)}
              >
                30 Days
              </Button>
            </ButtonGroup>
            <Button variant="outline-primary" size="sm" onClick={loadForecastingData}>
              <i className="bi bi-arrow-clockwise me-1"></i>
              Refresh
            </Button>
          </div>
        </div>
      )}
      
      {/* Tab Navigation for Non-Overview Tabs */}
      {activeTab !== 'overview' && (
        <div className="d-flex justify-content-between align-items-center mb-4">
          <ButtonGroup size="sm">
            <Button 
              variant={activeTab === 'overview' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveTab('overview')}
            >
              <i className="bi bi-house me-1"></i>
              Overview
            </Button>
            <Button 
              variant={activeTab === 'weather-prescriptions' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveTab('weather-prescriptions')}
            >
              <i className="bi bi-cloud-rain me-1"></i>
              Weather-Based Prescriptions
            </Button>
            <Button 
              variant={activeTab === 'quality' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveTab('quality')}
            >
              <i className="bi bi-clipboard-data me-1"></i>
              Data Quality
            </Button>
            <Button 
              variant={activeTab === 'comparison' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveTab('comparison')}
            >
              <i className="bi bi-bar-chart me-1"></i>
              Model Comparison
            </Button>
          </ButtonGroup>
          
          <div className="d-flex gap-2">
            <Button variant="outline-primary" size="sm" onClick={loadForecastingData}>
              <i className="bi bi-arrow-clockwise me-1"></i>
              Refresh
            </Button>
          </div>
        </div>
      )}

      {/* Overview Content */}
      {activeTab === 'overview' && (
        <>
          <Row className="mb-3">
            {/* Key Metrics Cards - Reduced size */}
            <Col lg={3} xl={2} className="mb-3">
              <Card className="h-100 metric-card-small">
                <Card.Body className="text-center p-3">
                  <div className="metric-icon-small mb-2">
                    <i className="bi bi-people-fill text-primary"></i>
                  </div>
                  <h5 className="metric-value-small text-dark fw-bold">
                    {bestModel?.forecasts ? Math.round(bestModel.forecasts.reduce((sum, f) => sum + f.forecast, 0) / bestModel.forecasts.length) : 0}
                  </h5>
                  <p className="metric-label-small text-dark mb-1">Avg Daily Patients</p>
                  <small className="text-muted">Next {forecastPeriod} days</small>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} xl={2} className="mb-3">
              <Card className="h-100 metric-card-small">
                <Card.Body className="text-center p-3">
                  <div className="metric-icon-small mb-2">
                    <i className="bi bi-graph-up text-success"></i>
                  </div>
                  <h5 className="metric-value-small text-dark fw-bold">
                    {bestModel?.accuracy ? Math.round(bestModel.accuracy * 100) : 60}%
                  </h5>
                  <p className="metric-label-small text-dark mb-1">Model Accuracy</p>
                  <small className="text-muted">{bestModel?.model || 'Forecasting Model'}</small>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} xl={2} className="mb-3">
              <Card className="h-100 metric-card-small">
                <Card.Body className="text-center p-3">
                  <div className="metric-icon-small mb-2">
                    <i className="bi bi-database text-info"></i>
                  </div>
                  <h5 className="metric-value-small text-dark fw-bold">
                    {dashboardData.metadata?.realDataPoints || 0}
                  </h5>
                  <p className="metric-label-small text-dark mb-1">Real Data Points</p>
                  <Badge bg={dataQuality.color} className="mt-1">{dataQuality.text}</Badge>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} xl={2} className="mb-3">
              <Card className="h-100 metric-card-small">
                <Card.Body className="text-center p-3">
                  <div className="metric-icon-small mb-2">
                    <i className="bi bi-shield-check text-warning"></i>
                  </div>
                  <h5 className="metric-value-small text-dark fw-bold">
                    {enhancedForecastHelpers.formatReliability(dashboardData.metadata?.reliability).text}
                  </h5>
                  <p className="metric-label-small text-dark mb-1">Forecast Reliability</p>
                  <small className="text-muted">Based on data quality</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Forecast Alert - made more compact */}
          <Row className="mb-3">
            <Col lg={12} className="mb-3">
              <Alert variant="info" className="forecast-alert-compact">
                <div className="d-flex align-items-center">
                  <i className="bi bi-info-circle-fill me-2"></i>
                  <span>
                    <strong>Forecast Insight:</strong> Based on {dashboardData.metadata?.realDataPoints || 0} real data points, 
                    expecting {bestModel?.forecasts ? Math.round(bestModel.forecasts.reduce((sum, f) => sum + f.forecast, 0) / bestModel.forecasts.length) : 0} avg daily patients 
                    with {bestModel?.accuracy ? Math.round(bestModel.accuracy * 100) : 60}% model accuracy over next {forecastPeriod} days.
                  </span>
                </div>
              </Alert>
            </Col>
          </Row>

          {/* Main Forecast Chart - Increased size */}
          <Row>
            <Col lg={12} className="mb-4">
              <Card className="forecast-chart-card">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-0 text-dark">
                      <i className="bi bi-graph-up me-2"></i>
                      {forecastPeriod}-Day Patient Volume Forecast • 95% Confidence Interval
                    </h6>
                    <small className="text-muted">
                      {bestModel?.model || 'Forecasting Model'} 
                    </small>
                  </div>
                  <Badge bg="primary" className="px-3 py-2">
                    {bestModel?.name === 'ensemble' ? 'Ensemble Model' : bestModel?.model}
                  </Badge>
                </Card.Header>
                <Card.Body style={{ height: '450px' }}>
                  {prepareForecastChart() ? (
                    <Line
                      data={prepareForecastChart()}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { 
                            position: 'top',
                            labels: { usePointStyle: true, padding: 20 }
                          },
                          tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                              label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y} patients`;
                              }
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: { display: true, text: 'Number of Patients' },
                            ticks: { stepSize: 1 }
                          },
                          x: {
                            title: { display: true, text: 'Date' }
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
                    <div className="d-flex align-items-center justify-content-center h-100">
                      <div className="text-center text-muted">
                        <i className="bi bi-graph-up display-4 mb-3"></i>
                        <h6>No forecast data available</h6>
                        <p>Try refreshing or check data connectivity</p>
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* Weather-Based Prescriptions Content */}
      {activeTab === 'weather-prescriptions' && (
        <>
          <Row className="mb-4">
            <Col xs={12}>
              <Card className="weather-prescriptions-header-card">
                <Card.Body className="p-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <div className="weather-icon-large me-3">
                        🌧️
                      </div>
                      <div className="text-start">
                        <h5 className="mb-1 text-dark">Weather-Based Prescription Forecasting</h5>
                        <p className="mb-0 text-muted">
                          <i className="bi bi-geo-alt me-1"></i>
                          Pasig City, Metro Manila • Wet Season Monitoring
                        </p>
                      </div>
                    </div>
                    <Badge bg="info" className="fs-6">
                      <i className="bi bi-cloud-rain me-1"></i>
                      October 2025
                    </Badge>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            {/* Weather Prescription Widget - Full Width */}
            <Col lg={8} className="mb-4">
              <WeatherPrescriptionWidget />
            </Col>
            
            {/* Weather Info Sidebar */}
            <Col lg={4} className="mb-4">
              <Card className="h-100 weather-info-card">
                <Card.Header>
                  <h6 className="mb-0 text-dark text-start">
                    <i className="bi bi-info-circle me-2"></i>
                    Wet Season Information
                  </h6>
                </Card.Header>
                <Card.Body>
                  <div className="weather-info-item mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <i className="bi bi-calendar3 text-primary me-2"></i>
                      <strong className="text-start">Current Period</strong>
                    </div>
                    <p className="text-muted mb-0 text-start">October 2025 - Peak Typhoon Season</p>
                  </div>
                  
                  <div className="weather-info-item mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <i className="bi bi-droplet text-info me-2"></i>
                      <strong className="text-start">Wet Season Status</strong>
                    </div>
                    <div className="text-start">
                      <Badge bg="warning" className="mb-2">Active</Badge>
                      <p className="text-muted mb-0 small">June - November period</p>
                    </div>
                  </div>

                  <div className="weather-info-item mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <i className="bi bi-exclamation-triangle text-warning me-2"></i>
                      <strong className="text-start">Common Health Issues</strong>
                    </div>
                    <ul className="list-unstyled mb-0 small text-start">
                      <li>• Acute respiratory infections (ARI)</li>
                      <li>• Dengue fever</li>
                      <li>• Diarrheal diseases</li>
                      <li>• Skin fungal infections</li>
                      <li>• Hypertension complications</li>
                      <li>• Pneumonia</li>
                    </ul>
                  </div>

                  <div className="weather-info-item">
                    <div className="d-flex align-items-center mb-2">
                      <i className="bi bi-capsule text-success me-2"></i>
                      <strong className="text-start">Key Medications</strong>
                    </div>
                    <div className="d-flex flex-wrap gap-1 justify-content-start mb-0">
                      <Badge bg="secondary" className="small">Ambroxol (Mucosolvan) 30mg tablet</Badge>
                      <Badge bg="secondary" className="small">Salbutamol (Ventolin) 2mg syrup</Badge>
                      <Badge bg="secondary" className="small">Clotrimazole (Canesten) 1% cream</Badge>
                      <Badge bg="secondary" className="small">ORS powder sachets</Badge>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            {/* Seasonal Trends Chart */}
            <Col lg={12} className="mb-4">
              <Card>
                <Card.Header>
                  <h6 className="mb-0 text-dark text-start">
                    <i className="bi bi-graph-up me-2"></i>
                    Seasonal Medication Demand Trends
                  </h6>
                  <small className="text-muted text-start">Expected medication demand increases during wet season</small>
                </Card.Header>
                <Card.Body style={{ height: '300px' }}>
                  {(() => {
                    // Generate dynamic seasonal data based on current date and patient volume
                    const currentDate = new Date();
                    const currentMonth = currentDate.getMonth(); // 0-11 (0=Jan, 9=Oct)
                    const wetSeasonMonths = [5, 6, 7, 8, 9, 10]; // June(5) to November(10) in JS (0-based)
                    
                    // Create dynamic month labels based on current date
                    const labels = [];
                    const respiratoryData = [];
                    const antifungalData = [];
                    const gastrointestinalData = [];
                    
                    // Show 6 months: current month and 5 months around it
                    let startMonth;
                    if (currentMonth >= 9) { // Oct, Nov, Dec - show Jun-Nov
                      startMonth = 5; // Start from June
                    } else if (currentMonth <= 2) { // Jan, Feb, Mar - show Dec-May
                      startMonth = 11; // Start from previous December
                    } else { // Apr-Sep - show current wet season
                      startMonth = 5; // Start from June
                    }
                    
                    for (let i = 0; i < 6; i++) {
                      const monthIndex = (startMonth + i) % 12;
                      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      const monthName = monthNames[monthIndex];
                      labels.push(monthName);
                      
                      // Calculate demand based on wet season multipliers and actual patient volume
                      const isWetSeasonMonth = wetSeasonMonths.includes(monthIndex);
                      const patientsPerDay = isWetSeasonMonth ? 100 : 65; // Updated patient volume
                      const prescriptionPatients = Math.round(patientsPerDay * 0.7); // 70% need prescriptions
                      
                      // Respiratory medications (12% prescription rate, 1.8x wet season multiplier)
                      const respiratoryBaseline = prescriptionPatients * 0.12 * 7; // weekly demand
                      const respiratoryDemand = isWetSeasonMonth ? respiratoryBaseline * 1.8 : respiratoryBaseline;
                      respiratoryData.push(Math.round(respiratoryDemand));
                      
                      // Antifungal medications (6% prescription rate, 2.5x wet season multiplier) 
                      const antifungalBaseline = prescriptionPatients * 0.06 * 7; // weekly demand
                      const antifungalDemand = isWetSeasonMonth ? antifungalBaseline * 2.5 : antifungalBaseline;
                      antifungalData.push(Math.round(antifungalDemand));
                      
                      // Gastrointestinal medications (increased during floods/contaminated water)
                      const gastrointestinalBaseline = prescriptionPatients * 0.10 * 7; // weekly demand
                      const gastrointestinalDemand = isWetSeasonMonth ? gastrointestinalBaseline * 1.8 : gastrointestinalBaseline;
                      gastrointestinalData.push(Math.round(gastrointestinalDemand));
                    }

                    const chartData = {
                      labels: labels,
                      datasets: [
                        {
                          label: 'Respiratory Meds',
                          data: respiratoryData,
                          borderColor: '#007bff',
                          backgroundColor: 'rgba(0, 123, 255, 0.1)',
                          fill: true
                        },
                        {
                          label: 'Antifungal Meds', 
                          data: antifungalData,
                          borderColor: '#28a745',
                          backgroundColor: 'rgba(40, 167, 69, 0.1)',
                          fill: true
                        },
                        {
                          label: 'Gastrointestinal Meds',
                          data: gastrointestinalData,
                          borderColor: '#dc3545',
                          backgroundColor: 'rgba(220, 53, 69, 0.1)',
                          fill: true
                        }
                      ]
                    };

                    const chartOptions = {
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top' },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              return `${context.dataset.label}: ${context.parsed.y} units/week`;
                            }
                          }
                        }
                      },
                      scales: {
                        y: { 
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Weekly Demand (units)'
                          }
                        },
                        x: {
                          title: {
                            display: true,
                            text: `${labels[0]} - ${labels[5]} ${new Date().getFullYear()} (Current: ${new Date().toLocaleDateString('en-US', { month: 'short' })})`
                          }
                        }
                      }
                    };

                    return <Line data={chartData} options={chartOptions} />;
                  })()}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* Model Comparison Content */}
      {activeTab === 'comparison' && (
        <Row>
          {/* Model Performance Chart */}
          <Col lg={8} className="mb-4">
            <Card className="h-100">
              <Card.Header>
                <h6 className="mb-0 text-dark">
                  <i className="bi bi-bar-chart me-2"></i>
                  Model Performance Comparison
                </h6>
                <small className="text-muted">Accuracy vs Reliability scores for each model</small>
              </Card.Header>
              <Card.Body style={{ height: '450px' }}>
                {prepareModelComparisonChart() ? (
                  <Bar
                    data={prepareModelComparisonChart()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top' },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}${context.dataset.label.includes('%') ? '' : '%'}`;
                            }
                          }
                        }
                      },
                      scales: {
                        y: { 
                          beginAtZero: true, 
                          max: 100,
                          title: { display: true, text: 'Score (%)' }
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                    <div className="text-center">
                      <i className="bi bi-bar-chart display-4 mb-3"></i>
                      <h6>No model comparison data</h6>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Model Details */}
          <Col lg={4} className="mb-4">
            <Card className="h-100">
              <Card.Header>
                <h6 className="mb-0 text-dark">
                  <i className="bi bi-info-circle me-2"></i>
                  Available Models
                </h6>
                <small className="text-muted">{dashboardData.metadata?.modelsUsed?.length || 0} active models</small>
              </Card.Header>
              <Card.Body>
                {dashboardData.metadata?.modelsUsed?.map((modelName) => {
                  const model = dashboardData.forecasts[modelName];
                  const modelInfo = enhancedForecastHelpers.getModelDescription(modelName);
                  const accuracy = enhancedForecastHelpers.formatAccuracy(model?.accuracy || 0.6);
                  const reliability = enhancedForecastHelpers.formatReliability(model?.reliability);
                  
                  return (
                    <div key={modelName} className="model-info-card mb-3 p-3 border rounded">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="mb-1 text-dark">{modelInfo.name}</h6>
                        <Badge bg={accuracy.color} className="ms-2">{accuracy.formatted}</Badge>
                      </div>
                      <p className="text-muted small mb-2">{modelInfo.description}</p>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          <i className={`bi bi-${reliability.icon} me-1`}></i>
                          {reliability.text}
                        </small>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => setShowModelDetails(modelName)}
                        >
                          Details
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Data Quality Content */}
      {activeTab === 'quality' && (
        <Row>
          <Col lg={6} className="mb-4">
            <Card className="h-100">
              <Card.Header>
                <h6 className="mb-0 text-dark">
                  <i className="bi bi-clipboard-data me-2"></i>
                  Data Quality Assessment
                </h6>
              </Card.Header>
              <Card.Body>
                <div className="data-quality-item mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-medium text-dark">Overall Quality</span>
                    <Badge bg={dataQuality.color} className="px-3 py-2">{dataQuality.text}</Badge>
                  </div>
                  <p className="text-muted small mb-0">{dataQuality.description}</p>
                </div>

                <div className="data-quality-item mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-medium text-dark">Real Data Points</span>
                    <span className="fw-bold text-primary">{dashboardData.metadata?.realDataPoints || 0}</span>
                  </div>
                  <div className="progress" style={{ height: '8px' }}>
                    <div 
                      className="progress-bar bg-primary" 
                      style={{ width: `${Math.min((dashboardData.metadata?.realDataPoints || 0) / 50 * 100, 100)}%` }}
                    ></div>
                  </div>
                  <small className="text-muted">Recommended: 50+ data points for excellent accuracy</small>
                </div>

                <div className="data-quality-item mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-medium text-dark">Forecast Reliability</span>
                    <Badge bg={enhancedForecastHelpers.formatReliability(dashboardData.metadata?.reliability).color}>
                      {enhancedForecastHelpers.formatReliability(dashboardData.metadata?.reliability).text}
                    </Badge>
                  </div>
                  <p className="text-muted small mb-0">
                    Based on data volume, recency, and consistency
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={6} className="mb-4">
            <Card className="h-100">
              <Card.Header>
                <h6 className="mb-0 text-dark">
                  <i className="bi bi-lightbulb me-2"></i>
                  Improvement Recommendations
                </h6>
              </Card.Header>
              <Card.Body>
                <div className="recommendation-list">
                  {dashboardData.metadata?.realDataPoints < 20 && (
                    <div className="recommendation-item mb-3 p-3 border-start border-warning border-3">
                      <h6 className="text-warning mb-2">
                        <i className="bi bi-collection me-2"></i>
                        Collect More Data
                      </h6>
                      <p className="small mb-0 text-dark">
                        Increase data collection to improve forecast accuracy. Current: {dashboardData.metadata?.realDataPoints}, Recommended: 20+
                      </p>
                    </div>
                  )}

                  {dashboardData.metadata?.modelsUsed?.length === 1 && (
                    <div className="recommendation-item mb-3 p-3 border-start border-info border-3">
                      <h6 className="text-info mb-2">
                        <i className="bi bi-cpu me-2"></i>
                        Enable Multiple Models
                      </h6>
                      <p className="small mb-0 text-dark">
                        With more data, ensemble forecasting will become available for improved accuracy.
                      </p>
                    </div>
                  )}

                  <div className="recommendation-item mb-3 p-3 border-start border-success border-3">
                    <h6 className="text-success mb-2">
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Regular Updates
                    </h6>
                    <p className="small mb-0 text-dark">
                      Forecasting models automatically improve as more patient data is collected over time.
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Model Details Modal */}
      <Modal show={showModelDetails !== null} onHide={() => setShowModelDetails(null)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-cpu me-2"></i>
            {showModelDetails && enhancedForecastHelpers.getModelDescription(showModelDetails).name} Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {showModelDetails && dashboardData.forecasts[showModelDetails] && (
            <div>
              <Row className="mb-4">
                <Col md={6}>
                  <h6 className="text-dark">Model Information</h6>
                  <p className="text-muted">
                    {enhancedForecastHelpers.getModelDescription(showModelDetails).description}
                  </p>
                  <div className="model-stats">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-dark">Accuracy:</span>
                      <span className="fw-bold text-primary">
                        {Math.round((dashboardData.forecasts[showModelDetails].accuracy || 0) * 100)}%
                      </span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-dark">Reliability:</span>
                      <Badge bg={enhancedForecastHelpers.formatReliability(dashboardData.forecasts[showModelDetails].reliability).color}>
                        {enhancedForecastHelpers.formatReliability(dashboardData.forecasts[showModelDetails].reliability).text}
                      </Badge>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <h6 className="text-dark">Model Type</h6>
                  <p className="text-muted">{enhancedForecastHelpers.getModelDescription(showModelDetails).name}</p>
                  <h6 className="text-dark">Best For</h6>
                  <p className="text-muted">{enhancedForecastHelpers.getModelDescription(showModelDetails).bestFor}</p>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModelDetails(null)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default EnhancedForecastingDashboard;