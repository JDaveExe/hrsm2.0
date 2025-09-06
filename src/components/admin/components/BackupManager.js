import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Alert, 
  ProgressBar, 
  Modal, 
  Form, 
  Table,
  Badge,
  Spinner,
  Tabs,
  Tab
} from 'react-bootstrap';
import backupService from '../../../services/backupService';
import BackupScheduler from './BackupScheduler';
import BackupSettings from './BackupSettings';
import './BackupManager.css';

const BackupManager = () => {
  // State management
  const [activeTab, setActiveTab] = useState('backups');
  const [backups, setBackups] = useState([]);
  const [backupStatus, setBackupStatus] = useState(null);
  const [storageStats, setStorageStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  
  // Backup progress
  const [backupProgress, setBackupProgress] = useState(null);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  
  // Form data
  const [backupOptions, setBackupOptions] = useState({
    includeDatabase: true,
    includeFiles: true,
    includeImages: true,
    compressionLevel: 6,
    description: ''
  });
  
  const [restoreOptions, setRestoreOptions] = useState({
    restoreDatabase: true,
    restoreFiles: true,
    restoreImages: true,
    overwriteExisting: false
  });

  // Load initial data
  useEffect(() => {
    loadBackupData();
  }, []);

  const loadBackupData = async () => {
    try {
      setLoading(true);
      const [backupList, status, storage] = await Promise.all([
        backupService.getBackupList(),
        backupService.getBackupStatus(),
        backupService.getStorageStats()
      ]);
      
      setBackups(backupList.backups || []);
      setBackupStatus(status);
      setStorageStats(storage);
      setError(null);
    } catch (err) {
      setError('Failed to load backup data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Create manual backup
  const handleCreateBackup = async () => {
    try {
      setIsCreatingBackup(true);
      setError(null);
      
      const result = await backupService.createBackup(backupOptions);
      
      if (result.jobId) {
        // Monitor progress
        await monitorBackupProgress(result.jobId);
      }
      
      setSuccess('Backup created successfully!');
      setShowCreateModal(false);
      loadBackupData();
      
      // Reset form
      setBackupOptions({
        includeDatabase: true,
        includeFiles: true,
        includeImages: true,
        compressionLevel: 6,
        description: ''
      });
    } catch (err) {
      setError('Failed to create backup: ' + err.message);
    } finally {
      setIsCreatingBackup(false);
      setBackupProgress(null);
    }
  };

  // Monitor backup progress
  const monitorBackupProgress = async (jobId) => {
    return new Promise((resolve) => {
      const interval = setInterval(async () => {
        try {
          const progress = await backupService.getBackupProgress(jobId);
          setBackupProgress(progress);
          
          if (progress.status === 'completed' || progress.status === 'failed') {
            clearInterval(interval);
            resolve(progress);
          }
        } catch (err) {
          clearInterval(interval);
          resolve(null);
        }
      }, 1000);
    });
  };

  // Handle backup restore
  const handleRestoreBackup = async () => {
    try {
      setIsRestoring(true);
      setError(null);
      
      await backupService.restoreFromBackup(selectedBackup.id, restoreOptions);
      
      setSuccess('Backup restored successfully! Please refresh the page to see changes.');
      setShowRestoreModal(false);
      setSelectedBackup(null);
      
      // Reset form
      setRestoreOptions({
        restoreDatabase: true,
        restoreFiles: true,
        restoreImages: true,
        overwriteExisting: false
      });
    } catch (err) {
      setError('Failed to restore backup: ' + err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  // Download backup
  const handleDownloadBackup = async (backup) => {
    try {
      setError(null);
      await backupService.downloadBackup(backup.id);
      setSuccess('Backup download started!');
    } catch (err) {
      setError('Failed to download backup: ' + err.message);
    }
  };

  // Delete backup
  const handleDeleteBackup = async (backupId) => {
    if (!window.confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      return;
    }
    
    try {
      setError(null);
      await backupService.deleteBackup(backupId);
      setSuccess('Backup deleted successfully!');
      loadBackupData();
    } catch (err) {
      setError('Failed to delete backup: ' + err.message);
    }
  };

  // Validate backup
  const handleValidateBackup = async (backup) => {
    try {
      setError(null);
      const result = await backupService.validateBackup(backup.id);
      
      if (result.valid) {
        setSuccess('Backup validation successful! Backup is valid and can be restored.');
      } else {
        setError('Backup validation failed: ' + result.error);
      }
    } catch (err) {
      setError('Failed to validate backup: ' + err.message);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get status badge variant
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'danger';
      case 'in_progress': return 'warning';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="backup-manager">
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading backup data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="backup-manager">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Backup & Restore</h2>
        <Button 
          variant="primary" 
          onClick={() => setShowCreateModal(true)}
          disabled={isCreatingBackup}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Create Backup
        </Button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          <i className="bi bi-check-circle me-2"></i>
          {success}
        </Alert>
      )}

      {/* Backup Progress */}
      {backupProgress && (
        <Card className="mb-4">
          <Card.Body>
            <h5>
              <i className="bi bi-gear me-2"></i>
              Backup in Progress
            </h5>
            <ProgressBar 
              now={backupProgress.percentage || 0} 
              label={`${backupProgress.percentage || 0}%`}
              className="mb-2"
            />
            <small className="text-muted">
              {backupProgress.currentStep || 'Processing...'}
            </small>
          </Card.Body>
        </Card>
      )}

      {/* Tabs for different backup management sections */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="backups" title={<><i className="bi bi-archive me-2"></i>Backups</>}>
          {/* Statistics Cards */}
          <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h4 className="text-primary">{backups.length}</h4>
              <p className="mb-0">Total Backups</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h4 className="text-success">
                {backups.filter(b => b.status === 'completed').length}
              </h4>
              <p className="mb-0">Successful</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h4 className="text-info">
                {storageStats ? formatFileSize(storageStats.totalSize) : '0 MB'}
              </h4>
              <p className="mb-0">Storage Used</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h4 className="text-warning">
                {backupStatus?.lastBackup ? 
                  new Date(backupStatus.lastBackup).toLocaleDateString() : 
                  'Never'
                }
              </h4>
              <p className="mb-0">Last Backup</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Backup List */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">
            <i className="bi bi-archive me-2"></i>
            Available Backups
          </h5>
        </Card.Header>
        <Card.Body>
          {backups.length === 0 ? (
            <div className="text-center py-4">
              <i className="bi bi-archive text-muted" style={{ fontSize: '3rem' }}></i>
              <p className="text-muted mt-2">No backups available</p>
              <Button variant="outline-primary" onClick={() => setShowCreateModal(true)}>
                Create Your First Backup
              </Button>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Date Created</th>
                  <th>Description</th>
                  <th>Size</th>
                  <th>Status</th>
                  <th>Contents</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup) => (
                  <tr key={backup.id}>
                    <td>{new Date(backup.createdAt).toLocaleString()}</td>
                    <td>{backup.description || 'No description'}</td>
                    <td>{formatFileSize(backup.size)}</td>
                    <td>
                      <Badge bg={getStatusBadge(backup.status)}>
                        {backup.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        {backup.includeDatabase && <Badge bg="info">DB</Badge>}
                        {backup.includeFiles && <Badge bg="success">Files</Badge>}
                        {backup.includeImages && <Badge bg="warning">Images</Badge>}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => handleDownloadBackup(backup)}
                          title="Download"
                        >
                          <i className="bi bi-download"></i>
                        </Button>
                        {backup.status === 'completed' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline-success"
                              onClick={() => {
                                setSelectedBackup(backup);
                                setShowRestoreModal(true);
                              }}
                              title="Restore"
                            >
                              <i className="bi bi-arrow-clockwise"></i>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-info"
                              onClick={() => handleValidateBackup(backup)}
                              title="Validate"
                            >
                              <i className="bi bi-shield-check"></i>
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDeleteBackup(backup.id)}
                          title="Delete"
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Create Backup Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create New Backup</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter backup description..."
                value={backupOptions.description}
                onChange={(e) => setBackupOptions({
                  ...backupOptions,
                  description: e.target.value
                })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Backup Contents</Form.Label>
              <div>
                <Form.Check
                  type="checkbox"
                  label="Database (Patient data, appointments, etc.)"
                  checked={backupOptions.includeDatabase}
                  onChange={(e) => setBackupOptions({
                    ...backupOptions,
                    includeDatabase: e.target.checked
                  })}
                />
                <Form.Check
                  type="checkbox"
                  label="Files (Documents, reports, etc.)"
                  checked={backupOptions.includeFiles}
                  onChange={(e) => setBackupOptions({
                    ...backupOptions,
                    includeFiles: e.target.checked
                  })}
                />
                <Form.Check
                  type="checkbox"
                  label="Images (Photos, medical images, etc.)"
                  checked={backupOptions.includeImages}
                  onChange={(e) => setBackupOptions({
                    ...backupOptions,
                    includeImages: e.target.checked
                  })}
                />
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Compression Level: {backupOptions.compressionLevel}</Form.Label>
              <Form.Range
                min={1}
                max={9}
                value={backupOptions.compressionLevel}
                onChange={(e) => setBackupOptions({
                  ...backupOptions,
                  compressionLevel: parseInt(e.target.value)
                })}
              />
              <Form.Text className="text-muted">
                Higher compression = smaller file size but slower creation
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateBackup}
            disabled={isCreatingBackup || (!backupOptions.includeDatabase && !backupOptions.includeFiles && !backupOptions.includeImages)}
          >
            {isCreatingBackup ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Creating...
              </>
            ) : (
              <>
                <i className="bi bi-plus-circle me-2"></i>
                Create Backup
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Restore Backup Modal */}
      <Modal show={showRestoreModal} onHide={() => setShowRestoreModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Restore Backup</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedBackup && (
            <>
              <Alert variant="warning">
                <i className="bi bi-exclamation-triangle me-2"></i>
                <strong>Warning:</strong> Restoring will replace current data with backup data. 
                This action cannot be undone. Consider creating a backup before restoring.
              </Alert>
              
              <div className="mb-3">
                <strong>Backup Details:</strong>
                <ul className="mt-2">
                  <li>Date: {new Date(selectedBackup.createdAt).toLocaleString()}</li>
                  <li>Size: {formatFileSize(selectedBackup.size)}</li>
                  <li>Description: {selectedBackup.description || 'No description'}</li>
                </ul>
              </div>

              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Restore Options</Form.Label>
                  <div>
                    {selectedBackup.includeDatabase && (
                      <Form.Check
                        type="checkbox"
                        label="Restore Database"
                        checked={restoreOptions.restoreDatabase}
                        onChange={(e) => setRestoreOptions({
                          ...restoreOptions,
                          restoreDatabase: e.target.checked
                        })}
                      />
                    )}
                    {selectedBackup.includeFiles && (
                      <Form.Check
                        type="checkbox"
                        label="Restore Files"
                        checked={restoreOptions.restoreFiles}
                        onChange={(e) => setRestoreOptions({
                          ...restoreOptions,
                          restoreFiles: e.target.checked
                        })}
                      />
                    )}
                    {selectedBackup.includeImages && (
                      <Form.Check
                        type="checkbox"
                        label="Restore Images"
                        checked={restoreOptions.restoreImages}
                        onChange={(e) => setRestoreOptions({
                          ...restoreOptions,
                          restoreImages: e.target.checked
                        })}
                      />
                    )}
                    <Form.Check
                      type="checkbox"
                      label="Overwrite existing data (if unchecked, will merge where possible)"
                      checked={restoreOptions.overwriteExisting}
                      onChange={(e) => setRestoreOptions({
                        ...restoreOptions,
                        overwriteExisting: e.target.checked
                      })}
                    />
                  </div>
                </Form.Group>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRestoreModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleRestoreBackup}
            disabled={isRestoring || (!restoreOptions.restoreDatabase && !restoreOptions.restoreFiles && !restoreOptions.restoreImages)}
          >
            {isRestoring ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Restoring...
              </>
            ) : (
              <>
                <i className="bi bi-arrow-clockwise me-2"></i>
                Restore Backup
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
        </Tab>
        
        <Tab eventKey="schedules" title={<><i className="bi bi-calendar-event me-2"></i>Schedules</>}>
          <BackupScheduler />
        </Tab>
        
        <Tab eventKey="settings" title={<><i className="bi bi-gear me-2"></i>Settings</>}>
          <BackupSettings />
        </Tab>
      </Tabs>
    </div>
  );
};

export default BackupManager;
