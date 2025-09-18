const puppeteer = require('puppeteer');

async function testManagementDashboard() {
  let browser;
  try {
    console.log('🌐 Starting browser test for Management Dashboard...');
    
    browser = await puppeteer.launch({ 
      headless: false, // Show browser
      defaultViewport: null,
      args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    // Listen for console logs from the page
    page.on('console', msg => {
      if (msg.text().includes('Management Dashboard') || 
          msg.text().includes('Data fetched') || 
          msg.text().includes('chart data') ||
          msg.text().includes('📊') ||
          msg.text().includes('📈')) {
        console.log('🖥️  Browser Console:', msg.text());
      }
    });
    
    // Navigate to the management dashboard
    console.log('📍 Navigating to management dashboard...');
    await page.goto('http://localhost:3000/management-dashboard', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for the page to load
    await page.waitForTimeout(3000);
    
    // Try to click on Reports tab
    console.log('📊 Looking for Reports section...');
    
    // Wait for any reports-related elements
    await page.waitForTimeout(5000);
    
    console.log('✅ Management dashboard loaded. Check browser console for data logs.');
    console.log('⏳ Keeping browser open for 30 seconds to observe...');
    
    // Keep browser open for observation
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Error testing management dashboard:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Only run if puppeteer is available
try {
  testManagementDashboard();
} catch (error) {
  console.log('❌ Puppeteer not available. Please install with: npm install puppeteer');
  console.log('💡 Alternative: Manually open http://localhost:3000/management-dashboard and check browser console');
}
