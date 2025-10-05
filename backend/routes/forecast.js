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

    // Get recent cases from database
    const recentCases = await getRealDiseaseData(diseaseType, parseInt(days));
    
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

    // Get historical usage data from database
    const historicalUsage = await getRealResourceData(resourceType, 60); // 60 days history
    
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
      const recentCases = await getRealDiseaseData(disease, 7);
      diseaseRisks[disease] = forecasting.assessDiseaseRisk(recentCases, disease);
    }
    
    // Resource forecast summaries
    for (const resource of resources) {
      const historicalUsage = await getRealResourceData(resource, 30);
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
 * Get real disease data from database
 * Analyzes appointments, check-in sessions, and symptoms to determine disease patterns
 */
async function getRealDiseaseData(diseaseType, days) {
  const { sequelize } = require('../config/database');
  
  try {
    // Define disease mapping based on appointment types, symptoms, and diagnoses
    const diseaseMapping = {
      'dengue': {
        symptoms: ['fever', 'headache', 'muscle pain', 'joint pain', 'rash', 'bleeding'],
        appointmentTypes: ['Emergency', 'Consultation'],
        keywords: ['dengue', 'fever', 'hemorrhagic', 'platelet']
      },
      'diarrheal': {
        symptoms: ['diarrhea', 'vomiting', 'stomach pain', 'dehydration', 'nausea'],
        appointmentTypes: ['Consultation', 'Emergency'],
        keywords: ['diarrhea', 'gastroenteritis', 'stomach', 'intestinal', 'loose stool']
      },
      'respiratory': {
        symptoms: ['cough', 'fever', 'difficulty breathing', 'sore throat', 'runny nose'],
        appointmentTypes: ['Consultation', 'Follow-up'],
        keywords: ['cough', 'pneumonia', 'respiratory', 'breathing', 'lung', 'bronchitis']
      },
      'leptospirosis': {
        symptoms: ['fever', 'headache', 'muscle pain', 'jaundice', 'kidney problems'],
        appointmentTypes: ['Emergency', 'Consultation'],
        keywords: ['leptospirosis', 'jaundice', 'kidney', 'flood', 'contaminated water']
      }
    };

    const mapping = diseaseMapping[diseaseType];
    if (!mapping) {
      // Fallback to general pattern if disease not mapped
      return generateFallbackDiseaseData(days);
    }

    // Build dynamic query to count cases by date
    const symptomConditions = mapping.symptoms.map(symptom => 
      `symptoms LIKE '%${symptom}%' OR diagnosis LIKE '%${symptom}%' OR notes LIKE '%${symptom}%'`
    ).join(' OR ');
    
    const keywordConditions = mapping.keywords.map(keyword => 
      `symptoms LIKE '%${keyword}%' OR diagnosis LIKE '%${keyword}%' OR notes LIKE '%${keyword}%'`
    ).join(' OR ');

    const appointmentTypeConditions = mapping.appointmentTypes.map(type => 
      `'${type}'`
    ).join(', ');

    // Query both appointments and check-in sessions for disease indicators
    const [diseaseData] = await sequelize.query(`
      SELECT 
        DATE(created_date) as date,
        COUNT(*) as cases
      FROM (
        -- Count from appointments with relevant types and symptoms
        SELECT 
          COALESCE(a.createdAt, a.appointmentDate) as created_date
        FROM Appointments a
        WHERE a.appointmentDate >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
          AND a.appointmentDate <= CURDATE()
          AND (
            a.type IN (${appointmentTypeConditions})
            OR (${symptomConditions})
          )
        
        UNION ALL
        
        -- Count from check-in sessions with relevant diagnoses and symptoms
        SELECT 
          c.createdAt as created_date
        FROM check_in_sessions c
        WHERE c.createdAt >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
          AND c.createdAt <= CURDATE()
          AND (
            (${keywordConditions})
            OR c.serviceType LIKE '%${diseaseType}%'
          )
      ) combined_cases
      GROUP BY DATE(created_date)
      ORDER BY date ASC
    `);

    // Fill in missing dates with zero values
    const result = [];
    const baseDate = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = diseaseData.find(d => d.date === dateStr);
      result.push({
        date: dateStr,
        value: dayData ? parseInt(dayData.cases) : 0
      });
    }

    console.log(`📊 Disease data for ${diseaseType}: ${result.reduce((sum, d) => sum + d.value, 0)} total cases in ${days} days`);
    return result;

  } catch (error) {
    console.error(`Error fetching disease data for ${diseaseType}:`, error);
    // Fallback to mock data if query fails
    return generateFallbackDiseaseData(days);
  }
}

/**
 * Generate fallback disease data when real data is unavailable
 */
function generateFallbackDiseaseData(days) {
  const data = [];
  const baseDate = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - i);
    
    let baseValue = 1; // Conservative base cases per day
    
    // Add seasonal variation
    const month = date.getMonth() + 1;
    if ([6, 7, 8, 9, 10, 11].includes(month)) { // Typhoon season
      baseValue += Math.floor(Math.random() * 2); // 0-1 additional cases
    }
    
    // Add some random variation
    const variation = Math.floor(Math.random() * 2); // 0-1 additional
    const value = Math.max(0, baseValue + variation);
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: value
    });
  }
  
  return data;
}

/**
 * Get real resource usage data from database
 * Analyzes prescriptions, vaccinations, and appointment patterns
 */
