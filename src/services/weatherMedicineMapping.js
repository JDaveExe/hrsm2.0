/**
 * Weather-Medicine Mapping Service
 * Maps weather conditions to commonly needed medications in the Philippines
 * Focuses on real medicines available in Philippine pharmacies
 */

// Weather-related medication mappings based on Philippine healthcare patterns
export const WEATHER_MEDICINE_MAPPINGS = {
  // Respiratory conditions (common during rainy season)
  respiratory: {
    conditions: ['cough', 'cold', 'flu', 'bronchitis', 'pneumonia'],
    medications: [
      {
        name: 'Ambroxol (Mucosolvan)',
        type: 'expectorant',
        indication: 'Productive cough with thick mucus',
        dosage: '30mg tablet',
        demandIncrease: 1.8 // 80% increase during rainy season
      },
      {
        name: 'Salbutamol (Ventolin)',
        type: 'bronchodilator',
        indication: 'Asthma, bronchospasm',
        dosage: '2mg/5ml syrup, 100mcg inhaler',
        demandIncrease: 2.2 // 120% increase
      },
      {
        name: 'Cetirizine (Zyrtec)',
        type: 'antihistamine',
        indication: 'Allergic rhinitis, cold symptoms',
        dosage: '10mg tablet',
        demandIncrease: 1.6 // 60% increase
      },
      {
        name: 'Paracetamol + Phenylephrine (Neozep)',
        type: 'decongestant',
        indication: 'Cold, nasal congestion, fever',
        dosage: 'Tablet',
        demandIncrease: 2.0 // 100% increase
      },
      {
        name: 'Carbocisteine (Solmux)',
        type: 'mucolytic',
        indication: 'Thick mucus, chronic bronchitis',
        dosage: '500mg capsule',
        demandIncrease: 1.7 // 70% increase
      },
      {
        name: 'Azithromycin',
        type: 'antibiotic',
        indication: 'Bacterial respiratory infections',
        dosage: '500mg tablet',
        demandIncrease: 1.4 // 40% increase
      }
    ]
  },

  // Skin conditions (fungal infections during humid weather)
  skin_conditions: {
    conditions: ['fungal_infections', 'eczema', 'dermatitis', 'athlete_foot'],
    medications: [
      {
        name: 'Clotrimazole (Canesten)',
        type: 'antifungal',
        indication: 'Fungal skin infections, candidiasis',
        dosage: '1% cream/powder',
        demandIncrease: 2.5 // 150% increase during humid season
      },
      {
        name: 'Terbinafine (Lamisil)',
        type: 'antifungal',
        indication: 'Athlete\'s foot, ringworm',
        dosage: '1% cream, 250mg tablet',
        demandIncrease: 2.3 // 130% increase
      },
      {
        name: 'Ketoconazole (Nizoral)',
        type: 'antifungal',
        indication: 'Fungal skin infections, dandruff',
        dosage: '2% shampoo, 200mg tablet',
        demandIncrease: 1.8 // 80% increase
      },
      {
        name: 'Hydrocortisone',
        type: 'corticosteroid',
        indication: 'Skin inflammation, eczema',
        dosage: '1% cream/ointment',
        demandIncrease: 1.5 // 50% increase
      },
      {
        name: 'Miconazole (Daktarin)',
        type: 'antifungal',
        indication: 'Skin and nail fungal infections',
        dosage: '2% cream/powder',
        demandIncrease: 2.0 // 100% increase
      }
    ]
  },

  // Allergies (increased during high humidity and mold season)
  allergies: {
    conditions: ['allergic_rhinitis', 'asthma', 'urticaria', 'hay_fever'],
    medications: [
      {
        name: 'Loratadine (Claritin)',
        type: 'antihistamine',
        indication: 'Allergic rhinitis, urticaria',
        dosage: '10mg tablet',
        demandIncrease: 1.9 // 90% increase
      },
      {
        name: 'Montelukast (Singulair)',
        type: 'leukotriene receptor antagonist',
        indication: 'Asthma, allergic rhinitis',
        dosage: '10mg tablet',
        demandIncrease: 1.6 // 60% increase
      },
      {
        name: 'Beclomethasone (Qvar)',
        type: 'corticosteroid',
        indication: 'Asthma prevention',
        dosage: 'Inhaler 100mcg',
        demandIncrease: 1.4 // 40% increase
      },
      {
        name: 'Fexofenadine (Allegra)',
        type: 'antihistamine',
        indication: 'Seasonal allergies',
        dosage: '120mg tablet',
        demandIncrease: 1.7 // 70% increase
      }
    ]
  },

  // Gastrointestinal (food contamination during floods, wet season)
  gastrointestinal: {
    conditions: ['diarrhea', 'gastroenteritis', 'food_poisoning', 'acid_reflux', 'gas_bloating'],
    medications: [
      {
        name: 'Loperamide (Imodium)',
        type: 'antidiarrheal',
        indication: 'Acute diarrhea',
        dosage: '2mg capsule',
        demandIncrease: 1.8 // 80% increase during floods
      },
      {
        name: 'Oral Rehydration Salt (ORS)',
        type: 'electrolyte replacement',
        indication: 'Dehydration from diarrhea',
        dosage: 'Powder sachets',
        demandIncrease: 2.5 // 150% increase
      },
      {
        name: 'Metronidazole (Flagyl)',
        type: 'antibiotic/antiprotozoal',
        indication: 'Bacterial/parasitic gastroenteritis',
        dosage: '500mg tablet',
        demandIncrease: 1.6 // 60% increase
      },
      {
        name: 'Omeprazole (Losec)',
        type: 'proton pump inhibitor',
        indication: 'Acid reflux, GERD, gastritis',
        dosage: '20mg capsule',
        demandIncrease: 1.4 // 40% increase (stress-related)
      },
      {
        name: 'Simethicone',
        type: 'antiflatulent',
        indication: 'Gas, bloating, abdominal discomfort',
        dosage: '40mg tablet',
        demandIncrease: 1.3 // 30% increase
      },
      {
        name: 'Zinc Sulfate',
        type: 'mineral supplement',
        indication: 'Diarrhea treatment in children',
        dosage: '20mg tablet/syrup',
        demandIncrease: 1.4 // 40% increase
      }
    ]
  },

  // Vector-borne diseases (dengue, malaria during rainy season)
  vector_borne: {
    conditions: ['dengue', 'malaria', 'chikungunya'],
    medications: [
      {
        name: 'Paracetamol',
        type: 'analgesic/antipyretic',
        indication: 'Fever management (dengue-safe)',
        dosage: '500mg tablet',
        demandIncrease: 3.0 // 200% increase during dengue season
      },
      {
        name: 'Doxycycline',
        type: 'antibiotic',
        indication: 'Malaria prophylaxis',
        dosage: '100mg capsule',
        demandIncrease: 1.3 // 30% increase
      },
      {
        name: 'Chloroquine',
        type: 'antimalarial',
        indication: 'Malaria treatment',
        dosage: '250mg tablet',
        demandIncrease: 1.5 // 50% increase
      }
    ]
  }
};

