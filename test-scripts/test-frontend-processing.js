/**
 * Test frontend data processing logic for checkup trends
 * This simulates how the frontend should process the backend API responses
 */

// Simulate the backend API responses we get
const mockApiResponses = {
  days: {
    success: true,
    period: 'days',
    data: [
      { date: '2025-09-16', dayName: 'Tuesday', completedCheckups: 1 }
    ]
  },
  weeks: {
    success: true,
    period: 'weeks',
    data: [
      { weekYear: 202534, weekNumber: 34, completedCheckups: 111 },
      { weekYear: 202535, weekNumber: 35, completedCheckups: 120 },
      { weekYear: 202536, weekNumber: 36, completedCheckups: 138 },
      { weekYear: 202537, weekNumber: 37, completedCheckups: 142 },
      { weekYear: 202538, weekNumber: 38, completedCheckups: 135 }
    ]
  },
  months: {
    success: true,
    period: 'months', 
    data: [
      { year: 2025, month: 8, monthName: 'August', completedCheckups: 270 },
      { year: 2025, month: 9, monthName: 'September', completedCheckups: 265 }
    ]
  },
  years: {
    success: true,
    period: 'years',
    data: [
      { year: 2025, completedCheckups: 535 }
    ]
  }
};

// Simulate the frontend processing logic
function testFrontendProcessing() {
  console.log('🧪 Testing frontend data processing logic...\n');
  
  const today = new Date('2025-09-16'); // Simulate current date
  
  Object.entries(mockApiResponses).forEach(([period, apiResponse]) => {
    console.log(`📊 Processing ${period} data:`);
    console.log('  API Response:', apiResponse.data);
    
    let result;
    
    switch (period) {
      case 'days':
        const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        let checkupTrendsData = [0, 0, 0, 0, 0, 0, 0];
        
        if (apiResponse.data) {
          apiResponse.data.forEach(trend => {
            const dayIndex = weekDays.indexOf(trend.dayName);
            if (dayIndex !== -1) {
              checkupTrendsData[dayIndex] = trend.completedCheckups;
            }
          });
        }
        
        result = {
          labels: weekDays,
          data: checkupTrendsData,
          title: 'This Week'
        };
        break;
        
      case 'weeks':
        const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        let weeksData = [0, 0, 0, 0];
        
        if (apiResponse.data && apiResponse.data.length > 0) {
          // Take last 4 weeks
          apiResponse.data.slice(-4).forEach((trend, index) => {
            if (index < 4) {
              weeksData[index] = trend.completedCheckups || 0;
            }
          });
        }
        
        result = {
          labels: weeks,
          data: weeksData,
          title: 'Last 4 Weeks'
        };
        break;
        
      case 'months':
        const monthsData = [];
        for (let i = 5; i >= 0; i--) {
          const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
          monthsData.push({
            label: monthName,
            count: 0,
            month: monthDate.getMonth() + 1,
            year: monthDate.getFullYear()
          });
        }
        
        if (apiResponse.data && apiResponse.data.length > 0) {
          apiResponse.data.forEach(trend => {
            const matchingMonth = monthsData.find(m => 
              m.year === trend.year && m.month === trend.month
            );
            if (matchingMonth) {
              matchingMonth.count = trend.completedCheckups || 0;
            }
          });
        }
        
        result = {
          labels: monthsData.map(m => m.label),
          data: monthsData.map(m => m.count),
          title: 'Last 6 Months'
        };
        break;
        
      case 'years':
        const yearsData = [];
        for (let i = 4; i >= 0; i--) {
          const year = today.getFullYear() - i;
          yearsData.push({
            label: year.toString(),
            count: 0,
            year: year
          });
        }
        
        if (apiResponse.data && apiResponse.data.length > 0) {
          apiResponse.data.forEach(trend => {
            const matchingYear = yearsData.find(y => y.year === trend.year);
            if (matchingYear) {
              matchingYear.count = trend.completedCheckups || 0;
            }
          });
        }
        
        result = {
          labels: yearsData.map(y => y.label),
          data: yearsData.map(y => y.count),
          title: 'Last 5 Years'
        };
        break;
    }
    
    console.log('  Frontend Result:');
    console.log('    Labels:', result.labels);
    console.log('    Data:', result.data);
    console.log('    Title:', result.title);
    console.log('');
  });
}

testFrontendProcessing();