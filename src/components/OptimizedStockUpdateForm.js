import React, { useState, useCallback, useMemo } from 'react';
import { Modal, Form, Button, InputGroup } from 'react-bootstrap';
import OptimizedNumberInput from './OptimizedNumberInput';

const OptimizedStockUpdateForm = React.memo(({
  show,
  onHide,
  onSubmit,
  loading = false,
  stockData = {}
}) => {
  const [formData, setFormData] = useState({
    type: stockData.type || '',
    id: stockData.id || null,
    name: stockData.name || '',
    currentStock: stockData.currentStock || 0,
    quantity: 1,
    operation: 'add',
    reason: ''
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

  // Calculate resulting stock
  const resultingStock = useMemo(() => {
    if (formData.operation === 'add') {
      return formData.currentStock + (formData.quantity || 0);
    } else {
      return Math.max(0, formData.currentStock - (formData.quantity || 0));
    }
  }, [formData.currentStock, formData.quantity, formData.operation]);

  // Form validation
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    
    if (formData.operation === 'remove' && formData.quantity > formData.currentStock) {
      newErrors.quantity = 'Cannot remove more than current stock';
    }
    
    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required for stock updates';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        ...formData,
        resultingStock
      });
    }
  }, [formData, validateForm, onSubmit, resultingStock]);

  const resetForm = useCallback(() => {
    setFormData({
      type: stockData.type || '',
      id: stockData.id || null,
      name: stockData.name || '',
      currentStock: stockData.currentStock || 0,
      quantity: 1,
      operation: 'add',
      reason: ''
    });
    setErrors({});
  }, [stockData]);

  const handleClose = useCallback(() => {
    resetForm();
    onHide();
  }, [resetForm, onHide]);

  // Update form when stockData changes
  React.useEffect(() => {
    setFormData(prev => ({
      ...prev,
      type: stockData.type || '',
      id: stockData.id || null,
      name: stockData.name || '',
      currentStock: stockData.currentStock || 0
    }));
  }, [stockData]);

  const operationOptions = useMemo(() => [
    { value: 'add', label: 'Add Stock', icon: 'bi-plus-circle', color: 'success' },
    { value: 'remove', label: 'Remove Stock', icon: 'bi-dash-circle', color: 'warning' }
  ], []);

  const reasonSuggestions = useMemo(() => {
    if (formData.operation === 'add') {
      return [
        'New shipment received',
        'Purchase order delivery',
        'Transfer from another location',
        'Return from department',
        'Inventory correction'
      ];
    } else {
      return [
        'Patient administration',
        'Expired items disposal',
        'Transfer to another location',
        'Damaged items',
        'Inventory correction'
      ];
    }
  }, [formData.operation]);

  return (
    <Modal show={show} onHide={handleClose} size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-box-seam me-2"></i>
          Update Stock - {formData.name}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          {/* Current Stock Display */}
          <div className="alert alert-info mb-4">
            <div className="row align-items-center">
              <div className="col-md-6">
                <label className="form-label fw-bold mb-1">Current Stock:</label>
                <div className="current-stock-display">
                  <span className="stock-number">{formData.currentStock}</span>
                  <span className="stock-unit">
                    {formData.type === 'vaccine' ? ' doses' : ' units'}
                  </span>
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold">Operation:</label>
                <Form.Select 
                  value={formData.operation}
                  onChange={(e) => handleFormChange('operation', e.target.value)}
                  className="mt-1"
                >
                  {operationOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </div>
            </div>
          </div>
          
          {/* Quantity Input */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">
              <i className={`bi ${formData.operation === 'add' ? 'bi-plus-circle text-success' : 'bi-dash-circle text-warning'} me-2`}></i>
              {formData.operation === 'add' ? 'Quantity to Add:' : 'Quantity to Remove:'}
            </Form.Label>
            <OptimizedNumberInput
              value={formData.quantity}
              onChange={(value) => handleFormChange('quantity', value)}
              min={1}
              max={formData.operation === 'remove' ? formData.currentStock : undefined}
              placeholder={`Enter ${formData.operation === 'add' ? 'quantity to add' : 'quantity to remove'}`}
              required
              className={errors.quantity ? 'is-invalid' : ''}
            />
            {errors.quantity && (
              <div className="invalid-feedback d-block">
                {errors.quantity}
              </div>
            )}
          </Form.Group>

          {/* Reason Input */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Reason for Stock Update:</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Enter reason for this stock update..."
              value={formData.reason}
              onChange={(e) => handleFormChange('reason', e.target.value)}
              isInvalid={!!errors.reason}
              required
            />
            <Form.Control.Feedback type="invalid">
              {errors.reason}
            </Form.Control.Feedback>
            
            {/* Quick reason suggestions */}
            <div className="mt-2">
              <small className="text-muted">Quick suggestions:</small>
              <div className="d-flex flex-wrap gap-1 mt-1">
                {reasonSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => handleFormChange('reason', suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </Form.Group>
          
          {/* Stock Preview */}
          <div className="stock-preview">
            <div className={`alert ${resultingStock === 0 ? 'alert-warning' : resultingStock < 10 ? 'alert-warning' : 'alert-success'}`}>
              <strong>Preview:</strong> 
              <span className="mx-2">
                {formData.currentStock} 
                {formData.operation === 'add' ? ' + ' : ' - '}
                {formData.quantity || 0} = 
              </span>
              <strong className={`${resultingStock === 0 ? 'text-danger' : resultingStock < 10 ? 'text-warning' : 'text-success'}`}>
                {resultingStock}
              </strong>
              <span className="ms-1">
                {formData.type === 'vaccine' ? ' doses' : ' units'}
              </span>
              {resultingStock === 0 && (
                <div className="mt-1">
                  <i className="bi bi-exclamation-triangle text-danger me-1"></i>
                  <small className="text-danger">Warning: This will result in zero stock!</small>
                </div>
              )}
              {resultingStock > 0 && resultingStock < 10 && (
                <div className="mt-1">
                  <i className="bi bi-exclamation-triangle text-warning me-1"></i>
                  <small className="text-warning">Low stock warning: Consider reordering soon.</small>
                </div>
              )}
            </div>
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          variant={formData.operation === 'add' ? 'success' : 'warning'}
          onClick={handleSubmit}
          disabled={loading || !formData.quantity}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Updating...
            </>
          ) : (
            <>
              <i className={`bi ${formData.operation === 'add' ? 'bi-plus-circle' : 'bi-dash-circle'} me-2`}></i>
              {formData.operation === 'add' ? 'Add Stock' : 'Remove Stock'}
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
});

OptimizedStockUpdateForm.displayName = 'OptimizedStockUpdateForm';

export default OptimizedStockUpdateForm;
