import React, { useState } from 'react';
import { Button, Badge } from 'react-bootstrap';
import DoctorPickerModal from './DoctorPickerModal';
import './DoctorPicker.css';

const DoctorPicker = ({ 
  onDoctorSelect, 
  selectedDoctor, 
  disabled = false,
  size = 'sm',
  variant = 'outline-primary',
  inQueue = false,
  assignedDoctor = null 
}) => {
  const [showModal, setShowModal] = useState(false);

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleDoctorSelect = (doctor) => {
    onDoctorSelect(doctor);
    setShowModal(false);
  };

  const getStatusBadge = (doctor) => {
    if (doctor.isBusy) {
      return <Badge bg="warning" className="ms-1">Busy</Badge>;
    } else if (doctor.isAvailable) {
      return <Badge bg="success" className="ms-1">Online</Badge>;
    } else {
      return <Badge bg="secondary" className="ms-1">Offline</Badge>;
    }
  };

  // If patient is in queue, show assigned doctor info (read-only)
  if (inQueue && assignedDoctor) {
    return (
      <div className="doctor-picker-assigned">
        <div className="d-flex align-items-center">
          <i className="bi bi-person-check-fill text-success me-2"></i>
          <div>
            <div className="fw-medium text-success">{assignedDoctor.name}</div>
            <small className="text-muted">Assisted By</small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="d-grid">
        <Button 
          variant={selectedDoctor ? 'success' : variant} 
          size={size}
          disabled={disabled}
          className="doctor-picker-button text-start"
          onClick={handleOpenModal}
        >
          <div className="d-flex justify-content-between align-items-center">
            <div className="flex-grow-1">
              {selectedDoctor ? (
                <div>
                  <div className="d-flex align-items-center">
                    <i className="bi bi-person-check-fill me-2"></i>
                    <span className="fw-medium">{selectedDoctor.name}</span>
                    {getStatusBadge(selectedDoctor)}
                  </div>
                  <small className="text-muted d-block mt-1">
                    Click to change doctor
                  </small>
                </div>
              ) : (
                <div>
                  <div className="d-flex align-items-center">
                    <i className="bi bi-person-plus me-2"></i>
                    <span>Available Doctors</span>
                  </div>
                  <small className="text-muted d-block mt-1">
                    Click to select doctor
                  </small>
                </div>
              )}
            </div>
            <i className="bi bi-chevron-right ms-2"></i>
          </div>
        </Button>
      </div>

      <DoctorPickerModal
        show={showModal}
        onHide={handleCloseModal}
        onDoctorSelect={handleDoctorSelect}
        selectedDoctor={selectedDoctor}
      />
    </>
  );
};

export default DoctorPicker;