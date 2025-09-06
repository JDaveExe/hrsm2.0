import React, { useState, useCallback, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import './SimulationMode.css';

const SimulationMode = ({ 
  show, 
  onHide, 
  simulationMode, 
  onSimulationToggle,
  onSimulationUpdate 
}) => {
  const [localSettings, setLocalSettings] = useState({
    enabled: false,
    simulatedDateTime: new Date().toISOString().slice(0, 16),
    mockSmsService: true,
    mockEmailService: true,
    autoGenerateTestData: false,
    chartSimulation: false
  });

  // Update local settings when simulation mode changes
  useEffect(() => {
    if (simulationMode) {
      setLocalSettings({
        enabled: simulationMode.enabled || false,
        simulatedDateTime: simulationMode.currentSimulatedDate 
          ? new Date(simulationMode.currentSimulatedDate).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16),
        mockSmsService: simulationMode.smsSimulation !== undefined ? simulationMode.smsSimulation : true,
        mockEmailService: simulationMode.emailSimulation !== undefined ? simulationMode.emailSimulation : true,
        autoGenerateTestData: simulationMode.dataSimulation || false,
        chartSimulation: simulationMode.chartSimulation || false
      });
    }
  }, [simulationMode]);

  const handleToggleSimulation = useCallback(() => {
    const newSettings = {
      ...localSettings,
      enabled: !localSettings.enabled
    };
    setLocalSettings(newSettings);
    
    // Immediately apply the toggle
    onSimulationUpdate(newSettings);
  }, [localSettings, onSimulationUpdate]);

  const handleSettingChange = useCallback((setting, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  }, []);

  const handleApplySettings = useCallback(() => {
    onSimulationUpdate(localSettings);
    onHide();
  }, [localSettings, onSimulationUpdate, onHide]);

  const handleReset = useCallback(() => {
    const resetSettings = {
      enabled: false,
      simulatedDateTime: new Date().toISOString().slice(0, 16),
      mockSmsService: true,
      mockEmailService: true,
      autoGenerateTestData: false,
      chartSimulation: false
    };
    setLocalSettings(resetSettings);
  }, []);

  const currentDateTime = new Date(localSettings.simulatedDateTime);

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      size="lg"
      centered
      className="simulation-mode-modal"
    >
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="d-flex align-items-center">
          <i className="bi bi-clock-history me-2 text-pale-cerulean"></i>
          Simulation System
          {localSettings.enabled && (
            <span className="badge bg-success ms-3 px-3 py-1">
              <i className="bi bi-lightning-charge me-1"></i>
              ACTIVE
            </span>
          )}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="pt-2">
        {/* Warning Banner */}
        <Alert variant="warning" className="d-flex align-items-center mb-4">
          <i className="bi bi-exclamation-triangle me-2"></i>
          <div>
            <strong>Development & Testing Feature</strong>
            <div className="small">Jump to specific dates and times to test time-sensitive features and system behavior.</div>
          </div>
        </Alert>

        {!localSettings.enabled ? (
          <div className="simulation-disabled-state">
            <i className="bi bi-play-circle text-pale-cerulean" style={{fontSize: '3rem'}}></i>
            <h5 className="mt-3 mb-2">Simulation Mode Disabled</h5>
            <p className="text-muted">Enable simulation mode to access time and service controls</p>
            <Button
              variant="outline-pale-cerulean"
              size="lg"
              onClick={handleToggleSimulation}
              className="mt-2"
            >
              <i className="bi bi-play-circle me-2"></i>
              Start Simulation
            </Button>
          </div>
        ) : (
          <>
            {/* Simulated Date & Time */}
            <div className="form-section mb-4">
              <Form.Label className="section-label">
                <i className="bi bi-calendar3 me-2"></i>
                Simulated Date & Time
              </Form.Label>
              <Form.Control
                type="datetime-local"
                value={localSettings.simulatedDateTime}
                onChange={(e) => handleSettingChange('simulatedDateTime', e.target.value)}
                className="mb-2"
              />
              <div className="text-muted small">
                Current: {currentDateTime.toLocaleDateString()} {currentDateTime.toLocaleTimeString()}
              </div>
            </div>

            {/* Service Options */}
            <div className="form-section">
              <Form.Label className="section-label">
                <i className="bi bi-list-check me-2"></i>
                Service Options
              </Form.Label>
              
              <div className="service-options">
                <div className="service-option">
                  <Form.Check
                    type="checkbox"
                    id="mockSmsService"
                    checked={localSettings.mockSmsService}
                    onChange={(e) => handleSettingChange('mockSmsService', e.target.checked)}
                    label={
                      <span>
                        <i className="bi bi-chat-text me-2"></i>
                        Mock SMS Service
                      </span>
                    }
                    className="service-checkbox"
                  />
                </div>

                <div className="service-option">
                  <Form.Check
                    type="checkbox"
                    id="mockEmailService"
                    checked={localSettings.mockEmailService}
                    onChange={(e) => handleSettingChange('mockEmailService', e.target.checked)}
                    label={
                      <span>
                        <i className="bi bi-envelope me-2"></i>
                        Mock Email Service
                      </span>
                    }
                    className="service-checkbox"
                  />
                </div>

                <div className="service-option">
                  <Form.Check
                    type="checkbox"
                    id="autoGenerateTestData"
                    checked={localSettings.autoGenerateTestData}
                    onChange={(e) => handleSettingChange('autoGenerateTestData', e.target.checked)}
                    label={
                      <span>
                        <i className="bi bi-database me-2"></i>
                        Auto-Generate Test Data
                      </span>
                    }
                    className="service-checkbox"
                  />
                </div>

                <div className="service-option">
                  <Form.Check
                    type="checkbox"
                    id="chartSimulation"
                    checked={localSettings.chartSimulation}
                    onChange={(e) => handleSettingChange('chartSimulation', e.target.checked)}
                    label={
                      <span>
                        <i className="bi bi-bar-chart me-2"></i>
                        Chart Simulation
                      </span>
                    }
                    className="service-checkbox"
                  />
                  <div className="option-description">
                    Generate simulated chart data for testing dashboard analytics
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0 pt-2">
        <Button 
          variant="success"
          onClick={handleApplySettings}
          className="me-2"
        >
          <i className="bi bi-check-circle me-2"></i>
          Apply Settings
        </Button>
        {localSettings.enabled && (
          <Button 
            variant="danger"
            onClick={handleToggleSimulation}
            className="me-2"
          >
            <i className="bi bi-stop-circle me-2"></i>
            Stop Simulation
          </Button>
        )}
        <Button 
          variant="outline-secondary"
          onClick={onHide}
        >
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SimulationMode;
