/**
 * Vaccine Usage Analytics Routes
 * 
 * Provides comprehensive analytics for vaccine usage including:
 * - Most administered vaccines
 * - Usage trends by time period
 * - Age group distributions
 * - Vaccination coverage statistics
 * - Inventory usage analytics
 */

const express = require('express');
const router = express.Router();
const { authenticateToken: auth } = require('../middleware/auth');

// Sample/hardcoded data for vaccine usage analytics
const generateVaccineUsageData = () => {
  const currentDate = new Date();
  
  // Base vaccine usage data
  const vaccines = [
    {
      id: 1,
      name: 'BCG (Bacillus Calmette-Guérin)',
      category: 'Routine Childhood',
      totalAdministered: 234,
      thisMonth: 18,
      thisWeek: 4,
      avgPerMonth: 19.5,
      ageGroups: {
        'newborn': 180,
        'infant': 45,
        'child': 9,
        'adult': 0
      },
      trend: 'increasing', // increasing, decreasing, stable
      lastAdministered: '2025-09-15T10:30:00Z',
      stockUsed: 85.2, // percentage
      batchesUsed: ['BCG001-2024', 'BCG002-2024'],
      adverseReactionRate: 2.1 // percentage
    },
    {
      id: 2,
      name: 'Hepatitis B Vaccine',
      category: 'Routine Childhood',
      totalAdministered: 189,
      thisMonth: 22,
      thisWeek: 6,
      avgPerMonth: 15.8,
      ageGroups: {
        'newborn': 89,
        'infant': 67,
        'child': 23,
        'adult': 10
      },
      trend: 'stable',
      lastAdministered: '2025-09-14T14:20:00Z',
      stockUsed: 67.3,
      batchesUsed: ['HB002-2024', 'HB003-2024'],
      adverseReactionRate: 1.6
    },
    {
      id: 3,
      name: 'Pentavalent Vaccine (DTP-HepB-Hib)',
      category: 'Routine Childhood',
      totalAdministered: 156,
      thisMonth: 15,
      thisWeek: 3,
      avgPerMonth: 13.0,
      ageGroups: {
        'newborn': 0,
        'infant': 145,
        'child': 11,
        'adult': 0
      },
      trend: 'stable',
      lastAdministered: '2025-09-13T09:45:00Z',
      stockUsed: 73.8,
      batchesUsed: ['PV003-2024'],
      adverseReactionRate: 3.2
    },
    {
      id: 4,
      name: 'COVID-19 mRNA Vaccine (Pfizer)',
      category: 'Emergency Use',
      totalAdministered: 298,
      thisMonth: 45,
      thisWeek: 12,
      avgPerMonth: 24.8,
      ageGroups: {
        'newborn': 0,
        'infant': 0,
        'child': 89,
        'adult': 156,
        'elderly': 53
      },
      trend: 'increasing',
      lastAdministered: '2025-09-16T08:15:00Z',
      stockUsed: 91.2,
      batchesUsed: ['COVID-PF-048', 'COVID-PF-049'],
      adverseReactionRate: 4.7
    },
    {
      id: 5,
      name: 'Influenza Vaccine',
      category: 'Annual',
      totalAdministered: 167,
      thisMonth: 28,
      thisWeek: 8,
      avgPerMonth: 13.9,
      ageGroups: {
        'newborn': 0,
        'infant': 12,
        'child': 45,
        'adult': 78,
        'elderly': 32
      },
      trend: 'increasing',
      lastAdministered: '2025-09-15T16:30:00Z',
      stockUsed: 42.1,
      batchesUsed: ['FLU-2024-25'],
      adverseReactionRate: 2.9
    },
    {
      id: 6,
      name: 'Measles, Mumps, and Rubella (MMR)',
      category: 'Routine Childhood',
      totalAdministered: 134,
      thisMonth: 11,
      thisWeek: 2,
      avgPerMonth: 11.2,
      ageGroups: {
        'newborn': 0,
        'infant': 67,
        'child': 67,
        'adult': 0
      },
      trend: 'stable',
      lastAdministered: '2025-09-12T11:00:00Z',
      stockUsed: 55.6,
      batchesUsed: ['MMR007-2024'],
      adverseReactionRate: 1.5
    },
    {
      id: 7,
      name: 'Pneumococcal Conjugate Vaccine (PCV)',
      category: 'Routine Childhood',
      totalAdministered: 145,
      thisMonth: 12,
      thisWeek: 3,
      avgPerMonth: 12.1,
      ageGroups: {
        'newborn': 0,
        'infant': 98,
        'child': 47,
        'adult': 0
      },
      trend: 'stable',
      lastAdministered: '2025-09-14T13:45:00Z',
      stockUsed: 61.3,
      batchesUsed: ['PCV006-2024'],
      adverseReactionRate: 2.7
    },
    {
      id: 8,
      name: 'Tetanus Toxoid (TT)',
      category: 'Adult',
      totalAdministered: 89,
      thisMonth: 8,
      thisWeek: 2,
      avgPerMonth: 7.4,
      ageGroups: {
        'newborn': 0,
        'infant': 0,
        'child': 0,
        'adult': 67,
        'elderly': 22
      },
      trend: 'stable',
      lastAdministered: '2025-09-11T10:20:00Z',
      stockUsed: 34.2,
      batchesUsed: ['TT-2024-31'],
      adverseReactionRate: 1.1
    }
  ];

  // Generate daily usage for last 30 days
  const dailyUsage = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - i);
    
    // Simulate realistic daily usage patterns
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseUsage = isWeekend ? 2 : 8;
    const randomVariation = Math.floor(Math.random() * 4) - 2;
    const totalVaccines = Math.max(0, baseUsage + randomVariation);
    
    dailyUsage.push({
      date: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      totalVaccinesAdministered: totalVaccines,
      uniqueVaccineTypes: Math.min(totalVaccines, Math.floor(totalVaccines * 0.7) + 1),
      patientsVaccinated: Math.max(1, Math.floor(totalVaccines * 0.8))
    });
  }

  // Generate weekly summary for last 12 weeks
  const weeklyUsage = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(currentDate);
    weekStart.setDate(weekStart.getDate() - (i * 7));
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const weeklyTotal = Math.floor(Math.random() * 25) + 15; // 15-40 vaccines per week
    
    weeklyUsage.push({
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      weekLabel: `Week ${12 - i}`,
      totalVaccines: weeklyTotal,
      patientsVaccinated: Math.floor(weeklyTotal * 0.85),
      routineChildhood: Math.floor(weeklyTotal * 0.6),
      adult: Math.floor(weeklyTotal * 0.25),
      emergency: Math.floor(weeklyTotal * 0.15)
    });
  }

  // Generate monthly summary for last 12 months
  const monthlyUsage = [];
  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(currentDate);
    monthDate.setMonth(monthDate.getMonth() - i);
    
    const monthlyTotal = Math.floor(Math.random() * 50) + 80; // 80-130 vaccines per month
    
    monthlyUsage.push({
      month: monthDate.toISOString().slice(0, 7), // YYYY-MM format
      monthName: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      totalVaccines: monthlyTotal,
      patientsVaccinated: Math.floor(monthlyTotal * 0.82),
      routineChildhood: Math.floor(monthlyTotal * 0.65),
      adult: Math.floor(monthlyTotal * 0.20),
      emergency: Math.floor(monthlyTotal * 0.15),
      coverage: Math.floor(Math.random() * 15) + 75 // 75-90% coverage
    });
  }

  return {
    vaccines,
    dailyUsage,
    weeklyUsage,
    monthlyUsage
  };
};

