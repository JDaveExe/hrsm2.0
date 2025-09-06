/**
 * Forecasting Service
 * Frontend service for healthcare forecasting API calls
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add auth header to requests (temporarily disabled for testing)
/*
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
*/

const forecastingService = {
  /**
   * Get disease risk assessment for a specific disease
   * @param {string} diseaseType - Type of disease (dengue, diarrheal, etc.)
   * @param {number} days - Number of days to analyze (default: 14)
   * @returns {Promise} API response
   */
  getDiseaseRisk: async (diseaseType, days = 14) => {
    try {
      const response = await api.get(`/forecast/disease-risk/${diseaseType}`, {
        params: { days }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching disease risk:', error);
      throw error;
    }
  },

  /**
   * Get resource needs forecast for a specific resource type
   * @param {string} resourceType - Type of resource (medications, supplies, etc.)
   * @param {number} days - Number of days to forecast (default: 30)
   * @returns {Promise} API response
   */
  getResourceNeeds: async (resourceType, days = 30) => {
    try {
      const response = await api.get(`/forecast/resource-needs/${resourceType}`, {
        params: { days }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching resource needs:', error);
      throw error;
    }
  },

  /**
   * Get current season information and risk factors
   * @returns {Promise} API response
   */
  getSeasonInfo: async () => {
    try {
      const response = await api.get('/forecast/season-info');
      return response.data;
    } catch (error) {
      console.error('Error fetching season info:', error);
      throw error;
    }
  },

  /**
   * Generate comprehensive health forecast report
   * @returns {Promise} API response
   */
  getComprehensiveReport: async () => {
    try {
      const response = await api.post('/forecast/comprehensive-report');
      return response.data;
    } catch (error) {
      console.error('Error generating comprehensive report:', error);
      throw error;
    }
  },

  /**
   * Get dashboard summary for forecasting tab
   * @returns {Promise} API response
   */
  getDashboardSummary: async () => {
    try {
      const response = await api.get('/forecast/dashboard-summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      throw error;
    }
  },

  /**
   * Get multiple disease risks at once
   * @param {Array} diseases - Array of disease types
   * @param {number} days - Number of days to analyze
   * @returns {Promise} Object with risk assessments for each disease
   */
  getMultipleDiseaseRisks: async (diseases, days = 14) => {
    try {
      const promises = diseases.map(disease => 
        forecastingService.getDiseaseRisk(disease, days)
      );
      const results = await Promise.all(promises);
      
      const riskData = {};
      results.forEach((result, index) => {
        riskData[diseases[index]] = result.data;
      });
      
      return riskData;
    } catch (error) {
      console.error('Error fetching multiple disease risks:', error);
      throw error;
    }
  },

  /**
   * Get multiple resource forecasts at once
   * @param {Array} resources - Array of resource types
   * @param {number} days - Number of days to forecast
   * @returns {Promise} Object with forecasts for each resource
   */
  getMultipleResourceForecasts: async (resources, days = 30) => {
    try {
      const promises = resources.map(resource => 
        forecastingService.getResourceNeeds(resource, days)
      );
      const results = await Promise.all(promises);
      
      const forecastData = {};
      results.forEach((result, index) => {
        forecastData[resources[index]] = result.data;
      });
      
      return forecastData;
    } catch (error) {
      console.error('Error fetching multiple resource forecasts:', error);
      throw error;
    }
  }
};

// Helper functions for working with forecast data
export const forecastHelpers = {
  /**
   * Format risk level for display
   * @param {string} riskLevel - Risk level (low, medium, high)
   * @returns {Object} Formatted risk info
   */
  formatRiskLevel: (riskLevel) => {
    const riskInfo = {
      low: { color: 'success', icon: 'check-circle', text: 'Low Risk' },
      medium: { color: 'warning', icon: 'exclamation-triangle', text: 'Medium Risk' },
      high: { color: 'danger', icon: 'exclamation-circle', text: 'High Risk' },
      unknown: { color: 'secondary', icon: 'question-circle', text: 'Unknown' }
    };
    return riskInfo[riskLevel] || riskInfo.unknown;
  },

  /**
   * Get season color for display
   * @param {string} season - Season (wet/dry)
   * @returns {string} Bootstrap color class
   */
  getSeasonColor: (season) => {
    return season === 'wet' ? 'info' : 'warning';
  },

  /**
   * Format percentage change
   * @param {number} change - Percentage change
   * @returns {Object} Formatted change info
   */
  formatPercentageChange: (change) => {
    const numChange = parseFloat(change);
    const isIncrease = numChange > 0;
    const isSignificant = Math.abs(numChange) > 20;
    
    return {
      value: numChange,
      formatted: `${isIncrease ? '+' : ''}${numChange.toFixed(1)}%`,
      color: isIncrease ? (isSignificant ? 'danger' : 'warning') : 'success',
      icon: isIncrease ? 'arrow-up' : 'arrow-down',
      isSignificant
    };
  },

  /**
   * Get urgency color for resources
   * @param {string} urgency - Urgency level (normal/high)
   * @returns {string} Bootstrap color class
   */
  getUrgencyColor: (urgency) => {
    return urgency === 'high' ? 'danger' : 'success';
  },

  /**
   * Format disease name for display
   * @param {string} disease - Disease name
   * @returns {string} Formatted disease name
   */
  formatDiseaseName: (disease) => {
    const diseaseNames = {
      dengue: 'Dengue Fever',
      diarrheal: 'Diarrheal Diseases',
      respiratory: 'Respiratory Infections',
      leptospirosis: 'Leptospirosis',
      skinInfections: 'Skin Infections'
    };
    return diseaseNames[disease] || disease.charAt(0).toUpperCase() + disease.slice(1);
  },

  /**
   * Format resource type for display
   * @param {string} resource - Resource type
   * @returns {string} Formatted resource name
   */
  formatResourceName: (resource) => {
    const resourceNames = {
      medications: 'Medications',
      supplies: 'Medical Supplies',
      emergency: 'Emergency Supplies',
      vaccines: 'Vaccines'
    };
    return resourceNames[resource] || resource.charAt(0).toUpperCase() + resource.slice(1);
  },

  /**
   * Get recommendations priority
   * @param {Array} recommendations - Array of recommendations
   * @returns {Object} Prioritized recommendations
   */
  prioritizeRecommendations: (recommendations) => {
    const urgent = recommendations.filter(rec => 
      rec.includes('immediate') || rec.includes('urgent') || rec.includes('emergency')
    );
    const normal = recommendations.filter(rec => !urgent.includes(rec));
    
    return { urgent, normal };
  }
};

export default forecastingService;
