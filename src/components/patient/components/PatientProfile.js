import React, { memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import PatientQRModal from './PatientQRModal';
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
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [showMedicalConditionsModal, setShowMedicalConditionsModal] = useState(false);
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [isEditingConditions, setIsEditingConditions] = useState(false);
  const [conditionSearchTerm, setConditionSearchTerm] = useState('');
  
  // QR Code Modal state
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  
  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await secureApiCall('/api/patients/me/profile');
        
        if (response) {
          setProfileData(response);
        } else {
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
      fetchProfile();
    } else {
      setError('No patient information found. Please log in again.');
      setLoading(false);
    }
  }, [user?.patientId, secureApiCall]);

  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (!isEditing) {
      // Enter edit mode - initialize form data (convert N/A to empty strings)
      const convertValue = (value) => value === 'N/A' ? '' : (value || '');
      
      setEditFormData({
        firstName: convertValue(profileData?.firstName),
        middleName: convertValue(profileData?.middleName),
        lastName: convertValue(profileData?.lastName),
        suffix: convertValue(profileData?.suffix),
        dateOfBirth: convertValue(profileData?.dateOfBirth),
        gender: convertValue(profileData?.gender),
        civilStatus: convertValue(profileData?.civilStatus),
        email: convertValue(profileData?.email),
        contactNumber: convertValue(profileData?.contactNumber),
        houseNo: convertValue(profileData?.houseNo),
        street: convertValue(profileData?.street),
        barangay: convertValue(profileData?.barangay),
        city: convertValue(profileData?.city),
        philHealthNumber: convertValue(profileData?.philHealthNumber),
        bloodType: convertValue(profileData?.bloodType),
        medicalConditions: convertValue(profileData?.medicalConditions)
      });
      // Reset password change state
      setIsChangingPassword(false);
      setPasswordData({ newPassword: '', confirmPassword: '' });
    }
    setIsEditing(!isEditing);
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Auto-calculate age when date of birth changes
    if (field === 'dateOfBirth' && value) {
      try {
        const today = new Date();
        const birthDate = new Date(value);
        
        // Validate the birth date
        if (birthDate > today) {
          // Future date, don't calculate age
          return;
        }
        
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        // Ensure age is a valid number
        if (age >= 0 && age <= 150) {
          setEditFormData(prev => ({
            ...prev,
            age: age
          }));
        }
      } catch (error) {
        console.error('Error calculating age:', error);
      }
    }
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    try {
      // Validate password if user is trying to change it
      if (isChangingPassword) {
        if (!passwordData.newPassword || !passwordData.confirmPassword) {
          setError('Please enter both password fields');
          return;
        }
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        
        if (passwordData.newPassword.length < 6) {
          setError('Password must be at least 6 characters long');
          return;
        }
        
        // Add password to form data
        editFormData.password = passwordData.newPassword;
      }
      
      setLoading(true);
      const response = await secureApiCall('/api/patients/me/profile', {
        method: 'PUT',
        data: editFormData
      });
      
      if (response) {
        setProfileData(response);
        setIsEditing(false);
        setEditFormData(null);
        setIsChangingPassword(false);
        setPasswordData({ newPassword: '', confirmPassword: '' });
        setError(null);
        // Optionally show success message
        alert('Profile updated successfully!' + (isChangingPassword ? ' Password has been changed.' : ''));
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(`Failed to save changes: ${err.response?.data?.msg || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData(null);
    setIsChangingPassword(false);
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setError(null);
  };

  // Handle QR Code generation
  const handleGenerateQR = () => {
    if (!profileData) {
      setError('No patient data available for QR code generation');
      return;
    }

    // Generate a secure token for the patient check-in (same format as admin side)
    const checkInToken = btoa(JSON.stringify({
      patientId: profileData.patientId || profileData.id,
      patientName: `${profileData.firstName} ${profileData.lastName}`,
      timestamp: Date.now(),
      action: 'checkin'
    }));

    // Create the check-in URL
    const baseUrl = window.location.origin;
    const checkInUrl = `${baseUrl}/patient-checkin?token=${checkInToken}`;
    
    setQrCodeData(checkInUrl);
    setShowQRModal(true);
  };

  // Suffix options
  const suffixOptions = ['', 'Jr.', 'Sr.', 'II', 'III', 'IV', 'V'];
  
  // Blood type options
  const bloodTypeOptions = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  
  // Gender options
  const genderOptions = ['', 'Male', 'Female', 'Other'];
  
  // Civil status options
  const civilStatusOptions = ['', 'Single', 'Married', 'Divorced', 'Widowed'];

  // Medical conditions list
  const medicalConditionsList = [
    'Hypertension (High Blood Pressure)',
    'Diabetes Mellitus',
    'Heart Disease',
    'Asthma',
    'Allergies',
    'Arthritis',
    'Kidney Disease',
    'Liver Disease',
    'Thyroid Disorders',
    'High Cholesterol',
    'Stroke',
    'Cancer',
    'Depression',
    'Anxiety Disorders',
    'Migraine',
    'Epilepsy',
    'Osteoporosis',
    'COPD (Chronic Obstructive Pulmonary Disease)',
    'Gastroesophageal Reflux Disease (GERD)',
    'Irritable Bowel Syndrome (IBS)',
    'Ulcerative Colitis',
    'Crohn\'s Disease',
    'Fibromyalgia',
    'Chronic Fatigue Syndrome',
    'Sleep Apnea',
    'Cataracts',
    'Glaucoma',
    'Hearing Loss',
    'Chronic Kidney Disease',
    'Hepatitis B',
    'Hepatitis C',
    'HIV/AIDS',
    'Tuberculosis',
    'Pneumonia (Recurrent)',
    'Chronic Bronchitis',
    'Skin Disorders (Eczema, Psoriasis)',
    'Autoimmune Disorders',
    'Blood Disorders (Anemia, etc.)',
    'Mental Health Disorders',
    'Substance Use Disorders'
  ];

  // Filter conditions based on search term
  const filteredConditions = medicalConditionsList.filter(condition =>
    condition.toLowerCase().includes(conditionSearchTerm.toLowerCase())
  );

  // Handle medical conditions modal
  const handleOpenMedicalConditionsModal = () => {
    // Clear search term
    setConditionSearchTerm('');
    
    // Parse existing conditions
    if (profileData?.medicalConditions && profileData.medicalConditions !== 'N/A') {
      try {
        const conditions = profileData.medicalConditions.split(', ');
        setSelectedConditions(conditions);
      } catch (error) {
        console.error('Error parsing conditions:', error);
        setSelectedConditions([]);
      }
    } else {
      setSelectedConditions([]);
    }
    // Start in edit mode for better user experience
    setIsEditingConditions(true);
    setShowMedicalConditionsModal(true);
  };

  // Handle condition selection
  const handleConditionToggle = (condition) => {
    setSelectedConditions(prev => {
      if (prev.includes(condition)) {
        return prev.filter(c => c !== condition);
      } else {
        return [...prev, condition];
      }
    });
  };

  // Save medical conditions
  const handleSaveMedicalConditions = async () => {
    try {
      setLoading(true);
      const conditionsString = selectedConditions.length > 0 ? selectedConditions.join(', ') : 'N/A';
      
      const response = await secureApiCall('/api/patients/me/profile', {
        method: 'PUT',
        data: {
          ...editFormData,
          medicalConditions: conditionsString
        }
      });
      
      if (response) {
        setProfileData(response);
        setShowMedicalConditionsModal(false);
        setIsEditingConditions(false);
        // Update form data if in edit mode
        if (editFormData) {
          setEditFormData(prev => ({
            ...prev,
            medicalConditions: conditionsString
          }));
        }
      }
    } catch (err) {
      console.error('Error saving medical conditions:', err);
      setError(`Failed to save medical conditions: ${err.response?.data?.msg || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Render form input or display value
  const renderFormField = (label, field, type = 'text', options = null) => {
    if (isEditing) {
      if (options) {
        // Render dropdown
        return (
          <select
            className="profile-info-value"
            value={editFormData?.[field] || ''}
            onChange={(e) => handleInputChange(field, e.target.value)}
          >
            {options.map(option => (
              <option key={option} value={option}>{option || 'Select...'}</option>
            ))}
          </select>
        );
      } else {
        // Render input
        return (
          <input
            type={type}
            className="profile-info-value"
            value={editFormData?.[field] || ''}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}`}
          />
        );
      }
    } else {
      // Display mode
      return (
        <div className="profile-info-value">
          {profileData?.[field] || 'N/A'}
        </div>
      );
    }
  };
  
  // Render password field with special handling
  const renderPasswordField = () => {
    if (isEditing) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
          <input
            type="password"
            className="profile-info-value"
            value={passwordData.newPassword}
            onChange={(e) => {
              setPasswordData(prev => ({ ...prev, newPassword: e.target.value }));
              // Show confirm password field when user starts typing
              if (e.target.value && !isChangingPassword) {
                setIsChangingPassword(true);
              }
            }}
            placeholder="Enter new password (leave empty to keep current)"
          />
          {isChangingPassword && passwordData.newPassword && (
            <input
              type="password"
              className="profile-info-value"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Confirm new password"
              style={{ marginTop: '4px' }}
            />
          )}
        </div>
      );
    } else {
      // Display mode - show asterisks
      return (
        <div className="profile-info-value">
          ••••••••
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="patient-profile">
        <div className="profile-container">
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
        <div className="profile-container">
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
        <div className="profile-container">
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
      <div className="profile-container">
        {/* Patient Info Header with Action Buttons */}
        <div className="profile-patient-info">
          <div className="profile-top-actions">
            {isEditing ? (
              <>
                <button 
                  className="profile-btn profile-btn-primary"
                  onClick={handleSaveChanges}
                >
                  � Save Changes
                </button>
                <button 
                  className="profile-btn profile-btn-secondary"
                  onClick={handleCancelEdit}
                >
                  ❌ Cancel
                </button>
              </>
            ) : (
              <>
                <button 
                  className="profile-btn profile-btn-primary"
                  onClick={handleEditToggle}
                >
                  📝 Edit Information
                </button>
                <button 
                  className="profile-btn profile-btn-success"
                  onClick={handleGenerateQR}
                >
                  📱 Generate QR Code
                </button>
                <button 
                  className="profile-btn profile-btn-secondary"
                  onClick={onRefresh}
                >
                  🔄 Refresh Profile
                </button>
              </>
            )}
          </div>
          <div className="profile-patient-name">{profileData?.fullName || `${profileData?.firstName} ${profileData?.lastName}`}</div>
          <div className="profile-patient-id">Patient ID: PT-{profileData?.patientId || user?.patientId}</div>
        </div>

        {/* Profile Content */}
        <div className="profile-content">
          {/* Personal Information Section */}
          <div className="profile-section">
            <div className="profile-section-header">
              <span className="icon">👤</span>
              <h3>Personal Information</h3>
            </div>
            <div className="profile-section-content">
              {/* First Row: Names */}
              <div className="profile-info-row">
                <div className="profile-info-item">
                  <div className="profile-info-label">First Name:</div>
                  {renderFormField('First Name', 'firstName')}
                </div>
                <div className="profile-info-item">
                  <div className="profile-info-label">Middle Name:</div>
                  {renderFormField('Middle Name', 'middleName')}
                </div>
                <div className="profile-info-item">
                  <div className="profile-info-label">Last Name:</div>
                  {renderFormField('Last Name', 'lastName')}
                </div>
                <div className="profile-info-item">
                  <div className="profile-info-label">Suffix:</div>
                  {renderFormField('Suffix', 'suffix', 'text', suffixOptions)}
                </div>
              </div>
              
              {/* Second Row: Demographics */}
              <div className="profile-info-row">
                <div className="profile-info-item">
                  <div className="profile-info-label">Date of Birth:</div>
                  {renderFormField('Date of Birth', 'dateOfBirth', 'date')}
                </div>
                <div className="profile-info-item">
                  <div className="profile-info-label">Age:</div>
                  <div className="profile-info-value">{editFormData?.age || profileData?.age || 'N/A'}</div>
                </div>
                <div className="profile-info-item">
                  <div className="profile-info-label">Gender:</div>
                  {renderFormField('Gender', 'gender', 'text', genderOptions)}
                </div>
                <div className="profile-info-item">
                  <div className="profile-info-label">Civil Status:</div>
                  {renderFormField('Civil Status', 'civilStatus', 'text', civilStatusOptions)}
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
              {/* First Row: Email and Phone */}
              <div className="profile-info-row">
                <div className="profile-info-item">
                  <div className="profile-info-label">Email:</div>
                  {renderFormField('Email', 'email', 'email')}
                </div>
                <div className="profile-info-item">
                  <div className="profile-info-label">Phone Number:</div>
                  {renderFormField('Phone Number', 'contactNumber', 'tel')}
                </div>
                <div className="profile-info-item">
                  <div className="profile-info-label">Password:</div>
                  {renderPasswordField()}
                </div>
                <div className="profile-info-item"></div>
              </div>
              
              {/* Second Row: Address Breakdown */}
              <div className="profile-info-row">
                <div className="profile-info-item">
                  <div className="profile-info-label">House Number:</div>
                  {renderFormField('House Number', 'houseNo')}
                </div>
                <div className="profile-info-item">
                  <div className="profile-info-label">Street:</div>
                  {renderFormField('Street', 'street')}
                </div>
                <div className="profile-info-item">
                  <div className="profile-info-label">Barangay:</div>
                  {renderFormField('Barangay', 'barangay')}
                </div>
                <div className="profile-info-item">
                  <div className="profile-info-label">City:</div>
                  {renderFormField('City', 'city')}
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
                  {renderFormField('PhilHealth Number', 'philHealthNumber')}
                </div>
                <div className="profile-info-item">
                  <div className="profile-info-label">Blood Type:</div>
                  {renderFormField('Blood Type', 'bloodType', 'text', bloodTypeOptions)}
                </div>
                <div className="profile-info-item">
                  <div className="profile-info-label">Family ID:</div>
                  <div className="profile-info-value">{profileData?.familyId || 'N/A'}</div>
                </div>
                <div className="profile-info-item">
                  <div className="profile-info-label">Medical Conditions:</div>
                  <div className="profile-info-value">
                    <button 
                      className="medical-conditions-btn"
                      onClick={handleOpenMedicalConditionsModal}
                    >
                      {profileData?.medicalConditions === 'N/A' ? 'No conditions recorded' : 'View/Edit Conditions'}
                    </button>
                  </div>
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

        {/* Medical Conditions Modal */}
        {showMedicalConditionsModal && (
          <div className="medical-conditions-modal-overlay" onClick={() => {
            setShowMedicalConditionsModal(false);
            setConditionSearchTerm('');
          }}>
            <div className="medical-conditions-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Select Medical Conditions</h3>
                <button 
                  className="close-btn"
                  onClick={() => {
                    setShowMedicalConditionsModal(false);
                    setConditionSearchTerm('');
                  }}
                >
                  ❌
                </button>
              </div>
              
              <div className="edit-instructions">
                <p>Check all conditions that apply to you:</p>
              </div>
              
              <div className="conditions-search">
                <input
                  type="text"
                  placeholder="Search medical conditions..."
                  value={conditionSearchTerm}
                  onChange={(e) => setConditionSearchTerm(e.target.value)}
                  className="condition-search-input"
                />
                <span className="search-icon">🔍</span>
              </div>
              
              <div className="conditions-checklist">
                {filteredConditions.length > 0 ? (
                  filteredConditions.map((condition, index) => (
                    <label key={index} className="condition-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedConditions.includes(condition)}
                        onChange={() => handleConditionToggle(condition)}
                      />
                      <span className="condition-label">{condition}</span>
                    </label>
                  ))
                ) : (
                  <div className="no-results">
                    No conditions found matching "{conditionSearchTerm}"
                  </div>
                )}
              </div>
              
              <div className="selected-count">
                Selected: {selectedConditions.length} condition{selectedConditions.length !== 1 ? 's' : ''}
              </div>
              
              {selectedConditions.length > 0 && (
                <div className="current-selections">
                  <h5>Currently Selected:</h5>
                  <div className="selected-conditions">
                    {selectedConditions.map((condition, index) => (
                      <span key={index} className="selected-condition-tag">
                        {condition}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="modal-actions">
                <button 
                  className="profile-btn profile-btn-primary"
                  onClick={handleSaveMedicalConditions}
                  disabled={loading}
                >
                  💾 Save Changes
                </button>
                <button 
                  className="profile-btn profile-btn-secondary"
                  onClick={() => {
                    setShowMedicalConditionsModal(false);
                    setIsEditingConditions(false);
                    setConditionSearchTerm('');
                    // Reset to original conditions
                    if (profileData?.medicalConditions && profileData.medicalConditions !== 'N/A') {
                      const conditions = profileData.medicalConditions.split(', ');
                      setSelectedConditions(conditions);
                    } else {
                      setSelectedConditions([]);
                    }
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Patient QR Code Modal */}
        <PatientQRModal
          show={showQRModal}
          onHide={() => setShowQRModal(false)}
          patientData={profileData}
          qrCodeData={qrCodeData}
        />
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
