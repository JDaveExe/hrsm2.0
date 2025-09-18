import React, { useState, useCallback, memo, useEffect } from 'react';
import PropTypes from 'prop-types';
import ThemeLoader from './ThemeLoader';
import './PatientMedicalRecords.css';

const PatientSettings = memo(({ user, secureApiCall, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('customization'); // 'customization', 'history'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showThemeLoader, setShowThemeLoader] = useState(false);
  const [pendingTheme, setPendingTheme] = useState('');

  // Customization settings state
  const [settings, setSettings] = useState({
    theme: 'red', // red, blue, green
    notifications: {
      email: true,
      sms: false,
      push: true,
      appointments: true,
      prescriptions: true,
      labResults: true
    },
    privacy: {
      shareWithFamily: true,
      allowMarketing: false,
      dataAnalytics: true
    },
    accessibility: {
      fontSize: 'medium', // small, medium, large
      highContrast: false,
      screenReader: false
    },
    dashboard: {
      compactView: false,
      showQuickStats: true,
      autoRefresh: true,
      defaultView: 'appointments' // appointments, prescriptions, medical-records
    },
    language: 'english',
    timezone: 'America/New_York'
  });

  // History data state
  const [historyData, setHistoryData] = useState({
    appointments: [],
    prescriptions: [],
    medicalRecords: [],
    labResults: [],
    loginHistory: []
  });

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('patientSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem('patientSettings', JSON.stringify(settings));
  }, [settings]);

  // Apply theme changes
  useEffect(() => {
    const root = document.documentElement;
    
    if (settings.theme === 'blue') {
      // Blue theme
      root.style.setProperty('--primary-color', '#007bff');
      root.style.setProperty('--primary-hover', '#0056b3');
      root.style.setProperty('--primary-light', '#e3f2fd');
      root.style.setProperty('--primary-gradient-start', '#007bff');
      root.style.setProperty('--primary-gradient-end', '#0056b3');
    } else if (settings.theme === 'green') {
      // Green theme
      root.style.setProperty('--primary-color', '#28a745');
      root.style.setProperty('--primary-hover', '#1e7e34');
      root.style.setProperty('--primary-light', '#e8f5e8');
      root.style.setProperty('--primary-gradient-start', '#28a745');
      root.style.setProperty('--primary-gradient-end', '#1e7e34');
    } else {
      // Default red theme
      root.style.setProperty('--primary-color', '#dc3545');
      root.style.setProperty('--primary-hover', '#c82333');
      root.style.setProperty('--primary-light', '#fef2f2');
      root.style.setProperty('--primary-gradient-start', '#dc3545');
      root.style.setProperty('--primary-gradient-end', '#c82333');
    }
  }, [settings.theme]);

  // Apply font size changes
  useEffect(() => {
    const root = document.documentElement;
    const baseFontSize = settings.accessibility.fontSize === 'small' ? '14px' : 
                         settings.accessibility.fontSize === 'large' ? '18px' : '16px';
    root.style.setProperty('--base-font-size', baseFontSize);
  }, [settings.accessibility.fontSize]);

  // Apply high contrast mode
  useEffect(() => {
    const body = document.body;
    if (settings.accessibility.highContrast) {
      body.classList.add('high-contrast');
    } else {
      body.classList.remove('high-contrast');
    }
  }, [settings.accessibility.highContrast]);

  // Apply compact view
  useEffect(() => {
    const body = document.body;
    if (settings.dashboard.compactView) {
      body.classList.add('compact-view');
    } else {
      body.classList.remove('compact-view');
    }
  }, [settings.dashboard.compactView]);

  // Apply timezone changes (this would normally update the display format)
  useEffect(() => {
    // Store timezone in localStorage for use by other components
    localStorage.setItem('userTimezone', settings.timezone);
    // You could dispatch an event here to notify other components
    window.dispatchEvent(new CustomEvent('timezoneChanged', { 
      detail: { timezone: settings.timezone } 
    }));
  }, [settings.timezone]);

  // Fetch history data
  const fetchHistoryData = useCallback(async () => {
    if (!user?.patientId) return;
    
    setLoading(true);
    try {
      // Fetch appointment history
      const appointmentResponse = await secureApiCall(
        `http://localhost:5000/api/appointments/history/${user.patientId}`
      );
      
      // Fetch prescription history
      const prescriptionResponse = await secureApiCall(
        `http://localhost:5000/api/patient/${user.patientId}/prescriptions/history`
      );
      
      // Fetch medical records history
      const medicalResponse = await secureApiCall(
        `http://localhost:5000/api/checkups/history/${user.patientId}`
      );

      setHistoryData({
        appointments: appointmentResponse?.appointments || [],
        prescriptions: prescriptionResponse?.prescriptionHistory || [],
        medicalRecords: medicalResponse?.checkups || [],
        labResults: [],
        loginHistory: [
          { date: '2025-09-08', time: '08:30', device: 'Desktop - Chrome', location: 'Home' },
          { date: '2025-09-07', time: '14:15', device: 'Mobile - Safari', location: 'Office' },
          { date: '2025-09-06', time: '09:45', device: 'Desktop - Firefox', location: 'Home' }
        ]
      });
    } catch (error) {
      console.error('Error fetching history data:', error);
      setError('Unable to load history data');
    } finally {
      setLoading(false);
    }
  }, [user?.patientId, secureApiCall]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistoryData();
    }
  }, [activeTab, fetchHistoryData]);

  const handleSettingChange = useCallback((category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
    
    // Show success feedback
    setSuccessMessage(`${category} settings updated`);
    setTimeout(() => setSuccessMessage(''), 2000);
  }, []);

  const handleDirectSettingChange = useCallback((setting, value) => {
    // Special handling for theme changes
    if (setting === 'theme') {
      setPendingTheme(value);
      setShowThemeLoader(true);
      return;
    }
    
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
    
    // Show success feedback
    setSuccessMessage(`${setting} setting updated`);
    setTimeout(() => setSuccessMessage(''), 2000);
  }, []);

  // Handle theme loader completion
  const handleThemeChangeComplete = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      theme: pendingTheme
    }));
    
    setShowThemeLoader(false);
    setPendingTheme('');
    setSuccessMessage(`Theme changed to ${pendingTheme}`);
    setTimeout(() => setSuccessMessage(''), 2000);
  }, [pendingTheme]);

  const exportData = useCallback(async () => {
    try {
      const data = {
        userInfo: {
          name: `${user?.firstName} ${user?.lastName}`,
          patientId: user?.patientId,
          exportDate: new Date().toISOString()
        },
        ...historyData
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `patient-data-${user?.patientId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  }, [historyData, user]);

  const renderCustomization = () => (
    <div className="settings-section">
      <div className="section-header">
        <div className="section-title">
          <i className="bi bi-palette"></i>
          <h3>Customization</h3>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="alert alert-success">
          <i className="bi bi-check-circle"></i>
          <span>{successMessage}</span>
        </div>
      )}

      <div className="settings-grid">
        {/* Theme Settings */}
        <div className="setting-card">
          <div className="setting-header">
            <i className="bi bi-brush"></i>
            <h4>Theme Preferences</h4>
          </div>
          <div className="setting-options">
            <label className="setting-label">Color Theme</label>
            <select 
              className="form-control"
              value={settings.theme}
              onChange={(e) => handleDirectSettingChange('theme', e.target.value)}
            >
              <option value="red">Patient Red (Current)</option>
              <option value="blue">Professional Blue</option>
              <option value="green">Healthcare Green</option>
            </select>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="setting-card">
          <div className="setting-header">
            <i className="bi bi-bell"></i>
            <h4>Notifications</h4>
          </div>
          <div className="setting-options">
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={settings.notifications.email}
                  onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
                />
                <span>Email notifications</span>
              </label>
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={settings.notifications.sms}
                  onChange={(e) => handleSettingChange('notifications', 'sms', e.target.checked)}
                />
                <span>SMS notifications</span>
              </label>
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={settings.notifications.appointments}
                  onChange={(e) => handleSettingChange('notifications', 'appointments', e.target.checked)}
                />
                <span>Appointment reminders</span>
              </label>
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={settings.notifications.prescriptions}
                  onChange={(e) => handleSettingChange('notifications', 'prescriptions', e.target.checked)}
                />
                <span>Prescription updates</span>
              </label>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="setting-card">
          <div className="setting-header">
            <i className="bi bi-shield-check"></i>
            <h4>Privacy & Data</h4>
          </div>
          <div className="setting-options">
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={settings.privacy.shareWithFamily}
                  onChange={(e) => handleSettingChange('privacy', 'shareWithFamily', e.target.checked)}
                />
                <span>Share data with family members</span>
              </label>
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={settings.privacy.allowMarketing}
                  onChange={(e) => handleSettingChange('privacy', 'allowMarketing', e.target.checked)}
                />
                <span>Allow marketing communications</span>
              </label>
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={settings.privacy.dataAnalytics}
                  onChange={(e) => handleSettingChange('privacy', 'dataAnalytics', e.target.checked)}
                />
                <span>Help improve services with usage data</span>
              </label>
            </div>
          </div>
        </div>

        {/* Accessibility Settings */}
        <div className="setting-card">
          <div className="setting-header">
            <i className="bi bi-universal-access"></i>
            <h4>Accessibility</h4>
          </div>
          <div className="setting-options">
            <label className="setting-label">Font Size</label>
            <select 
              className="form-control"
              value={settings.accessibility.fontSize}
              onChange={(e) => handleSettingChange('accessibility', 'fontSize', e.target.value)}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={settings.accessibility.highContrast}
                  onChange={(e) => handleSettingChange('accessibility', 'highContrast', e.target.checked)}
                />
                <span>High contrast mode</span>
              </label>
            </div>
          </div>
        </div>

        {/* Language & Region */}
        <div className="setting-card">
          <div className="setting-header">
            <i className="bi bi-globe"></i>
            <h4>Language & Region</h4>
          </div>
          <div className="setting-options">
            <label className="setting-label">Language</label>
            <select 
              className="form-control"
              value={settings.language}
              onChange={(e) => handleDirectSettingChange('language', e.target.value)}
            >
              <option value="english">English</option>
              <option value="spanish">Español</option>
              <option value="french">Français</option>
            </select>
            <label className="setting-label">Timezone</label>
            <select 
              className="form-control"
              value={settings.timezone}
              onChange={(e) => handleDirectSettingChange('timezone', e.target.value)}
            >
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
            </select>
          </div>
        </div>

        {/* Dashboard Layout */}
        <div className="setting-card">
          <div className="setting-header">
            <i className="bi bi-layout-three-columns"></i>
            <h4>Dashboard Layout</h4>
          </div>
          <div className="setting-options">
            <label className="setting-label">Default Page</label>
            <select 
              className="form-control"
              value={settings.dashboard.defaultView}
              onChange={(e) => handleSettingChange('dashboard', 'defaultView', e.target.value)}
            >
              <option value="appointments">Appointments</option>
              <option value="prescriptions">Prescriptions</option>
              <option value="medical-records">Medical Records</option>
              <option value="communication">Communication</option>
            </select>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={settings.dashboard.compactView}
                  onChange={(e) => handleSettingChange('dashboard', 'compactView', e.target.checked)}
                />
                <span>Compact view mode</span>
              </label>
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={settings.dashboard.showQuickStats}
                  onChange={(e) => handleSettingChange('dashboard', 'showQuickStats', e.target.checked)}
                />
                <span>Show quick statistics</span>
              </label>
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={settings.dashboard.autoRefresh}
                  onChange={(e) => handleSettingChange('dashboard', 'autoRefresh', e.target.checked)}
                />
                <span>Auto-refresh data</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="settings-section">
      <div className="section-header">
        <div className="section-title">
          <i className="bi bi-clock-history"></i>
          <h3>History</h3>
        </div>
        <button className="btn btn-primary btn-sm" onClick={exportData}>
          <i className="bi bi-download"></i>
          Export Data
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <i className="bi bi-hourglass-split"></i>
          <p>Loading history...</p>
        </div>
      ) : (
        <div className="history-grid">
          {/* Appointment History */}
          <div className="history-card">
            <div className="history-header">
              <i className="bi bi-calendar-check"></i>
              <h4>Appointment History</h4>
              <span className="count-badge">{historyData.appointments.length}</span>
            </div>
            <div className="history-content">
              {historyData.appointments.length === 0 ? (
                <p className="empty-message">No appointment history found</p>
              ) : (
                <div className="history-list">
                  {historyData.appointments.slice(0, 3).map((apt, index) => (
                    <div key={index} className="history-item">
                      <span className="date">{apt.date}</span>
                      <span className="description">{apt.type || 'General Consultation'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Prescription History */}
          <div className="history-card">
            <div className="history-header">
              <i className="bi bi-prescription2"></i>
              <h4>Prescription History</h4>
              <span className="count-badge">{historyData.prescriptions.length}</span>
            </div>
            <div className="history-content">
              {historyData.prescriptions.length === 0 ? (
                <p className="empty-message">No prescription history found</p>
              ) : (
                <div className="history-list">
                  {historyData.prescriptions.slice(0, 3).map((prescription, index) => (
                    <div key={index} className="history-item">
                      <span className="date">{prescription.date}</span>
                      <span className="description">{prescription.medication}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Medical Records History */}
          <div className="history-card">
            <div className="history-header">
              <i className="bi bi-file-medical"></i>
              <h4>Medical Records</h4>
              <span className="count-badge">{historyData.medicalRecords.length}</span>
            </div>
            <div className="history-content">
              {historyData.medicalRecords.length === 0 ? (
                <p className="empty-message">No medical records found</p>
              ) : (
                <div className="history-list">
                  {historyData.medicalRecords.slice(0, 3).map((record, index) => (
                    <div key={index} className="history-item">
                      <span className="date">{record.date}</span>
                      <span className="description">{record.diagnosis || 'General Checkup'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Login History */}
          <div className="history-card">
            <div className="history-header">
              <i className="bi bi-shield-lock"></i>
              <h4>Login History</h4>
              <span className="count-badge">{historyData.loginHistory.length}</span>
            </div>
            <div className="history-content">
              <div className="history-list">
                {historyData.loginHistory.map((login, index) => (
                  <div key={index} className="history-item">
                    <span className="date">{login.date} at {login.time}</span>
                    <span className="description">{login.device} - {login.location}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="data-management">
        <div className="alert alert-info">
          <i className="bi bi-info-circle"></i>
          <div>
            <strong>Data Management:</strong> You can export all your data or request data deletion 
            by contacting our support team. All data is stored securely and in compliance with healthcare regulations.
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="patient-records-container">
      {/* Tab Navigation */}
      <div className="records-tabs">
        <button 
          className={`tab-btn ${activeTab === 'customization' ? 'active' : ''}`}
          onClick={() => setActiveTab('customization')}
        >
          <i className="bi bi-palette"></i>
          Customization
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <i className="bi bi-clock-history"></i>
          History ({Object.values(historyData).flat().length} items)
        </button>
      </div>

      {/* Content Area */}
      <div className="records-content">
        {activeTab === 'customization' && renderCustomization()}
        {activeTab === 'history' && renderHistory()}
      </div>

      {/* Theme Loader */}
      <ThemeLoader
        isVisible={showThemeLoader}
        themeName={pendingTheme}
        onComplete={handleThemeChangeComplete}
      />
    </div>
  );
});

PatientSettings.displayName = 'PatientSettings';

PatientSettings.propTypes = {
  user: PropTypes.object,
  secureApiCall: PropTypes.func,
  onRefresh: PropTypes.func
};

export default PatientSettings;
