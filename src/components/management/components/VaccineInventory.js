import React, { useState, useEffect } from 'react';
import { Button, Table, Badge, Card, Row, Col, Modal, Form, InputGroup } from 'react-bootstrap';
import inventoryService from '../../../services/inventoryService';
import LoadingManagementBar from '../LoadingManagementBar';
import '../styles/ManagementInventory.css';

const VaccineInventory = ({ currentDateTime, isDarkMode }) => {
  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [selectedVaccine, setSelectedVaccine] = useState(null);
  const [stockToAdd, setStockToAdd] = useState({ amount: '', expiryDate: '', batchNumber: '', lotNumber: '' });
  
  // Remove mode states
  const [removeMode, setRemoveMode] = useState(false);
  const [selectedVaccinesForRemoval, setSelectedVaccinesForRemoval] = useState(new Set());

  // Batch disposal states
  const [showDisposalModal, setShowDisposalModal] = useState(false);
  const [batchToDispose, setBatchToDispose] = useState(null);
  const [disposalCountdown, setDisposalCountdown] = useState(5);
  const [isDisposalActive, setIsDisposalActive] = useState(false);

  const [vaccineFormData, setVaccineFormData] = useState({
    name: '',
    description: '',
    manufacturer: '',
    category: '',
    vaccineType: '',
    batchNumber: '',
    quantityInStock: '',
    minimumStock: '',
    unitCost: '',
    expiryDate: '',
    storageTemperature: '',
    routeOfAdministration: '',
    ageGroup: '',
    dosesRequired: '',
    intervalBetweenDoses: '',
    contraindications: '',
    sideEffects: '',
    storageConditions: '',
    notes: ''
  });

  useEffect(() => {
    loadVaccineData();
  }, []);

  const loadVaccineData = async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getAllVaccines();
      setVaccines(data || []);
    } catch (error) {
      console.error('Error loading vaccines:', error);
      setVaccines([]);
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

  const sortedAndFilteredVaccines = React.useMemo(() => {
    let filtered = vaccines.filter(vaccine =>
      vaccine.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vaccine.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vaccine.vaccineType?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle different data types
        if (sortConfig.key === 'name') {
          aValue = aValue?.toLowerCase() || '';
          bValue = bValue?.toLowerCase() || '';
        } else if (sortConfig.key === 'quantityInStock' || sortConfig.key === 'unitCost') {
          // Handle stock field - use dosesInStock or quantityInStock as fallback
          if (sortConfig.key === 'quantityInStock') {
            aValue = parseFloat(a.dosesInStock || a.quantityInStock) || 0;
            bValue = parseFloat(b.dosesInStock || b.quantityInStock) || 0;
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
  }, [vaccines, searchTerm, sortConfig]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVaccines = sortedAndFilteredVaccines.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedAndFilteredVaccines.length / itemsPerPage);

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



  const handleAddVaccine = async () => {
    try {
      await inventoryService.createVaccine(vaccineFormData);
      setShowAddModal(false);
      loadVaccineData();
      setVaccineFormData({
        name: '', description: '', manufacturer: '', vaccineType: '', batchNumber: '',
        quantityInStock: '', minimumStock: '', unitCost: '', expiryDate: '',
        storageTemperature: '', routeOfAdministration: '', ageGroup: '',
        dosesRequired: '', intervalBetweenDoses: '', contraindications: '',
        sideEffects: '', storageConditions: '', notes: ''
      });
    } catch (error) {
      console.error('Error adding vaccine:', error);
    }
  };

  const handleAddStock = async () => {
    try {
      // Validate required fields
      if (!stockToAdd.amount || !stockToAdd.expiryDate || !stockToAdd.batchNumber) {
        alert('Please fill in all required fields: Amount, Expiry Date, and Batch Number');
        return;
      }

      // Create new batch using the vaccine batch API (like medications)
      const batchData = {
        batchNumber: stockToAdd.batchNumber,
        lotNumber: stockToAdd.lotNumber || stockToAdd.batchNumber,
        dosesReceived: parseInt(stockToAdd.amount),
        expiryDate: stockToAdd.expiryDate,
        unitCost: selectedVaccine.unitCost || 0,
        manufacturer: selectedVaccine.manufacturer || 'Unknown',
        supplier: selectedVaccine.manufacturer || 'Unknown'
      };

      const response = await fetch(`http://localhost:5000/api/vaccine-batches/${selectedVaccine.id}/batches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batchData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ New vaccine batch created:', result.batch.batchNumber);
        
        setShowAddStockModal(false);
        setStockToAdd({ amount: '', expiryDate: '', batchNumber: '', lotNumber: '' });
        loadVaccineData(); // Refresh the vaccine list
        
        // Show success message
        alert(`✅ Successfully added ${stockToAdd.amount} doses as batch ${stockToAdd.batchNumber}`);
      } else {
        const error = await response.json();
        console.error('❌ Failed to create vaccine batch:', error);
        alert(`Failed to add stock: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding vaccine stock:', error);
      alert(`Error adding vaccine stock: ${error.message}`);
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
      const response = await fetch(`/api/vaccine-batches/${batchToDispose.id}/dispose`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setShowDisposalModal(false);
        setIsDisposalActive(false);
        setBatchToDispose(null);
        // Refresh the vaccine details
        if (selectedVaccine) {
          handleViewVaccine(selectedVaccine);
        }
        loadVaccineData();
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

  const handleViewVaccine = async (vaccine) => {
    try {
      setLoading(true);
      
      // Fetch vaccine batches from the new batch system
      const response = await fetch(`/api/vaccine-batches/${vaccine.id}/enhanced`);
      const enhancedVaccine = await response.json();
      
      if (response.ok) {
        setSelectedVaccine({
          ...vaccine,
          batches: enhancedVaccine.batches || [],
          totalDoses: enhancedVaccine.totalDoses || 0,
          batchCount: enhancedVaccine.batchCount || 0
        });
      } else {
        // Fallback to original vaccine data if batch fetch fails
        setSelectedVaccine({
          ...vaccine,
          batches: [],
          totalDoses: vaccine.dosesInStock || 0,
          batchCount: 0
        });
      }
      
      setShowViewModal(true);
    } catch (error) {
      console.error('Error fetching vaccine details:', error);
      // Fallback to original vaccine data
      setSelectedVaccine({
        ...vaccine,
        batches: [],
        totalDoses: vaccine.dosesInStock || 0,
        batchCount: 0
      });
      setShowViewModal(true);
    } finally {
      setLoading(false);
    }
  };

  // Remove mode functions
  const toggleRemoveMode = () => {
    setRemoveMode(!removeMode);
    setSelectedVaccinesForRemoval(new Set());
  };

  const handleVaccineSelection = (vaccineId) => {
    const newSelected = new Set(selectedVaccinesForRemoval);
    if (newSelected.has(vaccineId)) {
      newSelected.delete(vaccineId);
    } else {
      newSelected.add(vaccineId);
    }
    setSelectedVaccinesForRemoval(newSelected);
  };

  const handleRemoveSelected = async () => {
    try {
      if (selectedVaccinesForRemoval.size === 0) return;

      const confirmRemove = window.confirm(`Are you sure you want to remove ${selectedVaccinesForRemoval.size} vaccine(s)?`);
      if (!confirmRemove) return;

      // Remove items
      for (const vaccineId of selectedVaccinesForRemoval) {
        await inventoryService.deleteVaccine(vaccineId);
      }

      // Reset states and reload data
      setSelectedVaccinesForRemoval(new Set());
      setRemoveMode(false);
      loadVaccineData();
      alert(`Successfully removed ${selectedVaccinesForRemoval.size} vaccine(s).`);
    } catch (error) {
      console.error('Error removing vaccines:', error);
      alert('Failed to remove some vaccines. Please try again.');
    }
  };

  if (loading) {
    return <LoadingManagementBar 
      message="Loading vaccine inventory..." 
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
                  placeholder="Search vaccines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3} className="text-center">
              <div className="inventory-stats">
                <Badge bg="primary" className="me-1">
                  Total: {sortedAndFilteredVaccines.length}
                </Badge>
                <Badge bg="warning" className="me-1">
                  Low Stock: {sortedAndFilteredVaccines.filter(v => getStockStatus(v.dosesInStock || v.quantityInStock || 0, v.minimumStock) === 'low').length}
                </Badge>
                <Badge bg="danger">
                  Critical: {sortedAndFilteredVaccines.filter(v => getStockStatus(v.dosesInStock || v.quantityInStock || 0, v.minimumStock) === 'critical').length}
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
                  Add Vaccine
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
                {removeMode && selectedVaccinesForRemoval.size > 0 && (
                  <Button 
                    variant="danger" 
                    className="ms-2"
                    onClick={handleRemoveSelected}
                  >
                    <i className="bi bi-trash-fill me-1"></i>
                    Remove Selected ({selectedVaccinesForRemoval.size})
                  </Button>
                )}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Vaccines Table */}
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
                  Vaccine {getSortIcon('name')}
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
              {currentVaccines.map((vaccine) => {
                const currentStock = vaccine.dosesInStock || vaccine.quantityInStock || 0;
                const stockStatus = getStockStatus(currentStock, vaccine.minimumStock);
                const isExpiringSoon = new Date(vaccine.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                
                return (
                  <tr key={vaccine.id} className={removeMode && selectedVaccinesForRemoval.has(vaccine.id) ? 'table-danger' : ''}>
                    {removeMode && (
                      <td>
                        <Form.Check
                          type="checkbox"
                          checked={selectedVaccinesForRemoval.has(vaccine.id)}
                          onChange={() => handleVaccineSelection(vaccine.id)}
                        />
                      </td>
                    )}
                    <td>
                      <div className="vaccine-info">
                        <strong>{vaccine.name}</strong>
                        <br />
                        <small className="text-muted">{vaccine.manufacturer}</small>
                      </div>
                    </td>
                    <td>
                      <div className="stock-info">
                        <strong>{vaccine.dosesInStock || vaccine.quantityInStock || 0}</strong>
                        <small className="text-muted d-block">Min: {vaccine.minimumStock}</small>
                      </div>
                    </td>
                    <td>
                      <span className={isExpiringSoon ? 'text-warning fw-bold' : new Date(vaccine.expiryDate) < new Date() ? 'text-danger fw-bold' : ''}>
                        {new Date(vaccine.expiryDate).toLocaleDateString()}
                        {isExpiringSoon && <i className="bi bi-exclamation-triangle ms-1"></i>}
                      </span>
                    </td>
                    <td>₱{vaccine.unitCost}</td>
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
                          onClick={() => handleViewVaccine(vaccine)}
                        >
                          <i className="bi bi-eye"></i>
                        </Button>
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => {
                            setSelectedVaccine(vaccine);
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

      {/* Add Vaccine Modal - Enhanced from Admin */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg" className="management-inventory-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-shield-plus me-2 text-primary"></i>
            Add New Vaccine
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={(e) => {
            e.preventDefault();
            handleAddVaccine();
          }}>
            <Row>
              <Col md={6}>
                <h6 className="mb-3 text-primary">
                  <i className="bi bi-info-circle me-2"></i>
                  Basic Information
                </h6>
                <Form.Group className="mb-3">
                  <Form.Label>Vaccine Name *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., BCG Vaccine"
                    value={vaccineFormData.name}
                    onChange={(e) => setVaccineFormData({...vaccineFormData, name: e.target.value})}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Brief description of the vaccine"
                    value={vaccineFormData.description || ''}
                    onChange={(e) => setVaccineFormData({...vaccineFormData, description: e.target.value})}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Category *</Form.Label>
                  <Form.Select 
                    value={vaccineFormData.category || ''}
                    onChange={(e) => setVaccineFormData({...vaccineFormData, category: e.target.value})}
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Routine Childhood">Routine Childhood</option>
                    <option value="Adult">Adult</option>
                    <option value="Travel">Travel</option>
                    <option value="Occupational">Occupational</option>
                    <option value="Emergency">Emergency</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Manufacturer *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., Sanofi Pasteur"
                    value={vaccineFormData.manufacturer}
                    onChange={(e) => setVaccineFormData({...vaccineFormData, manufacturer: e.target.value})}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Age Group</Form.Label>
                  <Form.Select
                    value={vaccineFormData.ageGroup}
                    onChange={(e) => setVaccineFormData({...vaccineFormData, ageGroup: e.target.value})}
                  >
                    <option value="">Select Age Group</option>
                    <option value="Infant (0-2 years)">Infant (0-2 years)</option>
                    <option value="Child (2-12 years)">Child (2-12 years)</option>
                    <option value="Adolescent (12-18 years)">Adolescent (12-18 years)</option>
                    <option value="Adult (18-65 years)">Adult (18-65 years)</option>
                    <option value="Elderly (65+ years)">Elderly (65+ years)</option>
                    <option value="All Ages">All Ages</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <h6 className="mb-3 text-success">
                  <i className="bi bi-box me-2"></i>
                  Inventory & Storage Details
                </h6>
                <Form.Group className="mb-3">
                  <Form.Label>Batch Number</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., BCG001-2024"
                    value={vaccineFormData.batchNumber || ''}
                    onChange={(e) => setVaccineFormData({...vaccineFormData, batchNumber: e.target.value})}
                  />
                </Form.Group>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Doses in Stock *</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="0"
                        value={vaccineFormData.quantityInStock}
                        onChange={(e) => setVaccineFormData({...vaccineFormData, quantityInStock: parseInt(e.target.value) || 0})}
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
                        value={vaccineFormData.minimumStock}
                        onChange={(e) => setVaccineFormData({...vaccineFormData, minimumStock: parseInt(e.target.value) || 0})}
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
                        value={vaccineFormData.unitCost || ''}
                        onChange={(e) => setVaccineFormData({...vaccineFormData, unitCost: parseFloat(e.target.value) || 0})}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Expiry Date *</Form.Label>
                      <Form.Control
                        type="date"
                        value={vaccineFormData.expiryDate}
                        onChange={(e) => setVaccineFormData({...vaccineFormData, expiryDate: e.target.value})}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Storage Temperature</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., 2-8°C"
                    value={vaccineFormData.storageTemperature}
                    onChange={(e) => setVaccineFormData({...vaccineFormData, storageTemperature: e.target.value})}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Additional notes or instructions"
                    value={vaccineFormData.notes || ''}
                    onChange={(e) => setVaccineFormData({...vaccineFormData, notes: e.target.value})}
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
            onClick={() => handleAddVaccine()}
            className="management-btn-primary"
          >
            <i className="bi bi-plus-circle me-2"></i>Add Vaccine
          </Button>
        </Modal.Footer>
      </Modal>


      {/* View Vaccine Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-shield-check me-2"></i>
            {selectedVaccine?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedVaccine && (
            <div className="vaccine-details">
              <Row>
                <Col md={6}>
                  <div className="detail-section">
                    <h6 className="section-title">BASIC INFORMATION</h6>
                    <div className="detail-item">
                      <strong>Name:</strong> {selectedVaccine.name}
                    </div>
                    <div className="detail-item">
                      <strong>Category:</strong> {selectedVaccine.category}
                    </div>
                    <div className="detail-item">
                      <strong>Manufacturer:</strong> {selectedVaccine.manufacturer}
                    </div>
                    <div className="detail-item">
                      <strong>Storage Temp:</strong> {selectedVaccine.storageTemp || selectedVaccine.storageTemperature}
                    </div>
                    <div className="detail-item">
                      <strong>Route:</strong> {selectedVaccine.administrationRoute || selectedVaccine.routeOfAdministration}
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="detail-section">
                    <h6 className="section-title">
                      STOCK INFORMATION 
                      <Badge bg="info" className="ms-2">
                        {selectedVaccine.batchCount || 0} BATCHES
                      </Badge>
                    </h6>
                    <div className="detail-item">
                      <strong>Total Stock:</strong> {selectedVaccine.totalDoses || selectedVaccine.dosesInStock || 0}
                    </div>
                    <div className="detail-item">
                      <strong>Minimum Stock:</strong> {selectedVaccine.minimumStock}
                    </div>
                  </div>
                </Col>
              </Row>
              
              {/* Batch Details Section */}
              <Row className="mt-4">
                <Col>
                  <div className="detail-section">
                    <h6 className="section-title">BATCH DETAILS</h6>
                    {selectedVaccine.batches && selectedVaccine.batches.length > 0 ? (
                      <div className="batch-list">
                        {selectedVaccine.batches.map((batch, index) => {
                          const isExpired = new Date(batch.expiryDate) < new Date();
                          return (
                            <div key={batch.id || index} className={`batch-item ${isExpired ? 'expired-batch' : ''}`}>
                              <div className="batch-header">
                                <strong className="batch-number">{batch.batchNumber}</strong>
                                <div className="batch-badges">
                                  <Badge bg="success" className="doses-badge">
                                    {batch.dosesRemaining || batch.dosesInStock} doses
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
                                {batch.lotNumber && <span> • Lot: {batch.lotNumber}</span>}
                                {batch.supplierName && <span> • {batch.supplierName}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="no-batches">
                        <p className="text-muted">No batch information available</p>
                      </div>
                    )}
                  </div>
                </Col>
              </Row>
              
              {selectedVaccine.description && (
                <Row className="mt-3">
                  <Col>
                    <div className="detail-section">
                      <h6 className="section-title">Description</h6>
                      <p>{selectedVaccine.description}</p>
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

      {/* Add Stock Modal */}
      <Modal show={showAddStockModal} onHide={() => setShowAddStockModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Stock - {selectedVaccine?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
              <Form.Label>Lot Number</Form.Label>
              <Form.Control
                type="text"
                value={stockToAdd.lotNumber}
                onChange={(e) => setStockToAdd({...stockToAdd, lotNumber: e.target.value})}
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
            Add Stock
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
                  <strong>Vaccine:</strong> {batchToDispose.vaccineName}<br/>
                  <strong>Doses:</strong> {batchToDispose.dosesRemaining}<br/>
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

export default VaccineInventory;
