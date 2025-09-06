/**
 * Forecasting API Routes
 * Simple forecasting endpoints for Philippines healthcare context
 */

const express = require('express');
const router = express.Router();
const SimpleHealthForecasting = require('../services/simpleHealthForecasting');
const { authenticateToken: auth } = require('../middleware/auth');

const forecasting = new SimpleHealthForecasting();

/**
 * GET /api/forecast/disease-risk/:diseaseType
 * Get disease risk assessment for specific disease
 */
router.get('/disease-risk/:diseaseType', async (req, res) => {
  try {
    const { diseaseType } = req.params;
    const { days = 14 } = req.query;

    // Get recent cases from database (mock for now - replace with actual DB query)
    const recentCases = await getMockDiseaseData(diseaseType, parseInt(days));
    
    const riskAssessment = forecasting.assessDiseaseRisk(recentCases, diseaseType);
    
    res.json({
      success: true,
      data: {
        disease: diseaseType,
        assessment: riskAssessment,
        dataPoints: recentCases.length,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in disease risk assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating disease risk',
      error: error.message
    });
  }
});

/**
 * GET /api/forecast/resource-needs/:resourceType
 * Get resource forecasting for specific supply type
 */
router.get('/resource-needs/:resourceType', async (req, res) => {
  try {
    const { resourceType } = req.params;
    const { days = 30 } = req.query;

    // Get historical usage data (mock for now - replace with actual DB query)
    const historicalUsage = await getMockResourceData(resourceType, 60); // 60 days history
    
    const forecast = forecasting.forecastResourceNeeds(historicalUsage, resourceType, parseInt(days));
    
    res.json({
      success: true,
      data: {
        resourceType: resourceType,
        forecast: forecast,
        forecastPeriod: `${days} days`,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in resource forecasting:', error);
    res.status(500).json({
      success: false,
      message: 'Error forecasting resource needs',
      error: error.message
    });
  }
});

/**
 * GET /api/forecast/season-info
 * Get current season information and risk factors
 */
router.get('/season-info', async (req, res) => {
  try {
    const seasonInfo = forecasting.getCurrentSeasonInfo();
    
    res.json({
      success: true,
      data: {
        season: seasonInfo,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting season info:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting season information',
      error: error.message
    });
  }
});

/**
 * POST /api/forecast/comprehensive-report
 * Generate comprehensive health forecast report
 */
router.post('/comprehensive-report', auth, async (req, res) => {
  try {
    // Get comprehensive health data (mock for now - replace with actual DB queries)
    const healthData = await getComprehensiveHealthData();
    
    const report = forecasting.generateForecastReport(healthData);
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating forecast report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating forecast report',
      error: error.message
    });
  }
});

/**
 * GET /api/forecast/dashboard-summary
 * Get summary data for dashboard forecasting tab
 */
router.get('/dashboard-summary', async (req, res) => {
  try {
    const seasonInfo = forecasting.getCurrentSeasonInfo();
    
    // Get quick summaries for dashboard
    const diseases = ['dengue', 'diarrheal', 'respiratory'];
    const resources = ['medications', 'supplies', 'emergency'];
    
    const diseaseRisks = {};
    const resourceForecasts = {};
    
    // Disease risk summaries
    for (const disease of diseases) {
      const recentCases = await getMockDiseaseData(disease, 7);
      diseaseRisks[disease] = forecasting.assessDiseaseRisk(recentCases, disease);
    }
    
    // Resource forecast summaries
    for (const resource of resources) {
      const historicalUsage = await getMockResourceData(resource, 30);
      resourceForecasts[resource] = forecasting.forecastResourceNeeds(historicalUsage, resource, 7);
    }
    
    // Generate alerts
    const alerts = [];
    
    Object.entries(diseaseRisks).forEach(([disease, assessment]) => {
      if (assessment.alert) {
        alerts.push({
          type: 'disease',
          level: assessment.risk,
          message: `${disease}: ${assessment.message}`,
          disease: disease
        });
      }
    });
    
    Object.entries(resourceForecasts).forEach(([resource, forecast]) => {
      if (forecast.urgency === 'high') {
        alerts.push({
          type: 'resource',
          level: 'high',
          message: `${resource}: Needs immediate attention`,
          resource: resource
        });
      }
    });
    
    res.json({
      success: true,
      data: {
        season: seasonInfo,
        diseaseRisks,
        resourceForecasts,
        alerts,
        summary: {
          totalAlerts: alerts.length,
          highRiskDiseases: Object.values(diseaseRisks).filter(r => r.risk === 'high').length,
          criticalResources: Object.values(resourceForecasts).filter(r => r.urgency === 'high').length
        },
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating dashboard summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating dashboard summary',
      error: error.message
    });
  }
});

// =================================
// MOCK DATA FUNCTIONS
// Replace these with actual database queries
// =================================

/**
 * Mock function to get disease data
 * Replace with actual database query to get patient cases
 */
async function getMockDiseaseData(diseaseType, days) {
  const data = [];
  const baseDate = new Date();
  
  // Simulate disease data with some realistic patterns
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - i);
    
    let baseValue = 2; // Base cases per day
    
    // Add seasonal variation
    const month = date.getMonth() + 1;
    if ([6, 7, 8, 9, 10, 11].includes(month)) { // Typhoon season
      baseValue += Math.random() * 3; // More cases during typhoon season
    }
    
    // Add some random variation
    const variation = (Math.random() - 0.5) * 2;
    const value = Math.max(0, Math.round(baseValue + variation));
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: value
    });
  }
  
  return data;
}

/**
 * Mock function to get resource usage data
 * Replace with actual database query to get supply usage
 */
async function getMockResourceData(resourceType, days) {
  const data = [];
  const baseDate = new Date();
  
  // Base usage patterns for different resources
  const baseUsage = {
    medications: 50,
    supplies: 30,
    emergency: 10,
    vaccines: 15
  };
  
  const base = baseUsage[resourceType] || 20;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - i);
    
    let dailyUsage = base;
    
    // Add weekly patterns (more usage on weekdays)
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
      dailyUsage *= 0.7;
    }
    
    // Add seasonal variation
    const month = date.getMonth() + 1;
    if ([6, 7, 8, 9, 10, 11].includes(month)) { // Typhoon season
      dailyUsage *= 1.3;
    }
    
    // Add random variation
    const variation = (Math.random() - 0.5) * 0.4 * dailyUsage;
    const value = Math.max(0, Math.round(dailyUsage + variation));
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: value
    });
  }
  
  return data;
}

/**
 * Mock function to get comprehensive health data
 * Replace with actual database queries
 */
async function getComprehensiveHealthData() {
  const diseases = {};
  const resources = {};
  
  // Get disease data
  const diseaseTypes = ['dengue', 'diarrheal', 'respiratory', 'leptospirosis'];
  for (const disease of diseaseTypes) {
    diseases[disease] = await getMockDiseaseData(disease, 14);
  }
  
  // Get resource data
  const resourceTypes = ['medications', 'supplies', 'emergency', 'vaccines'];
  for (const resource of resourceTypes) {
    resources[resource] = await getMockResourceData(resource, 60);
  }
  
  return {
    diseases,
    resources
  };
}

module.exports = router;
