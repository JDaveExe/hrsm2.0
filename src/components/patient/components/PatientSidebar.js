import React, { useState, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import '../styles/PatientSidebar.css';

const PatientSidebar = memo(({ 
  sidebarOpen, 
  toggleSidebar, 
  handleNavigation, 
  currentPath, 
  handleLogout, 
  sealmainImage,
  showFPSMonitor,
  handleFPSToggle,
  user
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

  // Get user's notification count (appointments, messages, etc.)
  const getNotificationCount = () => {
    // This would be calculated from real data
    return 0; // Placeholder
  };

  return (
    <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="patient-logo-section">
          <img src={sealmainImage} alt="Health Center Seal" className="patient-seal-image" />
          <h3 className="brand">
            <i className="bi bi-hospital"></i>
            <span className="text">Barangay Maybunga Healthcare</span>
          </h3>
        </div>
      </div>
      
      <div className="sidebar-menu">
        <ul>
          {/* Appointments - Single Content (Default View) */}
          <li className={currentPath === 'Appointments' ? 'active' : ''} onClick={() => handleNavigationClick('Appointments')}>
            <Link to="#" aria-label="Appointments">
              <i className="bi bi-calendar-check"></i>
              <span>Appointments</span>
            </Link>
          </li>

          {/* Medical Records Dropdown - No History Items */}
          <li className={activeDropdown === 'medicalRecords' ? 'dropdown active' : 'dropdown'}>
            <Link to="#" onClick={() => handleDropdownToggle('medicalRecords')}>
              <i className="bi bi-folder-plus"></i>
              <span>Medical Records</span>
              <i className={`bi ${activeDropdown === 'medicalRecords' ? 'bi-chevron-down' : 'bi-chevron-right'} dropdown-icon`}></i>
            </Link>
            <ul className={activeDropdown === 'medicalRecords' ? 'dropdown-menu show' : 'dropdown-menu'}>
              <li onClick={() => handleNavigationClick('Treatment Records')}>
                <Link to="#" aria-label="Treatment Records">
                  <i className="bi bi-clipboard2-pulse"></i>
                  <span>Treatment Records</span>
                </Link>
              </li>
              <li onClick={() => handleNavigationClick('Dental Records')}>
                <Link to="#" aria-label="Dental Records">
                  <i className="bi bi-teeth"></i>
                  <span>Dental Records</span>
                </Link>
              </li>
              <li onClick={() => handleNavigationClick('Immunizations')}>
                <Link to="#" aria-label="Immunization Records">
                  <i className="bi bi-shield-plus"></i>
                  <span>Immunizations</span>
                </Link>
              </li>
              <li onClick={() => handleNavigationClick('Lab Results')}>
                <Link to="#" aria-label="Lab Results">
                  <i className="bi bi-file-earmark-medical"></i>
                  <span>Lab Results</span>
                </Link>
              </li>
            </ul>
          </li>

          {/* Prescriptions - Single Content with Tabs */}
          <li className={currentPath === 'Prescriptions' ? 'active' : ''} onClick={() => handleNavigationClick('Prescriptions')}>
            <Link to="#" aria-label="Prescriptions">
              <i className="bi bi-prescription2"></i>
              <span>Prescriptions</span>
            </Link>
          </li>

          {/* Health Tracking - Single Content with AI */}
          <li className={currentPath === 'Health Tracking' ? 'active' : ''} onClick={() => handleNavigationClick('Health Tracking')}>
            <Link to="#" aria-label="Health Tracking">
              <i className="bi bi-heart-pulse"></i>
              <span>Health Tracking</span>
            </Link>
          </li>

          {/* Communication Dropdown - Unchanged */}
          <li className={activeDropdown === 'communication' ? 'dropdown active' : 'dropdown'}>
            <Link to="#" onClick={() => handleDropdownToggle('communication')}>
              <i className="bi bi-chat-dots"></i>
              <span>Communication</span>
              {getNotificationCount() > 0 && (
                <span className="notification-badge">
                  {getNotificationCount()}
                </span>
              )}
              <i className={`bi ${activeDropdown === 'communication' ? 'bi-chevron-down' : 'bi-chevron-right'} dropdown-icon`}></i>
            </Link>
            <ul className={activeDropdown === 'communication' ? 'dropdown-menu show' : 'dropdown-menu'}>
              <li onClick={() => handleNavigationClick('Messages')}>
                <Link to="#" aria-label="Messages">
                  <i className="bi bi-envelope"></i>
                  <span>Messages</span>
                </Link>
              </li>
              <li onClick={() => handleNavigationClick('Notifications')}>
                <Link to="#" aria-label="Notifications">
                  <i className="bi bi-bell"></i>
                  <span>Notifications</span>
                </Link>
              </li>
              <li onClick={() => handleNavigationClick('Emergency Contact')}>
                <Link to="#" aria-label="Emergency Contact">
                  <i className="bi bi-telephone-plus"></i>
                  <span>Emergency Contact</span>
                </Link>
              </li>
            </ul>
          </li>

          {/* Settings Dropdown - New Structure */}
          <li className={activeDropdown === 'settings' ? 'dropdown active' : 'dropdown'}>
            <Link to="#" onClick={() => handleDropdownToggle('settings')}>
              <i className="bi bi-gear"></i>
              <span>Settings</span>
              <i className={`bi ${activeDropdown === 'settings' ? 'bi-chevron-down' : 'bi-chevron-right'} dropdown-icon`}></i>
            </Link>
            <ul className={activeDropdown === 'settings' ? 'dropdown-menu show' : 'dropdown-menu'}>
              <li onClick={() => handleNavigationClick('My Profile')}>
                <Link to="#" aria-label="My Profile">
                  <i className="bi bi-person-circle"></i>
                  <span>My Profile</span>
                </Link>
              </li>
              <li onClick={() => handleNavigationClick('History & Customizations')}>
                <Link to="#" aria-label="History & Customizations">
                  <i className="bi bi-clock-history"></i>
                  <span>History & Customizations</span>
                </Link>
              </li>
            </ul>
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
            aria-label={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
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
            aria-label={showFPSMonitor ? 'Hide Performance Monitor' : 'Show Performance Monitor'}
          >
            <i className={`bi ${showFPSMonitor ? 'bi-speedometer2' : 'bi-speedometer'}`}></i>
            <span>Performance</span>
          </button>
        </div>

        {/* Logout Button */}
        <div className="logout-section">
          <button 
            className="logout-btn" 
            onClick={handleLogout}
            aria-label="Logout"
          >
            <i className="bi bi-box-arrow-right"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
});

PatientSidebar.displayName = 'PatientSidebar';

PatientSidebar.propTypes = {
  sidebarOpen: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired,
  handleNavigation: PropTypes.func.isRequired,
  currentPath: PropTypes.string.isRequired,
  handleLogout: PropTypes.func.isRequired,
  sealmainImage: PropTypes.string,
  showFPSMonitor: PropTypes.bool,
  handleFPSToggle: PropTypes.func,
  user: PropTypes.object
};

export default PatientSidebar;
