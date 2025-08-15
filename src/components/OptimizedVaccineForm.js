import React, { useState, useCallback, useMemo } from 'react';
import { Modal, Form, Button, Row, Col, InputGroup } from 'react-bootstrap';
import OptimizedNumberInput from './OptimizedNumberInput';

const OptimizedVaccineForm = React.memo(({
  show,
  onHide,
  onSubmit,
  loading = false,
  initialData = {}
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    manufacturer: '',
    administrationRoute: '',
    description: '',
    dosesInStock: 0,
    minimumStock: 0,
    batchNumber: '',
    expiryDate: '',
    storageRequirements: '',
    costPerDose: 0,
    ...initialData
  });

  const [errors, setErrors] = useState({});

  // Optimized form change handler
  const handleFormChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Form validation
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Vaccine name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.manufacturer.trim()) newErrors.manufacturer = 'Manufacturer is required';
    if (!formData.expiryDate) newErrors.expiryDate = 'Expiry date is required';
    if (formData.dosesInStock < 0) newErrors.dosesInStock = 'Stock cannot be negative';
    if (formData.minimumStock < 0) newErrors.minimumStock = 'Minimum stock cannot be negative';
    if (formData.costPerDose < 0) newErrors.costPerDose = 'Cost cannot be negative';
    
    // Check expiry date is not in the past
    if (formData.expiryDate && new Date(formData.expiryDate) <= new Date()) {
      newErrors.expiryDate = 'Expiry date must be in the future';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  }, [formData, validateForm, onSubmit]);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      category: '',
      manufacturer: '',
      administrationRoute: '',
      description: '',
      dosesInStock: 0,
      minimumStock: 0,
      batchNumber: '',
      expiryDate: '',
      storageRequirements: '',
      costPerDose: 0
    });
    setErrors({});
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onHide();
  }, [resetForm, onHide]);

  // Memoized category options
  const categoryOptions = useMemo(() => [
    { value: '', label: 'Select Category' },
    { value: 'Routine Childhood', label: 'Routine Childhood' },
    { value: 'Adult', label: 'Adult' },
    { value: 'Travel', label: 'Travel' },
    { value: 'Occupational', label: 'Occupational' },
    { value: 'Emergency', label: 'Emergency' }
  ], []);

  const administrationRouteOptions = useMemo(() => [
    { value: '', label: 'Select Route' },
    { value: 'Intramuscular', label: 'Intramuscular (IM)' },
    { value: 'Subcutaneous', label: 'Subcutaneous (SC)' },
    { value: 'Oral', label: 'Oral' },
    { value: 'Intranasal', label: 'Intranasal' },
    { value: 'Intradermal', label: 'Intradermal' }
  ], []);

  const storageOptions = useMemo(() => [
    { value: '', label: 'Select Storage Type' },
    { value: '2-8°C (Refrigerated)', label: '2-8°C (Refrigerated)' },
    { value: '-15 to -25°C (Frozen)', label: '-15 to -25°C (Frozen)' },
    { value: 'Room Temperature', label: 'Room Temperature' },
    { value: 'Ultra-cold (-70°C)', label: 'Ultra-cold (-70°C)' }
  ], []);

  return (
    <Modal show={show} onHide={handleClose} size="xl" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-shield-plus me-2"></i>
          Add New Vaccine
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <h5 className="mb-3">
                <i className="bi bi-info-circle me-2"></i>
                Basic Information
              </h5>
              
              <Form.Group className="mb-3">
                <Form.Label>Vaccine Name *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., COVID-19 Vaccine"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  isInvalid={!!errors.name}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {errors.name}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Category *</Form.Label>
                <Form.Select 
                  value={formData.category}
                  onChange={(e) => handleFormChange('category', e.target.value)}
                  isInvalid={!!errors.category}
                  required
                >
                  {categoryOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.category}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Manufacturer *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., Sanofi Pasteur"
                  value={formData.manufacturer}
                  onChange={(e) => handleFormChange('manufacturer', e.target.value)}
                  isInvalid={!!errors.manufacturer}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {errors.manufacturer}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Administration Route</Form.Label>
                <Form.Select
                  value={formData.administrationRoute}
                  onChange={(e) => handleFormChange('administrationRoute', e.target.value)}
                >
                  {administrationRouteOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Brief description of the vaccine and its purpose"
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <h5 className="mb-3">
                <i className="bi bi-box-seam me-2"></i>
                Stock & Storage Information
              </h5>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Initial Stock *</Form.Label>
                    <OptimizedNumberInput
                      value={formData.dosesInStock}
                      onChange={(value) => handleFormChange('dosesInStock', value)}
                      min={0}
                      suffix="doses"
                      placeholder="Enter stock quantity"
                      required
                      className={errors.dosesInStock ? 'is-invalid' : ''}
                    />
                    {errors.dosesInStock && (
                      <div className="invalid-feedback d-block">
                        {errors.dosesInStock}
                      </div>
                    )}
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Minimum Stock Level *</Form.Label>
                    <OptimizedNumberInput
                      value={formData.minimumStock}
                      onChange={(value) => handleFormChange('minimumStock', value)}
                      min={0}
                      suffix="doses"
                      placeholder="Enter minimum stock"
                      required
                      className={errors.minimumStock ? 'is-invalid' : ''}
                    />
                    {errors.minimumStock && (
                      <div className="invalid-feedback d-block">
                        {errors.minimumStock}
                      </div>
                    )}
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Batch Number</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., VAC001-2024"
                  value={formData.batchNumber}
                  onChange={(e) => handleFormChange('batchNumber', e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Expiry Date *</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => handleFormChange('expiryDate', e.target.value)}
                  isInvalid={!!errors.expiryDate}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {errors.expiryDate}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Storage Requirements</Form.Label>
                <Form.Select
                  value={formData.storageRequirements}
                  onChange={(e) => handleFormChange('storageRequirements', e.target.value)}
                >
                  {storageOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Cost per Dose</Form.Label>
                <OptimizedNumberInput
                  value={formData.costPerDose}
                  onChange={(value) => handleFormChange('costPerDose', value)}
                  min={0}
                  decimals={true}
                  step={0.01}
                  prefix="₱"
                  placeholder="Enter cost per dose"
                  className={errors.costPerDose ? 'is-invalid' : ''}
                />
                {errors.costPerDose && (
                  <div className="invalid-feedback d-block">
                    {errors.costPerDose}
                  </div>
                )}
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          variant="success" 
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Adding...
            </>
          ) : (
            <>
              <i className="bi bi-plus me-2"></i>
              Add Vaccine
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
});

OptimizedVaccineForm.displayName = 'OptimizedVaccineForm';

export default OptimizedVaccineForm;
