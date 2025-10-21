// Test script to debug chart generation issue
console.log('🧪 Testing Chart Generation Issue...\n');

// Mock the chart generation function with the same logic
function debugChartGeneration() {
  console.log('=== TESTING CHART GENERATION LOGIC ===\n');
  
  // Test with empty/undefined dashboardStats (current issue)
  console.log('1️⃣ Testing with empty dashboardStats (current issue):');
  let dashboardStats = undefined;
  let chartType = 'pie';
  
  if (chartType === 'pie' || chartType === 'doughnut') {
    if (dashboardStats?.patients) {
      const genderData = {
        Male: dashboardStats.patients.male || 0,
        Female: dashboardStats.patients.female || 0
      };
      console.log('✅ Would use real gender data:', genderData);
    } else {
      console.log('❌ Using fallback gender data: Male: 45, Female: 52');
      console.log('   Reason: dashboardStats?.patients is', dashboardStats?.patients);
    }
  }
  
  console.log('\n2️⃣ Testing with correct dashboardStats:');
  dashboardStats = {
    patients: {
      total: 18,
      male: 10,
      female: 8
    },
    ageDistribution: [
      { ageGroup: '21-30', count: 8 },
      { ageGroup: '31-40', count: 9 },
      { ageGroup: '51-60', count: 1 }
    ]
  };
  
  if (chartType === 'pie' || chartType === 'doughnut') {
    if (dashboardStats?.patients) {
      const genderData = {
        Male: dashboardStats.patients.male || 0,
        Female: dashboardStats.patients.female || 0
      };
      console.log('✅ Would use real gender data:', genderData);
    } else {
      console.log('❌ Using fallback gender data: Male: 45, Female: 52');
    }
  }
  
  console.log('\n3️⃣ Testing age distribution:');
  chartType = 'bar';
  
  if (dashboardStats?.ageDistribution && dashboardStats.ageDistribution.length > 0) {
    const ageData = dashboardStats.ageDistribution;
    console.log('✅ Would use real age data:', ageData);
    console.log('   Labels:', ageData.map(item => item.ageGroup));
    console.log('   Data:', ageData.map(item => item.count));
  } else {
    console.log('❌ Using fallback age data');
  }
}

debugChartGeneration();

console.log('\n=== DIAGNOSIS ===');
console.log('💡 The issue is likely one of these:');
console.log('   1. dashboardStats state is not populated when chart is generated');
console.log('   2. Chart generation happens before data is fetched');
console.log('   3. State update timing issue');
console.log('\n🔧 Let\'s create a test to verify data flow in the React component...');
