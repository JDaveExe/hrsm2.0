/**
 * Simple Healthcare Forecasting Service
 * Philippines-specific forecasting for typhoon preparedness and disease monitoring
 */

class SimpleHealthForecasting {
  constructor() {
    this.diseases = {
      dengue: { seasonalRisk: 'high', typhoonRelated: true },
      diarrheal: { seasonalRisk: 'high', typhoonRelated: true },
      respiratory: { seasonalRisk: 'medium', typhoonRelated: true },
      leptospirosis: { seasonalRisk: 'high', typhoonRelated: true },
      skinInfections: { seasonalRisk: 'medium', typhoonRelated: true }
    };
    
    this.seasons = {
      wetSeason: [6, 7, 8, 9, 10, 11], // June-November (Typhoon season)
      drySeason: [12, 1, 2, 3, 4, 5]   // December-May
    };
  }

  /**
   * Calculate simple moving average for disease trends
   * @param {Array} data - Array of daily case counts
   * @param {Number} period - Number of days to average (default: 7)
   * @returns {Array} Moving averages
   */
  calculateMovingAverage(data, period = 7) {
    if (!data || data.length < period) return [];
    
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      const sum = slice.reduce((a, b) => a + b, 0);
      result.push({
        date: data[i].date,
        average: Math.round(sum / period * 100) / 100,
        rawValue: data[i].value
      });
    }
    return result;
  }

  /**
   * Exponential smoothing for resource planning
   * @param {Array} data - Historical usage data
   * @param {Number} alpha - Smoothing factor (0-1, default: 0.3)
   * @returns {Array} Smoothed forecasts
   */
  exponentialSmoothing(data, alpha = 0.3) {
    if (!data || data.length === 0) return [];
    
    const result = [{ ...data[0], forecast: data[0].value }];
    
    for (let i = 1; i < data.length; i++) {
      const forecast = alpha * data[i].value + (1 - alpha) * result[i - 1].forecast;
      result.push({
        ...data[i],
        forecast: Math.round(forecast * 100) / 100
      });
    }
    return result;
  }

  /**
   * Detect if current period is typhoon season
   * @param {Date} date - Date to check (default: current date)
   * @returns {Object} Season information
   */
  getCurrentSeasonInfo(date = new Date()) {
    const month = date.getMonth() + 1; // JavaScript months are 0-indexed
    const isWetSeason = this.seasons.wetSeason.includes(month);
    
    return {
      season: isWetSeason ? 'wet' : 'dry',
      isTyphoonSeason: isWetSeason,
      month: month,
      riskLevel: isWetSeason ? 'high' : 'normal',
      preparednessLevel: isWetSeason ? 'enhanced' : 'standard'
    };
  }

  /**
   * Generate disease outbreak risk assessment
   * @param {Array} recentCases - Recent disease cases
   * @param {String} diseaseType - Type of disease
   * @returns {Object} Risk assessment
   */
  assessDiseaseRisk(recentCases, diseaseType) {
    if (!recentCases || recentCases.length === 0) {
      return { risk: 'unknown', alert: false, message: 'Insufficient data' };
    }

    const movingAvg = this.calculateMovingAverage(recentCases);
    const seasonInfo = this.getCurrentSeasonInfo();
    const disease = this.diseases[diseaseType] || { seasonalRisk: 'medium', typhoonRelated: false };
    
    // Calculate trend (last 3 days vs previous 3 days)
    const recent = movingAvg.slice(-3);
    const previous = movingAvg.slice(-6, -3);
    
    if (recent.length === 0 || previous.length === 0) {
      return { risk: 'unknown', alert: false, message: 'Insufficient data for trend analysis' };
    }

    const recentAvg = recent.reduce((sum, item) => sum + item.average, 0) / recent.length;
    const previousAvg = previous.reduce((sum, item) => sum + item.average, 0) / previous.length;
    const percentageChange = ((recentAvg - previousAvg) / previousAvg) * 100;

    // Risk calculation
    let riskScore = 0;
    let alertMessage = '';

    // Base risk from trend
    if (percentageChange > 50) {
      riskScore += 3;
      alertMessage = `${diseaseType} cases increased by ${percentageChange.toFixed(1)}% - Monitor closely`;
    } else if (percentageChange > 20) {
      riskScore += 2;
      alertMessage = `${diseaseType} cases increased by ${percentageChange.toFixed(1)}% - Watch for patterns`;
    } else if (percentageChange < -20) {
      riskScore -= 1;
      alertMessage = `${diseaseType} cases decreased by ${Math.abs(percentageChange).toFixed(1)}% - Positive trend`;
    }

    // Seasonal adjustment
    if (seasonInfo.isTyphoonSeason && disease.typhoonRelated) {
      riskScore += 1;
      alertMessage += ` (Typhoon season - increased risk)`;
    }

    // Determine final risk level
    let riskLevel, shouldAlert;
    if (riskScore >= 3) {
      riskLevel = 'high';
      shouldAlert = true;
    } else if (riskScore >= 1) {
      riskLevel = 'medium';
      shouldAlert = true;
    } else {
      riskLevel = 'low';
      shouldAlert = false;
    }

    return {
      risk: riskLevel,
      alert: shouldAlert,
      message: alertMessage || `${diseaseType} cases within normal range`,
      percentageChange: percentageChange.toFixed(1),
      seasonalFactor: seasonInfo.isTyphoonSeason && disease.typhoonRelated,
      recommendation: this.generateRecommendation(riskLevel, diseaseType, seasonInfo)
    };
  }

  /**
   * Generate recommendations based on risk assessment
   * @param {String} riskLevel - Risk level (low/medium/high)
   * @param {String} diseaseType - Type of disease
   * @param {Object} seasonInfo - Current season information
   * @returns {String} Recommendation text
   */
  generateRecommendation(riskLevel, diseaseType, seasonInfo) {
    const recommendations = {
      dengue: {
        high: 'Increase dengue prevention campaigns, check water storage areas, prepare rapid test kits',
        medium: 'Monitor mosquito breeding sites, remind community about prevention',
        low: 'Continue routine dengue prevention measures'
      },
      diarrheal: {
        high: 'Stock ORS packets, check water quality, prepare health education materials',
        medium: 'Monitor water sources, increase hygiene promotion',
        low: 'Maintain standard sanitation protocols'
      },
      respiratory: {
        high: 'Prepare isolation areas, stock antibiotics, monitor crowded areas',
        medium: 'Check ventilation in health facility, monitor symptoms',
        low: 'Continue routine respiratory health monitoring'
      },
      leptospirosis: {
        high: 'Stock doxycycline, prepare for flood-related cases, alert community',
        medium: 'Monitor for early symptoms, prepare diagnostic materials',
        low: 'Maintain routine leptospirosis awareness'
      }
    };

    const diseaseRec = recommendations[diseaseType] || recommendations.diarrheal;
    let baseRec = diseaseRec[riskLevel] || 'Monitor situation closely';

    if (seasonInfo.isTyphoonSeason) {
      baseRec += '. Typhoon season requires enhanced preparedness.';
    }

    return baseRec;
  }

  /**
   * Forecast resource needs based on historical data and seasonal patterns
   * @param {Array} historicalUsage - Historical supply usage data
   * @param {String} supplyType - Type of supply (medications, equipment, etc.)
   * @param {Number} forecastDays - Number of days to forecast
   * @returns {Object} Resource forecast
   */
  forecastResourceNeeds(historicalUsage, supplyType, forecastDays = 30) {
    if (!historicalUsage || historicalUsage.length === 0) {
      return { error: 'No historical data available' };
    }

    const smoothedData = this.exponentialSmoothing(historicalUsage);
    const seasonInfo = this.getCurrentSeasonInfo();
    const lastForecast = smoothedData[smoothedData.length - 1].forecast;

    // Seasonal adjustment factors
    let seasonalMultiplier = 1;
    if (seasonInfo.isTyphoonSeason) {
      // Increase supply needs during typhoon season
      const multipliers = {
        medications: 1.5,    // 50% increase in medications
        supplies: 1.8,       // 80% increase in medical supplies
        emergency: 2.0,      // 100% increase in emergency supplies
        vaccines: 1.3        // 30% increase in vaccines
      };
      seasonalMultiplier = multipliers[supplyType] || 1.4;
    }

    const dailyForecast = lastForecast * seasonalMultiplier;
    const totalNeed = Math.ceil(dailyForecast * forecastDays);

    return {
      dailyForecast: Math.ceil(dailyForecast),
      totalNeed: totalNeed,
      seasonalAdjustment: seasonalMultiplier,
      season: seasonInfo.season,
      recommendations: this.generateSupplyRecommendations(supplyType, totalNeed, seasonInfo),
      urgency: seasonInfo.isTyphoonSeason ? 'high' : 'normal'
    };
  }

  /**
   * Generate supply recommendations
   * @param {String} supplyType - Type of supply
   * @param {Number} totalNeed - Total forecasted need
   * @param {Object} seasonInfo - Season information
   * @returns {Array} List of recommendations
   */
  generateSupplyRecommendations(supplyType, totalNeed, seasonInfo) {
    const recommendations = [];

    if (seasonInfo.isTyphoonSeason) {
      recommendations.push('Order supplies early - delivery may be delayed during storms');
      recommendations.push('Stock 2x normal amount for emergency preparedness');
    }

    recommendations.push(`Estimated need: ${totalNeed} units for next 30 days`);

    if (supplyType === 'medications') {
      recommendations.push('Priority: Antibiotics, ORS, Paracetamol, Anti-diarrheal');
    } else if (supplyType === 'emergency') {
      recommendations.push('Priority: First aid kits, flashlights, emergency medications');
    }

    return recommendations;
  }

  /**
   * Generate comprehensive health forecast report
   * @param {Object} healthData - Current health data
   * @returns {Object} Complete forecast report
   */
  generateForecastReport(healthData) {
    const seasonInfo = this.getCurrentSeasonInfo();
    const report = {
      generatedAt: new Date().toISOString(),
      season: seasonInfo,
      alerts: [],
      recommendations: [],
      riskAssessments: {},
      resourceForecasts: {}
    };

    // Disease risk assessments
    if (healthData.diseases) {
      Object.keys(healthData.diseases).forEach(disease => {
        const assessment = this.assessDiseaseRisk(healthData.diseases[disease], disease);
        report.riskAssessments[disease] = assessment;
        
        if (assessment.alert) {
          report.alerts.push({
            type: 'disease',
            level: assessment.risk,
            message: assessment.message,
            disease: disease
          });
        }
      });
    }

    // Resource forecasts
    if (healthData.resources) {
      Object.keys(healthData.resources).forEach(resource => {
        const forecast = this.forecastResourceNeeds(healthData.resources[resource], resource);
        report.resourceForecasts[resource] = forecast;
        
        if (forecast.urgency === 'high') {
          report.alerts.push({
            type: 'resource',
            level: 'high',
            message: `${resource} needs immediate restocking`,
            resource: resource
          });
        }
      });
    }

    // General recommendations based on season
    if (seasonInfo.isTyphoonSeason) {
      report.recommendations.push('Typhoon season active - enhance emergency preparedness');
      report.recommendations.push('Monitor weather updates and disease patterns closely');
      report.recommendations.push('Ensure evacuation center medical kits are ready');
    }

    return report;
  }
}

module.exports = SimpleHealthForecasting;
