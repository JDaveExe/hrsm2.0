/**
 * Enhanced Healthcare Forecasting Service
 * Philippines-specific forecasting with transparent calculations and formula explanations
 * Academic Reference: Time Series Analysis & Epidemiological Forecasting Methods
 */

class SimpleHealthForecasting {
  constructor() {
    this.diseases = {
      dengue: { seasonalRisk: 'high', typhoonRelated: true, r0Base: 2.5 },
      diarrheal: { seasonalRisk: 'high', typhoonRelated: true, r0Base: 1.8 },
      respiratory: { seasonalRisk: 'medium', typhoonRelated: true, r0Base: 2.2 },
      leptospirosis: { seasonalRisk: 'high', typhoonRelated: true, r0Base: 1.5 },
      skinInfections: { seasonalRisk: 'medium', typhoonRelated: true, r0Base: 1.3 }
    };
    
    this.seasons = {
      wetSeason: [6, 7, 8, 9, 10, 11], // June-November (Typhoon season)
      drySeason: [12, 1, 2, 3, 4, 5]   // December-May
    };

    // Forecasting model parameters
    this.modelParams = {
      movingAverage: {
        defaultPeriod: 7,
        minDataPoints: 5,
        formula: 'SMA = (x₁ + x₂ + ... + xₙ) / n'
      },
      exponentialSmoothing: {
        alpha: 0.3,
        formula: 'S(t) = α × X(t) + (1-α) × S(t-1)',
        description: 'Alpha = 0.3 gives 30% weight to most recent observation'
      },
      seasonalAdjustment: {
        wetSeasonMultiplier: {
          medications: 1.5,
          supplies: 1.8,
          emergency: 2.0,
          vaccines: 1.3
        },
        formula: 'Seasonal_Forecast = Base_Forecast × Seasonal_Multiplier'
      },
      confidenceIntervals: {
        method: 'Standard Error Based',
        levels: [0.68, 0.95], // 68% and 95% confidence intervals
        formula: 'CI = Forecast ± (Z_score × Standard_Error)'
      }
    };
  }

  /**
   * Calculate simple moving average for disease trends with formula explanation
   * Academic Reference: Box, Jenkins, Reinsel - Time Series Analysis (5th Ed)
   * @param {Array} data - Array of daily case counts
   * @param {Number} period - Number of days to average (default: 7)
   * @returns {Object} Moving averages with calculation details
   */
  calculateMovingAverage(data, period = 7) {
    if (!data || data.length < period) {
      return {
        values: [],
        method: this.modelParams.movingAverage,
        error: 'Insufficient data points',
        minRequired: period
      };
    }
    
    const result = [];
    let sumOfSquaredErrors = 0;
    
    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      const sum = slice.reduce((a, b) => a + (b.value || b), 0);
      const average = sum / period;
      
      // Calculate error for this point (actual vs predicted)
      const actual = data[i].value || data[i];
      const error = actual - average;
      sumOfSquaredErrors += error * error;
      
      result.push({
        date: data[i].date || `Day ${i + 1}`,
        average: Math.round(average * 100) / 100,
        rawValue: actual,
        error: Math.round(error * 100) / 100,
        dataPoints: slice.map(d => d.value || d)
      });
    }
    
    // Calculate standard error for confidence intervals
    const mse = sumOfSquaredErrors / result.length;
    const standardError = Math.sqrt(mse);
    
