/**
 * Weather-Based Prescription Service
 * Main service that combines weather forecasting with medication demand prediction
 * Focused on Pasig City healthcare needs
 */

import weatherForecastingService from './weatherForecastingService';
import weatherMedicineMapping, { 
  getWeatherBasedMedicationRecommendations,
  generateMedicationAlerts,
  getSeasonalAdjustments
} from './weatherMedicineMapping';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class WeatherPrescriptionService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
    });
  }

  /**
   * Get comprehensive weather-based prescription forecast for Pasig City
   * @param {number} days - Number of days to forecast (default: 7)
   * @returns {Promise} Complete weather-medication analysis
   */
  async getWeatherPrescriptionForecast(days = 7) {
    try {
      // Get weather data
      const [currentWeather, weatherForecast, wetSeasonData, weatherAlerts] = await Promise.all([
        weatherForecastingService.getCurrentWeatherPasig(),
        weatherForecastingService.getWeatherForecastPasig(days),
        weatherForecastingService.getWetSeasonForecast(),
        weatherForecastingService.getWeatherAlertsPasig()
      ]);

      // Get current inventory (mock data for now, should connect to real inventory)
      const currentInventory = await this.getCurrentInventory();

      // Determine weather conditions for medication mapping
      const weatherConditions = this.extractWeatherConditions(currentWeather, weatherForecast, weatherAlerts);

      // Get medication recommendations
      const medicationRecommendations = getWeatherBasedMedicationRecommendations(
        weatherConditions, 
        currentInventory
      );

      // Generate alerts
      const medicationAlerts = generateMedicationAlerts(weatherForecast.forecast, currentInventory);

      // Get seasonal adjustments
      const seasonalAdjustments = getSeasonalAdjustments(new Date().getMonth());

      // Calculate demand predictions
      const demandPredictions = this.calculateDemandPredictions(
        medicationRecommendations,
        weatherForecast,
        seasonalAdjustments
      );

      return {
        location: 'Pasig City, Metro Manila',
        timestamp: new Date().toISOString(),
        weather: {
          current: currentWeather,
          forecast: weatherForecast,
          wetSeason: wetSeasonData,
          alerts: weatherAlerts.alerts
        },
        medications: {
          recommendations: medicationRecommendations,
          alerts: medicationAlerts,
          demandPredictions: demandPredictions,
          inventory: currentInventory
        },
        seasonal: seasonalAdjustments,
        summary: this.generateForecastSummary(medicationRecommendations, weatherForecast, medicationAlerts)
      };
    } catch (error) {
      console.error('Error generating weather prescription forecast:', error);
      throw new Error('Unable to generate weather-based prescription forecast');
    }
  }

  /**
   * Get quick medication recommendations for current weather
   * @returns {Promise} Immediate medication recommendations
   */
  async getImmediateMedicationRecommendations() {
    try {
      const currentWeather = await weatherForecastingService.getCurrentWeatherPasig();
      const weatherAlerts = await weatherForecastingService.getWeatherAlertsPasig();
      const currentInventory = await this.getCurrentInventory();

      const weatherConditions = this.extractWeatherConditions(currentWeather, null, weatherAlerts);
      const recommendations = getWeatherBasedMedicationRecommendations(weatherConditions, currentInventory);

      return {
        location: 'Pasig City, Metro Manila',
        timestamp: new Date().toISOString(),
        currentWeather: {
          description: currentWeather.description,
          temperature: currentWeather.temperature,
          humidity: currentWeather.humidity,
          rainProbability: currentWeather.rainProbability
        },
        immediateRecommendations: recommendations.slice(0, 5), // Top 5 recommendations
        urgentAlerts: recommendations.filter(r => r.priority === 'high')
      };
    } catch (error) {
      console.error('Error getting immediate recommendations:', error);
      throw error;
    }
  }

  /**
   * Get typhoon/storm preparation medication list
   * @param {string} stormSeverity - 'low', 'moderate', 'high', 'severe'
   * @returns {Promise} Storm preparation medication list
   */
  async getStormPreparationMedications(stormSeverity = 'moderate') {
    try {
      const currentInventory = await this.getCurrentInventory();
      const stormConditions = this.getStormConditions(stormSeverity);
      
      const recommendations = getWeatherBasedMedicationRecommendations(stormConditions, currentInventory);

      // Calculate emergency stock levels (3-7 days supply)
      const emergencyStock = recommendations.map(med => ({
        ...med,
        emergencyStock: Math.ceil(med.expectedDemand * (stormSeverity === 'severe' ? 7 : 3) / 30),
        preparationPriority: this.getStormPreparationPriority(med.category, stormSeverity)
      }));

      return {
        stormSeverity,
        preparationMedications: emergencyStock,
        estimatedCost: this.calculateEstimatedCost(emergencyStock),
        preparationTimeline: stormSeverity === 'severe' ? '24-48 hours' : '3-5 days'
      };
    } catch (error) {
      console.error('Error generating storm preparation list:', error);
      throw error;
    }
  }

  /**
   * Get wet season preparation report
   * @returns {Promise} Comprehensive wet season medication planning
   */
  async getWetSeasonPreparation() {
    try {
      const wetSeasonData = await weatherForecastingService.getWetSeasonForecast();
      const currentInventory = await this.getCurrentInventory();
      
      const wetSeasonConditions = ['heavy_rain', 'high_humidity', 'flooding', 'monsoon'];
      const recommendations = getWeatherBasedMedicationRecommendations(wetSeasonConditions, currentInventory);

      // Calculate 6-month wet season supply
      const wetSeasonStock = recommendations.map(med => ({
        ...med,
        sixMonthSupply: Math.ceil(med.expectedDemand * 6),
        monthlyConsumption: Math.ceil(med.expectedDemand),
        stockupPriority: med.category === 'respiratory' || med.category === 'gastrointestinal' ? 'critical' : 'important'
      }));

      return {
        wetSeasonData,
        preparationPlan: wetSeasonStock,
        keyInsights: this.generateWetSeasonInsights(wetSeasonData, wetSeasonStock),
        timeline: 'Prepare before June (start of wet season)'
      };
    } catch (error) {
      console.error('Error generating wet season preparation:', error);
      throw error;
    }
  }

  // Private helper methods

  async getCurrentInventory() {
    try {
      // Connect to the real inventory service
      const inventoryService = require('./inventoryService').default;
      
      try {
        // Try to get real inventory data
        const medications = await inventoryService.getAllMedications();
        
        // Convert array of medication objects to the format needed for recommendations
        const inventory = {};
        
        // Process each medication and calculate stock from active batches
        for (const med of medications) {
          let stockLevel = 0;
          
          try {
            // Fetch batch data for this medication
            const response = await fetch(`http://localhost:5000/api/medication-batches/${med.id}/batches`);
            if (response.ok) {
              const batches = await response.json();
              
              // Sum only non-expired batches
              const today = new Date();
              stockLevel = batches
                .filter(batch => new Date(batch.expiryDate) > today) // Exclude expired batches
                .reduce((sum, batch) => sum + (batch.quantityRemaining || 0), 0);
              
              console.log(`Batch-based stock for ${med.name}: ${stockLevel} (from ${batches.length} batches, ${batches.filter(b => new Date(b.expiryDate) <= today).length} expired)`);
            } else {
              // Fallback to old stock value if batch API fails
              stockLevel = med.quantityInStock || med.unitsInStock || 0;
              console.log(`Fallback stock for ${med.name}: ${stockLevel} (batch API failed)`);
            }
          } catch (batchError) {
            // Fallback to old stock value if batch fetching fails
            stockLevel = med.quantityInStock || med.unitsInStock || 0;
            console.log(`Fallback stock for ${med.name}: ${stockLevel} (batch fetch error: ${batchError.message})`);
          }
          
          // Create multiple possible keys to match against weather recommendations
          const keys = [
            // Original format: Name (BrandName)
            `${med.name} (${med.brandName || med.genericName})`,
            // Alternative format: BrandName (Name) 
            `${med.brandName || med.name} (${med.name})`,
            // Generic name only
            med.genericName,
            // Name only
            med.name,
            // Brand name only
            med.brandName,
            // Simplified versions for weather mapping
            med.name?.replace(' Hydrochloride', '').replace(' Sulfate', '').replace(' HCl', ''),
            `${med.name?.replace(' Hydrochloride', '').replace(' Sulfate', '').replace(' HCl', '')} (${med.brandName})`,
            // Handle common medication name variations
            med.brandName && med.name ? `${med.brandName} (${med.name?.split(' ')[0]})` : null,
            med.brandName && med.name ? `${med.name?.split(' ')[0]} (${med.brandName})` : null
          ].filter(Boolean); // Remove any undefined values
          
          // Set the same stock value for all possible key variations
          keys.forEach(key => {
            inventory[key] = stockLevel;
          });
          
          // Debug logging
          console.log(`Added medication: ${med.name} (${med.brandName}) - Batch Stock: ${stockLevel}`);
        }
        
        console.log('Generated inventory keys with batch-based stock:', Object.keys(inventory).filter(key => inventory[key] > 0));
        return inventory;
      } catch (apiError) {
        console.warn('Failed to fetch from inventory API, using fallback data:', apiError);
        
        // Fallback to mock data if API call fails
        return {
          'Paracetamol 500mg tablet': 150,
          'Ambroxol (Mucosolvan) 30mg tablet': 80,
          'Salbutamol (Ventolin) 2mg/5ml syrup': 45,
          'Cetirizine (Zyrtec) 10mg tablet': 100,
          'Paracetamol + Phenylephrine (Neozep) tablet': 120,
          'Clotrimazole (Canesten) 1% cream': 30,
          'Loperamide (Imodium) 2mg capsule': 60,
          'Oral Rehydration Salt (ORS) powder sachets': 200,
          'Loratadine (Claritin) 10mg tablet': 75,
          'Terbinafine (Lamisil) 1% cream': 25,
          'Carbocisteine (Solmux) 500mg capsule': 50,
          'Ketoconazole (Nizoral) 2% shampoo': 40,
          'Azithromycin 500mg tablet': 35,
          'Metronidazole (Flagyl) 500mg tablet': 45,
          'Montelukast (Singulair) 10mg tablet': 30
        };
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      return {};
    }
  }

  extractWeatherConditions(currentWeather, weatherForecast, weatherAlerts) {
    const conditions = new Set();

    // From current weather
    if (currentWeather.rainProbability > 70) conditions.add('heavy_rain');
    if (currentWeather.humidity > 85) conditions.add('high_humidity');
    if (currentWeather.description.includes('storm')) conditions.add('storm');

    // From weather alerts
    weatherAlerts.alerts.forEach(alert => {
      if (alert.type === 'heavy_rain') conditions.add('heavy_rain');
      if (alert.type === 'typhoon') conditions.add('typhoon');
    });

    // From forecast (if available)
    if (weatherForecast) {
      const rainyDays = weatherForecast.forecast.filter(f => f.weatherCategory === 'rainy').length;
      if (rainyDays > 5) conditions.add('monsoon');
    }

    // Check if it's wet season
    const currentMonth = new Date().getMonth();
    if (currentMonth >= 4 && currentMonth <= 10) {
      conditions.add('monsoon');
    }

    return Array.from(conditions);
  }

  getStormConditions(severity) {
    const baseConditions = ['heavy_rain', 'storm'];
    
    switch (severity) {
      case 'severe':
        return [...baseConditions, 'typhoon', 'flooding'];
      case 'high':
        return [...baseConditions, 'typhoon'];
      case 'moderate':
        return [...baseConditions, 'high_humidity'];
      default:
        return baseConditions;
    }
  }

  getStormPreparationPriority(category, severity) {
    const priorities = {
      severe: {
        respiratory: 'critical',
        gastrointestinal: 'critical',
        vector_borne: 'high',
        skin_conditions: 'moderate',
        allergies: 'moderate'
      },
      high: {
        respiratory: 'high',
        gastrointestinal: 'high',
        vector_borne: 'moderate',
        skin_conditions: 'low',
        allergies: 'low'
      },
      moderate: {
        respiratory: 'moderate',
        gastrointestinal: 'moderate',
        vector_borne: 'low',
        skin_conditions: 'low',
        allergies: 'low'
      }
    };

    return priorities[severity]?.[category] || 'low';
  }

  calculateDemandPredictions(recommendations, weatherForecast, seasonalAdjustments) {
    // Import patient volume config for calculations
    const { PATIENT_VOLUME_CONFIG } = require('./weatherMedicineMapping');
    
    return recommendations.map(med => {
      // Calculate baseline daily demand using patient volume data
      const dailyPrescriptionPatients = PATIENT_VOLUME_CONFIG.averagePatientsPerDay * PATIENT_VOLUME_CONFIG.prescriptionPatientRatio;
      const prescriptionRate = PATIENT_VOLUME_CONFIG.prescriptionRates[med.name] || 0.05;
      const unitsPerPrescription = PATIENT_VOLUME_CONFIG.averageUnitsPerPrescription[med.name] || 10;
      
      const baselineDaily = dailyPrescriptionPatients * prescriptionRate * unitsPerPrescription;
      const weatherAdjusted = baselineDaily * med.demandIncrease;
      
      // Apply seasonal adjustments
      let seasonalMultiplier = 1;
      Object.values(seasonalAdjustments).forEach(multiplier => {
        seasonalMultiplier *= multiplier;
      });
      
      const finalDailyDemand = weatherAdjusted * seasonalMultiplier;
      
      return {
        medication: med.name,
        currentDailyDemand: Math.ceil(baselineDaily),
        predictedDailyDemand: Math.ceil(finalDailyDemand),
        weeklyDemand: Math.ceil(finalDailyDemand * 7),
        monthlyDemand: Math.ceil(finalDailyDemand * 30),
        demandIncrease: `${Math.round((finalDailyDemand / baselineDaily - 1) * 100)}%`,
        daysUntilStockout: Math.floor(med.currentStock / finalDailyDemand),
        patientVolumeInfo: {
          dailyPrescriptionPatients: Math.round(dailyPrescriptionPatients),
          prescriptionRate: `${Math.round(prescriptionRate * 100)}%`,
          unitsPerPrescription
        }
      };
    });
  }

  calculateEstimatedCost(medications) {
    // Rough estimates for Philippine pharmacy prices (in PHP)
    const priceEstimates = {
      'Paracetamol': 2.50,
      'Ambroxol (Mucosolvan)': 15.00,
      'Salbutamol (Ventolin)': 450.00, // inhaler
      'Cetirizine (Zyrtec)': 12.00,
      'Clotrimazole (Canesten)': 85.00, // cream
      'Loperamide (Imodium)': 25.00,
      'Oral Rehydration Salt (ORS)': 8.00
    };

    let totalCost = 0;
    medications.forEach(med => {
      const unitPrice = priceEstimates[med.name] || 20.00; // default price
      totalCost += (med.emergencyStock || med.stockNeeded) * unitPrice;
    });

    return {
      totalEstimatedCost: totalCost,
      currency: 'PHP',
      note: 'Estimated costs based on average Philippine pharmacy prices'
    };
  }

  generateForecastSummary(recommendations, weatherForecast, alerts) {
    const highPriorityMeds = recommendations.filter(r => r.priority === 'high').length;
    const totalStockNeeded = recommendations.reduce((sum, r) => sum + r.stockNeeded, 0);
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;

    return {
      weatherRisk: weatherForecast.summary.wetSeasonIntensity,
      medicationsAtRisk: highPriorityMeds,
      totalStockNeeded: totalStockNeeded,
      criticalAlerts: criticalAlerts,
      recommendedAction: this.getRecommendedAction(highPriorityMeds, criticalAlerts, weatherForecast.summary.wetSeasonIntensity)
    };
  }

  generateWetSeasonInsights(wetSeasonData, stockPlan) {
    return [
      `Expected rainy days: ${wetSeasonData.expectedRainyDays}`,
      `Typhoon risk level: ${wetSeasonData.typhoonRisk}`,
      `Critical medications to stock: ${stockPlan.filter(s => s.stockupPriority === 'critical').length}`,
      `Average humidity: ${Math.round(wetSeasonData.averageHumidity)}%`,
      `Estimated total rainfall: ${Math.round(wetSeasonData.totalExpectedRainfall)}mm`
    ];
  }

  getRecommendedAction(highPriorityMeds, criticalAlerts, weatherRisk) {
    if (criticalAlerts > 0 || highPriorityMeds > 3) {
      return 'Immediate action required: Stock critical medications within 24-48 hours';
    } else if (weatherRisk === 'high' || highPriorityMeds > 1) {
      return 'Moderate action needed: Plan medication restocking within 1 week';
    } else {
      return 'Low risk: Monitor weather conditions and maintain normal stock levels';
    }
  }
}

export default new WeatherPrescriptionService();