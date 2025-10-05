import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import patientService from '../services/patientService';

const PatientInfoCards = ({ selectedPatient }) => {
  const [showMedicalConditionsModal, setShowMedicalConditionsModal] = useState(false);
  const [patientMedicalConditions, setPatientMedicalConditions] = useState([]);
  const [loadingConditions, setLoadingConditions] = useState(false);
  
  // Medical conditions list for the modal
  const medicalConditionsList = [
    'Hypertension (High Blood Pressure)',
    'Diabetes Mellitus',
    'Heart Disease',
    'Asthma',
    'Allergies',
    'Arthritis',
    'Kidney Disease',
    'Liver Disease',
    'Thyroid Disorders',
    'High Cholesterol',
    'Stroke',
    'Cancer',
    'Depression',
    'Anxiety Disorders',
    'Migraine',
    'Epilepsy',
    'Osteoporosis',
    'COPD (Chronic Obstructive Pulmonary Disease)',
    'Gastroesophageal Reflux Disease (GERD)',
    'Irritable Bowel Syndrome (IBS)',
    'Fibromyalgia',
    'Sleep Apnea',
    'Chronic Fatigue Syndrome'
  ];

  // Fetch patient medical conditions
  useEffect(() => {
    const fetchPatientConditions = async () => {
      if (!selectedPatient?.id) return;
      
      try {
        setLoadingConditions(true);
        const patientData = await patientService.getPatientById(selectedPatient.id);
        
        if (patientData?.medicalConditions && patientData.medicalConditions !== 'N/A' && patientData.medicalConditions.trim() !== '') {
          // Parse comma-separated conditions
          const conditions = patientData.medicalConditions.split(', ').filter(condition => condition.trim() !== '');
          setPatientMedicalConditions(conditions);
        } else {
          setPatientMedicalConditions([]);
        }
      } catch (error) {
        console.error('Error fetching patient medical conditions:', error);
        setPatientMedicalConditions([]);
      } finally {
        setLoadingConditions(false);
      }
    };

    fetchPatientConditions();
  }, [selectedPatient?.id]);
  return (
    <>
      <div className="row g-3 mb-3">
      {/* Personal Information Card */}
      <div className="col-md-6">
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
          borderRadius: '12px',
          overflow: 'hidden',
          height: '240px', // Fixed height to match contact info
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            background: 'var(--accent-primary)',
            color: 'white',
            padding: '12px 16px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0
          }}>
            <i className="bi bi-person-circle"></i>
            Personal Information
          </div>
          <div style={{padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
            <div className="row g-2">
              <div className="col-4">
                <small style={{color: 'var(--text-secondary)', fontWeight: 500}}>Age</small>
                <div style={{color: 'var(--text-primary)', fontWeight: 500}}>
                  {selectedPatient.age || 'N/A'}
                </div>
              </div>
              <div className="col-4">
                <small style={{color: 'var(--text-secondary)', fontWeight: 500}}>Gender</small>
                <div style={{color: 'var(--text-primary)', fontWeight: 500}}>
                  {selectedPatient.gender || 'N/A'}
                </div>
              </div>
              <div className="col-4">
                <small style={{color: 'var(--text-secondary)', fontWeight: 500}}>Civil Status</small>
                <div style={{color: 'var(--text-primary)', fontWeight: 500}}>
                  {selectedPatient.civilStatus || 'N/A'}
                </div>
              </div>
              <div className="col-6">
                <small style={{color: 'var(--text-secondary)', fontWeight: 500}}>Date of Birth</small>
                <div style={{color: 'var(--text-primary)', fontWeight: 500}}>
                  {selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              <div className="col-6">
                <small style={{color: 'var(--text-secondary)', fontWeight: 500}}>Blood Type</small>
                <div style={{color: 'var(--text-primary)', fontWeight: 500}}>
                  {selectedPatient.bloodType || 'N/A'}
                </div>
              </div>
              <div className="col-12" style={{marginTop: '12px'}}>
                <div className="d-flex align-items-center" style={{gap: '12px'}}>
                  <small style={{color: 'var(--text-secondary)', fontWeight: 500, margin: 0, lineHeight: '1.2'}}>Medical Conditions:</small>
                  <button 
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => setShowMedicalConditionsModal(true)}
                    style={{
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      padding: '4px 12px',
                      flexShrink: 0,
                      minWidth: '60px'
                    }}
                  >
                    <i className="bi bi-eye me-1"></i>
                    View
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information Card */}
      <div className="col-md-6">
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
          borderRadius: '12px',
          overflow: 'hidden',
          height: '240px', // Fixed height to match personal info
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            background: 'var(--success)',
            color: 'white',
            padding: '12px 16px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0
          }}>
            <i className="bi bi-telephone"></i>
            Contact Information
          </div>
          <div style={{padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
            <div className="row g-2">
              <div className="col-6">
                <small style={{color: 'var(--text-secondary)', fontWeight: 500}}>Phone</small>
                <div style={{color: 'var(--text-primary)', fontWeight: 500}}>
                  {selectedPatient.contactNumber || 'N/A'}
                </div>
              </div>
              <div className="col-6">
                <small style={{color: 'var(--text-secondary)', fontWeight: 500}}>Email</small>
                <div style={{color: 'var(--warning)', fontWeight: 500}}>
                  {selectedPatient.email || 'N/A'}
                </div>
              </div>
              <div className="col-6">
                <small style={{color: 'var(--text-secondary)', fontWeight: 500}}>PhilHealth Number</small>
                <div style={{color: 'var(--text-primary)', fontWeight: 500}}>
                  {selectedPatient.philHealthNumber || 'N/A'}
                </div>
              </div>
              <div className="col-6">
                <small style={{color: 'var(--text-secondary)', fontWeight: 500}}>Address</small>
                <div style={{color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.85rem'}}>
                  {selectedPatient.formattedAddress || selectedPatient.address || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      </div>

      {/* Medical Conditions Modal */}
    <Modal
      show={showMedicalConditionsModal}
      onHide={() => setShowMedicalConditionsModal(false)}
      centered
      size="md"
    >
      <Modal.Header 
        closeButton
        style={{
          background: 'var(--accent-primary)',
          color: 'white',
          border: 'none'
        }}
      >
        <Modal.Title>
          <i className="bi bi-heart-pulse me-2"></i>
          Medical Conditions - {selectedPatient.firstName} {selectedPatient.lastName}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{padding: '20px'}}>
        <p style={{color: 'var(--text-secondary)', marginBottom: '15px'}}>
          Medical conditions as reported by the patient in their profile settings:
        </p>
        
        {loadingConditions ? (
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-secondary)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center',
            color: 'var(--text-secondary)'
          }}>
            <i className="bi bi-clock me-2"></i>
            Loading medical conditions...
          </div>
        ) : patientMedicalConditions.length > 0 ? (
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-secondary)',
            borderRadius: '8px',
            padding: '15px',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            <div className="row">
              {medicalConditionsList.map((condition) => (
                <div key={condition} className="col-12 mb-2">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`condition-${condition.replace(/[^a-zA-Z0-9]/g, '-')}`}
                      checked={patientMedicalConditions.includes(condition)}
                      disabled={true}
                      style={{
                        backgroundColor: patientMedicalConditions.includes(condition) ? 'var(--accent-primary)' : 'transparent',
                        borderColor: 'var(--border-primary)'
                      }}
                    />
                    <label
                      className="form-check-label"
                      htmlFor={`condition-${condition.replace(/[^a-zA-Z0-9]/g, '-')}`}
                      style={{
                        color: patientMedicalConditions.includes(condition) ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: patientMedicalConditions.includes(condition) ? 500 : 400,
                        fontSize: '0.9rem'
                      }}
                    >
                      {condition}
                    </label>
                  </div>
                </div>
              ))}
            </div>
            
            {patientMedicalConditions.some(condition => !medicalConditionsList.includes(condition)) && (
              <div style={{
                marginTop: '15px',
                padding: '10px',
                background: 'var(--bg-warning)',
                border: '1px solid var(--border-warning)',
                borderRadius: '6px'
              }}>
                <strong style={{color: 'var(--text-primary)'}}>Additional conditions:</strong>
                <div style={{marginTop: '5px', fontSize: '0.9rem', color: 'var(--text-secondary)'}}>
                  {patientMedicalConditions.filter(condition => !medicalConditionsList.includes(condition)).join(', ')}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-secondary)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center',
            color: 'var(--text-secondary)'
          }}>
            <i className="bi bi-info-circle me-2" style={{fontSize: '1.2rem'}}></i>
            No medical conditions have been reported by this patient.
          </div>
        )}
        
        <hr style={{margin: '20px 0', borderColor: 'var(--border-primary)'}} />
        
        <div style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>
          <strong>Note:</strong> This information is self-reported by the patient during registration. 
          Please verify and update during consultation as needed.
        </div>
      </Modal.Body>
      <Modal.Footer style={{borderTop: '1px solid var(--border-primary)'}}>
        <Button 
          variant="secondary" 
          onClick={() => setShowMedicalConditionsModal(false)}
        >
          Close
        </Button>
      </Modal.Footer>
    </Modal>
    </>
  );
};

export default PatientInfoCards;
