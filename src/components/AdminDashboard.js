import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Modal, Button, Form, InputGroup, Row, Col, Table, Card, Tabs, Tab, Accordion } from 'react-bootstrap';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, ArcElement } from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { QRCodeCanvas as QRCode } from 'qrcode.react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/AdminDashboard.css';
// Import icons from bootstrap-icons
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import adminService from '../services/adminService';
import userService from '../services/userService';
import ReferralForm from './ReferralForm';
import NotificationManager from './NotificationManager';
import SMSNotificationModal from './SMSNotificationModal';
import PatientActionsSection from './PatientActionsSection';
import PatientInfoCards from './PatientInfoCards';
import BackupSettingsForm from './BackupSettingsForm';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    unsortedMembersData,
    fetchUnsortedMembers,
    simulationModeStatus,
    updateSimulationMode,
    disableSimulationMode,
    patientsData,
    familiesData,
    appointmentsData,
    sharedCheckupsData,
    createBackup,
    restoreBackup,
    getBackupHistory,
    getRestoreHistory,
    deleteBackupHistory,
    enableAutoBackup,
    disableAutoBackup,
    getAutoBackupSettings
  } = useData();
  
  // User Management states - Move these BEFORE useEffect to avoid initialization errors
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showAccessRightsModal, setShowAccessRightsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showUserManageDropdown, setShowUserManageDropdown] = useState(false);
  const [showUserTypeSelection, setShowUserTypeSelection] = useState(true);
  const [selectedUserType, setSelectedUserType] = useState('');
  const [userFormData, setUserFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    emailInitials: '',
    contactNumber: '',
    password: '',
    confirmPassword: '',
    role: 'aide',
    position: 'Aide',
    userType: '', // admin or doctor access level
    accessLevel: '' // new field for access level selection
  });
  
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Remove temporary authentication for testing
  // useEffect(() => {
  //   // Check if user is authenticated, if not set a temporary auth token
  //   const authData = JSON.parse(localStorage.getItem('auth'));
  //   if (!authData || !authData.token) {
  //     // Set temporary auth data for testing
  //     const tempAuthData = {
  //       token: 'temp-admin-token',
  //       user: {
  //         id: 1,
  //         firstName: 'Admin',
  //         lastName: 'User',
  //         email: 'admin@maybunga.health',
  //         role: 'Admin'
  //       }
  //     };
  //     localStorage.setItem('auth', JSON.stringify(tempAuthData));
  //     console.log('Temporary authentication set for testing');
  //   }
  // }, []);

  // Add browser navigation control
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Check if there's unsaved form data
      if (userFormData.firstName || userFormData.lastName || userFormData.emailInitials) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    const handlePopState = (e) => {
      // Check if there's unsaved form data
      if (userFormData.firstName || userFormData.lastName || userFormData.emailInitials) {
        const confirmLeave = window.confirm('You have unsaved changes. Are you sure you want to leave?');
        if (!confirmLeave) {
          e.preventDefault();
          window.history.pushState(null, '', window.location.href);
        }
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    
    // Push current state to prevent immediate back navigation
    window.history.pushState(null, '', window.location.href);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [userFormData]);
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [activeSubDropdown, setActiveSubDropdown] = useState(null);
  const [currentPath, setCurrentPath] = useState('Dashboard');
  
  // Appointment management states
  const [appointmentTabKey, setAppointmentTabKey] = useState('all-appointments');
  const [appointmentSearchTerm, setAppointmentSearchTerm] = useState('');
  const [quickSchedulePatientSearch, setQuickSchedulePatientSearch] = useState('');
  const [isPatientSelected, setIsPatientSelected] = useState(false);
  const [showQuickScheduleModal, setShowQuickScheduleModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const patientSearchRef = useRef(null);
  const [appointmentFormData, setAppointmentFormData] = useState({
    patientId: '',
    date: '',
    time: '',
    type: '',
    doctor: '',
    duration: 30,
    notes: ''
  });
  
  const [showVitalSignsModal, setShowVitalSignsModal] = useState(false);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);


  const [patientFormData, setPatientFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    dateOfBirth: new Date(),
    age: '',
    gender: '',
    civilStatus: '',
    contactNumber: '',
    email: '',
    houseNo: '',
    street: '',
    barangay: '',
    city: 'Pasig City',
    region: 'Metro Manila',
    postalCode: '1600',
    philHealthNumber: '',
    medicalConditions: '',
    familyId: ''
  });
  const [familyFormData, setFamilyFormData] = useState({
    familyName: '',
    surname: '',
    headOfFamily: '',
    contactNumber: '',
    notes: ''
  });
  const [showPatientDetailsModal, setShowPatientDetailsModal] = useState(false);
  const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [showTreatmentRecordModal, setShowTreatmentRecordModal] = useState(false);
  const [showVitalSignsHistoryModal, setShowVitalSignsHistoryModal] = useState(false);
  const [showCheckupHistoryModal, setShowCheckupHistoryModal] = useState(false);
  const [showImmunizationHistoryModal, setShowImmunizationHistoryModal] = useState(false);
  const [showReferralFormModal, setShowReferralFormModal] = useState(false);
  const [showNotificationManagerModal, setShowNotificationManagerModal] = useState(false);
  const [showSMSNotificationModal, setShowSMSNotificationModal] = useState(false);
  const [previousModalState, setPreviousModalState] = useState(null); // Track which modal was open before
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  // Report generation options state
  const [reportOptions, setReportOptions] = useState({
    dateRange: 'last30days',
    format: 'pdf',
    quality: 'standard',
    includeCharts: {
      demographics: true,
      trends: true,
      appointments: true,
      medications: false,
      financial: false,
      performance: false
    }
  });

  // Backup and Restore state
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showBackupSettingsModal, setShowBackupSettingsModal] = useState(false);
  const [backupHistory, setBackupHistory] = useState([]);
  const [restoreHistory, setRestoreHistory] = useState([]);
  const [autoBackupSettings, setAutoBackupSettings] = useState({});
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(new Date());
  const [tabKey, setTabKey] = useState('families');
  const [dashboardTabKey, setDashboardTabKey] = useState('analytics');
  const [inventoryTabKey, setInventoryTabKey] = useState('vaccines');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Simulation mode states
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [simulationMode, setSimulationMode] = useState({
    enabled: false,
    currentSimulatedDate: new Date(),
    smsSimulation: true,
    emailSimulation: true,
    dataSimulation: false
  });
  
  // Users data and loading state
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userError, setUserError] = useState(null);
  const [backendConnected, setBackendConnected] = useState(false);
  
  // Unit conversion preferences
  const [weightUnit, setWeightUnit] = useState('kg'); // 'kg' or 'lbs'
  const [heightUnit, setHeightUnit] = useState('cm'); // 'cm' or 'ft'
  
  // Manage dropdown and confirmation states
  const [showManageDropdown, setShowManageDropdown] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSecondConfirmModal, setShowSecondConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [secondCountdown, setSecondCountdown] = useState(0);

  // Today's checkups state - for auto login feature with persistence
  const [todaysCheckups, setTodaysCheckups] = useState(() => {
    // Load from localStorage on initialization
    const saved = localStorage.getItem('todaysCheckups');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Check if the saved data is from today
        const today = new Date().toDateString();
        const savedDate = localStorage.getItem('todaysCheckupsDate');
        
        if (savedDate === today) {
          return parsed;
        } else {
          // Clear old data if it's from a different day
          localStorage.removeItem('todaysCheckups');
          localStorage.removeItem('todaysCheckupsDate');
        }
      } catch (error) {
        console.error('Error parsing saved checkups:', error);
        localStorage.removeItem('todaysCheckups');
        localStorage.removeItem('todaysCheckupsDate');
      }
    }
    return [];
  });

  // Calculate real dashboard statistics
  const dashboardStats = useMemo(() => {
    const pendingAppointments = appointmentsData.filter(apt => 
      apt.status === 'Scheduled' || apt.status === 'Pending'
    ).length;
    
    return {
      totalPatients: patientsData.length + unsortedMembersData.length,
      activeCheckups: todaysCheckups.filter(checkup => 
        checkup.status === 'In Progress' || checkup.status === 'Waiting'
      ).length,
      pendingAppointments
    };
  }, [appointmentsData, patientsData, unsortedMembersData, todaysCheckups]);

  // Recent Activity Tracking System
  const [recentActivities, setRecentActivities] = useState(() => {
    const saved = localStorage.getItem('adminRecentActivities');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Error parsing saved activities:', error);
        return [];
      }
    }
    return [];
  });

  // Function to add new activity
  const addActivity = useCallback((action, details, type = 'info') => {
    const newActivity = {
      id: Date.now(),
      action,
      details,
      type, // 'info', 'success', 'warning', 'danger'
      timestamp: new Date().toISOString(),
      user: user?.username || 'Admin'
    };

    setRecentActivities(prev => {
      const updated = [newActivity, ...prev].slice(0, 50); // Keep only last 50 activities
      localStorage.setItem('adminRecentActivities', JSON.stringify(updated));
      return updated;
    });
  }, [user]);

  // Service availability state for Today's Checkup
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [serviceLoading, setServiceLoading] = useState(false);

  // Remove mode state
  const [removeMode, setRemoveMode] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  // Vital Signs form state
  const [vitalSignsFormData, setVitalSignsFormData] = useState({
    temperature: '',
    heartRate: '',
    systolicBP: '',
    diastolicBP: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    weight: '',
    height: '',
    clinicalNotes: ''
  });

  // Vital signs history state
  const [vitalSignsHistory, setVitalSignsHistory] = useState([]);
  const [loadingVitalHistory, setLoadingVitalHistory] = useState(false);

  // Vital signs edit mode state
  const [isVitalSignsEditMode, setIsVitalSignsEditMode] = useState(false);

  // Unsorted members states
  const [autosortResults, setAutosortResults] = useState(null);
  const [showAutosortModal, setShowAutosortModal] = useState(false);
  const [isLoadingAutosort, setIsLoadingAutosort] = useState(false);
  const [families, setFamilies] = useState([]);
  const [patients, setPatients] = useState([]);
  const [familySortConfig, setFamilySortConfig] = useState({ key: 'familyName', direction: 'ascending' });
  const [memberSortConfig, setMemberSortConfig] = useState({ key: 'id', direction: 'ascending' });

  // Assign to Family modal states
  const [showAssignFamilyModal, setShowAssignFamilyModal] = useState(false);
  const [selectedPatientForAssignment, setSelectedPatientForAssignment] = useState(null);
  const [selectedFamilyForAssignment, setSelectedFamilyForAssignment] = useState('');
  const [showCreateFamilyInAssign, setShowCreateFamilyInAssign] = useState(false);
  const [assignFamilyFormData, setAssignFamilyFormData] = useState({
    familyName: '',
    surname: '',
    headOfFamily: '',
    contactNumber: '',
    notes: ''
  });

  // Calendar states
  const [currentDate, setCurrentDate] = useState(new Date());

  // Appointments state - for persistence across browser refreshes
  const [appointments, setAppointments] = useState(() => {
    // Load from localStorage on initialization
    const saved = localStorage.getItem('appointments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed;
      } catch (error) {
        console.error('Error parsing saved appointments:', error);
        localStorage.removeItem('appointments');
      }
    }
    return [];
  });

  // Helper functions - defined early to avoid hoisting issues
  
  // Service availability functions
  const fetchAvailableServices = useCallback(async () => {
    setServiceLoading(true);
    try {
      // Use simulated date/time if simulation is enabled, otherwise use real current time
      const currentDate = simulationMode.enabled ? new Date(simulationMode.currentSimulatedDate) : new Date();
      const currentTime = currentDate.toTimeString().slice(0, 5); // HH:MM format
      const currentDay = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
      
      // All services available every day and time for testing
      const allServices = [
        { id: 1, name: 'General Checkup', available: true, timeSlots: ['00:00-23:59'] },
        { id: 2, name: 'Blood Pressure Monitoring', available: true, timeSlots: ['00:00-23:59'] },
        { id: 3, name: 'Diabetes Consultation', available: true, timeSlots: ['00:00-23:59'] },
        { id: 4, name: 'Prenatal Care', available: true, timeSlots: ['00:00-23:59'] },
        { id: 5, name: 'Immunization', available: true, timeSlots: ['00:00-23:59'] },
        { id: 6, name: 'Family Planning', available: true, timeSlots: ['00:00-23:59'] },
        { id: 7, name: 'Dental Consultation', available: true, timeSlots: ['00:00-23:59'] },
        { id: 8, name: 'Mental Health Consultation', available: true, timeSlots: ['00:00-23:59'] }
      ];
      
      // All services are always available for testing
      setAvailableServices(allServices);
    } catch (error) {
      console.error('Error fetching available services:', error);
      setAvailableServices([]);
    } finally {
      setServiceLoading(false);
    }
  }, [simulationMode]);

  // Helper function to get current effective date (simulated or real)
  const getCurrentEffectiveDate = useCallback(() => {
    return simulationMode.enabled ? new Date(simulationMode.currentSimulatedDate) : new Date();
  }, [simulationMode]);

  const getCurrentEffectiveDateString = useCallback(() => {
    return getCurrentEffectiveDate().toDateString();
  }, [getCurrentEffectiveDate]);

  // Initialize available services on component mount
  useEffect(() => {
    fetchAvailableServices();
    // Refresh services every 30 minutes
    const interval = setInterval(fetchAvailableServices, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAvailableServices]);

  // Handle Today's Checkups based on simulated vs real date
  useEffect(() => {
    const currentDateString = getCurrentEffectiveDateString();
    const savedDate = localStorage.getItem('todaysCheckupsDate');
    
    if (savedDate !== currentDateString) {
      // Date has changed (either real date change or simulation date change)
      // Clear checkups if they're from a different day
      if (savedDate && savedDate !== currentDateString) {
        setTodaysCheckups([]);
        localStorage.removeItem('todaysCheckups');
        localStorage.setItem('todaysCheckupsDate', currentDateString);
      }
    }
  }, [simulationMode, getCurrentEffectiveDateString]);

  const getFamilyMembers = (familyId) => {
    if (!patients || !Array.isArray(patients)) return [];
    return patients.filter(patient => patient.familyId === familyId);
  };

  const getFamilyHead = (family) => {
    return family.headOfFamily || family.contactPerson || 'N/A';
  };

  const getFamilyMemberCount = (family) => {
    if (family.memberCount) return family.memberCount;
    // Calculate from actual members if not provided
    const members = getFamilyMembers(family.id);
    return members ? members.length : 0;
  };

  const requestSort = (key, config, setConfig) => {
    let direction = 'ascending';
    if (config.key === key && config.direction === 'ascending') {
      direction = 'descending';
    }
    setConfig({ key, direction });
  };

  const sortedFamilies = useMemo(() => {
    let sortableItems = [...families];
    if (familySortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[familySortConfig.key];
        let bValue = b[familySortConfig.key];
        
        // Handle special sorting cases
        if (familySortConfig.key === 'memberCount') {
          aValue = getFamilyMemberCount(a);
          bValue = getFamilyMemberCount(b);
        } else if (familySortConfig.key === 'createdAt') {
          aValue = a.createdAt || a.registrationDate || '';
          bValue = b.createdAt || b.registrationDate || '';
        }
        
        if (aValue < bValue) {
          return familySortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return familySortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [families, familySortConfig]);

  const filteredPatients = () => {
    if (!searchTerm) return patients;
    const term = searchTerm.toLowerCase();
    return patients.filter(patient => {
      const fullName = getPatientFullName(patient).toLowerCase();
      const familyId = patient.familyId ? patient.familyId.toString().toLowerCase() : '';
      const contact = getPatientContact(patient);
      
      return fullName.includes(term) || 
             familyId.includes(term) ||
             contact.includes(term);
    });
  };

  const sortedPatients = useMemo(() => {
    let sortableItems = [...filteredPatients()];
    if (memberSortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[memberSortConfig.key];
        let bValue = b[memberSortConfig.key];
        
        // Handle special sorting cases
        if (memberSortConfig.key === 'lastCheckup') {
          aValue = a.lastCheckup || a.createdAt || '';
          bValue = b.lastCheckup || b.createdAt || '';
        } else if (memberSortConfig.key === 'familyId') {
          aValue = a.familyId || 'zzz'; // Sort unassigned to the end
          bValue = b.familyId || 'zzz';
        }
        
        if (aValue < bValue) {
          return memberSortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return memberSortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [patients, memberSortConfig, searchTerm]);
  
  // Fetch patients and families data
  const fetchPatientsAndFamilies = async () => {
    try {
      const [patientsData, familiesData] = await Promise.all([
        adminService.getAllPatients(),
        adminService.getAllFamilies()
      ]);
      setPatients(patientsData || []);
      setFamilies(familiesData || []);
    } catch (error) {
      console.error('Error fetching patients and families:', error);
      // Keep empty arrays on error
      setPatients([]);
      setFamilies([]);
    }
  };

  useEffect(() => {
    fetchPatientsAndFamilies();
  }, []);

  // Helper functions for patient data
  const getPatientFullName = (patient) => {
    if (!patient) return 'N/A'; // Handle null/undefined patient
    if (patient.name) return patient.name; // Fallback for old data structure
    return `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
  };

  const getPatientContact = (patient) => {
    if (!patient) return 'N/A'; // Handle null/undefined patient
    return patient.contactNumber || patient.contact || 'N/A';
  };

  const getPatientAge = (patient) => {
    if (!patient) return 'N/A'; // Handle null/undefined patient
    if (patient.age) return patient.age; // Fallback for old data structure
    if (patient.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(patient.dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    }
    return 'N/A';
  };

  // Helper functions for family data
  const getFamilyContact = (family) => {
    return family.contactNumber || family.contact || 'N/A';
  };

  // Helper functions for patient login and QR code
  const generatePatientLoginInitials = (patient) => {
    if (!patient) return 'N/A';
    
    const firstName = patient.firstName || '';
    const lastName = patient.lastName || '';
    const patientId = patient.id || '';
    
    // Generate initials: FirstInitial + LastInitial + PatientID
    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();
    const paddedId = String(patientId).padStart(4, '0');
    
    return `${firstInitial}${lastInitial}${paddedId}`;
  };

  const generateQRCodeData = (patient) => {
    if (!patient) return '';
    
    const loginInitials = generatePatientLoginInitials(patient);
    const patientId = `PT-${String(patient.id).padStart(4, '0')}`;
    const fullName = getPatientFullName(patient);
    const dateOfBirth = patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '';
    
    // QR Code data format for healthcare center login
    return JSON.stringify({
      type: 'PATIENT_LOGIN',
      loginInitials: loginInitials,
      patientId: patientId,
      name: fullName,
      dateOfBirth: dateOfBirth,
      generatedAt: new Date().toISOString(),
      healthCenter: 'Maybunga Health Center'
    });
  };

  const handlePrintQRCode = () => {
    if (!selectedPatient) return;
    
    const printWindow = window.open('', '_blank');
    const qrData = generateQRCodeData(selectedPatient);
    const loginInitials = generatePatientLoginInitials(selectedPatient);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Patient QR Code - ${getPatientFullName(selectedPatient)}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              margin: 20px;
              background: white;
            }
            .qr-container {
              margin: 20px 0;
              padding: 20px;
              border: 2px solid #333;
              display: inline-block;
            }
            .patient-info {
              margin: 15px 0;
              font-size: 14px;
            }
            .login-initials {
              font-size: 18px;
              font-weight: bold;
              background: #f0f0f0;
              padding: 10px;
              margin: 10px 0;
              border-radius: 5px;
            }
            .instructions {
              font-size: 12px;
              margin-top: 20px;
              color: #666;
              max-width: 400px;
              margin-left: auto;
              margin-right: auto;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h2>Maybunga Health Center</h2>
          <h3>Patient Login QR Code</h3>
          
          <div class="qr-container">
            <div id="qr-code"></div>
          </div>
          
          <div class="patient-info">
            <strong>Patient:</strong> ${getPatientFullName(selectedPatient)}<br>
            <strong>Patient ID:</strong> PT-${String(selectedPatient.id).padStart(4, '0')}<br>
            <strong>Date of Birth:</strong> ${selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : 'N/A'}
          </div>
          
          <div class="login-initials">
            Login Initials: ${loginInitials}
          </div>
          
          <div class="instructions">
            <strong>Instructions:</strong><br>
            1. Present this QR code at the healthcare center for quick check-in<br>
            2. Alternatively, use the login initials: <strong>${loginInitials}</strong><br>
            3. This QR code is for healthcare center use only<br>
            4. Keep this code secure and do not share with unauthorized persons
          </div>
          
          <script src="https://unpkg.com/qrcode@1.5.3/build/qrcode.min.js"></script>
          <script>
            QRCode.toCanvas(document.getElementById('qr-code'), '${qrData}', {
              width: 200,
              margin: 2,
              color: {
                dark: '#000000',
                light: '#FFFFFF'
              }
            }, function(error) {
              if (error) console.error(error);
              else window.print();
            });
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  const handleDownloadQRCode = () => {
    if (!selectedPatient) return;
    
    const canvas = document.querySelector('#qr-modal-canvas');
    if (!canvas) return;
    
    // Create download link
    const link = document.createElement('a');
    link.download = `${getPatientFullName(selectedPatient)}_QR_Code.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  // Auto Login functionality
  const handleAutoLogin = (patient) => {
    if (!patient) {
      alert('No patient selected for auto login');
      return;
    }

    // Check if patient is already in today's checkups
    const existingCheckup = todaysCheckups.find(checkup => checkup.patientId === patient.id);
    
    if (existingCheckup) {
      alert(`${getPatientFullName(patient)} is already checked in for today.`);
      return;
    }

    // Create checkup entry
    const newCheckup = {
      id: Date.now(), // Simple ID generation
      patientId: patient.id,
      patientName: getPatientFullName(patient),
      checkInTime: new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }),
      appointmentTime: 'Walk-in', // Default for auto login
      purpose: selectedService || 'General Checkup',
      status: 'Checked In',
      vitalSignsComplete: false,
      patientData: patient // Store full patient data for reference
    };

    // Add to today's checkups
    setTodaysCheckups(prev => [...prev, newCheckup]);

    // Add activity tracking
    addActivity(
      'Patient Check-in',
      `${getPatientFullName(patient)} checked in for ${selectedService || 'General Checkup'}`,
      'success'
    );

    // Close the patient details modal and navigate to Today's Checkup
    setShowPatientDetailsModal(false);
    
    // Show success message with option to view Today's Checkup
    const viewCheckups = window.confirm(
      `${getPatientFullName(patient)} has been successfully checked in for today's appointment.\n\nWould you like to view Today's Checkups now?`
    );
    
    if (viewCheckups) {
      handleNavigation("Today's Checkup");
      setActiveDropdown('checkup');
    }
  };

  // Update checkup status functionality
  const handleUpdateCheckupStatus = (checkupId) => {
    const checkup = todaysCheckups.find(c => c.id === checkupId);
    if (!checkup) return;

    const statusOptions = ['Checked In', 'Waiting', 'In Progress', 'With Doctor', 'Completed'];
    const currentIndex = statusOptions.indexOf(checkup.status);
    const nextStatus = statusOptions[(currentIndex + 1) % statusOptions.length];

    setTodaysCheckups(prev => 
      prev.map(c => 
        c.id === checkupId 
          ? { ...c, status: nextStatus }
          : c
      )
    );

    alert(`Status updated to: ${nextStatus}`);
  };

  // Vital Signs functionality
  const handleVitalSignsFormChange = (field, value) => {
    setVitalSignsFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveVitalSigns = async () => {
    if (!selectedPatient) {
      alert('No patient selected');
      return;
    }

    try {
      // Validate required fields
      const requiredFields = ['temperature', 'heartRate', 'systolicBP', 'diastolicBP'];
      const missingFields = requiredFields.filter(field => !vitalSignsFormData[field]);
      
      if (missingFields.length > 0) {
        alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Prepare vital signs data
      const vitalSignsData = {
        patientId: selectedPatient.id,
        temperature: parseFloat(vitalSignsFormData.temperature),
        heartRate: parseInt(vitalSignsFormData.heartRate),
        systolicBP: parseInt(vitalSignsFormData.systolicBP),
        diastolicBP: parseInt(vitalSignsFormData.diastolicBP),
        respiratoryRate: vitalSignsFormData.respiratoryRate ? parseInt(vitalSignsFormData.respiratoryRate) : null,
        oxygenSaturation: vitalSignsFormData.oxygenSaturation ? parseInt(vitalSignsFormData.oxygenSaturation) : null,
        weight: vitalSignsFormData.weight ? parseFloat(vitalSignsFormData.weight) : null,
        height: vitalSignsFormData.height ? parseInt(vitalSignsFormData.height) : null,
        clinicalNotes: vitalSignsFormData.clinicalNotes || '',
        recordedAt: new Date().toISOString()
      };

      // Save to backend (we'll implement this API endpoint)
      await adminService.createVitalSigns(vitalSignsData);

      // Update today's checkups if this patient is checked in
      setTodaysCheckups(prev => 
        prev.map(checkup => 
          checkup.patientId === selectedPatient.id 
            ? { ...checkup, vitalSignsComplete: true }
            : checkup
        )
      );

      // Clear form and close modal
      setVitalSignsFormData({
        temperature: '',
        heartRate: '',
        systolicBP: '',
        diastolicBP: '',
        respiratoryRate: '',
        oxygenSaturation: '',
        weight: '',
        height: '',
        clinicalNotes: ''
      });
      
      // Set to read-only mode after saving
      setIsVitalSignsEditMode(false);
      setShowVitalSignsModal(false);

      alert('Vital signs recorded successfully!');
    } catch (error) {
      console.error('Error saving vital signs:', error);
      alert('Error saving vital signs. Please try again.');
    }
  };

  // Fetch vital signs history for a patient
  const fetchVitalSignsHistory = async (patientId) => {
    setLoadingVitalHistory(true);
    try {
      const history = await adminService.getVitalSignsHistory(patientId);
      setVitalSignsHistory(history || []);
    } catch (error) {
      console.error('Error fetching vital signs history:', error);
      setVitalSignsHistory([]);
      alert('Error loading vital signs history');
    } finally {
      setLoadingVitalHistory(false);
    }
  };

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      setUserError(null);
      try {
        const response = await userService.getUsers();
        const usersWithAccessRights = (response.users || []).map(user => ({
          ...user,
          accessRights: user.accessRights || {
            dashboard: true,
            patients: true,
            families: true,
            appointments: true,
            reports: true,
            users: user.role === 'admin',
            settings: user.role === 'admin'
          }
        }));
        setUsers(usersWithAccessRights);
        setBackendConnected(true);
        console.log('Successfully fetched users:', usersWithAccessRights.length);
      } catch (error) {
        console.error('Error fetching users:', error);
        setUserError(error.message);
        
        // Only set disconnected if it's a real connection error
        if (error.message.includes('Network Error') || 
            error.message.includes('ECONNREFUSED') ||
            error.response?.status === 500) {
          setBackendConnected(false);
          setUserError('Backend server is not running. Please start the backend server.');
        } else {
          // For other errors (like 403 unauthorized), keep connected status
          // This might just be a permission issue, not a connection issue
          setBackendConnected(true);
        }
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // Form persistence with localStorage
  useEffect(() => {
    // Load saved form data on component mount
    const savedFormData = localStorage.getItem('adminUserFormData');
    const savedUserType = localStorage.getItem('adminSelectedUserType');
    const savedShowTypeSelection = localStorage.getItem('adminShowUserTypeSelection');
    
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        setUserFormData(parsedData);
      } catch (error) {
        console.error('Error parsing saved form data:', error);
      }
    }
    
    if (savedUserType) {
      setSelectedUserType(savedUserType);
    }
    
    if (savedShowTypeSelection) {
      setShowUserTypeSelection(savedShowTypeSelection === 'true');
    }
  }, []);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (userFormData.firstName || userFormData.lastName || userFormData.emailInitials) {
      localStorage.setItem('adminUserFormData', JSON.stringify(userFormData));
    }
  }, [userFormData]);

  // Save user type selection to localStorage
  useEffect(() => {
    if (selectedUserType) {
      localStorage.setItem('adminSelectedUserType', selectedUserType);
    }
  }, [selectedUserType]);

  // Save show type selection state
  useEffect(() => {
    localStorage.setItem('adminShowUserTypeSelection', showUserTypeSelection.toString());
  }, [showUserTypeSelection]);

  // Persist today's checkups to localStorage
  useEffect(() => {
    if (todaysCheckups.length > 0) {
      localStorage.setItem('todaysCheckups', JSON.stringify(todaysCheckups));
      localStorage.setItem('todaysCheckupsDate', getCurrentEffectiveDateString());
    } else {
      // Clear localStorage when checkups array is empty
      localStorage.removeItem('todaysCheckups');
      localStorage.removeItem('todaysCheckupsDate');
    }
  }, [todaysCheckups, getCurrentEffectiveDateString]);

  // Persist appointments to localStorage
  useEffect(() => {
    localStorage.setItem('appointments', JSON.stringify(appointments));
  }, [appointments]);
  
  // Chart data - real checkup trends based on actual data
  const checkupData = useMemo(() => {
    // Calculate checkups by day of the week
    const dayStats = {
      'Monday': 0,
      'Tuesday': 0,
      'Wednesday': 0,
      'Thursday': 0,
      'Friday': 0,
      'Saturday': 0,
      'Sunday': 0
    };
    
    todaysCheckups.forEach(checkup => {
      if (checkup.checkInTime) {
        const date = new Date(checkup.checkInTime);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        if (dayStats[dayName] !== undefined) {
          dayStats[dayName]++;
        }
      }
    });
    
    return {
      labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      datasets: [
        {
          label: 'Checkups Completed',
          data: Object.values(dayStats),
          backgroundColor: 'rgba(56, 189, 248, 0.6)',
          borderColor: 'rgba(56, 189, 248, 1)',
          borderWidth: 2,
          tension: 0.3,
        },
      ],
    };
  }, [todaysCheckups]);
  
  // Calculate real chart data based on all patients (including unsorted)
  const allPatients = useMemo(() => {
    return [...patientsData, ...unsortedMembersData];
  }, [patientsData, unsortedMembersData]);

  const patientDistributionData = useMemo(() => {
    const maleCount = allPatients.filter(p => p.gender === 'Male').length;
    const femaleCount = allPatients.filter(p => p.gender === 'Female').length;
    const otherCount = allPatients.filter(p => p.gender && p.gender !== 'Male' && p.gender !== 'Female').length;
    
    return {
      labels: otherCount > 0 ? ['Male', 'Female', 'Other'] : ['Male', 'Female'],
      datasets: [
        {
          label: 'Gender Distribution',
          data: otherCount > 0 ? [maleCount, femaleCount, otherCount] : [maleCount, femaleCount],
          backgroundColor: otherCount > 0 
            ? ['rgba(56, 189, 248, 0.6)', 'rgba(231, 76, 60, 0.6)', 'rgba(155, 89, 182, 0.6)']
            : ['rgba(56, 189, 248, 0.6)', 'rgba(231, 76, 60, 0.6)'],
          borderColor: otherCount > 0 
            ? ['rgba(56, 189, 248, 1)', 'rgba(231, 76, 60, 1)', 'rgba(155, 89, 182, 1)']
            : ['rgba(56, 189, 248, 1)', 'rgba(231, 76, 60, 1)'],
          borderWidth: 1,
        },
      ],
    };
  }, [allPatients]);
  
  const ageDistributionData = useMemo(() => {
    const ageGroups = {
      '0-10': 0,
      '11-20': 0,
      '21-30': 0,
      '31-40': 0,
      '41-50': 0,
      '51-60': 0,
      '61+': 0
    };
    
    allPatients.forEach(patient => {
      const age = parseInt(patient.age) || 0;
      if (age <= 10) ageGroups['0-10']++;
      else if (age <= 20) ageGroups['11-20']++;
      else if (age <= 30) ageGroups['21-30']++;
      else if (age <= 40) ageGroups['31-40']++;
      else if (age <= 50) ageGroups['41-50']++;
      else if (age <= 60) ageGroups['51-60']++;
      else ageGroups['61+']++;
    });
    
    return {
      labels: ['0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61+'],
      datasets: [
        {
          label: 'Age Distribution',
          data: Object.values(ageGroups),
          backgroundColor: 'rgba(56, 189, 248, 0.6)',
          borderColor: 'rgba(56, 189, 248, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [allPatients]);
  // Update date and time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // Daily cleanup - clear today's checkups when date changes
  useEffect(() => {
    const checkDate = () => {
      const currentDate = new Date().toDateString();
      const savedDate = localStorage.getItem('todaysCheckupsDate');
      
      if (savedDate && savedDate !== currentDate) {
        // New day detected, clear today's checkups
        setTodaysCheckups([]);
        localStorage.removeItem('todaysCheckups');
        localStorage.removeItem('todaysCheckupsDate');
      }
    };

    // Check immediately
    checkDate();

    // Check every minute (when time updates)
    const timer = setInterval(checkDate, 60000);

    return () => clearInterval(timer);
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchUnsortedMembers();
    fetchFamilies();
  }, [fetchUnsortedMembers]);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    // Close any open dropdown when toggling sidebar
    if (!sidebarOpen === false) { // If sidebar is closing
      setActiveDropdown(null);
    }
  };

  const handleDropdownToggle = (dropdown) => {
    if (activeDropdown === dropdown) {
      setActiveDropdown(null);
      setActiveSubDropdown(null);
    } else {
      setActiveDropdown(dropdown);
      setActiveSubDropdown(null);
    }
  };

  const handleSubDropdownToggle = (subDropdown, event) => {
    event.stopPropagation();
    if (activeSubDropdown === subDropdown) {
      setActiveSubDropdown(null);
    } else {
      setActiveSubDropdown(subDropdown);
    }
  };

  const handleNavigation = (path) => {
    setCurrentPath(path);
    
    // Reset user type selection when navigating to Add User
    if (path === 'Add User') {
      setShowUserTypeSelection(true);
      setSelectedUserType('');
      setUserFormData({
        firstName: '',
        middleName: '',
        lastName: '',
        emailInitials: '',
        password: '',
        confirmPassword: '',
        role: 'aide',
        position: 'Aide',
        userType: '',
        accessLevel: ''
      });
      // Clear localStorage when navigating to Add User
      localStorage.removeItem('adminUserFormData');
      localStorage.removeItem('adminSelectedUserType');
      localStorage.removeItem('adminShowUserTypeSelection');
    }
    
    // Here you would handle actual navigation if needed
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    navigate('/');
  };

  const handleDarkModeToggle = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    // Apply theme to document
    if (newDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  // Simulation mode handlers
  const handleSimulationToggle = () => {
    setSimulationMode(prev => {
      const newMode = {
        ...prev,
        enabled: !prev.enabled
      };
      
      // Add activity tracking
      addActivity(
        newMode.enabled ? 'Simulation Mode Enabled' : 'Simulation Mode Disabled',
        newMode.enabled ? 'System switched to simulation environment' : 'System returned to live environment',
        newMode.enabled ? 'warning' : 'info'
      );
      
      // Sync with shared state
      updateSimulationMode(newMode, user?.username || 'admin');
      
      return newMode;
    });
  };

  const handleSimulationChange = (field, value) => {
    setSimulationMode(prev => {
      const newMode = {
        ...prev,
        [field]: value
      };
      
      // Sync with shared state
      updateSimulationMode(newMode, user?.username || 'admin');
      
      return newMode;
    });
  };

  const handleSimulatedDateChange = (date) => {
    setSimulationMode(prev => {
      const newMode = {
        ...prev,
        currentSimulatedDate: new Date(date)
      };
      
      // Sync with shared state
      updateSimulationMode(newMode, user?.username || 'admin');
      
      return newMode;
    });
  };

  const resetSimulation = () => {
    const resetMode = {
      enabled: false,
      currentSimulatedDate: new Date(),
      smsSimulation: true,
      emailSimulation: true,
      dataSimulation: false
    };
    
    setSimulationMode(resetMode);
    // Disable in shared state
    disableSimulationMode();
  };

  // Chart options for dark mode compatibility
  const getChartOptions = (type = 'default') => {
    const textColor = isDarkMode ? '#38bdf8' : '#666';
    const gridColor = isDarkMode ? '#334155' : '#e2e8f0';
    
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: textColor,
            font: {
              size: 12
            }
          }
        },
        title: {
          display: false
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColor,
            font: {
              size: 11
            }
          },
          grid: {
            color: gridColor
          }
        },
        y: {
          ticks: {
            color: textColor,
            font: {
              size: 11
            }
          },
          grid: {
            color: gridColor
          }
        }
      }
    };

    if (type === 'pie') {
      // For pie charts, remove scales
      delete baseOptions.scales;
    }

    return baseOptions;
  };

  const formatDate = (date) => {
    if (!date) return '';
    if (typeof date === 'string') {
      date = new Date(date);
      if (isNaN(date)) return '';
    }
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };
  
  const formatShortDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatDateWithTime = (dateObj) => {
    if (!dateObj) return '';
    const date = new Date(dateObj);
    if (isNaN(date)) return '';
    
    const dateStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    
    return `${dateStr} - ${timeStr}`;
  };

  // Unit conversion functions
  const convertWeight = (kg, toUnit) => {
    if (toUnit === 'lbs') return (kg * 2.20462).toFixed(1);
    return kg;
  };

  const convertHeight = (cm, toUnit) => {
    if (toUnit === 'ft') {
      const totalInches = cm / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = (totalInches % 12).toFixed(0);
      return `${feet}'${inches}"`;
    }
    return cm;
  };

  const generateWeightOptions = () => {
    const options = [];
    if (weightUnit === 'kg') {
      for (let i = 0; i < 200; i++) {
        const weight = (2.0 + (i * 0.5)).toFixed(1);
        options.push(
          <option key={`kg-${weight}`} value={weight}>
            {weight} kg
          </option>
        );
      }
    } else {
      for (let i = 0; i < 200; i++) {
        const kg = 2.0 + (i * 0.5);
        const lbs = convertWeight(kg, 'lbs');
        options.push(
          <option key={`lbs-${kg}`} value={kg}>
            {lbs} lbs
          </option>
        );
      }
    }
    return options;
  };

  const generateHeightOptions = () => {
    const options = [];
    if (heightUnit === 'cm') {
      for (let i = 0; i < 211; i++) {
        const height = 40 + i;
        options.push(
          <option key={`cm-${height}`} value={height}>
            {height} cm
          </option>
        );
      }
    } else {
      for (let i = 0; i < 211; i++) {
        const cm = 40 + i;
        const ft = convertHeight(cm, 'ft');
        options.push(
          <option key={`ft-${cm}`} value={cm}>
            {ft}
          </option>
        );
      }
    }
    return options;
  };

  // Patient management functions
  const handlePatientSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredFamilies = () => {
    if (!searchTerm) return families;
    const term = searchTerm.toLowerCase();
    return families.filter(family => {
      const familyName = family.familyName ? family.familyName.toLowerCase() : '';
      const familyId = family.id ? family.id.toString().toLowerCase() : '';
      const headOfFamily = getFamilyHead(family).toLowerCase();
      const contact = getFamilyContact(family);
      
      return familyName.includes(term) || 
             familyId.includes(term) ||
             headOfFamily.includes(term) ||
             contact.includes(term);
    });
  };
  
  const handleAddPatient = () => {
    setShowAddPatientModal(true);
  };
  
  const handlePatientFormChange = (field, value) => {
    if (field === 'dateOfBirth' && value) {
      // Calculate age based on date of birth
      const today = new Date();
      const birthDate = new Date(value);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      setPatientFormData(prev => ({
        ...prev,
        dateOfBirth: value,
        age: age.toString()
      }));
    } else {
      setPatientFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };
  
  const handleSavePatient = async () => {
    try {
      // Validate required fields with specific messages
      const requiredFields = [
        { field: 'firstName', message: 'First Name is required' },
        { field: 'lastName', message: 'Last Name is required' },
        { field: 'dateOfBirth', message: 'Date of Birth is required' },
        { field: 'gender', message: 'Gender is required' },
        { field: 'civilStatus', message: 'Civil Status is required' },
        { field: 'contactNumber', message: 'Contact Number is required' },
        { field: 'street', message: 'Street is required' },
        { field: 'barangay', message: 'Barangay is required' }
      ];

      // Check for missing required fields
      for (const { field, message } of requiredFields) {
        if (!patientFormData[field] || patientFormData[field].toString().trim() === '') {
          alert(message);
          return;
        }
      }

      // Validate phone number format
      if (patientFormData.contactNumber) {
        const phoneRegex = /^09\d{9}$/;
        if (!phoneRegex.test(patientFormData.contactNumber)) {
          alert('Phone number must be exactly 11 digits starting with 09 (e.g., 09171234567)');
          return;
        }
      }

      // Validate email field - must be either valid email or "N/A"
      if (!patientFormData.email || patientFormData.email.trim() === '') {
        setShowEmailConfirmModal(true);
        return; // Stop validation and show modal
      } else if (patientFormData.email.trim() !== '' && 
                 patientFormData.email.toLowerCase() !== 'n/a' && 
                 patientFormData.email !== 'N/A') {
        // Validate email format only if it's not N/A
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(patientFormData.email)) {
          alert('Please enter a valid email address or type "N/A" if the patient has no email');
          return;
        }
      }

      // Create patient data object
      const patientData = {
        ...patientFormData,
        dateOfBirth: patientFormData.dateOfBirth.toISOString().split('T')[0] // Format date for API
      };

      // Make API call to create patient
      await adminService.createPatient(patientData);
      
      // Clear form and close modal
      setPatientFormData({
        firstName: '',
        middleName: '',
        lastName: '',
        suffix: '',
        dateOfBirth: new Date(),
        age: '',
        gender: '',
        civilStatus: '',
        contactNumber: '',
        email: '',
        houseNo: '',
        street: '',
        barangay: '',
        city: 'Pasig City',
        region: 'Metro Manila',
        postalCode: '1600',
        philHealthNumber: '',
        medicalConditions: '',
        familyId: ''
      });
      setShowAddPatientModal(false);
      
      // Refresh patients list
      fetchPatients();
      
      // Show success message
      alert('Patient added successfully');
    } catch (error) {
      console.error('Error saving patient:', error);
      alert('Error saving patient. Please try again.');
    }
  };
  
  const handleAddFamily = () => {
    // Reset form data when opening modal
    setFamilyFormData({
      familyName: '',
      surname: '',
      headOfFamily: '',
      contactNumber: '',
      notes: ''
    });
    setShowAddFamilyModal(true);
  };

  // Helper function to capitalize first letter of each word
  const capitalizeWords = (str) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Handle family form input changes with auto-capitalization
  const handleFamilyFormChange = (field, value) => {
    let processedValue = value;
    
    // Auto-capitalize for name fields
    if (field === 'familyName' || field === 'surname' || field === 'headOfFamily') {
      processedValue = capitalizeWords(value);
    }
    
    // Phone number validation - only allow numbers and limit to 11 digits
    if (field === 'contactNumber') {
      // Remove all non-numeric characters
      processedValue = value.replace(/\D/g, '');
      // Limit to 11 digits
      if (processedValue.length > 11) {
        processedValue = processedValue.slice(0, 11);
      }
    }
    
    // Automatically append "Family" to familyName
    if (field === 'familyName') {
      // The input field only shows the base name, so we append "Family" for storage
      if (processedValue.trim()) {
        processedValue = `${processedValue.trim()} Family`;
      }
    }
    
    setFamilyFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));
  };

  // Handle family form submission
  const handleSaveFamily = async () => {
    try {
      // Validate required fields
      if (!familyFormData.familyName.trim() || !familyFormData.surname.trim()) {
        alert('Family Name and Surname are required fields.');
        return;
      }

      // Validate contact number if provided
      if (familyFormData.contactNumber.trim()) {
        if (familyFormData.contactNumber.length !== 11) {
          alert('Contact number must be exactly 11 digits.');
          return;
        }
        if (!/^\d{11}$/.test(familyFormData.contactNumber)) {
          alert('Contact number must contain only numbers.');
          return;
        }
      }

      // Create family data object
      const familyData = {
        familyName: familyFormData.familyName.trim(),
        surname: familyFormData.surname.trim(),
        headOfFamily: familyFormData.headOfFamily.trim() || '',
        contactNumber: familyFormData.contactNumber.trim(),
        notes: familyFormData.notes.trim()
      };

      // Call API to create family
      const newFamily = await adminService.createFamily(familyData);
      
      // Refresh families data
      await fetchFamilies();
      
      // Close modal and show success message
      setShowAddFamilyModal(false);
      
      // If we came from Add Patient modal, go back to it and select the new family
      if (patientFormData.firstName || patientFormData.lastName) {
        setPatientFormData(prev => ({
          ...prev,
          familyId: newFamily.id
        }));
        setShowAddPatientModal(true);
      }
      
      // Show success message
      alert('Family created successfully!');
    } catch (error) {
      console.error('Error creating family:', error);
      alert('An error occurred while creating the family. Please try again.');
    }
  };
  
  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    setShowPatientDetailsModal(true);
  };

  // Handle service selection for a checkup
  const handleServiceSelection = (checkupId, serviceId) => {
    const service = availableServices.find(s => s.id === serviceId);
    if (!service) return;

    setTodaysCheckups(prevCheckups => {
      const updatedCheckups = prevCheckups.map(checkup => {
        if (checkup.id === checkupId) {
          return {
            ...checkup,
            purpose: service.name
          };
        }
        return checkup;
      });
      
      // Save to localStorage
      localStorage.setItem('todaysCheckups', JSON.stringify(updatedCheckups));
      localStorage.setItem('todaysCheckupsDate', getCurrentEffectiveDateString());
      
      return updatedCheckups;
    });
  };

  // Toggle remove mode with modal
  const toggleRemoveMode = () => {
    setShowRemoveModal(true);
  };

  // Handle removing a patient from today's checkups (from modal)
  const handleRemoveFromCheckup = (checkupId) => {
    const checkup = todaysCheckups.find(c => c.id === checkupId);
    if (!checkup) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to remove ${checkup.patientName} from today's checkups?\n\n` +
      "This will permanently remove their checkup record for today."
    );
    
    if (confirmed) {
      setTodaysCheckups(prevCheckups => {
        const updatedCheckups = prevCheckups.filter(checkup => checkup.id !== checkupId);
        
        // Update localStorage
        if (updatedCheckups.length > 0) {
          localStorage.setItem('todaysCheckups', JSON.stringify(updatedCheckups));
        } else {
          localStorage.removeItem('todaysCheckups');
          localStorage.removeItem('todaysCheckupsDate');
        }
        
        return updatedCheckups;
      });
      
      // Close modal after successful removal
      setShowRemoveModal(false);
    }
  };
  
  const handleVitalSigns = async (patient) => {
    // Check if patient has checked in and selected a service
    const checkup = todaysCheckups.find(c => c.patientId === patient.id);
    
    if (!checkup) {
      alert('Patient must check in first before vital signs can be recorded.');
      return;
    }
    
    if (!checkup.purpose || checkup.purpose === 'General Checkup') {
      alert('Please select a specific service purpose before proceeding with vital signs.');
      return;
    }
    
    setSelectedPatient(patient);
    
    // Check if patient has vital signs completed today
    const hasCompletedVitalSigns = checkup && checkup.vitalSignsComplete;
    
    if (hasCompletedVitalSigns) {
      // Load existing vital signs data for today
      try {
        const history = await adminService.getVitalSignsHistory(patient.id);
        const todayRecord = history.find(record => {
          const recordDate = new Date(record.recordedAt).toDateString();
          const today = new Date().toDateString();
          return recordDate === today;
        });
        
        if (todayRecord) {
          setVitalSignsFormData({
            temperature: todayRecord.temperature?.toString() || '',
            heartRate: todayRecord.heartRate?.toString() || '',
            systolicBP: todayRecord.systolicBP?.toString() || '',
            diastolicBP: todayRecord.diastolicBP?.toString() || '',
            respiratoryRate: todayRecord.respiratoryRate?.toString() || '',
            oxygenSaturation: todayRecord.oxygenSaturation?.toString() || '',
            weight: todayRecord.weight?.toString() || '',
            height: todayRecord.height?.toString() || '',
            clinicalNotes: todayRecord.clinicalNotes || ''
          });
        }
        
        // Set to read-only mode initially
        setIsVitalSignsEditMode(false);
      } catch (error) {
        console.error('Error loading vital signs:', error);
      }
    } else {
      // Clear the form when opening for new vital signs
      setVitalSignsFormData({
        temperature: '',
        heartRate: '',
        systolicBP: '',
        diastolicBP: '',
        respiratoryRate: '',
        oxygenSaturation: '',
        weight: '',
        height: '',
        clinicalNotes: ''
      });
      
      // Set to edit mode for new vital signs
      setIsVitalSignsEditMode(true);
    }
    
    setShowVitalSignsModal(true);
  };
  
  const handleQRCode = (patient) => {
    setSelectedPatient(patient);
    setShowQRCodeModal(true);
  };

  const handleViewInfo = async (patient) => {
    if (!patient) {
      console.error('No patient provided to handleViewInfo');
      return;
    }
    
    try {
      // Fetch detailed patient information from the backend
      const detailedPatient = await adminService.getPatientById(patient.id);
      setSelectedPatient(detailedPatient);
      setShowPatientDetailsModal(true);
    } catch (error) {
      console.error('Error fetching patient details:', error);
      // Fallback to using the existing patient data if API call fails
      setSelectedPatient(patient);
      setShowPatientDetailsModal(true);
    }
  };

  const handleNotifyDoctor = (patient) => {
    // In a real application, this would send a notification to the doctor
    alert(`Notifying doctor for ${getPatientFullName(patient)}. Doctor will be available shortly.`);
    // Here you would typically update the patient's status and send notification
  };

  const handleTreatmentRecord = (patient) => {
    setSelectedPatient(patient);
    // Store the current modal state before opening treatment record
    if (showPatientDetailsModal) {
      setPreviousModalState('patientDetails');
      setShowPatientDetailsModal(false);
    }
    setShowTreatmentRecordModal(true);
  };

  const handleVitalSignsHistory = (patient) => {
    setSelectedPatient(patient);
    // Store the current modal state before opening vital signs history
    if (showPatientDetailsModal) {
      setPreviousModalState('patientDetails');
      setShowPatientDetailsModal(false);
    }
    
    // Fetch vital signs history for this patient
    fetchVitalSignsHistory(patient.id);
    setShowVitalSignsHistoryModal(true);
  };

  const handleCheckupHistory = (patient) => {
    setSelectedPatient(patient);
    // Store the current modal state before opening checkup history
    if (showPatientDetailsModal) {
      setPreviousModalState('patientDetails');
      setShowPatientDetailsModal(false);
    }
    setShowCheckupHistoryModal(true);
  };

  const handleImmunizationHistory = (patient) => {
    setSelectedPatient(patient);
    // Store the current modal state before opening immunization history
    if (showPatientDetailsModal) {
      setPreviousModalState('patientDetails');
      setShowPatientDetailsModal(false);
    }
    setShowImmunizationHistoryModal(true);
  };

  // Function to close treatment record modal and restore previous modal
  const closeTreatmentRecordModal = () => {
    setShowTreatmentRecordModal(false);
    // Restore the previous modal if it was patient details
    if (previousModalState === 'patientDetails') {
      setTimeout(() => {
        setShowPatientDetailsModal(true);
      }, 100); // Small delay to prevent overlap
    }
    setPreviousModalState(null);
  };

  // Function to close vital signs history modal and restore previous modal
  const closeVitalSignsHistoryModal = () => {
    setShowVitalSignsHistoryModal(false);
    // Restore the previous modal if it was patient details
    if (previousModalState === 'patientDetails') {
      setTimeout(() => {
        setShowPatientDetailsModal(true);
      }, 100); // Small delay to prevent overlap
    }
    setPreviousModalState(null);
  };

  // Function to close checkup history modal and restore previous modal
  const closeCheckupHistoryModal = () => {
    setShowCheckupHistoryModal(false);
    // Restore the previous modal if it was patient details
    if (previousModalState === 'patientDetails') {
      setTimeout(() => {
        setShowPatientDetailsModal(true);
      }, 100); // Small delay to prevent overlap
    }
    setPreviousModalState(null);
  };

  // Function to close immunization history modal and restore previous modal
  const closeImmunizationHistoryModal = () => {
    setShowImmunizationHistoryModal(false);
    // Restore the previous modal if it was patient details
    if (previousModalState === 'patientDetails') {
      setTimeout(() => {
        setShowPatientDetailsModal(true);
      }, 100); // Small delay to prevent overlap
    }
    setPreviousModalState(null);
  };

  const handleReferralForm = (patient) => {
    setSelectedPatient(patient);
    // Store the current modal state before opening referral form
    if (showPatientDetailsModal) {
      setShowPatientDetailsModal(false);
      setPreviousModalState('patientDetails');
    }
    setShowReferralFormModal(true);
  };

  // Function to close referral form modal and restore previous modal
  const closeReferralFormModal = () => {
    setShowReferralFormModal(false);
    // Restore the previous modal if it was patient details
    if (previousModalState === 'patientDetails') {
      setTimeout(() => {
        setShowPatientDetailsModal(true);
      }, 100); // Small delay to prevent overlap
    }
    setPreviousModalState(null);
  };

  // Function to open notification manager
  const handleNotificationManager = () => {
    setShowNotificationManagerModal(true);
  };

  // Function to close notification manager modal
  const closeNotificationManagerModal = () => {
    setShowNotificationManagerModal(false);
  };

  // Function to open SMS notification modal
  const handleSMSNotification = (patient) => {
    setSelectedPatient(patient);
    // Store the current modal state before opening SMS modal
    if (showPatientDetailsModal) {
      setShowPatientDetailsModal(false);
      setPreviousModalState('patientDetails');
    }
    setShowSMSNotificationModal(true);
  };

  // Function to close SMS notification modal
  const closeSMSNotificationModal = () => {
    setShowSMSNotificationModal(false);
    // Restore the previous modal if it was patient details
    if (previousModalState === 'patientDetails') {
      setTimeout(() => {
        setShowPatientDetailsModal(true);
      }, 100); // Small delay to prevent overlap
    }
    setPreviousModalState(null);
  };
  
  const handleViewFamily = (family) => {
    setSelectedFamily(family);
    setShowFamilyModal(true);
  };
  
  const handleAddAppointment = () => {
    // Placeholder for appointment functionality
    alert('Schedule appointment feature will be implemented soon!');
  };
  
  const handleTodaysCheckups = () => {
    handleNavigation("Today's Checkup");
    setActiveDropdown('checkup');
  };
  
  const handleRefreshData = async () => {
    try {
      // Refresh patients, families, and unsorted members data
      const [patientsData, familiesData] = await Promise.all([
        adminService.getAllPatients(),
        adminService.getAllFamilies()
      ]);
      setPatients(patientsData);
      setFamilies(familiesData);
      
      // Also refresh unsorted members
      await fetchUnsortedMembers();
      
      alert('Data refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing data:', error);
      alert('Error refreshing data. Please try again.');
    }
  };

  // Fetch all families
  const fetchFamilies = async () => {
    try {
      const data = await adminService.getAllFamilies();
      setFamilies(data || []);
    } catch (error) {
      console.error('Error fetching families:', error);
      setFamilies([]);
    }
  };
  
  const fetchPatients = async () => {
    try {
      const data = await adminService.getAllPatients();
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]);
    }
  };

  // Handle autosort
  const handleAutosort = async () => {
    setIsLoadingAutosort(true);
    try {
      const results = await adminService.autosortPatients();
      setAutosortResults(results);
      
      if (results.needsManualAssignment && results.needsManualAssignment.length > 0) {
        setShowAutosortModal(true);
      } else {
        const sortedCount = results.sorted ? results.sorted.length : 0;
        alert(`Successfully sorted ${sortedCount} patients into existing families!`);
        fetchUnsortedMembers(); // Refresh unsorted list
        fetchPatientsAndFamilies(); // Refresh both patients and families data
      }
    } catch (error) {
      console.error('Error autosorting patients:', error);
      alert('Error during autosort. Please try again.');
    } finally {
      setIsLoadingAutosort(false);
    }
  };

  // Create families for unmatched patients
  const handleCreateFamilies = async () => {
    try {
      const patientIds = autosortResults.needsManualAssignment.map(p => p.id);
      const results = await adminService.createFamiliesForPatients(patientIds);
      
      alert(`Successfully created ${results.length} new families and sorted patients!`);
      
      setShowAutosortModal(false);
      setAutosortResults(null);
      fetchUnsortedMembers();
      fetchPatientsAndFamilies(); // Refresh both patients and families data
    } catch (error) {
      console.error('Error creating families:', error);
      alert('Error creating families. Please try again.');
    }
  };

  // Manually assign patient to family
  // Open assign to family modal
  const handleOpenAssignFamilyModal = (patient) => {
    setSelectedPatientForAssignment(patient);
    setSelectedFamilyForAssignment('');
    setShowCreateFamilyInAssign(false);
    setAssignFamilyFormData({
      familyName: '',
      surname: '',
      headOfFamily: '',
      contactNumber: '',
      notes: ''
    });
    setShowAssignFamilyModal(true);
  };

  // Handle family form changes in assign modal
  const handleAssignFamilyFormChange = (field, value) => {
    let processedValue = value;
    
    // Auto-capitalize for name fields
    if (field === 'familyName' || field === 'surname' || field === 'headOfFamily') {
      processedValue = capitalizeWords(value);
    }
    
    // Phone number validation - only allow numbers and limit to 11 digits
    if (field === 'contactNumber') {
      processedValue = value.replace(/\D/g, '');
      if (processedValue.length > 11) {
        processedValue = processedValue.slice(0, 11);
      }
    }
    
    // Automatically append "Family" to familyName
    if (field === 'familyName') {
      if (processedValue.trim()) {
        processedValue = `${processedValue.trim()} Family`;
      }
    }
    
    setAssignFamilyFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));
  };

  // Create new family and assign patient
  const handleCreateFamilyAndAssign = async () => {
    try {
      // Validate required fields
      if (!assignFamilyFormData.familyName.trim() || !assignFamilyFormData.surname.trim()) {
        alert('Family Name and Surname are required fields.');
        return;
      }

      // Validate contact number if provided
      if (assignFamilyFormData.contactNumber.trim()) {
        if (assignFamilyFormData.contactNumber.length !== 11) {
          alert('Contact number must be exactly 11 digits.');
          return;
        }
        if (!/^\d{11}$/.test(assignFamilyFormData.contactNumber)) {
          alert('Contact number must contain only numbers.');
          return;
        }
      }

      // Create family data object
      const familyData = {
        familyName: assignFamilyFormData.familyName.trim(),
        surname: assignFamilyFormData.surname.trim(),
        headOfFamily: assignFamilyFormData.headOfFamily.trim() || '',
        contactNumber: assignFamilyFormData.contactNumber.trim(),
        notes: assignFamilyFormData.notes.trim()
      };

      // Create the family first
      const createdFamily = await adminService.createFamily(familyData);
      
      // Then assign the patient to the new family
      await adminService.assignPatientToFamily(selectedPatientForAssignment.id, createdFamily.id);
      
      // Close modal and refresh data
      setShowAssignFamilyModal(false);
      alert('New family created and patient assigned successfully!');
      await handleRefreshData();
      
    } catch (error) {
      console.error('Error creating family and assigning patient:', error);
      alert('Error creating family and assigning patient. Please try again.');
    }
  };

  // Assign patient to existing family
  const handleAssignToExistingFamily = async () => {
    try {
      if (!selectedFamilyForAssignment) {
        alert('Please select a family to assign the patient to.');
        return;
      }

      if (!selectedPatientForAssignment) {
        alert('No patient selected for assignment.');
        return;
      }

      const familyId = parseInt(selectedFamilyForAssignment);
      if (isNaN(familyId)) {
        alert('Invalid family selection. Please try again.');
        return;
      }

      await adminService.assignPatientToFamily(selectedPatientForAssignment.id, familyId);
      
      setShowAssignFamilyModal(false);
      alert('Patient assigned to family successfully!');
      await handleRefreshData();
      
    } catch (error) {
      console.error('Error assigning patient to family:', error);
      if (error.response && error.response.data && error.response.data.msg) {
        alert(`Error: ${error.response.data.msg}`);
      } else {
        alert('Error assigning patient to family. Please try again.');
      }
    }
  };

  const handleAssignToFamily = async (patientId, familyId) => {
    try {
      if (!patientId || !familyId) {
        alert('Invalid patient or family selection.');
        return;
      }
      
      await adminService.assignPatientToFamily(patientId, familyId);
      alert('Patient assigned to family successfully!');
      fetchUnsortedMembers();
      fetchFamilies();
    } catch (error) {
      console.error('Error assigning patient to family:', error);
      if (error.response && error.response.data && error.response.data.msg) {
        alert(`Error: ${error.response.data.msg}`);
      } else {
        alert('Error assigning patient to family. Please try again.');
      }
    }
  };

  // Manage dropdown handlers
  const handleManageDropdown = () => {
    setShowManageDropdown(!showManageDropdown);
  };

  const handleReassignFamily = () => {
    setConfirmAction('reassign');
    setShowConfirmModal(true);
    setShowManageDropdown(false);
    setCountdown(5);
  };

  const handleDeletePatient = () => {
    setConfirmAction('delete');
    setShowConfirmModal(true);
    setShowManageDropdown(false);
    setCountdown(5);
  };

  const confirmActionHandler = async () => {
    if (countdown === 0) {
      if (!selectedPatient) {
        alert('No patient selected for action.');
        return;
      }
      
      if (confirmAction === 'reassign') {
        // Open the assign family modal for reassignment
        setShowConfirmModal(false);
        setShowPatientDetailsModal(false);
        handleOpenAssignFamilyModal(selectedPatient);
      } else if (confirmAction === 'delete') {
        // For delete, show second confirmation
        setShowConfirmModal(false);
        setShowSecondConfirmModal(true);
        setSecondCountdown(5);
      }
    }
  };

  const confirmSecondActionHandler = async () => {
    if (secondCountdown === 0) {
      try {
        if (!selectedPatient) {
          alert('No patient selected for deletion.');
          return;
        }
        
        // Call API to delete patient
        await fetch(`http://localhost:5000/api/patients/${selectedPatient.id}`, {
          method: 'DELETE',
          headers: {
            'x-auth-token': JSON.parse(localStorage.getItem('auth'))?.token || 'temp-admin-token'
          }
        });
        
        // Refresh patient data
        await fetchPatientsAndFamilies();
        
        // Close modals and show success
        setShowSecondConfirmModal(false);
        setShowPatientDetailsModal(false);
        alert(`Patient ${selectedPatient.fullName || getPatientFullName(selectedPatient)} has been deleted successfully.`);
      } catch (error) {
        console.error('Error deleting patient:', error);
        alert('Error deleting patient. Please try again.');
      }
    }
  };

  // Countdown effect for confirmation
  useEffect(() => {
    let timer;
    if (showConfirmModal && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [showConfirmModal, countdown]);

  // Countdown effect for second confirmation
  useEffect(() => {
    let timer;
    if (showSecondConfirmModal && secondCountdown > 0) {
      timer = setTimeout(() => setSecondCountdown(secondCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [showSecondConfirmModal, secondCountdown]);

  // Backup and Restore Handler Functions
  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const backup = createBackup();
      setBackupHistory(getBackupHistory());
      
      // Add activity tracking
      addActivity(
        'Backup Created',
        `System backup created (${backup.metadata.totalPatients} patients, ${backup.metadata.totalFamilies} families)`,
        'info'
      );
      
      // Show success notification
      const notification = document.createElement('div');
      notification.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 15px 20px; border-radius: 8px; z-index: 9999; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
          <i class="bi bi-check-circle" style="margin-right: 10px;"></i>
          Backup created successfully! (${backup.metadata.totalPatients} patients, ${backup.metadata.totalFamilies} families)
        </div>
      `;
      document.body.appendChild(notification);
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 5000);
    } catch (error) {
      alert('Failed to create backup: ' + error.message);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (file) => {
    setIsRestoringBackup(true);
    try {
      const backup = await restoreBackup(file);
      setRestoreHistory(getRestoreHistory());
      
      // Track backup restore activity
      addActivity({
        action: 'Backup Restored',
        details: `Restored data from backup created on ${new Date(backup.timestamp).toLocaleDateString()}`,
        type: 'warning'
      });
      
      // Show success notification
      const notification = document.createElement('div');
      notification.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #007bff; color: white; padding: 15px 20px; border-radius: 8px; z-index: 9999; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
          <i class="bi bi-arrow-clockwise" style="margin-right: 10px;"></i>
          Data restored successfully from backup created on ${new Date(backup.timestamp).toLocaleDateString()}
        </div>
      `;
      document.body.appendChild(notification);
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
        // Refresh the page to reflect restored data
        window.location.reload();
      }, 3000);
    } catch (error) {
      // Track failed restore attempt
      addActivity({
        action: 'Backup Restore Failed',
        details: `Failed to restore backup: ${error.message}`,
        type: 'danger'
      });
      alert('Failed to restore backup: ' + error.message);
    } finally {
      setIsRestoringBackup(false);
    }
  };

  const handleBackupFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (window.confirm(`Are you sure you want to restore from "${file.name}"? This will replace all current data.`)) {
        handleRestoreBackup(file);
      }
    }
    // Reset the input
    event.target.value = '';
  };

  const handleToggleAutoBackup = () => {
    const currentSettings = getAutoBackupSettings();
    if (currentSettings.enabled) {
      disableAutoBackup();
      setAutoBackupSettings(getAutoBackupSettings());
      alert('Auto backup disabled');
    } else {
      setShowBackupSettingsModal(true);
    }
  };

  const handleSaveAutoBackupSettings = (settings) => {
    enableAutoBackup(settings);
    setAutoBackupSettings(getAutoBackupSettings());
    setShowBackupSettingsModal(false);
    alert(`Auto backup enabled - will run ${settings.frequency} at ${settings.time}`);
  };

  // Initialize backup data on component mount
  useEffect(() => {
    setBackupHistory(getBackupHistory());
    setRestoreHistory(getRestoreHistory());
    setAutoBackupSettings(getAutoBackupSettings());
  }, [getBackupHistory, getRestoreHistory, getAutoBackupSettings]);

  // Render different content based on currentPath
  const renderContent = () => {
    switch(currentPath) {
      case 'Dashboard':
        return renderDashboard();
      case "Today's Checkup":
        return renderTodaysCheckup();
      case 'Patient Database':
        return renderPatientDatabase();
      case 'Generate Reports':
        return renderGenerateReports();
      case 'Report History':
        return renderReportHistory();
      case 'Appointments':
        return renderAppointments();
      case 'Manage Inventories':
        return renderManageInventories();
      case 'User Management':
        return renderUserManagement();
      case 'Add User':
        return renderAddUser();
      case 'View/Edit Users':
        return renderViewEditUsers();
      case 'Notification Manager':
        return renderNotificationManager();
      case 'Notification History':
        return renderNotificationHistory();
      default:
        return renderDashboard();
    }
  };

  // Dashboard content
  const renderDashboard = () => (
    <>
      <Tabs
        activeKey={dashboardTabKey}
        onSelect={(k) => setDashboardTabKey(k)}
        className="mb-3"
      >
        <Tab eventKey="analytics" title={
          <span>
            <i className="bi bi-speedometer2 me-2"></i>
            Analytics
          </span>
        }>
          {renderAnalytics()}
        </Tab>
        <Tab eventKey="forecasting" title={
          <span>
            <i className="bi bi-graph-up-arrow me-2"></i>
            Forecasting
          </span>
        }>
          {renderForecastingTab()}
        </Tab>
      </Tabs>
    </>
  );

  // Analytics tab content
  const renderAnalytics = () => (
    <>
      {/* Info Cards */}
      <div className="info-cards">
        <div className="info-card">
          <div className="info-card-icon blue">
            <i className="bi bi-people"></i>
          </div>
          <div className="info-card-content">
            <div className="info-card-value">{patientsData.length}</div>
            <div className="info-card-label">Total Patients</div>
          </div>
        </div>
        
        <div className="info-card clickable" onClick={() => handleNavigation('Family Data')}>
          <div className="info-card-icon purple">
            <i className="bi bi-person-plus"></i>
          </div>
          <div className="info-card-content">
            <div className="info-card-value">{unsortedMembersData.length}</div>
            <div className="info-card-label">Not Yet Sorted</div>
          </div>
        </div>
        
        <div className="info-card">
          <div className="info-card-icon green">
            <i className="bi bi-clipboard-check"></i>
          </div>
          <div className="info-card-content">
            <div className="info-card-value">{dashboardStats.activeCheckups}</div>
            <div className="info-card-label">Active Checkups</div>
          </div>
        </div>
        
        <div className="info-card">
          <div className="info-card-icon orange">
            <i className="bi bi-calendar-event"></i>
          </div>
          <div className="info-card-content">
            <div className="info-card-value">{dashboardStats.pendingAppointments}</div>
            <div className="info-card-label">Pending Appointments</div>
          </div>
        </div>
      </div>

      <div className="dashboard-cards">
        {/* Patient Checkup Trends */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>
              <i className="bi bi-heart-pulse"></i>
              Patient Checkup Trends
            </h3>
            <span>Weekly tracking of completed patient checkups</span>
          </div>
          <div className="card-content">
            <div className="metrics-container">
              <div className="metric-box">
                <h4>Total Checkups</h4>
                <div className="metric-value">{todaysCheckups.length}</div>
                <div className="metric-period">Total to date</div>
              </div>
              <div className="metric-box">
                <h4>Completed</h4>
                <div className="metric-value">{todaysCheckups.filter(c => c.status === 'Completed').length}</div>
                <div className="metric-period">checkups completed</div>
              </div>
              <div className="metric-box">
                <h4>In Progress</h4>
                <div className="metric-value">{todaysCheckups.filter(c => c.status === 'In Progress' || c.status === 'Waiting').length}</div>
                <div className="metric-period">active sessions</div>
              </div>
            </div>
            <div className="chart-container" style={{height: '250px'}}>
              <Bar 
                data={checkupData} 
                options={getChartOptions('bar')}
              />
            </div>
          </div>
        </div>

        {/* Patient Demographics */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>
              <i className="bi bi-pie-chart"></i>
              Patient Demographics
            </h3>
            <span>Distribution of patients by gender and age</span>
          </div>
          <div className="card-content">
            <Row>
              <Col md={6}>
                <div style={{height: '200px'}}>
                  <Pie 
                    data={patientDistributionData} 
                    options={getChartOptions('pie', 'Gender Distribution')}
                  />
                </div>
              </Col>
              <Col md={6}>
                <div style={{height: '200px'}}>
                  <Bar 
                    data={ageDistributionData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        title: {
                          display: true,
                          text: 'Age Distribution'
                        },
                        legend: {
                          display: false
                        }
                      }
                    }} 
                  />
                </div>
              </Col>
            </Row>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>
              <i className="bi bi-calendar-check"></i>
              Upcoming Appointments
            </h3>
            <span>Next 7 days scheduled appointments</span>
          </div>
          <div className="card-content">
            <Table hover size="sm">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const upcomingAppointments = appointmentsData.filter(apt => {
                    const aptDate = new Date(apt.date);
                    const today = new Date();
                    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                    return aptDate >= today && aptDate <= nextWeek && apt.status !== 'Cancelled';
                  }).slice(0, 5);
                  
                  return upcomingAppointments.length > 0 ? upcomingAppointments.map(appointment => (
                    <tr key={appointment.id}>
                      <td>{appointment.patientName}</td>
                      <td>{formatShortDate(appointment.date)}</td>
                      <td>{appointment.time}</td>
                      <td>{appointment.type}</td>
                      <td>
                        <span className={`badge ${appointment.status.toLowerCase().replace(' ', '-')}`}>
                          {appointment.status}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="text-center">No upcoming appointments</td>
                    </tr>
                  );
                })()}
              </tbody>
            </Table>
            <div className="text-center mt-3">
              <Button variant="outline-primary" size="sm" onClick={() => handleNavigation('Appointments')}>
                View All Appointments
              </Button>
            </div>
          </div>
        </div>

        {/* Recent Daily Activity */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>
              <i className="bi bi-activity"></i>
              Recent Daily Activity
            </h3>
          </div>
          <div className="card-content">
            <div className="activity-list">
              {recentActivities.length > 0 ? (
                recentActivities.slice(0, 10).map(activity => (
                  <div key={activity.id} className={`activity-item ${activity.type}`}>
                    <div className="activity-date">
                      {new Date(activity.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="activity-details">
                      <div className="activity-action">{activity.action}</div>
                      {activity.details && <div className="activity-info">{activity.details}</div>}
                    </div>
                    <div className="activity-user">by {activity.user}</div>
                  </div>
                ))
              ) : (
                <div className="no-activities">
                  <i className="bi bi-clock-history"></i>
                  <p>No recent activities</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Today's Checkup content
  const renderTodaysCheckup = () => {
    const filteredTodaysCheckups = todaysCheckups.filter(checkup => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return checkup.patientName.toLowerCase().includes(term) ||
             `PT-${String(checkup.patientId).padStart(4, '0')}`.toLowerCase().includes(term) ||
             checkup.type.toLowerCase().includes(term) ||
             checkup.status.toLowerCase().includes(term);
    });

    return (
      <>
        <div className="patient-management">
          <div className="management-header">
            <h2 className="management-title">
              Today's Checkups - {formatDateWithTime(currentDateTime)}
              <span className="badge bg-primary ms-2">{todaysCheckups.length} Patients</span>
            </h2>
            <div className="management-actions">
              <div className="search-box">
                <i className="bi bi-search search-icon"></i>
                <input 
                  type="text" 
                  placeholder="Search today's checkups..." 
                  className="search-input"
                  value={searchTerm}
                  onChange={handlePatientSearch}
                />
              </div>
              <button 
                className="add-patient-btn" 
                onClick={() => {
                  handleNavigation('Patient Database');
                  setTabKey('members');
                }}
              >
                <i className="bi bi-plus-circle"></i>
                Check In More Patients
              </button>
              <button 
                className="refresh-btn" 
                style={{marginLeft: '8px'}} 
                onClick={() => {
                  setSearchTerm('');
                  alert('Today\'s checkups refreshed!');
                }}
              >
                <i className="bi bi-arrow-clockwise"></i>
                Refresh
              </button>
              <button 
                className="remove-mode-btn"
                style={{
                  marginLeft: '8px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out'
                }}
                onClick={toggleRemoveMode}
                title="Remove Patients from Today's Checkups"
              >
                <i className="bi bi-trash me-1"></i>
                Remove Patients
              </button>
            </div>
          </div>
          
          <div className="table-container">
            {filteredTodaysCheckups.length > 0 ? (
              <Table hover responsive className="data-table">
                <thead>
                  <tr>
                    <th style={{width: '4%', textAlign: 'center'}}>#</th>
                    <th style={{width: '8%', textAlign: 'center'}}>Patient ID</th>
                    <th style={{width: '12%', textAlign: 'center'}}>Name</th>
                    <th style={{width: '10%', textAlign: 'center'}}>Check-in Time</th>
                    <th style={{width: '8%', textAlign: 'center'}}>Appointment</th>
                    <th style={{width: '20%', textAlign: 'center'}}>Purpose</th>
                    <th style={{width: '8%', textAlign: 'center'}}>Status</th>
                    <th style={{width: '30%', textAlign: 'center'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTodaysCheckups.map((checkup, index) => (
                    <tr key={checkup.id}>
                      <td style={{textAlign: 'center'}}>{index + 1}</td>
                      <td style={{textAlign: 'center'}}>PT-{String(checkup.patientId).padStart(4, '0')}</td>
                      <td style={{textAlign: 'center'}}>{checkup.patientName}</td>
                      <td style={{textAlign: 'center'}}>{checkup.checkInTime}</td>
                      <td style={{textAlign: 'center'}}>{checkup.appointmentTime}</td>
                      <td style={{textAlign: 'center'}}>
                        {checkup.vitalSignsComplete ? (
                          <span className={`badge ${
                            checkup.purpose === 'General Checkup' ? 'bg-secondary' : 'bg-primary'
                          }`}>
                            {checkup.purpose}
                          </span>
                        ) : (
                          <Form.Select
                            size="sm"
                            value={availableServices.find(s => s.name === checkup.purpose)?.id || ''}
                            onChange={(e) => handleServiceSelection(checkup.id, parseInt(e.target.value))}
                            disabled={serviceLoading}
                            style={{ fontSize: '0.8rem', minWidth: '140px', maxWidth: '180px', margin: '0 auto' }}
                          >
                            <option value="">Select Service...</option>
                            {availableServices.map(service => (
                              <option key={service.id} value={service.id}>
                                {service.name}
                              </option>
                            ))}
                          </Form.Select>
                        )}
                      </td>
                      <td style={{textAlign: 'center'}}>
                        <span className={`badge ${
                          checkup.status === 'Checked In' ? 'bg-info' :
                          checkup.status === 'Waiting' ? 'bg-warning text-dark' :
                          checkup.status === 'In Progress' ? 'bg-primary' :
                          checkup.status === 'Completed' ? 'bg-success' :
                          'bg-secondary'
                        }`}>
                          {checkup.status}
                        </span>
                      </td>
                      <td className="action-cell" style={{textAlign: 'center'}}>
                        <div className="action-buttons-group d-flex flex-wrap gap-1 justify-content-center">
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="btn-sm px-2 py-1" 
                            onClick={() => handleViewInfo(checkup.patientData)}
                            title="View Patient Info"
                          >
                            <i className="bi bi-eye me-1"></i>
                            View
                          </Button>
                          <Button 
                            variant="outline-warning" 
                            size="sm" 
                            className="btn-sm px-2 py-1" 
                            onClick={() => handleVitalSigns(checkup.patientData)}
                            title="Record Vital Signs"
                          >
                            <i className="bi bi-heart-pulse me-1"></i>
                            Vitals
                          </Button>
                          <Button 
                            variant="outline-info" 
                            size="sm" 
                            className="btn-sm px-2 py-1" 
                            onClick={() => handleVitalSignsHistory(checkup.patientData)}
                            title="Vital Signs History"
                          >
                            <i className="bi bi-clock-history me-1"></i>
                            History
                          </Button>
                          <Button 
                            variant="outline-success" 
                            size="sm" 
                            className="btn-sm px-2 py-1" 
                            onClick={() => handleNotifyDoctor(checkup.patientData)}
                            disabled={!checkup.vitalSignsComplete}
                            title="Notify Doctor"
                          >
                            <i className="bi bi-bell me-1"></i>
                            Notify
                          </Button>
                          <Button 
                            variant="outline-secondary" 
                            size="sm" 
                            className="btn-sm px-2 py-1" 
                            onClick={() => handleUpdateCheckupStatus(checkup.id)}
                            title="Update Status"
                          >
                            <i className="bi bi-check-circle me-1"></i>
                            Update
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <div className="empty-state text-center py-5">
                <i className="bi bi-calendar-x" style={{fontSize: '3rem', color: '#6c757d', marginBottom: '1rem'}}></i>
                <h4 style={{color: '#6c757d', marginBottom: '1rem'}}>No Checkups Scheduled</h4>
                <p style={{color: '#6c757d', marginBottom: '2rem'}}>
                  No patients have been checked in for today yet.
                </p>
                <Button 
                  variant="primary" 
                  onClick={() => {
                    handleNavigation('Patient Database');
                    setTabKey('members');
                  }}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Check In Patients from Database
                </Button>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  // Patient Database content
  const renderPatientDatabase = () => (
    <>
      <div className="patient-management">
        <div className="management-header">
          <h2 className="management-title">Patient Database</h2>
          <div className="management-actions">
            <div className="search-box">
              <i className="bi bi-search search-icon"></i>
              <input 
                type="text" 
                placeholder="Search patient or family..." 
                className="search-input"
                value={searchTerm}
                onChange={handlePatientSearch}
              />
            </div>
            <button className="add-patient-btn" onClick={handleAddPatient}>
              <i className="bi bi-plus-circle"></i>
              Add Patient
            </button>
            <button className="add-patient-btn" style={{marginLeft: '8px', backgroundColor: '#28a745'}} onClick={handleAddFamily}>
              <i className="bi bi-people-fill"></i>
              Add Family
            </button>
            <button className="refresh-btn" style={{marginLeft: '8px'}} onClick={handleRefreshData}>
              <i className="bi bi-arrow-clockwise"></i>
              Refresh Data
            </button>
          </div>
        </div>
        <Tabs
          activeKey={tabKey}
          onSelect={(k) => setTabKey(k)}
          className="mb-3"
        >
          <Tab eventKey="families" title="Family Records">
            <div className="table-container">
              <Table hover responsive className="data-table">
                <thead>
                  <tr>
                    <th 
                      style={{textAlign: 'left', cursor: 'pointer', userSelect: 'none'}}
                      onClick={() => requestSort('id', familySortConfig, setFamilySortConfig)}
                    >
                      Family ID
                      {familySortConfig.key === 'id' && (
                        <i className={`bi bi-arrow-${familySortConfig.direction === 'ascending' ? 'up' : 'down'}`} style={{marginLeft: '5px'}}></i>
                      )}
                    </th>
                    <th 
                      style={{textAlign: 'left', cursor: 'pointer', userSelect: 'none'}}
                      onClick={() => requestSort('familyName', familySortConfig, setFamilySortConfig)}
                    >
                      Family Name
                      {familySortConfig.key === 'familyName' && (
                        <i className={`bi bi-arrow-${familySortConfig.direction === 'ascending' ? 'up' : 'down'}`} style={{marginLeft: '5px'}}></i>
                      )}
                    </th>
                    <th style={{textAlign: 'left'}}>Family Head (Optional)</th>
                    <th 
                      style={{textAlign: 'right', cursor: 'pointer', userSelect: 'none'}}
                      onClick={() => requestSort('memberCount', familySortConfig, setFamilySortConfig)}
                    >
                      Number of Members
                      {familySortConfig.key === 'memberCount' && (
                        <i className={`bi bi-arrow-${familySortConfig.direction === 'ascending' ? 'up' : 'down'}`} style={{marginLeft: '5px'}}></i>
                      )}
                    </th>
                    <th 
                      style={{textAlign: 'left', cursor: 'pointer', userSelect: 'none'}}
                      onClick={() => requestSort('createdAt', familySortConfig, setFamilySortConfig)}
                    >
                      Date Registered
                      {familySortConfig.key === 'createdAt' && (
                        <i className={`bi bi-arrow-${familySortConfig.direction === 'ascending' ? 'up' : 'down'}`} style={{marginLeft: '5px'}}></i>
                      )}
                    </th>
                    <th style={{textAlign: 'center'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFamilies.filter(family => {
                    if (!searchTerm) return true;
                    const term = searchTerm.toLowerCase();
                    const familyName = family.familyName ? family.familyName.toLowerCase() : '';
                    const familyId = family.id ? family.id.toString().toLowerCase() : '';
                    const headOfFamily = getFamilyHead(family).toLowerCase();
                    const contact = getFamilyContact(family);
                    return familyName.includes(term) || 
                           familyId.includes(term) ||
                           headOfFamily.includes(term) ||
                           contact.includes(term);
                  }).map((family) => (
                    <tr key={family.id}>
                      <td style={{textAlign: 'left'}}>{family.id}</td>
                      <td style={{textAlign: 'left'}}>{family.familyName}</td>
                      <td style={{textAlign: 'left'}}>{getFamilyHead(family)}</td>
                      <td style={{textAlign: 'right'}}>{getFamilyMemberCount(family)}</td>
                      <td style={{textAlign: 'left'}}>{formatShortDate(family.createdAt || family.registrationDate)}</td>
                      <td style={{textAlign: 'center'}} className="action-cell">
                        <Button variant="outline-primary" size="sm" onClick={() => handleViewFamily(family)}>View Members</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Tab>
          <Tab eventKey="members" title="Individual Members">
            <div className="table-container">
              <Table hover responsive className="data-table">
                <thead>
                  <tr>
                    <th 
                      style={{textAlign: 'left', cursor: 'pointer', userSelect: 'none'}}
                      onClick={() => requestSort('id', memberSortConfig, setMemberSortConfig)}
                    >
                      Patient ID
                      {memberSortConfig.key === 'id' && (
                        <i className={`bi bi-arrow-${memberSortConfig.direction === 'ascending' ? 'up' : 'down'}`} style={{marginLeft: '5px'}}></i>
                      )}
                    </th>
                    <th 
                      style={{textAlign: 'left', cursor: 'pointer', userSelect: 'none'}}
                      onClick={() => requestSort('familyId', memberSortConfig, setMemberSortConfig)}
                    >
                      Family ID
                      {memberSortConfig.key === 'familyId' && (
                        <i className={`bi bi-arrow-${memberSortConfig.direction === 'ascending' ? 'up' : 'down'}`} style={{marginLeft: '5px'}}></i>
                      )}
                    </th>
                    <th style={{textAlign: 'left', minWidth: '200px', width: '250px'}}>Name</th>
                    <th style={{textAlign: 'right'}}>Age</th>
                    <th style={{textAlign: 'left'}}>Gender</th>
                    <th style={{textAlign: 'left'}}>Contact Number</th>
                    <th 
                      style={{textAlign: 'left', cursor: 'pointer', userSelect: 'none'}}
                      onClick={() => requestSort('lastCheckup', memberSortConfig, setMemberSortConfig)}
                    >
                      Last Checkup
                      {memberSortConfig.key === 'lastCheckup' && (
                        <i className={`bi bi-arrow-${memberSortConfig.direction === 'ascending' ? 'up' : 'down'}`} style={{marginLeft: '5px'}}></i>
                      )}
                    </th>
                    <th style={{textAlign: 'center'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPatients.map((patient) => (
                    <tr key={patient.id}>
                      <td style={{textAlign: 'left'}}>PT-{String(patient.id).padStart(4, '0')}</td>
                      <td style={{textAlign: 'left'}}>{patient.familyId || 'Unassigned'}</td>
                      <td style={{textAlign: 'left', minWidth: '200px', padding: '12px 8px'}}>{getPatientFullName(patient)}</td>
                      <td style={{textAlign: 'right'}}>{getPatientAge(patient)}</td>
                      <td style={{textAlign: 'left'}}>{patient.gender}</td>
                      <td style={{textAlign: 'left'}}>{getPatientContact(patient)}</td>
                      <td style={{textAlign: 'left'}}>{formatShortDate(patient.lastCheckup || patient.createdAt)}</td>
                      <td style={{textAlign: 'center'}} className="action-cell">
                        <div className="d-flex gap-1 justify-content-center">
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            onClick={() => handleViewPatient(patient)}
                          >
                            <i className="bi bi-eye me-1"></i>
                            View Info
                          </Button>
                          <Button 
                            variant="outline-success" 
                            size="sm" 
                            onClick={() => handleAutoLogin(patient)}
                            disabled={todaysCheckups.some(checkup => checkup.patientId === patient.id)}
                          >
                            <i className="bi bi-calendar-plus me-1"></i>
                            {todaysCheckups.some(checkup => checkup.patientId === patient.id) ? 'Checked In' : 'Check In Today'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Tab>
          <Tab eventKey="unsorted" title={`Unsorted Members (${unsortedMembersData.length})`}>
            <div className="unsorted-section">
              <div className="section-header" style={{marginBottom: '20px'}}>
                <div className="section-info">
                  <h4>Patients Without Family Assignment</h4>
                  <p style={{margin: 0, color: '#666'}}>
                    These patients registered through the public form and need to be assigned to families.
                  </p>
                </div>
                <div className="section-actions">
                  <button 
                    className="add-patient-btn"
                    onClick={handleAutosort}
                    disabled={unsortedMembersData.length === 0 || isLoadingAutosort}
                    style={{backgroundColor: '#28a745'}}
                  >
                    <i className="bi bi-magic"></i>
                    {isLoadingAutosort ? 'Autosorting...' : 'AutoSort by Surname'}
                  </button>
                </div>
              </div>
              
              {unsortedMembersData.length === 0 ? (
                <div className="empty-state" style={{textAlign: 'center', padding: '40px', color: '#666'}}>
                  <i className="bi bi-check-circle" style={{fontSize: '48px', marginBottom: '16px', color: '#28a745'}}></i>
                  <h4>All patients are sorted into families!</h4>
                  <p>No unsorted patients found. All patients have been assigned to families.</p>
                </div>
              ) : (
                <div className="table-container">
                  <Table hover responsive className="data-table">
                    <thead>
                      <tr>
                        <th style={{textAlign: 'left'}}>Name</th>
                        <th style={{textAlign: 'left'}}>Gender</th>
                        <th style={{textAlign: 'right'}}>Age</th>
                        <th style={{textAlign: 'left'}}>Contact</th>
                        <th style={{textAlign: 'left'}}>Registration Date</th>
                        <th style={{textAlign: 'center'}}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unsortedMembersData.map(patient => (
                        <tr key={patient.id}>
                          <td style={{textAlign: 'left'}}>
                            <strong>{patient.firstName} {patient.lastName}</strong>
                          </td>
                          <td style={{textAlign: 'left'}}>{patient.gender}</td>
                          <td style={{textAlign: 'right'}}>{patient.age || 'N/A'}</td>
                          <td style={{textAlign: 'left'}}>{patient.contactNumber || 'N/A'}</td>
                          <td style={{textAlign: 'left'}}>
                            {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td style={{textAlign: 'center'}} className="action-cell">
                            <Button 
                              variant="outline-success" 
                              size="sm" 
                              onClick={() => handleOpenAssignFamilyModal(patient)}
                            >
                              Assign to Family
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>
          </Tab>
        </Tabs>
      </div>
    </>
  );

  const renderGenerateReports = () => {
    // Report generation functions
    const generatePatientStatisticsReport = (format = 'pdf') => {
      const reportData = {
        title: 'Patient Statistics Report',
        dateGenerated: new Date().toLocaleDateString(),
        data: {
          totalPatients: patientsData.length,
          totalFamilies: familiesData.length,
          activeCheckups: todaysCheckups.length,
          completedToday: todaysCheckups.filter(c => c.status === 'Completed').length,
          malePatients: patientsData.filter(p => p.gender === 'Male').length,
          femalePatients: patientsData.filter(p => p.gender === 'Female').length,
          averageAge: patientsData.reduce((sum, p) => sum + (parseInt(p.age) || 0), 0) / patientsData.length
        }
      };

      if (format === 'pdf') {
        generatePDFReport(reportData, 'patient-statistics');
      } else if (format === 'excel') {
        generateExcelReport(reportData, 'patient-statistics');
      }
    };

    const generateCheckupTrendsReport = (format = 'pdf') => {
      const reportData = {
        title: 'Checkup Trends Report',
        dateGenerated: new Date().toLocaleDateString(),
        data: {
          weeklyTotal: todaysCheckups.length * 7, // Simulated
          dailyAverage: todaysCheckups.length,
          monthlyTrend: 'Increasing by 15%',
          peakHours: '10:00 AM - 12:00 PM',
          checkupTypes: {
            consultation: todaysCheckups.filter(c => c.type === 'Consultation').length,
            followUp: todaysCheckups.filter(c => c.type === 'Follow-up').length,
            checkUp: todaysCheckups.filter(c => c.type === 'Check-up').length
          }
        }
      };

      if (format === 'pdf') {
        generatePDFReport(reportData, 'checkup-trends');
      } else if (format === 'excel') {
        generateExcelReport(reportData, 'checkup-trends');
      }
    };

    const generateDemographicsReport = (format = 'pdf') => {
      const reportData = {
        title: 'Demographics Report',
        dateGenerated: new Date().toLocaleDateString(),
        data: {
          ageGroups: {
            '0-18': patientsData.filter(p => parseInt(p.age) <= 18).length,
            '19-35': patientsData.filter(p => parseInt(p.age) >= 19 && parseInt(p.age) <= 35).length,
            '36-55': patientsData.filter(p => parseInt(p.age) >= 36 && parseInt(p.age) <= 55).length,
            '56+': patientsData.filter(p => parseInt(p.age) > 55).length
          },
          genderDistribution: {
            male: patientsData.filter(p => p.gender === 'Male').length,
            female: patientsData.filter(p => p.gender === 'Female').length
          },
          familyDistribution: {
            averageFamilySize: familiesData.length > 0 ? Math.round(patientsData.length / familiesData.length) : 0,
            largestFamily: Math.max(...familiesData.map(f => f.memberCount || 0)),
            singleMembers: familiesData.filter(f => (f.memberCount || 0) === 1).length
          }
        }
      };

      if (format === 'pdf') {
        generatePDFReport(reportData, 'demographics');
      } else if (format === 'excel') {
        generateExcelReport(reportData, 'demographics');
      }
    };

    const generateAppointmentAnalysisReport = (format = 'pdf') => {
      const reportData = {
        title: 'Appointment Analysis Report',
        dateGenerated: new Date().toLocaleDateString(),
        data: {
          totalAppointments: appointmentsData.length,
          scheduledToday: todaysCheckups.length,
          completedThisWeek: todaysCheckups.filter(c => c.status === 'Completed').length,
          cancelledThisWeek: 2, // Simulated
          averageWaitTime: '15 minutes',
          mostCommonType: 'Check-up',
          busyDays: ['Monday', 'Wednesday', 'Friday']
        }
      };

      if (format === 'pdf') {
        generatePDFReport(reportData, 'appointment-analysis');
      } else if (format === 'excel') {
        generateExcelReport(reportData, 'appointment-analysis');
      }
    };

    const generatePDFReport = (reportData, reportType) => {
      // Enhanced PDF content with better formatting
      let content = `
=================================================================
                    ${reportData.title}
=================================================================
Generated: ${reportData.dateGenerated}
Report Quality: ${reportData.summary?.quality || 'Standard'}
Report Period: ${reportData.summary?.reportPeriod || 'Last 30 Days'}

=================================================================
                      EXECUTIVE SUMMARY
=================================================================
`;

      if (reportData.summary) {
        content += `
Total Patients: ${reportData.summary.totalPatients || 0}
Total Families: ${reportData.summary.totalFamilies || 0}
Active Checkups: ${reportData.summary.activeCheckups || 0}
Total Appointments: ${reportData.summary.totalAppointments || 0}
`;
      }

      if (reportData.patientStatistics) {
        content += `
=================================================================
                    PATIENT STATISTICS
=================================================================
Total Patients: ${reportData.patientStatistics.totalPatients}
Male Patients: ${reportData.patientStatistics.malePatients}
Female Patients: ${reportData.patientStatistics.femalePatients}
Average Age: ${reportData.patientStatistics.averageAge} years
`;
      }

      if (reportData.demographics?.ageGroups) {
        content += `
=================================================================
                    DEMOGRAPHICS BREAKDOWN
=================================================================
Age Distribution:
- Children (0-18): ${reportData.demographics.ageGroups.children}
- Adults (19-65): ${reportData.demographics.ageGroups.adults}
- Seniors (65+): ${reportData.demographics.ageGroups.seniors}
`;
      }

      if (reportData.checkupTrends) {
        content += `
=================================================================
                    CHECKUP TRENDS
=================================================================
Total Checkups: ${reportData.checkupTrends.totalCheckups}
Completed: ${reportData.checkupTrends.completedCheckups}
Pending: ${reportData.checkupTrends.pendingCheckups}
In Progress: ${reportData.checkupTrends.inProgressCheckups}
`;
      }

      if (reportData.appointments) {
        content += `
=================================================================
                    APPOINTMENT ANALYSIS
=================================================================
Scheduled Checkups: ${reportData.appointments.scheduled}
Completed Today: ${reportData.appointments.completed}
Pending: ${reportData.appointments.pending}
Total Appointments: ${reportData.appointments.totalAppointments}
`;
      }

      content += `
=================================================================
Report generated by Health Record System Management v2.0
© 2025 Healthcare Solutions
=================================================================
`;
      
      // Create blob and download
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    };

    const generateExcelReport = (reportData, reportType) => {
      // Enhanced CSV content with proper structure
      let csvContent = `"${reportData.title}"\n`;
      csvContent += `"Generated","${reportData.dateGenerated}"\n`;
      csvContent += `"Quality","${reportData.summary?.quality || 'Standard'}"\n`;
      csvContent += `"Period","${reportData.summary?.reportPeriod || 'Last 30 Days'}"\n\n`;
      
      // Executive Summary
      csvContent += `"EXECUTIVE SUMMARY"\n`;
      if (reportData.summary) {
        csvContent += `"Metric","Value"\n`;
        csvContent += `"Total Patients","${reportData.summary.totalPatients || 0}"\n`;
        csvContent += `"Total Families","${reportData.summary.totalFamilies || 0}"\n`;
        csvContent += `"Active Checkups","${reportData.summary.activeCheckups || 0}"\n`;
        csvContent += `"Total Appointments","${reportData.summary.totalAppointments || 0}"\n\n`;
      }
      
      // Patient Statistics
      if (reportData.patientStatistics) {
        csvContent += `"PATIENT STATISTICS"\n`;
        csvContent += `"Category","Count"\n`;
        csvContent += `"Total Patients","${reportData.patientStatistics.totalPatients}"\n`;
        csvContent += `"Male Patients","${reportData.patientStatistics.malePatients}"\n`;
        csvContent += `"Female Patients","${reportData.patientStatistics.femalePatients}"\n`;
        csvContent += `"Average Age","${reportData.patientStatistics.averageAge}"\n\n`;
      }
      
      // Demographics
      if (reportData.demographics?.ageGroups) {
        csvContent += `"AGE DEMOGRAPHICS"\n`;
        csvContent += `"Age Group","Count"\n`;
        csvContent += `"Children (0-18)","${reportData.demographics.ageGroups.children}"\n`;
        csvContent += `"Adults (19-65)","${reportData.demographics.ageGroups.adults}"\n`;
        csvContent += `"Seniors (65+)","${reportData.demographics.ageGroups.seniors}"\n\n`;
      }
      
      // Checkup Trends
      if (reportData.checkupTrends) {
        csvContent += `"CHECKUP TRENDS"\n`;
        csvContent += `"Status","Count"\n`;
        csvContent += `"Total Checkups","${reportData.checkupTrends.totalCheckups}"\n`;
        csvContent += `"Completed","${reportData.checkupTrends.completedCheckups}"\n`;
        csvContent += `"Pending","${reportData.checkupTrends.pendingCheckups}"\n`;
        csvContent += `"In Progress","${reportData.checkupTrends.inProgressCheckups}"\n\n`;
      }
      
      // Appointments
      if (reportData.appointments) {
        csvContent += `"APPOINTMENT ANALYSIS"\n`;
        csvContent += `"Type","Count"\n`;
        csvContent += `"Scheduled","${reportData.appointments.scheduled}"\n`;
        csvContent += `"Completed","${reportData.appointments.completed}"\n`;
        csvContent += `"Pending","${reportData.appointments.pending}"\n`;
        csvContent += `"Total","${reportData.appointments.totalAppointments}"\n`;
      }
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      alert(`${reportData.title} (Excel format) has been generated and downloaded!`);
    };

    const exportAllReports = () => {
      // Generate all reports in the selected format
      const format = reportOptions.format;
      
      setTimeout(() => generatePatientStatisticsReport(format), 100);
      setTimeout(() => generateCheckupTrendsReport(format), 500);
      setTimeout(() => generateDemographicsReport(format), 900);
      setTimeout(() => generateAppointmentAnalysisReport(format), 1300);
      
      alert(`Generating all reports in ${format.toUpperCase()} format. Downloads will start shortly...`);
    };

    const generateComprehensiveReport = () => {
      const currentCheckups = sharedCheckupsData || [];
      const comprehensiveData = {
        title: 'Comprehensive Health Center Report',
        dateGenerated: new Date().toLocaleDateString(),
        summary: {
          totalPatients: patientsData.length,
          totalFamilies: familiesData.length,
          activeCheckups: currentCheckups.length,
          totalAppointments: appointmentsData.length,
          reportPeriod: reportOptions.dateRange,
          quality: reportOptions.quality || 'standard'
        },
        patientStatistics: {
          totalPatients: patientsData.length,
          malePatients: patientsData.filter(p => p.gender === 'Male').length,
          femalePatients: patientsData.filter(p => p.gender === 'Female').length,
          averageAge: patientsData.length > 0 ? 
            Math.round(patientsData.reduce((sum, p) => sum + (parseInt(p.age) || 0), 0) / patientsData.length) : 0
        },
        checkupTrends: {
          totalCheckups: currentCheckups.length,
          completedCheckups: currentCheckups.filter(c => c.status === 'Completed').length,
          pendingCheckups: currentCheckups.filter(c => c.status === 'Waiting').length,
          inProgressCheckups: currentCheckups.filter(c => c.status === 'In Progress').length
        },
        demographics: {
          ageGroups: {
            children: patientsData.filter(p => parseInt(p.age) <= 18).length,
            adults: patientsData.filter(p => parseInt(p.age) > 18 && parseInt(p.age) <= 65).length,
            seniors: patientsData.filter(p => parseInt(p.age) > 65).length
          },
          genderDistribution: {
            male: patientsData.filter(p => p.gender === 'Male').length,
            female: patientsData.filter(p => p.gender === 'Female').length,
            other: patientsData.filter(p => p.gender && p.gender !== 'Male' && p.gender !== 'Female').length
          }
        },
        appointments: {
          scheduled: currentCheckups.length,
          completed: currentCheckups.filter(c => c.status === 'Completed').length,
          pending: currentCheckups.filter(c => c.status === 'Waiting').length,
          totalAppointments: appointmentsData.length
        },
        includeCharts: reportOptions.includeCharts
      };

      // Show loading state
      const loadingNotification = document.createElement('div');
      loadingNotification.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #4CAF50; color: white; padding: 15px 20px; border-radius: 8px; z-index: 9999; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
          <i class="bi bi-hourglass-split" style="margin-right: 10px;"></i>
          Generating ${reportOptions.quality} ${reportOptions.format.toUpperCase()} report...
        </div>
      `;
      document.body.appendChild(loadingNotification);

      // Generate report based on format
      setTimeout(() => {
        if (reportOptions.format === 'pdf') {
          generatePDFReport(comprehensiveData, 'comprehensive');
        } else {
          generateExcelReport(comprehensiveData, 'comprehensive');
        }
        
        // Remove loading notification
        document.body.removeChild(loadingNotification);
        
        // Show success notification
        const successNotification = document.createElement('div');
        successNotification.innerHTML = `
          <div style="position: fixed; top: 20px; right: 20px; background: #2196F3; color: white; padding: 15px 20px; border-radius: 8px; z-index: 9999; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
            <i class="bi bi-check-circle" style="margin-right: 10px;"></i>
            Report generated successfully!
          </div>
        `;
        document.body.appendChild(successNotification);
        
        setTimeout(() => {
          if (document.body.contains(successNotification)) {
            document.body.removeChild(successNotification);
          }
        }, 3000);
      }, 1000);
    };

    return (
      <div className="reports-management">
        <div className="management-header">
          <h2 className="management-title">
            <i className="bi bi-file-earmark-bar-graph me-2"></i>
            Generate Reports
          </h2>
          <div className="management-actions">
            <button className="add-patient-btn" onClick={exportAllReports}>
              <i className="bi bi-download"></i>
              Export All Reports
            </button>
          </div>
        </div>

        {/* Modern Report Generation Dashboard */}
        <div className="report-generation-dashboard" style={{
          background: 'white',
          borderRadius: '15px',
          padding: '30px',
          marginBottom: '30px',
          color: '#333',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          border: '1px solid #e0e0e0'
        }}>
          <div className="dashboard-header" style={{textAlign: 'center', marginBottom: '30px'}}>
            <h2 style={{margin: '0 0 10px 0', fontSize: '28px', fontWeight: '600', color: '#2c3e50'}}>
              <i className="bi bi-graph-up-arrow" style={{marginRight: '10px', color: '#3498db'}}></i>
              Report Generation Center
            </h2>
            <p style={{margin: '0', opacity: '0.7', fontSize: '16px', color: '#7f8c8d'}}>
              Generate comprehensive reports with advanced filtering and export options
            </p>
          </div>

          {/* Report Configuration Panel */}
          <div className="report-config-panel" style={{
            background: '#f8f9fa',
            borderRadius: '12px',
            padding: '25px',
            marginBottom: '25px',
            border: '1px solid #e9ecef'
          }}>
            <div className="config-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '25px'
            }}>
              {/* Date Range Selection */}
              <div className="config-group">
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px', color: '#2c3e50'}}>
                  <i className="bi bi-calendar-range" style={{marginRight: '8px', color: '#3498db'}}></i>
                  Date Range
                </label>
                <select 
                  className="form-select" 
                  value={reportOptions.dateRange}
                  onChange={(e) => setReportOptions({...reportOptions, dateRange: e.target.value})}
                  style={{
                    background: 'white',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    color: '#333'
                  }}
                >
                  <option value="last7days">Last 7 Days</option>
                  <option value="last30days">Last 30 Days</option>
                  <option value="last90days">Last 90 Days</option>
                  <option value="last6months">Last 6 Months</option>
                  <option value="lastyear">Last Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* Report Format Selection */}
              <div className="config-group">
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px', color: '#2c3e50'}}>
                  <i className="bi bi-file-earmark" style={{marginRight: '8px', color: '#3498db'}}></i>
                  Export Format
                </label>
                <select 
                  className="form-select"
                  value={reportOptions.format}
                  onChange={(e) => setReportOptions({...reportOptions, format: e.target.value})}
                  style={{
                    background: 'white',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    color: '#333'
                  }}
                >
                  <option value="pdf">📄 PDF Document</option>
                  <option value="excel">📊 Excel Spreadsheet</option>
                  <option value="csv">📋 CSV File</option>
                </select>
              </div>

              {/* Report Quality */}
              <div className="config-group">
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px', color: '#2c3e50'}}>
                  <i className="bi bi-star" style={{marginRight: '8px', color: '#3498db'}}></i>
                  Report Quality
                </label>
                <select 
                  className="form-select"
                  value={reportOptions.quality || 'standard'}
                  onChange={(e) => setReportOptions({...reportOptions, quality: e.target.value})}
                  style={{
                    background: 'white',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    color: '#333'
                  }}
                >
                  <option value="basic">Basic</option>
                  <option value="standard">Standard</option>
                  <option value="detailed">Detailed</option>
                  <option value="comprehensive">Comprehensive</option>
                </select>
              </div>
            </div>

            {/* Chart Inclusions */}
            <div className="chart-options" style={{marginBottom: '25px'}}>
              <h4 style={{margin: '0 0 15px 0', fontSize: '16px', fontWeight: '500', color: '#2c3e50'}}>
                <i className="bi bi-bar-chart" style={{marginRight: '8px', color: '#3498db'}}></i>
                Include Visual Analytics
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px'
              }}>
                {[
                  {key: 'demographics', label: 'Patient Demographics', icon: 'people'},
                  {key: 'trends', label: 'Health Trends', icon: 'graph-up'},
                  {key: 'appointments', label: 'Appointment Analytics', icon: 'calendar-check'},
                  {key: 'medications', label: 'Medication Reports', icon: 'capsule'},
                  {key: 'financial', label: 'Financial Summary', icon: 'currency-dollar'},
                  {key: 'performance', label: 'Performance Metrics', icon: 'speedometer2'}
                ].map(chart => (
                  <label key={chart.key} style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    padding: '10px',
                    background: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    transition: 'all 0.3s'
                  }}>
                    <input 
                      type="checkbox" 
                      checked={reportOptions.includeCharts[chart.key] || false}
                      onChange={(e) => setReportOptions({
                        ...reportOptions, 
                        includeCharts: {...reportOptions.includeCharts, [chart.key]: e.target.checked}
                      })}
                      style={{marginRight: '10px', transform: 'scale(1.2)'}}
                    />
                    <i className={`bi bi-${chart.icon}`} style={{marginRight: '8px', fontSize: '16px', color: '#3498db'}}></i>
                    <span style={{fontSize: '14px', color: '#2c3e50'}}>{chart.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Action Buttons - More Boxy Style */}
            <div className="action-buttons" style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '15px',
              justifyContent: 'center'
            }}>
              <button 
                className="btn-generate-comprehensive" 
                onClick={generateComprehensiveReport}
                style={{
                  background: '#28a745',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '15px 30px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '0 2px 8px rgba(40, 167, 69, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
                onMouseOver={(e) => e.target.style.background = '#218838'}
                onMouseOut={(e) => e.target.style.background = '#28a745'}
              >
                <i className="bi bi-file-earmark-bar-graph"></i>
                Generate Comprehensive Report
              </button>
              
              <button 
                className="btn-quick-export" 
                onClick={exportAllReports}
                style={{
                  background: '#007bff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '15px 30px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '0 2px 8px rgba(0, 123, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
                onMouseOver={(e) => e.target.style.background = '#0056b3'}
                onMouseOut={(e) => e.target.style.background = '#007bff'}
              >
                <i className="bi bi-download"></i>
                Quick Export All
              </button>

              <button 
                className="btn-preview" 
                onClick={() => alert('Report preview functionality coming soon!')}
                style={{
                  background: '#fd7e14',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '15px 30px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '0 2px 8px rgba(253, 126, 20, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
                onMouseOver={(e) => e.target.style.background = '#e8590c'}
                onMouseOut={(e) => e.target.style.background = '#fd7e14'}
              >
                <i className="bi bi-eye"></i>
                Preview Report
              </button>
            </div>
          </div>
        </div>

        {/* Report Generation Cards */}
        <div className="reports-grid">
          {/* Patient Statistics Report */}
          <div className="report-card">
            <div className="report-header">
              <div className="report-icon stats">
                <i className="bi bi-people"></i>
              </div>
              <div className="report-info">
                <h3>Patient Statistics Report</h3>
                <p>Comprehensive overview of patient demographics and statistics</p>
              </div>
            </div>
            <div className="report-content">
              <div className="report-preview">
                <div className="preview-stats">
                  <div className="stat-item">
                    <span className="stat-label">Total Patients:</span>
                    <span className="stat-value">{patientsData.length}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Active Checkups:</span>
                    <span className="stat-value">{sharedCheckupsData.length}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Total Families:</span>
                    <span className="stat-value">{familiesData.length}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Completed Today:</span>
                    <span className="stat-value">{todaysCheckups.filter(c => c.status === 'Completed').length}</span>
                  </div>
                </div>
              </div>
              <div className="report-actions">
                <button className="btn-generate" onClick={() => generatePatientStatisticsReport('pdf')}>
                  <i className="bi bi-file-earmark-pdf"></i>
                  Generate PDF
                </button>
                <button className="btn-generate excel" onClick={() => generatePatientStatisticsReport('excel')}>
                  <i className="bi bi-file-earmark-excel"></i>
                  Generate Excel
                </button>
              </div>
            </div>
          </div>

          {/* Checkup Trends Report */}
          <div className="report-card">
            <div className="report-header">
              <div className="report-icon trends">
                <i className="bi bi-graph-up"></i>
              </div>
              <div className="report-info">
                <h3>Checkup Trends Report</h3>
                <p>Weekly and monthly patient checkup trends analysis</p>
              </div>
            </div>
            <div className="report-content">
              <div className="report-preview">
                <div className="chart-mini" style={{height: '120px'}}>
                  <Bar 
                    data={checkupData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        title: { display: false }
                      },
                      scales: {
                        x: { display: false },
                        y: { display: false }
                      }
                    }} 
                  />
                </div>
                <div className="trend-summary">
                  <span>Weekly Total: {todaysCheckups.length * 7} checkups</span>
                  <span>Daily Average: {todaysCheckups.length} checkups</span>
                </div>
              </div>
              <div className="report-actions">
                <button className="btn-generate" onClick={() => generateCheckupTrendsReport('pdf')}>
                  <i className="bi bi-file-earmark-pdf"></i>
                  Generate PDF
                </button>
                <button className="btn-generate excel" onClick={() => generateCheckupTrendsReport('excel')}>
                  <i className="bi bi-file-earmark-excel"></i>
                  Generate Excel
                </button>
              </div>
            </div>
          </div>

          {/* Demographics Report */}
          <div className="report-card">
            <div className="report-header">
              <div className="report-icon demographics">
                <i className="bi bi-pie-chart"></i>
              </div>
              <div className="report-info">
                <h3>Demographics Report</h3>
                <p>Patient demographics breakdown by age and gender</p>
              </div>
            </div>
            <div className="report-content">
              <div className="report-preview">
                <div className="chart-mini" style={{height: '120px'}}>
                  <Pie 
                    data={patientDistributionData} 
                    options={getChartOptions('pie', '', false)}
                  />
                </div>
                <div className="demo-summary">
                  <span>Male: {patientsData.filter(p => p.gender === 'Male').length} patients</span>
                  <span>Female: {patientsData.filter(p => p.gender === 'Female').length} patients</span>
                </div>
              </div>
              <div className="report-actions">
                <button className="btn-generate" onClick={() => generateDemographicsReport('pdf')}>
                  <i className="bi bi-file-earmark-pdf"></i>
                  Generate PDF
                </button>
                <button className="btn-generate excel" onClick={() => generateDemographicsReport('excel')}>
                  <i className="bi bi-file-earmark-excel"></i>
                  Generate Excel
                </button>
              </div>
            </div>
          </div>

          {/* Appointment Analysis Report */}
          <div className="report-card">
            <div className="report-header">
              <div className="report-icon appointments">
                <i className="bi bi-calendar-check"></i>
              </div>
              <div className="report-info">
                <h3>Appointment Analysis</h3>
                <p>Detailed analysis of appointment patterns and scheduling</p>
              </div>
            </div>
            <div className="report-content">
              <div className="report-preview">
                <div className="appointment-stats">
                  <div className="appt-item">
                    <span className="appt-type">Total Scheduled:</span>
                    <span className="appt-count">{appointmentsData.length}</span>
                  </div>
                  <div className="appt-item">
                    <span className="appt-type">Today's Checkups:</span>
                    <span className="appt-count">{todaysCheckups.length}</span>
                  </div>
                  <div className="appt-item">
                    <span className="appt-type">Completed:</span>
                    <span className="appt-count">{todaysCheckups.filter(c => c.status === 'Completed').length}</span>
                  </div>
                  <div className="appt-item">
                    <span className="appt-type">Pending:</span>
                    <span className="appt-count">{todaysCheckups.filter(c => c.status === 'Waiting').length}</span>
                  </div>
                </div>
              </div>
              <div className="report-actions">
                <button className="btn-generate" onClick={() => generateAppointmentAnalysisReport('pdf')}>
                  <i className="bi bi-file-earmark-pdf"></i>
                  Generate PDF
                </button>
                <button className="btn-generate excel" onClick={() => generateAppointmentAnalysisReport('excel')}>
                  <i className="bi bi-file-earmark-excel"></i>
                  Generate Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderReportHistory = () => (
    <div className="reports-history">
      <div className="management-header">
        <h2 className="management-title">
          <i className="bi bi-clock-history me-2"></i>
          Report History
        </h2>
        <div className="management-actions">
          <div className="search-box">
            <i className="bi bi-search search-icon"></i>
            <input
              type="text"
              className="search-input"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="add-patient-btn" onClick={() => alert('Bulk download feature coming soon!')}>
            <i className="bi bi-download"></i>
            Bulk Download
          </button>
        </div>
      </div>

      {/* Filter Options */}
      <div className="filter-section">
        <div className="filter-group">
          <label>Report Type:</label>
          <select className="form-select">
            <option value="all">All Reports</option>
            <option value="patient-stats">Patient Statistics</option>
            <option value="checkup-trends">Checkup Trends</option>
            <option value="demographics">Demographics</option>
            <option value="appointments">Appointment Analysis</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Date Generated:</label>
          <select className="form-select">
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Format:</label>
          <select className="form-select">
            <option value="all">All Formats</option>
            <option value="pdf">PDF Only</option>
            <option value="excel">Excel Only</option>
            <option value="csv">CSV Only</option>
          </select>
        </div>
      </div>

      {/* Report History Table */}
      <div className="history-table-container">
        <table className="history-table">
          <thead>
            <tr>
              <th>Report Name</th>
              <th>Type</th>
              <th>Generated Date</th>
              <th>Generated By</th>
              <th>Size</th>
              <th>Format</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div className="report-name">
                  <i className="bi bi-file-earmark-pdf text-danger"></i>
                  <span>Patient Statistics Report - July 2024</span>
                </div>
              </td>
              <td><span className="report-type stats">Patient Statistics</span></td>
              <td>July 20, 2024 - 2:30 PM</td>
              <td>Admin User</td>
              <td>2.4 MB</td>
              <td><span className="format-badge pdf">PDF</span></td>
              <td><span className="status-badge completed">Completed</span></td>
              <td className="action-cell">
                <button className="action-btn download" title="Download">
                  <i className="bi bi-download"></i>
                </button>
                <button className="action-btn view" title="Preview">
                  <i className="bi bi-eye"></i>
                </button>
                <button className="action-btn share" title="Share">
                  <i className="bi bi-share"></i>
                </button>
              </td>
            </tr>
            <tr>
              <td>
                <div className="report-name">
                  <i className="bi bi-file-earmark-excel text-success"></i>
                  <span>Checkup Trends Analysis - Q2 2024</span>
                </div>
              </td>
              <td><span className="report-type trends">Checkup Trends</span></td>
              <td>July 19, 2024 - 4:15 PM</td>
              <td>Admin User</td>
              <td>1.8 MB</td>
              <td><span className="format-badge excel">Excel</span></td>
              <td><span className="status-badge completed">Completed</span></td>
              <td className="action-cell">
                <button className="action-btn download" title="Download">
                  <i className="bi bi-download"></i>
                </button>
                <button className="action-btn view" title="Preview">
                  <i className="bi bi-eye"></i>
                </button>
                <button className="action-btn share" title="Share">
                  <i className="bi bi-share"></i>
                </button>
              </td>
            </tr>
            <tr>
              <td>
                <div className="report-name">
                  <i className="bi bi-file-earmark-pdf text-danger"></i>
                  <span>Demographics Report - Monthly</span>
                </div>
              </td>
              <td><span className="report-type demographics">Demographics</span></td>
              <td>July 18, 2024 - 10:45 AM</td>
              <td>Dr. Santos</td>
              <td>3.1 MB</td>
              <td><span className="format-badge pdf">PDF</span></td>
              <td><span className="status-badge completed">Completed</span></td>
              <td className="action-cell">
                <button className="action-btn download" title="Download">
                  <i className="bi bi-download"></i>
                </button>
                <button className="action-btn view" title="Preview">
                  <i className="bi bi-eye"></i>
                </button>
                <button className="action-btn share" title="Share">
                  <i className="bi bi-share"></i>
                </button>
              </td>
            </tr>
            <tr>
              <td>
                <div className="report-name">
                  <i className="bi bi-file-earmark-text text-warning"></i>
                  <span>Appointment Analysis - Weekly</span>
                </div>
              </td>
              <td><span className="report-type appointments">Appointments</span></td>
              <td>July 17, 2024 - 3:20 PM</td>
              <td>Admin User</td>
              <td>892 KB</td>
              <td><span className="format-badge csv">CSV</span></td>
              <td><span className="status-badge completed">Completed</span></td>
              <td className="action-cell">
                <button className="action-btn download" title="Download">
                  <i className="bi bi-download"></i>
                </button>
                <button className="action-btn view" title="Preview">
                  <i className="bi bi-eye"></i>
                </button>
                <button className="action-btn share" title="Share">
                  <i className="bi bi-share"></i>
                </button>
              </td>
            </tr>
            <tr>
              <td>
                <div className="report-name">
                  <i className="bi bi-file-earmark-excel text-success"></i>
                  <span>Comprehensive Health Report - June 2024</span>
                </div>
              </td>
              <td><span className="report-type comprehensive">Comprehensive</span></td>
              <td>July 16, 2024 - 1:10 PM</td>
              <td>Dr. Martinez</td>
              <td>5.7 MB</td>
              <td><span className="format-badge excel">Excel</span></td>
              <td><span className="status-badge processing">Processing</span></td>
              <td className="action-cell">
                <button className="action-btn download disabled" title="Download" disabled>
                  <i className="bi bi-download"></i>
                </button>
                <button className="action-btn view disabled" title="Preview" disabled>
                  <i className="bi bi-eye"></i>
                </button>
                <button className="action-btn cancel" title="Cancel">
                  <i className="bi bi-x-circle"></i>
                </button>
              </td>
            </tr>
            <tr>
              <td>
                <div className="report-name">
                  <i className="bi bi-file-earmark-pdf text-danger"></i>
                  <span>Patient Demographics - Age Distribution</span>
                </div>
              </td>
              <td><span className="report-type demographics">Demographics</span></td>
              <td>July 15, 2024 - 11:30 AM</td>
              <td>Admin User</td>
              <td>1.3 MB</td>
              <td><span className="format-badge pdf">PDF</span></td>
              <td><span className="status-badge completed">Completed</span></td>
              <td className="action-cell">
                <button className="action-btn download" title="Download">
                  <i className="bi bi-download"></i>
                </button>
                <button className="action-btn view" title="Preview">
                  <i className="bi bi-eye"></i>
                </button>
                <button className="action-btn share" title="Share">
                  <i className="bi bi-share"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* History Statistics */}
      <div className="history-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="bi bi-file-earmark-bar-graph"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">24</div>
            <div className="stat-label">Total Reports Generated</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="bi bi-download"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">18</div>
            <div className="stat-label">Downloaded This Month</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="bi bi-hdd"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">45.2 MB</div>
            <div className="stat-label">Total Storage Used</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="bi bi-clock"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">2.3 min</div>
            <div className="stat-label">Avg Generation Time</div>
          </div>
        </div>
      </div>
    </div>
  );

  // Helper functions for appointment management - memoized to prevent re-renders
  const formatLongDate = useCallback((date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }, []);

  // Calendar navigation functions
  const previousMonth = useCallback(() => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  }, []);

  // Generate calendar days for the current month
  const generateCalendarDays = useCallback((date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const today = new Date();
    
    // Get first day of the month and calculate starting date of calendar
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    // Generate 42 days (6 weeks * 7 days) for a complete calendar grid
    for (let i = 0; i < 42; i++) {
      const dayDate = new Date(currentDate);
      const isCurrentMonth = dayDate.getMonth() === month;
      const isToday = dayDate.toDateString() === today.toDateString();
      
      // Get appointments for this day
      const dayAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate.toDateString() === dayDate.toDateString();
      });
      
      days.push({
        day: dayDate.getDate(),
        date: dayDate,
        isToday,
        isOtherMonth: !isCurrentMonth,
        hasAppointments: dayAppointments.length > 0,
        appointmentCount: dayAppointments.length,
        appointments: dayAppointments
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }, [appointments]);

  const getTodaysAppointments = useMemo(() => {
    const today = '2025-08-04'; // Current date
    return appointments.filter(apt => apt.date === today);
  }, [appointments]);

  const getUpcomingAppointments = useMemo(() => {
    const today = new Date('2025-08-04');
    return appointments.filter(apt => new Date(apt.date) > today);
  }, [appointments]);

  const getAppointmentHistory = useMemo(() => {
    const today = new Date('2025-08-04');
    return appointments.filter(apt => 
      new Date(apt.date) < today || 
      apt.status === 'Completed' || 
      apt.status === 'Cancelled'
    );
  }, [appointments]);

  const getFilteredAppointments = useCallback((appointmentList) => {
    if (!appointmentSearchTerm) return appointmentList;
    const term = appointmentSearchTerm.toLowerCase();
    return appointmentList.filter(appointment => 
      appointment.patientName.toLowerCase().includes(term) ||
      appointment.type.toLowerCase().includes(term) ||
      appointment.doctor.toLowerCase().includes(term) ||
      appointment.status.toLowerCase().includes(term) ||
      `PT-${String(appointment.patientId).padStart(4, '0')}`.toLowerCase().includes(term)
    );
  }, [appointmentSearchTerm]);

  const getFilteredPatientsForSchedule = useMemo(() => {
    if (!quickSchedulePatientSearch) return patients;
    const term = quickSchedulePatientSearch.toLowerCase();
    return patients.filter(patient => {
      const fullName = getPatientFullName(patient).toLowerCase();
      const patientId = `PT-${String(patient.id).padStart(4, '0')}`.toLowerCase();
      return fullName.includes(term) || patientId.includes(term);
    });
  }, [quickSchedulePatientSearch, patients]);

  // Get available appointment types based on date and time
  const getAvailableAppointmentTypes = useMemo(() => {
    const { date, time } = appointmentFormData;
    
    if (!date || !time) {
      return [
        { value: "Regular Checkup", label: "Regular Checkup", available: true },
        { value: "Follow-up", label: "Follow-up", available: true },
        { value: "Consultation", label: "Consultation", available: true },
        { value: "Medical Certificate", label: "Medical Certificate", available: true },
        { value: "Vaccination", label: "Vaccination", available: true },
        { value: "Dental", label: "Dental", available: true },
        { value: "Emergency", label: "Emergency", available: true }
      ];
    }

    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const hour = parseInt(time.split(':')[0]);
    
    // Define service schedules (this could come from backend/database)
    const serviceSchedules = {
      "Regular Checkup": { days: [1, 2, 3, 4, 5], hours: [8, 9, 10, 11, 13, 14, 15, 16] },
      "Follow-up": { days: [1, 2, 3, 4, 5], hours: [8, 9, 10, 11, 13, 14, 15, 16] },
      "Consultation": { days: [1, 2, 3, 4, 5], hours: [8, 9, 10, 11, 13, 14, 15, 16] },
      "Medical Certificate": { days: [1, 2, 3, 4, 5], hours: [9, 10, 11, 14, 15] },
      "Vaccination": { days: [1, 3, 5], hours: [9, 10, 11, 14, 15] },
      "Dental": { days: [2, 4], hours: [9, 10, 11, 14, 15, 16] },
      "Emergency": { days: [0, 1, 2, 3, 4, 5, 6], hours: Array.from({length: 24}, (_, i) => i) }
    };

    return [
      { value: "Regular Checkup", label: "Regular Checkup" },
      { value: "Follow-up", label: "Follow-up" },
      { value: "Consultation", label: "Consultation" },
      { value: "Medical Certificate", label: "Medical Certificate" },
      { value: "Vaccination", label: "Vaccination" },
      { value: "Dental", label: "Dental" },
      { value: "Emergency", label: "Emergency" }
    ].map(type => ({
      ...type,
      available: serviceSchedules[type.value] && 
                 serviceSchedules[type.value].days.includes(dayOfWeek) && 
                 serviceSchedules[type.value].hours.includes(hour)
    }));
  }, [appointmentFormData.date, appointmentFormData.time]);

  const handleScheduleNewAppointment = useCallback(() => {
    setAppointmentTabKey('quick-schedule');
  }, []);

  const handlePatientSelection = useCallback((patient) => {
    setAppointmentFormData(prev => ({...prev, patientId: patient.id}));
    setQuickSchedulePatientSearch(getPatientFullName(patient));
    setIsPatientSelected(true); // Mark that a patient has been selected
  }, []);

  const handleClearForm = useCallback(() => {
    setAppointmentFormData({patientId: '', date: '', time: '', type: '', doctor: '', duration: 30, notes: ''});
    setQuickSchedulePatientSearch('');
    setIsPatientSelected(false); // Reset patient selection state
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowQuickScheduleModal(false);
    setIsPatientSelected(false); // Reset patient selection when modal closes
  }, []);

  // Function to add sample appointments for testing
  const addSampleAppointments = useCallback(() => {
    const sampleAppointments = [
      {
        id: Date.now() + 1,
        patientName: 'Maria Santos',
        patientId: 1,
        date: '2025-08-04',
        time: '09:30 AM',
        type: 'Regular Checkup',
        doctor: 'Dr. Santos',
        status: 'Scheduled',
        duration: 30,
        notes: 'Routine health checkup'
      },
      {
        id: Date.now() + 2,
        patientName: 'Carlos Mendoza',
        patientId: 4,
        date: '2025-08-04',
        time: '10:15 AM',
        type: 'Follow-up',
        doctor: 'Dr. Martinez',
        status: 'In Progress',
        duration: 45,
        notes: 'Follow-up for blood pressure medication'
      },
      {
        id: Date.now() + 3,
        patientName: 'Ana Reyes',
        patientId: 3,
        date: '2025-08-04',
        time: '11:45 AM',
        type: 'Medical Certificate',
        doctor: 'Dr. Santos',
        status: 'Scheduled',
        duration: 30,
        notes: 'Medical certificate for employment'
      },
      {
        id: Date.now() + 4,
        patientName: 'Juan Dela Cruz',
        patientId: 2,
        date: '2025-08-05',
        time: '09:00 AM',
        type: 'Consultation',
        doctor: 'Dr. Reyes',
        status: 'Scheduled',
        duration: 60,
        notes: 'General consultation for stomach issues'
      },
      {
        id: Date.now() + 5,
        patientName: 'Rosa Martinez',
        patientId: 5,
        date: '2025-08-06',
        time: '02:30 PM',
        type: 'Vaccination',
        doctor: 'Nurse Ana',
        status: 'Scheduled',
        duration: 15,
        notes: 'COVID-19 booster shot'
      }
    ];
    
    setAppointments(prev => [...prev, ...sampleAppointments]);
    alert('Sample appointments added successfully!');
  }, []);

  const renderAppointments = () => (
    <div className="appointments-comprehensive">
      <Tabs
        activeKey={appointmentTabKey}
        onSelect={(k) => setAppointmentTabKey(k)}
        className="mb-3 appointment-tabs"
      >
        <Tab eventKey="all-appointments" title={
          <span>
            <i className="bi bi-calendar3 me-2"></i>
            All Appointments
          </span>
        }>
          <div className="all-appointments">
            <div className="management-header">
              <h3>Appointment Management</h3>
              <div className="header-actions-row">
                <div className="search-box">
                  <i className="bi bi-search search-icon"></i>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search appointments..."
                    value={appointmentSearchTerm}
                    onChange={(e) => setAppointmentSearchTerm(e.target.value)}
                  />
                </div>
                <div className="action-buttons-group">
                  <button className="quick-schedule-btn" onClick={() => setShowQuickScheduleModal(true)}>
                    <i className="bi bi-lightning-charge"></i>
                    Quick Schedule
                  </button>
                  {appointments.length === 0 && (
                    <button className="add-patient-btn" onClick={addSampleAppointments} style={{backgroundColor: '#28a745'}}>
                      <i className="bi bi-plus-circle"></i>
                      Add Sample Data
                    </button>
                  )}
                  <button className="refresh-btn" onClick={(e) => {
                    if (e.ctrlKey || e.metaKey) {
                      // Clear all appointments when Ctrl+Click or Cmd+Click
                      if (window.confirm('Clear all appointments? This cannot be undone.')) {
                        setAppointments([]);
                        localStorage.removeItem('appointments');
                        alert('All appointments cleared!');
                      }
                    } else {
                      handleRefreshData();
                    }
                  }}>
                    <i className="bi bi-arrow-clockwise"></i>
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            {/* Today's Schedule Cards */}
            <div className="todays-schedule-cards">
              <h4>
                <i className="bi bi-clock me-2"></i>
                Today's Schedule - {formatLongDate(new Date('2025-08-04'))}
              </h4>
              <div className="schedule-cards-grid">
                {getTodaysAppointments.map(appointment => (
                  <div key={appointment.id} className={`schedule-card ${appointment.status.toLowerCase().replace(' ', '-')}`}>
                    <div className="card-time">
                      <span className="time">{appointment.time}</span>
                      <span className="duration">{appointment.duration}min</span>
                    </div>
                    <div className="card-content">
                      <div className="patient-name">{appointment.patientName}</div>
                      <div className="appointment-type">{appointment.type}</div>
                      <div className="doctor-name">Dr. {appointment.doctor}</div>
                    </div>
                    <div className="card-status">
                      <span className={`status-indicator ${appointment.status.toLowerCase().replace(' ', '-')}`}>
                        {appointment.status}
                      </span>
                    </div>
                    <div className="card-actions">
                      {appointment.status === 'Scheduled' && (
                        <button className="card-action-btn start" onClick={() => alert('Starting appointment...')}>
                          <i className="bi bi-play-circle"></i>
                        </button>
                      )}
                      {appointment.status === 'In Progress' && (
                        <button className="card-action-btn complete" onClick={() => alert('Completing appointment...')}>
                          <i className="bi bi-check-circle"></i>
                        </button>
                      )}
                      <button className="card-action-btn edit" onClick={() => alert('Edit appointment...')}>
                        <i className="bi bi-pencil"></i>
                      </button>
                    </div>
                  </div>
                ))}
                {getTodaysAppointments.length === 0 && (
                  <div className="no-appointments-card">
                    <i className="bi bi-calendar-x"></i>
                    <p>No appointments scheduled for today</p>
                  </div>
                )}
              </div>
            </div>

            {/* Content Cards Layout - All Appointments and Calendar side by side */}
            <div className="content-cards-layout">
              {/* All Appointments Card */}
              <div className="content-card">
                <div className="content-card-header">
                  <i className="bi bi-calendar-check"></i>
                  All Appointments
                </div>
                <div className="content-card-body">
                  <div className="section-actions" style={{ marginBottom: '1rem' }}>
                    <div className="search-bar">
                      <i className="bi bi-search search-icon"></i>
                      <input
                        type="text"
                        placeholder="Search appointments..."
                        className="search-input"
                        value={appointmentSearchTerm}
                        onChange={(e) => setAppointmentSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="appointments-card-table-container">
                    <table className="appointments-card-table">
                      <thead>
                        <tr>
                          <th>Patient</th>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Type</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredAppointments(appointments).map((appointment) => (
                          <tr key={appointment.id}>
                            <td>{appointment.patientName}</td>
                            <td>{formatShortDate(appointment.date)}</td>
                            <td>{appointment.time}</td>
                            <td>{appointment.type}</td>
                            <td>
                              <span className={`status-indicator ${appointment.status.toLowerCase().replace(' ', '-')}`}>
                                {appointment.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Calendar Card */}
              <div className="content-card">
                <div className="content-card-header">
                  <i className="bi bi-calendar3"></i>
                  Calendar View
                </div>
                <div className="content-card-body">
                  <div className="calendar-container">
                    <div className="calendar-header">
                      <button className="calendar-nav-btn" onClick={previousMonth}>
                        <i className="bi bi-chevron-left"></i>
                      </button>
                      <h4 className="current-month">{formatLongDate(currentDate)}</h4>
                      <button className="calendar-nav-btn" onClick={nextMonth}>
                        <i className="bi bi-chevron-right"></i>
                      </button>
                    </div>
                    
                    <div className="calendar-grid">
                      <div className="calendar-weekdays">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="weekday">{day}</div>
                        ))}
                      </div>
                      
                      <div className="calendar-days">
                        {generateCalendarDays(currentDate).map((day, index) => (
                          <div
                            key={index}
                            className={`calendar-day ${day.isToday ? 'today' : ''} ${day.isOtherMonth ? 'other-month' : ''} ${day.hasAppointments ? 'has-appointments' : ''}`}
                            onClick={() => setShowCalendarModal({ show: true, date: day.date, appointments: day.appointments })}
                          >
                            <span>{day.day}</span>
                            {day.appointmentCount > 0 && (
                              <div className="appointment-indicator">
                                <span className="appointment-count">{day.appointmentCount}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Tab>
        
        <Tab eventKey="appointment-history" title={
          <span>
            <i className="bi bi-clock-history me-2"></i>
            Appointment History
          </span>
        }>
          <div className="appointment-history">
            <div className="management-header">
              <h3>Appointment History</h3>
              <div className="history-filters">
                <select className="form-select filter-select">
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select className="form-select filter-select">
                  <option value="all">All Time</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="quarter">Last Quarter</option>
                </select>
                <div className="search-box">
                  <i className="bi bi-search search-icon"></i>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search history..."
                    value={appointmentSearchTerm}
                    onChange={(e) => setAppointmentSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Table hover responsive>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Patient</th>
                  <th>Type</th>
                  <th>Doctor</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredAppointments(getAppointmentHistory).map(appointment => (
                  <tr key={appointment.id}>
                    <td>
                      <div className="datetime-info">
                        <span className="date">{formatShortDate(appointment.date)}</span>
                        <span className="time">{appointment.time}</span>
                      </div>
                    </td>
                    <td>
                      <div className="patient-info">
                        <span className="name">{appointment.patientName}</span>
                        <span className="id">PT-{String(appointment.patientId).padStart(4, '0')}</span>
                      </div>
                    </td>
                    <td>
                      <span className="type-badge">{appointment.type}</span>
                    </td>
                    <td>{appointment.doctor}</td>
                    <td>
                      <span className={`status-badge ${appointment.status.toLowerCase().replace(' ', '-')}`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td>{appointment.duration} min</td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn view" title="View Details">
                          <i className="bi bi-eye"></i>
                        </button>
                        <button className="action-btn reprint" title="Reprint Records">
                          <i className="bi bi-printer"></i>
                        </button>
                        <button className="action-btn repeat" title="Schedule Similar">
                          <i className="bi bi-arrow-repeat"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Tab>
      </Tabs>

      {/* Quick Schedule Modal */}
      {showQuickScheduleModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="quick-schedule-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>
                <i className="bi bi-lightning-charge me-2"></i>
                Quick Schedule Appointment
              </h4>
              <button className="modal-close" onClick={handleCloseModal}>
                <i className="bi bi-x"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-row patient-search-row">
                <div className="form-group patient-search-group">
                  <label>Patient</label>
                  <div className="patient-search-container" ref={patientSearchRef}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Type patient name to search..."
                      value={quickSchedulePatientSearch}
                      onChange={(e) => {
                        setQuickSchedulePatientSearch(e.target.value);
                        if (isPatientSelected) {
                          setIsPatientSelected(false); // Reset selection when user types
                          setAppointmentFormData(prev => ({...prev, patientId: ''}));
                        }
                      }}
                    />
                    {isPatientSelected ? (
                      <i className="bi bi-check-circle-fill search-icon patient-selected-icon"></i>
                    ) : (
                      <i className="bi bi-search search-icon"></i>
                    )}
                    {quickSchedulePatientSearch && !isPatientSelected && getFilteredPatientsForSchedule.length > 0 && (
                      <div className="patient-dropdown-side">
                        <div className="dropdown-header">
                          <i className="bi bi-people me-2"></i>
                          Found Patients ({getFilteredPatientsForSchedule.length})
                        </div>
                        {getFilteredPatientsForSchedule.slice(0, 5).map(patient => (
                          <div 
                            key={patient.id} 
                            className="patient-option"
                            onClick={() => handlePatientSelection(patient)}
                          >
                            <span className="patient-name">{getPatientFullName(patient)}</span>
                            <span className="patient-id">PT-{String(patient.id).padStart(4, '0')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {quickSchedulePatientSearch && !isPatientSelected && getFilteredPatientsForSchedule.length === 0 && (
                      <div className="patient-dropdown-side">
                        <div className="no-results">
                          <i className="bi bi-search me-2"></i>
                          No patients found
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input 
                    type="date" 
                    className="form-control"
                    value={appointmentFormData.date}
                    onChange={(e) => setAppointmentFormData(prev => ({...prev, date: e.target.value}))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <input 
                    type="time" 
                    className="form-control"
                    value={appointmentFormData.time}
                    onChange={(e) => setAppointmentFormData(prev => ({...prev, time: e.target.value}))}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Appointment Type</label>
                  <select 
                    className="form-select"
                    value={appointmentFormData.type}
                    onChange={(e) => setAppointmentFormData(prev => ({...prev, type: e.target.value}))}
                  >
                    <option value="">Select Type</option>
                    {getAvailableAppointmentTypes.map(type => (
                      <option 
                        key={type.value} 
                        value={type.value}
                        disabled={!type.available}
                        style={{
                          color: type.available ? 'inherit' : '#999',
                          backgroundColor: type.available ? 'inherit' : '#f5f5f5'
                        }}
                      >
                        {type.label} {!type.available ? '(Not available at selected time)' : ''}
                      </option>
                    ))}
                  </select>
                  {appointmentFormData.date && appointmentFormData.time && (
                    <small className="service-availability-note">
                      <i className="bi bi-info-circle me-1"></i>
                      Service availability based on selected date & time
                    </small>
                  )}
                </div>
                <div className="form-group">
                  <label>Doctor/Staff</label>
                  <select 
                    className="form-select"
                    value={appointmentFormData.doctor}
                    onChange={(e) => setAppointmentFormData(prev => ({...prev, doctor: e.target.value}))}
                  >
                    <option value="">Select Doctor/Staff</option>
                    <option value="Dr. Santos">Dr. Santos</option>
                    <option value="Dr. Martinez">Dr. Martinez</option>
                    <option value="Dr. Reyes">Dr. Reyes</option>
                    <option value="Nurse Ana">Nurse Ana</option>
                    <option value="Any Available">Any Available</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <select 
                    className="form-select"
                    value={appointmentFormData.duration}
                    onChange={(e) => setAppointmentFormData(prev => ({...prev, duration: parseInt(e.target.value)}))}
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label>Notes (Optional)</label>
                  <textarea 
                    className="form-control"
                    rows={3}
                    placeholder="Additional notes for the appointment..."
                    value={appointmentFormData.notes}
                    onChange={(e) => setAppointmentFormData(prev => ({...prev, notes: e.target.value}))}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-schedule-primary"
                onClick={() => {
                  // Validate required fields
                  if (!quickSchedulePatientSearch || !appointmentFormData.date || 
                      !appointmentFormData.time || !appointmentFormData.type || 
                      !appointmentFormData.doctor) {
                    alert('Please fill in all required fields: Patient, Date, Time, Type, and Doctor/Staff');
                    return;
                  }

                  // Create new appointment
                  const newAppointment = {
                    id: Date.now(), // Simple ID generation
                    patientName: quickSchedulePatientSearch,
                    patientId: null, // Will be set when patient selection is properly implemented
                    date: appointmentFormData.date,
                    time: appointmentFormData.time,
                    type: appointmentFormData.type,
                    doctor: appointmentFormData.doctor,
                    status: 'Scheduled',
                    duration: appointmentFormData.duration,
                    notes: appointmentFormData.notes || ''
                  };

                  // Add to appointments
                  setAppointments(prev => [...prev, newAppointment]);

                  // Add activity tracking
                  addActivity(
                    'Appointment Scheduled',
                    `${quickSchedulePatientSearch} - ${appointmentFormData.type} on ${appointmentFormData.date} at ${appointmentFormData.time}`,
                    'success'
                  );

                  // Clear form and close modal
                  handleClearForm();
                  handleCloseModal();
                  
                  alert('Appointment scheduled successfully!');
                }}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Schedule Appointment
              </button>
              <button 
                className="btn-schedule-secondary"
                onClick={handleClearForm}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Clear Form
              </button>
              <button 
                className="btn-cancel"
                onClick={() => setShowQuickScheduleModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Day Modal */}
      {showCalendarModal && (
        <div className="modal-overlay" onClick={() => setShowCalendarModal(false)}>
          <div className="calendar-day-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>
                <i className="bi bi-calendar-day me-2"></i>
                Appointments for August 4, 2025
              </h4>
              <button className="modal-close" onClick={() => setShowCalendarModal(false)}>
                <i className="bi bi-x"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="day-appointments">
                {getTodaysAppointments.map(appointment => (
                  <div key={appointment.id} className={`day-appointment-item ${appointment.status.toLowerCase().replace(' ', '-')}`}>
                    <div className="appointment-time-slot">
                      <span className="time">{appointment.time}</span>
                      <span className="duration">{appointment.duration}min</span>
                    </div>
                    <div className="appointment-info">
                      <div className="patient-name">{appointment.patientName}</div>
                      <div className="appointment-details">
                        <span className="type">{appointment.type}</span>
                        <span className="doctor">Dr. {appointment.doctor}</span>
                      </div>
                    </div>
                    <div className="appointment-status">
                      <span className={`status ${appointment.status.toLowerCase().replace(' ', '-')}`}>
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                ))}
                {getTodaysAppointments.length === 0 && (
                  <div className="no-appointments">
                    <i className="bi bi-calendar-x"></i>
                    <p>No appointments scheduled for this day</p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-primary"
                onClick={() => setShowQuickScheduleModal(true)}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Add Appointment
              </button>
              <button 
                className="btn-secondary"
                onClick={() => setShowCalendarModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAppointmentHistory = () => (
    <div className="appointment-history">
      <div className="management-header">
        <h2 className="management-title">
          <i className="bi bi-calendar-event me-2"></i>
          Appointment History
        </h2>
        <div className="management-actions">
          <div className="search-box">
            <i className="bi bi-search search-icon"></i>
            <input
              type="text"
              className="search-input"
              placeholder="Search appointment history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="add-patient-btn" onClick={() => alert('Export history coming soon!')}>
            <i className="bi bi-download"></i>
            Export History
          </button>
        </div>
      </div>

      {/* History Statistics */}
      <div className="history-overview">
        <div className="overview-card">
          <div className="overview-icon total">
            <i className="bi bi-calendar3"></i>
          </div>
          <div className="overview-content">
            <div className="overview-value">1,247</div>
            <div className="overview-label">Total Appointments</div>
            <div className="overview-trend">+12% this month</div>
          </div>
        </div>
        
        <div className="overview-card">
          <div className="overview-icon completed">
            <i className="bi bi-check-circle"></i>
          </div>
          <div className="overview-content">
            <div className="overview-value">1,089</div>
            <div className="overview-label">Completed</div>
            <div className="overview-trend">87.3% completion rate</div>
          </div>
        </div>
        
        <div className="overview-card">
          <div className="overview-icon cancelled">
            <i className="bi bi-x-circle"></i>
          </div>
          <div className="overview-content">
            <div className="overview-value">84</div>
            <div className="overview-label">Cancelled</div>
            <div className="overview-trend">6.7% cancellation rate</div>
          </div>
        </div>
        
        <div className="overview-card">
          <div className="overview-icon no-show">
            <i className="bi bi-person-x"></i>
          </div>
          <div className="overview-content">
            <div className="overview-value">74</div>
            <div className="overview-label">No Shows</div>
            <div className="overview-trend">5.9% no-show rate</div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="history-filters">
        <div className="filter-group">
          <label>Date Range:</label>
          <select className="form-select">
            <option value="last7days">Last 7 Days</option>
            <option value="last30days" selected>Last 30 Days</option>
            <option value="last90days">Last 90 Days</option>
            <option value="thisyear">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Status:</label>
          <select className="form-select">
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no-show">No Show</option>
            <option value="rescheduled">Rescheduled</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Type:</label>
          <select className="form-select">
            <option value="all">All Types</option>
            <option value="checkup">Regular Checkup</option>
            <option value="followup">Follow-up</option>
            <option value="consultation">Consultation</option>
            <option value="medical-cert">Medical Certificate</option>
            <option value="vaccination">Vaccination</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Provider:</label>
          <select className="form-select">
            <option value="all">All Providers</option>
            <option value="dr-santos">Dr. Santos</option>
            <option value="dr-martinez">Dr. Martinez</option>
            <option value="dr-reyes">Dr. Reyes</option>
          </select>
        </div>
      </div>

      {/* Appointment History Table */}
      <div className="history-table-wrapper">
        <table className="history-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Patient</th>
              <th>Type</th>
              <th>Provider</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div className="datetime-info">
                  <span className="date">July 19, 2024</span>
                  <span className="time">2:30 PM</span>
                </div>
              </td>
              <td>
                <div className="patient-info">
                  <span className="name">Maria Santos</span>
                  <span className="id">PT-0001</span>
                </div>
              </td>
              <td><span className="type-badge checkup">Regular Checkup</span></td>
              <td>Dr. Santos</td>
              <td>45 min</td>
              <td><span className="status-badge completed">Completed</span></td>
              <td>
                <div className="notes-preview">
                  <span>Routine checkup, normal vitals...</span>
                  <button className="view-notes" onClick={() => alert('View full notes')}>
                    <i className="bi bi-eye"></i>
                  </button>
                </div>
              </td>
              <td className="action-cell">
                <button className="action-btn view" title="View Details">
                  <i className="bi bi-eye"></i>
                </button>
                <button className="action-btn reschedule" title="Reschedule">
                  <i className="bi bi-calendar-plus"></i>
                </button>
                <button className="action-btn print" title="Print Summary">
                  <i className="bi bi-printer"></i>
                </button>
              </td>
            </tr>
            <tr>
              <td>
                <div className="datetime-info">
                  <span className="date">July 18, 2024</span>
                  <span className="time">10:15 AM</span>
                </div>
              </td>
              <td>
                <div className="patient-info">
                  <span className="name">Carlos Mendoza</span>
                  <span className="id">PT-0004</span>
                </div>
              </td>
              <td><span className="type-badge followup">Follow-up</span></td>
              <td>Dr. Martinez</td>
              <td>30 min</td>
              <td><span className="status-badge completed">Completed</span></td>
              <td>
                <div className="notes-preview">
                  <span>Blood pressure follow-up, improved...</span>
                  <button className="view-notes" onClick={() => alert('View full notes')}>
                    <i className="bi bi-eye"></i>
                  </button>
                </div>
              </td>
              <td className="action-cell">
                <button className="action-btn view" title="View Details">
                  <i className="bi bi-eye"></i>
                </button>
                <button className="action-btn reschedule" title="Reschedule">
                  <i className="bi bi-calendar-plus"></i>
                </button>
                <button className="action-btn print" title="Print Summary">
                  <i className="bi bi-printer"></i>
                </button>
              </td>
            </tr>
            <tr>
              <td>
                <div className="datetime-info">
                  <span className="date">July 17, 2024</span>
                  <span className="time">3:45 PM</span>
                </div>
              </td>
              <td>
                <div className="patient-info">
                  <span className="name">Ana Reyes</span>
                  <span className="id">PT-0003</span>
                </div>
              </td>
              <td><span className="type-badge medical-cert">Medical Certificate</span></td>
              <td>Dr. Santos</td>
              <td>20 min</td>
              <td><span className="status-badge completed">Completed</span></td>
              <td>
                <div className="notes-preview">
                  <span>Medical certificate for employment...</span>
                  <button className="view-notes" onClick={() => alert('View full notes')}>
                    <i className="bi bi-eye"></i>
                  </button>
                </div>
              </td>
              <td className="action-cell">
                <button className="action-btn view" title="View Details">
                  <i className="bi bi-eye"></i>
                </button>
                <button className="action-btn reschedule" title="Reschedule">
                  <i className="bi bi-calendar-plus"></i>
                </button>
                <button className="action-btn print" title="Print Summary">
                  <i className="bi bi-printer"></i>
                </button>
              </td>
            </tr>
            <tr>
              <td>
                <div className="datetime-info">
                  <span className="date">July 16, 2024</span>
                  <span className="time">11:30 AM</span>
                </div>
              </td>
              <td>
                <div className="patient-info">
                  <span className="name">Luis Garcia</span>
                  <span className="id">PT-0005</span>
                </div>
              </td>
              <td><span className="type-badge consultation">Consultation</span></td>
              <td>Dr. Reyes</td>
              <td>60 min</td>
              <td><span className="status-badge cancelled">Cancelled</span></td>
              <td>
                <div className="notes-preview">
                  <span>Patient cancelled due to emergency...</span>
                  <button className="view-notes" onClick={() => alert('View full notes')}>
                    <i className="bi bi-eye"></i>
                  </button>
                </div>
              </td>
              <td className="action-cell">
                <button className="action-btn view" title="View Details">
                  <i className="bi bi-eye"></i>
                </button>
                <button className="action-btn reschedule" title="Reschedule">
                  <i className="bi bi-calendar-plus"></i>
                </button>
                <button className="action-btn print" title="Print Summary">
                  <i className="bi bi-printer"></i>
                </button>
              </td>
            </tr>
            <tr>
              <td>
                <div className="datetime-info">
                  <span className="date">July 15, 2024</span>
                  <span className="time">9:00 AM</span>
                </div>
              </td>
              <td>
                <div className="patient-info">
                  <span className="name">Elena Rodriguez</span>
                  <span className="id">PT-0006</span>
                </div>
              </td>
              <td><span className="type-badge vaccination">Vaccination</span></td>
              <td>Dr. Martinez</td>
              <td>15 min</td>
              <td><span className="status-badge no-show">No Show</span></td>
              <td>
                <div className="notes-preview">
                  <span>Patient did not show up...</span>
                  <button className="view-notes" onClick={() => alert('View full notes')}>
                    <i className="bi bi-eye"></i>
                  </button>
                </div>
              </td>
              <td className="action-cell">
                <button className="action-btn view" title="View Details">
                  <i className="bi bi-eye"></i>
                </button>
                <button className="action-btn reschedule" title="Reschedule">
                  <i className="bi bi-calendar-plus"></i>
                </button>
                <button className="action-btn print" title="Print Summary">
                  <i className="bi bi-printer"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination-section">
        <div className="pagination-info">
          Showing 1-5 of 127 appointments
        </div>
        <div className="pagination-controls">
          <button className="page-btn" disabled>
            <i className="bi bi-chevron-left"></i>
          </button>
          <button className="page-btn active">1</button>
          <button className="page-btn">2</button>
          <button className="page-btn">3</button>
          <span className="page-dots">...</span>
          <button className="page-btn">26</button>
          <button className="page-btn">
            <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  );

  // Forecasting tab content
  const renderForecastingTab = () => (
    <>
      {/* Forecasting Cards */}
      <div className="forecasting-cards">
        {/* Patient Visit Forecast */}
        <div className="dashboard-card forecast-card">
          <div className="card-header">
            <h3>
              <i className="bi bi-people-fill"></i>
              Patient Visit Forecast
            </h3>
            <span>Next 30 days prediction</span>
          </div>
          <div className="card-content">
            <div className="forecast-metrics">
              <div className="forecast-metric">
                <div className="metric-label">Predicted Daily Average</div>
                <div className="metric-value forecast-up">18 <small>patients/day</small></div>
                <div className="metric-trend">↗ 12% increase expected</div>
              </div>
              <div className="forecast-metric">
                <div className="metric-label">Peak Days Expected</div>
                <div className="metric-value">Tue, Thu</div>
                <div className="metric-trend">Based on historical patterns</div>
              </div>
            </div>
            <div className="forecast-chart-placeholder">
              <div className="chart-placeholder-text">
                📈 Patient Visit Trend Chart
                <small>Backend integration: /api/forecast/patient-visits</small>
              </div>
            </div>
          </div>
        </div>

        {/* Resource Planning Forecast */}
        <div className="dashboard-card forecast-card">
          <div className="card-header">
            <h3>
              <i className="bi bi-clipboard2-pulse"></i>
              Resource Planning
            </h3>
            <span>Staffing & equipment needs</span>
          </div>
          <div className="card-content">
            <div className="forecast-metrics">
              <div className="forecast-metric">
                <div className="metric-label">Staff Requirement</div>
                <div className="metric-value forecast-stable">3-4 <small>doctors</small></div>
                <div className="metric-trend">→ Stable demand</div>
              </div>
              <div className="forecast-metric">
                <div className="metric-label">Equipment Usage</div>
                <div className="metric-value forecast-up">High</div>
                <div className="metric-trend">↗ 8% increase in medical supplies</div>
              </div>
            </div>
            <div className="resource-alerts">
              <div className="alert-item">
                <i className="bi bi-exclamation-triangle text-warning"></i>
                <span>Vaccine stock may run low by Aug 15</span>
              </div>
              <div className="alert-item">
                <i className="bi bi-info-circle text-info"></i>
                <span>Consider additional staff on Thursdays</span>
              </div>
            </div>
          </div>
        </div>

        {/* Seasonal Health Trends */}
        <div className="dashboard-card forecast-card">
          <div className="card-header">
            <h3>
              <i className="bi bi-thermometer-half"></i>
              Seasonal Health Trends
            </h3>
            <span>Disease outbreak predictions</span>
          </div>
          <div className="card-content">
            <div className="seasonal-predictions">
              <div className="season-item">
                <div className="season-label">
                  <i className="bi bi-sun"></i>
                  <span>Current Season (Summer)</span>
                </div>
                <div className="season-predictions">
                  <span className="prediction-item high">Heat-related illnesses: High</span>
                  <span className="prediction-item medium">Respiratory issues: Medium</span>
                  <span className="prediction-item low">Flu cases: Low</span>
                </div>
              </div>
              <div className="season-item">
                <div className="season-label">
                  <i className="bi bi-cloud-rain"></i>
                  <span>Upcoming (Rainy Season)</span>
                </div>
                <div className="season-predictions">
                  <span className="prediction-item high">Dengue fever: Increasing</span>
                  <span className="prediction-item medium">Diarrheal diseases: Watch</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Appointment Demand Forecast */}
        <div className="dashboard-card forecast-card">
          <div className="card-header">
            <h3>
              <i className="bi bi-calendar-check"></i>
              Appointment Demand
            </h3>
            <span>Booking pattern analysis</span>
          </div>
          <div className="card-content">
            <div className="demand-forecast">
              <div className="demand-item">
                <div className="demand-day">Monday</div>
                <div className="demand-bar">
                  <div className="demand-fill" style={{width: '70%'}}></div>
                </div>
                <span className="demand-count">14 appointments</span>
              </div>
              <div className="demand-item">
                <div className="demand-day">Tuesday</div>
                <div className="demand-bar">
                  <div className="demand-fill" style={{width: '90%'}}></div>
                </div>
                <span className="demand-count">18 appointments</span>
              </div>
              <div className="demand-item">
                <div className="demand-day">Wednesday</div>
                <div className="demand-bar">
                  <div className="demand-fill" style={{width: '60%'}}></div>
                </div>
                <span className="demand-count">12 appointments</span>
              </div>
              <div className="demand-item">
                <div className="demand-day">Thursday</div>
                <div className="demand-bar">
                  <div className="demand-fill" style={{width: '85%'}}></div>
                </div>
                <span className="demand-count">17 appointments</span>
              </div>
              <div className="demand-item">
                <div className="demand-day">Friday</div>
                <div className="demand-bar">
                  <div className="demand-fill" style={{width: '75%'}}></div>
                </div>
                <span className="demand-count">15 appointments</span>
              </div>
            </div>
            <div className="forecast-note">
              <small>📊 Backend endpoint: /api/forecast/appointment-demand</small>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderForecasting = () => (
    <>
      <div className="topbar">
        <div className="path-info">
          <span>YOU ARE HERE</span>
          <i className="bi bi-chevron-right"></i>
          <span>{currentPath}</span>
          {currentPath === 'Dashboard' && (
            <>
              <i className="bi bi-chevron-right"></i>
              <span>{dashboardTabKey === 'analytics' ? 'Analytics' : 'Forecasting'}</span>
            </>
          )}
        </div>
        <div className="user-info">
          <div className="date-time">
            <span>{formatDateWithTime(simulationMode.enabled ? simulationMode.currentSimulatedDate : currentDateTime)}</span>
            {simulationMode.enabled && (
              <span className="simulation-indicator">
                <i className="bi bi-lightning-charge me-1"></i>
                Simulating
              </span>
            )}
          </div>
          <div className="user">
            <span className="user-name">
              {user ? `${user.firstName} ${user.lastName}` : 'User'}
            </span>
            <div className="user-avatar">
              <i className="bi bi-person-circle"></i>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </div>

      {/* Unified Content Header */}
      <div className="content-header">
        <h1>
          {/* This could be made more dynamic based on currentPath if needed */}
          {currentPath}
        </h1>
        {currentPath === 'Dashboard' && (
          <button className="refresh-btn" onClick={handleRefreshData}>
            <i className="bi bi-arrow-clockwise"></i>
            Refresh Data
          </button>
        )}
      </div>

      {/* Forecasting System */}
      <div className="forecasting-section">
        <div className="section-header">
          <h2>
            <i className="bi bi-graph-up-arrow"></i>
            Predictive Analytics Dashboard
          </h2>
          <span>Advanced forecasting based on historical data patterns and seasonal trends</span>
        </div>

        <div className="forecasting-cards">
          {/* Patient Visit Forecast */}
          <div className="dashboard-card forecast-card">
            <div className="card-header">
              <h3>
                <i className="bi bi-people-fill"></i>
                Patient Visit Forecast
              </h3>
              <span>Next 30 days prediction</span>
            </div>
            <div className="card-content">
              <div className="forecast-metrics">
                <div className="forecast-metric">
                  <div className="metric-label">Predicted Daily Average</div>
                  <div className="metric-value forecast-up">18 <small>patients/day</small></div>
                  <div className="metric-trend">↗ 12% increase expected</div>
                </div>
                <div className="forecast-metric">
                  <div className="metric-label">Peak Days Expected</div>
                  <div className="metric-value">Tue, Thu</div>
                  <div className="metric-trend">Based on historical patterns</div>
                </div>
              </div>
              <div className="forecast-chart-placeholder">
                <div className="chart-placeholder-text">
                  📈 Patient Visit Trend Chart
                  <small>Backend integration: /api/forecast/patient-visits</small>
                </div>
              </div>
            </div>
          </div>

          {/* Resource Planning Forecast */}
          <div className="dashboard-card forecast-card">
            <div className="card-header">
              <h3>
                <i className="bi bi-clipboard2-pulse"></i>
                Resource Planning
              </h3>
              <span>Staffing & equipment needs</span>
            </div>
            <div className="card-content">
              <div className="forecast-metrics">
                <div className="forecast-metric">
                  <div className="metric-label">Staff Requirement</div>
                  <div className="metric-value forecast-stable">3-4 <small>doctors</small></div>
                  <div className="metric-trend">→ Stable demand</div>
                </div>
                <div className="forecast-metric">
                  <div className="metric-label">Equipment Usage</div>
                  <div className="metric-value forecast-up">High</div>
                  <div className="metric-trend">↗ 8% increase in medical supplies</div>
                </div>
              </div>
              <div className="resource-alerts">
                <div className="alert-item">
                  <i className="bi bi-exclamation-triangle text-warning"></i>
                  <span>Vaccine stock may run low by Aug 15</span>
                </div>
                <div className="alert-item">
                  <i className="bi bi-info-circle text-info"></i>
                  <span>Consider additional staff on Thursdays</span>
                </div>
              </div>
            </div>
          </div>

          {/* Seasonal Health Trends */}
          <div className="dashboard-card forecast-card">
            <div className="card-header">
              <h3>
                <i className="bi bi-thermometer-half"></i>
                Seasonal Health Trends
              </h3>
              <span>Disease outbreak predictions</span>
            </div>
            <div className="card-content">
              <div className="seasonal-predictions">
                <div className="season-item">
                  <div className="season-label">
                    <i className="bi bi-sun"></i>
                    <span>Current Season (Summer)</span>
                  </div>
                  <div className="season-predictions">
                    <span className="prediction-item high">Heat-related illnesses: High</span>
                    <span className="prediction-item medium">Respiratory issues: Medium</span>
                    <span className="prediction-item low">Flu cases: Low</span>
                  </div>
                </div>
                <div className="season-item">
                  <div className="season-label">
                    <i className="bi bi-cloud-rain"></i>
                    <span>Upcoming (Rainy Season)</span>
                  </div>
                  <div className="season-predictions">
                    <span className="prediction-item high">Dengue fever: Increasing</span>
                    <span className="prediction-item medium">Diarrheal diseases: Watch</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Appointment Demand Forecast */}
          <div className="dashboard-card forecast-card">
            <div className="card-header">
              <h3>
                <i className="bi bi-calendar-check"></i>
                Appointment Demand
              </h3>
              <span>Booking pattern analysis</span>
            </div>
            <div className="card-content">
              <div className="demand-forecast">
                <div className="demand-item">
                  <div className="demand-day">Monday</div>
                  <div className="demand-bar">
                    <div className="demand-fill" style={{width: '70%'}}></div>
                  </div>
                  <span className="demand-count">14 appointments</span>
                </div>
                <div className="demand-item">
                  <div className="demand-day">Tuesday</div>
                  <div className="demand-bar">
                    <div className="demand-fill" style={{width: '90%'}}></div>
                  </div>
                  <span className="demand-count">18 appointments</span>
                </div>
                <div className="demand-item">
                  <div className="demand-day">Wednesday</div>
                  <div className="demand-bar">
                    <div className="demand-fill" style={{width: '60%'}}></div>
                  </div>
                  <span className="demand-count">12 appointments</span>
                </div>
                <div className="demand-item">
                  <div className="demand-day">Thursday</div>
                  <div className="demand-bar">
                    <div className="demand-fill" style={{width: '85%'}}></div>
                  </div>
                  <span className="demand-count">17 appointments</span>
                </div>
                <div className="demand-item">
                  <div className="demand-day">Friday</div>
                  <div className="demand-bar">
                    <div className="demand-fill" style={{width: '75%'}}></div>
                  </div>
                  <span className="demand-count">15 appointments</span>
                </div>
              </div>
              <div className="forecast-note">
                <small>📊 Backend endpoint: /api/forecast/appointment-demand</small>
              </div>
            </div>
          </div>
        </div>

        {/* Forecasting Controls */}
        <div className="forecasting-controls">
          <div className="control-group">
            <label>Forecast Period:</label>
            <select className="form-select">
              <option value="7">Next 7 days</option>
              <option value="30" selected>Next 30 days</option>
              <option value="90">Next 3 months</option>
            </select>
          </div>
          <div className="control-group">
            <label>Data Source:</label>
            <select className="form-select">
              <option value="historical" selected>Historical patterns</option>
              <option value="seasonal">Seasonal trends</option>
              <option value="combined">Combined analysis</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => alert('Backend placeholder: /api/forecast/refresh')}>
            <i className="bi bi-arrow-clockwise"></i>
            Refresh Forecasts
          </button>
        </div>
      </div>
    </>
  );

  const renderManageInventories = () => (
    <>
      {/* Inventory Tabs */}
      <Tabs
        id="inventory-tabs"
        activeKey={inventoryTabKey}
        onSelect={(k) => setInventoryTabKey(k)}
        className="mb-3"
      >
        <Tab eventKey="vaccines" title={<span><i className="bi bi-shield-plus"></i> Vaccines</span>}>
          {renderVaccineInventory()}
        </Tab>
        <Tab eventKey="prescriptions" title={<span><i className="bi bi-capsule"></i> Prescriptions</span>}>
          {renderPrescriptionInventory()}
        </Tab>
      </Tabs>
    </>
  );

  const renderVaccineInventory = () => (
    <div className="inventory-management">
      {/* Inventory Summary Cards */}
      <div className="inventory-summary">
        <div className="summary-card">
          <div className="summary-icon vaccines">
            <i className="bi bi-shield-plus"></i>
          </div>
          <div className="summary-content">
            <div className="summary-value">12</div>
            <div className="summary-label">Total Vaccines</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon available">
            <i className="bi bi-check-circle"></i>
          </div>
          <div className="summary-content">
            <div className="summary-value">525</div>
            <div className="summary-label">Doses Available</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon warning">
            <i className="bi bi-exclamation-triangle"></i>
          </div>
          <div className="summary-content">
            <div className="summary-value">3</div>
            <div className="summary-label">Low Stock</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon expiring">
            <i className="bi bi-calendar-x"></i>
          </div>
          <div className="summary-content">
            <div className="summary-value">2</div>
            <div className="summary-label">Expiring Soon</div>
          </div>
        </div>
      </div>

      <div className="management-header">
        <h3 className="management-title">
          <i className="bi bi-shield-plus me-2"></i>
          Vaccine Inventory
        </h3>
        <div className="management-actions">
          <div className="search-box">
            <i className="bi bi-search search-icon"></i>
            <input
              type="text"
              className="search-input"
              placeholder="Search vaccines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="action-buttons">
            <button className="add-patient-btn">
              <i className="bi bi-plus"></i>
              Add New Vaccine
            </button>
            <button className="refresh-btn" onClick={() => window.location.reload()}>
              <i className="bi bi-arrow-clockwise"></i>
              Refresh
            </button>
          </div>
        </div>
      </div>
      
      {/* Modern Vaccine Cards Grid */}
      <div className="inventory-grid">
        <div className="inventory-item">
          <div className="item-header">
            <div className="item-icon vaccines">
              <i className="bi bi-shield-plus"></i>
            </div>
            <div className="item-status available">Available</div>
          </div>
          <div className="item-content">
            <h4 className="item-name">COVID-19 Vaccine</h4>
            <div className="item-details">
              <div className="detail-row">
                <span className="detail-label">Manufacturer:</span>
                <span className="detail-value">Pfizer</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Batch:</span>
                <span className="detail-value">CV001-2024</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Stock:</span>
                <span className="detail-value stock-high">150 doses</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Expiry:</span>
                <span className="detail-value">Dec 31, 2024</span>
              </div>
            </div>
          </div>
          <div className="item-actions">
            <button className="action-btn primary" title="View Details">
              <i className="bi bi-eye"></i>
            </button>
            <button className="action-btn secondary" title="Edit">
              <i className="bi bi-pencil"></i>
            </button>
            <button className="action-btn danger" title="Delete">
              <i className="bi bi-trash"></i>
            </button>
          </div>
        </div>

        <div className="inventory-item">
          <div className="item-header">
            <div className="item-icon vaccines">
              <i className="bi bi-shield-plus"></i>
            </div>
            <div className="item-status low-stock">Low Stock</div>
          </div>
          <div className="item-content">
            <h4 className="item-name">Hepatitis B Vaccine</h4>
            <div className="item-details">
              <div className="detail-row">
                <span className="detail-label">Manufacturer:</span>
                <span className="detail-value">GSK</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Batch:</span>
                <span className="detail-value">HB002-2024</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Stock:</span>
                <span className="detail-value stock-low">75 doses</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Expiry:</span>
                <span className="detail-value">Jun 30, 2025</span>
              </div>
            </div>
          </div>
          <div className="item-actions">
            <button className="action-btn primary" title="View Details">
              <i className="bi bi-eye"></i>
            </button>
            <button className="action-btn secondary" title="Edit">
              <i className="bi bi-pencil"></i>
            </button>
            <button className="action-btn danger" title="Delete">
              <i className="bi bi-trash"></i>
            </button>
          </div>
        </div>

        <div className="inventory-item">
          <div className="item-header">
            <div className="item-icon vaccines">
              <i className="bi bi-shield-plus"></i>
            </div>
            <div className="item-status available">Available</div>
          </div>
          <div className="item-content">
            <h4 className="item-name">Measles Vaccine</h4>
            <div className="item-details">
              <div className="detail-row">
                <span className="detail-label">Manufacturer:</span>
                <span className="detail-value">Merck</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Batch:</span>
                <span className="detail-value">MV003-2024</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Stock:</span>
                <span className="detail-value stock-high">200 doses</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Expiry:</span>
                <span className="detail-value">Nov 15, 2024</span>
              </div>
            </div>
          </div>
          <div className="item-actions">
            <button className="action-btn primary" title="View Details">
              <i className="bi bi-eye"></i>
            </button>
            <button className="action-btn secondary" title="Edit">
              <i className="bi bi-pencil"></i>
            </button>
            <button className="action-btn danger" title="Delete">
              <i className="bi bi-trash"></i>
            </button>
          </div>
        </div>

        <div className="inventory-item">
          <div className="item-header">
            <div className="item-icon vaccines">
              <i className="bi bi-shield-plus"></i>
            </div>
            <div className="item-status expiring">Expiring Soon</div>
          </div>
          <div className="item-content">
            <h4 className="item-name">Polio Vaccine</h4>
            <div className="item-details">
              <div className="detail-row">
                <span className="detail-label">Manufacturer:</span>
                <span className="detail-value">Sanofi</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Batch:</span>
                <span className="detail-value">PV004-2024</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Stock:</span>
                <span className="detail-value stock-medium">100 doses</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Expiry:</span>
                <span className="detail-value expiring-text">Aug 15, 2024</span>
              </div>
            </div>
          </div>
          <div className="item-actions">
            <button className="action-btn primary" title="View Details">
              <i className="bi bi-eye"></i>
            </button>
            <button className="action-btn secondary" title="Edit">
              <i className="bi bi-pencil"></i>
            </button>
            <button className="action-btn danger" title="Delete">
              <i className="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrescriptionInventory = () => (
    <div className="inventory-management">
      {/* Inventory Summary Cards */}
      <div className="inventory-summary">
        <div className="summary-card">
          <div className="summary-icon medicines">
            <i className="bi bi-capsule"></i>
          </div>
          <div className="summary-content">
            <div className="summary-value">28</div>
            <div className="summary-label">Total Medicines</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon available">
            <i className="bi bi-check-circle"></i>
          </div>
          <div className="summary-content">
            <div className="summary-value">1,250</div>
            <div className="summary-label">Units Available</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon warning">
            <i className="bi bi-exclamation-triangle"></i>
          </div>
          <div className="summary-content">
            <div className="summary-value">5</div>
            <div className="summary-label">Low Stock</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon expiring">
            <i className="bi bi-calendar-x"></i>
          </div>
          <div className="summary-content">
            <div className="summary-value">3</div>
            <div className="summary-label">Expiring Soon</div>
          </div>
        </div>
      </div>

      <div className="management-header">
        <h3 className="management-title">
          <i className="bi bi-capsule me-2"></i>
          Prescription Inventory
        </h3>
        <div className="management-actions">
          <div className="search-box">
            <i className="bi bi-search search-icon"></i>
            <input
              type="text"
              className="search-input"
              placeholder="Search medicines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="action-buttons">
            <button className="add-patient-btn">
              <i className="bi bi-plus"></i>
              Add New Medicine
            </button>
            <button className="refresh-btn" onClick={() => window.location.reload()}>
              <i className="bi bi-arrow-clockwise"></i>
              Refresh
            </button>
          </div>
        </div>
      </div>
      
      {/* Modern Medicine Cards Grid */}
      <div className="inventory-grid">
        <div className="inventory-item">
          <div className="item-header">
            <div className="item-icon medicines">
              <i className="bi bi-capsule"></i>
            </div>
            <div className="item-status available">Available</div>
          </div>
          <div className="item-content">
            <h4 className="item-name">Paracetamol</h4>
            <div className="item-subtitle">Acetaminophen</div>
            <div className="item-details">
              <div className="detail-row">
                <span className="detail-label">Dosage:</span>
                <span className="detail-value">500mg</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Category:</span>
                <span className="detail-value">Analgesic</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Stock:</span>
                <span className="detail-value stock-high">500 tablets</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Expiry:</span>
                <span className="detail-value">Aug 15, 2025</span>
              </div>
            </div>
          </div>
          <div className="item-actions">
            <button className="action-btn primary" title="View Details">
              <i className="bi bi-eye"></i>
            </button>
            <button className="action-btn secondary" title="Edit">
              <i className="bi bi-pencil"></i>
            </button>
            <button className="action-btn danger" title="Delete">
              <i className="bi bi-trash"></i>
            </button>
          </div>
        </div>

        <div className="inventory-item">
          <div className="item-header">
            <div className="item-icon medicines">
              <i className="bi bi-capsule"></i>
            </div>
            <div className="item-status available">Available</div>
          </div>
          <div className="item-content">
            <h4 className="item-name">Amoxicillin</h4>
            <div className="item-subtitle">Amoxicillin</div>
            <div className="item-details">
              <div className="detail-row">
                <span className="detail-label">Dosage:</span>
                <span className="detail-value">250mg</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Category:</span>
                <span className="detail-value">Antibiotic</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Stock:</span>
                <span className="detail-value stock-high">200 capsules</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Expiry:</span>
                <span className="detail-value">Dec 20, 2024</span>
              </div>
            </div>
          </div>
          <div className="item-actions">
            <button className="action-btn primary" title="View Details">
              <i className="bi bi-eye"></i>
            </button>
            <button className="action-btn secondary" title="Edit">
              <i className="bi bi-pencil"></i>
            </button>
            <button className="action-btn danger" title="Delete">
              <i className="bi bi-trash"></i>
            </button>
          </div>
        </div>

        <div className="inventory-item">
          <div className="item-header">
            <div className="item-icon medicines">
              <i className="bi bi-capsule"></i>
            </div>
            <div className="item-status low-stock">Low Stock</div>
          </div>
          <div className="item-content">
            <h4 className="item-name">Cetirizine</h4>
            <div className="item-subtitle">Cetirizine HCl</div>
            <div className="item-details">
              <div className="detail-row">
                <span className="detail-label">Dosage:</span>
                <span className="detail-value">10mg</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Category:</span>
                <span className="detail-value">Antihistamine</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Stock:</span>
                <span className="detail-value stock-low">50 tablets</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Expiry:</span>
                <span className="detail-value">Mar 10, 2025</span>
              </div>
            </div>
          </div>
          <div className="item-actions">
            <button className="action-btn primary" title="View Details">
              <i className="bi bi-eye"></i>
            </button>
            <button className="action-btn secondary" title="Edit">
              <i className="bi bi-pencil"></i>
            </button>
            <button className="action-btn danger" title="Delete">
              <i className="bi bi-trash"></i>
            </button>
          </div>
        </div>

        <div className="inventory-item">
          <div className="item-header">
            <div className="item-icon medicines">
              <i className="bi bi-capsule"></i>
            </div>
            <div className="item-status available">Available</div>
          </div>
          <div className="item-content">
            <h4 className="item-name">Ibuprofen</h4>
            <div className="item-subtitle">Ibuprofen</div>
            <div className="item-details">
              <div className="detail-row">
                <span className="detail-label">Dosage:</span>
                <span className="detail-value">400mg</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Category:</span>
                <span className="detail-value">Anti-inflammatory</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Stock:</span>
                <span className="detail-value stock-medium">150 tablets</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Expiry:</span>
                <span className="detail-value">Jan 30, 2025</span>
              </div>
            </div>
          </div>
          <div className="item-actions">
            <button className="action-btn primary" title="View Details">
              <i className="bi bi-eye"></i>
            </button>
            <button className="action-btn secondary" title="Edit">
              <i className="bi bi-pencil"></i>
            </button>
            <button className="action-btn danger" title="Delete">
              <i className="bi bi-trash"></i>
            </button>
          </div>
        </div>

        <div className="inventory-item">
          <div className="item-header">
            <div className="item-icon medicines">
              <i className="bi bi-capsule"></i>
            </div>
            <div className="item-status expiring">Expiring Soon</div>
          </div>
          <div className="item-content">
            <h4 className="item-name">Metformin</h4>
            <div className="item-subtitle">Metformin HCl</div>
            <div className="item-details">
              <div className="detail-row">
                <span className="detail-label">Dosage:</span>
                <span className="detail-value">500mg</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Category:</span>
                <span className="detail-value">Antidiabetic</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Stock:</span>
                <span className="detail-value stock-medium">120 tablets</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Expiry:</span>
                <span className="detail-value expiring-text">Sep 05, 2024</span>
              </div>
            </div>
          </div>
          <div className="item-actions">
            <button className="action-btn primary" title="View Details">
              <i className="bi bi-eye"></i>
            </button>
            <button className="action-btn secondary" title="Edit">
              <i className="bi bi-pencil"></i>
            </button>
            <button className="action-btn danger" title="Delete">
              <i className="bi bi-trash"></i>
            </button>
          </div>
        </div>

        <div className="inventory-item">
          <div className="item-header">
            <div className="item-icon medicines">
              <i className="bi bi-capsule"></i>
            </div>
            <div className="item-status available">Available</div>
          </div>
          <div className="item-content">
            <h4 className="item-name">Omeprazole</h4>
            <div className="item-subtitle">Omeprazole</div>
            <div className="item-details">
              <div className="detail-row">
                <span className="detail-label">Dosage:</span>
                <span className="detail-value">20mg</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Category:</span>
                <span className="detail-value">Proton Pump Inhibitor</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Stock:</span>
                <span className="detail-value stock-high">300 capsules</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Expiry:</span>
                <span className="detail-value">Nov 22, 2025</span>
              </div>
            </div>
          </div>
          <div className="item-actions">
            <button className="action-btn primary" title="View Details">
              <i className="bi bi-eye"></i>
            </button>
            <button className="action-btn secondary" title="Edit">
              <i className="bi bi-pencil"></i>
            </button>
            <button className="action-btn danger" title="Delete">
              <i className="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // User Management Functions
  const renderUserManagement = () => (
    <>
      <div className="content-header">
        <h1>
          <i className="bi bi-people-fill me-2"></i>
          User Management
          <span className={`badge ms-3 ${backendConnected ? 'bg-success' : 'bg-danger'}`}>
            <i className={`bi ${backendConnected ? 'bi-check-circle' : 'bi-x-circle'} me-1`}></i>
            {backendConnected ? 'Connected' : 'Disconnected'}
          </span>
        </h1>
        <div className="header-actions">
          <div className="manage-dropdown-container">
            <button 
              className="manage-btn"
              onClick={() => setShowUserManageDropdown(!showUserManageDropdown)}
            >
              <i className="bi bi-gear me-2"></i>
              Manage
              <i className={`bi ${showUserManageDropdown ? 'bi-chevron-up' : 'bi-chevron-down'} ms-2`}></i>
            </button>
            <div className={`manage-dropdown-menu ${showUserManageDropdown ? 'show' : ''}`}>
              <button 
                className="dropdown-item"
                onClick={() => {
                  setShowAddUserModal(true);
                  setShowUserManageDropdown(false);
                  setShowUserTypeSelection(true);
                  setSelectedUserType('');
                  setUserFormData({
                    firstName: '',
                    middleName: '',
                    lastName: '',
                    emailInitials: '',
                    password: '',
                    confirmPassword: '',
                    role: 'aide',
                    position: 'Aide',
                    userType: ''
                  });
                }}
              >
                <i className="bi bi-person-plus me-2"></i>
                Add User
              </button>
              <button 
                className="dropdown-item"
                onClick={() => {
                  setIsEditMode(!isEditMode);
                  setShowUserManageDropdown(false);
                }}
              >
                <i className="bi bi-pencil me-2"></i>
                {isEditMode ? 'Cancel Edit' : 'Edit Users'}
              </button>
              <button 
                className="dropdown-item"
                onClick={() => {
                  setShowAccessRightsModal(true);
                  setShowUserManageDropdown(false);
                }}
              >
                <i className="bi bi-shield-check me-2"></i>
                Access Rights
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="users-table-container">
        <div className="table-responsive">
          <Table hover className="users-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Full Name</th>
                <th>Role</th>
                <th>User Type</th>
                <th>Password</th>
                {isEditMode && <th className={`action-column-header ${isEditMode ? 'show' : ''}`}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>{user.role}</td>
                  <td>
                    <span className={`user-type-badge ${user.role}`}>
                      {user.accessLevel || (user.role === 'admin' ? 'Administrator' : 'Doctor/Staff')}
                    </span>
                  </td>
                  <td>
                    <span className="password-mask">••••••••</span>
                  </td>
                  {isEditMode && (
                    <td className={`action-column ${isEditMode ? 'show' : ''}`}>
                      <button 
                        className="action-btn edit"
                        onClick={() => {
                          setSelectedUser(user);
                          setUserFormData({
                            firstName: user.firstName,
                            middleName: user.middleName || '',
                            lastName: user.lastName,
                            emailInitials: user.username || user.email?.split('@')[0] || '',
                            password: '',
                            confirmPassword: '',
                            role: user.role,
                            position: user.position || user.accessLevel || 'Aide'
                          });
                          setShowEditUserModal(true);
                        }}
                        title="Edit User"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button 
                        className="action-btn delete"
                        onClick={() => handleDeleteUser(user)}
                        title="Delete User"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>
    </>
  );

  // Notification Management
  const renderNotificationManager = () => (
    <>
      <div className="notification-management-container">
        <div className="content-header">
          <h1>
            <i className="bi bi-bell me-2"></i>
            Notification Manager
            <span className={`badge ms-3 ${backendConnected ? 'bg-success' : 'bg-danger'}`}>
              <i className={`bi ${backendConnected ? 'bi-check-circle' : 'bi-x-circle'} me-1`}></i>
              {backendConnected ? 'Connected' : 'Disconnected'}
            </span>
          </h1>
          <p className="text-muted">Send SMS and email notifications to patients</p>
        </div>
        
        <NotificationManager patients={unsortedMembersData || []} />
      </div>
    </>
  );

  // Notification History
  const renderNotificationHistory = () => (
    <>
      <div className="notification-history-container">
        <div className="content-header">
          <h1>
            <i className="bi bi-clock-history me-2"></i>
            Notification History
          </h1>
          <p className="text-muted">View sent notification history and delivery status</p>
        </div>
        
        <div className="coming-soon-container" style={{
          padding: '60px 20px',
          textAlign: 'center',
          background: 'var(--bg-primary)',
          borderRadius: '12px',
          border: '1px solid var(--border-secondary)'
        }}>
          <i className="bi bi-tools" style={{fontSize: '4rem', color: 'var(--text-secondary)', marginBottom: '20px'}}></i>
          <h3 style={{color: 'var(--text-primary)', marginBottom: '15px'}}>
            Notification History
          </h3>
          <p style={{color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '20px'}}>
            This feature is currently under development.
          </p>
          <div style={{color: 'var(--text-secondary)'}}>
            <p><strong>Coming Soon:</strong></p>
            <ul style={{listStyle: 'none', padding: 0}}>
              <li>📱 SMS delivery status tracking</li>
              <li>📧 Email delivery confirmation</li>
              <li>📊 Notification analytics</li>
              <li>🔍 Search and filter history</li>
              <li>📋 Export notification reports</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );

  const renderAddUser = () => (
    <>
      <div className="add-user-container">
        <Card className="user-form-card">
          <Card.Header>
            <h4>
              <i className="bi bi-person-badge me-2"></i>
              User Registration Form
            </h4>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleAddUser}>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>First Name *</strong></Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter first name"
                      value={userFormData.firstName}
                      onChange={(e) => setUserFormData({
                        ...userFormData,
                        firstName: e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1).toLowerCase()
                      })}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Middle Name</strong></Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter middle name (optional)"
                      value={userFormData.middleName}
                      onChange={(e) => setUserFormData({
                        ...userFormData,
                        middleName: e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1).toLowerCase()
                      })}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Last Name *</strong></Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter last name"
                      value={userFormData.lastName}
                      onChange={(e) => setUserFormData({
                        ...userFormData,
                        lastName: e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1).toLowerCase()
                      })}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Email Initials for Login *</strong></Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        placeholder="e.g., j.santos"
                        value={userFormData.emailInitials}
                        onChange={(e) => setUserFormData({...userFormData, emailInitials: e.target.value.toLowerCase()})}
                        required
                      />
                      <InputGroup.Text>@maybunga.health</InputGroup.Text>
                    </InputGroup>
                    <Form.Text className="text-muted">
                      This will be used as the login email (e.g., j.santos@maybunga.health)
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Position/Role *</strong></Form.Label>
                    <Form.Select
                      value={userFormData.position}
                      onChange={(e) => {
                        const position = e.target.value;
                        const role = position === 'Doctor' ? 'doctor' : position === 'Admin' ? 'admin' : 'aide';
                        setUserFormData({...userFormData, position, role});
                      }}
                      required
                    >
                      <option value="Aide">Aide</option>
                      <option value="Nurse">Nurse</option>
                      <option value="Nutritionist">Nutritionist</option>
                      <option value="Medical Personnel">Medical Personnel</option>
                      <option value="Doctor">Doctor</option>
                      <option value="Admin">Administrator</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Password *</strong></Form.Label>
                    <InputGroup>
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        value={userFormData.password}
                        onChange={(e) => setUserFormData({...userFormData, password: e.target.value})}
                        required
                        minLength={8}
                      />
                      <InputGroup.Text 
                        style={{ cursor: 'pointer' }}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </InputGroup.Text>
                    </InputGroup>
                    <Form.Text className="text-muted">
                      Minimum 8 characters, must include uppercase, lowercase, number, and special character
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Confirm Password *</strong></Form.Label>
                    <InputGroup>
                      <Form.Control
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter password"
                        value={userFormData.confirmPassword}
                        onChange={(e) => setUserFormData({...userFormData, confirmPassword: e.target.value})}
                        required
                        isInvalid={userFormData.password !== userFormData.confirmPassword && userFormData.confirmPassword !== ''}
                      />
                      <InputGroup.Text 
                        style={{ cursor: 'pointer' }}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </InputGroup.Text>
                    </InputGroup>
                    <Form.Control.Feedback type="invalid">
                      Passwords do not match
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
              
              {/* Form Action Buttons */}
              <Row className="mt-4">
                <Col md={12} className="d-flex justify-content-end gap-2">
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => {
                      // Clear form and localStorage
                      setUserFormData({
                        firstName: '',
                        middleName: '',
                        lastName: '',
                        emailInitials: '',
                        password: '',
                        confirmPassword: '',
                        role: 'aide',
                        position: 'Aide',
                        userType: ''
                      });
                      localStorage.removeItem('adminUserFormData');
                      localStorage.removeItem('adminSelectedUserType');
                      setShowPassword(false);
                      setShowConfirmPassword(false);
                    }}
                  >
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Clear Form
                  </Button>
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={loadingUsers}
                  >
                    {loadingUsers ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Creating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-person-plus me-1"></i>
                        Create User Account
                      </>
                    )}
                  </Button>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </>
  );

  const renderViewEditUsers = () => (
    <>
      <div className="content-header">
        <h1>
          <i className="bi bi-people me-2 text-primary"></i>
          User Management
        </h1>
      </div>
      
      <div className="users-management">
        <div className="management-header">
          <h2 className="management-title">Registered Users</h2>
          <div className="management-actions">
            <div className="search-box">
              <i className="bi bi-search search-icon"></i>
              <input 
                type="text" 
                placeholder="Search users..." 
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant="success" 
              onClick={() => handleNavigation('Add User')}
              className="add-user-btn"
            >
              <i className="bi bi-person-plus"></i>
              Add New User
            </Button>
          </div>
        </div>
        
        <div className="table-container">
          <Table hover responsive className="data-table users-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Position</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Sample Admin User */}
              <tr>
                <td>USR-0001</td>
                <td>Admin User</td>
                <td>admin@maybunga.health</td>
                <td>Administrator</td>
                <td><span className="role-badge admin">Admin</span></td>
                <td><span className="status-badge active">Active</span></td>
                <td>Jan 15, 2023</td>
                <td className="action-cell">
                  <div className="user-actions">
                    <Button variant="outline-primary" size="sm" className="action-btn">
                      <i className="bi bi-pencil me-1"></i>
                      Edit
                    </Button>
                    <Button variant="outline-danger" size="sm" className="action-btn">
                      <i className="bi bi-person-x me-1"></i>
                      Deactivate
                    </Button>
                  </div>
                </td>
              </tr>
              
              {/* Sample Doctor User */}
              <tr>
                <td>USR-0002</td>
                <td>Dr. Maria Santos</td>
                <td>m.santos@maybunga.health</td>
                <td>Doctor</td>
                <td><span className="role-badge doctor">Doctor</span></td>
                <td><span className="status-badge active">Active</span></td>
                <td>Feb 20, 2023</td>
                <td className="action-cell">
                  <div className="user-actions">
                    <Button variant="outline-primary" size="sm" className="action-btn">
                      <i className="bi bi-pencil me-1"></i>
                      Edit
                    </Button>
                    <Button variant="outline-danger" size="sm" className="action-btn">
                      <i className="bi bi-person-x me-1"></i>
                      Deactivate
                    </Button>
                  </div>
                </td>
              </tr>
              
              {/* Sample Nurse User */}
              <tr>
                <td>USR-0003</td>
                <td>Elena Rodriguez</td>
                <td>e.rodriguez@maybunga.health</td>
                <td>Nurse</td>
                <td><span className="role-badge aide">Aide</span></td>
                <td><span className="status-badge active">Active</span></td>
                <td>Mar 10, 2023</td>
                <td className="action-cell">
                  <div className="user-actions">
                    <Button variant="outline-primary" size="sm" className="action-btn">
                      <i className="bi bi-pencil me-1"></i>
                      Edit
                    </Button>
                    <Button variant="outline-danger" size="sm" className="action-btn">
                      <i className="bi bi-person-x me-1"></i>
                      Deactivate
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </Table>
        </div>
      </div>
    </>
  );

  // User form handlers
  const handleAddUser = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (userFormData.password !== userFormData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (!userFormData.firstName || !userFormData.lastName || !userFormData.emailInitials || !userFormData.password) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoadingUsers(true);
      
      // Create email from initials
      const email = `${userFormData.emailInitials}@maybunga.health`;
      
      // Use the selected user type (admin/doctor) as the role
      const userData = {
        firstName: userFormData.firstName,
        middleName: userFormData.middleName,
        lastName: userFormData.lastName,
        emailInitials: userFormData.emailInitials,
        password: userFormData.password,
        accessLevel: selectedUserType === 'admin' ? 'Administrator' : 'Doctor', // Convert to proper access level
        position: userFormData.position || (selectedUserType === 'admin' ? 'System Administrator' : 'General Physician')
      };

      await userService.createUser(userData);
      
      // Refresh users list
      const response = await userService.getUsers();
      const usersWithAccessRights = (response.users || []).map(user => ({
        ...user,
        accessRights: user.accessRights || {
          dashboard: true,
          patients: true,
          families: true,
          appointments: true,
          reports: true,
          users: user.role === 'admin',
          settings: user.role === 'admin'
        }
      }));
      setUsers(usersWithAccessRights);
      setBackendConnected(true); // Mark as connected since operations succeeded
      
      alert(`Successfully created user account for ${userFormData.firstName} ${userFormData.lastName}.\n\nLogin credentials:\nEmail: ${userData.emailInitials}@maybunga.health\nPassword: [as provided]`);
      
      // Reset form and go back to user type selection
      setUserFormData({
        firstName: '',
        middleName: '',
        lastName: '',
        emailInitials: '',
        password: '',
        confirmPassword: '',
        role: 'aide',
        position: 'Aide',
        userType: ''
      });
      setShowUserTypeSelection(true);
      setSelectedUserType('');
      
      // Clear localStorage
      localStorage.removeItem('adminUserFormData');
      localStorage.removeItem('adminSelectedUserType');
      localStorage.removeItem('adminShowUserTypeSelection');
      
      // Close modal if it's open
      setShowAddUserModal(false);
      
    } catch (error) {
      console.error('Error creating user:', error);
      alert(`Error creating user: ${error.response?.data?.msg || error.message}`);
      
      // Only mark as disconnected for actual connection errors
      if (error.message.includes('Network Error') || 
          error.message.includes('ECONNREFUSED') ||
          error.response?.status === 500) {
        setBackendConnected(false);
      }
    } finally {
      setLoadingUsers(false);
    }
  };

  // Handle Edit User
  const handleEditUser = async (e) => {
    e.preventDefault();
    
    if (!selectedUser) {
      alert('No user selected for editing');
      return;
    }

    // Basic validation
    if (userFormData.password && userFormData.password !== userFormData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (!userFormData.firstName || !userFormData.lastName || !userFormData.emailInitials) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoadingUsers(true);
      
      const userData = {
        firstName: userFormData.firstName,
        middleName: userFormData.middleName,
        lastName: userFormData.lastName,
        emailInitials: userFormData.emailInitials,
        position: userFormData.position,
        role: userFormData.role
      };

      // Only include password if it's being changed
      if (userFormData.password) {
        userData.password = userFormData.password;
      }

      await userService.updateUser(selectedUser.id, userData);
      
      // Refresh users list
      const response = await userService.getUsers();
      const usersWithAccessRights = (response.users || []).map(user => ({
        ...user,
        accessRights: user.accessRights || {
          dashboard: true,
          patients: true,
          families: true,
          appointments: true,
          reports: true,
          users: user.role === 'admin',
          settings: user.role === 'admin'
        }
      }));
      setUsers(usersWithAccessRights);
      setBackendConnected(true);
      
      alert(`Successfully updated user account for ${userFormData.firstName} ${userFormData.lastName}`);
      
      // Reset form and close modal
      setUserFormData({
        firstName: '',
        middleName: '',
        lastName: '',
        emailInitials: '',
        password: '',
        confirmPassword: '',
        role: 'aide',
        position: 'Aide',
        userType: ''
      });
      setSelectedUser(null);
      setShowEditUserModal(false);
      
    } catch (error) {
      console.error('Error updating user:', error);
      alert(`Error updating user: ${error.response?.data?.msg || error.message}`);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (userToDelete) => {
    // Count admins and doctors
    const adminCount = users.filter(u => u.role === 'admin').length;
    const doctorCount = users.filter(u => u.role === 'doctor').length;
    
    // Prevent deletion if it's the last admin or doctor
    if (userToDelete.role === 'admin' && adminCount <= 1) {
      alert('Cannot delete the last administrator account. At least one admin must remain.');
      return;
    }
    
    if (userToDelete.role === 'doctor' && doctorCount <= 1) {
      alert('Cannot delete the last doctor account. At least one doctor must remain.');
      return;
    }

    // First confirmation
    const firstConfirm = window.confirm(
      `Are you sure you want to delete user "${userToDelete.firstName} ${userToDelete.lastName}"?\n\n` +
      `This action cannot be undone and will permanently remove:\n` +
      `• User account and login access\n` +
      `• All associated permissions\n` +
      `• User activity history\n\n` +
      `Click OK to continue or Cancel to abort.`
    );

    if (!firstConfirm) return;

    // Second confirmation
    const secondConfirm = window.confirm(
      `⚠️ FINAL CONFIRMATION ⚠️\n\n` +
      `You are about to PERMANENTLY DELETE:\n` +
      `User: ${userToDelete.firstName} ${userToDelete.lastName}\n` +
      `Email: ${userToDelete.email || userToDelete.username + '@maybunga.health'}\n` +
      `Role: ${userToDelete.role}\n\n` +
      `This action is IRREVERSIBLE!\n\n` +
      `Type "DELETE" in the next prompt if you are absolutely certain.`
    );

    if (!secondConfirm) return;

    // Final text confirmation
    const textConfirm = prompt(
      `To confirm deletion, type "DELETE" (all caps) below:`
    );

    if (textConfirm !== 'DELETE') {
      alert('Deletion cancelled. Text confirmation did not match.');
      return;
    }

    try {
      setLoadingUsers(true);
      
      await userService.deleteUser(userToDelete.id);
      
      // Refresh users list
      const response = await userService.getUsers();
      const usersWithAccessRights = (response.users || []).map(user => ({
        ...user,
        accessRights: user.accessRights || {
          dashboard: true,
          patients: true,
          families: true,
          appointments: true,
          reports: true,
          users: user.role === 'admin',
          settings: user.role === 'admin'
        }
      }));
      setUsers(usersWithAccessRights);
      setBackendConnected(true);
      
      alert(`User "${userToDelete.firstName} ${userToDelete.lastName}" has been successfully deleted.`);
      
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(`Error deleting user: ${error.response?.data?.msg || error.message}`);
    } finally {
      setLoadingUsers(false);
    }
  };

  return (
    <div className="admin-dashboard-wrapper">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h3 className="brand">
            <i className="bi bi-hospital"></i>
            <span className="text">Maybunga Healthcare</span>
          </h3>
        </div>
        <div className="sidebar-menu">
          <ul>
            <li className={currentPath === 'Dashboard' ? 'active' : ''} onClick={() => handleNavigation('Dashboard')}>
              <Link to="#">
                <i className="bi bi-speedometer2"></i>
                <span>Dashboard</span>
              </Link>
            </li>
            
            <li className={activeDropdown === 'checkup' ? 'dropdown active' : 'dropdown'}>
              <Link to="#" onClick={() => handleDropdownToggle('checkup')}>
                <i className="bi bi-clipboard-check"></i>
                <span>Check Up</span>
                <i className={`bi ${activeDropdown === 'checkup' ? 'bi-chevron-down' : 'bi-chevron-right'} dropdown-icon`}></i>
              </Link>
              <ul className={activeDropdown === 'checkup' ? 'dropdown-menu show' : 'dropdown-menu'}>
                <li onClick={() => handleNavigation("Today's Checkup")}>
                  <Link to="#">
                    <i className="bi bi-card-list"></i>
                    <span>Today's Checkup</span>
                  </Link>
                </li>
              </ul>
            </li>
            
            <li className={activeDropdown === 'patient' ? 'dropdown active' : 'dropdown'}>
              <Link to="#" onClick={() => handleDropdownToggle('patient')}>
                <i className="bi bi-people"></i>
                <span>Patient Management</span>
                <i className={`bi ${activeDropdown === 'patient' ? 'bi-chevron-down' : 'bi-chevron-right'} dropdown-icon`}></i>
              </Link>
              <ul className={activeDropdown === 'patient' ? 'dropdown-menu show' : 'dropdown-menu'}>
                <li onClick={() => handleNavigation('Patient Database')}>
                  <Link to="#">
                    <i className="bi bi-archive"></i>
                    <span>Patient Database</span>
                  </Link>
                </li>
              </ul>
            </li>
            
            <li className={activeDropdown === 'reports' ? 'dropdown active' : 'dropdown'}>
              <Link to="#" onClick={() => handleDropdownToggle('reports')}>
                <i className="bi bi-file-earmark-bar-graph"></i>
                <span>Reports</span>
                <i className={`bi ${activeDropdown === 'reports' ? 'bi-chevron-down' : 'bi-chevron-right'} dropdown-icon`}></i>
              </Link>
              <ul className={activeDropdown === 'reports' ? 'dropdown-menu show' : 'dropdown-menu'}>
                <li onClick={() => handleNavigation('Generate Reports')}>
                  <Link to="#">
                    <i className="bi bi-file-earmark-ruled"></i>
                    <span>Generate Reports</span>
                  </Link>
                </li>
                <li onClick={() => handleNavigation('Report History')}>
                  <Link to="#">
                    <i className="bi bi-collection"></i>
                    <span>Report History</span>
                  </Link>
                </li>
              </ul>
            </li>
            
            <li onClick={() => handleNavigation('Appointments')}>
              <Link to="#">
                <i className="bi bi-calendar-check"></i>
                <span>Appointments</span>
              </Link>
            </li>
            
            <li className={activeDropdown === 'notifications' ? 'dropdown active' : 'dropdown'}>
              <Link to="#" onClick={() => handleDropdownToggle('notifications')}>
                <i className="bi bi-bell"></i>
                <span>Notifications</span>
                <i className={`bi ${activeDropdown === 'notifications' ? 'bi-chevron-down' : 'bi-chevron-right'} dropdown-icon`}></i>
              </Link>
              <ul className={activeDropdown === 'notifications' ? 'dropdown-menu show' : 'dropdown-menu'}>
                <li onClick={() => handleNavigation('Notification Manager')}>
                  <Link to="#">
                    <i className="bi bi-chat-dots"></i>
                    <span>Send Notifications</span>
                  </Link>
                </li>
                <li onClick={() => handleNavigation('Notification History')}>
                  <Link to="#">
                    <i className="bi bi-clock-history"></i>
                    <span>Notification History</span>
                  </Link>
                </li>
              </ul>
            </li>
            
            <li onClick={() => handleNavigation('Manage Inventories')}>
              <Link to="#">
                <i className="bi bi-boxes"></i>
                <span>Manage Inventories</span>
              </Link>
            </li>
            
            <li className={activeDropdown === 'settings' ? 'dropdown active' : 'dropdown'}>
              <Link to="#" onClick={() => handleDropdownToggle('settings')}>
                <i className="bi bi-gear"></i>
                <span>Settings</span>
                <i className={`bi ${activeDropdown === 'settings' ? 'bi-chevron-down' : 'bi-chevron-right'} dropdown-icon`}></i>
              </Link>
              <ul className={activeDropdown === 'settings' ? 'dropdown-menu show' : 'dropdown-menu'}>
                <li onClick={() => handleNavigation('User Management')}>
                  <Link to="#">
                    <i className="bi bi-people-fill"></i>
                    <span>User Management</span>
                  </Link>
                </li>
                <li className={activeSubDropdown === 'systemConfig' ? 'sub-dropdown active' : 'sub-dropdown'}>
                  <Link to="#" onClick={(e) => handleSubDropdownToggle('systemConfig', e)}>
                    <i className="bi bi-gear-fill"></i>
                    <span>System Configuration</span>
                    <i className={`bi ${activeSubDropdown === 'systemConfig' ? 'bi-chevron-down' : 'bi-chevron-right'} dropdown-icon`}></i>
                  </Link>
                  <ul className={activeSubDropdown === 'systemConfig' ? 'sub-dropdown-menu show' : 'sub-dropdown-menu'}>
                    <li>
                      <Link to="#" className="sub-dropdown-item" onClick={() => setShowSimulationModal(true)}>
                        <i className="bi bi-clock"></i>
                        <span>Date & Time & Simulation</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="sub-dropdown-item">
                        <i className="bi bi-database"></i>
                        <span>Data Retention</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="sub-dropdown-item">
                        <i className="bi bi-graph-up"></i>
                        <span>Chart Simulation</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="sub-dropdown-item danger">
                        <i className="bi bi-exclamation-triangle"></i>
                        <span>Reset Check Up Data</span>
                      </Link>
                    </li>
                    <li>
                      <div className="sub-dropdown-item dark-mode-toggle">
                        <div className="dark-mode-info">
                          <i className="bi bi-moon"></i>
                          <span>Dark Mode</span>
                        </div>
                        <div className="form-check form-switch">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            role="switch" 
                            id="darkModeSwitch"
                            checked={isDarkMode}
                            onChange={handleDarkModeToggle}
                          />
                        </div>
                      </div>
                    </li>
                  </ul>
                </li>
                <li className={activeSubDropdown === 'backupRestore' ? 'sub-dropdown active' : 'sub-dropdown'}>
                  <Link to="#" onClick={(e) => handleSubDropdownToggle('backupRestore', e)}>
                    <i className="bi bi-cloud-arrow-up"></i>
                    <span>Backup and Restore</span>
                    <i className={`bi ${activeSubDropdown === 'backupRestore' ? 'bi-chevron-down' : 'bi-chevron-right'} dropdown-icon`}></i>
                  </Link>
                  <ul className={activeSubDropdown === 'backupRestore' ? 'sub-dropdown-menu show' : 'sub-dropdown-menu'}>
                    <li>
                      <Link to="#" className="sub-dropdown-item" onClick={handleCreateBackup}>
                        <i className="bi bi-download"></i>
                        <span>{isCreatingBackup ? 'Creating Backup...' : 'Create Backup'}</span>
                      </Link>
                    </li>
                    <li>
                      <label htmlFor="backup-file-input" className="sub-dropdown-item" style={{cursor: 'pointer'}}>
                        <i className="bi bi-upload"></i>
                        <span>{isRestoringBackup ? 'Restoring...' : 'Restore Backup'}</span>
                        <input 
                          id="backup-file-input"
                          type="file" 
                          accept=".json"
                          onChange={handleBackupFileSelect}
                          style={{display: 'none'}}
                          disabled={isRestoringBackup}
                        />
                      </label>
                    </li>
                    <li>
                      <Link to="#" className="sub-dropdown-item" onClick={() => setShowBackupSettingsModal(true)}>
                        <i className="bi bi-gear"></i>
                        <span>Backup Settings</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="sub-dropdown-item" onClick={handleToggleAutoBackup}>
                        <i className={`bi ${autoBackupSettings.enabled ? 'bi-check-circle-fill' : 'bi-circle'}`}></i>
                        <span>{autoBackupSettings.enabled ? 'Disable Auto Backup' : 'Enable Auto Backup'}</span>
                      </Link>
                    </li>
                  </ul>
                </li>
              </ul>
            </li>
          </ul>
        </div>
        <button className="sidebar-hamburger" onClick={toggleSidebar} aria-label="Toggle sidebar">
          <i className={`bi ${sidebarOpen ? 'bi-x' : 'bi-list'}`}></i>
        </button>
      </div>

      {/* Main Content */}
      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* Top Navigation Bar */}
        <div className="topbar">
          <div className="path-info">
            <span>YOU ARE HERE</span>
            <i className="bi bi-chevron-right"></i>
            <span>{currentPath}</span>
            {currentPath === 'Dashboard' && (
              <>
                <i className="bi bi-chevron-right"></i>
                <span>{dashboardTabKey === 'analytics' ? 'Analytics' : 'Forecasting'}</span>
              </>
            )}
            {currentPath === 'Manage Inventories' && (
              <>
                <i className="bi bi-chevron-right"></i>
                <span>{inventoryTabKey === 'vaccines' ? 'Vaccines' : 'Prescriptions'}</span>
              </>
            )}
          </div>
          <div className="user-info">
            <div className="date-time">
              <span>{formatDateWithTime(simulationMode.enabled ? simulationMode.currentSimulatedDate : currentDateTime)}</span>
              {simulationMode.enabled && (
                <span className="simulation-indicator">
                  <i className="bi bi-lightning-charge me-1"></i>
                  Simulating
                </span>
              )}
            </div>
            <div className="user">
              <span className="user-name">
                {user ? `${user.firstName} ${user.lastName}` : 'User'}
              </span>
              <div className="user-avatar">
                <i className="bi bi-person-circle"></i>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right"></i>
            </button>
          </div>
        </div>

        {/* Unified Content Header */}
        <div className="content-header">
          <h1>
            {/* This could be made more dynamic based on currentPath if needed */}
            {currentPath}
          </h1>
          {currentPath === 'Dashboard' && (
            <button className="refresh-btn" onClick={handleRefreshData}>
              <i className="bi bi-arrow-clockwise"></i>
              Refresh Data
            </button>
          )}
        </div>

        {/* Dashboard Content - Dynamically rendered based on navigation */}
        <div className="dashboard-content">
          {renderContent()}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal show={showLogoutModal} onHide={() => setShowLogoutModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Logout</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to logout?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLogoutModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmLogout}>
            Yes, Logout
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Email Confirmation Modal */}
      <Modal show={showEmailConfirmModal} onHide={() => setShowEmailConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Email Required</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Email field is empty.</p>
          <p>Please either:</p>
          <ul>
            <li>Enter a valid email address, OR</li>
            <li>Type "N/A" if the patient has no email</li>
          </ul>
          <p>Would you like to go back and fill the email field?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowEmailConfirmModal(false);
              // Set email to "N/A" and continue with save
              setPatientFormData(prev => ({ ...prev, email: 'N/A' }));
              // Call save function again but this time with N/A email
              setTimeout(() => {
                handleSavePatient();
              }, 100);
            }}
          >
            Set as "N/A" and Continue
          </Button>
          <Button 
            variant="primary" 
            onClick={() => setShowEmailConfirmModal(false)}
          >
            Go Back to Fill Email
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Vital Signs Modal - Modernized with Medical Validation */}
      <Modal 
        show={showVitalSignsModal} 
        onHide={() => setShowVitalSignsModal(false)}
        size="lg"
        className="vital-signs-modal"
      >
        <Modal.Header closeButton className="vital-signs-header">
          <Modal.Title>
            <i className="bi bi-heart-pulse me-2 text-warning"></i>
            {isVitalSignsEditMode ? 'Record Vital Signs' : 'View Vital Signs'}
            {!isVitalSignsEditMode && (
              <span className="badge bg-info ms-2">
                <i className="bi bi-eye me-1"></i>Read Only
              </span>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="vital-signs-body">
          {selectedPatient && (
            <div className="patient-profile-card">
              <div className="patient-avatar">
                <i className="bi bi-person-circle"></i>
              </div>
              <div className="patient-info">
                <h4>{getPatientFullName(selectedPatient)}</h4>
                <div className="patient-meta">
                  <span className="patient-id">PT-{String(selectedPatient.id).padStart(4, '0')}</span>
                  <span className="patient-age">{getPatientAge(selectedPatient)} years old</span>
                  <span className="patient-gender">{selectedPatient.gender}</span>
                </div>
              </div>
            </div>
          )}

          <Form className="modern-vital-signs-form">
            {/* Primary Vital Signs Row */}
            <div className="vital-signs-section">
              <h5 className="section-title">
                <i className="bi bi-thermometer-half me-2"></i>
                Primary Vital Signs
              </h5>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group controlId="temperature">
                    <Form.Label className="vital-label">
                      Temperature <span className="normal-range">(Normal: 36.1-37.2°C)</span>
                    </Form.Label>
                    <InputGroup className="vital-input-group">
                      <Form.Select 
                        className="vital-select"
                        value={vitalSignsFormData.temperature}
                        onChange={(e) => handleVitalSignsFormChange('temperature', e.target.value)}
                        disabled={!isVitalSignsEditMode}
                      >
                        <option value="">Select temperature...</option>
                        {Array.from({length: 71}, (_, i) => {
                          const temp = (35.0 + (i * 0.1)).toFixed(1);
                          const isNormal = temp >= 36.1 && temp <= 37.2;
                          const isFever = temp > 37.2;
                          const isHypothermia = temp < 35.0;
                          let status = '';
                          if (isFever) status = ' (Fever)';
                          else if (isHypothermia) status = ' (Hypothermia)';
                          else if (isNormal) status = ' (Normal)';
                          
                          return (
                            <option key={temp} value={temp} className={isNormal ? 'normal-value' : isFever ? 'high-value' : 'low-value'}>
                              {temp}°C{status}
                            </option>
                          );
                        })}
                      </Form.Select>
                      <InputGroup.Text className="unit-text">°C</InputGroup.Text>
                    </InputGroup>
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group controlId="heartRate">
                    <Form.Label className="vital-label">
                      Heart Rate <span className="normal-range">(Normal: 60-100 bpm)</span>
                    </Form.Label>
                    <InputGroup className="vital-input-group">
                      <Form.Select 
                        className="vital-select"
                        value={vitalSignsFormData.heartRate}
                        onChange={(e) => handleVitalSignsFormChange('heartRate', e.target.value)}
                        disabled={!isVitalSignsEditMode}
                      >
                        <option value="">Select heart rate...</option>
                        {Array.from({length: 71}, (_, i) => {
                          const rate = 50 + i;
                          const isNormal = rate >= 60 && rate <= 100;
                          const isTachy = rate > 100;
                          const isBrady = rate < 60;
                          let status = '';
                          if (isTachy) status = ' (Tachycardia)';
                          else if (isBrady) status = ' (Bradycardia)';
                          else if (isNormal) status = ' (Normal)';
                          
                          return (
                            <option key={rate} value={rate} className={isNormal ? 'normal-value' : isTachy ? 'high-value' : 'low-value'}>
                              {rate} bpm{status}
                            </option>
                          );
                        })}
                      </Form.Select>
                      <InputGroup.Text className="unit-text">bpm</InputGroup.Text>
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Blood Pressure Section */}
            <div className="vital-signs-section">
              <h5 className="section-title">
                <i className="bi bi-activity me-2"></i>
                Blood Pressure
              </h5>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group controlId="systolicBP">
                    <Form.Label className="vital-label">
                      Systolic <span className="normal-range">(Normal: 90-120 mmHg)</span>
                    </Form.Label>
                    <InputGroup className="vital-input-group">
                      <Form.Select 
                        className="vital-select"
                        value={vitalSignsFormData.systolicBP}
                        onChange={(e) => handleVitalSignsFormChange('systolicBP', e.target.value)}
                        disabled={!isVitalSignsEditMode}
                      >
                        <option value="">Select systolic...</option>
                        {Array.from({length: 91}, (_, i) => {
                          const systolic = 90 + i;
                          const isNormal = systolic >= 90 && systolic <= 120;
                          const isElevated = systolic > 120 && systolic <= 139;
                          const isHigh = systolic >= 140;
                          let status = '';
                          if (isHigh) status = ' (High)';
                          else if (isElevated) status = ' (Elevated)';
                          else if (isNormal) status = ' (Normal)';
                          
                          return (
                            <option key={systolic} value={systolic} className={isNormal ? 'normal-value' : isElevated ? 'elevated-value' : 'high-value'}>
                              {systolic} mmHg{status}
                            </option>
                          );
                        })}
                      </Form.Select>
                      <InputGroup.Text className="unit-text">mmHg</InputGroup.Text>
                    </InputGroup>
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group controlId="diastolicBP">
                    <Form.Label className="vital-label">
                      Diastolic <span className="normal-range">(Normal: 60-80 mmHg)</span>
                    </Form.Label>
                    <InputGroup className="vital-input-group">
                      <Form.Select 
                        className="vital-select"
                        value={vitalSignsFormData.diastolicBP}
                        onChange={(e) => handleVitalSignsFormChange('diastolicBP', e.target.value)}
                        disabled={!isVitalSignsEditMode}
                      >
                        <option value="">Select diastolic...</option>
                        {Array.from({length: 51}, (_, i) => {
                          const diastolic = 60 + i;
                          const isNormal = diastolic >= 60 && diastolic <= 80;
                          const isElevated = diastolic > 80 && diastolic <= 89;
                          const isHigh = diastolic >= 90;
                          let status = '';
                          if (isHigh) status = ' (High)';
                          else if (isElevated) status = ' (Elevated)';
                          else if (isNormal) status = ' (Normal)';
                          
                          return (
                            <option key={diastolic} value={diastolic} className={isNormal ? 'normal-value' : isElevated ? 'elevated-value' : 'high-value'}>
                              {diastolic} mmHg{status}
                            </option>
                          );
                        })}
                      </Form.Select>
                      <InputGroup.Text className="unit-text">mmHg</InputGroup.Text>
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Respiratory & Oxygen Section */}
            <div className="vital-signs-section">
              <h5 className="section-title">
                <i className="bi bi-lungs me-2"></i>
                Respiratory Assessment
              </h5>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group controlId="respiratoryRate">
                    <Form.Label className="vital-label">
                      Respiratory Rate <span className="normal-range">(Normal: 12-20 brpm)</span>
                    </Form.Label>
                    <InputGroup className="vital-input-group">
                      <Form.Select 
                        className="vital-select"
                        value={vitalSignsFormData.respiratoryRate}
                        onChange={(e) => handleVitalSignsFormChange('respiratoryRate', e.target.value)}
                        disabled={!isVitalSignsEditMode}
                      >
                        <option value="">Select respiratory rate...</option>
                        {Array.from({length: 23}, (_, i) => {
                          const rate = 8 + i;
                          const isNormal = rate >= 12 && rate <= 20;
                          const isTachy = rate > 20;
                          const isBrady = rate < 12;
                          let status = '';
                          if (isTachy) status = ' (Tachypnea)';
                          else if (isBrady) status = ' (Bradypnea)';
                          else if (isNormal) status = ' (Normal)';
                          
                          return (
                            <option key={rate} value={rate} className={isNormal ? 'normal-value' : isTachy ? 'high-value' : 'low-value'}>
                              {rate} brpm{status}
                            </option>
                          );
                        })}
                      </Form.Select>
                      <InputGroup.Text className="unit-text">brpm</InputGroup.Text>
                    </InputGroup>
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group controlId="oxygenSaturation">
                    <Form.Label className="vital-label">
                      Oxygen Saturation <span className="normal-range">(Normal: 95-100%)</span>
                    </Form.Label>
                    <InputGroup className="vital-input-group">
                      <Form.Select 
                        className="vital-select"
                        value={vitalSignsFormData.oxygenSaturation}
                        onChange={(e) => handleVitalSignsFormChange('oxygenSaturation', e.target.value)}
                        disabled={!isVitalSignsEditMode}
                      >
                        <option value="">Select oxygen saturation...</option>
                        {Array.from({length: 31}, (_, i) => {
                          const saturation = 70 + i;
                          const isNormal = saturation >= 95;
                          const isLow = saturation < 90;
                          const isMild = saturation >= 90 && saturation < 95;
                          let status = '';
                          if (isLow) status = ' (Severe Hypoxemia)';
                          else if (isMild) status = ' (Mild Hypoxemia)';
                          else if (isNormal) status = ' (Normal)';
                          
                          return (
                            <option key={saturation} value={saturation} className={isNormal ? 'normal-value' : isMild ? 'elevated-value' : 'low-value'}>
                              {saturation}%{status}
                            </option>
                          );
                        })}
                      </Form.Select>
                      <InputGroup.Text className="unit-text">%</InputGroup.Text>
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Physical Measurements Section */}
            <div className="vital-signs-section">
              <h5 className="section-title">
                <i className="bi bi-rulers me-2"></i>
                Physical Measurements
              </h5>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group controlId="weight">
                    <div className="vital-label-with-toggle">
                      <Form.Label className="vital-label">
                        Weight <span className="normal-range-fixed">(Range: 2.0-300.0 {weightUnit})</span>
                      </Form.Label>
                      <div className="unit-toggle">
                        <Button 
                          variant={weightUnit === 'kg' ? 'primary' : 'outline-secondary'}
                          size="sm"
                          onClick={() => setWeightUnit('kg')}
                          className="unit-btn"
                        >
                          kg
                        </Button>
                        <Button 
                          variant={weightUnit === 'lbs' ? 'primary' : 'outline-secondary'}
                          size="sm"
                          onClick={() => setWeightUnit('lbs')}
                          className="unit-btn"
                        >
                          lbs
                        </Button>
                      </div>
                    </div>
                    <InputGroup className="vital-input-group">
                      <Form.Select 
                        className="vital-select"
                        value={vitalSignsFormData.weight}
                        onChange={(e) => handleVitalSignsFormChange('weight', e.target.value)}
                        disabled={!isVitalSignsEditMode}
                      >
                        <option value="">Select weight...</option>
                        {generateWeightOptions()}
                      </Form.Select>
                      <InputGroup.Text className="unit-text">{weightUnit}</InputGroup.Text>
                    </InputGroup>
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group controlId="height">
                    <div className="vital-label-with-toggle">
                      <Form.Label className="vital-label">
                        Height <span className="normal-range-fixed">(Range: 40-250 {heightUnit})</span>
                      </Form.Label>
                      <div className="unit-toggle">
                        <Button 
                          variant={heightUnit === 'cm' ? 'primary' : 'outline-secondary'}
                          size="sm"
                          onClick={() => setHeightUnit('cm')}
                          className="unit-btn"
                        >
                          cm
                        </Button>
                        <Button 
                          variant={heightUnit === 'ft' ? 'primary' : 'outline-secondary'}
                          size="sm"
                          onClick={() => setHeightUnit('ft')}
                          className="unit-btn"
                        >
                          ft
                        </Button>
                      </div>
                    </div>
                    <InputGroup className="vital-input-group">
                      <Form.Select 
                        className="vital-select"
                        value={vitalSignsFormData.height}
                        onChange={(e) => handleVitalSignsFormChange('height', e.target.value)}
                        disabled={!isVitalSignsEditMode}
                      >
                        <option value="">Select height...</option>
                        {generateHeightOptions()}
                      </Form.Select>
                      <InputGroup.Text className="unit-text">{heightUnit}</InputGroup.Text>
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Notes Section */}
            <div className="vital-signs-section">
              <h5 className="section-title">
                <i className="bi bi-clipboard-pulse me-2"></i>
                Clinical Notes
              </h5>
              <Form.Group controlId="clinicalNotes">
                <Form.Label className="vital-label">Additional Observations</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={3} 
                  placeholder="Enter any additional clinical observations, patient symptoms, or relevant notes..."
                  className="notes-textarea"
                  value={vitalSignsFormData.clinicalNotes}
                  onChange={(e) => handleVitalSignsFormChange('clinicalNotes', e.target.value)}
                  disabled={!isVitalSignsEditMode}
                />
              </Form.Group>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer className="vital-signs-footer">
          <div className="footer-actions">
            <Button variant="outline-secondary" onClick={() => setShowVitalSignsModal(false)}>
              <i className="bi bi-x-circle me-1"></i>
              Cancel
            </Button>
            
            {/* Show Edit button when in read-only mode and user is admin */}
            {!isVitalSignsEditMode && user && user.role === 'admin' && (
              <Button 
                variant="outline-warning" 
                onClick={() => setIsVitalSignsEditMode(true)}
              >
                <i className="bi bi-pencil me-1"></i>
                Edit Vital Signs
              </Button>
            )}
            
            {/* Show Save button when in edit mode */}
            {isVitalSignsEditMode && (
              <Button variant="success" className="save-vital-btn" onClick={handleSaveVitalSigns}>
                <i className="bi bi-check-circle me-1"></i>
                {todaysCheckups.find(c => c.patientId === selectedPatient?.id)?.vitalSignsComplete 
                  ? 'Update Vital Signs' 
                  : 'Save Vital Signs'
                }
              </Button>
            )}
          </div>
        </Modal.Footer>
      </Modal>
      
      {/* QR Code Modal */}
      <Modal 
        show={showQRCodeModal} 
        onHide={() => setShowQRCodeModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-qr-code me-2"></i>
            Patient Login QR Code
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {selectedPatient && (
            <>
              <div className="mb-4">
                <h5 className="text-primary">Maybunga Health Center</h5>
                <p className="text-muted">Patient Check-in QR Code</p>
              </div>
              
              <Row>
                <Col md={6}>
                  <div className="patient-info-card p-3 mb-3" style={{backgroundColor: isDarkMode ? '#2d3748' : '#f8f9fa', borderRadius: '8px'}}>
                    <h6 className="mb-3">Patient Information</h6>
                    <div className="text-start">
                      <strong>Name:</strong> {getPatientFullName(selectedPatient)}<br />
                      <strong>Patient ID:</strong> PT-{String(selectedPatient.id).padStart(4, '0')}<br />
                      <strong>Date of Birth:</strong> {selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : 'N/A'}<br />
                      <strong>Contact:</strong> {getPatientContact(selectedPatient)}
                    </div>
                  </div>
                  
                  <div className="login-initials-card p-3" style={{backgroundColor: isDarkMode ? '#4a5568' : '#e3f2fd', borderRadius: '8px', border: '2px solid #2196f3'}}>
                    <h6 className="mb-2">Login Initials</h6>
                    <div style={{fontSize: '24px', fontWeight: 'bold', color: '#2196f3', fontFamily: 'monospace'}}>
                      {generatePatientLoginInitials(selectedPatient)}
                    </div>
                    <small className="text-muted">Use these initials for manual login if QR scanner is unavailable</small>
                  </div>
                </Col>
                
                <Col md={6}>
                  <div className="qr-container p-3" style={{backgroundColor: 'white', borderRadius: '8px', border: '1px solid #ddd'}}>
                    <QRCode 
                      id="qr-modal-canvas"
                      value={generateQRCodeData(selectedPatient)}
                      size={200}
                      bgColor={"#ffffff"}
                      fgColor={"#000000"}
                      level={"H"}
                      includeMargin={true}
                    />
                  </div>
                  
                  <div className="mt-3">
                    <small className="text-muted">
                      <i className="bi bi-info-circle me-1"></i>
                      Scan this QR code at the healthcare center for quick check-in
                    </small>
                  </div>
                </Col>
              </Row>
              
              <div className="instructions mt-4 p-3" style={{backgroundColor: isDarkMode ? '#2d3748' : '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107'}}>
                <h6 className="mb-2">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Important Instructions
                </h6>
                <div className="text-start small">
                  <ul className="mb-0">
                    <li>Present this QR code at the reception desk for quick check-in</li>
                    <li>Alternatively, provide the login initials: <strong>{generatePatientLoginInitials(selectedPatient)}</strong></li>
                    <li>This QR code is for healthcare center use only - do not share online</li>
                    <li>Print or save this QR code for future visits</li>
                    <li>Contact the health center if you experience any login issues</li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowQRCodeModal(false)}>
            <i className="bi bi-x-circle me-2"></i>
            Close
          </Button>
          <Button variant="outline-primary" onClick={handleDownloadQRCode}>
            <i className="bi bi-download me-2"></i>
            Download QR Code
          </Button>
          <Button variant="primary" onClick={handlePrintQRCode}>
            <i className="bi bi-printer me-2"></i>
            Print QR Code
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Patient Details Modal - System-Compliant Design */}
      <Modal 
        show={showPatientDetailsModal} 
        onHide={() => {
          setShowPatientDetailsModal(false);
          setShowManageDropdown(false);
        }}
        size="xl"
        centered
        className="patient-details-modal"
      >
        <Modal.Header 
          closeButton 
          style={{
            background: 'var(--sidebar-bg)', 
            color: 'var(--sidebar-text)', 
            border: 'none',
            borderRadius: '12px 12px 0 0'
          }}
        >
          <Modal.Title className="d-flex align-items-center">
            <i className="bi bi-person-circle me-3" style={{fontSize: '1.5rem'}}></i>
            Patient Information
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body style={{background: 'var(--bg-primary)', padding: 0}}>
          {selectedPatient && (
            <div style={{padding: '24px'}}>
              {/* Header Section with Patient Name and Actions */}
              <div className="d-flex justify-content-between align-items-center mb-4" style={{
                background: 'var(--bg-secondary)', 
                padding: '20px', 
                borderRadius: '12px',
                border: '1px solid var(--border-primary)'
              }}>
                <div>
                  <h3 style={{color: 'var(--text-primary)', margin: 0, fontWeight: 600}}>
                    {selectedPatient.fullName || getPatientFullName(selectedPatient)}
                  </h3>
                  <span style={{
                    color: 'var(--accent-primary)', 
                    fontSize: '0.9rem', 
                    fontWeight: 500
                  }}>
                    Patient ID: PT-{String(selectedPatient.id).padStart(4, '0')}
                  </span>
                </div>
                
                {/* Service Selection for Check-in */}
                <div style={{
                  background: 'var(--bg-tertiary)', 
                  padding: '15px', 
                  borderRadius: '8px',
                  border: '1px solid var(--border-primary)',
                  marginBottom: '15px'
                }}>
                  
                <div className="d-flex gap-2">
                  <Button 
                    variant="primary" 
                    size="sm"
                    style={{borderRadius: '8px', fontWeight: 500}}
                    onClick={() => handleAutoLogin(selectedPatient)}
                  >
                    <i className="bi bi-check-circle me-1"></i>
                    Auto Login
                  </Button>
                  <Button 
                    variant="outline-success" 
                    size="sm"
                    style={{borderRadius: '8px', fontWeight: 500}}
                    onClick={() => handleQRCode(selectedPatient)}
                  >
                    <i className="bi bi-qr-code me-1"></i>
                    Generate QR
                  </Button>
                  <div className="position-relative">
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={handleManageDropdown}
                      style={{borderRadius: '8px', fontWeight: 500}}
                    >
                      <i className="bi bi-gear me-1"></i>
                      Manage
                      <i className={`bi ${showManageDropdown ? 'bi-chevron-up' : 'bi-chevron-down'} ms-1`}></i>
                    </Button>
                    {showManageDropdown && (
                      <div 
                        className="position-absolute" 
                        style={{
                          top: '100%',
                          right: 0,
                          zIndex: 1000,
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-primary)',
                          borderRadius: '8px',
                          minWidth: '200px',
                          marginTop: '4px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                      >
                        <button 
                          className="w-100 btn btn-sm text-start d-flex align-items-center gap-2"
                          onClick={handleReassignFamily}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--warning)',
                            padding: '8px 16px'
                          }}
                        >
                          <i className="bi bi-arrow-left-right"></i>
                          Reassign to New Family
                        </button>
                        <hr style={{margin: '4px 0', borderColor: 'var(--border-primary)'}} />
                        <button 
                          className="w-100 btn btn-sm text-start d-flex align-items-center gap-2"
                          onClick={handleDeletePatient}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--error)',
                            padding: '8px 16px'
                          }}
                        >
                          <i className="bi bi-trash"></i>
                          Delete Patient
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                </div>
              </div>

              {/* Information Cards Grid */}
              <PatientInfoCards selectedPatient={selectedPatient} />

              {/* Patient Actions Section */}
              <PatientActionsSection 
                selectedPatient={selectedPatient}
                handleCheckupHistory={handleCheckupHistory}
                handleVitalSignsHistory={handleVitalSignsHistory}
                handleTreatmentRecord={handleTreatmentRecord}
                handleImmunizationHistory={handleImmunizationHistory}
                handleReferralForm={handleReferralForm}
                handleSMSNotification={handleSMSNotification}
              />

              {/* Footer Note */}
              <div className="text-center mt-3">
                <small style={{color: 'var(--text-secondary)', fontStyle: 'italic'}}>
                  More patient details and actions will be available once backend is integrated.
                </small>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Confirmation Modal for Manage Actions */}
      <Modal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        centered
        size="sm"
      >
        <Modal.Header 
          closeButton
          style={{
            background: confirmAction === 'delete' ? 'var(--error)' : 'var(--warning)',
            color: 'white',
            border: 'none'
          }}
        >
          <Modal.Title>
            <i className={`bi ${confirmAction === 'delete' ? 'bi-exclamation-triangle' : 'bi-question-circle'} me-2`}></i>
            {confirmAction === 'reassign' ? 'Confirm Family Reassignment' : 'Confirm Patient Deletion'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{background: 'var(--bg-secondary)'}}>
          <div className="text-center">
            <div className="mb-3">
              <i 
                className={`bi ${confirmAction === 'delete' ? 'bi-exclamation-triangle' : 'bi-question-circle'}`}
                style={{
                  fontSize: '3rem',
                  color: confirmAction === 'delete' ? 'var(--error)' : 'var(--warning)'
                }}
              ></i>
            </div>
            <div>
              {confirmAction === 'reassign' ? (
                <>
                  <h6 style={{color: 'var(--text-primary)'}}>
                    Are you sure you want to reassign this patient to a new family?
                  </h6>
                  <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>
                    This action will remove the patient from their current family and allow you to assign them to a different family.
                  </p>
                </>
              ) : (
                <>
                  <h6 style={{color: 'var(--text-primary)'}}>
                    Are you sure you want to delete this patient?
                  </h6>
                  <p style={{color: 'var(--error)', fontSize: '0.9rem'}}>
                    This action cannot be undone. All patient data will be permanently removed from the system.
                  </p>
                </>
              )}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer style={{background: 'var(--bg-primary)', border: 'none'}}>
          <Button 
            variant="outline-secondary" 
            onClick={() => setShowConfirmModal(false)}
            size="sm"
          >
            Cancel
          </Button>
          <Button 
            variant={confirmAction === 'delete' ? 'danger' : 'warning'}
            onClick={confirmActionHandler}
            disabled={countdown > 0}
            size="sm"
          >
            {countdown > 0 ? `Wait ${countdown}s` : (confirmAction === 'reassign' ? 'Reassign Patient' : 'Continue to Delete')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Second Confirmation Modal for Delete Action */}
      <Modal
        show={showSecondConfirmModal}
        onHide={() => setShowSecondConfirmModal(false)}
        centered
        size="sm"
      >
        <Modal.Header 
          closeButton
          style={{
            background: 'var(--error)',
            color: 'white',
            border: 'none'
          }}
        >
          <Modal.Title>
            <i className="bi bi-exclamation-triangle me-2"></i>
            Final Confirmation - Delete Patient
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{background: 'var(--bg-secondary)'}}>
          <div className="text-center">
            <div className="mb-3">
              <i 
                className="bi bi-exclamation-triangle"
                style={{
                  fontSize: '3rem',
                  color: 'var(--error)'
                }}
              ></i>
            </div>
            <div>
              <h6 style={{color: 'var(--text-primary)'}}>
                FINAL WARNING: This action is irreversible!
              </h6>
              <p style={{color: 'var(--error)', fontSize: '0.9rem', fontWeight: 600}}>
                You are about to permanently delete:
              </p>
              <div style={{
                background: 'var(--bg-primary)',
                padding: '10px',
                borderRadius: '8px',
                border: '2px solid var(--error)',
                margin: '10px 0'
              }}>
                <strong style={{color: 'var(--text-primary)'}}>
                  {selectedPatient?.fullName || getPatientFullName(selectedPatient)}
                </strong>
                <br />
                <small style={{color: 'var(--text-secondary)'}}>
                  Patient ID: PT-{String(selectedPatient?.id).padStart(4, '0')}
                </small>
              </div>
              <p style={{color: 'var(--error)', fontSize: '0.8rem'}}>
                All medical records, appointments, and patient data will be lost forever.
              </p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer style={{background: 'var(--bg-primary)', border: 'none'}}>
          <Button 
            variant="outline-secondary" 
            onClick={() => setShowSecondConfirmModal(false)}
            size="sm"
          >
            Cancel - Keep Patient
          </Button>
          <Button 
            variant="danger"
            onClick={confirmSecondActionHandler}
            disabled={secondCountdown > 0}
            size="sm"
            style={{
              background: secondCountdown > 0 ? 'var(--text-secondary)' : 'var(--error)',
              borderColor: secondCountdown > 0 ? 'var(--text-secondary)' : 'var(--error)'
            }}
          >
            {secondCountdown > 0 ? `Wait ${secondCountdown}s` : 'DELETE PERMANENTLY'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Patient Modal */}
      <Modal
        show={showAddPatientModal}
        onHide={() => setShowAddPatientModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Add New Patient</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Card className="mb-3" bg={isDarkMode ? 'dark' : 'light'}>
              <Card.Header as="h5" className="my-2" style={isDarkMode ? {background: 'var(--bg-tertiary)', color: 'var(--text-primary)'} : {}}>Personal Information</Card.Header>
              <Card.Body style={isDarkMode ? {background: 'var(--bg-secondary)', color: 'var(--text-primary)'} : {}}>
                <Row className="mb-3">
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>First Name <span style={{color: 'red'}}>*</span></Form.Label>
                      <Form.Control 
                        type="text" 
                        value={patientFormData.firstName} 
                        onChange={(e) => handlePatientFormChange('firstName', e.target.value)} 
                        required 
                        className={isDarkMode ? 'dark-mode-form-control' : ''}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Middle Name</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={patientFormData.middleName} 
                        onChange={(e) => handlePatientFormChange('middleName', e.target.value)}
                        className={isDarkMode ? 'dark-mode-form-control' : ''}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Last Name <span style={{color: 'red'}}>*</span></Form.Label>
                      <Form.Control 
                        type="text" 
                        value={patientFormData.lastName} 
                        onChange={(e) => handlePatientFormChange('lastName', e.target.value)} 
                        required 
                        className={isDarkMode ? 'dark-mode-form-control' : ''}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Suffix</Form.Label>
                      <Form.Select 
                        value={patientFormData.suffix} 
                        onChange={(e) => handlePatientFormChange('suffix', e.target.value)}
                        className={isDarkMode ? 'dark-mode-select' : ''}
                      >
                        <option value="">Select</option>
                        <option value="Jr.">Jr.</option>
                        <option value="Sr.">Sr.</option>
                        <option value="II">II</option>
                        <option value="III">III</option>
                        <option value="IV">IV</option>
                        <option value="V">V</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row className="mb-3">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Date of Birth <span style={{color: 'red'}}>*</span></Form.Label>
                      <DatePicker 
                        selected={patientFormData.dateOfBirth} 
                        onChange={(date) => handlePatientFormChange('dateOfBirth', date)} 
                        className={`form-control ${isDarkMode ? 'dark-mode-form-control' : ''}`}
                        dateFormat="MM/dd/yyyy"
                        maxDate={new Date()}
                        showYearDropdown
                        showMonthDropdown
                        dropdownMode="select"
                        scrollableYearDropdown
                        yearDropdownItemNumber={100}
                        placeholderText="MM/DD/YYYY"
                        required
                        calendarClassName={isDarkMode ? 'dark-mode-calendar' : ''}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>Age</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={patientFormData.age} 
                        readOnly 
                        className={isDarkMode ? 'dark-mode-form-control' : ''}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Gender <span style={{color: 'red'}}>*</span></Form.Label>
                      <Form.Select
                        value={patientFormData.gender}
                        onChange={(e) => handlePatientFormChange('gender', e.target.value)}
                        required
                        className={isDarkMode ? 'dark-mode-select' : ''}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Civil Status <span style={{color: 'red'}}>*</span></Form.Label>
                      <Form.Select
                        value={patientFormData.civilStatus}
                        onChange={(e) => handlePatientFormChange('civilStatus', e.target.value)}
                        required
                        className={isDarkMode ? 'dark-mode-select' : ''}
                      >
                        <option value="">Select Status</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
            
            <Card className="mb-3" bg={isDarkMode ? 'dark' : 'light'}>
              <Card.Header as="h5" className="my-2" style={isDarkMode ? {background: 'var(--bg-tertiary)', color: 'var(--text-primary)'} : {}}>Contact Information</Card.Header>
              <Card.Body style={isDarkMode ? {background: 'var(--bg-secondary)', color: 'var(--text-primary)'} : {}}>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Email (Optional)</Form.Label>
                      <Form.Control 
                        type="email" 
                        value={patientFormData.email} 
                        onChange={(e) => handlePatientFormChange('email', e.target.value)}
                        placeholder="Enter email or 'N/A' if none"
                        className={isDarkMode ? 'dark-mode-form-control' : ''}
                      />
                      <Form.Text className="text-muted">
                        Optional: Enter a valid email address or type "N/A" if the patient has no email
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Phone Number <span style={{color: 'red'}}>*</span></Form.Label>
                      <Form.Control 
                        type="tel" 
                        value={patientFormData.contactNumber} 
                        onChange={(e) => handlePatientFormChange('contactNumber', e.target.value)} 
                        placeholder="09XXXXXXXXX" 
                        pattern="^09\\d{9}$" 
                        maxLength="11"
                        title="Must be a valid PH mobile number starting with 09 (11 digits total)"
                        required
                        className={isDarkMode ? 'dark-mode-form-control' : ''}
                      />
                      <Form.Text className={isDarkMode ? 'text-light' : 'text-muted'}>
                        Format: 09XXXXXXXXX (11 digits total)
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
            
            <Card className="mb-3" bg={isDarkMode ? 'dark' : 'light'}>
              <Card.Header as="h5" className="my-2" style={isDarkMode ? {background: 'var(--bg-tertiary)', color: 'var(--text-primary)'} : {}}>Address</Card.Header>
              <Card.Body style={isDarkMode ? {background: 'var(--bg-secondary)', color: 'var(--text-primary)'} : {}}>
                <Row className="mb-3">
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>House No.</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={patientFormData.houseNo} 
                        onChange={(e) => handlePatientFormChange('houseNo', e.target.value)}
                        className={isDarkMode ? 'dark-mode-form-control' : ''}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Street <span style={{color: 'red'}}>*</span></Form.Label>
                      <Form.Select
                        value={patientFormData.street}
                        onChange={(e) => handlePatientFormChange('street', e.target.value)}
                        required
                        className={isDarkMode ? 'dark-mode-select' : ''}
                      >
                        <option value="">Select Street</option>
                        <option value="Amang Rodriguez Avenue">Amang Rodriguez Avenue</option>
                        <option value="C. Raymundo Avenue">C. Raymundo Avenue</option>
                        <option value="Ortigas Avenue">Ortigas Avenue</option>
                        <option value="Shaw Boulevard">Shaw Boulevard</option>
                        <option value="E. Rodriguez Jr. Avenue (C-5)">E. Rodriguez Jr. Avenue (C-5)</option>
                        <option value="Marcos Highway">Marcos Highway</option>
                        <option value="Julia Vargas Avenue">Julia Vargas Avenue</option>
                        <option value="F. Legaspi Bridge">F. Legaspi Bridge</option>
                        <option value="San Guillermo Street">San Guillermo Street</option>
                        <option value="Dr. Sixto Antonio Avenue">Dr. Sixto Antonio Avenue</option>
                        <option value="Other">Other</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Barangay <span style={{color: 'red'}}>*</span></Form.Label>
                      <Form.Select
                        value={patientFormData.barangay}
                        onChange={(e) => handlePatientFormChange('barangay', e.target.value)}
                        required
                        className={isDarkMode ? 'dark-mode-select' : ''}
                      >
                        <option value="">Select Barangay</option>
                        <option value="Bagong Ilog">Bagong Ilog</option>
                        <option value="Bagong Katipunan">Bagong Katipunan</option>
                        <option value="Bambang">Bambang</option>
                        <option value="Buting">Buting</option>
                        <option value="Caniogan">Caniogan</option>
                        <option value="Kalawaan">Kalawaan</option>
                        <option value="Kapasigan">Kapasigan</option>
                        <option value="Kapitolyo">Kapitolyo</option>
                        <option value="Malinao">Malinao</option>
                        <option value="Manggahan">Manggahan</option>
                        <option value="Maybunga">Maybunga</option>
                        <option value="Oranbo">Oranbo</option>
                        <option value="Palatiw">Palatiw</option>
                        <option value="Pinagbuhatan">Pinagbuhatan</option>
                        <option value="Pineda">Pineda</option>
                        <option value="Rosario">Rosario</option>
                        <option value="Sagad">Sagad</option>
                        <option value="San Antonio">San Antonio</option>
                        <option value="San Joaquin">San Joaquin</option>
                        <option value="San Jose">San Jose</option>
                        <option value="San Miguel">San Miguel</option>
                        <option value="San Nicolas">San Nicolas</option>
                        <option value="Santa Cruz">Santa Cruz</option>
                        <option value="Santa Lucia">Santa Lucia</option>
                        <option value="Santa Rosa">Santa Rosa</option>
                        <option value="Santo Tomas">Santo Tomas</option>
                        <option value="Santolan">Santolan</option>
                        <option value="Sumilang">Sumilang</option>
                        <option value="Ugong">Ugong</option>
                        <option value="Other">Other</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>City</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={patientFormData.city} 
                        onChange={(e) => handlePatientFormChange('city', e.target.value)} 
                        readOnly 
                        className={isDarkMode ? 'dark-mode-form-control' : ''}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>Postal Code</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={patientFormData.postalCode} 
                        onChange={(e) => handlePatientFormChange('postalCode', e.target.value)} 
                        readOnly 
                        className={isDarkMode ? 'dark-mode-form-control' : ''}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
            
            <Card className="mb-3" bg={isDarkMode ? 'dark' : 'light'}>
              <Card.Header as="h5" className="my-2" style={isDarkMode ? {background: 'var(--bg-tertiary)', color: 'var(--text-primary)'} : {}}>Medical Information</Card.Header>
              <Card.Body style={isDarkMode ? {background: 'var(--bg-secondary)', color: 'var(--text-primary)'} : {}}>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>PhilHealth Number (Optional)</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={patientFormData.philHealthNumber} 
                        onChange={(e) => handlePatientFormChange('philHealthNumber', e.target.value)} 
                        placeholder="Enter PhilHealth ID number"
                        className={isDarkMode ? 'dark-mode-form-control' : ''}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label>Medical Conditions/Allergies (Optional)</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={3} 
                    value={patientFormData.medicalConditions} 
                    onChange={(e) => handlePatientFormChange('medicalConditions', e.target.value)} 
                    placeholder="Enter any existing medical conditions or allergies"
                    className={isDarkMode ? 'dark-mode-form-control' : ''}
                  />
                </Form.Group>
              </Card.Body>
            </Card>
            
            <Card className="mb-3" bg={isDarkMode ? 'dark' : 'light'}>
              <Card.Header as="h5" className="my-2" style={isDarkMode ? {background: 'var(--bg-tertiary)', color: 'var(--text-primary)'} : {}}>Family Assignment</Card.Header>
              <Card.Body style={isDarkMode ? {background: 'var(--bg-secondary)', color: 'var(--text-primary)'} : {}}>
                <Row className="mb-3">
                  <Col md={8}>
                    <Form.Group>
                      <Form.Label>Assign to Family</Form.Label>
                      <Form.Select
                        value={patientFormData.familyId}
                        onChange={(e) => handlePatientFormChange('familyId', e.target.value)}
                        className={isDarkMode ? 'dark-mode-select' : ''}
                      >
                        <option value="">Select existing family or leave unassigned</option>
                        {families.map(family => (
                          <option key={family.id} value={family.id}>
                            {family.surname} Family ({family.familyName})
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Text className={isDarkMode ? 'text-light' : 'text-muted'}>
                        Choose an existing family or leave blank to assign later
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={4} className="d-flex align-items-end">
                    <Button 
                      variant={isDarkMode ? 'outline-light' : 'outline-primary'} 
                      className="mb-3" 
                      onClick={() => {
                        setShowAddPatientModal(false);
                        setShowAddFamilyModal(true);
                      }}
                    >
                      + Add New Family Surname
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddPatientModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSavePatient}>
            Save Patient
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Family Modal */}
      <Modal
        show={showAddFamilyModal}
        onHide={() => {
          setShowAddFamilyModal(false);
          // If coming from Add Patient modal, go back to it
          if (showAddPatientModal) {
            setShowAddPatientModal(true);
          }
        }}
        size="lg"
        contentClassName={isDarkMode ? 'bg-dark text-light' : ''}
      >
        <Modal.Header closeButton className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}>
          <Modal.Title>Add New Family</Modal.Title>
        </Modal.Header>
        <Modal.Body className={isDarkMode ? 'bg-dark text-light' : ''}>
          <Form>
            <h5>Family Information</h5>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="familyName">
                  <Form.Label>Family Name <span style={{color: 'red'}}>*</span></Form.Label>
                  <InputGroup>
                    <Form.Control 
                      type="text" 
                      placeholder="Enter family name (e.g., Santos)"
                      value={familyFormData.familyName.replace(/\s+Family\s*$/i, '').trim()}
                      onChange={(e) => handleFamilyFormChange('familyName', e.target.value)}
                      className={isDarkMode ? 'dark-mode-form-control' : ''}
                    />
                    <InputGroup.Text className={isDarkMode ? 'dark-mode-input-group-text' : ''}>Family</InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="surname">
                  <Form.Label>Surname <span style={{color: 'red'}}>*</span></Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="Enter surname (e.g., Santos)"
                    value={familyFormData.surname}
                    onChange={(e) => handleFamilyFormChange('surname', e.target.value)}
                    className={isDarkMode ? 'dark-mode-form-control' : ''}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="headOfFamily">
                  <Form.Label>Head of Family (Optional)</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="Enter head of family name"
                    value={familyFormData.headOfFamily}
                    onChange={(e) => handleFamilyFormChange('headOfFamily', e.target.value)}
                    className={isDarkMode ? 'dark-mode-form-control' : ''}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="contactNumber">
                  <Form.Label>Contact Number</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="Enter 11-digit contact number"
                    value={familyFormData.contactNumber}
                    onChange={(e) => handleFamilyFormChange('contactNumber', e.target.value)}
                    maxLength={11}
                    pattern="[0-9]{11}"
                    className={isDarkMode ? 'dark-mode-form-control' : ''}
                  />
                  <Form.Text className={isDarkMode ? 'text-light' : 'text-muted'}>
                    Must be exactly 11 digits (numbers only)
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-3">
              <Col md={12}>
                <Form.Group controlId="address">
                  <Form.Label>Address</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={3} 
                    placeholder="Enter family address"
                    value={familyFormData.address}
                    onChange={(e) => handleFamilyFormChange('address', e.target.value)}
                    className={isDarkMode ? 'dark-mode-form-control' : ''}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-3">
              <Col md={12}>
                <Form.Group controlId="notes">
                  <Form.Label>Notes (Optional)</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={2} 
                    placeholder="Enter any additional notes about the family"
                    value={familyFormData.notes}
                    onChange={(e) => handleFamilyFormChange('notes', e.target.value)}
                    className={isDarkMode ? 'dark-mode-form-control' : ''}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <div style={{fontSize: '0.9rem', color: isDarkMode ? 'var(--text-secondary)' : '#666', marginTop: '16px'}}>
              <p><strong>Family ID:</strong> Will be automatically generated</p>
              <p><strong>Date Registered:</strong> {new Date().toLocaleDateString()}</p>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}>
          <Button variant={isDarkMode ? 'outline-light' : 'secondary'} onClick={() => setShowAddFamilyModal(false)}>
            Cancel
          </Button>
          <Button variant={isDarkMode ? 'outline-primary' : 'primary'} onClick={handleSaveFamily}>
            Save Family
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Assign to Family Modal */}
      <Modal show={showAssignFamilyModal} onHide={() => setShowAssignFamilyModal(false)} size="lg" contentClassName={isDarkMode ? 'bg-dark text-light' : ''}>
        <Modal.Header closeButton className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}>
          <Modal.Title>
            Assign {selectedPatientForAssignment?.firstName} {selectedPatientForAssignment?.lastName} to Family
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className={isDarkMode ? 'bg-dark text-light' : ''}>
          {!showCreateFamilyInAssign ? (
            <div>
              <h5>Select an Existing Family</h5>
              <Form.Group className="mb-3">
                <Form.Label>Choose Family</Form.Label>
                <Form.Select 
                  value={selectedFamilyForAssignment} 
                  onChange={(e) => setSelectedFamilyForAssignment(e.target.value)}
                  className={isDarkMode ? 'dark-mode-select' : ''}
                >
                  <option value="">-- Select a Family --</option>
                  {families && families.length > 0 ? families.map(family => (
                    <option key={family.id} value={family.id}>
                      {family.familyName} ({family.surname}) - {getFamilyHead(family)}
                    </option>
                  )) : (
                    <option disabled>No families available</option>
                  )}
                </Form.Select>
              </Form.Group>
              
              <div className="text-center my-3">
                <Button 
                  variant="outline-primary" 
                  onClick={() => setShowCreateFamilyInAssign(true)}
                >
                  + Create New Family
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <h5>Create New Family</h5>
              <Row>
                <Col md={6}>
                  <Form.Group controlId="assignFamilyName">
                    <Form.Label>Family Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control 
                      type="text" 
                      placeholder="Enter family name (without 'Family')"
                      value={assignFamilyFormData.familyName.replace(' Family', '')}
                      onChange={(e) => handleAssignFamilyFormChange('familyName', e.target.value)}
                      className={isDarkMode ? 'dark-mode-form-control' : ''}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="assignSurname">
                    <Form.Label>Surname <span className="text-danger">*</span></Form.Label>
                    <Form.Control 
                      type="text" 
                      placeholder="Enter surname"
                      value={assignFamilyFormData.surname}
                      onChange={(e) => handleAssignFamilyFormChange('surname', e.target.value)}
                      className={isDarkMode ? 'dark-mode-form-control' : ''}
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group controlId="assignHeadOfFamily">
                    <Form.Label>Head of Family (Optional)</Form.Label>
                    <Form.Control 
                      type="text" 
                      placeholder="Enter head of family name"
                      value={assignFamilyFormData.headOfFamily}
                      onChange={(e) => handleAssignFamilyFormChange('headOfFamily', e.target.value)}
                      className={isDarkMode ? 'dark-mode-form-control' : ''}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="assignContactNumber">
                    <Form.Label>Contact Number</Form.Label>
                    <Form.Control 
                      type="text" 
                      placeholder="Enter 11-digit contact number"
                      value={assignFamilyFormData.contactNumber}
                      onChange={(e) => handleAssignFamilyFormChange('contactNumber', e.target.value)}
                      maxLength={11}
                      pattern="[0-9]{11}"
                      className={isDarkMode ? 'dark-mode-form-control' : ''}
                    />
                    <Form.Text className={isDarkMode ? 'text-light' : 'text-muted'}>
                      Must be exactly 11 digits (numbers only)
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              
              <Form.Group controlId="assignNotes">
                <Form.Label>Notes (Optional)</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={2}
                  placeholder="Enter notes"
                  value={assignFamilyFormData.notes}
                  onChange={(e) => handleAssignFamilyFormChange('notes', e.target.value)}
                />
              </Form.Group>
              
              <div className="text-center mt-3">
                <Button 
                  variant="outline-secondary" 
                  onClick={() => setShowCreateFamilyInAssign(false)}
                >
                  ← Back to Family Selection
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}>
          <Button variant={isDarkMode ? 'outline-light' : 'secondary'} onClick={() => setShowAssignFamilyModal(false)}>
            Cancel
          </Button>
          {!showCreateFamilyInAssign ? (
            <Button 
              variant={isDarkMode ? 'outline-primary' : 'primary'} 
              onClick={handleAssignToExistingFamily}
              disabled={!selectedFamilyForAssignment}
            >
              Assign to Selected Family
            </Button>
          ) : (
            <Button 
              variant={isDarkMode ? 'outline-success' : 'success'} 
              onClick={handleCreateFamilyAndAssign}
              disabled={!assignFamilyFormData.familyName.trim() || !assignFamilyFormData.surname.trim()}
            >
              Create Family & Assign Patient
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Family Information Modal (now Family Members modal) */}
      <Modal show={showFamilyModal} onHide={() => setShowFamilyModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Family Members</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedFamily && (
            <>
              <h5>Family Name: {selectedFamily.familyName}</h5>
              <p><strong>Family ID:</strong> {selectedFamily.id}</p>
              <p><strong>Contact Number:</strong> {selectedFamily.contact}</p>
              <p><strong>Registration Date:</strong> {formatShortDate(selectedFamily.registrationDate)}</p>
              <Table hover responsive className="data-table mt-4">
                <thead>
                  <tr>
                    <th style={{textAlign: 'left'}}>Patient ID</th>
                    <th style={{textAlign: 'left'}}>Name</th>
                    <th style={{textAlign: 'right'}}>Age</th>
                    <th style={{textAlign: 'left'}}>Gender</th>
                    <th style={{textAlign: 'left'}}>Contact Number</th>
                    <th style={{textAlign: 'left'}}>Last Checkup</th>
                    <th style={{textAlign: 'center'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFamilyMembers(selectedFamily.id).map(member => (
                    <tr key={member.id}>
                      <td style={{textAlign: 'left'}}>PT-{String(member.id).padStart(4, '0')}</td>
                      <td style={{textAlign: 'left'}}>{getPatientFullName(member)}</td>
                      <td style={{textAlign: 'right'}}>{getPatientAge(member)}</td>
                      <td style={{textAlign: 'left'}}>{member.gender}</td>
                      <td style={{textAlign: 'left'}}>{getPatientContact(member)}</td>
                      <td style={{textAlign: 'left'}}>{formatShortDate(member.lastCheckup || member.createdAt)}</td>
                      <td style={{textAlign: 'center'}} className="action-cell">
                        <Button variant="outline-primary" size="sm" onClick={() => { setShowFamilyModal(false); setTimeout(() => handleViewPatient(member), 300); }}>View Information</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFamilyModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Autosort Results Modal */}
      <Modal show={showAutosortModal} onHide={() => setShowAutosortModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-magic me-2"></i>
            Autosort Results
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {autosortResults && (
            <div className="autosort-results">
              {autosortResults.sorted && autosortResults.sorted.length > 0 && (
                <div className="sorted-section" style={{marginBottom: '20px'}}>
                  <h5 style={{color: '#28a745'}}>
                    <i className="bi bi-check-circle me-2"></i>
                    Successfully Sorted ({autosortResults.sorted.length})
                  </h5>
                  <div className="sorted-list" style={{maxHeight: '150px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', borderRadius: '4px'}}>
                    {autosortResults.sorted.map((item, index) => (
                      <div key={index} style={{padding: '5px 0', borderBottom: '1px solid #eee'}}>
                        <strong>{item.patient.firstName} {item.patient.lastName}</strong> → {item.family.familyName}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {autosortResults.needsManualAssignment && autosortResults.needsManualAssignment.length > 0 && (
                <div className="needs-family-section">
                  <h5 style={{color: '#ffc107'}}>
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Need New Families ({autosortResults.needsManualAssignment.length})
                  </h5>
                  <p style={{marginBottom: '15px', color: '#666'}}>
                    The following patients don't have matching family surnames. We can automatically create new families for them:
                  </p>
                  <div className="needs-family-list" style={{maxHeight: '150px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', borderRadius: '4px', marginBottom: '20px'}}>
                    {autosortResults.needsManualAssignment.map((patient, index) => (
                      <div key={index} style={{padding: '5px 0', borderBottom: '1px solid #eee'}}>
                        <strong>{patient.firstName} {patient.lastName}</strong> (Will create: <em>{patient.lastName} Family</em>)
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {autosortResults && autosortResults.needsManualAssignment && autosortResults.needsManualAssignment.length > 0 && (
            <Button variant="success" onClick={handleCreateFamilies}>
              <i className="bi bi-plus-circle me-2"></i>
              Auto-Create Families
            </Button>
          )}
          <Button variant="secondary" onClick={() => setShowAutosortModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add User Modal */}
      <Modal show={showAddUserModal} onHide={() => setShowAddUserModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-person-plus me-2"></i>
            Add New User
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={async (e) => {
            e.preventDefault();
            try {
              // Create user via API
              const userData = {
                firstName: userFormData.firstName,
                middleName: userFormData.middleName,
                lastName: userFormData.lastName,
                emailInitials: userFormData.emailInitials,
                password: userFormData.password,
                accessLevel: userFormData.accessLevel,
                position: userFormData.position
              };

              const response = await adminService.createStaffUser(userData);
              
              // Add to local users list for immediate UI update
              const newUser = {
                id: response.user.id,
                username: response.user.username,
                firstName: response.user.firstName,
                lastName: response.user.lastName,
                role: response.user.position,
                userType: response.user.accessLevel === 'Administrator' ? 'admin' : 'doctor',
                accessLevel: response.user.accessLevel,
                email: response.user.email,
                accessRights: {
                  dashboard: true,
                  patients: true,
                  families: userFormData.accessLevel === 'Administrator',
                  appointments: true,
                  reports: userFormData.accessLevel === 'Administrator',
                  users: userFormData.accessLevel === 'Administrator',
                  settings: userFormData.accessLevel === 'Administrator'
                }
              };
              
              setUsers([...users, newUser]);

              // Add activity tracking
              addActivity(
                'User Created',
                `New ${newUser.position} account created: ${newUser.firstName} ${newUser.lastName}`,
                'success'
              );

              setShowAddUserModal(false);
              setUserFormData({
                firstName: '',
                middleName: '',
                lastName: '',
                emailInitials: '',
                password: '',
                confirmPassword: '',
                role: 'aide',
                position: 'Aide',
                accessLevel: ''
              });
              
              alert('User created successfully! They can now login with their credentials.');
            } catch (error) {
              console.error('Error creating user:', error);
              alert('Error creating user: ' + (error.response?.data?.msg || error.message));
            }
          }}>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label><strong>First Name *</strong></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter first name"
                    value={userFormData.firstName}
                    onChange={(e) => setUserFormData({
                      ...userFormData,
                      firstName: e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1).toLowerCase()
                    })}
                    required
                    className={isDarkMode ? 'dark-mode-form-control' : ''}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label><strong>Middle Name</strong></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter middle name (optional)"
                    value={userFormData.middleName}
                    onChange={(e) => setUserFormData({
                      ...userFormData,
                      middleName: e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1).toLowerCase()
                    })}
                    className={isDarkMode ? 'dark-mode-form-control' : ''}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label><strong>Last Name *</strong></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter last name"
                    value={userFormData.lastName}
                    onChange={(e) => setUserFormData({
                      ...userFormData,
                      lastName: e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1).toLowerCase()
                    })}
                    required
                    className={isDarkMode ? 'dark-mode-form-control' : ''}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label><strong>Access Level *</strong></Form.Label>
                  <Form.Select
                    value={userFormData.accessLevel}
                    onChange={(e) => {
                      const accessLevel = e.target.value;
                      setUserFormData({
                        ...userFormData,
                        accessLevel: accessLevel,
                        role: accessLevel === 'Administrator' ? 'admin' : 'doctor'
                      });
                    }}
                    required
                    className={isDarkMode ? 'dark-mode-form-control' : ''}
                  >
                    <option value="">Select Access Level</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Doctor">Doctor</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><strong>Email Initials for Login *</strong></Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="e.g., j.santos"
                      value={userFormData.emailInitials}
                      onChange={(e) => setUserFormData({...userFormData, emailInitials: e.target.value.toLowerCase()})}
                      required
                      className={isDarkMode ? 'dark-mode-form-control' : ''}
                    />
                    <InputGroup.Text className={isDarkMode ? 'dark-mode-input-group-text' : ''}>@maybunga.health</InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label><strong>Position/Role *</strong></Form.Label>
                  <Form.Select
                    value={userFormData.position}
                    onChange={(e) => {
                      setUserFormData({
                        ...userFormData,
                        position: e.target.value
                      });
                    }}
                    required
                    className={isDarkMode ? 'dark-mode-form-control' : ''}
                  >
                    <option value="">Select Position</option>
                    <option value="Aide">Aide</option>
                    <option value="Nurse">Nurse</option>
                    <option value="Nutritionist">Nutritionist</option>
                    <option value="Medical Personnel">Medical Personnel</option>
                    <option value="Doctor">Doctor</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><strong>Password *</strong></Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={userFormData.password}
                      onChange={(e) => setUserFormData({...userFormData, password: e.target.value})}
                      required
                      minLength={8}
                      className={isDarkMode ? 'dark-mode-form-control' : ''}
                    />
                    <InputGroup.Text 
                      onClick={() => setShowPassword(!showPassword)} 
                      style={{ cursor: 'pointer' }}
                      className={isDarkMode ? 'dark-mode-input-group-text' : ''}
                    >
                      <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                    </InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><strong>Confirm Password *</strong></Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter password"
                      value={userFormData.confirmPassword}
                      onChange={(e) => setUserFormData({...userFormData, confirmPassword: e.target.value})}
                      required
                      isInvalid={userFormData.password !== userFormData.confirmPassword && userFormData.confirmPassword !== ''}
                      className={isDarkMode ? 'dark-mode-form-control' : ''}
                    />
                    <InputGroup.Text 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                      style={{ cursor: 'pointer' }}
                      className={isDarkMode ? 'dark-mode-input-group-text' : ''}
                    >
                      <i className={`bi bi-eye${showConfirmPassword ? '-slash' : ''}`}></i>
                    </InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddUserModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="success" 
            onClick={() => {
              // Trigger form submission
              const form = document.querySelector('form');
              if (form) form.requestSubmit();
            }}
            disabled={!userFormData.firstName || !userFormData.lastName || !userFormData.emailInitials || !userFormData.password || !userFormData.confirmPassword || !userFormData.accessLevel || !userFormData.position || userFormData.password !== userFormData.confirmPassword}
          >
            <i className="bi bi-person-plus me-2"></i>
            Create User
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit User Modal */}
      <Modal show={showEditUserModal} onHide={() => setShowEditUserModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-pencil me-2"></i>
            Edit User
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEditUser}>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label><strong>First Name *</strong></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter first name"
                    value={userFormData.firstName}
                    onChange={(e) => setUserFormData({
                      ...userFormData,
                      firstName: e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1).toLowerCase()
                    })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label><strong>Middle Name</strong></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter middle name (optional)"
                    value={userFormData.middleName}
                    onChange={(e) => setUserFormData({
                      ...userFormData,
                      middleName: e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1).toLowerCase()
                    })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label><strong>Last Name *</strong></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter last name"
                    value={userFormData.lastName}
                    onChange={(e) => setUserFormData({
                      ...userFormData,
                      lastName: e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1).toLowerCase()
                    })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label><strong>Email Initials for Login *</strong></Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="e.g., j.santos"
                      value={userFormData.emailInitials}
                      onChange={(e) => setUserFormData({...userFormData, emailInitials: e.target.value.toLowerCase()})}
                      required
                    />
                    <InputGroup.Text>@maybunga.health</InputGroup.Text>
                  </InputGroup>
                  <Form.Text className="text-muted">
                    This will be used as the login email (e.g., j.santos@maybunga.health)
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label><strong>Position/Role *</strong></Form.Label>
                  <Form.Select
                    value={userFormData.position}
                    onChange={(e) => {
                      const position = e.target.value;
                      const role = position === 'Doctor' ? 'doctor' : position === 'Admin' ? 'admin' : 'aide';
                      setUserFormData({...userFormData, position, role});
                    }}
                    required
                  >
                    <option value="Aide">Aide</option>
                    <option value="Nurse">Nurse</option>
                    <option value="Nutritionist">Nutritionist</option>
                    <option value="Medical Personnel">Medical Personnel</option>
                    <option value="Doctor">Doctor</option>
                    <option value="Admin">Administrator</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><strong>New Password</strong></Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password (leave blank to keep current)"
                      value={userFormData.password}
                      onChange={(e) => setUserFormData({...userFormData, password: e.target.value})}
                      minLength={8}
                    />
                    <InputGroup.Text 
                      style={{ cursor: 'pointer' }}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </InputGroup.Text>
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Leave blank to keep current password. Minimum 8 characters if changing.
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><strong>Confirm New Password</strong></Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter new password"
                      value={userFormData.confirmPassword}
                      onChange={(e) => setUserFormData({...userFormData, confirmPassword: e.target.value})}
                      isInvalid={userFormData.password !== userFormData.confirmPassword && userFormData.confirmPassword !== ''}
                    />
                    <InputGroup.Text 
                      style={{ cursor: 'pointer' }}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </InputGroup.Text>
                  </InputGroup>
                  <Form.Control.Feedback type="invalid">
                    Passwords do not match
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowEditUserModal(false);
            setSelectedUser(null);
            setUserFormData({
              firstName: '',
              middleName: '',
              lastName: '',
              emailInitials: '',
              password: '',
              confirmPassword: '',
              role: 'aide',
              position: 'Aide',
              userType: ''
            });
          }}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleEditUser}
            disabled={loadingUsers || !userFormData.firstName || !userFormData.lastName || !userFormData.emailInitials || (userFormData.password && userFormData.password !== userFormData.confirmPassword)}
          >
            {loadingUsers ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Updating...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-1"></i>
                Update User
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Access Rights Modal */}
      <Modal show={showAccessRightsModal} onHide={() => setShowAccessRightsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-shield-check me-2"></i>
            Access Rights Management
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Select users and configure their access permissions:</p>
          {users.map(user => (
            <div key={user.id} className="access-rights-user">
              <h5>{user.firstName} {user.lastName} ({user.role})</h5>
              <Row>
                <Col md={6}>
                  <Form.Check
                    type="checkbox"
                    label="Dashboard Access"
                    checked={user.accessRights.dashboard}
                    onChange={(e) => {
                      const updatedUsers = users.map(u => 
                        u.id === user.id 
                          ? {...u, accessRights: {...u.accessRights, dashboard: e.target.checked}}
                          : u
                      );
                      setUsers(updatedUsers);
                    }}
                  />
                  <Form.Check
                    type="checkbox"
                    label="Patient Management"
                    checked={user.accessRights.patients}
                    onChange={(e) => {
                      const updatedUsers = users.map(u => 
                        u.id === user.id 
                          ? {...u, accessRights: {...u.accessRights, patients: e.target.checked}}
                          : u
                      );
                      setUsers(updatedUsers);
                    }}
                  />
                  <Form.Check
                    type="checkbox"
                    label="Family Management"
                    checked={user.accessRights.families}
                    onChange={(e) => {
                      const updatedUsers = users.map(u => 
                        u.id === user.id 
                          ? {...u, accessRights: {...u.accessRights, families: e.target.checked}}
                          : u
                      );
                      setUsers(updatedUsers);
                    }}
                  />
                  <Form.Check
                    type="checkbox"
                    label="Appointments"
                    checked={user.accessRights.appointments}
                    onChange={(e) => {
                      const updatedUsers = users.map(u => 
                        u.id === user.id 
                          ? {...u, accessRights: {...u.accessRights, appointments: e.target.checked}}
                          : u
                      );
                      setUsers(updatedUsers);
                    }}
                  />
                </Col>
                <Col md={6}>
                  <Form.Check
                    type="checkbox"
                    label="Reports Access"
                    checked={user.accessRights.reports}
                    onChange={(e) => {
                      const updatedUsers = users.map(u => 
                        u.id === user.id 
                          ? {...u, accessRights: {...u.accessRights, reports: e.target.checked}}
                          : u
                      );
                      setUsers(updatedUsers);
                    }}
                  />
                  <Form.Check
                    type="checkbox"
                    label="User Management"
                    checked={user.accessRights.users}
                    onChange={(e) => {
                      const updatedUsers = users.map(u => 
                        u.id === user.id 
                          ? {...u, accessRights: {...u.accessRights, users: e.target.checked}}
                          : u
                      );
                      setUsers(updatedUsers);
                    }}
                  />
                  <Form.Check
                    type="checkbox"
                    label="System Settings"
                    checked={user.accessRights.settings}
                    onChange={(e) => {
                      const updatedUsers = users.map(u => 
                        u.id === user.id 
                          ? {...u, accessRights: {...u.accessRights, settings: e.target.checked}}
                          : u
                      );
                      setUsers(updatedUsers);
                    }}
                  />
                </Col>
              </Row>
              <hr />
            </div>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAccessRightsModal(false)}>
            Close
          </Button>
          <Button variant="success" onClick={() => {
            alert('Access rights updated successfully!');
            setShowAccessRightsModal(false);
          }}>
            <i className="bi bi-check-circle me-2"></i>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Treatment Record Modal */}
      <Modal 
        show={showTreatmentRecordModal} 
        onHide={closeTreatmentRecordModal}
        size="xl"
        centered
        className="treatment-record-modal"
        style={{
          '--bs-modal-bg': isDarkMode ? '#1e293b' : '#ffffff'
        }}
      >
        <Modal.Header 
          closeButton 
          style={{
            background: '#0ea5e9', 
            color: '#ffffff', 
            border: 'none',
            borderRadius: '12px 12px 0 0'
          }}
        >
          <Modal.Title className="w-100 text-center fw-bold fs-4">
            Individual Treatment Record
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body style={{
          background: isDarkMode ? '#1e293b' : '#ffffff', 
          color: isDarkMode ? '#e2e8f0' : '#2c3e50',
          padding: '32px',
          minHeight: '50vh',
          maxHeight: '60vh',
          overflowY: 'auto'
        }}>
          {selectedPatient && (
            <div>
              {/* Patient Name Fields Row */}
              <div className="row mb-4">
                <div className="col-md-3">
                  <label style={{color: '#0ea5e9', fontWeight: '600', marginBottom: '8px', display: 'block'}}>
                    First Name:
                  </label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={selectedPatient.firstName || ''}
                    style={{
                      background: isDarkMode ? '#334155' : '#f8f9fa',
                      color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                      border: `1px solid ${isDarkMode ? '#475569' : '#ced4da'}`,
                      borderRadius: '6px',
                      padding: '12px'
                    }}
                    readOnly
                  />
                </div>
                <div className="col-md-3">
                  <label style={{color: '#0ea5e9', fontWeight: '600', marginBottom: '8px', display: 'block'}}>
                    Middle Name:
                  </label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={selectedPatient.middleName || ''}
                    style={{
                      background: isDarkMode ? '#334155' : '#f8f9fa',
                      color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                      border: `1px solid ${isDarkMode ? '#475569' : '#ced4da'}`,
                      borderRadius: '6px',
                      padding: '12px'
                    }}
                    readOnly
                  />
                </div>
                <div className="col-md-3">
                  <label style={{color: '#0ea5e9', fontWeight: '600', marginBottom: '8px', display: 'block'}}>
                    Last Name:
                  </label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={selectedPatient.lastName || ''}
                    style={{
                      background: isDarkMode ? '#334155' : '#f8f9fa',
                      color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                      border: `1px solid ${isDarkMode ? '#475569' : '#ced4da'}`,
                      borderRadius: '6px',
                      padding: '12px'
                    }}
                    readOnly
                  />
                </div>
                <div className="col-md-3">
                  <label style={{color: '#0ea5e9', fontWeight: '600', marginBottom: '8px', display: 'block'}}>
                    Suffix:
                  </label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={selectedPatient.suffix || ''}
                    style={{
                      background: isDarkMode ? '#334155' : '#f8f9fa',
                      color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                      border: `1px solid ${isDarkMode ? '#475569' : '#ced4da'}`,
                      borderRadius: '6px',
                      padding: '12px'
                    }}
                    readOnly
                  />
                </div>
              </div>

              {/* Address Field */}
              <div className="mb-4">
                <label style={{color: '#0ea5e9', fontWeight: '600', marginBottom: '8px', display: 'block'}}>
                  Address:
                </label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={`${selectedPatient.houseNo || ''} ${selectedPatient.street || ''}, ${selectedPatient.barangay || ''}, ${selectedPatient.city || 'Pasig'}, ${selectedPatient.region || 'Metro Manila'}`}
                  style={{
                    background: isDarkMode ? '#334155' : '#f8f9fa',
                    color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                    border: `1px solid ${isDarkMode ? '#475569' : '#ced4da'}`,
                    borderRadius: '6px',
                    padding: '12px'
                  }}
                  readOnly
                />
                <div style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.875rem', marginTop: '4px'}}>
                  Barangay: {selectedPatient.barangay || 'N/A'}
                </div>
              </div>

              {/* Patient Info Row */}
              <div className="row mb-4">
                <div className="col-md-3">
                  <label style={{color: '#0ea5e9', fontWeight: '600', marginBottom: '8px', display: 'block'}}>
                    Date of Birth:
                  </label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : ''}
                    style={{
                      background: isDarkMode ? '#334155' : '#f8f9fa',
                      color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                      border: `1px solid ${isDarkMode ? '#475569' : '#ced4da'}`,
                      borderRadius: '6px',
                      padding: '12px'
                    }}
                    readOnly
                  />
                  <div style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.875rem', marginTop: '4px'}}>
                    ---
                  </div>
                </div>
                <div className="col-md-2">
                  <label style={{color: '#0ea5e9', fontWeight: '600', marginBottom: '8px', display: 'block'}}>
                    Age:
                  </label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={getPatientAge(selectedPatient)}
                    style={{
                      background: isDarkMode ? '#334155' : '#f8f9fa',
                      color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                      border: `1px solid ${isDarkMode ? '#475569' : '#ced4da'}`,
                      borderRadius: '6px',
                      padding: '12px'
                    }}
                    readOnly
                  />
                </div>
                <div className="col-md-3">
                  <label style={{color: '#0ea5e9', fontWeight: '600', marginBottom: '8px', display: 'block'}}>
                    Gender:
                  </label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={selectedPatient.gender || ''}
                    style={{
                      background: isDarkMode ? '#334155' : '#f8f9fa',
                      color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                      border: `1px solid ${isDarkMode ? '#475569' : '#ced4da'}`,
                      borderRadius: '6px',
                      padding: '12px'
                    }}
                    readOnly
                  />
                </div>
                <div className="col-md-4">
                  <label style={{color: '#0ea5e9', fontWeight: '600', marginBottom: '8px', display: 'block'}}>
                    Civil Status:
                  </label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={selectedPatient.civilStatus || '---'}
                    style={{
                      background: isDarkMode ? '#334155' : '#f8f9fa',
                      color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                      border: `1px solid ${isDarkMode ? '#475569' : '#ced4da'}`,
                      borderRadius: '6px',
                      padding: '12px'
                    }}
                    readOnly
                  />
                </div>
              </div>

              {/* PhilHealth Section */}
              <div className="mb-4">
                <label style={{color: '#0ea5e9', fontWeight: '600', marginBottom: '8px', display: 'block'}}>
                  PhilHealth Number:
                </label>
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <input 
                      type="text" 
                      className="form-control" 
                      value={selectedPatient.philHealthNumber || ''}
                      style={{
                        background: isDarkMode ? '#334155' : '#f8f9fa',
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        border: `1px solid ${isDarkMode ? '#475569' : '#ced4da'}`,
                        borderRadius: '6px',
                        padding: '12px'
                      }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-4">
                    <div className="d-flex gap-3">
                      <div className="form-check">
                        <input 
                          className="form-check-input" 
                          type="radio" 
                          name="philhealthStatus" 
                          id="member"
                          checked={selectedPatient.philHealthNumber && selectedPatient.philHealthNumber.trim() !== ''}
                          style={{
                            backgroundColor: '#0ea5e9',
                            borderColor: '#0ea5e9'
                          }}
                          readOnly
                        />
                        <label className="form-check-label" htmlFor="member" style={{color: isDarkMode ? '#e2e8f0' : '#2c3e50', marginLeft: '8px'}}>
                          Member
                        </label>
                      </div>
                      <div className="form-check">
                        <input 
                          className="form-check-input" 
                          type="radio" 
                          name="philhealthStatus" 
                          id="nonMember"
                          checked={!selectedPatient.philHealthNumber || selectedPatient.philHealthNumber.trim() === ''}
                          style={{
                            backgroundColor: !selectedPatient.philHealthNumber ? '#e2e8f0' : (isDarkMode ? '#334155' : '#f8f9fa'),
                            borderColor: isDarkMode ? '#475569' : '#ced4da'
                          }}
                          readOnly
                        />
                        <label className="form-check-label" htmlFor="nonMember" style={{color: isDarkMode ? '#e2e8f0' : '#2c3e50', marginLeft: '8px'}}>
                          Non-Member
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.875rem', marginTop: '4px'}}>
                  Member ID: {selectedPatient.philHealthNumber ? 'Available' : 'Not Available'}
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        
        <Modal.Footer style={{
          background: isDarkMode ? '#334155' : '#f8f9fa',
          border: 'none',
          borderRadius: '0 0 12px 12px'
        }}>
          <Button 
            variant="secondary" 
            onClick={closeTreatmentRecordModal}
            style={{
              background: isDarkMode ? '#64748b' : '#6c757d',
              border: 'none',
              color: '#ffffff'
            }}
          >
            <i className="bi bi-x-circle me-2"></i>
            Close
          </Button>
          <Button 
            onClick={() => {
              closeTreatmentRecordModal();
              setTimeout(() => {
                handleVitalSignsHistory(selectedPatient);
              }, 150);
            }}
            style={{
              background: '#fbbf24',
              border: 'none',
              color: '#1f2937',
              fontWeight: '600'
            }}
          >
            <i className="bi bi-graph-up me-2"></i>
            📊 View Vital Signs History
          </Button>
          <Button 
            variant="primary" 
            style={{
              background: '#0ea5e9',
              border: 'none',
              color: '#ffffff'
            }}
            onClick={() => {
              alert('Treatment record saved successfully!');
            }}
          >
            <i className="bi bi-save me-2"></i>
            Save Record
          </Button>
          <Button 
            variant="success" 
            style={{
              background: '#10b981',
              border: 'none',
              color: '#ffffff'
            }}
            onClick={() => {
              alert('Treatment record printed successfully!');
            }}
          >
            <i className="bi bi-printer me-2"></i>
            Print
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Vital Signs History Modal */}
      <Modal 
        show={showVitalSignsHistoryModal} 
        onHide={closeVitalSignsHistoryModal}
        size="xl"
        centered
        className="vital-signs-history-modal"
      >
        <Modal.Header 
          closeButton 
          style={{
            background: '#0ea5e9', 
            color: '#ffffff', 
            border: 'none',
            borderRadius: '12px 12px 0 0'
          }}
        >
          <Modal.Title className="w-100 text-center fw-bold fs-4">
            Vital Signs History
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body style={{
          background: isDarkMode ? '#1e293b' : '#ffffff', 
          color: isDarkMode ? '#e2e8f0' : '#2c3e50',
          padding: '32px',
          minHeight: '50vh'
        }}>
          {selectedPatient && (
            <div className="mb-4">
              <div className="d-flex align-items-center mb-3">
                <div className="me-3">
                  <i className="bi bi-person-circle" style={{fontSize: '2.5rem', color: '#0ea5e9'}}></i>
                </div>
                <div>
                  <h5 className="mb-1" style={{color: isDarkMode ? '#e2e8f0' : '#2c3e50'}}>
                    {getPatientFullName(selectedPatient)}
                  </h5>
                  <p className="mb-0" style={{color: isDarkMode ? '#94a3b8' : '#6c757d'}}>
                    Patient ID: PT-{String(selectedPatient.id).padStart(4, '0')} | Age: {getPatientAge(selectedPatient)} years
                  </p>
                </div>
              </div>
            </div>
          )}

          {loadingVitalHistory ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading vital signs history...</p>
            </div>
          ) : !Array.isArray(vitalSignsHistory) || vitalSignsHistory.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-clipboard-x" style={{fontSize: '4rem', color: '#6c757d'}}></i>
              <h5 className="mt-3" style={{color: isDarkMode ? '#94a3b8' : '#6c757d'}}>No Vital Signs Records</h5>
              <p style={{color: isDarkMode ? '#94a3b8' : '#6c757d'}}>
                No vital signs have been recorded for this patient yet.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead style={{background: isDarkMode ? '#334155' : '#f8f9fa'}}>
                  <tr>
                    <th>Date & Time</th>
                    <th>Temperature</th>
                    <th>Heart Rate</th>
                    <th>Blood Pressure</th>
                    <th>Resp. Rate</th>
                    <th>O2 Sat</th>
                    <th>Weight</th>
                    <th>Height</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(vitalSignsHistory) && vitalSignsHistory.length > 0 ? (
                    vitalSignsHistory.map((record, index) => (
                      <tr key={index}>
                        <td>
                          <div>
                            <strong>{new Date(record.recordedAt).toLocaleDateString()}</strong>
                          </div>
                          <small className="text-muted">
                            {new Date(record.recordedAt).toLocaleTimeString()}
                          </small>
                        </td>
                      <td>
                        <span className={`badge ${
                          record.temperature >= 36.1 && record.temperature <= 37.2 
                            ? 'bg-success' 
                            : record.temperature > 37.2 
                              ? 'bg-danger' 
                              : 'bg-warning'
                        }`}>
                          {record.temperature}°C
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          record.heartRate >= 60 && record.heartRate <= 100 
                            ? 'bg-success' 
                            : 'bg-warning'
                        }`}>
                          {record.heartRate} bpm
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          record.systolicBP >= 90 && record.systolicBP <= 120 && 
                          record.diastolicBP >= 60 && record.diastolicBP <= 80 
                            ? 'bg-success' 
                            : 'bg-warning'
                        }`}>
                          {record.systolicBP}/{record.diastolicBP}
                        </span>
                      </td>
                      <td>
                        {record.respiratoryRate ? (
                          <span className={`badge ${
                            record.respiratoryRate >= 12 && record.respiratoryRate <= 20 
                              ? 'bg-success' 
                              : 'bg-warning'
                          }`}>
                            {record.respiratoryRate} brpm
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        {record.oxygenSaturation ? (
                          <span className={`badge ${
                            record.oxygenSaturation >= 95 
                              ? 'bg-success' 
                              : 'bg-warning'
                          }`}>
                            {record.oxygenSaturation}%
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        {record.weight ? `${record.weight} kg` : <span className="text-muted">-</span>}
                      </td>
                      <td>
                        {record.height ? `${record.height} cm` : <span className="text-muted">-</span>}
                      </td>
                      <td>
                        {record.clinicalNotes ? (
                          <div style={{maxWidth: '200px'}}>
                            <small>{record.clinicalNotes}</small>
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                    </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center text-muted py-4">
                        {loadingVitalHistory ? (
                          <div>
                            <div className="spinner-border spinner-border-sm me-2" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            Loading vital signs history...
                          </div>
                        ) : (
                          'No vital signs history found for this patient.'
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Modal.Body>
        
        <Modal.Footer style={{
          background: isDarkMode ? '#334155' : '#f8f9fa',
          border: 'none',
          borderRadius: '0 0 12px 12px'
        }}>
          <Button 
            variant="secondary" 
            onClick={closeVitalSignsHistoryModal}
            style={{
              background: isDarkMode ? '#64748b' : '#6c757d',
              border: 'none',
              color: '#ffffff'
            }}
          >
            <i className="bi bi-x-circle me-2"></i>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Checkup History Modal */}
      <Modal 
        show={showCheckupHistoryModal} 
        onHide={closeCheckupHistoryModal}
        size="xl"
        centered
        className="checkup-history-modal"
      >
        <Modal.Header 
          closeButton 
          style={{
            background: '#0ea5e9', 
            color: '#ffffff', 
            border: 'none',
            borderRadius: '12px 12px 0 0'
          }}
        >
          <Modal.Title className="w-100 text-center fw-bold fs-4">
            <i className="bi bi-clipboard-pulse me-2"></i>
            Checkup History
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body style={{
          background: isDarkMode ? '#1e293b' : '#ffffff', 
          color: isDarkMode ? '#e2e8f0' : '#2c3e50',
          padding: '24px',
          minHeight: '60vh',
          maxHeight: '70vh',
          overflowY: 'auto'
        }}>
          {selectedPatient && (
            <div>
              {/* Patient Header */}
              <div 
                className="mb-4 p-3"
                style={{
                  background: isDarkMode ? '#334155' : '#f8f9fa',
                  borderRadius: '8px',
                  border: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`
                }}
              >
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <h5 style={{color: isDarkMode ? '#e2e8f0' : '#2c3e50', marginBottom: '8px', fontWeight: '600'}}>
                      {getPatientFullName(selectedPatient)}
                    </h5>
                    <div className="row">
                      <div className="col-md-6">
                        <span style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.9rem'}}>
                          <strong>Patient ID:</strong> PT-{String(selectedPatient.id).padStart(4, '0')}
                        </span>
                      </div>
                      <div className="col-md-6">
                        <span style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.9rem'}}>
                          <strong>Age:</strong> {getPatientAge(selectedPatient)} years old
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 text-end">
                    <div style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.9rem'}}>
                      <div><strong>Total Visits:</strong> 5</div>
                      <div><strong>Last Visit:</strong> Jul 28, 2025</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkup History Table */}
              <div 
                style={{
                  background: isDarkMode ? '#334155' : '#ffffff',
                  borderRadius: '8px',
                  border: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`,
                  overflow: 'hidden'
                }}
              >
                <Table 
                  hover 
                  responsive 
                  className="mb-0"
                  style={{
                    backgroundColor: 'transparent'
                  }}
                >
                  <thead>
                    <tr style={{
                      background: isDarkMode ? '#475569' : '#f8f9fa',
                      borderBottom: `2px solid ${isDarkMode ? '#64748b' : '#dee2e6'}`
                    }}>
                      <th style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        fontWeight: '600',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>Date</th>
                      <th style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        fontWeight: '600',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>Time</th>
                      <th style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        fontWeight: '600',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>Purpose of Visit</th>
                      <th style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        fontWeight: '600',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>Doctor Assisted</th>
                      <th style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        fontWeight: '600',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none',
                        textAlign: 'center'
                      }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Sample checkup records */}
                    <tr style={{
                      borderBottom: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`,
                      backgroundColor: isDarkMode ? '#334155' : '#ffffff'
                    }}>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        Jul 28, 2025
                      </td>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        10:30 AM
                      </td>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        General Checkup
                      </td>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        Dr. Maria Santos
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        border: 'none',
                        textAlign: 'center'
                      }}>
                        <Button 
                          size="sm"
                          style={{
                            background: '#0ea5e9',
                            border: 'none',
                            color: '#ffffff',
                            borderRadius: '6px',
                            padding: '4px 12px',
                            fontSize: '0.8rem'
                          }}
                          onClick={() => {
                            alert('Doctor Notes:\n\n• Patient shows good vital signs\n• Blood pressure: 120/80 mmHg\n• Temperature: 36.5°C\n• Recommended: Continue current medications\n• Follow-up: 1 month');
                          }}
                        >
                          <i className="bi bi-sticky me-1"></i>
                          Notes
                        </Button>
                      </td>
                    </tr>
                    
                    <tr style={{
                      borderBottom: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`,
                      backgroundColor: isDarkMode ? '#334155' : '#ffffff'
                    }}>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        Jun 15, 2025
                      </td>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        02:15 PM
                      </td>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        Vaccination - COVID-19 Booster
                      </td>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        Dr. Juan Cruz
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        border: 'none',
                        textAlign: 'center'
                      }}>
                        <Button 
                          size="sm"
                          style={{
                            background: '#0ea5e9',
                            border: 'none',
                            color: '#ffffff',
                            borderRadius: '6px',
                            padding: '4px 12px',
                            fontSize: '0.8rem'
                          }}
                          onClick={() => {
                            alert('Doctor Notes:\n\n• COVID-19 Booster vaccine administered\n• Vaccine: Pfizer-BioNTech\n• Lot No: FK8891\n• No adverse reactions observed\n• Next dose: Not required');
                          }}
                        >
                          <i className="bi bi-sticky me-1"></i>
                          Notes
                        </Button>
                      </td>
                    </tr>
                    
                    <tr style={{
                      borderBottom: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`,
                      backgroundColor: isDarkMode ? '#334155' : '#ffffff'
                    }}>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        May 20, 2025
                      </td>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        09:45 AM
                      </td>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        Medical Certificate
                      </td>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        Dr. Ana Reyes
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        border: 'none',
                        textAlign: 'center'
                      }}>
                        <Button 
                          size="sm"
                          style={{
                            background: '#0ea5e9',
                            border: 'none',
                            color: '#ffffff',
                            borderRadius: '6px',
                            padding: '4px 12px',
                            fontSize: '0.8rem'
                          }}
                          onClick={() => {
                            alert('Doctor Notes:\n\n• Medical certificate issued for employment\n• Patient is physically fit to work\n• No medical restrictions\n• Valid for 6 months\n• Certificate No: MC-2025-0520-001');
                          }}
                        >
                          <i className="bi bi-sticky me-1"></i>
                          Notes
                        </Button>
                      </td>
                    </tr>
                    
                    <tr style={{
                      borderBottom: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`,
                      backgroundColor: isDarkMode ? '#334155' : '#ffffff'
                    }}>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        Apr 10, 2025
                      </td>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        11:20 AM
                      </td>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        Follow-up Consultation
                      </td>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        Dr. Maria Santos
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        border: 'none',
                        textAlign: 'center'
                      }}>
                        <Button 
                          size="sm"
                          style={{
                            background: '#0ea5e9',
                            border: 'none',
                            color: '#ffffff',
                            borderRadius: '6px',
                            padding: '4px 12px',
                            fontSize: '0.8rem'
                          }}
                          onClick={() => {
                            alert('Doctor Notes:\n\n• Follow-up for hypertension management\n• Blood pressure improved: 130/85 mmHg\n• Patient responsive to medication\n• Continue Amlodipine 5mg daily\n• Next follow-up: 3 months');
                          }}
                        >
                          <i className="bi bi-sticky me-1"></i>
                          Notes
                        </Button>
                      </td>
                    </tr>
                    
                    <tr style={{
                      backgroundColor: isDarkMode ? '#334155' : '#ffffff'
                    }}>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        Mar 05, 2025
                      </td>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        03:30 PM
                      </td>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        Annual Physical Examination
                      </td>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        Dr. Carlos Mendoza
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        border: 'none',
                        textAlign: 'center'
                      }}>
                        <Button 
                          size="sm"
                          style={{
                            background: '#0ea5e9',
                            border: 'none',
                            color: '#ffffff',
                            borderRadius: '6px',
                            padding: '4px 12px',
                            fontSize: '0.8rem'
                          }}
                          onClick={() => {
                            alert('Doctor Notes:\n\n• Complete physical examination performed\n• BP: 140/90 mmHg (elevated)\n• BMI: 24.5 (normal)\n• Recommended: Start antihypertensive medication\n• Lab tests: CBC, Lipid profile, FBS ordered\n• Lifestyle modifications advised');
                          }}
                        >
                          <i className="bi bi-sticky me-1"></i>
                          Notes
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </div>

              {/* Summary Stats */}
              <div className="row mt-4">
                <div className="col-md-3">
                  <div 
                    className="text-center p-3"
                    style={{
                      background: isDarkMode ? '#334155' : '#f8f9fa',
                      borderRadius: '8px',
                      border: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`
                    }}
                  >
                    <div style={{color: '#0ea5e9', fontSize: '1.5rem', fontWeight: 'bold'}}>5</div>
                    <div style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.8rem'}}>Total Visits</div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div 
                    className="text-center p-3"
                    style={{
                      background: isDarkMode ? '#334155' : '#f8f9fa',
                      borderRadius: '8px',
                      border: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`
                    }}
                  >
                    <div style={{color: '#10b981', fontSize: '1.5rem', fontWeight: 'bold'}}>3</div>
                    <div style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.8rem'}}>This Year</div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div 
                    className="text-center p-3"
                    style={{
                      background: isDarkMode ? '#334155' : '#f8f9fa',
                      borderRadius: '8px',
                      border: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`
                    }}
                  >
                    <div style={{color: '#f59e0b', fontSize: '1.5rem', fontWeight: 'bold'}}>2</div>
                    <div style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.8rem'}}>Last 90 Days</div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div 
                    className="text-center p-3"
                    style={{
                      background: isDarkMode ? '#334155' : '#f8f9fa',
                      borderRadius: '8px',
                      border: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`
                    }}
                  >
                    <div style={{color: '#ef4444', fontSize: '1.5rem', fontWeight: 'bold'}}>1</div>
                    <div style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.8rem'}}>Last 30 Days</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        
        <Modal.Footer style={{
          background: isDarkMode ? '#334155' : '#f8f9fa',
          border: 'none',
          borderRadius: '0 0 12px 12px'
        }}>
          <Button 
            variant="secondary" 
            onClick={closeCheckupHistoryModal}
            style={{
              background: isDarkMode ? '#64748b' : '#6c757d',
              border: 'none',
              color: '#ffffff'
            }}
          >
            <i className="bi bi-x-circle me-2"></i>
            Close
          </Button>
          <Button 
            style={{
              background: '#10b981',
              border: 'none',
              color: '#ffffff'
            }}
            onClick={() => {
              alert('Checkup history exported successfully!');
            }}
          >
            <i className="bi bi-download me-2"></i>
            Export History
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Immunization History Modal */}
      <Modal 
        show={showImmunizationHistoryModal} 
        onHide={closeImmunizationHistoryModal}
        size="xl"
        centered
        className="immunization-history-modal"
      >
        <Modal.Header 
          closeButton 
          style={{
            background: '#0ea5e9', 
            color: '#ffffff', 
            border: 'none',
            borderRadius: '12px 12px 0 0'
          }}
        >
          <Modal.Title className="w-100 text-center fw-bold fs-4">
            <i className="bi bi-shield-check me-2"></i>
            Immunization History
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body style={{
          background: isDarkMode ? '#1e293b' : '#ffffff', 
          color: isDarkMode ? '#e2e8f0' : '#2c3e50',
          padding: '24px',
          minHeight: '60vh',
          maxHeight: '70vh',
          overflowY: 'auto'
        }}>
          {selectedPatient && (
            <div>
              {/* Patient Header */}
              <div 
                className="mb-4 p-3"
                style={{
                  background: isDarkMode ? '#334155' : '#f8f9fa',
                  borderRadius: '8px',
                  border: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`
                }}
              >
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <h5 style={{color: isDarkMode ? '#e2e8f0' : '#2c3e50', marginBottom: '8px', fontWeight: '600'}}>
                      {getPatientFullName(selectedPatient)}
                    </h5>
                    <div className="row">
                      <div className="col-md-6">
                        <span style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.9rem'}}>
                          <strong>Patient ID:</strong> PT-{String(selectedPatient.id).padStart(4, '0')}
                        </span>
                      </div>
                      <div className="col-md-6">
                        <span style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.9rem'}}>
                          <strong>Age:</strong> {getPatientAge(selectedPatient)} years old
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 text-end">
                    <div style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.9rem'}}>
                      <div><strong>Total Vaccines:</strong> 12</div>
                      <div><strong>Last Vaccination:</strong> Jun 15, 2025</div>
                      <div><strong>Status:</strong> <span style={{color: '#10b981', fontWeight: '600'}}>Up to Date</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vaccination Categories Tabs */}
              <div className="mb-4">
                <div className="row g-2">
                  <div className="col-md-3">
                    <div 
                      className="text-center p-2"
                      style={{
                        background: '#10b981',
                        color: '#ffffff',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}
                    >
                      Routine Childhood (8)
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div 
                      className="text-center p-2"
                      style={{
                        background: '#0ea5e9',
                        color: '#ffffff',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}
                    >
                      COVID-19 Series (2)
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div 
                      className="text-center p-2"
                      style={{
                        background: '#f59e0b',
                        color: '#ffffff',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}
                    >
                      Travel Vaccines (1)
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div 
                      className="text-center p-2"
                      style={{
                        background: '#6b7280',
                        color: '#ffffff',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}
                    >
                      Special (1)
                    </div>
                  </div>
                </div>
              </div>

              {/* Immunization Records Table */}
              <div 
                style={{
                  background: isDarkMode ? '#334155' : '#ffffff',
                  borderRadius: '8px',
                  border: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`,
                  overflow: 'hidden'
                }}
              >
                <Table 
                  hover 
                  responsive 
                  className="mb-0"
                  style={{
                    backgroundColor: 'transparent'
                  }}
                >
                  <thead>
                    <tr style={{
                      background: isDarkMode ? '#475569' : '#f8f9fa',
                      borderBottom: `2px solid ${isDarkMode ? '#64748b' : '#dee2e6'}`
                    }}>
                      <th style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        fontWeight: '600',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>Vaccine</th>
                      <th style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        fontWeight: '600',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>Date Given</th>
                      <th style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        fontWeight: '600',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>Dose</th>
                      <th style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        fontWeight: '600',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>Provider</th>
                      <th style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        fontWeight: '600',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>Status</th>
                      <th style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        fontWeight: '600',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none',
                        textAlign: 'center'
                      }}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* COVID-19 Vaccines */}
                    <tr style={{
                      borderBottom: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`,
                      backgroundColor: isDarkMode ? '#334155' : '#ffffff'
                    }}>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        <div style={{fontWeight: '600'}}>COVID-19 mRNA Vaccine (Pfizer)</div>
                        <small style={{color: isDarkMode ? '#94a3b8' : '#6c757d'}}>mRNA vaccine against SARS-CoV-2</small>
                      </td>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        Jun 15, 2025
                      </td>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        Booster
                      </td>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        Dr. Juan Cruz
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        border: 'none'
                      }}>
                        <span style={{
                          background: '#10b981',
                          color: '#ffffff',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>Complete</span>
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        border: 'none',
                        textAlign: 'center'
                      }}>
                        <Button 
                          size="sm"
                          style={{
                            background: '#0ea5e9',
                            border: 'none',
                            color: '#ffffff',
                            borderRadius: '6px',
                            padding: '4px 12px',
                            fontSize: '0.8rem'
                          }}
                          onClick={() => {
                            alert('Vaccine Details:\n\n• Vaccine: COVID-19 mRNA (Pfizer)\n• Lot Number: FK8891\n• Manufacturer: Pfizer-BioNTech\n• Expiry Date: Dec 2025\n• Site: Left arm\n• No adverse reactions reported');
                          }}
                        >
                          <i className="bi bi-info-circle me-1"></i>
                          View
                        </Button>
                      </td>
                    </tr>

                    {/* Hepatitis B */}
                    <tr style={{
                      borderBottom: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`,
                      backgroundColor: isDarkMode ? '#334155' : '#ffffff'
                    }}>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        <div style={{fontWeight: '600'}}>Hepatitis B Vaccine</div>
                        <small style={{color: isDarkMode ? '#94a3b8' : '#6c757d'}}>Protects against hepatitis B virus</small>
                      </td>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        Mar 20, 2024
                      </td>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        Series Complete
                      </td>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        Dr. Maria Santos
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        border: 'none'
                      }}>
                        <span style={{
                          background: '#10b981',
                          color: '#ffffff',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>Complete</span>
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        border: 'none',
                        textAlign: 'center'
                      }}>
                        <Button 
                          size="sm"
                          style={{
                            background: '#0ea5e9',
                            border: 'none',
                            color: '#ffffff',
                            borderRadius: '6px',
                            padding: '4px 12px',
                            fontSize: '0.8rem'
                          }}
                          onClick={() => {
                            alert('Vaccine Details:\n\n• Vaccine: Hepatitis B\n• Series: 3 doses completed\n• Dates: Birth, 1 month, 6 months\n• All doses administered properly\n• Immunity: Lifetime protection');
                          }}
                        >
                          <i className="bi bi-info-circle me-1"></i>
                          View
                        </Button>
                      </td>
                    </tr>

                    {/* MMR */}
                    <tr style={{
                      borderBottom: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`,
                      backgroundColor: isDarkMode ? '#334155' : '#ffffff'
                    }}>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        <div style={{fontWeight: '600'}}>Measles, Mumps, and Rubella (MMR)</div>
                        <small style={{color: isDarkMode ? '#94a3b8' : '#6c757d'}}>Combined vaccine for MMR protection</small>
                      </td>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        Jan 15, 2024
                      </td>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        Dose 2
                      </td>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        Dr. Ana Reyes
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        border: 'none'
                      }}>
                        <span style={{
                          background: '#10b981',
                          color: '#ffffff',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>Complete</span>
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        border: 'none',
                        textAlign: 'center'
                      }}>
                        <Button 
                          size="sm"
                          style={{
                            background: '#0ea5e9',
                            border: 'none',
                            color: '#ffffff',
                            borderRadius: '6px',
                            padding: '4px 12px',
                            fontSize: '0.8rem'
                          }}
                          onClick={() => {
                            alert('Vaccine Details:\n\n• Vaccine: MMR (Measles, Mumps, Rubella)\n• Dose: 2 of 2\n• First dose: 9 months\n• Second dose: 15 months\n• Protection: Lifetime immunity expected');
                          }}
                        >
                          <i className="bi bi-info-circle me-1"></i>
                          View
                        </Button>
                      </td>
                    </tr>

                    {/* Pneumococcal */}
                    <tr style={{
                      borderBottom: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`,
                      backgroundColor: isDarkMode ? '#334155' : '#ffffff'
                    }}>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        <div style={{fontWeight: '600'}}>Pneumococcal Conjugate (PCV)</div>
                        <small style={{color: isDarkMode ? '#94a3b8' : '#6c757d'}}>Protects against pneumococcal disease</small>
                      </td>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        Dec 10, 2023
                      </td>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        Booster
                      </td>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        Dr. Carlos Mendoza
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        border: 'none'
                      }}>
                        <span style={{
                          background: '#10b981',
                          color: '#ffffff',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>Complete</span>
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        border: 'none',
                        textAlign: 'center'
                      }}>
                        <Button 
                          size="sm"
                          style={{
                            background: '#0ea5e9',
                            border: 'none',
                            color: '#ffffff',
                            borderRadius: '6px',
                            padding: '4px 12px',
                            fontSize: '0.8rem'
                          }}
                          onClick={() => {
                            alert('Vaccine Details:\n\n• Vaccine: Pneumococcal Conjugate (PCV)\n• Schedule: 6, 10, 14 weeks + booster\n• Current: Booster dose completed\n• Protection: Against 13 pneumococcal strains\n• Next due: Adult booster at age 65');
                          }}
                        >
                          <i className="bi bi-info-circle me-1"></i>
                          View
                        </Button>
                      </td>
                    </tr>

                    {/* Influenza */}
                    <tr style={{
                      borderBottom: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`,
                      backgroundColor: isDarkMode ? '#334155' : '#ffffff'
                    }}>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        <div style={{fontWeight: '600'}}>Influenza Vaccine</div>
                        <small style={{color: isDarkMode ? '#94a3b8' : '#6c757d'}}>Annual flu protection</small>
                      </td>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        Oct 20, 2024
                      </td>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        Annual 2024
                      </td>
                      <td style={{
                        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        border: 'none'
                      }}>
                        Dr. Maria Santos
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        border: 'none'
                      }}>
                        <span style={{
                          background: '#f59e0b',
                          color: '#ffffff',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>Due Soon</span>
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        border: 'none',
                        textAlign: 'center'
                      }}>
                        <Button 
                          size="sm"
                          style={{
                            background: '#0ea5e9',
                            border: 'none',
                            color: '#ffffff',
                            borderRadius: '6px',
                            padding: '4px 12px',
                            fontSize: '0.8rem'
                          }}
                          onClick={() => {
                            alert('Vaccine Details:\n\n• Vaccine: Influenza (Flu Shot)\n• Season: 2024-2025\n• Type: Quadrivalent inactivated\n• Next dose: October 2025\n• Note: Annual vaccination recommended');
                          }}
                        >
                          <i className="bi bi-info-circle me-1"></i>
                          View
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </div>

              {/* Upcoming Vaccinations */}
              <div className="mt-4">
                <h6 style={{color: isDarkMode ? '#e2e8f0' : '#2c3e50', marginBottom: '16px', fontWeight: '600'}}>
                  <i className="bi bi-calendar-plus me-2" style={{color: '#f59e0b'}}></i>
                  Upcoming Vaccinations
                </h6>
                <div 
                  className="p-3"
                  style={{
                    background: isDarkMode ? '#334155' : '#fff3cd',
                    borderRadius: '8px',
                    border: `1px solid ${isDarkMode ? '#475569' : '#ffeaa7'}`
                  }}
                >
                  <div className="row">
                    <div className="col-md-6">
                      <div style={{color: isDarkMode ? '#e2e8f0' : '#856404', fontWeight: '600', fontSize: '0.9rem'}}>
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        Influenza Vaccine (2025)
                      </div>
                      <small style={{color: isDarkMode ? '#94a3b8' : '#6c757d'}}>
                        Due: October 2025 | Annual flu shot
                      </small>
                    </div>
                    <div className="col-md-6">
                      <div style={{color: isDarkMode ? '#e2e8f0' : '#856404', fontWeight: '600', fontSize: '0.9rem'}}>
                        <i className="bi bi-info-circle me-2"></i>
                        Tetanus-Diphtheria (Td)
                      </div>
                      <small style={{color: isDarkMode ? '#94a3b8' : '#6c757d'}}>
                        Due: March 2026 | 10-year booster
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Immunization Summary */}
              <div className="row mt-4">
                <div className="col-md-3">
                  <div 
                    className="text-center p-3"
                    style={{
                      background: isDarkMode ? '#334155' : '#f8f9fa',
                      borderRadius: '8px',
                      border: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`
                    }}
                  >
                    <div style={{color: '#10b981', fontSize: '1.5rem', fontWeight: 'bold'}}>12</div>
                    <div style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.8rem'}}>Total Vaccines</div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div 
                    className="text-center p-3"
                    style={{
                      background: isDarkMode ? '#334155' : '#f8f9fa',
                      borderRadius: '8px',
                      border: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`
                    }}
                  >
                    <div style={{color: '#0ea5e9', fontSize: '1.5rem', fontWeight: 'bold'}}>95%</div>
                    <div style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.8rem'}}>Compliance</div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div 
                    className="text-center p-3"
                    style={{
                      background: isDarkMode ? '#334155' : '#f8f9fa',
                      borderRadius: '8px',
                      border: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`
                    }}
                  >
                    <div style={{color: '#f59e0b', fontSize: '1.5rem', fontWeight: 'bold'}}>2</div>
                    <div style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.8rem'}}>Due Soon</div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div 
                    className="text-center p-3"
                    style={{
                      background: isDarkMode ? '#334155' : '#f8f9fa',
                      borderRadius: '8px',
                      border: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`
                    }}
                  >
                    <div style={{color: '#ef4444', fontSize: '1.5rem', fontWeight: 'bold'}}>0</div>
                    <div style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.8rem'}}>Overdue</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        
        <Modal.Footer style={{
          background: isDarkMode ? '#334155' : '#f8f9fa',
          border: 'none',
          borderRadius: '0 0 12px 12px'
        }}>
          <Button 
            variant="secondary" 
            onClick={closeImmunizationHistoryModal}
            style={{
              background: isDarkMode ? '#64748b' : '#6c757d',
              border: 'none',
              color: '#ffffff'
            }}
          >
            <i className="bi bi-x-circle me-2"></i>
            Close
          </Button>
          <Button 
            style={{
              background: '#10b981',
              border: 'none',
              color: '#ffffff'
            }}
            onClick={() => {
              alert('Immunization card generated successfully!');
            }}
          >
            <i className="bi bi-card-text me-2"></i>
            Generate Card
          </Button>
          <Button 
            style={{
              background: '#0ea5e9',
              border: 'none',
              color: '#ffffff'
            }}
            onClick={() => {
              alert('Immunization history exported successfully!');
            }}
          >
            <i className="bi bi-download me-2"></i>
            Export History
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Referral Form Modal */}
      <ReferralForm
        show={showReferralFormModal}
        onHide={closeReferralFormModal}
        selectedPatient={selectedPatient}
      />

      {/* Notification Manager Modal */}
      <Modal
        show={showNotificationManagerModal}
        onHide={closeNotificationManagerModal}
        size="xl"
        centered
        backdrop="static"
      >
        <Modal.Header closeButton style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
          <Modal.Title>
            <i className="bi bi-bell me-2" style={{ color: '#f39c12' }}></i>
            Notification Manager
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '0' }}>
          <NotificationManager patients={unsortedMembersData || []} />
        </Modal.Body>
      </Modal>

      {/* SMS Notification Modal */}
      <SMSNotificationModal
        show={showSMSNotificationModal}
        onHide={closeSMSNotificationModal}
        selectedPatient={selectedPatient}
      />

      {/* Simulation Mode Modal */}
      {showSimulationModal && (
        <div className="modal-overlay" onClick={() => setShowSimulationModal(false)}>
          <div className="simulation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>
                <i className="bi bi-clock-history me-2"></i>
                Simulation System
              </h4>
              <button className="modal-close" onClick={() => setShowSimulationModal(false)}>
                <i className="bi bi-x"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="simulation-warning">
                <div className="warning-content">
                  <div className="warning-header">
                    <i className="bi bi-exclamation-triangle text-warning me-2"></i>
                    <strong>Development & Testing Feature</strong>
                  </div>
                  <p>Jump to specific dates and times to test time-sensitive features and system behavior.</p>
                </div>
              </div>

              <div className="form-section">
                <div className="form-group">
                  <div className="simulation-toggle-container">
                    <button
                      className={`btn ${simulationMode.enabled ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={handleSimulationToggle}
                    >
                      <i className="bi bi-clock me-1"></i>
                      {simulationMode.enabled ? 'Stop Simulation' : 'Start Simulation'}
                    </button>
                    <div className="simulation-notice">
                      <small className="text-muted">
                        <i className="bi bi-info-circle me-1"></i>
                        {simulationMode.enabled ? 'System time will be overridden' : 'Enable to jump to custom date/time'}
                      </small>
                    </div>
                  </div>
                  {simulationMode.enabled && (
                    <div className="simulation-status">
                      <span className="status-badge active">
                        <i className="bi bi-lightning-charge me-1"></i>
                        Active
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {simulationMode.enabled && (
                <>
                  <div className="form-section">
                    <label className="section-label">
                      <i className="bi bi-calendar3 me-2"></i>
                      Simulated Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={simulationMode.currentSimulatedDate.toISOString().slice(0, 16)}
                      onChange={(e) => handleSimulatedDateChange(e.target.value)}
                    />
                    <small className="text-muted">
                      Current: {simulationMode.currentSimulatedDate.toLocaleString()}
                    </small>
                  </div>

                  <div className="form-section">
                    <label className="section-label">
                      <i className="bi bi-toggles me-2"></i>
                      Service Options
                    </label>
                    <div className="service-toggles">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={simulationMode.smsSimulation}
                          onChange={(e) => handleSimulationChange('smsSimulation', e.target.checked)}
                          id="smsSimulation"
                        />
                        <label className="form-check-label" htmlFor="smsSimulation">
                          <i className="bi bi-chat-text me-2"></i>
                          Mock SMS Service
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={simulationMode.emailSimulation}
                          onChange={(e) => handleSimulationChange('emailSimulation', e.target.checked)}
                          id="emailSimulation"
                        />
                        <label className="form-check-label" htmlFor="emailSimulation">
                          <i className="bi bi-envelope me-2"></i>
                          Mock Email Service
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={simulationMode.dataSimulation}
                          onChange={(e) => handleSimulationChange('dataSimulation', e.target.checked)}
                          id="dataSimulation"
                        />
                        <label className="form-check-label" htmlFor="dataSimulation">
                          <i className="bi bi-database me-2"></i>
                          Auto-Generate Test Data
                        </label>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="btn-primary"
                onClick={() => {
                  alert(`Simulation ${simulationMode.enabled ? 'activated' : 'deactivated'} successfully!${simulationMode.enabled ? ` Jump to: ${simulationMode.currentSimulatedDate.toLocaleString()}` : ''}`);
                  setShowSimulationModal(false);
                }}
              >
                <i className="bi bi-check-circle me-2"></i>
                Apply Settings
              </button>
              <button 
                className="btn-secondary"
                onClick={resetSimulation}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Reset
              </button>
              <button 
                className="btn-cancel"
                onClick={() => setShowSimulationModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Patients Modal */}
      <Modal 
        show={showRemoveModal} 
        onHide={() => setShowRemoveModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-trash me-2 text-danger"></i>
            Remove Patients from Today's Checkups
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {todaysCheckups.length === 0 ? (
            <div className="text-center py-4">
              <i className="bi bi-calendar-x" style={{fontSize: '3rem', color: '#6c757d', marginBottom: '1rem'}}></i>
              <h5 style={{color: '#6c757d'}}>No Patients to Remove</h5>
              <p style={{color: '#6c757d'}}>There are no patients checked in for today.</p>
            </div>
          ) : (
            <>
              <div className="alert alert-warning d-flex align-items-center mb-3" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <div>
                  <strong>Warning:</strong> Removing a patient will permanently delete their checkup record for today. 
                  This action cannot be undone.
                </div>
              </div>
              
              <div className="patients-list">
                <h6 className="mb-3">Select a patient to remove:</h6>
                <div className="row g-2">
                  {todaysCheckups.map((checkup) => (
                    <div key={checkup.id} className="col-md-6">
                      <div className="card border-danger-subtle">
                        <div className="card-body p-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="card-title mb-1">{checkup.patientName}</h6>
                              <small className="text-muted">
                                PT-{String(checkup.patientId).padStart(4, '0')} • 
                                Check-in: {checkup.checkInTime}
                              </small>
                              <br />
                              <small className="text-muted">
                                Purpose: {checkup.purpose}
                              </small>
                              <br />
                              <span className={`badge mt-1 ${
                                checkup.status === 'Checked In' ? 'bg-info' :
                                checkup.status === 'Waiting' ? 'bg-warning text-dark' :
                                checkup.status === 'In Progress' ? 'bg-primary' :
                                checkup.status === 'Completed' ? 'bg-success' :
                                'bg-secondary'
                              }`}>
                                {checkup.status}
                              </span>
                            </div>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => handleRemoveFromCheckup(checkup.id)}
                            >
                              <i className="bi bi-trash me-1"></i>
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRemoveModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Backup Settings Modal */}
      <Modal show={showBackupSettingsModal} onHide={() => setShowBackupSettingsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-gear" style={{marginRight: '10px'}}></i>
            Backup Settings
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <BackupSettingsForm 
            settings={autoBackupSettings}
            onSave={handleSaveAutoBackupSettings}
            onCancel={() => setShowBackupSettingsModal(false)}
            backupHistory={backupHistory}
            restoreHistory={restoreHistory}
          />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
