import React, { useState, useEffect } from 'react';
import { Button, Table, Badge, Card, Row, Col, Modal, Form, InputGroup, Alert } from 'react-bootstrap';
import inventoryService from '../../../services/inventoryService';
import LoadingManagementBar from '../LoadingManagementBar';
import '../styles/ManagementInventory.css';

const MedicalSuppliesInventory = ({ currentDateTime, isDarkMode }) => {
  const [supplies, setSupplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filterCategory, setFilterCategory] = useState('all');
  
  // Remove mode states
  const [removeMode, setRemoveMode] = useState(false);
  const [selectedSuppliesForRemoval, setSelectedSuppliesForRemoval] = useState(new Set());
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showUsageLogModal, setShowUsageLogModal] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState(null);
  
  // Usage log states
  const [usageLogItems, setUsageLogItems] = useState([]);
  const [usageDate, setUsageDate] = useState(new Date().toISOString().split('T')[0]);
  const [usageNotes, setUsageNotes] = useState('');
  
  // Form data
  const [supplyFormData, setSupplyFormData] = useState({
    name: '',
    category: 'Wound Care',
    unitOfMeasure: 'pieces',
    unitsInStock: '',
    minimumStock: '',
    supplier: '',
    expiryDate: '',
    location: '',
    notes: ''
  });
  
  const [stockToAdd, setStockToAdd] = useState({ amount: '', notes: '' });

  const categories = ['Wound Care', 'Diagnostic', 'Injection', 'Hygiene', 'PPE', 'Emergency', 'Office'];

  useEffect(() => {
    loadSuppliesData();
  }, []);

  const loadSuppliesData = async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getAllMedicalSupplies();
      setSupplies(data || []);
    } catch (error) {
      console.error('Error loading medical supplies:', error);
      setSupplies([]);
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

  const sortedAndFilteredSupplies = React.useMemo(() => {
    let filtered = supplies.filter(supply =>
      (supply.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       supply.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       supply.category?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterCategory === 'all' || supply.category === filterCategory)
    );

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        if (sortConfig.key === 'expiryDate') {
          aValue = new Date(aValue || '9999-12-31');
          bValue = new Date(bValue || '9999-12-31');
        } else if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [supplies, searchTerm, sortConfig, filterCategory]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSupplies = sortedAndFilteredSupplies.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedAndFilteredSupplies.length / itemsPerPage);

  const getStockStatus = (current, minimum) => {
    if (current === 0) return { label: 'Out of Stock', variant: 'danger' };
    if (current <= minimum) return { label: 'Low Stock', variant: 'warning' };
    return { label: 'In Stock', variant: 'success' };
  };

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { label: 'No Expiry', variant: 'secondary' };
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { label: 'Expired', variant: 'danger' };
    if (daysUntilExpiry <= 90) return { label: `Expiring Soon (${daysUntilExpiry}d)`, variant: 'warning' };
    return { label: 'Good', variant: 'success' };
  };

  // Handle Add Supply
  const handleAddSupply = async () => {
    try {
      setLoading(true);
      await inventoryService.createMedicalSupply(supplyFormData);
      alert('Medical supply added successfully!');
      setShowAddModal(false);
      resetForm();
      loadSuppliesData();
    } catch (error) {
      console.error('Error adding supply:', error);
      alert('Failed to add medical supply. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Edit Supply
  const handleEditSupply = async () => {
    try {
      setLoading(true);
      await inventoryService.updateMedicalSupply(selectedSupply.id, supplyFormData);
      alert('Medical supply updated successfully!');
      setShowEditModal(false);
      resetForm();
      setSelectedSupply(null);
      loadSuppliesData();
    } catch (error) {
      console.error('Error updating supply:', error);
      alert('Failed to update medical supply. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Supply
  const handleDeleteSupply = async (supply) => {
    if (!window.confirm(`Are you sure you want to delete "${supply.name}"?`)) return;
    
    try {
      setLoading(true);
      await inventoryService.deleteMedicalSupply(supply.id);
      alert('Medical supply deleted successfully!');
      loadSuppliesData();
    } catch (error) {
      console.error('Error deleting supply:', error);
      alert('Failed to delete medical supply. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Add Stock
  const handleAddStock = async () => {
    try {
      setLoading(true);
      await inventoryService.addMedicalSupplyStock(selectedSupply.id, {
        quantityToAdd: parseInt(stockToAdd.amount),
        notes: stockToAdd.notes
      });
      alert('Stock added successfully!');
      setShowAddStockModal(false);
      setStockToAdd({ amount: '', notes: '' });
      setSelectedSupply(null);
      loadSuppliesData();
    } catch (error) {
      console.error('Error adding stock:', error);
      alert('Failed to add stock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Daily Usage Log
  const handleAddUsageItem = () => {
    setUsageLogItems([...usageLogItems, { supplyId: '', quantityUsed: '' }]);
  };

  const handleRemoveUsageItem = (index) => {
    const newItems = usageLogItems.filter((_, i) => i !== index);
    setUsageLogItems(newItems);
  };

  const handleUsageItemChange = (index, field, value) => {
    const newItems = [...usageLogItems];
    newItems[index][field] = value;
    setUsageLogItems(newItems);
  };

  const handleSubmitUsageLog = async () => {
    if (usageLogItems.length === 0) {
      alert('Please add at least one item to the usage log.');
      return;
    }

    const validItems = usageLogItems.filter(item => item.supplyId && item.quantityUsed > 0);
    if (validItems.length === 0) {
      alert('Please ensure all items have valid supply and quantity.');
      return;
    }

    try {
      setLoading(true);
      await inventoryService.logDailyUsage({
        usageDate,
        usageItems: validItems,
        notes: usageNotes
      });
      alert('Daily usage logged successfully!');
      setShowUsageLogModal(false);
      setUsageLogItems([]);
      setUsageNotes('');
      loadSuppliesData();
    } catch (error) {
      console.error('Error logging daily usage:', error);
      alert('Failed to log daily usage. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSupplyFormData({
      name: '',
      category: 'Wound Care',
      unitOfMeasure: 'pieces',
      unitsInStock: '',
      minimumStock: '',
      supplier: '',
      expiryDate: '',
      location: '',
      notes: ''
    });
  };

  const openEditModal = (supply) => {
    setSelectedSupply(supply);
    setSupplyFormData({
      name: supply.name || '',
      category: supply.category || 'Wound Care',
      unitOfMeasure: supply.unitOfMeasure || 'pieces',
      unitsInStock: supply.unitsInStock || '',
      minimumStock: supply.minimumStock || '',
      supplier: supply.supplier || '',
      expiryDate: supply.expiryDate || '',
      location: supply.location || '',
      notes: supply.notes || ''
    });
    setShowEditModal(true);
  };

  const openViewModal = (supply) => {
    setSelectedSupply(supply);
    setShowViewModal(true);
  };

  const openAddStockModal = (supply) => {
    setSelectedSupply(supply);
    setShowAddStockModal(true);
  };

  // Remove mode functions
  const toggleRemoveMode = () => {
    setRemoveMode(!removeMode);
    setSelectedSuppliesForRemoval(new Set());
  };

  const handleSupplySelection = (supplyId) => {
    const newSelected = new Set(selectedSuppliesForRemoval);
    if (newSelected.has(supplyId)) {
      newSelected.delete(supplyId);
    } else {
      newSelected.add(supplyId);
    }
    setSelectedSuppliesForRemoval(newSelected);
  };

  const handleRemoveSelected = async () => {
    try {
      if (selectedSuppliesForRemoval.size === 0) return;

      const confirmRemove = window.confirm(`Are you sure you want to remove ${selectedSuppliesForRemoval.size} medical supply(ies)?`);
      if (!confirmRemove) return;

      // Remove items
      for (const supplyId of selectedSuppliesForRemoval) {
        await inventoryService.deleteMedicalSupply(supplyId);
      }

      // Reset states and reload data
      setSelectedSuppliesForRemoval(new Set());
      setRemoveMode(false);
      loadSuppliesData();
      alert(`Successfully removed ${selectedSuppliesForRemoval.size} medical supply(ies).`);
    } catch (error) {
      console.error('Error removing medical supplies:', error);
      alert('Failed to remove some medical supplies. Please try again.');
    }
  };

  if (loading && supplies.length === 0) {
    return <LoadingManagementBar message="Loading medical supplies..." />;
  }

  return (
    <div className="prescription-inventory">
      {/* Header Section */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <Row className="align-items-center mb-3">

          </Row>
          
          {/* Search and Controls Row */}
          <Row className="g-3 align-items-center">
            <Col md={3}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by name, supplier, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{ height: '40px', fontSize: '0.8rem' }}
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={6} className="text-end">
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="me-2 medical-supply-add-btn"
                style={{ padding: '0.375rem 0.75rem' }}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Add Supply
              </Button>
              <Button 
                variant="success" 
                size="sm"
                onClick={() => setShowUsageLogModal(true)}
                className="me-2"
              >
                <i className="bi bi-journal-text me-2"></i>
                Log Usage
              </Button>
              <Button 
                variant={removeMode ? "danger" : "outline-danger"}
                size="sm"
                onClick={toggleRemoveMode}
                className="me-2"
              >
                <i className={`bi ${removeMode ? 'bi-x-circle' : 'bi-trash'} me-2`}></i>
                {removeMode ? 'Cancel' : 'Remove'}
              </Button>
              
              {/* Remove Selected Button - only show when in remove mode and items selected */}
              {removeMode && selectedSuppliesForRemoval.size > 0 && (
                <Button 
                  variant="danger" 
                  size="sm"
                  onClick={handleRemoveSelected}
                >
                  <i className="bi bi-trash-fill me-2"></i>
                  Remove Selected ({selectedSuppliesForRemoval.size})
                </Button>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Pagination - Moved to Top */}
      {totalPages > 1 && (
        <Card className="mb-3 border-0 shadow-sm">
          <Card.Body className="py-2">
            <div className="d-flex justify-content-between align-items-center w-100">
              <span className="text-muted">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, sortedAndFilteredSupplies.length)}
              </span>
              
              <Badge bg="secondary" className="px-3 py-2">
                Total: {sortedAndFilteredSupplies.length} supplies
              </Badge>
              
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline-primary"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <i className="bi bi-arrow-left"></i> Previous
                </Button>
                <Button
                  variant="outline-primary"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next <i className="bi bi-arrow-right"></i>
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead className="table-light">
                <tr>
                  {removeMode && <th style={{ width: '50px' }}>Select</th>}
                  <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                    Supply Name {getSortIcon('name')}
                  </th>
                  <th onClick={() => handleSort('category')} style={{ cursor: 'pointer' }}>
                    Category {getSortIcon('category')}
                  </th>
                  <th onClick={() => handleSort('unitsInStock')} style={{ cursor: 'pointer' }}>
                    Stock {getSortIcon('unitsInStock')}
                  </th>
                  <th>Stock Status</th>
                  <th onClick={() => handleSort('expiryDate')} style={{ cursor: 'pointer' }}>
                    Expiry {getSortIcon('expiryDate')}
                  </th>
                  <th>Supplier</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentSupplies.length === 0 ? (
                  <tr>
                    <td colSpan={removeMode ? "8" : "7"} className="text-center text-muted py-4">
                      <i className="bi bi-inbox display-4 d-block mb-2"></i>
                      No medical supplies found
                    </td>
                  </tr>
                ) : (
                  currentSupplies.map((supply) => {
                    const stockStatus = getStockStatus(supply.unitsInStock, supply.minimumStock);
                    const expiryStatus = getExpiryStatus(supply.expiryDate);
                    
                    return (
                      <tr key={supply.id} className={removeMode && selectedSuppliesForRemoval.has(supply.id) ? 'table-danger' : ''}>
                        {removeMode && (
                          <td>
                            <Form.Check
                              type="checkbox"
                              checked={selectedSuppliesForRemoval.has(supply.id)}
                              onChange={() => handleSupplySelection(supply.id)}
                            />
                          </td>
                        )}
                        <td>
                          <strong>{supply.name}</strong>
                          <br />
                          <small className="text-muted">{supply.unitOfMeasure}</small>
                        </td>
                        <td>
                          <Badge bg="info" className="px-2 py-1">
                            {supply.category}
                          </Badge>
                        </td>
                        <td>
                          <strong>{supply.unitsInStock}</strong>
                          <span className="text-muted"> / {supply.minimumStock} min</span>
                        </td>
                        <td>
                          <Badge bg={stockStatus.variant}>
                            {stockStatus.label}
                          </Badge>
                        </td>
                        <td>
                          {supply.expiryDate ? (
                            <>
                              {new Date(supply.expiryDate).toLocaleDateString()}
                              <br />
                              <Badge bg={expiryStatus.variant} className="mt-1">
                                {expiryStatus.label}
                              </Badge>
                            </>
                          ) : (
                            <Badge bg="secondary">No Expiry</Badge>
                          )}
                        </td>
                        <td>
                          <small>{supply.supplier || 'N/A'}</small>
                        </td>
                        <td className="text-center">
                          <Button
                            variant="outline-info"
                            size="sm"
                            className="me-1"
                            onClick={() => openViewModal(supply)}
                            title="View Details"
                          >
                            <i className="bi bi-eye"></i>
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-1"
                            onClick={() => openEditModal(supply)}
                            title="Edit"
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => openAddStockModal(supply)}
                            title="Add Stock"
                          >
                            <i className="bi bi-plus-square"></i>
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Add Supply Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-plus-circle me-2"></i>
            Add New Medical Supply
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Supply Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={supplyFormData.name}
                    onChange={(e) => setSupplyFormData({...supplyFormData, name: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category *</Form.Label>
                  <Form.Select
                    value={supplyFormData.category}
                    onChange={(e) => setSupplyFormData({...supplyFormData, category: e.target.value})}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Unit of Measure *</Form.Label>
                  <Form.Select
                    value={supplyFormData.unitOfMeasure}
                    onChange={(e) => setSupplyFormData({...supplyFormData, unitOfMeasure: e.target.value})}
                  >
                    <option value="pieces">Pieces</option>
                    <option value="bottles">Bottles</option>
                    <option value="boxes">Boxes</option>
                    <option value="rolls">Rolls</option>
                    <option value="pairs">Pairs</option>
                    <option value="kits">Kits</option>
                    <option value="strips">Strips</option>
                    <option value="ml">Milliliters (ml)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Initial Stock *</Form.Label>
                  <Form.Control
                    type="number"
                    value={supplyFormData.unitsInStock}
                    onChange={(e) => setSupplyFormData({...supplyFormData, unitsInStock: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Minimum Stock *</Form.Label>
                  <Form.Control
                    type="number"
                    value={supplyFormData.minimumStock}
                    onChange={(e) => setSupplyFormData({...supplyFormData, minimumStock: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Supplier</Form.Label>
                  <Form.Control
                    type="text"
                    value={supplyFormData.supplier}
                    onChange={(e) => setSupplyFormData({...supplyFormData, supplier: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Expiry Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={supplyFormData.expiryDate}
                    onChange={(e) => setSupplyFormData({...supplyFormData, expiryDate: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Storage Location</Form.Label>
              <Form.Control
                type="text"
                value={supplyFormData.location}
                onChange={(e) => setSupplyFormData({...supplyFormData, location: e.target.value})}
                placeholder="e.g., Storage Room A - Shelf 1"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={supplyFormData.notes}
                onChange={(e) => setSupplyFormData({...supplyFormData, notes: e.target.value})}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddSupply} disabled={loading}>
            {loading ? 'Adding...' : 'Add Supply'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Supply Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-pencil me-2"></i>
            Edit Medical Supply
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Supply Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={supplyFormData.name}
                    onChange={(e) => setSupplyFormData({...supplyFormData, name: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category *</Form.Label>
                  <Form.Select
                    value={supplyFormData.category}
                    onChange={(e) => setSupplyFormData({...supplyFormData, category: e.target.value})}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Unit of Measure *</Form.Label>
                  <Form.Select
                    value={supplyFormData.unitOfMeasure}
                    onChange={(e) => setSupplyFormData({...supplyFormData, unitOfMeasure: e.target.value})}
                  >
                    <option value="pieces">Pieces</option>
                    <option value="bottles">Bottles</option>
                    <option value="boxes">Boxes</option>
                    <option value="rolls">Rolls</option>
                    <option value="pairs">Pairs</option>
                    <option value="kits">Kits</option>
                    <option value="strips">Strips</option>
                    <option value="ml">Milliliters (ml)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Current Stock *</Form.Label>
                  <Form.Control
                    type="number"
                    value={supplyFormData.unitsInStock}
                    onChange={(e) => setSupplyFormData({...supplyFormData, unitsInStock: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Minimum Stock *</Form.Label>
                  <Form.Control
                    type="number"
                    value={supplyFormData.minimumStock}
                    onChange={(e) => setSupplyFormData({...supplyFormData, minimumStock: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Supplier</Form.Label>
                  <Form.Control
                    type="text"
                    value={supplyFormData.supplier}
                    onChange={(e) => setSupplyFormData({...supplyFormData, supplier: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Expiry Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={supplyFormData.expiryDate}
                    onChange={(e) => setSupplyFormData({...supplyFormData, expiryDate: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Storage Location</Form.Label>
              <Form.Control
                type="text"
                value={supplyFormData.location}
                onChange={(e) => setSupplyFormData({...supplyFormData, location: e.target.value})}
                placeholder="e.g., Storage Room A - Shelf 1"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={supplyFormData.notes}
                onChange={(e) => setSupplyFormData({...supplyFormData, notes: e.target.value})}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleEditSupply} disabled={loading}>
            {loading ? 'Updating...' : 'Update Supply'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Supply Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-eye me-2"></i>
            Supply Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSupply && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Supply Name:</strong>
                  <p>{selectedSupply.name}</p>
                </Col>
                <Col md={6}>
                  <strong>Category:</strong>
                  <p><Badge bg="info">{selectedSupply.category}</Badge></p>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={4}>
                  <strong>Current Stock:</strong>
                  <p className="text-primary fs-4">{selectedSupply.unitsInStock} {selectedSupply.unitOfMeasure}</p>
                </Col>
                <Col md={4}>
                  <strong>Minimum Stock:</strong>
                  <p>{selectedSupply.minimumStock} {selectedSupply.unitOfMeasure}</p>
                </Col>
                <Col md={4}>
                  <strong>Stock Status:</strong>
                  <p>
                    <Badge bg={getStockStatus(selectedSupply.unitsInStock, selectedSupply.minimumStock).variant}>
                      {getStockStatus(selectedSupply.unitsInStock, selectedSupply.minimumStock).label}
                    </Badge>
                  </p>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Supplier:</strong>
                  <p>{selectedSupply.supplier || 'N/A'}</p>
                </Col>
                <Col md={6}>
                  <strong>Expiry Date:</strong>
                  <p>
                    {selectedSupply.expiryDate ? (
                      <>
                        {new Date(selectedSupply.expiryDate).toLocaleDateString()}
                        {' '}
                        <Badge bg={getExpiryStatus(selectedSupply.expiryDate).variant}>
                          {getExpiryStatus(selectedSupply.expiryDate).label}
                        </Badge>
                      </>
                    ) : 'No expiry date'}
                  </p>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col>
                  <strong>Storage Location:</strong>
                  <p>{selectedSupply.location || 'Not specified'}</p>
                </Col>
              </Row>
              {selectedSupply.notes && (
                <Row>
                  <Col>
                    <strong>Notes:</strong>
                    <p>{selectedSupply.notes}</p>
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
          <Modal.Title>
            <i className="bi bi-plus-square me-2"></i>
            Add Stock
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSupply && (
            <>
              <Alert variant="info">
                <strong>{selectedSupply.name}</strong>
                <br />
                Current Stock: <strong>{selectedSupply.unitsInStock}</strong> {selectedSupply.unitOfMeasure}
              </Alert>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Quantity to Add *</Form.Label>
                  <Form.Control
                    type="number"
                    value={stockToAdd.amount}
                    onChange={(e) => setStockToAdd({...stockToAdd, amount: e.target.value})}
                    required
                    min="1"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={stockToAdd.notes}
                    onChange={(e) => setStockToAdd({...stockToAdd, notes: e.target.value})}
                    placeholder="e.g., Stock replenishment from supplier"
                  />
                </Form.Group>
                {stockToAdd.amount && (
                  <Alert variant="success">
                    New Stock: <strong>{parseInt(selectedSupply.unitsInStock) + parseInt(stockToAdd.amount || 0)}</strong> {selectedSupply.unitOfMeasure}
                  </Alert>
                )}
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddStockModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleAddStock} disabled={loading || !stockToAdd.amount}>
            {loading ? 'Adding...' : 'Add Stock'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Daily Usage Log Modal */}
      <Modal show={showUsageLogModal} onHide={() => setShowUsageLogModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-journal-text me-2"></i>
            Log Daily Supply Usage
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <i className="bi bi-info-circle me-2"></i>
            Record the supplies consumed today. The system will automatically deduct from inventory.
          </Alert>
          
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Usage Date</Form.Label>
              <Form.Control
                type="date"
                value={usageDate}
                onChange={(e) => setUsageDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </Form.Group>

            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Form.Label className="mb-0">Supply Items Used</Form.Label>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={handleAddUsageItem}
                >
                  <i className="bi bi-plus-circle me-1"></i>
                  Add Item
                </Button>
              </div>

              {usageLogItems.length === 0 ? (
                <Alert variant="secondary" className="text-center">
                  No items added yet. Click "Add Item" to begin.
                </Alert>
              ) : (
                usageLogItems.map((item, index) => (
                  <Card key={index} className="mb-2">
                    <Card.Body className="p-3">
                      <Row className="align-items-center">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="small">Supply</Form.Label>
                            <Form.Select
                              value={item.supplyId}
                              onChange={(e) => handleUsageItemChange(index, 'supplyId', e.target.value)}
                              size="sm"
                            >
                              <option value="">Select supply...</option>
                              {supplies.map(supply => (
                                <option key={supply.id} value={supply.id}>
                                  {supply.name} ({supply.unitsInStock} {supply.unitOfMeasure} available)
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group>
                            <Form.Label className="small">Quantity Used</Form.Label>
                            <Form.Control
                              type="number"
                              value={item.quantityUsed}
                              onChange={(e) => handleUsageItemChange(index, 'quantityUsed', e.target.value)}
                              size="sm"
                              min="1"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={2} className="text-center">
                          <Form.Label className="small d-block">&nbsp;</Form.Label>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleRemoveUsageItem(index)}
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                ))
              )}
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Notes (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={usageNotes}
                onChange={(e) => setUsageNotes(e.target.value)}
                placeholder="Any additional notes about today's usage..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUsageLogModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="success" 
            onClick={handleSubmitUsageLog} 
            disabled={loading || usageLogItems.length === 0}
          >
            {loading ? 'Logging...' : 'Submit Usage Log'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MedicalSuppliesInventory;
