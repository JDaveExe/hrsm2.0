import React, { memo } from 'react';
import '../styles/DoctorHeader.css';

const DoctorHeader = memo(({ 
  user, 
  currentDateTime, 
  currentPath, 
  onRefresh, 
  isLoading
}) => {
  const formatDateTime = (date) => {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getPathIcon = (path) => {
    switch (path) {
      case 'Patient Queue':
        return 'bi-people';
      case "Today's Checkup":
        return 'bi-calendar-check';
      case 'Patient Database':
        return 'bi-archive';
      case 'Appointments':
        return 'bi-calendar-check';
      case 'Inventory':
        return 'bi-box-seam';
      case 'Reports':
        return 'bi-file-earmark-bar-graph';
      case 'Settings':
        return 'bi-gear';
      default:
        return 'bi-house';
    }
  };

  return (
    <div className="doctor-header">
      <div className="header-left">
        {/* Page Title */}
        <div className="page-title">
          <i className={`bi ${getPathIcon(currentPath)}`}></i>
          <h1>{currentPath}</h1>
        </div>
      </div>

      <div className="header-center">
        {/* DateTime Display */}
        <div className="datetime-display">
          <i className="bi bi-clock"></i>
          <span>{formatDateTime(currentDateTime)}</span>
        </div>
      </div>

      <div className="header-right">
        {/* Refresh Button */}
        {(currentPath === 'Patient Queue' || currentPath === "Today's Checkup") && (
          <button 
            className={`refresh-btn ${isLoading ? 'loading' : ''}`}
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh Data"
          >
            <i className={`bi ${isLoading ? 'bi-arrow-clockwise spin' : 'bi-arrow-clockwise'}`}></i>
            <span>Refresh</span>
          </button>
        )}

        {/* User Info */}
        <div className="user-info">
          <div className="user-avatar">
            <i className="bi bi-person-circle"></i>
          </div>
          <div className="user-details">
            <span className="user-name">
              {user?.firstName && user?.lastName 
                ? `Dr. ${user.firstName} ${user.lastName}`
                : user?.name 
                  ? `Dr. ${user.name}`
                  : 'Dr. Doctor'
              }
            </span>
            <span className="user-role">{user?.role || 'DOCTOR'}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default DoctorHeader;
