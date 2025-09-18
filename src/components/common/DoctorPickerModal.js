import React, { useState, useEffect } from 'react';
import { Modal, Button, Badge, Row, Col, Card, InputGroup, FormControl } from 'react-bootstrap';
import { doctorSessionService } from '../../services/doctorSessionService';
import './DoctorPickerModal.css';

const DoctorPickerModal = ({ 
  show, 
  onHide, 
  onDoctorSelect, 
  selectedDoctor = null 
}) => {
  const [onlineDoctors, setOnlineDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (show) {
      fetchOnlineDoctors();
    }
  }, [show]);

  const fetchOnlineDoctors = async () => {
    try {
      setLoading(true);
      setError('');
      const doctors = await doctorSessionService.getAllDoctors();
      setOnlineDoctors(doctors);
    } catch (error) {
      console.error('Error fetching all doctors:', error);
      setError('Failed to load doctors');
      setOnlineDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorSelect = (doctor) => {
    if (doctor.isAvailable) {
      onDoctorSelect(doctor);
      onHide();
    }
  };

  const getStatusBadge = (doctor) => {
    if (doctor.isBusy) {
      return <Badge bg="warning" className="ms-2">Busy</Badge>;
    } else if (doctor.isAvailable) {
      return <Badge bg="success" className="ms-2">Online</Badge>;
    } else {
      return <Badge bg="secondary" className="ms-2">Offline</Badge>;
    }
  };

  const filteredDoctors = onlineDoctors.filter(doctor => 
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableDoctors = filteredDoctors.filter(doctor => doctor.isAvailable);
  const busyDoctors = filteredDoctors.filter(doctor => doctor.isBusy);
  const offlineDoctors = filteredDoctors.filter(doctor => doctor.isOffline);

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="lg" 
      centered
      className="doctor-picker-modal"
    >
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="d-flex align-items-center">
          <i className="bi bi-person-badge me-2 text-primary"></i>
          Select Available Doctor
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="px-4 py-3">
        {/* Search Bar */}
        <InputGroup className="mb-4">
          <InputGroup.Text>
            <i className="bi bi-search"></i>
          </InputGroup.Text>
          <FormControl
            placeholder="Search doctors by name or position..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading doctors...</span>
            </div>
            <p className="text-muted mt-2">Loading available doctors...</p>
          </div>
        ) : error ? (
          <div className="text-center py-5">
            <i className="bi bi-exclamation-triangle text-danger fs-2"></i>
            <p className="text-danger mt-2">{error}</p>
            <Button variant="outline-primary" onClick={fetchOnlineDoctors}>
              <i className="bi bi-arrow-clockwise me-2"></i>
              Retry
            </Button>
          </div>
        ) : (
          <>
            {/* Available Doctors Section */}
            {availableDoctors.length > 0 && (
              <div className="mb-4">
                <h6 className="text-success mb-3">
                  <i className="bi bi-person-check me-2"></i>
                  Available Doctors ({availableDoctors.length})
                </h6>
                <Row>
                  {availableDoctors.map(doctor => (
                    <Col md={6} key={doctor.id} className="mb-3">
                      <Card 
                        className={`doctor-card h-100 ${selectedDoctor?.id === doctor.id ? 'selected' : ''}`}
                        onClick={() => handleDoctorSelect(doctor)}
                        role="button"
                      >
                        <Card.Body className="p-3">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <h6 className="card-title mb-1 d-flex align-items-center">
                                <i className="bi bi-person-fill me-2 text-primary"></i>
                                {doctor.name}
                              </h6>
                              <p className="card-text text-muted small mb-2">
                                {doctor.position}
                              </p>
                              <div className="d-flex align-items-center">
                                <small className="text-success me-2">
                                  <i className="bi bi-circle-fill me-1"></i>
                                  Available now
                                </small>
                                {getStatusBadge(doctor)}
                              </div>
                            </div>
                            <div className="text-end">
                              <Button 
                                variant="success" 
                                size="sm"
                                className="select-btn"
                              >
                                <i className="bi bi-check-circle me-1"></i>
                                Select
                              </Button>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            {/* Busy Doctors Section */}
            {busyDoctors.length > 0 && (
              <div className="mb-4">
                <h6 className="text-warning mb-3">
                  <i className="bi bi-person-fill-lock me-2"></i>
                  Currently Busy ({busyDoctors.length})
                </h6>
                <Row>
                  {busyDoctors.map(doctor => (
                    <Col md={6} key={doctor.id} className="mb-3">
                      <Card className="doctor-card busy h-100">
                        <Card.Body className="p-3">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <h6 className="card-title mb-1 d-flex align-items-center">
                                <i className="bi bi-person-fill me-2 text-muted"></i>
                                {doctor.name}
                              </h6>
                              <p className="card-text text-muted small mb-2">
                                {doctor.position}
                              </p>
                              <div className="d-flex align-items-center">
                                <small className="text-warning me-2">
                                  <i className="bi bi-circle-fill me-1"></i>
                                  Currently busy
                                </small>
                                {getStatusBadge(doctor)}
                              </div>
                            </div>
                            <div className="text-end">
                              <Button 
                                variant="outline-secondary" 
                                size="sm"
                                disabled
                              >
                                <i className="bi bi-lock me-1"></i>
                                Busy
                              </Button>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            {/* Offline Doctors Section */}
            {offlineDoctors.length > 0 && (
              <div className="mb-4">
                <h6 className="text-secondary mb-3">
                  <i className="bi bi-person-dash me-2"></i>
                  Offline ({offlineDoctors.length})
                </h6>
                <Row>
                  {offlineDoctors.map(doctor => (
                    <Col md={6} key={doctor.id} className="mb-3">
                      <Card className="doctor-card h-100 offline-doctor">
                        <Card.Body className="p-3">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <h6 className="card-title mb-1 text-muted">{doctor.name}</h6>
                              <p className="card-text text-muted small mb-2">
                                {doctor.position}
                              </p>
                              <div className="d-flex align-items-center">
                                <small className="text-secondary me-2">
                                  <i className="bi bi-circle me-1"></i>
                                  Not logged in
                                </small>
                                {getStatusBadge(doctor)}
                              </div>
                            </div>
                            <div className="text-end">
                              <Button 
                                variant="outline-secondary" 
                                size="sm"
                                disabled
                              >
                                <i className="bi bi-person-dash me-1"></i>
                                Offline
                              </Button>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            {/* No Doctors Available */}
            {availableDoctors.length === 0 && busyDoctors.length === 0 && offlineDoctors.length === 0 && !loading && (
              <div className="text-center py-5">
                <i className="bi bi-person-x fs-1 text-muted"></i>
                <h5 className="text-muted mt-3">No Doctors Found</h5>
                <p className="text-muted">
                  {searchTerm ? 'Try adjusting your search terms.' : 'No doctors are currently online.'}
                </p>
              </div>
            )}
          </>
        )}

        {/* Auto-refresh notice */}
        <div className="text-center mt-4 pt-3 border-top">
          <small className="text-muted">
            <i className="bi bi-info-circle me-1"></i>
            Doctor availability updates automatically every 30 seconds
          </small>
        </div>
      </Modal.Body>

      <Modal.Footer className="border-0 pt-0">
        <Button variant="outline-secondary" onClick={onHide}>
          <i className="bi bi-x-circle me-2"></i>
          Cancel
        </Button>
        <Button variant="primary" onClick={fetchOnlineDoctors} disabled={loading}>
          <i className="bi bi-arrow-clockwise me-2"></i>
          Refresh
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DoctorPickerModal;