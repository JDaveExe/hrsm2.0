import React, { useState } from 'react';
import CheckupHistoryModal from './PatientActions/CheckupHistoryModal';
import VitalSignsHistoryModal from './PatientActions/VitalSignsHistoryModal';
import TreatmentRecordModal from './PatientActions/TreatmentRecordModal';
import ImmunizationHistoryModal from './PatientActions/ImmunizationHistoryModal';
import ReferralFormModal from './PatientActions/ReferralFormModal';
import SMSNotificationModal from './PatientActions/SMSNotificationModal';
import './PatientActionModals.css';

const PatientActionsSection = ({ selectedPatient }) => {
  const [modals, setModals] = useState({
    checkupHistory: false,
    vitalSigns: false,
    treatmentRecord: false,
    immunization: false,
    referral: false,
    smsNotification: false
  });

  const openModal = (modalType) => {
    setModals(prev => ({ ...prev, [modalType]: true }));
  };

  const closeModal = (modalType) => {
    setModals(prev => ({ ...prev, [modalType]: false }));
  };

  const handleCheckupHistory = () => {
    if (!selectedPatient) {
      alert('Please select a patient first');
      return;
    }
    openModal('checkupHistory');
  };

  const handleVitalSignsHistory = () => {
    if (!selectedPatient) {
      alert('Please select a patient first');
      return;
    }
    openModal('vitalSigns');
  };

  const handleTreatmentRecord = () => {
    if (!selectedPatient) {
      alert('Please select a patient first');
      return;
    }
    openModal('treatmentRecord');
  };

  const handleImmunizationHistory = () => {
    if (!selectedPatient) {
      alert('Please select a patient first');
      return;
    }
    openModal('immunization');
  };

  const handleReferralForm = () => {
    if (!selectedPatient) {
      alert('Please select a patient first');
      return;
    }
    openModal('referral');
  };

  const handleSMSNotification = () => {
    if (!selectedPatient) {
      alert('Please select a patient first');
      return;
    }
    openModal('smsNotification');
  };
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-primary)',
      borderRadius: '12px',
      overflow: 'hidden'
    }}>
      <div style={{
        background: 'var(--sidebar-bg)',
        color: 'white',
        padding: '12px 16px',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <i className="bi bi-activity"></i>
        Patient Actions
      </div>
      <div style={{padding: '20px'}}>
        <div className="row g-3">
          <div className="col-md-6">
            <div 
              className="h-100 d-flex align-items-center p-3"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-secondary)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => handleCheckupHistory()}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'var(--accent-primary)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'var(--border-secondary)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <div className="me-3">
                <i className="bi bi-clipboard-pulse" style={{fontSize: '1.5rem', color: 'var(--accent-primary)'}}></i>
              </div>
              <div>
                <div style={{color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem'}}>
                  Check Up History
                </div>
                <small style={{color: 'var(--text-secondary)'}}>
                  Full examination details
                </small>
              </div>
            </div>
          </div>
          
          <div className="col-md-6">
            <div 
              className="h-100 d-flex align-items-center p-3"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-secondary)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => handleVitalSignsHistory()}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'var(--info)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'var(--border-secondary)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <div className="me-3">
                <i className="bi bi-heart-pulse" style={{fontSize: '1.5rem', color: 'var(--info)'}}></i>
              </div>
              <div>
                <div style={{color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem'}}>
                  Vital Signs History
                </div>
                <small style={{color: 'var(--text-secondary)'}}>
                  View recorded vital signs
                </small>
              </div>
            </div>
          </div>
          
          <div className="col-md-6">
            <div 
              className="h-100 d-flex align-items-center p-3"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-secondary)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => handleTreatmentRecord()}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'var(--success)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'var(--border-secondary)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <div className="me-3">
                <i className="bi bi-file-medical" style={{fontSize: '1.5rem', color: 'var(--success)'}}></i>
              </div>
              <div>
                <div style={{color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem'}}>
                  Treatment Record
                </div>
                <small style={{color: 'var(--text-secondary)'}}>
                  Previous medical records
                </small>
              </div>
            </div>
          </div>
          
          <div className="col-md-6">
            <div 
              className="h-100 d-flex align-items-center p-3"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-secondary)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => handleImmunizationHistory()}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'var(--error)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'var(--border-secondary)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <div className="me-3">
                <i className="bi bi-shield-check" style={{fontSize: '1.5rem', color: 'var(--error)'}}></i>
              </div>
              <div>
                <div style={{color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem'}}>
                  Immunization History
                </div>
                <small style={{color: 'var(--text-secondary)'}}>
                  Vaccination records
                </small>
              </div>
            </div>
          </div>
          
          {/* Laboratory Referral Button - Temporarily removed for update */}
          {/* Will be re-enabled after referral system update */}
          
          {/* SMS Button - Temporarily hidden until Twilio is configured */}
          {/* Uncomment when ready to use real SMS functionality */}
          {/* <div className="col-md-4">
            <div 
              className="h-100 d-flex align-items-center p-3"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-secondary)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'var(--accent-secondary)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'var(--border-secondary)';
                e.target.style.transform = 'translateY(0)';
              }}
              onClick={() => handleSMSNotification()}
            >
              <div className="me-3">
                <i className="bi bi-chat-dots" style={{fontSize: '1.5rem', color: 'var(--accent-secondary)'}}></i>
              </div>
              <div>
                <div style={{color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem'}}>
                  SMS Notification
                </div>
                <small style={{color: 'var(--text-secondary)'}}>
                  Send text message
                </small>
              </div>
            </div>
          </div> */}
        </div>
      </div>

      {/* Modal Components */}
      <CheckupHistoryModal 
        show={modals.checkupHistory}
        onHide={() => closeModal('checkupHistory')}
        selectedPatient={selectedPatient}
      />
      
      <VitalSignsHistoryModal 
        show={modals.vitalSigns}
        onHide={() => closeModal('vitalSigns')}
        selectedPatient={selectedPatient}
      />
      
      <TreatmentRecordModal 
        show={modals.treatmentRecord}
        onHide={() => closeModal('treatmentRecord')}
        selectedPatient={selectedPatient}
      />
      
      <ImmunizationHistoryModal 
        show={modals.immunization}
        onHide={() => closeModal('immunization')}
        selectedPatient={selectedPatient}
      />
      
      <ReferralFormModal 
        show={modals.referral}
        onHide={() => closeModal('referral')}
        selectedPatient={selectedPatient}
      />
      
      <SMSNotificationModal 
        show={modals.smsNotification}
        onHide={() => closeModal('smsNotification')}
        patient={selectedPatient}
      />
    </div>
  );
};

export default PatientActionsSection;
