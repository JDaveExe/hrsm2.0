import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Alert, 
  Form, 
  Badge,
  Spinner,
  Modal,
  Table,
  ProgressBar
} from 'react-bootstrap';
import backupService from '../../../services/backupService';

const BackupSettings = () => {
  const [settings, setSettings] = useState({
    autoBackup: {
      enabled: false,
      frequency: 'daily',
      time: '02:00',
      retentionDays: 30,
      maxBackups: 10
    },
    compression: {
      level: 6,
      algorithm: 'zip'
    },
    encryption: {
      enabled: false,
      algorithm: 'AES-256'
    },
    storage: {
      localPath: './backups',
      maxStorageGB: 50,
      cleanupEnabled: true
    },
    notifications: {
      emailEnabled: false,
      emailAddress: '',
      successNotifications: true,
      failureNotifications: true
    },
    alerts: {
      autoDismissEnabled: true,
      autoDismissTime: 10, // minutes
      retryOnPersistence: true,
      dismissAlertTypes: {
        'data-refresh': true,
        'data-refresh-success': true,
        'backup-success': true,
        'connection-restored': true
      },
      persistentAlerts: ['critical-error', 'security-warning'], // Array for includes method
      notificationSettings: {
        showCountdown: true,
        showRetryCount: true,
        enableSound: false
      }
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [storageStats, setStorageStats] = useState(null);

  useEffect(() => {
    loadSettings();
    loadStorageStats();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const config = await backupService.getBackupConfig();
      setSettings(prev => ({ ...prev, ...config }));
      setError(null);
    } catch (err) {
      setError('Failed to load backup settings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStorageStats = async () => {
    try {
      const stats = await backupService.getStorageStats();
      setStorageStats(stats);
    } catch (err) {
      console.error('Failed to load storage stats:', err);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await backupService.updateBackupConfig(settings);
      setSuccess('Backup settings saved successfully!');
      setError(null);
    } catch (err) {
      setError('Failed to save backup settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExportSettings = async () => {
    try {
      const exportData = await backupService.exportBackupSettings();
      
      // Create download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setShowExportModal(false);
      setSuccess('Backup settings exported successfully!');
    } catch (err) {
      setError('Failed to export backup settings: ' + err.message);
    }
  };

  const handleImportSettings = async () => {
    if (!importFile) {
      setError('Please select a file to import');
      return;
    }

    try {
      const text = await importFile.text();
      const importData = JSON.parse(text);
      
      await backupService.importBackupSettings(importData);
      setSuccess('Backup settings imported successfully!');
      setShowImportModal(false);
      setImportFile(null);
      loadSettings();
    } catch (err) {
      setError('Failed to import backup settings: ' + err.message);
    }
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all backup settings to defaults?')) {
      setSettings({
        autoBackup: {
          enabled: false,
          frequency: 'daily',
          time: '02:00',
          retentionDays: 30,
          maxBackups: 10
        },
        compression: {
          level: 6,
          algorithm: 'zip'
        },
        encryption: {
          enabled: false,
          algorithm: 'AES-256'
        },
        storage: {
          localPath: './backups',
          maxStorageGB: 50,
          cleanupEnabled: true
        },
        notifications: {
          emailEnabled: false,
          emailAddress: '',
          successNotifications: true,
          failureNotifications: true
        }
      });
      setSuccess('Settings reset to defaults');
    }
  };

  const getStorageUsagePercentage = () => {
    if (!storageStats) return 0;
    return Math.round((storageStats.usedSpace / (settings.storage.maxStorageGB * 1024 * 1024 * 1024)) * 100);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading backup settings...</p>
      </div>
    );
  }

  return (
    <div className="backup-settings">
      {/* Error/Success Messages */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-4">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)} className="mb-4">
          <i className="bi bi-check-circle me-2"></i>
          {success}
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>Backup Configuration</h4>
        <div className="btn-group">
          <Button variant="outline-secondary" onClick={() => setShowExportModal(true)}>
            <i className="bi bi-download me-1"></i>
            Export
          </Button>
          <Button variant="outline-secondary" onClick={() => setShowImportModal(true)}>
            <i className="bi bi-upload me-1"></i>
            Import
          </Button>
          <Button variant="outline-warning" onClick={handleResetSettings}>
            <i className="bi bi-arrow-clockwise me-1"></i>
            Reset
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveSettings}
            disabled={saving}
          >
            {saving ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-1" />
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-save me-1"></i>
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>

      <Row>
        <Col md={8}>
          {/* Auto Backup Settings */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <i className="bi bi-gear me-2"></i>
                Automatic Backup Settings
              </h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Check
                  type="checkbox"
                  label="Enable automatic backups"
                  checked={settings.autoBackup.enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    autoBackup: { ...settings.autoBackup, enabled: e.target.checked }
                  })}
                  className="mb-3"
                />
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Backup Frequency</Form.Label>
                      <Form.Select
                        value={settings.autoBackup.frequency}
                        onChange={(e) => setSettings({
                          ...settings,
                          autoBackup: { ...settings.autoBackup, frequency: e.target.value }
                        })}
                        disabled={!settings.autoBackup.enabled}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Backup Time</Form.Label>
                      <Form.Control
                        type="time"
                        value={settings.autoBackup.time}
                        onChange={(e) => setSettings({
                          ...settings,
                          autoBackup: { ...settings.autoBackup, time: e.target.value }
                        })}
                        disabled={!settings.autoBackup.enabled}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Retention Period (days)</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        max="365"
                        value={settings.autoBackup.retentionDays}
                        onChange={(e) => setSettings({
                          ...settings,
                          autoBackup: { ...settings.autoBackup, retentionDays: parseInt(e.target.value) }
                        })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Maximum Backups</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        max="100"
                        value={settings.autoBackup.maxBackups}
                        onChange={(e) => setSettings({
                          ...settings,
                          autoBackup: { ...settings.autoBackup, maxBackups: parseInt(e.target.value) }
                        })}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>

          {/* Compression Settings */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <i className="bi bi-file-zip me-2"></i>
                Compression Settings
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Compression Level (1-9)</Form.Label>
                    <Form.Range
                      min={1}
                      max={9}
                      value={settings.compression.level}
                      onChange={(e) => setSettings({
                        ...settings,
                        compression: { ...settings.compression, level: parseInt(e.target.value) }
                      })}
                    />
                    <small className="text-muted">
                      Current: {settings.compression.level} 
                      ({settings.compression.level <= 3 ? 'Fast' : settings.compression.level <= 6 ? 'Balanced' : 'Best'})
                    </small>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Algorithm</Form.Label>
                    <Form.Select
                      value={settings.compression.algorithm}
                      onChange={(e) => setSettings({
                        ...settings,
                        compression: { ...settings.compression, algorithm: e.target.value }
                      })}
                    >
                      <option value="zip">ZIP</option>
                      <option value="gzip">GZIP</option>
                      <option value="tar">TAR</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Notification Settings */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <i className="bi bi-bell me-2"></i>
                Notification Settings
              </h5>
            </Card.Header>
            <Card.Body>
              <Form.Check
                type="checkbox"
                label="Enable email notifications"
                checked={settings.notifications.emailEnabled}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, emailEnabled: e.target.checked }
                })}
                className="mb-3"
              />

              <Form.Group className="mb-3">
                <Form.Label>Email Address</Form.Label>
                <Form.Control
                  type="email"
                  value={settings.notifications.emailAddress}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, emailAddress: e.target.value }
                  })}
                  disabled={!settings.notifications.emailEnabled}
                  placeholder="admin@example.com"
                />
              </Form.Group>

              <Form.Check
                type="checkbox"
                label="Notify on successful backups"
                checked={settings.notifications.successNotifications}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, successNotifications: e.target.checked }
                })}
                disabled={!settings.notifications.emailEnabled}
                className="mb-2"
              />

              <Form.Check
                type="checkbox"
                label="Notify on backup failures"
                checked={settings.notifications.failureNotifications}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, failureNotifications: e.target.checked }
                })}
                disabled={!settings.notifications.emailEnabled}
              />
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          {/* Storage Information */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <i className="bi bi-hdd me-2"></i>
                Storage Information
              </h5>
            </Card.Header>
            <Card.Body>
              {storageStats ? (
                <>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <small>Storage Usage</small>
                      <small>{getStorageUsagePercentage()}%</small>
                    </div>
                    <ProgressBar 
                      now={getStorageUsagePercentage()} 
                      variant={getStorageUsagePercentage() > 80 ? 'danger' : getStorageUsagePercentage() > 60 ? 'warning' : 'success'}
                    />
                  </div>

                  <Table size="sm" className="mb-0">
                    <tbody>
                      <tr>
                        <td>Used Space:</td>
                        <td className="text-end">{formatBytes(storageStats.usedSpace)}</td>
                      </tr>
                      <tr>
                        <td>Total Backups:</td>
                        <td className="text-end">{storageStats.totalBackups}</td>
                      </tr>
                      <tr>
                        <td>Oldest Backup:</td>
                        <td className="text-end">
                          {storageStats.oldestBackup ? 
                            new Date(storageStats.oldestBackup).toLocaleDateString() : 
                            'N/A'
                          }
                        </td>
                      </tr>
                      <tr>
                        <td>Storage Limit:</td>
                        <td className="text-end">{settings.storage.maxStorageGB} GB</td>
                      </tr>
                    </tbody>
                  </Table>
                </>
              ) : (
                <div className="text-center py-3">
                  <Spinner animation="border" size="sm" />
                  <p className="mt-2 mb-0 small">Loading storage info...</p>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Quick Actions */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <i className="bi bi-lightning me-2"></i>
                Quick Actions
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button variant="outline-primary" size="sm">
                  <i className="bi bi-shield-check me-1"></i>
                  Test Backup System
                </Button>
                <Button variant="outline-info" size="sm">
                  <i className="bi bi-graph-up me-1"></i>
                  View Backup History
                </Button>
                <Button variant="outline-warning" size="sm">
                  <i className="bi bi-trash me-1"></i>
                  Cleanup Old Backups
                </Button>
                <Button variant="outline-secondary" size="sm">
                  <i className="bi bi-question-circle me-1"></i>
                  Backup Guidelines
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Alert Management Settings */}
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Alert Management
              </h5>
            </Card.Header>
            <Card.Body className="text-start">
              <Form.Check
                type="checkbox"
                label="Enable auto-dismiss for temporary alerts"
                checked={settings.alerts.autoDismissEnabled}
                onChange={(e) => setSettings({
                  ...settings,
                  alerts: { ...settings.alerts, autoDismissEnabled: e.target.checked }
                })}
                className="mb-3"
              />

              <Form.Group className="mb-3">
                <Form.Label>Auto-dismiss time (minutes)</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  max="60"
                  value={settings.alerts.autoDismissTime}
                  onChange={(e) => setSettings({
                    ...settings,
                    alerts: { ...settings.alerts, autoDismissTime: parseInt(e.target.value) }
                  })}
                  disabled={!settings.alerts.autoDismissEnabled}
                />
                <Form.Text className="text-muted">
                  Time before alerts automatically disappear (1-60 minutes)
                </Form.Text>
              </Form.Group>

              <Form.Check
                type="checkbox"
                label="Re-show alerts if issues persist"
                checked={settings.alerts.retryOnPersistence}
                onChange={(e) => setSettings({
                  ...settings,
                  alerts: { ...settings.alerts, retryOnPersistence: e.target.checked }
                })}
                className="mb-3"
              />

              <div className="mb-3">
                <Form.Label className="fw-bold">Auto-dismiss Alert Types:</Form.Label>
                <Form.Check
                  type="checkbox"
                  label="Data Refresh"
                  checked={settings.alerts.dismissAlertTypes['data-refresh']}
                  onChange={(e) => setSettings({
                    ...settings,
                    alerts: {
                      ...settings.alerts,
                      dismissAlertTypes: {
                        ...settings.alerts.dismissAlertTypes,
                        'data-refresh': e.target.checked
                      }
                    }
                  })}
                  className="mb-1"
                />
                <Form.Check
                  type="checkbox"
                  label="Data Refresh-Success"
                  checked={settings.alerts.dismissAlertTypes['data-refresh-success']}
                  onChange={(e) => setSettings({
                    ...settings,
                    alerts: {
                      ...settings.alerts,
                      dismissAlertTypes: {
                        ...settings.alerts.dismissAlertTypes,
                        'data-refresh-success': e.target.checked
                      }
                    }
                  })}
                  className="mb-1"
                />
                <Form.Check
                  type="checkbox"
                  label="Backup Success"
                  checked={settings.alerts.dismissAlertTypes['backup-success']}
                  onChange={(e) => setSettings({
                    ...settings,
                    alerts: {
                      ...settings.alerts,
                      dismissAlertTypes: {
                        ...settings.alerts.dismissAlertTypes,
                        'backup-success': e.target.checked
                      }
                    }
                  })}
                  className="mb-1"
                />
                <Form.Check
                  type="checkbox"
                  label="Connection Restored"
                  checked={settings.alerts.dismissAlertTypes['connection-restored']}
                  onChange={(e) => setSettings({
                    ...settings,
                    alerts: {
                      ...settings.alerts,
                      dismissAlertTypes: {
                        ...settings.alerts.dismissAlertTypes,
                        'connection-restored': e.target.checked
                      }
                    }
                  })}
                  className="mb-1"
                />
              </div>

              <div className="mb-3">
                <Form.Label className="fw-bold">Always Show (Never Auto-dismiss):</Form.Label>
                <Form.Check
                  type="checkbox"
                  label="Critical Error"
                  checked={settings.alerts.persistentAlerts.includes('critical-error')}
                  onChange={(e) => {
                    const persistentAlerts = [...settings.alerts.persistentAlerts];
                    if (e.target.checked) {
                      persistentAlerts.push('critical-error');
                    } else {
                      const index = persistentAlerts.indexOf('critical-error');
                      if (index > -1) persistentAlerts.splice(index, 1);
                    }
                    setSettings({
                      ...settings,
                      alerts: { ...settings.alerts, persistentAlerts }
                    });
                  }}
                  className="mb-1"
                />
                <Form.Check
                  type="checkbox"
                  label="Security Warning"
                  checked={settings.alerts.persistentAlerts.includes('security-warning')}
                  onChange={(e) => {
                    const persistentAlerts = [...settings.alerts.persistentAlerts];
                    if (e.target.checked) {
                      persistentAlerts.push('security-warning');
                    } else {
                      const index = persistentAlerts.indexOf('security-warning');
                      if (index > -1) persistentAlerts.splice(index, 1);
                    }
                    setSettings({
                      ...settings,
                      alerts: { ...settings.alerts, persistentAlerts }
                    });
                  }}
                  className="mb-1"
                />
                <Form.Check
                  type="checkbox"
                  label="Backup Failed"
                  checked={settings.alerts.persistentAlerts.includes('backup-failed')}
                  onChange={(e) => {
                    const persistentAlerts = [...settings.alerts.persistentAlerts];
                    if (e.target.checked) {
                      persistentAlerts.push('backup-failed');
                    } else {
                      const index = persistentAlerts.indexOf('backup-failed');
                      if (index > -1) persistentAlerts.splice(index, 1);
                    }
                    setSettings({
                      ...settings,
                      alerts: { ...settings.alerts, persistentAlerts }
                    });
                  }}
                  className="mb-1"
                />
              </div>

              <div className="mb-3">
                <Form.Label className="fw-bold">Display Options:</Form.Label>
                <Form.Check
                  type="checkbox"
                  label="Show countdown timer"
                  checked={settings.alerts.notificationSettings.showCountdown}
                  onChange={(e) => setSettings({
                    ...settings,
                    alerts: {
                      ...settings.alerts,
                      notificationSettings: {
                        ...settings.alerts.notificationSettings,
                        showCountdown: e.target.checked
                      }
                    }
                  })}
                  className="mb-1"
                />
                <Form.Check
                  type="checkbox"
                  label="Show retry count for persistent issues"
                  checked={settings.alerts.notificationSettings.showRetryCount}
                  onChange={(e) => setSettings({
                    ...settings,
                    alerts: {
                      ...settings.alerts,
                      notificationSettings: {
                        ...settings.alerts.notificationSettings,
                        showRetryCount: e.target.checked
                      }
                    }
                  })}
                  className="mb-1"
                />
                <Form.Check
                  type="checkbox"
                  label="Enable alert sounds"
                  checked={settings.alerts.notificationSettings.enableSound}
                  onChange={(e) => setSettings({
                    ...settings,
                    alerts: {
                      ...settings.alerts,
                      notificationSettings: {
                        ...settings.alerts.notificationSettings,
                        enableSound: e.target.checked
                      }
                    }
                  })}
                />
              </div>

              <Alert variant="info" className="mt-3 mb-0">
                <i className="bi bi-info-circle me-2"></i>
                <small>
                  <strong>Alert Management:</strong> Automatically dismisses temporary notifications like data refresh status, 
                  connection confirmations, and successful operations after the specified time. Critical alerts and persistent 
                  issues can be configured to remain visible or reappear if the problem continues.
                </small>
              </Alert>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Export Modal */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Export Backup Settings</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>This will download a JSON file containing all your backup configuration settings.</p>
          <Alert variant="info">
            <i className="bi bi-info-circle me-2"></i>
            The exported file can be imported later to restore these settings or shared with other instances.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExportModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleExportSettings}>
            <i className="bi bi-download me-2"></i>
            Export Settings
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Import Modal */}
      <Modal show={showImportModal} onHide={() => setShowImportModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Import Backup Settings</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Select a backup settings file to import:</p>
          <Form.Group className="mb-3">
            <Form.Control
              type="file"
              accept=".json"
              onChange={(e) => setImportFile(e.target.files[0])}
            />
          </Form.Group>
          <Alert variant="warning">
            <i className="bi bi-exclamation-triangle me-2"></i>
            This will overwrite your current backup settings. Make sure to export your current settings first if you want to keep them.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowImportModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleImportSettings}
            disabled={!importFile}
          >
            <i className="bi bi-upload me-2"></i>
            Import Settings
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default BackupSettings;
