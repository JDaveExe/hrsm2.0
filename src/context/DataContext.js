import React, { createContext, useContext, useState, useEffect } from 'react';
import adminService from '../services/adminService';

// Create the context
const DataContext = createContext();


// Data persistence utility functions
const saveToLocalStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

const loadFromLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

// Data Provider Component
export const DataProvider = ({ children }) => {
  // Dashboard data
  const [dashboardData, setDashboardData] = useState(() => 
    loadFromLocalStorage('dashboardData', {})
  );

  // Appointments data
  const [appointmentsData, setAppointmentsData] = useState(() => 
    loadFromLocalStorage('appointmentsData', [])
  );

  // Patients data
  const [patientsData, setPatientsData] = useState(() => 
    loadFromLocalStorage('patientsData', [])
  );

  // Inventory data
  const [inventoryData, setInventoryData] = useState(() => 
    loadFromLocalStorage('inventoryData', [])
  );

  // Medical records data
  const [medicalRecordsData, setMedicalRecordsData] = useState(() => 
    loadFromLocalStorage('medicalRecordsData', [])
  );

  // Families data
  const [familiesData, setFamiliesData] = useState(() => 
    loadFromLocalStorage('familiesData', [])
  );

  // Unsorted members data
  const [unsortedMembersData, setUnsortedMembersData] = useState(() => 
    loadFromLocalStorage('unsortedMembersData', [])
  );

  // Function to fetch unsorted members from the backend
  const fetchUnsortedMembers = async () => {
    try {
      const members = await adminService.getUnsortedMembers();
      setUnsortedMembersData(members);
    } catch (error) {
      console.error("Failed to fetch unsorted members:", error);
      // Optionally, handle the error in the UI
    }
  };

  // Analytics/Reports data
  const [analyticsData, setAnalyticsData] = useState(() => 
    loadFromLocalStorage('analyticsData', {})
  );

  // Auto-save to localStorage whenever data changes
  useEffect(() => {
    saveToLocalStorage('dashboardData', dashboardData);
  }, [dashboardData]);

  useEffect(() => {
    saveToLocalStorage('appointmentsData', appointmentsData);
  }, [appointmentsData]);

  useEffect(() => {
    saveToLocalStorage('patientsData', patientsData);
  }, [patientsData]);

  useEffect(() => {
    saveToLocalStorage('inventoryData', inventoryData);
  }, [inventoryData]);

  useEffect(() => {
    saveToLocalStorage('medicalRecordsData', medicalRecordsData);
  }, [medicalRecordsData]);

  useEffect(() => {
    saveToLocalStorage('familiesData', familiesData);
  }, [familiesData]);

  useEffect(() => {
    saveToLocalStorage('unsortedMembersData', unsortedMembersData);
  }, [unsortedMembersData]);

  useEffect(() => {
    saveToLocalStorage('analyticsData', analyticsData);
  }, [analyticsData]);

  // Dashboard data functions
  const updateDashboardData = (newData) => {
    setDashboardData(prev => ({ ...prev, ...newData }));
  };

  // Appointments functions
  const addAppointment = (appointment) => {
    setAppointmentsData(prev => [...prev, { ...appointment, id: Date.now() }]);
  };

  const updateAppointment = (id, updates) => {
    setAppointmentsData(prev => 
      prev.map(apt => apt.id === id ? { ...apt, ...updates } : apt)
    );
  };

  const deleteAppointment = (id) => {
    setAppointmentsData(prev => prev.filter(apt => apt.id !== id));
  };

  // Patients functions
  const addPatient = (patient) => {
    const newPatient = { ...patient, id: Date.now() };
    setPatientsData(prev => [...prev, newPatient]);
    return newPatient;
  };

  const updatePatient = (id, updates) => {
    setPatientsData(prev => 
      prev.map(patient => patient.id === id ? { ...patient, ...updates } : patient)
    );
  };

  const deletePatient = (id) => {
    setPatientsData(prev => prev.filter(patient => patient.id !== id));
  };

  // Inventory functions
  const addInventoryItem = (item) => {
    setInventoryData(prev => [...prev, { ...item, id: Date.now() }]);
  };

  const updateInventoryItem = (id, updates) => {
    setInventoryData(prev => 
      prev.map(item => item.id === id ? { ...item, ...updates } : item)
    );
  };

  const deleteInventoryItem = (id) => {
    setInventoryData(prev => prev.filter(item => item.id !== id));
  };

  // Medical records functions
  const addMedicalRecord = (record) => {
    setMedicalRecordsData(prev => [...prev, { ...record, id: Date.now() }]);
  };

  const updateMedicalRecord = (id, updates) => {
    setMedicalRecordsData(prev => 
      prev.map(record => record.id === id ? { ...record, ...updates } : record)
    );
  };

  // Families functions
  const addFamily = (family) => {
    const newFamily = { ...family, id: Date.now(), members: [] };
    setFamiliesData(prev => [...prev, newFamily]);
    return newFamily;
  };

  const updateFamily = (id, updates) => {
    setFamiliesData(prev => 
      prev.map(family => family.id === id ? { ...family, ...updates } : family)
    );
  };

  const addMemberToFamily = (familyId, member) => {
    setFamiliesData(prev => 
      prev.map(family => 
        family.id === familyId 
          ? { ...family, members: [...family.members, member] }
          : family
      )
    );
    
    // Remove from unsorted members if it was there
    setUnsortedMembersData(prev => 
      prev.filter(unsorted => unsorted.id !== member.id)
    );
  };

  // Unsorted members functions
  const addUnsortedMember = (member) => {
    const newMember = { ...member, id: Date.now() };
    setUnsortedMembersData(prev => [...prev, newMember]);
    return newMember;
  };

  const removeUnsortedMember = (id) => {
    setUnsortedMembersData(prev => prev.filter(member => member.id !== id));
  };

  // Analytics functions
  const updateAnalyticsData = (newData) => {
    setAnalyticsData(prev => ({ ...prev, ...newData }));
  };

  // Clear all data function (useful for logout)
  const clearAllData = () => {
    setDashboardData({});
    setAppointmentsData([]);
    setPatientsData([]);
    setInventoryData([]);
    setMedicalRecordsData([]);
    setFamiliesData([]);
    setUnsortedMembersData([]);
    setAnalyticsData({});
    
    // Clear from localStorage as well
    localStorage.removeItem('dashboardData');
    localStorage.removeItem('appointmentsData');
    localStorage.removeItem('patientsData');
    localStorage.removeItem('inventoryData');
    localStorage.removeItem('medicalRecordsData');
    localStorage.removeItem('familiesData');
    localStorage.removeItem('unsortedMembersData');
    localStorage.removeItem('analyticsData');
  };

  const value = {
    // Data state
    dashboardData,
    appointmentsData,
    patientsData,
    inventoryData,
    medicalRecordsData,
    familiesData,
    unsortedMembersData,
    analyticsData,
    
    // Dashboard functions
    updateDashboardData,
    
    // Appointments functions
    addAppointment,
    updateAppointment,
    deleteAppointment,
    
    // Patients functions
    addPatient,
    updatePatient,
    deletePatient,
    
    // Inventory functions
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    
    // Medical records functions
    addMedicalRecord,
    updateMedicalRecord,
    
    // Families functions
    addFamily,
    updateFamily,
    addMemberToFamily,
    
    // Unsorted members functions
    addUnsortedMember,
    removeUnsortedMember,
    fetchUnsortedMembers,
    
    // Analytics functions
    updateAnalyticsData,
    
    // Utility functions
    clearAllData,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

// Custom hook to use data context
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export default DataContext;
