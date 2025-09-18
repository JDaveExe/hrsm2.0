// Test Patient Notification System
// Run this in browser console on patient dashboard

console.log("🔔 Testing Patient Notification System...");

// Test 1: Create test notifications for current user
// Test script to verify patient notification system  
// Run this in browser console on the patient appointments page

function createTestPatientNotifications() {
    const testNotifications = [
        {
            id: `notif_${Date.now()}_1`,
            patientId: 47, // Change this to current patient ID
            patientName: "Current Patient",
            appointmentDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            appointmentTime: "10:00 AM",
            serviceType: "General Consultation",
            doctorName: "Dr. Smith",
            notes: "Please arrive 15 minutes early",
            createdAt: new Date().toISOString(),
            status: "pending"
        },
        {
            id: `notif_${Date.now()}_2`,
            patientId: 47, // Change this to current patient ID
            patientName: "Current Patient",
            appointmentDate: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
            appointmentTime: "2:30 PM",
            serviceType: "Blood Test",
            doctorName: "Dr. Johnson",
            notes: "Fasting required - no food 12 hours before",
            createdAt: new Date().toISOString(),
            status: "pending"
        },
        {
            id: `notif_${Date.now()}_3`,
            patientId: 47, // Change this to current patient ID
            patientName: "Current Patient",
            appointmentDate: new Date(Date.now() + 259200000).toISOString(), // 3 days from now
            appointmentTime: "11:15 AM",
            serviceType: "Vaccination",
            doctorName: "Dr. Wilson",
            notes: "Bring your vaccination card",
            createdAt: new Date().toISOString(),
            status: "pending"
        }
    ];

    // Store notifications in localStorage
    try {
        const existingNotifications = JSON.parse(localStorage.getItem('patientNotifications') || '[]');
        const updatedNotifications = [...existingNotifications, ...testNotifications];
        localStorage.setItem('patientNotifications', JSON.stringify(updatedNotifications));
        
        console.log("✅ Test notifications created:", testNotifications.length);
        console.log("📋 Total notifications in storage:", updatedNotifications.length);
        
        // Trigger a page refresh to load notifications
        setTimeout(() => {
            console.log("🔄 Refreshing page to load notifications...");
            window.location.reload();
        }, 1000);
        
    } catch (error) {
        console.error("❌ Error creating notifications:", error);
    }
}

// Test 2: Check current notifications
function checkNotifications() {
    try {
        const storedNotifications = localStorage.getItem('patientNotifications');
        if (storedNotifications) {
            const notifications = JSON.parse(storedNotifications);
            console.log("📱 Current notifications:", notifications);
            
            const patientId = 47; // Change this to current patient ID
            const userNotifications = notifications.filter(notif => 
                notif.patientId === patientId && notif.status === 'pending'
            );
            console.log(`👤 Notifications for patient ${patientId}:`, userNotifications);
            console.log(`🔢 Notification count: ${userNotifications.length}`);
            
        } else {
            console.log("📭 No notifications found in storage");
        }
    } catch (error) {
        console.error("❌ Error checking notifications:", error);
    }
}

// Test 3: Clear all notifications
function clearAllNotifications() {
    try {
        localStorage.removeItem('patientNotifications');
        console.log("🗑️ All notifications cleared");
        setTimeout(() => {
            window.location.reload();
        }, 500);
    } catch (error) {
        console.error("❌ Error clearing notifications:", error);
    }
}

// Test 4: Check notification button visibility
function checkNotificationButton() {
    const notificationBtn = document.querySelector('.notification-btn');
    if (notificationBtn) {
        console.log("✅ Notification button found:", notificationBtn);
        console.log("🎨 Button classes:", notificationBtn.className);
        
        const badge = notificationBtn.querySelector('.notification-badge');
        if (badge) {
            console.log("🔴 Notification badge found:", badge.textContent);
        } else {
            console.log("⚪ No notification badge (no notifications)");
        }
    } else {
        console.log("❌ Notification button not found");
    }
}

// Test 5: Simulate notification button click
function testNotificationModal() {
    const notificationBtn = document.querySelector('.notification-btn');
    if (notificationBtn) {
        console.log("🖱️ Clicking notification button...");
        notificationBtn.click();
        
        setTimeout(() => {
            const modal = document.querySelector('.patient-notification-modal');
            if (modal) {
                console.log("✅ Notification modal opened:", modal);
            } else {
                console.log("❌ Notification modal not found");
            }
        }, 100);
    } else {
        console.log("❌ Cannot test modal - notification button not found");
    }
}

// Main test execution
console.log("\n🧪 Available Test Functions:");
console.log("1. createTestNotifications() - Create sample notifications");
console.log("2. checkNotifications() - View current notifications");
console.log("3. clearAllNotifications() - Remove all notifications");
console.log("4. checkNotificationButton() - Check if button is visible");
console.log("5. testNotificationModal() - Open notification modal");

console.log("\n🚀 Quick Test Sequence:");
console.log("Run: createTestNotifications()");

// Auto-check current state
checkNotifications();
checkNotificationButton();