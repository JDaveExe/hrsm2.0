import React, { useState, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import '../styles/ManagementSidebar.css';

const ManagementSidebar = memo(({
  sidebarOpen,
  toggleSidebar,
  handleNavigation,
  currentPath,
  handleLogout,
  sealmainImage
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleNavigationClick = useCallback((path) => {
    handleNavigation(path);
  }, [handleNavigation]);

  const handleLogoutClick = useCallback(() => {
    setShowLogoutConfirm(true);
  }, []);

  const confirmLogout = useCallback(() => {
    setShowLogoutConfirm(false);
    handleLogout();
  }, [handleLogout]);

  const cancelLogout = useCallback(() => {
    setShowLogoutConfirm(false);
  }, []);

  return (
    <div className={`sidebar ${sidebarOpen ? '' : 'closed'}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="management-logo-section">
          <img src={sealmainImage} alt="Management Seal" className="management-seal-image" />
          <div className="brand">
            <i className="bi bi-graph-up-arrow"></i>
            <span className="text">Management</span>
          </div>
        </div>
      </div>

      {/* Sidebar Menu */}
      <div className="sidebar-menu">
        <ul>
          {/* Inventory Management */}
          <li className={currentPath === 'Inventory Management' ? 'active' : ''} onClick={() => handleNavigationClick('Inventory Management')}>
            <Link to="#">
              <i className="bi bi-boxes"></i>
              <span>Inventory</span>
            </Link>
          </li>

          {/* Reports */}
          <li className={currentPath === 'Reports' ? 'active' : ''} onClick={() => handleNavigationClick('Reports')}>
            <Link to="#">
              <i className="bi bi-file-earmark-bar-graph"></i>
              <span>Reports</span>
            </Link>
          </li>

          {/* Healthcare Insights */}
          <li className={currentPath === 'Healthcare Insights' ? 'active' : ''} onClick={() => handleNavigationClick('Healthcare Insights')}>
            <Link to="#">
              <i className="bi bi-graph-up-arrow"></i>
              <span>Healthcare Insights</span>
            </Link>
          </li>

          {/* Audit Trail */}
          <li className={currentPath === 'Audit Trail' ? 'active' : ''} onClick={() => handleNavigationClick('Audit Trail')}>
            <Link to="#">
              <i className="bi bi-clipboard-data"></i>
              <span>Audit Trail</span>
            </Link>
          </li>

          {/* My Profile */}
          <li className={currentPath === 'My Profile' ? 'active' : ''} onClick={() => handleNavigationClick('My Profile')}>
            <Link to="#">
              <i className="bi bi-person-circle"></i>
              <span>My Profile</span>
            </Link>
          </li>
        </ul>
      </div>

      {/* Sidebar Toggle and Logout Section */}
      <div className="sidebar-footer">
        <button className="sidebar-toggle-btn" onClick={toggleSidebar} title={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}>
          <i className={`bi ${sidebarOpen ? 'bi-chevron-left' : 'bi-list'}`}></i>
          {sidebarOpen && <span>Collapse</span>}
        </button>
        
        <button className="logout-btn" onClick={handleLogoutClick} title="Logout">
          <i className="bi bi-power"></i>
          {sidebarOpen && <span>Logout</span>}
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="logout-modal-overlay">
          <div className="logout-modal">
            <div className="logout-modal-header">
              <i className="bi bi-exclamation-triangle"></i>
              <h4>Confirm Logout</h4>
            </div>
            <div className="logout-modal-body">
              <p>Are you sure you want to logout from the Management Dashboard?</p>
            </div>
            <div className="logout-modal-footer">
              <button className="logout-cancel-btn" onClick={cancelLogout}>
                <i className="bi bi-x-circle"></i>
                Cancel
              </button>
              <button className="logout-confirm-btn" onClick={confirmLogout}>
                <i className="bi bi-power"></i>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ManagementSidebar.displayName = 'ManagementSidebar';

export default ManagementSidebar;
