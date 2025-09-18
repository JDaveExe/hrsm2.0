/**
 * Test Enhanced Inventory Analytics Backend
 * Tests the new inventory analytics endpoints
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test configuration
const testConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

async function testInventoryAnalytics() {
  console.log('🧪 Testing Enhanced Inventory Analytics...\n');

  try {
    // Test 1: Get inventory analytics
    console.log('📊 Testing: GET /api/inventory-analytics/');
    const analyticsResponse = await axios.get(`${API_BASE_URL}/inventory-analytics/`, testConfig);
    console.log('✅ Inventory analytics endpoint working:');
    console.log('   Category Distribution:', Object.keys(analyticsResponse.data.categoryDistribution.vaccines).length, 'vaccine categories');
    console.log('   Stock Status:', analyticsResponse.data.stockStatus);
    console.log('   Inventory Value:', `₱${analyticsResponse.data.inventoryValue.total.toLocaleString()}`);
    
    // Test 2: Get inventory alerts
    console.log('\n📊 Testing: GET /api/inventory-analytics/alerts');
    const alertsResponse = await axios.get(`${API_BASE_URL}/inventory-analytics/alerts`, testConfig);
    console.log('✅ Inventory alerts endpoint working:');
    console.log('   Total Alerts:', alertsResponse.data.summary.totalAlerts);
    console.log('   Critical Alerts:', alertsResponse.data.summary.criticalAlerts);
    console.log('   Warning Alerts:', alertsResponse.data.summary.warningAlerts);
    
    // Test 3: Get usage trends
    console.log('\n📊 Testing: GET /api/inventory-analytics/usage-trends');
    const trendsResponse = await axios.get(`${API_BASE_URL}/inventory-analytics/usage-trends?period=30`, testConfig);
    console.log('✅ Usage trends endpoint working:');
    console.log('   Period:', trendsResponse.data.summary.period);
    console.log('   Avg Vaccines/Day:', trendsResponse.data.summary.avgVaccinesPerDay);
    console.log('   Avg Medications/Day:', trendsResponse.data.summary.avgMedicationsPerDay);
    console.log('   Trends Data Points:', trendsResponse.data.trends.length);
    
    console.log('\n🎉 All enhanced inventory analytics tests passed!');
    
    // Display detailed analytics
    console.log('\n📈 DETAILED ANALYTICS SUMMARY:');
    console.log('=====================================');
    
    const analytics = analyticsResponse.data;
    
    console.log('\n🏷️  CATEGORY DISTRIBUTION:');
    console.log('Vaccines:');
    Object.entries(analytics.categoryDistribution.vaccines).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });
    console.log('Medications:');
    Object.entries(analytics.categoryDistribution.medications).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });
    
    console.log('\n🏭 TOP MANUFACTURERS:');
    console.log('Vaccines:');
    analytics.topManufacturers.vaccines.forEach(mfg => {
      console.log(`  ${mfg.name}: ${mfg.count} products`);
    });
    console.log('Medications:');
    analytics.topManufacturers.medications.forEach(mfg => {
      console.log(`  ${mfg.name}: ${mfg.count} products`);
    });
    
    console.log('\n⏰ EXPIRY ANALYSIS:');
    console.log('Vaccines:');
    Object.entries(analytics.expiryAnalysis.vaccines).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });
    console.log('Medications:');
    Object.entries(analytics.expiryAnalysis.medications).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });
    
    console.log('\n💰 INVENTORY VALUE:');
    console.log(`  Vaccines: ₱${analytics.inventoryValue.vaccines.toLocaleString()}`);
    console.log(`  Medications: ₱${analytics.inventoryValue.medications.toLocaleString()}`);
    console.log(`  Total: ₱${analytics.inventoryValue.total.toLocaleString()}`);
    
    // Display alerts summary
    const alerts = alertsResponse.data;
    console.log('\n🚨 ALERTS SUMMARY:');
    console.log(`  Low Stock: ${alerts.alerts.lowStock.length}`);
    console.log(`  Out of Stock: ${alerts.alerts.outOfStock.length}`);
    console.log(`  Expiring Soon: ${alerts.alerts.expiring.length}`);
    console.log(`  Expired: ${alerts.alerts.expired.length}`);
    
    if (alerts.alerts.lowStock.length > 0) {
      console.log('\n⚠️  LOW STOCK ITEMS:');
      alerts.alerts.lowStock.slice(0, 3).forEach(item => {
        console.log(`  ${item.name} (${item.type}): ${item.currentStock}/${item.minimumStock}`);
      });
    }
    
    if (alerts.alerts.expiring.length > 0) {
      console.log('\n📅 EXPIRING SOON:');
      alerts.alerts.expiring.slice(0, 3).forEach(item => {
        console.log(`  ${item.name} (${item.type}): ${item.daysUntilExpiry} days left`);
      });
    }
    
    console.log('\n📋 BACKEND INVENTORY ANALYTICS FEATURES:');
    console.log('  ✅ Category distribution charts');
    console.log('  ✅ Stock status monitoring');
    console.log('  ✅ Expiry date analysis');
    console.log('  ✅ Manufacturer insights');
    console.log('  ✅ Inventory value tracking');
    console.log('  ✅ Alert system (low stock, expiring)');
    console.log('  ✅ Usage trends (with mock data)');
    console.log('  ✅ Comprehensive analytics dashboard ready');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the tests
testInventoryAnalytics();
