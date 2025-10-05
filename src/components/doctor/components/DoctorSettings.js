import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, Alert, Modal, Spinner } from 'react-bootstrap';
import { useAuth } from '../../../context/AuthContext';
import userService from '../../../services/userService';
import './styles/DoctorSettings.css';

const DoctorSettings = () => {
  const { user } = useAuth();
  
  // State for each settings section
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    position: '',
    specialization: '',
    licenseNumber: '',
    biography: ''
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    emergencyAlerts: true,
    dailyReports: false,
    weeklyReports: true
  });
  
  const [scheduleSettings, setScheduleSettings] = useState({
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    startTime: '08:00',
    endTime: '17:00',
    lunchBreakStart: '12:00',
    lunchBreakEnd: '13:00',
    appointmentDuration: 30,
    maxPatientsPerDay: 20,
    allowWeekendEmergency: true
  });
  
  const [displaySettings, setDisplaySettings] = useState({
    theme: 'light',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    timezone: 'Asia/Manila',
    dashboardLayout: 'grid',
    showPatientPhotos: true,
    compactMode: false
  });
  
  // UI state
  const [activeCard, setActiveCard] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(null);

  // Load user data on component mount
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        contactNumber: user.contactNumber || '',
        position: user.position || '',
        specialization: user.specialization || '',
        licenseNumber: user.licenseNumber || '',
        biography: user.biography || ''
      });
    }
    
    // Load saved settings from localStorage
    loadSettingsFromStorage();
  }, [user]);

  const loadSettingsFromStorage = () => {
    try {
      const savedNotifications = localStorage.getItem('doctorNotificationSettings');
      const savedSchedule = localStorage.getItem('doctorScheduleSettings');
      const savedDisplay = localStorage.getItem('doctorDisplaySettings');
      
      if (savedNotifications) {
        setNotificationSettings(JSON.parse(savedNotifications));
      }
      if (savedSchedule) {
        setScheduleSettings(JSON.parse(savedSchedule));
      }
      if (savedDisplay) {
        setDisplaySettings(JSON.parse(savedDisplay));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettingsToStorage = (type, data) => {
    try {
      localStorage.setItem(`doctor${type}Settings`, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleProfileSave = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // Update user profile via API
      await userService.updateUser(user.id, profileData);
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
    } catch (error) {
      setErrorMessage('Failed to update profile. Please try again.');
      console.error('Profile update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsSave = (type, data) => {
    setIsLoading(true);
    
    // Save to localStorage
    saveSettingsToStorage(type, data);
    
    // Simulate API save delay
    setTimeout(() => {
      setIsLoading(false);
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
    }, 500);
  };

  const handleWorkingDaysChange = (day) => {
    setScheduleSettings(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day]
    }));
  };

  const getCurrentTime = () => {
    return new Date().toLocaleString('en-US', {
      timeZone: displaySettings.timezone,
      hour12: displaySettings.timeFormat === '12h'
    });
  };

  return (
    <div className="doctor-settings-container">
      {/* Header */}
      <div className="settings-header">
        <div className="header-content">
          <h2>
            <i className="bi bi-gear"></i>
            Settings
          </h2>
          <p>Manage your doctor dashboard preferences and profile</p>
        </div>
        <div className="header-time">
          <small className="text-muted">Current time: {getCurrentTime()}</small>
        </div>
      </div>

      {/* Success Alert */}
      {showSuccessAlert && (
        <Alert variant="success" className="mb-3">
          <i className="bi bi-check-circle-fill me-2"></i>
          Settings saved successfully!
        </Alert>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <Alert variant="danger" className="mb-3">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {errorMessage}
        </Alert>
      )}

      {/* Settings Cards Grid */}
      <Row className="settings-grid justify-content-center">
        {/* Profile Management Card */}
        <Col md={8} lg={6} className="mb-4">
          <Card className={`settings-card h-100 ${activeCard === 'profile' ? 'active' : ''}`}>
            <Card.Header className="d-flex align-items-center">
              <i className="bi bi-person-circle settings-icon me-2"></i>
              <h5 className="mb-0">Profile Management</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>First Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                        onFocus={() => setActiveCard('profile')}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                        onFocus={() => setActiveCard('profile')}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    onFocus={() => setActiveCard('profile')}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Contact Number</Form.Label>
                  <Form.Control
                    type="tel"
                    value={profileData.contactNumber}
                    onChange={(e) => setProfileData({...profileData, contactNumber: e.target.value})}
                    onFocus={() => setActiveCard('profile')}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Position/Title</Form.Label>
                  <Form.Control
                    type="text"
                    value={profileData.position}
                    onChange={(e) => setProfileData({...profileData, position: e.target.value})}
                    placeholder="e.g., General Practitioner, Cardiologist"
                    onFocus={() => setActiveCard('profile')}
                  />
                </Form.Group>
              </Form>
              
              <div className="card-footer-actions">
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={handleProfileSave}
                  disabled={isLoading}
                >
                  {isLoading ? <Spinner size="sm" className="me-1" /> : null}
                  Save Profile
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

      </Row>
    </div>
  );
};

export default DoctorSettings;
