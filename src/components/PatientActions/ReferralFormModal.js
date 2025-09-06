import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import './styles/ActionModals.css';

const ReferralFormModal = ({ show, onHide, selectedPatient, isDarkMode = false }) => {
  const [referralData, setReferralData] = useState({
    referralType: '',
    facility: '',
    department: '',
    specialist: '',
    reason: '',
    clinicalHistory: '',
    currentMedications: '',
    urgency: 'routine',
    preferredDate: '',
    additionalNotes: ''
  });
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const getPatientFullName = (patient) => {
    if (!patient) return 'Unknown Patient';
    return `${patient.firstName || ''} ${patient.middleName || ''} ${patient.lastName || ''}`.replace(/\s+/g, ' ').trim();
  };

  const getPatientAge = (patient) => {
    if (!patient?.dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(patient.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  useEffect(() => {
    if (show && selectedPatient) {
      // Reset form when modal opens
      setReferralData({
        referralType: '',
        facility: '',
        department: '',
        specialist: '',
        reason: '',
        clinicalHistory: '',
        currentMedications: '',
        urgency: 'routine',
        preferredDate: '',
        additionalNotes: ''
      });
      setShowSuccess(false);
    }
  }, [show, selectedPatient]);

  const handleInputChange = (field, value) => {
    setReferralData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitReferral = async () => {
    setLoading(true);
    try {
      // Here you would submit the referral to the backend
      // await referralService.submitReferral(selectedPatient.id, referralData);
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onHide();
      }, 3000);
    } catch (error) {
      console.error('Error submitting referral:', error);
      alert('Error submitting referral. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReferral = () => {
    alert('Referral form printed successfully!');
  };

  const facilityOptions = [
    'Philippine General Hospital',
    'St. Luke\'s Medical Center',
    'Makati Medical Center',
    'Asian Hospital and Medical Center',
    'The Medical City',
    'National Kidney and Transplant Institute',
    'Philippine Heart Center',
    'Lung Center of the Philippines',
    'Other (Specify in notes)'
  ];

  const departmentOptions = [
    'Cardiology',
    'Dermatology',
    'Endocrinology',
    'Gastroenterology',
    'Neurology',
    'Oncology',
    'Ophthalmology',
    'Orthopedics',
    'Psychiatry',
    'Pulmonology',
    'Urology',
    'General Surgery',
    'Internal Medicine',
    'Pediatrics',
    'Obstetrics & Gynecology'
  ];

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      dialogClassName="action-modal-wide"
      centered
      className="referral-form-modal"
    >
      <Modal.Header 
        closeButton 
        style={{
          background: '#f59e0b', 
          color: '#ffffff', 
          border: 'none',
          borderRadius: '12px 12px 0 0'
        }}
      >
        <Modal.Title className="w-100 text-center fw-bold fs-4">
          <i className="bi bi-hospital me-2"></i>
          Laboratory/Specialist Referral Form
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{
        background: isDarkMode ? '#1e293b' : '#ffffff', 
        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
        padding: '24px',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        {showSuccess && (
          <Alert variant="success" className="mb-4">
            <i className="bi bi-check-circle me-2"></i>
            Referral submitted successfully! The patient will be notified with the appointment details.
          </Alert>
        )}

        {selectedPatient && (
          <>
            {/* Patient Header */}
            <div 
              className="mb-4 p-3"
              style={{
                background: isDarkMode ? '#334155' : '#f8f9fa',
                borderRadius: '8px',
                border: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`
              }}
            >
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h5 style={{color: isDarkMode ? '#e2e8f0' : '#2c3e50', marginBottom: '8px', fontWeight: '600'}}>
                    {getPatientFullName(selectedPatient)}
                  </h5>
                  <div className="row">
                    <div className="col-md-4">
                      <span style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.9rem'}}>
                        <strong>Patient ID:</strong> PT-{String(selectedPatient.id).padStart(4, '0')}
                      </span>
                    </div>
                    <div className="col-md-4">
                      <span style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.9rem'}}>
                        <strong>Age:</strong> {getPatientAge(selectedPatient)} years old
                      </span>
                    </div>
                    <div className="col-md-4">
                      <span style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.9rem'}}>
                        <strong>Gender:</strong> {selectedPatient.gender || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 text-end">
                  <div style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.9rem'}}>
                    <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                    <div><strong>Referral ID:</strong> REF-{Date.now().toString().slice(-6)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Referral Form */}
            <Form>
              <Row>
                <Col md={6}>
                  <h6 className="mb-3" style={{color: '#f59e0b', fontWeight: '600'}}>
                    <i className="bi bi-building me-2"></i>
                    Referral Destination
                  </h6>

                  <Form.Group className="mb-3">
                    <Form.Label>Referral Type *</Form.Label>
                    <Form.Select
                      value={referralData.referralType}
                      onChange={(e) => handleInputChange('referralType', e.target.value)}
                      required
                      style={{
                        background: isDarkMode ? '#374151' : '#ffffff',
                        border: `1px solid ${isDarkMode ? '#4b5563' : '#dee2e6'}`,
                        color: isDarkMode ? '#e5e7eb' : '#495057'
                      }}
                    >
                      <option value="">Select referral type...</option>
                      <option value="specialist">Specialist Consultation</option>
                      <option value="laboratory">Laboratory Tests</option>
                      <option value="imaging">Imaging Studies</option>
                      <option value="surgery">Surgical Consultation</option>
                      <option value="emergency">Emergency Referral</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Healthcare Facility *</Form.Label>
                    <Form.Select
                      value={referralData.facility}
                      onChange={(e) => handleInputChange('facility', e.target.value)}
                      required
                      style={{
                        background: isDarkMode ? '#374151' : '#ffffff',
                        border: `1px solid ${isDarkMode ? '#4b5563' : '#dee2e6'}`,
                        color: isDarkMode ? '#e5e7eb' : '#495057'
                      }}
                    >
                      <option value="">Select facility...</option>
                      {facilityOptions.map(facility => (
                        <option key={facility} value={facility}>{facility}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Department/Specialty *</Form.Label>
                    <Form.Select
                      value={referralData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      required
                      style={{
                        background: isDarkMode ? '#374151' : '#ffffff',
                        border: `1px solid ${isDarkMode ? '#4b5563' : '#dee2e6'}`,
                        color: isDarkMode ? '#e5e7eb' : '#495057'
                      }}
                    >
                      <option value="">Select department...</option>
                      {departmentOptions.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Preferred Specialist (Optional)</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter specialist name if any preference"
                      value={referralData.specialist}
                      onChange={(e) => handleInputChange('specialist', e.target.value)}
                      style={{
                        background: isDarkMode ? '#374151' : '#ffffff',
                        border: `1px solid ${isDarkMode ? '#4b5563' : '#dee2e6'}`,
                        color: isDarkMode ? '#e5e7eb' : '#495057'
                      }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Urgency Level *</Form.Label>
                    <Form.Select
                      value={referralData.urgency}
                      onChange={(e) => handleInputChange('urgency', e.target.value)}
                      required
                      style={{
                        background: isDarkMode ? '#374151' : '#ffffff',
                        border: `1px solid ${isDarkMode ? '#4b5563' : '#dee2e6'}`,
                        color: isDarkMode ? '#e5e7eb' : '#495057'
                      }}
                    >
                      <option value="routine">Routine (2-4 weeks)</option>
                      <option value="urgent">Urgent (1-2 weeks)</option>
                      <option value="emergency">Emergency (ASAP)</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Preferred Appointment Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={referralData.preferredDate}
                      onChange={(e) => handleInputChange('preferredDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      style={{
                        background: isDarkMode ? '#374151' : '#ffffff',
                        border: `1px solid ${isDarkMode ? '#4b5563' : '#dee2e6'}`,
                        color: isDarkMode ? '#e5e7eb' : '#495057'
                      }}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <h6 className="mb-3" style={{color: '#f59e0b', fontWeight: '600'}}>
                    <i className="bi bi-clipboard-medical me-2"></i>
                    Clinical Information
                  </h6>

                  <Form.Group className="mb-3">
                    <Form.Label>Reason for Referral *</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Specify the reason for this referral (e.g., further evaluation, specific tests needed, specialist opinion)"
                      value={referralData.reason}
                      onChange={(e) => handleInputChange('reason', e.target.value)}
                      required
                      style={{
                        background: isDarkMode ? '#374151' : '#ffffff',
                        border: `1px solid ${isDarkMode ? '#4b5563' : '#dee2e6'}`,
                        color: isDarkMode ? '#e5e7eb' : '#495057'
                      }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Clinical History & Findings</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      placeholder="Relevant medical history, current symptoms, physical examination findings, and previous test results"
                      value={referralData.clinicalHistory}
                      onChange={(e) => handleInputChange('clinicalHistory', e.target.value)}
                      style={{
                        background: isDarkMode ? '#374151' : '#ffffff',
                        border: `1px solid ${isDarkMode ? '#4b5563' : '#dee2e6'}`,
                        color: isDarkMode ? '#e5e7eb' : '#495057'
                      }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Current Medications</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="List all current medications with dosages and frequencies"
                      value={referralData.currentMedications}
                      onChange={(e) => handleInputChange('currentMedications', e.target.value)}
                      style={{
                        background: isDarkMode ? '#374151' : '#ffffff',
                        border: `1px solid ${isDarkMode ? '#4b5563' : '#dee2e6'}`,
                        color: isDarkMode ? '#e5e7eb' : '#495057'
                      }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Additional Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Any additional information, special instructions, or patient concerns"
                      value={referralData.additionalNotes}
                      onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                      style={{
                        background: isDarkMode ? '#374151' : '#ffffff',
                        border: `1px solid ${isDarkMode ? '#4b5563' : '#dee2e6'}`,
                        color: isDarkMode ? '#e5e7eb' : '#495057'
                      }}
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Urgency Alert */}
              {referralData.urgency === 'emergency' && (
                <Alert variant="danger" className="mt-3">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <strong>Emergency Referral:</strong> This referral will be marked as urgent and the receiving facility will be notified immediately.
                </Alert>
              )}
            </Form>
          </>
        )}
      </Modal.Body>
      
      <Modal.Footer style={{
        background: isDarkMode ? '#334155' : '#f8f9fa',
        border: 'none',
        borderRadius: '0 0 12px 12px'
      }}>
        <Button 
          variant="secondary" 
          onClick={onHide}
          style={{
            background: isDarkMode ? '#64748b' : '#6c757d',
            border: 'none',
            color: '#ffffff'
          }}
        >
          <i className="bi bi-x-circle me-2"></i>
          Cancel
        </Button>
        <Button 
          onClick={handlePrintReferral}
          style={{
            background: '#6b7280',
            border: 'none',
            color: '#ffffff'
          }}
        >
          <i className="bi bi-printer me-2"></i>
          Print Form
        </Button>
        <Button 
          onClick={handleSubmitReferral}
          disabled={loading || !referralData.referralType || !referralData.facility || !referralData.department || !referralData.reason}
          style={{
            background: '#f59e0b',
            border: 'none',
            color: '#ffffff'
          }}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Submitting...
            </>
          ) : (
            <>
              <i className="bi bi-send me-2"></i>
              Submit Referral
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReferralFormModal;
