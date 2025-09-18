import React, { useState, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import '../styles/DoctorSidebar.css';

const DoctorSidebar = memo(({ 
  sidebarOpen, 
  toggleSidebar, 
  handleNavigation, 
  currentPath, 
  handleLogout, 
  sealmainImage,
  showFPSMonitor,
  handleFPSToggle,
  doctorQueueData,
  sharedCheckupsData
}) => {
  const [activeDropdown, setActiveDropdown] = useState(null);

  const handleDropdownToggle = useCallback((dropdown) => {
    if (activeDropdown === dropdown) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(dropdown);
    }
  }, [activeDropdown]);

  const handleNavigationClick = useCallback((path) => {
    handleNavigation(path);
  }, [handleNavigation]);

  // Get notification count for Quick View dropdown
  const getNotificationCount = () => {
    const queueCount = doctorQueueData?.length || 0;
    const checkupsCount = sharedCheckupsData?.length || 0;
    return queueCount + checkupsCount;
  };

  return (
    <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="doctor-logo-section">
          <img src={sealmainImage} alt="Health Center Seal" className="doctor-seal-image" />
          <h3 className="brand">
            <i className="bi bi-hospital"></i>
            <span className="text">Barangay Maybunga Healthcare</span>
          </h3>
        </div>
      </div>
      
      <div className="sidebar-menu">
        <ul>
          {/* Quick View Dropdown */}
          <li className={activeDropdown === 'quickview' ? 'dropdown active' : 'dropdown'}>
            <Link to="#" onClick={() => handleDropdownToggle('quickview')}>
              <i className="bi bi-eye-fill"></i>
              <span>Quick View</span>
              {getNotificationCount() > 0 && (
                <span className="notification-badge">
                  {getNotificationCount()}
                </span>
              )}
              <i className={`bi ${activeDropdown === 'quickview' ? 'bi-chevron-down' : 'bi-chevron-right'} dropdown-icon`}></i>
            </Link>
            <ul className={activeDropdown === 'quickview' ? 'dropdown-menu show' : 'dropdown-menu'}>
              <li onClick={() => handleNavigationClick('Patient Queue')}>
                <Link to="#">
                  <i className="bi bi-people"></i>
                  <span>Patient Queue</span>
                  {(doctorQueueData?.length || 0) > 0 && (
                    <span className="notification-badge">
                      {doctorQueueData?.length || 0}
                    </span>
                  )}
                </Link>
              </li>
              <li onClick={() => handleNavigationClick("Today's Checkup")}>
                <Link to="#">
                  <i className="bi bi-calendar-check"></i>
                  <span>Today's Checkup</span>
                  {(sharedCheckupsData?.length || 0) > 0 && (
                    <span className="notification-badge">
                      {sharedCheckupsData?.length || 0}
                    </span>
                  )}
                </Link>
              </li>
            </ul>
          </li>
          
          {/* Checkups */}
          <li className={currentPath === 'Checkups' ? 'active' : ''} onClick={() => handleNavigationClick('Checkups')}>
            <Link to="#">
              <i className="bi bi-clipboard-pulse"></i>
              <span>Checkups</span>
            </Link>
          </li>
          
          {/* Patient Database */}
          <li className={activeDropdown === 'patient' ? 'dropdown active' : 'dropdown'}>
            <Link to="#" onClick={() => handleDropdownToggle('patient')}>
              <i className="bi bi-people"></i>
              <span>Patient Database</span>
              <i className={`bi ${activeDropdown === 'patient' ? 'bi-chevron-down' : 'bi-chevron-right'} dropdown-icon`}></i>
            </Link>
            <ul className={activeDropdown === 'patient' ? 'dropdown-menu show' : 'dropdown-menu'}>
              <li onClick={() => handleNavigationClick('Patient Database')}>
                <Link to="#">
                  <i className="bi bi-archive"></i>
                  <span>View Records</span>
                </Link>
              </li>
            </ul>
          </li>
          
          {/* Appointments */}
          <li className={currentPath === 'Appointments' ? 'active' : ''} onClick={() => handleNavigationClick('Appointments')}>
            <Link to="#">
              <i className="bi bi-calendar-check"></i>
              <span>Appointments</span>
            </Link>
          </li>
          
          {/* Settings */}
          <li className={currentPath === 'Settings' ? 'active' : ''} onClick={() => handleNavigationClick('Settings')}>
            <Link to="#">
              <i className="bi bi-gear"></i>
              <span>Settings</span>
            </Link>
          </li>
        </ul>
      </div>

      {/* Footer Actions */}
      <div className="sidebar-footer">
        {/* Sidebar Toggle Button */}
        <div className="sidebar-toggle-section">
          <button 
            className="sidebar-toggle-btn" 
            onClick={toggleSidebar} 
            title={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
          >
            <i className={`bi ${sidebarOpen ? 'bi-chevron-left' : 'bi-list'}`}></i>
          </button>
        </div>

        {/* FPS Monitor Toggle */}
        <div className="fps-toggle-section">
          <button 
            className={`fps-toggle-btn ${showFPSMonitor ? 'active' : ''}`}
            onClick={handleFPSToggle}
            title={showFPSMonitor ? 'Hide Performance Monitor' : 'Show Performance Monitor'}
          >
            <i className={`bi ${showFPSMonitor ? 'bi-speedometer2' : 'bi-speedometer'}`}></i>
            <span>Performance</span>
          </button>
        </div>

        {/* Logout Button */}
        <div className="logout-section">
          <button className="logout-btn" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
});

export default DoctorSidebar;
