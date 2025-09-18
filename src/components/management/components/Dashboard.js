import React from 'react';
import '../styles/Dashboard.css';

const Dashboard = ({ currentDateTime, isDarkMode }) => {
  return (
    <div className="management-dashboard">
      <div className="dashboard-header">
        <h2>Management Dashboard Overview</h2>
        <p className="dashboard-subtitle">Inventory & Reports Management System</p>
      </div>
      
      <div className="dashboard-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="bi bi-box-seam"></i>
          </div>
          <div className="stat-content">
            <h3>Inventory Items</h3>
            <p className="stat-number">1,234</p>
            <p className="stat-change positive">+12% from last month</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <i className="bi bi-exclamation-triangle"></i>
          </div>
          <div className="stat-content">
            <h3>Low Stock Alerts</h3>
            <p className="stat-number">23</p>
            <p className="stat-change negative">+5 from last week</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <i className="bi bi-graph-up"></i>
          </div>
          <div className="stat-content">
            <h3>Reports Generated</h3>
            <p className="stat-number">87</p>
            <p className="stat-change positive">+8 this month</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <i className="bi bi-calendar-check"></i>
          </div>
          <div className="stat-content">
            <h3>Last Updated</h3>
            <p className="stat-number">{currentDateTime?.toLocaleDateString()}</p>
            <p className="stat-change neutral">{currentDateTime?.toLocaleTimeString()}</p>
          </div>
        </div>
      </div>
      
      <div className="dashboard-actions">
        <div className="action-card">
          <h4>Quick Actions</h4>
          <div className="action-buttons">
            <button className="action-btn primary">
              <i className="bi bi-plus-circle"></i>
              Add Inventory Item
            </button>
            <button className="action-btn secondary">
              <i className="bi bi-file-earmark-text"></i>
              Generate Report
            </button>
            <button className="action-btn tertiary">
              <i className="bi bi-bell"></i>
              Check Alerts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
