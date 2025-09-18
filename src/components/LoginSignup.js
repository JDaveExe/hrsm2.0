import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Nav, Alert, Image, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { QRCodeCanvas as QRCode } from 'qrcode.react';
import { QrReader } from 'react-qr-reader';
import authService from '../services/authService';
import { Link } from 'react-router-dom'; // Assuming you'll use React Router for navigation
import { useAuth } from '../context/AuthContext'; // Import the auth context
import { useData } from '../context/DataContext'; // Import the data context
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/LoginSignup.css'; // New CSS file

const LoginSignup = () => {
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  const [activeKey, setActiveKey] = useState('login');
  const navigate = useNavigate(); // Initialize useNavigate
  const { login, logout, isAuthenticated, user, setIsLoading } = useAuth(); // Use auth context
  const { addUnsortedMember } = useData(); // Use data context
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);

  // ===== LOGIN STATE (Copied from AuthPage.js) =====
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isQrLogin, setIsQrLogin] = useState(false);
  const [qrData, setQrData] = useState("");
  const [showQrScanner, setShowQrScanner] = useState(false);

  // ===== REGISTRATION STATE (Copied from AuthPage.js) =====
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    email: '',
    password: '',
    repeatPassword: '',
    phoneNumber: '',
    houseNo: '',
    street: '',
    barangay: '',
    city: 'Pasig',
    region: 'Metro Manila',
    philHealthNumber: '',
    membershipStatus: 'Member',
    dateOfBirth: null,
    age: '',
    gender: '',
    civilStatus: ''
  });
  const [registrationMessage, setRegistrationMessage] = useState('');
  const [registrationError, setRegistrationError] = useState('');
  const [regPasswordStrength, setRegPasswordStrength] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [userQrValue, setUserQrValue] = useState("");

  // ===== REGISTRATION DATA (Copied from AuthPage.js) =====
  const suffixOptions = ['', 'Jr.', 'Sr.', 'II', 'III', 'IV', 'V'];
  const pasigStreets = [
    'Amang Rodriguez Avenue', 'C. Raymundo Avenue', 'Ortigas Avenue', 'Shaw Boulevard',
    'E. Rodriguez Jr. Avenue (C-5)', 'Marcos Highway', 'Julia Vargas Avenue',
    'F. Legaspi Bridge', 'San Guillermo Street', 'Dr. Sixto Antonio Avenue'
  ];
  const streetToBarangay = {
    'Amang Rodriguez Avenue': ['Manggahan', 'Rosario', 'Dela Paz'],
    'C. Raymundo Avenue': ['Caniogan', 'Pineda', 'Rosario'],
    'Ortigas Avenue': ['San Antonio', 'Ugong', 'Kapitolyo'],
    'Shaw Boulevard': ['Kapitolyo', 'Oranbo', 'Bagong Ilog'],
    'E. Rodriguez Jr. Avenue (C-5)': ['Ugong', 'Bagong Ilog', 'Pinagbuhatan'],
    'Marcos Highway': ['Maybunga', 'Manggahan', 'Santolan'],
    'Julia Vargas Avenue': ['San Antonio', 'Oranbo', 'Ugong'],
    'F. Legaspi Bridge': ['San Joaquin', 'Kalawaan', 'Malinao'],
    'San Guillermo Street': ['San Jose', 'Pineda', 'Palatiw'],
    'Dr. Sixto Antonio Avenue': ['Kapasigan', 'Bagong Ilog', 'Caniogan']
  };

  // ===== PASSWORD STRENGTH CHECKER (Copied from AuthPage.js) =====
  const checkPasswordStrength = (password) => {
    if (!password) return "";
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\\d/.test(password); // Keep double backslash for regex
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const length = password.length;

    if (length < 4) return "very-weak";
    if (length < 6) return "weak";
    const securityFeatures = [hasLowerCase, hasUpperCase, hasNumber, hasSpecialChar].filter(Boolean).length;
    if (length >= 6 && length < 8) return securityFeatures >= 2 ? "medium" : "weak";
    if (length >= 8 && length < 10) return securityFeatures >= 2 ? "strong" : "medium";
    if (length >= 10) return securityFeatures >= 3 ? "very-strong" : "strong"; // Adjusted for very-strong
    return "medium";
  };

  useEffect(() => {
    setRegPasswordStrength(checkPasswordStrength(formData.password));
  }, [formData.password]);

  // Auto-login based on port (DISABLED - now handled in App.js to prevent redirect loops)
  // useEffect(() => {
  //   const currentPort = window.location.port;
  //   
  //   // Define auto-login mapping for different ports
  //   const autoLoginConfig = {
  //     '3001': { username: 'doctor', password: 'doctor123', role: 'doctor', dashboard: '/doctor/dashboard' },
  //     '3002': { username: 'patient', password: 'patient123', role: 'patient', dashboard: '/patient/dashboard' },
  //     // Future: '3003': { username: 'admin', password: 'admin123', role: 'admin', dashboard: '/admin/dashboard' }
  //   };
  //   
  //   const config = autoLoginConfig[currentPort];
  //   
  //   // If running on a configured port and no user is authenticated and auto-login hasn't been attempted
  //   if (config && !isAuthenticated && !autoLoginAttempted) {
  //     setAutoLoginAttempted(true);
  //     setIsAutoLoggingIn(true);
  //     
  //     // Auto-login based on port configuration
  //     const autoLogin = async () => {
  //       try {
  //         setIsAutoLoggingIn(true);
  //         setIsLoading(true);
  //         console.log(`🔄 Auto-login detected for port ${currentPort} - logging in as ${config.role}...`);
  //         
  //         const response = await authService.login(config.username, config.password);
  //         if (response && response.user) {
  //           // Use auth context to store user data and token
  //           login({ user: response.user, token: response.token });
  //           
  //           // Navigate to appropriate dashboard
  //           navigate(config.dashboard);
  //           
  //           console.log(`✅ Auto-login successful - redirected to ${config.role} dashboard`);
  //         }
  //       } catch (error) {
  //         console.error('❌ Auto-login failed:', error);
  //         // Don't show error to user, just log it and let them login manually
  //         setIsLoading(false);
  //       } finally {
  //         setIsAutoLoggingIn(false);
  //       }
  //     };
  //     
  //     // Add a small delay to let the component mount properly
  //     setTimeout(autoLogin, 1000);
  //   }
  // }, [isAuthenticated, autoLoginAttempted, login, navigate]);

  // Don't automatically redirect - let users access login page even when authenticated
  // They might want to logout or switch accounts

  // ===== LOGIN FUNCTIONS (Placeholders - Copied from AuthPage.js) =====
  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleRegPasswordVisibility = () => setShowRegPassword(!showRegPassword);

  const handleLogin = async () => {
    setLoginError('');
    // Placeholder: Simulate API call
    if (emailOrPhone && password) {
      // Removed alert and console.log from here
      // TODO: Implement actual login logic here
    } else {
      setLoginError("Please enter both email/phone and password.");
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    try {
      const response = await authService.login(emailOrPhone, password);
      console.log('🔐 Login response received:', response);
      console.log('🔐 Token:', response.token);
      console.log('🔐 User:', response.user);
      
      if (response && response.user) {
        // Use auth context to store user data and token
        console.log('🔐 Calling login with:', { user: response.user, token: response.token });
        login({ user: response.user, token: response.token });
        
        // Redirect based on user role
        console.log('🔐 User role for redirect:', response.user.role);
        switch (response.user.role) {
          case 'admin':
            console.log('🔐 Redirecting to admin dashboard');
            navigate('/admin/dashboard');
            break;
          case 'doctor':
            console.log('🔐 Redirecting to doctor dashboard');
            navigate('/doctor/dashboard');
            break;
          case 'patient':
            console.log('🔐 Redirecting to patient dashboard');
            navigate('/patient/dashboard');
            break;
          case 'management':
            console.log('🔐 Redirecting to management dashboard');
            navigate('/management/dashboard');
            break;
          default:
            console.log('🔐 Unknown role, redirecting to homepage. Role was:', response.user.role);
            navigate('/'); // Or a default dashboard
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.msg || "An unexpected error occurred. Please try again.";
      setLoginError(errorMessage);
      setIsLoading(false);
    }
  };

  const toggleQrLogin = () => {
    setIsQrLogin(!isQrLogin);
    setShowQrScanner(!isQrLogin); // Show scanner when QR login is active
    setLoginError(''); // Clear errors
  };

  const handleQrLogin = async (scannedQrData) => {
    console.log("QR Login attempt with data:", scannedQrData);
    alert(`QR Login attempt with data: ${scannedQrData}`);
    // TODO: Implement actual QR login logic here
    // This is a placeholder
    if (scannedQrData) {
      // Simulate successful QR login
    } else {
      setLoginError("Invalid QR code data.");
    }
    setIsQrLogin(false); // Reset to password login after attempt
    setShowQrScanner(false);
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (activeTab === 'login' && !isQrLogin) {
        handleLogin();
      }
      // For registration, enter key is handled by form submission
    }
  };

  // ===== REGISTRATION FUNCTIONS (Placeholders - Copied from AuthPage.js) =====
  const getAvailableBarangays = () => {
    if (formData.street && streetToBarangay[formData.street]) {
      return streetToBarangay[formData.street];
    }
    return [];
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = value;
    
    // Auto-capitalize first, middle, last name fields
    if (["firstName", "middleName", "lastName"].includes(name)) {
      newValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    }
    
    // Phone number validation - only allow numbers and enforce 11 digit limit starting with 09
    if (name === 'phoneNumber') {
      // Remove any non-digit characters
      newValue = value.replace(/\D/g, '');
      
      // Limit to 11 digits
      if (newValue.length > 11) {
        newValue = newValue.slice(0, 11);
      }
      
      // If user starts typing, ensure it starts with 09
      if (newValue.length > 0 && !newValue.startsWith('09')) {
        // If they typed something that doesn't start with 09, prepend 09 or correct it
        if (newValue.length === 1 && newValue === '9') {
          newValue = '09';
        } else if (newValue.length >= 2 && !newValue.startsWith('09')) {
          // Keep the existing behavior - let them type but validation will catch it
        }
      }
    }
    
    if (name === 'street') {
      setFormData((prev) => ({
        ...prev,
        street: newValue,
        barangay: '' // Reset barangay when street changes
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : newValue
      }));
    }
  };
  
  const handleDateChange = (date) => {
    const today = new Date();
    let computedAge = '';
    if (date) {
      let age = today.getFullYear() - date.getFullYear();
      const m = today.getMonth() - date.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
        age--;
      }
      computedAge = age.toString();
    }
    setFormData((prev) => ({
      ...prev,
      dateOfBirth: date,
      age: computedAge
    }));
  };

  const generateQrToken = () => {
    const randomString = Math.random().toString(36).substring(2, 15);
    const timestamp = new Date().getTime().toString(36);
    return randomString + timestamp;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRegistrationError("");
    setRegistrationMessage('');
    setIsLoading(true);

    if (!formData.email && !formData.phoneNumber) {
      setRegistrationError("Please provide either an email or a phone number.");
      setIsLoading(false);
      return;
    }
    
    // Validate phone number format if provided
    if (formData.phoneNumber) {
      const phoneRegex = /^09\d{9}$/;
      if (!phoneRegex.test(formData.phoneNumber)) {
        setRegistrationError("Phone number must be exactly 11 digits starting with 09 (e.g., 09171234567).");
        setIsLoading(false);
        return;
      }
    }
    
    if (formData.password !== formData.repeatPassword) {
      setRegistrationError("Passwords do not match.");
      setIsLoading(false);
      return;
    }
    if (!formData.firstName || !formData.lastName || !formData.password) {
      setRegistrationError("Please fill in all required fields.");
      setIsLoading(false);
      return;
    }
    if (!formData.dateOfBirth) {
      setRegistrationError("Date of birth is required.");
      setIsLoading(false);
      return;
    }
    if (!formData.gender) {
      setRegistrationError("Gender is required.");
      setIsLoading(false);
      return;
    }

    try {
      // Call the registration API
      const response = await authService.register(formData);
      
      if (response && response.user) {
        // Use auth context to store user data and token
        login({ user: response.user, token: response.token });
        
        // Add patient to unsorted members in the data context
        const patientData = {
          id: response.user.patientId,
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          suffix: formData.suffix,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          address: `${formData.houseNo ? formData.houseNo + ', ' : ''}${formData.street ? formData.street + ', ' : ''}${formData.barangay ? formData.barangay + ', ' : ''}${formData.city}, ${formData.region}`,
          dateOfBirth: formData.dateOfBirth,
          age: formData.age,
          gender: formData.gender,
          civilStatus: formData.civilStatus,
          philHealthNumber: formData.philHealthNumber,
          membershipStatus: formData.membershipStatus,
          qrCode: response.user.qrCode,
          registeredAt: new Date().toISOString(),
          familyId: null, // Unsorted member
        };
        
        addUnsortedMember(patientData);
        
        // Set the QR code value from the response
        setUserQrValue(JSON.stringify({ 
          userId: response.user.id, 
          patientId: response.user.patientId,
          token: response.user.qrCode 
        }));
        
        setRegistrationMessage('Registration successful! You have been added to the system. Here is your QR code for quick login.');
        setRegistrationComplete(true);
        setShowQrCode(true);
        
        // Clear the form
        setFormData({
          firstName: '',
          middleName: '',
          lastName: '',
          suffix: '',
          email: '',
          password: '',
          repeatPassword: '',
          phoneNumber: '',
          houseNo: '',
          street: '',
          barangay: '',
          city: 'Pasig',
          region: 'Metro Manila',
          philHealthNumber: '',
          membershipStatus: 'Member',
          dateOfBirth: null,
          age: '',
          gender: '',
          civilStatus: ''
        });
      }
    } catch (error) {
      const errorMessage =
        (error.response &&
          error.response.data &&
          error.response.data.msg) ||
        (error.response &&
          error.response.data &&
          error.response.data.errors &&
          error.response.data.errors[0] &&
          error.response.data.errors[0].msg) ||
        error.message ||
        error.toString();
      setRegistrationError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById("user-qr-code-new"); // Ensure unique ID
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `maybunga_health_qr_${formData.firstName || 'user'}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const printQRCode = () => {
    const canvas = document.getElementById('user-qr-code-new');
    if (!canvas) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>Your QR Code</title>
      <style> body { text-align: center; font-family: Arial, sans-serif; } .qr-container { margin-top: 50px; } </style>
      </head><body>
      <h2>Maybunga Health Center - Quick Login QR Code</h2>
      <div class="qr-container"><img src="${canvas.toDataURL()}" alt="QR Code"/></div>
      <p>Name: ${formData.firstName} ${formData.lastName}</p>
      <p>Keep this QR code safe. You can use it to log in quickly.</p>
      <script>window.onload = () => { window.print(); window.close(); }</script>
      </body></html>
    `);
    printWindow.document.close();
  };
  
  // Password strength indicator UI component
  const PasswordStrengthIndicator = ({ strength }) => {
    if (!strength) return null;
    const strengthConfig = {
      "very-weak": { colorClass: "bg-danger", label: "Very Weak", width: "20%" },
      "weak": { colorClass: "bg-warning", label: "Weak", width: "40%" },
      "medium": { colorClass: "bg-info", label: "Medium", width: "60%" },
      "strong": { colorClass: "bg-success", label: "Strong", width: "80%" },
      "very-strong": { colorClass: "bg-success", label: "Very Strong", width: "100%" },
    };
    const config = strengthConfig[strength] || { colorClass: "", label: "", width: "0%" };

    return (
      <div className="mt-1 password-strength-indicator">
        <div className="progress" style={{ height: '5px' }}>
          <div
            className={`progress-bar ${config.colorClass}`}
            style={{ width: config.width }}
          ></div>
        </div>
        {config.label && <small className="ms-2 text-muted d-block text-end">{config.label}</small>}
      </div>
    );
  };

  // Render Login Form
  const renderLoginForm = () => (
    <Form onSubmit={handleLoginSubmit} className="auth-form">
      {loginError && <Alert variant="danger">{loginError}</Alert>}
      {!isQrLogin ? (
        <>
          <Form.Group className="mb-3" controlId="loginEmailOrPhone">
            <Form.Label>Email or Phone Number</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter your email or phone number"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              // onKeyPress={handleKeyPress} // Removed this line
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="loginPassword">
            <Form.Label>Password</Form.Label>
            <InputGroup>
              <Form.Control
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                // onKeyPress={handleKeyPress} // Removed this line
                required
              />
              <Button variant="outline-secondary" onClick={togglePasswordVisibility}>
                {showPassword ? <i className="bi bi-eye-slash"></i> : <i className="bi bi-eye"></i>}
              </Button>
            </InputGroup>
          </Form.Group>          <div className="d-flex justify-content-between align-items-center mb-3">
            <Form.Check
              type="checkbox"
              label="Remember me"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <Link to="/forgot-password">Forgot password?</Link> {/* Placeholder Link */}
          </div>
          <Button variant="primary" type="submit" className="w-100 mb-3">
            Log In
          </Button>
        </>
      ) : (
        <div className="qr-scanner-section text-center">
          <h5>Scan QR Code to Login</h5>
          {showQrScanner && (
            <div className="qr-reader-container my-3">
              <QrReader
                constraints={{ facingMode: 'environment' }}
                onResult={(result, error) => {
                  if (!!result) {
                    handleQrLogin(result?.text);
                  }
                  if (!!error) {
                    console.info(error);
                  }
                }}
                style={{ width: '100%', maxWidth: '300px', margin: 'auto' }}
              />
            </div>
          )}
          <p className="text-muted">Align QR code within the frame.</p>
        </div>
      )}
      <Button variant="outline-secondary" onClick={toggleQrLogin} className="w-100">
        {isQrLogin ? 'Login with Email/Password' : 'Login with QR Code'}
      </Button>
    </Form>
  );

  // Render Registration Form
  const renderRegistrationForm = () => (
    <Form onSubmit={handleSubmit} className="auth-form">
      {registrationMessage && <div className="alert alert-success w-100">{registrationMessage}</div>}
      {registrationError && <div className="alert alert-danger w-100">{registrationError}</div>}

      {showQrCode && registrationComplete ? (
        <div className="qr-code-display text-center">
          <h4>Your Registration QR Code</h4>
          <QRCode id="user-qr-code-new" value={userQrValue} size={180} level="H" includeMargin={true} className="my-3" />
          <p>Save this QR code for quick login.</p>
          <Button variant="primary" onClick={downloadQRCode} className="me-2">Download</Button>
          <Button variant="secondary" onClick={printQRCode}>Print</Button>
          <Button variant="link" onClick={() => { setShowQrCode(false); setActiveTab('login');}} className="d-block mx-auto mt-2">
            Go to Login
          </Button>
        </div>
      ) : (
        <>
          <Card className="mb-4">
            <Card.Header as="h5" className="my-2">Personal Information</Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col md={3}><Form.Group><Form.Label>First Name</Form.Label><Form.Control type="text" name="firstName" value={formData.firstName} onChange={handleChange} required /></Form.Group></Col>
                <Col md={3}><Form.Group><Form.Label>Middle Name</Form.Label><Form.Control type="text" name="middleName" value={formData.middleName} onChange={handleChange} /></Form.Group></Col>
                <Col md={3}><Form.Group><Form.Label>Last Name</Form.Label><Form.Control type="text" name="lastName" value={formData.lastName} onChange={handleChange} required /></Form.Group></Col>
                <Col md={3}><Form.Group><Form.Label>Suffix</Form.Label><Form.Select name="suffix" value={formData.suffix} onChange={handleChange}><option value="">Select</option>{suffixOptions.map(s => <option key={s} value={s}>{s || 'None'}</option>)}</Form.Select></Form.Group></Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header as="h5" className="my-2">Account Credentials</Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col md={6}><Form.Group><Form.Label>Email</Form.Label><Form.Control type="email" name="email" value={formData.email} onChange={handleChange} /></Form.Group></Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control 
                      type="tel" 
                      name="phoneNumber" 
                      value={formData.phoneNumber} 
                      onChange={handleChange} 
                      placeholder="09XXXXXXXXX" 
                      pattern="^09\d{9}$" 
                      maxLength="11"
                      title="Must be a valid PH mobile number starting with 09 (11 digits total)"
                    />
                    <Form.Text className="text-muted">
                      Format: 09XXXXXXXXX (11 digits total)
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              <Form.Text className="text-muted d-block mb-2">
                Please provide either an email or a phone number.
              </Form.Text>
              <Row className="mb-3">
                <Col md={6}>
                    <Form.Group className="position-relative"><Form.Label>Password</Form.Label><Form.Control type={showRegPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required /><span className="password-toggle" onClick={toggleRegPasswordVisibility}>{showRegPassword ? <i className="bi bi-eye-slash"></i> : <i className="bi bi-eye"></i>}</span></Form.Group>
                    <PasswordStrengthIndicator strength={regPasswordStrength} />
                </Col>
                <Col md={6}><Form.Group><Form.Label>Repeat Password</Form.Label><Form.Control type={showRegPassword ? 'text' : 'password'} name="repeatPassword" value={formData.repeatPassword} onChange={handleChange} required /></Form.Group></Col>
              </Row>
            </Card.Body>
          </Card>
          
          <Card className="mb-4">
            <Card.Header as="h5" className="my-2">Address</Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col md={2}><Form.Group><Form.Label>House No.</Form.Label><Form.Control type="text" name="houseNo" value={formData.houseNo} onChange={handleChange} /></Form.Group></Col>
                <Col md={3}><Form.Group><Form.Label>Street</Form.Label><Form.Select name="street" value={formData.street} onChange={handleChange} required><option value="">Select Street</option>{pasigStreets.map(s => <option key={s} value={s}>{s}</option>)}</Form.Select></Form.Group></Col>
                <Col md={3}><Form.Group><Form.Label>Barangay</Form.Label><Form.Select name="barangay" value={formData.barangay} onChange={handleChange} disabled={!formData.street} required><option value="">Select Barangay</option>{getAvailableBarangays().map(b => <option key={b} value={b}>{b}</option>)}</Form.Select></Form.Group></Col>
                <Col md={2}><Form.Group><Form.Label>City</Form.Label><Form.Control type="text" name="city" value={formData.city} readOnly /></Form.Group></Col>
                <Col md={2}><Form.Group><Form.Label>Region</Form.Label><Form.Control type="text" name="region" value={formData.region} readOnly /></Form.Group></Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header as="h5" className="my-2">Other Details</Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col md={4}><Form.Group><Form.Label>Date of Birth</Form.Label><DatePicker selected={formData.dateOfBirth} onChange={handleDateChange} dateFormat="MM/dd/yyyy" className="form-control" maxDate={new Date()} showYearDropdown scrollableYearDropdown yearDropdownItemNumber={100} placeholderText="MM/DD/YYYY" required /></Form.Group></Col>
                <Col md={2}><Form.Group><Form.Label>Age</Form.Label><Form.Control type="text" name="age" value={formData.age} readOnly /></Form.Group></Col>
                <Col md={3}><Form.Group><Form.Label>Gender</Form.Label><Form.Select name="gender" value={formData.gender} onChange={handleChange} required><option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></Form.Select></Form.Group></Col>
                <Col md={3}><Form.Group><Form.Label>Civil Status</Form.Label><Form.Select name="civilStatus" value={formData.civilStatus} onChange={handleChange} required><option value="">Select Status</option><option value="Single">Single</option><option value="Married">Married</option><option value="Divorced">Divorced</option><option value="Widowed">Widowed</option></Form.Select></Form.Group></Col>
              </Row>
              <Row className="mb-3 align-items-center">
                <Col md={8}>
                  <Form.Group>
                    <Form.Label className="me-3">Membership Status:</Form.Label>
                    <Form.Check inline type="radio" label="Member" name="membershipStatus" value="Member" checked={formData.membershipStatus === "Member"} onChange={handleChange} />
                    <Form.Check inline type="radio" label="Non-Member" name="membershipStatus" value="Non-Member" checked={formData.membershipStatus === "Non-Member"} onChange={handleChange} />
                  </Form.Group>
                </Col>
                <Col md={4}> 
                  <Form.Group className="mb-0">
                    <Form.Label>PhilHealth Number</Form.Label>
                    <Form.Control type="text" name="philHealthNumber" value={formData.philHealthNumber} onChange={handleChange} disabled={formData.membershipStatus === 'Non-Member'} />
                    {formData.membershipStatus === 'Non-Member' && <Form.Text className="text-muted">Not required for Non-Members.</Form.Text>}
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Button variant="primary" type="submit" className="w-100 mt-3">
            Register
          </Button>
        </>
      )}
    </Form>
  );

  // Handle logout
  const handleLogout = () => {
    logout();
    setActiveTab('login'); // Reset to login tab
  };

  // Handle redirect to dashboard
  const goToDashboard = () => {
    switch (user?.role) {
      case 'admin':
        navigate('/admin/dashboard');
        break;
      case 'doctor':
        navigate('/doctor/dashboard');
        break;
      case 'patient':
        navigate('/patient/dashboard');
        break;
      default:
        navigate('/');
    }
  };

  // Render already authenticated view
  const renderAuthenticatedView = () => (
    <div className="text-center authenticated-view">
      <h4>Welcome back, {user?.firstName || user?.username}!</h4>
      <p className="text-muted mb-4">You are already logged in as a {user?.role}.</p>
      
      <div className="d-grid gap-2">
        <Button variant="primary" onClick={goToDashboard} className="mb-2">
          Go to Dashboard
        </Button>
        <Button variant="outline-secondary" onClick={handleLogout}>
          Logout & Switch Account
        </Button>
      </div>
    </div>
  );

  // Render auto-login loading view
  const renderAutoLoginView = () => {
    const currentPort = window.location.port;
    const roleMap = {
      '3001': { role: 'Doctor', icon: '🩺', color: '#28a745' },
      '3002': { role: 'Patient', icon: '👤', color: '#007bff' },
      '3003': { role: 'Admin', icon: '⚙️', color: '#dc3545' }
    };
    
    const config = roleMap[currentPort] || { role: 'User', icon: '🔄', color: '#6c757d' };
    
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h5 style={{ color: config.color }}>
          {config.icon} Auto-Login Mode Detected
        </h5>
        <p className="text-muted">Automatically logging in as {config.role}...</p>
        <small className="text-secondary">Running on port {currentPort} - {config.role} dashboard mode</small>
      </div>
    );
  };

  return (
    <>
      <div 
        className="loginsignup-container" 
        style={{ backgroundColor: '#9bc4e2' }}
      >
        <Card className="loginsignup-card">
          {isAutoLoggingIn ? (
            // Show auto-login loading view
            <Card.Body>
              {renderAutoLoginView()}
            </Card.Body>
          ) : isAuthenticated && user ? (
            // Show authenticated view
            <Card.Body>
              {renderAuthenticatedView()}
            </Card.Body>
          ) : (
            // Show login/register tabs
            <>
              <Card.Header>
                <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="justify-content-center">
                  <Nav.Item>
                    <Nav.Link eventKey="login">Login</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="register">Register</Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Header>
              <Card.Body>
                {activeTab === 'login' ? renderLoginForm() : renderRegistrationForm()}
              </Card.Body>
            </>
          )}
        </Card>
      </div>
    </>
  );
};

export default LoginSignup;
