/**
 * Healthcare Data Collector Service
 * Extracts real healthcare data for forecasting and supplements with intelligent patterns
 */

const { sequelize } = require('../config/database');
const { CheckInSession, Patient, Appointment, User, Vaccination } = require('../models');
const { Op } = require('sequelize');

class HealthcareDataCollector {
  constructor() {
    // Philippines health seasonal patterns (for intelligent supplementation)
    this.seasonalPatterns = {
      // Disease patterns based on Philippine climate/season data
      wetSeason: { months: [6, 7, 8, 9, 10, 11], riskMultiplier: 1.6 },
      drySeason: { months: [12, 1, 2, 3, 4, 5], riskMultiplier: 0.8 },
      
      // Service demand patterns
      servicePeaks: {
        'vaccination': { months: [1, 2, 6, 7], multiplier: 1.4 }, // School year, start of rainy season
        'consultation': { months: [7, 8, 9, 10], multiplier: 1.3 }, // Rainy season illness
        'dental': { months: [3, 4, 5, 6], multiplier: 1.2 }, // Before school year
        'check-up': { months: [1, 6], multiplier: 1.3 } // New year, mid-year check-ups
      }
    };
  }

  /**
   * Get real patient visit patterns with intelligent extension
   * @param {number} days - Number of days of data to collect
   * @returns {Object} Patient visit data and patterns
   */
  async getPatientVisitPatterns(days = 90) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get real completed checkups
      const realCheckups = await CheckInSession.findAll({
        where: {
          status: {
            [Op.in]: ['completed', 'vaccination-completed']
          },
          completedAt: {
            [Op.gte]: startDate
          }
        },
        attributes: [
          'completedAt',
          'serviceType',
          'chiefComplaint',
          'diagnosis'
        ],
        include: [
          {
            model: Patient,
            as: 'Patient',
            attributes: ['dateOfBirth', 'gender']
          }
        ],
        order: [['completedAt', 'ASC']]
      });

      // Get real appointments
      const realAppointments = await Appointment.findAll({
        where: {
          appointmentDate: {
            [Op.gte]: startDate
          }
        },
        attributes: [
          'appointmentDate',
          'appointmentTime', 
          'type',
          'status',
          'priority'
        ],
        order: [['appointmentDate', 'ASC']]
      });

      // Analyze real patterns
      const realPatterns = this.analyzeRealPatterns(realCheckups, realAppointments);
      
      // Generate intelligent supplemental data if needed
      const supplementalData = this.generateIntelligentSupplemental(realPatterns, days);