// Weather condition to medication category mapping
export const WEATHER_CONDITION_MAPPINGS = {
  heavy_rain: ['respiratory', 'gastrointestinal', 'vector_borne'],
  typhoon: ['respiratory', 'gastrointestinal', 'vector_borne', 'skin_conditions'],
  high_humidity: ['skin_conditions', 'allergies', 'respiratory'],
  flooding: ['gastrointestinal', 'skin_conditions', 'vector_borne'],
  monsoon: ['respiratory', 'skin_conditions', 'allergies', 'vector_borne'],
  storm: ['respiratory', 'gastrointestinal']
};

/**
 * Real patient volume data configuration
 * Based on actual health station statistics: 60-70 patients/day, 400-500/week
 * Updated: 100 patients/day during wet season
 */
export const PATIENT_VOLUME_CONFIG = {
  // Daily patient volume statistics
  averagePatientsPerDay: 65,
  averagePatientsPerWeek: 450,
  wetSeasonPatientsPerDay: 100, // 54% increase during wet season
  wetSeasonPatientsPerWeek: 700, // 7 days * 100 patients
  
  // Medication prescription patterns based on Philippine health stations
  prescriptionRates: {
    // Percentage of patients likely to receive each medication type (more realistic rates)
    'Paracetamol': 0.20, // 20% of patients (fever, pain relief)
    'Ambroxol (Mucosolvan)': 0.12, // 12% during respiratory season
    'Salbutamol (Ventolin)': 0.04, // 4% (asthma patients)
    'Cetirizine (Zyrtec)': 0.08, // 8% (allergies, cold symptoms)
    'Paracetamol + Phenylephrine (Neozep)': 0.15, // 15% during cold season
    'Clotrimazole (Canesten)': 0.06, // 6% (skin conditions, humid weather)
    'Metronidazole (Flagyl)': 0.04, // 4% (intestinal infections)
    'Oral Rehydration Salt (ORS)': 0.08, // 8% during hot weather/diarrhea cases
    'Loperamide (Imodium)': 0.05, // 5% (diarrhea, GI issues)
    'Omeprazole (Losec)': 0.07, // 7% (acid reflux, GERD)
    'Loratadine (Claritin)': 0.09, // 9% (allergic reactions)
    'Terbinafine (Lamisil)': 0.03, // 3% (fungal infections)
    'Carbocisteine (Solmux)': 0.10, // 10% (productive cough)
    'Ketoconazole (Nizoral)': 0.04, // 4% (fungal conditions)
    'Azithromycin': 0.06, // 6% (bacterial infections)
    'Metronidazole (Flagyl)': 0.05, // 5% (intestinal infections)
    'Simethicone': 0.03, // 3% (gas, bloating)
    'Montelukast (Singulair)': 0.02 // 2% (asthma maintenance)
  },
  
  // Average units per prescription (adjusted for more realistic amounts)
  averageUnitsPerPrescription: {
    'Paracetamol': 10, // 10 tablets (more common for health stations)
    'Ambroxol (Mucosolvan)': 7,
    'Salbutamol (Ventolin)': 1, // Usually 1 inhaler
    'Cetirizine (Zyrtec)': 5,
    'Paracetamol + Phenylephrine (Neozep)': 6,
    'Clotrimazole (Canesten)': 1, // 1 tube/container
    'Loperamide (Imodium)': 4,
    'Oral Rehydration Salt (ORS)': 3, // 3 sachets
    'Loratadine (Claritin)': 5,
    'Terbinafine (Lamisil)': 1, // 1 tube
    'Carbocisteine (Solmux)': 7, // 1 week supply
    'Ketoconazole (Nizoral)': 1, // 1 bottle shampoo or tablets
    'Azithromycin': 3, // 3 tablets (shorter course)
    'Metronidazole (Flagyl)': 7, // 7 tablets (1 week course)
    'Montelukast (Singulair)': 15, // 15 tablets (2 weeks)
    'Omeprazole (Losec)': 14, // 14 capsules (2 weeks)
    'Simethicone': 10 // 10 tablets
  },
  
  // Vaccination vs prescription split
  vaccinationPatientRatio: 0.30, // 30% of patients come for vaccination
  prescriptionPatientRatio: 0.70 // 70% of patients need prescriptions
}// Seasonal demand multipliers
export const SEASONAL_MULTIPLIERS = {
  wet_season: {
    months: [5, 6, 7, 8, 9, 10], // June to November (Philippine wet season)
    multiplier: 1.8
  },
  dry_season: {
    months: [11, 0, 1, 2, 3, 4], // December to May
    multiplier: 0.8
  },
  peak_typhoon: {
    months: [7, 8, 9], // August to October
    multiplier: 2.2
  }
};

