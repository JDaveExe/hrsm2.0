import React, { useState, useEffect } from 'react';
import { Button, Table, Badge, Card, Row, Col, Modal, Form, InputGroup } from 'react-bootstrap';
import inventoryService from '../../../services/inventoryService';
import LoadingManagementBar from '../LoadingManagementBar';
import '../styles/ManagementInventory.css';

const PrescriptionInventory = ({ currentDateTime, isDarkMode }) => {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [stockToAdd, setStockToAdd] = useState({ amount: '', expiryDate: '', batchNumber: '' });
  
  // Batch management states
  const [medicationBatches, setMedicationBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [showBatchDetails, setShowBatchDetails] = useState(false);
  
  // Batch disposal states
  const [showDisposalModal, setShowDisposalModal] = useState(false);
  const [batchToDispose, setBatchToDispose] = useState(null);
  const [disposalCountdown, setDisposalCountdown] = useState(5);
  const [isDisposalActive, setIsDisposalActive] = useState(false);
  
  // Remove mode states
  const [removeMode, setRemoveMode] = useState(false);
  const [selectedMedicationsForRemoval, setSelectedMedicationsForRemoval] = useState(new Set());

  const [medicationFormData, setMedicationFormData] = useState({
    name: '',
    genericName: '',
    brandName: '',
    description: '',
    manufacturer: '',
    category: '',
    batchNumber: '',
    quantityInStock: '',
    minimumStock: '',
    unitCost: '',
    sellingPrice: '',
    expiryDate: '',
    dosageForm: '',
    strength: '',
    storageConditions: '',
    isPrescriptionRequired: true,
    activeIngredients: '',
    therapeuticClass: '',
    sideEffects: '',
    contraindications: '',
    notes: ''
  });

  useEffect(() => {
    loadMedicationData();
  }, []);

  const loadMedicationData = async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getAllMedications();
      setMedications(data || []);
    } catch (error) {
      console.error('Error loading medications:', error);
      setMedications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <i className="bi bi-arrow-down-up ms-1 text-muted"></i>;
    }
    return sortConfig.direction === 'asc' 
      ? <i className="bi bi-arrow-up ms-1 text-primary"></i>
      : <i className="bi bi-arrow-down ms-1 text-primary"></i>;
  };

  const sortedAndFilteredMedications = React.useMemo(() => {
    let filtered = medications.filter(med =>
      med.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle different data types
        if (sortConfig.key === 'name' || sortConfig.key === 'category') {
          aValue = aValue?.toLowerCase() || '';
          bValue = bValue?.toLowerCase() || '';
        } else if (sortConfig.key === 'quantityInStock' || sortConfig.key === 'unitCost') {
          // Handle stock field - use unitsInStock or quantityInStock as fallback
          if (sortConfig.key === 'quantityInStock') {
            aValue = parseFloat(a.unitsInStock || a.quantityInStock) || 0;
            bValue = parseFloat(b.unitsInStock || b.quantityInStock) || 0;
          } else {
            aValue = parseFloat(aValue) || 0;
            bValue = parseFloat(bValue) || 0;
          }
        } else if (sortConfig.key === 'expiryDate') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [medications, searchTerm, sortConfig]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMedications = sortedAndFilteredMedications.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedAndFilteredMedications.length / itemsPerPage);

  const getStockStatus = (current, minimum) => {
    if (current <= minimum * 0.25) return 'critical';
    if (current <= minimum * 0.5) return 'low';
    if (current < minimum) return 'medium';
    return 'good';
  };

  const getStockBadge = (status) => {
    const badges = {
      'critical': 'danger',
      'low': 'warning', 
      'medium': 'info',
      'good': 'success'
    };
    return badges[status] || 'secondary';
  };

  const handleAddMedication = async () => {
    try {
      await inventoryService.createMedication(medicationFormData);
      setShowAddModal(false);
      loadMedicationData();
      setMedicationFormData({
        name: '', description: '', manufacturer: '', category: '', batchNumber: '',
        quantityInStock: '', minimumStock: '', unitCost: '', expiryDate: '',
        dosageForm: '', strength: '', storageConditions: '', prescriptionRequired: true,
        activeIngredients: '', therapeuticClass: '', sideEffects: '', contraindications: '', notes: ''
      });
    } catch (error) {
      console.error('Error adding medication:', error);
    }
  };

  const handleAddStock = async () => {
    try {
      // Validate required fields
      if (!stockToAdd.amount || !stockToAdd.expiryDate || !stockToAdd.batchNumber) {
        alert('Please fill in all required fields: Amount, Expiry Date, and Batch Number');
        return;
      }

      // Create new batch using the new batch API
      const batchData = {
        batchNumber: stockToAdd.batchNumber,
        quantityReceived: parseInt(stockToAdd.amount),
        expiryDate: stockToAdd.expiryDate,
        unitCost: selectedMedication.unitCost || 0,
        supplier: selectedMedication.manufacturer || 'Unknown'
      };

      const token = localStorage.getItem('token') || window.__authToken;
      const response = await fetch(`http://localhost:5000/api/medication-batches/${selectedMedication.id}/batches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(batchData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ New batch created:', result.batch.batchNumber);
        
        setShowAddStockModal(false);
        setStockToAdd({ amount: '', expiryDate: '', batchNumber: '' });
        loadMedicationData(); // Refresh the medication list
        
        // Show success message
        alert(`✅ Successfully added ${stockToAdd.amount} units as batch ${stockToAdd.batchNumber}`);
      } else {
        const error = await response.json();
        console.error('❌ Failed to create batch:', error);
        alert(`Failed to add stock: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding stock:', error);
      alert(`Error adding stock: ${error.message}`);
    }
  };

  // Batch disposal functions
  const handleExpiredBatchClick = (batch) => {
    setBatchToDispose(batch);
    setShowDisposalModal(true);
    setDisposalCountdown(5);
    setIsDisposalActive(false);
  };

  const startDisposalCountdown = () => {
    setIsDisposalActive(true);
    const interval = setInterval(() => {
      setDisposalCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          confirmBatchDisposal();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const confirmBatchDisposal = async () => {
    try {
      // Call API to dispose of the batch
      const response = await fetch(`/api/medication-batches/${batchToDispose.id}/dispose`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setShowDisposalModal(false);
        setIsDisposalActive(false);
        setBatchToDispose(null);
        // Refresh the medication details
        if (selectedMedication) {
          handleViewMedication(selectedMedication);
        }
        loadMedicationData();
      } else {
        throw new Error('Failed to dispose batch');
      }
    } catch (error) {
      console.error('Error disposing batch:', error);
      alert('Failed to dispose batch. Please try again.');
    }
  };

  const cancelDisposal = () => {
    setShowDisposalModal(false);
    setIsDisposalActive(false);
    setBatchToDispose(null);
    setDisposalCountdown(5);
  };

  const handleViewMedication = async (medication) => {
    setSelectedMedication(medication);
    setShowViewModal(true);
    
    // Fetch batch information for this medication
    setLoadingBatches(true);
    try {
      const response = await fetch(`http://localhost:5000/api/medication-batches/${medication.id}/batches`);
      if (response.ok) {
        const batches = await response.json();
        setMedicationBatches(batches);
      } else {
        console.warn('Failed to fetch batches:', response.statusText);
        setMedicationBatches([]);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      setMedicationBatches([]);
    } finally {
      setLoadingBatches(false);
    }
  };

  // Remove mode functions
  const toggleRemoveMode = () => {
    setRemoveMode(!removeMode);
    setSelectedMedicationsForRemoval(new Set());
  };

  const handleMedicationSelection = (medicationId) => {
    const newSelected = new Set(selectedMedicationsForRemoval);
    if (newSelected.has(medicationId)) {
      newSelected.delete(medicationId);
    } else {
      newSelected.add(medicationId);
    }
    setSelectedMedicationsForRemoval(newSelected);
  };

  const handleRemoveSelected = async () => {
    try {
      if (selectedMedicationsForRemoval.size === 0) return;

      const confirmRemove = window.confirm(`Are you sure you want to remove ${selectedMedicationsForRemoval.size} medication(s)?`);
      if (!confirmRemove) return;

      // Remove items
      for (const medicationId of selectedMedicationsForRemoval) {
        await inventoryService.deleteMedication(medicationId);
      }

      // Reset states and reload data
      setSelectedMedicationsForRemoval(new Set());
      setRemoveMode(false);
      loadMedicationData();
      alert(`Successfully removed ${selectedMedicationsForRemoval.size} medication(s).`);
    } catch (error) {
      console.error('Error removing medications:', error);
      alert('Failed to remove some medications. Please try again.');
    }
  };

  if (loading) {
    return <LoadingManagementBar 
      message="Loading prescription inventory..." 
      duration="normal"
    />;
  }

  return (
    <div className="management-inventory-container">
      {/* Search and Filter Section */}
      <Card className="management-inventory-card mb-3">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={3}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search medications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3} className="text-center">
              <div className="inventory-stats">
                <Badge bg="primary" className="me-1">
                  Total: {sortedAndFilteredMedications.length}
                </Badge>
                <Badge bg="warning" className="me-1">
                  Low Stock: {sortedAndFilteredMedications.filter(m => getStockStatus(m.unitsInStock || m.quantityInStock || 0, m.minimumStock) === 'low').length}
                </Badge>
                <Badge bg="danger">
                  Critical: {sortedAndFilteredMedications.filter(m => getStockStatus(m.unitsInStock || m.quantityInStock || 0, m.minimumStock) === 'critical').length}
                </Badge>
              </div>
            </Col>
            <Col md={3} className="text-center">
              {totalPages > 1 && (
                <div className="management-pagination-top">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    <i className="bi bi-arrow-left"></i>
                  </Button>
                  <span className="pagination-info mx-2">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    <i className="bi bi-arrow-right"></i>
                  </Button>
                </div>
              )}
            </Col>
            <Col md={3} className="text-end">
              <div className="header-actions">
                <Button 
                  variant="primary" 
                  className="management-btn-primary"
                  onClick={() => setShowAddModal(true)}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Add Medication
                </Button>
                
                <Button 
                  variant={removeMode ? "danger" : "outline-danger"} 
                  className="ms-2"
                  onClick={toggleRemoveMode}
                >
                  <i className={`bi ${removeMode ? 'bi-x-circle' : 'bi-trash'} me-1`}></i>
                  {removeMode ? 'Cancel' : 'Remove'}
                </Button>
                
                {/* Remove Selected Button - only show when in remove mode and items selected */}
                {removeMode && selectedMedicationsForRemoval.size > 0 && (
                  <Button 
                    variant="danger" 
                    className="ms-2"
                    onClick={handleRemoveSelected}
                  >
                    <i className="bi bi-trash-fill me-1"></i>
                    Remove Selected ({selectedMedicationsForRemoval.size})
                  </Button>
                )}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Medications Table */}
      <Card className="management-inventory-card">
        <Card.Body>
          <Table responsive hover className="management-inventory-table">
            <thead>
              <tr>
                {removeMode && <th style={{ width: '50px' }}>Select</th>}
                <th 
                  className="sortable-header" 
                  onClick={() => handleSort('name')}
                >
                  Medication {getSortIcon('name')}
                </th>
                <th 
                  className="sortable-header" 
                  onClick={() => handleSort('category')}
                >
                  Category {getSortIcon('category')}
                </th>
                <th 
                  className="sortable-header" 
                  onClick={() => handleSort('quantityInStock')}
                >
                  Stock Level {getSortIcon('quantityInStock')}
                </th>
                <th 
                  className="sortable-header" 
                  onClick={() => handleSort('expiryDate')}
                >
                  Expiry Date {getSortIcon('expiryDate')}
                </th>
                <th 
                  className="sortable-header" 
                  onClick={() => handleSort('unitCost')}
                >
                  Cost per Unit {getSortIcon('unitCost')}
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentMedications.map((medication) => {
                const currentStock = medication.unitsInStock || medication.quantityInStock || 0;
                const stockStatus = getStockStatus(currentStock, medication.minimumStock);
                return (
                  <tr key={medication.id} className={removeMode && selectedMedicationsForRemoval.has(medication.id) ? 'table-danger' : ''}>
                    {removeMode && (
                      <td>
                        <Form.Check
                          type="checkbox"
                          checked={selectedMedicationsForRemoval.has(medication.id)}
                          onChange={() => handleMedicationSelection(medication.id)}
                        />
                      </td>
                    )}
                    <td>
                      <div className="medication-info">
                        <strong>{medication.name}</strong>
                        <br />
                        <small className="text-muted">{medication.strength} - {medication.dosageForm}</small>
                      </div>
                    </td>
                    <td>
                      <Badge bg="info" className="category-badge">
                        {medication.category}
                      </Badge>
                    </td>
                    <td>
                      <div className="stock-info">
                        <strong>{medication.unitsInStock || medication.quantityInStock || 0}</strong>
                        <small className="text-muted d-block">Min: {medication.minimumStock}</small>
                      </div>
                    </td>
                    <td>
                      <span className={new Date(medication.expiryDate) < new Date() ? 'text-danger' : ''}>
                        {new Date(medication.expiryDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td>₱{medication.unitCost}</td>
                    <td>
                      <Badge bg={getStockBadge(stockStatus)}>
                        {stockStatus.toUpperCase()}
                      </Badge>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-1"
                          onClick={() => handleViewMedication(medication)}
                        >
                          <i className="bi bi-eye"></i>
                        </Button>
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => {
                            setSelectedMedication(medication);
                            setShowAddStockModal(true);
                          }}
                        >
                          <i className="bi bi-plus"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Add Medication Modal - Enhanced from Admin */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="xl" className="management-inventory-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-capsule me-2 text-primary"></i>
            Add New Medication
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={(e) => {
            e.preventDefault();
            handleAddMedication();
          }}>
            <Row>
              <Col md={4}>
                <h6 className="mb-3 text-primary">
                  <i className="bi bi-info-circle me-2"></i>
                  Basic Information
                </h6>
                <Form.Group className="mb-3">
                  <Form.Label>Medication Name *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., Paracetamol"
                    value={medicationFormData.name}
                    onChange={(e) => setMedicationFormData({...medicationFormData, name: e.target.value})}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Generic Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., Acetaminophen"
                    value={medicationFormData.genericName || ''}
                    onChange={(e) => setMedicationFormData({...medicationFormData, genericName: e.target.value})}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Brand Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., Tylenol, Biogesic"
                    value={medicationFormData.brandName || ''}
                    onChange={(e) => setMedicationFormData({...medicationFormData, brandName: e.target.value})}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Category *</Form.Label>
                  <Form.Select 
                    value={medicationFormData.category}
                    onChange={(e) => setMedicationFormData({...medicationFormData, category: e.target.value})}
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Analgesics & Antipyretics">Analgesics & Antipyretics</option>
                    <option value="Antibiotics">Antibiotics</option>
                    <option value="Cardiovascular">Cardiovascular</option>
                    <option value="Respiratory">Respiratory</option>
                    <option value="Gastrointestinal">Gastrointestinal</option>
                    <option value="Dermatological">Dermatological</option>
                    <option value="Vitamins & Supplements">Vitamins & Supplements</option>
                    <option value="Others">Others</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <h6 className="mb-3 text-warning">
                  <i className="bi bi-capsule-pill me-2"></i>
                  Formulation Details
                </h6>
                <Form.Group className="mb-3">
                  <Form.Label>Form *</Form.Label>
                  <Form.Select 
                    value={medicationFormData.dosageForm || ''}
                    onChange={(e) => setMedicationFormData({...medicationFormData, dosageForm: e.target.value})}
                    required
                  >
                    <option value="">Select Form</option>
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Cream">Cream</option>
                    <option value="Ointment">Ointment</option>
                    <option value="Drop">Drop</option>
                    <option value="Others">Others</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Strength</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., 500mg"
                    value={medicationFormData.strength}
                    onChange={(e) => setMedicationFormData({...medicationFormData, strength: e.target.value})}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Manufacturer</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., Unilab"
                    value={medicationFormData.manufacturer || ''}
                    onChange={(e) => setMedicationFormData({...medicationFormData, manufacturer: e.target.value})}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Batch Number</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., PAR001-2024"
                    value={medicationFormData.batchNumber || ''}
                    onChange={(e) => setMedicationFormData({...medicationFormData, batchNumber: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <h6 className="mb-3 text-success">
                  <i className="bi bi-box me-2"></i>
                  Inventory & Pricing
                </h6>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Units in Stock *</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="0"
                        value={medicationFormData.quantityInStock}
                        onChange={(e) => setMedicationFormData({...medicationFormData, quantityInStock: parseInt(e.target.value) || 0})}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Minimum Stock *</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="0"
                        value={medicationFormData.minimumStock}
                        onChange={(e) => setMedicationFormData({...medicationFormData, minimumStock: parseInt(e.target.value) || 0})}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Unit Cost (₱)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={medicationFormData.unitCost}
                        onChange={(e) => setMedicationFormData({...medicationFormData, unitCost: parseFloat(e.target.value) || 0})}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Selling Price (₱)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={medicationFormData.sellingPrice || ''}
                        onChange={(e) => setMedicationFormData({...medicationFormData, sellingPrice: parseFloat(e.target.value) || 0})}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Expiry Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={medicationFormData.expiryDate}
                    onChange={(e) => setMedicationFormData({...medicationFormData, expiryDate: e.target.value})}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Prescription Required"
                    checked={medicationFormData.isPrescriptionRequired || false}
                    onChange={(e) => setMedicationFormData({...medicationFormData, isPrescriptionRequired: e.target.checked})}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Additional notes"
                    value={medicationFormData.notes || ''}
                    onChange={(e) => setMedicationFormData({...medicationFormData, notes: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowAddModal(false)}>
            <i className="bi bi-x-circle me-2"></i>Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={() => handleAddMedication()}
            className="management-btn-primary"
          >
            <i className="bi bi-plus-circle me-2"></i>Add Medication
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Medication Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-capsule me-2"></i>
            {selectedMedication?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedMedication && (
            <div className="medication-details">
              <Row>
                <Col md={6}>
                  <div className="detail-section">
                    <h6 className="section-title">Basic Information</h6>
                    <div className="detail-item">
                      <strong>Name:</strong> {selectedMedication.name}
                    </div>
                    <div className="detail-item">
                      <strong>Category:</strong> {selectedMedication.category}
                    </div>
                    <div className="detail-item">
                      <strong>Manufacturer:</strong> {selectedMedication.manufacturer}
                    </div>
                    <div className="detail-item">
                      <strong>Strength:</strong> {selectedMedication.strength}
                    </div>
                    <div className="detail-item">
                      <strong>Dosage Form:</strong> {selectedMedication.dosageForm}
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="detail-section">
                    <h6 className="section-title">
                      Stock Information 
                      {medicationBatches.length > 0 && (
                        <Badge bg="info" className="ms-2">
                          {medicationBatches.length} batch{medicationBatches.length !== 1 ? 'es' : ''}
                        </Badge>
                      )}
                    </h6>
                    <div className="detail-item">
                      <strong>Total Stock:</strong> {
                        medicationBatches.length > 0 
                          ? medicationBatches.reduce((sum, batch) => sum + batch.quantityRemaining, 0)
                          : (selectedMedication.quantityInStock || selectedMedication.unitsInStock || 0)
                      }
                    </div>
                    <div className="detail-item">
                      <strong>Minimum Stock:</strong> {selectedMedication.minimumStock || 0}
                    </div>
                    
                    {/* Show batch information if available */}
                    {loadingBatches ? (
                      <div className="detail-item">
                        <em>Loading batch information...</em>
                      </div>
                    ) : medicationBatches.length > 0 ? (
                      <div className="mt-3">
                        <h6 className="section-title">Batch Details</h6>
                        <div className="batch-list">
                          {medicationBatches.map((batch, index) => {
                            const isExpired = new Date(batch.expiryDate) < new Date();
                            return (
                              <div key={batch.id} className={`batch-item ${isExpired ? 'expired-batch' : ''}`}>
                                <div className="batch-header">
                                  <strong className="batch-number">{batch.batchNumber}</strong>
                                  <div className="batch-badges">
                                    <Badge bg="success" className="doses-badge">
                                      {batch.quantityRemaining} units
                                    </Badge>
                                    {isExpired && (
                                      <Badge 
                                        bg="danger" 
                                        className="expired-badge clickable-badge"
                                        onClick={() => handleExpiredBatchClick(batch)}
                                      >
                                        EXPIRED
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="batch-details">
                                  <span>Expires: {new Date(batch.expiryDate).toLocaleDateString()}</span>
                                  {batch.unitCost && <span> • Cost: ₱{batch.unitCost}</span>}
                                  {batch.supplier && <span> • {batch.supplier}</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : selectedMedication.batchNumber ? (
                      // Fallback to legacy single batch display (only if batchNumber exists)
                      <>
                        <div className="detail-item">
                          <strong>Batch Number:</strong> {selectedMedication.batchNumber || 'N/A'}
                        </div>
                        <div className="detail-item">
                          <strong>Expiry Date:</strong> {
                            selectedMedication.expiryDate 
                              ? new Date(selectedMedication.expiryDate).toLocaleDateString()
                              : 'N/A'
                          }
                        </div>
                        <div className="detail-item">
                          <strong>Unit Cost:</strong> ₱{selectedMedication.unitCost || 0}
                        </div>
                        <div className="mt-2">
                          <small className="text-warning">
                            <i className="bi bi-exclamation-triangle me-1"></i>
                            Legacy data - add new stock to create proper batches
                          </small>
                        </div>
                      </>
                    ) : (
                      // No batches at all
                      <div className="no-batches-message">
                        <i className="bi bi-info-circle me-2"></i>
                        <span>No batches available. Add stock to create batches.</span>
                      </div>
                    )}
                  </div>
                </Col>
              </Row>
              
              {selectedMedication.description && (
                <Row className="mt-3">
                  <Col>
                    <div className="detail-section">
                      <h6 className="section-title">Description</h6>
                      <p>{selectedMedication.description}</p>
                    </div>
                  </Col>
                </Row>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Stock Modal - Enhanced for Batch System */}
      <Modal show={showAddStockModal} onHide={() => setShowAddStockModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-plus-circle me-2 text-success"></i>
            Add New Batch - {selectedMedication?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="alert alert-info mb-3">
            <i className="bi bi-info-circle me-2"></i>
            <strong>Batch System:</strong> Each stock addition creates a new batch with separate expiry tracking.
            This prevents overwriting existing stock data.
          </div>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Quantity to Add</Form.Label>
              <Form.Control
                type="number"
                value={stockToAdd.amount}
                onChange={(e) => setStockToAdd({...stockToAdd, amount: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Batch Number</Form.Label>
              <Form.Control
                type="text"
                value={stockToAdd.batchNumber}
                onChange={(e) => setStockToAdd({...stockToAdd, batchNumber: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Expiry Date</Form.Label>
              <Form.Control
                type="date"
                value={stockToAdd.expiryDate}
                onChange={(e) => setStockToAdd({...stockToAdd, expiryDate: e.target.value})}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddStockModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleAddStock}>
            <i className="bi bi-plus-circle me-2"></i>
            Create New Batch
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Batch Disposal Modal */}
      <Modal 
        show={showDisposalModal} 
        onHide={cancelDisposal}
        backdrop="static"
        keyboard={false}
        centered
      >
        <Modal.Header closeButton={!isDisposalActive}>
          <Modal.Title className="text-danger">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Dispose Expired Batch
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {batchToDispose && (
            <div className="disposal-confirmation">
              <div className="alert alert-danger">
                <strong>⚠️ Warning:</strong> This action cannot be undone!
              </div>
              
              <div className="batch-disposal-details">
                <h6>Batch to be disposed:</h6>
                <div className="disposal-batch-info">
                  <strong>Batch Number:</strong> {batchToDispose.batchNumber}<br/>
                  <strong>Medication:</strong> {selectedMedication?.name}<br/>
                  <strong>Units:</strong> {batchToDispose.quantityRemaining}<br/>
                  <strong>Expired:</strong> {new Date(batchToDispose.expiryDate).toLocaleDateString()}
                </div>
              </div>

              <div className="disposal-reason mt-3">
                <p>This batch has expired and will be permanently removed from the inventory system.</p>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={cancelDisposal}
            disabled={isDisposalActive}
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={startDisposalCountdown}
            disabled={isDisposalActive}
            className="disposal-confirm-btn"
          >
            {isDisposalActive ? `Disposing... ${disposalCountdown}s` : 'Confirm Disposal'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PrescriptionInventory;
