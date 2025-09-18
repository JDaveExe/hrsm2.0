// Test dashboard analytics endpoints
const axios = require('axios');

async function testAnalyticsEndpoints() {
  const baseURL = 'http://localhost:5000/api';
  
  console.log('🧪 Testing Dashboard Analytics Endpoints...\n');
  
  try {
    // Test dashboard stats
    console.log('📊 Testing /api/dashboard/stats...');
    const statsResponse = await axios.get(`${baseURL}/dashboard/stats`);
    console.log('✅ Dashboard Stats Success');
    console.log('  Total Patients:', statsResponse.data.patients?.total || 'N/A');
    console.log('  Male Patients:', statsResponse.data.patients?.male || 'N/A');
    console.log('  Female Patients:', statsResponse.data.patients?.female || 'N/A');
    console.log('  Total Families:', statsResponse.data.families?.total || 'N/A');
    
    // Test prescription analytics
    console.log('\n📊 Testing /api/dashboard/prescription-analytics...');
    const prescriptionResponse = await axios.get(`${baseURL}/dashboard/prescription-analytics?timePeriod=30days`);
    console.log('✅ Prescription Analytics Success');
    console.log('  Total Prescriptions:', prescriptionResponse.data.summary?.totalPrescriptions || 'N/A');
    console.log('  Top Medications Count:', prescriptionResponse.data.topMedications?.length || 'N/A');
    console.log('  Daily Trends Count:', prescriptionResponse.data.dailyTrends?.length || 'N/A');
    
    // Test patient analytics
    console.log('\n📊 Testing /api/dashboard/patient-analytics...');
    const patientResponse = await axios.get(`${baseURL}/dashboard/patient-analytics`);
    console.log('✅ Patient Analytics Success');
    console.log('  Total Patients:', patientResponse.data.summary?.totalPatients || 'N/A');
    console.log('  Male Patients:', patientResponse.data.summary?.malePatients || 'N/A');
    console.log('  Female Patients:', patientResponse.data.summary?.femalePatients || 'N/A');
    console.log('  Age Groups:', Object.keys(patientResponse.data.demographics?.ageGroups || {}).length);
    
    console.log('\n🎉 All analytics endpoints working correctly!');
    
  } catch (error) {
    console.error('❌ Error testing analytics endpoints:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAnalyticsEndpoints();
