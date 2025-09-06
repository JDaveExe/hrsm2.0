import React from 'react';
import { Modal, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';

const SessionWarningModal = () => {
  const { showWarning, warningTimeLeft, extendSession, logout } = useAuth();

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Modal 
      show={showWarning} 
      backdrop="static" 
      keyboard={false}
      centered
      size="sm"
    >
      <Modal.Header>
        <Modal.Title className="text-warning">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Session Timeout Warning
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="warning" className="mb-3">
          <strong>Your session will expire soon!</strong>
        </Alert>
        <p className="mb-2">
          You will be automatically logged out in:
        </p>
        <div className="text-center">
          <h4 className="text-danger fw-bold">
            {formatTime(warningTimeLeft)}
          </h4>
        </div>
        <p className="text-muted small mt-3">
          Click "Stay Logged In" to extend your session, or "Logout Now" to logout immediately.
        </p>
      </Modal.Body>
      <Modal.Footer className="justify-content-between">
        <Button 
          variant="outline-secondary" 
          onClick={logout}
          size="sm"
        >
          <i className="fas fa-sign-out-alt me-1"></i>
          Logout Now
        </Button>
        <Button 
          variant="primary" 
          onClick={extendSession}
          size="sm"
        >
          <i className="fas fa-clock me-1"></i>
          Stay Logged In
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SessionWarningModal;
