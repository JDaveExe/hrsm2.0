import React, { useState, useCallback, useMemo } from 'react';
import { Modal, Form, Button, Row, Col, InputGroup } from 'react-bootstrap';
import OptimizedNumberInput from './OptimizedNumberInput';

const OptimizedMedicationForm = React.memo(({
  show,
  onHide,
  onSubmit,
  loading = false,
  initialData = {}
}) => {
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    brandName: '',
    category: '',
    form: '',
    dosage: '',
    unitsInStock: 0,
    minimumStock: 0,
    manufacturer: '',
    batchNumber: '',
    expiryDate: '',
    costPerUnit: 0,
    isPrescriptionRequired: false,
    isControlledSubstance: false,
    administrationInstructions: '',
    sideEffects: '',
    contraindications: '',
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
    
    if (!formData.name.trim()) newErrors.name = 'Brand name is required';
    if (!formData.genericName.trim()) newErrors.genericName = 'Generic name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.form) newErrors.form = 'Form is required';
    if (!formData.dosage.trim()) newErrors.dosage = 'Dosage is required';
    if (!formData.expiryDate) newErrors.expiryDate = 'Expiry date is required';
    if (formData.unitsInStock < 0) newErrors.unitsInStock = 'Stock cannot be negative';
    if (formData.minimumStock < 0) newErrors.minimumStock = 'Minimum stock cannot be negative';
    if (formData.costPerUnit < 0) newErrors.costPerUnit = 'Cost cannot be negative';
    
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
      genericName: '',
      brandName: '',
      category: '',
      form: '',
      dosage: '',
      unitsInStock: 0,
      minimumStock: 0,
      manufacturer: '',
      batchNumber: '',
      expiryDate: '',
      costPerUnit: 0,
      isPrescriptionRequired: false,
      isControlledSubstance: false,
      administrationInstructions: '',
      sideEffects: '',
      contraindications: ''
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
    { value: 'Analgesics', label: 'Analgesics (Pain Relievers)' },
    { value: 'Antibiotics', label: 'Antibiotics' },
    { value: 'Antipyretics', label: 'Antipyretics (Fever Reducers)' },
    { value: 'Anti-inflammatory', label: 'Anti-inflammatory' },
    { value: 'Antihistamines', label: 'Antihistamines' },
    { value: 'Antihypertensives', label: 'Antihypertensives' },
    { value: 'Antidiabetics', label: 'Antidiabetics' },
    { value: 'Cardiovascular', label: 'Cardiovascular' },
    { value: 'Respiratory', label: 'Respiratory' },
    { value: 'Gastrointestinal', label: 'Gastrointestinal' },
    { value: 'Vitamins', label: 'Vitamins & Supplements' },
    { value: 'Topical', label: 'Topical Medications' },
    { value: 'Other', label: 'Other' }
  ], []);

  const formOptions = useMemo(() => [
    { value: '', label: 'Select Form' },
    { value: 'Tablet', label: 'Tablet' },
    { value: 'Capsule', label: 'Capsule' },
    { value: 'Syrup', label: 'Syrup' },
    { value: 'Suspension', label: 'Suspension' },
    { value: 'Injection', label: 'Injection' },
    { value: 'Cream', label: 'Cream' },
    { value: 'Ointment', label: 'Ointment' },
    { value: 'Drops', label: 'Drops' },
    { value: 'Inhaler', label: 'Inhaler' },
    { value: 'Patch', label: 'Patch' }
  ], []);

  return (
    <Modal show={show} onHide={handleClose} size="xl" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-capsule me-2"></i>
          Add New Medication
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={4}>
              <h5 className="mb-3">
                <i className="bi bi-info-circle me-2"></i>
                Basic Information
              </h5>
              
              <Form.Group className="mb-3">
                <Form.Label>Brand/Trade Name *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., Biogesic"
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
                <Form.Label>Generic Name *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., Paracetamol"
                  value={formData.genericName}
                  onChange={(e) => handleFormChange('genericName', e.target.value)}
                  isInvalid={!!errors.genericName}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {errors.genericName}
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
                <Form.Label>Form *</Form.Label>
                <Form.Select 
                  value={formData.form}
                  onChange={(e) => handleFormChange('form', e.target.value)}
                  isInvalid={!!errors.form}
                  required
                >
                  {formOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.form}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Strength/Dosage *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., 500mg, 250mg/5ml"
                  value={formData.dosage}
                  onChange={(e) => handleFormChange('dosage', e.target.value)}
                  isInvalid={!!errors.dosage}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {errors.dosage}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={4}>
              <h5 className="mb-3">
                <i className="bi bi-box-seam me-2"></i>
                Stock Information
              </h5>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Initial Stock *</Form.Label>
                    <OptimizedNumberInput
                      value={formData.unitsInStock}
                      onChange={(value) => handleFormChange('unitsInStock', value)}
                      min={0}
                      placeholder="Enter stock quantity"
                      required
                      className={errors.unitsInStock ? 'is-invalid' : ''}
                    />
                    {errors.unitsInStock && (
                      <div className="invalid-feedback d-block">
                        {errors.unitsInStock}
                      </div>
                    )}
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Minimum Stock *</Form.Label>
                    <OptimizedNumberInput
                      value={formData.minimumStock}
                      onChange={(value) => handleFormChange('minimumStock', value)}
                      min={0}
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
                <Form.Label>Manufacturer</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., Unilab"
                  value={formData.manufacturer}
                  onChange={(e) => handleFormChange('manufacturer', e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Batch Number</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., MED001-2024"
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
                <Form.Label>Cost per Unit</Form.Label>
                <OptimizedNumberInput
                  value={formData.costPerUnit}
                  onChange={(value) => handleFormChange('costPerUnit', value)}
                  min={0}
                  decimals={true}
                  step={0.01}
                  prefix="₱"
                  placeholder="Enter cost per unit"
                  className={errors.costPerUnit ? 'is-invalid' : ''}
                />
                {errors.costPerUnit && (
                  <div className="invalid-feedback d-block">
                    {errors.costPerUnit}
                  </div>
                )}
              </Form.Group>
            </Col>

            <Col md={4}>
              <h5 className="mb-3">
                <i className="bi bi-shield-exclamation me-2"></i>
                Regulatory & Safety
              </h5>

              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Prescription Required"
                  id="prescriptionRequired"
                  checked={formData.isPrescriptionRequired}
                  onChange={(e) => handleFormChange('isPrescriptionRequired', e.target.checked)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Controlled Substance"
                  id="controlledSubstance"
                  checked={formData.isControlledSubstance}
                  onChange={(e) => handleFormChange('isControlledSubstance', e.target.checked)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Administration Instructions</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="How to take this medication..."
                  value={formData.administrationInstructions}
                  onChange={(e) => handleFormChange('administrationInstructions', e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Side Effects</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Common side effects..."
                  value={formData.sideEffects}
                  onChange={(e) => handleFormChange('sideEffects', e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Contraindications</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="When not to use..."
                  value={formData.contraindications}
                  onChange={(e) => handleFormChange('contraindications', e.target.value)}
                />
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
              Add Medication
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
});

OptimizedMedicationForm.displayName = 'OptimizedMedicationForm';

export default OptimizedMedicationForm;