// @route   GET /api/vaccine-analytics/usage
// @desc    Get comprehensive vaccine usage analytics
// @access  Private
router.get('/usage', auth, async (req, res) => {
  try {
    console.log('📊 Fetching vaccine usage analytics...');
    
    const data = generateVaccineUsageData();
    
    // Calculate summary statistics
    const summary = {
      totalVaccinesAdministered: data.vaccines.reduce((sum, v) => sum + v.totalAdministered, 0),
      totalThisMonth: data.vaccines.reduce((sum, v) => sum + v.thisMonth, 0),
      totalThisWeek: data.vaccines.reduce((sum, v) => sum + v.thisWeek, 0),
      avgPerMonth: data.vaccines.reduce((sum, v) => sum + v.avgPerMonth, 0),
      activeVaccineTypes: data.vaccines.length,
      mostUsedVaccine: data.vaccines.reduce((prev, current) => 
        (prev.totalAdministered > current.totalAdministered) ? prev : current
      ),
      coverageRate: 87.3, // Overall coverage percentage
      adverseReactionRate: 2.4, // Overall adverse reaction rate
      batchesInUse: [...new Set(data.vaccines.flatMap(v => v.batchesUsed))].length
    };

    // Top vaccines by usage
    const topVaccines = [...data.vaccines]
      .sort((a, b) => b.totalAdministered - a.totalAdministered)
      .slice(0, 5)
      .map(vaccine => ({
        name: vaccine.name,
        category: vaccine.category,
        totalAdministered: vaccine.totalAdministered,
        thisMonth: vaccine.thisMonth,
        trend: vaccine.trend,
        stockUsed: vaccine.stockUsed
      }));

    // Age group distribution (aggregated)
    const ageGroupDistribution = data.vaccines.reduce((acc, vaccine) => {
      Object.keys(vaccine.ageGroups).forEach(ageGroup => {
        if (!acc[ageGroup]) acc[ageGroup] = 0;
        acc[ageGroup] += vaccine.ageGroups[ageGroup];
      });
      return acc;
    }, {});

    // Category distribution
    const categoryDistribution = data.vaccines.reduce((acc, vaccine) => {
      if (!acc[vaccine.category]) acc[vaccine.category] = 0;
      acc[vaccine.category] += vaccine.totalAdministered;
      return acc;
    }, {});

    const response = {
      success: true,
      summary,
      topVaccines,
      ageGroupDistribution,
      categoryDistribution,
      trends: {
        daily: data.dailyUsage.slice(-7), // Last 7 days
        weekly: data.weeklyUsage.slice(-4), // Last 4 weeks
        monthly: data.monthlyUsage.slice(-6) // Last 6 months
      },
      vaccines: data.vaccines,
      generatedAt: new Date().toISOString(),
      timePeriod: 'last_12_months'
    };

    console.log('✅ Vaccine usage analytics generated successfully');
    res.json(response);

  } catch (error) {
    console.error('❌ Error generating vaccine usage analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating vaccine usage analytics',
      error: error.message
    });
  }
});

