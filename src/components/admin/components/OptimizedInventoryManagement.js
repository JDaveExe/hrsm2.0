import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Tab, Tabs, Button, Table, Badge, Card, Row, Col, Modal, Form } from 'react-bootstrap';
import { FixedSizeList as List } from 'react-window';
import inventoryService from '../../../services/inventoryService';
import { 
  useOptimizedInventoryFilter, 
  useInventoryCalculations, 
  usePagination,
  useDebouncedSearch 
} from '../../../hooks/useOptimizedInventory';
import './InventoryManagement.css';

// Memoized inventory item components
const VaccineGridItem = memo(({ vaccine, onEdit, onView, onAddStock, getStockStatus, isDarkMode }) => (
  <Card className={`vaccine-card ${isDarkMode ? 'dark-mode' : ''}`}>
    <Card.Body>
      <div className="d-flex justify-content-between align-items-start mb-2">
        <h6 className="card-title mb-1">{vaccine.name}</h6>
        <Badge bg={getStockStatus(vaccine.dosesInStock, vaccine.minimumStock).variant}>
          {getStockStatus(vaccine.dosesInStock, vaccine.minimumStock).status}
        </Badge>
      </div>
      <p className="text-muted small mb-2">{vaccine.manufacturer}</p>
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
          onClick={() => onEdit(vaccine)}
        >
          <i className="bi bi-pencil me-1"></i>Edit
        </Button>
        <Button 
          size="sm" 
          variant="outline-info"
          onClick={() => onView(vaccine)}
        >
          <i className="bi bi-eye me-1"></i>View
        </Button>
        <Button 
          size="sm" 
          variant="outline-success"
          onClick={() => onAddStock(vaccine)}
        >
          <i className="bi bi-plus-square me-1"></i>Add Stock
        </Button>
      </div>
    </Card.Body>
  </Card>
));

const MedicationGridItem = memo(({ medication, onEdit, onView, onAddStock, getStockStatus, isDarkMode }) => (
  <Card className={`medication-card ${isDarkMode ? 'dark-mode' : ''}`}>
    <Card.Body>
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
          onClick={() => onEdit(medication)}
        >
          <i className="bi bi-pencil me-1"></i>Edit
        </Button>
        <Button 
          size="sm" 
          variant="outline-info"
          onClick={() => onView(medication)}
        >
          <i className="bi bi-eye me-1"></i>View
        </Button>
        <Button 
          size="sm" 
          variant="outline-success"
          onClick={() => onAddStock(medication)}
        >
          <i className="bi bi-plus-square me-1"></i>Add Stock
        </Button>
      </div>
    </Card.Body>
  </Card>
));

// Virtual list row renderer
const VirtualizedVaccineRow = memo(({ index, style, data }) => {
  const { items, onEdit, onView, onAddStock, getStockStatus, isDarkMode } = data;
  const vaccine = items[index];
  
  return (
    <div style={style}>
      <div className="p-2">
        <VaccineGridItem 
          vaccine={vaccine}
          onEdit={onEdit}
          onView={onView}
          onAddStock={onAddStock}
          getStockStatus={getStockStatus}
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  );
});

const VirtualizedMedicationRow = memo(({ index, style, data }) => {
  const { items, onEdit, onView, onAddStock, getStockStatus, isDarkMode } = data;
  const medication = items[index];
  
  return (
    <div style={style}>
      <div className="p-2">
        <MedicationGridItem 
          medication={medication}
          onEdit={onEdit}
          onView={onView}
          onAddStock={onAddStock}
          getStockStatus={getStockStatus}
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  );
});

