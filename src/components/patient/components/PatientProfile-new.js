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

  if (!profileData) {
    return (
      <div className="patient-profile">
        <div className="profile-modal">
          <div className="profile-error">
            <div className="error-icon">📄</div>
            <p>No profile data available</p>
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

        {/* Patient Info Header */}
        <div className="profile-patient-info">
          <div className="profile-patient-name">{profileData?.fullName || `${profileData?.firstName} ${profileData?.lastName}`}</div>
          <div className="profile-patient-id">Patient ID: PT-{profileData?.patientId || user?.patientId}</div>
        </div>

        {/* Modal Body */}
        <div className="profile-modal-body">
          {/* Personal Information Section */}
          <div className="profile-section">
            <div className="profile-section-header">
              <span className="icon">👤</span>
              <h3>Personal Information</h3>
            </div>
            <div className="profile-section-content">
              <div className="profile-info-grid">
                <div className="profile-info-item">
                  <div className="profile-info-label">First Name:</div>
                  <div className="profile-info-value">{profileData?.firstName || 'N/A'}</div>
                </div>
                <div className="profile-info-item">
                  <div className="profile-info-label">Middle Name:</div>
                  <div className="profile-info-value">{profileData?.middleName || 'N/A'}</div>
                </div>
                <div className="profile-info-item">
                  <div className="profile-info-label">Last Name:</div>
                  <div className="profile-info-value">{profileData?.lastName || 'N/A'}</div>
                </div>
                <div className="profile-info-item">
                  <div className="profile-info-label">Suffix:</div>
                  <div className="profile-info-value">{profileData?.suffix || 'N/A'}</div>
                </div>
                <div className="profile-info-item">
                  <div className="profile-info-label">Date of Birth:</div>
                  <div className="profile-info-value">{profileData?.dateOfBirth || 'N/A'}</div>
                </div>
                <div className="profile-info-item">
                  <div className="profile-info-label">Age:</div>
                  <div className="profile-info-value">{profileData?.age || 'N/A'}</div>
                </div>
                <div className="profile-info-item">
                  <div className="profile-info-label">Gender:</div>
                  <div className="profile-info-value">{profileData?.gender || 'N/A'}</div>
                </div>
                <div className="profile-info-item">
                  <div className="profile-info-label">Civil Status:</div>
                  <div className="profile-info-value">{profileData?.civilStatus || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="profile-section">
            <div className="profile-section-header">
              <span className="icon">📞</span>
              <h3>Contact Information</h3>
            </div>
            <div className="profile-section-content">
              <div className="profile-info-grid">
                <div className="profile-info-item">
                  <div className="profile-info-label">Email:</div>
                  <div className="profile-info-value">{profileData?.email || 'N/A'}</div>
                </div>
                <div className="profile-info-item">
                  <div className="profile-info-label">Phone Number:</div>
                  <div className="profile-info-value">{profileData?.phoneNumber || profileData?.contactNumber || 'N/A'}</div>
                </div>
                <div className="profile-info-item">
                  <div className="profile-info-label">Address:</div>
                  <div className="profile-info-value">{profileData?.address || profileData?.formattedAddress || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Medical Information Section */}
          <div className="profile-section">
            <div className="profile-section-header">
              <span className="icon">🏥</span>
              <h3>Medical Information</h3>
            </div>
            <div className="profile-section-content">
              <div className="profile-info-grid">
                <div className="profile-info-item">
                  <div className="profile-info-label">PhilHealth Number:</div>
                  <div className="profile-info-value">{profileData?.philHealthNumber || 'N/A'}</div>
                </div>
                <div className="profile-info-item">
                  <div className="profile-info-label">Blood Type:</div>
                  <div className="profile-info-value">{profileData?.bloodType || 'N/A'}</div>
                </div>
                <div className="profile-info-item">
                  <div className="profile-info-label">Family ID:</div>
                  <div className="profile-info-value">{profileData?.familyId || (profileData?.family?.id ? profileData.family.id : 'N/A')}</div>
                </div>
                <div className="profile-info-item">
                  <div className="profile-info-label">Medical Conditions:</div>
                  <div className="profile-info-value">{profileData?.medicalConditions || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Registration Details Section */}
          <div className="profile-section">
            <div className="profile-section-header">
              <span className="icon">📋</span>
              <h3>Registration Details</h3>
            </div>
            <div className="profile-section-content">
              <div className="profile-info-grid">
                <div className="profile-info-item">
                  <div className="profile-info-label">Registration Date:</div>
                  <div className="profile-info-value">{profileData?.registrationDate || 'N/A'}</div>
                </div>
                <div className="profile-info-item">
                  <div className="profile-info-label">Last Updated:</div>
                  <div className="profile-info-value">{profileData?.lastUpdated || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="profile-modal-footer">
          <button className="profile-btn profile-btn-primary">
            📝 Edit Information
          </button>
          <button 
            className="profile-btn profile-btn-secondary"
            onClick={onRefresh}
          >
            Close
          </button>
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
