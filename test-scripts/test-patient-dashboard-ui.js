const puppeteer = require('puppeteer');

async function testPatientDashboardUI() {
    console.log('🧪 Testing Patient Dashboard UI with Database Notifications...\n');
    
    let browser;
    try {
        // Launch browser
        browser = await puppeteer.launch({ 
            headless: false, // Show browser for visual confirmation
            defaultViewport: null,
            args: ['--start-maximized']
        });
        
        const page = await browser.newPage();
        
        // Navigate to login page
        console.log('🔗 Navigating to login page...');
        await page.goto('http://localhost:3000/login');
        await page.waitForSelector('input[type="email"]', { timeout: 10000 });
        
        // Login as Kaleia (Patient ID 113) who has notifications
        console.log('🔐 Logging in as Kaleia (Patient 113)...');
        await page.type('input[type="email"]', 'kaleia@test.com');
        await page.type('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');
        
        // Wait for dashboard to load
        console.log('⏳ Waiting for patient dashboard to load...');
        await page.waitForSelector('.patient-dashboard', { timeout: 15000 });
        
        // Wait a moment for notifications to load via API polling
        console.log('📡 Waiting for notifications to load via API polling...');
        await page.waitForTimeout(3000);
        
        // Check if notifications are displayed
        console.log('🔍 Checking notification display...');
        
        // Look for notification count in the UI
        const notificationElements = await page.$$eval('.notification-item', elements => {
            return elements.map(el => ({
                text: el.textContent.trim(),
                visible: el.offsetHeight > 0
            }));
        }).catch(() => []);
        
        console.log(`📊 Found ${notificationElements.length} notification elements in UI`);
        
        if (notificationElements.length > 0) {
            console.log('✅ Notifications are displaying in UI:');
            notificationElements.forEach((notif, index) => {
                console.log(`   ${index + 1}. ${notif.text.substring(0, 80)}...`);
            });
            
            // Test accepting a notification
            console.log('\n🎯 Testing notification acceptance...');
            
            // Look for accept button
            const acceptButton = await page.$('.notification-item .accept-btn');
            if (acceptButton) {
                console.log('📤 Clicking accept button...');
                await acceptButton.click();
                
                // Wait for UI update
                await page.waitForTimeout(2000);
                
                // Check if notification count decreased
                const updatedNotifications = await page.$$eval('.notification-item', elements => elements.length).catch(() => 0);
                console.log(`📈 Updated notification count: ${updatedNotifications}`);
                
                if (updatedNotifications < notificationElements.length) {
                    console.log('✅ Notification accept functionality working!');
                } else {
                    console.log('⚠️ Notification count did not decrease after accept');
                }
            } else {
                console.log('⚠️ No accept button found in notifications');
            }
            
        } else {
            console.log('❌ No notifications found in UI');
            
            // Check if notification counter shows (0)
            const notificationCounter = await page.$eval('.notification-counter', el => el.textContent).catch(() => 'not found');
            console.log(`🔢 Notification counter shows: ${notificationCounter}`);
        }
        
        // Check console for any errors
        const consoleMessages = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleMessages.push(msg.text());
            }
        });
        
        await page.waitForTimeout(2000);
        
        if (consoleMessages.length > 0) {
            console.log('\n❌ Console errors found:');
            consoleMessages.forEach(msg => console.log(`   ${msg}`));
        } else {
            console.log('\n✅ No console errors detected');
        }
        
        // Take screenshot for reference
        await page.screenshot({ path: 'patient-dashboard-test.png', fullPage: true });
        console.log('📸 Screenshot saved as patient-dashboard-test.png');
        
        // Test with Derick (Patient ID 134) as well
        console.log('\n🔄 Testing with second patient (Derick)...');
        
        // Logout and login as Derick
        const logoutButton = await page.$('.logout-btn, [href="/logout"], button:contains("Logout")');
        if (logoutButton) {
            await logoutButton.click();
            await page.waitForTimeout(1000);
        }
        
        // Navigate back to login
        await page.goto('http://localhost:3000/login');
        await page.waitForSelector('input[type="email"]');
        
        // Clear and login as Derick
        await page.evaluate(() => {
            document.querySelector('input[type="email"]').value = '';
            document.querySelector('input[type="password"]').value = '';
        });
        
        await page.type('input[type="email"]', 'derick@test.com');
        await page.type('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');
        
        await page.waitForSelector('.patient-dashboard', { timeout: 10000 });
        await page.waitForTimeout(3000);
        
        const derickNotifications = await page.$$eval('.notification-item', elements => elements.length).catch(() => 0);
        console.log(`📊 Derick has ${derickNotifications} notifications in UI`);
        
        console.log('\n🎉 Patient Dashboard UI Test Complete!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Full error:', error);
    } finally {
        if (browser) {
            // Keep browser open for 10 seconds to see results
            console.log('\n⏱️ Keeping browser open for 10 seconds for inspection...');
            setTimeout(async () => {
                await browser.close();
            }, 10000);
        }
    }
}

// Make sure the server is running
console.log('🚀 Make sure your React server is running on http://localhost:3000');
console.log('🔧 Make sure your backend server is running on http://localhost:5000');
console.log('');

testPatientDashboardUI();