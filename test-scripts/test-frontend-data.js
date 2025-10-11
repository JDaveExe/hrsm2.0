const axios = require('axios');

async function testFrontendData() {
  try {
    console.log('🔍 Testing Frontend Data Fetching...\n');

    // Test the exact same endpoints the frontend uses
    const baseURL = 'http://localhost:5000/api';

    console.log('📊 Testing Dashboard Service (used by management dashboard)...');
    try {
      const dashboardResponse = await axios.get(`${baseURL}/dashboard/stats`);
      console.log('✅ Dashboard Stats fetched successfully:');
      console.log(`  Patients: ${dashboardResponse.data.patients?.total || 'N/A'}`);
      console.log(`  Male: ${dashboardResponse.data.patients?.male || 'N/A'}`);
      console.log(`  Female: ${dashboardResponse.data.patients?.female || 'N/A'}`);
      console.log(`  Age Distribution: ${dashboardResponse.data.ageDistribution?.length || 0} groups`);
      
      if (dashboardResponse.data.ageDistribution && dashboardResponse.data.ageDistribution.length > 0) {
        console.log('  Age Groups:');
        dashboardResponse.data.ageDistribution.forEach(group => {
          console.log(`    ${group.ageGroup}: ${group.count} patients`);
        });
      }
      
      console.log(`  Checkup Trends: ${dashboardResponse.data.checkupTrends?.length || 0} days`);
      if (dashboardResponse.data.checkupTrends && dashboardResponse.data.checkupTrends.length > 0) {
        console.log('  Recent Checkups:');
        dashboardResponse.data.checkupTrends.forEach(trend => {
          console.log(`    ${trend.dayName}: ${trend.completedCheckups} checkups`);
        });
      }
    } catch (error) {
      console.log('❌ Dashboard Stats error:', error.message);
    }

    console.log('\n---\n');

    console.log('👥 Testing Patient Analytics (custom endpoint)...');
    try {
      const patientResponse = await axios.get(`${baseURL}/dashboard/patient-analytics`);
      console.log('✅ Patient Analytics fetched successfully:');
      console.log(`  Total Patients: ${patientResponse.data.summary?.totalPatients || 'N/A'}`);
      console.log(`  Male: ${patientResponse.data.summary?.malePatients || 'N/A'}`);
      console.log(`  Female: ${patientResponse.data.summary?.femalePatients || 'N/A'}`);
      
      if (patientResponse.data.demographics?.ageGroups) {
        console.log('  Age Groups:');
        Object.entries(patientResponse.data.demographics.ageGroups).forEach(([group, count]) => {
          console.log(`    ${group}: ${count} patients`);
        });
      }
      
      if (patientResponse.data.demographics?.civilStatus) {
        console.log('  Civil Status:');
        patientResponse.data.demographics.civilStatus.forEach(status => {
          console.log(`    ${status.civilStatus}: ${status.count} patients`);
        });
      }
    } catch (error) {
      console.log('❌ Patient Analytics error:', error.message);
    }

    console.log('\n---\n');

    console.log('💊 Testing Inventory Service endpoints...');
    try {
      const medicationsResponse = await axios.get(`${baseURL}/inventory/medications`);
      console.log(`✅ Medications: ${medicationsResponse.data?.length || 0} items`);
    } catch (error) {
      console.log('❌ Medications error:', error.message);
    }

    try {
      const vaccinesResponse = await axios.get(`${baseURL}/inventory/vaccines`);
      console.log(`✅ Vaccines: ${vaccinesResponse.data?.length || 0} items`);
    } catch (error) {
      console.log('❌ Vaccines error:', error.message);
    }

    try {
      const prescriptionResponse = await axios.get(`${baseURL}/dashboard/prescription-analytics`);
      console.log(`✅ Prescription Analytics: ${prescriptionResponse.data?.summary?.totalPrescriptions || 0} prescriptions`);
    } catch (error) {
      console.log('❌ Prescription Analytics error:', error.message);
    }

  } catch (error) {
    console.error('❌ Error testing frontend data:', error.message);
  }
}

testFrontendData();
