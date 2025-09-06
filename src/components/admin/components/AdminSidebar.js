import React, { useState, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import '../styles/AdminSidebar.css';

const AdminSidebar = memo(({ 
  sidebarOpen, 
  toggleSidebar, 
  handleNavigation, 
  currentPath, 
  handleLogout, 
  simulationMode, 
  handleSimulationToggle,
  sealmainImage,
  showFPSMonitor,
  handleFPSToggle
}) => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [activeSubDropdown, setActiveSubDropdown] = useState(null);

  const handleDropdownToggle = useCallback((dropdown) => {
    if (activeDropdown === dropdown) {
      setActiveDropdown(null);
      setActiveSubDropdown(null);
    } else {
      setActiveDropdown(dropdown);
      if (dropdown !== 'settings') {
        setActiveSubDropdown(null);
      }
    }
  }, [activeDropdown]);

  const handleSubDropdownToggle = useCallback((subDropdown, event) => {
    event.stopPropagation();
    if (activeSubDropdown === subDropdown) {
      setActiveSubDropdown(null);
    } else {
      setActiveSubDropdown(subDropdown);
    }
  }, [activeSubDropdown]);

  const handleNavigationClick = useCallback((path) => {
    handleNavigation(path);
  }, [handleNavigation]);

  return (
    <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="admin-logo-section">
          <img src={sealmainImage} alt="Health Center Seal" className="admin-seal-image" />
          <h3 className="brand">
            <i className="bi bi-hospital"></i>
            <span className="text">Barangay Maybunga Healthcare</span>
          </h3>
        </div>
      </div>
      
      <div className="sidebar-menu">
        <ul>
          <li className={currentPath === 'Dashboard' ? 'active' : ''} onClick={() => handleNavigationClick('Dashboard')}>
            <Link to="#">
              <i className="bi bi-speedometer2"></i>
              <span>Dashboard</span>
            </Link>
          </li>
          
          <li className={currentPath === 'Checkup' ? 'active' : ''} onClick={() => handleNavigationClick('Checkup')}>
            <Link to="#">
              <i className="bi bi-clipboard-check"></i>
              <span>Today's Checkup</span>
            </Link>
          </li>
          
          <li className={activeDropdown === 'patient' ? 'dropdown active' : 'dropdown'}>
            <Link to="#" onClick={() => handleDropdownToggle('patient')}>
              <i className="bi bi-people"></i>
              <span>Patient Management</span>
              <i className={`bi ${activeDropdown === 'patient' ? 'bi-chevron-down' : 'bi-chevron-right'} dropdown-icon`}></i>
            </Link>
            <ul className={activeDropdown === 'patient' ? 'dropdown-menu show' : 'dropdown-menu'}>
              <li onClick={() => handleNavigationClick('Patient Database')}>
                <Link to="#">
                  <i className="bi bi-archive"></i>
                  <span>Patient Database</span>
                </Link>
              </li>
            </ul>
          </li>
          
          <li className={currentPath === 'Generate Reports' ? 'active' : ''} onClick={() => handleNavigationClick('Generate Reports')}>
            <Link to="#">
              <i className="bi bi-file-earmark-bar-graph"></i>
              <span>Reports</span>
            </Link>
          </li>
          
          <li className={currentPath === 'Appointment Scheduling' ? 'active' : ''} onClick={() => handleNavigationClick('Appointment Scheduling')}>
            <Link to="#">
              <i className="bi bi-calendar-check"></i>
              <span>Appointments</span>
            </Link>
          </li>
          
          <li onClick={() => handleNavigationClick('Inventory')}>
            <Link to="#">
              <i className="bi bi-box-seam"></i>
              <span>Inventory</span>
            </Link>
          </li>
          
          <li className={activeDropdown === 'settings' ? 'dropdown active' : 'dropdown'}>
            <Link to="#" onClick={() => handleDropdownToggle('settings')}>
              <i className="bi bi-gear"></i>
              <span>Settings</span>
              <i className={`bi ${activeDropdown === 'settings' ? 'bi-chevron-down' : 'bi-chevron-right'} dropdown-icon`}></i>
            </Link>
            <ul className={activeDropdown === 'settings' ? 'dropdown-menu show' : 'dropdown-menu'}>
              <li onClick={() => handleNavigationClick('User Management')}>
                <Link to="#">
                  <i className="bi bi-people-fill"></i>
                  <span>User Management</span>
                </Link>
              </li>
              <li className={activeSubDropdown === 'systemConfig' ? 'dropdown active' : 'dropdown'}>
                <Link to="#" onClick={(e) => { e.stopPropagation(); handleSubDropdownToggle('systemConfig', e); }}>
                  <i className="bi bi-sliders"></i>
                  <span>System Config</span>
                  <i className={`bi ${activeSubDropdown === 'systemConfig' ? 'bi-chevron-down' : 'bi-chevron-right'} dropdown-icon`}></i>
                </Link>
                <ul className={activeSubDropdown === 'systemConfig' ? 'dropdown-menu show' : 'dropdown-menu'}>
                  <li onClick={() => handleNavigationClick('Simulation Mode')}>
                    <Link to="#">
                      <i className="bi bi-play-circle"></i>
                      <span>Simulation Mode</span>
                    </Link>
                  </li>
                  <li onClick={() => handleNavigationClick('Data Retention')}>
                    <Link to="#">
                      <i className="bi bi-archive"></i>
                      <span>Data Retention</span>
                    </Link>
                  </li>
                  <li onClick={() => handleNavigationClick('Reset Checkup Data')}>
                    <Link to="#">
                      <i className="bi bi-arrow-clockwise"></i>
                      <span>Reset Checkup Data</span>
                    </Link>
                  </li>
                  <li onClick={(e) => { e.stopPropagation(); handleFPSToggle(); }}>
                    <Link to="#" className="fps-toggle-item">
                      <i className={`bi ${showFPSMonitor ? 'bi-speedometer2' : 'bi-speedometer'}`}></i>
                      <span>FPS Monitor</span>
                      <div className={`toggle-switch ${showFPSMonitor ? 'active' : ''}`}>
                        <div className="toggle-slider"></div>
                      </div>
                    </Link>
                  </li>
                </ul>
              </li>
              <li onClick={() => handleNavigationClick('Backup & Restore')}>
                <Link to="#">
                  <i className="bi bi-cloud-download"></i>
                  <span>Backup & Restore</span>
                </Link>
              </li>
            </ul>
          </li>
        </ul>
      </div>

      {/* Sidebar Toggle Button */}
      <div className="sidebar-toggle-section">
        <button className="sidebar-toggle-btn" onClick={toggleSidebar} title={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}>
          <i className={`bi ${sidebarOpen ? 'bi-chevron-left' : 'bi-list'}`}></i>
        </button>
      </div>

      {simulationMode?.isEnabled && (
        <div className="simulation-mode-indicator">
          <div className="simulation-status">
            <i className="bi bi-flask text-warning"></i>
            <span className="link_name">Simulation Active</span>
            <button 
              className="btn btn-sm btn-outline-warning"
              onClick={handleSimulationToggle}
              title="Disable Simulation Mode"
            >
              <i className="bi bi-x"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

AdminSidebar.displayName = 'AdminSidebar';

export default AdminSidebar;
