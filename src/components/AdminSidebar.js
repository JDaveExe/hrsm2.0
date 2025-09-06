import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/AdminSidebar.css';
import sealmainImage from '../images/sealmain.png';

const AdminSidebar = ({ sidebarOpen, toggleSidebar, handleNavigation, currentPath, handleLogout, simulationMode, handleSimulationToggle }) => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [activeSubDropdown, setActiveSubDropdown] = useState(null);

  const handleDropdownToggle = (dropdown) => {
    if (activeDropdown === dropdown) {
      setActiveDropdown(null);
      setActiveSubDropdown(null);
    } else {
      setActiveDropdown(dropdown);
      setActiveSubDropdown(null);
    }
  };

  const handleSubDropdownToggle = (subDropdown, event) => {
    event.stopPropagation();
    if (activeSubDropdown === subDropdown) {
      setActiveSubDropdown(null);
    } else {
      setActiveSubDropdown(subDropdown);
    }
  };

  return (
    <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="logo-details">
        <img src={sealmainImage} alt="Seal" className="seal-image" />
        <span className="logo_name">HRMS</span>
      </div>
      <div className="profile-details">
        <div className="profile-content">
          <i className="bi bi-person-circle"></i>
        </div>
        <div className="name-job">
          <div className="profile_name">Admin</div>
          <div className="job">System Admin</div>
        </div>
        <i className="bi bi-box-arrow-left" onClick={handleLogout}></i>
      </div>
      <ul className="nav-links">
        <li>
          <Link to="#" onClick={() => handleNavigation('Dashboard')} className={currentPath === 'Dashboard' ? 'active' : ''}>
            <i className="bi bi-grid-1x2"></i>
            <span className="link_name">Dashboard</span>
          </Link>
          <ul className="sub-menu blank">
            <li><Link to="#" className="link_name" onClick={() => handleNavigation('Dashboard')}>Dashboard</Link></li>
          </ul>
        </li>
        <li>
          <Link to="#" onClick={() => handleNavigation('Checkup')} className={currentPath === 'Checkup' ? 'active' : ''}>
            <i className="bi bi-clipboard2-pulse"></i>
            <span className="link_name">Checkup</span>
          </Link>
          <ul className="sub-menu blank">
            <li><Link to="#" className="link_name" onClick={() => handleNavigation('Checkup')}>Checkup</Link></li>
          </ul>
        </li>
        <li className={activeDropdown === 'reports' ? 'active' : ''}>
          <div className="iocn-link" onClick={() => handleDropdownToggle('reports')}>
            <Link to="#">
              <i className="bi bi-file-earmark-bar-graph"></i>
              <span className="link_name">Reports</span>
            </Link>
            <i className={`bi bi-chevron-down arrow ${activeDropdown === 'reports' ? 'open' : ''}`}></i>
          </div>
          <ul className={`sub-menu ${activeDropdown === 'reports' ? 'show' : ''}`}>
            <li><Link className="link_name" to="#">Reports</Link></li>
            <li><Link to="#" onClick={() => handleNavigation('Generate Reports')}>Generate Reports</Link></li>
            <li><Link to="#" onClick={() => handleNavigation('Report History')}>Report History</Link></li>
          </ul>
        </li>
        <li>
          <Link to="#" onClick={() => handleNavigation('Appointments')} className={currentPath === 'Appointments' ? 'active' : ''}>
            <i className="bi bi-calendar-check"></i>
            <span className="link_name">Appointments</span>
          </Link>
          <ul className="sub-menu blank">
            <li><Link to="#" className="link_name" onClick={() => handleNavigation('Appointments')}>Appointments</Link></li>
          </ul>
        </li>
        <li className={activeDropdown === 'inventory' ? 'active' : ''}>
          <div className="iocn-link" onClick={() => handleDropdownToggle('inventory')}>
            <Link to="#">
              <i className="bi bi-box-seam"></i>
              <span className="link_name">Inventory</span>
            </Link>
            <i className={`bi bi-chevron-down arrow ${activeDropdown === 'inventory' ? 'open' : ''}`}></i>
          </div>
          <ul className={`sub-menu ${activeDropdown === 'inventory' ? 'show' : ''}`}>
            <li><Link className="link_name" to="#">Inventory</Link></li>
            <li><Link to="#" onClick={() => handleNavigation('Manage Inventories')}>Manage Inventories</Link></li>
          </ul>
        </li>
        <li className={activeDropdown === 'users' ? 'active' : ''}>
          <div className="iocn-link" onClick={() => handleDropdownToggle('users')}>
            <Link to="#">
              <i className="bi bi-person-rolodex"></i>
              <span className="link_name">Users</span>
            </Link>
            <i className={`bi bi-chevron-down arrow ${activeDropdown === 'users' ? 'open' : ''}`}></i>
          </div>
          <ul className={`sub-menu ${activeDropdown === 'users' ? 'show' : ''}`}>
            <li><Link className="link_name" to="#">Users</Link></li>
            <li><Link to="#" onClick={() => handleNavigation('User Management')}>User Management</Link></li>
            <li><Link to="#" onClick={() => handleNavigation('Add User')}>Add User</Link></li>
            <li><Link to="#" onClick={() => handleNavigation('View/Edit Users')}>View/Edit Users</Link></li>
          </ul>
        </li>
        <li className={activeDropdown === 'notifications' ? 'active' : ''}>
          <div className="iocn-link" onClick={() => handleDropdownToggle('notifications')}>
            <Link to="#">
              <i className="bi bi-bell"></i>
              <span className="link_name">Notifications</span>
            </Link>
            <i className={`bi bi-chevron-down arrow ${activeDropdown === 'notifications' ? 'open' : ''}`}></i>
          </div>
          <ul className={`sub-menu ${activeDropdown === 'notifications' ? 'show' : ''}`}>
            <li><Link className="link_name" to="#">Notifications</Link></li>
            <li><Link to="#" onClick={() => handleNavigation('Notification Manager')}>Notification Manager</Link></li>
            <li><Link to="#" onClick={() => handleNavigation('Notification History')}>Notification History</Link></li>
          </ul>
        </li>
        <li>
          <div className="profile-details">
            <div className="profile-content">
            </div>
            <div className="name-job">
              <div className="profile_name"></div>
              <div className="job"></div>
            </div>
          </div>
        </li>
      </ul>
      <div className="sidebar-footer">
        <div className={`simulation-mode-toggle ${simulationMode.enabled ? 'active' : ''}`} onClick={handleSimulationToggle}>
          <i className={`bi ${simulationMode.enabled ? 'bi-check-circle-fill' : 'bi-play-circle'}`}></i>
          <span>{simulationMode.enabled ? 'Simulation On' : 'Simulation Off'}</span>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
  