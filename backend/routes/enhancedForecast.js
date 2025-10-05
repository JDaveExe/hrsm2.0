/**
 * Enhanced Forecasting API Routes
 * Uses real healthcare data with advanced forecasting methods
 */

const express = require('express');
const router = express.Router();
const EnhancedHealthForecasting = require('../services/enhancedHealthForecasting');
const HealthcareDataCollector = require('../services/healthcareDataCollector');
const { authenticateToken: auth } = require('../middleware/auth');

const forecasting = new EnhancedHealthForecasting();
const dataCollector = new HealthcareDataCollector();

/**
 * GET /api/forecast/comprehensive
 * Get comprehensive healthcare forecast using multiple models
 */
router.get('/comprehensive', async (req, res) => {
  try {
    const {
      days = 30,
      includeResources = true,
      includeRisk = true,
      modelPreference = 'auto'
    } = req.query;

    const comprehensiveForecast = await forecasting.generateComprehensiveForecast({
      forecastDays: parseInt(days),
      includeResourcePlanning: includeResources === 'true',
      includeRiskAssessment: includeRisk === 'true',
      modelPreference: modelPreference
    });

    res.json({
      success: true,
      data: comprehensiveForecast
    });

  } catch (error) {
    console.error('Error generating comprehensive forecast:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating comprehensive forecast',
      error: error.message
    });
  }
});

/**
 * GET /api/forecast/patient-volume
 * Get patient volume forecasting with model comparison
 */
router.get('/patient-volume', async (req, res) => {
  try {
    const { days = 30, models = 'auto' } = req.query;

    const patientData = await dataCollector.getPatientVisitPatterns(90);
    const selectedModels = models === 'auto' ? 
      forecasting.selectOptimalModels(patientData) : 
      models.split(',');

    const forecasts = {};
    for (const modelName of selectedModels) {
      try {
        forecasts[modelName] = await forecasting.generateModelForecast(
          modelName, 
          patientData, 
          null, 
          parseInt(days)
        );
      } catch (modelError) {
        console.warn(`Model ${modelName} failed:`, modelError.message);
      }
    }

    // Create ensemble if multiple models
    const ensembleForecast = Object.keys(forecasts).length > 1 ? 
      forecasting.createEnsembleForecast(forecasts) : null;

    res.json({
      success: true,
      data: {
        metadata: {
          forecastPeriod: parseInt(days),
          dataQuality: patientData.metadata.realDataQuality,
          reliability: patientData.metadata.forecastReliability,
          realDataPoints: patientData.real.checkups + patientData.real.appointments,
          modelsUsed: selectedModels
        },
        forecasts: forecasts,
        ensemble: ensembleForecast,
        dataSource: {
          realCheckups: patientData.real.checkups,
          realAppointments: patientData.real.appointments,
          patterns: patientData.patterns
        }
      }
    });

  } catch (error) {
    console.error('Error in patient volume forecasting:', error);
    res.status(500).json({
      success: false,
      message: 'Error forecasting patient volume',
      error: error.message
    });
  }
});

/**
 * GET /api/forecast/resource-planning
 * Get resource usage forecasting and planning recommendations
 */
router.get('/resource-planning', async (req, res) => {
  try {
    const { days = 30, resourceType = 'all' } = req.query;

    const resourceData = await dataCollector.getResourceUsagePatterns(60);
    const resourceForecasts = await forecasting.generateResourceForecasts(resourceData, parseInt(days));

    // Filter by resource type if specified
    const filteredForecasts = resourceType === 'all' ? 
      resourceForecasts : 
      { [resourceType]: resourceForecasts[resourceType] };

    res.json({
      success: true,
      data: {
        resourceForecasts: filteredForecasts,
        currentUsage: resourceData.realUsage,
        patterns: resourceData.patterns,
        projections: resourceData.projections,
        recommendations: forecasting.generateResourceRecommendations('general', 2, parseInt(days))
      }
    });

  } catch (error) {
    console.error('Error in resource planning:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating resource planning',
      error: error.message
    });
  }
});

/**
 * GET /api/forecast/health-trends
 * Get health trend analysis and disease risk assessment
 */
router.get('/health-trends', async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const healthTrends = await dataCollector.getHealthTrendPatterns(parseInt(days));
    const riskAssessment = forecasting.generateRiskAssessment(healthTrends, parseInt(days));

    res.json({
      success: true,
      data: {
        healthTrends: healthTrends,
        riskAssessment: riskAssessment,
        earlyWarnings: healthTrends.earlyWarningSignals || [],
        recommendations: riskAssessment.recommendations || []
      }
    });

  } catch (error) {
    console.error('Error in health trends analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing health trends',
      error: error.message
    });
  }
});

