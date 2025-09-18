const axios = require('axios');

async function testPatientAnalytics() {
  try {
    console.log('🧪 Testing Patient Analytics Endpoints...\n');

    // Test dashboard stats endpoint
    console.log('📊 Testing /api/dashboard/stats...');
    const statsResponse = await axios.get('http://localhost:5000/api/dashboard/stats');
    console.log('✅ Dashboard Stats Response:');
    console.log('  Total Patients:', statsResponse.data.patients?.total || 0);
    console.log('  Male Patients:', statsResponse.data.patients?.male || 0);
    console.log('  Female Patients:', statsResponse.data.patients?.female || 0);
    console.log('  Age Distribution:', statsResponse.data.ageDistribution?.length || 0, 'groups');
    
    if (statsResponse.data.ageDistribution && statsResponse.data.ageDistribution.length > 0) {
      console.log('  Age Groups:');
      statsResponse.data.ageDistribution.forEach(group => {
        console.log(`    ${group.ageGroup}: ${group.count} patients`);
      });
    }

    console.log('  Checkup Trends:', statsResponse.data.checkupTrends?.length || 0, 'days');
    if (statsResponse.data.checkupTrends && statsResponse.data.checkupTrends.length > 0) {
      console.log('  Recent Checkups:');
      statsResponse.data.checkupTrends.forEach(trend => {
        console.log(`    ${trend.dayName}: ${trend.completedCheckups} checkups`);
      });
    }

    console.log('\n---\n');

    // Test patient analytics endpoint
    console.log('👥 Testing /api/dashboard/patient-analytics...');
    const patientResponse = await axios.get('http://localhost:5000/api/dashboard/patient-analytics');
    console.log('✅ Patient Analytics Response:');
    console.log('  Total Patients:', patientResponse.data.summary?.totalPatients || 0);
    console.log('  Male Patients:', patientResponse.data.summary?.malePatients || 0);
    console.log('  Female Patients:', patientResponse.data.summary?.femalePatients || 0);
    
    if (patientResponse.data.demographics?.ageGroups) {
      console.log('  Age Groups:');
      Object.entries(patientResponse.data.demographics.ageGroups).forEach(([ageRange, count]) => {
        console.log(`    ${ageRange}: ${count} patients`);
      });
    }

    if (patientResponse.data.demographics?.civilStatus) {
      console.log('  Civil Status:');
      patientResponse.data.demographics.civilStatus.forEach(status => {
        console.log(`    ${status.civilStatus || 'Not Specified'}: ${status.count} patients`);
      });
    }

    if (patientResponse.data.registrationTrends) {
      console.log('  Registration Trends:', patientResponse.data.registrationTrends.length, 'months');
    }

    if (patientResponse.data.checkupFrequency?.mostActivePatients) {
      console.log('  Most Active Patients:', patientResponse.data.checkupFrequency.mostActivePatients.length);
      patientResponse.data.checkupFrequency.mostActivePatients.slice(0, 3).forEach((patient, index) => {
        console.log(`    ${index + 1}. ${patient.name}: ${patient.checkupCount} checkups`);
      });
    }

  } catch (error) {
    console.error('❌ Error testing patient analytics:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
  }
}

testPatientAnalytics();
