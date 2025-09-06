import React from 'react';
import { Button, Card, Row, Col, Alert } from 'react-bootstrap';
import { useCommonAlerts } from './AlertUtils';

const AlertTestPanel = () => {
  const {
    showDataRefreshAlert,
    showDataRefreshError,
    showDataRefreshSuccess,
    showBackupSuccess,
    showBackupError,
    showConnectionError,
    showConnectionRestored,
    showCriticalError,
    showSecurityWarning,
    showOperationSuccess,
    clearAllAlerts,
    renderAlerts,
    settings
  } = useCommonAlerts();

  const handleTestDataRefresh = () => {
    showDataRefreshAlert();
    // Simulate data loading
    setTimeout(() => {
      if (Math.random() > 0.5) {
        showDataRefreshSuccess(() => console.log('Refresh clicked'));
      } else {
        showDataRefreshError(() => console.log('Retry clicked'));
      }
    }, 2000);
  };

  const handleTestBackup = () => {
    // Simulate backup process
    if (Math.random() > 0.3) {
      showBackupSuccess({ totalPatients: 150, totalFamilies: 45 });
    } else {
      showBackupError(new Error('Database connection failed'), () => console.log('Retry backup'));
    }
  };

  const handleTestConnection = () => {
    showConnectionError('Database', () => {
      console.log('Reconnecting...');
      setTimeout(() => {
        showConnectionRestored('Database');
      }, 3000);
    });
  };

  return (
    <div className="alert-test-panel">
      <Card>
        <Card.Header>
          <h5 className="mb-0">
            <i className="bi bi-bug me-2"></i>
            Alert System Test Panel
          </h5>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col>
              <Alert variant="info">
                <i className="bi bi-info-circle me-2"></i>
                <strong>Test the new alert management system:</strong> Use the buttons below to trigger different types of alerts. 
                The alerts will auto-dismiss based on your settings (currently: {settings.autoDismissEnabled ? `${settings.autoDismissTime} minutes` : 'disabled'}).
              </Alert>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={4}>
              <h6>Data Operations</h6>
              <div className="d-grid gap-2">
                <Button variant="primary" size="sm" onClick={handleTestDataRefresh}>
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Test Data Refresh
                </Button>
                <Button variant="outline-primary" size="sm" onClick={() => showOperationSuccess('Patient Update', '5 records updated')}>
                  <i className="bi bi-check-circle me-1"></i>
                  Success Operation
                </Button>
              </div>
            </Col>

            <Col md={4}>
              <h6>System Operations</h6>
              <div className="d-grid gap-2">
                <Button variant="success" size="sm" onClick={handleTestBackup}>
                  <i className="bi bi-shield-check me-1"></i>
                  Test Backup
                </Button>
                <Button variant="warning" size="sm" onClick={handleTestConnection}>
                  <i className="bi bi-wifi-off me-1"></i>
                  Test Connection Error
                </Button>
              </div>
            </Col>

            <Col md={4}>
              <h6>Critical Alerts</h6>
              <div className="d-grid gap-2">
                <Button variant="danger" size="sm" onClick={() => showCriticalError('System Error', 'A critical system error has occurred')}>
                  <i className="bi bi-exclamation-octagon me-1"></i>
                  Critical Error
                </Button>
                <Button variant="warning" size="sm" onClick={() => showSecurityWarning('Security Alert', 'Unusual login activity detected')}>
                  <i className="bi bi-shield-exclamation me-1"></i>
                  Security Warning
                </Button>
              </div>
            </Col>
          </Row>

          <Row>
            <Col>
              <Button variant="outline-secondary" size="sm" onClick={clearAllAlerts}>
                <i className="bi bi-trash me-1"></i>
                Clear All Alerts
              </Button>
            </Col>
          </Row>

          <hr className="my-4" />

          <div className="alert-settings-info">
            <h6>Current Alert Settings:</h6>
            <ul className="list-unstyled small">
              <li><strong>Auto-dismiss:</strong> {settings.autoDismissEnabled ? 'Enabled' : 'Disabled'}</li>
              <li><strong>Auto-dismiss time:</strong> {settings.autoDismissTime} minutes</li>
              <li><strong>Retry on persistence:</strong> {settings.retryOnPersistence ? 'Yes' : 'No'}</li>
              <li><strong>Show timer:</strong> {settings.notificationSettings?.showTimer ? 'Yes' : 'No'}</li>
              <li><strong>Show retry count:</strong> {settings.notificationSettings?.showRetryCount ? 'Yes' : 'No'}</li>
            </ul>
          </div>

          <hr className="my-4" />

          {/* Render active alerts */}
          <div className="active-alerts">
            <h6>Active Alerts:</h6>
            {renderAlerts()}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AlertTestPanel;
