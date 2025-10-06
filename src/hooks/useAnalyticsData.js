import { useState, useEffect, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useDashboardStats } from './useDashboard';

/**
 * Shared analytics data hook that provides consistent chart data
 * across dashboard analytics and report components
 */
export const useAnalyticsData = () => {
  const { 
    patientsData, 
    familiesData, 
    appointmentsData, 
    sharedCheckupsData, 
    unsortedMembersData 
  } = useData();
  
  const { 
    data: dbStats, 
    isLoading: isLoadingStats, 
    error: statsError 
  } = useDashboardStats();

  // Calculate chart data that's shared between analytics and reports
  const chartData = useMemo(() => {
    // Real data processing
    let checkupTrendsData = [0, 0, 0, 0, 0, 0, 0]; // Default for Mon-Sun
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    if (dbStats?.checkupTrends) {
      // Process weekly trends from database
      dbStats.checkupTrends.forEach(trend => {
        const dayIndex = dayNames.indexOf(trend.day);
        if (dayIndex !== -1) {
          checkupTrendsData[dayIndex] = trend.completedCheckups;
        }
      });
    }

    // Medicine usage from database stats
    let medicineLabels = ['Paracetamol', 'Amoxicillin', 'Ibuprofen', 'Cetirizine', 'Aspirin'];
    let medicineUsageData = [15, 12, 10, 8, 5];
    
    if (dbStats?.prescriptions?.medicineUsage && dbStats.prescriptions.medicineUsage.length > 0) {
      medicineLabels = dbStats.prescriptions.medicineUsage.map(item => 
        item.medicine_name || item.name
      );
      medicineUsageData = dbStats.prescriptions.medicineUsage.map(item => item.usage_count);
    }

    // Vaccine usage from database stats  
    let vaccineLabels = ['COVID-19', 'Influenza', 'Hepatitis B', 'Tetanus', 'Pneumonia'];
    let vaccineUsageData = [25, 18, 15, 12, 8];
    
    if (dbStats?.vaccinations?.vaccineUsage && dbStats.vaccinations.vaccineUsage.length > 0) {
      vaccineLabels = dbStats.vaccinations.vaccineUsage.map(item => 
        item.vaccine_name || item.name
      );
      vaccineUsageData = dbStats.vaccinations.vaccineUsage.map(item => item.usage_count);
    }

    return {
      checkupTrends: {
        labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        datasets: [{
          label: 'Checkups Completed',
          data: checkupTrendsData,
          backgroundColor: '#9BC4E2',
          borderColor: '#7FB5DC',
          borderWidth: 2,
          fill: false
        }]
      },
      medicineUsage: {
        labels: medicineLabels,
        datasets: [{
          data: medicineUsageData,
          backgroundColor: ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa'],
          borderWidth: 0
        }]
      },
      vaccineUsage: {
        labels: vaccineLabels,
        datasets: [{
          data: vaccineUsageData,
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
          borderWidth: 0
        }]
      }
    };
  }, [dbStats]);

  // Chart options for different chart types
  const chartOptions = {
    line: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          position: 'top',
          display: true,
          labels: {
            color: '#333',
            font: { size: 12 }
          }
        },
        title: { display: false }
      },
      scales: {
        y: { 
          beginAtZero: true,
          max: (() => {
            // Calculate dynamic max value with padding to prevent overlap
            const dataValues = chartData.checkupTrends.datasets.flatMap(dataset => dataset.data);
            const maxDataValue = Math.max(...dataValues, 0);
            return maxDataValue === 0 ? 5 : Math.ceil(maxDataValue * 1.2); // Add 20% padding
          })(),
          ticks: {
            stepSize: (() => {
              const dataValues = chartData.checkupTrends.datasets.flatMap(dataset => dataset.data);
              const maxDataValue = Math.max(...dataValues, 0);
              const dynamicMax = maxDataValue === 0 ? 5 : Math.ceil(maxDataValue * 1.2);
              return Math.max(1, Math.ceil(dynamicMax / 10)); // Dynamic step size
            })(),
            precision: 0,
            color: '#333',
            font: { size: 11 },
            callback: function(value) {
              if (value % 1 === 0) {
                return value;
              }
            }
          },
          grid: { color: '#e9ecef' }
        },
        x: {
          ticks: {
            color: '#333',
            font: { size: 11 }
          },
          grid: { display: false }
        }
      }
    },
    pie: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#333',
            font: { size: 11 },
            usePointStyle: true,
            padding: 15
          }
        },
        title: { display: false }
      }
    }
  };

  return {
    chartData,
    chartOptions,
    isLoading: isLoadingStats,
    error: statsError,
    dbStats
  };
};
