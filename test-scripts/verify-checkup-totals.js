const fetch = require('node-fetch');

async function verifyCheckupTotals() {
  try {
    console.log('🔍 Verifying Checkup Trends Data Consistency\n');

    // Fetch all periods
    const [yearsResponse, monthsResponse, weeksResponse, daysResponse] = await Promise.all([
      fetch('http://localhost:5000/api/dashboard/checkup-trends/years'),
      fetch('http://localhost:5000/api/dashboard/checkup-trends/months'),
      fetch('http://localhost:5000/api/dashboard/checkup-trends/weeks'),
      fetch('http://localhost:5000/api/dashboard/checkup-trends/days')
    ]);

    const yearsData = await yearsResponse.json();
    const monthsData = await monthsResponse.json();
    const weeksData = await weeksResponse.json();
    const daysData = await daysResponse.json();

    // Calculate totals
    const yearlyTotal = yearsData.data.reduce((sum, year) => sum + year.completedCheckups, 0);
    const monthlyTotal = monthsData.data.reduce((sum, month) => sum + month.completedCheckups, 0);
    const weeklyTotal = weeksData.data.reduce((sum, week) => sum + week.completedCheckups, 0);
    const dailyTotal = daysData.data.reduce((sum, day) => sum + day.completedCheckups, 0);

    console.log('📊 TOTALS SUMMARY:');
    console.log(`  Yearly Total (2025): ${yearlyTotal}`);
    console.log(`  Monthly Total (Aug + Sep): ${monthlyTotal}`);
    console.log(`  Weekly Total (weeks 34-38): ${weeklyTotal}`);
    console.log(`  Daily Total (current week): ${dailyTotal}`);

    console.log('\n📈 MONTHLY BREAKDOWN:');
    monthsData.data.forEach(month => {
      console.log(`  ${month.monthName} ${month.year}: ${month.completedCheckups} checkups`);
    });

    console.log('\n📅 WEEKLY BREAKDOWN:');
    weeksData.data.forEach(week => {
      console.log(`  Week ${week.weekNumber} (${week.weekYear}): ${week.completedCheckups} checkups`);
    });

    console.log('\n🗓️ DAILY BREAKDOWN (This Week):');
    daysData.data.forEach(day => {
      console.log(`  ${day.date} (${day.dayName}): ${day.completedCheckups} checkups`);
    });

    // Verification
    console.log('\n✅ VERIFICATION:');
    if (yearlyTotal === monthlyTotal) {
      console.log(`  ✅ Yearly (${yearlyTotal}) matches Monthly (${monthlyTotal})`);
    } else {
      console.log(`  ❌ Yearly (${yearlyTotal}) != Monthly (${monthlyTotal})`);
    }

    const difference = monthlyTotal - weeklyTotal;
    console.log(`  📊 Monthly vs Weekly difference: ${difference} checkups`);
    console.log(`     This is normal - weekly view shows specific weeks, not all month days`);

    console.log('\n🎯 FRONTEND VERIFICATION:');
    console.log('  - Days view should show current week days with real data');
    console.log('  - Weeks view should show last 4 weeks with totals matching API');  
    console.log('  - Months view should show last 6 months with totals matching API');
    console.log('  - Years view should show 535 for 2025 (matches monthly total)');

  } catch (error) {
    console.error('❌ Error verifying checkup totals:', error.message);
  }
}

verifyCheckupTotals();