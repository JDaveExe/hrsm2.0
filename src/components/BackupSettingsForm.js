import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Card, Badge, Alert } from 'react-bootstrap';

const BackupSettingsForm = ({ settings, onSave, onCancel, backupHistory = [], restoreHistory = [] }) => {
  const [formData, setFormData] = useState({
    enabled: false,
    frequency: 'daily',
    time: '02:00',
    maxBackups: 7,
    ...settings
  });

  useEffect(() => {
    setFormData({
      enabled: false,
      frequency: 'daily',
      time: '02:00',
      maxBackups: 7,
      ...settings
    });
  }, [settings]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getNextBackupTime = () => {
    if (!formData.enabled) return 'Auto backup is disabled';
    
    const now = new Date();
    const nextBackup = new Date();
    
    switch (formData.frequency) {
      case 'daily':
        nextBackup.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        nextBackup.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        nextBackup.setMonth(now.getMonth() + 1);
        break;
      default:
        nextBackup.setDate(now.getDate() + 1);
    }
    
    const [hours, minutes] = formData.time.split(':');
    nextBackup.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    return nextBackup.toLocaleString();
  };

  return (
    <div className="backup-settings-form">
      <Row>
        <Col md={8}>
          <Form onSubmit={handleSubmit}>
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">
                  <i className="bi bi-clock-history" style={{marginRight: '8px'}}></i>
                  Auto Backup Configuration
                </h5>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="enable-auto-backup"
                    label="Enable Automatic Backups"
                    checked={formData.enabled}
                    onChange={(e) => handleChange('enabled', e.target.checked)}
                  />
                </Form.Group>

                {formData.enabled && (
                  <>
                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Backup Frequency</Form.Label>
                          <Form.Select
                            value={formData.frequency}
                            onChange={(e) => handleChange('frequency', e.target.value)}
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Backup Time</Form.Label>
                          <Form.Control
                            type="time"
                            value={formData.time}
                            onChange={(e) => handleChange('time', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Maximum Backup Files to Keep</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        max="30"
                        value={formData.maxBackups}
                        onChange={(e) => handleChange('maxBackups', parseInt(e.target.value))}
                      />
                      <Form.Text className="text-muted">
                        Older backups will be automatically deleted when this limit is reached.
                      </Form.Text>
                    </Form.Group>

                    <Alert variant="info">
                      <i className="bi bi-info-circle" style={{marginRight: '8px'}}></i>
                      <strong>Next backup scheduled:</strong> {getNextBackupTime()}
                    </Alert>
                  </>
                )}
              </Card.Body>
            </Card>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                <i className="bi bi-check-lg" style={{marginRight: '8px'}}></i>
                Save Settings
              </Button>
            </div>
          </Form>
        </Col>

        <Col md={4}>
          {/* Backup History */}
          <Card className="mb-3">
            <Card.Header>
              <h6 className="mb-0">
                <i className="bi bi-clock-history" style={{marginRight: '8px'}}></i>
                Recent Backups ({backupHistory.length})
              </h6>
            </Card.Header>
            <Card.Body style={{maxHeight: '200px', overflowY: 'auto'}}>
              {backupHistory.length === 0 ? (
                <p className="text-muted mb-0">No backups created yet</p>
              ) : (
                backupHistory.map((backup, index) => (
                  <div key={backup.id} className="d-flex justify-content-between align-items-center mb-2 pb-2" style={{borderBottom: index < backupHistory.length - 1 ? '1px solid #eee' : 'none'}}>
                    <div>
                      <div style={{fontSize: '0.9em', fontWeight: '500'}}>
                        {new Date(backup.timestamp).toLocaleDateString()}
                      </div>
                      <div style={{fontSize: '0.8em', color: '#666'}}>
                        {backup.metadata.totalPatients} patients
                      </div>
                    </div>
                    <Badge bg="success" style={{fontSize: '0.7em'}}>
                      {formatFileSize(backup.metadata.backupSize)}
                    </Badge>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>

          {/* Restore History */}
          <Card>
            <Card.Header>
              <h6 className="mb-0">
                <i className="bi bi-arrow-clockwise" style={{marginRight: '8px'}}></i>
                Recent Restores ({restoreHistory.length})
              </h6>
            </Card.Header>
            <Card.Body style={{maxHeight: '200px', overflowY: 'auto'}}>
              {restoreHistory.length === 0 ? (
                <p className="text-muted mb-0">No restores performed yet</p>
              ) : (
                restoreHistory.map((restore, index) => (
                  <div key={restore.id} className="d-flex justify-content-between align-items-center mb-2 pb-2" style={{borderBottom: index < restoreHistory.length - 1 ? '1px solid #eee' : 'none'}}>
                    <div>
                      <div style={{fontSize: '0.9em', fontWeight: '500'}}>
                        {new Date(restore.timestamp).toLocaleDateString()}
                      </div>
                      <div style={{fontSize: '0.8em', color: '#666'}}>
                        From: {new Date(restore.backupTimestamp).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge bg="info" style={{fontSize: '0.7em'}}>
                      Restored
                    </Badge>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default BackupSettingsForm;
