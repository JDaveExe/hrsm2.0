import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, ButtonGroup, Button, Modal, Table, Badge } from 'react-bootstrap';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import LoadingManagementBar from '../LoadingManagementBar';
import inventoryService from '../../../services/inventoryService';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement);

const InventoryAnalysis = ({ currentDateTime, isDarkMode, timePeriod = '30days' }) => {
  const [analyticsData, setAnalyticsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [realInventoryData, setRealInventoryData] = useState({ vaccines: [], medications: [] });
  const [prescriptionAnalytics, setPrescriptionAnalytics] = useState(null);
  const [showFullView, setShowFullView] = useState(false);

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

    // Limit to top 10 items by stock level for better performance and readability
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
      .slice(0, 15); // Increase to 15 items for better analysis

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

    return { vaccinesChart, medicationsChart };
  }, [fullInventoryData]);

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

    // Generate vaccine usage from inventory data
    let vaccineUsage = null;
    if (fullInventoryData.totalItems > 0) {
      const topVaccines = fullInventoryData.vaccines
        .sort((a, b) => b.stock - a.stock)
        .slice(0, 5);

      if (topVaccines.length > 0) {
        vaccineUsage = {
          labels: topVaccines.map(item => 
            item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name
          ),
          datasets: [{
            data: topVaccines.map(item => item.stock),
            backgroundColor: [
              '#17a2b8',
              '#20c997',
              '#6f42c1',
              '#fd7e14',
              '#dc3545'
            ],
            borderWidth: 2,
            borderColor: '#fff'
          }]
        };
      }
    }

    return { prescriptionUsage, vaccineUsage };
  }, [fullInventoryData, prescriptionAnalytics]);

  // Generate prescription trends chart data
  const prescriptionTrendsData = useMemo(() => {
    if (!prescriptionAnalytics || !prescriptionAnalytics.dailyTrends) {
      return null;
    }

    const trends = prescriptionAnalytics.dailyTrends;
    
    return {
      labels: trends.map(item => item.dayName || item.date),
      datasets: [{
        label: 'Daily Prescriptions',
        data: trends.map(item => item.prescriptionCount),
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
  }, [prescriptionAnalytics]);

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
      // Fallback data when no real data is available
      return {
        stockLevels: {
          labels: ['Loading...'],
          datasets: [{
            label: 'Current Stock',
            data: [0],
            backgroundColor: ['#e9ecef'],
            borderColor: ['#dee2e6'],
            borderWidth: 2
          }]
        },
        categoryDistribution: {
          labels: ['Loading...'],
          datasets: [{
            data: [100],
            backgroundColor: ['#e9ecef'],
            borderWidth: 0,
            cutout: '60%'
          }]
        },
        stockTrends: {
          labels: ['Loading...'],
          datasets: [{
            label: 'Stock Changes',
            data: [0],
            borderColor: '#e9ecef',
            backgroundColor: 'rgba(233, 236, 239, 0.1)',
            tension: 0.4,
            fill: true
          }]
        }
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

    // Category distribution
    const categoryLabels = Object.keys(categories);
    const categoryData = Object.values(categories);
    const categoryDistribution = {
      labels: categoryLabels,
      datasets: [{
        data: categoryData,
        backgroundColor: categoryLabels.map((_, index) => {
          const colors = ['#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#e74c3c'];
          return colors[index % colors.length];
        }),
        borderWidth: 0,
        cutout: '60%'
      }]
    };

    // Simulated stock trends (can be enhanced with real historical data)
    const trendLabels = timePeriod === '7days' 
      ? ['Sep 5', 'Sep 6', 'Sep 7', 'Sep 8', 'Sep 9', 'Sep 10', 'Sep 11']
      : ['Aug 12', 'Aug 19', 'Aug 26', 'Sep 2', 'Sep 9'];
    
    const stockTrends = {
      labels: trendLabels,
      datasets: [{
        label: 'Stock Changes',
        data: trendLabels.map(() => Math.floor(Math.random() * 100) - 50), // Simulated for now
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        tension: 0.4,
        fill: true
      }]
    };

    return { stockLevels, categoryDistribution, stockTrends };
  }, [processInventoryData, timePeriod]);

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

    // Find most used (highest stock item as proxy)
    const mostUsed = processedItems.length > 0 ? 
      processedItems[0].name.split(' ')[0] : 'N/A';

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
  }, [processInventoryData]);

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
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={() => setShowFullView(true)}
                className="d-flex align-items-center"
              >
                <i className="bi bi-arrows-fullscreen me-1"></i>
                View All Items
              </Button>
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
            <Card.Header className="bg-white">
              <h5 className="mb-0">
                <i className="bi bi-pie-chart me-2 text-success"></i>
                Category Distribution
              </h5>
            </Card.Header>
            <Card.Body style={{ height: '300px' }}>
              {analyticsData.categoryDistribution && (
                <Doughnut
                  data={analyticsData.categoryDistribution}
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
                      }
                    }
                  }}
                />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Usage Analysis Charts */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">
                <i className="bi bi-pie-chart me-2 text-info"></i>
                Prescription Usage Distribution
              </h5>
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
            <Card.Header className="bg-white">
              <h5 className="mb-0">
                <i className="bi bi-pie-chart-fill me-2 text-success"></i>
                Vaccine Usage Distribution
              </h5>
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
              <Card.Header className="bg-white">
                <h5 className="mb-0">
                  <i className="bi bi-graph-up me-2 text-primary"></i>
                  Prescription Trends ({prescriptionAnalytics.summary.timePeriod})
                </h5>
                <small className="text-muted">
                  Total prescriptions: {prescriptionAnalytics.summary.totalPrescriptions} | 
                  Total medications dispensed: {prescriptionAnalytics.summary.totalMedicationsDispensed}
                </small>
              </Card.Header>
              <Card.Body style={{ height: '300px' }}>
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
              <Card.Header className="bg-white">
                <h5 className="mb-0">
                  <i className="bi bi-capsule me-2 text-success"></i>
                  Prescription Summary
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="d-flex flex-column gap-3">
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

      {/* Stock Trends Chart */}
      <Row className="mb-4">
        <Col md={12}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">
                <i className="bi bi-graph-up me-2 text-info"></i>
                Stock Movement Trends ({timePeriod === '7days' ? 'Last 7 Days' : 'Last 30 Days'})
              </h5>
            </Card.Header>
            <Card.Body style={{ height: '250px' }}>
              {analyticsData.stockTrends && (
                <Line
                  data={analyticsData.stockTrends}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      legend: { 
                        display: true,
                        position: 'top'
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: { 
                          display: true, 
                          text: 'Stock Change' 
                        }
                      },
                      x: {
                        title: { 
                          display: true, 
                          text: 'Date' 
                        }
                      }
                    }
                  }}
                />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

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

    </div>
  );
};

export default InventoryAnalysis;