/**
 * GET /api/forecast/dashboard-summary
 * Enhanced dashboard summary with real data and multiple models
 */
router.get('/dashboard-summary', async (req, res) => {
  try {
    // Get quick comprehensive forecast
    const comprehensiveForecast = await forecasting.generateComprehensiveForecast({
      forecastDays: 14, // 2-week forecast for dashboard
      includeResourcePlanning: true,
      includeRiskAssessment: true,
      modelPreference: 'auto'
    });

    // Extract key metrics for dashboard
    const dashboardData = {
      // Current season and risk factors
      season: {
        current: getCurrentSeason(),
        riskLevel: comprehensiveForecast.riskAssessment?.overallRisk || 'low',
        description: getSeasonDescription()
      },

      // Patient volume forecasting
      patientVolumeForecast: {
        models: comprehensiveForecast.patientVolumeForecast.models,
        ensemble: comprehensiveForecast.patientVolumeForecast.ensemble,
        trend: comprehensiveForecast.patientVolumeForecast.currentTrend,
        confidence: comprehensiveForecast.metadata.reliability
      },

      // Resource forecasts
      resourceForecasts: comprehensiveForecast.resourceForecasts || {},

      // Risk assessment
      riskAssessment: comprehensiveForecast.riskAssessment || {},

      // Alerts and insights
      alerts: extractAlertsFromInsights(comprehensiveForecast.insights || []),
      insights: comprehensiveForecast.insights || [],

      // Model performance
      modelPerformance: comprehensiveForecast.performance || {},

      // Recommendations
      recommendations: comprehensiveForecast.recommendations || [],

      // Metadata
      metadata: {
        ...comprehensiveForecast.metadata,
        lastUpdated: new Date().toISOString(),
        forecastAccuracy: calculateOverallAccuracy(comprehensiveForecast),
        dataFreshness: calculateDataFreshness(comprehensiveForecast.metadata)
      }
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Error generating enhanced dashboard summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating dashboard summary',
      error: error.message
    });
  }
});

/**
 * GET /api/forecast/model-comparison
 * Compare different forecasting models performance
 */
router.get('/model-comparison', async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const patientData = await dataCollector.getPatientVisitPatterns(90);
    const allModels = ['simpleMovingAverage', 'exponentialSmoothing', 'linearRegression', 'seasonalDecomposition'];
    
    const modelComparison = {};
    const modelMetrics = {};

    for (const modelName of allModels) {
      try {
        const forecast = await forecasting.generateModelForecast(
          modelName, 
          patientData, 
          null, 
          parseInt(days)
        );
        
        modelComparison[modelName] = forecast;
        modelMetrics[modelName] = {
          accuracy: forecast.accuracy,
          reliability: forecast.reliability,
          dataRequirements: forecasting.models[modelName]?.bestForDataSize,
          suitability: forecasting.getSuitabilityRecommendation(modelName, patientData),
          computationComplexity: getComputationComplexity(modelName)
        };
      } catch (modelError) {
        modelMetrics[modelName] = {
          error: modelError.message,
          status: 'failed'
        };
      }
    }

    // Generate ensemble forecast
    const validModels = Object.fromEntries(
      Object.entries(modelComparison).filter(([_, forecast]) => forecast.forecasts)
    );
    
    const ensembleForecast = Object.keys(validModels).length > 1 ? 
      forecasting.createEnsembleForecast(validModels) : null;

    res.json({
      success: true,
      data: {
        models: modelComparison,
        ensemble: ensembleForecast,
        metrics: modelMetrics,
        recommendations: generateModelRecommendations(modelMetrics, patientData),
        dataQuality: patientData.metadata.realDataQuality
      }
    });

  } catch (error) {
    console.error('Error in model comparison:', error);
    res.status(500).json({
      success: false,
      message: 'Error comparing forecasting models',
      error: error.message
    });
  }
});

/**
 * POST /api/forecast/validate-model
 * Validate forecasting model accuracy (when sufficient historical data available)
 */
