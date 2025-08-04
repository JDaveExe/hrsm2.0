import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Badge } from 'react-bootstrap';
import axios from 'axios';
import '../styles/SMSNotificationModal.css';

const SMSNotificationModal = ({ show, onHide, selectedPatient }) => {
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

  // Initialize form data when modal opens or patient changes
  useEffect(() => {
    if (show && selectedPatient) {
      setPhoneNumber(selectedPatient.phoneNumber || selectedPatient.contactNumber || '');
      setEmail(selectedPatient.email || '');
      
      // Auto-select contact method based on available data
      if (selectedPatient.phoneNumber || selectedPatient.contactNumber) {
        setContactMethod('sms');
      } else if (selectedPatient.email) {
        setContactMethod('email');
      }
      
      setMessage('');
      setSelectedTemplate('');
      setCharacterCount(0);
      setUrgencyLevel('Normal');
    }
  }, [show, selectedPatient]);

  // Update character count when message changes
  useEffect(() => {
    setCharacterCount(message.length);
  }, [message]);

  // Handle template selection
  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template.id);
    let templateMessage = template.content;
    
    // Replace placeholders with patient data
    if (selectedPatient) {
      templateMessage = templateMessage
        .replace(/\[PATIENT_NAME\]/g, `${selectedPatient.firstName} ${selectedPatient.lastName}`)
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
    if (contactMethod === 'sms') {
      return phoneNumber.length >= 10 && message.trim().length > 0;
    } else {
      return email.includes('@') && email.includes('.') && message.trim().length > 0;
    }
  };

  // Handle send notification
  const handleSendNotification = async () => {
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
            patientId: selectedPatient?.id,
            patientName: `${selectedPatient?.firstName} ${selectedPatient?.lastName}`,
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
            patientId: selectedPatient?.id,
            patientName: `${selectedPatient?.firstName} ${selectedPatient?.lastName}`,
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
      size="lg" 
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
          Send {contactMethod === 'sms' ? 'SMS' : 'Email'} Notification: {selectedPatient?.firstName} {selectedPatient?.lastName}
          <Badge bg="warning" text="dark" style={{ fontSize: '0.7rem', marginLeft: '10px' }}>
            Mock Mode
          </Badge>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ background: '#ffffff', padding: '15px' }}>
        <Form>
          {/* Contact Method Switch */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Label style={{ fontWeight: 600, color: '#2c3e50', marginBottom: '8px' }}>
                Contact Method:
              </Form.Label>
              <div className="contact-method-switch">
                <Button
                  variant={contactMethod === 'sms' ? 'primary' : 'outline-secondary'}
                  onClick={() => setContactMethod('sms')}
                  className="method-btn"
                >
                  <i className="bi bi-phone me-2"></i>
                  SMS
                </Button>
                <Button
                  variant={contactMethod === 'email' ? 'primary' : 'outline-secondary'}
                  onClick={() => setContactMethod('email')}
                  className="method-btn"
                >
                  <i className="bi bi-envelope me-2"></i>
                  Email
                </Button>
              </div>
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
                  readOnly
                  style={{ 
                    borderColor: '#dee2e6', 
                    fontSize: '1.1rem', 
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    cursor: 'not-allowed'
                  }}
                />
              ) : (
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patient@example.com"
                  readOnly
                  style={{ 
                    borderColor: '#dee2e6', 
                    fontSize: '1.1rem', 
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    cursor: 'not-allowed'
                  }}
                />
              )}
              <Form.Text className="text-muted">
                {contactMethod === 'sms' 
                  ? 'Enter a valid Philippine mobile number (11 digits)' 
                  : 'Enter a valid email address'
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
                    className="template-btn"
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
          {selectedPatient && (
            <Row className="mb-2">
              <Col md={12}>
                <div className="patient-info-box">
                  <strong style={{ color: '#2c3e50' }}>Patient Information:</strong>
                  <div style={{ marginTop: '6px', fontSize: '0.9rem', color: '#495057' }}>
                    <div><strong>Name:</strong> {selectedPatient.firstName} {selectedPatient.lastName}</div>
                    {selectedPatient.phoneNumber && (
                      <div><strong>Phone:</strong> {selectedPatient.phoneNumber}</div>
                    )}
                    {selectedPatient.email && (
                      <div><strong>Email:</strong> {selectedPatient.email}</div>
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
