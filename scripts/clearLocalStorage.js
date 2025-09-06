// Clear localStorage data for fresh testing
// Run this in browser console or we can add it to the app

const clearLocalStorageData = () => {
  console.log('🧹 Clearing localStorage data...');
  
  const keysToRemove = [
    'doctorCheckupsData',
    'sharedCheckupsData',
    'doctorQueueData'
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`🗑️  Removed: ${key}`);
  });
  
  console.log('✅ localStorage cleared for fresh testing!');
  console.log('🔄 Please refresh the page to see clean data');
};

// Run the function
clearLocalStorageData();
