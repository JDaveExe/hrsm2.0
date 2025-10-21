// Quick debug script to test API from browser console
// Run this in the browser console while on the patient dashboard

console.log('🔍 Debugging Notification Display Issue...');

// Check if we're logged in and have patient ID
const patientId = localStorage.getItem('patientId');
console.log('🆔 Patient ID from localStorage:', patientId);

// Test the API directly
fetch('http://localhost:5000/api/notifications/patient/113')
  .then(response => {
    console.log('📡 API Response Status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('✅ API Data:', data);
    console.log(`📊 API Reports: ${data.count} notifications`);
    
    // Check what the UI is showing
    const modal = document.querySelector('.notification-modal, [class*="notification"]');
    const counter = document.querySelector('.notification-counter, [class*="counter"]');
    const items = document.querySelectorAll('.notification-item, [class*="notification-item"]');
    
    console.log('🎨 UI Elements:');
    console.log('   Modal found:', !!modal);
    console.log('   Counter found:', !!counter);
    console.log('   Counter text:', counter ? counter.textContent : 'N/A');
    console.log('   Notification items:', items.length);
    
    // Check React component state (if accessible)
    if (window.React) {
      console.log('⚛️ React detected');
      // Try to find React component instances
      const reactRoot = document.querySelector('[data-reactroot]');
      if (reactRoot && reactRoot._reactInternalInstance) {
        console.log('🔍 React component found');
      }
    }
    
    // Check for any errors in network requests
    console.log('📡 Test: Making same request as component should...');
    
    return data;
  })
  .catch(error => {
    console.error('❌ API Test Failed:', error);
  });

// Also test with the actual patient ID from storage
if (patientId && patientId !== '113') {
  console.log(`🔄 Testing with actual patient ID: ${patientId}`);
  fetch(`http://localhost:5000/api/notifications/patient/${patientId}`)
    .then(r => r.json())
    .then(data => {
      console.log(`📊 Patient ${patientId} has ${data.count} notifications`);
    })
    .catch(err => console.error('❌ Patient-specific test failed:', err));
}