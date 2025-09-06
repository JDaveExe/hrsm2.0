// Quick workaround: localStorage utility with port-based isolation
// This prevents conflicts when running multiple instances

const getPortBasedKey = (key) => {
  const port = window.location.port || '3000';
  return `hrsm_${port}_${key}`;
};

export const isolatedStorage = {
  setItem: (key, value) => {
    try {
      localStorage.setItem(getPortBasedKey(key), value);
    } catch (error) {
      console.error('Error setting isolated storage:', error);
    }
  },
  
  getItem: (key) => {
    try {
      return localStorage.getItem(getPortBasedKey(key));
    } catch (error) {
      console.error('Error getting isolated storage:', error);
      return null;
    }
  },
  
  removeItem: (key) => {
    try {
      localStorage.removeItem(getPortBasedKey(key));
    } catch (error) {
      console.error('Error removing isolated storage:', error);
    }
  },
  
  // Method to migrate existing data to isolated storage
  migrateExistingData: () => {
    const keysToMigrate = [
      'simulationMode',
      'doctorQueue', 
      'dashboardData',
      'appointmentsData',
      'patientsData',
      'inventoryData',
      'medicalRecordsData',
      'familiesData',
      'unsortedMembersData',
      'doctorQueueData',
      'sharedCheckupsData'
    ];
    
    keysToMigrate.forEach(key => {
      const existingValue = localStorage.getItem(key);
      if (existingValue && !localStorage.getItem(getPortBasedKey(key))) {
        isolatedStorage.setItem(key, existingValue);
        // Don't remove original to prevent data loss
      }
    });
  }
};

export default isolatedStorage;
