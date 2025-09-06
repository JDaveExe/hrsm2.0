import React from 'react';
import { Row, Col } from 'react-bootstrap';

const StatCards = ({ stats }) => {
  const {
    totalPatients = 3,
    totalFamilies = 50,
    activeCheckups = 0,
    completedToday = 0
  } = stats || {};

  const cardStyle = {
    backgroundColor: '#ffffff',
    border: '1px solid #e3e6f0',
    borderRadius: '0.35rem',
    boxShadow: '0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15)',
    padding: '1.5rem',
    marginBottom: '1rem',
    textAlign: 'center',
    minHeight: '120px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  };

  const numberStyle = {
    fontSize: '2rem',
    fontWeight: '700',
    lineHeight: '1.2',
    marginBottom: '0.5rem'
  };

  const labelStyle = {
    fontSize: '0.875rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#5a5c69'
  };

  return (
    <Row className="mb-4">
      <Col xl={3} md={6} className="mb-4">
        <div style={{...cardStyle, borderLeft: '0.25rem solid #4e73df'}}>
          <div style={{...numberStyle, color: '#4e73df'}}>
            {totalPatients}
          </div>
          <div style={labelStyle}>Total Patients</div>
          <div style={{fontSize: '0.75rem', color: '#858796', marginTop: '0.25rem'}}>
            Registered Individuals
          </div>
        </div>
      </Col>

      <Col xl={3} md={6} className="mb-4">
        <div style={{...cardStyle, borderLeft: '0.25rem solid #1cc88a'}}>
          <div style={{...numberStyle, color: '#1cc88a'}}>
            {totalFamilies}
          </div>
          <div style={labelStyle}>Total Families</div>
          <div style={{fontSize: '0.75rem', color: '#858796', marginTop: '0.25rem'}}>
            Household Groups
          </div>
        </div>
      </Col>

      <Col xl={3} md={6} className="mb-4">
        <div style={{...cardStyle, borderLeft: '0.25rem solid #36b9cc'}}>
          <div style={{...numberStyle, color: '#36b9cc'}}>
            {activeCheckups}
          </div>
          <div style={labelStyle}>Active Checkups</div>
          <div style={{fontSize: '0.75rem', color: '#858796', marginTop: '0.25rem'}}>
            Doctor Started Sessions
          </div>
        </div>
      </Col>

      <Col xl={3} md={6} className="mb-4">
        <div style={{...cardStyle, borderLeft: '0.25rem solid #f6c23e'}}>
          <div style={{...numberStyle, color: '#f6c23e'}}>
            {completedToday}
          </div>
          <div style={labelStyle}>Completed Today</div>
          <div style={{fontSize: '0.75rem', color: '#858796', marginTop: '0.25rem'}}>
            Finished Checkups
          </div>
        </div>
      </Col>
    </Row>
  );
};

export default StatCards;
