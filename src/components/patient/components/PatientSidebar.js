import React, { useState, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import ComingSoonModal from './ComingSoonModal';
import '../styles/PatientSidebar.css';

const PatientSidebar = memo(({ 
  sidebarOpen, 
  toggleSidebar, 
  handleNavigation, 
  currentPath, 
  handleLogout, 
  sealmainImage,
  user
}) => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [modalFeatureName, setModalFeatureName] = useState('');

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

          {/* Medical Records Dropdown */}
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
              <li onClick={() => handleNavigationClick('Immunizations')}>
                <Link to="#" aria-label="Immunization Records">
                  <i className="bi bi-shield-plus"></i>
                  <span>Immunizations</span>
                </Link>
              </li>
              {/* Lab Results - Temporarily removed for update */}
              {/* Will be re-enabled after lab referral system improvements */}
            </ul>
          </li>

          {/* Prescriptions - Single Content with Tabs */}
          <li className={currentPath === 'Prescriptions' ? 'active' : ''} onClick={() => handleNavigationClick('Prescriptions')}>
            <Link to="#" aria-label="Prescriptions">
              <i className="bi bi-prescription2"></i>
              <span>Prescriptions</span>
            </Link>
          </li>

          {/* Health Stock - Available Medications & Vaccines */}
          <li className={currentPath === 'Health Stock' ? 'active' : ''} onClick={() => handleNavigationClick('Health Stock')}>
            <Link to="#" aria-label="Health Stock">
              <i className="bi bi-heart-pulse"></i>
              <span>Health Stock</span>
            </Link>
          </li>

          {/* Settings Dropdown - Simplified */}
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
              {/* Login History - Temporarily removed for update */}
              {/* Will be re-enabled after login history system improvements */}
            </ul>
          </li>
        </ul>
      </div>

      {/* Footer Actions */}
      <div className="sidebar-footer">
        {/* Sidebar Toggle Button */}
        <div className="sidebar-toggle-section">
          <button 
            className="sidebar-toggle-btn bordered-btn" 
            onClick={toggleSidebar} 
            title={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
            aria-label={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
          >
            <i className={`bi ${sidebarOpen ? 'bi-chevron-left' : 'bi-list'}`}></i>
            <span>{sidebarOpen ? 'Collapse' : 'Expand'}</span>
          </button>
        </div>

        {/* Logout Button */}
        <div className="logout-section">
          <button 
            className="logout-btn bordered-btn" 
            onClick={handleLogout}
            aria-label="Logout"
          >
            <i className="bi bi-box-arrow-right"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
      
      {/* Coming Soon Modal */}
      <ComingSoonModal 
        isOpen={showComingSoonModal}
        onClose={() => setShowComingSoonModal(false)}
        featureName={modalFeatureName}
      />
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
  user: PropTypes.object
};

export default PatientSidebar;
