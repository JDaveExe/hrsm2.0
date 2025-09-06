import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import PatientSidebar from './components/PatientSidebar';
import PatientHeader from './components/PatientHeader';
import PatientProfile from './components/PatientProfile';
import PatientAppointments from './components/PatientAppointments';
import PatientMedicalRecords from './components/PatientMedicalRecords';
import PatientPrescriptions from './components/PatientPrescriptions';
import PatientHealthTracking from './components/PatientHealthTracking';
import PatientCommunication from './components/PatientCommunication';
import PatientSettings from './components/PatientSettings';
import LoadingSpinnerPatient from './components/LoadingSpinnerPatient';
import { PerformanceIndicator } from '../../hooks/usePerformanceMonitor';
import axios from 'axios';
import './styles/PatientLayout.css';
import sealmainImage from '../../images/sealmain.png';

const PatientLayout = () => {
  const { user, logout } = useAuth();
  const { 
    patientsData,
    familiesData,
    forceRefreshAllData
  } = useData();

  // Layout state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPath, setCurrentPath] = useState('Appointments');
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showFPSMonitor, setShowFPSMonitor] = useState(false);

  // Cache management state for security
  const [cache, setCache] = useState(new Map());
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-refresh logic for cache invalidation
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastRefresh > CACHE_DURATION) {
        handleRefreshData();
      }
    }, CACHE_DURATION);

    return () => clearInterval(interval);
  }, [lastRefresh]);

  // Secure API calls with axios
  const secureApiCall = useCallback(async (endpoint, options = {}) => {
    try {
      const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
      const cachedData = cache.get(cacheKey);
      
      if (cachedData && (Date.now() - cachedData.timestamp < CACHE_DURATION)) {
        return cachedData.data;
      }

      const response = await axios({
        url: `http://localhost:5000${endpoint}`,
        method: options.method || 'GET',
        data: options.data,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token || ''}`
        },
        timeout: 10000, // 10 second timeout
        ...options
      });

      // Cache the response
      const newCache = new Map(cache);
      newCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
      setCache(newCache);

      return response.data;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }, [cache, user?.token]);

  // Handle sidebar toggle
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  // Handle navigation
  const handleNavigation = useCallback((path) => {
    setCurrentPath(path);
  }, []);

  // Handle logout
  const handleLogout = useCallback(() => {
    setShowLogoutModal(true);
  }, []);

  const confirmLogout = useCallback(() => {
    // Clear cache on logout for security
    setCache(new Map());
    logout();
  }, [logout]);

  // Handle data refresh
  const handleRefreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Clear cache to force fresh data
      setCache(new Map());
      setLastRefresh(Date.now());
      await forceRefreshAllData();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [forceRefreshAllData]);

  // Handle FPS monitor toggle
  const handleFPSToggle = useCallback(() => {
    setShowFPSMonitor(prev => !prev);
  }, []);

  // Current component renderer with optimized structure
  const CurrentComponent = useMemo(() => {
    const componentProps = {
      currentDateTime,
      user,
      isLoading,
      secureApiCall,
      cache,
      onRefresh: handleRefreshData
    };

    switch (currentPath) {
      case 'My Profile':
        return <PatientProfile 
          {...componentProps}
          onNavigate={handleNavigation}
        />;
      case 'Appointments':
      case 'Upcoming Appointments':
      case 'Appointment History':
      case 'Book Appointment':
        return <PatientAppointments 
          {...componentProps}
          viewType={currentPath}
        />;
      case 'Treatment Records':
      case 'Dental Records':
      case 'Immunizations':
      case 'Lab Results':
      case 'Treatment Record':
      case 'Dental Record':
      case 'Immunization Record':
        return <PatientMedicalRecords 
          {...componentProps}
          recordType={currentPath}
        />;
      case 'Prescriptions':
      case 'Active Prescriptions':
      case 'Prescriptions History':
      case 'Medication Reminders':
        return <PatientPrescriptions 
          {...componentProps}
          viewType={currentPath}
        />;
      case 'Health Tracking':
      case 'Vital Signs':
      case 'Health Goals':
      case 'Symptoms Tracker':
        return <PatientHealthTracking 
          {...componentProps}
          trackingType={currentPath}
        />;
      case 'Messages':
      case 'Notifications':
      case 'Emergency Contact':
        return <PatientCommunication 
          {...componentProps}
          communicationType={currentPath}
        />;
      case 'Settings':
      case 'History & Customizations':
        return <PatientSettings {...componentProps} />;
      default:
        return <PatientAppointments 
          {...componentProps}
          viewType="Appointments"
        />;
    }
  }, [
    currentPath, 
    currentDateTime, 
    user, 
    isLoading, 
    secureApiCall, 
    cache, 
    handleRefreshData
  ]);

  return (
    <div className="patient-layout">
      {/* Performance Monitor */}
      {showFPSMonitor && <PerformanceIndicator />}

      {/* Sidebar */}
      <PatientSidebar
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        handleNavigation={handleNavigation}
        currentPath={currentPath}
        handleLogout={handleLogout}
        sealmainImage={sealmainImage}
        showFPSMonitor={showFPSMonitor}
        handleFPSToggle={handleFPSToggle}
        user={user}
      />

      {/* Main Content Area */}
      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* Header */}
        <PatientHeader
          user={user}
          currentDateTime={currentDateTime}
          currentPath={currentPath}
          onRefresh={handleRefreshData}
          isLoading={isLoading}
        />

        {/* Content Area */}
        <div className="content-area">
          {isLoading ? (
            <LoadingSpinnerPatient />
          ) : (
            CurrentComponent
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-small">
            <div className="modal-header">
              <h3>Confirm Logout</h3>
              <button 
                className="close-btn" 
                onClick={() => setShowLogoutModal(false)}
                aria-label="Close modal"
              >
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to logout?</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={confirmLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientLayout;
