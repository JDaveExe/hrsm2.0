import api from './api';

/**
 * Service for managing audit notifications
 */
const auditNotificationService = {
  /**
   * Get all active notifications
   * @param {Object} options - Query options
   * @param {string} options.severity - Filter by severity (critical, high, medium)
   * @param {boolean} options.includeRead - Include read notifications
   * @returns {Promise} API response with notifications
   */
  getActiveNotifications: async (options = {}) => {
    try {
      const params = new URLSearchParams();
      if (options.severity) params.append('severity', options.severity);
      if (options.includeRead !== undefined) params.append('includeRead', options.includeRead);
      
      const response = await api.get(`/audit-notifications?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching active notifications:', error);
      throw error;
    }
  },

  /**
   * Get only critical notifications (for banner display)
   * @returns {Promise} API response with critical notifications
   */
  getCriticalNotifications: async () => {
    try {
      const response = await api.get('/audit-notifications/critical');
      return response.data;
    } catch (error) {
      console.error('Error fetching critical notifications:', error);
      throw error;
    }
  },

  /**
   * Mark a notification as read
   * @param {number} notificationId - The notification ID
   * @returns {Promise} API response
   */
  markAsRead: async (notificationId) => {
    try {
      const response = await api.put(`/audit-notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  /**
   * Dismiss a notification
   * @param {number} notificationId - The notification ID
   * @returns {Promise} API response
   */
  dismissNotification: async (notificationId) => {
    try {
      const response = await api.put(`/audit-notifications/${notificationId}/dismiss`);
      return response.data;
    } catch (error) {
      console.error('Error dismissing notification:', error);
      throw error;
    }
  },

  /**
   * Dismiss all notifications
   * @returns {Promise} API response
   */
  dismissAll: async () => {
    try {
      const response = await api.put('/audit-notifications/dismiss-all');
      return response.data;
    } catch (error) {
      console.error('Error dismissing all notifications:', error);
      throw error;
    }
  },

  /**
   * Cleanup expired notifications (admin only)
   * @returns {Promise} API response
   */
  cleanupExpired: async () => {
    try {
      const response = await api.post('/audit-notifications/cleanup');
      return response.data;
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
      throw error;
    }
  }
};

export default auditNotificationService;
