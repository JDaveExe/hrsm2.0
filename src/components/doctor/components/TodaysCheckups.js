import React, { useState, useEffect } from 'react';
import { Table, Form } from 'react-bootstrap';
import { useData } from '../../../context/DataContext';
import LoadingSpinnerDoc from './LoadingSpinnerDoc';
import '../styles/TodaysCheckups.css';

const TodaysCheckups = ({ 
  currentDateTime, 
  user, 
  secureApiCall 
}) => {
  const { 
    sharedCheckupsData, 
    refreshTodaysCheckups 
  } = useData();
  
  const [selectedCheckup, setSelectedCheckup] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // Load initial checkups data when component mounts
  useEffect(() => {
    refreshTodaysCheckups();
  }, [refreshTodaysCheckups]);

  // Auto-refresh checkups data every 30 seconds
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshTodaysCheckups();
      }
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, [refreshTodaysCheckups]);

  const filteredCheckups = sharedCheckupsData.filter(checkup => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'completed') {
      return checkup.status === 'completed' || checkup.status === 'vaccination-completed';
    }
    return checkup.status === filterStatus;
  });

  // Helper functions from admin component
  const getCheckInMethodIcon = (method) => {
    const methodConfig = {
      'qr-code': { icon: 'bi-qr-code', title: 'QR Code Check-in' },
      'qr-scan': { icon: 'bi-qr-code-scan', title: 'QR Code Scan Check-in' },
      'staff-assisted': { icon: 'bi-person-check', title: 'Staff Assisted' },
      'online': { icon: 'bi-globe', title: 'Online Check-in' }
    };
    
    const config = methodConfig[method] || methodConfig['staff-assisted'];
    
    return (
      <i 
        className={`bi ${config.icon} method-icon`} 
        title={config.title}
      ></i>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      'Normal': { class: 'bg-success', text: 'Normal' },
      'High': { class: 'bg-warning', text: 'High' },
      'Emergency': { class: 'bg-danger', text: 'Emergency' }
    };
    
    const config = priorityConfig[priority] || priorityConfig['Normal'];
    
    return (
      <span className={`badge ${config.class}`}>
        {config.text}
      </span>
    );
  };

  const getStatusBadge = (checkup) => {
    const statusConfig = {
      'checked-in': { class: 'bg-info', text: 'Checked In' },
      'vitals-recorded': { class: 'bg-primary', text: 'Vitals Recorded' },
      'doctor-notified': { class: 'bg-warning', text: 'Doctor Notified' },
      'in-progress': { class: 'bg-warning', text: 'In Progress' },
      'started': { class: 'bg-warning', text: 'Started' },
      'transferred': { class: 'bg-secondary', text: 'Transferred' },
      'completed': { class: 'bg-success', text: 'Completed' },
      'vaccination-completed': { class: 'bg-success', text: 'Vaccination Complete' },
      'cancelled': { class: 'bg-danger', text: 'Cancelled' }
    };
    
    const config = statusConfig[checkup.status] || statusConfig['checked-in'];
    
    return (
      <span className={`badge ${config.class}`}>
        {config.text}
      </span>
    );
  };

  const formatTime = (timeString) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!sharedCheckupsData) {
    return <LoadingSpinnerDoc message="Loading today's checkups..." />;
  }

  return (
    <div className="todays-checkups-container">
      <div className="todays-checkups-header">
        <div className="header-info">
          <h2>
            <i className="bi bi-calendar-check"></i>
            Today's Checkups
          </h2>
          <p className="checkups-subtitle">
            {formatDate(currentDateTime)} - Read-only view of scheduled checkups
          </p>
        </div>
        
        <div className="checkups-stats">
          <div className="stat-card scheduled">
            <div className="stat-number">
              {sharedCheckupsData.filter(c => c.status === 'scheduled' || c.status === 'checked-in').length}
            </div>
            <div className="stat-label">Scheduled</div>
          </div>
          <div className="stat-card in-progress">
            <div className="stat-number">
              {sharedCheckupsData.filter(c => c.status === 'in-progress' || c.status === 'vitals-recorded').length}
            </div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card completed">
            <div className="stat-number">
              {sharedCheckupsData.filter(c => c.status === 'completed' || c.status === 'vaccination-completed').length}
            </div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
      </div>

      <div className="checkups-filters">
        <div className="filter-buttons">
          {['all', 'scheduled', 'in-progress', 'completed'].map(status => (
            <button
              key={status}
              className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
              onClick={() => setFilterStatus(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>
        
        <div className="read-only-notice">
          <i className="bi bi-info-circle"></i>
          <span>Read-only view - Updates sync from main system</span>
        </div>
      </div>

      <div className="checkups-content">
        {filteredCheckups.length === 0 ? (
          <div className="empty-checkups">
            <i className="bi bi-calendar-x"></i>
            <h3>No checkups found</h3>
            <p>
              {filterStatus === 'all' 
                ? 'There are no checkups scheduled for today.'
                : `No checkups with status: ${filterStatus.replace('-', ' ')}`
              }
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <Table hover responsive className="checkup-table">
              <thead>
                <tr>
                  <th style={{width: '3%'}}>#</th>
                  <th style={{width: '4%'}}>Method</th>
                  <th style={{width: '8%'}}>Patient ID</th>
                  <th style={{width: '15%'}}>Patient Name</th>
                  <th style={{width: '8%'}}>Age/Gender</th>
                  <th style={{width: '10%'}}>Check-in Time</th>
                  <th style={{width: '15%'}}>Service Type</th>
                  <th style={{width: '8%'}}>Priority</th>
                  <th style={{width: '10%'}}>Status</th>
                  <th style={{width: '19%'}}>Info</th>
                </tr>
              </thead>
              <tbody>
                {filteredCheckups.map((checkup, index) => (
                  <tr key={checkup.id} className="checkup-row">
                    <td className="row-number">{index + 1}</td>
                    <td className="method-cell">{getCheckInMethodIcon(checkup.checkInMethod)}</td>
                    <td className="patient-id">{checkup.patientId}</td>
                    <td className="patient-name">
                      <div>
                        <strong>{checkup.patientName}</strong>
                        <br />
                        <small className="text-muted">{checkup.contactNumber}</small>
                      </div>
                    </td>
                    <td>{checkup.age} / {checkup.gender}</td>
                    <td>{checkup.checkInTime}</td>
                    <td>
                      <span className="badge bg-secondary">
                        {checkup.serviceType || 'Select Service'}
                      </span>
                    </td>
                    <td>{getPriorityBadge(checkup.priority)}</td>
                    <td>{getStatusBadge(checkup)}</td>
                    <td>
                      <div className="info-buttons">
                        <small className="text-muted d-block">
                          Read-only view
                        </small>
                        <button
                          className="btn btn-sm btn-outline-info"
                          onClick={() => setSelectedCheckup(checkup)}
                          style={{ fontSize: '11px', padding: '2px 6px' }}
                        >
                          <i className="bi bi-eye"></i> View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </div>

      {/* Checkup Details Modal */}
      {selectedCheckup && (
        <div className="modal-overlay" onClick={() => setSelectedCheckup(null)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Checkup Details</h3>
              <button 
                className="close-btn" 
                onClick={() => setSelectedCheckup(null)}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="checkup-details-modal">
                <div className="detail-section">
                  <h4>Patient Information</h4>
                  <div className="detail-row">
                    <strong>Name:</strong> {selectedCheckup.patientName}
                  </div>
                  <div className="detail-row">
                    <strong>Patient ID:</strong> {selectedCheckup.patientId}
                  </div>
                  <div className="detail-row">
                    <strong>Age:</strong> {selectedCheckup.patientAge || 'N/A'}
                  </div>
                  <div className="detail-row">
                    <strong>Gender:</strong> {selectedCheckup.patientGender || 'N/A'}
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Appointment Information</h4>
                  <div className="detail-row">
                    <strong>Status:</strong> {getStatusBadge(selectedCheckup.status)}
                  </div>
                  <div className="detail-row">
                    <strong>Scheduled Time:</strong> {formatTime(selectedCheckup.scheduledTime)}
                  </div>
                  <div className="detail-row">
                    <strong>Doctor:</strong> Dr. {selectedCheckup.doctorName}
                  </div>
                  <div className="detail-row">
                    <strong>Type:</strong> {selectedCheckup.checkupType || 'General Checkup'}
                  </div>
                  {selectedCheckup.priority && (
                    <div className="detail-row">
                      <strong>Priority:</strong> {selectedCheckup.priority}
                    </div>
                  )}
                </div>

                {selectedCheckup.notes && (
                  <div className="detail-section">
                    <h4>Notes</h4>
                    <div className="notes-content">
                      {selectedCheckup.notes}
                    </div>
                  </div>
                )}

                {selectedCheckup.results && (
                  <div className="detail-section">
                    <h4>Results</h4>
                    <div className="results-content">
                      {selectedCheckup.results}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setSelectedCheckup(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodaysCheckups;
