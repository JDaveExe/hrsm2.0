import React, { useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import './styles/PatientWelcomeModal.css';

const PatientWelcomeModal = ({ show, onHide, patientData, autoDismissTime = 5000 }) => {
  useEffect(() => {
    if (show && autoDismissTime > 0) {
      const timer = setTimeout(() => {
        onHide();
      }, autoDismissTime);

      return () => clearTimeout(timer);
    }
  }, [show, onHide, autoDismissTime]);

  if (!patientData) return null;

  const getCurrentDateTime = () => {
    const now = new Date();
    const dateOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    const timeOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    
    return {
      date: now.toLocaleDateString('en-US', dateOptions),
      time: now.toLocaleTimeString('en-US', timeOptions)
    };
  };

  const { date, time } = getCurrentDateTime();

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="md"
      className="patient-welcome-modal"
      backdrop="static"
      keyboard={false}
    >
      <Modal.Body className="text-center p-4">
        <div className="welcome-container">
          {/* Welcome Icon */}
          <div className="welcome-icon mb-3">
            <i className="bi bi-person-check-fill"></i>
          </div>

          {/* Welcome Message */}
          <h3 className="welcome-title mb-3">
            Welcome!
          </h3>

          {/* Patient Information */}
          <div className="patient-info-card">
            <div className="info-row">
              <span className="info-label">Patient ID:</span>
              <span className="info-value">PT-{String(patientData.patientId).padStart(4, '0')}</span>
            </div>
            
            <div className="info-row">
              <span className="info-label">Full Name:</span>
              <span className="info-value">{patientData.patientName}</span>
            </div>
            
            <div className="info-row">
              <span className="info-label">Date:</span>
              <span className="info-value">{date}</span>
            </div>
            
            <div className="info-row">
              <span className="info-label">Time:</span>
              <span className="info-value">{time}</span>
            </div>
          </div>

          {/* Status Message */}
          <div className="status-message mt-3">
            <i className="bi bi-check-circle-fill me-2"></i>
            You have been successfully checked in!
          </div>

          {/* Auto-dismiss indicator */}
          <div className="auto-dismiss-indicator mt-3">
            <small className="text-muted">
              This window will close automatically in a few seconds...
            </small>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default PatientWelcomeModal;