import React, { useState, useEffect } from 'react';
import { Tab, Tabs, Button, Table, Badge, Card, Row, Col, Modal, Form } from 'react-bootstrap';
import inventoryService from '../../../services/inventoryService';
import './InventoryManagement.css';

const InventoryManagement = ({ currentPath, currentDateTime, simulationMode, isDarkMode = false, inventoryFilter = null }) => {
  const [activeTab, setActiveTab] = useState('vaccines');
  const [vaccines, setVaccines] = useState([]);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddVaccineModal, setShowAddVaccineModal] = useState(false);
  const [showEditVaccineModal, setShowEditVaccineModal] = useState(false);
  const [showViewVaccineModal, setShowViewVaccineModal] = useState(false);
  const [showAddStockVaccineModal, setShowAddStockVaccineModal] = useState(false);
  const [showAddMedicationModal, setShowAddMedicationModal] = useState(false);
  const [showEditMedicationModal, setShowEditMedicationModal] = useState(false);
  const [showViewMedicationModal, setShowViewMedicationModal] = useState(false);
  const [showAddStockMedicationModal, setShowAddStockMedicationModal] = useState(false);
  const [selectedVaccine, setSelectedVaccine] = useState(null);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [stockToAdd, setStockToAdd] = useState({ amount: '', expiryDate: '', batchNumber: '' });
  const [viewMode, setViewMode] = useState('table'); // 'grid' or 'table' - default to list view
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Remove mode states
  const [removeMode, setRemoveMode] = useState(false);
  const [selectedVaccinesForRemoval, setSelectedVaccinesForRemoval] = useState(new Set());
  const [selectedMedicationsForRemoval, setSelectedMedicationsForRemoval] = useState(new Set());

  const [vaccineFormData, setVaccineFormData] = useState({
    name: '',
    description: '',
    manufacturer: '',
    category: '',
    batchNumber: '',
    dosesInStock: '',
    minimumStock: '',
    unitCost: '',
    expiryDate: '',
    storageTemp: '',
    administrationRoute: '',
    ageGroups: [],
    dosageSchedule: '',
    sideEffects: '',
    contraindications: '',
    notes: ''
  });

  const [medicationFormData, setMedicationFormData] = useState({
    name: '',
    genericName: '',
    brandName: '',
    category: '',
    dosage: '',
    form: '',
    strength: '',
    manufacturer: '',
    batchNumber: '',
    unitsInStock: '',
    minimumStock: '',
    unitCost: '',
    sellingPrice: '',
    expiryDate: '',
    storageConditions: '',
    administrationRoute: '',
    indication: '',
    dosageInstructions: '',
    sideEffects: '',
    contraindications: '',
    interactions: '',
    precautions: '',
    isPrescriptionRequired: false,
    notes: ''
  });

  useEffect(() => {
    loadInventoryData();
  }, [activeTab]);

  const loadInventoryData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'vaccines') {
        const vaccineData = await inventoryService.getAllVaccines();
        setVaccines(vaccineData);
      } else {
        const medicationData = await inventoryService.getAllMedications();
        setMedications(medicationData);
      }
    } catch (error) {
      console.error('Error loading inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply search and inventory filter
  const applyFilters = (items, itemType) => {
    let filtered = items.filter(item => {
      const name = itemType === 'vaccine' ? item.name : item.name;
      const secondary = itemType === 'vaccine' ? item.manufacturer : item.genericName;
      const category = item.category;
      
      return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             secondary.toLowerCase().includes(searchTerm.toLowerCase()) ||
             category.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Apply inventory filter if specified (from alerts)
    if (inventoryFilter) {
      filtered = filtered.filter(item => {
        const stock = itemType === 'vaccine' ? item.dosesInStock : item.quantityInStock;
        const minStock = item.minimumStock || 10;
        
        if (inventoryFilter === 'critical') {
          return stock === 0;
        } else if (inventoryFilter === 'warning') {
          return stock > 0 && stock <= minStock;
        }
        return true;
      });
    }

    return filtered;
  };

  const filteredVaccines = applyFilters(vaccines, 'vaccine');
  const filteredMedications = applyFilters(medications, 'medication');

  // Pagination logic
  const getCurrentItems = (items) => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return items.slice(indexOfFirstItem, indexOfLastItem);
  };

  const getTotalPages = (items) => Math.ceil(items.length / itemsPerPage);

  const currentVaccines = getCurrentItems(filteredVaccines);
  const currentMedications = getCurrentItems(filteredMedications);
  const totalVaccinePages = getTotalPages(filteredVaccines);
  const totalMedicationPages = getTotalPages(filteredMedications);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Remove mode functions
  const toggleRemoveMode = () => {
    setRemoveMode(!removeMode);
    // Clear selections when toggling mode
    setSelectedVaccinesForRemoval(new Set());
    setSelectedMedicationsForRemoval(new Set());
  };

  const handleItemSelect = (itemId, itemType) => {
    if (itemType === 'vaccine') {
      const newSelected = new Set(selectedVaccinesForRemoval);
      if (newSelected.has(itemId)) {
        newSelected.delete(itemId);
      } else {
        newSelected.add(itemId);
      }
      setSelectedVaccinesForRemoval(newSelected);
    } else {
      const newSelected = new Set(selectedMedicationsForRemoval);
      if (newSelected.has(itemId)) {
        newSelected.delete(itemId);
      } else {
        newSelected.add(itemId);
      }
      setSelectedMedicationsForRemoval(newSelected);
    }
  };

  const handleRemoveSelected = async () => {
    try {
      const itemsToRemove = activeTab === 'vaccines' ? selectedVaccinesForRemoval : selectedMedicationsForRemoval;
      
      if (itemsToRemove.size === 0) return;

      // Remove items
      for (const itemId of itemsToRemove) {
        if (activeTab === 'vaccines') {
          await inventoryService.deleteVaccine(itemId);
        } else {
          await inventoryService.deleteMedication(itemId);
        }
      }

      // Refresh data and clear selections
      await loadInventoryData();
      setSelectedVaccinesForRemoval(new Set());
      setSelectedMedicationsForRemoval(new Set());
      setRemoveMode(false);
    } catch (error) {
      console.error('Error removing items:', error);
      alert('Failed to remove some items. Please try again.');
    }
  };

  // Reset to page 1 if current page is beyond available pages (prevents empty pages)
  useEffect(() => {
    const totalPages = activeTab === 'vaccines' ? totalVaccinePages : totalMedicationPages;
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredVaccines.length, filteredMedications.length, currentPage, activeTab, totalVaccinePages, totalMedicationPages]);

  // Handle inventory filter from alerts
  useEffect(() => {
    if (inventoryFilter) {
      setCurrentPage(1); // Reset to first page when filter is applied
      setSearchTerm(''); // Clear search to show all filtered items
    }
  }, [inventoryFilter]);

  const renderPagination = (totalPages) => {
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <Button
          key={i}
          variant={currentPage === i ? 'primary' : 'outline-secondary'}
          size="sm"
          className="me-1"
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Button>
      );
    }

    return (
      <div className="d-flex align-items-center gap-3">
        {/* View Mode Buttons */}
        <div className="d-flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'outline-secondary'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <i className="bi bi-grid-3x3-gap me-1"></i>Grid
          </Button>
          <Button
            variant={viewMode === 'table' ? 'primary' : 'outline-secondary'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <i className="bi bi-list me-1"></i>List
          </Button>
        </div>
        
        {/* Pagination Controls - hide in grid view */}
        {viewMode === 'table' && (
          <div className="d-flex align-items-center">
            <Button
              variant="outline-secondary"
              size="sm"
              className="me-2"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <i className="bi bi-chevron-left"></i>
            </Button>
            {pages}
            <Button
              variant="outline-secondary"
              size="sm"
              className="ms-1"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              <i className="bi bi-chevron-right"></i>
            </Button>
          </div>
        )}
      </div>
    );
  };

  const getStockStatus = (current, minimum) => {
    const percentage = (current / minimum) * 100;
    if (percentage <= 25) return { status: 'Critical', variant: 'danger' };
    if (percentage <= 50) return { status: 'Low', variant: 'warning' };
    if (percentage <= 100) return { status: 'Moderate', variant: 'info' };
    return { status: 'Good', variant: 'success' };
  };

  const handleAddVaccine = async (formData) => {
    try {
      await inventoryService.createVaccine(formData);
      setShowAddVaccineModal(false);
      setVaccineFormData({
        name: '', description: '', manufacturer: '', category: '', batchNumber: '',
        dosesInStock: '', minimumStock: '', unitCost: '', expiryDate: '', storageTemp: '',
        administrationRoute: '', ageGroups: [], dosageSchedule: '', sideEffects: '',
        contraindications: '', notes: ''
      });
      loadInventoryData();
    } catch (error) {
      console.error('Error adding vaccine:', error);
      alert('Error adding vaccine. Please try again.');
    }
  };

  const handleAddMedication = async (formData) => {
    try {
      await inventoryService.createMedication(formData);
      setShowAddMedicationModal(false);
      setMedicationFormData({
        name: '', genericName: '', brandName: '', category: '', dosage: '', form: '',
        strength: '', manufacturer: '', batchNumber: '', unitsInStock: '', minimumStock: '',
        unitCost: '', sellingPrice: '', expiryDate: '', storageConditions: '', administrationRoute: '',
        indication: '', dosageInstructions: '', sideEffects: '', contraindications: '',
        interactions: '', precautions: '', isPrescriptionRequired: false, notes: ''
      });
      loadInventoryData();
    } catch (error) {
      console.error('Error adding medication:', error);
      alert('Error adding medication. Please try again.');
    }
  };

  const handleEditVaccine = async (formData) => {
    try {
      await inventoryService.updateVaccine(selectedVaccine.id, formData);
      setShowEditVaccineModal(false);
      setSelectedVaccine(null);
      loadInventoryData();
    } catch (error) {
      console.error('Error updating vaccine:', error);
      alert('Error updating vaccine. Please try again.');
    }
  };

  const handleEditMedication = async (formData) => {
    try {
      await inventoryService.updateMedication(selectedMedication.id, formData);
      setShowEditMedicationModal(false);
      setSelectedMedication(null);
      loadInventoryData();
    } catch (error) {
      console.error('Error updating medication:', error);
      alert('Error updating medication. Please try again.');
    }
  };

  const handleAddStock = async (itemId, stockData, type) => {
    try {
      // Validate required fields
      if (!stockData.amount || stockData.amount <= 0) {
        alert('Please enter a valid amount to add.');
        return;
      }
      
      if (!stockData.expiryDate) {
        alert('Please enter an expiry date.');
        return;
      }

      if (type === 'vaccine') {
        await inventoryService.addVaccineStock(itemId, stockData);
        setShowAddStockVaccineModal(false);
      } else {
        await inventoryService.addMedicationStock(itemId, stockData);
        setShowAddStockMedicationModal(false);
      }
      setStockToAdd({ amount: '', expiryDate: '', batchNumber: '' });
      setSelectedVaccine(null);
      setSelectedMedication(null);
      loadInventoryData();
    } catch (error) {
      console.error('Error adding stock:', error);
      alert('Error adding stock. Please try again.');
    }
  };

  const renderVaccineCard = (vaccine) => (
    <Card key={vaccine.id} className={`vaccine-card ${isDarkMode ? 'dark-mode' : ''} ${removeMode && selectedVaccinesForRemoval.has(vaccine.id) ? 'remove-mode-card' : ''}`}>
      <Card.Body>
        {removeMode && (
          <div className="d-flex justify-content-end mb-2">
            <Form.Check
              type="checkbox"
              checked={selectedVaccinesForRemoval.has(vaccine.id)}
              onChange={() => handleItemSelect(vaccine.id, 'vaccine')}
            />
          </div>
        )}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h6 className="card-title mb-1">{vaccine.name}</h6>
          <Badge bg={getStockStatus(vaccine.dosesInStock, vaccine.minimumStock).variant}>
            {getStockStatus(vaccine.dosesInStock, vaccine.minimumStock).status}
          </Badge>
        </div>
        <p className="text-muted small mb-2">{vaccine.description}</p>
        <div className="vaccine-details">
          <div><strong>Stock:</strong> {vaccine.dosesInStock} doses</div>
          <div><strong>Manufacturer:</strong> {vaccine.manufacturer}</div>
          <div><strong>Category:</strong> {vaccine.category}</div>
          <div><strong>Expiry:</strong> {new Date(vaccine.expiryDate).toLocaleDateString()}</div>
        </div>
        <div className="d-flex gap-2 mt-3">
          <Button 
            size="sm" 
            variant="outline-primary"
            onClick={() => {
              setSelectedVaccine(vaccine);
              setVaccineFormData({...vaccine});
              setShowEditVaccineModal(true);
            }}
          >
            <i className="bi bi-pencil me-1"></i>Edit
          </Button>
          <Button 
            size="sm" 
            variant="outline-info"
            onClick={() => {
              setSelectedVaccine(vaccine);
              setShowViewVaccineModal(true);
            }}
          >
            <i className="bi bi-eye me-1"></i>View
          </Button>
          <Button 
            size="sm" 
            variant="outline-success"
            onClick={() => {
              setSelectedVaccine(vaccine);
              setShowAddStockVaccineModal(true);
            }}
          >
            <i className="bi bi-plus-square me-1"></i>Add Stock
          </Button>
        </div>
      </Card.Body>
    </Card>
  );

  const renderMedicationCard = (medication) => (
    <Card key={medication.id} className={`medication-card ${isDarkMode ? 'dark-mode' : ''} ${removeMode && selectedMedicationsForRemoval.has(medication.id) ? 'remove-mode-card' : ''}`}>
      <Card.Body>
        {removeMode && (
          <div className="d-flex justify-content-end mb-2">
            <Form.Check
              type="checkbox"
              checked={selectedMedicationsForRemoval.has(medication.id)}
              onChange={() => handleItemSelect(medication.id, 'medication')}
            />
          </div>
        )}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h6 className="card-title mb-1">{medication.name}</h6>
          <Badge bg={getStockStatus(medication.unitsInStock, medication.minimumStock).variant}>
            {getStockStatus(medication.unitsInStock, medication.minimumStock).status}
          </Badge>
        </div>
        <p className="text-muted small mb-2">{medication.genericName}</p>
        <div className="medication-details">
          <div><strong>Stock:</strong> {medication.unitsInStock} units</div>
          <div><strong>Form:</strong> {medication.form} ({medication.strength})</div>
          <div><strong>Category:</strong> {medication.category}</div>
          <div><strong>Price:</strong> ₱{medication.sellingPrice}</div>
        </div>
        <div className="d-flex gap-2 mt-3">
          <Button 
            size="sm" 
            variant="outline-primary"
            onClick={() => {
              setSelectedMedication(medication);
              setMedicationFormData({...medication});
              setShowEditMedicationModal(true);
            }}
          >
            <i className="bi bi-pencil me-1"></i>Edit
          </Button>
          <Button 
            size="sm" 
            variant="outline-info"
            onClick={() => {
              setSelectedMedication(medication);
              setShowViewMedicationModal(true);
            }}
          >
            <i className="bi bi-eye me-1"></i>View
          </Button>
          <Button 
            size="sm" 
            variant="outline-success"
            onClick={() => {
              setSelectedMedication(medication);
              setShowAddStockMedicationModal(true);
            }}
          >
            <i className="bi bi-plus-square me-1"></i>Add Stock
          </Button>
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <div className={`inventory-management ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center summary-card">
            <Card.Body>
              <h4 className="mb-1">{activeTab === 'vaccines' ? vaccines.length : medications.length}</h4>
              <p className="text-muted mb-0">Total {activeTab === 'vaccines' ? 'Vaccines' : 'Medications'}</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center summary-card">
            <Card.Body>
              <h4 className="mb-1">
                {activeTab === 'vaccines' 
                  ? vaccines.reduce((sum, v) => sum + (v.dosesInStock || 0), 0)
                  : medications.reduce((sum, m) => sum + (m.unitsInStock || 0), 0)
                }
              </h4>
              <p className="text-muted mb-0">{activeTab === 'vaccines' ? 'Doses Available' : 'Units Available'}</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center summary-card">
            <Card.Body>
              <h4 className="mb-1">
                {activeTab === 'vaccines' 
                  ? vaccines.filter(v => v.dosesInStock <= v.minimumStock).length
                  : medications.filter(m => m.unitsInStock <= m.minimumStock).length
                }
              </h4>
              <p className="text-muted mb-0">Low Stock</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center summary-card">
            <Card.Body>
              <h4 className="mb-1">
                {activeTab === 'vaccines' 
                  ? vaccines.filter(v => {
                      const expiryDate = new Date(v.expiryDate);
                      const thirtyDaysFromNow = new Date();
                      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                      return expiryDate <= thirtyDaysFromNow;
                    }).length
                  : medications.filter(m => {
                      const expiryDate = new Date(m.expiryDate);
                      const thirtyDaysFromNow = new Date();
                      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                      return expiryDate <= thirtyDaysFromNow;
                    }).length
                }
              </h4>
              <p className="text-muted mb-0">Expiring Soon</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="inventory-controls mb-4">
        <Row className="align-items-center">
          <Col md={3}> {/* Reduced from md={4} to md={3} (25% reduction) */}
            <div className="search-container">
              <Form.Control
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page when searching
                }}
              />
              {inventoryFilter && (
                <Badge 
                  bg={inventoryFilter === 'critical' ? 'danger' : 'warning'} 
                  className="ms-2"
                >
                  Showing {inventoryFilter === 'critical' ? 'Out of Stock' : 'Low Stock'} Items
                </Badge>
              )}
            </div>
          </Col>
          <Col md={4} className="d-flex justify-content-center">
            {activeTab === 'vaccines' 
              ? renderPagination(totalVaccinePages)
              : renderPagination(totalMedicationPages)
            }
          </Col>
          <Col md={5} className="text-end"> {/* Increased from md={4} to md={5} */}
            {activeTab === 'vaccines' ? (
              <Button 
                variant="success" 
                onClick={() => setShowAddVaccineModal(true)}
              >
                <i className="bi bi-plus-circle me-2"></i>Add New Vaccine
              </Button>
            ) : (
              <Button 
                variant="success" 
                onClick={() => setShowAddMedicationModal(true)}
              >
                <i className="bi bi-plus-circle me-2"></i>Add New Medication
              </Button>
            )}
            
            <Button 
              variant={removeMode ? "danger" : "outline-danger"} 
              className="ms-2"
              onClick={toggleRemoveMode}
            >
              <i className={`bi ${removeMode ? 'bi-x-circle' : 'bi-trash'} me-1`}></i>
              {removeMode ? 'Cancel' : 'Remove'}
            </Button>
            
            {/* Remove Selected Button - only show when in remove mode and items selected */}
            {removeMode && (
              <Button 
                variant="danger" 
                className="ms-2"
                onClick={handleRemoveSelected}
                disabled={
                  (activeTab === 'vaccines' && selectedVaccinesForRemoval.size === 0) ||
                  (activeTab === 'medications' && selectedMedicationsForRemoval.size === 0)
                }
              >
                <i className="bi bi-trash-fill me-1"></i>
                Remove Selected ({activeTab === 'vaccines' ? selectedVaccinesForRemoval.size : selectedMedicationsForRemoval.size})
              </Button>
            )}
            
            <Button 
              variant="outline-secondary" 
              className="ms-2"
              onClick={() => {
                loadInventoryData();
                setCurrentPage(1);
              }}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>Refresh
            </Button>
          </Col>
        </Row>
      </div>

      <Tabs
        activeKey={activeTab}
        onSelect={(key) => {
          setActiveTab(key);
          setCurrentPage(1); // Reset pagination when switching tabs
          setSearchTerm(''); // Clear search when switching tabs
        }}
        className="inventory-tabs mb-4"
      >
        <Tab eventKey="vaccines" title={
          <span>
            <i className="bi bi-shield-plus me-2"></i>
            Vaccines ({vaccines.length})
          </span>
        }>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'row g-3' : ''}>
              {viewMode === 'grid' ? (
                currentVaccines.map(vaccine => (
                  <div key={vaccine.id} className="col-md-6 col-lg-4">
                    {renderVaccineCard(vaccine)}
                  </div>
                ))
              ) : (
                <Table responsive striped bordered hover>
                  <thead>
                    <tr>
                      {removeMode && <th width="50">Select</th>}
                      <th>Name</th>
                      <th>Category</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th>Expiry Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentVaccines.map(vaccine => (
                      <tr key={vaccine.id} className={removeMode && selectedVaccinesForRemoval.has(vaccine.id) ? 'remove-mode-row' : ''}>
                        {removeMode && (
                          <td>
                            <Form.Check
                              type="checkbox"
                              checked={selectedVaccinesForRemoval.has(vaccine.id)}
                              onChange={() => handleItemSelect(vaccine.id, 'vaccine')}
                            />
                          </td>
                        )}
                        <td>{vaccine.name}</td>
                        <td>{vaccine.category}</td>
                        <td>{vaccine.dosesInStock}</td>
                        <td>
                          <Badge bg={getStockStatus(vaccine.dosesInStock, vaccine.minimumStock).variant}>
                            {getStockStatus(vaccine.dosesInStock, vaccine.minimumStock).status}
                          </Badge>
                        </td>
                        <td>{new Date(vaccine.expiryDate).toLocaleDateString()}</td>
                        <td>
                          <Button 
                            size="sm" 
                            variant="outline-primary" 
                            className="me-1"
                            onClick={() => {
                              setSelectedVaccine(vaccine);
                              setVaccineFormData({...vaccine});
                              setShowEditVaccineModal(true);
                            }}
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-info"
                            className="me-1"
                            onClick={() => {
                              setSelectedVaccine(vaccine);
                              setShowViewVaccineModal(true);
                            }}
                          >
                            <i className="bi bi-eye"></i>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-success"
                            onClick={() => {
                              setSelectedVaccine(vaccine);
                              setShowAddStockVaccineModal(true);
                            }}
                          >
                            <i className="bi bi-plus-square"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
              {currentVaccines.length === 0 && !loading && (
                <div className="text-center py-4">
                  <div className="text-muted">
                    <i className="bi bi-inbox display-4 d-block mb-3"></i>
                    <h5>No vaccines found</h5>
                    <p>No vaccines in inventory yet</p>
                    <Button 
                      variant="primary" 
                      onClick={() => setShowAddVaccineModal(true)}
                    >
                      <i className="bi bi-plus-circle me-2"></i>Add First Vaccine
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Tab>

        <Tab eventKey="medications" title={
          <span>
            <i className="bi bi-capsule me-2"></i>
            Medications ({medications.length})
          </span>
        }>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'row g-3' : ''}>
              {viewMode === 'grid' ? (
                currentMedications.map(medication => (
                  <div key={medication.id} className="col-md-6 col-lg-4">
                    {renderMedicationCard(medication)}
                  </div>
                ))
              ) : (
                <Table responsive striped bordered hover>
                  <thead>
                    <tr>
                      {removeMode && <th width="50">Select</th>}
                      <th>Name</th>
                      <th>Generic Name</th>
                      <th>Form</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th>Price</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentMedications.map(medication => (
                      <tr key={medication.id} className={removeMode && selectedMedicationsForRemoval.has(medication.id) ? 'remove-mode-row' : ''}>
                        {removeMode && (
                          <td>
                            <Form.Check
                              type="checkbox"
                              checked={selectedMedicationsForRemoval.has(medication.id)}
                              onChange={() => handleItemSelect(medication.id, 'medication')}
                            />
                          </td>
                        )}
                        <td>{medication.name}</td>
                        <td>{medication.genericName}</td>
                        <td>{medication.form}</td>
                        <td>{medication.unitsInStock}</td>
                        <td>
                          <Badge bg={getStockStatus(medication.unitsInStock, medication.minimumStock).variant}>
                            {getStockStatus(medication.unitsInStock, medication.minimumStock).status}
                          </Badge>
                        </td>
                        <td>₱{medication.sellingPrice}</td>
                        <td>
                          <Button 
                            size="sm" 
                            variant="outline-primary" 
                            className="me-1"
                            onClick={() => {
                              setSelectedMedication(medication);
                              setMedicationFormData({...medication});
                              setShowEditMedicationModal(true);
                            }}
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-info"
                            className="me-1"
                            onClick={() => {
                              setSelectedMedication(medication);
                              setShowViewMedicationModal(true);
                            }}
                          >
                            <i className="bi bi-eye"></i>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-success"
                            onClick={() => {
                              setSelectedMedication(medication);
                              setShowAddStockMedicationModal(true);
                            }}
                          >
                            <i className="bi bi-plus-square"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
              {currentMedications.length === 0 && !loading && (
                <div className="text-center py-4">
                  <div className="text-muted">
                    <i className="bi bi-capsule display-4 d-block mb-3"></i>
                    <h5>No medications found</h5>
                    <p>No medications in inventory yet</p>
                    <Button 
                      variant="primary" 
                      onClick={() => setShowAddMedicationModal(true)}
                    >
                      <i className="bi bi-plus-circle me-2"></i>Add First Medication
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Tab>
      </Tabs>

      {/* Add Vaccine Modal */}
      <Modal show={showAddVaccineModal} onHide={() => setShowAddVaccineModal(false)} size="lg" className="inventory-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-shield-plus me-2"></i>
            Add New Vaccine
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={(e) => {
            e.preventDefault();
            handleAddVaccine(vaccineFormData);
          }}>
            <Row>
              <Col md={6}>
                <h6 className="mb-3">Basic Information</h6>
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
                    value={vaccineFormData.description}
                    onChange={(e) => setVaccineFormData({...vaccineFormData, description: e.target.value})}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Category *</Form.Label>
                  <Form.Select 
                    value={vaccineFormData.category}
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
              </Col>
              <Col md={6}>
                <h6 className="mb-3">Inventory Details</h6>
                <Form.Group className="mb-3">
                  <Form.Label>Batch Number</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., BCG001-2024"
                    value={vaccineFormData.batchNumber}
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
                        value={vaccineFormData.dosesInStock}
                        onChange={(e) => setVaccineFormData({...vaccineFormData, dosesInStock: parseInt(e.target.value) || 0})}
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
                        value={vaccineFormData.unitCost}
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
                    value={vaccineFormData.storageTemp}
                    onChange={(e) => setVaccineFormData({...vaccineFormData, storageTemp: e.target.value})}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Additional notes or instructions"
                    value={vaccineFormData.notes}
                    onChange={(e) => setVaccineFormData({...vaccineFormData, notes: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddVaccineModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => handleAddVaccine(vaccineFormData)}>
            <i className="bi bi-plus-circle me-2"></i>Add Vaccine
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Medication Modal */}
      <Modal show={showAddMedicationModal} onHide={() => setShowAddMedicationModal(false)} size="xl" className="inventory-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-capsule me-2"></i>
            Add New Medication
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={(e) => {
            e.preventDefault();
            handleAddMedication(medicationFormData);
          }}>
            <Row>
              <Col md={4}>
                <h6 className="mb-3">Basic Information</h6>
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
                    value={medicationFormData.genericName}
                    onChange={(e) => setMedicationFormData({...medicationFormData, genericName: e.target.value})}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Brand Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., Tylenol, Biogesic"
                    value={medicationFormData.brandName}
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
                <h6 className="mb-3">Formulation</h6>
                <Form.Group className="mb-3">
                  <Form.Label>Form *</Form.Label>
                  <Form.Select 
                    value={medicationFormData.form}
                    onChange={(e) => setMedicationFormData({...medicationFormData, form: e.target.value})}
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
                    value={medicationFormData.manufacturer}
                    onChange={(e) => setMedicationFormData({...medicationFormData, manufacturer: e.target.value})}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Batch Number</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., PAR001-2024"
                    value={medicationFormData.batchNumber}
                    onChange={(e) => setMedicationFormData({...medicationFormData, batchNumber: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <h6 className="mb-3">Inventory & Pricing</h6>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Units in Stock *</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="0"
                        value={medicationFormData.unitsInStock}
                        onChange={(e) => setMedicationFormData({...medicationFormData, unitsInStock: parseInt(e.target.value) || 0})}
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
                        value={medicationFormData.sellingPrice}
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
                    checked={medicationFormData.isPrescriptionRequired}
                    onChange={(e) => setMedicationFormData({...medicationFormData, isPrescriptionRequired: e.target.checked})}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddMedicationModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => handleAddMedication(medicationFormData)}>
            <i className="bi bi-plus-circle me-2"></i>Add Medication
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Vaccine Modal */}
      <Modal show={showEditVaccineModal} onHide={() => setShowEditVaccineModal(false)} size="lg" className="inventory-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-pencil me-2"></i>
            Edit Vaccine: {selectedVaccine?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={(e) => {
            e.preventDefault();
            handleEditVaccine(vaccineFormData);
          }}>
            {/* Same form structure as Add Vaccine */}
            <Row>
              <Col md={6}>
                <h6 className="mb-3">Basic Information</h6>
                <Form.Group className="mb-3">
                  <Form.Label>Vaccine Name *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., COVID-19 Vaccine"
                    value={vaccineFormData.name}
                    onChange={(e) => setVaccineFormData({...vaccineFormData, name: e.target.value})}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Brief description of the vaccine"
                    value={vaccineFormData.description}
                    onChange={(e) => setVaccineFormData({...vaccineFormData, description: e.target.value})}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Manufacturer</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., Pfizer, Moderna"
                    value={vaccineFormData.manufacturer}
                    onChange={(e) => setVaccineFormData({...vaccineFormData, manufacturer: e.target.value})}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select 
                    value={vaccineFormData.category}
                    onChange={(e) => setVaccineFormData({...vaccineFormData, category: e.target.value})}
                  >
                    <option value="">Select Category</option>
                    <option value="Routine Childhood">Routine Childhood</option>
                    <option value="Adult Routine">Adult Routine</option>
                    <option value="Travel">Travel</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Seasonal">Seasonal</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <h6 className="mb-3">Inventory Details</h6>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Doses in Stock *</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="0"
                        value={vaccineFormData.dosesInStock}
                        onChange={(e) => setVaccineFormData({...vaccineFormData, dosesInStock: parseInt(e.target.value) || 0})}
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
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditVaccineModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => handleEditVaccine(vaccineFormData)}>
            <i className="bi bi-save me-2"></i>Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Medication Modal */}
      <Modal show={showEditMedicationModal} onHide={() => setShowEditMedicationModal(false)} size="xl" className="inventory-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-pencil me-2"></i>
            Edit Medication: {selectedMedication?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={(e) => {
            e.preventDefault();
            handleEditMedication(medicationFormData);
          }}>
            <Row>
              <Col md={4}>
                <h6 className="mb-3">Basic Information</h6>
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
                    value={medicationFormData.genericName}
                    onChange={(e) => setMedicationFormData({...medicationFormData, genericName: e.target.value})}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Units in Stock *</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="0"
                    value={medicationFormData.unitsInStock}
                    onChange={(e) => setMedicationFormData({...medicationFormData, unitsInStock: parseInt(e.target.value) || 0})}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Selling Price (₱)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={medicationFormData.sellingPrice}
                    onChange={(e) => setMedicationFormData({...medicationFormData, sellingPrice: parseFloat(e.target.value) || 0})}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditMedicationModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => handleEditMedication(medicationFormData)}>
            <i className="bi bi-save me-2"></i>Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Vaccine Modal */}
      <Modal show={showViewVaccineModal} onHide={() => setShowViewVaccineModal(false)} size="lg" className="inventory-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-eye me-2"></i>
            Vaccine Details: {selectedVaccine?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedVaccine && (
            <Row>
              <Col md={6}>
                <h6 className="mb-3">Basic Information</h6>
                <p><strong>Name:</strong> {selectedVaccine.name}</p>
                <p><strong>Description:</strong> {selectedVaccine.description}</p>
                <p><strong>Manufacturer:</strong> {selectedVaccine.manufacturer}</p>
                <p><strong>Category:</strong> {selectedVaccine.category}</p>
              </Col>
              <Col md={6}>
                <h6 className="mb-3">Inventory Details</h6>
                <p><strong>Doses in Stock:</strong> {selectedVaccine.dosesInStock}</p>
                <p><strong>Minimum Stock:</strong> {selectedVaccine.minimumStock}</p>
                <p><strong>Batch Number:</strong> {selectedVaccine.batchNumber}</p>
                <p><strong>Expiry Date:</strong> {new Date(selectedVaccine.expiryDate).toLocaleDateString()}</p>
                <p><strong>Storage Temperature:</strong> {selectedVaccine.storageTemp}</p>
                <p><strong>Status:</strong> 
                  <Badge bg={getStockStatus(selectedVaccine.dosesInStock, selectedVaccine.minimumStock).variant} className="ms-2">
                    {getStockStatus(selectedVaccine.dosesInStock, selectedVaccine.minimumStock).status}
                  </Badge>
                </p>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewVaccineModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Medication Modal */}
      <Modal show={showViewMedicationModal} onHide={() => setShowViewMedicationModal(false)} size="lg" className="inventory-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-eye me-2"></i>
            Medication Details: {selectedMedication?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedMedication && (
            <Row>
              <Col md={6}>
                <h6 className="mb-3">Basic Information</h6>
                <p><strong>Name:</strong> {selectedMedication.name}</p>
                <p><strong>Generic Name:</strong> {selectedMedication.genericName}</p>
                <p><strong>Brand Name:</strong> {selectedMedication.brandName}</p>
                <p><strong>Category:</strong> {selectedMedication.category}</p>
                <p><strong>Form:</strong> {selectedMedication.form}</p>
                <p><strong>Strength:</strong> {selectedMedication.strength}</p>
              </Col>
              <Col md={6}>
                <h6 className="mb-3">Inventory & Pricing</h6>
                <p><strong>Units in Stock:</strong> {selectedMedication.unitsInStock}</p>
                <p><strong>Minimum Stock:</strong> {selectedMedication.minimumStock}</p>
                <p><strong>Unit Cost:</strong> ₱{selectedMedication.unitCost}</p>
                <p><strong>Selling Price:</strong> ₱{selectedMedication.sellingPrice}</p>
                <p><strong>Expiry Date:</strong> {new Date(selectedMedication.expiryDate).toLocaleDateString()}</p>
                <p><strong>Status:</strong> 
                  <Badge bg={getStockStatus(selectedMedication.unitsInStock, selectedMedication.minimumStock).variant} className="ms-2">
                    {getStockStatus(selectedMedication.unitsInStock, selectedMedication.minimumStock).status}
                  </Badge>
                </p>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewMedicationModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Stock Vaccine Modal */}
      <Modal show={showAddStockVaccineModal} onHide={() => setShowAddStockVaccineModal(false)} className="inventory-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-plus-square me-2"></i>
            Add Stock: {selectedVaccine?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Number of Doses to Add *</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter number of doses"
                value={stockToAdd.amount}
                onChange={(e) => setStockToAdd({...stockToAdd, amount: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Batch Number</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter batch number"
                value={stockToAdd.batchNumber}
                onChange={(e) => setStockToAdd({...stockToAdd, batchNumber: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Expiry Date *</Form.Label>
              <Form.Control
                type="date"
                value={stockToAdd.expiryDate}
                onChange={(e) => setStockToAdd({...stockToAdd, expiryDate: e.target.value})}
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddStockVaccineModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="success" 
            onClick={() => handleAddStock(selectedVaccine?.id, stockToAdd, 'vaccine')}
          >
            <i className="bi bi-plus-square me-2"></i>Add Stock
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Stock Medication Modal */}
      <Modal show={showAddStockMedicationModal} onHide={() => setShowAddStockMedicationModal(false)} className="inventory-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-plus-square me-2"></i>
            Add Stock: {selectedMedication?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Number of Units to Add *</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter number of units"
                value={stockToAdd.amount}
                onChange={(e) => setStockToAdd({...stockToAdd, amount: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Batch Number</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter batch number"
                value={stockToAdd.batchNumber}
                onChange={(e) => setStockToAdd({...stockToAdd, batchNumber: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Expiry Date *</Form.Label>
              <Form.Control
                type="date"
                value={stockToAdd.expiryDate}
                onChange={(e) => setStockToAdd({...stockToAdd, expiryDate: e.target.value})}
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddStockMedicationModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="success" 
            onClick={() => handleAddStock(selectedMedication?.id, stockToAdd, 'medication')}
          >
            <i className="bi bi-plus-square me-2"></i>Add Stock
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default InventoryManagement;
