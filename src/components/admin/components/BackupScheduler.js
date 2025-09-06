import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Alert, 
  Modal, 
  Form, 
  Table,
  Badge,
  Spinner
} from 'react-bootstrap';
import backupService from '../../../services/backupService';

const BackupScheduler = () => {
  const [schedules, setSchedules] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    description: '',
    frequency: 'daily', // daily, weekly, monthly
    time: '02:00', // 24-hour format
    dayOfWeek: 1, // For weekly (1-7, Monday=1)
    dayOfMonth: 1, // For monthly (1-31)
    enabled: true,
    retentionDays: 30, // How long to keep backups
    maxBackups: 10, // Maximum number of backups to keep
    options: {
      includeDatabase: true,
      includeFiles: true,
      includeImages: true,
      compressionLevel: 6
    }
  });

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const result = await backupService.getBackupSchedules();
      setSchedules(result.schedules || []);
      setError(null);
    } catch (err) {
      setError('Failed to load backup schedules: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchedule = async () => {
    try {
      if (editingSchedule) {
        await backupService.updateBackupSchedule(editingSchedule.id, scheduleForm);
        setSuccess('Backup schedule updated successfully!');
      } else {
        await backupService.createBackupSchedule(scheduleForm);
        setSuccess('Backup schedule created successfully!');
      }
      
      setShowScheduleModal(false);
      setEditingSchedule(null);
      resetForm();
      loadSchedules();
    } catch (err) {
      setError('Failed to save backup schedule: ' + err.message);
    }
  };

  const handleEditSchedule = (schedule) => {
    setEditingSchedule(schedule);
    setScheduleForm({
      ...schedule,
      time: schedule.time || '02:00'
    });
    setShowScheduleModal(true);
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this backup schedule?')) {
      return;
    }

    try {
      await backupService.deleteBackupSchedule(scheduleId);
      setSuccess('Backup schedule deleted successfully!');
      loadSchedules();
    } catch (err) {
      setError('Failed to delete backup schedule: ' + err.message);
    }
  };

  const handleToggleSchedule = async (scheduleId, enabled) => {
    try {
      await backupService.toggleBackupSchedule(scheduleId, enabled);
      setSuccess(`Backup schedule ${enabled ? 'enabled' : 'disabled'} successfully!`);
      loadSchedules();
    } catch (err) {
      setError('Failed to toggle backup schedule: ' + err.message);
    }
  };

  const resetForm = () => {
    setScheduleForm({
      name: '',
      description: '',
      frequency: 'daily',
      time: '02:00',
      dayOfWeek: 1,
      dayOfMonth: 1,
      enabled: true,
      retentionDays: 30,
      maxBackups: 10,
      options: {
        includeDatabase: true,
        includeFiles: true,
        includeImages: true,
        compressionLevel: 6
      }
    });
  };

  const getFrequencyDisplay = (schedule) => {
    switch (schedule.frequency) {
      case 'daily':
        return `Daily at ${schedule.time}`;
      case 'weekly':
        const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return `Weekly on ${days[schedule.dayOfWeek]} at ${schedule.time}`;
      case 'monthly':
        return `Monthly on day ${schedule.dayOfMonth} at ${schedule.time}`;
      default:
        return `${schedule.frequency} at ${schedule.time}`;
    }
  };

  const getNextRunTime = (schedule) => {
    // This would calculate the next run time based on the schedule
    // For now, return a placeholder
    const now = new Date();
    const nextRun = new Date(now);
    
    switch (schedule.frequency) {
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
    }
    
    return nextRun.toLocaleString();
  };

  if (loading) {
    return (
      <div className="text-center py-3">
        <Spinner animation="border" size="sm" />
        <span className="ms-2">Loading schedules...</span>
      </div>
    );
  }

  return (
    <div className="backup-scheduler">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Backup Schedules</h4>
        <Button 
          variant="success" 
          size="sm"
          onClick={() => {
            resetForm();
            setShowScheduleModal(true);
          }}
        >
          <i className="bi bi-plus-circle me-1"></i>
          Add Schedule
        </Button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-3">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)} className="mb-3">
          <i className="bi bi-check-circle me-2"></i>
          {success}
        </Alert>
      )}

      {/* Schedules Table */}
      <Card>
        <Card.Body>
          {schedules.length === 0 ? (
            <div className="text-center py-4">
              <i className="bi bi-calendar-x display-6 text-muted"></i>
              <p className="mt-2 text-muted">No backup schedules configured</p>
              <Button variant="outline-primary" onClick={() => setShowScheduleModal(true)}>
                Create First Schedule
              </Button>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Frequency</th>
                  <th>Next Run</th>
                  <th>Retention</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => (
                  <tr key={schedule.id}>
                    <td>
                      <div>
                        <strong>{schedule.name}</strong>
                        {schedule.description && (
                          <div className="text-muted small">{schedule.description}</div>
                        )}
                      </div>
                    </td>
                    <td>{getFrequencyDisplay(schedule)}</td>
                    <td className="small">
                      {schedule.enabled ? getNextRunTime(schedule) : 'Disabled'}
                    </td>
                    <td>
                      <small>
                        {schedule.retentionDays} days<br/>
                        Max: {schedule.maxBackups}
                      </small>
                    </td>
                    <td>
                      <Badge bg={schedule.enabled ? 'success' : 'secondary'}>
                        {schedule.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleEditSchedule(schedule)}
                          title="Edit"
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button
                          variant={schedule.enabled ? 'outline-warning' : 'outline-success'}
                          size="sm"
                          onClick={() => handleToggleSchedule(schedule.id, !schedule.enabled)}
                          title={schedule.enabled ? 'Disable' : 'Enable'}
                        >
                          <i className={`bi bi-${schedule.enabled ? 'pause' : 'play'}`}></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteSchedule(schedule.id)}
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

      {/* Schedule Modal */}
      <Modal show={showScheduleModal} onHide={() => setShowScheduleModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingSchedule ? 'Edit Backup Schedule' : 'Create Backup Schedule'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Schedule Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={scheduleForm.name}
                    onChange={(e) => setScheduleForm({...scheduleForm, name: e.target.value})}
                    placeholder="e.g., Daily Database Backup"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Frequency</Form.Label>
                  <Form.Select
                    value={scheduleForm.frequency}
                    onChange={(e) => setScheduleForm({...scheduleForm, frequency: e.target.value})}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={scheduleForm.time}
                    onChange={(e) => setScheduleForm({...scheduleForm, time: e.target.value})}
                  />
                </Form.Group>
              </Col>
              
              {scheduleForm.frequency === 'weekly' && (
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Day of Week</Form.Label>
                    <Form.Select
                      value={scheduleForm.dayOfWeek}
                      onChange={(e) => setScheduleForm({...scheduleForm, dayOfWeek: parseInt(e.target.value)})}
                    >
                      <option value={1}>Monday</option>
                      <option value={2}>Tuesday</option>
                      <option value={3}>Wednesday</option>
                      <option value={4}>Thursday</option>
                      <option value={5}>Friday</option>
                      <option value={6}>Saturday</option>
                      <option value={7}>Sunday</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}
              
              {scheduleForm.frequency === 'monthly' && (
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Day of Month</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      max="31"
                      value={scheduleForm.dayOfMonth}
                      onChange={(e) => setScheduleForm({...scheduleForm, dayOfMonth: parseInt(e.target.value)})}
                    />
                  </Form.Group>
                </Col>
              )}
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Retention Days</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="365"
                    value={scheduleForm.retentionDays}
                    onChange={(e) => setScheduleForm({...scheduleForm, retentionDays: parseInt(e.target.value)})}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={scheduleForm.description}
                onChange={(e) => setScheduleForm({...scheduleForm, description: e.target.value})}
                placeholder="Describe this backup schedule..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Backup Options</Form.Label>
              <div className="border rounded p-3">
                <Form.Check
                  type="checkbox"
                  label="Include Database"
                  checked={scheduleForm.options.includeDatabase}
                  onChange={(e) => setScheduleForm({
                    ...scheduleForm,
                    options: {...scheduleForm.options, includeDatabase: e.target.checked}
                  })}
                  className="mb-2"
                />
                <Form.Check
                  type="checkbox"
                  label="Include Files"
                  checked={scheduleForm.options.includeFiles}
                  onChange={(e) => setScheduleForm({
                    ...scheduleForm,
                    options: {...scheduleForm.options, includeFiles: e.target.checked}
                  })}
                  className="mb-2"
                />
                <Form.Check
                  type="checkbox"
                  label="Include Images"
                  checked={scheduleForm.options.includeImages}
                  onChange={(e) => setScheduleForm({
                    ...scheduleForm,
                    options: {...scheduleForm.options, includeImages: e.target.checked}
                  })}
                />
              </div>
            </Form.Group>

            <Form.Check
              type="checkbox"
              label="Enable this schedule"
              checked={scheduleForm.enabled}
              onChange={(e) => setScheduleForm({...scheduleForm, enabled: e.target.checked})}
              className="mb-3"
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowScheduleModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveSchedule}
            disabled={!scheduleForm.name.trim()}
          >
            {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default BackupScheduler;