/**
 * Find medication stock by flexible name matching
 * @param {string} medicationName - The medication name to search for
 * @param {Object} inventory - Current inventory object
 * @returns {number} Stock level found
 */
function findMedicationStock(medicationName, inventory) {
  // Direct match first
  if (inventory[medicationName] !== undefined) {
    return inventory[medicationName];
  }
  
  // Try to find by partial matches
  const inventoryKeys = Object.keys(inventory);
  
  // Extract medication name parts for flexible matching
  const searchTerms = medicationName.toLowerCase()
    .replace(/[()]/g, ' ')
    .replace(' hydrochloride', '')
    .replace(' sulfate', '')
    .replace(' hcl', '')
    .split(/\s+/)
    .filter(term => term.length > 2); // Only meaningful terms
  
  for (const key of inventoryKeys) {
    const keyLower = key.toLowerCase()
      .replace(' hydrochloride', '')
      .replace(' sulfate', '')
      .replace(' hcl', '');
    
    // Check if all search terms are found in the inventory key
    if (searchTerms.every(term => keyLower.includes(term))) {
      console.log(`Found stock match: "${medicationName}" -> "${key}" = ${inventory[key]}`);
      return inventory[key];
    }
  }
  
  // Try simpler matching for common brand names
  const simplifiedSearch = medicationName.toLowerCase()
    .replace(/[()]/g, '')
    .replace(' hydrochloride', '')
    .replace(' sulfate', '')
    .trim();
  
  for (const key of inventoryKeys) {
    if (key.toLowerCase().includes(simplifiedSearch) || 
        simplifiedSearch.includes(key.toLowerCase().replace(/[()]/g, '').trim())) {
      console.log(`Found simplified match: "${medicationName}" -> "${key}" = ${inventory[key]}`);
      return inventory[key];
    }
  }
  
  console.log(`No stock found for: "${medicationName}" in inventory keys:`, inventoryKeys.slice(0, 5));
  return 0;
}

