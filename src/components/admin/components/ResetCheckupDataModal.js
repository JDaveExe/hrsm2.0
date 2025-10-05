import React, { useState } from 'react';
import { Modal, Button, Alert, Spinner } from 'react-bootstrap';
import './ResetCheckupDataModal.css';

const ResetCheckupDataModal = ({ show, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [resetResult, setResetResult] = useState(null);

  const handleResetCheckupData = async () => {
    setLoading(true);
    setMessage('');
    setResetResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/reset-checkup-data', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Checkup data reset successfully!');
        setMessageType('success');
        setResetResult(data);
        
        // Store the reset timestamp
        localStorage.setItem('lastCheckupReset', new Date().toISOString());
        
        // Auto-close modal after success and refresh
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 2000);
      } else {
        setMessage(data.message || 'Failed to reset checkup data');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error resetting checkup data:', error);
      setMessage('Error connecting to server');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setMessage('');
      setMessageType('');
      setResetResult(null);
      onClose();
    }
  };

  return (
    <Modal 
      show={show} 
      onHide={handleClose}
      className="reset-checkup-data-modal"
      centered
      backdrop={loading ? 'static' : true}
      keyboard={!loading}
    >
      <Modal.Header closeButton={!loading} className="reset-checkup-modal-header">
        <Modal.Title>
          <i className="bi bi-exclamation-triangle me-2 text-warning"></i>
          Reset Checkup Data
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="reset-checkup-modal-body">
        <div className="reset-checkup-warning-section">
          <div className="reset-checkup-warning-icon">
            <i className="bi bi-exclamation-triangle-fill text-warning"></i>
          </div>
          <h5 className="text-center mb-3">Are you sure you want to reset all checkup data?</h5>
        </div>
        
        <div className="reset-checkup-info-sections">
          <div className="alert alert-warning">
            <h6><i className="bi bi-info-circle me-2"></i>This action will:</h6>
            <ul className="mb-0">
              <li>Delete all completed, in-progress, and transferred checkup sessions</li>
              <li>Reset doctor-notified sessions back to checked-in status</li>
              <li>Clear all checkup notes, diagnoses, and prescriptions</li>
              <li>Empty today's checkup queue completely</li>
            </ul>
          </div>
          
          <div className="alert alert-success">
            <h6><i className="bi bi-shield-check me-2"></i>This action will NOT:</h6>
            <ul className="mb-0">
              <li>Delete patient records or personal information</li>
              <li>Remove user accounts or authentication data</li>
              <li>Affect appointment schedules</li>
              <li>Delete medical history or previous records</li>
            </ul>
          </div>
        </div>

        {message && (
          <Alert 
            variant={messageType === 'success' ? 'success' : 'danger'} 
            className="reset-checkup-result-alert"
          >
            <i className={`bi ${messageType === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle'} me-2`}></i>
            {message}
          </Alert>
        )}

        {resetResult && (
          <Alert variant="info" className="reset-checkup-summary-alert">
            <h6><i className="bi bi-info-circle me-2"></i>Reset Summary:</h6>
            <ul className="mb-0">
              <li>Deleted sessions: {resetResult.deletedSessions || 0}</li>
              <li>Reset sessions: {resetResult.resetSessions || 0}</li>
              <li>Remaining sessions: {resetResult.remainingSessions || 0}</li>
            </ul>
          </Alert>
        )}

        <p className="text-center mb-0 small text-muted reset-checkup-note">
          <strong>Note:</strong> This action cannot be undone. The page will refresh after reset.
        </p>
      </Modal.Body>
      
      <Modal.Footer className="reset-checkup-modal-footer">
        <Button 
          variant="secondary" 
          onClick={handleClose}
          disabled={loading}
          className="reset-checkup-cancel-btn"
        >
          Cancel
        </Button>
        <Button 
          variant="warning" 
          onClick={handleResetCheckupData}
          disabled={loading}
          className="reset-checkup-confirm-btn"
        >
          {loading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Resetting...
            </>
          ) : (
            <>
              <i className="bi bi-arrow-clockwise me-2"></i>
              Yes, Reset Data
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ResetCheckupDataModal;