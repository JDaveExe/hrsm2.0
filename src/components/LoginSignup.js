import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Nav, Alert, Image, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { QRCodeCanvas as QRCode } from 'qrcode.react';
import { QrReader } from 'react-qr-reader';
import { Link } from 'react-router-dom'; // Assuming you'll use React Router for navigation
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/LoginSignup.css'; // New CSS file
import homeImage from '../images/home.jpg'; // Background image

const LoginSignup = () => {
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  const [activeKey, setActiveKey] = useState('login');
  const navigate = useNavigate(); // Initialize useNavigate

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

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError(''); // Clear previous errors

    // Hardcoded login logic
    if (emailOrPhone === 'doctor' && password === 'passworddoc') {
      navigate('/docdashboard');
    } else if (emailOrPhone === 'admin' && password === 'passwordadm') {
      navigate('/admdashboard');
    } else if (emailOrPhone === 'patient' && password === 'passwordpat') {
      navigate('/patientdashboard');
    } else {
      setLoginError('Invalid email or password.');
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
    
    if (name === 'street') {
      setFormData((prev) => ({
        ...prev,
        street: value,
        barangay: '' // Reset barangay when street changes
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
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

    if (!formData.email && !formData.phoneNumber) {
      setRegistrationError("Please provide either an email or a phone number.");
      return;
    }
    if (formData.password !== formData.repeatPassword) {
      setRegistrationError("Passwords do not match.");
      return;
    }
    if (!formData.firstName || !formData.lastName || !formData.password) {
      setRegistrationError("Please fill in all required fields.");
      return;
    }

    // Placeholder for registration logic
    console.log("Registration form submitted:", formData);
    const demoQrValue = generateQrToken(); // Generate a demo QR value
    setUserQrValue(JSON.stringify({ userId: formData.email || formData.phoneNumber, token: demoQrValue }));
    setRegistrationMessage('Registration successful! Here is your demo QR code.');
    setRegistrationComplete(true);
    setShowQrCode(true);
    // TODO: Replace with actual API call to register user and get QR data
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
                <Col md={6}><Form.Group><Form.Label>Phone Number</Form.Label><Form.Control type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="09XXXXXXXXX" pattern="^09\\\\d{9}$" title="Must be a valid PH mobile number starting with 09"/></Form.Group></Col>
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

  return (
    <>
      <div 
        className="loginsignup-container" 
        style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${homeImage})` }}
      >
        <Card className="loginsignup-card">
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
        </Card>
      </div>
    </>
  );
};

export default LoginSignup;
