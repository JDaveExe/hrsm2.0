import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert, Badge, Table, InputGroup } from 'react-bootstrap';
import './styles/VaccinationModal.css';

const VaccinationModal = ({ 
  show, 
  onHide, 
  patient, 
  onSave 
}) => {
  const [availableVaccines, setAvailableVaccines] = useState([]);
  const [selectedVaccine, setSelectedVaccine] = useState(null);
  const [vaccinationData, setVaccinationData] = useState({
    vaccine: '',
    vaccineName: '',
    batch: '',
    lotNumber: '',
    expiryDate: '',
    administrationSite: 'left-arm',
    dose: '',
    administeredBy: '',
    administeredByRole: '',
    administeredByUserId: '',
    notes: '',
    adverseReactions: 'none',
    consentGiven: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [usersByRole, setUsersByRole] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Load available vaccines when modal opens
  useEffect(() => {
    if (show) {
      loadAvailableVaccines();
      initializeForm();
    }
  }, [show]);

  const loadAvailableVaccines = async () => {
    setLoading(true);
    try {
      // Load vaccines from backend
      const response = await fetch('/api/inventory/vaccines', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || window.__authToken}`
        }
      });
      
      if (response.ok) {
        const vaccines = await response.json();
        // Filter only active vaccines with stock and not expired
        const currentDate = new Date();
        const activeVaccines = vaccines.filter(v => {
          const expiryDate = new Date(v.expiryDate);
          return v.isActive && 
                 v.dosesInStock > 0 && 
                 expiryDate > currentDate;
        });
        setAvailableVaccines(activeVaccines);
      } else {
        console.error('Failed to load vaccines');
        // Fallback to sample data
        setAvailableVaccines(getSampleVaccines());
      }
    } catch (error) {
      console.error('Error loading vaccines:', error);
      setAvailableVaccines(getSampleVaccines());
    } finally {
      setLoading(false);
    }
  };

  const getSampleVaccines = () => {
    const currentDate = new Date();
    const sampleVaccines = [
    {
      id: 1,
      name: "BCG (Bacillus Calmette-Guérin)",
      description: "Tuberculosis prevention vaccine for newborns",
      category: "Routine Childhood",
      dosesInStock: 45,
      batchNumber: "BCG001-2024",
      expiryDate: "2025-08-15",
      ageGroups: ["Newborn"],
      administrationRoute: "Intradermal"
    },
    {
      id: 2,
      name: "Hepatitis B Vaccine",
      description: "Protects against hepatitis B virus infection",
      category: "Routine Childhood",
      dosesInStock: 120,
      batchNumber: "HEP-B-024",
      expiryDate: "2025-12-20",
      ageGroups: ["Newborn", "Child", "Adult"],
      administrationRoute: "Intramuscular"
    },
    {
      id: 3,
      name: "Pentavalent Vaccine (DTP-HepB-Hib)",
      description: "Combined vaccine: Diphtheria, Tetanus, Pertussis, Hepatitis B, Haemophilus influenzae type b",
      category: "Routine Childhood", 
      dosesInStock: 85,
      batchNumber: "PENTA-077",
      expiryDate: "2025-10-30",
      ageGroups: ["Infant"],
      administrationRoute: "Intramuscular"
    },
    {
      id: 4,
      name: "Oral Polio Vaccine (OPV)",
      description: "Oral vaccine for polio prevention",
      category: "Routine Childhood",
      dosesInStock: 200,
      batchNumber: "OPV-2024-15",
      expiryDate: "2025-06-25",
      ageGroups: ["Infant", "Child"],
      administrationRoute: "Oral"
    },
    {
      id: 5,
      name: "Measles, Mumps, and Rubella (MMR)",
      description: "Combined vaccine for MMR protection",
      category: "Routine Childhood",
      dosesInStock: 75,
      batchNumber: "MMR-034-2024",
      expiryDate: "2025-09-10",
      ageGroups: ["Child", "Adult"],
      administrationRoute: "Subcutaneous"
    },
    {
      id: 6,
      name: "Pneumococcal Conjugate Vaccine (PCV)",
      description: "Protects against pneumococcal diseases",
      category: "Routine Childhood",
      dosesInStock: 90,
      batchNumber: "PCV13-089",
      expiryDate: "2025-11-15",
      ageGroups: ["Infant", "Child", "Adult"],
      administrationRoute: "Intramuscular"
    },
    {
      id: 7,
      name: "Influenza Vaccine",
      description: "Annual flu protection",
      category: "Annual",
      dosesInStock: 150,
      batchNumber: "FLU-2024-25",
      expiryDate: "2025-05-30",
      ageGroups: ["Child", "Adult", "Senior"],
      administrationRoute: "Intramuscular"
    },
    {
      id: 8,
      name: "COVID-19 mRNA Vaccine (Pfizer)",
      description: "mRNA vaccine against SARS-CoV-2",
      category: "Emergency Use",
      dosesInStock: 180,
      batchNumber: "COVID-PF-048",
      expiryDate: "2025-07-20",
      ageGroups: ["Child", "Adult", "Senior"],
      administrationRoute: "Intramuscular"
    },
    {
      id: 9,
      name: "Tetanus Toxoid (TT)",
      description: "Tetanus prevention for pregnant women and wound management",
      category: "Adult",
      dosesInStock: 65,
      batchNumber: "TT-2024-31",
      expiryDate: "2026-03-12",
      ageGroups: ["Adult"],
      administrationRoute: "Intramuscular"
    },
    {
      id: 10,
      name: "Human Papillomavirus (HPV) Vaccine",
      description: "Prevents cervical cancer, given to adolescents",
      category: "Adolescent",
      dosesInStock: 40,
      batchNumber: "HPV-018-2024",
      expiryDate: "2025-07-25",
      ageGroups: ["Adolescent"],
      administrationRoute: "Intramuscular"
    }
  ];

  // Filter out expired vaccines from sample data too
  return sampleVaccines.filter(v => {
    const expiryDate = new Date(v.expiryDate);
    return expiryDate > currentDate;
  });
};

  const initializeForm = () => {
    setVaccinationData({
      vaccine: '',
      vaccineName: '',
      batch: '',
      lotNumber: '',
      expiryDate: '',
      administrationSite: 'left-arm',
      dose: '1',
      administeredBy: '',
      administeredByRole: '',
      administeredByUserId: '',
      notes: '',
      adverseReactions: 'none',
      consentGiven: false
    });
    setSelectedVaccine(null);
    setSearchTerm('');
    setUsersByRole([]);
    
    // Initialize available roles
    setAvailableRoles([
      { value: 'doctor', label: 'Doctor' },
      { value: 'admin', label: 'Administrator' },
      { value: 'management', label: 'Management' },
      { value: 'staff', label: 'Staff' }
    ]);
  };

  // Load users by role
  const loadUsersByRole = async (role) => {
    if (!role) {
      setUsersByRole([]);
      return;
    }

    setLoadingUsers(true);
    try {
      const response = await fetch(`/api/users/by-role/${role}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || window.__authToken}`
        }
      });
      
      if (response.ok) {
        const users = await response.json();
        setUsersByRole(users);
      } else {
        console.error('Failed to load users');
        setUsersByRole([]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setUsersByRole([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Handle role selection
  const handleRoleSelect = (role) => {
    setVaccinationData(prev => ({
      ...prev,
      administeredByRole: role,
      administeredBy: '',
      administeredByUserId: ''
    }));
    loadUsersByRole(role);
  };

  // Handle user selection
  const handleUserSelect = (userId) => {
    const selectedUser = usersByRole.find(user => user.id === parseInt(userId));
    if (selectedUser) {
      setVaccinationData(prev => ({
        ...prev,
        administeredByUserId: userId,
        administeredBy: `${selectedUser.firstName} ${selectedUser.lastName}`
      }));
    }
  };

  const handleVaccineSelect = (vaccine) => {
    setSelectedVaccine(vaccine);
    setVaccinationData(prev => ({
      ...prev,
      vaccine: vaccine.id,
      vaccineName: vaccine.name,
      batch: vaccine.batchNumber,
      lotNumber: vaccine.batchNumber,
      expiryDate: vaccine.expiryDate,
      dose: '1'
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setVaccinationData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async () => {
    if (!selectedVaccine || !vaccinationData.consentGiven) {
      alert('Please select a vaccine and confirm consent');
      return;
    }

    if (!vaccinationData.administeredByRole || !vaccinationData.administeredByUserId) {
      alert('Please select the role and healthcare provider who administered the vaccine');
      return;
    }

    const vaccinationRecord = {
      patientId: patient.patientId,
      sessionId: patient.id,
      vaccineId: selectedVaccine.id,
      vaccineName: selectedVaccine.name,
      batchNumber: vaccinationData.batch,
      lotNumber: vaccinationData.lotNumber,
      expiryDate: vaccinationData.expiryDate,
      administrationSite: vaccinationData.administrationSite,
      dose: vaccinationData.dose,
      administeredBy: vaccinationData.administeredBy,
      notes: vaccinationData.notes,
      adverseReactions: vaccinationData.adverseReactions,
      administeredAt: new Date().toISOString(),
      category: selectedVaccine.category,
      administrationRoute: selectedVaccine.administrationRoute
    };

    onSave(vaccinationRecord);
  };

  const filteredVaccines = availableVaccines.filter(vaccine =>
    vaccine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vaccine.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vaccine.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryBadge = (category) => {
    const variants = {
      'Routine Childhood': 'primary',
      'Adult': 'success',
      'Adolescent': 'info',
      'Annual': 'warning',
      'Emergency Use': 'danger',
      'Travel': 'secondary'
    };
    return <Badge bg={variants[category] || 'secondary'}>{category}</Badge>;
  };

  const getStockBadge = (stock) => {
    if (stock > 50) return <Badge bg="success">{stock} doses</Badge>;
    if (stock > 20) return <Badge bg="warning">{stock} doses</Badge>;
    return <Badge bg="danger">{stock} doses</Badge>;
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      size="xl"
      className="vaccination-modal"
      backdrop="static"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-shield-plus me-2 text-success"></i>
          Vaccination Administration
          {patient && (
            <div className="patient-info">
              <small className="text-muted d-block">
                {patient.patientName} (ID: {patient.patientId}) | Age: {patient.age} | Gender: {patient.gender}
              </small>
            </div>
          )}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <Row>
          {/* Left Column: Vaccine Selection */}
          <Col md={8}>
            <div className="vaccine-selection-section mb-4">
              <h5 className="mb-3">
                <i className="bi bi-search me-2"></i>
                Select Vaccine
              </h5>
              
              {/* Search Bar */}
              <InputGroup className="mb-3">
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search vaccines by name, description, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>

              {/* Vaccines List */}
              <div className="vaccines-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading vaccines...</span>
                    </div>
                  </div>
                ) : (
                  <Table hover responsive size="sm">
                    <thead>
                      <tr>
                        <th width="5%">Select</th>
                        <th width="30%">Vaccine Name</th>
                        <th width="20%">Category</th>
                        <th width="15%">Stock</th>
                        <th width="15%">Batch</th>
                        <th width="15%">Expiry</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVaccines.map((vaccine) => (
                        <tr 
                          key={vaccine.id} 
                          className={`vaccine-row ${selectedVaccine?.id === vaccine.id ? 'table-primary' : ''}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleVaccineSelect(vaccine)}
                        >
                          <td>
                            <Form.Check
                              type="radio"
                              name="selectedVaccine"
                              checked={selectedVaccine?.id === vaccine.id}
                              onChange={() => handleVaccineSelect(vaccine)}
                            />
                          </td>
                          <td>
                            <div>
                              <strong>{vaccine.name}</strong>
                              <br />
                              <small className="text-muted">{vaccine.description}</small>
                            </div>
                          </td>
                          <td>{getCategoryBadge(vaccine.category)}</td>
                          <td>{getStockBadge(vaccine.dosesInStock)}</td>
                          <td><code>{vaccine.batchNumber}</code></td>
                          <td>
                            <small className={new Date(vaccine.expiryDate) < new Date() ? 'text-danger' : 'text-muted'}>
                              {new Date(vaccine.expiryDate).toLocaleDateString()}
                            </small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </div>
            </div>
          </Col>

          {/* Right Column: Vaccination Details */}
          <Col md={4}>
            <div className="vaccination-details-section">
              <h5 className="mb-3">
                <i className="bi bi-clipboard-data me-2"></i>
                Administration Details
              </h5>

              {selectedVaccine ? (
                <Form>
                  {/* Selected Vaccine Info */}
                  <Alert variant="info">
                    <strong>{selectedVaccine.name}</strong>
                    <br />
                    <small>{selectedVaccine.description}</small>
                    <br />
                    <small><strong>Route:</strong> {selectedVaccine.administrationRoute}</small>
                  </Alert>

                  {/* Administration Site */}
                  <Form.Group className="mb-3">
                    <Form.Label>Administration Site</Form.Label>
                    <Form.Select
                      name="administrationSite"
                      value={vaccinationData.administrationSite}
                      onChange={handleChange}
                    >
                      <option value="left-arm">Left Arm (Deltoid)</option>
                      <option value="right-arm">Right Arm (Deltoid)</option>
                      <option value="left-thigh">Left Thigh (Vastus Lateralis)</option>
                      <option value="right-thigh">Right Thigh (Vastus Lateralis)</option>
                      <option value="oral">Oral (for oral vaccines)</option>
                    </Form.Select>
                  </Form.Group>

                  {/* Dose */}
                  <Form.Group className="mb-3">
                    <Form.Label>Dose Number</Form.Label>
                    <Form.Control
                      type="number"
                      name="dose"
                      value={vaccinationData.dose}
                      onChange={handleChange}
                      min="1"
                      max="5"
                    />
                  </Form.Group>

                  {/* Administered By - Role Selection */}
                  <Form.Group className="mb-3">
                    <Form.Label>Role</Form.Label>
                    <Form.Select
                      value={vaccinationData.administeredByRole}
                      onChange={(e) => handleRoleSelect(e.target.value)}
                    >
                      <option value="">Select Role</option>
                      {availableRoles.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  {/* Healthcare Provider Selection */}
                  <Form.Group className="mb-3">
                    <Form.Label>Healthcare Provider</Form.Label>
                    <Form.Select
                      value={vaccinationData.administeredByUserId}
                      onChange={(e) => handleUserSelect(e.target.value)}
                      disabled={!vaccinationData.administeredByRole || loadingUsers}
                    >
                      <option value="">
                        {loadingUsers ? 'Loading...' : 'Select Provider'}
                      </option>
                      {usersByRole.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                          {user.position && ` - ${user.position}`}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  {/* Notes */}
                  <Form.Group className="mb-3">
                    <Form.Label>Clinical Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="notes"
                      value={vaccinationData.notes}
                      onChange={handleChange}
                      placeholder="Any observations or special notes..."
                    />
                  </Form.Group>

                  {/* Adverse Reactions */}
                  <Form.Group className="mb-3">
                    <Form.Label>Immediate Adverse Reactions</Form.Label>
                    <Form.Select
                      name="adverseReactions"
                      value={vaccinationData.adverseReactions}
                      onChange={handleChange}
                    >
                      <option value="none">None observed</option>
                      <option value="mild-pain">Mild pain at injection site</option>
                      <option value="mild-swelling">Mild swelling</option>
                      <option value="mild-redness">Mild redness</option>
                      <option value="other">Other (specify in notes)</option>
                    </Form.Select>
                  </Form.Group>

                  {/* Consent Checkbox */}
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      name="consentGiven"
                      checked={vaccinationData.consentGiven}
                      onChange={handleChange}
                      label="Patient/Guardian consent obtained"
                      required
                    />
                  </Form.Group>
                </Form>
              ) : (
                <Alert variant="warning">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Please select a vaccine from the list to proceed with administration details.
                </Alert>
              )}
            </div>
          </Col>
        </Row>
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button 
          variant="success" 
          onClick={handleSubmit}
          disabled={!selectedVaccine || !vaccinationData.consentGiven || !vaccinationData.administeredByRole || !vaccinationData.administeredByUserId}
        >
          <i className="bi bi-check-circle me-1"></i>
          Complete Vaccination
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default VaccinationModal;