    return {
      values: result,
      method: this.modelParams.movingAverage,
      statistics: {
        meanSquaredError: Math.round(mse * 100) / 100,
        standardError: Math.round(standardError * 100) / 100,
        dataPoints: result.length,
        period: period
      },
      formula: {
        description: `${period}-day Simple Moving Average`,
        equation: this.modelParams.movingAverage.formula,
        example: `For ${period} days: (${result[0]?.dataPoints?.slice(0, 3).join(' + ')}...) / ${period} = ${result[0]?.average}`
      }
    };
  }

  /**
   * Exponential smoothing for resource planning with confidence intervals
   * Academic Reference: Hyndman & Athanasopoulos - Forecasting: Principles and Practice (3rd Ed)
   * @param {Array} data - Historical usage data
   * @param {Number} alpha - Smoothing factor (0-1, default: 0.3)
   * @returns {Object} Smoothed forecasts with calculation details and confidence intervals
   */
  exponentialSmoothing(data, alpha = 0.3) {
    if (!data || data.length === 0) {
      return {
        values: [],
        method: this.modelParams.exponentialSmoothing,
        error: 'No historical data available'
      };
    }
    
    const result = [{ 
      ...data[0], 
      forecast: data[0].value || data[0],
      level: data[0].value || data[0],
      error: 0
    }];
    
    let sumSquaredErrors = 0;
    
    for (let i = 1; i < data.length; i++) {
      const actual = data[i].value || data[i];
      const previousForecast = result[i - 1].forecast;
      
      // Exponential smoothing formula: S(t) = α * X(t) + (1-α) * S(t-1)
      const forecast = alpha * actual + (1 - alpha) * previousForecast;
      const error = actual - previousForecast;
      sumSquaredErrors += error * error;
      
      result.push({
        ...data[i],
        forecast: Math.round(forecast * 100) / 100,
        level: Math.round(forecast * 100) / 100,
        error: Math.round(error * 100) / 100,
        actual: actual
      });
    }
    
    // Calculate confidence intervals
    const mse = sumSquaredErrors / (result.length - 1);
    const standardError = Math.sqrt(mse);
    const lastForecast = result[result.length - 1].forecast;
    
    // Add next period forecast with confidence intervals
    const nextForecast = lastForecast;
    const confidence68 = {
      lower: Math.round((nextForecast - standardError) * 100) / 100,
      upper: Math.round((nextForecast + standardError) * 100) / 100
    };
    const confidence95 = {
      lower: Math.round((nextForecast - 1.96 * standardError) * 100) / 100,
      upper: Math.round((nextForecast + 1.96 * standardError) * 100) / 100
    };
    
    return {
      values: result,
      nextPeriodForecast: {
        forecast: Math.round(nextForecast * 100) / 100,
        confidence68: confidence68,
        confidence95: confidence95
      },
      method: this.modelParams.exponentialSmoothing,
      statistics: {
        alpha: alpha,
        meanSquaredError: Math.round(mse * 100) / 100,
        standardError: Math.round(standardError * 100) / 100,
        dataPoints: result.length
      },
      formula: {
        description: `Exponential Smoothing with α = ${alpha}`,
        equation: this.modelParams.exponentialSmoothing.formula,
        explanation: this.modelParams.exponentialSmoothing.description,
        example: `S(${result.length}) = ${alpha} × ${result[result.length - 1]?.actual} + ${1 - alpha} × ${result[result.length - 2]?.forecast} = ${nextForecast}`
      }
    };
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
   * Enhanced disease outbreak risk assessment with transparent calculations
   * Academic Reference: Mathematical Models in Epidemiology (Brauer, Castillo-Chavez)
   * @param {Array} recentCases - Recent disease cases
   * @param {String} diseaseType - Type of disease
   * @returns {Object} Comprehensive risk assessment with calculation details
   */
  assessDiseaseRisk(recentCases, diseaseType) {
    if (!recentCases || recentCases.length === 0) {
      return { 
        risk: 'unknown', 
        alert: false, 
        message: 'Insufficient data',
        calculation: {
          method: 'Unable to assess',
          reason: 'No historical case data available'
        }
      };
    }

    const movingAvgResult = this.calculateMovingAverage(recentCases);
    const seasonInfo = this.getCurrentSeasonInfo();
    const disease = this.diseases[diseaseType] || { seasonalRisk: 'medium', typhoonRelated: false, r0Base: 1.5 };
    
    if (!movingAvgResult.values || movingAvgResult.values.length < 6) {
      return { 
        risk: 'unknown', 
        alert: false, 
        message: 'Insufficient trend data for analysis',
        calculation: {
          method: 'Moving Average Analysis',
          dataPoints: movingAvgResult.values?.length || 0,
          minRequired: 6
        }
      };
    }

    // Calculate trend (last 3 days vs previous 3 days)
    const recent = movingAvgResult.values.slice(-3);
    const previous = movingAvgResult.values.slice(-6, -3);
    
    const recentAvg = recent.reduce((sum, item) => sum + item.average, 0) / recent.length;
    const previousAvg = previous.reduce((sum, item) => sum + item.average, 0) / previous.length;
    const percentageChange = ((recentAvg - previousAvg) / previousAvg) * 100;

    // Enhanced risk calculation with transparent scoring
    let riskScore = 0;
    let alertMessage = '';
    let calculationSteps = [];

    // Step 1: Base risk from trend analysis
    if (percentageChange > 50) {
      riskScore += 3;
      calculationSteps.push(`Trend analysis: +3 points (${percentageChange.toFixed(1)}% increase > 50%)`);
      alertMessage = `${diseaseType} cases increased by ${percentageChange.toFixed(1)}% - HIGH ALERT`;
    } else if (percentageChange > 20) {
      riskScore += 2;
      calculationSteps.push(`Trend analysis: +2 points (${percentageChange.toFixed(1)}% increase > 20%)`);
      alertMessage = `${diseaseType} cases increased by ${percentageChange.toFixed(1)}% - Monitor closely`;
    } else if (percentageChange > 10) {
      riskScore += 1;
      calculationSteps.push(`Trend analysis: +1 point (${percentageChange.toFixed(1)}% increase > 10%)`);
      alertMessage = `${diseaseType} cases increased by ${percentageChange.toFixed(1)}% - Watch for patterns`;
    } else if (percentageChange < -20) {
      riskScore -= 1;
      calculationSteps.push(`Trend analysis: -1 point (${Math.abs(percentageChange).toFixed(1)}% decrease)`);
      alertMessage = `${diseaseType} cases decreased by ${Math.abs(percentageChange).toFixed(1)}% - Positive trend`;
    } else {
      calculationSteps.push(`Trend analysis: 0 points (${percentageChange.toFixed(1)}% change within normal range)`);
    }

    // Step 2: Seasonal adjustment
    if (seasonInfo.isTyphoonSeason && disease.typhoonRelated) {
      riskScore += 2;
      calculationSteps.push(`Seasonal factor: +2 points (Typhoon season + typhoon-related disease)`);
    } else if (seasonInfo.isTyphoonSeason) {
      riskScore += 1;
      calculationSteps.push(`Seasonal factor: +1 point (Typhoon season)`);
    } else {
      calculationSteps.push(`Seasonal factor: 0 points (Dry season)`);
    }

    // Step 3: Disease-specific risk multiplier
    const baseR0 = disease.r0Base || 1.5;
    if (baseR0 > 2.0) {
      riskScore += 1;
      calculationSteps.push(`Disease virulence: +1 point (R₀ = ${baseR0} > 2.0 - highly transmissible)`);
    } else {
      calculationSteps.push(`Disease virulence: 0 points (R₀ = ${baseR0} ≤ 2.0)`);
    }

    // Step 4: Determine final risk level
    let riskLevel;
    if (riskScore >= 5) riskLevel = 'critical';
    else if (riskScore >= 3) riskLevel = 'high';
    else if (riskScore >= 1) riskLevel = 'medium';
    else riskLevel = 'low';

    // Calculate confidence based on data quality
    const confidence = Math.min(95, Math.max(50, 
      60 + (movingAvgResult.statistics.dataPoints * 2) - (movingAvgResult.statistics.standardError * 10)
    ));

    return {
      risk: riskLevel,
      score: riskScore,
      alert: riskScore >= 3,
      message: alertMessage || `${diseaseType} risk level: ${riskLevel}`,
      percentageChange: percentageChange.toFixed(1),
      seasonalFactor: seasonInfo.isTyphoonSeason && disease.typhoonRelated,
      recommendation: this.generateRecommendation(riskLevel, diseaseType, seasonInfo),
      calculation: {
        method: 'Multi-factor Risk Scoring',
        steps: calculationSteps,
        finalScore: `${riskScore} points = ${riskLevel.toUpperCase()} risk`,
        formula: 'Risk Score = Trend Points + Seasonal Points + Disease Points',
        thresholds: {
          low: '0 points',
          medium: '1-2 points', 
          high: '3-4 points',
          critical: '5+ points'
        },
        confidence: `${Math.round(confidence)}%`,
        dataQuality: {
          points: movingAvgResult.statistics.dataPoints,
          standardError: movingAvgResult.statistics.standardError,
          period: movingAvgResult.statistics.period
        }
      },
      statistics: {
        recentAverage: Math.round(recentAvg * 100) / 100,
        previousAverage: Math.round(previousAvg * 100) / 100,
        trendDirection: percentageChange > 0 ? 'increasing' : 'decreasing',
        volatility: movingAvgResult.statistics.standardError > 2 ? 'high' : 'low'
      }
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
   * Enhanced resource forecasting with transparent calculations and confidence intervals
   * Academic Reference: Inventory Management & Supply Chain Forecasting Methods
   * @param {Array} historicalUsage - Historical supply usage data
   * @param {String} supplyType - Type of supply (medications, equipment, etc.)
   * @param {Number} forecastDays - Number of days to forecast
   * @returns {Object} Comprehensive resource forecast with calculation details
   */
  forecastResourceNeeds(historicalUsage, supplyType, forecastDays = 30) {
    if (!historicalUsage || historicalUsage.length === 0) {
      return { 
        error: 'No historical data available',
        calculation: {
          method: 'Unable to forecast',
          reason: 'No historical usage data provided'
        }
      };
    }

    const smoothedResult = this.exponentialSmoothing(historicalUsage);
    const seasonInfo = this.getCurrentSeasonInfo();
    
    if (!smoothedResult.values || smoothedResult.values.length === 0) {
      return {
        error: 'Exponential smoothing failed',
        calculation: {
          method: 'Exponential Smoothing',
          reason: 'Unable to process historical data'
        }
      };
    }

    const lastForecast = smoothedResult.nextPeriodForecast.forecast;
    let calculationSteps = [];

    // Step 1: Base forecast from exponential smoothing
    calculationSteps.push(`Base forecast: ${lastForecast} units/day (from exponential smoothing)`);

    // Step 2: Seasonal adjustment factors with transparent multipliers
    let seasonalMultiplier = 1;
    const multipliers = this.modelParams.seasonalAdjustment.wetSeasonMultiplier;
    
    if (seasonInfo.isTyphoonSeason) {
      seasonalMultiplier = multipliers[supplyType] || 1.4;
      calculationSteps.push(`Seasonal adjustment: ×${seasonalMultiplier} (Typhoon season for ${supplyType})`);
    } else {
      calculationSteps.push(`Seasonal adjustment: ×1.0 (Dry season - no adjustment)`);
    }

    // Step 3: Calculate final forecasts
    const adjustedDailyForecast = lastForecast * seasonalMultiplier;
    const totalNeed = Math.ceil(adjustedDailyForecast * forecastDays);
    
    calculationSteps.push(`Adjusted daily forecast: ${lastForecast} × ${seasonalMultiplier} = ${adjustedDailyForecast.toFixed(2)} units/day`);
    calculationSteps.push(`Total ${forecastDays}-day need: ${adjustedDailyForecast.toFixed(2)} × ${forecastDays} = ${totalNeed} units`);

    // Step 4: Calculate confidence intervals with seasonal adjustment
    const baseConfidence68 = smoothedResult.nextPeriodForecast.confidence68;
    const baseConfidence95 = smoothedResult.nextPeriodForecast.confidence95;
    
    const adjustedConfidence68 = {
      lower: Math.ceil(baseConfidence68.lower * seasonalMultiplier * forecastDays),
      upper: Math.ceil(baseConfidence68.upper * seasonalMultiplier * forecastDays)
    };
    const adjustedConfidence95 = {
      lower: Math.ceil(baseConfidence95.lower * seasonalMultiplier * forecastDays),
      upper: Math.ceil(baseConfidence95.upper * seasonalMultiplier * forecastDays)
    };

    // Step 5: Determine urgency level
    let urgencyLevel = 'normal';
    let urgencyReason = 'Standard forecasting period';
    
    if (seasonInfo.isTyphoonSeason) {
      urgencyLevel = 'high';
      urgencyReason = 'Typhoon season requires enhanced stock levels';
    } else if (smoothedResult.statistics.standardError > lastForecast * 0.3) {
      urgencyLevel = 'medium';
      urgencyReason = 'High variability in usage patterns detected';
    }

    calculationSteps.push(`Urgency assessment: ${urgencyLevel.toUpperCase()} (${urgencyReason})`);

    // Step 6: Safety stock calculation
    const safetyStock = Math.ceil(adjustedDailyForecast * 7); // 1 week safety stock
    const recommendedOrder = totalNeed + safetyStock;
    
    calculationSteps.push(`Safety stock: ${adjustedDailyForecast.toFixed(2)} × 7 days = ${safetyStock} units`);
    calculationSteps.push(`Recommended order: ${totalNeed} + ${safetyStock} = ${recommendedOrder} units`);

    return {
      dailyForecast: Math.ceil(adjustedDailyForecast),
      totalNeed: totalNeed,
      safetyStock: safetyStock,
      recommendedOrder: recommendedOrder,
      seasonalAdjustment: seasonalMultiplier,
      season: seasonInfo.season,
      urgency: urgencyLevel,
      recommendations: this.generateSupplyRecommendations(supplyType, totalNeed, seasonInfo),
      confidenceIntervals: {
        total68: adjustedConfidence68,
        total95: adjustedConfidence95,
        daily68: {
          lower: Math.round(baseConfidence68.lower * seasonalMultiplier * 100) / 100,
          upper: Math.round(baseConfidence68.upper * seasonalMultiplier * 100) / 100
        },
        daily95: {
          lower: Math.round(baseConfidence95.lower * seasonalMultiplier * 100) / 100,
          upper: Math.round(baseConfidence95.upper * seasonalMultiplier * 100) / 100
        }
      },
      calculation: {
        method: 'Enhanced Exponential Smoothing with Seasonal Adjustment',
        steps: calculationSteps,
        formula: this.modelParams.seasonalAdjustment.formula,
        baseMethod: smoothedResult.method,
        parameters: {
          alpha: smoothedResult.statistics.alpha,
          seasonalMultiplier: seasonalMultiplier,
          forecastPeriod: forecastDays,
          dataPoints: smoothedResult.statistics.dataPoints
        },
        accuracy: {
          mse: smoothedResult.statistics.meanSquaredError,
          standardError: smoothedResult.statistics.standardError,
          confidence: smoothedResult.statistics.standardError < lastForecast * 0.2 ? 'High' : 
                     smoothedResult.statistics.standardError < lastForecast * 0.4 ? 'Medium' : 'Low'
        }
      },
      historicalAnalysis: {
        trendDirection: this._analyzeTrend(historicalUsage),
        volatility: smoothedResult.statistics.standardError > lastForecast * 0.3 ? 'High' : 'Low',
        lastPeriodUsage: historicalUsage[historicalUsage.length - 1]?.value || 0,
        averageUsage: Math.round(historicalUsage.reduce((sum, item) => sum + (item.value || item), 0) / historicalUsage.length * 100) / 100
      }
    };
  }

  /**
   * Analyze trend direction from historical data
   * @private
   */
  _analyzeTrend(data) {
    if (data.length < 3) return 'insufficient_data';
    
    const recent = data.slice(-3).map(d => d.value || d);
    const earlier = data.slice(-6, -3).map(d => d.value || d);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    
    const change = ((recentAvg - earlierAvg) / earlierAvg) * 100;
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
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
