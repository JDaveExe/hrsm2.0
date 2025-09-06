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
      <Row className="settings-grid">
        {/* Profile Management Card */}
        <Col md={6} className="mb-4">
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

        {/* Notifications Card */}
        <Col md={6} className="mb-4">
          <Card className={`settings-card h-100 ${activeCard === 'notifications' ? 'active' : ''}`}>
            <Card.Header className="d-flex align-items-center">
              <i className="bi bi-bell settings-icon me-2"></i>
              <h5 className="mb-0">Notifications</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <div className="notification-group">
                  <h6 className="mb-3">Communication Preferences</h6>
                  
                  <Form.Check
                    type="switch"
                    id="emailNotifications"
                    label="Email Notifications"
                    checked={notificationSettings.emailNotifications}
                    onChange={(e) => {
                      setNotificationSettings({...notificationSettings, emailNotifications: e.target.checked});
                      setActiveCard('notifications');
                    }}
                    className="mb-2"
                  />
                  
                  <Form.Check
                    type="switch"
                    id="smsNotifications"
                    label="SMS Notifications"
                    checked={notificationSettings.smsNotifications}
                    onChange={(e) => {
                      setNotificationSettings({...notificationSettings, smsNotifications: e.target.checked});
                      setActiveCard('notifications');
                    }}
                    className="mb-3"
                  />
                </div>
                
                <div className="notification-group">
                  <h6 className="mb-3">Alert Types</h6>
                  
                  <Form.Check
                    type="switch"
                    id="appointmentReminders"
                    label="Appointment Reminders"
                    checked={notificationSettings.appointmentReminders}
                    onChange={(e) => {
                      setNotificationSettings({...notificationSettings, appointmentReminders: e.target.checked});
                      setActiveCard('notifications');
                    }}
                    className="mb-2"
                  />
                  
                  <Form.Check
                    type="switch"
                    id="emergencyAlerts"
                    label="Emergency Alerts"
                    checked={notificationSettings.emergencyAlerts}
                    onChange={(e) => {
                      setNotificationSettings({...notificationSettings, emergencyAlerts: e.target.checked});
                      setActiveCard('notifications');
                    }}
                    className="mb-2"
                  />
                  
                  <Form.Check
                    type="switch"
                    id="weeklyReports"
                    label="Weekly Reports"
                    checked={notificationSettings.weeklyReports}
                    onChange={(e) => {
                      setNotificationSettings({...notificationSettings, weeklyReports: e.target.checked});
                      setActiveCard('notifications');
                    }}
                    className="mb-2"
                  />
                </div>
              </Form>
              
              <div className="card-footer-actions">
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => handleSettingsSave('Notification', notificationSettings)}
                  disabled={isLoading}
                >
                  {isLoading ? <Spinner size="sm" className="me-1" /> : null}
                  Save Notifications
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Schedule Settings Card */}
        <Col md={6} className="mb-4">
          <Card className={`settings-card h-100 ${activeCard === 'schedule' ? 'active' : ''}`}>
            <Card.Header className="d-flex align-items-center">
              <i className="bi bi-calendar-week settings-icon me-2"></i>
              <h5 className="mb-0">Schedule Settings</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <div className="schedule-group">
                  <h6 className="mb-3">Working Days</h6>
                  <div className="working-days-selector">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <Form.Check
                        key={day}
                        type="checkbox"
                        id={`day-${day}`}
                        label={day.slice(0, 3)}
                        checked={scheduleSettings.workingDays.includes(day)}
                        onChange={() => {
                          handleWorkingDaysChange(day);
                          setActiveCard('schedule');
                        }}
                        className="day-checkbox"
                        inline
                      />
                    ))}
                  </div>
                </div>
                
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Start Time</Form.Label>
                      <Form.Control
                        type="time"
                        value={scheduleSettings.startTime}
                        onChange={(e) => {
                          setScheduleSettings({...scheduleSettings, startTime: e.target.value});
                          setActiveCard('schedule');
                        }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>End Time</Form.Label>
                      <Form.Control
                        type="time"
                        value={scheduleSettings.endTime}
                        onChange={(e) => {
                          setScheduleSettings({...scheduleSettings, endTime: e.target.value});
                          setActiveCard('schedule');
                        }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Appointment Duration (min)</Form.Label>
                      <Form.Select
                        value={scheduleSettings.appointmentDuration}
                        onChange={(e) => {
                          setScheduleSettings({...scheduleSettings, appointmentDuration: parseInt(e.target.value)});
                          setActiveCard('schedule');
                        }}
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={60}>1 hour</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Max Patients/Day</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        max="50"
                        value={scheduleSettings.maxPatientsPerDay}
                        onChange={(e) => {
                          setScheduleSettings({...scheduleSettings, maxPatientsPerDay: parseInt(e.target.value)});
                          setActiveCard('schedule');
                        }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
              
              <div className="card-footer-actions">
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => handleSettingsSave('Schedule', scheduleSettings)}
                  disabled={isLoading}
                >
                  {isLoading ? <Spinner size="sm" className="me-1" /> : null}
                  Save Schedule
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Display Preferences Card */}
        <Col md={6} className="mb-4">
          <Card className={`settings-card h-100 ${activeCard === 'display' ? 'active' : ''}`}>
            <Card.Header className="d-flex align-items-center">
              <i className="bi bi-display settings-icon me-2"></i>
              <h5 className="mb-0">Display Preferences</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Theme</Form.Label>
                      <Form.Select
                        value={displaySettings.theme}
                        onChange={(e) => {
                          setDisplaySettings({...displaySettings, theme: e.target.value});
                          setActiveCard('display');
                        }}
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Language</Form.Label>
                      <Form.Select
                        value={displaySettings.language}
                        onChange={(e) => {
                          setDisplaySettings({...displaySettings, language: e.target.value});
                          setActiveCard('display');
                        }}
                      >
                        <option value="en">English</option>
                        <option value="fil">Filipino</option>
                        <option value="es">Spanish</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Date Format</Form.Label>
                      <Form.Select
                        value={displaySettings.dateFormat}
                        onChange={(e) => {
                          setDisplaySettings({...displaySettings, dateFormat: e.target.value});
                          setActiveCard('display');
                        }}
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Time Format</Form.Label>
                      <Form.Select
                        value={displaySettings.timeFormat}
                        onChange={(e) => {
                          setDisplaySettings({...displaySettings, timeFormat: e.target.value});
                          setActiveCard('display');
                        }}
                      >
                        <option value="12h">12 Hour</option>
                        <option value="24h">24 Hour</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                
                <div className="display-options">
                  <Form.Check
                    type="switch"
                    id="showPatientPhotos"
                    label="Show Patient Photos"
                    checked={displaySettings.showPatientPhotos}
                    onChange={(e) => {
                      setDisplaySettings({...displaySettings, showPatientPhotos: e.target.checked});
                      setActiveCard('display');
                    }}
                    className="mb-2"
                  />
                  
                  <Form.Check
                    type="switch"
                    id="compactMode"
                    label="Compact Mode"
                    checked={displaySettings.compactMode}
                    onChange={(e) => {
                      setDisplaySettings({...displaySettings, compactMode: e.target.checked});
                      setActiveCard('display');
                    }}
                    className="mb-2"
                  />
                </div>
              </Form>
              
              <div className="card-footer-actions">
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => handleSettingsSave('Display', displaySettings)}
                  disabled={isLoading}
                >
                  {isLoading ? <Spinner size="sm" className="me-1" /> : null}
                  Save Display
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
