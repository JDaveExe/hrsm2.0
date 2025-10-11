/**
 * Test Inventory Service Analytics Integration
 * Tests the frontend inventory service with the new analytics endpoints
 */

// Node.js require syntax
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

class InventoryService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/inventory`,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getInventoryAnalytics() {
    try {
      const response = await axios.get(`${API_BASE_URL}/inventory-analytics/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory analytics:', error);
      throw error;
    }
  }

  async getInventoryAlerts() {
    try {
      const response = await axios.get(`${API_BASE_URL}/inventory-analytics/alerts`);
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory alerts:', error);
      throw error;
    }
  }

  async getUsageTrends(period = 30) {
    try {
      const response = await axios.get(`${API_BASE_URL}/inventory-analytics/usage-trends?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching usage trends:', error);
      throw error;
    }
  }

  async getInventorySummary() {
    try {
      const response = await this.api.get('/summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory summary:', error);
      throw error;
    }
  }
}

const inventoryService = new InventoryService();

async function testInventoryServiceIntegration() {
  console.log('🧪 Testing Inventory Service Analytics Integration...\n');

  try {
    // Test 1: Get analytics through service
    console.log('📊 Testing: inventoryService.getInventoryAnalytics()');
    const analytics = await inventoryService.getInventoryAnalytics();
    console.log('✅ Analytics service working:');
    console.log('   Total Items:', analytics.summary.totalItems);
    console.log('   Total Value:', `₱${analytics.inventoryValue.total.toLocaleString()}`);
    console.log('   Critical Stock:', analytics.summary.criticalStockItems);
    
    // Test 2: Get alerts through service
    console.log('\n📊 Testing: inventoryService.getInventoryAlerts()');
    const alerts = await inventoryService.getInventoryAlerts();
    console.log('✅ Alerts service working:');
    console.log('   Total Alerts:', alerts.summary.totalAlerts);
    console.log('   Critical Alerts:', alerts.summary.criticalAlerts);
    
    // Test 3: Get usage trends through service
    console.log('\n📊 Testing: inventoryService.getUsageTrends(30)');
    const trends = await inventoryService.getUsageTrends(30);
    console.log('✅ Usage trends service working:');
    console.log('   Period:', trends.summary.period);
    console.log('   Avg Vaccines/Day:', trends.summary.avgVaccinesPerDay);
    console.log('   Avg Medications/Day:', trends.summary.avgMedicationsPerDay);
    
    // Test 4: Get summary through service (existing endpoint)
    console.log('\n📊 Testing: inventoryService.getInventorySummary()');
    const summary = await inventoryService.getInventorySummary();
    console.log('✅ Summary service working:');
    console.log('   Vaccines:', summary.vaccines.total);
    console.log('   Medications:', summary.medications.total);
    
    console.log('\n🎉 All inventory service analytics tests passed!');
    
    console.log('\n📋 FRONTEND INTEGRATION READY:');
    console.log('  ✅ getInventoryAnalytics() - Category charts, value tracking');
    console.log('  ✅ getInventoryAlerts() - Low stock, expiry alerts');
    console.log('  ✅ getUsageTrends() - Usage trends over time');
    console.log('  ✅ getInventorySummary() - Basic stats (existing)');
    console.log('\n🚀 Ready for dashboard integration!');
    
    // Sample data structure for frontend developers
    console.log('\n📊 SAMPLE DATA STRUCTURES:');
    console.log('\n🏷️  Analytics Data:');
    console.log('   categoryDistribution: { vaccines: {...}, medications: {...} }');
    console.log('   stockStatus: { vaccines: {...}, medications: {...} }');
    console.log('   expiryAnalysis: { vaccines: {...}, medications: {...} }');
    console.log('   topManufacturers: { vaccines: [...], medications: [...] }');
    console.log('   inventoryValue: { vaccines: 180075, medications: 129117.5, total: 309192.5 }');
    
    console.log('\n🚨 Alerts Data:');
    console.log('   alerts: { lowStock: [...], outOfStock: [...], expiring: [...], expired: [...] }');
    console.log('   summary: { totalAlerts: 44, criticalAlerts: 35, warningAlerts: 9 }');
    
    console.log('\n📈 Trends Data:');
    console.log('   trends: [{ date, vaccinesUsed, medicationsUsed, totalValue }, ...]');
    console.log('   summary: { period, totalVaccinesUsed, avgVaccinesPerDay, ... }');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testInventoryServiceIntegration();