// Main optimized component
const OptimizedInventoryManagement = memo(({ 
  currentPath, 
  currentDateTime, 
  simulationMode, 
  isDarkMode = false, 
  inventoryFilter = null 
}) => {
  // State management
  const [activeTab, setActiveTab] = useState('vaccines');
  const [vaccines, setVaccines] = useState([]);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [useVirtualization, setUseVirtualization] = useState(false);

  // Modal states
  const [modals, setModals] = useState({
    addVaccine: false,
    editVaccine: false,
    viewVaccine: false,
    addStockVaccine: false,
    addMedication: false,
    editMedication: false,
    viewMedication: false,
    addStockMedication: false
  });

  const [selectedItems, setSelectedItems] = useState({
    vaccine: null,
    medication: null
  });

  // Debounced search term for better performance
  const debouncedSearchTerm = useDebouncedSearch(searchTerm, 300);

  // Load data effect
  useEffect(() => {
    loadInventoryData();
  }, [activeTab]);

  // Optimized data loading
  const loadInventoryData = useCallback(async () => {
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
  }, [activeTab]);

  // Memoized filtered data
  const filteredVaccines = useOptimizedInventoryFilter(vaccines, debouncedSearchTerm);
  const filteredMedications = useOptimizedInventoryFilter(medications, debouncedSearchTerm);

  // Memoized calculations
  const vaccineStats = useInventoryCalculations(filteredVaccines, 'vaccine');
  const medicationStats = useInventoryCalculations(filteredMedications, 'medication');

  // Memoized pagination
  const vaccinePagination = usePagination(filteredVaccines, itemsPerPage, currentPage);
  const medicationPagination = usePagination(filteredMedications, itemsPerPage, currentPage);

  // Event handlers
  const handleModalToggle = useCallback((modalName, isOpen, item = null) => {
    setModals(prev => ({ ...prev, [modalName]: isOpen }));
    if (item) {
      const itemType = modalName.includes('Vaccine') ? 'vaccine' : 'medication';
      setSelectedItems(prev => ({ ...prev, [itemType]: item }));
    }
  }, []);

  const handleVaccineEdit = useCallback((vaccine) => {
    handleModalToggle('editVaccine', true, vaccine);
  }, [handleModalToggle]);

  const handleVaccineView = useCallback((vaccine) => {
    handleModalToggle('viewVaccine', true, vaccine);
  }, [handleModalToggle]);

  const handleVaccineAddStock = useCallback((vaccine) => {
    handleModalToggle('addStockVaccine', true, vaccine);
  }, [handleModalToggle]);

  const handleMedicationEdit = useCallback((medication) => {
    handleModalToggle('editMedication', true, medication);
  }, [handleModalToggle]);

  const handleMedicationView = useCallback((medication) => {
    handleModalToggle('viewMedication', true, medication);
  }, [handleModalToggle]);

  const handleMedicationAddStock = useCallback((medication) => {
    handleModalToggle('addStockMedication', true, medication);
  }, [handleModalToggle]);

  // Memoized stock status function
  const getStockStatus = useCallback((current, minimum) => {
    const percentage = (current / minimum) * 100;
    if (percentage <= 25) return { status: 'Critical', variant: 'danger' };
    if (percentage <= 50) return { status: 'Low', variant: 'warning' };
    if (percentage <= 100) return { status: 'Moderate', variant: 'info' };
    return { status: 'Good', variant: 'success' };
  }, []);

  // Tab change handler
  const handleTabChange = useCallback((key) => {
    setActiveTab(key);
    setCurrentPage(1);
    setSearchTerm('');
  }, []);

  // Enable virtualization for large datasets
  useEffect(() => {
    const currentItems = activeTab === 'vaccines' ? filteredVaccines : filteredMedications;
    setUseVirtualization(currentItems.length > 50);
  }, [activeTab, filteredVaccines, filteredMedications]);

  // Render summary cards
  const renderSummaryCards = useMemo(() => {
    const stats = activeTab === 'vaccines' ? vaccineStats : medicationStats;
    const itemName = activeTab === 'vaccines' ? 'Vaccines' : 'Medications';
    
    return (
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center summary-card">
            <Card.Body>
              <h4 className="mb-1">{stats.totalItems}</h4>
              <p className="text-muted mb-0">Total {itemName}</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center summary-card">
            <Card.Body>
              <h4 className="mb-1 text-warning">{stats.lowStockCount}</h4>
              <p className="text-muted mb-0">Low Stock</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center summary-card">
            <Card.Body>
              <h4 className="mb-1 text-danger">{stats.outOfStockCount}</h4>
              <p className="text-muted mb-0">Out of Stock</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center summary-card">
            <Card.Body>
              <h4 className="mb-1 text-info">{stats.expiringSoonCount}</h4>
              <p className="text-muted mb-0">Expiring Soon</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    );
  }, [activeTab, vaccineStats, medicationStats]);

  // Render virtualized list for large datasets
  const renderVirtualizedGrid = (items, itemType) => {
    const rowHeight = 280; // Approximate height of each card
    const containerHeight = Math.min(600, items.length * rowHeight);

    const itemData = {
      items,
      onEdit: itemType === 'vaccine' ? handleVaccineEdit : handleMedicationEdit,
      onView: itemType === 'vaccine' ? handleVaccineView : handleMedicationView,
      onAddStock: itemType === 'vaccine' ? handleVaccineAddStock : handleMedicationAddStock,
      getStockStatus,
      isDarkMode
    };

    return (
      <div style={{ height: containerHeight }}>
        <List
          height={containerHeight}
          itemCount={items.length}
          itemSize={rowHeight}
          itemData={itemData}
        >
          {itemType === 'vaccine' ? VirtualizedVaccineRow : VirtualizedMedicationRow}
        </List>
      </div>
    );
  };

  // Render regular grid for smaller datasets
  const renderRegularGrid = (items, itemType) => {
    return (
      <Row className="g-3">
        {items.map(item => (
          <Col key={item.id} md={6} lg={4}>
            {itemType === 'vaccine' ? (
              <VaccineGridItem
                vaccine={item}
                onEdit={handleVaccineEdit}
                onView={handleVaccineView}
                onAddStock={handleVaccineAddStock}
                getStockStatus={getStockStatus}
                isDarkMode={isDarkMode}
              />
            ) : (
              <MedicationGridItem
                medication={item}
                onEdit={handleMedicationEdit}
                onView={handleMedicationView}
                onAddStock={handleMedicationAddStock}
                getStockStatus={getStockStatus}
                isDarkMode={isDarkMode}
              />
            )}
          </Col>
        ))}
      </Row>
    );
  };

  // Render controls
  const renderControls = useMemo(() => (
    <div className="d-flex justify-content-between align-items-center mb-4">
      <Row className="w-100">
        <Col md={4}>
          <Form.Control
            type="search"
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>
        <Col md={4} className="d-flex gap-2 justify-content-center">
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
            <i className="bi bi-list me-1"></i>Table
          </Button>
          {useVirtualization && (
            <Badge bg="info" className="ms-2">
              Virtualized ({(activeTab === 'vaccines' ? filteredVaccines : filteredMedications).length} items)
            </Badge>
          )}
        </Col>
        <Col md={4} className="text-end">
          <Button 
            variant="success" 
            onClick={() => handleModalToggle(activeTab === 'vaccines' ? 'addVaccine' : 'addMedication', true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Add New {activeTab === 'vaccines' ? 'Vaccine' : 'Medication'}
          </Button>
        </Col>
      </Row>
    </div>
  ), [searchTerm, viewMode, useVirtualization, activeTab, filteredVaccines, filteredMedications, handleModalToggle]);

  return (
    <div className={`inventory-management ${isDarkMode ? 'dark-mode' : ''}`}>
      {renderSummaryCards}

      {renderControls}

      <Tabs
        activeKey={activeTab}
        onSelect={handleTabChange}
        className="inventory-tabs mb-4"
      >
        <Tab 
          eventKey="vaccines" 
          title={
            <span>
              <i className="bi bi-shield-plus me-2"></i>
              Vaccines ({vaccines.length})
            </span>
          }
        >
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div>
              {viewMode === 'grid' ? (
                useVirtualization ? 
                  renderVirtualizedGrid(filteredVaccines, 'vaccine') :
                  renderRegularGrid(vaccinePagination.currentPageItems, 'vaccine')
              ) : (
                <Table responsive striped bordered hover>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Manufacturer</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th>Expiry Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vaccinePagination.currentPageItems.map(vaccine => (
                      <tr key={vaccine.id}>
                        <td>{vaccine.name}</td>
                        <td>{vaccine.manufacturer}</td>
                        <td>{vaccine.dosesInStock} doses</td>
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
                            onClick={() => handleVaccineEdit(vaccine)}
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-info"
                            className="me-1"
                            onClick={() => handleVaccineView(vaccine)}
                          >
                            <i className="bi bi-eye"></i>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-success"
                            onClick={() => handleVaccineAddStock(vaccine)}
                          >
                            <i className="bi bi-plus-square"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          )}
        </Tab>

        <Tab 
          eventKey="medications" 
          title={
            <span>
              <i className="bi bi-capsule me-2"></i>
              Medications ({medications.length})
            </span>
          }
        >
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div>
              {viewMode === 'grid' ? (
                useVirtualization ? 
                  renderVirtualizedGrid(filteredMedications, 'medication') :
                  renderRegularGrid(medicationPagination.currentPageItems, 'medication')
              ) : (
                <Table responsive striped bordered hover>
                  <thead>
                    <tr>
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
                    {medicationPagination.currentPageItems.map(medication => (
                      <tr key={medication.id}>
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
                            onClick={() => handleMedicationEdit(medication)}
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-info"
                            className="me-1"
                            onClick={() => handleMedicationView(medication)}
                          >
                            <i className="bi bi-eye"></i>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-success"
                            onClick={() => handleMedicationAddStock(medication)}
                          >
                            <i className="bi bi-plus-square"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          )}
        </Tab>
      </Tabs>

      {/* Pagination for non-virtualized views */}
      {!useVirtualization && viewMode === 'grid' && (
        <div className="d-flex justify-content-center mt-4">
          <nav>
            <ul className="pagination">
              {Array.from({ length: activeTab === 'vaccines' ? vaccinePagination.totalPages : medicationPagination.totalPages }, (_, i) => (
                <li key={i + 1} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      {/* TODO: Add modals for CRUD operations */}
    </div>
  );
});

OptimizedInventoryManagement.displayName = 'OptimizedInventoryManagement';

export default OptimizedInventoryManagement;
