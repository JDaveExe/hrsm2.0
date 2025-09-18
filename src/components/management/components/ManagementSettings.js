import React, { useState } from 'react';
import { Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import '../styles/ManagementSettings.css';

const ManagementSettings = ({ currentDateTime, isDarkMode }) => {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      browser: true,
      lowStock: true,
      reportGeneration: false
    },
    inventory: {
      autoReorder: false,
      lowStockThreshold: 10,
      criticalStockThreshold: 5
    },
    reports: {
      autoGenerate: false,
      scheduleFrequency: 'weekly',
      retentionDays: 30
    },
    general: {
      theme: 'light',
      language: 'en',
      timezone: 'UTC+8'
    }
  });

  const [showSaveAlert, setShowSaveAlert] = useState(false);

  const handleSettingChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  const handleSaveSettings = () => {
    // Simulate saving settings
    setShowSaveAlert(true);
    setTimeout(() => setShowSaveAlert(false), 3000);
  };

  return (
    <div className="management-settings">
      <Row>
        <Col md={12}>
          <h3 className="settings-title">Management Settings</h3>
          <p className="section-description">Configure your management dashboard preferences and system settings</p>
        </Col>
      </Row>

      {showSaveAlert && (
        <Alert variant="success" className="mb-4">
          <i className="bi bi-check-circle me-2"></i>
          Settings saved successfully!
        </Alert>
      )}

      <Row>
        <Col lg={6}>
          <div className="settings-section">
            <h4 className="settings-section-title">
              <i className="bi bi-bell me-2"></i>Notification Settings
            </h4>
            <div className="settings-card">
              <Form>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="switch"
                    id="email-notifications"
                    label="Email Notifications"
                    checked={settings.notifications.email}
                    onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
                  />
                  <small className="text-muted">Receive notifications via email</small>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="switch"
                    id="browser-notifications"
                    label="Browser Notifications"
                    checked={settings.notifications.browser}
                    onChange={(e) => handleSettingChange('notifications', 'browser', e.target.checked)}
                  />
                  <small className="text-muted">Show notifications in browser</small>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="switch"
                    id="low-stock-alerts"
                    label="Low Stock Alerts"
                    checked={settings.notifications.lowStock}
                    onChange={(e) => handleSettingChange('notifications', 'lowStock', e.target.checked)}
                  />
                  <small className="text-muted">Alert when inventory is running low</small>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="switch"
                    id="report-generation-alerts"
                    label="Report Generation Alerts"
                    checked={settings.notifications.reportGeneration}
                    onChange={(e) => handleSettingChange('notifications', 'reportGeneration', e.target.checked)}
                  />
                  <small className="text-muted">Notify when reports are ready</small>
                </Form.Group>
              </Form>
            </div>
          </div>

          <div className="settings-section">
            <h4 className="settings-section-title">
              <i className="bi bi-gear me-2"></i>General Settings
            </h4>
            <div className="settings-card">
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Theme</Form.Label>
                  <Form.Select 
                    value={settings.general.theme}
                    onChange={(e) => handleSettingChange('general', 'theme', e.target.value)}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Language</Form.Label>
                  <Form.Select 
                    value={settings.general.language}
                    onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="fil">Filipino</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Timezone</Form.Label>
                  <Form.Select 
                    value={settings.general.timezone}
                    onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                  >
                    <option value="UTC+8">UTC+8 (Manila)</option>
                    <option value="UTC">UTC</option>
                  </Form.Select>
                </Form.Group>
              </Form>
            </div>
          </div>
        </Col>

        <Col lg={6}>
          <div className="settings-section">
            <h4 className="settings-section-title">
              <i className="bi bi-box-seam me-2"></i>Inventory Settings
            </h4>
            <div className="settings-card">
              <Form>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="switch"
                    id="auto-reorder"
                    label="Auto-Reorder System"
                    checked={settings.inventory.autoReorder}
                    onChange={(e) => handleSettingChange('inventory', 'autoReorder', e.target.checked)}
                  />
                  <small className="text-muted">Automatically reorder when stock is low</small>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Low Stock Threshold</Form.Label>
                  <Form.Control
                    type="number"
                    value={settings.inventory.lowStockThreshold}
                    onChange={(e) => handleSettingChange('inventory', 'lowStockThreshold', parseInt(e.target.value))}
                  />
                  <small className="text-muted">Alert when stock falls below this number</small>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Critical Stock Threshold</Form.Label>
                  <Form.Control
                    type="number"
                    value={settings.inventory.criticalStockThreshold}
                    onChange={(e) => handleSettingChange('inventory', 'criticalStockThreshold', parseInt(e.target.value))}
                  />
                  <small className="text-muted">Critical alert threshold</small>
                </Form.Group>
              </Form>
            </div>
          </div>

          <div className="settings-section">
            <h4 className="settings-section-title">
              <i className="bi bi-file-earmark me-2"></i>Reports Settings
            </h4>
            <div className="settings-card">
              <Form>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="switch"
                    id="auto-generate-reports"
                    label="Auto-Generate Reports"
                    checked={settings.reports.autoGenerate}
                    onChange={(e) => handleSettingChange('reports', 'autoGenerate', e.target.checked)}
                  />
                  <small className="text-muted">Automatically generate scheduled reports</small>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Schedule Frequency</Form.Label>
                  <Form.Select 
                    value={settings.reports.scheduleFrequency}
                    onChange={(e) => handleSettingChange('reports', 'scheduleFrequency', e.target.value)}
                    disabled={!settings.reports.autoGenerate}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Report Retention (Days)</Form.Label>
                  <Form.Control
                    type="number"
                    value={settings.reports.retentionDays}
                    onChange={(e) => handleSettingChange('reports', 'retentionDays', parseInt(e.target.value))}
                  />
                  <small className="text-muted">Automatically delete reports after this many days</small>
                </Form.Group>
              </Form>
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          <div className="settings-section">
            <h4 className="settings-section-title">
              <i className="bi bi-shield-check me-2"></i>System Information
            </h4>
            <div className="settings-card">
              <Row>
                <Col md={3}>
                  <div className="system-info-item">
                    <strong>System Version</strong>
                    <p>HRSM v2.0.1</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="system-info-item">
                    <strong>Last Update</strong>
                    <p>{currentDateTime?.toLocaleDateString()}</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="system-info-item">
                    <strong>Database Status</strong>
                    <p><span className="badge bg-success">Connected</span></p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="system-info-item">
                    <strong>Storage Used</strong>
                    <p>247 MB / 1 GB</p>
                  </div>
                </Col>
              </Row>
            </div>
          </div>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={12} className="text-center">
          <Button variant="primary" size="lg" onClick={handleSaveSettings} className="settings-btn">
            <i className="bi bi-check-circle me-2"></i>
            Save All Settings
          </Button>
          <Button variant="outline-secondary" size="lg" className="ms-3 settings-btn">
            <i className="bi bi-arrow-clockwise me-2"></i>
            Reset to Defaults
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default ManagementSettings;