/**
 * Get medication recommendations based on weather conditions
 * @param {Array} weatherConditions - Array of weather condition strings
 * @param {Object} currentInventory - Current medication inventory
 * @returns {Array} Recommended medications with demand predictions
 */
export function getWeatherBasedMedicationRecommendations(weatherConditions, currentInventory = {}) {
  const recommendations = [];
  const processedMeds = new Set();

  weatherConditions.forEach(condition => {
    const categories = WEATHER_CONDITION_MAPPINGS[condition] || [];
    
    categories.forEach(category => {
      const categoryData = WEATHER_MEDICINE_MAPPINGS[category];
      if (!categoryData) return;

      categoryData.medications.forEach(med => {
        if (processedMeds.has(med.name)) return;
        processedMeds.add(med.name);

        // Use flexible medication stock lookup
        const currentStock = findMedicationStock(med.name, currentInventory);
        
        // Calculate demand based on real patient volume 
        // Dry season: 60-70 patients/day, Wet season: 100 patients/day
        const isWetSeason = weatherConditions.includes('heavy_rain') || weatherConditions.includes('typhoon') || weatherConditions.includes('monsoon');
        const dailyPatients = isWetSeason ? PATIENT_VOLUME_CONFIG.wetSeasonPatientsPerDay : PATIENT_VOLUME_CONFIG.averagePatientsPerDay;
        const dailyPrescriptionPatients = dailyPatients * PATIENT_VOLUME_CONFIG.prescriptionPatientRatio;
        const prescriptionRate = PATIENT_VOLUME_CONFIG.prescriptionRates[med.name] || 0.05; // Default 5% if not found
        const unitsPerPrescription = PATIENT_VOLUME_CONFIG.averageUnitsPerPrescription[med.name] || 10; // Default 10 units
        
        // Calculate base daily demand
        const dailyPrescriptions = dailyPrescriptionPatients * prescriptionRate;
        const baseDailyDemand = dailyPrescriptions * unitsPerPrescription;
        
        // Apply weather multiplier
        const weatherAdjustedDailyDemand = baseDailyDemand * med.demandIncrease;
        
        // Calculate shorter-term demand (7 days for forecasting widget)
        const forecastDays = 7;
        const expectedDemand = Math.ceil(weatherAdjustedDailyDemand * forecastDays);
        
        const stockNeeded = Math.max(0, expectedDemand - currentStock);
        
        console.log(`📊 Demand calculation for ${med.name}:`, {
          season: isWetSeason ? 'Wet Season' : 'Dry Season',
          dailyPatients: dailyPatients,
          dailyPrescriptionPatients: Math.round(dailyPrescriptionPatients),
          prescriptionRate: `${Math.round(prescriptionRate * 100)}%`,
          unitsPerPrescription,
          baseDailyDemand: Math.round(baseDailyDemand),
          weatherMultiplier: med.demandIncrease,
          weatherAdjustedDailyDemand: Math.round(weatherAdjustedDailyDemand),
          forecastPeriod: `${forecastDays} days`,
          expectedDemand,
          currentStock,
          stockNeeded
        });

        recommendations.push({
          ...med,
          category,
          weatherCondition: condition,
          currentStock,
          expectedDemand,
          stockNeeded,
          forecastDays,
          priority: stockNeeded > currentStock ? 'high' : stockNeeded > 0 ? 'medium' : 'low',
          estimatedDaysToStockout: currentStock > 0 ? Math.floor(currentStock / (expectedDemand / forecastDays)) : 0
        });
      });
    });
  });

  // Sort by priority and stock needed
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.stockNeeded - a.stockNeeded;
  });
}

