import React from 'react';
import { Card, Row, Col, ProgressBar } from 'react-bootstrap';

const ConfidenceIntervals = ({ intervals, forecast, title = "Confidence Intervals" }) => {
  if (!intervals) return null;

  const calculateWidth = (value, max) => {
    return Math.min(100, (value / max) * 100);
  };

  const maxValue = Math.max(
    intervals.daily95?.upper || 0,
    intervals.total95?.upper || 0,
    forecast || 0
  );

  return (
    <Card className="confidence-intervals">
      <Card.Header>
        <h6 className="mb-0">
          <i className="bi bi-graph-up me-2"></i>
          {title}
        </h6>
      </Card.Header>
      <Card.Body>
        <small className="text-muted">
          Confidence intervals show the range where the actual value is likely to fall.
        </small>
        
        {/* Daily Forecasts */}
        {intervals.daily68 && intervals.daily95 && (
          <div className="mt-3">
            <h6 className="text-primary mb-2">Daily Forecast Ranges</h6>
            
            {/* 68% Confidence (1 standard deviation) */}
            <div className="confidence-level">
              <span className="confidence-label">68% Confidence:</span>
              <span className="confidence-range">
                {intervals.daily68.lower} - {intervals.daily68.upper} units/day
              </span>
            </div>
            
            {/* Visual representation for 68% */}
            <div className="mb-2">
              <ProgressBar>
                <ProgressBar 
                  variant="info" 
                  now={calculateWidth(intervals.daily68.lower, maxValue)} 
                  style={{ opacity: 0.3 }}
                />
                <ProgressBar 
                  variant="info" 
                  now={calculateWidth(intervals.daily68.upper - intervals.daily68.lower, maxValue)} 
                />
              </ProgressBar>
              <small className="text-muted">68% of predictions fall in this range</small>
            </div>

            {/* 95% Confidence (2 standard deviations) */}
            <div className="confidence-level">
              <span className="confidence-label">95% Confidence:</span>
              <span className="confidence-range">
                {intervals.daily95.lower} - {intervals.daily95.upper} units/day
              </span>
            </div>
            
            {/* Visual representation for 95% */}
            <div className="mb-3">
              <ProgressBar>
                <ProgressBar 
                  variant="primary" 
                  now={calculateWidth(intervals.daily95.lower, maxValue)} 
                  style={{ opacity: 0.3 }}
                />
                <ProgressBar 
                  variant="primary" 
                  now={calculateWidth(intervals.daily95.upper - intervals.daily95.lower, maxValue)} 
                />
              </ProgressBar>
              <small className="text-muted">95% of predictions fall in this range</small>
            </div>
          </div>
        )}

        {/* Total Period Forecasts */}
        {intervals.total68 && intervals.total95 && (
          <div className="mt-3">
            <h6 className="text-primary mb-2">30-Day Total Ranges</h6>
            
            <div className="confidence-level">
              <span className="confidence-label">68% Confidence:</span>
              <span className="confidence-range">
                {intervals.total68.lower} - {intervals.total68.upper} units
              </span>
            </div>
            
            <div className="confidence-level">
              <span className="confidence-label">95% Confidence:</span>
              <span className="confidence-range">
                {intervals.total95.lower} - {intervals.total95.upper} units
              </span>
            </div>
          </div>
        )}

        {/* Point Forecast */}
        {forecast && (
          <div className="mt-3 text-center">
            <h6 className="text-success">Point Forecast</h6>
            <div className="h4 text-success">{forecast} units/day</div>
            <small className="text-muted">Most likely outcome</small>
          </div>
        )}

        {/* Explanation */}
        <div className="mt-3 p-2" style={{ backgroundColor: 'rgba(0, 123, 255, 0.05)', borderRadius: '6px' }}>
          <small className="text-muted">
            <strong>Interpretation:</strong> 
            <ul className="mb-0 mt-1">
              <li>68% confidence = There's a 68% chance the actual value will be in this range</li>
              <li>95% confidence = There's a 95% chance the actual value will be in this range</li>
              <li>Wider ranges indicate higher uncertainty in the forecast</li>
            </ul>
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ConfidenceIntervals;