// @route   GET /api/vaccine-analytics/trends/:period
// @desc    Get vaccine usage trends for specific time period
// @access  Private
router.get('/trends/:period', auth, async (req, res) => {
  try {
    const { period } = req.params;
    console.log(`📈 Fetching vaccine trends for period: ${period}`);
    
    const data = generateVaccineUsageData();
    let trendsData;
    
    switch (period) {
      case 'daily':
        trendsData = data.dailyUsage;
        break;
      case 'weekly':
        trendsData = data.weeklyUsage;
        break;
      case 'monthly':
        trendsData = data.monthlyUsage;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid period. Use daily, weekly, or monthly.'
        });
    }

    res.json({
      success: true,
      period,
      trends: trendsData,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching vaccine trends:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vaccine trends',
      error: error.message
    });
  }
});

// @route   GET /api/vaccine-analytics/coverage
// @desc    Get vaccination coverage statistics
// @access  Private
router.get('/coverage', auth, async (req, res) => {
  try {
    console.log('📊 Fetching vaccination coverage statistics...');
    
    // Generate coverage data by age group and vaccine type
    const coverageData = {
      byAgeGroup: {
        'newborn': {
          totalEligible: 45,
          vaccinated: 39,
          coverage: 86.7,
          requiredVaccines: ['BCG', 'Hepatitis B'],
          completionRate: 92.3
        },
        'infant': {
          totalEligible: 234,
          vaccinated: 198,
          coverage: 84.6,
          requiredVaccines: ['Pentavalent', 'PCV', 'MMR'],
          completionRate: 89.1
        },
        'child': {
          totalEligible: 167,
          vaccinated: 145,
          coverage: 86.8,
          requiredVaccines: ['MMR Booster', 'DTP Booster'],
          completionRate: 91.4
        },
        'adult': {
          totalEligible: 456,
          vaccinated: 398,
          coverage: 87.3,
          requiredVaccines: ['Tetanus', 'COVID-19', 'Influenza'],
          completionRate: 85.2
        },
        'elderly': {
          totalEligible: 89,
          vaccinated: 76,
          coverage: 85.4,
          requiredVaccines: ['Pneumococcal', 'Influenza', 'COVID-19'],
          completionRate: 88.9
        }
      },
      byVaccineType: {
        'Routine Childhood': {
          targetPopulation: 446,
          vaccinated: 387,
          coverage: 86.8,
          onSchedule: 356,
          delayed: 31,
          overdue: 28
        },
        'Adult': {
          targetPopulation: 545,
          vaccinated: 474,
          coverage: 87.0,
          onSchedule: 431,
          delayed: 43,
          overdue: 71
        },
        'Annual': {
          targetPopulation: 634,
          vaccinated: 542,
          coverage: 85.5,
          onSchedule: 498,
          delayed: 44,
          overdue: 92
        },
        'Emergency Use': {
          targetPopulation: 723,
          vaccinated: 634,
          coverage: 87.7,
          onSchedule: 589,
          delayed: 45,
          overdue: 89
        }
      },
      overallStatistics: {
        totalEligiblePopulation: 1267,
        totalVaccinated: 1089,
        overallCoverage: 86.0,
        herdImmunityThreshold: 90.0,
        gapToHerdImmunity: 4.0,
        estimatedDosesNeeded: 178
      },
      geographicCoverage: [
        { area: 'Urban Center', coverage: 91.2, population: 567 },
        { area: 'Suburban Areas', coverage: 88.4, population: 423 },
        { area: 'Rural Areas', coverage: 79.1, population: 277 }
      ]
    };

    res.json({
      success: true,
      coverage: coverageData,
      generatedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching vaccination coverage:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vaccination coverage',
      error: error.message
    });
  }
});

module.exports = router;