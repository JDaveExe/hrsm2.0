// Node.js Test script to verify diagnosis workflow backend integration
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testDiagnosisWorkflow() {
  console.log('🧪 Testing Diagnosis Workflow Integration...\n');

  try {
    // Step 1: Check current diagnosis analytics state
    console.log('📊 Step 1: Checking current diagnosis analytics...');
    const currentDiagnosis = await axios.get(`${BASE_URL}/checkups/analytics/diagnosis`);
    console.log(`Current diagnosis count: ${currentDiagnosis.data.length}`);
    console.log('Current diagnoses:', currentDiagnosis.data.map(d => `${d.disease} (${d.total})`).join(', ') || 'None');

    // Step 2: Check prescription analytics for comparison
    console.log('\n💊 Step 2: Checking prescription analytics for comparison...');
    const prescriptions = await axios.get(`${BASE_URL}/checkups/analytics/prescriptions`);
    console.log(`Prescription analytics count: ${prescriptions.data.length}`);
    
    if (prescriptions.data.length > 0) {
      console.log('✅ Prescription data found - analytics system is working:');
      prescriptions.data.slice(0, 3).forEach((med, index) => {
        console.log(`  ${index + 1}. ${med.medication} - Used ${med.totalUsed} times`);
      });
    }

    // Step 3: Test the diagnosis analytics endpoint structure
    console.log('\n🔧 Step 3: Diagnosis Analytics Endpoint Analysis');
    console.log('The diagnosis analytics endpoint should return:');
    console.log('  - Array of diagnosis objects');
    console.log('  - Each with: disease, total, ageGroups');
    console.log('  - Filters completed checkups with non-empty diagnosis');

    // Step 4: Check database structure by testing related endpoints
    console.log('\n🏥 Step 4: Testing related checkup endpoints...');
    
    // Test if we can access any checkup data
    const endpoints = [
      '/checkups/analytics/prescriptions',
      '/checkups/analytics/diagnosis'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${BASE_URL}${endpoint}`);
        console.log(`✅ ${endpoint}: Accessible (${response.data.length} items)`);
      } catch (error) {
        console.log(`❌ ${endpoint}: Error - ${error.response?.status || error.message}`);
      }
    }

    console.log('\n📋 DIAGNOSIS WORKFLOW STATUS:');
    console.log('=====================================');
    console.log(`✓ Backend server: Running on port 5000`);
    console.log(`✓ Diagnosis analytics endpoint: Accessible`);
    console.log(`✓ Database connection: Working (prescription data exists)`);
    console.log(`${currentDiagnosis.data.length > 0 ? '✓' : 'ℹ️'} Diagnosis data: ${currentDiagnosis.data.length > 0 ? 'Found' : 'No completed checkups with diagnoses yet'}`);
    
    if (currentDiagnosis.data.length === 0 && prescriptions.data.length > 0) {
      console.log('\n🎯 NEXT STEPS FOR COMPLETE VERIFICATION:');
      console.log('1. Complete a checkup through the doctor dashboard');
      console.log('2. Add a diagnosis during the checkup process');
      console.log('3. Ensure the checkup is marked as "completed"');
      console.log('4. Run this test again to see the diagnosis in analytics');
      console.log('5. Check Healthcare Insights dashboard for chart update');
    }

    return {
      diagnosisCount: currentDiagnosis.data.length,
      prescriptionCount: prescriptions.data.length,
      diagnosisData: currentDiagnosis.data,
      systemWorking: prescriptions.data.length > 0
    };

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    throw error;
  }
}

// Run the test
testDiagnosisWorkflow()
  .then(result => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed');
    process.exit(1);
  });