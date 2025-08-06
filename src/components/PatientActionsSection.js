import React from 'react';

const PatientActionsSection = ({ 
  selectedPatient, 
  handleCheckupHistory, 
  handleVitalSignsHistory, 
  handleTreatmentRecord, 
  handleImmunizationHistory, 
  handleReferralForm, 
  handleSMSNotification 
}) => {
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
          <div className="col-md-4">
            <div 
              className="h-100 d-flex align-items-center p-3"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-secondary)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => handleCheckupHistory(selectedPatient)}
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
          
          <div className="col-md-4">
            <div 
              className="h-100 d-flex align-items-center p-3"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-secondary)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => handleVitalSignsHistory(selectedPatient)}
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
          
          <div className="col-md-4">
            <div 
              className="h-100 d-flex align-items-center p-3"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-secondary)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => handleTreatmentRecord(selectedPatient)}
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
          
          <div className="col-md-4">
            <div 
              className="h-100 d-flex align-items-center p-3"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-secondary)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => handleImmunizationHistory(selectedPatient)}
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
          
          <div className="col-md-4">
            <div 
              className="h-100 d-flex align-items-center p-3"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-secondary)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => handleReferralForm(selectedPatient)}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'var(--warning)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'var(--border-secondary)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <div className="me-3">
                <i className="bi bi-file-medical-fill" style={{fontSize: '1.5rem', color: 'var(--warning)'}}></i>
              </div>
              <div>
                <div style={{color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem'}}>
                  Laboratory Referral
                </div>
                <small style={{color: 'var(--text-secondary)'}}>
                  Generate referral slip
                </small>
              </div>
            </div>
          </div>
          
          <div className="col-md-4">
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
              onClick={() => handleSMSNotification(selectedPatient)}
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
          </div>
        </div>
        
        <div className="text-center mt-3">
          <small style={{color: 'var(--text-secondary)', fontStyle: 'italic'}}>
            Select an action to perform
          </small>
        </div>
      </div>
    </div>
  );
};

export default PatientActionsSection;
