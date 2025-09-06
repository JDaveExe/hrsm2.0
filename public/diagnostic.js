// Diagnostic script to identify the source of rapid reloading issues
// Run this in the browser console to get detailed information

console.log('=== HRSM 2.0 Diagnostic Report ===');

// 1. Check for localStorage conflicts
console.log('\n1. LocalStorage Analysis:');
const localStorageKeys = Object.keys(localStorage);
console.log('Total localStorage keys:', localStorageKeys.length);
localStorageKeys.forEach(key => {
  try {
    const value = localStorage.getItem(key);
    console.log(`- ${key}: ${value ? (value.length > 100 ? `${value.substring(0, 100)}...` : value) : 'null'}`);
  } catch (e) {
    console.log(`- ${key}: ERROR reading value - ${e.message}`);
  }
});

// 2. Check for sessionStorage
console.log('\n2. SessionStorage Analysis:');
const sessionStorageKeys = Object.keys(sessionStorage);
console.log('Total sessionStorage keys:', sessionStorageKeys.length);
sessionStorageKeys.forEach(key => {
  try {
    const value = sessionStorage.getItem(key);
    console.log(`- ${key}: ${value ? (value.length > 100 ? `${value.substring(0, 100)}...` : value) : 'null'}`);
  } catch (e) {
    console.log(`- ${key}: ERROR reading value - ${e.message}`);
  }
});

// 3. Check for active timers
console.log('\n3. Timer Analysis:');
let timerCount = 0;
const originalSetInterval = window.setInterval;
const originalSetTimeout = window.setTimeout;

window.setInterval = function(...args) {
  timerCount++;
  console.log('New setInterval created, total active intervals:', timerCount);
  return originalSetInterval.apply(this, args);
};

window.setTimeout = function(...args) {
  console.log('New setTimeout created');
  return originalSetTimeout.apply(this, args);
};

// 4. Check current URL and port
console.log('\n4. Environment Analysis:');
console.log('Current URL:', window.location.href);
console.log('Current Port:', window.location.port);
console.log('Protocol:', window.location.protocol);
console.log('User Agent:', navigator.userAgent);

// 5. Check for React DevTools
console.log('\n5. React Analysis:');
console.log('React version:', React?.version || 'Not accessible');
console.log('React DevTools:', window.__REACT_DEVTOOLS_GLOBAL_HOOK__ ? 'Available' : 'Not available');

// 6. Check for service worker
console.log('\n6. Service Worker Analysis:');
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('Service Worker registrations:', registrations.length);
    registrations.forEach((registration, index) => {
      console.log(`- Registration ${index + 1}:`, registration.scope);
      console.log('  State:', registration.active?.state);
    });
  });
} else {
  console.log('Service Workers not supported');
}

// 7. Check for memory usage
console.log('\n7. Memory Analysis:');
if (performance.memory) {
  console.log('Used JS Heap Size:', (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2), 'MB');
  console.log('Total JS Heap Size:', (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2), 'MB');
  console.log('JS Heap Size Limit:', (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2), 'MB');
}

// 8. Check for authentication state
console.log('\n8. Authentication Analysis:');
console.log('Global auth token:', window.__authToken ? 'Present' : 'Not present');
console.log('Global auth logout:', window.__authLogout ? 'Present' : 'Not present');

// 9. Check for console errors
console.log('\n9. Console Error Monitoring:');
const originalError = console.error;
console.error = function(...args) {
  console.log('🚨 CONSOLE ERROR DETECTED:', args);
  originalError.apply(this, args);
};

// 10. Check for unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
  console.log('🚨 UNHANDLED PROMISE REJECTION:', event.reason);
});

// 11. Monitor page visibility changes
document.addEventListener('visibilitychange', function() {
  console.log('Page visibility changed to:', document.visibilityState);
});

// 12. Monitor storage events
window.addEventListener('storage', function(event) {
  console.log('🔄 Storage event detected:', {
    key: event.key,
    oldValue: event.oldValue ? (event.oldValue.length > 50 ? `${event.oldValue.substring(0, 50)}...` : event.oldValue) : null,
    newValue: event.newValue ? (event.newValue.length > 50 ? `${event.newValue.substring(0, 50)}...` : event.newValue) : null
  });
});

console.log('\n=== Diagnostic Setup Complete ===');
console.log('Monitor the console for any detected issues as you use the application.');
console.log('If you see rapid storage events or timer creation, that may indicate the source of the reload issue.');
