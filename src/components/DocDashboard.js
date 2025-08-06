import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Modal, Button, Form, InputGroup, Row, Col, Table, Card, Tabs, Tab } from 'react-bootstrap';
import { QRCodeCanvas as QRCode } from 'qrcode.react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import adminService from '../services/adminService';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import PatientInfoCards from './PatientInfoCards';
import PatientActionsSection from './PatientActionsSection';
import '../styles/DocDashboard.css'; // Use DocDashboard.css
import 'bootstrap-icons/font/bootstrap-icons.css';

const DocDashboard = () => {
  const { user } = useAuth();
  const { 
    doctorQueueData, 
    sharedCheckupsData, 
    updateDoctorQueueStatus, 
    completeDoctorSession,
    syncCheckupStatus,
    simulationModeStatus,
    patientsData,
    familiesData,
    setAllPatients,
    setAllFamilies
  } = useData();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [currentPath, setCurrentPath] = useState("My Patient Queue"); // Default path for doctor
  const [showVitalSignsModal, setShowVitalSignsModal] = useState(false);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showPatientDetailsModal, setShowPatientDetailsModal] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedAppointmentNotes, setSelectedAppointmentNotes] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [showManageDropdown, setShowManageDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabKey, setTabKey] = useState('families');
  
  // Add New Consultation Modal States
  const [showAddConsultationModal, setShowAddConsultationModal] = useState(false);
  const [consultationPatientType, setConsultationPatientType] = useState('existing');
  const [selectedPatientForConsultation, setSelectedPatientForConsultation] = useState(null);
  const [consultationSearchTerm, setConsultationSearchTerm] = useState('');
  const [consultationForm, setConsultationForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    patientId: '',
    consultationType: 'Check-up',
    priority: 'Normal',
    notes: ''
  });
  // Note: patients and families data now comes from useData() context
  
  const [todaysCheckups, setTodaysCheckups] = useState([ // Sample data for doctor's checkups
    { id: 201, patientId: 'PT-0023', name: 'Maria Santos', time: '09:30 AM', type: 'Follow-up', status: 'Waiting'},
    { id: 202, patientId: 'PT-0034', name: 'Carlos Mendoza', time: '10:15 AM', type: 'Check-up', status: 'In Progress'},
  ]);

  // Merge doctor queue data with local checkups
  const allCheckups = React.useMemo(() => {
    const merged = [...todaysCheckups];
    
    // Add items from shared doctor queue
    doctorQueueData.forEach(queueItem => {
      const existingIndex = merged.findIndex(checkup => checkup.id === queueItem.id);
      if (existingIndex >= 0) {
        // Update existing checkup with queue data
        merged[existingIndex] = {
          ...merged[existingIndex],
          ...queueItem,
          source: queueItem.source || 'local'
        };
      } else {
        // Add new checkup from queue
        merged.push({
          ...queueItem,
          patientId: queueItem.patientId || `PT-${String(queueItem.id).padStart(4, '0')}`,
          time: queueItem.time || new Date(queueItem.queuedAt || Date.now()).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          }),
          source: queueItem.source || 'queue'
        });
      }
    });
    
    return merged.sort((a, b) => {
      // Sort by time, with simulation items prioritized
      if (a.source === 'admin_simulation' && b.source !== 'admin_simulation') return -1;
      if (b.source === 'admin_simulation' && a.source !== 'admin_simulation') return 1;
      return a.time.localeCompare(b.time);
    });
  }, [todaysCheckups, doctorQueueData]);

  const [ongoingAppointments, setOngoingAppointments] = useState([ // Sample data
    { id: 301, patientName: 'Ana Reyes', date: '2025-06-10', time: '11:00 AM', type: 'Consultation', status: 'Ongoing'},
  ]);

  const [finishedAppointments, setFinishedAppointments] = useState([ // Sample data
    { id: 302, patientName: 'Juan Santos', date: '2025-06-09', time: '02:00 PM', type: 'Follow-up', status: 'Finished'},
  ]);

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [workingHours, setWorkingHours] = useState({ start: '08:00', end: '17:00' });
  const [defaultAppointmentDuration, setDefaultAppointmentDuration] = useState(30);
  const [vitalSignsUnit, setVitalSignsUnit] = useState('metric');
  const [autoSaveNotes, setAutoSaveNotes] = useState(true);
  const [reminderMinutes, setReminderMinutes] = useState(10);
  const [fontSize, setFontSize] = useState('medium');

  // Sorting configuration for Individual Members tab
  const [memberSortConfig, setMemberSortConfig] = useState({ key: 'id', direction: 'ascending' });

  // Note: Data is now loaded through DataContext and can be refreshed via handleRefreshData

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    if (sidebarOpen) { // Simplified condition: if sidebar was open, it's now closing
      setActiveDropdown(null);
    }
  };

  const handleDropdownToggle = (dropdown) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const handleNavigation = (path) => {
    setCurrentPath(path);
    // Potentially close dropdown after navigation if desired
    // setActiveDropdown(null); 
  };

  const handleLogout = () => setShowLogoutModal(true);
  const confirmLogout = () => {
    setShowLogoutModal(false);
    navigate('/'); // Navigate to login or home
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

  const formatDate = (date) => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  const formatShortDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const handlePatientSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredPatients = () => {
    if (!searchTerm) return patientsData;
    const term = searchTerm.toLowerCase();
    return patientsData.filter(patient =>
      patient.name.toLowerCase().includes(term) ||
      (patient.familyId && patient.familyId.toLowerCase().includes(term))
    );
  };

  const filteredFamilies = () => {
    if (!searchTerm) return familiesData;
    const term = searchTerm.toLowerCase();
    return familiesData.filter(family =>
      family.familyName.toLowerCase().includes(term) ||
      family.id.toLowerCase().includes(term)
    );
  };

  // Consultation Patient Search Functions
  const filteredConsultationPatients = () => {
    if (!consultationSearchTerm) return patientsData.slice(0, 10); // Show first 10 if no search
    const term = consultationSearchTerm.toLowerCase();
    return patientsData.filter(patient => {
      const fullName = patient.name.toLowerCase();
      // Search in format: "Last, First" or just any part of the name
      return fullName.includes(term) ||
        patient.familyId?.toLowerCase().includes(term) ||
        patient.id?.toString().includes(term);
    }).slice(0, 10); // Limit to 10 results
  };

  const handleConsultationPatientSelect = (patient) => {
    setSelectedPatientForConsultation(patient);
    setConsultationSearchTerm(patient.name);
  };

  const handleConsultationSearchChange = (e) => {
    setConsultationSearchTerm(e.target.value);
    setSelectedPatientForConsultation(null);
  };

  const resetConsultationModal = () => {
    setShowAddConsultationModal(false);
    setConsultationPatientType('existing');
    setSelectedPatientForConsultation(null);
    setConsultationSearchTerm('');
    setConsultationForm({
      firstName: '',
      middleName: '',
      lastName: '',
      patientId: '',
      consultationType: 'Check-up',
      priority: 'Normal',
      notes: ''
    });
  };

  const handleAddPatient = () => setShowAddPatientModal(true);
  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    setShowPatientDetailsModal(true);
  };
  const handleVitalSigns = (patient) => {
    setSelectedPatient(patient);
    setShowVitalSignsModal(true);
  };
  const handleQRCode = (patient) => {
    setSelectedPatient(patient);
    setShowQRCodeModal(true);
  };

  const handleViewFamily = (family) => {
    setSelectedFamily(family);
    setShowFamilyModal(true);
  };
  
  const getFamilyMembers = (familyId) => {
    return patientsData.filter(patient => patient.familyId === familyId);
  };

  const handleManageDropdown = () => {
    setShowManageDropdown(!showManageDropdown);
  };

  const handleReassignFamily = () => {
    alert(`Patient reassignment feature will be available once backend is integrated.`);
    setShowManageDropdown(false);
  };

  const handleDeletePatient = () => {
    alert(`Patient deletion feature will be available once backend is integrated.`);
    setShowManageDropdown(false);
  };

  // Patient action handlers for PatientActionsSection
  const handleCheckupHistory = (patient) => {
    alert(`Checkup history for ${patient.name || patient.fullName} will be available once backend is integrated.`);
  };

  const handleVitalSignsHistory = (patient) => {
    alert(`Vital signs history for ${patient.name || patient.fullName} will be available once backend is integrated.`);
  };

  const handleTreatmentRecord = (patient) => {
    alert(`Treatment record for ${patient.name || patient.fullName} will be available once backend is integrated.`);
  };

  const handleImmunizationHistory = (patient) => {
    alert(`Immunization history for ${patient.name || patient.fullName} will be available once backend is integrated.`);
  };

  const handleReferralForm = (patient) => {
    alert(`Referral form for ${patient.name || patient.fullName} will be available once backend is integrated.`);
  };

  const handleSMSNotification = (patient) => {
    alert(`SMS notification for ${patient.name || patient.fullName} will be available once backend is integrated.`);
  };

  // Helper function to get patient full name (similar to AdminDashboard)
  const getPatientFullName = (patient) => {
    if (!patient) return 'N/A'; // Handle null/undefined patient
    if (patient.fullName) return patient.fullName;
    if (patient.name) return patient.name; // Fallback for old data structure
    if (patient.firstName && patient.lastName) {
      return `${patient.lastName}, ${patient.firstName}${patient.middleName ? ' ' + patient.middleName : ''}`;
    }
    return `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown Patient';
  };

  // Additional helper functions for patient data display
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

  // Sorting function for tables
  const requestSort = (key, config, setConfig) => {
    let direction = 'ascending';
    if (config.key === key && config.direction === 'ascending') {
      direction = 'descending';
    }
    setConfig({ key, direction });
  };

  // Sorted patients for Individual Members tab
  const sortedPatients = useMemo(() => {
    let sortableItems = [...filteredPatients()];
    if (memberSortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[memberSortConfig.key];
        let bValue = b[memberSortConfig.key];
        
        // Handle special sorting cases
        if (memberSortConfig.key === 'lastCheckup') {
          aValue = new Date(a.lastCheckup || a.createdAt || 0);
          bValue = new Date(b.lastCheckup || b.createdAt || 0);
        } else if (memberSortConfig.key === 'familyId') {
          aValue = a.familyId || 'zzz'; // Put unassigned at the end
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
  }, [patientsData, memberSortConfig, searchTerm]);

  const handleStartSession = (checkup) => {
    // In a real application, this would start a session and navigate to the session view
    alert(`Starting session for ${checkup.name}. Session management will be implemented in Phase 2.`);
    
    // Update local state
    setTodaysCheckups(prev => 
      prev.map(c => c.id === checkup.id ? { ...c, status: 'In Progress' } : c)
    );
    
    // Update shared state if this is from admin simulation
    if (checkup.source === 'admin_simulation') {
      updateDoctorQueueStatus(checkup.id, 'In Progress', {
        startedAt: new Date().toISOString(),
        doctorId: user?.id || 'current-doctor'
      });
    }
    
    // Sync with shared checkups
    syncCheckupStatus(checkup.id, 'Ongoing', 'doctor_dashboard');
  };

  const handleContinueSession = (checkup) => {
    // In a real application, this would continue an existing session
    alert(`Continuing session for ${checkup.name}. Opening session workspace...`);
    
    // Update shared state if needed
    if (checkup.source === 'admin_simulation') {
      updateDoctorQueueStatus(checkup.id, 'In Progress', {
        resumedAt: new Date().toISOString()
      });
    }
    
    // Navigate to session management interface
  };

  const handlePauseSession = (session) => {
    alert(`Pausing session for ${session.patientName}. Session can be resumed later.`);
    // In a real application, this would pause the session and save current state
  };

  const handleCompleteSession = (session) => {
    const confirmed = window.confirm(`Complete session for ${session.patientName}? This action cannot be undone.`);
    if (confirmed) {
      const sessionData = {
        completedTime: new Date().toLocaleTimeString(),
        completedAt: new Date().toISOString(),
        doctorId: user?.id || 'current-doctor'
      };
      
      // Move from ongoing to finished
      setFinishedAppointments(prev => [
        ...prev,
        { ...session, status: 'Finished', ...sessionData }
      ]);
      setOngoingAppointments(prev => prev.filter(s => s.id !== session.id));
      
      // Update shared state
      completeDoctorSession(session.id, sessionData);
      
      alert(`Session completed for ${session.patientName}.`);
    }
  };

  const handleViewSessionRecord = (appointment) => {
    alert(`Viewing session record for ${appointment.patientName}. Medical record viewer will open.`);
    // In a real application, this would open the detailed medical record
  };

  const handlePrintRecord = (appointment) => {
    alert(`Printing session record for ${appointment.patientName}. Generating PDF...`);
    // In a real application, this would generate and print a PDF record
  };

  const handleViewNotes = (appointment) => {
    setSelectedAppointmentNotes(appointment);
    setShowNotesModal(true);
  };
  
  const handleRefreshData = async () => {
    try {
      // Fetch data from backend
      const [patientsResponse, familiesResponse] = await Promise.all([
        adminService.getAllPatients(),
        adminService.getAllFamilies()
      ]);

      // Update the global context with fetched data
      setAllPatients(patientsResponse || []);
      setAllFamilies(familiesResponse || []);

      // Prepare diagnostic message
      const patientsCount = patientsResponse?.length || 0;
      const familiesCount = familiesResponse?.length || 0;
      const contextPatientsCount = patientsData?.length || 0;
      const contextFamiliesCount = familiesData?.length || 0;

      let message = `✅ Database Refresh Successful!\n\n`;
      message += `Backend Database:\n`;
      message += `• Patients: ${patientsCount}\n`;
      message += `• Families: ${familiesCount}\n\n`;
      message += `Updated Context (What you'll see now):\n`;
      message += `• Patients: ${patientsCount}\n`;
      message += `• Families: ${familiesCount}\n\n`;
      
      if (patientsCount > 0) {
        message += `🎉 Data successfully loaded into the application!\n`;
        message += `The patient database should now display all patients.`;
      } else {
        message += `⚠️ No patients found in the backend database.\n`;
        message += `Please check if patients have been added through the Admin Dashboard.`;
      }

      alert(message);
      console.log('Refresh complete - Patients:', patientsResponse, 'Families:', familiesResponse);
      
    } catch (error) {
      console.error('Error refreshing data:', error);
      alert(`❌ Error refreshing database:\n\n${error.message || 'Unknown error occurred'}\n\nPlease check your connection and try again.`);
    }
  };

  // Content Rendering Functions
  const renderDoctorsCheckupToday = () => (
    <>
      <div className="content-header">
        <h1>
          <i className="bi bi-person-lines-fill me-2 text-primary"></i>
          My Patient Queue
        </h1>
      </div>
      <div className="patient-management">
        <div className="management-header">
          <h2 className="management-title">
            Patients Ready for Checkup - {formatShortDate(currentDateTime)}
          </h2>
          <div className="management-actions d-flex align-items-center justify-content-between">
            <div className="search-box d-flex align-items-center">
              <i className="bi bi-search search-icon"></i>
              <input 
                type="text" 
                placeholder="Search patient..." 
                className="search-input" 
                value={searchTerm} 
                onChange={handlePatientSearch} 
              />
              <button className="refresh-btn ms-3" onClick={() => setShowAddConsultationModal(true)}>
                <i className="bi bi-plus-circle me-1"></i> Add New Consultation
              </button>
              <button className="refresh-btn ms-2" onClick={handleRefreshData}>
                <i className="bi bi-arrow-clockwise"></i> Refresh Data
              </button>
            </div>
            <div className="status-indicators">
              <span className="status-badge waiting">
                <i className="bi bi-hourglass-split me-1"></i>
                {allCheckups.filter(c => c.status === 'Waiting').length} Waiting
              </span>
              <span className="status-badge in-progress">
                <i className="bi bi-activity me-1"></i>
                {allCheckups.filter(c => c.status === 'In Progress').length} In Progress
              </span>
              {doctorQueueData.length > 0 && (
                <span className="status-badge simulation" style={{backgroundColor: '#e3f2fd', color: '#1976d2'}}>
                  <i className="bi bi-cpu me-1"></i>
                  {doctorQueueData.length} From Admin
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="table-container">
          <Table hover className="data-table modern-checkup-table table-wider">
            <thead>
              <tr>
                <th style={{width: '6%'}}>#</th>
                <th style={{width: '14%'}}>Patient ID</th>
                <th style={{width: '18%'}}>Patient Name</th>
                <th style={{width: '12%'}}>Time</th>
                <th style={{width: '16%'}}>Service Type</th>
                <th style={{width: '12%'}}>Status</th>
                <th style={{width: '22%'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allCheckups.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map((checkup, index) => (
                <tr key={checkup.id} className={`checkup-row ${checkup.status.toLowerCase().replace(' ', '-')} ${checkup.source === 'admin_simulation' ? 'simulation-row' : ''}`}>
                  <td className="row-number">
                    {index + 1}
                    {checkup.source === 'admin_simulation' && (
                      <span className="simulation-indicator" title="From Admin Simulation">
                        <i className="bi bi-cpu text-primary"></i>
                      </span>
                    )}
                  </td>
                  <td className="patient-id-cell">
                    <span className="patient-id">{checkup.patientId}</span>
                  </td>
                  <td className="patient-name-cell">
                    <div className="patient-info">
                      <span className="patient-name">{checkup.name}</span>
                    </div>
                  </td>
                  <td className="time-cell">
                    <span className="appointment-time">{checkup.time}</span>
                  </td>
                  <td className="type-cell">
                    <span className="service-type">{checkup.type}</span>
                  </td>
                  <td className="status-cell">
                    <span className={`status-badge-table status-${checkup.status.toLowerCase().replace(' ', '-')}`}>
                      {checkup.status === 'Waiting' && <i className="bi bi-hourglass-split me-1"></i>}
                      {checkup.status === 'In Progress' && <i className="bi bi-activity me-1"></i>}
                      {checkup.status}
                    </span>
                  </td>
                  <td className="action-cell">
                    <div className="action-buttons-group d-flex flex-wrap gap-1">
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="action-btn view-btn" 
                        onClick={() => handleViewPatient(patientsData.find(p => p.name === checkup.name) || checkup)}
                      >
                        <i className="bi bi-person-lines-fill me-1"></i>
                        Patient Info
                      </Button>
                      <Button 
                        variant="outline-warning" 
                        size="sm" 
                        className="action-btn vitals-btn" 
                        onClick={() => handleVitalSigns(patientsData.find(p => p.name === checkup.name) || checkup)}
                      >
                        <i className="bi bi-heart-pulse me-1"></i>
                        View Vitals
                      </Button>
                      {checkup.status === 'Waiting' ? (
                        <Button 
                          variant="outline-success" 
                          size="sm" 
                          className="action-btn start-btn" 
                          onClick={() => handleStartSession(checkup)}
                        >
                          <i className="bi bi-play-circle me-1"></i>
                          Start Session
                        </Button>
                      ) : (
                        <Button 
                          variant="outline-info" 
                          size="sm" 
                          className="action-btn continue-btn" 
                          onClick={() => handleContinueSession(checkup)}
                        >
                          <i className="bi bi-arrow-right-circle me-1"></i>
                          Continue
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {allCheckups.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center no-data">
                    <div className="no-data-message">
                      <i className="bi bi-calendar-x"></i>
                      <p>No checkups found matching your search.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </div>
    </>
  );

  const renderOngoingAndFinishedAppointments = () => (
    <>
      <div className="content-header">
        <h1>
          <i className="bi bi-clipboard-pulse me-2 text-success"></i>
          Session Management
        </h1>
      </div>
      
      <Tabs defaultActiveKey="ongoing" className="modern-session-tabs">
        <Tab eventKey="ongoing" title={
          <span>
            <i className="bi bi-activity me-2"></i>
            Active Sessions ({ongoingAppointments.length})
          </span>
        }>
          <div className="ongoing-sessions-container">
            {ongoingAppointments.length > 0 ? (
              <div className="session-cards-grid">
                {ongoingAppointments.map(session => (
                  <Card key={session.id} className="session-card ongoing-card">
                    <Card.Header className="session-card-header">
                      <div className="session-patient-info">
                        <div className="patient-avatar-sm">
                          <i className="bi bi-person-circle"></i>
                        </div>
                        <div className="patient-details">
                          <h5 className="patient-name">{session.patientName}</h5>
                          <span className="patient-id">PT-{String(session.id).padStart(4, '0')}</span>
                        </div>
                      </div>
                      <div className="session-status">
                        <span className="status-badge active">
                          <i className="bi bi-circle-fill me-1"></i>
                          Active
                        </span>
                      </div>
                    </Card.Header>
                    
                    <Card.Body className="session-card-body">
                      <div className="session-info-grid">
                        <div className="info-item">
                          <i className="bi bi-clock me-2"></i>
                          <span className="info-label">Time Started:</span>
                          <span className="info-value">{session.time}</span>
                        </div>
                        <div className="info-item">
                          <i className="bi bi-medical-bag me-2"></i>
                          <span className="info-label">Service:</span>
                          <span className="info-value">{session.type}</span>
                        </div>
                        <div className="info-item">
                          <i className="bi bi-calendar3 me-2"></i>
                          <span className="info-label">Date:</span>
                          <span className="info-value">{formatShortDate(session.date)}</span>
                        </div>
                      </div>
                      
                      <div className="session-controls">
                        <div className="vital-signs-section">
                          <Button 
                            variant="outline-warning" 
                            size="sm" 
                            className="control-btn"
                            onClick={() => handleVitalSigns(session)}
                          >
                            <i className="bi bi-heart-pulse me-1"></i>
                            Vital Signs
                          </Button>
                        </div>
                        
                        <div className="notes-section">
                          <Form.Group>
                            <Form.Label className="section-label">
                              <i className="bi bi-journal-text me-1"></i>
                              Session Notes
                            </Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={3}
                              placeholder="Enter session notes, observations, or treatment details..."
                              className="session-notes"
                            />
                          </Form.Group>
                        </div>
                        
                        <div className="prescription-section">
                          <Form.Group>
                            <Form.Label className="section-label">
                              <i className="bi bi-prescription2 me-1"></i>
                              Prescriptions
                            </Form.Label>
                            <Form.Select className="prescription-select">
                              <option value="">Add prescription...</option>
                              <option value="paracetamol">Paracetamol 500mg</option>
                              <option value="ibuprofen">Ibuprofen 400mg</option>
                              <option value="amoxicillin">Amoxicillin 500mg</option>
                              <option value="cetirizine">Cetirizine 10mg</option>
                              <option value="omeprazole">Omeprazole 20mg</option>
                              <option value="custom">Custom prescription...</option>
                            </Form.Select>
                          </Form.Group>
                        </div>
                      </div>
                    </Card.Body>
                    
                    <Card.Footer className="session-card-footer">
                      <div className="session-actions">
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          onClick={() => handlePauseSession(session)}
                        >
                          <i className="bi bi-pause-circle me-1"></i>
                          Pause
                        </Button>
                        <Button 
                          variant="success"
                          size="sm"
                          onClick={() => handleCompleteSession(session)}
                        >
                          <i className="bi bi-check-circle me-1"></i>
                          Complete Session
                        </Button>
                      </div>
                    </Card.Footer>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="no-sessions-message">
                <div className="no-sessions-content">
                  <i className="bi bi-clipboard-x"></i>
                  <h4>No Active Sessions</h4>
                  <p>Start a checkup from "My Patient Queue" to begin a session.</p>
                </div>
              </div>
            )}
          </div>
        </Tab>
        
        <Tab eventKey="finished" title={
          <span>
            <i className="bi bi-check-circle me-2"></i>
            Completed Today ({finishedAppointments.length})
          </span>
        }>
          <div className="finished-appointments-container">
            <div className="finished-appointments-header">
              <div className="filter-controls">
                <Form.Select className="time-filter" defaultValue="today">
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">Last 3 Months</option>
                  <option value="semester">Last 6 Months</option>
                  <option value="year">This Year</option>
                  <option value="all">All Time</option>
                </Form.Select>
                <Form.Select className="type-filter" defaultValue="all">
                  <option value="all">All Services</option>
                  <option value="consultation">Consultation</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="dental">Dental</option>
                  <option value="vaccination">Vaccination</option>
                </Form.Select>
              </div>
            </div>
            
            <div className="table-container modern-finished-table">
              <Table hover responsive className="data-table finished-appointments-table">
                <thead>
                  <tr>
                    <th>
                      <i className="bi bi-person me-1"></i>
                      Patient
                    </th>
                    <th>
                      <i className="bi bi-calendar3 me-1"></i>
                      Date
                    </th>
                    <th>
                      <i className="bi bi-clock me-1"></i>
                      Completed
                    </th>
                    <th>
                      <i className="bi bi-medical-bag me-1"></i>
                      Service
                    </th>
                    <th>
                      <i className="bi bi-hourglass me-1"></i>
                      Duration
                    </th>
                    <th>
                      <i className="bi bi-gear me-1"></i>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {finishedAppointments.map(appt => (
                    <tr key={appt.id} className="finished-appointment-row">
                      <td className="patient-cell">
                        <div className="patient-info-finished">
                          <span className="patient-name">{appt.patientName}</span>
                          <small className="patient-id">PT-{String(appt.id).padStart(4, '0')}</small>
                        </div>
                      </td>
                      <td className="date-cell">{formatShortDate(appt.date)}</td>
                      <td className="time-cell">{appt.time}</td>
                      <td className="type-cell">
                        <span className="service-badge">{appt.type}</span>
                      </td>
                      <td className="duration-cell">
                        <span className="duration">~30 min</span>
                      </td>
                      <td className="action-cell">
                        <div className="finished-actions">
                          <Button 
                            variant="outline-info" 
                            size="sm" 
                            className="action-btn"
                            onClick={() => handleViewSessionRecord(appt)}
                          >
                            <i className="bi bi-journal-text me-1"></i>
                            View Record
                          </Button>
                          <Button 
                            variant="outline-secondary" 
                            size="sm" 
                            className="action-btn"
                            onClick={() => handlePrintRecord(appt)}
                          >
                            <i className="bi bi-printer me-1"></i>
                            Print
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {finishedAppointments.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center no-data">
                        <div className="no-data-message">
                          <i className="bi bi-journal-x"></i>
                          <p>No completed appointments found.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </div>
        </Tab>
      </Tabs>
    </>
  );
  
  const renderAppointmentHistory = () => ( // Content similar to Admin's
    <>
      <div className="content-header">
        <h1>
          <i className="bi bi-clock-history me-2 text-info"></i>
          Appointment History
        </h1>
      </div>
      
      <div className="appointment-history-container">
        <div className="history-filters">
          <Form.Select className="history-filter" defaultValue="all">
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">Last 3 Months</option>
            <option value="year">This Year</option>
          </Form.Select>
          <Form.Select className="type-filter" defaultValue="all">
            <option value="all">All Services</option>
            <option value="consultation">Consultation</option>
            <option value="follow-up">Follow-up</option>
            <option value="dental">Dental</option>
            <option value="vaccination">Vaccination</option>
          </Form.Select>
        </div>
        
        <div className="table-container modern-history-table">
          <Table hover responsive className="data-table appointment-history-table">
            <thead>
              <tr>
                <th>
                  <i className="bi bi-person me-1"></i>
                  Patient
                </th>
                <th>
                  <i className="bi bi-calendar3 me-1"></i>
                  Date
                </th>
                <th>
                  <i className="bi bi-clock me-1"></i>
                  Time
                </th>
                <th>
                  <i className="bi bi-medical-bag me-1"></i>
                  Service Type
                </th>
                <th>
                  <i className="bi bi-check-circle me-1"></i>
                  Status
                </th>
                <th>
                  <i className="bi bi-gear me-1"></i>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Sample Row 1 - Replace with dynamic data */}
              <tr className="history-row">
                <td className="patient-cell">
                  <div className="patient-info-history">
                    <span className="patient-name">Elena Rodriguez</span>
                    <small className="patient-id">PT-0101</small>
                  </div>
                </td>
                <td className="date-cell">{formatShortDate('2025-06-01')}</td>
                <td className="time-cell">10:00 AM</td>
                <td className="type-cell">
                  <span className="service-badge consultation">Consultation</span>
                </td>
                <td className="status-cell">
                  <span className="status-badge completed">
                    <i className="bi bi-check-circle me-1"></i>
                    Completed
                  </span>
                </td>
                <td className="action-cell">
                  <div className="history-actions">
                    <Button 
                      variant="outline-info" 
                      size="sm" 
                      className="action-btn"
                      onClick={() => handleViewNotes({
                        id: 1,
                        patientName: 'Elena Rodriguez',
                        date: '2025-06-01',
                        time: '10:00 AM',
                        type: 'Consultation',
                        notes: 'Patient presented with flu-like symptoms including fever (38.5°C), body aches, and fatigue. Physical examination revealed mild throat inflammation. Prescribed Paracetamol 500mg every 6 hours for fever and body aches. Advised increased fluid intake, rest, and follow-up if symptoms persist beyond 5 days. Patient education provided on symptom monitoring and when to seek immediate care.'
                      })}
                    >
                      <i className="bi bi-journal-text me-1"></i>
                      View Notes
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      className="action-btn"
                      onClick={() => handlePrintRecord({
                        patientName: 'Elena Rodriguez',
                        date: '2025-06-01'
                      })}
                    >
                      <i className="bi bi-printer me-1"></i>
                      Print
                    </Button>
                  </div>
                </td>
              </tr>
              
              {/* Sample Row 2 */}
              <tr className="history-row">
                <td className="patient-cell">
                  <div className="patient-info-history">
                    <span className="patient-name">Mark Johnson</span>
                    <small className="patient-id">PT-0089</small>
                  </div>
                </td>
                <td className="date-cell">{formatShortDate('2025-05-28')}</td>
                <td className="time-cell">02:30 PM</td>
                <td className="type-cell">
                  <span className="service-badge follow-up">Follow-up</span>
                </td>
                <td className="status-cell">
                  <span className="status-badge completed">
                    <i className="bi bi-check-circle me-1"></i>
                    Completed
                  </span>
                </td>
                <td className="action-cell">
                  <div className="history-actions">
                    <Button 
                      variant="outline-info" 
                      size="sm" 
                      className="action-btn"
                      onClick={() => handleViewNotes({
                        id: 2,
                        patientName: 'Mark Johnson',
                        date: '2025-05-28',
                        time: '02:30 PM',
                        type: 'Follow-up',
                        notes: 'Follow-up visit for hypertension management. Blood pressure readings: 135/85 mmHg (improved from previous 145/95). Patient reports good adherence to prescribed Amlodipine 5mg daily. Dietary modifications showing positive results - reduced sodium intake and increased physical activity. Continue current medication regimen. Schedule next follow-up in 4 weeks. Encouraged to maintain current lifestyle changes.'
                      })}
                    >
                      <i className="bi bi-journal-text me-1"></i>
                      View Notes
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      className="action-btn"
                      onClick={() => handlePrintRecord({
                        patientName: 'Mark Johnson',
                        date: '2025-05-28'
                      })}
                    >
                      <i className="bi bi-printer me-1"></i>
                      Print
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

  const renderPatientDatabase = () => (
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
                  <th style={{textAlign: 'left'}}>Family ID</th>
                  <th style={{textAlign: 'left'}}>Family Name</th>
                  <th style={{textAlign: 'left'}}>Family Head (Optional)</th>
                  <th style={{textAlign: 'right'}}>Number of Members</th>
                  <th style={{textAlign: 'left'}}>Date Registered</th>
                  <th style={{textAlign: 'center'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFamilies().map((family) => (
                  <tr key={family.id}>
                    <td style={{textAlign: 'left'}}>{family.id}</td>
                    <td style={{textAlign: 'left'}}>{family.familyName}</td>
                    <td style={{textAlign: 'left'}}>{family.contactPerson || 'N/A'}</td>
                    <td style={{textAlign: 'right'}}>{getFamilyMembers(family.id).length}</td>
                    <td style={{textAlign: 'left'}}>{formatShortDate(family.registrationDate)}</td>
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
                  <tr key={patient.id || `patient-${patient.name}`}>
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
                          onClick={() => alert(`Check-in functionality for ${getPatientFullName(patient)} will be available once backend is integrated.`)}
                          disabled={allCheckups.some(checkup => checkup.patientId === patient.id)}
                        >
                          <i className="bi bi-calendar-plus me-1"></i>
                          {allCheckups.some(checkup => checkup.patientId === patient.id) ? 'Checked In' : 'Check In Today'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
  
  const renderSettings = () => (
    <>
      <div className="content-header">
        <h1>Doctor Settings</h1>
        <p>Configure your personal preferences and clinical settings</p>
      </div>
      
      <div className="settings-container">
        <Tabs defaultActiveKey="general" className="mb-4">
          <Tab eventKey="general" title={
            <span><i className="bi bi-gear me-2"></i>General Settings</span>
          }>
            <div className="settings-section">
              <Card className="settings-card">
                <Card.Header>
                  <h4><i className="bi bi-palette me-2"></i>Display & Interface</h4>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label><strong>Dark Mode</strong></Form.Label>
                        <div className="dark-mode-toggle">
                          <Form.Check 
                            type="switch"
                            id="dark-mode-switch"
                            label={isDarkMode ? "Dark Mode Enabled" : "Light Mode"}
                            checked={isDarkMode}
                            onChange={handleDarkModeToggle}
                          />
                        </div>
                        <Form.Text className="text-muted">
                          Switch between light and dark theme for better visibility
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label><strong>Font Size</strong></Form.Label>
                        <Form.Select 
                          value={fontSize} 
                          onChange={(e) => setFontSize(e.target.value)}
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium (Default)</option>
                          <option value="large">Large</option>
                        </Form.Select>
                        <Form.Text className="text-muted">
                          Adjust text size for medical records and notes
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Card className="settings-card">
                <Card.Header>
                  <h4><i className="bi bi-clock me-2"></i>Clinical Preferences</h4>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label><strong>Working Hours</strong></Form.Label>
                        <Row>
                          <Col>
                            <Form.Label>Start Time</Form.Label>
                            <Form.Control 
                              type="time" 
                              value={workingHours.start}
                              onChange={(e) => setWorkingHours({...workingHours, start: e.target.value})}
                            />
                          </Col>
                          <Col>
                            <Form.Label>End Time</Form.Label>
                            <Form.Control 
                              type="time" 
                              value={workingHours.end}
                              onChange={(e) => setWorkingHours({...workingHours, end: e.target.value})}
                            />
                          </Col>
                        </Row>
                        <Form.Text className="text-muted">
                          Set your daily working schedule
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label><strong>Default Appointment Duration</strong></Form.Label>
                        <Form.Select 
                          value={defaultAppointmentDuration} 
                          onChange={(e) => setDefaultAppointmentDuration(parseInt(e.target.value))}
                        >
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={45}>45 minutes</option>
                          <option value={60}>60 minutes</option>
                        </Form.Select>
                        <Form.Text className="text-muted">
                          Default time slot for new appointments
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label><strong>Vital Signs Units</strong></Form.Label>
                        <Form.Select 
                          value={vitalSignsUnit} 
                          onChange={(e) => setVitalSignsUnit(e.target.value)}
                        >
                          <option value="metric">Metric (°C, kg, cm)</option>
                          <option value="imperial">Imperial (°F, lbs, in)</option>
                        </Form.Select>
                        <Form.Text className="text-muted">
                          Choose measurement units for patient vitals
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label><strong>Appointment Reminders</strong></Form.Label>
                        <Form.Select 
                          value={reminderMinutes} 
                          onChange={(e) => setReminderMinutes(parseInt(e.target.value))}
                        >
                          <option value={5}>5 minutes before</option>
                          <option value={10}>10 minutes before</option>
                          <option value={15}>15 minutes before</option>
                          <option value={30}>30 minutes before</option>
                        </Form.Select>
                        <Form.Text className="text-muted">
                          Get notified before upcoming appointments
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Card className="settings-card">
                <Card.Header>
                  <h4><i className="bi bi-file-text me-2"></i>Documentation Settings</h4>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label><strong>Auto-save Consultation Notes</strong></Form.Label>
                        <div>
                          <Form.Check 
                            type="switch"
                            id="auto-save-switch"
                            label={autoSaveNotes ? "Auto-save Enabled" : "Manual Save Only"}
                            checked={autoSaveNotes}
                            onChange={(e) => setAutoSaveNotes(e.target.checked)}
                          />
                        </div>
                        <Form.Text className="text-muted">
                          Automatically save notes every 30 seconds
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <div className="settings-actions">
                <Button variant="primary" size="lg" onClick={() => alert('Settings saved successfully!')}>
                  <i className="bi bi-check-circle me-2"></i>
                  Save Settings
                </Button>
                <Button variant="outline-secondary" size="lg" className="ms-3" onClick={() => alert('Settings reset to default')}>
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Reset to Default
                </Button>
              </div>
            </div>
          </Tab>

          <Tab eventKey="security" title={
            <span><i className="bi bi-shield-lock me-2"></i>Security & Privacy</span>
          }>
            <div className="settings-section">
              <Card className="settings-card">
                <Card.Header>
                  <h4><i className="bi bi-shield-check me-2"></i>Privacy Settings</h4>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Session Timeout</strong></Form.Label>
                    <Form.Select>
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>60 minutes</option>
                      <option value={120}>2 hours</option>
                    </Form.Select>
                    <Form.Text className="text-muted">
                      Automatically log out after period of inactivity
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label><strong>Data Access Logging</strong></Form.Label>
                    <Form.Check 
                      type="switch"
                      id="logging-switch"
                      label="Enable access logging"
                      defaultChecked={true}
                    />
                    <Form.Text className="text-muted">
                      Track all patient data access for security compliance
                    </Form.Text>
                  </Form.Group>
                </Card.Body>
              </Card>
            </div>
          </Tab>

          <Tab eventKey="notifications" title={
            <span><i className="bi bi-bell me-2"></i>Notifications</span>
          }>
            <div className="settings-section">
              <Card className="settings-card">
                <Card.Header>
                  <h4><i className="bi bi-bell-fill me-2"></i>Notification Preferences</h4>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Desktop Notifications</strong></Form.Label>
                    <Form.Check 
                      type="switch"
                      id="desktop-notifications"
                      label="Enable desktop notifications"
                      defaultChecked={true}
                    />
                    <Form.Text className="text-muted">
                      Receive notifications for new appointments and urgent cases
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label><strong>Sound Alerts</strong></Form.Label>
                    <Form.Check 
                      type="switch"
                      id="sound-alerts"
                      label="Enable sound alerts"
                      defaultChecked={false}
                    />
                    <Form.Text className="text-muted">
                      Play sound for appointment reminders and emergencies
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label><strong>Email Digest Frequency</strong></Form.Label>
                    <Form.Select>
                      <option value="daily">Daily Summary</option>
                      <option value="weekly">Weekly Report</option>
                      <option value="monthly">Monthly Overview</option>
                      <option value="none">No Email Digest</option>
                    </Form.Select>
                    <Form.Text className="text-muted">
                      Receive summary emails of your patient activities
                    </Form.Text>
                  </Form.Group>
                </Card.Body>
              </Card>
            </div>
          </Tab>
        </Tabs>
      </div>
    </>
  );

  const renderContent = () => {
    switch(currentPath) {
      case "Doctor's Checkup Today":
        return renderDoctorsCheckupToday();
      case 'Session Management':
        return renderOngoingAndFinishedAppointments();
      case 'Appointment History':
        return renderAppointmentHistory();
      case 'Patient Database':
        return renderPatientDatabase();
      case 'Settings':
        return renderSettings();
      default:
        return renderDoctorsCheckupToday();
    }
  };

  return (
    <div className="doc-dashboard-wrapper"> {/* Ensure this class is used */}
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h3 className="brand">
            <i className="bi bi-hospital"></i>
            <span className="text">Maybunga Healthcare</span>
          </h3>
        </div>
        
        <div className="sidebar-menu">
          <ul>
            <li className={activeDropdown === 'doctorCheckup' ? 'dropdown active' : 'dropdown'}>
              <Link to="#" onClick={() => handleDropdownToggle('doctorCheckup')}>
                <i className="bi bi-clipboard2-pulse"></i>
                <span>Doctor's Checkup</span>
                <i className={`bi ${activeDropdown === 'doctorCheckup' ? 'bi-chevron-down' : 'bi-chevron-right'} dropdown-icon`}></i>
              </Link>
              <ul className={activeDropdown === 'doctorCheckup' ? 'dropdown-menu show' : 'dropdown-menu'}>
                <li onClick={() => handleNavigation("Doctor\'s Checkup Today")}>
                  <Link to="#"><i className="bi bi-calendar-day"></i><span>Checkup Today</span></Link>
                </li>
              </ul>
            </li>
            
            <li className={activeDropdown === 'appointments' ? 'dropdown active' : 'dropdown'}>
              <Link to="#" onClick={() => handleDropdownToggle('appointments')}>
                <i className="bi bi-calendar-check"></i>
                <span>Appointments</span>
                <i className={`bi ${activeDropdown === 'appointments' ? 'bi-chevron-down' : 'bi-chevron-right'} dropdown-icon`}></i>
              </Link>
              <ul className={activeDropdown === 'appointments' ? 'dropdown-menu show' : 'dropdown-menu'}>
                <li onClick={() => handleNavigation("Ongoing & Finished")}>
                  <Link to="#"><i className="bi bi-card-checklist"></i><span>Ongoing & Finished</span></Link>
                </li>
                <li onClick={() => handleNavigation("Appointment History")}>
                  <Link to="#"><i className="bi bi-clock-history"></i><span>Appointment History</span></Link>
                </li>
              </ul>
            </li>

            <li className={activeDropdown === 'patientMgmt' ? 'dropdown active' : 'dropdown'}>
              <Link to="#" onClick={() => handleDropdownToggle('patientMgmt')}>
                <i className="bi bi-people"></i>
                <span>Patient Management</span>
                <i className={`bi ${activeDropdown === 'patientMgmt' ? 'bi-chevron-down' : 'bi-chevron-right'} dropdown-icon`}></i>
              </Link>
              <ul className={activeDropdown === 'patientMgmt' ? 'dropdown-menu show' : 'dropdown-menu'}>
                <li onClick={() => handleNavigation('Patient Database')}>
                  <Link to="#"><i className="bi bi-archive"></i><span>Patient Database</span></Link>
                </li>
              </ul>
            </li>

            <li onClick={() => handleNavigation('Settings')}>
              <Link to="#">
                <i className="bi bi-gear"></i>
                <span>Settings</span>
              </Link>
            </li>
          </ul>
        </div>
        <button className="sidebar-hamburger" onClick={toggleSidebar} aria-label="Toggle sidebar">
          <i className={`bi ${sidebarOpen ? 'bi-x' : 'bi-list'}`}></i>
        </button>
      </div>

      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="topbar">
          <div className="path-info">
            <span>YOU ARE HERE</span> <i className="bi bi-chevron-right"></i> <span>{currentPath}</span>
          </div>
          <div className="user-info">
            <div className="date-time"><span>{formatDate(currentDateTime)}</span></div>
            <div className="user">
              <span className="user-name">
                {user ? `${user.firstName} ${user.lastName}` : 'Doctor User'}
              </span>
              <div className="user-avatar"><i className="bi bi-person-circle"></i></div>
            </div>
            <button className="logout-btn" onClick={handleLogout}><i className="bi bi-box-arrow-right"></i></button>
          </div>
        </div>
        
        {/* Simulation Mode Notification */}
        {simulationModeStatus.enabled && (
          <div className="simulation-notification">
            <div className="simulation-notification-content">
              <div className="simulation-icon">
                <i className="bi bi-cpu"></i>
              </div>
              <div className="simulation-details">
                <div className="simulation-title">
                  <strong>Simulation Mode Active</strong>
                </div>
                <div className="simulation-info">
                  Admin is running simulation mode • 
                  Activated by: {simulationModeStatus.activatedBy || 'Admin'} • 
                  {simulationModeStatus.currentSimulatedDate ? 
                    `Simulated Date: ${new Date(simulationModeStatus.currentSimulatedDate).toLocaleDateString()}` :
                    'Real-time mode'
                  }
                </div>
              </div>
              <div className="simulation-badge">
                <i className="bi bi-exclamation-triangle"></i>
                <span>SIMULATION</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="dashboard-content">{renderContent()}</div>
      </div>

      <Modal show={showLogoutModal} onHide={() => setShowLogoutModal(false)}>
        <Modal.Header closeButton><Modal.Title>Confirm Logout</Modal.Title></Modal.Header>
        <Modal.Body>Are you sure you want to logout?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLogoutModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={confirmLogout}>Yes, Logout</Button>
        </Modal.Footer>
      </Modal>

      {/* Add Patient Modal (copied from AdminDashboard, review if changes needed) */}
      <Modal show={showAddPatientModal} onHide={() => setShowAddPatientModal(false)} size="lg">
        <Modal.Header closeButton><Modal.Title>Add New Patient</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Full Name</Form.Label><Form.Control type="text" placeholder="Enter full name" /></Form.Group></Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date of Birth</Form.Label>
                  <DatePicker 
                    selected={null} 
                    onChange={(date) => {}} 
                    className="form-control"
                    dateFormat="MM/dd/yyyy"
                    maxDate={new Date()}
                    showYearDropdown
                    showMonthDropdown
                    scrollableYearDropdown
                    yearDropdownItemNumber={100}
                    placeholderText="Select date of birth"
                  />
                </Form.Group>
              </Col>
            </Row>
            {/* Add more fields as in AdminDashboard AddPatientModal */}
            <p><em>Placeholder: More fields for patient registration to be added. Backend integration needed.</em></p>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddPatientModal(false)}>Close</Button>
          <Button variant="primary" onClick={() => { alert("Placeholder: Save New Patient"); setShowAddPatientModal(false);}}>Save Patient</Button>
        </Modal.Footer>
      </Modal>

      {/* Patient Details Modal - System-Compliant Design */}
      {selectedPatient && (
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
            <div style={{padding: '24px'}}>
              {/* Header Section with Patient Name */}
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
                
                <div className="d-flex gap-2">
                  <Button 
                    variant="outline-success" 
                    size="sm"
                    style={{borderRadius: '8px', fontWeight: 500}}
                    onClick={() => handleQRCode(selectedPatient)}
                  >
                    <i className="bi bi-qr-code me-1"></i>
                    Generate QR
                  </Button>
                  <Button 
                    variant="outline-warning" 
                    size="sm"
                    style={{borderRadius: '8px', fontWeight: 500}}
                    onClick={() => handleVitalSigns(selectedPatient)}
                  >
                    <i className="bi bi-heart-pulse me-1"></i>
                    Vital Signs
                  </Button>
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
                  Patient details and medical history are now integrated with the backend system.
                </small>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => {
              setShowPatientDetailsModal(false);
              setShowManageDropdown(false);
            }}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Vital Signs Modal (copied from AdminDashboard) */}
      {selectedPatient && (
        <Modal show={showVitalSignsModal} onHide={() => setShowVitalSignsModal(false)} size="lg">
          <Modal.Header closeButton><Modal.Title>Record Vital Signs for {selectedPatient.name}</Modal.Title></Modal.Header>
          <Modal.Body>
          <p><em>Placeholder: Form for vital signs. Backend integration needed.</em></p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowVitalSignsModal(false)}>Close</Button>
            <Button variant="primary" onClick={() => {alert("Placeholder: Save Vitals"); setShowVitalSignsModal(false);}}>Save Vitals</Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* QR Code Modal (copied from AdminDashboard) */}
      {selectedPatient && (
        <Modal show={showQRCodeModal} onHide={() => setShowQRCodeModal(false)} centered>
          <Modal.Header closeButton><Modal.Title>QR Code for {selectedPatient.name}</Modal.Title></Modal.Header>
          <Modal.Body className="text-center">
            <QRCode value={JSON.stringify({ patientId: selectedPatient.id, name: selectedPatient.name })} size={256} level="H" />
            <p className="mt-3">Scan this code to quickly access patient information.</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={() => {alert("Placeholder: Print QR Code"); setShowQRCodeModal(false);}}>Print QR Code</Button>
            <Button variant="secondary" onClick={() => setShowQRCodeModal(false)}>Close</Button>
          </Modal.Footer>
        </Modal>
      )}
      {/* Notes Modal */}
      <Modal 
        show={showNotesModal} 
        onHide={() => setShowNotesModal(false)} 
        size="lg"
        centered
      >
        <Modal.Header closeButton className="notes-modal-header">
          <Modal.Title>
            <i className="bi bi-journal-text me-2 text-info"></i>
            Appointment Notes
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="notes-modal-body">
          {selectedAppointmentNotes && (
            <>
              <div className="appointment-details-header">
                <div className="row">
                  <div className="col-md-6">
                    <div className="detail-item">
                      <strong>
                        <i className="bi bi-person me-1 text-primary"></i>
                        Patient:
                      </strong>
                      <span className="ms-2">{selectedAppointmentNotes.patientName}</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="detail-item">
                      <strong>
                        <i className="bi bi-calendar3 me-1 text-success"></i>
                        Date & Time:
                      </strong>
                      <span className="ms-2">
                        {selectedAppointmentNotes.date} at {selectedAppointmentNotes.time}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="row mt-2">
                  <div className="col-12">
                    <div className="detail-item">
                      <strong>
                        <i className="bi bi-medical-bag me-1 text-warning"></i>
                        Service Type:
                      </strong>
                      <span className={`service-badge ms-2 ${selectedAppointmentNotes.type.toLowerCase()}`}>
                        {selectedAppointmentNotes.type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <hr className="my-3" />
              
              <div className="notes-content">
                <h6 className="notes-title">
                  <i className="bi bi-card-text me-2 text-info"></i>
                  Clinical Notes
                </h6>
                <div className="notes-text">
                  {selectedAppointmentNotes.notes}
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="notes-modal-footer">
          <Button 
            variant="outline-secondary" 
            onClick={() => setShowNotesModal(false)}
          >
            <i className="bi bi-x-circle me-1"></i>
            Close
          </Button>
          <Button 
            variant="primary"
            onClick={() => handlePrintRecord({
              patientName: selectedAppointmentNotes?.patientName,
              date: selectedAppointmentNotes?.date
            })}
          >
            <i className="bi bi-printer me-1"></i>
            Print Record
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Family Members Modal */}
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
                  {getFamilyMembers(selectedFamily.id).map((member) => (
                    <tr key={member.id}>
                      <td style={{textAlign: 'left'}}>PT-{String(member.id).padStart(4, '0')}</td>
                      <td style={{textAlign: 'left'}}>{member.name}</td>
                      <td style={{textAlign: 'right'}}>{member.age}</td>
                      <td style={{textAlign: 'left'}}>{member.gender}</td>
                      <td style={{textAlign: 'left'}}>{member.contact}</td>
                      <td style={{textAlign: 'left'}}>{formatShortDate(member.lastCheckup)}</td>
                      <td style={{textAlign: 'center'}} className="action-cell">
                        <Button variant="outline-primary" size="sm" onClick={() => handleViewPatient(member)}>
                          View Details
                        </Button>
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

      {/* Add New Consultation Modal */}
      <Modal show={showAddConsultationModal} onHide={() => setShowAddConsultationModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-plus-circle me-2 text-success"></i>
            Add New Consultation
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {/* Patient Type Selection */}
            <Row className="mb-3">
              <Col>
                <Form.Label className="fw-bold">Patient Type</Form.Label>
                <div className="d-flex gap-3">
                  <Form.Check
                    type="radio"
                    id="existing-patient"
                    name="patientType"
                    label="Existing Patient"
                    checked={consultationPatientType === 'existing'}
                    onChange={() => setConsultationPatientType('existing')}
                  />
                  <Form.Check
                    type="radio"
                    id="new-patient"
                    name="patientType"
                    label="New Patient (Urgent)"
                    checked={consultationPatientType === 'new'}
                    onChange={() => setConsultationPatientType('new')}
                  />
                </div>
              </Col>
            </Row>

            {/* Existing Patient Search */}
            {consultationPatientType === 'existing' && (
              <Row className="mb-3">
                <Col>
                  <Form.Label>Search Patient</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <i className="bi bi-search"></i>
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search by Last Name, First Name..."
                      value={consultationSearchTerm}
                      onChange={handleConsultationSearchChange}
                    />
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Type patient name to search existing patients
                  </Form.Text>
                  
                  {/* Search Results */}
                  {consultationSearchTerm && !selectedPatientForConsultation && (
                    <div className="mt-2" style={{maxHeight: '200px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '4px'}}>
                      {filteredConsultationPatients().length > 0 ? (
                        filteredConsultationPatients().map((patient) => (
                          <div 
                            key={patient.id} 
                            className="p-2 border-bottom" 
                            style={{cursor: 'pointer', backgroundColor: '#fff'}}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
                            onClick={() => handleConsultationPatientSelect(patient)}
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <strong>{patient.name}</strong>
                                <div className="text-muted small">ID: PT-{String(patient.id).padStart(4, '0')}</div>
                              </div>
                              <div className="text-muted small">
                                Age: {patient.age}, {patient.gender}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-muted">
                          No patients found matching "{consultationSearchTerm}"
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Selected Patient Display */}
                  {selectedPatientForConsultation && (
                    <div className="mt-2 p-3 bg-light border rounded">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>Selected: {selectedPatientForConsultation.name}</strong>
                          <div className="text-muted small">
                            ID: PT-{String(selectedPatientForConsultation.id).padStart(4, '0')} | 
                            Age: {selectedPatientForConsultation.age} | 
                            {selectedPatientForConsultation.gender}
                          </div>
                        </div>
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          onClick={() => {
                            setSelectedPatientForConsultation(null);
                            setConsultationSearchTerm('');
                          }}
                        >
                          Change
                        </Button>
                      </div>
                    </div>
                  )}
                </Col>
              </Row>
            )}

            {/* New Patient Information */}
            {consultationPatientType === 'new' && (
              <>
                <Row className="mb-3">
                  <Col md={4}>
                    <Form.Label>Last Name *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter last name"
                      value={consultationForm.lastName}
                      onChange={(e) => setConsultationForm({...consultationForm, lastName: e.target.value})}
                      required
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Label>First Name *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter first name"
                      value={consultationForm.firstName}
                      onChange={(e) => setConsultationForm({...consultationForm, firstName: e.target.value})}
                      required
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Label>Middle Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter middle name"
                      value={consultationForm.middleName}
                      onChange={(e) => setConsultationForm({...consultationForm, middleName: e.target.value})}
                    />
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Label>Temporary Patient ID</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Auto-generated: TEMP-001"
                      value={consultationForm.patientId || `TEMP-${String(Date.now()).slice(-3)}`}
                      disabled
                    />
                  </Col>
                </Row>
              </>
            )}

            {/* Consultation Details */}
            <Row className="mb-3">
              <Col md={6}>
                <Form.Label>Consultation Type *</Form.Label>
                <Form.Select
                  value={consultationForm.consultationType}
                  onChange={(e) => setConsultationForm({...consultationForm, consultationType: e.target.value})}
                >
                  <option value="Check-up">Check-up</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Consultation">Consultation</option>
                  <option value="Vaccination">Vaccination</option>
                  <option value="Laboratory">Laboratory</option>
                </Form.Select>
              </Col>
              <Col md={6}>
                <Form.Label>Priority Level</Form.Label>
                <Form.Select
                  value={consultationForm.priority}
                  onChange={(e) => setConsultationForm({...consultationForm, priority: e.target.value})}
                >
                  <option value="Normal">Normal</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Emergency">Emergency</option>
                </Form.Select>
              </Col>
            </Row>

            {/* Notes */}
            <Row className="mb-3">
              <Col>
                <Form.Label>Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Enter consultation notes or reason..."
                  value={consultationForm.notes}
                  onChange={(e) => setConsultationForm({...consultationForm, notes: e.target.value})}
                />
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={resetConsultationModal}>
            Cancel
          </Button>
          <Button 
            variant="success" 
            onClick={() => {
              // TODO: Implement add consultation logic
              const patientInfo = consultationPatientType === 'existing' 
                ? selectedPatientForConsultation 
                : {
                    name: `${consultationForm.lastName}, ${consultationForm.firstName}${consultationForm.middleName ? ' ' + consultationForm.middleName : ''}`,
                    id: consultationForm.patientId || `TEMP-${String(Date.now()).slice(-3)}`,
                    isTemporary: true
                  };
              
              console.log('Adding consultation:', {
                patient: patientInfo,
                type: consultationForm.consultationType,
                priority: consultationForm.priority,
                notes: consultationForm.notes
              });
              
              alert('Consultation will be added to queue!');
              resetConsultationModal();
            }}
            disabled={
              consultationPatientType === 'existing' 
                ? !selectedPatientForConsultation 
                : !consultationForm.firstName || !consultationForm.lastName
            }
          >
            <i className="bi bi-check-circle me-1"></i>
            Add to Queue
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DocDashboard;
