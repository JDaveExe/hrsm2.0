/**
 * Enhanced Forecasting Service - Frontend
 * Uses the new enhanced forecasting backend with multiple models and real data
 * Now includes weather-based prescription forecasting for Pasig City
 */

import axios from 'axios';
import weatherPrescriptionService from './weatherPrescriptionService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Increased timeout for complex forecasting calculations
});

const enhancedForecastingService = {
  /**
   * Get comprehensive healthcare forecast with multiple models
   * @param {Object} options - Forecasting options
   * @returns {Promise} API response with comprehensive forecast
   */
  getComprehensiveForecast: async (options = {}) => {
    try {
      const {
        days = 30,
        includeResources = true,
        includeRisk = true,
        modelPreference = 'auto'
      } = options;

      const response = await api.get('/forecast-enhanced/comprehensive', {
        params: {
          days,
          includeResources,
          includeRisk,
          modelPreference
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching comprehensive forecast:', error);
      throw error;
    }
  },

  /**
   * Get patient volume forecasting with model comparison
   * @param {number} days - Number of days to forecast
   * @param {string} models - Comma-separated model names or 'auto'
   * @returns {Promise} API response with patient volume forecasts
   */
  getPatientVolumeForecast: async (days = 30, models = 'auto') => {
    try {
      const response = await api.get('/forecast-enhanced/patient-volume', {
        params: { days, models }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching patient volume forecast:', error);
      throw error;
    }
  },

  /**
   * Get resource planning forecast and recommendations
   * @param {number} days - Number of days to forecast
   * @param {string} resourceType - Specific resource type or 'all'
   * @returns {Promise} API response with resource planning data
   */
  getResourcePlanningForecast: async (days = 30, resourceType = 'all') => {
    try {
      const response = await api.get('/forecast-enhanced/resource-planning', {
        params: { days, resourceType }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching resource planning forecast:', error);
      throw error;
    }
  },

  /**
   * Get health trends analysis and disease risk assessment
   * @param {number} days - Number of days to analyze
   * @returns {Promise} API response with health trends data
   */
  getHealthTrends: async (days = 30) => {
    try {
      const response = await api.get('/forecast-enhanced/health-trends', {
        params: { days }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching health trends:', error);
      throw error;
    }
  },

  /**
   * Get enhanced dashboard summary with real data and multiple models
   * @returns {Promise} API response with dashboard data
   */
  getEnhancedDashboardSummary: async () => {
    try {
      const response = await api.get('/forecast-enhanced/dashboard-summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching enhanced dashboard summary:', error);
      throw error;
    }
  },

  /**
   * Compare different forecasting models performance
   * @param {number} days - Number of days to forecast
   * @returns {Promise} API response with model comparison data
   */
  getModelComparison: async (days = 30) => {
    try {
      const response = await api.get('/forecast-enhanced/model-comparison', {
        params: { days }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching model comparison:', error);
      throw error;
    }
  },

  /**
   * Validate a specific forecasting model (when sufficient data available)
   * @param {string} modelName - Name of the model to validate
   * @param {number} validationPeriod - Number of days to use for validation
   * @returns {Promise} API response with validation results
   */
  validateModel: async (modelName, validationPeriod = 7) => {
    try {
      const response = await api.post('/forecast-enhanced/validate-model', {
        modelName,
        validationPeriod
      });
      return response.data;
    } catch (error) {
      console.error('Error validating model:', error);
      throw error;
    }
  },

  /**
   * Get weather-based prescription forecast for Pasig City
   * @param {number} days - Number of days to forecast
   * @returns {Promise} Weather-based medication recommendations
   */
  getWeatherPrescriptionForecast: async (days = 7) => {
    try {
      return await weatherPrescriptionService.getWeatherPrescriptionForecast(days);
    } catch (error) {
      console.error('Error fetching weather prescription forecast:', error);
      throw error;
    }
  },

  /**
   * Get immediate medication recommendations based on current weather
   * @returns {Promise} Immediate medication recommendations
   */
  getImmediateMedicationRecommendations: async () => {
    try {
      return await weatherPrescriptionService.getImmediateMedicationRecommendations();
    } catch (error) {
      console.error('Error fetching immediate medication recommendations:', error);
      throw error;
    }
  },

  /**
   * Get storm preparation medication list
   * @param {string} severity - Storm severity level
   * @returns {Promise} Storm preparation medications
   */
  getStormPreparationMedications: async (severity = 'moderate') => {
    try {
      return await weatherPrescriptionService.getStormPreparationMedications(severity);
    } catch (error) {
      console.error('Error fetching storm preparation medications:', error);
      throw error;
    }
  },

  /**
   * Get wet season preparation report
   * @returns {Promise} Wet season medication planning
   */
  getWetSeasonPreparation: async () => {
    try {
      return await weatherPrescriptionService.getWetSeasonPreparation();
    } catch (error) {
      console.error('Error fetching wet season preparation:', error);
      throw error;
    }
  }
};

// Enhanced helper functions for working with forecast data
export const enhancedForecastHelpers = {
  /**
   * Format forecast accuracy for display
   * @param {number} accuracy - Accuracy value (0-1)
   * @returns {Object} Formatted accuracy info
   */
  formatAccuracy: (accuracy) => {
    const percentage = Math.round(accuracy * 100);
    return {
      percentage: percentage,
      formatted: `${percentage}%`,
      level: percentage >= 80 ? 'excellent' : percentage >= 60 ? 'good' : percentage >= 40 ? 'moderate' : 'poor',
      color: percentage >= 80 ? 'success' : percentage >= 60 ? 'info' : percentage >= 40 ? 'warning' : 'danger'
    };
  },

  /**
   * Format model reliability for display
   * @param {string} reliability - Reliability level
   * @returns {Object} Formatted reliability info
   */
  formatReliability: (reliability) => {
    const reliabilityInfo = {
      excellent: { color: 'success', icon: 'check-circle-fill', text: 'Excellent' },
      good: { color: 'info', icon: 'check-circle', text: 'Good' },
      medium: { color: 'warning', icon: 'exclamation-circle', text: 'Medium' },
      low: { color: 'danger', icon: 'exclamation-triangle', text: 'Low' },
      very_low: { color: 'dark', icon: 'x-circle', text: 'Very Low' }
    };
    return reliabilityInfo[reliability] || reliabilityInfo.medium;
  },

  /**
   * Format confidence level for display
   * @param {string} confidence - Confidence level
   * @returns {Object} Formatted confidence info
   */
  formatConfidence: (confidence) => {
    const confidenceInfo = {
      high: { color: 'success', icon: 'shield-check', text: 'High Confidence', percentage: '85%+' },
      medium: { color: 'warning', icon: 'shield', text: 'Medium Confidence', percentage: '65-85%' },
      low: { color: 'danger', icon: 'shield-exclamation', text: 'Low Confidence', percentage: '<65%' }
    };
    return confidenceInfo[confidence] || confidenceInfo.medium;
  },

  /**
   * Get data quality description
   * @param {string} quality - Data quality level
   * @returns {Object} Quality description
   */
  getDataQualityInfo: (quality) => {
    const qualityInfo = {
      excellent: { 
        color: 'success', 
        text: 'Excellent Data Quality', 
        description: 'Large amount of historical data available for accurate forecasting',
        minDataPoints: '50+'
      },
      good: { 
        color: 'info', 
        text: 'Good Data Quality', 
        description: 'Sufficient historical data for reliable forecasting',
        minDataPoints: '20-50'
      },
      moderate: { 
        color: 'warning', 
        text: 'Moderate Data Quality', 
        description: 'Limited historical data - forecasts include uncertainty',
        minDataPoints: '10-20'
      },
      limited: { 
        color: 'warning', 
        text: 'Limited Data Quality', 
        description: 'Very limited historical data - use forecasts with caution',
        minDataPoints: '5-10'
      },
      insufficient: { 
        color: 'danger', 
        text: 'Insufficient Data', 
        description: 'Not enough historical data for reliable forecasting',
        minDataPoints: '<5'
      }
    };
    return qualityInfo[quality] || qualityInfo.moderate;
  },

  /**
   * Format forecast trend for display
   * @param {string} trend - Trend direction
   * @returns {Object} Formatted trend info
   */
  formatTrend: (trend) => {
    const trendInfo = {
      increasing: { color: 'warning', icon: 'arrow-up', text: 'Increasing', description: 'Patient volume trending upward' },
      decreasing: { color: 'success', icon: 'arrow-down', text: 'Decreasing', description: 'Patient volume trending downward' },
      stable: { color: 'info', icon: 'arrow-right', text: 'Stable', description: 'Patient volume relatively stable' },
      insufficient_data: { color: 'secondary', icon: 'question', text: 'Unknown', description: 'Insufficient data to determine trend' }
    };
    return trendInfo[trend] || trendInfo.stable;
  },

  /**
   * Format seasonal adjustment information
   * @param {number} adjustment - Seasonal adjustment multiplier
   * @returns {Object} Formatted seasonal info
   */
  formatSeasonalAdjustment: (adjustment) => {
    const isIncrease = adjustment > 1.0;
    const percentage = Math.round((Math.abs(adjustment - 1.0)) * 100);
    
    return {
      multiplier: adjustment,
      percentage: percentage,
      direction: isIncrease ? 'increase' : 'decrease',
      formatted: isIncrease ? `+${percentage}%` : `-${percentage}%`,
      color: isIncrease ? 'warning' : 'info',
      icon: isIncrease ? 'arrow-up' : 'arrow-down',
      description: isIncrease ? 
        `${percentage}% seasonal increase expected` : 
        `${percentage}% seasonal decrease expected`
    };
  },

  /**
   * Get model type description
   * @param {string} modelName - Name of the forecasting model
   * @returns {Object} Model description
   */
  getModelDescription: (modelName) => {
    const modelDescriptions = {
      simpleMovingAverage: {
        name: 'Simple Moving Average',
        shortName: 'SMA',
        description: 'Uses average of recent historical data points',
        bestFor: 'Short-term forecasting with stable patterns',
        complexity: 'Low',
        dataRequirement: 'Minimal (3+ points)'
      },
      exponentialSmoothing: {
        name: 'Exponential Smoothing',
        shortName: 'ES',
        description: 'Weights recent data more heavily than older data',
        bestFor: 'Short to medium-term forecasting with trends',
        complexity: 'Medium',
        dataRequirement: 'Moderate (5+ points)'
      },
      linearRegression: {
        name: 'Linear Regression',
        shortName: 'LR',
        description: 'Identifies linear trends in historical data',
        bestFor: 'Medium-term forecasting with clear trends',
        complexity: 'Medium',
        dataRequirement: 'Moderate (7+ points)'
      },
      seasonalDecomposition: {
        name: 'Seasonal Decomposition',
        shortName: 'SD',
        description: 'Separates trend, seasonal, and random components',
        bestFor: 'Long-term forecasting with seasonal patterns',
        complexity: 'High',
        dataRequirement: 'High (14+ points)'
      },
      ensembleMethod: {
        name: 'Ensemble Method',
        shortName: 'Ensemble',
        description: 'Combines multiple models for improved accuracy',
        bestFor: 'All forecasting scenarios with sufficient data',
        complexity: 'High',
        dataRequirement: 'Varies by component models'
      }
    };
    return modelDescriptions[modelName] || {
      name: modelName,
      shortName: modelName.toUpperCase(),
      description: 'Custom forecasting model',
      bestFor: 'General forecasting',
      complexity: 'Unknown',
      dataRequirement: 'Unknown'
    };
  },

  /**
   * Calculate forecast range from confidence intervals
   * @param {number} forecast - Base forecast value
   * @param {Object} confidenceIntervals - Confidence interval data
   * @returns {Object} Forecast range information
   */
  calculateForecastRange: (forecast, confidenceIntervals) => {
    if (!confidenceIntervals || !confidenceIntervals.intervals) {
      return {
        lower: Math.max(0, Math.round(forecast * 0.8)),
        upper: Math.round(forecast * 1.2),
        confidence: '68%'
      };
    }

    const interval95 = confidenceIntervals.intervals['95%'];
    return {
      lower: Math.max(0, Math.round(forecast * interval95.lower)),
      upper: Math.round(forecast * interval95.upper),
      confidence: '95%'
    };
  },

  /**
   * Format insights for display
   * @param {Array} insights - Array of insight objects
   * @returns {Array} Formatted insights
   */
  formatInsights: (insights) => {
    if (!Array.isArray(insights)) return [];
    
    return insights.map(insight => ({
      ...insight,
      priority: insight.priority || 'medium',
      priorityColor: {
        high: 'danger',
        medium: 'warning',
        low: 'info'
      }[insight.priority] || 'info',
      typeIcon: {
        volume: 'people-fill',
        resource: 'box-seam',
        health: 'heart-pulse',
        data: 'graph-up'
      }[insight.type] || 'info-circle'
    }));
  },

  /**
   * Format recommendations for display
   * @param {Array} recommendations - Array of recommendation objects
   * @returns {Array} Formatted recommendations
   */
  formatRecommendations: (recommendations) => {
    if (!Array.isArray(recommendations)) return [];
    
    return recommendations.map(rec => ({
      ...rec,
      priority: rec.priority || 'medium',
      priorityColor: {
        high: 'danger',
        medium: 'warning',
        low: 'info'
      }[rec.priority] || 'info',
      categoryIcon: {
        staffing: 'people',
        resources: 'box',
        monitoring: 'eye',
        data: 'graph-up'
      }[rec.category] || 'lightbulb'
    }));
  },

  /**
   * Check if forecast should show warning
   * @param {Object} forecast - Forecast data
   * @returns {Object} Warning information
   */
  checkForecastWarnings: (forecast) => {
    const warnings = [];
    
    if (forecast.metadata?.dataQuality === 'insufficient' || forecast.metadata?.dataQuality === 'limited') {
      warnings.push({
        type: 'data_quality',
        level: 'warning',
        message: 'Limited historical data available - use forecasts with caution',
        icon: 'exclamation-triangle'
      });
    }
    
    if (forecast.metadata?.reliability === 'low' || forecast.metadata?.reliability === 'very_low') {
      warnings.push({
        type: 'reliability',
        level: 'warning',
        message: 'Low forecast reliability due to data limitations',
        icon: 'shield-exclamation'
      });
    }
    
    const highVolumeForecasts = forecast.patientVolumeForecast?.ensemble?.forecasts?.filter(f => f.forecast > 10) || [];
    if (highVolumeForecasts.length > 3) {
      warnings.push({
        type: 'volume',
        level: 'info',
        message: 'High patient volume expected - consider resource planning',
        icon: 'people'
      });
    }
    
    return {
      hasWarnings: warnings.length > 0,
      warnings: warnings,
      highestLevel: warnings.some(w => w.level === 'danger') ? 'danger' : 
                   warnings.some(w => w.level === 'warning') ? 'warning' : 'info'
    };
  }
};

export default enhancedForecastingService;