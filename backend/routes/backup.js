const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const AuditLogger = require('../utils/auditLogger');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');
const unzipper = require('unzipper');

// Mock backup storage (in production, use a proper database)
let backups = [];
let backupJobs = {};

// Get backup status and statistics
router.get('/status', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const lastBackup = backups.length > 0 ? 
      Math.max(...backups.map(b => new Date(b.createdAt).getTime())) : 
      null;

    const status = {
      lastBackup: lastBackup ? new Date(lastBackup).toISOString() : null,
      totalBackups: backups.length,
      successfulBackups: backups.filter(b => b.status === 'completed').length,
      failedBackups: backups.filter(b => b.status === 'failed').length,
      isBackupRunning: Object.values(backupJobs).some(job => job.status === 'in_progress')
    };

    res.json(status);
  } catch (error) {
    console.error('Error getting backup status:', error);
    res.status(500).json({ error: 'Failed to get backup status' });
  }
});

// Get list of available backups
router.get('/list', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const sortedBackups = [...backups].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({ backups: sortedBackups });
  } catch (error) {
    console.error('Error getting backup list:', error);
    res.status(500).json({ error: 'Failed to get backup list' });
  }
});

// Create a new backup
router.post('/create', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const {
      includeDatabase = true,
      includeFiles = true,
      includeImages = true,
      compressionLevel = 6,
      description = ''
    } = req.body;

    // Validate input
    if (!includeDatabase && !includeFiles && !includeImages) {
      return res.status(400).json({ error: 'At least one backup type must be selected' });
    }

    // Generate backup ID and job ID
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create backup record
    const backup = {
      id: backupId,
      description,
      createdAt: new Date().toISOString(),
      createdBy: req.user.id,
      status: 'in_progress',
      includeDatabase,
      includeFiles,
      includeImages,
      compressionLevel,
      size: 0,
      filePath: null
    };

    backups.push(backup);

    // Create backup job
    const job = {
      id: jobId,
      backupId,
      status: 'in_progress',
      percentage: 0,
      currentStep: 'Initializing backup...',
      startTime: new Date().toISOString(),
      endTime: null
    };

    backupJobs[jobId] = job;

    // Log audit event for backup creation
    try {
      await AuditLogger.logBackupCreation(req, backupId, {
        description,
        includeDatabase,
        includeFiles,
        includeImages,
        compressionLevel
      });
      console.log(`✅ Audit log created for backup: ${backupId}`);
    } catch (auditError) {
      console.error('⚠️  Audit logging failed (non-critical):', auditError.message);
    }

    // Start backup process (async)
    processBackup(backup, job).catch(error => {
      console.error('Backup process error:', error);
      // Update backup status to failed
      const backupIndex = backups.findIndex(b => b.id === backupId);
      if (backupIndex !== -1) {
        backups[backupIndex].status = 'failed';
      }
      if (backupJobs[jobId]) {
        backupJobs[jobId].status = 'failed';
        backupJobs[jobId].currentStep = 'Backup failed: ' + error.message;
      }
    });

    res.json({ 
      message: 'Backup started successfully',
      backupId,
      jobId 
    });

  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// Get backup job progress
router.get('/progress/:jobId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = backupJobs[jobId];

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Error getting backup progress:', error);
    res.status(500).json({ error: 'Failed to get backup progress' });
  }
});

// Download backup file
router.get('/download/:backupId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { backupId } = req.params;
    const backup = backups.find(b => b.id === backupId);

    if (!backup) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    if (backup.status !== 'completed') {
      return res.status(400).json({ error: 'Backup is not ready for download' });
    }

    const backupPath = path.join(__dirname, '..', 'backups', `${backupId}.zip`);
    
    // Check if file exists
    try {
      await fs.access(backupPath);
    } catch (error) {
      return res.status(404).json({ error: 'Backup file not found' });
    }

    res.download(backupPath, `backup_${backupId}_${new Date().toISOString().split('T')[0]}.zip`);

  } catch (error) {
    console.error('Error downloading backup:', error);
    res.status(500).json({ error: 'Failed to download backup' });
  }
});

// Delete backup
router.delete('/:backupId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { backupId } = req.params;
    const backupIndex = backups.findIndex(b => b.id === backupId);

    if (backupIndex === -1) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    const backup = backups[backupIndex];
    
    // Delete backup file if it exists
    if (backup.filePath) {
      try {
        await fs.unlink(backup.filePath);
      } catch (error) {
        console.warn('Failed to delete backup file:', error.message);
      }
    }

    // Remove from backups array
    backups.splice(backupIndex, 1);

    res.json({ message: 'Backup deleted successfully' });

  } catch (error) {
    console.error('Error deleting backup:', error);
    res.status(500).json({ error: 'Failed to delete backup' });
  }
});

