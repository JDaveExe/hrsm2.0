import React, { useState, useEffect } from 'react';
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
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [activeSubDropdown, setActiveSubDropdown] = useState(null);
  const [currentPath, setCurrentPath] = useState('Dashboard');
  const [showVitalSignsModal, setShowVitalSignsModal] = useState(false);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showPatientDetailsModal, setShowPatientDetailsModal] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(new Date());
  const [tabKey, setTabKey] = useState('families');
  const [dashboardTabKey, setDashboardTabKey] = useState('analytics');
  const [inventoryTabKey, setInventoryTabKey] = useState('vaccines');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // User Management states
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    emailInitials: '',
    password: '',
    confirmPassword: '',
    role: 'aide',
    position: 'Aide'
  });
  
  // Unit conversion preferences
  const [weightUnit, setWeightUnit] = useState('kg'); // 'kg' or 'lbs'
  const [heightUnit, setHeightUnit] = useState('cm'); // 'cm' or 'ft'
  
  // Manage dropdown and confirmation states
  const [showManageDropdown, setShowManageDropdown] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState('');
  const [countdown, setCountdown] = useState(0);
  
  // Sample data for dashboard statistics
  const [dashboardStats, setDashboardStats] = useState({
    totalPatients: 235,
    activeCheckups: 12,
    pendingAppointments: 8,
    completedToday: 7
  });
  
  // Sample patients data
  const [patients, setPatients] = useState([
    { 
      id: 1, 
      familyId: 'FAM-001',
      name: 'Maria Santos', 
      age: 35, 
      gender: 'Female',
      address: '123 Maybunga St, Pasig City',
      contact: '09123456789',
      lastCheckup: '2023-05-15',
      status: 'Active',
      vitalSignsComplete: false
    },
    { 
      id: 2, 
      familyId: 'FAM-001',
      name: 'Juan Santos', 
      age: 38, 
      gender: 'Male',
      address: '123 Maybunga St, Pasig City',
      contact: '09123456790',
      lastCheckup: '2023-04-22',
      status: 'Active',
      vitalSignsComplete: true
    },
    { 
      id: 3, 
      familyId: 'FAM-002',
      name: 'Ana Reyes', 
      age: 42, 
      gender: 'Female',
      address: '45 E. Rodriguez Ave, Pasig City',
      contact: '09187654321',
      lastCheckup: '2023-05-20',
      status: 'Active',
      vitalSignsComplete: false
    },
    { 
      id: 4, 
      familyId: 'FAM-003',
      name: 'Carlos Mendoza', 
      age: 55, 
      gender: 'Male',
      address: '78 C. Raymundo Ave, Pasig City',
      contact: '09198765432',
      lastCheckup: '2023-05-10',
      status: 'Inactive',
      vitalSignsComplete: true
    }
  ]);
  
  // Sample families data
  const [families, setFamilies] = useState([
    {
      id: 'FAM-001',
      familyName: 'Santos Family',
      address: '123 Maybunga St, Pasig City',
      contactPerson: 'Juan Santos',
      contact: '09123456790',
      memberCount: 4,
      registrationDate: '2023-01-15'
    },
    {
      id: 'FAM-002',
      familyName: 'Reyes Family',
      address: '45 E. Rodriguez Ave, Pasig City',
      contactPerson: 'Ana Reyes',
      contact: '09187654321',
      memberCount: 3,
      registrationDate: '2023-02-10'
    },
    {
      id: 'FAM-003',
      familyName: 'Mendoza Family',
      address: '78 C. Raymundo Ave, Pasig City',
      contactPerson: 'Carlos Mendoza',
      contact: '09198765432',
      memberCount: 2,
      registrationDate: '2023-03-22'
    }
  ]);
  
  // Sample appointments data
  const [appointments, setAppointments] = useState([
    {
      id: 101,
      patientName: 'Maria Santos',
      patientId: 1,
      date: '2023-06-05',
      time: '09:30 AM',
      type: 'Follow-up',
      status: 'Scheduled'
    },
    {
      id: 102,
      patientName: 'Ana Reyes',
      patientId: 3,
      date: '2023-06-07',
      time: '10:45 AM',
      type: 'Check-up',
      status: 'Scheduled'
    },
    {
      id: 103,
      patientName: 'Carlos Mendoza',
      patientId: 4,
      date: '2023-06-06',
      time: '02:15 PM',
      type: 'Medical Certificate',
      status: 'Scheduled'
    }
  ]);
  
  // Chart data
  const checkupData = {
    labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    datasets: [
      {
        label: 'Checkups Completed',
        data: [12, 19, 3, 5, 7, 3, 0],
        backgroundColor: 'rgba(52, 152, 219, 0.6)',
        borderColor: 'rgba(52, 152, 219, 1)',
        borderWidth: 2,
        tension: 0.3,
      },
    ],
  };
  
  const patientDistributionData = {
    labels: ['Male', 'Female'],
    datasets: [
      {
        label: 'Gender Distribution',
        data: [120, 115],
        backgroundColor: ['rgba(52, 152, 219, 0.6)', 'rgba(231, 76, 60, 0.6)'],
        borderColor: ['rgba(52, 152, 219, 1)', 'rgba(231, 76, 60, 1)'],
        borderWidth: 1,
      },
    ],
  };
  
  const ageDistributionData = {
    labels: ['0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61+'],
    datasets: [
      {
        label: 'Age Distribution',
        data: [28, 34, 42, 51, 39, 25, 16],
        backgroundColor: 'rgba(46, 204, 113, 0.6)',
        borderColor: 'rgba(46, 204, 113, 1)',
        borderWidth: 1,
      },
    ],
  };
  // Update date and time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000);

    return () => {
      clearInterval(timer);
    };
  }, []);
  
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
  
  const filteredPatients = () => {
    if (!searchTerm) return patients;
    const term = searchTerm.toLowerCase();
    return patients.filter(patient => 
      patient.name.toLowerCase().includes(term) || 
      patient.familyId.toLowerCase().includes(term) ||
      patient.contact.includes(term)
    );
  };

  const filteredFamilies = () => {
    if (!searchTerm) return families;
    const term = searchTerm.toLowerCase();
    return families.filter(family => 
      family.familyName.toLowerCase().includes(term) || 
      family.id.toLowerCase().includes(term) ||
      family.contactPerson.toLowerCase().includes(term) ||
      family.contact.includes(term)
    );
  };
  
  const handleAddPatient = () => {
    setShowAddPatientModal(true);
  };
  
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

  const handleViewInfo = (patient) => {
    setSelectedPatient(patient);
    setShowPatientDetailsModal(true);
  };

  const handleNotifyDoctor = (patient) => {
    // In a real application, this would send a notification to the doctor
    alert(`Notifying doctor for ${patient.name}. Doctor will be available shortly.`);
    // Here you would typically update the patient's status and send notification
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
  
  const handleRefreshData = () => {
    // Placeholder for data refresh
    alert('Refreshing dashboard data...');
    // In a real application, this would call an API to fetch fresh data
  };
  
  const getFamilyMembers = (familyId) => {
    return patients.filter(patient => patient.familyId === familyId);
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

  const confirmActionHandler = () => {
    if (countdown === 0) {
      if (confirmAction === 'reassign') {
        // Handle reassign logic here
        alert(`Patient ${selectedPatient?.name} has been prepared for family reassignment.`);
      } else if (confirmAction === 'delete') {
        // Handle delete logic here
        alert(`Patient ${selectedPatient?.name} has been marked for deletion.`);
      }
      setShowConfirmModal(false);
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
  // Render different content based on currentPath
  const renderContent = () => {
    switch(currentPath) {
      case 'Dashboard':
        return renderDashboard();
      case "Today's Checkup":
        return renderTodaysCheckup();
      case 'Patient Database':
        return renderPatientDatabase();
      case 'Unsorted Members':
        return renderUnsortedMembers();
      case 'Generate Reports':
        return renderGenerateReports();
      case 'Report History':
        return renderReportHistory();
      case 'Appointments':
        return renderAppointments();
      case 'Schedule an Appointment':
        return renderScheduleAppointment();
      case 'Appointment History':
        return renderAppointmentHistory();
      case 'Manage Inventories':
        return renderManageInventories();
      case 'Add User':
        return renderAddUser();
      case 'View/Edit Users':
        return renderViewEditUsers();
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
            <div className="info-card-value">{dashboardStats.totalPatients}</div>
            <div className="info-card-label">Total Patients</div>
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
        
        <div className="info-card">
          <div className="info-card-icon red">
            <i className="bi bi-check-circle"></i>
          </div>
          <div className="info-card-content">
            <div className="info-card-value">{dashboardStats.completedToday}</div>
            <div className="info-card-label">Completed Today</div>
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
                <div className="metric-value">49</div>
                <div className="metric-period">Last 7 days</div>
              </div>
              <div className="metric-box">
                <h4>Daily Average</h4>
                <div className="metric-value">7.0</div>
                <div className="metric-period">checkups per day</div>
              </div>
              <div className="metric-box">
                <h4>Peak Day</h4>
                <div className="metric-value">19</div>
                <div className="metric-period">Tuesday</div>
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
                {appointments.length > 0 ? (
                  appointments.map(appointment => (
                    <tr key={appointment.id}>
                      <td>{appointment.patientName}</td>
                      <td>{formatShortDate(appointment.date)}</td>
                      <td>{appointment.time}</td>
                      <td>{appointment.type}</td>
                      <td>{appointment.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center">No upcoming appointments</td>
                  </tr>
                )}
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
              <div className="activity-item">
                <div className="activity-date">Today</div>
                <div className="activity-details">New patient registration: Maria Garcia</div>
              </div>
              <div className="activity-item">
                <div className="activity-date">Today</div>
                <div className="activity-details">Checkup completed: Juan Santos</div>
              </div>
              <div className="activity-item">
                <div className="activity-date">Yesterday</div>
                <div className="activity-details">Appointment scheduled: Ana Reyes</div>
              </div>
              <div className="activity-item">
                <div className="activity-date">Yesterday</div>
                <div className="activity-details">Medical record updated: Carlos Mendoza</div>
              </div>
              <div className="activity-item">
                <div className="activity-date">06/08/2025</div>
                <div className="activity-details">Vital signs recorded: Juan Santos</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Today's Checkup content
  const renderTodaysCheckup = () => (
    <>
      <div className="patient-management">
        <div className="management-header">
          <h2 className="management-title">Scheduled Checkups for {formatShortDate(currentDateTime)}</h2>
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
            <button className="add-patient-btn" onClick={handleTodaysCheckups}>
              <i className="bi bi-plus-circle"></i>
              Check In Patient
            </button>
          </div>
        </div>
        
        <div className="table-container">
          <Table hover responsive className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Patient ID</th>
                <th>Name</th>
                <th>Time</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>PT-0023</td>
                <td>Maria Santos</td>
                <td>09:30 AM</td>
                <td>Follow-up</td>
                <td>Waiting</td>
                <td className="action-cell">
                  <div className="action-buttons-group">
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      className="action-btn view-btn" 
                      onClick={() => handleViewPatient(patients[0])}
                    >
                      <i className="bi bi-eye me-1"></i>
                      View Info
                    </Button>
                    <Button 
                      variant="outline-warning" 
                      size="sm" 
                      className="action-btn vitals-btn" 
                      onClick={() => handleVitalSigns(patients[0])}
                    >
                      <i className="bi bi-heart-pulse me-1"></i>
                      Vital Signs
                    </Button>
                    <Button 
                      variant="outline-success" 
                      size="sm" 
                      className="action-btn notify-btn" 
                      onClick={() => handleNotifyDoctor(patients[0])}
                      disabled={!patients[0].vitalSignsComplete}
                    >
                      <i className="bi bi-bell me-1"></i>
                      Notify Doctor
                    </Button>
                  </div>
                </td>
              </tr>
              <tr>
                <td>2</td>
                <td>PT-0034</td>
                <td>Carlos Mendoza</td>
                <td>10:15 AM</td>
                <td>Check-up</td>
                <td>In Progress</td>
                <td className="action-cell">
                  <div className="action-buttons-group">
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      className="action-btn view-btn" 
                      onClick={() => handleViewPatient(patients[3])}
                    >
                      <i className="bi bi-eye me-1"></i>
                      View Info
                    </Button>
                    <Button 
                      variant="outline-warning" 
                      size="sm" 
                      className="action-btn vitals-btn" 
                      onClick={() => handleVitalSigns(patients[3])}
                    >
                      <i className="bi bi-heart-pulse me-1"></i>
                      Vital Signs
                    </Button>
                    <Button 
                      variant="outline-success" 
                      size="sm" 
                      className="action-btn notify-btn" 
                      onClick={() => handleNotifyDoctor(patients[3])}
                      disabled={!patients[3].vitalSignsComplete}
                    >
                      <i className="bi bi-bell me-1"></i>
                      Notify Doctor
                    </Button>
                  </div>
                </td>
              </tr>
              <tr>
                <td>3</td>
                <td>PT-0031</td>
                <td>Ana Reyes</td>
                <td>11:45 AM</td>
                <td>Medical Certificate</td>
                <td>Scheduled</td>
                <td className="action-cell">
                  <div className="action-buttons-group">
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      className="action-btn view-btn" 
                      onClick={() => handleViewPatient(patients[2])}
                    >
                      <i className="bi bi-eye me-1"></i>
                      View Info
                    </Button>
                    <Button 
                      variant="outline-warning" 
                      size="sm" 
                      className="action-btn vitals-btn" 
                      onClick={() => handleVitalSigns(patients[2])}
                    >
                      <i className="bi bi-heart-pulse me-1"></i>
                      Vital Signs
                    </Button>
                    <Button 
                      variant="outline-success" 
                      size="sm" 
                      className="action-btn notify-btn" 
                      onClick={() => handleNotifyDoctor(patients[2])}
                      disabled={!patients[2].vitalSignsComplete}
                    >
                      <i className="bi bi-bell me-1"></i>
                      Notify Doctor
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
                    <th style={{textAlign: 'left'}}>Family ID</th>
                    <th style={{textAlign: 'left'}}>Family Name</th>
                    <th style={{textAlign: 'left'}}>Contact Number</th>
                    <th style={{textAlign: 'right'}}>Members</th>
                    <th style={{textAlign: 'left'}}>Registration Date</th>
                    <th style={{textAlign: 'center'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFamilies().map((family) => (
                    <tr key={family.id}>
                      <td style={{textAlign: 'left'}}>{family.id}</td>
                      <td style={{textAlign: 'left'}}>{family.familyName}</td>
                      <td style={{textAlign: 'left'}}>{family.contact}</td>
                      <td style={{textAlign: 'right'}}>{family.memberCount}</td>
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
                    <th style={{textAlign: 'left'}}>Family Members</th>
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
                      <td style={{textAlign: 'left'}}>{patient.familyId}</td>
                      <td style={{textAlign: 'left'}}>{patient.name}</td>
                      <td style={{textAlign: 'left'}}>
                        {/* Family Members (no age) */}
                        {getFamilyMembers(patient.familyId).map(m => m.name).join(', ')}
                      </td>
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
    </>
  );

  // Placeholder for other content sections
  const renderUnsortedMembers = () => (
    <div className="content-placeholder">
      <h2>Unsorted Members</h2>
      <p>This feature will be implemented soon.</p>
    </div>
  );

  const renderGenerateReports = () => (
    <div className="reports-management">
      <div className="management-header">
        <h2 className="management-title">
          <i className="bi bi-file-earmark-bar-graph me-2"></i>
          Generate Reports
        </h2>
        <div className="management-actions">
          <button className="add-patient-btn" onClick={() => alert('Export All Reports feature coming soon!')}>
            <i className="bi bi-download"></i>
            Export All
          </button>
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
                  <span className="stat-value">{dashboardStats.totalPatients}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Active Checkups:</span>
                  <span className="stat-value">{dashboardStats.activeCheckups}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Pending Appointments:</span>
                  <span className="stat-value">{dashboardStats.pendingAppointments}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Completed Today:</span>
                  <span className="stat-value">{dashboardStats.completedToday}</span>
                </div>
              </div>
            </div>
            <div className="report-actions">
              <button className="btn-generate" onClick={() => alert('Generating Patient Statistics Report...')}>
                <i className="bi bi-file-earmark-pdf"></i>
                Generate PDF
              </button>
              <button className="btn-generate excel" onClick={() => alert('Generating Excel Report...')}>
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
                <span>Weekly Total: 49 checkups</span>
                <span>Daily Average: 7.0 checkups</span>
              </div>
            </div>
            <div className="report-actions">
              <button className="btn-generate" onClick={() => alert('Generating Checkup Trends Report...')}>
                <i className="bi bi-file-earmark-pdf"></i>
                Generate PDF
              </button>
              <button className="btn-generate excel" onClick={() => alert('Generating Excel Report...')}>
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
                <span>Male: 120 patients</span>
                <span>Female: 115 patients</span>
              </div>
            </div>
            <div className="report-actions">
              <button className="btn-generate" onClick={() => alert('Generating Demographics Report...')}>
                <i className="bi bi-file-earmark-pdf"></i>
                Generate PDF
              </button>
              <button className="btn-generate excel" onClick={() => alert('Generating Excel Report...')}>
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
                  <span className="appt-type">Scheduled:</span>
                  <span className="appt-count">{appointments.length}</span>
                </div>
                <div className="appt-item">
                  <span className="appt-type">This Week:</span>
                  <span className="appt-count">12</span>
                </div>
                <div className="appt-item">
                  <span className="appt-type">Completed:</span>
                  <span className="appt-count">8</span>
                </div>
                <div className="appt-item">
                  <span className="appt-type">Cancelled:</span>
                  <span className="appt-count">2</span>
                </div>
              </div>
            </div>
            <div className="report-actions">
              <button className="btn-generate" onClick={() => alert('Generating Appointment Analysis Report...')}>
                <i className="bi bi-file-earmark-pdf"></i>
                Generate PDF
              </button>
              <button className="btn-generate excel" onClick={() => alert('Generating Excel Report...')}>
                <i className="bi bi-file-earmark-excel"></i>
                Generate Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Generation Options */}
      <div className="report-options">
        <div className="options-header">
          <h3>Report Generation Options</h3>
        </div>
        <div className="options-content">
          <div className="option-group">
            <label>Date Range:</label>
            <select className="form-select">
              <option value="last7days">Last 7 Days</option>
              <option value="last30days" selected>Last 30 Days</option>
              <option value="last90days">Last 90 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          <div className="option-group">
            <label>Report Format:</label>
            <select className="form-select">
              <option value="pdf" selected>PDF Document</option>
              <option value="excel">Excel Spreadsheet</option>
              <option value="csv">CSV File</option>
            </select>
          </div>
          <div className="option-group">
            <label>Include Charts:</label>
            <div className="checkbox-group">
              <label className="checkbox-item">
                <input type="checkbox" checked /> Patient Demographics
              </label>
              <label className="checkbox-item">
                <input type="checkbox" checked /> Checkup Trends
              </label>
              <label className="checkbox-item">
                <input type="checkbox" checked /> Appointment Analysis
              </label>
            </div>
          </div>
          <button className="btn-generate-all" onClick={() => alert('Generating comprehensive report...')}>
            <i className="bi bi-file-earmark-bar-graph"></i>
            Generate Comprehensive Report
          </button>
        </div>
      </div>
    </div>
  );

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

  const renderAppointments = () => (
    <div className="appointments-management">
      <div className="management-header">
        <h2 className="management-title">
          <i className="bi bi-calendar-check me-2"></i>
          Appointment Management
        </h2>
        <div className="management-actions">
          <div className="search-box">
            <i className="bi bi-search search-icon"></i>
            <input
              type="text"
              className="search-input"
              placeholder="Search appointments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="add-patient-btn" onClick={() => alert('Schedule new appointment coming soon!')}>
            <i className="bi bi-plus-circle"></i>
            Schedule Appointment
          </button>
          <button className="refresh-btn" onClick={handleRefreshData}>
            <i className="bi bi-arrow-clockwise"></i>
            Refresh
          </button>
        </div>
      </div>

      {/* Appointment Summary Cards */}
      <div className="appointment-summary">
        <div className="summary-card">
          <div className="summary-icon today">
            <i className="bi bi-calendar-day"></i>
          </div>
          <div className="summary-content">
            <div className="summary-value">3</div>
            <div className="summary-label">Today's Appointments</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon week">
            <i className="bi bi-calendar-week"></i>
          </div>
          <div className="summary-content">
            <div className="summary-value">15</div>
            <div className="summary-label">This Week</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon pending">
            <i className="bi bi-clock-history"></i>
          </div>
          <div className="summary-content">
            <div className="summary-value">{dashboardStats.pendingAppointments}</div>
            <div className="summary-label">Pending</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon completed">
            <i className="bi bi-check-circle"></i>
          </div>
          <div className="summary-content">
            <div className="summary-value">42</div>
            <div className="summary-label">Completed This Month</div>
          </div>
        </div>
      </div>

      {/* Quick Schedule Section */}
      <div className="quick-schedule">
        <div className="schedule-header">
          <h3>
            <i className="bi bi-lightning-charge me-2"></i>
            Quick Schedule
          </h3>
          <span>Schedule a new appointment quickly</span>
        </div>
        <div className="schedule-form">
          <div className="form-row">
            <div className="form-group">
              <label>Patient</label>
              <select className="form-select">
                <option value="">Select Patient</option>
                {patients.map(patient => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} (PT-{String(patient.id).padStart(4, '0')})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" className="form-control" />
            </div>
            <div className="form-group">
              <label>Time</label>
              <input type="time" className="form-control" />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select className="form-select">
                <option value="">Select Type</option>
                <option value="checkup">Regular Checkup</option>
                <option value="followup">Follow-up</option>
                <option value="consultation">Consultation</option>
                <option value="medical-cert">Medical Certificate</option>
                <option value="vaccination">Vaccination</option>
              </select>
            </div>
            <div className="form-group">
              <button className="btn-schedule" onClick={() => alert('Appointment scheduled successfully!')}>
                <i className="bi bi-plus-circle"></i>
                Schedule
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Calendar View */}
      <div className="calendar-section">
        <div className="calendar-header">
          <h3>
            <i className="bi bi-calendar3 me-2"></i>
            Appointment Calendar
          </h3>
          <div className="calendar-controls">
            <button className="btn-nav" onClick={() => alert('Previous month')}>
              <i className="bi bi-chevron-left"></i>
            </button>
            <span className="current-month">July 2024</span>
            <button className="btn-nav" onClick={() => alert('Next month')}>
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
        <div className="calendar-grid">
          <div className="calendar-header-days">
            <div className="day-header">Sun</div>
            <div className="day-header">Mon</div>
            <div className="day-header">Tue</div>
            <div className="day-header">Wed</div>
            <div className="day-header">Thu</div>
            <div className="day-header">Fri</div>
            <div className="day-header">Sat</div>
          </div>
          <div className="calendar-days">
            {/* Sample calendar days with appointments */}
            <div className="calendar-day other-month">30</div>
            <div className="calendar-day">1</div>
            <div className="calendar-day">2</div>
            <div className="calendar-day">3</div>
            <div className="calendar-day">4</div>
            <div className="calendar-day">5</div>
            <div className="calendar-day">6</div>
            <div className="calendar-day">7</div>
            <div className="calendar-day">8</div>
            <div className="calendar-day">9</div>
            <div className="calendar-day">10</div>
            <div className="calendar-day">11</div>
            <div className="calendar-day">12</div>
            <div className="calendar-day">13</div>
            <div className="calendar-day">14</div>
            <div className="calendar-day">15</div>
            <div className="calendar-day">16</div>
            <div className="calendar-day">17</div>
            <div className="calendar-day">18</div>
            <div className="calendar-day">19</div>
            <div className="calendar-day today has-appointments">
              20
              <div className="appointment-dots">
                <div className="dot checkup"></div>
                <div className="dot followup"></div>
                <div className="dot consultation"></div>
              </div>
            </div>
            <div className="calendar-day has-appointments">
              21
              <div className="appointment-dots">
                <div className="dot checkup"></div>
                <div className="dot medical-cert"></div>
              </div>
            </div>
            <div className="calendar-day">22</div>
            <div className="calendar-day has-appointments">
              23
              <div className="appointment-dots">
                <div className="dot followup"></div>
              </div>
            </div>
            <div className="calendar-day">24</div>
            <div className="calendar-day">25</div>
            <div className="calendar-day">26</div>
            <div className="calendar-day">27</div>
            <div className="calendar-day">28</div>
            <div className="calendar-day">29</div>
            <div className="calendar-day">30</div>
            <div className="calendar-day">31</div>
          </div>
        </div>
      </div>

      {/* Today's Appointments List */}
      <div className="todays-appointments">
        <div className="section-header">
          <h3>
            <i className="bi bi-clock me-2"></i>
            Today's Schedule - {formatShortDate(currentDateTime)}
          </h3>
          <div className="status-legend">
            <span className="legend-item scheduled">Scheduled</span>
            <span className="legend-item in-progress">In Progress</span>
            <span className="legend-item completed">Completed</span>
            <span className="legend-item cancelled">Cancelled</span>
          </div>
        </div>
        <div className="appointments-timeline">
          <div className="appointment-item scheduled">
            <div className="appointment-time">
              <span className="time">09:30 AM</span>
              <span className="duration">30 min</span>
            </div>
            <div className="appointment-details">
              <div className="patient-info">
                <h4>Maria Santos</h4>
                <span className="patient-id">PT-0001</span>
              </div>
              <div className="appointment-meta">
                <span className="type">Regular Checkup</span>
                <span className="status scheduled">Scheduled</span>
              </div>
            </div>
            <div className="appointment-actions">
              <button className="action-btn start" onClick={() => alert('Starting appointment...')}>
                <i className="bi bi-play-circle"></i>
              </button>
              <button className="action-btn edit" onClick={() => alert('Edit appointment...')}>
                <i className="bi bi-pencil"></i>
              </button>
              <button className="action-btn cancel" onClick={() => alert('Cancel appointment...')}>
                <i className="bi bi-x-circle"></i>
              </button>
            </div>
          </div>

          <div className="appointment-item in-progress">
            <div className="appointment-time">
              <span className="time">10:15 AM</span>
              <span className="duration">45 min</span>
            </div>
            <div className="appointment-details">
              <div className="patient-info">
                <h4>Carlos Mendoza</h4>
                <span className="patient-id">PT-0004</span>
              </div>
              <div className="appointment-meta">
                <span className="type">Follow-up</span>
                <span className="status in-progress">In Progress</span>
              </div>
            </div>
            <div className="appointment-actions">
              <button className="action-btn complete" onClick={() => alert('Completing appointment...')}>
                <i className="bi bi-check-circle"></i>
              </button>
              <button className="action-btn notes" onClick={() => alert('Add notes...')}>
                <i className="bi bi-journal-text"></i>
              </button>
              <button className="action-btn extend" onClick={() => alert('Extend time...')}>
                <i className="bi bi-clock"></i>
              </button>
            </div>
          </div>

          <div className="appointment-item scheduled">
            <div className="appointment-time">
              <span className="time">11:45 AM</span>
              <span className="duration">30 min</span>
            </div>
            <div className="appointment-details">
              <div className="patient-info">
                <h4>Ana Reyes</h4>
                <span className="patient-id">PT-0003</span>
              </div>
              <div className="appointment-meta">
                <span className="type">Medical Certificate</span>
                <span className="status scheduled">Scheduled</span>
              </div>
            </div>
            <div className="appointment-actions">
              <button className="action-btn start" onClick={() => alert('Starting appointment...')}>
                <i className="bi bi-play-circle"></i>
              </button>
              <button className="action-btn edit" onClick={() => alert('Edit appointment...')}>
                <i className="bi bi-pencil"></i>
              </button>
              <button className="action-btn cancel" onClick={() => alert('Cancel appointment...')}>
                <i className="bi bi-x-circle"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderScheduleAppointment = () => (
    <div className="content-placeholder">
      <h2>Schedule an Appointment</h2>
      <p>This feature has been merged with the main Appointments section.</p>
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
            <span>{formatDate(currentDateTime)}</span>
          </div>
          <div className="user">
            <span className="user-name">Admin User</span>
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
                      onChange={(e) => setUserFormData({...userFormData, firstName: e.target.value})}
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
                      onChange={(e) => setUserFormData({...userFormData, middleName: e.target.value})}
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
                      onChange={(e) => setUserFormData({...userFormData, lastName: e.target.value})}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
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
                      />
                      <InputGroup.Text>@maybunga.health</InputGroup.Text>
                    </InputGroup>
                    <Form.Text className="text-muted">
                      This will be used as the login email (e.g., j.santos@maybunga.health)
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
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
                    <Form.Control
                      type="password"
                      placeholder="Enter password"
                      value={userFormData.password}
                      onChange={(e) => setUserFormData({...userFormData, password: e.target.value})}
                      required
                      minLength={8}
                    />
                    <Form.Text className="text-muted">
                      Minimum 8 characters, must include uppercase, lowercase, number, and special character
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Confirm Password *</strong></Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Re-enter password"
                      value={userFormData.confirmPassword}
                      onChange={(e) => setUserFormData({...userFormData, confirmPassword: e.target.value})}
                      required
                      isInvalid={userFormData.password !== userFormData.confirmPassword && userFormData.confirmPassword !== ''}
                    />
                    <Form.Control.Feedback type="invalid">
                      Passwords do not match
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
              
              <div className="form-actions">
                <Button 
                  variant="success" 
                  type="submit" 
                  size="lg"
                  disabled={!userFormData.firstName || !userFormData.lastName || !userFormData.emailInitials || !userFormData.password || !userFormData.confirmPassword || userFormData.password !== userFormData.confirmPassword}
                >
                  <i className="bi bi-person-plus me-2"></i>
                  Create User Account
                </Button>
                <Button 
                  variant="outline-secondary" 
                  size="lg" 
                  className="ms-3"
                  onClick={() => setUserFormData({
                    firstName: '',
                    middleName: '',
                    lastName: '',
                    emailInitials: '',
                    password: '',
                    confirmPassword: '',
                    role: 'aide',
                    position: 'Aide'
                  })}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Reset Form
                </Button>
              </div>
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
  const handleAddUser = (e) => {
    e.preventDefault();
    // TODO: Implement backend API call
    alert(`Creating user account for ${userFormData.firstName} ${userFormData.lastName} (${userFormData.emailInitials}@maybunga.health) with role: ${userFormData.position}`);
    
    // Reset form
    setUserFormData({
      firstName: '',
      middleName: '',
      lastName: '',
      emailInitials: '',
      password: '',
      confirmPassword: '',
      role: 'aide',
      position: 'Aide'
    });
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
                <li onClick={() => handleNavigation('Unsorted Members')}>
                  <Link to="#">
                    <i className="bi bi-person-lines-fill"></i>
                    <span>Unsorted Members</span>
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
            
            <li className={activeDropdown === 'appointment' ? 'dropdown active' : 'dropdown'}>
              <Link to="#" onClick={() => handleDropdownToggle('appointment')}>
                <i className="bi bi-calendar-check"></i>
                <span>Appointment</span>
                <i className={`bi ${activeDropdown === 'appointment' ? 'bi-chevron-down' : 'bi-chevron-right'} dropdown-icon`}></i>
              </Link>
              <ul className={activeDropdown === 'appointment' ? 'dropdown-menu show' : 'dropdown-menu'}>
                <li onClick={() => handleNavigation('Appointments')}>
                  <Link to="#">
                    <i className="bi bi-calendar-event"></i>
                    <span>Appointments</span>
                  </Link>
                </li>
                <li onClick={() => handleNavigation('Appointment History')}>
                  <Link to="#">
                    <i className="bi bi-calendar-week"></i>
                    <span>Appointment History</span>
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
                <li className={activeSubDropdown === 'userManagement' ? 'sub-dropdown active' : 'sub-dropdown'}>
                  <Link to="#" onClick={(e) => handleSubDropdownToggle('userManagement', e)}>
                    <i className="bi bi-people-fill"></i>
                    <span>User Management</span>
                    <i className={`bi ${activeSubDropdown === 'userManagement' ? 'bi-chevron-down' : 'bi-chevron-right'} dropdown-icon`}></i>
                  </Link>
                  <ul className={activeSubDropdown === 'userManagement' ? 'sub-dropdown-menu show' : 'sub-dropdown-menu'}>
                    <li onClick={() => handleNavigation('Add User')}>
                      <Link to="#" className="sub-dropdown-item">
                        <i className="bi bi-person-plus"></i>
                        <span>Add User</span>
                      </Link>
                    </li>
                    <li onClick={() => handleNavigation('View/Edit Users')}>
                      <Link to="#" className="sub-dropdown-item">
                        <i className="bi bi-person-lines-fill"></i>
                        <span>View/Edit Users</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="sub-dropdown-item">
                        <i className="bi bi-shield-check"></i>
                        <span>Access Rights</span>
                      </Link>
                    </li>
                  </ul>
                </li>
                <li className={activeSubDropdown === 'systemConfig' ? 'sub-dropdown active' : 'sub-dropdown'}>
                  <Link to="#" onClick={(e) => handleSubDropdownToggle('systemConfig', e)}>
                    <i className="bi bi-gear-fill"></i>
                    <span>System Configuration</span>
                    <i className={`bi ${activeSubDropdown === 'systemConfig' ? 'bi-chevron-down' : 'bi-chevron-right'} dropdown-icon`}></i>
                  </Link>
                  <ul className={activeSubDropdown === 'systemConfig' ? 'sub-dropdown-menu show' : 'sub-dropdown-menu'}>
                    <li>
                      <Link to="#" className="sub-dropdown-item">
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
                      <Link to="#" className="sub-dropdown-item">
                        <i className="bi bi-download"></i>
                        <span>Create Backup</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="sub-dropdown-item">
                        <i className="bi bi-upload"></i>
                        <span>Restore Backup</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="sub-dropdown-item">
                        <i className="bi bi-gear"></i>
                        <span>Backup Settings</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="sub-dropdown-item">
                        <i className="bi bi-check-circle"></i>
                        <span>Enable Auto Backup</span>
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
              <span>{formatDate(currentDateTime)}</span>
            </div>
            <div className="user">
              <span className="user-name">Admin User</span>
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
            Record Vital Signs
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="vital-signs-body">
          {selectedPatient && (
            <div className="patient-profile-card">
              <div className="patient-avatar">
                <i className="bi bi-person-circle"></i>
              </div>
              <div className="patient-info">
                <h4>{selectedPatient.name}</h4>
                <div className="patient-meta">
                  <span className="patient-id">PT-{String(selectedPatient.id).padStart(4, '0')}</span>
                  <span className="patient-age">{selectedPatient.age} years old</span>
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
                      <Form.Select className="vital-select">
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
                      <Form.Select className="vital-select">
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
                      <Form.Select className="vital-select">
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
                      <Form.Select className="vital-select">
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
                      <Form.Select className="vital-select">
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
                      <Form.Select className="vital-select">
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
                      <Form.Select className="vital-select">
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
                      <Form.Select className="vital-select">
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
                />
              </Form.Group>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer className="vital-signs-footer">
          <div className="footer-info">
            <small className="text-muted">
              <i className="bi bi-info-circle me-1"></i>
              All values are validated against medical standards
            </small>
          </div>
          <div className="footer-actions">
            <Button variant="outline-secondary" onClick={() => setShowVitalSignsModal(false)}>
              <i className="bi bi-x-circle me-1"></i>
              Cancel
            </Button>
            <Button variant="success" className="save-vital-btn">
              <i className="bi bi-check-circle me-1"></i>
              Save Vital Signs
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
      
      {/* QR Code Modal */}
      <Modal 
        show={showQRCodeModal} 
        onHide={() => setShowQRCodeModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Patient QR Code</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {selectedPatient && (
            <>
              <div className="mb-3">
                <strong>Patient:</strong> {selectedPatient.name}<br />
                <strong>ID:</strong> PT-{String(selectedPatient.id).padStart(4, '0')}
              </div>
              <div className="qr-container" style={{marginBottom: '20px'}}>
                <QRCode 
                  value={`PT-${selectedPatient.id}|${selectedPatient.name}|${selectedPatient.familyId}`}
                  size={200}
                  bgColor={"#ffffff"}
                  fgColor={"#000000"}
                  level={"H"}
                  includeMargin={true}
                />
              </div>
              <p>Scan this QR code for quick patient identification and check-in</p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowQRCodeModal(false)}>
            Close
          </Button>
          <Button variant="primary">
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
                    variant="outline-warning" 
                    size="sm"
                    style={{borderRadius: '8px', fontWeight: 500}}
                  >
                    <i className="bi bi-key me-1"></i>
                    Auto Login
                  </Button>
                  <Button 
                    variant="outline-success" 
                    size="sm"
                    style={{borderRadius: '8px', fontWeight: 500}}
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
                        <small style={{color: 'var(--text-secondary)', fontWeight: 500}}>Email</small>
                        <div style={{color: 'var(--warning)', fontWeight: 500}}>
                          tre@gmail.com
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

              {/* Patient Actions Section */}
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <div style={{
                  background: 'var(--sidebar-bg)',
                  color: 'white',
                  padding: '12px 16px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <i className="bi bi-activity"></i>
                  Patient Actions
                </div>
                <div style={{padding: '20px'}}>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <div 
                        className="h-100 d-flex align-items-center p-3"
                        style={{
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-secondary)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.borderColor = 'var(--accent-primary)';
                          e.target.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.borderColor = 'var(--border-secondary)';
                          e.target.style.transform = 'translateY(0)';
                        }}
                      >
                        <div className="me-3">
                          <i className="bi bi-clipboard-pulse" style={{fontSize: '1.5rem', color: 'var(--accent-primary)'}}></i>
                        </div>
                        <div>
                          <div style={{color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem'}}>
                            Check Up History
                          </div>
                          <small style={{color: 'var(--text-secondary)'}}>
                            Full examination details
                          </small>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-md-4">
                      <div 
                        className="h-100 d-flex align-items-center p-3"
                        style={{
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-secondary)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.borderColor = 'var(--success)';
                          e.target.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.borderColor = 'var(--border-secondary)';
                          e.target.style.transform = 'translateY(0)';
                        }}
                      >
                        <div className="me-3">
                          <i className="bi bi-file-medical" style={{fontSize: '1.5rem', color: 'var(--success)'}}></i>
                        </div>
                        <div>
                          <div style={{color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem'}}>
                            Treatment Record
                          </div>
                          <small style={{color: 'var(--text-secondary)'}}>
                            Previous medical records
                          </small>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-md-4">
                      <div 
                        className="h-100 d-flex align-items-center p-3"
                        style={{
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-secondary)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.borderColor = 'var(--error)';
                          e.target.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.borderColor = 'var(--border-secondary)';
                          e.target.style.transform = 'translateY(0)';
                        }}
                      >
                        <div className="me-3">
                          <i className="bi bi-heart-pulse" style={{fontSize: '1.5rem', color: 'var(--error)'}}></i>
                        </div>
                        <div>
                          <div style={{color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem'}}>
                            Vital Signs Check
                          </div>
                          <small style={{color: 'var(--text-secondary)'}}>
                            Record patient vitals
                          </small>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      <div 
                        className="h-100 d-flex align-items-center p-3"
                        style={{
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-secondary)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.borderColor = 'var(--warning)';
                          e.target.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.borderColor = 'var(--border-secondary)';
                          e.target.style.transform = 'translateY(0)';
                        }}
                      >
                        <div className="me-3">
                          <i className="bi bi-arrow-left-right" style={{fontSize: '1.5rem', color: 'var(--warning)'}}></i>
                        </div>
                        <div>
                          <div style={{color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem'}}>
                            Referral
                          </div>
                          <small style={{color: 'var(--text-secondary)'}}>
                            Specialist referrals
                          </small>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      <div 
                        className="h-100 d-flex align-items-center p-3"
                        style={{
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-secondary)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.borderColor = 'var(--accent-secondary)';
                          e.target.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.borderColor = 'var(--border-secondary)';
                          e.target.style.transform = 'translateY(0)';
                        }}
                      >
                        <div className="me-3">
                          <i className="bi bi-chat-dots" style={{fontSize: '1.5rem', color: 'var(--accent-secondary)'}}></i>
                        </div>
                        <div>
                          <div style={{color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem'}}>
                            SMS Notification
                          </div>
                          <small style={{color: 'var(--text-secondary)'}}>
                            Send text message
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center mt-3">
                    <small style={{color: 'var(--text-secondary)', fontStyle: 'italic'}}>
                      Select an action to perform
                    </small>
                  </div>
                </div>
              </div>

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
            {countdown > 0 ? `Wait ${countdown}s` : (confirmAction === 'reassign' ? 'Reassign Patient' : 'Delete Patient')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Patient Modal - Placeholder */}
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
            <h5>Personal Information</h5>
            <Row className="mb-3">
              <Col md={4}>
                <Form.Group controlId="firstName">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control type="text" placeholder="Enter first name" />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="middleName">
                  <Form.Label>Middle Name</Form.Label>
                  <Form.Control type="text" placeholder="Enter middle name" />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="lastName">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control type="text" placeholder="Enter last name" />
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-3">
              <Col md={4}>
                <Form.Group controlId="dateOfBirth">
                  <Form.Label>Date of Birth</Form.Label>
                  <DatePicker 
                    selected={new Date()} 
                    onChange={(date) => {}} 
                    className="form-control"
                    dateFormat="MM/dd/yyyy"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="gender">
                  <Form.Label>Gender</Form.Label>
                  <Form.Select>
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="contactNumber">
                  <Form.Label>Contact Number</Form.Label>
                  <Form.Control type="text" placeholder="e.g. 09123456789" />
                </Form.Group>
              </Col>
            </Row>
            
            <h5 className="mt-4">Address Information</h5>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="familyId">
                  <Form.Label>Family ID (Optional)</Form.Label>
                  <Form.Control type="text" placeholder="Assign to existing family" />
                  <Form.Text className="text-muted">
                    Leave blank for new family registration
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="familyName">
                  <Form.Label>Family Name</Form.Label>
                  <Form.Control type="text" placeholder="Family name for new registration" />
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-3">
              <Col md={4}>
                <Form.Group controlId="street">
                  <Form.Label>Street</Form.Label>
                  <Form.Control type="text" placeholder="Enter street" />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="barangay">
                  <Form.Label>Barangay</Form.Label>
                  <Form.Control type="text" placeholder="Enter barangay" />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="city">
                  <Form.Label>City</Form.Label>
                  <Form.Control type="text" placeholder="Enter city" defaultValue="Pasig City" />
                </Form.Group>
              </Col>
            </Row>
            
            <h5 className="mt-4">Medical Information</h5>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="philHealthNumber">
                  <Form.Label>PhilHealth Number (Optional)</Form.Label>
                  <Form.Control type="text" placeholder="Enter PhilHealth number" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="bloodType">
                  <Form.Label>Blood Type (Optional)</Form.Label>
                  <Form.Select>
                    <option value="">Select blood type</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Medical Conditions/Allergies (Optional)</Form.Label>
              <Form.Control as="textarea" rows={3} placeholder="Enter any existing medical conditions or allergies" />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddPatientModal(false)}>
            Cancel
          </Button>
          <Button variant="primary">
            Save Patient
          </Button>
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
                      <td style={{textAlign: 'left'}}>{member.name}</td>
                      <td style={{textAlign: 'right'}}>{member.age}</td>
                      <td style={{textAlign: 'left'}}>{member.gender}</td>
                      <td style={{textAlign: 'left'}}>{member.contact}</td>
                      <td style={{textAlign: 'left'}}>{formatShortDate(member.lastCheckup)}</td>
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
    </div>
  );
};

export default AdminDashboard;
