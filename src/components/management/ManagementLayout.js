import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import ManagementSidebar from './components/ManagementSidebar';
import InventoryManagement from './components/InventoryManagement';
import ReportsManager from './components/ReportsManager';
import HealthcareInsights from './components/HealthcareInsights';
import ManagementAuditTrail from './components/ManagementAuditTrail';
import ManagementProfile from './components/ManagementProfile';
import LoadingManagementBar from './LoadingManagementBar';
import './styles/ManagementLayout.css';
import sealmainImage from '../../images/sealmain.png';

const ManagementLayout = () => {
  const { user, logout } = useAuth();
  const { refreshAllData, isLoading: dataLoading } = useData();
  
  // Layout state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPath, setCurrentPath] = useState('Inventory Management');
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  // Sidebar toggle handler
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  // Navigation handler
  const handleNavigation = useCallback((path) => {
    setCurrentPath(path);
  }, []);

  // Navigation handler for custom reports (navigate to Reports page)
  const handleNavigateToReports = useCallback(() => {
    setCurrentPath('Reports');
  }, []);

  // Logout handler
  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  // Data refresh handler
  const handleRefreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      await refreshAllData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [refreshAllData]);

  // Update current date/time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Listen for navigation events from child components
  useEffect(() => {
    const handleNavigateToReports = (event) => {
      console.log('📍 Navigation event received:', event.detail);
      setCurrentPath('Reports');
    };

    window.addEventListener('navigateToReports', handleNavigateToReports);
    
    return () => {
      window.removeEventListener('navigateToReports', handleNavigateToReports);
    };
  }, []);

  // Component renderer
  const renderContent = useMemo(() => {
    const componentProps = {
      currentPath,
      currentDateTime,
      isDarkMode: false,
      inventoryFilter: null
    };

    switch (currentPath) {
      case 'Inventory Management':
        return <InventoryManagement {...componentProps} onNavigateToReports={handleNavigateToReports} />;
      case 'Reports':
        return <ReportsManager {...componentProps} />;
      case 'Healthcare Insights':
        return <HealthcareInsights {...componentProps} onNavigateToReports={handleNavigateToReports} />;
      case 'Audit Trail':
        return <ManagementAuditTrail user={user} />;
      case 'My Profile':
        return <ManagementProfile user={user} />;
      default:
        return <InventoryManagement {...componentProps} onNavigateToReports={handleNavigateToReports} />;
    }
  }, [currentPath]);

  // Early return for unauthorized users
  if (!user) {
    return (
      <div className="management-unauthorized">
        <div className="unauthorized-content">
          <i className="bi bi-shield-exclamation"></i>
          <h3>Access Denied</h3>
          <p>You need to be logged in to access the management dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="management-dashboard-wrapper">
      {/* Sidebar */}
      <ManagementSidebar
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        handleNavigation={handleNavigation}
        currentPath={currentPath}
        handleLogout={handleLogout}
        sealmainImage={sealmainImage}
      />

      {/* Main Content */}
      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* Topbar with breadcrumb navigation */}
        <div className="topbar">
          <div className="path-info">
            <span>MANAGEMENT</span>
            <i className="bi bi-chevron-right"></i>
            <span>{currentPath}</span>
          </div>
          
          <div className="user-info">
            <button className="refresh-btn" onClick={handleRefreshData}>
              <i className="bi bi-arrow-clockwise"></i>
              Refresh Data
            </button>
            <div className="date-time">
              <span>{currentDateTime.toLocaleString()}</span>
            </div>
            <div className="user">
              <span className="user-name">
                {user ? `${user.firstName} ${user.lastName}` : 'Management User'}
              </span>
              <div className="user-avatar">
                <i className="bi bi-person-circle"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Content Header */}
        <div className="content-header">
          <h1>
            <i className="bi bi-graph-up-arrow"></i>
            {currentPath}
          </h1>
        </div>

        {/* Content Area */}
        <div className="content-area">
          {isLoading || dataLoading ? (
            <LoadingManagementBar message="Loading management data..." />
          ) : (
            renderContent
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagementLayout;