import React, { memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import '../styles/PatientProfile.css';

const PatientProfile = memo(({ 
  user, 
  currentDateTime, 
  isLoading, 
  secureApiCall, 
  onRefresh 
}) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching profile for user:', user);
        console.log('User token:', user?.token);
        console.log('User token type:', typeof user?.token);
        console.log('Full user object keys:', Object.keys(user || {}));
        
        // Check sessionStorage
        console.log('SessionStorage authData:', sessionStorage.getItem('authData'));
        console.log('Window.__authToken:', window.__authToken);
        
        const response = await secureApiCall('/api/patients/me/profile');
        console.log('Profile response:', response);
        
        if (response) {
          setProfileData(response);
          console.log('Profile data set:', response);
        } else {
          console.log('No data in response');
          setError('No profile data received');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        
        // Check if it's an authentication error
        if (err.response?.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else if (err.response?.status === 404) {
          setError('Patient profile not found. Please contact support.');
        } else if (err.message === 'No authentication token available') {
          setError('No authentication token available. Please log in again.');
        } else {
          setError(`Failed to load profile information: ${err.response?.data?.msg || err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    if (user?.patientId) {
      console.log('User has patientId:', user.patientId);
      fetchProfile();
    } else {
      console.log('No patientId found in user:', user);
      setError('No patient information found. Please log in again.');
      setLoading(false);
    }
  }, [user?.patientId, secureApiCall]);

  if (loading) {
    return (
      <div className="patient-profile">
        <div className="profile-modal">
          <div className="profile-loading">
            <div className="spinner"></div>
            <p>Loading profile information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="patient-profile">
        <div className="profile-modal">
          <div className="profile-error">
            <div className="error-icon">⚠️</div>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-profile">
      <div className="profile-modal">
        {/* Modal Header */}
        <div className="profile-modal-header">
          <span className="icon">👤</span>
          <h2>Patient Registration Form</h2>
          <button 
            className="profile-close-btn"
            onClick={onRefresh}
            title="Close"
          >
            ×
          </button>
        </div>
      
      <div className="profile-content">
        {/* Personal Information Card */}
        <div className="profile-card mb-4">
          <h3><i className="bi bi-person-circle"></i> Personal Information</h3>
          <div className="profile-info">
            <div className="row">
              <div className="col-md-6">
                <div className="info-item">
                  <label>First Name:</label>
                  <span>{profileData?.firstName}</span>
                </div>
                <div className="info-item">
                  <label>Middle Name:</label>
                  <span>{profileData?.middleName}</span>
                </div>
                <div className="info-item">
                  <label>Last Name:</label>
                  <span>{profileData?.lastName}</span>
                </div>
                <div className="info-item">
                  <label>Suffix:</label>
                  <span>{profileData?.suffix}</span>
                </div>
              </div>
              <div className="col-md-6">
                <div className="info-item">
                  <label>Date of Birth:</label>
                  <span>{profileData?.dateOfBirth}</span>
                </div>
                <div className="info-item">
                  <label>Age:</label>
                  <span>{profileData?.age}</span>
                </div>
                <div className="info-item">
                  <label>Gender:</label>
                  <span>{profileData?.gender}</span>
                </div>
                <div className="info-item">
                  <label>Civil Status:</label>
                  <span>{profileData?.civilStatus}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information Card */}
        <div className="profile-card mb-4">
          <h3><i className="bi bi-telephone"></i> Contact Information</h3>
          <div className="profile-info">
            <div className="row">
              <div className="col-md-6">
                <div className="info-item">
                  <label>Email Address:</label>
                  <span>{profileData?.email}</span>
                </div>
                <div className="info-item">
                  <label>Contact Number:</label>
                  <span>{profileData?.contactNumber}</span>
                </div>
              </div>
              <div className="col-md-6">
                <div className="info-item">
                  <label>Emergency Contact:</label>
                  <span>{typeof profileData?.emergencyContact === 'object' && profileData?.emergencyContact ? 
                    JSON.stringify(profileData.emergencyContact) : profileData?.emergencyContact}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Address Information Card */}
        <div className="profile-card mb-4">
          <h3><i className="bi bi-geo-alt"></i> Address Information</h3>
          <div className="profile-info">
            <div className="row">
              <div className="col-md-6">
                <div className="info-item">
                  <label>House No.:</label>
                  <span>{profileData?.houseNo}</span>
                </div>
                <div className="info-item">
                  <label>Street:</label>
                  <span>{profileData?.street}</span>
                </div>
                <div className="info-item">
                  <label>Barangay:</label>
                  <span>{profileData?.barangay}</span>
                </div>
              </div>
              <div className="col-md-6">
                <div className="info-item">
                  <label>City:</label>
                  <span>{profileData?.city}</span>
                </div>
                <div className="info-item">
                  <label>Region:</label>
                  <span>{profileData?.region}</span>
                </div>
                <div className="info-item">
                  <label>Complete Address:</label>
                  <span className="text-muted">{profileData?.formattedAddress}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Medical Information Card */}
        <div className="profile-card mb-4">
          <h3><i className="bi bi-heart-pulse"></i> Medical Information</h3>
          <div className="profile-info">
            <div className="row">
              <div className="col-md-6">
                <div className="info-item">
                  <label>Blood Type:</label>
                  <span>{profileData?.bloodType}</span>
                </div>
                <div className="info-item">
                  <label>PhilHealth Number:</label>
                  <span>{profileData?.philHealthNumber}</span>
                </div>
              </div>
              <div className="col-md-6">
                <div className="info-item">
                  <label>Medical Conditions:</label>
                  <span>{profileData?.medicalConditions}</span>
                </div>
                {profileData?.family && profileData.family !== 'N/A' && (
                  <div className="info-item">
                    <label>Family:</label>
                    <span>{profileData.family.familyName}</span>
                  </div>
                )}
              </div>
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
            <button className="action-btn" onClick={onRefresh}>
              <i className="bi bi-arrow-clockwise"></i>
              Refresh Profile
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
