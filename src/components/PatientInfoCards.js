import React from 'react';

const PatientInfoCards = ({ selectedPatient }) => {
  return (
    <div className="row g-3 mb-4">
      {/* Personal Information Card */}
      <div className="col-md-6">
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          <div style={{
            background: 'var(--accent-primary)',
            color: 'white',
            padding: '12px 16px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className="bi bi-person-circle"></i>
            Personal Information
          </div>
          <div style={{padding: '16px'}}>
            <div className="row g-2">
              <div className="col-4">
                <small style={{color: 'var(--text-secondary)', fontWeight: 500}}>Age</small>
                <div style={{color: 'var(--text-primary)', fontWeight: 500}}>
                  {selectedPatient.age || 'N/A'}
                </div>
              </div>
              <div className="col-4">
                <small style={{color: 'var(--text-secondary)', fontWeight: 500}}>Gender</small>
                <div style={{color: 'var(--text-primary)', fontWeight: 500}}>
                  {selectedPatient.gender || 'N/A'}
                </div>
              </div>
              <div className="col-4">
                <small style={{color: 'var(--text-secondary)', fontWeight: 500}}>Civil Status</small>
                <div style={{color: 'var(--text-primary)', fontWeight: 500}}>
                  {selectedPatient.civilStatus || 'N/A'}
                </div>
              </div>
              <div className="col-6">
                <small style={{color: 'var(--text-secondary)', fontWeight: 500}}>Date of Birth</small>
                <div style={{color: 'var(--text-primary)', fontWeight: 500}}>
                  {selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              <div className="col-6">
                <small style={{color: 'var(--text-secondary)', fontWeight: 500}}>Blood Type</small>
                <div style={{color: 'var(--text-primary)', fontWeight: 500}}>
                  {selectedPatient.bloodType || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information Card */}
      <div className="col-md-6">
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          <div style={{
            background: 'var(--success)',
            color: 'white',
            padding: '12px 16px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className="bi bi-telephone"></i>
            Contact Information
          </div>
          <div style={{padding: '16px'}}>
            <div className="mb-2">
              <small style={{color: 'var(--text-secondary)', fontWeight: 500}}>Phone</small>
              <div style={{color: 'var(--text-primary)', fontWeight: 500}}>
                {selectedPatient.contactNumber || 'N/A'}
              </div>
            </div>
            <div className="mb-2">
              <small style={{color: 'var(--text-secondary)', fontWeight: 500}}>Email</small>
              <div style={{color: 'var(--warning)', fontWeight: 500}}>
                {selectedPatient.email || 'N/A'}
              </div>
            </div>
            <div className="mb-2">
              <small style={{color: 'var(--text-secondary)', fontWeight: 500}}>PhilHealth Number</small>
              <div style={{color: 'var(--text-primary)', fontWeight: 500}}>
                {selectedPatient.philHealthNumber || 'N/A'}
              </div>
            </div>
            <div>
              <small style={{color: 'var(--text-secondary)', fontWeight: 500}}>Address</small>
              <div style={{color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.9rem'}}>
                {selectedPatient.formattedAddress || selectedPatient.address || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientInfoCards;
