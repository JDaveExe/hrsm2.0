import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import DoctorSidebar from './components/DoctorSidebar';
import DoctorHeader from './components/DoctorHeader';
import PatientQueue from './components/PatientQueue';
import TodaysCheckups from './components/TodaysCheckups';
import Checkups from './components/Checkups';
import PatientDatabase from './components/PatientDatabase';
import Appointments from './components/Appointments';
import DoctorSettings from './components/DoctorSettings';
import LoadingSpinnerDoc from './components/LoadingSpinnerDoc';
import { PerformanceIndicator } from '../../hooks/usePerformanceMonitor';
import axios from 'axios';
import './styles/DoctorLayout.css';
import sealmainImage from '../../images/sealmain.png';

const DoctorLayout = () => {
  const { user, logout } = useAuth();
  const { 
    doctorQueueData,
    sharedCheckupsData,
    updateDoctorQueueStatus,
    completeDoctorSession,
    syncCheckupStatus,
    patientsData,
    familiesData,
    forceRefreshAllData
  } = useData();

  // Layout state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPath, setCurrentPath] = useState('Patient Queue');
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
      case 'Patient Queue':
        return <PatientQueue 
          {...componentProps}
          onNavigate={handleNavigation}
        />;
      case "Today's Checkup":
        return <TodaysCheckups 
          {...componentProps}
        />;
      case 'Checkups':
        return <Checkups 
          {...componentProps}
        />;
      case 'Patient Database':
        return <PatientDatabase 
          {...componentProps}
          patientsData={patientsData}
          familiesData={familiesData}
        />;
      case 'Appointments':
        return <Appointments {...componentProps} />;
      case 'Settings':
        return <DoctorSettings {...componentProps} />;
      default:
        return <PatientQueue 
          {...componentProps}
        />;
    }
  }, [
    currentPath, 
    currentDateTime, 
    user, 
    isLoading, 
    secureApiCall, 
    cache, 
    handleRefreshData,
    patientsData,
    familiesData
  ]);

  return (
    <div className="doctor-layout">
      {/* Performance Monitor */}
      {showFPSMonitor && <PerformanceIndicator />}

      {/* Sidebar */}
      <DoctorSidebar
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        handleNavigation={handleNavigation}
        currentPath={currentPath}
        handleLogout={handleLogout}
        sealmainImage={sealmainImage}
        showFPSMonitor={showFPSMonitor}
        handleFPSToggle={handleFPSToggle}
      />

      {/* Main Content Area */}
      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* Header */}
        <DoctorHeader
          user={user}
          currentDateTime={currentDateTime}
          currentPath={currentPath}
          onRefresh={handleRefreshData}
          isLoading={isLoading}
        />

        {/* Content Area */}
        <div className="content-area">
          {isLoading ? (
            <LoadingSpinnerDoc />
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

export default DoctorLayout;