router.post('/validate-model', async (req, res) => {
  try {
    const { modelName, validationPeriod = 7 } = req.body;

    const patientData = await dataCollector.getPatientVisitPatterns(90);
    
    if (patientData.real.dataPoints.length < validationPeriod + 7) {
      return res.json({
        success: true,
        data: {
          validation: 'insufficient_data',
          message: 'Not enough historical data for validation',
          requiredDataPoints: validationPeriod + 7,
          availableDataPoints: patientData.real.dataPoints.length
        }
      });
    }

    // Split data for validation
    const trainingData = patientData.real.dataPoints.slice(0, -validationPeriod);
    const validationData = patientData.real.dataPoints.slice(-validationPeriod);

    // Generate forecast using training data
    const trainingPatientData = { ...patientData, real: { ...patientData.real, dataPoints: trainingData } };
    const forecast = await forecasting.generateModelForecast(
      modelName, 
      trainingPatientData, 
      null, 
      validationPeriod
    );

    // Calculate validation metrics
    const validationMetrics = calculateValidationMetrics(forecast, validationData);

    res.json({
      success: true,
      data: {
        model: modelName,
        validationPeriod: validationPeriod,
        forecast: forecast,
        actualData: validationData,
        metrics: validationMetrics,
        recommendation: getValidationRecommendation(validationMetrics)
      }
    });

  } catch (error) {
    console.error('Error validating model:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating forecasting model',
      error: error.message
    });
  }
});

// Helper functions
function getCurrentSeason() {
  const currentMonth = new Date().getMonth() + 1;
  const wetSeason = [6, 7, 8, 9, 10, 11];
  return wetSeason.includes(currentMonth) ? 'wet' : 'dry';
}

function getSeasonDescription() {
  const season = getCurrentSeason();
  return season === 'wet' ? 
    'Typhoon season - increased risk for communicable diseases' :
    'Dry season - normal disease patterns expected';
}

function extractAlertsFromInsights(insights) {
  return insights
    .filter(insight => insight.priority === 'high')
    .map(insight => ({
      type: insight.type,
      level: insight.priority,
      message: insight.message,
      action: insight.action
    }));
}

function calculateOverallAccuracy(forecast) {
  const models = forecast.patientVolumeForecast?.models || {};
  const accuracies = Object.values(models).map(model => model.accuracy || 0.6);
  
  if (accuracies.length === 0) return 0.6;
  
  const average = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
  return Math.round(average * 100) / 100;
}

function calculateDataFreshness(metadata) {
  const realDataPoints = metadata.realDataPoints || 0;
  if (realDataPoints === 0) return 'no_real_data';
  if (realDataPoints < 5) return 'limited';
  if (realDataPoints < 20) return 'moderate';
  return 'good';
}

function getComputationComplexity(modelName) {
  const complexity = {
    'simpleMovingAverage': 'low',
    'exponentialSmoothing': 'low',
    'linearRegression': 'medium',
    'seasonalDecomposition': 'high'
  };
  return complexity[modelName] || 'medium';
}

function generateModelRecommendations(modelMetrics, patientData) {
  const recommendations = [];
  const dataPoints = patientData.real.dataPoints.length;

  if (dataPoints < 10) {
    recommendations.push({
      type: 'data_collection',
      message: 'Collect more historical data to improve forecasting accuracy',
      priority: 'high'
    });
  }

  // Find best performing model
  const validModels = Object.entries(modelMetrics).filter(([_, metrics]) => !metrics.error);
  if (validModels.length > 0) {
    const bestModel = validModels.reduce((best, [name, metrics]) => 
      (metrics.accuracy || 0) > (best[1].accuracy || 0) ? [name, metrics] : best
    );
    
    recommendations.push({
      type: 'model_selection',
      message: `${bestModel[0]} shows best performance for current data`,
      priority: 'medium'
    });
  }

  return recommendations;
}

function calculateValidationMetrics(forecast, actualData) {
  const forecasts = forecast.forecasts.map(f => f.forecast);
  const actual = actualData.map(point => 1); // Simplified for now
  
  // Mean Absolute Percentage Error (MAPE)
  let mape = 0;
  let mse = 0; // Mean Squared Error
  
  for (let i = 0; i < Math.min(forecasts.length, actual.length); i++) {
    const error = Math.abs(actual[i] - forecasts[i]);
    mape += error / Math.max(actual[i], 1) * 100;
    mse += Math.pow(error, 2);
  }
  
  mape /= Math.min(forecasts.length, actual.length);
  mse /= Math.min(forecasts.length, actual.length);
  
  return {
    mape: Math.round(mape * 100) / 100,
    rmse: Math.round(Math.sqrt(mse) * 100) / 100,
    accuracy: Math.max(0, 100 - mape),
    samples: Math.min(forecasts.length, actual.length)
  };
}

function getValidationRecommendation(metrics) {
  const accuracy = metrics.accuracy;
  
  if (accuracy >= 80) return 'Excellent model performance - recommended for production use';
  if (accuracy >= 60) return 'Good model performance - suitable for planning with monitoring';
  if (accuracy >= 40) return 'Moderate performance - use with caution and supplement with expert judgment';
  return 'Poor performance - consider alternative models or data collection improvements';
}

module.exports = router;