async function getRealResourceData(resourceType, days) {
  const { sequelize } = require('../config/database');
  
  try {
    let query = '';
    
    switch (resourceType) {
      case 'medications':
        // Count prescription entries from check-in sessions
        query = `
          SELECT 
            DATE(c.createdAt) as date,
            COUNT(*) as usage_count,
            COALESCE(SUM(
              CASE 
                WHEN c.prescription IS NOT NULL AND c.prescription != '[]' AND c.prescription != '' 
                THEN JSON_LENGTH(c.prescription)
                ELSE 0 
              END
            ), 0) as total_items
          FROM check_in_sessions c
          WHERE c.createdAt >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
            AND c.createdAt <= CURDATE()
            AND c.prescription IS NOT NULL 
            AND c.prescription != '[]' 
            AND c.prescription != ''
          GROUP BY DATE(c.createdAt)
          ORDER BY date ASC
        `;
        break;
        
      case 'vaccines':
        // Count vaccinations from Vaccinations table
        query = `
          SELECT 
            DATE(v.administeredAt) as date,
            COUNT(*) as usage_count,
            COUNT(*) as total_items
          FROM Vaccinations v
          WHERE v.administeredAt >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
            AND v.administeredAt <= CURDATE()
            AND v.deletedAt IS NULL
          GROUP BY DATE(v.administeredAt)
          ORDER BY date ASC
        `;
        break;
        
      case 'supplies':
        // Count based on appointments and check-ins (proxy for supply usage)
        query = `
          SELECT 
            DATE(created_date) as date,
            COUNT(*) as usage_count,
            COUNT(*) * 2 as total_items -- Estimate 2 supply items per visit
          FROM (
            SELECT a.createdAt as created_date
            FROM Appointments a
            WHERE a.createdAt >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
              AND a.createdAt <= CURDATE()
              AND a.status IN ('Completed', 'In Progress')
            
            UNION ALL
            
            SELECT c.createdAt as created_date
            FROM check_in_sessions c
            WHERE c.createdAt >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
              AND c.createdAt <= CURDATE()
              AND c.status IN ('completed', 'in-progress', 'vaccination-completed')
          ) combined_usage
          GROUP BY DATE(created_date)
          ORDER BY date ASC
        `;
        break;
        
      case 'emergency':
        // Count emergency appointments and high-priority cases
        query = `
          SELECT 
            DATE(created_date) as date,
            COUNT(*) as usage_count,
            COUNT(*) * 3 as total_items -- Estimate 3 emergency items per case
          FROM (
            SELECT a.createdAt as created_date
            FROM Appointments a
            WHERE a.createdAt >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
              AND a.createdAt <= CURDATE()
              AND (a.type = 'Emergency' OR a.priority = 'Emergency')
            
            UNION ALL
            
            SELECT c.createdAt as created_date
            FROM check_in_sessions c
            WHERE c.createdAt >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
              AND c.createdAt <= CURDATE()
              AND c.priority = 'Emergency'
          ) emergency_cases
          GROUP BY DATE(created_date)
          ORDER BY date ASC
        `;
        break;
        
      default:
        return generateFallbackResourceData(resourceType, days);
    }

    const [resourceData] = await sequelize.query(query);

    // Fill in missing dates with zero values
    const result = [];
    const baseDate = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = resourceData.find(d => d.date === dateStr);
      const baseValue = dayData ? parseInt(dayData.total_items || dayData.usage_count) : 0;
      
      // Apply weekly and seasonal patterns to real data
      let adjustedValue = baseValue;
      
      // Add weekly patterns (less usage on weekends)
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6 && adjustedValue > 0) { // Weekend
        adjustedValue = Math.max(1, Math.floor(adjustedValue * 0.7));
      }
      
      // Add seasonal variation for typhoon season
      const month = date.getMonth() + 1;
      if ([6, 7, 8, 9, 10, 11].includes(month) && adjustedValue > 0) { // Typhoon season
        adjustedValue = Math.floor(adjustedValue * 1.2);
      }
      
      result.push({
        date: dateStr,
        value: adjustedValue
      });
    }

    const totalUsage = result.reduce((sum, d) => sum + d.value, 0);
    console.log(`📊 Resource data for ${resourceType}: ${totalUsage} total usage in ${days} days`);
    return result;

  } catch (error) {
    console.error(`Error fetching resource data for ${resourceType}:`, error);
    // Fallback to mock data if query fails
    return generateFallbackResourceData(resourceType, days);
  }
}

/**
 * Generate fallback resource data when real data is unavailable
 */
function generateFallbackResourceData(resourceType, days) {
  const data = [];
  const baseDate = new Date();
  
  // Conservative base usage patterns
  const baseUsage = {
    medications: 25,
    supplies: 15,
    emergency: 5,
    vaccines: 8
  };
  
  const base = baseUsage[resourceType] || 10;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - i);
    
    let dailyUsage = base;
    
    // Add weekly patterns (more usage on weekdays)
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
      dailyUsage = Math.floor(dailyUsage * 0.6);
    }
    
    // Add seasonal variation
    const month = date.getMonth() + 1;
    if ([6, 7, 8, 9, 10, 11].includes(month)) { // Typhoon season
      dailyUsage = Math.floor(dailyUsage * 1.3);
    }
    
    // Add small random variation
    const variation = Math.floor(Math.random() * 3) - 1; // -1 to +1
    const value = Math.max(0, dailyUsage + variation);
    
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
  
  // Get disease data from database
  const diseaseTypes = ['dengue', 'diarrheal', 'respiratory', 'leptospirosis'];
  for (const disease of diseaseTypes) {
    diseases[disease] = await getRealDiseaseData(disease, 14);
  }
  
  // Get resource data from database
  const resourceTypes = ['medications', 'supplies', 'emergency', 'vaccines'];
  for (const resource of resourceTypes) {
    resources[resource] = await getRealResourceData(resource, 60);
  }
  
  return {
    diseases,
    resources
  };
}

module.exports = router;
