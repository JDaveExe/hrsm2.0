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
  const [showHistory, setShowHistory] = useState(false);
  const [referralHistory, setReferralHistory] = useState([]);

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
      const response = await fetch('/api/lab-referrals/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.__authToken}`
        },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          referralData: referralData,
          referredBy: 'Dr. John Smith' // Get from current user context
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Referral submitted:', result.referralId);
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          onHide();
        }, 3000);
      } else {
        throw new Error('Failed to submit referral');
      }
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

  const handleShowHistory = async () => {
    if (!selectedPatient) return;
    
    try {
      const response = await fetch(`/api/lab-referrals/patient/${selectedPatient.id}`, {
        headers: {
          'Authorization': `Bearer ${window.__authToken}`
        }
      });

      if (response.ok) {
        const history = await response.json();
        setReferralHistory(history);
        setShowHistory(true);
      } else {
        console.error('Failed to fetch referral history');
      }
    } catch (error) {
      console.error('Error fetching referral history:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: 'bg-warning text-dark',
      completed: 'bg-success text-white',
      cancelled: 'bg-danger text-white'
    };
    
    return (
      <span className={`badge ${statusStyles[status] || 'bg-secondary'} me-2`}>
        {status?.toUpperCase() || 'UNKNOWN'}
      </span>
    );
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
    <>
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
          Lab Referral Form
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
          onClick={handleShowHistory}
          style={{
            background: '#3b82f6',
            border: 'none',
            color: '#ffffff'
          }}
        >
          <i className="bi bi-clock-history me-2"></i>
          Referral History
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

    {/* Referral History Modal */}
    <Modal 
      show={showHistory} 
      onHide={() => setShowHistory(false)}
      dialogClassName="action-modal-wide"
      centered
      className="referral-history-modal"
    >
      <Modal.Header 
        closeButton 
        style={{
          background: '#3b82f6', 
          color: '#ffffff', 
          border: 'none',
          borderRadius: '12px 12px 0 0'
        }}
      >
        <Modal.Title className="w-100 text-center fw-bold fs-4">
          <i className="bi bi-clock-history me-2"></i>
          Lab Referral History - {selectedPatient ? getPatientFullName(selectedPatient) : ''}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{
        background: isDarkMode ? '#1e293b' : '#ffffff', 
        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
        padding: '24px',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        {referralHistory.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-clipboard-x" style={{ fontSize: '3rem', color: '#6b7280' }}></i>
            <h5 className="mt-3 mb-2" style={{ color: isDarkMode ? '#e2e8f0' : '#2c3e50' }}>
              No Referral History
            </h5>
            <p style={{ color: isDarkMode ? '#94a3b8' : '#6c757d' }}>
              This patient has no previous lab referrals on record.
            </p>
          </div>
        ) : (
          <div className="referral-history-accordion">
            <div className="accordion" id="referralHistoryAccordion">
              {referralHistory.map((referral, index) => {
                const accordionId = `history-${referral.id}`;
                const referralDate = formatDate(referral.referralDate);
                const referralTime = formatTime(referral.referralDate);
                
                return (
                  <div key={referral.id} className="accordion-item mb-3" style={{
                    border: `1px solid ${isDarkMode ? '#475569' : '#e0e6ed'}`,
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                  }}>
                    <h2 className="accordion-header" id={`heading-${accordionId}`}>
                      <button 
                        className="accordion-button collapsed"
                        type="button" 
                        data-bs-toggle="collapse" 
                        data-bs-target={`#collapse-${accordionId}`}
                        aria-expanded="false"
                        aria-controls={`collapse-${accordionId}`}
                        style={{
                          background: isDarkMode ? '#334155' : '#f8f9fa',
                          color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '1rem 1.25rem'
                        }}
                      >
                        <div className="w-100 d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center gap-3">
                            <span className="badge bg-primary">#{index + 1}</span>
                            {getStatusBadge(referral.status)}
                            <span>
                              <i className="bi bi-calendar3 me-1"></i>
                              {referralDate}
                            </span>
                            <span>
                              <i className="bi bi-clock me-1"></i>
                              {referralTime}
                            </span>
                          </div>
                          <div className="text-end">
                            <small style={{ color: isDarkMode ? '#94a3b8' : '#6c757d' }}>
                              {referral.referralId}
                            </small>
                          </div>
                        </div>
                      </button>
                    </h2>

                    <div 
                      id={`collapse-${accordionId}`}
                      className="accordion-collapse collapse"
                      aria-labelledby={`heading-${accordionId}`}
                      data-bs-parent="#referralHistoryAccordion"
                    >
                      <div className="accordion-body" style={{
                        background: isDarkMode ? '#1e293b' : '#ffffff',
                        padding: '1.5rem',
                        borderTop: `1px solid ${isDarkMode ? '#475569' : '#e0e6ed'}`
                      }}>
                        <div className="row">
                          <div className="col-md-6">
                            <h6 style={{ color: '#3b82f6', fontWeight: '600' }}>
                              <i className="bi bi-hospital me-2"></i>
                              Referral Details
                            </h6>
                            <div className="mb-3">
                              <strong>Facility:</strong> {referral.facility}
                            </div>
                            <div className="mb-3">
                              <strong>Department:</strong> {referral.department}
                            </div>
                            <div className="mb-3">
                              <strong>Specialist:</strong> {referral.specialist || 'N/A'}
                            </div>
                            <div className="mb-3">
                              <strong>Urgency:</strong> {referral.urgency?.toUpperCase()}
                            </div>
                            <div className="mb-3">
                              <strong>Referred By:</strong> {referral.referredBy || 'N/A'}
                            </div>
                          </div>
                          <div className="col-md-6">
                            <h6 style={{ color: '#3b82f6', fontWeight: '600' }}>
                              <i className="bi bi-clipboard-medical me-2"></i>
                              Clinical Information
                            </h6>
                            <div className="mb-3">
                              <strong>Reason:</strong>
                              <div className="mt-1" style={{ 
                                fontSize: '0.9rem',
                                color: isDarkMode ? '#cbd5e1' : '#495057'
                              }}>
                                {referral.reason}
                              </div>
                            </div>
                            <div className="mb-3">
                              <strong>Clinical History:</strong>
                              <div className="mt-1" style={{ 
                                fontSize: '0.9rem',
                                color: isDarkMode ? '#cbd5e1' : '#495057'
                              }}>
                                {referral.clinicalHistory || 'N/A'}
                              </div>
                            </div>
                            <div className="mb-3">
                              <strong>Additional Notes:</strong>
                              <div className="mt-1" style={{ 
                                fontSize: '0.9rem',
                                color: isDarkMode ? '#cbd5e1' : '#495057'
                              }}>
                                {referral.additionalNotes || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Results Section */}
                        {referral.resultsUploaded && (
                          <div className="mt-4 pt-3" style={{
                            borderTop: `1px solid ${isDarkMode ? '#475569' : '#e0e6ed'}`
                          }}>
                            <h6 style={{ color: '#10b981', fontWeight: '600' }}>
                              <i className="bi bi-check-circle me-2"></i>
                              Results Available
                            </h6>
                            <div className="row">
                              <div className="col-md-6">
                                <div className="mb-2">
                                  <strong>Results Date:</strong> {formatDate(referral.resultsDate)}
                                </div>
                                <div className="mb-2">
                                  <strong>File:</strong> {referral.resultsFile || 'N/A'}
                                </div>
                              </div>
                              <div className="col-md-6">
                                <div className="mb-2">
                                  <strong>Notes:</strong>
                                  <div className="mt-1" style={{ 
                                    fontSize: '0.9rem',
                                    color: isDarkMode ? '#cbd5e1' : '#495057'
                                  }}>
                                    {referral.resultsNotes || 'No additional notes'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer style={{
        background: isDarkMode ? '#1e293b' : '#f8f9fa',
        border: 'none',
        borderRadius: '0 0 12px 12px'
      }}>
        <Button 
          onClick={() => setShowHistory(false)}
          style={{
            background: '#6b7280',
            border: 'none',
            color: '#ffffff'
          }}
        >
          <i className="bi bi-x-circle me-2"></i>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
    </>
  );
};

export default ReferralFormModal;
