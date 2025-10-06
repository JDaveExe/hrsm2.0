import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import auditNotificationService from '../services/auditNotificationService';
import './CriticalAlertBanner.css';

/**
 * Critical Alert Banner Component
 * Displays critical audit notifications at the top of all pages
 * - Polls every 10 seconds for new critical alerts
 * - Only visible to admin and management users
 * - Dismissible with tracking
 */
const CriticalAlertBanner = () => {
  const { user, isAuthenticated } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user has permission to view alerts
  const canViewAlerts = isAuthenticated && user && ['admin', 'management'].includes(user.role);

  /**
   * Fetch critical notifications from the API
   */
  const fetchCriticalAlerts = useCallback(async () => {
    if (!canViewAlerts) return;

    try {
      setIsLoading(true);
      const response = await auditNotificationService.getCriticalNotifications();
      
      if (response.success && response.data) {
        setAlerts(response.data);
        
        // If we have new alerts, make sure banner is visible
        if (response.data.length > 0) {
          setIsVisible(true);
        }
      }
    } catch (error) {
      // Silently fail - don't spam console with errors
      if (error.response && error.response.status !== 401) {
        console.error('Error fetching critical alerts:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [canViewAlerts]);

  /**
   * Dismiss a specific alert
   */
  const handleDismiss = async (alertId) => {
    try {
      await auditNotificationService.dismissNotification(alertId);
      
      // Remove from local state
      setAlerts(alerts.filter(a => a.id !== alertId));
      
      // If no more alerts, hide banner
      if (alerts.length === 1) {
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Error dismissing alert:', error);
      // Still remove from UI even if API call fails
      setAlerts(alerts.filter(a => a.id !== alertId));
    }
  };

  /**
   * Dismiss all alerts at once
   */
  const handleDismissAll = async () => {
    try {
      await auditNotificationService.dismissAll();
      setAlerts([]);
      setIsVisible(false);
    } catch (error) {
      console.error('Error dismissing all alerts:', error);
      // Still clear UI even if API call fails
      setAlerts([]);
      setIsVisible(false);
    }
  };

  /**
   * Get severity icon based on alert type
   */
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '📋';
      default:
        return 'ℹ️';
    }
  };

  /**
   * Get CSS class based on severity
   */
  const getSeverityClass = (severity) => {
    return `alert-banner-${severity}`;
  };

  // Initial fetch on mount
  useEffect(() => {
    if (canViewAlerts) {
      fetchCriticalAlerts();
    }
  }, [canViewAlerts, fetchCriticalAlerts]);

  // Set up polling interval (10 seconds)
  useEffect(() => {
    if (!canViewAlerts) return;

    const interval = setInterval(() => {
      fetchCriticalAlerts();
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [canViewAlerts, fetchCriticalAlerts]);

  // Don't render if user doesn't have permission
  if (!canViewAlerts) return null;

  // Don't render if no alerts or banner is hidden
  if (!isVisible || alerts.length === 0) return null;

  return (
    <div className="critical-alert-banner-container">
      <div className="critical-alert-banner">
        <div className="alert-banner-content">
          {alerts.map((alert, index) => (
            <div 
              key={alert.id} 
              className={`alert-banner-item ${getSeverityClass(alert.severity)}`}
            >
              <div className="alert-banner-icon">
                {getSeverityIcon(alert.severity)}
              </div>
              <div className="alert-banner-message">
                <div className="alert-banner-title">
                  {alert.title}
                </div>
                <div className="alert-banner-description">
                  {alert.message}
                </div>
                <div className="alert-banner-meta">
                  <span className="alert-performer">
                    {alert.performedBy} ({alert.performedByRole})
                  </span>
                  <span className="alert-time">
                    {new Date(alert.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => handleDismiss(alert.id)}
                className="alert-banner-dismiss-btn"
                title="Dismiss this alert"
                disabled={isLoading}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        
        {/* Dismiss All button - only show if multiple alerts */}
        {alerts.length > 1 && (
          <div className="alert-banner-footer">
            <button 
              onClick={handleDismissAll}
              className="alert-banner-dismiss-all-btn"
              disabled={isLoading}
            >
              Dismiss All ({alerts.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CriticalAlertBanner;