// Restore from backup
router.post('/restore/:backupId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { backupId } = req.params;
    const {
      restoreDatabase = true,
      restoreFiles = true,
      restoreImages = true,
      overwriteExisting = false
    } = req.body;

    const backup = backups.find(b => b.id === backupId);

    if (!backup) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    if (backup.status !== 'completed') {
      return res.status(400).json({ error: 'Backup is not ready for restore' });
    }

    // For demo purposes, just return success
    // In production, implement actual restore logic
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Log audit event for backup restore
    try {
      await AuditLogger.logBackupRestore(req, backupId, {
        backupDescription: backup.description,
        restoreDatabase,
        restoreFiles,
        restoreImages,
        overwriteExisting
      });
      console.log(`✅ Audit log created for backup restore: ${backupId}`);
    } catch (auditError) {
      console.error('⚠️  Audit logging failed (non-critical):', auditError.message);
    }

    res.json({ 
      message: 'Backup restored successfully',
      restoredComponents: {
        database: restoreDatabase && backup.includeDatabase,
        files: restoreFiles && backup.includeFiles,
        images: restoreImages && backup.includeImages
      }
    });

  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ error: 'Failed to restore backup' });
  }
});

// Get storage statistics
router.get('/storage-stats', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const totalSize = backups.reduce((sum, backup) => sum + (backup.size || 0), 0);
    const backupDir = path.join(__dirname, '..', 'backups');
    
    let availableSpace = 0;
    try {
      // Get available disk space (simplified)
      availableSpace = 1024 * 1024 * 1024 * 10; // 10GB mock value
    } catch (error) {
      console.warn('Could not get disk space:', error.message);
    }

    const stats = {
      totalSize,
      totalBackups: backups.length,
      averageSize: backups.length > 0 ? totalSize / backups.length : 0,
      availableSpace,
      usedPercentage: availableSpace > 0 ? (totalSize / availableSpace) * 100 : 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Error getting storage stats:', error);
    res.status(500).json({ error: 'Failed to get storage statistics' });
  }
});

// Validate backup integrity
router.post('/validate/:backupId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { backupId } = req.params;
    const backup = backups.find(b => b.id === backupId);

    if (!backup) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    if (backup.status !== 'completed') {
      return res.status(400).json({ error: 'Backup is not ready for validation' });
    }

    // For demo purposes, simulate validation
    await new Promise(resolve => setTimeout(resolve, 1000));

    const isValid = Math.random() > 0.1; // 90% success rate for demo

    res.json({
      valid: isValid,
      checkedComponents: {
        database: backup.includeDatabase,
        files: backup.includeFiles,
        images: backup.includeImages
      },
      error: isValid ? null : 'Backup file appears to be corrupted'
    });

  } catch (error) {
    console.error('Error validating backup:', error);
    res.status(500).json({ error: 'Failed to validate backup' });
  }
});

// Process backup (async function)
async function processBackup(backup, job) {
  try {
    const backupDir = path.join(__dirname, '..', 'backups');
    
    // Ensure backup directory exists
    try {
      await fs.mkdir(backupDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }

    const backupPath = path.join(backupDir, `${backup.id}.zip`);
    
    // Update job progress
    job.currentStep = 'Preparing backup...';
    job.percentage = 10;

    // Simulate backup process with progress updates
    const steps = [
      { step: 'Backing up database...', percentage: 30 },
      { step: 'Backing up files...', percentage: 60 },
      { step: 'Backing up images...', percentage: 80 },
      { step: 'Compressing backup...', percentage: 90 },
      { step: 'Finalizing backup...', percentage: 100 }
    ];

    for (const stepInfo of steps) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate work
      job.currentStep = stepInfo.step;
      job.percentage = stepInfo.percentage;
    }

    // Create a simple backup file (demo)
    const backupData = {
      metadata: backup,
      timestamp: new Date().toISOString(),
      components: {
        database: backup.includeDatabase ? 'database_backup_data' : null,
        files: backup.includeFiles ? 'files_backup_data' : null,
        images: backup.includeImages ? 'images_backup_data' : null
      }
    };

    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));
    
    // Get file size
    const stats = await fs.stat(backupPath);
    const fileSize = stats.size;

    // Update backup record
    const backupIndex = backups.findIndex(b => b.id === backup.id);
    if (backupIndex !== -1) {
      backups[backupIndex].status = 'completed';
      backups[backupIndex].size = fileSize;
      backups[backupIndex].filePath = backupPath;
    }

    // Update job
    job.status = 'completed';
    job.endTime = new Date().toISOString();
    job.currentStep = 'Backup completed successfully';

  } catch (error) {
    throw error;
  }
}

// ============= BACKUP SCHEDULING ENDPOINTS =============

// Mock schedule storage (in production, use a proper database)
let backupSchedules = [
  {
    id: 1,
    name: 'Daily Database Backup',
    description: 'Automatic daily backup of the database',
    frequency: 'daily',
    time: '02:00',
    enabled: true,
    retentionDays: 30,
    maxBackups: 10,
    options: {
      includeDatabase: true,
      includeFiles: false,
      includeImages: false,
      compressionLevel: 6
    },
    createdAt: new Date().toISOString(),
    lastRun: null,
    nextRun: null
  }
];

