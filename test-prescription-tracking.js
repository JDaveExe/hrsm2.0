const fetch = require('node-fetch');

async function testPrescriptionTracking() {
  console.log('🧪 Testing Prescription Analytics Integration...');
  
  try {
    // Step 1: Login as doctor
    console.log('\n🔐 Logging in as doctor...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'doctor.smith',
        password: 'password123'
      })
    });
    
    if (!loginRes.ok) {
      throw new Error(`Login failed: ${loginRes.status}`);
    }
    
    const { token } = await loginRes.json();
    console.log('✅ Doctor login successful');

    // Step 2: Test the new prescription analytics endpoint
    console.log('\n📊 Testing prescription analytics endpoint...');
    const analyticsRes = await fetch('http://localhost:5000/api/dashboard/prescription-analytics?timePeriod=30days', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!analyticsRes.ok) {
      throw new Error(`Analytics failed: ${analyticsRes.status}`);
    }
    
    const analytics = await analyticsRes.json();
    console.log('✅ Prescription analytics fetched successfully:');
    console.log(`   - Total Prescriptions: ${analytics.summary.totalPrescriptions}`);
    console.log(`   - Total Medications Dispensed: ${analytics.summary.totalMedicationsDispensed}`);
    console.log(`   - Avg Medications per Prescription: ${analytics.summary.avgMedicationsPerPrescription}`);
    console.log(`   - Top Medications: ${analytics.topMedications.length}`);
    console.log(`   - Daily Trends: ${analytics.dailyTrends.length} days`);

    if (analytics.topMedications.length > 0) {
      console.log('\n💊 Top Prescribed Medications:');
      analytics.topMedications.slice(0, 5).forEach((med, index) => {
        console.log(`   ${index + 1}. ${med.name}: ${med.totalQuantity} units (${med.prescriptionCount} prescriptions)`);
      });
    }

    // Step 3: Check if we have recent prescription trends
    const recentTrends = analytics.dailyTrends.filter(day => day.prescriptionCount > 0);
    if (recentTrends.length > 0) {
      console.log('\n📈 Recent Prescription Activity:');
      recentTrends.slice(-7).forEach(day => {
        console.log(`   ${day.date} (${day.dayName}): ${day.prescriptionCount} prescriptions`);
      });
    } else {
      console.log('\n⚠️  No recent prescription activity found');
      console.log('   This is normal if no checkups have been completed with prescriptions recently');
    }

    // Step 4: Test with different time periods
    console.log('\n🕐 Testing different time periods...');
    for (const period of ['7days', '30days']) {
      const periodRes = await fetch(`http://localhost:5000/api/dashboard/prescription-analytics?timePeriod=${period}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (periodRes.ok) {
        const periodAnalytics = await periodRes.json();
        console.log(`   ${period}: ${periodAnalytics.summary.totalPrescriptions} prescriptions`);
      }
    }

    console.log('\n✅ Prescription Analytics Testing Complete!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Open Management Dashboard > Inventory Analysis');
    console.log('   2. Check the Prescription Usage Distribution chart');
    console.log('   3. View the Prescription Trends chart');
    console.log('   4. Try switching between "Last 7 Days" and "Last 30 Days"');
    console.log('   5. Complete some checkups with prescriptions to see live data');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test
testPrescriptionTracking();
