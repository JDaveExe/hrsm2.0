import React, { memo } from 'react';
import PropTypes from 'prop-types';

const PatientProfile = memo(({ 
  user, 
  currentDateTime, 
  isLoading, 
  secureApiCall, 
  onRefresh 
}) => {
  return (
    <div className="patient-profile">
      <div className="profile-header">
        <h2>Welcome, {user?.firstName || 'Patient'}!</h2>
        <p>Manage your health information and track your medical journey.</p>
      </div>
      
      <div className="profile-content">
        <div className="profile-card">
          <h3>Personal Information</h3>
          <div className="profile-info">
            <div className="info-item">
              <label>Full Name:</label>
              <span>{user?.firstName} {user?.lastName}</span>
            </div>
            <div className="info-item">
              <label>Email:</label>
              <span>{user?.email}</span>
            </div>
            <div className="info-item">
              <label>Role:</label>
              <span>{user?.role}</span>
            </div>
          </div>
        </div>
        
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <button className="action-btn">
              <i className="bi bi-calendar-plus"></i>
              Book Appointment
            </button>
            <button className="action-btn">
              <i className="bi bi-file-medical"></i>
              View Records
            </button>
            <button className="action-btn">
              <i className="bi bi-heart-pulse"></i>
              Health Tracking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

PatientProfile.displayName = 'PatientProfile';

PatientProfile.propTypes = {
  user: PropTypes.object,
  currentDateTime: PropTypes.instanceOf(Date),
  isLoading: PropTypes.bool,
  secureApiCall: PropTypes.func,
  onRefresh: PropTypes.func
};

export default PatientProfile;
