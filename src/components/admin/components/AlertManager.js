import React, { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-bootstrap';

const AlertManager = () => {
  const [alerts, setAlerts] = useState([]);
  const [settings, setSettings] = useState({
    autoDismissEnabled: true,
    autoDismissTime: 10, // minutes
    persistentAlerts: ['critical'], // alert types that persist
    retryOnPersistence: true
  });

  // Load settings from localStorage
  useEffect(() => {
    const savedBackupSettings = localStorage.getItem('backupSettings');
    if (savedBackupSettings) {
      try {
        const backupSettings = JSON.parse(savedBackupSettings);
        if (backupSettings.alerts) {
          setSettings(prev => ({ ...prev, ...backupSettings.alerts }));
        }
      } catch (error) {
        console.error('Error loading alert settings from backup settings:', error);
      }
    }
    
    // Fallback to direct alert settings
    const savedAlertSettings = localStorage.getItem('alertSettings');
    if (savedAlertSettings) {
      try {
        const alertSettings = JSON.parse(savedAlertSettings);
        setSettings(prev => ({ ...prev, ...alertSettings }));
      } catch (error) {
        console.error('Error loading direct alert settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('alertSettings', JSON.stringify(newSettings));
  }, []);

  // Dismiss an alert
  const dismissAlert = useCallback((alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  // Add a new alert
  const addAlert = useCallback((alert) => {
    const alertId = Date.now() + Math.random();
    const newAlert = {
      id: alertId,
      ...alert,
      timestamp: new Date(),
      dismissCount: 0,
      lastShown: new Date()
    };

    setAlerts(prev => [...prev, newAlert]);

    // Auto dismiss if enabled and not a persistent alert type
    if (settings.autoDismissEnabled && !settings.persistentAlerts.includes(alert.type)) {
      setTimeout(() => {
        dismissAlert(alertId);
      }, settings.autoDismissTime * 60 * 1000);
    }

    return alertId;
  }, [settings, dismissAlert]);

  // Check if alert should reappear (for persistent issues)
  const checkAlertPersistence = useCallback(async (alert) => {
    if (!settings.retryOnPersistence) return;

    try {
      let shouldReappear = false;

      // Check different alert types for persistence
      switch (alert.type) {
        case 'connection-error':
          // Try to ping the backend
          try {
            const response = await fetch('/api/health-check', { 
              method: 'GET',
              timeout: 5000 
            });
            shouldReappear = !response.ok;
          } catch {
            shouldReappear = true;
          }
          break;

        case 'data-refresh-failed':
          // Check if data is still stale
          const lastDataUpdate = localStorage.getItem('lastDataUpdate');
          const isDataStale = lastDataUpdate && 
            (new Date() - new Date(lastDataUpdate)) > (15 * 60 * 1000); // 15 minutes
          shouldReappear = isDataStale;
          break;

        case 'backup-failed':
          // Check if backup is still failing
          const lastBackupStatus = localStorage.getItem('lastBackupStatus');
          shouldReappear = lastBackupStatus === 'failed';
          break;

        default:
          shouldReappear = false;
      }

      if (shouldReappear) {
        // Reshow the alert with updated dismiss count
        const updatedAlert = {
          ...alert,
          dismissCount: alert.dismissCount + 1,
          lastShown: new Date(),
          message: alert.originalMessage || alert.message
        };

        // Add retry indicator to message
        if (updatedAlert.dismissCount > 0) {
          updatedAlert.message += ` (Issue persists - Alert #${updatedAlert.dismissCount + 1})`;
        }

        addAlert(updatedAlert);
      }
    } catch (error) {
      console.error('Error checking alert persistence:', error);
    }
  }, [settings.retryOnPersistence, addAlert]);

  // Enhanced dismiss with persistence check
  const dismissAlertWithCheck = useCallback((alertId) => {
    const alert = alerts.find(a => a.id === alertId);
    if (alert && settings.retryOnPersistence && 
        ['connection-error', 'data-refresh-failed', 'backup-failed'].includes(alert.type)) {
      
      // Schedule persistence check after dismiss
      setTimeout(() => {
        checkAlertPersistence(alert);
      }, settings.autoDismissTime * 60 * 1000);
    }
    
    dismissAlert(alertId);
  }, [alerts, settings, checkAlertPersistence, dismissAlert]);

  // Clear all alerts
  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Get alert settings
  const getSettings = useCallback(() => settings, [settings]);

  // Render alerts
  const renderAlerts = () => {
    return alerts.map(alert => (
      <Alert 
        key={alert.id}
        variant={alert.variant || 'info'}
        dismissible={alert.dismissible !== false}
        onClose={() => dismissAlertWithCheck(alert.id)}
        className={`alert-manager-alert ${alert.className || ''}`}
        style={{
          position: alert.position === 'fixed' ? 'fixed' : 'relative',
          top: alert.position === 'fixed' ? '20px' : 'auto',
          right: alert.position === 'fixed' ? '20px' : 'auto',
          zIndex: alert.position === 'fixed' ? 9999 : 'auto',
          minWidth: alert.position === 'fixed' ? '300px' : 'auto',
          paddingBottom: settings.notificationSettings?.showTimer && 
                         settings.autoDismissEnabled && 
                         !settings.persistentAlerts.includes(alert.type) ? '25px' : 'auto',
          ...alert.style
        }}
      >
        {alert.dismissCount > 0 && (
          <div className="alert-retry-indicator" style={{
            fontSize: '0.8em',
            opacity: 0.7,
            marginBottom: '5px'
          }}>
            <i className="bi bi-arrow-clockwise me-1"></i>
            Recurring issue detected
          </div>
        )}
        
        <div className="d-flex justify-content-between align-items-center">
          <div>
            {alert.icon && <i className={`${alert.icon} me-2`}></i>}
            <span>{alert.message}</span>
          </div>
          
          {alert.action && (
            <button 
              className={`btn btn-sm ${alert.actionVariant || 'btn-outline-primary'}`}
              onClick={alert.action.onClick}
            >
              {alert.action.icon && <i className={`${alert.action.icon} me-1`}></i>}
              {alert.action.text}
            </button>
          )}
        </div>

        {alert.details && (
          <div className="alert-details mt-2" style={{ fontSize: '0.9em', opacity: 0.8 }}>
            {alert.details}
          </div>
        )}

        {settings.autoDismissEnabled && 
         !settings.persistentAlerts.includes(alert.type) && 
         settings.notificationSettings?.showTimer && (
          <div className="alert-timer mt-1" style={{ 
            fontSize: '0.7em', 
            opacity: 0.5, 
            textAlign: 'right',
            position: 'absolute',
            bottom: '5px',
            right: '10px'
          }}>
            <i className="bi bi-clock me-1"></i>
            {settings.autoDismissTime}m
          </div>
        )}
      </Alert>
    ));
  };

  return {
    alerts,
    addAlert,
    dismissAlert: dismissAlertWithCheck,
    clearAllAlerts,
    renderAlerts,
    settings: getSettings(),
    updateSettings: saveSettings
  };
};

// Hook for using AlertManager
export const useAlertManager = () => {
  const alertManager = AlertManager();
  return alertManager;
};

// HOC for wrapping components with alert management
export const withAlertManager = (WrappedComponent) => {
  return (props) => {
    const alertManager = useAlertManager();
    return <WrappedComponent {...props} alertManager={alertManager} />;
  };
};

export default AlertManager;
