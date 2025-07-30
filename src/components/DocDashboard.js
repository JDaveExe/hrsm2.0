import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Modal, Button, Form, InputGroup, Row, Col, Table, Card, Tabs, Tab } from 'react-bootstrap';
import { QRCodeCanvas as QRCode } from 'qrcode.react';
import { patientService, familyService } from '../services/adminService';
import '../styles/DocDashboard.css'; // Use DocDashboard.css
import 'bootstrap-icons/font/bootstrap-icons.css';

const DocDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [currentPath, setCurrentPath] = useState("Doctor\'s Checkup Today"); // Default path for doctor
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
  const [patients, setPatients] = useState([]);
  const [families, setFamilies] = useState([]);
  
  const [todaysCheckups, setTodaysCheckups] = useState([ // Sample data for doctor's checkups
    { id: 201, patientId: 'PT-0023', name: 'Maria Santos', time: '09:30 AM', type: 'Follow-up', status: 'Waiting'},
    { id: 202, patientId: 'PT-0034', name: 'Carlos Mendoza', time: '10:15 AM', type: 'Check-up', status: 'In Progress'},
  ]);

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

  // Fetch initial data on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const patientData = await patientService.getUnsortedPatients();
        const familyData = await familyService.getAllFamilies();
        
        // Combine with some mock data for demo
        const allPatients = [
          ...patientData,
          { id: 1, familyId: 'SANTOS-001', name: 'Maria Santos', age: 35, gender: 'Female', address: '123 Maybunga St, Pasig City', contact: '09123456789', lastCheckup: '2023-05-15', status: 'Active' },
          { id: 2, familyId: 'SANTOS-001', name: 'Juan Santos', age: 38, gender: 'Male', address: '123 Maybunga St, Pasig City', contact: '09123456790', lastCheckup: '2023-04-22', status: 'Active' },
          { id: 3, familyId: 'REYES-002', name: 'Ana Reyes', age: 42, gender: 'Female', address: '45 E. Rodriguez Ave, Pasig City', contact: '09187654321', lastCheckup: '2023-05-20', status: 'Active' },
        ];

        setPatients(allPatients);
        setFamilies(familyData);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        // Fallback to mock data
        setPatients([
          { id: 1, familyId: 'SANTOS-001', name: 'Maria Santos', age: 35, gender: 'Female', address: '123 Maybunga St, Pasig City', contact: '09123456789', lastCheckup: '2023-05-15', status: 'Active' },
          { id: 2, familyId: 'SANTOS-001', name: 'Juan Santos', age: 38, gender: 'Male', address: '123 Maybunga St, Pasig City', contact: '09123456790', lastCheckup: '2023-04-22', status: 'Active' },
        ]);
        setFamilies([
          { id: 'SANTOS-001', familyName: 'Santos Family', address: '123 Maybunga St, Pasig City', contactPerson: 'Juan Santos', contact: '09123456790', memberCount: 2, registrationDate: '2023-01-15' },
        ]);
      }
    };

    fetchInitialData();
  }, []);

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
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr; // Return original if invalid
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handlePatientSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredPatients = () => {
    if (!searchTerm) return patients;
    const term = searchTerm.toLowerCase();
    return patients.filter(patient =>
      patient.name.toLowerCase().includes(term) ||
      (patient.familyId && patient.familyId.toLowerCase().includes(term))
    );
  };

  const filteredFamilies = () => {
    if (!searchTerm) return families;
    const term = searchTerm.toLowerCase();
    return families.filter(family =>
      family.familyName.toLowerCase().includes(term) ||
      family.id.toLowerCase().includes(term)
    );
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
    return patients.filter(patient => patient.familyId === familyId);
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

  const handleStartSession = (checkup) => {
    // In a real application, this would start a session and navigate to the session view
    alert(`Starting session for ${checkup.name}. Session management will be implemented in Phase 2.`);
    // Update the checkup status to 'In Progress'
    setTodaysCheckups(prev => 
      prev.map(c => c.id === checkup.id ? { ...c, status: 'In Progress' } : c)
    );
  };

  const handleContinueSession = (checkup) => {
    // In a real application, this would continue an existing session
    alert(`Continuing session for ${checkup.name}. Opening session workspace...`);
    // Navigate to session management interface
  };

  const handlePauseSession = (session) => {
    alert(`Pausing session for ${session.patientName}. Session can be resumed later.`);
    // In a real application, this would pause the session and save current state
  };

  const handleCompleteSession = (session) => {
    const confirmed = window.confirm(`Complete session for ${session.patientName}? This action cannot be undone.`);
    if (confirmed) {
      // Move from ongoing to finished
      setFinishedAppointments(prev => [
        ...prev,
        { ...session, status: 'Finished', completedTime: new Date().toLocaleTimeString() }
      ]);
      setOngoingAppointments(prev => prev.filter(s => s.id !== session.id));
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
  
  const handleRefreshData = () => {
    alert('Placeholder: Refreshing data from backend...');
    // Placeholder: Simulating refreshing data
    console.log("Backend call placeholder: Refreshing today's checkups...");
    // e.g., fetchTodaysCheckupsAPI().then(data => setTodaysCheckups(data)).catch(err => console.error("Error refreshing today's checkups:", err));
    
    console.log("Backend call placeholder: Refreshing appointments...");
    // e.g., fetchAppointmentsAPI().then(data => { 
    //   setOngoingAppointments(data.ongoing);
    //   setFinishedAppointments(data.finished);
    //   // setAppointmentHistory(data.history);
    // }).catch(err => console.error("Error refreshing appointments:", err));

    console.log("Backend call placeholder: Refreshing patient database...");
    // e.g., fetchPatientsAPI().then(data => setPatients(data)).catch(err => console.error("Error refreshing patients:", err));
    // e.g., fetchFamiliesAPI().then(data => setFamilies(data)).catch(err => console.error("Error refreshing families:", err));
    
    console.log("Backend call placeholder: Data refresh complete (simulated).");
  };

  // Content Rendering Functions
  const renderDoctorsCheckupToday = () => (
    <>
      <div className="content-header">
        <h1>
          <i className="bi bi-calendar-check me-2 text-primary"></i>
          Today's Checkups
        </h1>
        <button className="refresh-btn" onClick={handleRefreshData}>
          <i className="bi bi-arrow-clockwise"></i> Refresh Data
        </button>
      </div>
      <div className="patient-management">
        <div className="management-header">
          <h2 className="management-title">
            Patients Ready for Checkup - {formatShortDate(currentDateTime)}
          </h2>
          <div className="management-actions">
            <div className="search-box">
              <i className="bi bi-search search-icon"></i>
              <input 
                type="text" 
                placeholder="Search patient..." 
                className="search-input" 
                value={searchTerm} 
                onChange={handlePatientSearch} 
              />
            </div>
            <div className="status-indicators">
              <span className="status-badge waiting">
                <i className="bi bi-hourglass-split me-1"></i>
                {todaysCheckups.filter(c => c.status === 'Waiting').length} Waiting
              </span>
              <span className="status-badge in-progress">
                <i className="bi bi-activity me-1"></i>
                {todaysCheckups.filter(c => c.status === 'In Progress').length} In Progress
              </span>
            </div>
          </div>
        </div>
        
        <div className="table-container">
          <Table hover responsive className="data-table modern-checkup-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Patient ID</th>
                <th>Patient Name</th>
                <th>Time</th>
                <th>Service Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {todaysCheckups.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map((checkup, index) => (
                <tr key={checkup.id} className={`checkup-row ${checkup.status.toLowerCase().replace(' ', '-')}`}>
                  <td className="row-number">{index + 1}</td>
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
                    <div className="doctor-action-buttons">
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="action-btn view-btn" 
                        onClick={() => handleViewPatient(patients.find(p => p.name === checkup.name) || checkup)}
                      >
                        <i className="bi bi-person-lines-fill me-1"></i>
                        Patient Info
                      </Button>
                      <Button 
                        variant="outline-warning" 
                        size="sm" 
                        className="action-btn vitals-btn" 
                        onClick={() => handleVitalSigns(patients.find(p => p.name === checkup.name) || checkup)}
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
              {todaysCheckups.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
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
        <button className="refresh-btn" onClick={handleRefreshData}>
          <i className="bi bi-arrow-clockwise"></i> Refresh Data
        </button>
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
                  <p>Start a checkup from "Today's Checkups" to begin a session.</p>
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
        <button className="refresh-btn" onClick={handleRefreshData}>
          <i className="bi bi-arrow-clockwise"></i> Refresh Data
        </button>
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
                  <th style={{textAlign: 'left'}}>Patient ID</th>
                  <th style={{textAlign: 'left'}}>Family ID</th>
                  <th style={{textAlign: 'left'}}>Name</th>
                  <th style={{textAlign: 'right'}}>Age</th>
                  <th style={{textAlign: 'left'}}>Gender</th>
                  <th style={{textAlign: 'left'}}>Contact Number</th>
                  <th style={{textAlign: 'left'}}>Last Checkup</th>
                  <th style={{textAlign: 'center'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients().map((patient) => (
                  <tr key={patient.id}>
                    <td style={{textAlign: 'left'}}>PT-{String(patient.id).padStart(4, '0')}</td>
                    <td style={{textAlign: 'left'}}>{patient.familyId || 'N/A'}</td>
                    <td style={{textAlign: 'left'}}>{patient.name}</td>
                    <td style={{textAlign: 'right'}}>{patient.age}</td>
                    <td style={{textAlign: 'left'}}>{patient.gender}</td>
                    <td style={{textAlign: 'left'}}>{patient.contact}</td>
                    <td style={{textAlign: 'left'}}>{formatShortDate(patient.lastCheckup)}</td>
                    <td style={{textAlign: 'center'}} className="action-cell">
                      <Button variant="outline-primary" size="sm" onClick={() => handleViewPatient(patient)}>View Information</Button>
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
              <span className="user-name">Doctor User</span> {/* Changed user name */}
              <div className="user-avatar"><i className="bi bi-person-circle"></i></div>
            </div>
            <button className="logout-btn" onClick={handleLogout}><i className="bi bi-box-arrow-right"></i></button>
          </div>
        </div>
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
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Date of Birth</Form.Label><Form.Control type="date" /></Form.Group></Col>
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
                    {selectedPatient.name || 'Maria Santos'}
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
              <div className="row g-3 mb-4">
                {/* Personal Information Card */}
                <div className="col-md-6">
                  <div style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '12px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      background: 'var(--accent-primary)',
                      color: 'white',
                      padding: '12px 16px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <i className="bi bi-person-circle"></i>
                      Personal Information
                    </div>
                    <div style={{padding: '16px'}}>
                      <div className="row g-2">
                        <div className="col-4">
                          <small style={{color: 'var(--text-secondary)', fontWeight: 500}}>Age</small>
                          <div style={{color: 'var(--text-primary)', fontWeight: 500}}>
                            {selectedPatient.age || '35'}
                          </div>
                        </div>
                        <div className="col-4">
                          <small style={{color: 'var(--text-secondary)', fontWeight: 500}}>Gender</small>
                          <div style={{color: 'var(--text-primary)', fontWeight: 500}}>
                            {selectedPatient.gender || 'Female'}
                          </div>
                        </div>
                        <div className="col-4">
                          <small style={{color: 'var(--text-secondary)', fontWeight: 500}}>Last Checkup</small>
                          <div style={{color: 'var(--text-primary)', fontWeight: 500}}>
                            {formatShortDate(selectedPatient.lastCheckup) || 'May 15, 2023'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information Card */}
                <div className="col-md-6">
                  <div style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '12px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      background: 'var(--success)',
                      color: 'white',
                      padding: '12px 16px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <i className="bi bi-telephone"></i>
                      Contact Information
                    </div>
                    <div style={{padding: '16px'}}>
                      <div className="mb-2">
                        <small style={{color: 'var(--text-secondary)', fontWeight: 500}}>Phone</small>
                        <div style={{color: 'var(--text-primary)', fontWeight: 500}}>
                          {selectedPatient.contact || '09123456789'}
                        </div>
                      </div>
                      <div className="mb-2">
                        <small style={{color: 'var(--text-secondary)', fontWeight: 500}}>Family ID</small>
                        <div style={{color: 'var(--accent-primary)', fontWeight: 500}}>
                          {selectedPatient.familyId || 'FAM-001'}
                        </div>
                      </div>
                      <div>
                        <small style={{color: 'var(--text-secondary)', fontWeight: 500}}>Address</small>
                        <div style={{color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.9rem'}}>
                          {selectedPatient.address || '15 San Guillermo Street, Palatiw, Pasig, Metro Manila'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center mt-3">
                <small style={{color: 'var(--text-secondary)', fontStyle: 'italic'}}>
                  More patient details and medical history will be available once backend is integrated.
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
    </div>
  );
};

export default DocDashboard;
