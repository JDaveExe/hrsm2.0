import React, { useState, useEffect, useCallback } from 'react';
import { useData } from '../../../context/DataContext';
import LoadingSpinnerDoc from './LoadingSpinnerDoc';
import '../styles/PatientQueue.css';

const PatientQueue = ({ 
  currentDateTime, 
  user, 
  secureApiCall, 
  onRefresh,
  onNavigate // Add navigation callback
}) => {
  const { 
    doctorQueueData,
    doctorCheckupsData,
    updateQueueStatus, 
    refreshDoctorQueue,
    refreshDoctorCheckups,
    refreshTodaysCheckups,
    startCheckupSession 
  } = useData();
  
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showTransferBanner, setShowTransferBanner] = useState(false);
  const [transferredPatientName, setTransferredPatientName] = useState('');

  // Load initial queue data when component mounts
  useEffect(() => {
    const loadInitialData = async () => {
      console.log('PatientQueue: Component mounted, loading initial queue data...');
      await refreshDoctorQueue();
      setIsInitialLoad(false);
    };
    loadInitialData();
  }, [refreshDoctorQueue]);

  // Add debugging for doctorQueueData changes
  useEffect(() => {
    console.log('PatientQueue: doctorQueueData changed:', {
      isArray: Array.isArray(doctorQueueData),
      length: doctorQueueData?.length,
      data: doctorQueueData
    });
  }, [doctorQueueData]);

  // Debug: Log doctorQueueData changes
  useEffect(() => {
    console.log('PatientQueue: doctorQueueData updated:', doctorQueueData);
    console.log('PatientQueue: doctorQueueData length:', doctorQueueData?.length);
    console.log('PatientQueue: doctorQueueData type:', typeof doctorQueueData);
  }, [doctorQueueData]);

  // Auto-refresh queue data every 30 seconds
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshDoctorQueue();
      }
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, [refreshDoctorQueue]);

  const handleStartCheckup = useCallback(async (patientId) => {
    if (isProcessing) return; // Prevent multiple clicks
    
    setIsProcessing(true);
    try {
      // Find the patient data
      const patient = doctorQueueData.find(p => p.id === patientId);
      if (!patient) {
        console.error('Patient not found in queue');
        return;
      }

      console.log('Starting checkup for patient:', patient.patientName);

      // Create checkup session
      const checkupResult = await startCheckupSession({
        patientId: patient.patientId,
        patientName: patient.patientName,
        age: patient.age,
        gender: patient.gender,
        contactNumber: patient.contactNumber,
        serviceType: patient.serviceType,
        priority: patient.priority,
        notes: patient.notes
      });

      if (checkupResult.success) {
        // Remove patient from queue (mark as transferred)
        const queueResult = await updateQueueStatus(patientId, 'transferred', {
          assignedDoctor: user?.id,
          startedAt: new Date().toISOString(),
          checkupSessionId: checkupResult.data.id
        });
        
        if (queueResult.success) {
          // Show transfer banner
          setTransferredPatientName(patient.patientName);
          setShowTransferBanner(true);
          
          // Refresh both queue and checkups data
          await refreshDoctorQueue();
          await refreshDoctorCheckups();
          onRefresh?.();
          
          console.log('Patient transferred successfully to Checkups section');
          
          // Auto-navigate to Checkups after 3 seconds
          setTimeout(() => {
            setShowTransferBanner(false);
            onNavigate?.('Checkups');
          }, 3000);
        } else {
          console.error('Failed to update queue status:', queueResult.error);
        }
      } else {
        console.error('Failed to start checkup session:', checkupResult.error);
      }
    } catch (error) {
      console.error('Failed to start checkup:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [doctorQueueData, startCheckupSession, updateQueueStatus, user?.id, refreshDoctorQueue, refreshDoctorCheckups, onRefresh, onNavigate, isProcessing]);

  const handleCompleteCheckup = useCallback(async (patientId) => {
    setIsProcessing(true);
    try {
      const result = await updateQueueStatus(patientId, 'completed', {
        completedAt: new Date().toISOString(),
        completedBy: user?.id
      });
      
      if (result.success) {
        // Refresh queue to get latest data
        await refreshDoctorQueue();
        onRefresh?.();
      } else {
        console.error('Failed to complete checkup:', result.error);
      }
    } catch (error) {
      console.error('Failed to complete checkup:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [updateQueueStatus, user?.id, refreshDoctorQueue, onRefresh]);

  const filteredQueue = (doctorQueueData || []).filter(patient => {
    if (filterStatus === 'all') return true;
    return patient.status === filterStatus;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      'waiting': { class: 'warning', icon: 'bi-clock', text: 'Waiting' },
      'in-progress': { class: 'primary', icon: 'bi-play-circle', text: 'In Progress' },
      'completed': { class: 'success', icon: 'bi-check-circle', text: 'Completed' },
      'cancelled': { class: 'danger', icon: 'bi-x-circle', text: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig['waiting'];
    
    return (
      <span className={`status-badge status-${config.class}`}>
        <i className={`bi ${config.icon}`}></i>
        {config.text}
      </span>
    );
  };

  if (isInitialLoad) {
    return <LoadingSpinnerDoc message="Loading patient queue..." />;
  }

  console.log('PatientQueue: Rendering with doctorQueueData:', doctorQueueData);
  console.log('PatientQueue: Filtered queue length:', filteredQueue.length);

  return (
    <div className="patient-queue-container">
      {/* Transfer Banner */}
      {showTransferBanner && (
        <div className="transfer-banner">
          <div className="banner-content">
            <i className="bi bi-check-circle-fill"></i>
            <span>
              <strong>{transferredPatientName}</strong> has been transferred to Doctor Checkup. 
              Redirecting in 3 seconds...
            </span>
          </div>
        </div>
      )}
      
      <div className="queue-header">
        <div className="header-info">
          <h2>
            <i className="bi bi-people"></i>
            Patient Queue
          </h2>
          <p className="queue-subtitle">
            Manage your patient appointments and checkups
          </p>
        </div>
        
        <div className="queue-stats">
          <div className="stat-card waiting">
            <div className="stat-number">
              {(doctorQueueData || []).filter(p => p.status === 'waiting').length}
            </div>
            <div className="stat-label">Waiting</div>
          </div>
          <div className="stat-card in-progress">
            <div className="stat-number">
              {(doctorQueueData || []).filter(p => p.status === 'in-progress').length}
            </div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card completed">
            <div className="stat-number">
              {(doctorQueueData || []).filter(p => p.status === 'completed').length}
            </div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
      </div>

      <div className="queue-filters">
        <div className="filter-buttons">
          {['all', 'waiting', 'in-progress', 'completed'].map(status => (
            <button
              key={status}
              className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
              onClick={() => setFilterStatus(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="queue-content">
        {filteredQueue.length === 0 ? (
          <div className="empty-queue">
            <i className="bi bi-inbox"></i>
            <h3>No patients in queue</h3>
            <p>
              {filterStatus === 'all' 
                ? 'There are currently no patients in the queue.'
                : `No patients with status: ${filterStatus.replace('-', ' ')}`
              }
            </p>
          </div>
        ) : (
          <div className="queue-grid">
            {filteredQueue.map((patient, index) => (
              <div 
                key={patient.id} 
                className={`queue-card ${patient.status}`}
              >
                <div className="queue-number">
                  {index + 1}
                </div>
                <div className="card-header">
                  <div className="patient-info">
                    <h4>{patient.patientName}</h4>
                    <p className="patient-id">ID: {patient.patientId}</p>
                    <p className="patient-details">{patient.age} / {patient.gender}</p>
                  </div>
                  {getStatusBadge(patient.status)}
                </div>
                
                <div className="card-body">
                  <div className="appointment-details">
                    <div className="detail-item">
                      <i className="bi bi-clock"></i>
                      <span>Check-in: {patient.checkInTime}</span>
                    </div>
                    {patient.queuedAt && (
                      <div className="detail-item">
                        <i className="bi bi-hourglass-split"></i>
                        <span>Queued: {patient.queuedAt}</span>
                      </div>
                    )}
                    <div className="detail-item">
                      <i className="bi bi-card-text"></i>
                      <span>Service: {patient.serviceType}</span>
                    </div>
                    <div className="detail-item">
                      <i className="bi bi-flag"></i>
                      <span>Priority: {patient.priority}</span>
                    </div>
                    {patient.contactNumber && (
                      <div className="detail-item">
                        <i className="bi bi-telephone"></i>
                        <span>Contact: {patient.contactNumber}</span>
                      </div>
                    )}
                    {patient.notes && (
                      <div className="detail-item">
                        <i className="bi bi-sticky"></i>
                        <span>Notes: {patient.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="card-actions">
                  {patient.status === 'waiting' && (
                    <button
                      className="btn btn-primary"
                      onClick={() => handleStartCheckup(patient.id)}
                      disabled={isProcessing}
                    >
                      <i className="bi bi-play-circle"></i>
                      Start Checkup
                    </button>
                  )}
                  
                  {patient.status === 'in-progress' && (
                    <button
                      className="btn btn-success"
                      onClick={() => handleCompleteCheckup(patient.id)}
                      disabled={isProcessing}
                    >
                      <i className="bi bi-check-circle"></i>
                      Complete Checkup
                    </button>
                  )}
                  
                  <button
                    className="btn btn-outline"
                    onClick={() => setSelectedPatient(patient)}
                  >
                    <i className="bi bi-eye"></i>
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Patient Details Modal */}
      {selectedPatient && (
        <div className="modal-overlay" onClick={() => setSelectedPatient(null)}>
          <div className="modal-content modal-medium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Patient Details</h3>
              <button 
                className="close-btn" 
                onClick={() => setSelectedPatient(null)}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="patient-details">
                <div className="detail-row">
                  <strong>Name:</strong> {selectedPatient.name}
                </div>
                <div className="detail-row">
                  <strong>Patient ID:</strong> {selectedPatient.id}
                </div>
                <div className="detail-row">
                  <strong>Status:</strong> {getStatusBadge(selectedPatient.status)}
                </div>
                <div className="detail-row">
                  <strong>Patient ID:</strong> {selectedPatient.patientId}
                </div>
                <div className="detail-row">
                  <strong>Age / Gender:</strong> {selectedPatient.age} / {selectedPatient.gender}
                </div>
                <div className="detail-row">
                  <strong>Check-in Time:</strong> {selectedPatient.checkInTime}
                </div>
                {selectedPatient.queuedAt && (
                  <div className="detail-row">
                    <strong>Queued At:</strong> {selectedPatient.queuedAt}
                  </div>
                )}
                <div className="detail-row">
                  <strong>Service Type:</strong> {selectedPatient.serviceType}
                </div>
                <div className="detail-row">
                  <strong>Priority:</strong> {selectedPatient.priority}
                </div>
                {selectedPatient.contactNumber && (
                  <div className="detail-row">
                    <strong>Contact:</strong> {selectedPatient.contactNumber}
                  </div>
                )}
                {selectedPatient.vitalSigns && (
                  <div className="detail-row">
                    <strong>Vital Signs:</strong> Available
                  </div>
                )}
                {selectedPatient.notes && (
                  <div className="detail-row">
                    <strong>Notes:</strong> {selectedPatient.notes}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setSelectedPatient(null)}
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

export default PatientQueue;
