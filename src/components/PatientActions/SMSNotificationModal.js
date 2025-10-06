import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Badge } from 'react-bootstrap';
import axios from 'axios';
import './styles/ActionModals.css';

const SMSNotificationModal = ({ show, onHide, patient }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
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

  const hasValidPhone = isValidPhone(patient?.phoneNumber || patient?.contactNumber);

  // Initialize form data when modal opens or patient changes
  useEffect(() => {
    if (show && patient) {
      setPhoneNumber(patient.phoneNumber || patient.contactNumber || '');
      setMessage('');
      setSelectedTemplate('');
      setCharacterCount(0);
      setUrgencyLevel('Normal');
    }
  }, [show, patient]);

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
    return hasValidPhone && phoneNumber.length >= 10 && message.trim().length > 0;
  };

  // Handle send notification
  const handleSendNotification = async () => {
    // Check if phone is available
    if (!hasValidPhone) {
      alert('No valid phone number available for this patient.');
      return;
    }

    if (!isFormValid()) {
      alert('Please fill in all required fields correctly.');
      return;
    }

    setIsLoading(true);

    try {
      // Format phone number for API
      let formattedPhone = phoneNumber;
      if (phoneNumber.length === 11 && phoneNumber.startsWith('09')) {
        formattedPhone = `+63${phoneNumber.substring(1)}`;
      } else if (phoneNumber.length === 10) {
        formattedPhone = `+639${phoneNumber}`;
      }

      const response = await axios.post('/api/notifications/send-sms', {
        recipient: formattedPhone,
        message: message,
        options: {
          urgency: urgencyLevel.toLowerCase(),
          patientId: patient?.id,
          patientName: `${patient?.firstName} ${patient?.lastName}`,
          type: selectedTemplate || 'custom'
        }
      });

      if (response.data.success) {
        alert('SMS sent successfully!');
        onHide();
      } else {
        alert(`Failed to send SMS: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Send SMS error:', error);
      alert(`Error sending SMS: ${error.response?.data?.error || error.message}`);
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
          <i className="bi bi-chat-dots"></i>
          Send SMS Notification: {patient?.firstName} {patient?.lastName}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ background: '#ffffff', padding: '25px' }}>
        <Form>
          {/* Urgency Level */}
          <Row className="mb-3">
            <Col md={12}>
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
                Recipient Phone Number:
              </Form.Label>
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
              <Form.Text className={hasValidPhone ? "text-muted" : "text-danger"}>
                {hasValidPhone 
                  ? 'Enter a valid Philippine mobile number (11 digits)' 
                  : 'No valid phone number available (N/A or invalid)'
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
                maxLength={160}
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
                  {characterCount}/160 characters
                </span>
                {characterCount > 160 && (
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
              <i className="bi bi-chat-dots"></i>
              Send SMS
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SMSNotificationModal;
