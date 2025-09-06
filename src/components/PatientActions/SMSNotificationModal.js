import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Badge } from 'react-bootstrap';
import axios from 'axios';
import './styles/ActionModals.css';

const SMSNotificationModal = ({ show, onHide, patient }) => {
  const [contactMethod, setContactMethod] = useState('sms'); // 'sms' or 'email'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState('Normal');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  // Quick Templates
  const quickTemplates = [
    {
      id: 'appointment_reminder',
      label: 'Appointment Reminder',
      content: `Hi [PATIENT_NAME]! This is a reminder that you have an appointment scheduled for [DATE] at [TIME]. Please arrive 15 minutes early. - Maybunga Health Center`
    },
    {
      id: 'medication_reminder',
      label: 'Medication Reminder',
      content: `Hello [PATIENT_NAME]! This is a reminder to take your prescribed medication. If you have any questions, please contact us. - Maybunga Health Center`
    },
    {
      id: 'follow_up',
      label: 'Follow-up Required',
      content: `Hi [PATIENT_NAME]! Please schedule a follow-up appointment for your recent visit. Call us or visit the health center. - Maybunga Health Center`
    },
    {
      id: 'health_check',
      label: 'Health Check Reminder',
      content: `Hello [PATIENT_NAME]! It's time for your regular health checkup. Please visit us or call to schedule an appointment. - Maybunga Health Center`
    },
    {
      id: 'emergency_contact',
      label: 'Emergency Contact',
      content: `URGENT: [PATIENT_NAME], please contact Maybunga Health Center immediately regarding your recent test results. Call us now.`
    }
  ];

  // Helper functions to check valid contact information
  const isValidPhone = (phone) => {
    if (!phone || phone.trim() === '') return false;
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10 && !phone.toLowerCase().includes('n/a');
  };

  const isValidEmail = (email) => {
    if (!email || email.trim() === '') return false;
    const lowerEmail = email.toLowerCase();
    if (lowerEmail === 'n/a' || lowerEmail.includes('example.com') || lowerEmail.includes('placeholder')) return false;
    return email.includes('@') && email.includes('.');
  };

  const hasValidPhone = isValidPhone(patient?.phoneNumber || patient?.contactNumber);
  const hasValidEmail = isValidEmail(patient?.email);

  // Initialize form data when modal opens or patient changes
  useEffect(() => {
    if (show && patient) {
      setPhoneNumber(patient.phoneNumber || patient.contactNumber || '');
      setEmail(patient.email || '');
      
      // Auto-select contact method based on available valid data
      if (hasValidPhone) {
        setContactMethod('sms');
      } else if (hasValidEmail) {
        setContactMethod('email');
      } else {
        // Default to SMS if no valid data, but buttons will be disabled
        setContactMethod('sms');
      }
      
      setMessage('');
      setSelectedTemplate('');
      setCharacterCount(0);
      setUrgencyLevel('Normal');
    }
  }, [show, patient, hasValidPhone, hasValidEmail]);

  // Update character count when message changes
  useEffect(() => {
    setCharacterCount(message.length);
  }, [message]);

  // Handle template selection
  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template.id);
    let templateMessage = template.content;
    
    // Replace placeholders with patient data
    if (patient) {
      templateMessage = templateMessage
        .replace(/\[PATIENT_NAME\]/g, `${patient.firstName} ${patient.lastName}`)
        .replace(/\[DATE\]/g, new Date().toLocaleDateString())
        .replace(/\[TIME\]/g, new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
    
    setMessage(templateMessage);
  };

  // Handle phone number input (limit to 11 digits)
  const handlePhoneNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length <= 11) {
      setPhoneNumber(value);
    }
  };

  // Format phone number display
  const formatPhoneDisplay = (phone) => {
    if (phone.length <= 3) return phone;
    if (phone.length <= 6) return `${phone.slice(0, 3)}-${phone.slice(3)}`;
    if (phone.length <= 10) return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
    return `${phone.slice(0, 4)}-${phone.slice(4, 7)}-${phone.slice(7)}`;
  };

  // Validate form
  const isFormValid = () => {
    // First check if the selected contact method is valid
    if (contactMethod === 'sms') {
      return hasValidPhone && phoneNumber.length >= 10 && message.trim().length > 0;
    } else {
      return hasValidEmail && email.includes('@') && email.includes('.') && message.trim().length > 0;
    }
  };

  // Handle send notification
  const handleSendNotification = async () => {
    // Check if any contact method is available
    if (!hasValidPhone && !hasValidEmail) {
      alert('No valid contact information available for this patient.');
      return;
    }

    if (!isFormValid()) {
      alert('Please fill in all required fields correctly.');
      return;
    }

    setIsLoading(true);

    try {
      let response;
      
      if (contactMethod === 'sms') {
        // Format phone number for API
        let formattedPhone = phoneNumber;
        if (phoneNumber.length === 11 && phoneNumber.startsWith('09')) {
          formattedPhone = `+63${phoneNumber.substring(1)}`;
        } else if (phoneNumber.length === 10) {
          formattedPhone = `+639${phoneNumber}`;
        }

        response = await axios.post('/api/notifications/send-sms', {
          recipient: formattedPhone,
          message: message,
          options: {
            urgency: urgencyLevel.toLowerCase(),
            patientId: patient?.id,
            patientName: `${patient?.firstName} ${patient?.lastName}`,
            type: selectedTemplate || 'custom'
          }
        });
      } else {
        response = await axios.post('/api/notifications/send-email', {
          recipient: email,
          subject: `Health Center Notification - ${urgencyLevel}`,
          content: message,
          options: {
            urgency: urgencyLevel.toLowerCase(),
            patientId: patient?.id,
            patientName: `${patient?.firstName} ${patient?.lastName}`,
            type: selectedTemplate || 'custom'
          }
        });
      }

      if (response.data.success) {
        alert(`${contactMethod.toUpperCase()} sent successfully!`);
        onHide();
      } else {
        alert(`Failed to send ${contactMethod.toUpperCase()}: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Send notification error:', error);
      alert(`Error sending ${contactMethod.toUpperCase()}: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      dialogClassName="sms-modal-medium"
      centered 
      backdrop="static"
      className="sms-notification-modal"
    >
      <Modal.Header 
        closeButton 
        style={{ 
          background: '#f8f9fa', 
          borderBottom: '2px solid #dee2e6',
          color: '#2c3e50'
        }}
      >
        <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className={`bi ${contactMethod === 'sms' ? 'bi-chat-dots' : 'bi-envelope'}`}></i>
          Send {contactMethod === 'sms' ? 'SMS' : 'Email'} Notification: {patient?.firstName} {patient?.lastName}
          <Badge bg="warning" text="dark" style={{ fontSize: '0.7rem', marginLeft: '10px' }}>
            Mock Mode
          </Badge>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ background: '#ffffff', padding: '25px' }}>
        <Form>
          {/* Contact Method Switch */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Label style={{ fontWeight: 600, color: '#2c3e50', marginBottom: '8px' }}>
                Contact Method:
              </Form.Label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                <div style={{ position: 'relative' }}>
                  <Button
                    variant={contactMethod === 'sms' ? 'primary' : hasValidPhone ? 'outline-secondary' : 'outline-danger'}
                    onClick={() => hasValidPhone && setContactMethod('sms')}
                    disabled={!hasValidPhone}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontWeight: 500,
                      transition: 'all 0.2s ease',
                      border: '2px solid transparent',
                      opacity: hasValidPhone ? 1 : 0.6,
                      cursor: hasValidPhone ? 'pointer' : 'not-allowed'
                    }}
                    title={hasValidPhone ? 'Send SMS notification' : 'No valid phone number available'}
                  >
                    <i className="bi bi-phone me-2"></i>
                    SMS
                    {!hasValidPhone && <i className="bi bi-x-circle ms-2" style={{ fontSize: '0.8rem' }}></i>}
                  </Button>
                </div>
                
                <div style={{ position: 'relative' }}>
                  <Button
                    variant={contactMethod === 'email' ? 'primary' : hasValidEmail ? 'outline-secondary' : 'outline-danger'}
                    onClick={() => hasValidEmail && setContactMethod('email')}
                    disabled={!hasValidEmail}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontWeight: 500,
                      transition: 'all 0.2s ease',
                      border: '2px solid transparent',
                      opacity: hasValidEmail ? 1 : 0.6,
                      cursor: hasValidEmail ? 'pointer' : 'not-allowed'
                    }}
                    title={hasValidEmail ? 'Send email notification' : 'No valid email address available'}
                  >
                    <i className="bi bi-envelope me-2"></i>
                    Email
                    {!hasValidEmail && <i className="bi bi-x-circle ms-2" style={{ fontSize: '0.8rem' }}></i>}
                  </Button>
                </div>
              </div>
              
              {/* Contact method availability status */}
              {(!hasValidPhone || !hasValidEmail) && (
                <div style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                  {!hasValidPhone && !hasValidEmail && (
                    <div style={{ color: '#dc3545', fontWeight: 500 }}>
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      No valid contact information available
                    </div>
                  )}
                  {!hasValidPhone && hasValidEmail && (
                    <div style={{ color: '#856404' }}>
                      <i className="bi bi-info-circle me-1"></i>
                      Phone number not available (SMS disabled)
                    </div>
                  )}
                  {hasValidPhone && !hasValidEmail && (
                    <div style={{ color: '#856404' }}>
                      <i className="bi bi-info-circle me-1"></i>
                      Email address not available (Email disabled)
                    </div>
                  )}
                </div>
              )}
            </Col>
            <Col md={6}>
              <Form.Label style={{ fontWeight: 600, color: '#2c3e50' }}>
                Urgency Level:
              </Form.Label>
              <Form.Select
                value={urgencyLevel}
                onChange={(e) => setUrgencyLevel(e.target.value)}
                style={{ borderColor: '#dee2e6' }}
              >
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </Form.Select>
            </Col>
          </Row>

          {/* Contact Information */}
          <Row className="mb-3">
            <Col md={12}>
              <Form.Label style={{ fontWeight: 600, color: '#2c3e50' }}>
                {contactMethod === 'sms' ? 'Recipient Phone Number:' : 'Recipient Email Address:'}
              </Form.Label>
              {contactMethod === 'sms' ? (
                <Form.Control
                  type="text"
                  value={formatPhoneDisplay(phoneNumber)}
                  onChange={handlePhoneNumberChange}
                  placeholder="09123456789"
                  maxLength={13} // Account for formatting
                  disabled={!hasValidPhone}
                  style={{ 
                    borderColor: hasValidPhone ? '#dee2e6' : '#dc3545', 
                    fontSize: '1.1rem', 
                    padding: '12px',
                    backgroundColor: hasValidPhone ? '#ffffff' : '#f8f9fa',
                    opacity: hasValidPhone ? 1 : 0.7
                  }}
                />
              ) : (
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patient@example.com"
                  disabled={!hasValidEmail}
                  style={{ 
                    borderColor: hasValidEmail ? '#dee2e6' : '#dc3545', 
                    fontSize: '1.1rem', 
                    padding: '12px',
                    backgroundColor: hasValidEmail ? '#ffffff' : '#f8f9fa',
                    opacity: hasValidEmail ? 1 : 0.7
                  }}
                />
              )}
              <Form.Text className={hasValidPhone || hasValidEmail ? "text-muted" : "text-danger"}>
                {contactMethod === 'sms' 
                  ? hasValidPhone 
                    ? 'Enter a valid Philippine mobile number (11 digits)' 
                    : 'No valid phone number available (N/A or invalid)'
                  : hasValidEmail 
                    ? 'Enter a valid email address'
                    : 'No valid email address available (N/A, placeholder, or invalid)'
                }
              </Form.Text>
            </Col>
          </Row>

          {/* Quick Templates */}
          <Row className="mb-3">
            <Col md={12}>
              <Form.Label style={{ fontWeight: 600, color: '#2c3e50', marginBottom: '10px' }}>
                Quick Templates:
              </Form.Label>
              <div className="template-buttons">
                {quickTemplates.map((template) => (
                  <Button
                    key={template.id}
                    variant={selectedTemplate === template.id ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => handleTemplateSelect(template)}
                    className="me-2 mb-2"
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontWeight: 500,
                      fontSize: '0.85rem'
                    }}
                  >
                    {template.label}
                  </Button>
                ))}
              </div>
            </Col>
          </Row>

          {/* Message */}
          <Row className="mb-3">
            <Col md={12}>
              <Form.Label style={{ fontWeight: 600, color: '#2c3e50' }}>
                Message:
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message here..."
                maxLength={contactMethod === 'sms' ? 160 : 1000}
                style={{ 
                  borderColor: '#dee2e6', 
                  fontSize: '1rem', 
                  padding: '12px',
                  resize: 'vertical',
                  minHeight: '80px'
                }}
              />
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginTop: '8px',
                fontSize: '0.9rem',
                color: '#6c757d'
              }}>
                <span>
                  {characterCount}/{contactMethod === 'sms' ? 160 : 1000} characters
                </span>
                {contactMethod === 'sms' && characterCount > 160 && (
                  <span style={{ color: '#dc3545' }}>
                    Message too long for SMS
                  </span>
                )}
              </div>
            </Col>
          </Row>

          {/* Patient Information */}
          {patient && (
            <Row className="mb-2">
              <Col md={12}>
                <div style={{
                  background: '#f8f9fa',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6'
                }}>
                  <strong style={{ color: '#2c3e50' }}>Patient Information:</strong>
                  <div style={{ marginTop: '6px', fontSize: '0.9rem', color: '#495057' }}>
                    <div><strong>Name:</strong> {patient.firstName} {patient.lastName}</div>
                    {patient.phoneNumber && (
                      <div><strong>Phone:</strong> {patient.phoneNumber}</div>
                    )}
                    {patient.email && (
                      <div><strong>Email:</strong> {patient.email}</div>
                    )}
                  </div>
                </div>
              </Col>
            </Row>
          )}
        </Form>
      </Modal.Body>

      <Modal.Footer style={{ background: '#f8f9fa', borderTop: '1px solid #dee2e6', padding: '15px' }}>
        <Button 
          variant="secondary" 
          onClick={onHide}
          disabled={isLoading}
          style={{ padding: '8px 16px', fontWeight: 500 }}
        >
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSendNotification}
          disabled={!isFormValid() || isLoading}
          style={{ 
            padding: '8px 24px', 
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm"></span>
              Sending...
            </>
          ) : (
            <>
              <i className={`bi ${contactMethod === 'sms' ? 'bi-chat-dots' : 'bi-envelope'}`}></i>
              Send {contactMethod === 'sms' ? 'SMS' : 'Email'}
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SMSNotificationModal;
