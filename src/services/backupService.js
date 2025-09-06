import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Configure axios with authentication
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes timeout for backup operations
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  let token = localStorage.getItem('token');
  
  // If no token or token is invalid, use temp token for development
  if (!token || token === 'null' || token === 'undefined') {
    token = 'temp-admin-token';
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

class BackupService {
  // Get backup status and statistics
  async getBackupStatus() {
    try {
      const response = await api.get('/backup/status');
      return response.data;
    } catch (error) {
      console.error('Error getting backup status:', error);
      throw error;
    }
  }

  // Create a manual backup
  async createBackup(options = {}) {
    try {
      const backupOptions = {
        includeDatabase: options.includeDatabase ?? true,
        includeFiles: options.includeFiles ?? true,
        includeImages: options.includeImages ?? true,
        compressionLevel: options.compressionLevel ?? 6,
        description: options.description || `Manual backup - ${new Date().toLocaleString()}`
      };

      const response = await api.post('/backup/create', backupOptions);
      return response.data;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  // Get list of available backups
  async getBackupList() {
    try {
      const response = await api.get('/backup/list');
      return response.data;
    } catch (error) {
      console.error('Error getting backup list:', error);
      throw error;
    }
  }

  // Download a backup file
  async downloadBackup(backupId) {
    try {
      const response = await api.get(`/backup/download/${backupId}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers
      const contentDisposition = response.headers['content-disposition'];
      let fileName = 'backup.zip';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          fileName = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true, fileName };
    } catch (error) {
      console.error('Error downloading backup:', error);
      throw error;
    }
  }

  // Delete a backup
  async deleteBackup(backupId) {
    try {
      const response = await api.delete(`/backup/${backupId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting backup:', error);
      throw error;
    }
  }

  // Restore from backup
  async restoreFromBackup(backupId, options = {}) {
    try {
      const restoreOptions = {
        restoreDatabase: options.restoreDatabase ?? true,
        restoreFiles: options.restoreFiles ?? true,
        restoreImages: options.restoreImages ?? true,
        overwriteExisting: options.overwriteExisting ?? false
      };

      const response = await api.post(`/backup/restore/${backupId}`, restoreOptions);
      return response.data;
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw error;
    }
  }

  // Get backup progress
  async getBackupProgress(jobId) {
    try {
      const response = await api.get(`/backup/progress/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting backup progress:', error);
      throw error;
    }
  }

  // Get storage statistics
  async getStorageStats() {
    try {
      const response = await api.get('/backup/storage-stats');
      return response.data;
    } catch (error) {
      console.error('Error getting storage stats:', error);
      throw error;
    }
  }

  // Schedule backup
  async scheduleBackup(schedule) {
    try {
      const response = await api.post('/backup/schedule', schedule);
      return response.data;
    } catch (error) {
      console.error('Error scheduling backup:', error);
      throw error;
    }
  }

  // Get all backup schedules
  async getBackupSchedules() {
    try {
      const response = await api.get('/backup/schedules');
      return response.data;
    } catch (error) {
      console.error('Error getting backup schedules:', error);
      throw error;
    }
  }

  // Create backup schedule
  async createBackupSchedule(schedule) {
    try {
      const response = await api.post('/backup/schedules', schedule);
      return response.data;
    } catch (error) {
      console.error('Error creating backup schedule:', error);
      throw error;
    }
  }

  // Update backup schedule
  async updateBackupSchedule(scheduleId, schedule) {
    try {
      const response = await api.put(`/backup/schedules/${scheduleId}`, schedule);
      return response.data;
    } catch (error) {
      console.error('Error updating backup schedule:', error);
      throw error;
    }
  }

  // Delete backup schedule
  async deleteBackupSchedule(scheduleId) {
    try {
      const response = await api.delete(`/backup/schedules/${scheduleId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting backup schedule:', error);
      throw error;
    }
  }

  // Toggle backup schedule
  async toggleBackupSchedule(scheduleId, enabled) {
    try {
      const response = await api.patch(`/backup/schedules/${scheduleId}/toggle`, { enabled });
      return response.data;
    } catch (error) {
      console.error('Error toggling backup schedule:', error);
      throw error;
    }
  }

  // Validate backup integrity
  async validateBackup(backupId) {
    try {
      const response = await api.post(`/backup/validate/${backupId}`);
      return response.data;
    } catch (error) {
      console.error('Error validating backup:', error);
      throw error;
    }
  }

  // Compare backups
  async compareBackups(backupId1, backupId2) {
    try {
      const response = await api.get(`/backup/compare/${backupId1}/${backupId2}`);
      return response.data;
    } catch (error) {
      console.error('Error comparing backups:', error);
      throw error;
    }
  }

  // Export backup settings
  async exportBackupSettings() {
    try {
      const response = await api.get('/backup/export-settings');
      return response.data;
    } catch (error) {
      console.error('Error exporting backup settings:', error);
      throw error;
    }
  }

  // Import backup settings
  async importBackupSettings(settings) {
    try {
      const response = await api.post('/backup/import-settings', settings);
      return response.data;
    } catch (error) {
      console.error('Error importing backup settings:', error);
      throw error;
    }
  }

  // Get backup configuration
  async getBackupConfig() {
    try {
      const response = await api.get('/backup/config');
      return response.data;
    } catch (error) {
      console.error('Error getting backup config:', error);
      throw error;
    }
  }

  // Update backup configuration
  async updateBackupConfig(config) {
    try {
      const response = await api.put('/backup/config', config);
      return response.data;
    } catch (error) {
      console.error('Error updating backup config:', error);
      throw error;
    }
  }
}

const backupService = new BackupService();
export default backupService;
