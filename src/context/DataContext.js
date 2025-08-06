import React, { createContext, useContext, useState, useEffect } from 'react';
import adminService from '../services/adminService';
import patientService from '../services/patientService';

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

  // Doctor queue data - shared between admin and doctor dashboards
  const [doctorQueueData, setDoctorQueueData] = useState(() => 
    loadFromLocalStorage('doctorQueueData', [])
  );

  // Shared checkup status - synchronized between admin and doctor
  const [sharedCheckupsData, setSharedCheckupsData] = useState(() => 
    loadFromLocalStorage('sharedCheckupsData', [])
  );

  // Simulation mode status - shared between admin and doctor dashboards
  const [simulationModeStatus, setSimulationModeStatus] = useState(() => 
    loadFromLocalStorage('simulationModeStatus', {
      enabled: false,
      currentSimulatedDate: null,
      activatedBy: null,
      activatedAt: null
    })
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

  // Function to fetch all patients from the backend
  const fetchAllPatients = async () => {
    try {
      console.log('Fetching patients from backend...');
      const patients = await patientService.getAllPatients();
      console.log('Received patients from backend:', patients);
      setPatientsData(patients);
      return patients;
    } catch (error) {
      console.error("Failed to fetch patients:", error);
      // Keep existing localStorage data if API fails
      return [];
    }
  };

  // Function to fetch initial data from backend
  const fetchInitialData = async () => {
    try {
      console.log('Fetching initial data from backend...');
      
      // Fetch patients and unsorted members in parallel
      const [patients, unsortedMembers] = await Promise.all([
        fetchAllPatients(),
        adminService.getUnsortedMembers().catch(err => {
          console.error('Failed to fetch unsorted members:', err);
          return [];
        })
      ]);
      
      console.log('Initial data fetched:', { patients, unsortedMembers });
      setUnsortedMembersData(unsortedMembers);
      
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    }
  };

  // Fetch initial data when the component mounts
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Auto-authenticate for testing (if no auth token exists)
  useEffect(() => {
    const setupAuth = async () => {
      const authData = JSON.parse(localStorage.getItem('auth'));
      if (!authData || !authData.token) {
        try {
          console.log('Setting up authentication...');
          const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              login: 'admin',
              password: 'admin123'
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            localStorage.setItem('auth', JSON.stringify({
              token: data.token,
              user: data.user
            }));
            console.log('Authentication setup complete');
            
            // Refresh data after authentication
            setTimeout(() => {
              fetchInitialData();
            }, 1000);
          }
        } catch (error) {
          console.error('Authentication setup failed:', error);
        }
      }
    };
    
    setupAuth();
  }, []);

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
    saveToLocalStorage('doctorQueueData', doctorQueueData);
  }, [doctorQueueData]);

  useEffect(() => {
    saveToLocalStorage('sharedCheckupsData', sharedCheckupsData);
  }, [sharedCheckupsData]);

  useEffect(() => {
    saveToLocalStorage('simulationModeStatus', simulationModeStatus);
  }, [simulationModeStatus]);

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
  const addPatient = async (patient) => {
    try {
      // Try to create patient in backend first
      const newPatient = await patientService.createPatient(patient);
      
      // If successful, add to local state
      setPatientsData(prev => [...prev, newPatient]);
      return newPatient;
    } catch (error) {
      console.error('Failed to create patient in backend:', error);
      // Fallback to local creation with timestamp ID
      const localPatient = { ...patient, id: Date.now() };
      setPatientsData(prev => [...prev, localPatient]);
      return localPatient;
    }
  };

  const updatePatient = (id, updates) => {
    setPatientsData(prev => 
      prev.map(patient => patient.id === id ? { ...patient, ...updates } : patient)
    );
  };

  const deletePatient = (id) => {
    setPatientsData(prev => prev.filter(patient => patient.id !== id));
  };

  const setAllPatients = (patients) => {
    setPatientsData(patients);
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

  const setAllFamilies = (families) => {
    setFamiliesData(families);
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

  // Doctor queue management functions
  const notifyDoctor = (checkupData) => {
    const queueItem = {
      ...checkupData,
      id: checkupData.id || Date.now(),
      queuedAt: new Date().toISOString(),
      status: 'Waiting',
      source: 'admin_simulation'
    };
    setDoctorQueueData(prev => [...prev, queueItem]);
    
    // Also update shared checkups data
    setSharedCheckupsData(prev => 
      prev.map(checkup => 
        checkup.id === checkupData.id 
          ? { ...checkup, status: 'With Doctor', notifiedAt: new Date().toISOString() }
          : checkup
      )
    );
    
    return queueItem;
  };

  const updateDoctorQueueStatus = (id, status, additionalData = {}) => {
    setDoctorQueueData(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, status, ...additionalData, updatedAt: new Date().toISOString() }
          : item
      )
    );
    
    // Sync with shared checkups
    setSharedCheckupsData(prev => 
      prev.map(checkup => 
        checkup.id === id 
          ? { ...checkup, status: status === 'In Progress' ? 'Ongoing' : status, ...additionalData }
          : checkup
      )
    );
  };

  const completeDoctorSession = (id, sessionData) => {
    // Remove from doctor queue
    setDoctorQueueData(prev => prev.filter(item => item.id !== id));
    
    // Update shared checkups to completed
    setSharedCheckupsData(prev => 
      prev.map(checkup => 
        checkup.id === id 
          ? { 
              ...checkup, 
              status: 'Completed', 
              completedAt: new Date().toISOString(),
              sessionData
            }
          : checkup
      )
    );
  };

  const syncCheckupStatus = (checkupId, status, source = 'unknown') => {
    const timestamp = new Date().toISOString();
    
    setSharedCheckupsData(prev => 
      prev.map(checkup => 
        checkup.id === checkupId 
          ? { 
              ...checkup, 
              status, 
              lastUpdated: timestamp,
              lastUpdatedBy: source
            }
          : checkup
      )
    );
  };

  // Simulation mode management functions
  const updateSimulationMode = (simulationData, userId = 'admin') => {
    setSimulationModeStatus({
      enabled: simulationData.enabled,
      currentSimulatedDate: simulationData.currentSimulatedDate,
      activatedBy: userId,
      activatedAt: simulationData.enabled ? new Date().toISOString() : null,
      smsSimulation: simulationData.smsSimulation,
      emailSimulation: simulationData.emailSimulation,
      dataSimulation: simulationData.dataSimulation
    });
  };

  const disableSimulationMode = () => {
    setSimulationModeStatus({
      enabled: false,
      currentSimulatedDate: null,
      activatedBy: null,
      activatedAt: null,
      smsSimulation: false,
      emailSimulation: false,
      dataSimulation: false
    });
  };

  // Analytics functions
  const updateAnalyticsData = (newData) => {
    setAnalyticsData(prev => ({ ...prev, ...newData }));
  };

  // Backup and Restore functions
  const createBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '2.0',
      data: {
        dashboardData,
        appointmentsData,
        patientsData,
        inventoryData,
        medicalRecordsData,
        familiesData,
        unsortedMembersData,
        doctorQueueData,
        sharedCheckupsData,
        simulationModeStatus,
        analyticsData
      },
      metadata: {
        totalPatients: patientsData.length,
        totalFamilies: familiesData.length,
        totalAppointments: appointmentsData.length,
        totalRecords: medicalRecordsData.length,
        backupSize: JSON.stringify({
          dashboardData,
          appointmentsData,
          patientsData,
          inventoryData,
          medicalRecordsData,
          familiesData,
          unsortedMembersData,
          doctorQueueData,
          sharedCheckupsData,
          simulationModeStatus,
          analyticsData
        }).length
      }
    };

    // Create and download backup file
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hrsm-backup-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    // Save backup info to localStorage for backup history
    const backupHistory = loadFromLocalStorage('backupHistory', []);
    backupHistory.unshift({
      id: Date.now(),
      timestamp: backupData.timestamp,
      filename: a.download,
      metadata: backupData.metadata
    });
    // Keep only last 10 backups in history
    if (backupHistory.length > 10) {
      backupHistory.splice(10);
    }
    saveToLocalStorage('backupHistory', backupHistory);

    return backupData;
  };

  const restoreBackup = (backupFile) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const backupData = JSON.parse(event.target.result);
          
          // Validate backup format
          if (!backupData.data || !backupData.timestamp) {
            reject(new Error('Invalid backup file format'));
            return;
          }

          // Restore all data
          const { data } = backupData;
          setDashboardData(data.dashboardData || {});
          setAppointmentsData(data.appointmentsData || []);
          setPatientsData(data.patientsData || []);
          setInventoryData(data.inventoryData || []);
          setMedicalRecordsData(data.medicalRecordsData || []);
          setFamiliesData(data.familiesData || []);
          setUnsortedMembersData(data.unsortedMembersData || []);
          setDoctorQueueData(data.doctorQueueData || []);
          setSharedCheckupsData(data.sharedCheckupsData || []);
          setSimulationModeStatus(data.simulationModeStatus || {
            enabled: false,
            currentSimulatedDate: null,
            activatedBy: null,
            activatedAt: null
          });
          setAnalyticsData(data.analyticsData || {});

          // Save restore info
          const restoreHistory = loadFromLocalStorage('restoreHistory', []);
          restoreHistory.unshift({
            id: Date.now(),
            timestamp: new Date().toISOString(),
            backupTimestamp: backupData.timestamp,
            metadata: backupData.metadata
          });
          if (restoreHistory.length > 5) {
            restoreHistory.splice(5);
          }
          saveToLocalStorage('restoreHistory', restoreHistory);

          resolve(backupData);
        } catch (error) {
          reject(new Error('Failed to parse backup file: ' + error.message));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read backup file'));
      reader.readAsText(backupFile);
    });
  };

  const getBackupHistory = () => {
    return loadFromLocalStorage('backupHistory', []);
  };

  const getRestoreHistory = () => {
    return loadFromLocalStorage('restoreHistory', []);
  };

  const deleteBackupHistory = (backupId) => {
    const history = getBackupHistory();
    const updatedHistory = history.filter(backup => backup.id !== backupId);
    saveToLocalStorage('backupHistory', updatedHistory);
  };

  // Auto backup functionality
  const enableAutoBackup = (settings = {}) => {
    const autoBackupSettings = {
      enabled: true,
      frequency: settings.frequency || 'daily', // daily, weekly, monthly
      time: settings.time || '02:00', // 24-hour format
      maxBackups: settings.maxBackups || 7,
      ...settings
    };
    
    saveToLocalStorage('autoBackupSettings', autoBackupSettings);
    
    // Schedule next auto backup
    scheduleNextAutoBackup(autoBackupSettings);
    
    return autoBackupSettings;
  };

  const disableAutoBackup = () => {
    const settings = { enabled: false };
    saveToLocalStorage('autoBackupSettings', settings);
    
    // Clear any scheduled backups
    const timeoutId = loadFromLocalStorage('autoBackupTimeoutId');
    if (timeoutId) {
      clearTimeout(timeoutId);
      localStorage.removeItem('autoBackupTimeoutId');
    }
    
    return settings;
  };

  const scheduleNextAutoBackup = (settings) => {
    if (!settings.enabled) return;

    const now = new Date();
    const nextBackup = new Date();
    
    // Calculate next backup time based on frequency
    switch (settings.frequency) {
      case 'daily':
        nextBackup.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        nextBackup.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        nextBackup.setMonth(now.getMonth() + 1);
        break;
      default:
        nextBackup.setDate(now.getDate() + 1);
    }
    
    // Set the specific time
    const [hours, minutes] = settings.time.split(':');
    nextBackup.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const timeUntilBackup = nextBackup.getTime() - now.getTime();
    
    const timeoutId = setTimeout(() => {
      createBackup();
      // Schedule the next one
      scheduleNextAutoBackup(settings);
    }, timeUntilBackup);
    
    saveToLocalStorage('autoBackupTimeoutId', timeoutId);
  };

  const getAutoBackupSettings = () => {
    return loadFromLocalStorage('autoBackupSettings', {
      enabled: false,
      frequency: 'daily',
      time: '02:00',
      maxBackups: 7
    });
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
    setDoctorQueueData([]);
    setSharedCheckupsData([]);
    setSimulationModeStatus({
      enabled: false,
      currentSimulatedDate: null,
      activatedBy: null,
      activatedAt: null
    });
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
    setAllPatients,
    
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
    setAllFamilies,
    
    // Unsorted members functions
    addUnsortedMember,
    removeUnsortedMember,
    fetchUnsortedMembers,
    fetchAllPatients,
    
    // Doctor queue functions
    doctorQueueData,
    sharedCheckupsData,
    notifyDoctor,
    updateDoctorQueueStatus,
    completeDoctorSession,
    syncCheckupStatus,
    
    // Simulation mode functions
    simulationModeStatus,
    updateSimulationMode,
    disableSimulationMode,
    
    // Analytics functions
    updateAnalyticsData,
    
    // Backup and Restore functions
    createBackup,
    restoreBackup,
    getBackupHistory,
    getRestoreHistory,
    deleteBackupHistory,
    enableAutoBackup,
    disableAutoBackup,
    getAutoBackupSettings,
    
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
