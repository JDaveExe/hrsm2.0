import React, { useState, useEffect } from 'react';
import { Modal, Button, Table } from 'react-bootstrap';
import { useVitalSignsHistory } from '../../hooks/useVitalSigns';
import './styles/ActionModals.css';

const VitalSignsHistoryModal = ({ show, onHide, selectedPatient, isDarkMode = false }) => {
  // Get patient ID (could be id, patientId, or patient_id)
  const patientId = selectedPatient?.id || selectedPatient?.patientId || selectedPatient?.patient_id;
  
  // Use TanStack Query hook for vital signs history
  const { data: vitalSignsHistory = [], isLoading: loading, error } = useVitalSignsHistory(patientId, {
    enabled: show && !!patientId // Only fetch when modal is shown and we have a patient ID
  });

  // State to store vaccination records for cross-referencing
  const [vaccinationRecords, setVaccinationRecords] = useState([]);

  // Fetch vaccination records for this patient to check if vital signs are vaccination-related
  useEffect(() => {
    if (!show || !patientId) return;

    const fetchVaccinationRecords = async () => {
      try {
        const response = await fetch(`/api/vaccinations/patient/${patientId}`);
        if (response.ok) {
          const data = await response.json();
          setVaccinationRecords(data || []);
        }
      } catch (error) {
        console.log('Could not fetch vaccination records:', error);
        setVaccinationRecords([]);
      }
    };

    fetchVaccinationRecords();
  }, [show, patientId]);

  // Check if a vital signs record is from the same date as a vaccination
  const isVaccinationRelated = (vitalSignsDate) => {
    const vsDate = new Date(vitalSignsDate).toDateString();
    return vaccinationRecords.some(vax => {
      const vaxDate = new Date(vax.administeredAt).toDateString();
      return vsDate === vaxDate;
    });
  };

  // Helper function to display empty field value
  const getEmptyFieldDisplay = (record) => {
    return isVaccinationRelated(record.recordedAt) 
      ? <span className="text-info">vaccination</span> 
      : <span className="text-muted">-</span>;
  };

  const getPatientFullName = (patient) => {
    if (!patient) return 'Unknown Patient';
    return `${patient.firstName || ''} ${patient.middleName || ''} ${patient.lastName || ''}`.replace(/\s+/g, ' ').trim();
  };

  const getPatientAge = (patient) => {
    if (!patient?.dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(patient.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getVitalSignBadgeClass = (type, value) => {
    switch (type) {
      case 'temperature':
        if (value >= 36.1 && value <= 37.2) return 'bg-success';
        if (value > 37.2) return 'bg-danger';
        return 'bg-warning';
      case 'heartRate':
        if (value >= 60 && value <= 100) return 'bg-success';
        return 'bg-warning';
      case 'bloodPressure':
        const [systolic, diastolic] = value.split('/').map(Number);
        if (systolic >= 90 && systolic <= 120 && diastolic >= 60 && diastolic <= 80) return 'bg-success';
        return 'bg-warning';
      case 'respiratoryRate':
        if (value >= 12 && value <= 20) return 'bg-success';
        return 'bg-warning';
      case 'oxygenSaturation':
        if (value >= 95) return 'bg-success';
        return 'bg-warning';
      default:
        return 'bg-secondary';
    }
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      dialogClassName="action-modal-wide"
      centered
      className="vital-signs-history-modal"
    >
      <Modal.Header 
        closeButton 
        style={{
          background: '#0ea5e9', 
          color: '#ffffff', 
          border: 'none',
          borderRadius: '12px 12px 0 0'
        }}
      >
        <Modal.Title className="w-100 text-center fw-bold fs-4">
          <i className="bi bi-graph-up me-2"></i>
          Vital Signs History
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{
        background: isDarkMode ? '#1e293b' : '#ffffff', 
        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
        padding: '32px',
        minHeight: '50vh'
      }}>
        {selectedPatient && (
          <div className="mb-4">
            <div className="d-flex align-items-center mb-3">
              <div className="me-3">
                <i className="bi bi-person-circle" style={{fontSize: '2.5rem', color: '#0ea5e9'}}></i>
              </div>
              <div>
                <h5 className="mb-1" style={{color: isDarkMode ? '#e2e8f0' : '#2c3e50'}}>
                  {getPatientFullName(selectedPatient)}
                </h5>
                <p className="mb-0" style={{color: isDarkMode ? '#94a3b8' : '#6c757d'}}>
                  Patient ID: PT-{String(selectedPatient.id).padStart(4, '0')} | Age: {getPatientAge(selectedPatient)} years
                </p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading vital signs history...</p>
          </div>
        ) : !Array.isArray(vitalSignsHistory) || vitalSignsHistory.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-clipboard-x" style={{fontSize: '4rem', color: '#6c757d'}}></i>
            <h5 className="mt-3" style={{color: isDarkMode ? '#94a3b8' : '#6c757d'}}>No Vital Signs Records</h5>
            <p style={{color: isDarkMode ? '#94a3b8' : '#6c757d'}}>
              No vital signs have been recorded for this patient yet.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead style={{background: isDarkMode ? '#334155' : '#f8f9fa'}}>
                <tr>
                  <th>Date & Time</th>
                  <th>Temperature</th>
                  <th>Heart Rate</th>
                  <th>Blood Pressure</th>
                  <th>Resp. Rate</th>
                  <th>O2 Sat</th>
                  <th>Weight</th>
                  <th>Height</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {vitalSignsHistory.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <div>
                        <strong>{new Date(record.recordedAt).toLocaleDateString()}</strong>
                      </div>
                      <small className="text-muted">
                        {new Date(record.recordedAt).toLocaleTimeString()}
                      </small>
                    </td>
                    <td>
                      <span className={`badge ${getVitalSignBadgeClass('temperature', record.temperature)}`}>
                        {record.temperature}°C
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getVitalSignBadgeClass('heartRate', record.heartRate)}`}>
                        {record.heartRate} bpm
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getVitalSignBadgeClass('bloodPressure', `${record.systolicBP}/${record.diastolicBP}`)}`}>
                        {record.systolicBP}/{record.diastolicBP}
                      </span>
                    </td>
                    <td>
                      {record.respiratoryRate ? (
                        <span className={`badge ${getVitalSignBadgeClass('respiratoryRate', record.respiratoryRate)}`}>
                          {record.respiratoryRate} brpm
                        </span>
                      ) : (
                        getEmptyFieldDisplay(record)
                      )}
                    </td>
                    <td>
                      {record.oxygenSaturation ? (
                        <span className={`badge ${getVitalSignBadgeClass('oxygenSaturation', record.oxygenSaturation)}`}>
                          {record.oxygenSaturation}%
                        </span>
                      ) : (
                        getEmptyFieldDisplay(record)
                      )}
                    </td>
                    <td>
                      {record.weight ? `${record.weight} kg` : getEmptyFieldDisplay(record)}
                    </td>
                    <td>
                      {record.height ? `${record.height} cm` : getEmptyFieldDisplay(record)}
                    </td>
                    <td>
                      {record.clinicalNotes ? (
                        <div style={{maxWidth: '200px'}}>
                          <small>{record.clinicalNotes}</small>
                        </div>
                      ) : (
                        getEmptyFieldDisplay(record)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal.Body>
      
      <Modal.Footer style={{
        background: isDarkMode ? '#334155' : '#f8f9fa',
        border: 'none',
        borderRadius: '0 0 12px 12px'
      }}>
        <Button 
          variant="secondary" 
          onClick={onHide}
          style={{
            background: isDarkMode ? '#64748b' : '#6c757d',
            border: 'none',
            color: '#ffffff'
          }}
        >
          <i className="bi bi-x-circle me-2"></i>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default VitalSignsHistoryModal;
