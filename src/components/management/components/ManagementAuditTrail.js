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
import '../styles/ManagementAuditTrail.css';

const ManagementAuditTrail = ({ user }) => {
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
  
  // Dropdown options from database
  const [availableActions, setAvailableActions] = useState([]);
  const [availableTargetTypes, setAvailableTargetTypes] = useState([]);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    userRole: 'management', // Default to management role
    action: '',
    targetType: '',
    startDate: '',
    endDate: '',
    limit: 20
  });

  // Get authentication token
  const getAuthToken = () => {
    return localStorage.getItem('token') || window.__authToken;
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
      console.error('Error fetching audit stats:', err);
    }
  };

  // Fetch available actions for dropdown
  const fetchAvailableActions = async () => {
    try {
      console.log('🔍 Fetching available actions...');
      const response = await axios.get('/api/audit/actions', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Actions response:', response.data);
      if (response.data.success) {
        setAvailableActions(response.data.data);
        console.log(`📊 Loaded ${response.data.data.length} actions:`, response.data.data);
      }
    } catch (err) {
      console.error('❌ Error fetching actions:', err.response?.data || err.message);
    }
  };

  // Fetch available target types for dropdown
  const fetchAvailableTargetTypes = async () => {
    try {
      console.log('🔍 Fetching available target types...');
      const response = await axios.get('/api/audit/target-types', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Target types response:', response.data);
      if (response.data.success) {
        setAvailableTargetTypes(response.data.data);
        console.log(`📊 Loaded ${response.data.data.length} types:`, response.data.data);
      }
    } catch (err) {
      console.error('❌ Error fetching target types:', err.response?.data || err.message);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAuditLogs(1);
    fetchAvailableActions();
    fetchAvailableTargetTypes();
  }, []);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    fetchAuditLogs(1);
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setFilters({
      search: '',
      userRole: 'management',
      action: '',
      targetType: '',
      startDate: '',
      endDate: '',
      limit: 20
    });
    setCurrentPage(1);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchAuditLogs(currentPage);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchAuditLogs(page);
  };

  // View log details
  const viewLogDetails = (log) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  // Get action badge variant
  const getActionBadge = (action) => {
    const actionMap = {
      'stock_added': { variant: 'success', label: 'Stock Added' },
      'stock_deducted': { variant: 'warning', label: 'Stock Deducted' },
      'stock_adjusted': { variant: 'info', label: 'Stock Adjusted' },
      'item_created': { variant: 'primary', label: 'Item Created' },
      'item_updated': { variant: 'info', label: 'Item Updated' },
      'item_deleted': { variant: 'danger', label: 'Item Deleted' },
      'batch_created': { variant: 'success', label: 'Batch Created' },
      'batch_expired': { variant: 'secondary', label: 'Batch Expired' },
      'default': { variant: 'secondary', label: action }
    };

    return actionMap[action] || actionMap.default;
  };

  // Get target type badge
  const getTargetTypeBadge = (targetType) => {
    const typeMap = {
      'medication': { variant: 'primary', icon: 'bi-capsule' },
      'vaccine': { variant: 'success', icon: 'bi-shield-check' },
      'batch': { variant: 'info', icon: 'bi-box-seam' },
      'inventory': { variant: 'warning', icon: 'bi-box' },
      'default': { variant: 'secondary', icon: 'bi-file-earmark' }
    };

    return typeMap[targetType] || typeMap.default;
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    
    const dateObj = new Date(date);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    
    return dateObj.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Pagination component
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Custom Previous button
    pages.push(
      <Pagination.Item
        key="prev"
        disabled={currentPage === 1}
        onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
        className="custom-prev"
      >
        <i className="bi bi-chevron-left"></i>
      </Pagination.Item>
    );

    // First page
    if (startPage > 1) {
      pages.push(
        <Pagination.Item key={1} onClick={() => handlePageChange(1)}>
          1
        </Pagination.Item>
      );
      if (startPage > 2) {
        pages.push(<Pagination.Ellipsis key="ellipsis-start" disabled />);
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Pagination.Item
          key={i}
          active={i === currentPage}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Pagination.Item>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<Pagination.Ellipsis key="ellipsis-end" disabled />);
      }
      pages.push(
        <Pagination.Item key={totalPages} onClick={() => handlePageChange(totalPages)}>
          {totalPages}
        </Pagination.Item>
      );
    }

    // Custom Next button
    pages.push(
      <Pagination.Item
        key="next"
        disabled={currentPage === totalPages}
        onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
        className="custom-next"
      >
        <i className="bi bi-chevron-right"></i>
      </Pagination.Item>
    );

    return <Pagination className="management-pagination">{pages}</Pagination>;
  };

  return (
    <div className="management-audit-trail-container">
      {/* Filters */}
      <Card className="mb-3 management-filter-card">
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-medium">Search</Form.Label>
                <InputGroup size="sm">
                  <Form.Control
                    type="text"
                    placeholder="Search logs..."
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button variant="primary" onClick={handleSearch}>
                    <i className="bi bi-search"></i>
                  </Button>
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="small fw-medium">Action</Form.Label>
                <Form.Select
                  size="sm"
                  name="action"
                  value={filters.action}
                  onChange={handleFilterChange}
                >
                  <option value="">All Actions</option>
                  {availableActions.map(action => (
                    <option key={action} value={action}>
                      {action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="small fw-medium">Type</Form.Label>
                <Form.Select
                  size="sm"
                  name="targetType"
                  value={filters.targetType}
                  onChange={handleFilterChange}
                >
                  <option value="">All Types</option>
                  {availableTargetTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="small fw-medium">Start Date</Form.Label>
                <Form.Control
                  size="sm"
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                />
              </Form.Group>
            </Col>
            <Col md={1}>
              <Form.Group>
                <Form.Label className="small fw-medium">End Date</Form.Label>
                <Form.Control
                  size="sm"
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                />
              </Form.Group>
            </Col>
            <Col md={1}>
              <Form.Group>
                <Form.Label className="small fw-medium">&nbsp;</Form.Label>
                <div className="d-flex gap-1">
                  <Button 
                    variant="outline-success" 
                    size="sm"
                    className="icon-btn"
                    onClick={handleRefresh}
                    title="Refresh"
                  >
                    <i className="bi bi-arrow-clockwise"></i>
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    className="icon-btn"
                    onClick={handleResetFilters}
                    title="Clear Filters"
                  >
                    <i className="bi bi-x-circle"></i>
                  </Button>
                </div>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Results count and pagination */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <span className="text-muted">
            Showing {auditLogs.length} of {totalCount} logs
          </span>
        </div>
        {renderPagination()}
      </div>

      {/* Audit logs table */}
      <Card className="management-table-card">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Loading audit logs...</p>
            </div>
          ) : error ? (
            <Alert variant="danger" className="m-3">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
              <p className="mt-2 text-muted">No audit logs found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="management-audit-table mb-0">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Type</th>
                    <th>Target</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => {
                    const actionBadge = getActionBadge(log.action);
                    const typeBadge = getTargetTypeBadge(log.targetType);
                    
                    return (
                      <tr key={log.id}>
                        <td className="timestamp-cell">
                          <small>{formatDate(log.timestamp)}</small>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="user-avatar me-2">
                              {log.userName ? log.userName.charAt(0).toUpperCase() : 'M'}
                            </div>
                            <div>
                              <div className="fw-medium">{log.userName || 'Unknown User'}</div>
                              <small className="text-muted">{log.userRole || 'management'}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge bg={actionBadge.variant}>
                            {actionBadge.label}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={typeBadge.variant} className="d-flex align-items-center justify-content-center" style={{ width: 'fit-content' }}>
                            <i className={`${typeBadge.icon} me-1`}></i>
                            {log.targetType}
                          </Badge>
                        </td>
                        <td>
                          <span className="text-truncate d-inline-block" style={{ maxWidth: '150px' }}>
                            {log.targetName || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span className="text-truncate d-inline-block" style={{ maxWidth: '250px' }}>
                            {log.actionDescription || 'No description available'}
                          </span>
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => viewLogDetails(log)}
                          >
                            <i className="bi bi-eye"></i>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Bottom pagination */}
      <div className="d-flex justify-content-center mt-3">
        {renderPagination()}
      </div>

      {/* Log Details Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-file-earmark-text me-2"></i>
            Audit Log Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedLog && (
            <Row>
              <Col md={12}>
                <div className="log-details">
                  <div className="detail-row">
                    <strong>Timestamp:</strong>
                    <span>{formatDate(selectedLog.timestamp)}</span>
                  </div>
                  <div className="detail-row">
                    <strong>User:</strong>
                    <span>{selectedLog.userName || 'Unknown User'} ({selectedLog.userRole || 'management'})</span>
                  </div>
                  <div className="detail-row">
                    <strong>Action:</strong>
                    <Badge bg={getActionBadge(selectedLog.action).variant}>
                      {getActionBadge(selectedLog.action).label}
                    </Badge>
                  </div>
                  <div className="detail-row">
                    <strong>Target Type:</strong>
                    <span>{selectedLog.targetType}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Target Name:</strong>
                    <span>{selectedLog.targetName}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Description:</strong>
                    <span>{selectedLog.actionDescription || 'No description available'}</span>
                  </div>
                  <div className="detail-row">
                    <strong>IP Address:</strong>
                    <span>{selectedLog.ipAddress || 'N/A'}</span>
                  </div>
                  {selectedLog.metadata && (
                    <div className="detail-row">
                      <strong>Additional Details:</strong>
                      <div className="metadata-display">
                        {(() => {
                          try {
                            const metadata = typeof selectedLog.metadata === 'string' 
                              ? JSON.parse(selectedLog.metadata) 
                              : selectedLog.metadata;
                            
                            return (
                              <div className="bg-light p-3 rounded mt-2">
                                {Object.entries(metadata).map(([key, value]) => (
                                  <div key={key} className="mb-2">
                                    <strong className="text-success">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong>
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
                              <div className="bg-light p-3 rounded mt-2">
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
                </div>
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

export default ManagementAuditTrail;
