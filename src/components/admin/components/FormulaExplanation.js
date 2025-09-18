import React, { useState } from 'react';
import { Card, Row, Col, Badge, Collapse, Button, Table } from 'react-bootstrap';

const FormulaExplanation = ({ calculation, type = 'disease', title }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!calculation) return null;

  return (
    <Card className="formula-card">
      <Card.Body>
        <div className="formula-title">
          <i className="bi bi-calculator-fill"></i>
          {title || `${type === 'disease' ? 'Disease Risk' : 'Resource Forecast'} Calculation`}
        </div>

        {/* Main Formula Display */}
        {calculation.formula && (
          <div className="formula-equation">
            {calculation.formula}
          </div>
        )}

        {/* Method Description */}
        {calculation.method && (
          <div className="formula-explanation">
            <strong>Method:</strong> {calculation.method}
          </div>
        )}

        {/* Toggle Details Button */}
        <Button 
          variant="outline-primary" 
          size="sm" 
          onClick={() => setShowDetails(!showDetails)}
          className="mt-2"
        >
          <i className={`bi bi-chevron-${showDetails ? 'up' : 'down'} me-1`}></i>
          {showDetails ? 'Hide' : 'Show'} Calculation Details
        </Button>

        {/* Detailed Calculation Steps */}
        <Collapse in={showDetails}>
          <div className="mt-3">
            {/* Calculation Steps */}
            {calculation.steps && calculation.steps.length > 0 && (
              <div className="calculation-steps">
                <h6>Step-by-Step Calculation:</h6>
                <ol>
                  {calculation.steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
                {calculation.finalScore && (
                  <div className="mt-2">
                    <Badge bg="primary">{calculation.finalScore}</Badge>
                  </div>
                )}
              </div>
            )}

            {/* Thresholds */}
            {calculation.thresholds && (
              <div className="mt-3">
                <h6 className="text-primary">Risk Level Thresholds:</h6>
                <Table size="sm" className="mb-0">
                  <tbody>
                    {Object.entries(calculation.thresholds).map(([level, threshold]) => (
                      <tr key={level}>
                        <td>
                          <Badge bg={
                            level === 'low' ? 'success' : 
                            level === 'medium' ? 'warning' : 
                            level === 'high' ? 'danger' : 'dark'
                          }>
                            {level.toUpperCase()}
                          </Badge>
                        </td>
                        <td>{threshold}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}

            {/* Data Quality Information */}
            {calculation.dataQuality && (
              <div className="mt-3">
                <h6 className="text-primary">Data Quality Metrics:</h6>
                <Row>
                  <Col xs={4}>
                    <small className="text-muted">Data Points:</small>
                    <div className="fw-bold">{calculation.dataQuality.points}</div>
                  </Col>
                  <Col xs={4}>
                    <small className="text-muted">Standard Error:</small>
                    <div className="fw-bold">{calculation.dataQuality.standardError}</div>
                  </Col>
                  <Col xs={4}>
                    <small className="text-muted">Period:</small>
                    <div className="fw-bold">{calculation.dataQuality.period} days</div>
                  </Col>
                </Row>
              </div>
            )}

            {/* Confidence Level */}
            {calculation.confidence && (
              <div className="mt-3">
                <h6 className="text-primary">Prediction Confidence:</h6>
                <Badge bg={
                  parseFloat(calculation.confidence) >= 80 ? 'success' : 
                  parseFloat(calculation.confidence) >= 60 ? 'warning' : 'danger'
                } size="lg">
                  {calculation.confidence}
                </Badge>
              </div>
            )}

            {/* Accuracy Metrics for Resource Forecasts */}
            {calculation.accuracy && (
              <div className="mt-3">
                <h6 className="text-primary">Forecast Accuracy:</h6>
                <Row>
                  <Col xs={4}>
                    <small className="text-muted">MSE:</small>
                    <div className="fw-bold">{calculation.accuracy.mse}</div>
                  </Col>
                  <Col xs={4}>
                    <small className="text-muted">Std Error:</small>
                    <div className="fw-bold">{calculation.accuracy.standardError}</div>
                  </Col>
                  <Col xs={4}>
                    <small className="text-muted">Confidence:</small>
                    <Badge bg={
                      calculation.accuracy.confidence === 'High' ? 'success' : 
                      calculation.accuracy.confidence === 'Medium' ? 'warning' : 'danger'
                    }>
                      {calculation.accuracy.confidence}
                    </Badge>
                  </Col>
                </Row>
              </div>
            )}
          </div>
        </Collapse>
      </Card.Body>
    </Card>
  );
};

export default FormulaExplanation;
