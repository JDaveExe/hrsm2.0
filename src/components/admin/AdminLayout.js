import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import AdminSidebar from './components/AdminSidebar';
import DashboardStats from './components/DashboardStats';
import UserManagement from './components/UserManagement';
import PatientManagement from './components/PatientManagement';
import AppointmentManager from './components/AppointmentManager';
import VitalSignsManager from './components/VitalSignsManager';
import SystemSettings from './components/SystemSettings';
import LoadingSpinner from './components/LoadingSpinner';
import SimulationMode from './components/SimulationMode';
import CheckupManager from './components/CheckupManager';
import BackupManager from './components/BackupManager';
import ResetCheckupDataModal from './components/ResetCheckupDataModal';
import { PerformanceIndicator } from '../../hooks/usePerformanceMonitor';
import './styles/AdminLayout.css';
import './styles/AdminModals.css';
import sealmainImage from '../../images/sealmain.png';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const { 
    simulationModeStatus,
    updateSimulationMode,
    disableSimulationMode,
    forceRefreshAllData
  } = useData();

  // Layout state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPath, setCurrentPath] = useState('Dashboard');
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [showFPSMonitor, setShowFPSMonitor] = useState(false);
  const [showResetCheckupModal, setShowResetCheckupModal] = useState(false);
  
  // Notification state
  const [pendingNotifications, setPendingNotifications] = useState([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Update time every second (real or simulated)
  useEffect(() => {
    const interval = setInterval(() => {
      if (simulationModeStatus?.enabled && simulationModeStatus?.currentSimulatedDate) {
        // Use simulated time - update by keeping the time flowing
        const simulatedDate = new Date(simulationModeStatus.currentSimulatedDate);
        const now = new Date();
        const timeDifference = now.getTime() - new Date(simulationModeStatus.activatedAt || now).getTime();
        const currentSimulatedTime = new Date(simulatedDate.getTime() + timeDifference);
        setCurrentDateTime(currentSimulatedTime);
      } else {
        // Use real time
        setCurrentDateTime(new Date());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [simulationModeStatus?.enabled, simulationModeStatus?.currentSimulatedDate, simulationModeStatus?.activatedAt]);

  // Navigation handler with loading state
  const handleNavigation = useCallback((path, tabToActivate = null) => {
    // Handle special navigation cases
    if (path === 'Simulation Mode') {
      setShowSimulationModal(true);
      return;
    }
    
    setIsLoading(true);
    setCurrentPath(path);
    
    // If a specific tab needs to be activated, save it in session storage
    if (tabToActivate) {
      sessionStorage.setItem('activeTab', tabToActivate);
    } else {
      sessionStorage.removeItem('activeTab');
    }
    
    // Simulate navigation delay for large components
    setTimeout(() => {
      setIsLoading(false);
    }, 100);
  }, []);
  
  // Expose navigation function globally for components to use
  useEffect(() => {
    window.navigateToPatientDatabase = (path, tab) => {
      handleNavigation(path, tab);
    };
    
    return () => {
      delete window.navigateToPatientDatabase;
    };
  }, [handleNavigation]);

  // Load notifications from localStorage
  useEffect(() => {
    const loadNotifications = () => {
      try {
        const stored = localStorage.getItem('admin_notifications');
        const notifications = stored ? JSON.parse(stored) : [];
        
        // Filter only pending notifications that need acceptance
        const pending = notifications.filter(notif => 
          notif.type === 'appointment_scheduled' && 
          notif.status === 'pending' &&
          notif.needsAcceptance
        );
        
        setPendingNotifications(pending);
      } catch (error) {
        console.error('Error loading notifications:', error);
        setPendingNotifications([]);
      }
    };

    loadNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle notification acceptance
  const handleAcceptNotification = useCallback((notificationId) => {
    try {
      const stored = localStorage.getItem('admin_notifications');
      const notifications = stored ? JSON.parse(stored) : [];
      
      // Update notification status
      const updated = notifications.map(notif => 
        notif.id === notificationId 
          ? { ...notif, status: 'accepted', acceptedAt: new Date().toISOString() }
          : notif
      );
      
      localStorage.setItem('admin_notifications', JSON.stringify(updated));
      
      // Remove from pending notifications
      setPendingNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
      // Show success message
      console.log('Appointment notification accepted');
      
    } catch (error) {
      console.error('Error accepting notification:', error);
    }
  }, []);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  // Refresh data function
  const handleRefreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Refreshing all data...');
      const success = await forceRefreshAllData();
      if (success) {
        console.log('✅ Data refreshed successfully at:', new Date().toLocaleString());
      } else {
        console.error('❌ Failed to refresh data');
      }
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [forceRefreshAllData]);

  // Logout handler
  const handleLogout = useCallback(() => {
    setShowLogoutModal(true);
  }, []);

  // Simulation mode handlers
  const handleSimulationToggle = useCallback(async () => {
    try {
      if (simulationModeStatus?.enabled) {
        disableSimulationMode();
      } else {
        const defaultSettings = {
          enabled: true,
          currentSimulatedDate: new Date(),
          smsSimulation: true,
          emailSimulation: true,
          dataSimulation: false,
          chartSimulation: false
        };
        updateSimulationMode(defaultSettings, user?.username || 'admin');
      }
    } catch (error) {
      console.error('Error toggling simulation mode:', error);
    }
  }, [simulationModeStatus?.enabled, updateSimulationMode, disableSimulationMode, user]);

  const handleSimulationUpdate = useCallback(async (settings) => {
    try {
      if (settings.enabled) {
        const simulationData = {
          enabled: settings.enabled,
          currentSimulatedDate: new Date(settings.simulatedDateTime),
          smsSimulation: settings.mockSmsService,
          emailSimulation: settings.mockEmailService,
          dataSimulation: settings.autoGenerateTestData,
          chartSimulation: settings.chartSimulation
        };
        updateSimulationMode(simulationData, user?.username || 'admin');
      } else {
        disableSimulationMode();
      }
    } catch (error) {
      console.error('Error updating simulation settings:', error);
    }
  }, [updateSimulationMode, disableSimulationMode, user]);

  // Reset checkup data handler
  const handleResetCheckupData = useCallback(() => {
    setShowResetCheckupModal(true);
  }, []);

  // Handle FPS monitor toggle
  const handleFPSToggle = useCallback(() => {
    setShowFPSMonitor(prev => !prev);
    // Save to localStorage for persistence
    localStorage.setItem('showFPSMonitor', (!showFPSMonitor).toString());
  }, [showFPSMonitor]);

  // Load FPS monitor setting from localStorage on mount
  useEffect(() => {
    const savedFPSMonitor = localStorage.getItem('showFPSMonitor');
    if (savedFPSMonitor === 'true') {
      setShowFPSMonitor(true);
    }
  }, []);

  // Memoized current component based on path
  const CurrentComponent = useMemo(() => {
    switch (currentPath) {
      case 'Dashboard':
        return DashboardStats;
      case 'Checkup':
        return CheckupManager;
      case 'User Management':
        return UserManagement;
      case 'Patient Database':
      case 'Patient Management':
        return PatientManagement;
      case 'Appointment Scheduling':
        return AppointmentManager;
      case 'Vital Signs':
        return VitalSignsManager;
      case 'System Settings':
        return SystemSettings;
      case 'Backup & Restore':
        return BackupManager;
      default:
        return DashboardStats;
    }
  }, [currentPath]);

  // Early return for unauthorized users
  if (!user) {
    return (
      <div className="admin-unauthorized">
        <div className="unauthorized-content">
          <i className="bi bi-shield-exclamation"></i>
          <h3>Access Denied</h3>
          <p>You need to be logged in to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-wrapper">
      {/* Sidebar */}
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        handleNavigation={handleNavigation}
        currentPath={currentPath}
        handleLogout={handleLogout}
        simulationMode={simulationModeStatus}
        handleSimulationToggle={handleSimulationToggle}
        handleResetCheckupData={handleResetCheckupData}
        sealmainImage={sealmainImage}
        showFPSMonitor={showFPSMonitor}
        handleFPSToggle={handleFPSToggle}
      />

        {/* Main Content */}
        <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          {/* Topbar with breadcrumb navigation */}
          <div className="topbar">
            <div className="path-info">
              <span>YOU ARE HERE</span>
              <i className="bi bi-chevron-right"></i>
              <span>{currentPath}</span>
              {currentPath === 'Dashboard' && (
                <>
                  <i className="bi bi-chevron-right"></i>
                  <span>Analytics</span>
                </>
              )}
            </div>
            
            <div className="user-info">
              <div className="date-time">
                <span>{currentDateTime.toLocaleString()}</span>
                {simulationModeStatus?.enabled && (
                  <span className="simulation-indicator">
                    <i className="bi bi-lightning-charge me-1"></i>
                    Simulating
                  </span>
                )}
                <PerformanceIndicator show={showFPSMonitor} />
              </div>
              
              {/* Notification Bell */}
              <div className="notification-container">
                <button 
                  className="notification-bell"
                  onClick={() => setShowNotificationModal(!showNotificationModal)}
                  title="Notifications"
                >
                  <i className="bi bi-bell"></i>
                  {pendingNotifications.length > 0 && (
                    <span className="notification-badge">{pendingNotifications.length}</span>
                  )}
                </button>
                
                {/* Notification Tooltip */}
                {pendingNotifications.length > 0 && !showNotificationModal && (
                  <div className="notification-tooltip">
                    You have {pendingNotifications.length} notification{pendingNotifications.length > 1 ? 's' : ''}
                  </div>
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
            </div>
          </div>

          {/* Content Header with actions */}
          <div className="content-header">
            <h1>
              <i className="bi bi-speedometer2"></i>
              {currentPath}
            </h1>
            {currentPath === 'Dashboard' && (
              <button className="refresh-btn" onClick={handleRefreshData}>
                <i className="bi bi-arrow-clockwise"></i>
                Refresh Data
              </button>
            )}
          </div>

          {/* Content Area */}
          <div className="content-area">
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <CurrentComponent
                currentPath={currentPath}
                currentDateTime={currentDateTime}
                simulationMode={simulationModeStatus}
              />
            )}
          </div>
        </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="admin-modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="admin-modal-content" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h4>Confirm Logout</h4>
              <button className="admin-modal-close-btn" onClick={() => setShowLogoutModal(false)}>
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div className="admin-modal-body">
              <p>Are you sure you want to logout?</p>
            </div>
            <div className="admin-modal-footer">
              <button 
                className="admin-modal-btn admin-modal-btn-secondary" 
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button 
                className="admin-modal-btn admin-modal-btn-danger"
                onClick={() => {
                  logout();
                  setShowLogoutModal(false);
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Mode Modal */}
      <SimulationMode
        show={showSimulationModal}
        onHide={() => setShowSimulationModal(false)}
        simulationMode={simulationModeStatus}
        onSimulationToggle={handleSimulationToggle}
        onSimulationUpdate={handleSimulationUpdate}
      />

      {/* Reset Checkup Data Modal */}
      <ResetCheckupDataModal
        show={showResetCheckupModal}
        onClose={() => setShowResetCheckupModal(false)}
      />

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="admin-modal-overlay" onClick={() => setShowNotificationModal(false)}>
          <div className="notification-modal" onClick={e => e.stopPropagation()}>
            <div className="notification-modal-header">
              <h4>
                <i className="bi bi-bell me-2"></i>
                Notifications ({pendingNotifications.length})
              </h4>
              <button className="admin-modal-close-btn" onClick={() => setShowNotificationModal(false)}>
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div className="notification-modal-body">
              {pendingNotifications.length === 0 ? (
                <div className="no-notifications">
                  <i className="bi bi-bell-slash"></i>
                  <p>No pending notifications</p>
                </div>
              ) : (
                <div className="notifications-list">
                  {pendingNotifications.map(notification => (
                    <div key={notification.id} className="notification-item">
                      <div className="notification-content">
                        <div className="notification-header">
                          <i className="bi bi-calendar-check text-primary"></i>
                          <span className="notification-title">Appointment Scheduled</span>
                          <small className="notification-time">
                            {new Date(notification.createdAt).toLocaleString()}
                          </small>
                        </div>
                        <div className="notification-details">
                          <p><strong>Patient:</strong> {notification.patientName}</p>
                          <p><strong>Date:</strong> {notification.appointmentDate} at {notification.appointmentTime}</p>
                          <p><strong>Type:</strong> {notification.appointmentType}</p>
                          {notification.notes && <p><strong>Notes:</strong> {notification.notes}</p>}
                        </div>
                      </div>
                      <div className="notification-actions">
                        <button 
                          className="btn btn-success btn-sm"
                          onClick={() => handleAcceptNotification(notification.id)}
                        >
                          <i className="bi bi-check-circle me-1"></i>
                          Accept
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
