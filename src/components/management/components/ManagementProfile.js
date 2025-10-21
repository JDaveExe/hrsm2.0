import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';
import './styles/ManagementProfile.css';

const ManagementProfile = () => {
  const { user, token } = useAuth();
  
  // Profile state
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    position: ''
  });
  
  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Recent activities state
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [activitiesTotal, setActivitiesTotal] = useState(0);
  
  // Edit mode
  const [isEditing, setIsEditing] = useState(false);

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await axios.get('http://localhost:5000/api/profile/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setProfile(response.data.profile);
      setProfileForm({
        firstName: response.data.profile.firstName || '',
        lastName: response.data.profile.lastName || '',
        email: response.data.profile.email || '',
        contactNumber: response.data.profile.contactNumber || '',
        position: response.data.profile.position || ''
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.msg || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Fetch recent activities
  const fetchActivities = useCallback(async (page = 1) => {
    try {
      setActivitiesLoading(true);
      
      const response = await axios.get(`http://localhost:5000/api/profile/activities/me?page=${page}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setActivities(response.data.activities);
      setActivitiesTotal(response.data.pagination.total);
      setActivitiesPage(page);
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setActivitiesLoading(false);
    }
  }, [token]);

  // Load data on mount
  useEffect(() => {
    fetchProfile();
    fetchActivities();
  }, [fetchProfile, fetchActivities]);

  // Handle profile form input change
  const handleProfileInputChange = (field, value) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
  };

  // Handle password form input change
  const handlePasswordInputChange = (field, value) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      setError('');
      setSuccess('');
      
      const response = await axios.put(
        'http://localhost:5000/api/profile/me',
        profileForm,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setProfile(response.data.profile);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      // Refresh activities to show the update action
      fetchActivities(activitiesPage);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err.response?.data?.msg || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle password change
  const handleChangePassword = async () => {
    try {
      setIsChangingPassword(true);
      setPasswordError('');
      setPasswordSuccess('');
      
      // Validate passwords match
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setPasswordError('New passwords do not match');
        setIsChangingPassword(false);
        return;
      }
      
      await axios.put(
        'http://localhost:5000/api/profile/password',
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setPasswordSuccess('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordFields(false);
      
      // Refresh activities to show the password change action
      fetchActivities(activitiesPage);
      
      // Clear success message after 3 seconds
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err) {
      console.error('Error changing password:', err);
      setPasswordError(err.response?.data?.msg || err.response?.data?.errors?.[0]?.msg || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setProfileForm({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      email: profile?.email || '',
      contactNumber: profile?.contactNumber || '',
      position: profile?.position || ''
    });
    setError('');
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get action badge variant
  const getActionBadgeVariant = (action) => {
    if (action.includes('create')) return 'success';
    if (action.includes('update') || action.includes('edit')) return 'warning';
    if (action.includes('delete') || action.includes('remove')) return 'danger';
    if (action.includes('view') || action.includes('access')) return 'info';
    return 'secondary';
  };

  if (isLoading) {
    return (
      <div className="management-profile-loading">
        <Spinner animation="border" variant="dark" />
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="management-profile-container">
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}
      {passwordError && <Alert variant="danger" dismissible onClose={() => setPasswordError('')}>{passwordError}</Alert>}
      {passwordSuccess && <Alert variant="success" dismissible onClose={() => setPasswordSuccess('')}>{passwordSuccess}</Alert>}

      <Row>
        {/* User Profile Section */}
        <Col lg={6} className="mb-4">
          <Card className="management-profile-card">
            <Card.Header className="management-profile-card-header">
              <h4><i className="bi bi-person-badge"></i> User Profile</h4>
              {!isEditing ? (
                <Button 
                  variant="outline-dark" 
                  size="sm" 
                  onClick={() => setIsEditing(true)}
                  className="management-profile-edit-btn"
                >
                  <i className="bi bi-pencil"></i> Edit
                </Button>
              ) : (
                <div className="management-profile-edit-actions">
                  <Button 
                    variant="dark" 
                    size="sm" 
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="me-2"
                  >
                    {isSaving ? <Spinner animation="border" size="sm" /> : <i className="bi bi-check"></i>} Save
                  </Button>
                  <Button 
                    variant="outline-dark" 
                    size="sm" 
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    <i className="bi bi-x"></i> Cancel
                  </Button>
                </div>
              )}
            </Card.Header>
            <Card.Body>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>First Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={profileForm.firstName}
                        onChange={(e) => handleProfileInputChange('firstName', e.target.value)}
                        disabled={!isEditing}
                        className="management-profile-input"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={profileForm.lastName}
                        onChange={(e) => handleProfileInputChange('lastName', e.target.value)}
                        disabled={!isEditing}
                        className="management-profile-input"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => handleProfileInputChange('email', e.target.value)}
                    disabled={!isEditing}
                    className="management-profile-input"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Contact Number</Form.Label>
                  <Form.Control
                    type="text"
                    value={profileForm.contactNumber}
                    onChange={(e) => handleProfileInputChange('contactNumber', e.target.value)}
                    disabled={!isEditing}
                    placeholder="e.g., +63 912 345 6789"
                    className="management-profile-input"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Position</Form.Label>
                  <Form.Control
                    type="text"
                    value={profileForm.position}
                    onChange={(e) => handleProfileInputChange('position', e.target.value)}
                    disabled={!isEditing}
                    className="management-profile-input"
                  />
                </Form.Group>

                <div className="management-profile-info-section">
                  <div className="management-profile-info-item">
                    <span className="label">Role:</span>
                    <Badge bg="dark" className="management-profile-badge">{profile?.role?.toUpperCase()}</Badge>
                  </div>
                  <div className="management-profile-info-item">
                    <span className="label">Status:</span>
                    <Badge bg={profile?.isActive ? 'success' : 'danger'} className="management-profile-badge">
                      {profile?.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="management-profile-info-item">
                    <span className="label">Account Created:</span>
                    <span className="value">{formatDate(profile?.createdAt)}</span>
                  </div>
                  <div className="management-profile-info-item">
                    <span className="label">Last Updated:</span>
                    <span className="value">{formatDate(profile?.updatedAt)}</span>
                  </div>
                </div>
              </Form>

              {/* Password Change Section */}
              <hr />
              <div className="management-profile-password-section">
                <h5>
                  <i className="bi bi-shield-lock"></i> Change Password
                </h5>
                {!showPasswordFields ? (
                  <Button 
                    variant="outline-dark" 
                    size="sm" 
                    onClick={() => setShowPasswordFields(true)}
                    className="management-profile-password-btn"
                  >
                    <i className="bi bi-key"></i> Change Password
                  </Button>
                ) : (
                  <div className="management-profile-password-form">
                    <Form.Group className="mb-3">
                      <Form.Label>Current Password</Form.Label>
                      <Form.Control
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                        placeholder="Enter current password"
                        className="management-profile-input"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>New Password</Form.Label>
                      <Form.Control
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                        placeholder="Enter new password"
                        className="management-profile-input"
                      />
                      <Form.Text className="text-muted">
                        Password must be at least 8 characters with uppercase, lowercase, and number.
                      </Form.Text>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Confirm New Password</Form.Label>
                      <Form.Control
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                        placeholder="Confirm new password"
                        className="management-profile-input"
                      />
                    </Form.Group>
                    <div className="management-profile-password-actions">
                      <Button 
                        variant="dark" 
                        size="sm" 
                        onClick={handleChangePassword}
                        disabled={isChangingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                        className="me-2"
                      >
                        {isChangingPassword ? <Spinner animation="border" size="sm" /> : <i className="bi bi-check"></i>} Update Password
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => {
                          setShowPasswordFields(false);
                          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          setPasswordError('');
                        }}
                        disabled={isChangingPassword}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Activities Section */}
        <Col lg={6} className="mb-4">
          <Card className="management-profile-card">
            <Card.Header className="management-profile-card-header">
              <h4><i className="bi bi-clock-history"></i> Recent Activities</h4>
              <Button 
                variant="outline-dark" 
                size="sm" 
                onClick={() => fetchActivities(activitiesPage)}
                disabled={activitiesLoading}
                className="management-profile-refresh-btn"
              >
                <i className="bi bi-arrow-clockwise"></i> Refresh
              </Button>
            </Card.Header>
            <Card.Body>
              {activitiesLoading ? (
                <div className="management-profile-activities-loading">
                  <Spinner animation="border" size="sm" variant="dark" />
                  <span className="ms-2">Loading activities...</span>
                </div>
              ) : activities.length === 0 ? (
                <div className="management-profile-no-activities">
                  <i className="bi bi-inbox"></i>
                  <p>No recent activities</p>
                </div>
              ) : (
                <>
                  <div className="management-profile-activities-list">
                    {activities.map((activity, index) => (
                      <div key={activity.id} className="management-profile-activity-item">
                        <div className="management-profile-activity-icon">
                          <Badge bg={getActionBadgeVariant(activity.action)}>
                            {index + 1}
                          </Badge>
                        </div>
                        <div className="management-profile-activity-content">
                          <div className="management-profile-activity-header">
                            <span className="management-profile-activity-action">
                              {activity.action.replace(/_/g, ' ').toUpperCase()}
                            </span>
                            <span className="management-profile-activity-time">
                              {formatDate(activity.timestamp)}
                            </span>
                          </div>
                          <p className="management-profile-activity-description">
                            {activity.actionDescription || activity.description || 'No description available'}
                          </p>
                          {activity.targetType && (
                            <div className="management-profile-activity-meta">
                              <Badge bg="light" text="dark" className="me-2">
                                <i className="bi bi-tag"></i> {activity.targetType}
                              </Badge>
                              {activity.ipAddress && (
                                <Badge bg="light" text="dark">
                                  <i className="bi bi-geo-alt"></i> {activity.ipAddress}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {activitiesTotal > 10 && (
                    <div className="management-profile-activities-pagination">
                      <Button
                        variant="outline-dark"
                        size="sm"
                        onClick={() => fetchActivities(activitiesPage - 1)}
                        disabled={activitiesPage === 1 || activitiesLoading}
                      >
                        <i className="bi bi-chevron-left"></i> Previous
                      </Button>
                      <span className="management-profile-page-info">
                        Page {activitiesPage} of {Math.ceil(activitiesTotal / 10)}
                      </span>
                      <Button
                        variant="outline-dark"
                        size="sm"
                        onClick={() => fetchActivities(activitiesPage + 1)}
                        disabled={activitiesPage >= Math.ceil(activitiesTotal / 10) || activitiesLoading}
                      >
                        Next <i className="bi bi-chevron-right"></i>
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ManagementProfile;
