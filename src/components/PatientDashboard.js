import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Modal, Button, Form, InputGroup, Row, Col, Table, Card, Tabs, Tab, Accordion } from 'react-bootstrap';
import { QRCodeCanvas as QRCode } from 'qrcode.react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/PatientDashboard.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [currentPath, setCurrentPath] = useState('Profile');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('patient-dashboard-dark-mode');
    return saved ? JSON.parse(saved) : false;
  });
  
  // Settings states
  const [fontSize, setFontSize] = useState('medium');
  const [notifications, setNotifications] = useState({
    appointments: true,
    prescriptions: true,
    results: true
  });
  
  // Sample patient data - to be replaced with backend data
  const [patientProfile, setPatientProfile] = useState({
    id: 'PT-0123',
    name: 'Maria Santos',
    age: 35,
    gender: 'Female',
    birthDate: '1988-03-15',
    address: '123 Maybunga St, Pasig City',
    contact: '09123456789',
    email: 'maria.santos@email.com',
    bloodType: 'A+',
    emergencyContact: 'Juan Santos - 09123456790'
  });

  const [treatmentRecords, setTreatmentRecords] = useState([
    { id: 1, date: '2023-05-15', doctor: 'Dr. Smith', diagnosis: 'Hypertension', treatment: 'Medication prescribed', notes: 'Follow up in 2 weeks' },
    { id: 2, date: '2023-04-20', doctor: 'Dr. Johnson', diagnosis: 'Common Cold', treatment: 'Rest and fluids', notes: 'Recovered well' }
  ]);

  const [dentalRecords, setDentalRecords] = useState([
    { id: 1, date: '2023-03-10', dentist: 'Dr. Brown', procedure: 'Teeth Cleaning', notes: 'Good oral hygiene' },
    { id: 2, date: '2023-01-20', dentist: 'Dr. Brown', procedure: 'Filling', notes: 'Cavity filled on upper molar' }
  ]);

  const [immunizationRecords, setImmunizationRecords] = useState([
    { id: 1, date: '2023-01-15', vaccine: 'COVID-19 Booster', lot: 'ABC123', provider: 'City Health Center' },
    { id: 2, date: '2022-06-10', vaccine: 'Influenza', lot: 'DEF456', provider: 'Maybunga Health Center' }
  ]);

  const [activePrescriptions, setActivePrescriptions] = useState([
    { id: 1, medication: 'Lisinopril 10mg', dosage: 'Once daily', prescribedBy: 'Dr. Smith', dateIssued: '2023-05-15', instructions: 'Take with food' },
    { id: 2, medication: 'Metformin 500mg', dosage: 'Twice daily', prescribedBy: 'Dr. Smith', dateIssued: '2023-05-15', instructions: 'Take before meals' }
  ]);

  const [prescriptionHistory, setPrescriptionHistory] = useState([
    { id: 3, medication: 'Amoxicillin 250mg', dosage: 'Three times daily', prescribedBy: 'Dr. Johnson', dateIssued: '2023-04-20', dateCompleted: '2023-04-27', status: 'Completed' },
    { id: 4, medication: 'Ibuprofen 400mg', dosage: 'As needed for pain', prescribedBy: 'Dr. Johnson', dateIssued: '2023-04-20', dateCompleted: '2023-04-25', status: 'Completed' }
  ]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Dark mode effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('patient-dashboard-dark-mode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const handleDarkModeToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    if (sidebarOpen) {
      setActiveDropdown(null);
    }
  };

  const handleDropdownToggle = (dropdown) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const handleNavigation = (path) => {
    setCurrentPath(path);
  };

  const handleLogout = () => setShowLogoutModal(true);
  
  const confirmLogout = () => {
    setShowLogoutModal(false);
    navigate('/');
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
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Content rendering functions
  const renderProfile = () => (
    <>
      <div className="content-header">
        <h1>Patient Profile</h1>
      </div>
      <div className="patient-profile-container">
        <Card className="profile-card">
          <Card.Header>
            <h3>Personal Information</h3>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <div className="profile-info">
                  <strong>Patient ID:</strong> {patientProfile.id}
                </div>
                <div className="profile-info">
                  <strong>Full Name:</strong> {patientProfile.name}
                </div>
                <div className="profile-info">
                  <strong>Age:</strong> {patientProfile.age}
                </div>
                <div className="profile-info">
                  <strong>Gender:</strong> {patientProfile.gender}
                </div>
              </Col>
              <Col md={6}>
                <div className="profile-info">
                  <strong>Birth Date:</strong> {formatShortDate(patientProfile.birthDate)}
                </div>
                <div className="profile-info">
                  <strong>Blood Type:</strong> {patientProfile.bloodType}
                </div>
                <div className="profile-info">
                  <strong>Contact:</strong> {patientProfile.contact}
                </div>
                <div className="profile-info">
                  <strong>Email:</strong> {patientProfile.email}
                </div>
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={12}>
                <div className="profile-info">
                  <strong>Address:</strong> {patientProfile.address}
                </div>
                <div className="profile-info">
                  <strong>Emergency Contact:</strong> {patientProfile.emergencyContact}
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </div>
    </>
  );

  const renderTreatmentRecord = () => (
    <>
      <div className="content-header">
        <h1>Treatment Records</h1>
      </div>
      <div className="table-container">
        <Table hover responsive className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Doctor</th>
              <th>Diagnosis</th>
              <th>Treatment</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {treatmentRecords.map((record) => (
              <tr key={record.id}>
                <td>{formatShortDate(record.date)}</td>
                <td>{record.doctor}</td>
                <td>{record.diagnosis}</td>
                <td>{record.treatment}</td>
                <td>{record.notes}</td>
              </tr>
            ))}
            {treatmentRecords.length === 0 && (
              <tr><td colSpan="5" className="text-center">No treatment records found.</td></tr>
            )}
          </tbody>
        </Table>
      </div>
    </>
  );

  const renderDentalRecord = () => (
    <>
      <div className="content-header">
        <h1>Dental Records</h1>
      </div>
      <div className="table-container">
        <Table hover responsive className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Dentist</th>
              <th>Procedure</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {dentalRecords.map((record) => (
              <tr key={record.id}>
                <td>{formatShortDate(record.date)}</td>
                <td>{record.dentist}</td>
                <td>{record.procedure}</td>
                <td>{record.notes}</td>
              </tr>
            ))}
            {dentalRecords.length === 0 && (
              <tr><td colSpan="4" className="text-center">No dental records found.</td></tr>
            )}
          </tbody>
        </Table>
      </div>
    </>
  );

  const renderImmunizationRecord = () => (
    <>
      <div className="content-header">
        <h1>Immunization Records</h1>
      </div>
      <div className="table-container">
        <Table hover responsive className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Vaccine</th>
              <th>Lot Number</th>
              <th>Provider</th>
            </tr>
          </thead>
          <tbody>
            {immunizationRecords.map((record) => (
              <tr key={record.id}>
                <td>{formatShortDate(record.date)}</td>
                <td>{record.vaccine}</td>
                <td>{record.lot}</td>
                <td>{record.provider}</td>
              </tr>
            ))}
            {immunizationRecords.length === 0 && (
              <tr><td colSpan="4" className="text-center">No immunization records found.</td></tr>
            )}
          </tbody>
        </Table>
      </div>
    </>
  );

  const renderActivePrescriptions = () => (
    <>
      <div className="content-header">
        <h1>Active Prescriptions</h1>
      </div>
      <div className="table-container">
        <Table hover responsive className="data-table">
          <thead>
            <tr>
              <th>Medication</th>
              <th>Dosage</th>
              <th>Prescribed By</th>
              <th>Date Issued</th>
              <th>Instructions</th>
            </tr>
          </thead>
          <tbody>
            {activePrescriptions.map((prescription) => (
              <tr key={prescription.id}>
                <td><strong>{prescription.medication}</strong></td>
                <td>{prescription.dosage}</td>
                <td>{prescription.prescribedBy}</td>
                <td>{formatShortDate(prescription.dateIssued)}</td>
                <td>{prescription.instructions}</td>
              </tr>
            ))}
            {activePrescriptions.length === 0 && (
              <tr><td colSpan="5" className="text-center">No active prescriptions.</td></tr>
            )}
          </tbody>
        </Table>
      </div>
    </>
  );

  const renderPrescriptionHistory = () => (
    <>
      <div className="content-header">
        <h1>Prescription History</h1>
      </div>
      <div className="table-container">
        <Table hover responsive className="data-table">
          <thead>
            <tr>
              <th>Medication</th>
              <th>Dosage</th>
              <th>Prescribed By</th>
              <th>Date Issued</th>
              <th>Date Completed</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {prescriptionHistory.map((prescription) => (
              <tr key={prescription.id}>
                <td>{prescription.medication}</td>
                <td>{prescription.dosage}</td>
                <td>{prescription.prescribedBy}</td>
                <td>{formatShortDate(prescription.dateIssued)}</td>
                <td>{formatShortDate(prescription.dateCompleted)}</td>
                <td><span className={`status-${prescription.status.toLowerCase()}`}>{prescription.status}</span></td>
              </tr>
            ))}
            {prescriptionHistory.length === 0 && (
              <tr><td colSpan="6" className="text-center">No prescription history found.</td></tr>
            )}
          </tbody>
        </Table>
      </div>
    </>
  );

  const renderSettings = () => (
    <>
      <div className="content-header">
        <h1>Patient Settings</h1>
        <p>Configure your personal preferences and privacy settings</p>
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
                            id="patient-dark-mode-switch"
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
                          Adjust text size for medical information
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Card className="settings-card">
                <Card.Header>
                  <h4><i className="bi bi-person me-2"></i>Personal Information</h4>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label><strong>Full Name</strong></Form.Label>
                        <Form.Control 
                          type="text" 
                          value={patientProfile.name} 
                          onChange={(e) => setPatientProfile({...patientProfile, name: e.target.value})}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label><strong>Contact Number</strong></Form.Label>
                        <Form.Control 
                          type="tel" 
                          value={patientProfile.contact} 
                          onChange={(e) => setPatientProfile({...patientProfile, contact: e.target.value})}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label><strong>Email Address</strong></Form.Label>
                        <Form.Control 
                          type="email" 
                          value={patientProfile.email} 
                          onChange={(e) => setPatientProfile({...patientProfile, email: e.target.value})}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label><strong>Address</strong></Form.Label>
                        <Form.Control 
                          as="textarea" 
                          rows={2}
                          value={patientProfile.address} 
                          onChange={(e) => setPatientProfile({...patientProfile, address: e.target.value})}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </div>
          </Tab>

          <Tab eventKey="privacy" title={
            <span><i className="bi bi-shield-lock me-2"></i>Privacy & Security</span>
          }>
            <div className="settings-section">
              <Card className="settings-card">
                <Card.Header>
                  <h4><i className="bi bi-key me-2"></i>Account Security</h4>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label><strong>Change Password</strong></Form.Label>
                        <Button variant="outline-primary" className="d-block">
                          <i className="bi bi-lock me-2"></i>Update Password
                        </Button>
                        <Form.Text className="text-muted">
                          Use a strong password with at least 8 characters
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label><strong>Data Privacy</strong></Form.Label>
                        <div className="privacy-options">
                          <Form.Check 
                            type="checkbox"
                            id="data-sharing-consent"
                            label="Allow data sharing for research purposes"
                            className="mb-2"
                          />
                          <Form.Check 
                            type="checkbox"
                            id="marketing-consent"
                            label="Receive health and wellness updates"
                            className="mb-2"
                          />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Card className="settings-card">
                <Card.Header>
                  <h4><i className="bi bi-eye me-2"></i>Data Access</h4>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={12}>
                      <p>Control who can access your medical information</p>
                      <Button variant="outline-info" className="me-2">
                        <i className="bi bi-download me-2"></i>Download My Data
                      </Button>
                      <Button variant="outline-warning">
                        <i className="bi bi-people me-2"></i>Manage Access
                      </Button>
                    </Col>
                  </Row>
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
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label><strong>Appointment Reminders</strong></Form.Label>
                        <Form.Check 
                          type="switch"
                          id="appointment-notifications"
                          label="Receive appointment reminders"
                          checked={notifications.appointments}
                          onChange={(e) => setNotifications({...notifications, appointments: e.target.checked})}
                        />
                        <Form.Text className="text-muted">
                          Get notified 24 hours before appointments
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label><strong>Prescription Reminders</strong></Form.Label>
                        <Form.Check 
                          type="switch"
                          id="prescription-notifications"
                          label="Receive prescription alerts"
                          checked={notifications.prescriptions}
                          onChange={(e) => setNotifications({...notifications, prescriptions: e.target.checked})}
                        />
                        <Form.Text className="text-muted">
                          Get notified about prescription refills
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label><strong>Test Results</strong></Form.Label>
                        <Form.Check 
                          type="switch"
                          id="results-notifications"
                          label="Receive test result notifications"
                          checked={notifications.results}
                          onChange={(e) => setNotifications({...notifications, results: e.target.checked})}
                        />
                        <Form.Text className="text-muted">
                          Get notified when lab results are available
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label><strong>Communication Method</strong></Form.Label>
                        <Form.Select>
                          <option value="email">Email</option>
                          <option value="sms">SMS</option>
                          <option value="both">Email + SMS</option>
                        </Form.Select>
                        <Form.Text className="text-muted">
                          Choose how you want to receive notifications
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </div>
          </Tab>
        </Tabs>

        <div className="settings-actions">
          <Button variant="primary" className="me-3">
            <i className="bi bi-check-circle me-2"></i>Save Changes
          </Button>
          <Button variant="outline-secondary">
            <i className="bi bi-arrow-clockwise me-2"></i>Reset to Defaults
          </Button>
        </div>
      </div>
    </>
  );

  const renderContent = () => {
    switch(currentPath) {
      case 'Profile': return renderProfile();
      case 'Treatment Record': return renderTreatmentRecord();
      case 'Dental Record': return renderDentalRecord();
      case 'Immunization Record': return renderImmunizationRecord();
      case 'Active Prescriptions': return renderActivePrescriptions();
      case 'Prescriptions History': return renderPrescriptionHistory();
      case 'Settings': return renderSettings();
      default: return renderProfile();
    }
  };

  return (
    <div className="patient-dashboard-wrapper">
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}> 
        <div className="sidebar-header">
          <h3 className="brand">
            <i className="bi bi-hospital"></i>
            <span className="text">Maybunga Healthcare</span>
          </h3>
        </div>
        <div className="sidebar-menu">
          <ul>
            <li className={currentPath === 'Profile' ? 'active' : ''} onClick={() => handleNavigation('Profile')}>
              <Link to="#">
                <i className="bi bi-person-circle"></i>
                <span>Profile</span>
              </Link>
            </li>
            
            <li className={activeDropdown === 'medicalRecords' ? 'dropdown active' : 'dropdown'}>
              <Link to="#" onClick={() => handleDropdownToggle('medicalRecords')}>
                <i className="bi bi-folder-plus"></i>
                <span>Medical Records</span>
                <i className={`bi ${activeDropdown === 'medicalRecords' ? 'bi-chevron-down' : 'bi-chevron-right'} dropdown-icon`}></i>
              </Link>
              <ul className={activeDropdown === 'medicalRecords' ? 'dropdown-menu show' : 'dropdown-menu'}>
                <li onClick={() => handleNavigation('Treatment Record')}>
                  <Link to="#"><i className="bi bi-clipboard2-pulse"></i><span>Treatment Record</span></Link>
                </li>
                <li onClick={() => handleNavigation('Dental Record')}>
                  <Link to="#"><i className="bi bi-emoji-smile"></i><span>Dental Record</span></Link>
                </li>
                <li onClick={() => handleNavigation('Immunization Record')}>
                  <Link to="#"><i className="bi bi-shield-check"></i><span>Immunization Record</span></Link>
                </li>
              </ul>
            </li>
            
            <li className={activeDropdown === 'prescriptions' ? 'dropdown active' : 'dropdown'}>
              <Link to="#" onClick={() => handleDropdownToggle('prescriptions')}>
                <i className="bi bi-capsule"></i>
                <span>Prescription Record</span>
                <i className={`bi ${activeDropdown === 'prescriptions' ? 'bi-chevron-down' : 'bi-chevron-right'} dropdown-icon`}></i>
              </Link>
              <ul className={activeDropdown === 'prescriptions' ? 'dropdown-menu show' : 'dropdown-menu'}>
                <li onClick={() => handleNavigation('Active Prescriptions')}>
                  <Link to="#"><i className="bi bi-clipboard2-check"></i><span>Active Prescriptions</span></Link>
                </li>
                <li onClick={() => handleNavigation('Prescriptions History')}>
                  <Link to="#"><i className="bi bi-clock-history"></i><span>Prescriptions History</span></Link>
                </li>
              </ul>
            </li>

            <li className={currentPath === 'Settings' ? 'active' : ''} onClick={() => handleNavigation('Settings')}>
              <Link to="#">
                <i className="bi bi-gear"></i>
                <span>Settings</span>
              </Link>
            </li>
          </ul>
        </div>
        <button className="sidebar-hamburger" onClick={toggleSidebar} aria-label="Toggle sidebar">
          <i className={`bi ${sidebarOpen ? 'bi-x' : 'bi-list'}`} style={{ fontSize: '2rem', margin: '10px auto', display: 'block' }}></i>
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
              <span className="user-name">Patient User</span>
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
    </div>
  );
};

export default PatientDashboard;
