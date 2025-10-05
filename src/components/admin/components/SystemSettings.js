import React, { useState, useCallback } from 'react';
import { Card, Button, Alert, Modal, Spinner, Row, Col, Form } from 'react-bootstrap';
import adminService from '../../../services/adminService';
import './SystemSettings.css';

const SystemSettings = () => {
  const [isResetting, setIsResetting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetResult, setResetResult] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reset Checkup Data function
  const handleResetCheckupData = useCallback(async () => {
    try {
      setIsResetting(true);
      setError('');
      setSuccess('');

      // Call the backend endpoint to reset all checkup data
      const response = await fetch('/api/admin/reset-checkup-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to reset checkup data');
      }

      const result = await response.json();
      setResetResult(result);
      setSuccess('Checkup data has been successfully reset to empty state.');
      setShowResetModal(false);

      // Refresh the page to ensure all cached data is cleared
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (err) {
      console.error('Error resetting checkup data:', err);
      setError(`Failed to reset checkup data: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  }, []);

  const handleShowResetModal = useCallback(() => {
    setShowResetModal(true);
    setError('');
    setSuccess('');
  }, []);

  const handleCloseResetModal = useCallback(() => {
    setShowResetModal(false);
  }, []);

  return (
    <div className="system-settings">
      <Row>
        <Col lg={8} xl={6}>
          <Card>
            <Card.Header>
              <h3><i className="bi bi-gear me-2"></i>System Settings</h3>
            </Card.Header>
            <Card.Body>
              {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert variant="success" dismissible onClose={() => setSuccess('')}>
                  <i className="bi bi-check-circle me-2"></i>
                  {success}
                </Alert>
              )}

              {resetResult && (
                <Alert variant="info">
                  <h6><i className="bi bi-info-circle me-2"></i>Reset Summary:</h6>
                  <ul className="mb-0">
                    <li>Deleted sessions: {resetResult.deletedSessions || 0}</li>
                    <li>Reset sessions: {resetResult.resetSessions || 0}</li>
                    <li>Remaining sessions: {resetResult.remainingSessions || 0}</li>
                  </ul>
                </Alert>
              )}

              {/* Data Management Section */}
              <div className="settings-section mb-4">
                <h5 className="settings-section-title">
                  <i className="bi bi-database me-2"></i>
                  Data Management
                </h5>
                <div className="settings-section-content">
                  <Card className="border-warning">
                    <Card.Body>
                      <div className="d-flex align-items-center justify-content-between">
                        <div>
                          <h6 className="mb-1">
                            <i className="bi bi-arrow-clockwise me-2 text-warning"></i>
                            Reset Checkup Data
                          </h6>
                          <p className="text-muted mb-0 small">
                            Clear all checkup sessions and reset the system to empty state. 
                            This will remove all today's checkups but keep patient records intact.
                          </p>
                        </div>
                        <Button 
                          variant="warning" 
                          onClick={handleShowResetModal}
                          disabled={isResetting}
                          className="ms-3"
                        >
                          {isResetting ? (
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
                              Reset Data
                            </>
                          )}
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              </div>

              {/* System Information */}
              <div className="settings-section">
                <h5 className="settings-section-title">
                  <i className="bi bi-info-circle me-2"></i>
                  System Information
                </h5>
                <div className="settings-section-content">
                  <Row>
                    <Col md={6}>
                      <small className="text-muted">Last Reset:</small>
                      <div>{localStorage.getItem('lastCheckupReset') || 'Never'}</div>
                    </Col>
                    <Col md={6}>
                      <small className="text-muted">System Status:</small>
                      <div className="text-success">
                        <i className="bi bi-circle-fill me-1" style={{ fontSize: '8px' }}></i>
                        Operational
                      </div>
                    </Col>
                  </Row>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Reset Confirmation Modal */}
      <Modal show={showResetModal} onHide={handleCloseResetModal} centered>
        <Modal.Header closeButton className="bg-warning text-dark">
          <Modal.Title>
            <i className="bi bi-exclamation-triangle me-2"></i>
            Confirm Reset Checkup Data
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-3">
            <i className="bi bi-exclamation-triangle-fill text-warning" style={{ fontSize: '3rem' }}></i>
          </div>
          <h5 className="text-center mb-3">Are you sure you want to reset all checkup data?</h5>
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
          <p className="text-center mb-0 small text-muted">
            <strong>Note:</strong> This action cannot be undone. The page will refresh after reset.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseResetModal} disabled={isResetting}>
            Cancel
          </Button>
          <Button 
            variant="warning" 
            onClick={handleResetCheckupData}
            disabled={isResetting}
          >
            {isResetting ? (
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
    </div>
  );
};

export default SystemSettings;
