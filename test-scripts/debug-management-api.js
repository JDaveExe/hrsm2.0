// Debug script to test Management Dashboard API calls
import inventoryService from './src/services/inventoryService.js';

const testManagementAPI = async () => {
  console.log('🧪 Testing Management Dashboard API calls...');
  
  try {
    console.log('📡 Testing vaccine usage distribution...');
    const usageData = await inventoryService.getVaccineUsageDistribution();
    console.log('✅ Usage data received:', {
      length: usageData.length,
      sample: usageData.slice(0, 2)
    });
    
    console.log('📡 Testing vaccine category distribution...');  
    const categoryData = await inventoryService.getVaccineCategoryDistribution();
    console.log('✅ Category data received:', {
      length: categoryData.length,
      sample: categoryData.slice(0, 2)
    });
    
  } catch (error) {
    console.error('❌ API test failed:', error);
  }
};

testManagementAPI();