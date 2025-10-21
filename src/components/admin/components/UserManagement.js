import React, { memo, useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, InputGroup, Alert, Spinner, Dropdown } from 'react-bootstrap';
import { useData } from '../../../context/DataContext';
import userService from '../../../services/userService';
import './UserManagement.css';

const UserManagement = memo(() => {
  // Position options organized by user type
  const positionsByUserType = {
    admin: [
      'City Health Officer',
      'Chief Administrative Officer',
      'IT Officer',
      'Encoder',
      'Utility'
    ],
    management: [
      'Chief Administrative Officer',
      'Admin & Support Services Records Officer',
      'Nurse'
    ],
    doctor: [
      'Medical Officer III',
      'Nurse',
      'Nutritionist-Dietitian',
      'ICO-D Officers',
      'Midwife'
    ]
  };

  // Get filtered positions based on user type
  const getPositionOptions = (userType) => {
    return positionsByUserType[userType] || [];
  };

  // State management
  const { backendConnected } = useData();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // Modal states
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showUserTypeSelectionModal, setShowUserTypeSelectionModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showManageDropdown, setShowManageDropdown] = useState(false);
  const [showUserTypeSelection, setShowUserTypeSelection] = useState(true);

  // Form states
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserType, setSelectedUserType] = useState('');
  const [userFormData, setUserFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    emailInitials: '',
    contactNumber: '',
    password: '',
    confirmPassword: '',
    role: 'doctor',
    position: '',
    accessLevel: ''
  });

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Password validation states
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Auto-save form data to localStorage
  useEffect(() => {
    if (userFormData.firstName || userFormData.lastName || userFormData.emailInitials) {
      localStorage.setItem('adminUserFormData', JSON.stringify(userFormData));
    }
  }, [userFormData]);

  // Browser navigation protection
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (userFormData.firstName || userFormData.lastName || userFormData.emailInitials) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [userFormData]);

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await userService.getUsers();
      
      // Add default access rights if missing
      const usersWithAccessRights = (response.users || []).map(user => ({
        ...user,
        accessRights: user.accessRights || {
          dashboard: true,
          patients: true,
          families: true,
          appointments: true,
          reports: true,
          users: user.role === 'admin',
          settings: user.role === 'admin'
        }
      }));
      
      setUsers(usersWithAccessRights);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle form input changes
  const handleInputChange = useCallback((field, value) => {
    setUserFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Validate password in real-time
    if (field === 'password') {
      validatePassword(value);
    }
  }, []);

  // Clear form data
  const clearFormData = useCallback(() => {
    setUserFormData({
      firstName: '',
      middleName: '',
      lastName: '',
      emailInitials: '',
      contactNumber: '',
      password: '',
      confirmPassword: '',
      role: 'doctor',
      position: '',
      accessLevel: ''
    });
    localStorage.removeItem('adminUserFormData');
  }, []);

  // Password validation function
  const validatePassword = (password) => {
    const errors = [];
    let strength = 0;

    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    } else {
      strength += 1;
    }

    if (password.length > 10) {
      errors.push('Password must not exceed 10 characters');
    }

    if (!/[a-zA-Z]/.test(password)) {
      errors.push('Password must contain at least one letter');
    } else {
      strength += 1;
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else {
      strength += 1;
    }

    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*)');
    } else {
      strength += 1;
    }

    // Additional strength checks
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) {
      strength += 1; // Mixed case
    }

    if (password.length >= 8) {
      strength += 1; // Good length
    }

    setPasswordErrors(errors);
    setPasswordStrength(Math.min(strength, 5));
    
    return errors.length > 0 ? errors[0] : null;
  };

  // Password generator function
  const generatePassword = () => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    
    let password = '';
    
    // Ensure at least one of each required type
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill remaining positions (4-6 more characters for 8-10 total)
    const allChars = lowercase + uppercase + numbers + symbols;
    const remainingLength = Math.floor(Math.random() * 3) + 4; // 4-6 more chars
    
    for (let i = 0; i < remainingLength; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    handleInputChange('password', password);
    handleInputChange('confirmPassword', '');
  };

  // Get password strength label and color
  const getPasswordStrengthInfo = () => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return { label: 'Very Weak', color: '#dc3545', width: '20%' };
      case 2:
        return { label: 'Weak', color: '#fd7e14', width: '40%' };
      case 3:
        return { label: 'Fair', color: '#ffc107', width: '60%' };
      case 4:
        return { label: 'Good', color: '#20c997', width: '80%' };
      case 5:
        return { label: 'Strong', color: '#28a745', width: '100%' };
      default:
        return { label: 'Very Weak', color: '#dc3545', width: '20%' };
    }
  };

  // Handle user type selection
  const handleUserTypeSelect = (userType) => {
    setSelectedUserType(userType);
    setShowUserTypeSelectionModal(false);
    setShowAddUserModal(true);
    
    // Set defaults based on user type with appropriate positions
    const defaults = userType === 'admin' 
      ? { role: 'admin', position: 'City Health Officer', accessLevel: 'Administrator' }
      : userType === 'management'
      ? { role: 'management', position: 'Chief Administrative Officer', accessLevel: 'Management' }
      : { role: 'doctor', position: 'Medical Officer III', accessLevel: 'Doctor' };
    
    setUserFormData(prev => ({ ...prev, ...defaults }));
    localStorage.setItem('adminSelectedUserType', userType);
  };

  // Handle save new user
  const handleSaveUser = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!userFormData.firstName || !userFormData.lastName || !userFormData.emailInitials) {
      setError('Please fill in all required fields');
      return;
    }
    
    // Check if password has errors
    if (passwordErrors.length > 0) {
      return; // Don't submit if password validation fails
    }
    
    if (userFormData.password !== userFormData.confirmPassword) {
      return; // Don't submit if passwords don't match
    }

    try {
      setIsLoading(true);
      setError('');
      
      const userData = {
        firstName: userFormData.firstName,
        middleName: userFormData.middleName,
        lastName: userFormData.lastName,
        emailInitials: userFormData.emailInitials,
        password: userFormData.password,
        accessLevel: selectedUserType === 'admin' ? 'Administrator' : selectedUserType === 'management' ? 'Management' : 'Doctor',
        position: userFormData.position || (selectedUserType === 'admin' ? 'City Health Officer' : selectedUserType === 'management' ? 'Chief Administrative Officer' : 'Medical Officer III')
      };

      await userService.createUser(userData);
      
      // Refresh users list
      await fetchUsers();
      
      // Show success message
      alert(`Successfully created user account for ${userFormData.firstName} ${userFormData.lastName}.\n\nLogin credentials:\nEmail: ${userData.emailInitials}@maybunga.health\nPassword: [as provided]`);
      
      // Reset form
      clearFormData();
      setShowUserTypeSelection(true);
      setSelectedUserType('');
      setShowAddUserModal(false);
      
    } catch (error) {
      console.error('Error creating user:', error);
      setError(error.response?.data?.msg || 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit user
  const handleEditUser = async (e) => {
    e.preventDefault();
    
    if (!selectedUser) {
      setError('No user selected for editing');
      return;
    }

    // Validation
    if (userFormData.password && userFormData.password !== userFormData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!userFormData.firstName || !userFormData.lastName || !userFormData.emailInitials) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      const userData = {
        firstName: userFormData.firstName,
        middleName: userFormData.middleName,
        lastName: userFormData.lastName,
        emailInitials: userFormData.emailInitials,
        position: userFormData.position,
        role: userFormData.role
      };

      // Only include password if it's being changed
      if (userFormData.password) {
        userData.password = userFormData.password;
      }

      await userService.updateUser(selectedUser.id, userData);
      
      // Refresh users list
      await fetchUsers();
      
      alert('User updated successfully');
      setShowEditUserModal(false);
      setSelectedUser(null);
      clearFormData();
      
    } catch (error) {
      console.error('Error updating user:', error);
      setError(error.response?.data?.msg || 'Failed to update user');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setIsLoading(true);
      setError('');
      
      await userService.deleteUser(selectedUser.id);
      
      // Refresh users list
      await fetchUsers();
      
      alert('User deleted successfully');
      setShowDeleteModal(false);
      setSelectedUser(null);
      
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error.response?.data?.msg || 'Failed to delete user');
    } finally {
      setIsLoading(false);
    }
  };

  // Role badge component
  const RoleBadge = ({ role, accessLevel }) => (
    <span className={`role-badge ${role}`}>
      {accessLevel || (role === 'admin' ? 'Administrator' : role === 'management' ? 'Management' : 'Doctor/Staff')}
    </span>
  );

  return (
    <div className="user-management">
      <div className="content-header">
        <h1>
          <span className={`badge ms-3 ${backendConnected ? 'bg-success' : 'bg-danger'}`}>
            <i className={`bi ${backendConnected ? 'bi-check-circle' : 'bi-x-circle'} me-1`}></i>
            {backendConnected ? 'Connected' : 'Disconnected'}
          </span>
        </h1>
        <div className="header-actions">
          <Dropdown show={showManageDropdown} onToggle={setShowManageDropdown} className="user-management-dropdown">
            <Dropdown.Toggle as={Button} variant="primary" className="manage-btn">
              <i className="bi bi-gear me-2"></i>
              Manage
            </Dropdown.Toggle>
            <Dropdown.Menu className="user-management-dropdown-menu">
              <Dropdown.Item onClick={() => {
                setShowUserTypeSelectionModal(true);
                setShowManageDropdown(false);
                setSelectedUserType('');
                clearFormData();
              }}>
                <i className="bi bi-person-plus me-2"></i>
                Add User
              </Dropdown.Item>
              <Dropdown.Item onClick={() => {
                setIsEditMode(!isEditMode);
                setShowManageDropdown(false);
              }}>
                <i className="bi bi-pencil me-2"></i>
                {isEditMode ? 'Cancel Edit' : 'Edit Users'}
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {/* Info Banner for Profile Updates */}
      <Alert variant="info" className="mb-3 user-management-info-banner">
        <i className="bi bi-info-circle me-2"></i>
        <strong>Note:</strong> Profiles created can be updated its info on their settings.
      </Alert>

      <div className="users-table-container">
        {isLoading ? (
          <div className="text-center p-4">
            <Spinner animation="border" />
            <p className="mt-2">Loading users...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <Table hover responsive className="checkup-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>USERNAME</th>
                  <th>FULL NAME</th>
                  <th>ROLE</th>
                  <th>USER TYPE</th>
                  <th>PASSWORD</th>
                  {isEditMode && <th>ACTIONS</th>}
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user.id}>
                    <td className="row-number">{index + 1}</td>
                    <td className="username-cell">{user.username}</td>
                    <td className="fullname-cell">
                      <div>
                        <strong>{user.firstName} {user.lastName}</strong>
                      </div>
                    </td>
                    <td>{user.role}</td>
                    <td><RoleBadge role={user.role} accessLevel={user.accessLevel} /></td>
                    <td><span className="password-mask">••••••••</span></td>
                    {isEditMode && (
                      <td className="action-cell">
                        <div className="action-buttons-group d-flex gap-1">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="action-btn"
                            onClick={() => {
                              setSelectedUser(user);
                              setUserFormData({
                                firstName: user.firstName,
                                middleName: user.middleName || '',
                                lastName: user.lastName,
                                emailInitials: user.username || user.email?.split('@')[0] || '',
                                contactNumber: user.contactNumber || '',
                                password: '',
                                confirmPassword: '',
                                role: user.role,
                                position: user.position || user.accessLevel || 'Staff',
                                accessLevel: user.accessLevel || ''
                              });
                              setShowEditUserModal(true);
                            }}
                            title="Edit User"
                          >
                            <i className="bi bi-pencil me-1"></i>
                            Edit
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="action-btn"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteModal(true);
                            }}
                            title="Delete User"
                          >
                            <i className="bi bi-trash me-1"></i>
                            Delete
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </div>

      {/* User Type Selection Modal */}
      <Modal 
        show={showUserTypeSelectionModal} 
        onHide={() => setShowUserTypeSelectionModal(false)} 
        size="md" 
        className="user-type-selection-modal"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-person-plus me-2"></i>
            Select User Type
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="user-type-selection">
            <div 
              className="user-type-card admin-card"
              onClick={() => handleUserTypeSelect('admin')}
            >
              <i className="bi bi-shield-check"></i>
              <h5>Administrator</h5>
              <p>Full system access and user management</p>
            </div>
            <div 
              className="user-type-card doctor-card"
              onClick={() => handleUserTypeSelect('doctor')}
            >
              <i className="bi bi-person-badge"></i>
              <h5>Medical Staff</h5>
              <p>Doctor, Nurse, or Medical Personnel</p>
            </div>
            <div 
              className="user-type-card management-card"
              onClick={() => handleUserTypeSelect('management')}
            >
              <i className="bi bi-building"></i>
              <h5>Management</h5>
              <p>Inventory and reports management</p>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {/* Add User Form Modal */}
      <Modal 
        show={showAddUserModal} 
        onHide={() => setShowAddUserModal(false)} 
        size="lg" 
        className="user-form-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-person-plus me-2"></i>
            Add New User
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSaveUser}>
            <div className="mb-3">
              <strong>User Type: </strong>
              <span className={`badge ${selectedUserType === 'admin' ? 'bg-primary' : selectedUserType === 'management' ? 'bg-warning' : 'bg-success'}`}>
                {selectedUserType === 'admin' ? 'Administrator' : selectedUserType === 'management' ? 'Management' : 'Medical Staff'}
              </span>
              <Button
                variant="link"
                size="sm"
                className="ms-2"
                onClick={() => {
                  setShowAddUserModal(false);
                  setShowUserTypeSelectionModal(true);
                }}
              >
                Change
              </Button>
            </div>

            {/* Row 1: First, Middle, Last Names */}
            <div className="row mb-4">
              <div className="col-4">
                <Form.Group>
                  <Form.Label>First Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={userFormData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-4">
                <Form.Group>
                  <Form.Label>Middle Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={userFormData.middleName}
                    onChange={(e) => handleInputChange('middleName', e.target.value)}
                  />
                </Form.Group>
              </div>
              <div className="col-4">
                <Form.Group>
                  <Form.Label>Last Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={userFormData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                  />
                </Form.Group>
              </div>
            </div>

              {/* Row 2: Email, Position/Role */}
              <div className="row mb-4">
                <div className="col-8">
                  <Form.Group>
                    <Form.Label>Email *</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        value={userFormData.emailInitials}
                        onChange={(e) => handleInputChange('emailInitials', e.target.value)}
                        placeholder="e.g., jdoe"
                        required
                      />
                      <InputGroup.Text>@brgymaybunga.health</InputGroup.Text>
                    </InputGroup>
                  </Form.Group>
                </div>
                <div className="col-4">
                  <Form.Group>
                    <Form.Label>Position</Form.Label>
                    <Form.Select
                      value={userFormData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                    >
                      <option value="">Select Position</option>
                      {getPositionOptions(selectedUserType).map((position, index) => (
                        <option key={index} value={position}>
                          {position}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </div>
              </div>

              {/* Row 3: Password, Confirm Password */}
              <div className="row mb-4">
                <div className="col-6">
                  <Form.Group>
                    <Form.Label>Password *</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        value={userFormData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required
                        maxLength={10}
                        minLength={6}
                        title="Password must be 6-10 characters, include letters, numbers, and symbols"
                        pattern="^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,10}$"
                        isInvalid={passwordErrors.length > 0}
                      />
                      <InputGroup.Text 
                        style={{ cursor: 'pointer' }}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </InputGroup.Text>
                    </InputGroup>
                    
                    {/* Password Strength Meter */}
                    {userFormData.password && (
                      <div className="mt-2">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <small className="text-muted">Password Strength:</small>
                          <small style={{ color: getPasswordStrengthInfo().color, fontWeight: 'bold' }}>
                            {getPasswordStrengthInfo().label}
                          </small>
                        </div>
                        <div className="progress" style={{ height: '4px' }}>
                          <div 
                            className="progress-bar" 
                            style={{ 
                              width: getPasswordStrengthInfo().width,
                              backgroundColor: getPasswordStrengthInfo().color,
                              transition: 'all 0.3s ease'
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {/* Password Errors */}
                    {passwordErrors.length > 0 && (
                      <div className="mt-2">
                        {passwordErrors.map((error, index) => (
                          <div key={index} className="text-danger small">
                            <i className="bi bi-exclamation-circle me-1"></i>
                            {error}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Password Generator */}
                    <div className="mt-2">
                      <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        onClick={generatePassword}
                        type="button"
                      >
                        <i className="bi bi-arrow-clockwise me-1"></i>
                        Generate Strong Password
                      </Button>
                    </div>
                  </Form.Group>
                </div>
                <div className="col-6">
                  <Form.Group>
                    <Form.Label>Confirm Password *</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type={showConfirmPassword ? "text" : "password"}
                        value={userFormData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        required
                        maxLength={10}
                        isInvalid={userFormData.confirmPassword && userFormData.password !== userFormData.confirmPassword}
                      />
                      <InputGroup.Text 
                        style={{ cursor: 'pointer' }}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </InputGroup.Text>
                    </InputGroup>
                    
                    {/* Password Match Indicator */}
                    {userFormData.confirmPassword && (
                      <div className="mt-2">
                        {userFormData.password === userFormData.confirmPassword ? (
                          <div className="text-success small">
                            <i className="bi bi-check-circle me-1"></i>
                            Passwords match
                          </div>
                        ) : (
                          <div className="text-danger small">
                            <i className="bi bi-x-circle me-1"></i>
                            Passwords do not match
                          </div>
                        )}
                      </div>
                    )}
                  </Form.Group>
                </div>
              </div>
            </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddUserModal(false)}>
            Cancel
          </Button>
          <Button variant="outline-secondary" onClick={clearFormData}>
            Clear Form
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSaveUser}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Creating...
                  </>
                ) : (
                  'Create User Account'
                )}
              </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit User Modal */}
      <Modal show={showEditUserModal} onHide={() => setShowEditUserModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-pencil me-2"></i>
            Edit User: {selectedUser?.firstName} {selectedUser?.lastName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEditUser}>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>First Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={userFormData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Middle Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={userFormData.middleName}
                    onChange={(e) => handleInputChange('middleName', e.target.value)}
                  />
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Last Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={userFormData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Email Initials *</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      value={userFormData.emailInitials}
                      onChange={(e) => handleInputChange('emailInitials', e.target.value)}
                      required
                    />
                    <InputGroup.Text>@maybunga.health</InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Position</Form.Label>
                  <Form.Select
                    value={userFormData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                  >
                    <option value="">Select Position</option>
                    {getPositionOptions(userFormData.role).map((position, index) => (
                      <option key={index} value={position}>
                        {position}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Select
                    value={userFormData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                  >
                    <option value="admin">Administrator</option>
                    <option value="doctor">Doctor/Medical Staff</option>
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>New Password (leave blank to keep current)</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      value={userFormData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Enter new password or leave blank"
                    />
                    <InputGroup.Text 
                      style={{ cursor: 'pointer' }}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Confirm New Password</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showConfirmPassword ? "text" : "password"}
                      value={userFormData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Confirm new password"
                    />
                    <InputGroup.Text 
                      style={{ cursor: 'pointer' }}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </div>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditUserModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleEditUser}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Updating...
              </>
            ) : (
              'Update User'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-exclamation-triangle me-2 text-danger"></i>
            Confirm Delete
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete the user <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>?</p>
          <p className="text-danger"><strong>This action cannot be undone.</strong></p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteUser}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              'Delete User'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
});

UserManagement.displayName = 'UserManagement';

export default UserManagement;
