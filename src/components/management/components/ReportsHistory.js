import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Form, InputGroup } from 'react-bootstrap';
import LoadingManagementBar from '../LoadingManagementBar';

const ReportsHistory = ({ currentDateTime, isDarkMode }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    // Simulate loading reports data
    setTimeout(() => {
      setReports([
        { id: 1, title: 'Monthly Inventory Report - September 2025', type: 'Inventory', dateGenerated: new Date(2025, 8, 10), size: '2.4 MB', status: 'completed' },
        { id: 2, title: 'Patient Visit Analytics Q3 2025', type: 'Analytics', dateGenerated: new Date(2025, 8, 8), size: '1.8 MB', status: 'completed' },
        { id: 3, title: 'Medicine Usage Report - August 2025', type: 'Medicine', dateGenerated: new Date(2025, 8, 5), size: '3.2 MB', status: 'completed' },
        { id: 4, title: 'Equipment Maintenance Log', type: 'Equipment', dateGenerated: new Date(2025, 8, 3), size: '1.1 MB', status: 'completed' },
        { id: 5, title: 'Financial Summary Q3 2025', type: 'Financial', dateGenerated: new Date(2025, 8, 1), size: '4.7 MB', status: 'completed' },
        { id: 6, title: 'Custom Report - Health Trends', type: 'Custom', dateGenerated: new Date(2025, 7, 28), size: '2.9 MB', status: 'completed' },
        { id: 7, title: 'Weekly Inventory Check', type: 'Inventory', dateGenerated: new Date(2025, 7, 25), size: '1.5 MB', status: 'completed' }
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || report.type.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesType;
  });

  const getTypeColor = (type) => {
    switch (type.toLowerCase()) {
      case 'inventory': return 'primary';
      case 'analytics': return 'success';
      case 'medicine': return 'warning';
      case 'financial': return 'info';
      case 'equipment': return 'secondary';
      default: return 'dark';
    }
  };

  if (loading) {
    return <LoadingManagementBar message="Loading reports history..." />;
  }

  return (
    <div className="reports-history">
      <Row>
        <Col md={12}>
          <h3 className="section-title">Reports History</h3>
          <p className="section-description">View and manage your generated reports</p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={3}>
          <Form.Select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="inventory">Inventory</option>
            <option value="analytics">Analytics</option>
            <option value="medicine">Medicine</option>
            <option value="financial">Financial</option>
            <option value="equipment">Equipment</option>
          </Form.Select>
        </Col>
        <Col md={3}>
          <Button variant="outline-primary" className="w-100">
            <i className="bi bi-funnel me-2"></i>Advanced Filters
          </Button>
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5><i className="bi bi-clock-history me-2"></i>Generated Reports ({filteredReports.length})</h5>
              <div>
                <Button variant="outline-secondary" size="sm" className="me-2">
                  <i className="bi bi-download me-1"></i>Export List
                </Button>
                <Button variant="outline-danger" size="sm">
                  <i className="bi bi-trash me-1"></i>Bulk Delete
                </Button>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th width="5%">
                        <Form.Check type="checkbox" />
                      </th>
                      <th>Report Title</th>
                      <th>Type</th>
                      <th>Date Generated</th>
                      <th>File Size</th>
                      <th>Status</th>
                      <th width="15%">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map(report => (
                      <tr key={report.id}>
                        <td>
                          <Form.Check type="checkbox" />
                        </td>
                        <td>
                          <div className="report-title">
                            <strong>{report.title}</strong>
                          </div>
                        </td>
                        <td>
                          <span className={`badge bg-${getTypeColor(report.type)}`}>
                            {report.type}
                          </span>
                        </td>
                        <td>{report.dateGenerated.toLocaleDateString()}</td>
                        <td>{report.size}</td>
                        <td>
                          <span className="badge bg-success">
                            <i className="bi bi-check-circle me-1"></i>
                            {report.status}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <Button variant="outline-primary" size="sm" className="me-1">
                              <i className="bi bi-download"></i>
                            </Button>
                            <Button variant="outline-secondary" size="sm" className="me-1">
                              <i className="bi bi-eye"></i>
                            </Button>
                            <Button variant="outline-info" size="sm" className="me-1">
                              <i className="bi bi-share"></i>
                            </Button>
                            <Button variant="outline-danger" size="sm">
                              <i className="bi bi-trash"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <div className="stat-icon mb-3">
                <i className="bi bi-file-earmark-text text-primary" style={{fontSize: '2rem'}}></i>
              </div>
              <h4>{reports.length}</h4>
              <p className="text-muted">Total Reports</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <div className="stat-icon mb-3">
                <i className="bi bi-hdd text-info" style={{fontSize: '2rem'}}></i>
              </div>
              <h4>18.6 MB</h4>
              <p className="text-muted">Storage Used</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <div className="stat-icon mb-3">
                <i className="bi bi-calendar-week text-success" style={{fontSize: '2rem'}}></i>
              </div>
              <h4>3</h4>
              <p className="text-muted">This Week</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ReportsHistory;
