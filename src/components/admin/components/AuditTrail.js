import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Row, 
  Col, 
  Form, 
  InputGroup, 
  Badge, 
  Spinner, 
  Alert, 
  Modal,
  Pagination,
  Dropdown,
  OverlayTrigger,
  Tooltip
} from 'react-bootstrap';
import axios from 'axios';
import './styles/AuditTrail.css';

const AuditTrail = ({ user }) => {
  // State management
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [auditStats, setAuditStats] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    userRole: '',
    action: '',
    targetType: '',
    startDate: '',
    endDate: '',
    limit: 25
  });

  // Get authentication token
  const getAuthToken = () => {
    return localStorage.getItem('token') || 'temp-admin-token';
  };

  // Fetch audit logs
  const fetchAuditLogs = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: page.toString(),
        limit: filters.limit.toString()
      });

      // Add filters if they exist
      Object.entries(filters).forEach(([key, value]) => {
        if (value && key !== 'limit') {
          params.append(key, value);
        }
      });

      const response = await axios.get(`/api/audit/logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setAuditLogs(response.data.data.auditLogs);
        setTotalPages(response.data.data.totalPages);
        setTotalCount(response.data.data.totalCount);
        setCurrentPage(response.data.data.currentPage);
      } else {
        setError('Failed to fetch audit logs');
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err.response?.data?.msg || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch audit statistics
  const fetchAuditStats = async () => {
    try {
      const response = await axios.get('/api/audit/stats', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setAuditStats(response.data.data);
        setShowStatsModal(true);
      }
    } catch (err) {
      console.error('Error fetching audit statistics:', err);
      setError('Failed to fetch audit statistics');
    }
  };

  // Export audit logs
  const exportAuditLogs = async () => {
    try {
      const params = new URLSearchParams();
      
      // Add filters for export
      Object.entries(filters).forEach(([key, value]) => {
        if (value && key !== 'limit') {
          params.append(key, value);
        }
      });

      const response = await axios.get(`/api/audit/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        },
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting audit logs:', err);
      setError('Failed to export audit logs');
    }
  };

  // Clear audit logs (admin only)
  const clearAuditLogs = async () => {
    if (!window.confirm('Are you sure you want to clear ALL audit logs? This action cannot be undone!')) {
      return;
    }

    try {
      const response = await axios.post('/api/admin/clear-audit-logs', {}, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.message) {
        alert(`Success: ${response.data.message}\nCleared ${response.data.clearedEntries} entries`);
        // Refresh the audit logs display
        setAuditLogs([]);
        setTotalCount(0);
        setCurrentPage(1);
        fetchAuditLogs(1);
      }
    } catch (err) {
      console.error('Error clearing audit logs:', err);
      setError(err.response?.data?.msg || 'Failed to clear audit logs');
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Apply filters and fetch data
  const applyFilters = () => {
    setCurrentPage(1);
    fetchAuditLogs(1);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      search: '',
      userRole: '',
      action: '',
      targetType: '',
      startDate: '',
      endDate: '',
      limit: 25
    });
    setCurrentPage(1);
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  // Get action badge variant
  const getActionBadgeVariant = (action) => {
    const actionMap = {
      'removed_patient': 'danger',
      'checked_in_patient': 'success',
      'checked_vital_signs': 'info',
      'transferred_patient': 'warning',
      'vaccinated_patient': 'primary',
      'added_new_user': 'success',
      'started_checkup': 'info',
      'finished_checkup': 'success',
      'added_new_medication': 'primary',
      'added_new_vaccine': 'primary',
      'added_stocks': 'warning',
      'created_report': 'info',
      'viewed_audit_logs': 'secondary',
      'exported_audit_logs': 'secondary'
    };
    return actionMap[action] || 'secondary';
  };

  // Get role badge variant
  const getRoleBadgeVariant = (role) => {
    const roleMap = {
      'admin': 'danger',
      'doctor': 'primary',
      'management': 'success',
      'staff': 'info',
      'patient': 'secondary'
    };
    return roleMap[role] || 'secondary';
  };

  // Show log details
  const showLogDetails = (log) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  // Initial load
  useEffect(() => {
    fetchAuditLogs(1);
  }, [fetchAuditLogs]);

  return (
    <div className="audit-trail-container">
      {/* Filters */}
      <div className="filter-container">
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">
              <i className="bi bi-funnel me-2"></i>
              Filters & Actions
            </h5>
          </Card.Header>
          <Card.Body>
            <Row className="align-items-end">
              <Col md={2}>
                <Form.Group>
                  <Form.Label>Search</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <i className="bi bi-search"></i>
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search logs..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label>User Role</Form.Label>
                  <Form.Select
                    value={filters.userRole}
                    onChange={(e) => handleFilterChange('userRole', e.target.value)}
                  >
                    <option value="">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="doctor">Doctor</option>
                    <option value="management">Management</option>
                    {/* <option value="staff">Staff</option> */}
                    {/* <option value="patient">Patient</option> */}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label>Target Type</Form.Label>
                  <Form.Select
                    value={filters.targetType}
                    onChange={(e) => handleFilterChange('targetType', e.target.value)}
                  >
                    <option value="">All Types</option>
                    <option value="patient">Patient</option>
                    <option value="user">User</option>
                    <option value="medication">Medication</option>
                    <option value="vaccine">Vaccine</option>
                    <option value="checkup">Checkup</option>
                    <option value="report">Report</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={1}>
                <Form.Group>
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={1}>
                <Form.Group>
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={1}>
                <Form.Group>
                  <Form.Label>Per Page</Form.Label>
                  <Form.Select
                    value={filters.limit}
                    onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <div className="filter-buttons d-flex gap-2 justify-content-end">
                  <Button 
                    variant="primary" 
                    onClick={applyFilters}
                    title="Apply Filters"
                    size="sm"
                  >
                    <i className="bi bi-search"></i>
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={clearFilters}
                    title="Clear Filters"
                    size="sm"
                  >
                    <i className="bi bi-x-circle"></i>
                  </Button>
                  <Button 
                    variant="outline-primary" 
                    onClick={() => fetchAuditLogs(currentPage)}
                    title="Refresh Audit Logs"
                    size="sm"
                    disabled={loading}
                  >
                    <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i>
                  </Button>
                  {user?.role === 'admin' && (
                    <>
                      <Button 
                        variant="outline-info" 
                        onClick={fetchAuditStats}
                        title="View Statistics"
                        size="sm"
                      >
                        <i className="bi bi-graph-up"></i>
                      </Button>
                      <Button 
                        variant="outline-success" 
                        onClick={exportAuditLogs}
                        title="Export CSV"
                        size="sm"
                      >
                        <i className="bi bi-download"></i>
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        onClick={clearAuditLogs}
                        title="Clear All Audit Logs"
                        size="sm"
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </>
                  )}
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {/* Audit Logs Table */}
      <div className="table-container">
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="bi bi-list-ul me-2"></i>
              Audit Log Entries
            </h5>
            <div className="d-flex align-items-center gap-3">
              {!loading && auditLogs.length > 0 && (
                <small className="text-muted">
                  Showing {auditLogs.length} of {totalCount} audit log entries
                  {currentPage > 1 && ` (Page ${currentPage} of ${totalPages})`}
                </small>
              )}
              {totalPages > 1 && (
                <div className="header-pagination">
                  <Pagination size="sm" className="mb-0 border-pagination">
                    <Pagination.First 
                      onClick={() => fetchAuditLogs(1)} 
                      disabled={currentPage === 1}
                      className="border-pagination-item"
                    />
                    <Pagination.Prev 
                      onClick={() => fetchAuditLogs(currentPage - 1)} 
                      disabled={currentPage === 1}
                      className="border-pagination-item"
                    />
                    
                    {/* Show limited page numbers */}
                    {(() => {
                      const pages = [];
                      const maxPages = 3; // Show max 3 page numbers
                      let startPage = Math.max(1, currentPage - 1);
                      let endPage = Math.min(totalPages, startPage + maxPages - 1);
                      
                      if (endPage - startPage + 1 < maxPages) {
                        startPage = Math.max(1, endPage - maxPages + 1);
                      }
                      
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <Pagination.Item
                            key={i}
                            active={i === currentPage}
                            onClick={() => fetchAuditLogs(i)}
                            className="border-pagination-item"
                          >
                            {i}
                          </Pagination.Item>
                        );
                      }
                      return pages;
                    })()}
                    
                    <Pagination.Next 
                      onClick={() => fetchAuditLogs(currentPage + 1)} 
                      disabled={currentPage === totalPages}
                      className="border-pagination-item"
                    />
                    <Pagination.Last 
                      onClick={() => fetchAuditLogs(totalPages)} 
                      disabled={currentPage === totalPages}
                      className="border-pagination-item"
                    />
                  </Pagination>
                </div>
              )}
            </div>
          </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center p-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-2">Loading audit logs...</p>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center p-4">
              <i className="bi bi-inbox display-1 text-muted"></i>
              <p className="mt-2 text-muted">No audit logs found matching your criteria</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped hover className="mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Role</th>
                    <th>Action</th>
                    <th>Description</th>
                    <th>Target</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="text-nowrap">
                        <small>{formatTimestamp(log.timestamp)}</small>
                      </td>
                      <td>
                        <strong>{log.userName}</strong>
                        {log.ipAddress && (
                          <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip>IP: {log.ipAddress}</Tooltip>}
                          >
                            <small className="text-muted d-block">
                              <i className="bi bi-geo-alt me-1"></i>
                              {log.ipAddress}
                            </small>
                          </OverlayTrigger>
                        )}
                      </td>
                      <td>
                        <Badge bg={getRoleBadgeVariant(log.userRole)}>
                          {log.userRole.toUpperCase()}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={getActionBadgeVariant(log.action)}>
                          {log.action.replace(/_/g, ' ').toUpperCase()}
                        </Badge>
                      </td>
                      <td>
                        <span className="audit-description">
                          {log.actionDescription}
                        </span>
                      </td>
                      <td>
                        {log.targetType && (
                          <div>
                            <Badge variant="outline-secondary" className="me-1">
                              {log.targetType}
                            </Badge>
                            {log.targetName && (
                              <small className="text-muted d-block">
                                {log.targetName}
                              </small>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline-info"
                          onClick={() => showLogDetails(log)}
                          title="View Details"
                        >
                          <i className="bi bi-eye"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
        </Card>
      </div>

      {/* Audit Statistics Modal */}
      <Modal 
        show={showStatsModal} 
        onHide={() => setShowStatsModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-graph-up me-2"></i>
            Audit Trail Statistics
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {auditStats && (
            <Row>
              <Col md={6}>
                <Card className="mb-3">
                  <Card.Header>
                    <strong>Overview</strong>
                  </Card.Header>
                  <Card.Body>
                    <p><strong>Total Logs:</strong> {auditStats.totalLogs}</p>
                    <p><strong>Recent Activity (24h):</strong> {auditStats.recentActivity}</p>
                  </Card.Body>
                </Card>
                
                <Card>
                  <Card.Header>
                    <strong>Logs by Role</strong>
                  </Card.Header>
                  <Card.Body>
                    {auditStats.logsByRole.map((item) => (
                      <div key={item.userRole} className="d-flex justify-content-between">
                        <Badge bg={getRoleBadgeVariant(item.userRole)} className="me-2">
                          {item.userRole.toUpperCase()}
                        </Badge>
                        <span>{item.count}</span>
                      </div>
                    ))}
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={6}>
                <Card className="mb-3">
                  <Card.Header>
                    <strong>Top Actions</strong>
                  </Card.Header>
                  <Card.Body>
                    {auditStats.logsByAction.slice(0, 5).map((item) => (
                      <div key={item.action} className="d-flex justify-content-between mb-2">
                        <Badge bg={getActionBadgeVariant(item.action)} className="me-2">
                          {item.action.replace(/_/g, ' ').toUpperCase()}
                        </Badge>
                        <span>{item.count}</span>
                      </div>
                    ))}
                  </Card.Body>
                </Card>
                
                <Card>
                  <Card.Header>
                    <strong>Most Active Users (30 days)</strong>
                  </Card.Header>
                  <Card.Body>
                    {auditStats.activeUsers.slice(0, 5).map((item) => (
                      <div key={item.userId} className="d-flex justify-content-between mb-2">
                        <div>
                          <strong>{item.userName}</strong>
                          <Badge bg={getRoleBadgeVariant(item.userRole)} className="ms-1">
                            {item.userRole}
                          </Badge>
                        </div>
                        <span>{item.actionCount} actions</span>
                      </div>
                    ))}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Log Detail Modal */}
      <Modal 
        show={showDetailModal} 
        onHide={() => setShowDetailModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-info-circle me-2"></i>
            Audit Log Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedLog && (
            <Row>
              <Col md={6}>
                <h6>Basic Information</h6>
                <p><strong>Timestamp:</strong> {formatTimestamp(selectedLog.timestamp)}</p>
                <p><strong>User:</strong> {selectedLog.userName}</p>
                <p><strong>Role:</strong> 
                  <Badge bg={getRoleBadgeVariant(selectedLog.userRole)} className="ms-2">
                    {selectedLog.userRole.toUpperCase()}
                  </Badge>
                </p>
                <p><strong>Action:</strong> 
                  <Badge bg={getActionBadgeVariant(selectedLog.action)} className="ms-2">
                    {selectedLog.action.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                </p>
                <p><strong>Description:</strong> {selectedLog.actionDescription}</p>
              </Col>
              <Col md={6}>
                <h6>Technical Details</h6>
                <p><strong>User ID:</strong> {selectedLog.userId}</p>
                <p><strong>IP Address:</strong> {selectedLog.ipAddress || 'N/A'}</p>
                <p><strong>Target Type:</strong> {selectedLog.targetType || 'N/A'}</p>
                <p><strong>Target ID:</strong> {selectedLog.targetId || 'N/A'}</p>
                <p><strong>Target Name:</strong> {selectedLog.targetName || 'N/A'}</p>
                
                {selectedLog.metadata && (
                  <div>
                    <h6>Additional Data</h6>
                    <div className="metadata-display">
                      {(() => {
                        try {
                          const metadata = typeof selectedLog.metadata === 'string' 
                            ? JSON.parse(selectedLog.metadata) 
                            : selectedLog.metadata;
                          
                          return (
                            <div className="bg-light p-3 rounded">
                              {Object.entries(metadata).map(([key, value]) => (
                                <div key={key} className="mb-2">
                                  <strong className="text-primary">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong>
                                  <span className="ms-2">
                                    {typeof value === 'object' && value !== null 
                                      ? (
                                        <details className="mt-1">
                                          <summary className="text-info" style={{cursor: 'pointer'}}>
                                            View details
                                          </summary>
                                          <pre className="mt-2 p-2 bg-white rounded border small">
                                            {JSON.stringify(value, null, 2)}
                                          </pre>
                                        </details>
                                      )
                                      : (
                                        <code className="bg-white px-2 py-1 rounded border">
                                          {String(value)}
                                        </code>
                                      )
                                    }
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        } catch (error) {
                          return (
                            <div className="bg-light p-3 rounded">
                              <small className="text-muted">Raw data:</small>
                              <pre className="mt-2 bg-white p-2 rounded border small">
                                {typeof selectedLog.metadata === 'string' 
                                  ? selectedLog.metadata 
                                  : JSON.stringify(selectedLog.metadata, null, 2)
                                }
                              </pre>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                )}
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AuditTrail;
