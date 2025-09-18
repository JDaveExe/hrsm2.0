import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Modal, Button, Form, Row, Col, InputGroup, Alert } from 'react-bootstrap';
import '../styles/VitalSignsModal.css';

const VitalSignsModal = ({ 
  show, 
  onHide, 
  patient, 
  isReadOnly = false, 
  onSave, 
  onViewHistory,
  onEdit,
  initialData = {},
  normalRanges = {
    temperature: {
      celsius: '36.1-37.2',
      fahrenheit: '97.0-99.0'
    },
    heartRate: '60-100',
    systolicBP: '90-120',
    diastolicBP: '60-80',
    respiratoryRate: '12-20',
    oxygenSaturation: '95-100',
    weight: 'varies by age/height',
    height: 'varies by age'
  }
}) => {
  // Check if the service type is vaccination
  const isVaccinationService = patient?.serviceType === 'vaccination';
  // State for vital signs form
  const [vitalSigns, setVitalSigns] = useState({
    temperature: '',
    temperatureUnit: 'celsius',
    heartRate: '',
    systolicBP: '',
    diastolicBP: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    weight: '',
    weightUnit: 'kg',
    height: '',
    heightUnit: 'cm',
    clinicalNotes: ''
  });
  
  // Memoize the modal title to prevent unnecessary re-renders
  const modalTitle = useMemo(() => {
    return isReadOnly ? 'Review Vital Signs' : 'Record Vital Signs';
  }, [isReadOnly]);
  
  // Memoize patient info for display
  const patientInfo = useMemo(() => {
    if (!patient) return null;
    return `${patient.patientName} (${patient.patientId}) - ${patient.serviceType || 'No service type'}`;
  }, [patient]);
  
  // Initialize form with patient data when patient changes or modal opens
  useEffect(() => {
    if (patient && show) {
      console.log('VitalSignsModal: Loading data for patient:', patient.patientName);
      console.log('VitalSignsModal: Initial data received:', initialData);
      console.log('VitalSignsModal: Is read-only mode:', isReadOnly);
      
      // Use a clean version of initialData with all expected fields
      setVitalSigns({
        temperature: initialData.temperature || '',
        temperatureUnit: initialData.temperatureUnit || 'celsius',
        heartRate: initialData.heartRate || '',
        systolicBP: initialData.systolicBP || '',
        diastolicBP: initialData.diastolicBP || '',
        respiratoryRate: initialData.respiratoryRate || '',
        oxygenSaturation: initialData.oxygenSaturation || '',
        weight: initialData.weight || '',
        weightUnit: initialData.weightUnit || 'kg',
        height: initialData.height || '',
        heightUnit: initialData.heightUnit || 'cm',
        clinicalNotes: initialData.clinicalNotes || ''
      });
    }
  }, [patient, initialData, show, isReadOnly]);

  // Helper function to convert temperature - memoized to improve performance
  const convertTemperature = useCallback((value, fromUnit, toUnit) => {
    if (!value) return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    
    if (fromUnit === 'celsius' && toUnit === 'fahrenheit') {
      return ((numValue * 9/5) + 32).toFixed(1);
    } else if (fromUnit === 'fahrenheit' && toUnit === 'celsius') {
      return ((numValue - 32) * 5/9).toFixed(1);
    }
    return value;
  }, []);

  // Helper function to convert weight - memoized to improve performance
  const convertWeight = useCallback((value, fromUnit, toUnit) => {
    if (!value) return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    
    if (fromUnit === 'kg' && toUnit === 'lbs') {
      return (numValue * 2.20462).toFixed(1);
    } else if (fromUnit === 'lbs' && toUnit === 'kg') {
      return (numValue / 2.20462).toFixed(1);
    }
    return value;
  }, []);

  // Helper function to convert height - memoized to improve performance
  const convertHeight = useCallback((value, fromUnit, toUnit) => {
    if (!value) return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    
    if (fromUnit === 'cm' && toUnit === 'ft') {
      // Convert cm to feet and inches format (e.g., "5'8"")
      const totalInches = numValue / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = (totalInches % 12).toFixed(1);
      return `${feet}'${inches}"`;
    } else if (fromUnit === 'ft' && toUnit === 'cm') {
      // Handle format like "5'8"" or just "5.67"
      let totalInches;
      if (value.includes("'")) {
        const parts = value.split("'");
        const feet = parseInt(parts[0]);
        const inches = parseFloat(parts[1].replace('"', ''));
        totalInches = feet * 12 + inches;
      } else {
        totalInches = parseFloat(value) * 12;
      }
      return (totalInches * 2.54).toFixed(1);
    }
    return value;
  }, []);

  // Memoized handlers to prevent unnecessary re-renders
  const handleSave = useCallback(() => {
    // Pass the current state of the form back to the parent
    onSave(vitalSigns);
  }, [onSave, vitalSigns]);

  const handleViewHistory = useCallback(() => {
    if (onViewHistory) {
      onViewHistory();
    }
  }, [onViewHistory]);

  // Function to handle input changes
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setVitalSigns((prevState) => ({
      ...prevState,
      [name]: value
    }));
  }, []);

  // Function to handle unit changes
  const handleUnitChange = useCallback((e) => {
    const { name, value } = e.target;
    
    // Handle height unit conversion
    if (name === 'heightUnit' && vitalSigns.height) {
      const currentUnit = vitalSigns.heightUnit;
      const newUnit = value;
      const convertedHeight = convertHeight(vitalSigns.height, currentUnit, newUnit);
      
      setVitalSigns((prevState) => ({
        ...prevState,
        height: convertedHeight,
        [name]: value
      }));
    }
    // Handle weight unit conversion
    else if (name === 'weightUnit' && vitalSigns.weight) {
      const currentUnit = vitalSigns.weightUnit;
      const newUnit = value;
      const convertedWeight = convertWeight(vitalSigns.weight, currentUnit, newUnit);
      
      setVitalSigns((prevState) => ({
        ...prevState,
        weight: convertedWeight,
        [name]: value
      }));
    }
    // Handle temperature unit conversion
    else if (name === 'temperatureUnit' && vitalSigns.temperature) {
      const currentUnit = vitalSigns.temperatureUnit;
      const newUnit = value;
      const convertedTemp = convertTemperature(vitalSigns.temperature, currentUnit, newUnit);
      
      setVitalSigns((prevState) => ({
        ...prevState,
        temperature: convertedTemp,
        [name]: value
      }));
    }
    else {
      setVitalSigns((prevState) => ({
        ...prevState,
        [name]: value
      }));
    }
  }, [vitalSigns.height, vitalSigns.weight, vitalSigns.temperature, vitalSigns.heightUnit, vitalSigns.weightUnit, vitalSigns.temperatureUnit, convertHeight, convertWeight, convertTemperature]);

  // Function to get placeholder text for vital signs
  const getPlaceholder = useCallback((vitalType) => {
    if (!normalRanges) return '';
    
    switch (vitalType) {
      case 'temperature':
        const tempUnit = vitalSigns.temperatureUnit || 'celsius';
        return normalRanges.temperature?.[tempUnit] || '';
      case 'heartRate':
        return normalRanges.heartRate || '';
      case 'respiratoryRate':
        return normalRanges.respiratoryRate || '';
      case 'oxygenSaturation':
        return normalRanges.oxygenSaturation || '';
      case 'systolicBP':
        return normalRanges.systolicBP || '';
      case 'diastolicBP':
        return normalRanges.diastolicBP || '';
      default:
        return '';
    }
  }, [normalRanges, vitalSigns.temperatureUnit]);

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      size="lg"
      className="vital-signs-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-heart-pulse me-2 text-primary"></i>
          {modalTitle}
          {patient && (
            <div className="patient-info">
              <small className="text-muted">
                {patientInfo}
              </small>
            </div>
          )}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isReadOnly && (
          <Alert variant="info">
            <i className="bi bi-info-circle-fill me-2"></i>
            <strong>Read-Only Mode:</strong> You are viewing existing vital signs. Click "Update/Edit" to make changes.
          </Alert>
        )}
        <Form>
          {/* First Row: Temperature, Heart Rate, Respiratory Rate */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Service Type</Form.Label>
                <Form.Control
                  type="text"
                  readOnly
                  value={patient?.serviceType || "Not specified"}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Priority</Form.Label>
                <Form.Control
                  type="text"
                  readOnly
                  value={patient?.priority || "Normal"}
                />
              </Form.Group>
            </Col>
          </Row>
          
          <hr />

          {/* First Row: Temperature, Heart Rate */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={5}>Temperature</Form.Label>
                <Col sm={7}>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      name="temperature"
                      value={vitalSigns.temperature}
                      onChange={handleChange}
                      readOnly={isReadOnly}
                      className={isReadOnly ? 'vitals-readonly' : ''}
                      placeholder={getPlaceholder('temperature')}
                    />
                    <Form.Select
                      name="temperatureUnit"
                      value={vitalSigns.temperatureUnit}
                      onChange={handleUnitChange}
                      disabled={isReadOnly}
                      className={isReadOnly ? 'vitals-readonly' : ''}
                      style={{ maxWidth: '80px' }}
                    >
                      <option value="celsius">°C</option>
                      <option value="fahrenheit">°F</option>
                    </Form.Select>
                  </InputGroup>
                </Col>
              </Form.Group>
            </Col>

            {/* Heart Rate */}
            <Col md={6}>
              <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={5}>Heart Rate</Form.Label>
                <Col sm={7}>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      name="heartRate"
                      value={vitalSigns.heartRate}
                      onChange={handleChange}
                      readOnly={isReadOnly}
                      className={isReadOnly ? 'vitals-readonly' : ''}
                      placeholder={normalRanges.heartRate}
                    />
                    <InputGroup.Text>bpm</InputGroup.Text>
                  </InputGroup>
                </Col>
              </Form.Group>
            </Col>
          </Row>

          {/* Second Row: Blood Pressure */}
          <Row className="mb-3">
            <Col md={12}>
              <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={3}>Blood Pressure</Form.Label>
                <Col sm={9}>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      name="systolicBP"
                      value={vitalSigns.systolicBP}
                      onChange={handleChange}
                      readOnly={isReadOnly}
                      className={isReadOnly ? 'vitals-readonly' : ''}
                      placeholder={normalRanges.systolicBP}
                    />
                    <InputGroup.Text>/</InputGroup.Text>
                    <Form.Control
                      type="number"
                      name="diastolicBP"
                      value={vitalSigns.diastolicBP}
                      onChange={handleChange}
                      readOnly={isReadOnly}
                      className={isReadOnly ? 'vitals-readonly' : ''}
                      placeholder={normalRanges.diastolicBP}
                    />
                    <InputGroup.Text>mmHg</InputGroup.Text>
                  </InputGroup>
                </Col>
              </Form.Group>
            </Col>
          </Row>

          {/* Third Row: Respiratory Rate, Oxygen Saturation */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={5} className={isVaccinationService ? 'text-muted' : ''}>
                  Respiratory Rate
                  {isVaccinationService && (
                    <small className="text-warning ms-1" title="Not required for vaccination service">
                      <i className="bi bi-exclamation-triangle"></i>
                    </small>
                  )}
                </Form.Label>
                <Col sm={7}>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      name="respiratoryRate"
                      value={vitalSigns.respiratoryRate}
                      onChange={handleChange}
                      readOnly={isReadOnly || isVaccinationService}
                      disabled={isVaccinationService}
                      className={`${isReadOnly ? 'vitals-readonly' : ''} ${isVaccinationService ? 'bg-light text-muted' : ''}`}
                      placeholder={isVaccinationService ? "Not required" : normalRanges.respiratoryRate}
                    />
                    <InputGroup.Text className={isVaccinationService ? 'bg-light text-muted' : ''}>brpm</InputGroup.Text>
                  </InputGroup>
                  {isVaccinationService && (
                    <Form.Text className="text-warning">
                      <i className="bi bi-info-circle me-1"></i>
                      Not required for vaccination service
                    </Form.Text>
                  )}
                </Col>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={5} className={isVaccinationService ? 'text-muted' : ''}>
                  Oxygen Saturation
                  {isVaccinationService && (
                    <small className="text-warning ms-1" title="Not required for vaccination service">
                      <i className="bi bi-exclamation-triangle"></i>
                    </small>
                  )}
                </Form.Label>
                <Col sm={7}>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      name="oxygenSaturation"
                      value={vitalSigns.oxygenSaturation}
                      onChange={handleChange}
                      readOnly={isReadOnly || isVaccinationService}
                      disabled={isVaccinationService}
                      className={`${isReadOnly ? 'vitals-readonly' : ''} ${isVaccinationService ? 'bg-light text-muted' : ''}`}
                      placeholder={isVaccinationService ? "Not required" : normalRanges.oxygenSaturation}
                    />
                    <InputGroup.Text className={isVaccinationService ? 'bg-light text-muted' : ''}>%</InputGroup.Text>
                  </InputGroup>
                  {isVaccinationService && (
                    <Form.Text className="text-warning">
                      <i className="bi bi-info-circle me-1"></i>
                      Not required for vaccination service
                    </Form.Text>
                  )}
                </Col>
              </Form.Group>
            </Col>
          </Row>

          {/* Fourth Row: Weight, Height */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={5} className={isVaccinationService ? 'text-muted' : ''}>
                  Weight
                  {isVaccinationService && (
                    <small className="text-warning ms-1" title="Not required for vaccination service">
                      <i className="bi bi-exclamation-triangle"></i>
                    </small>
                  )}
                  {initialData.weight && !isReadOnly && !isVaccinationService && (
                    <small className="text-info ms-1" title="Pre-filled from last visit">
                      <i className="bi bi-info-circle"></i>
                    </small>
                  )}
                </Form.Label>
                <Col sm={7}>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      name="weight"
                      value={vitalSigns.weight}
                      onChange={handleChange}
                      readOnly={isReadOnly || isVaccinationService}
                      disabled={isVaccinationService}
                      className={`${isReadOnly ? 'vitals-readonly' : ''} ${isVaccinationService ? 'bg-light text-muted' : ''} ${initialData.weight && !isReadOnly && !isVaccinationService ? 'prefilled-field' : ''}`}
                      placeholder={isVaccinationService ? "Not required" : ""}
                    />
                    <Form.Select
                      name="weightUnit"
                      value={vitalSigns.weightUnit}
                      onChange={handleUnitChange}
                      disabled={isReadOnly || isVaccinationService}
                      className={`${isReadOnly ? 'vitals-readonly' : ''} ${isVaccinationService ? 'bg-light text-muted' : ''}`}
                      style={{ maxWidth: '80px' }}
                    >
                      <option value="kg">kg</option>
                      <option value="lbs">lbs</option>
                    </Form.Select>
                  </InputGroup>
                  {isVaccinationService && (
                    <Form.Text className="text-warning">
                      <i className="bi bi-info-circle me-1"></i>
                      Not required for vaccination service
                    </Form.Text>
                  )}
                  {initialData.weight && !isReadOnly && !isVaccinationService && (
                    <Form.Text className="text-info">
                      <i className="bi bi-clock-history me-1"></i>
                      Pre-filled from last visit (editable)
                    </Form.Text>
                  )}
                </Col>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={5} className={isVaccinationService ? 'text-muted' : ''}>
                  Height
                  {isVaccinationService && (
                    <small className="text-warning ms-1" title="Not required for vaccination service">
                      <i className="bi bi-exclamation-triangle"></i>
                    </small>
                  )}
                  {initialData.height && !isReadOnly && !isVaccinationService && (
                    <small className="text-info ms-1" title="Pre-filled from last visit">
                      <i className="bi bi-info-circle"></i>
                    </small>
                  )}
                </Form.Label>
                <Col sm={7}>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      name="height"
                      value={vitalSigns.height}
                      onChange={handleChange}
                      readOnly={isReadOnly || isVaccinationService}
                      disabled={isVaccinationService}
                      className={`${isReadOnly ? 'vitals-readonly' : ''} ${isVaccinationService ? 'bg-light text-muted' : ''} ${initialData.height && !isReadOnly && !isVaccinationService ? 'prefilled-field' : ''}`}
                      placeholder={isVaccinationService ? "Not required" : (vitalSigns.heightUnit === 'ft' ? "5'8\"" : "175")}
                    />
                    <Form.Select
                      name="heightUnit"
                      value={vitalSigns.heightUnit}
                      onChange={handleUnitChange}
                      disabled={isReadOnly || isVaccinationService}
                      className={`${isReadOnly ? 'vitals-readonly' : ''} ${isVaccinationService ? 'bg-light text-muted' : ''}`}
                      style={{ maxWidth: '80px' }}
                    >
                      <option value="cm">cm</option>
                      <option value="ft">ft</option>
                    </Form.Select>
                  </InputGroup>
                  {isVaccinationService && (
                    <Form.Text className="text-warning">
                      <i className="bi bi-info-circle me-1"></i>
                      Not required for vaccination service
                    </Form.Text>
                  )}
                  {initialData.height && !isReadOnly && !isVaccinationService && (
                    <Form.Text className="text-info">
                      <i className="bi bi-clock-history me-1"></i>
                      Pre-filled from last visit (editable)
                    </Form.Text>
                  )}
                </Col>
              </Form.Group>
            </Col>
          </Row>

          {/* Clinical Notes */}
          <Form.Group className="mb-3">
            <Form.Label>Clinical Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="clinicalNotes"
              value={vitalSigns.clinicalNotes}
              onChange={handleChange}
              readOnly={isReadOnly}
              className={isReadOnly ? 'vitals-readonly' : ''}
              placeholder="Enter any additional clinical observations or notes..."
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        {isReadOnly ? (
          <>
            <Button variant="info" onClick={onViewHistory}>
              <i className="bi bi-clock-history me-1"></i>
              View Vital Signs History
            </Button>
            <Button variant="primary" onClick={onEdit}>
              <i className="bi bi-pencil-square me-1"></i>
              Update/Edit
            </Button>
          </>
        ) : (
          <Button variant="success" onClick={handleSave}>
            <i className="bi bi-check-circle me-1"></i>
            Save Vital Signs
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default VitalSignsModal;
