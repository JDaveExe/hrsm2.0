// Alert utilities for common alert patterns
import { useAlertManager } from './AlertManager';

export const useCommonAlerts = () => {
  const alertManager = useAlertManager();

  const showDataRefreshAlert = () => {
    return alertManager.addAlert({
      type: 'data-refresh',
      variant: 'info',
      message: 'Refreshing data from database...',
      icon: 'bi bi-arrow-clockwise',
      dismissible: false,
      position: 'relative'
    });
  };

  const showDataRefreshError = (retryFn) => {
    return alertManager.addAlert({
      type: 'data-refresh-failed',
      variant: 'warning',
      message: 'Unable to fetch latest data from database. Showing cached data.',
      originalMessage: 'Unable to fetch latest data from database. Showing cached data.',
      icon: 'bi bi-exclamation-triangle',
      dismissible: true,
      action: {
        text: 'Retry',
        icon: 'bi bi-arrow-clockwise',
        onClick: retryFn
      },
      details: 'This alert will reappear if the connection issue persists.',
      position: 'relative'
    });
  };

  const showDataRefreshSuccess = (refreshFn) => {
    return alertManager.addAlert({
      type: 'data-refresh-success',
      variant: 'success',
      message: `Real-time data connected • Last updated: ${new Date().toLocaleTimeString()}`,
      icon: 'bi bi-check-circle',
      dismissible: true,
      // Remove the action button since there's already a refresh button in the UI
      position: 'relative'
    });
  };

  const showBackupSuccess = (backupInfo) => {
    return alertManager.addAlert({
      type: 'backup-success',
      variant: 'success',
      message: `Backup created successfully!`,
      icon: 'bi bi-check-circle',
      dismissible: true,
      details: `${backupInfo?.totalPatients || 0} patients, ${backupInfo?.totalFamilies || 0} families`,
      position: 'fixed'
    });
  };

  const showBackupError = (error, retryFn) => {
    return alertManager.addAlert({
      type: 'backup-failed',
      variant: 'danger',
      message: 'Backup creation failed',
      originalMessage: 'Backup creation failed',
      icon: 'bi bi-exclamation-triangle-fill',
      dismissible: true,
      action: retryFn ? {
        text: 'Retry Backup',
        icon: 'bi bi-arrow-clockwise',
        onClick: retryFn
      } : undefined,
      details: error?.message || 'Unknown error occurred during backup',
      position: 'fixed'
    });
  };

  const showConnectionError = (service, retryFn) => {
    return alertManager.addAlert({
      type: 'connection-error',
      variant: 'danger',
      message: `Connection to ${service} lost`,
      originalMessage: `Connection to ${service} lost`,
      icon: 'bi bi-wifi-off',
      dismissible: true,
      action: retryFn ? {
        text: 'Reconnect',
        icon: 'bi bi-arrow-clockwise',
        onClick: retryFn
      } : undefined,
      details: 'Attempting automatic reconnection...',
      position: 'fixed'
    });
  };

  const showConnectionRestored = (service) => {
    return alertManager.addAlert({
      type: 'connection-restored',
      variant: 'success',
      message: `Connection to ${service} restored`,
      icon: 'bi bi-wifi',
      dismissible: true,
      position: 'fixed'
    });
  };

  const showCriticalError = (message, details) => {
    return alertManager.addAlert({
      type: 'critical-error',
      variant: 'danger',
      message: message,
      icon: 'bi bi-exclamation-octagon-fill',
      dismissible: true,
      details: details,
      position: 'fixed'
    });
  };

  const showSecurityWarning = (message, details) => {
    return alertManager.addAlert({
      type: 'security-warning',
      variant: 'warning',
      message: message,
      icon: 'bi bi-shield-exclamation',
      dismissible: true,
      details: details,
      position: 'fixed'
    });
  };

  const showOperationSuccess = (operation, details) => {
    return alertManager.addAlert({
      type: 'operation-success',
      variant: 'success',
      message: `${operation} completed successfully`,
      icon: 'bi bi-check-circle',
      dismissible: true,
      details: details,
      position: 'relative'
    });
  };

  return {
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
    ...alertManager
  };
};

export default useCommonAlerts;
