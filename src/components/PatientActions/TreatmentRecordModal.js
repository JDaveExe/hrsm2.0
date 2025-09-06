import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import './styles/ActionModals.css';

const TreatmentRecordModal = ({ show, onHide, selectedPatient, isDarkMode = false }) => {
  const [treatmentData, setTreatmentData] = useState({
    chiefComplaint: '',
    symptoms: '',
    physicalExamination: '',
    diagnosis: '',
    treatment: '',
    medications: '',
    instructions: '',
    followUpDate: '',
    doctorNotes: ''
  });
  const [loading, setLoading] = useState(false);

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
      // Initialize with empty form or load existing treatment record
      setTreatmentData({
        chiefComplaint: '',
        symptoms: '',
        physicalExamination: '',
        diagnosis: '',
        treatment: '',
        medications: '',
        instructions: '',
        followUpDate: '',
        doctorNotes: ''
      });
    }
  }, [show, selectedPatient]);

  const handleInputChange = (field, value) => {
    setTreatmentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveRecord = async () => {
    setLoading(true);
    try {
      // Here you would save the treatment record to the backend
      // await treatmentService.saveTreatmentRecord(selectedPatient.id, treatmentData);
      
      alert('Treatment record saved successfully!');
      onHide();
    } catch (error) {
      console.error('Error saving treatment record:', error);
      alert('Error saving treatment record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintRecord = () => {
    alert('Treatment record printed successfully!');
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      dialogClassName="action-modal-wide"
      centered
      className="treatment-record-modal"
    >
      <Modal.Header 
        closeButton 
        style={{
          background: '#10b981', 
          color: '#ffffff', 
          border: 'none',
          borderRadius: '12px 12px 0 0'
        }}
      >
        <Modal.Title className="w-100 text-center fw-bold fs-4">
          <i className="bi bi-clipboard-medical me-2"></i>
          Treatment Record
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{
        background: isDarkMode ? '#1e293b' : '#ffffff', 
        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
        padding: '24px',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
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
                    <div className="col-md-6">
                      <span style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.9rem'}}>
                        <strong>Patient ID:</strong> PT-{String(selectedPatient.id).padStart(4, '0')}
                      </span>
                    </div>
                    <div className="col-md-6">
                      <span style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.9rem'}}>
                        <strong>Age:</strong> {getPatientAge(selectedPatient)} years old
                      </span>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 text-end">
                  <div style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.9rem'}}>
                    <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                    <div><strong>Time:</strong> {new Date().toLocaleTimeString()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Treatment Form */}
            <Form>
              <Row>
                <Col md={6}>
                  <h6 className="mb-3" style={{color: '#10b981', fontWeight: '600'}}>
                    <i className="bi bi-chat-dots me-2"></i>
                    Chief Complaint & History
                  </h6>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Chief Complaint</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Patient's main concern or reason for visit..."
                      value={treatmentData.chiefComplaint}
                      onChange={(e) => handleInputChange('chiefComplaint', e.target.value)}
                      style={{
                        background: isDarkMode ? '#374151' : '#ffffff',
                        border: `1px solid ${isDarkMode ? '#4b5563' : '#dee2e6'}`,
                        color: isDarkMode ? '#e5e7eb' : '#495057'
                      }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Present Symptoms</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      placeholder="Detailed description of symptoms, duration, severity..."
                      value={treatmentData.symptoms}
                      onChange={(e) => handleInputChange('symptoms', e.target.value)}
                      style={{
                        background: isDarkMode ? '#374151' : '#ffffff',
                        border: `1px solid ${isDarkMode ? '#4b5563' : '#dee2e6'}`,
                        color: isDarkMode ? '#e5e7eb' : '#495057'
                      }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Physical Examination</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      placeholder="Physical examination findings, vital signs, observations..."
                      value={treatmentData.physicalExamination}
                      onChange={(e) => handleInputChange('physicalExamination', e.target.value)}
                      style={{
                        background: isDarkMode ? '#374151' : '#ffffff',
                        border: `1px solid ${isDarkMode ? '#4b5563' : '#dee2e6'}`,
                        color: isDarkMode ? '#e5e7eb' : '#495057'
                      }}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <h6 className="mb-3" style={{color: '#10b981', fontWeight: '600'}}>
                    <i className="bi bi-prescription2 me-2"></i>
                    Diagnosis & Treatment
                  </h6>

                  <Form.Group className="mb-3">
                    <Form.Label>Diagnosis</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Primary and secondary diagnoses..."
                      value={treatmentData.diagnosis}
                      onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                      style={{
                        background: isDarkMode ? '#374151' : '#ffffff',
                        border: `1px solid ${isDarkMode ? '#4b5563' : '#dee2e6'}`,
                        color: isDarkMode ? '#e5e7eb' : '#495057'
                      }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Treatment Plan</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Treatment procedures, interventions performed..."
                      value={treatmentData.treatment}
                      onChange={(e) => handleInputChange('treatment', e.target.value)}
                      style={{
                        background: isDarkMode ? '#374151' : '#ffffff',
                        border: `1px solid ${isDarkMode ? '#4b5563' : '#dee2e6'}`,
                        color: isDarkMode ? '#e5e7eb' : '#495057'
                      }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Medications Prescribed</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Medication name, dosage, frequency, duration..."
                      value={treatmentData.medications}
                      onChange={(e) => handleInputChange('medications', e.target.value)}
                      style={{
                        background: isDarkMode ? '#374151' : '#ffffff',
                        border: `1px solid ${isDarkMode ? '#4b5563' : '#dee2e6'}`,
                        color: isDarkMode ? '#e5e7eb' : '#495057'
                      }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Patient Instructions</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Instructions for patient care, lifestyle modifications..."
                      value={treatmentData.instructions}
                      onChange={(e) => handleInputChange('instructions', e.target.value)}
                      style={{
                        background: isDarkMode ? '#374151' : '#ffffff',
                        border: `1px solid ${isDarkMode ? '#4b5563' : '#dee2e6'}`,
                        color: isDarkMode ? '#e5e7eb' : '#495057'
                      }}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Follow-up Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={treatmentData.followUpDate}
                      onChange={(e) => handleInputChange('followUpDate', e.target.value)}
                      style={{
                        background: isDarkMode ? '#374151' : '#ffffff',
                        border: `1px solid ${isDarkMode ? '#4b5563' : '#dee2e6'}`,
                        color: isDarkMode ? '#e5e7eb' : '#495057'
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Doctor's Additional Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder="Additional clinical notes or observations..."
                      value={treatmentData.doctorNotes}
                      onChange={(e) => handleInputChange('doctorNotes', e.target.value)}
                      style={{
                        background: isDarkMode ? '#374151' : '#ffffff',
                        border: `1px solid ${isDarkMode ? '#4b5563' : '#dee2e6'}`,
                        color: isDarkMode ? '#e5e7eb' : '#495057'
                      }}
                    />
                  </Form.Group>
                </Col>
              </Row>
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
          onClick={handlePrintRecord}
          style={{
            background: '#10b981',
            border: 'none',
            color: '#ffffff'
          }}
        >
          <i className="bi bi-printer me-2"></i>
          Print
        </Button>
        <Button 
          onClick={handleSaveRecord}
          disabled={loading}
          style={{
            background: '#0ea5e9',
            border: 'none',
            color: '#ffffff'
          }}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Saving...
            </>
          ) : (
            <>
              <i className="bi bi-save me-2"></i>
              Save Record
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default TreatmentRecordModal;
