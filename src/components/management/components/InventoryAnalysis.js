import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, ButtonGroup, Button, Modal, Table, Badge } from 'react-bootstrap';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import LoadingManagementBar from '../LoadingManagementBar';
import inventoryService from '../../../services/inventoryService';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement);

const InventoryAnalysis = ({ currentDateTime, isDarkMode, timePeriod = '30days', onNavigateToReports }) => {
  const [analyticsData, setAnalyticsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [realInventoryData, setRealInventoryData] = useState({ vaccines: [], medications: [] });
  const [prescriptionAnalytics, setPrescriptionAnalytics] = useState(null);
  const [medicineUsageData, setMedicineUsageData] = useState([]);
  const [vaccineUsageData, setVaccineUsageData] = useState([]);
  const [vaccineCategoryData, setVaccineCategoryData] = useState([]);
  const [showFullView, setShowFullView] = useState(false);
  const [prescriptionTrendsPeriod, setPrescriptionTrendsPeriod] = useState('days');
  const [showDetailModal, setShowDetailModal] = useState(null); // 'categoryDistribution', 'prescriptionUsage', 'vaccineUsage', 'prescriptionSummary'

  // Process real inventory data efficiently (limit to prevent performance issues)
  const processInventoryData = useMemo(() => {
    const allItems = [...realInventoryData.vaccines, ...realInventoryData.medications];
    
    console.log('🔄 Raw inventory data:', { 
      vaccines: realInventoryData.vaccines.length, 
      medications: realInventoryData.medications.length,
      total: allItems.length 
    });
    
    if (allItems.length === 0) {
      console.log('❌ No raw data available');
      return { processedItems: [], categories: {} };
    }

    // Limit to top 15 items by stock level for better performance and readability
    const sortedItems = allItems
      .map(item => ({
        name: item.name || item.medicine_name || item.vaccine_name || 'Unknown',
        stock: parseInt(item.dosesInStock || item.unitsInStock || item.stock_quantity || item.current_stock || 0),
        minLevel: parseInt(item.minimumStock || item.minimum_stock || item.min_stock || 50),
        category: item.type || (item.dosesInStock ? 'Vaccines' : 'Medications'),
        expiryDate: item.expiryDate || item.expiry_date || item.expiration_date,
        lastUpdated: item.updatedAt || item.last_updated || item.updated_at,
        id: item.id,
        batchNumber: item.batchNumber
      }))
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 15);

    // Calculate categories
    const categories = sortedItems.reduce((acc, item) => {
      const cat = item.category === 'Vaccines' ? 'Vaccines' : 'Medications';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    return { processedItems: sortedItems, categories };
  }, [realInventoryData]);

  // Process ALL inventory data for full view modal (no limits)
  const fullInventoryData = useMemo(() => {
    const allVaccines = realInventoryData.vaccines.map(item => ({
      name: item.name || item.vaccine_name || 'Unknown',
      stock: parseInt(item.dosesInStock || item.stock_quantity || 0),
      minLevel: parseInt(item.minimumStock || item.minimum_stock || 50),
      category: 'Vaccines',
      expiryDate: item.expiryDate || item.expiry_date,
      batchNumber: item.batchNumber,
      manufacturer: item.manufacturer,
      unitCost: item.unitCost,
      id: item.id
    }));

    const allMedications = realInventoryData.medications.map(item => ({
      name: item.name || item.medicine_name || 'Unknown',
      stock: parseInt(item.unitsInStock || item.stock_quantity || 0),
      minLevel: parseInt(item.minimumStock || item.minimum_stock || 50),
      category: 'Medications',
      expiryDate: item.expiryDate || item.expiry_date,
      batchNumber: item.batchNumber,
      manufacturer: item.manufacturer,
      unitCost: item.unitCost,
      id: item.id
    }));

    // Sort each category by stock level
    const sortedVaccines = allVaccines.sort((a, b) => b.stock - a.stock);
    const sortedMedications = allMedications.sort((a, b) => b.stock - a.stock);

    return {
      vaccines: sortedVaccines,
      medications: sortedMedications,
      totalItems: allVaccines.length + allMedications.length
    };
  }, [realInventoryData]);

  // Generate chart data for full view modal
  const fullViewChartData = useMemo(() => {
    if (fullInventoryData.totalItems === 0) {
      return { vaccinesChart: null, medicationsChart: null };
    }

    // Generate vaccines chart data
    const vaccinesChart = {
      labels: fullInventoryData.vaccines.map(item => 
        item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name
      ),
      datasets: [{
        label: 'Vaccine Stock Levels',
        data: fullInventoryData.vaccines.map(item => item.stock),
        backgroundColor: fullInventoryData.vaccines.map(item => {
          const ratio = item.stock / item.minLevel;
          if (ratio <= 0.25) return '#e74c3c'; // Critical
          if (ratio <= 0.5) return '#f39c12';  // Warning
          if (ratio <= 1) return '#3498db';    // Medium
          return '#2ecc71'; // Good
        }),
        borderColor: '#2c3e50',
        borderWidth: 1
      }]
    };

    // Generate medications chart data
    const medicationsChart = {
      labels: fullInventoryData.medications.map(item => 
        item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name
      ),
      datasets: [{
        label: 'Medication Stock Levels',
        data: fullInventoryData.medications.map(item => item.stock),
        backgroundColor: fullInventoryData.medications.map(item => {
          const ratio = item.stock / item.minLevel;
          if (ratio <= 0.25) return '#e74c3c'; // Critical
          if (ratio <= 0.5) return '#f39c12';  // Warning
          if (ratio <= 1) return '#3498db';    // Medium
          return '#2ecc71'; // Good
        }),
        borderColor: '#2c3e50',
        borderWidth: 1
      }]
    };

    // Generate vaccine category distribution chart for detailed view
    let categoryDistribution = null;
    if (vaccineCategoryData && vaccineCategoryData.categories && vaccineCategoryData.categories.length > 0) {
      categoryDistribution = {
        labels: vaccineCategoryData.categories.map(item => item.category),
        datasets: [{
          label: 'Vaccine Categories',
          data: vaccineCategoryData.categories.map(item => item.count),
          backgroundColor: [
            '#10b981', // Emerald
            '#3b82f6', // Blue
            '#8b5cf6', // Purple
            '#f59e0b', // Amber
            '#ef4444', // Red
            '#ec4899', // Pink
            '#06b6d4', // Cyan
            '#84cc16', // Lime
            '#f97316', // Orange
            '#8b5cf6'  // Violet
          ],
          borderColor: '#2c3e50',
          borderWidth: 1
        }]
      };
    }

    return { vaccinesChart, medicationsChart, categoryDistribution };
  }, [fullInventoryData, vaccineCategoryData]);

  // Generate usage pie charts data
  const usageChartsData = useMemo(() => {
    // Use real prescription analytics for prescription usage
    let prescriptionUsage = null;
    if (prescriptionAnalytics && prescriptionAnalytics.topMedications && prescriptionAnalytics.topMedications.length > 0) {
      const topPrescriptions = prescriptionAnalytics.topMedications.slice(0, 5);
      
      prescriptionUsage = {
        labels: topPrescriptions.map(item => 
          item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name
        ),
        datasets: [{
          data: topPrescriptions.map(item => item.totalQuantity),
          backgroundColor: [
            '#3498db',
            '#2ecc71', 
            '#f39c12',
            '#e74c3c',
            '#9b59b6'
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      };
    }

    // Generate vaccine usage from real API analytics data
    let vaccineUsage = null;
    if (vaccineUsageData && vaccineUsageData.usage && vaccineUsageData.usage.length > 0) {
      const topVaccines = vaccineUsageData.usage.slice(0, 6); // Top 6 vaccines by usage

      vaccineUsage = {
        labels: topVaccines.map(item => 
          item.vaccine_name.length > 20 ? item.vaccine_name.substring(0, 20) + '...' : item.vaccine_name
        ),
        datasets: [{
          data: topVaccines.map(item => item.usage_count),
          backgroundColor: [
            '#4ade80', // Green
            '#06b6d4', // Cyan  
            '#8b5cf6', // Purple
            '#f59e0b', // Orange
            '#ef4444', // Red
            '#ec4899'  // Pink
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      };
      
      console.log('📊 Vaccine usage chart generated:', {
        labels: vaccineUsage.labels,
        dataPoints: vaccineUsage.datasets[0].data
      });
    }

    // Generate vaccine category distribution chart
    let vaccineCategoryChart = null;
    if (vaccineCategoryData && vaccineCategoryData.categories && vaccineCategoryData.categories.length > 0) {
      vaccineCategoryChart = {
        labels: vaccineCategoryData.categories.map(item => 
          item.category.length > 20 ? item.category.substring(0, 20) + '...' : item.category
        ),
        datasets: [{
          data: vaccineCategoryData.categories.map(item => item.count),
          backgroundColor: [
            '#10b981', // Emerald
            '#3b82f6', // Blue
            '#8b5cf6', // Purple
            '#f59e0b', // Amber
            '#ef4444', // Red
            '#ec4899', // Pink
            '#06b6d4', // Cyan
            '#84cc16'  // Lime
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      };
      
      console.log('📊 Vaccine category chart generated:', {
        labels: vaccineCategoryChart.labels,
        dataPoints: vaccineCategoryChart.datasets[0].data
      });
    }

    return { prescriptionUsage, vaccineUsage, vaccineCategoryChart };
  }, [fullInventoryData, prescriptionAnalytics, medicineUsageData, vaccineUsageData, vaccineCategoryData]);

  // Generate prescription trends chart data based on selected period
  const prescriptionTrendsData = useMemo(() => {
    if (!prescriptionAnalytics || !prescriptionAnalytics.dailyTrends) {
      return null;
    }

    const generateTrendsForPeriod = (period) => {
      const today = new Date();
      
      switch (period) {
        case 'days':
          // Show Monday to Sunday of current week
          const startOfWeek = new Date(today);
          const dayOfWeek = today.getDay();
          const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Monday start
          startOfWeek.setDate(diff);
          
          const weekDays = [];
          const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          
          for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            
            const prescriptionCount = prescriptionAnalytics.dailyTrends.find(
              t => t.date === dateStr
            )?.prescriptionCount || 0;
            
            weekDays.push({
              label: dayNames[i],
              count: prescriptionCount
            });
          }
          
          return {
            labels: weekDays.map(d => d.label),
            data: weekDays.map(d => d.count),
            title: 'This Week'
          };

        case 'weeks':
          // Show weeks of current month (1-4 or 5 weeks)
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          
          const weeks = [];
          let weekStart = new Date(startOfMonth);
          let weekNumber = 1;
          
          while (weekStart <= endOfMonth) {
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            
            if (weekEnd > endOfMonth) {
              weekEnd.setTime(endOfMonth.getTime());
            }
            
            // Count prescriptions in this week
            let weekCount = 0;
            prescriptionAnalytics.dailyTrends.forEach(trend => {
              const trendDate = new Date(trend.date);
              if (trendDate >= weekStart && trendDate <= weekEnd) {
                weekCount += trend.prescriptionCount;
              }
            });
            
            weeks.push({
              label: `Week ${weekNumber}`,
              count: weekCount
            });
            
            weekStart.setDate(weekStart.getDate() + 7);
            weekNumber++;
          }
          
          return {
            labels: weeks.map(w => w.label),
            data: weeks.map(w => w.count),
            title: 'This Month'
          };

        case 'months':
          // Show all 12 months of current year
          const currentYear = today.getFullYear();
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                             'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          
          const months = monthNames.map((monthName, index) => {
            // For now, use available daily data to estimate monthly totals
            // This is simplified - in production you'd want monthly aggregation from backend
            const monthStart = new Date(currentYear, index, 1);
            const monthEnd = new Date(currentYear, index + 1, 0);
            
            let monthCount = 0;
            prescriptionAnalytics.dailyTrends.forEach(trend => {
              const trendDate = new Date(trend.date);
              if (trendDate >= monthStart && trendDate <= monthEnd) {
                monthCount += trend.prescriptionCount;
              }
            });
            
            return {
              label: monthName,
              count: monthCount
            };
          });
          
          return {
            labels: months.map(m => m.label),
            data: months.map(m => m.count),
            title: `Year ${currentYear}`
          };

        case 'years':
          // Show last 5 years up to current year
          const years = [];
          for (let i = 4; i >= 0; i--) {
            const year = today.getFullYear() - i;
            // Only show data for current year, past years will be 0 unless we have real historical data
            const yearCount = i === 0 ? prescriptionAnalytics.summary.totalPrescriptions : 0;
            
            years.push({
              label: year.toString(),
              count: yearCount
            });
          }
          
          return {
            labels: years.map(y => y.label),
            data: years.map(y => y.count),
            title: 'Last 5 Years'
          };

        default:
          return null;
      }
    };

    const trendsData = generateTrendsForPeriod(prescriptionTrendsPeriod);
    
    if (!trendsData) return null;
    
    return {
      labels: trendsData.labels,
      datasets: [{
        label: `Prescriptions (${trendsData.title})`,
        data: trendsData.data,
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3498db',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    };
  }, [prescriptionAnalytics, prescriptionTrendsPeriod]);

  // Helper function to get expiry status
  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { status: 'No Date', variant: 'secondary' };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { status: `Expired ${Math.abs(diffDays)} days ago`, variant: 'danger' };
    } else if (diffDays <= 7) {
      return { status: `${diffDays} days left`, variant: 'warning' };
    } else if (diffDays <= 30) {
      return { status: `${diffDays} days`, variant: 'info' };
    } else {
      return { status: `${diffDays} days`, variant: 'success' };
    }
  };

  // Generate analytics data using real inventory data
  const generateAnalyticsData = useMemo(() => {
    const { processedItems, categories } = processInventoryData;

    if (processedItems.length === 0) {
      // No inventory data available - return null values to show "No data detected" messages
      return {
        stockLevels: null,
        categoryDistribution: null
      };
    }

    // Real stock levels chart
    const stockLevels = {
      labels: processedItems.map(item => item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name),
      datasets: [{
        label: 'Current Stock',
        data: processedItems.map(item => item.stock),
        backgroundColor: processedItems.map(item => {
          const ratio = item.stock / item.minLevel;
          if (ratio <= 0.25) return '#e74c3c'; // Critical
          if (ratio <= 0.5) return '#f39c12';  // Warning
          if (ratio <= 1) return '#3498db';    // Medium
          return '#2ecc71'; // Good
        }),
        borderColor: processedItems.map(item => {
          const ratio = item.stock / item.minLevel;
          if (ratio <= 0.25) return '#c0392b';
          if (ratio <= 0.5) return '#e67e22';
          if (ratio <= 1) return '#2980b9';
          return '#27ae60';
        }),
        borderWidth: 2
      }]
    };

    // Vaccine Category distribution using real API data
    let categoryDistribution = null;
    if (vaccineCategoryData && vaccineCategoryData.categories && vaccineCategoryData.categories.length > 0) {
      const categoryLabels = vaccineCategoryData.categories.map(cat => cat.category);
      const categoryData = vaccineCategoryData.categories.map(cat => cat.count);
      
      categoryDistribution = {
        labels: categoryLabels,
        datasets: [{
          data: categoryData,
          backgroundColor: categoryLabels.map((_, index) => {
            const colors = ['#4ade80', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];
            return colors[index % colors.length];
          }),
          borderWidth: 0,
          cutout: '60%'
        }]
      };
      
      console.log('📊 Vaccine category distribution chart generated:', {
        labels: categoryLabels,
        dataPoints: categoryData
      });
    } else {
      // No vaccine category data available - return null to show "No data detected" message
      categoryDistribution = null;
      console.log('❌ No vaccine category data available for chart generation');
    }

    return { stockLevels, categoryDistribution };
  }, [processInventoryData, timePeriod, prescriptionAnalytics, medicineUsageData, vaccineCategoryData]);

  // Helper function to create custom reports from charts
  const createCustomReport = (chartType, chartName, chartData, navigateToReports = null) => {
    try {
      // Validate that we have chart data
      if (!chartData || !chartData.labels || !chartData.datasets) {
        console.error('❌ Invalid chart data provided:', chartData);
        alert('❌ Cannot create report: Chart data is not available yet. Please wait for data to load.');
        return;
      }

      // Deep copy the chart data to preserve all information
      const deepCopyChartData = JSON.parse(JSON.stringify(chartData));

      // Generate unique report ID
      const reportId = `custom_${Date.now()}`;
      
      // Map chart types to report types
      const reportTypeMapping = {
        'stock-levels': {
          id: 'custom-stock-levels',
          name: 'Stock Levels Analysis',
          category: 'Inventory Management',
          description: 'Current medication and vaccine stock levels'
        },
        'category-distribution': {
          id: 'custom-category-distribution',
          name: 'Category Distribution',
          category: 'Inventory Management', 
          description: 'Distribution of inventory by categories'
        },
        'prescription-usage': {
          id: 'custom-prescription-usage',
          name: 'Prescription Usage Distribution',
          category: 'Inventory Management',
          description: 'Most prescribed medications distribution'
        },
        'vaccine-usage': {
          id: 'custom-vaccine-usage',
          name: 'Vaccine Usage Distribution',
          category: 'Inventory Management',
          description: 'Most administered vaccines distribution'
        },
        'prescription-trends': {
          id: 'custom-prescription-trends',
          name: 'Prescription Trends',
          category: 'Inventory Management',
          description: 'Prescription volume trends over time'
        }
      };

      const reportType = reportTypeMapping[chartType] || {
        id: 'custom-generic',
        name: chartName,
        category: 'Inventory Management',
        description: 'Custom chart from inventory analysis'
      };

      // Determine best chart type based on data
      let recommendedChartType = 'bar';
      if (chartType.includes('distribution') || chartType.includes('usage')) {
        recommendedChartType = 'pie';
      } else if (chartType.includes('trends')) {
        recommendedChartType = 'line';
      }

      // Deep copy the chart data to ensure it's preserved
      const copiedChartData = {
        labels: [...chartData.labels],
        datasets: chartData.datasets.map(dataset => ({
          ...dataset,
          data: [...dataset.data],
          backgroundColor: Array.isArray(dataset.backgroundColor) 
            ? [...dataset.backgroundColor] 
            : dataset.backgroundColor,
          borderColor: Array.isArray(dataset.borderColor)
            ? [...dataset.borderColor]
            : dataset.borderColor
        }))
      };

      // Create the custom report object with deep copied data
      const customReport = {
        id: reportId,
        type: reportType,
        chartType: recommendedChartType,
        createdAt: new Date(),
        source: 'inventory-analysis',
        data: deepCopyChartData,
        originalChartType: chartType
      };

      // Get existing custom reports from localStorage
      const existingReports = JSON.parse(localStorage.getItem('reports_createdReports') || '{}');
      
      // Find next available slot (1-12)
      let selectedSlot = null;
      for (let i = 1; i <= 12; i++) {
        if (!existingReports[i]) {
          selectedSlot = i;
          break;
        }
      }

      if (!selectedSlot) {
        // If all slots are full, ask user which one to replace
        const shouldReplace = window.confirm(
          'All report slots are full. Would you like to replace the oldest report?'
        );
        if (shouldReplace) {
          // Find the oldest report to replace
          let oldestSlot = 1;
          let oldestDate = new Date();
          
          Object.entries(existingReports).forEach(([slot, report]) => {
            const reportDate = new Date(report.createdAt);
            if (reportDate < oldestDate) {
              oldestDate = reportDate;
              oldestSlot = parseInt(slot);
            }
          });
          selectedSlot = oldestSlot;
        } else {
          return; // User cancelled
        }
      }

      // Add the report to the selected slot
      existingReports[selectedSlot] = customReport;
      
      // Save back to localStorage
      localStorage.setItem('reports_createdReports', JSON.stringify(existingReports));
      
      console.log('✅ Custom report created:', {
        reportId,
        slot: selectedSlot,
        type: reportType.name,
        chartType: recommendedChartType,
        dataLabels: deepCopyChartData.labels?.length || 0,
        dataPoints: deepCopyChartData.datasets?.[0]?.data?.length || 0
      });

      // Navigate to Reports page if navigation function provided
      if (navigateToReports && typeof navigateToReports === 'function') {
        navigateToReports();
        
        // Show success message after navigation
        setTimeout(() => {
          alert(`✅ Custom report "${reportType.name}" created successfully!\n\nReport is now visible in slot ${selectedSlot}.`);
        }, 500);
      } else {
        // Fallback: show message and suggest manual navigation
        alert(`✅ Custom report "${reportType.name}" created successfully!\n\nPlease navigate to Reports page to view it in slot ${selectedSlot}.`);
      }

    } catch (error) {
      console.error('❌ Failed to create custom report:', error);
      alert('❌ Failed to create custom report. Please try again.');
    }
  };

  // Load real inventory data
  useEffect(() => {
    let isMounted = true;
    
    const loadInventoryData = async () => {
      setLoading(true);
      
      try {
        // Load real data from inventory service - same pattern as VaccineInventory
        const [vaccinesData, medicationsData] = await Promise.all([
          inventoryService.getAllVaccines().catch(err => {
            console.error('Vaccines API error:', err);
            return [];
          }),
          inventoryService.getAllMedications().catch(err => {
            console.error('Medications API error:', err);
            return [];
          })
        ]);

        console.log('📡 API Responses:', { 
          vaccines: Array.isArray(vaccinesData) ? vaccinesData.length : 'Not array',
          medications: Array.isArray(medicationsData) ? medicationsData.length : 'Not array'
        });

        if (isMounted) {
          setRealInventoryData({
            vaccines: Array.isArray(vaccinesData) ? vaccinesData : [],
            medications: Array.isArray(medicationsData) ? medicationsData : []
          });
        }
      } catch (error) {
        console.error('Error loading inventory data:', error);
        if (isMounted) {
          // Set empty data on error
          setRealInventoryData({ vaccines: [], medications: [] });
        }
      }
    };

    loadInventoryData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Load prescription analytics based on time period
  useEffect(() => {
    let isMounted = true;
    
    const loadPrescriptionAnalytics = async () => {
      try {
        console.log(`📊 Loading prescription analytics for ${timePeriod}...`);
        const analytics = await inventoryService.getPrescriptionAnalytics(timePeriod);
        
        if (isMounted) {
          setPrescriptionAnalytics(analytics);
          console.log('✅ Prescription analytics loaded:', analytics.summary);
        }
      } catch (error) {
        console.error('Error loading prescription analytics:', error);
        if (isMounted) {
          setPrescriptionAnalytics(null);
        }
      }
    };

    loadPrescriptionAnalytics();
    
    return () => {
      isMounted = false;
    };
  }, [timePeriod]);

  // Load medicine usage analytics
  useEffect(() => {
    let isMounted = true;
    
    const loadMedicineUsageAnalytics = async () => {
      try {
        console.log('💊 Loading medicine usage analytics...');
        const medicineUsage = await inventoryService.getMedicineUsageAnalytics();
        
        if (isMounted) {
          setMedicineUsageData(medicineUsage);
          console.log('✅ Medicine usage analytics loaded:', medicineUsage.slice(0, 3));
        }
      } catch (error) {
        console.error('Error loading medicine usage analytics:', error);
        if (isMounted) {
          setMedicineUsageData([]);
        }
      }
    };

    loadMedicineUsageAnalytics();
    
    return () => {
      isMounted = false;
    };
  }, [timePeriod]); // Reload when time period changes

  // Load vaccine analytics (usage distribution and category distribution)
  useEffect(() => {
    let isMounted = true;
    
    const loadVaccineAnalytics = async () => {
      try {
        console.log('💉 Loading vaccine analytics for Management Dashboard...');
        
        // Load both vaccine usage and category distribution in parallel
        const [usageData, categoryData] = await Promise.all([
          inventoryService.getVaccineUsageDistribution().catch(err => {
            console.error('Vaccine usage API error:', err);
            return [];
          }),
          inventoryService.getVaccineCategoryDistribution().catch(err => {
            console.error('Vaccine category API error:', err);
            return [];
          })
        ]);
        
        if (isMounted) {
          setVaccineUsageData(usageData);
          setVaccineCategoryData(categoryData);
          console.log('✅ Vaccine analytics loaded:', {
            usageCount: usageData.length,
            categoryCount: categoryData.length
          });
        }
      } catch (error) {
        console.error('Error loading vaccine analytics:', error);
        if (isMounted) {
          setVaccineUsageData([]);
          setVaccineCategoryData([]);
        }
      }
    };

    loadVaccineAnalytics();
    
    return () => {
      isMounted = false;
    };
  }, [timePeriod]); // Reload when time period changes

  // Generate analytics when data changes
  useEffect(() => {
    let isMounted = true;
    
    const updateAnalytics = () => {
      // Small delay to ensure processInventoryData is updated
      const timeoutId = setTimeout(() => {
        if (isMounted) {
          setAnalyticsData(generateAnalyticsData);
          setLoading(false);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    };

    const cleanup = updateAnalytics();
    
    return () => {
      isMounted = false;
      if (cleanup) cleanup();
    };
  }, [generateAnalyticsData]);

  // Calculate real metrics from inventory data
  const realMetrics = useMemo(() => {
    const { processedItems } = processInventoryData;
    
    console.log('📊 Processing items for metrics:', processedItems.length, processedItems);
    
    if (processedItems.length === 0) {
      console.log('⚠️ No processed items available for metrics');
      return {
        lowStockAlerts: 0,
        totalValue: 0,
        expiringSoon: 0,
        expiredItems: 0,
        criticalItems: 0,
        mostUsed: 'Loading...'
      };
    }

    // Calculate low stock alerts (items below 50% of minimum)
    const lowStockAlerts = processedItems.filter(item => 
      item.stock <= (item.minLevel * 0.5)
    ).length;

    // Estimate total value (using average price estimates)
    const totalValue = processedItems.reduce((sum, item) => {
      const estimatedPrice = item.category === 'Vaccines' ? 500 : 50; // Rough estimates
      return sum + (item.stock * estimatedPrice);
    }, 0);

    // Calculate expiring soon (next 30 days) and expired items
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    console.log('📅 Date calculations:', { 
      today: today.toDateString(), 
      thirtyDaysFromNow: thirtyDaysFromNow.toDateString() 
    });
    
    const expiringSoonItems = processedItems.filter(item => {
      if (!item.expiryDate) return false;
      
      const expiryDate = new Date(item.expiryDate);
      expiryDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
      
      const isExpiring = expiryDate <= thirtyDaysFromNow;
      if (isExpiring) {
        console.log(`📋 Expiring item: ${item.name} - ${expiryDate.toDateString()}`);
      }
      
      // Include both expired items and items expiring within 30 days
      return isExpiring;
    });
    
    const expiringSoon = expiringSoonItems.length;

    // Find most used from real prescription data
    let mostUsed = 'N/A';
    if (medicineUsageData && medicineUsageData.length > 0) {
      mostUsed = medicineUsageData[0].medicine_name.split(' ')[0];
    } else if (processedItems.length > 0) {
      // Fallback to highest stock item
      mostUsed = processedItems[0].name.split(' ')[0];
    }

    // Calculate additional expiry metrics for better insights
    const expiredItemsList = processedItems.filter(item => {
      if (!item.expiryDate) return false;
      const expiryDate = new Date(item.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);
      return expiryDate < today;
    });
    
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);
    
    const criticalItemsList = processedItems.filter(item => {
      if (!item.expiryDate) return false;
      const expiryDate = new Date(item.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);
      return expiryDate >= today && expiryDate <= sevenDaysFromNow;
    });
    
    console.log('🔴 Expired items:', expiredItemsList.map(item => `${item.name}: ${item.expiryDate}`));
    console.log('🟠 Critical items:', criticalItemsList.map(item => `${item.name}: ${item.expiryDate}`));
    
    const expiredItems = expiredItemsList.length;
    const criticalItems = criticalItemsList.length;

    const metrics = {
      lowStockAlerts,
      totalValue: totalValue.toLocaleString(),
      expiringSoon,
      expiredItems,
      criticalItems,
      mostUsed
    };
    
    console.log('📈 Final metrics calculated:', metrics);
    
    return metrics;
  }, [processInventoryData, medicineUsageData]);

  // Secure chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    }
  };

  if (loading) {
    return <LoadingManagementBar message="Loading inventory analytics data..." duration="normal" />;
  }

  return (
    <div className="inventory-analysis">
      {/* Enhanced Metrics Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="metric-card border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="metric-icon bg-danger text-white rounded-circle me-3">
                  <i className="bi bi-exclamation-circle"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1">Expired Items</h6>
                  <h3 className="mb-0 text-danger">{realMetrics.expiredItems || 0}</h3>
                  <small className="text-muted">Already expired</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="metric-card border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="metric-icon bg-warning text-white rounded-circle me-3">
                  <i className="bi bi-clock"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1">Critical (≤7 days)</h6>
                  <h3 className="mb-0 text-warning">{realMetrics.criticalItems || 0}</h3>
                  <small className="text-muted">Expiring soon</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="metric-card border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="metric-icon bg-info text-white rounded-circle me-3">
                  <i className="bi bi-calendar-x"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1">Expiring (≤30 days)</h6>
                  <h3 className="mb-0 text-info">{realMetrics.expiringSoon}</h3>
                  <small className="text-muted">Including expired</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="metric-card border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="metric-icon bg-secondary text-white rounded-circle me-3">
                  <i className="bi bi-exclamation-triangle"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1">Low Stock</h6>
                  <h3 className="mb-0 text-secondary">{realMetrics.lowStockAlerts}</h3>
                  <small className="text-muted">Need reorder</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <Row className="mb-4">
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-bar-chart me-2 text-primary"></i>
                Current Stock Levels
              </h5>
              <div className="d-flex gap-2">
                <Button 
                  variant="outline-success" 
                  size="sm"
                  onClick={() => createCustomReport('stock-levels', 'Current Stock Levels', analyticsData.stockLevels, onNavigateToReports)}
                  className="d-flex align-items-center"
                  disabled={!analyticsData.stockLevels}
                >
                  <i className="bi bi-file-plus me-1"></i>
                  Create Custom Report
                </Button>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => setShowFullView(true)}
                  className="d-flex align-items-center"
                >
                  <i className="bi bi-arrows-fullscreen me-1"></i>
                  View All Items
                </Button>
              </div>
            </Card.Header>
            <Card.Body style={{ height: '300px' }}>
              {analyticsData.stockLevels && (
                <Bar
                  data={analyticsData.stockLevels}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      legend: { display: false }
                    }
                  }}
                />
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">
                  <i className="bi bi-pie-chart me-2 text-success"></i>
                  Category Distribution
                </h5>
              </div>
              <div className="d-flex gap-2">
                <Button 
                  variant="outline-success" 
                  size="sm"
                  onClick={() => createCustomReport('category-distribution', 'Category Distribution', usageChartsData.vaccineCategoryChart, onNavigateToReports)}
                  className="d-flex align-items-center"
                  disabled={!usageChartsData.vaccineCategoryChart}
                  title="Create custom report from this chart"
                >
                  <i className="bi bi-file-plus"></i>
                </Button>
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => setShowDetailModal('categoryDistribution')}
                  title="View detailed category analysis"
                >
                  <i className="bi bi-arrows-fullscreen"></i>
                </Button>
              </div>
            </Card.Header>
            <Card.Body style={{ height: '300px' }}>
              {usageChartsData.vaccineCategoryChart ? (
                <Doughnut
                  data={usageChartsData.vaccineCategoryChart}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { 
                        position: 'bottom',
                        labels: {
                          usePointStyle: true,
                          padding: 20
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} vaccines (${percentage}%)`;
                          }
                        }
                      }
                    }
                  }}
                />
              ) : (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-pie-chart display-4 mb-3"></i>
                  <p>No vaccine category data detected</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Usage Analysis Charts */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-pie-chart me-2 text-info"></i>
                Prescription Usage Distribution
              </h5>
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={() => setShowDetailModal('prescriptionUsage')}
                className="d-flex align-items-center"
              >
                <i className="bi bi-fullscreen me-1"></i>
                Zoom
              </Button>
            </Card.Header>
            <Card.Body style={{ height: '300px' }}>
              {usageChartsData.prescriptionUsage ? (
                <Doughnut
                  data={usageChartsData.prescriptionUsage}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { 
                        position: 'bottom',
                        labels: {
                          usePointStyle: true,
                          padding: 15,
                          font: { size: 11 }
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} units (${percentage}%)`;
                          }
                        }
                      }
                    },
                    cutout: '60%'
                  }}
                />
              ) : (
                <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                  <div className="text-center">
                    <i className="bi bi-pie-chart display-4 mb-3"></i>
                    <p>No prescription data available</p>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-pie-chart-fill me-2 text-success"></i>
                Vaccine Usage Distribution
              </h5>
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={() => setShowDetailModal('vaccineUsage')}
                className="d-flex align-items-center"
              >
                <i className="bi bi-fullscreen me-1"></i>
                Zoom
              </Button>
            </Card.Header>
            <Card.Body style={{ height: '300px' }}>
              {usageChartsData.vaccineUsage ? (
                <Doughnut
                  data={usageChartsData.vaccineUsage}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { 
                        position: 'bottom',
                        labels: {
                          usePointStyle: true,
                          padding: 15,
                          font: { size: 11 }
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} doses (${percentage}%)`;
                          }
                        }
                      }
                    },
                    cutout: '60%'
                  }}
                />
              ) : (
                <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                  <div className="text-center">
                    <i className="bi bi-pie-chart-fill display-4 mb-3"></i>
                    <p>No vaccine data available</p>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Prescription Trends Chart */}
      {prescriptionAnalytics && (
        <Row className="mb-4">
          <Col md={8}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1">
                    <i className="bi bi-graph-up me-2 text-primary"></i>
                    Prescription Trends
                  </h5>
                  <small className="text-muted">
                    Total prescriptions: {prescriptionAnalytics.summary.totalPrescriptions} | 
                    Total medications dispensed: {prescriptionAnalytics.summary.totalMedicationsDispensed}
                  </small>
                </div>
                
                {/* Time Period Buttons */}
                <div className="btn-group btn-group-sm" role="group">
                  <button 
                    type="button" 
                    className={`btn ${prescriptionTrendsPeriod === 'days' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setPrescriptionTrendsPeriod('days')}
                  >
                    Days
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${prescriptionTrendsPeriod === 'weeks' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setPrescriptionTrendsPeriod('weeks')}
                  >
                    Weeks
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${prescriptionTrendsPeriod === 'months' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setPrescriptionTrendsPeriod('months')}
                  >
                    Months
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${prescriptionTrendsPeriod === 'years' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setPrescriptionTrendsPeriod('years')}
                  >
                    Years
                  </button>
                </div>
              </Card.Header>
              <Card.Body style={{ height: '400px' }}>
                {prescriptionTrendsData ? (
                  <Line
                    data={prescriptionTrendsData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          mode: 'index',
                          intersect: false,
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          titleColor: '#fff',
                          bodyColor: '#fff',
                          callbacks: {
                            label: function(context) {
                              return `Prescriptions: ${context.parsed.y}`;
                            }
                          }
                        }
                      },
                      scales: {
                        x: {
                          grid: { display: false },
                          title: {
                            display: true,
                            text: 'Time Period'
                          }
                        },
                        y: {
                          beginAtZero: true,
                          grid: { color: 'rgba(0,0,0,0.1)' },
                          title: {
                            display: true,
                            text: 'Number of Prescriptions'
                          }
                        }
                      },
                      elements: {
                        point: {
                          hoverRadius: 8
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                    <div className="text-center">
                      <i className="bi bi-graph-up display-4 mb-3"></i>
                      <p>Loading prescription trends...</p>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="bi bi-capsule me-2 text-success"></i>
                  Prescription Summary
                </h5>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => setShowDetailModal('prescriptionSummary')}
                  className="d-flex align-items-center"
                >
                  <i className="bi bi-eye me-1"></i>
                  View Details
                </Button>
              </Card.Header>
              <Card.Body style={{ height: '400px' }}>
                <div className="d-flex flex-column gap-3 h-100">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">Total Prescriptions</span>
                    <span className="fw-bold fs-5 text-primary">{prescriptionAnalytics.summary.totalPrescriptions}</span>
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">Medications Dispensed</span>
                    <span className="fw-bold fs-5 text-success">{prescriptionAnalytics.summary.totalMedicationsDispensed}</span>
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">Avg per Prescription</span>
                    <span className="fw-bold fs-5 text-info">{prescriptionAnalytics.summary.avgMedicationsPerPrescription}</span>
                  </div>
                  
                  <hr className="my-2" />
                  
                  <div className="text-center">
                    <h6 className="text-muted mb-3">Top Prescribed Medication</h6>
                    {prescriptionAnalytics.topMedications && prescriptionAnalytics.topMedications.length > 0 ? (
                      <div>
                        <div className="fw-bold text-primary">{prescriptionAnalytics.topMedications[0].name}</div>
                        <small className="text-muted">
                          {prescriptionAnalytics.topMedications[0].totalQuantity} units • 
                          {prescriptionAnalytics.topMedications[0].prescriptionCount} prescriptions
                        </small>
                      </div>
                    ) : (
                      <span className="text-muted">No data available</span>
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}



      {/* Full Inventory View Modal */}
      <Modal 
        show={showFullView} 
        onHide={() => setShowFullView(false)} 
        size="xl" 
        centered
        className="full-inventory-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-boxes me-2"></i>
            Complete Inventory Overview
            <small className="text-muted ms-2">({fullInventoryData.totalItems} items total)</small>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {fullInventoryData.totalItems === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox display-1 text-muted"></i>
              <h4 className="mt-3 text-muted">No Inventory Data Available</h4>
              <p className="text-muted">Please add some inventory items to see the analysis.</p>
            </div>
          ) : (
            <>
              {/* Prescription/Medications Section */}
              {fullInventoryData.medications.length > 0 && (
                <div className="mb-5">
                  <div className="d-flex align-items-center mb-3">
                    <h5 className="mb-0">
                      <i className="bi bi-capsule me-2 text-info"></i>
                      Prescription Medications
                    </h5>
                    <Badge bg="info" className="ms-2">{fullInventoryData.medications.length} items</Badge>
                  </div>
                  
                  {/* Medications Chart */}
                  <Card className="border-0 shadow-sm mb-4">
                    <Card.Body style={{ height: '400px' }}>
                      {fullViewChartData.medicationsChart && (
                        <Bar
                          data={fullViewChartData.medicationsChart}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: { display: false },
                              title: {
                                display: true,
                                text: 'Medication Stock Levels',
                                font: { size: 16, weight: 'bold' }
                              },
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    return `Stock: ${context.parsed.y} units`;
                                  }
                                }
                              }
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                title: { 
                                  display: true, 
                                  text: 'Stock Quantity' 
                                }
                              },
                              x: {
                                ticks: {
                                  maxRotation: 45,
                                  minRotation: 45
                                }
                              }
                            }
                          }}
                        />
                      )}
                    </Card.Body>
                  </Card>

                  {/* Medications Table */}
                  <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-light">
                      <h6 className="mb-0">Detailed Medication Inventory</h6>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <Table striped hover className="mb-0">
                          <thead className="bg-light sticky-top">
                            <tr>
                              <th>Medication</th>
                              <th>Stock</th>
                              <th>Min Level</th>
                              <th>Expiry Date</th>
                              <th>Status</th>
                              <th>Manufacturer</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fullInventoryData.medications.map((item, index) => {
                              const expiryStatus = getExpiryStatus(item.expiryDate);
                              const stockRatio = item.stock / item.minLevel;
                              return (
                                <tr key={item.id || index}>
                                  <td className="fw-medium">{item.name}</td>
                                  <td>
                                    <Badge bg={
                                      stockRatio <= 0.25 ? 'danger' :
                                      stockRatio <= 0.5 ? 'warning' :
                                      stockRatio <= 1 ? 'info' : 'success'
                                    }>
                                      {item.stock}
                                    </Badge>
                                  </td>
                                  <td className="text-muted">{item.minLevel}</td>
                                  <td>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</td>
                                  <td>
                                    <Badge bg={expiryStatus.variant} className="small">
                                      {expiryStatus.status}
                                    </Badge>
                                  </td>
                                  <td className="text-muted small">{item.manufacturer || 'N/A'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </Table>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              )}

              {/* Vaccination Section */}
              {fullInventoryData.vaccines.length > 0 && (
                <div>
                  <div className="d-flex align-items-center mb-3">
                    <h5 className="mb-0">
                      <i className="bi bi-shield-plus me-2 text-success"></i>
                      Vaccination Items
                    </h5>
                    <Badge bg="success" className="ms-2">{fullInventoryData.vaccines.length} items</Badge>
                  </div>
                  
                  {/* Vaccines Chart */}
                  <Card className="border-0 shadow-sm mb-4">
                    <Card.Body style={{ height: '400px' }}>
                      {fullViewChartData.vaccinesChart && (
                        <Bar
                          data={fullViewChartData.vaccinesChart}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: { display: false },
                              title: {
                                display: true,
                                text: 'Vaccine Stock Levels',
                                font: { size: 16, weight: 'bold' }
                              },
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    return `Stock: ${context.parsed.y} doses`;
                                  }
                                }
                              }
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                title: { 
                                  display: true, 
                                  text: 'Stock Quantity (Doses)' 
                                }
                              },
                              x: {
                                ticks: {
                                  maxRotation: 45,
                                  minRotation: 45
                                }
                              }
                            }
                          }}
                        />
                      )}
                    </Card.Body>
                  </Card>

                  {/* Vaccines Table */}
                  <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-light">
                      <h6 className="mb-0">Detailed Vaccine Inventory</h6>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <Table striped hover className="mb-0">
                          <thead className="bg-light sticky-top">
                            <tr>
                              <th>Vaccine</th>
                              <th>Stock</th>
                              <th>Min Level</th>
                              <th>Expiry Date</th>
                              <th>Status</th>
                              <th>Manufacturer</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fullInventoryData.vaccines.map((item, index) => {
                              const expiryStatus = getExpiryStatus(item.expiryDate);
                              const stockRatio = item.stock / item.minLevel;
                              return (
                                <tr key={item.id || index}>
                                  <td className="fw-medium">{item.name}</td>
                                  <td>
                                    <Badge bg={
                                      stockRatio <= 0.25 ? 'danger' :
                                      stockRatio <= 0.5 ? 'warning' :
                                      stockRatio <= 1 ? 'info' : 'success'
                                    }>
                                      {item.stock}
                                    </Badge>
                                  </td>
                                  <td className="text-muted">{item.minLevel}</td>
                                  <td>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</td>
                                  <td>
                                    <Badge bg={expiryStatus.variant} className="small">
                                      {expiryStatus.status}
                                    </Badge>
                                  </td>
                                  <td className="text-muted small">{item.manufacturer || 'N/A'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </Table>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFullView(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Detailed Chart Modal */}
      <Modal 
        show={showDetailModal !== null} 
        onHide={() => setShowDetailModal(null)} 
        size="xl" 
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {showDetailModal === 'categoryDistribution' && (
              <>
                <i className="bi bi-bar-chart me-2 text-primary"></i>
                Category Distribution - Detailed View
              </>
            )}
            {showDetailModal === 'prescriptionUsage' && (
              <>
                <i className="bi bi-pie-chart me-2 text-info"></i>
                Prescription Usage Distribution - Detailed View
              </>
            )}
            {showDetailModal === 'vaccineUsage' && (
              <>
                <i className="bi bi-pie-chart-fill me-2 text-success"></i>
                Vaccine Usage Distribution - Detailed View
              </>
            )}
            {showDetailModal === 'prescriptionSummary' && (
              <>
                <i className="bi bi-capsule me-2 text-success"></i>
                Prescription Summary - Detailed View
              </>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {showDetailModal === 'categoryDistribution' && (
            <div>
              <div style={{ height: '500px', marginBottom: '30px' }}>
                {fullViewChartData.categoryDistribution ? (
                  <Bar
                    data={fullViewChartData.categoryDistribution}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              return `Items: ${context.parsed.y}`;
                            }
                          }
                        }
                      },
                      scales: {
                        x: {
                          title: { display: true, text: 'Categories' }
                        },
                        y: {
                          title: { display: true, text: 'Number of Items' },
                          beginAtZero: true,
                          ticks: { stepSize: 1 }
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="text-center text-muted py-5">
                    <i className="bi bi-bar-chart display-4 mb-3"></i>
                    <p>No category data available</p>
                  </div>
                )}
              </div>
              
              {vaccineCategoryData.categories && vaccineCategoryData.categories.length > 0 && (
                <div>
                  <h5 className="mb-3">Vaccine Category Distribution</h5>
                  <Table responsive striped>
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Vaccine Count</th>
                        <th>Percentage</th>
                        <th>Usage Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vaccineCategoryData.categories.map((category, index) => (
                        <tr key={category.category}>
                          <td className="fw-bold">{category.category}</td>
                          <td>{category.count} vaccines</td>
                          <td>{category.percentage.toFixed(1)}%</td>
                          <td>
                            <Badge bg={category.percentage > 30 ? 'success' : category.percentage > 15 ? 'warning' : 'info'}>
                              {category.percentage > 30 ? 'High Distribution' : category.percentage > 15 ? 'Moderate Distribution' : 'Low Distribution'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}

              {fullInventoryData && fullInventoryData.all && fullInventoryData.all.length > 0 && (
                <div className="mt-4">
                  <h5 className="mb-3">General Inventory Category Breakdown</h5>
                  <Row>
                    {Object.entries(fullInventoryData.all.reduce((acc, item) => {
                      const category = item.category || 'Uncategorized';
                      if (!acc[category]) acc[category] = [];
                      acc[category].push(item);
                      return acc;
                    }, {})).map(([category, items]) => (
                      <Col md={4} key={category} className="mb-3">
                        <Card className="border-0 shadow-sm">
                          <Card.Header className="bg-light">
                            <h6 className="mb-0">{category}</h6>
                            <small className="text-muted">{items.length} items</small>
                          </Card.Header>
                          <Card.Body style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {items.slice(0, 10).map(item => (
                              <div key={item.id} className="d-flex justify-content-between align-items-center border-bottom py-1">
                                <small>{item.name}</small>
                                <small className="text-muted">{item.quantity} {item.unit}</small>
                              </div>
                            ))}
                            {items.length > 10 && (
                              <small className="text-muted">+ {items.length - 10} more items...</small>
                            )}
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}
            </div>
          )}

          {showDetailModal === 'prescriptionUsage' && (
            <div>
              <div style={{ height: '500px', marginBottom: '30px' }}>
                {usageChartsData.prescriptionUsage ? (
                  <Doughnut
                    data={usageChartsData.prescriptionUsage}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { 
                          position: 'right',
                          labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: { size: 14 }
                          }
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percentage = ((context.parsed / total) * 100).toFixed(1);
                              return `${context.label}: ${context.parsed} units (${percentage}%)`;
                            }
                          }
                        }
                      },
                      cutout: '50%'
                    }}
                  />
                ) : (
                  <div className="text-center text-muted py-5">
                    <i className="bi bi-pie-chart display-4 mb-3"></i>
                    <p>No prescription usage data available</p>
                  </div>
                )}
              </div>
              
              {prescriptionAnalytics.topMedications && prescriptionAnalytics.topMedications.length > 0 && (
                <div>
                  <h5 className="mb-3">Top Prescribed Medications</h5>
                  <Table responsive striped>
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Medication</th>
                        <th>Total Quantity</th>
                        <th>Prescriptions</th>
                        <th>Avg per Prescription</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prescriptionAnalytics.topMedications.slice(0, 10).map((med, index) => (
                        <tr key={med.name}>
                          <td>
                            <Badge bg={index < 3 ? 'success' : 'secondary'}>
                              #{index + 1}
                            </Badge>
                          </td>
                          <td className="fw-bold">{med.name}</td>
                          <td>{med.totalQuantity} units</td>
                          <td>{med.prescriptionCount}</td>
                          <td>{(med.totalQuantity / med.prescriptionCount).toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>
          )}

          {showDetailModal === 'vaccineUsage' && (
            <div>
              <div style={{ height: '500px', marginBottom: '30px' }}>
                {usageChartsData.vaccineUsage ? (
                  <Doughnut
                    data={usageChartsData.vaccineUsage}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { 
                          position: 'right',
                          labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: { size: 14 }
                          }
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percentage = ((context.parsed / total) * 100).toFixed(1);
                              return `${context.label}: ${context.parsed} doses (${percentage}%)`;
                            }
                          }
                        }
                      },
                      cutout: '50%'
                    }}
                  />
                ) : (
                  <div className="text-center text-muted py-5">
                    <i className="bi bi-pie-chart-fill display-4 mb-3"></i>
                    <p>No vaccine usage data available</p>
                  </div>
                )}
              </div>
              
              {vaccineUsageData.usage && vaccineUsageData.usage.length > 0 && (
                <div>
                  <h5 className="mb-3">Vaccine Usage Details</h5>
                  <Table responsive striped>
                    <thead>
                      <tr>
                        <th>Vaccine</th>
                        <th>Doses Used</th>
                        <th>Percentage</th>
                        <th>Usage Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vaccineUsageData.usage.slice(0, 10).map((vaccine, index) => {
                        const total = vaccineUsageData.total_usage;
                        const percentage = ((vaccine.usage_count / total) * 100).toFixed(1);
                        return (
                          <tr key={vaccine.vaccine_name}>
                            <td className="fw-bold">{vaccine.vaccine_name}</td>
                            <td>{vaccine.usage_count} doses</td>
                            <td>{percentage}%</td>
                            <td>
                              <Badge bg={vaccine.usage_count > 50 ? 'success' : vaccine.usage_count > 20 ? 'warning' : 'info'}>
                                {vaccine.usage_count > 50 ? 'High Usage' : vaccine.usage_count > 20 ? 'Moderate Usage' : 'Low Usage'}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>
          )}

          {showDetailModal === 'prescriptionSummary' && (
            <div>
              <Row>
                <Col md={6}>
                  <Card className="border-0 shadow-sm mb-4">
                    <Card.Header className="bg-primary text-white">
                      <h5 className="mb-0">
                        <i className="bi bi-graph-up me-2"></i>
                        Overall Statistics
                      </h5>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col sm={6}>
                          <div className="text-center p-3 border-end">
                            <div className="display-6 text-primary fw-bold">{prescriptionAnalytics.summary.totalPrescriptions}</div>
                            <div className="text-muted">Total Prescriptions</div>
                          </div>
                        </Col>
                        <Col sm={6}>
                          <div className="text-center p-3">
                            <div className="display-6 text-success fw-bold">{prescriptionAnalytics.summary.totalMedicationsDispensed}</div>
                            <div className="text-muted">Medications Dispensed</div>
                          </div>
                        </Col>
                      </Row>
                      <hr />
                      <div className="text-center">
                        <div className="h4 text-info fw-bold">{prescriptionAnalytics.summary.avgMedicationsPerPrescription}</div>
                        <div className="text-muted">Average Medications per Prescription</div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={6}>
                  <Card className="border-0 shadow-sm mb-4">
                    <Card.Header className="bg-success text-white">
                      <h5 className="mb-0">
                        <i className="bi bi-trophy me-2"></i>
                        Top Performer
                      </h5>
                    </Card.Header>
                    <Card.Body>
                      {prescriptionAnalytics.topMedications && prescriptionAnalytics.topMedications.length > 0 ? (
                        <div className="text-center">
                          <div className="display-6 text-success mb-2">🏆</div>
                          <div className="h4 text-primary fw-bold">{prescriptionAnalytics.topMedications[0].name}</div>
                          <div className="row mt-3">
                            <div className="col-6 text-center border-end">
                              <div className="h5 text-success">{prescriptionAnalytics.topMedications[0].totalQuantity}</div>
                              <small className="text-muted">Total Units</small>
                            </div>
                            <div className="col-6 text-center">
                              <div className="h5 text-info">{prescriptionAnalytics.topMedications[0].prescriptionCount}</div>
                              <small className="text-muted">Prescriptions</small>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-muted py-4">
                          <i className="bi bi-prescription display-4 mb-3"></i>
                          <p>No prescription data available</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              {prescriptionAnalytics.topMedications && prescriptionAnalytics.topMedications.length > 0 && (
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-info text-white">
                    <h5 className="mb-0">
                      <i className="bi bi-list-ol me-2"></i>
                      Complete Medication Rankings
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <Table responsive striped hover>
                      <thead className="table-dark">
                        <tr>
                          <th>Rank</th>
                          <th>Medication Name</th>
                          <th>Total Quantity</th>
                          <th>Prescriptions</th>
                          <th>Avg per Prescription</th>
                          <th>Usage Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prescriptionAnalytics.topMedications.map((med, index) => {
                          const usageRate = ((med.prescriptionCount / prescriptionAnalytics.summary.totalPrescriptions) * 100).toFixed(1);
                          return (
                            <tr key={med.name}>
                              <td>
                                <Badge bg={index < 3 ? 'success' : index < 5 ? 'warning' : 'secondary'}>
                                  #{index + 1}
                                </Badge>
                              </td>
                              <td className="fw-bold">{med.name}</td>
                              <td>{med.totalQuantity} units</td>
                              <td>{med.prescriptionCount}</td>
                              <td>{(med.totalQuantity / med.prescriptionCount).toFixed(1)}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="progress me-2" style={{width: '60px', height: '8px'}}>
                                    <div 
                                      className="progress-bar bg-info" 
                                      style={{width: `${Math.min(usageRate, 100)}%`}}
                                    ></div>
                                  </div>
                                  <small>{usageRate}%</small>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(null)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default InventoryAnalysis;
