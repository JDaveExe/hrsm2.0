// Test script to verify frontend can call backend API
import axios from 'axios';

const testFrontendAPI = async () => {
  console.log('🧪 Testing frontend API calls to backend...');
  
  try {
    // Test 1: Direct axios call without service
    console.log('📡 Test 1: Direct axios call to backend...');
    const directResponse = await axios.get('/api/inventory/vaccine-usage-distribution');
    console.log('✅ Direct call success:', {
      status: directResponse.status,
      dataLength: directResponse.data.length,
      firstItem: directResponse.data[0]
    });
    
    // Test 2: Using the inventory service
    console.log('📡 Test 2: Using inventory service...');
    const inventoryService = (await import('./src/services/inventoryService.js')).default;
    const serviceResponse = await inventoryService.getVaccineUsageDistribution();
    console.log('✅ Service call success:', {
      dataLength: serviceResponse.length,
      firstItem: serviceResponse[0]
    });
    
  } catch (error) {
    console.error('❌ Frontend API test failed:', error);
  }
};

export default testFrontendAPI;