/**
 * Calculate seasonal demand adjustments
 * @param {number} month - Current month (0-11)
 * @returns {Object} Seasonal adjustment factors
 */
export function getSeasonalAdjustments(month) {
  const adjustments = {};
  
  Object.entries(SEASONAL_MULTIPLIERS).forEach(([season, data]) => {
    if (data.months.includes(month)) {
      adjustments[season] = data.multiplier;
    }
  });

  return adjustments;
}

/**
 * Get medication alerts based on weather forecast
 * @param {Array} weatherForecast - Weather forecast data
 * @param {Object} currentInventory - Current medication inventory
 * @returns {Array} Medication alerts and warnings
 */
export function generateMedicationAlerts(weatherForecast, currentInventory = {}) {
  const alerts = [];
  
  // Analyze forecast for potential medication shortages
  const upcomingConditions = weatherForecast
    .filter(forecast => forecast.rainProbability > 60)
    .map(forecast => forecast.weatherCategory);

  if (upcomingConditions.includes('rainy')) {
    alerts.push({
      type: 'stock_alert',
      severity: 'warning',
      title: 'Rainy Season Medication Shortage Risk',
      message: 'Heavy rainfall expected. Consider stocking respiratory and anti-diarrheal medications.',
      medications: ['Ambroxol', 'Paracetamol + Phenylephrine', 'Loperamide', 'ORS'],
      timeframe: '3-7 days'
    });
  }

  // Check for low stock of critical medications
  const criticalMeds = ['Paracetamol', 'ORS', 'Ambroxol', 'Salbutamol'];
  criticalMeds.forEach(medName => {
    const stock = currentInventory[medName] || 0;
    if (stock < 50) { // Threshold for low stock
      alerts.push({
        type: 'low_stock',
        severity: 'critical',
        title: `Low Stock Alert: ${medName}`,
        message: `Current stock: ${stock} units. Weather conditions may increase demand.`,
        medication: medName,
        currentStock: stock,
        recommendedStock: 200
      });
    }
  });

  return alerts;
}

export default {
  WEATHER_MEDICINE_MAPPINGS,
  WEATHER_CONDITION_MAPPINGS,
  SEASONAL_MULTIPLIERS,
  getWeatherBasedMedicationRecommendations,
  getSeasonalAdjustments,
  generateMedicationAlerts
};