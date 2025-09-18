import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Badge, Tab, Tabs, Spinner } from 'react-bootstrap';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import '../styles/InventoryDashboard.css';
import LoadingManagementBar from '../LoadingManagementBar';
import inventoryService from '../../../services/inventoryService';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const InventoryDashboard = ({ currentDateTime, isDarkMode }) => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analytics');
  
  // Vaccine analytics states
  const [vaccineUsageData, setVaccineUsageData] = useState([]);
  const [vaccineCategoryData, setVaccineCategoryData] = useState([]);
  const [loadingVaccineData, setLoadingVaccineData] = useState(false);

  useEffect(() => {
    loadInventoryData();
    loadVaccineAnalytics();
  }, []);

  const loadInventoryData = () => {
    // Simulate loading inventory data
    setTimeout(() => {
      setInventoryItems([
        { id: 1, name: 'Medical Masks', stock: 1250, minStock: 100, category: 'PPE', lastUpdated: new Date() },
        { id: 2, name: 'Hand Sanitizer', stock: 45, minStock: 50, category: 'Hygiene', lastUpdated: new Date() },
        { id: 3, name: 'Digital Thermometer', stock: 89, minStock: 25, category: 'Equipment', lastUpdated: new Date() },
        { id: 4, name: 'Paracetamol 500mg', stock: 0, minStock: 200, category: 'Medicine', lastUpdated: new Date() },
        { id: 5, name: 'Blood Pressure Monitor', stock: 15, minStock: 5, category: 'Equipment', lastUpdated: new Date() }
      ]);
      setLoading(false);
    }, 1000);
  };

  const loadVaccineAnalytics = async () => {
    setLoadingVaccineData(true);
    try {
      console.log('🔄 Loading vaccine analytics for Management Dashboard...');
      
      // Load vaccine usage distribution
      const usageData = await inventoryService.getVaccineUsageDistribution();
      setVaccineUsageData(usageData.usage || []); // Extract the usage array
      
      // Load vaccine category distribution
      const categoryData = await inventoryService.getVaccineCategoryDistribution();
      setVaccineCategoryData(categoryData.categories || []); // Extract the categories array
      
      console.log('✅ Vaccine analytics loaded:', {
        usageDataCount: usageData.length,
        categoryDataCount: categoryData.length
      });
    } catch (error) {
      console.error('❌ Error loading vaccine analytics:', error);
    } finally {
      setLoadingVaccineData(false);
    }
  };

  const getStockStatus = (stock, minStock) => {
    if (stock === 0) return 'out-of-stock';
    if (stock <= minStock) return 'low-stock';
    return 'in-stock';
  };

  // Prepare vaccine usage chart data
  const vaccineUsageChartData = {
    labels: vaccineUsageData.map(item => item.vaccine_name.length > 20 ? 
      item.vaccine_name.substring(0, 20) + '...' : item.vaccine_name),
    datasets: [{
      label: 'Vaccine Usage Count',
      data: vaccineUsageData.map(item => item.usage_count),
      backgroundColor: [
        '#4ade80', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444',
        '#ec4899', '#6366f1', '#10b981', '#f97316', '#84cc16'
      ],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  // Prepare vaccine category chart data
  const vaccineCategoryChartData = {
    labels: vaccineCategoryData.map(item => item.category),
    datasets: [{
      label: 'Total Usage Count',
      data: vaccineCategoryData.map(item => item.count), // Use 'count' which is total usage
      backgroundColor: [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'
      ],
      borderWidth: 1
    }]
  };

  if (loading) {
    return <LoadingManagementBar message="Loading inventory data..." />;
  }

  return (
    <div className="inventory-dashboard">
      <div className="inventory-header mb-4">
        <h2>Inventory Management</h2>
        <div className="inventory-actions">
          <button className="btn btn-primary">
            <i className="bi bi-plus-circle"></i> Add Item
          </button>
          <button className="btn btn-secondary">
            <i className="bi bi-download"></i> Export
          </button>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="inventory-tabs mb-3"
      >
        <Tab eventKey="analytics" title={
          <span>
            <i className="bi bi-graph-up me-2"></i>
            Vaccine Analytics
          </span>
        }>
          <Row className="mb-4">
            {/* Vaccine Usage Distribution Chart */}
            <Col lg={6} className="mb-4">
              <Card className="chart-card h-100">
                <Card.Header>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5><i className="bi bi-shield-check me-2"></i>Vaccine Usage Distribution</h5>
                      <small className="text-muted">Most frequently administered vaccines</small>
                    </div>
                  </div>
                </Card.Header>
                <Card.Body className="d-flex flex-column">
                  {loadingVaccineData ? (
                    <div className="d-flex align-items-center justify-content-center h-100">
                      <div className="text-center">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-2 text-muted">Loading vaccine usage data...</p>
                      </div>
                    </div>
                  ) : vaccineUsageData.length > 0 ? (
                    <div className="chart-container flex-grow-1">
                      <Pie 
                        data={vaccineUsageChartData} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { 
                              position: 'right',
                              display: true,
                              labels: {
                                color: '#333',
                                font: { size: 12 },
                                usePointStyle: true,
                                padding: 15
                              }
                            },
                            title: { display: false },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                  const percentage = ((context.parsed / total) * 100).toFixed(1);
                                  return `${context.label}: ${context.parsed} uses (${percentage}%)`;
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-center text-muted py-4">
                      <i className="bi bi-shield-x display-4 d-block mb-3"></i>
                      <h6>No vaccine usage data available</h6>
                    </div>
                  )}
                  <div className="text-center mt-2">
                    <small className="text-muted">
                      {vaccineUsageData.length > 0
                        ? `Total usage from ${vaccineUsageData.length} vaccines`
                        : 'Loading vaccine usage analytics...'}
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Vaccine Category Distribution Chart */}
            <Col lg={6} className="mb-4">
              <Card className="chart-card h-100">
                <Card.Header>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5><i className="bi bi-pie-chart me-2"></i>Vaccine Category Distribution</h5>
                      <small className="text-muted">Usage breakdown by vaccine category</small>
                    </div>
                  </div>
                </Card.Header>
                <Card.Body className="d-flex flex-column">
                  {loadingVaccineData ? (
                    <div className="d-flex align-items-center justify-content-center h-100">
                      <div className="text-center">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-2 text-muted">Loading category data...</p>
                      </div>
                    </div>
                  ) : vaccineCategoryData.length > 0 ? (
                    <div className="chart-container flex-grow-1">
                      <Bar 
                        data={vaccineCategoryChartData} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            title: { display: false },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  const categoryData = vaccineCategoryData[context.dataIndex];
                                  return `${context.label}: ${context.parsed.y} total uses (${categoryData.percentage?.toFixed(1)}%)`;
                                }
                              }
                            }
                          },
                          scales: {
                            y: { 
                              beginAtZero: true,
                              ticks: { stepSize: 1 }
                            }
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-center text-muted py-4">
                      <i className="bi bi-bar-chart display-4 d-block mb-3"></i>
                      <h6>No category data available</h6>
                    </div>
                  )}
                  <div className="text-center mt-2">
                    <small className="text-muted">
                      {vaccineCategoryData.length > 0
                        ? `Categories: ${vaccineCategoryData.map(c => c.category).join(', ')}`
                        : 'Loading category analytics...'}
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="inventory" title={
          <span>
            <i className="bi bi-boxes me-2"></i>
            Inventory Items
          </span>
        }>
          <div className="inventory-stats">
            <div className="stat-item">
              <span className="stat-label">Total Items</span>
              <span className="stat-value">{inventoryItems.length}</span>
            </div>
            <div className="stat-item critical">
              <span className="stat-label">Low Stock</span>
              <span className="stat-value">
                {inventoryItems.filter(item => getStockStatus(item.stock, item.minStock) === 'low-stock').length}
              </span>
            </div>
            <div className="stat-item danger">
              <span className="stat-label">Out of Stock</span>
              <span className="stat-value">
                {inventoryItems.filter(item => getStockStatus(item.stock, item.minStock) === 'out-of-stock').length}
              </span>
            </div>
          </div>

          <div className="inventory-table-container">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Min Stock</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventoryItems.map(item => (
                  <tr key={item.id} className={getStockStatus(item.stock, item.minStock)}>
                    <td>{item.name}</td>
                    <td>{item.category}</td>
                    <td>{item.stock}</td>
                    <td>{item.minStock}</td>
                    <td>
                      <span className={`status-badge ${getStockStatus(item.stock, item.minStock)}`}>
                        {getStockStatus(item.stock, item.minStock).replace('-', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td>{item.lastUpdated.toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn btn-sm btn-edit">
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button className="btn btn-sm btn-delete">
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
};

export default InventoryDashboard;