// Get all backup schedules
router.get('/schedules', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    res.json({ schedules: backupSchedules });
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({ msg: 'Failed to get backup schedules' });
  }
});

// Create backup schedule
router.post('/schedules', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const schedule = {
      id: Date.now(),
      ...req.body,
      createdAt: new Date().toISOString(),
      lastRun: null,
      nextRun: calculateNextRun(req.body)
    };

    backupSchedules.push(schedule);
    
    res.json({ 
      msg: 'Backup schedule created successfully',
      schedule 
    });
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({ msg: 'Failed to create backup schedule' });
  }
});

// Update backup schedule
router.put('/schedules/:scheduleId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.scheduleId);
    const scheduleIndex = backupSchedules.findIndex(s => s.id === scheduleId);
    
    if (scheduleIndex === -1) {
      return res.status(404).json({ msg: 'Backup schedule not found' });
    }

    backupSchedules[scheduleIndex] = {
      ...backupSchedules[scheduleIndex],
      ...req.body,
      nextRun: calculateNextRun(req.body),
      updatedAt: new Date().toISOString()
    };

    res.json({ 
      msg: 'Backup schedule updated successfully',
      schedule: backupSchedules[scheduleIndex]
    });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ msg: 'Failed to update backup schedule' });
  }
});

// Delete backup schedule
router.delete('/schedules/:scheduleId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.scheduleId);
    const scheduleIndex = backupSchedules.findIndex(s => s.id === scheduleId);
    
    if (scheduleIndex === -1) {
      return res.status(404).json({ msg: 'Backup schedule not found' });
    }

    backupSchedules.splice(scheduleIndex, 1);

    res.json({ msg: 'Backup schedule deleted successfully' });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ msg: 'Failed to delete backup schedule' });
  }
});

// Toggle backup schedule
router.patch('/schedules/:scheduleId/toggle', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.scheduleId);
    const { enabled } = req.body;
    const scheduleIndex = backupSchedules.findIndex(s => s.id === scheduleId);
    
    if (scheduleIndex === -1) {
      return res.status(404).json({ msg: 'Backup schedule not found' });
    }

    backupSchedules[scheduleIndex].enabled = enabled;
    backupSchedules[scheduleIndex].updatedAt = new Date().toISOString();

    res.json({ 
      msg: `Backup schedule ${enabled ? 'enabled' : 'disabled'} successfully`,
      schedule: backupSchedules[scheduleIndex]
    });
  } catch (error) {
    console.error('Toggle schedule error:', error);
    res.status(500).json({ msg: 'Failed to toggle backup schedule' });
  }
});

// Helper function to calculate next run time
function calculateNextRun(schedule) {
  const now = new Date();
  const [hours, minutes] = schedule.time.split(':').map(Number);
  
  let nextRun = new Date();
  nextRun.setHours(hours, minutes, 0, 0);
  
  // If the time has already passed today, schedule for next occurrence
  if (nextRun <= now) {
    switch (schedule.frequency) {
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1);
        nextRun.setDate(schedule.dayOfMonth || 1);
        break;
    }
  }
  
  return nextRun.toISOString();
}

// ============= BACKUP CONFIGURATION ENDPOINTS =============

// Mock configuration storage
let backupConfig = {
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
};

// Get backup configuration
router.get('/config', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    res.json(backupConfig);
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({ msg: 'Failed to get backup configuration' });
  }
});

// Update backup configuration
router.put('/config', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    backupConfig = { ...backupConfig, ...req.body };
    res.json({ 
      msg: 'Backup configuration updated successfully',
      config: backupConfig 
    });
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({ msg: 'Failed to update backup configuration' });
  }
});

// Export backup settings
router.get('/export-settings', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const exportData = {
      config: backupConfig,
      schedules: backupSchedules,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    res.json(exportData);
  } catch (error) {
    console.error('Export settings error:', error);
    res.status(500).json({ msg: 'Failed to export backup settings' });
  }
});

// Import backup settings
router.post('/import-settings', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { config, schedules } = req.body;
    
    if (config) {
      backupConfig = { ...backupConfig, ...config };
    }
    
    if (schedules && Array.isArray(schedules)) {
      // Update schedule IDs to avoid conflicts
      const importedSchedules = schedules.map(schedule => ({
        ...schedule,
        id: Date.now() + Math.random(),
        importedAt: new Date().toISOString()
      }));
      backupSchedules.push(...importedSchedules);
    }
    
    res.json({ msg: 'Backup settings imported successfully' });
  } catch (error) {
    console.error('Import settings error:', error);
    res.status(500).json({ msg: 'Failed to import backup settings' });
  }
});

module.exports = router;
