import React, { memo } from 'react';
import PropTypes from 'prop-types';
import '../styles/PatientHeader.css';

const PatientHeader = memo(({ 
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
      case 'My Profile':
        return 'bi-person-circle';
      case 'Upcoming Appointments':
      case 'Appointment History':
      case 'Book Appointment':
        return 'bi-calendar-check';
      case 'Treatment Record':
      case 'Dental Record':
      case 'Immunization Record':
      case 'Lab Results':
        return 'bi-folder-plus';
      case 'Active Prescriptions':
      case 'Prescriptions History':
      case 'Medication Reminders':
        return 'bi-prescription2';
      case 'Vital Signs':
      case 'Health Goals':
      case 'Symptoms Tracker':
        return 'bi-heart-pulse';
      case 'Messages':
      case 'Notifications':
      case 'Emergency Contact':
        return 'bi-chat-dots';
      case 'Settings':
        return 'bi-gear';
      default:
        return 'bi-house';
    }
  };

  // Show refresh button for data-heavy sections
  const shouldShowRefresh = (path) => {
    return [
      'Upcoming Appointments',
      'Active Prescriptions',
      'Vital Signs',
      'Messages',
      'Notifications'
    ].includes(path);
  };

  return (
    <div className="patient-header">
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
        {shouldShowRefresh(currentPath) && (
          <button 
            className={`refresh-btn ${isLoading ? 'loading' : ''}`}
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh Data"
            aria-label="Refresh Data"
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
                ? `${user.firstName} ${user.lastName}`
                : user?.name 
                  ? user.name
                  : 'Patient User'
              }
            </span>
            <span className="user-role">{user?.role?.toUpperCase() || 'PATIENT'}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

PatientHeader.displayName = 'PatientHeader';

PatientHeader.propTypes = {
  user: PropTypes.object,
  currentDateTime: PropTypes.instanceOf(Date).isRequired,
  currentPath: PropTypes.string.isRequired,
  onRefresh: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired
};

export default PatientHeader;
