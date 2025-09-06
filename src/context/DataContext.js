import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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

  // Doctor checkups data - specific to doctor dashboard
  const [doctorCheckupsData, setDoctorCheckupsData] = useState(() => 
    loadFromLocalStorage('doctorCheckupsData', [])
  );

  // Simulation mode status - shared between admin and doctor dashboards (handled locally in components)
  // const [simulationModeStatus, setSimulationModeStatus] = useState(() => 
  //   loadFromLocalStorage('simulationModeStatus', {
  //     enabled: false,
  //     currentSimulatedDate: null,
  //     activatedBy: null,
  //     activatedAt: null
  //   })
  // );

  // Backend connection status
  const [backendConnected, setBackendConnected] = useState(false);

  // Connection check interval ref
  const connectionCheckRef = useRef(null);

  // Debounced localStorage save function
  const saveTimeouts = useRef({});
  
  const debouncedSave = useCallback((key, data, delay = 300) => {
    if (saveTimeouts.current[key]) {
      clearTimeout(saveTimeouts.current[key]);
    }
    
    saveTimeouts.current[key] = setTimeout(() => {
      saveToLocalStorage(key, data);
      delete saveTimeouts.current[key];
    }, delay);
  }, []);

  // Function to fetch unsorted members from the backend
  const fetchUnsortedMembers = async () => {
    // PREVENT LOOP: Only fetch if authenticated
    if (!window.__authToken) {
      console.log('No auth token, skipping unsorted members fetch');
      return;
    }
    
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
    // PREVENT LOOP: Only fetch if authenticated
    if (!window.__authToken) {
      console.log('No auth token, skipping patients fetch');
      return [];
    }
    
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

  // Function to fetch all families from the backend
  const fetchAllFamilies = async () => {
    // PREVENT LOOP: Only fetch if authenticated
    if (!window.__authToken) {
      console.log('No auth token, skipping families fetch');
      return [];
    }
    
    try {
      console.log('Fetching families from backend...');
      console.log('Auth token available:', !!window.__authToken);
      const families = await adminService.getAllFamilies();
      console.log('Received families from backend:', families);
      setFamiliesData(families);
      return families;
    } catch (error) {
      console.error("Failed to fetch families:", error);
      console.error("Error details:", {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });
      // Keep existing localStorage data if API fails
      return [];
    }
  };

  // Function to fetch initial data from backend
  const fetchInitialData = async () => {
    // PREVENT LOOP: Only fetch data if user is authenticated
    if (!window.__authToken) {
      console.log('No auth token found, skipping data fetch to prevent loops');
      return;
    }
    
    try {
      console.log('Fetching initial data from backend...');
      
      // Fetch patients and unsorted members in parallel
      const [patients, families, unsortedMembers] = await Promise.all([
        fetchAllPatients(),
        fetchAllFamilies(),
        adminService.getUnsortedMembers().catch(err => {
          console.error('Failed to fetch unsorted members:', err);
          return [];
        })
      ]);
      
      console.log('Initial data fetched:', { patients, families, unsortedMembers });
      setUnsortedMembersData(unsortedMembers);
      
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    }
  };

  // Fetch initial data when the component mounts - DISABLED TO PREVENT LOOPS
  // useEffect(() => {
  //   fetchInitialData();
  // }, []);

  // Listen for changes in localStorage from other tabs to sync state
  useEffect(() => {
    const handleStorageChange = (event) => {
      // NOTE: simulationModeStatus is now handled locally in DoctorLayout to prevent infinite loops
      // if (event.key === 'simulationModeStatus') {
      //   try {
      //     const newValue = JSON.parse(event.newValue);
      //     if (newValue) {
      //       setSimulationModeStatus(newValue);
      //     }
      //   } catch (error) {
      //     console.error('Error parsing simulationModeStatus from localStorage:', error);
      //   }
      // }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Auto-authenticate for testing (if no auth token exists) - DISABLED TO PREVENT LOOPS
  // useEffect(() => {
  //   const setupAuth = async () => {
  //     const authData = JSON.parse(localStorage.getItem('auth'));
  //     if (!authData || !authData.token) {
  //       try {
  //         console.log('Setting up authentication...');
  //         const response = await fetch('http://localhost:5000/api/auth/login', {
  //           method: 'POST',
  //           headers: {
  //             'Content-Type': 'application/json',
  //           },
  //           body: JSON.stringify({
  //             login: 'admin',
  //             password: 'admin123'
  //           })
  //         });
  //         
  //         if (response.ok) {
  //           const data = await response.json();
  //           localStorage.setItem('auth', JSON.stringify({
  //             token: data.token,
  //             user: data.user
  //           }));
  //           console.log('Authentication setup complete');
  //           
  //           // Refresh data after authentication
  //           setTimeout(() => {
  //             fetchInitialData();
  //           }, 1000);
  //         }
  //       } catch (error) {
  //         console.error('Authentication setup failed:', error);
  //       }
  //     }
  //   };
  //   
  //   setupAuth();
  // }, []);

  // Analytics/Reports data
  const [analyticsData, setAnalyticsData] = useState(() => 
    loadFromLocalStorage('analyticsData', {})
  );

  // Auto-save to localStorage whenever data changes (debounced for performance)
  useEffect(() => {
    debouncedSave('dashboardData', dashboardData);
  }, [dashboardData, debouncedSave]);

  useEffect(() => {
    debouncedSave('appointmentsData', appointmentsData);
  }, [appointmentsData, debouncedSave]);

  useEffect(() => {
    debouncedSave('patientsData', patientsData);
  }, [patientsData, debouncedSave]);

  useEffect(() => {
    debouncedSave('inventoryData', inventoryData);
  }, [inventoryData, debouncedSave]);

  useEffect(() => {
    debouncedSave('medicalRecordsData', medicalRecordsData);
  }, [medicalRecordsData, debouncedSave]);

  useEffect(() => {
    debouncedSave('familiesData', familiesData);
  }, [familiesData, debouncedSave]);

  useEffect(() => {
    debouncedSave('unsortedMembersData', unsortedMembersData);
  }, [unsortedMembersData, debouncedSave]);

  useEffect(() => {
    debouncedSave('doctorQueueData', doctorQueueData);
  }, [doctorQueueData, debouncedSave]);

  useEffect(() => {
    debouncedSave('sharedCheckupsData', sharedCheckupsData);
  }, [sharedCheckupsData, debouncedSave]);

  useEffect(() => {
    debouncedSave('doctorCheckupsData', doctorCheckupsData);
  }, [doctorCheckupsData, debouncedSave]);

  // NOTE: simulationModeStatus is now handled locally in DoctorLayout to prevent infinite loops
  // useEffect(() => {
  //   debouncedSave('simulationModeStatus', simulationModeStatus);
  // }, [simulationModeStatus, debouncedSave]);

  useEffect(() => {
    debouncedSave('analyticsData', analyticsData);
  }, [analyticsData, debouncedSave]);

  // Cleanup function to clear any pending timeouts
  useEffect(() => {
    return () => {
      Object.values(saveTimeouts.current).forEach(timeoutId => {
        if (timeoutId) clearTimeout(timeoutId);
      });
      saveTimeouts.current = {};
    };
  }, []);

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

  // Real-time synchronization functions for optimized queue management
  const refreshDoctorQueue = useCallback(async () => {
    console.log('DataContext: refreshDoctorQueue called');
    if (!window.__authToken) {
      console.log('DataContext: No auth token, skipping doctor queue refresh');
      return;
    }

    try {
      console.log('DataContext: Making API call to /api/doctor/queue');
      const response = await fetch('/api/doctor/queue', {
        headers: {
          'Authorization': `Bearer ${window.__authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const queueData = await response.json();
        console.log('DataContext: Received queue data:', queueData);
        setDoctorQueueData(queueData);
      } else {
        console.warn('DataContext: Failed to refresh doctor queue:', response.status);
      }
    } catch (error) {
      console.error('DataContext: Error refreshing doctor queue:', error);
    }
  }, []);

  const refreshTodaysCheckups = useCallback(async () => {
    if (!window.__authToken) {
      console.log('No auth token, skipping checkups refresh');
      return;
    }

    try {
      const response = await fetch('/api/checkups/today', {
        headers: {
          'Authorization': `Bearer ${window.__authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const checkupsData = await response.json();
        setSharedCheckupsData(checkupsData);
      } else {
        console.warn('Failed to refresh today\'s checkups:', response.status);
      }
    } catch (error) {
      console.error('Error refreshing today\'s checkups:', error);
    }
  }, []);

  // Doctor checkups management functions
  const refreshDoctorCheckups = useCallback(async () => {
    console.log('DataContext: refreshDoctorCheckups called');
    if (!window.__authToken) {
      console.log('DataContext: No auth token, skipping doctor checkups refresh');
      return;
    }

    try {
      console.log('DataContext: Making API call to /api/doctor/checkups');
      const response = await fetch('/api/doctor/checkups', {
        headers: {
          'Authorization': `Bearer ${window.__authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const checkupsData = await response.json();
        console.log('DataContext: Received doctor checkups data:', checkupsData);
        setDoctorCheckupsData(checkupsData);
      } else {
        console.warn('DataContext: Failed to refresh doctor checkups:', response.status);
      }
    } catch (error) {
      console.error('DataContext: Error refreshing doctor checkups:', error);
    }
  }, []);

  const updateCheckupStatus = useCallback(async (checkupId, status, additionalData = {}) => {
    console.log('DataContext: updateCheckupStatus called', { checkupId, status, additionalData });
    
    try {
      // Update local state first for immediate UI feedback
      setDoctorCheckupsData(prev => 
        prev.map(checkup => 
          checkup.id === checkupId 
            ? { ...checkup, status, ...additionalData }
            : checkup
        )
      );

      // Then sync with backend
      const response = await fetch(`/api/checkups/${checkupId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${window.__authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, ...additionalData })
      });

      if (response.ok) {
        const updatedCheckup = await response.json();
        console.log('DataContext: Checkup status updated successfully:', updatedCheckup);
        
        // Update with server response
        setDoctorCheckupsData(prev => 
          prev.map(checkup => 
            checkup.id === checkupId 
              ? updatedCheckup
              : checkup
          )
        );
        
        return { success: true, data: updatedCheckup };
      } else {
        console.warn('DataContext: Failed to update checkup status:', response.status);
        // Revert local state on failure
        await refreshDoctorCheckups();
        return { success: false, error: 'Failed to update checkup status' };
      }
    } catch (error) {
      console.error('DataContext: Error updating checkup status:', error);
      // Revert local state on error
      await refreshDoctorCheckups();
      return { success: false, error: error.message };
    }
  }, [refreshDoctorCheckups]);

  const startCheckupSession = useCallback(async (patientData) => {
    console.log('DataContext: startCheckupSession called', patientData);
    
    try {
      const checkupData = {
        patientId: patientData.patientId,
        patientName: patientData.patientName,
        age: patientData.age,
        gender: patientData.gender,
        contactNumber: patientData.contactNumber,
        serviceType: patientData.serviceType,
        priority: patientData.priority,
        status: 'started',
        startedAt: new Date().toISOString(),
        notes: patientData.notes || ''
      };

      console.log('DataContext: Creating checkup with data:', checkupData);

      // Add to local state immediately for optimistic UI
      const newCheckup = {
        ...checkupData,
        id: Date.now(), // Temporary ID
      };
      
      console.log('DataContext: Adding checkup to local state:', newCheckup);
      setDoctorCheckupsData(prev => {
        const updated = [...prev, newCheckup];
        console.log('DataContext: Updated doctorCheckupsData:', updated);
        return updated;
      });

      // Also update shared checkups data for analytics
      setSharedCheckupsData(prev => {
        const updated = [...prev, newCheckup];
        console.log('DataContext: Updated sharedCheckupsData for analytics:', updated);
        return updated;
      });

      // Sync with backend
      const response = await fetch('/api/checkups', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${window.__authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(checkupData)
      });

      if (response.ok) {
        const createdCheckup = await response.json();
        console.log('DataContext: Checkup session created successfully:', createdCheckup);
        
        // Update with server response (replace temporary ID)
        setDoctorCheckupsData(prev => {
          const updated = prev.map(checkup => 
            checkup.id === newCheckup.id 
              ? createdCheckup
              : checkup
          );
          console.log('DataContext: Updated with server response:', updated);
          return updated;
        });

        // Also update shared checkups data
        setSharedCheckupsData(prev => {
          const updated = prev.map(checkup => 
            checkup.id === newCheckup.id 
              ? createdCheckup
              : checkup
          );
          console.log('DataContext: Updated sharedCheckupsData with server response:', updated);
          return updated;
        });
        
        return { success: true, data: createdCheckup };
      } else {
        console.warn('DataContext: Failed to create checkup session:', response.status);
        // Remove from local state on failure
        setDoctorCheckupsData(prev => 
          prev.filter(checkup => checkup.id !== newCheckup.id)
        );
        return { success: false, error: 'Failed to create checkup session' };
      }
    } catch (error) {
      console.error('DataContext: Error creating checkup session:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Update checkup notes and prescriptions
  const updateCheckupNotes = useCallback(async (checkupId, notes, prescriptions = []) => {
    console.log('DataContext: updateCheckupNotes called', { checkupId, notes, prescriptions });
    
    try {
      // Update local state first for immediate UI feedback
      setDoctorCheckupsData(prev => 
        prev.map(checkup => 
          checkup.id === checkupId 
            ? { ...checkup, notes, prescriptions }
            : checkup
        )
      );

      // Then sync with backend
      const response = await fetch(`/api/checkups/${checkupId}/notes`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${window.__authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes, prescriptions })
      });

      if (response.ok) {
        const updatedCheckup = await response.json();
        console.log('DataContext: Checkup notes updated successfully:', updatedCheckup);
        
        // Update with server response
        setDoctorCheckupsData(prev => 
          prev.map(checkup => 
            checkup.id === checkupId 
              ? updatedCheckup
              : checkup
          )
        );
        
        return { success: true, data: updatedCheckup };
      } else {
        console.warn('DataContext: Failed to update checkup notes:', response.status);
        // Revert local state on failure
        await refreshDoctorCheckups();
        return { success: false, error: 'Failed to update checkup notes' };
      }
    } catch (error) {
      console.error('DataContext: Error updating checkup notes:', error);
      // Revert local state on error
      await refreshDoctorCheckups();
      return { success: false, error: error.message };
    }
  }, [refreshDoctorCheckups]);

  // Get patient checkup history
  const getPatientCheckupHistory = useCallback(async (patientId) => {
    console.log('DataContext: getPatientCheckupHistory called', patientId);
    
    try {
      const response = await fetch(`/api/checkups/history/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${window.__authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const history = await response.json();
        console.log('DataContext: Patient checkup history retrieved:', history);
        return { success: true, data: history };
      } else {
        console.warn('DataContext: Failed to get patient checkup history:', response.status);
        return { success: false, error: 'Failed to get patient checkup history' };
      }
    } catch (error) {
      console.error('DataContext: Error getting patient checkup history:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Optimized function to add patient to queue with backend sync
  const addToQueue = useCallback(async (patient) => {
    try {
      // First update local state for immediate UI feedback
      const queueItem = {
        id: patient.id,
        patientId: patient.patientId,
        patientName: patient.patientName,
        age: patient.age,
        gender: patient.gender,
        contactNumber: patient.contactNumber,
        checkInTime: patient.checkInTime,
        queuedAt: new Date().toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }),
        serviceType: patient.serviceType,
        status: 'waiting',
        priority: patient.priority,
        vitalSigns: patient.vitalSigns,
        notes: patient.notes || '',
        source: 'admin_checkup'
      };

      // Update local queue state immediately
      setDoctorQueueData(prev => {
        // Check if already exists to prevent duplicates
        const exists = prev.some(item => item.id === patient.id);
        if (exists) {
          return prev.map(item => item.id === patient.id ? queueItem : item);
        }
        return [...prev, queueItem];
      });

      // Sync with backend
      await fetch(`/api/checkups/${patient.id}/notify-doctor`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${window.__authToken}`,
          'Content-Type': 'application/json'
        }
      });

      // Update checkups status
      syncCheckupStatus(patient.id, 'doctor-notified', 'admin');

      return { success: true, message: 'Patient added to queue successfully' };
    } catch (error) {
      console.error('Error adding to queue:', error);
      return { success: false, message: 'Failed to add patient to queue' };
    }
  }, [syncCheckupStatus]);

  // Optimized function to update queue status with backend sync
  const updateQueueStatus = useCallback(async (sessionId, status, additionalData = {}) => {
    try {
      // Update local state immediately for responsive UI
      setDoctorQueueData(prev => 
        prev.map(item => 
          item.id === sessionId 
            ? { 
                ...item, 
                status, 
                ...additionalData, 
                updatedAt: new Date().toISOString() 
              }
            : item
        )
      );

      // Sync with backend
      await fetch(`/api/doctor/queue/${sessionId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${window.__authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, ...additionalData })
      });

      // Update shared checkups
      syncCheckupStatus(sessionId, status, 'doctor');

      return { success: true };
    } catch (error) {
      console.error('Error updating queue status:', error);
      return { success: false, error: error.message };
    }
  }, [syncCheckupStatus]);

  // Auto-refresh mechanism for real-time updates
  useEffect(() => {
    if (!window.__authToken) return;

    const refreshInterval = setInterval(() => {
      // Only refresh if user is active (to save resources)
      if (document.visibilityState === 'visible') {
        refreshDoctorQueue();
        refreshTodaysCheckups();
      }
    }, 30000); // Refresh every 30 seconds

    // Also refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshDoctorQueue();
        refreshTodaysCheckups();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshDoctorQueue, refreshTodaysCheckups]);

  // Simulation mode management functions (commented out - handled locally in DoctorLayout)
  // const updateSimulationMode = (simulationData, userId = 'admin') => {
  //   setSimulationModeStatus({
  //     enabled: simulationData.enabled,
  //     currentSimulatedDate: simulationData.currentSimulatedDate,
  //     activatedBy: userId,
  //     activatedAt: simulationData.enabled ? new Date().toISOString() : null,
  //     smsSimulation: simulationData.smsSimulation,
  //     emailSimulation: simulationData.emailSimulation,
  //     dataSimulation: simulationData.dataSimulation
  //   });
  // };

  // const disableSimulationMode = () => {
  //   setSimulationModeStatus({
  //     enabled: false,
  //     currentSimulatedDate: null,
  //     activatedBy: null,
  //     activatedAt: null,
  //     smsSimulation: false,
  //     emailSimulation: false,
  //     dataSimulation: false
  //   });
  // };

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
        // simulationModeStatus, // Handled locally in DoctorLayout
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
          // simulationModeStatus, // Handled locally in DoctorLayout
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
          // setSimulationModeStatus(data.simulationModeStatus || {
          //   enabled: false,
          //   currentSimulatedDate: null,
          //   activatedBy: null,
          //   activatedAt: null
          // }); // Handled locally in DoctorLayout
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
    // setSimulationModeStatus({
    //   enabled: false,
    //   currentSimulatedDate: null,
    //   activatedBy: null,
    //   activatedAt: null
    // }); // Handled locally in DoctorLayout
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

  // Force refresh all data from backend (clears cache and fetches fresh)
  const forceRefreshAllData = async () => {
    try {
      console.log('🔄 Force refreshing all data from backend...');
      
      // Clear localStorage cache first
      localStorage.removeItem('dashboardData');
      localStorage.removeItem('appointmentsData');
      localStorage.removeItem('patientsData');
      localStorage.removeItem('inventoryData');
      localStorage.removeItem('medicalRecordsData');
      localStorage.removeItem('familiesData');
      localStorage.removeItem('unsortedMembersData');
      localStorage.removeItem('analyticsData');
      
      // Reset state to empty arrays/objects
      setDashboardData({});
      setAppointmentsData([]);
      setPatientsData([]);
      setInventoryData([]);
      setMedicalRecordsData([]);
      setFamiliesData([]);
      setUnsortedMembersData([]);
      setAnalyticsData({});
      
      // Fetch fresh data from backend
      console.log('📡 Fetching fresh data from backend...');
      
      // Check user role to determine what data to fetch
      const currentUser = window.__authUser;
      console.log('Current user role:', currentUser?.role);
      
      if (currentUser?.role === 'admin') {
        // Admin gets all data including unsorted members
        await Promise.all([
          fetchAllPatients(),
          fetchAllFamilies(),
          fetchUnsortedMembers()
        ]);
      } else {
        // Doctor/Patient gets only patients and families data
        await Promise.all([
          fetchAllPatients(),
          fetchAllFamilies()
        ]);
        console.log('Skipping unsorted members fetch for non-admin user');
      }
      
      // Also refresh analytics data to ensure dashboard updates
      setAnalyticsData({});
      
      console.log('✅ All data refreshed successfully!');
      return true;
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
      return false;
    }
  };

  // Backend connection checking function
  const checkBackendConnection = useCallback(async () => {
    try {
      const response = await fetch('/api/health', { 
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (response.ok) {
        setBackendConnected(true);
        return true;
      } else {
        setBackendConnected(false);
        return false;
      }
    } catch (error) {
      setBackendConnected(false);
      return false;
    }
  }, []);

  // Initialize backend connection check on mount - DISABLED FOR QUICK WORKAROUND
  useEffect(() => {
    // Initial connection check only
    checkBackendConnection();

    // DISABLED: Set up periodic connection checks (causes performance issues)
    // connectionCheckRef.current = setInterval(checkBackendConnection, 30000);

    // Cleanup on unmount
    return () => {
      if (connectionCheckRef.current) {
        clearInterval(connectionCheckRef.current);
      }
    };
  }, [checkBackendConnection]);

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
    backendConnected,
    
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
    fetchAllFamilies,
    
    // Doctor queue functions
    doctorQueueData,
    sharedCheckupsData,
    doctorCheckupsData,
    notifyDoctor,
    updateDoctorQueueStatus,
    completeDoctorSession,
    syncCheckupStatus,
    
    // Doctor checkups functions
    refreshDoctorCheckups,
    updateCheckupStatus,
    startCheckupSession,
    updateCheckupNotes,
    getPatientCheckupHistory,
    
    // Real-time synchronization functions
    refreshDoctorQueue,
    refreshTodaysCheckups,
    addToQueue,
    updateQueueStatus,
    
    // Simulation mode functions (commented out - handled locally in DoctorLayout)
    // simulationModeStatus,
    // updateSimulationMode,
    // disableSimulationMode,
    
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
    forceRefreshAllData,
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
