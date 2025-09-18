import React, { useState } from 'react';
import { Row, Col, Card, Form, Button } from 'react-bootstrap';

const ReportsGenerate = ({ currentDateTime, isDarkMode }) => {
  const [generatingReport, setGeneratingReport] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const handleGenerateReport = (type) => {
    setGeneratingReport(true);
    // Simulate report generation
    setTimeout(() => {
      setGeneratingReport(false);
      // Here you would typically call an API to generate the report
      alert(`${type} report generated successfully!`);
    }, 2000);
  };

  const reportTypes = [
    { id: 'inventory', name: 'Inventory Report', icon: 'bi-box-seam', description: 'Complete inventory status and stock levels' },
    { id: 'analytics', name: 'Analytics Report', icon: 'bi-graph-up', description: 'Patient visit and treatment analytics' },
    { id: 'medicine', name: 'Medicine Report', icon: 'bi-capsule', description: 'Medicine usage and availability' },
    { id: 'financial', name: 'Financial Report', icon: 'bi-currency-dollar', description: 'Financial summary and expenses' },
    { id: 'equipment', name: 'Equipment Report', icon: 'bi-tools', description: 'Equipment maintenance and status' },
    { id: 'custom', name: 'Custom Report', icon: 'bi-file-earmark-text', description: 'Create a custom report with selected data' }
  ];

  return (
    <div className="reports-generate">
      <Row>
        <Col md={12}>
          <h3 className="section-title">Generate New Report</h3>
          <p className="section-description">Select a report type and configure your parameters</p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={8}>
          <Card>
            <Card.Header>
              <h5><i className="bi bi-file-earmark-plus me-2"></i>Quick Generate</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                {reportTypes.map(report => (
                  <Col md={6} key={report.id} className="mb-3">
                    <div 
                      className={`report-type-card ${selectedReportType === report.id ? 'selected' : ''}`}
                      onClick={() => setSelectedReportType(report.id)}
                    >
                      <div className="report-icon">
                        <i className={report.icon}></i>
                      </div>
                      <div className="report-info">
                        <h6>{report.name}</h6>
                        <p>{report.description}</p>
                      </div>
                      <button 
                        className="btn btn-primary btn-sm"
                        disabled={generatingReport}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateReport(report.name);
                        }}
                      >
                        {generatingReport ? (
                          <i className="bi bi-hourglass-split spinning"></i>
                        ) : (
                          <i className="bi bi-download"></i>
                        )}
                      </button>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card>
            <Card.Header>
              <h5><i className="bi bi-gear me-2"></i>Report Configuration</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Date Range</Form.Label>
                  <Row>
                    <Col>
                      <Form.Control
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                      />
                    </Col>
                    <Col xs="auto" className="d-flex align-items-center">
                      <span>to</span>
                    </Col>
                    <Col>
                      <Form.Control
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                      />
                    </Col>
                  </Row>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Format</Form.Label>
                  <Form.Select>
                    <option value="pdf">PDF Document</option>
                    <option value="excel">Excel Spreadsheet</option>
                    <option value="csv">CSV File</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check 
                    type="checkbox"
                    label="Include charts and graphs"
                    defaultChecked
                  />
                  <Form.Check 
                    type="checkbox"
                    label="Email when ready"
                  />
                </Form.Group>

                <Button 
                  variant="primary" 
                  className="w-100"
                  disabled={!selectedReportType || generatingReport}
                >
                  {generatingReport ? 'Generating...' : 'Generate Selected Report'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          <Card>
            <Card.Header>
              <h5><i className="bi bi-lightning me-2"></i>Recent Activity</h5>
            </Card.Header>
            <Card.Body>
              <div className="activity-list">
                <div className="activity-item">
                  <div className="activity-icon success">
                    <i className="bi bi-check-circle"></i>
                  </div>
                  <div className="activity-content">
                    <strong>Inventory Report</strong> generated successfully
                    <small>2 minutes ago</small>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon info">
                    <i className="bi bi-info-circle"></i>
                  </div>
                  <div className="activity-content">
                    <strong>Analytics Report</strong> queued for generation
                    <small>5 minutes ago</small>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon warning">
                    <i className="bi bi-exclamation-triangle"></i>
                  </div>
                  <div className="activity-content">
                    <strong>Financial Report</strong> failed - insufficient data
                    <small>10 minutes ago</small>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ReportsGenerate;