      return {
        real: {
          checkups: realCheckups.length,
          appointments: realAppointments.length,
          dataPoints: realCheckups.map(checkup => ({
            date: checkup.completedAt,
            type: 'checkup',
            serviceType: checkup.serviceType,
            patientAge: this.calculateAge(checkup.Patient?.dateOfBirth),
            gender: checkup.Patient?.gender
          })).concat(realAppointments.map(apt => ({
            date: apt.appointmentDate,
            type: 'appointment',
            serviceType: apt.type,
            status: apt.status,
            priority: apt.priority
          })))
        },
        patterns: realPatterns,
        supplemental: supplementalData,
        metadata: {
          dataCollectionDate: new Date(),
          daysAnalyzed: days,
          realDataQuality: this.assessDataQuality(realCheckups, realAppointments),
          forecastReliability: this.calculateReliability(realCheckups, realAppointments, days)
        }
      };

    } catch (error) {
      console.error('Error collecting patient visit patterns:', error);
      throw error;
    }
  }

  /**
   * Get resource usage patterns (medications, supplies, equipment)
   * @param {number} days - Number of days to analyze
   * @returns {Object} Resource usage data
   */
  async getResourceUsagePatterns(days = 60) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Extract resource usage from completed checkups
      const checkupsWithTreatment = await CheckInSession.findAll({
        where: {
          status: {
            [Op.in]: ['completed', 'vaccination-completed']
          },
          completedAt: {
            [Op.gte]: startDate
          },
          [Op.or]: [
            { treatmentPlan: { [Op.ne]: null } },
            { prescription: { [Op.ne]: null } },
            { serviceType: { [Op.like]: '%vaccination%' } }
          ]
        },
        attributes: [
          'completedAt',
          'serviceType', 
          'treatmentPlan',
          'prescription',
          'diagnosis'
        ]
      });

      // Get vaccination data (specific resource usage)
      const vaccinations = await Vaccination.findAll({
        where: {
          administeredAt: {
            [Op.gte]: startDate
          }
        },
        attributes: [
          'administeredAt',
          'vaccineName',
          'dose',
          'batchNumber'
        ]
      });

      // Analyze resource consumption patterns
      const resourcePatterns = this.analyzeResourceConsumption(checkupsWithTreatment, vaccinations);

      return {
        realUsage: {
          treatmentSessions: checkupsWithTreatment.length,
          vaccinations: vaccinations.length,
          resourceEvents: checkupsWithTreatment.map(session => ({
            date: session.completedAt,
            serviceType: session.serviceType,
            resourcesUsed: this.extractResourcesFromTreatment(session.treatmentPlan, session.prescription),
            category: this.categorizeResourceUsage(session.serviceType)
          }))
        },
        vaccinationUsage: vaccinations.map(vacc => ({
          date: vacc.administeredAt,
          vaccine: vacc.vaccineName,
          category: 'biologics',
          storageRequired: this.getVaccineStorageRequirements(vacc.vaccineName)
        })),
        patterns: resourcePatterns,
        projections: this.projectResourceNeeds(resourcePatterns, days)
      };

    } catch (error) {
      console.error('Error collecting resource usage patterns:', error);
      throw error;
    }
  }

  /**
   * Get disease/health trend patterns from real checkup data
   * @param {number} days - Number of days to analyze
   * @returns {Object} Disease trend data
   */
  async getHealthTrendPatterns(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const healthData = await CheckInSession.findAll({
        where: {
          status: {
            [Op.in]: ['completed', 'vaccination-completed']
          },
          completedAt: {
            [Op.gte]: startDate
          },
          [Op.or]: [
            { chiefComplaint: { [Op.ne]: null } },
            { diagnosis: { [Op.ne]: null } },
            { presentSymptoms: { [Op.ne]: null } }
          ]
        },
        attributes: [
          'completedAt',
          'chiefComplaint',
          'diagnosis', 
          'presentSymptoms',
          'serviceType'
        ],
        include: [
          {
            model: Patient,
            as: 'Patient',
            attributes: ['dateOfBirth', 'gender']
          }
        ]
      });

      // Analyze health trends
      const healthTrends = this.analyzeHealthTrends(healthData);

      return {
        totalCases: healthData.length,
        diseaseCategories: healthTrends.categories,
        ageDistribution: healthTrends.agePatterns,
        seasonalIndicators: healthTrends.seasonalRisk,
        earlyWarningSignals: this.detectEarlyWarnings(healthTrends),
        riskAssessment: this.assessCommunityRisk(healthTrends)
      };

    } catch (error) {
      console.error('Error collecting health trend patterns:', error);
      throw error;
    }
  }

  // Helper methods for analysis
  analyzeRealPatterns(checkups, appointments) {
    const dailyCheckups = {};
    const serviceTypes = {};
    const hourlyDistribution = {};

    // Analyze daily patterns
    checkups.forEach(checkup => {
      const date = checkup.completedAt.toDateString();
      dailyCheckups[date] = (dailyCheckups[date] || 0) + 1;
      
      const serviceType = checkup.serviceType || 'general';
      serviceTypes[serviceType] = (serviceTypes[serviceType] || 0) + 1;
    });

    // Analyze appointment patterns
    appointments.forEach(apt => {
      const hour = new Date(`1970-01-01T${apt.appointmentTime}`).getHours();
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
    });

    return {
      dailyVolume: Object.values(dailyCheckups),
      averageDailyVolume: Object.values(dailyCheckups).reduce((a, b) => a + b, 0) / Object.keys(dailyCheckups).length || 0,
      serviceDistribution: serviceTypes,
      peakHours: this.findPeakHours(hourlyDistribution),
      trend: this.calculateTrend(Object.values(dailyCheckups))
    };
  }

  generateIntelligentSupplemental(realPatterns, days) {
    const currentMonth = new Date().getMonth() + 1;
    const isWetSeason = this.seasonalPatterns.wetSeason.months.includes(currentMonth);
    const seasonalMultiplier = isWetSeason ? this.seasonalPatterns.wetSeason.riskMultiplier : this.seasonalPatterns.drySeason.riskMultiplier;

    // Base supplemental data on real patterns but adjust for seasonal factors
    const baseDaily = realPatterns.averageDailyVolume || 1;
    const adjustedDaily = Math.max(1, Math.round(baseDaily * seasonalMultiplier));

    return {
      projectedDailyVolume: adjustedDaily,
      seasonalAdjustment: seasonalMultiplier,
      confidenceLevel: this.calculateConfidenceLevel(realPatterns),
      generationMethod: 'intelligent_seasonal_adjustment',
      basedOnRealData: realPatterns.dailyVolume.length > 0
    };
  }

  analyzeResourceConsumption(treatments, vaccinations) {
    const resourceCategories = {
      medications: 0,
      vaccines: vaccinations.length,
      supplies: 0,
      equipment: 0
    };

    // Estimate resource usage from treatment plans
    treatments.forEach(treatment => {
      if (treatment.prescription) {
        resourceCategories.medications += this.estimateMedicationUsage(treatment.prescription);
      }
      if (treatment.treatmentPlan) {
        resourceCategories.supplies += this.estimateSupplyUsage(treatment.treatmentPlan);
      }
    });

    return {
      categories: resourceCategories,
      dailyAverage: {
        medications: resourceCategories.medications / 30,
        vaccines: resourceCategories.vaccines / 30,
        supplies: resourceCategories.supplies / 30
      },
      trends: this.calculateResourceTrends(resourceCategories)
    };
  }

  analyzeHealthTrends(healthData) {
    const diseaseCategories = {};
    const ageGroups = { pediatric: 0, adult: 0, elderly: 0 };
    const symptoms = {};

    healthData.forEach(session => {
      // Categorize by symptoms/diagnosis
      const category = this.categorizeHealthIssue(session.chiefComplaint, session.diagnosis);
      diseaseCategories[category] = (diseaseCategories[category] || 0) + 1;

      // Age distribution
      const age = this.calculateAge(session.Patient?.dateOfBirth);
      if (age < 18) ageGroups.pediatric++;
      else if (age < 65) ageGroups.adult++;
      else ageGroups.elderly++;

      // Track symptoms
      if (session.presentSymptoms) {
        const symptomList = session.presentSymptoms.toLowerCase().split(/[,;]/).map(s => s.trim());
        symptomList.forEach(symptom => {
          if (symptom && symptom.length > 2) {
            symptoms[symptom] = (symptoms[symptom] || 0) + 1;
          }
        });
      }
    });

    return {
      categories: diseaseCategories,
      agePatterns: ageGroups,
      commonSymptoms: Object.entries(symptoms).sort((a, b) => b[1] - a[1]).slice(0, 10),
      seasonalRisk: this.assessSeasonalRisk(diseaseCategories)
    };
  }

  // Utility methods
  calculateAge(dateOfBirth) {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  assessDataQuality(checkups, appointments) {
    const total = checkups.length + appointments.length;
    if (total === 0) return 'insufficient';
    if (total < 10) return 'limited';
    if (total < 50) return 'moderate';
    return 'good';
  }

  calculateReliability(checkups, appointments, daysAnalyzed) {
    const dataPoints = checkups.length + appointments.length;
    const dataPerDay = dataPoints / daysAnalyzed;
    
    if (dataPerDay < 0.1) return 'very_low';
    if (dataPerDay < 0.5) return 'low';
    if (dataPerDay < 2) return 'medium';
    return 'high';
  }

  categorizeHealthIssue(complaint, diagnosis) {
    const text = `${complaint || ''} ${diagnosis || ''}`.toLowerCase();
    
    if (text.includes('fever') || text.includes('headache') || text.includes('flu')) return 'fever_related';
    if (text.includes('cough') || text.includes('respiratory') || text.includes('asthma')) return 'respiratory';
    if (text.includes('diarrhea') || text.includes('stomach') || text.includes('abdominal')) return 'gastrointestinal';
    if (text.includes('skin') || text.includes('rash') || text.includes('allergy')) return 'dermatological';
    if (text.includes('injury') || text.includes('accident') || text.includes('wound')) return 'trauma';
    if (text.includes('vaccination') || text.includes('immunization')) return 'preventive';
    
    return 'general';
  }

  calculateTrend(values) {
    if (values.length < 2) return 'insufficient_data';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (changePercent > 20) return 'increasing';
    if (changePercent < -20) return 'decreasing';
    return 'stable';
  }

  findPeakHours(hourlyDist) {
    const hours = Object.entries(hourlyDist).sort((a, b) => b[1] - a[1]);
    return hours.slice(0, 3).map(([hour, count]) => ({ hour: parseInt(hour), visits: count }));
  }

  calculateConfidenceLevel(patterns) {
    const dataPoints = patterns.dailyVolume.length;
    if (dataPoints > 30) return 'high';
    if (dataPoints > 10) return 'medium';
    if (dataPoints > 3) return 'low';
    return 'very_low';
  }

  estimateMedicationUsage(prescription) {
    // Simple estimation based on prescription text
    const prescriptionText = prescription.toLowerCase();
    let count = 0;
    
    // Count medication mentions
    const medicationKeywords = ['tablet', 'capsule', 'syrup', 'ointment', 'drops', 'injection'];
    medicationKeywords.forEach(keyword => {
      const matches = (prescriptionText.match(new RegExp(keyword, 'g')) || []).length;
      count += matches;
    });
    
    return Math.max(1, count);
  }

  estimateSupplyUsage(treatmentPlan) {
    // Estimate supplies based on treatment plan
    const treatmentText = treatmentPlan.toLowerCase();
    let supplies = 0;
    
    if (treatmentText.includes('bandage') || treatmentText.includes('dressing')) supplies++;
    if (treatmentText.includes('injection') || treatmentText.includes('vaccine')) supplies++;
    if (treatmentText.includes('test') || treatmentText.includes('sample')) supplies++;
    
    return Math.max(1, supplies);
  }

  calculateResourceTrends(categories) {
    return {
      mostUsed: Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] || 'medications',
      totalUsage: Object.values(categories).reduce((a, b) => a + b, 0),
      diversityIndex: Object.keys(categories).filter(key => categories[key] > 0).length
    };
  }

  projectResourceNeeds(patterns, days) {
    const projectionDays = Math.min(days, 30); // Project up to 30 days ahead
    const currentMonth = new Date().getMonth() + 1;
    
    return {
      medications: Math.round(patterns.dailyAverage.medications * projectionDays * 1.1), // 10% buffer
      vaccines: Math.round(patterns.dailyAverage.vaccines * projectionDays),
      supplies: Math.round(patterns.dailyAverage.supplies * projectionDays * 1.2), // 20% buffer
      projectionPeriod: projectionDays,
      confidenceLevel: 'medium'
    };
  }

  detectEarlyWarnings(trends) {
    const warnings = [];
    
    // Check for unusual disease pattern increases
    Object.entries(trends.categories).forEach(([disease, count]) => {
      if (count >= 3) { // 3 or more cases might indicate a trend
        warnings.push({
          type: 'disease_pattern',
          category: disease,
          count: count,
          severity: count >= 5 ? 'high' : 'medium',
          message: `Increase in ${disease} cases detected`
        });
      }
    });
    
    return warnings;
  }

  assessCommunityRisk(trends) {
    const totalCases = Object.values(trends.categories).reduce((a, b) => a + b, 0);
    
    return {
      overallRisk: totalCases > 10 ? 'medium' : 'low',
      communicableDiseaseRisk: this.assessCommunicableRisk(trends.categories),
      resourceStrain: totalCases > 15 ? 'high' : 'low',
      recommendations: this.generateRiskRecommendations(trends)
    };
  }

  assessCommunicableRisk(categories) {
    const communicable = ['fever_related', 'respiratory', 'gastrointestinal'];
    const communicableCases = communicable.reduce((sum, cat) => sum + (categories[cat] || 0), 0);
    
    if (communicableCases >= 5) return 'high';
    if (communicableCases >= 3) return 'medium';
    return 'low';
  }

  generateRiskRecommendations(trends) {
    const recommendations = [];
    
    if (trends.categories.respiratory >= 3) {
      recommendations.push('Increase respiratory protection supplies');
      recommendations.push('Monitor for outbreak patterns');
    }
    
    if (trends.categories.fever_related >= 3) {
      recommendations.push('Stock antipyretic medications');
      recommendations.push('Prepare isolation protocols');
    }
    
    if (trends.agePatterns.pediatric > trends.agePatterns.adult) {
      recommendations.push('Focus on pediatric care resources');
    }
    
    return recommendations;
  }

  assessSeasonalRisk(categories) {
    const currentMonth = new Date().getMonth() + 1;
    const isWetSeason = this.seasonalPatterns.wetSeason.months.includes(currentMonth);
    
    return {
      season: isWetSeason ? 'wet' : 'dry',
      riskLevel: isWetSeason ? 'elevated' : 'normal',
      expectedDiseases: isWetSeason ? ['fever_related', 'respiratory', 'gastrointestinal'] : ['dermatological', 'general'],
      seasonalMultiplier: isWetSeason ? 1.4 : 0.8
    };
  }

  getVaccineStorageRequirements(vaccineName) {
    const vaccine = vaccineName.toLowerCase();
    
    if (vaccine.includes('bcg') || vaccine.includes('measles')) return 'refrigerated';
    if (vaccine.includes('oral')) return 'frozen';
    return 'refrigerated';
  }

  extractResourcesFromTreatment(treatmentPlan, prescription) {
    const resources = [];
    
    if (prescription) {
      resources.push({ type: 'medication', details: prescription });
    }
    
    if (treatmentPlan) {
      if (treatmentPlan.toLowerCase().includes('injection')) {
        resources.push({ type: 'supply', item: 'syringes' });
      }
      if (treatmentPlan.toLowerCase().includes('bandage')) {
        resources.push({ type: 'supply', item: 'bandages' });
      }
    }
    
    return resources;
  }

  categorizeResourceUsage(serviceType) {
    if (!serviceType) return 'general';
    
    const service = serviceType.toLowerCase();
    if (service.includes('vaccination')) return 'biologics';
    if (service.includes('dental')) return 'dental_supplies';
    if (service.includes('consultation')) return 'diagnostic';
    
    return 'general_medical';
  }
}

module.exports = HealthcareDataCollector;