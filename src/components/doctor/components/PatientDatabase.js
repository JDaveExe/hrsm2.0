import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, Table, Button, Tabs, Tab, Alert, Form, InputGroup, Pagination } from 'react-bootstrap';
import { useData } from '../../../context/DataContext';
import '../styles/PatientDatabase.css';

const PatientDatabase = () => {
  const { 
    patientsData, 
    familiesData, 
    todaysCheckups,
    fetchAllPatients,
    fetchAllFamilies
  } = useData();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [tabKey, setTabKey] = useState('families');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  
  // Pagination state
  const [currentFamilyPage, setCurrentFamilyPage] = useState(1);
  const [currentPatientPage, setCurrentPatientPage] = useState(1);
  const itemsPerPage = 10;

  // Sort configurations
  const [familySortConfig, setFamilySortConfig] = useState({ key: null, direction: 'ascending' });
  const [memberSortConfig, setMemberSortConfig] = useState({ key: null, direction: 'ascending' });

  // Utility functions
  const getPatientFullName = useCallback((patient) => {
    const parts = [
      patient.firstName,
      patient.middleName,
      patient.lastName,
      patient.suffix
    ].filter(Boolean);
    return parts.join(' ') || 'Unknown';
  }, []);

  const getPatientAge = useCallback((patient) => {
    if (patient.age) return patient.age;
    if (patient.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(patient.dateOfBirth);
      const age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
      return age;
    }
    return 'N/A';
  }, []);

  const getPatientContact = useCallback((patient) => {
    return patient.contactNumber || patient.phone || 'N/A';
  }, []);

  const getFamilyHead = useCallback((family) => {
    return family.headOfFamily || 'Not specified';
  }, []);

  const getFamilyMemberCount = useCallback((family) => {
    if (!patientsData) return 0;
    return patientsData.filter(patient => patient.familyId === family.id).length;
  }, [patientsData]);

  const getFamilyMembers = useCallback((familyId) => {
    if (!patientsData || !Array.isArray(patientsData)) return [];
    return patientsData.filter(patient => patient.familyId === familyId);
  }, [patientsData]);

  const formatShortDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    try {
      const cleanDateString = dateString.split('T')[0];
      const parts = cleanDateString.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);

      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return 'N/A';
      }

      const date = new Date(Date.UTC(year, month, day));
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
      });
    } catch {
      return 'N/A';
    }
  }, []);

  // Sorting logic
  const requestSort = useCallback((key, sortConfig, setSortConfig) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  }, []);

  const sortData = useCallback((data, sortConfig) => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle special cases
      if (sortConfig.key === 'memberCount') {
        aValue = getFamilyMemberCount(a);
        bValue = getFamilyMemberCount(b);
      } else if (sortConfig.key === 'lastCheckup') {
        aValue = a.lastCheckup || a.createdAt || '';
        bValue = b.lastCheckup || b.createdAt || '';
      }

      // Convert to string for comparison
      aValue = String(aValue || '').toLowerCase();
      bValue = String(bValue || '').toLowerCase();

      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [getFamilyMemberCount]);

  // Filtered and sorted data
  const filteredFamilies = useMemo(() => {
    if (!familiesData || !Array.isArray(familiesData)) return [];
    if (!searchTerm.trim()) return familiesData;

    const term = searchTerm.toLowerCase();
    return familiesData.filter(family => 
      family.familyName?.toLowerCase().includes(term) ||
      family.surname?.toLowerCase().includes(term) ||
      family.headOfFamily?.toLowerCase().includes(term) ||
      String(family.id).includes(term)
    );
  }, [familiesData, searchTerm]);

  const filteredPatients = useMemo(() => {
    if (!patientsData || !Array.isArray(patientsData)) return [];
    if (!searchTerm.trim()) return patientsData;

    const term = searchTerm.toLowerCase();
    return patientsData.filter(patient => {
      const fullName = getPatientFullName(patient).toLowerCase();
      const contact = getPatientContact(patient).toLowerCase();
      return fullName.includes(term) ||
             String(patient.id).includes(term) ||
             String(patient.familyId || '').includes(term) ||
             contact.includes(term);
    });
  }, [patientsData, searchTerm, getPatientFullName, getPatientContact]);

  const sortedFamilies = useMemo(() => {
    return sortData(filteredFamilies, familySortConfig);
  }, [filteredFamilies, familySortConfig, sortData]);

  const sortedPatients = useMemo(() => {
    return sortData(filteredPatients, memberSortConfig);
  }, [filteredPatients, memberSortConfig, sortData]);

  // Pagination logic
  const totalFamilyPages = Math.ceil(sortedFamilies.length / itemsPerPage);
  const totalPatientPages = Math.ceil(sortedPatients.length / itemsPerPage);

  const paginatedFamilies = useMemo(() => {
    const startIndex = (currentFamilyPage - 1) * itemsPerPage;
    return sortedFamilies.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedFamilies, currentFamilyPage, itemsPerPage]);

  const paginatedPatients = useMemo(() => {
    const startIndex = (currentPatientPage - 1) * itemsPerPage;
    return sortedPatients.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedPatients, currentPatientPage, itemsPerPage]);

  // Event handlers
  const handlePatientSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
    // Reset pagination when searching
    setCurrentFamilyPage(1);
    setCurrentPatientPage(1);
  }, []);

  const handleRefreshData = useCallback(async () => {
    setLoading(true);
    console.log('Starting data refresh...');
    
    try {
      await Promise.all([
        fetchAllPatients().catch(err => {
          console.warn('Failed to fetch patients during refresh:', err);
          return [];
        }),
        fetchAllFamilies().catch(err => {
          console.warn('Failed to fetch families during refresh:', err);
          return [];
        })
      ]);
      
      console.log('Data refresh completed successfully');
      setAlert({ type: 'success', message: 'Data refreshed successfully!' });
    } catch (error) {
      console.error('Error refreshing data:', error);
      setAlert({ type: 'danger', message: 'Error refreshing data. Please try again.' });
    } finally {
      setLoading(false);
    }
  }, [fetchAllPatients, fetchAllFamilies]);

  // Auto-hide alerts
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // Pagination handlers
  const handleFamilyPageChange = useCallback((pageNumber) => {
    setCurrentFamilyPage(pageNumber);
  }, []);

  const handlePatientPageChange = useCallback((pageNumber) => {
    setCurrentPatientPage(pageNumber);
  }, []);

  // Reset pagination when switching tabs
  useEffect(() => {
    setCurrentFamilyPage(1);
    setCurrentPatientPage(1);
  }, [tabKey]);

  return (
    <div className="patient-database">
      {alert && (
        <Alert variant={alert.type} className="mb-3" dismissible onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      <Card className="management-card">
        <Card.Header className="management-header-card">
          <div className="management-header">
            <div className="management-title-section">
              <h3 className="management-title">
                <i className="bi bi-database me-2"></i>
                Patient Database
                <span className="read-only-badge ms-2">Read-only access</span>
              </h3>
            </div>
            
            <div className="management-actions">
              {/* Search Bar moved to right side */}
              <InputGroup className="search-input-inline me-3">
                <Form.Control
                  type="text"
                  placeholder="Search patients or families..."
                  value={searchTerm}
                  onChange={handlePatientSearch}
                />
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
              </InputGroup>
              
              {/* Refresh Button beside search */}
              <Button 
                variant="success" 
                onClick={handleRefreshData}
                disabled={loading}
                className="refresh-btn"
              >
                <i className={`bi ${loading ? 'bi-arrow-clockwise rotate' : 'bi-arrow-clockwise'} me-1`}></i>
                Refresh Data
              </Button>
            </div>
          </div>
        </Card.Header>

        <Card.Body>
          {/* Tab List with Info and Pagination */}
          <div className="tabs-with-info">
            <div className="tabs-container">
              <Tabs
                activeKey={tabKey}
                onSelect={(k) => setTabKey(k)}
                className="mb-0"
              >
                <Tab eventKey="families" title="Family Records" />
                <Tab eventKey="members" title="Individual Members" />
              </Tabs>
            </div>
            
            <div className="tab-info-pagination">
              {tabKey === 'families' && (
                <>
                  <div className="pagination-info-inline">
                    Showing {((currentFamilyPage - 1) * itemsPerPage) + 1} to {Math.min(currentFamilyPage * itemsPerPage, sortedFamilies.length)} of {sortedFamilies.length} families
                  </div>
                  {totalFamilyPages > 1 && (
                    <Pagination size="sm" className="mb-0">
                      <Pagination.First 
                        onClick={() => handleFamilyPageChange(1)}
                        disabled={currentFamilyPage === 1}
                      />
                      <Pagination.Prev 
                        onClick={() => handleFamilyPageChange(currentFamilyPage - 1)}
                        disabled={currentFamilyPage === 1}
                      />
                      
                      {[...Array(totalFamilyPages)].map((_, index) => {
                        const pageNumber = index + 1;
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalFamilyPages ||
                          (pageNumber >= currentFamilyPage - 1 && pageNumber <= currentFamilyPage + 1)
                        ) {
                          return (
                            <Pagination.Item
                              key={pageNumber}
                              active={pageNumber === currentFamilyPage}
                              onClick={() => handleFamilyPageChange(pageNumber)}
                            >
                              {pageNumber}
                            </Pagination.Item>
                          );
                        } else if (
                          pageNumber === currentFamilyPage - 2 ||
                          pageNumber === currentFamilyPage + 2
                        ) {
                          return <Pagination.Ellipsis key={pageNumber} />;
                        }
                        return null;
                      })}
                      
                      <Pagination.Next 
                        onClick={() => handleFamilyPageChange(currentFamilyPage + 1)}
                        disabled={currentFamilyPage === totalFamilyPages}
                      />
                      <Pagination.Last 
                        onClick={() => handleFamilyPageChange(totalFamilyPages)}
                        disabled={currentFamilyPage === totalFamilyPages}
                      />
                    </Pagination>
                  )}
                </>
              )}
              
              {tabKey === 'members' && (
                <>
                  <div className="pagination-info-inline">
                    Showing {((currentPatientPage - 1) * itemsPerPage) + 1} to {Math.min(currentPatientPage * itemsPerPage, sortedPatients.length)} of {sortedPatients.length} patients
                  </div>
                  {totalPatientPages > 1 && (
                    <Pagination size="sm" className="mb-0">
                      <Pagination.First 
                        onClick={() => handlePatientPageChange(1)}
                        disabled={currentPatientPage === 1}
                      />
                      <Pagination.Prev 
                        onClick={() => handlePatientPageChange(currentPatientPage - 1)}
                        disabled={currentPatientPage === 1}
                      />
                      
                      {[...Array(totalPatientPages)].map((_, index) => {
                        const pageNumber = index + 1;
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalPatientPages ||
                          (pageNumber >= currentPatientPage - 1 && pageNumber <= currentPatientPage + 1)
                        ) {
                          return (
                            <Pagination.Item
                              key={pageNumber}
                              active={pageNumber === currentPatientPage}
                              onClick={() => handlePatientPageChange(pageNumber)}
                            >
                              {pageNumber}
                            </Pagination.Item>
                          );
                        } else if (
                          pageNumber === currentPatientPage - 2 ||
                          pageNumber === currentPatientPage + 2
                        ) {
                          return <Pagination.Ellipsis key={pageNumber} />;
                        }
                        return null;
                      })}
                      
                      <Pagination.Next 
                        onClick={() => handlePatientPageChange(currentPatientPage + 1)}
                        disabled={currentPatientPage === totalPatientPages}
                      />
                      <Pagination.Last 
                        onClick={() => handlePatientPageChange(totalPatientPages)}
                        disabled={currentPatientPage === totalPatientPages}
                      />
                    </Pagination>
                  )}
                </>
              )}
            </div>
          </div>          {/* Tab Content */}
          <div className="tab-content-area">
            {tabKey === 'families' && (
              <div className="table-container">
                <Table hover responsive className="data-table">
                  <thead>
                    <tr>
                      <th 
                        style={{textAlign: 'left', cursor: 'pointer', userSelect: 'none'}}
                        onClick={() => requestSort('id', familySortConfig, setFamilySortConfig)}
                      >
                        Family ID
                        {familySortConfig.key === 'id' && (
                          <i className={`bi bi-arrow-${familySortConfig.direction === 'ascending' ? 'up' : 'down'} ms-1`}></i>
                        )}
                      </th>
                      <th 
                        style={{textAlign: 'left', cursor: 'pointer', userSelect: 'none'}}
                        onClick={() => requestSort('familyName', familySortConfig, setFamilySortConfig)}
                      >
                        Family Name
                        {familySortConfig.key === 'familyName' && (
                          <i className={`bi bi-arrow-${familySortConfig.direction === 'ascending' ? 'up' : 'down'} ms-1`}></i>
                        )}
                      </th>
                      <th style={{textAlign: 'left'}}>Family Head (Optional)</th>
                      <th 
                        style={{textAlign: 'right', cursor: 'pointer', userSelect: 'none'}}
                        onClick={() => requestSort('memberCount', familySortConfig, setFamilySortConfig)}
                      >
                        Number of Members
                        {familySortConfig.key === 'memberCount' && (
                          <i className={`bi bi-arrow-${familySortConfig.direction === 'ascending' ? 'up' : 'down'} ms-1`}></i>
                        )}
                      </th>
                      <th 
                        style={{textAlign: 'left', cursor: 'pointer', userSelect: 'none'}}
                        onClick={() => requestSort('createdAt', familySortConfig, setFamilySortConfig)}
                      >
                        Date Registered
                        {familySortConfig.key === 'createdAt' && (
                          <i className={`bi bi-arrow-${familySortConfig.direction === 'ascending' ? 'up' : 'down'} ms-1`}></i>
                        )}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedFamilies.map((family) => (
                      <tr key={family.id}>
                        <td style={{textAlign: 'left'}}>{family.id}</td>
                        <td style={{textAlign: 'left'}}>{family.familyName}</td>
                        <td style={{textAlign: 'left'}}>{getFamilyHead(family)}</td>
                        <td style={{textAlign: 'right'}}>{getFamilyMemberCount(family)}</td>
                        <td style={{textAlign: 'left'}}>{formatShortDate(family.createdAt || family.registrationDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}

            {tabKey === 'members' && (
              <div className="table-container">
                <Table hover responsive className="data-table">
                  <thead>
                    <tr>
                      <th 
                        style={{textAlign: 'left', cursor: 'pointer', userSelect: 'none'}}
                        onClick={() => requestSort('id', memberSortConfig, setMemberSortConfig)}
                      >
                        Patient ID
                        {memberSortConfig.key === 'id' && (
                          <i className={`bi bi-arrow-${memberSortConfig.direction === 'ascending' ? 'up' : 'down'} ms-1`}></i>
                        )}
                      </th>
                      <th 
                        style={{textAlign: 'left', cursor: 'pointer', userSelect: 'none'}}
                        onClick={() => requestSort('familyId', memberSortConfig, setMemberSortConfig)}
                      >
                        Family ID
                        {memberSortConfig.key === 'familyId' && (
                          <i className={`bi bi-arrow-${memberSortConfig.direction === 'ascending' ? 'up' : 'down'} ms-1`}></i>
                        )}
                      </th>
                      <th style={{textAlign: 'left', minWidth: '200px', width: '250px'}}>Name</th>
                      <th style={{textAlign: 'right'}}>Age</th>
                      <th style={{textAlign: 'left'}}>Gender</th>
                      <th style={{textAlign: 'left'}}>Contact Number</th>
                      <th 
                        style={{textAlign: 'left', cursor: 'pointer', userSelect: 'none'}}
                        onClick={() => requestSort('lastCheckup', memberSortConfig, setMemberSortConfig)}
                      >
                        Last Checkup
                        {memberSortConfig.key === 'lastCheckup' && (
                          <i className={`bi bi-arrow-${memberSortConfig.direction === 'ascending' ? 'up' : 'down'} ms-1`}></i>
                        )}
                      </th>
                      <th style={{textAlign: 'center'}}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPatients.map((patient) => (
                      <tr key={patient.id}>
                        <td style={{textAlign: 'left'}}>PT-{String(patient.id).padStart(4, '0')}</td>
                        <td style={{textAlign: 'left'}}>{patient.familyId || 'Unassigned'}</td>
                        <td style={{textAlign: 'left', minWidth: '200px', padding: '12px 8px'}}>
                          {getPatientFullName(patient)}
                        </td>
                        <td style={{textAlign: 'right'}}>{getPatientAge(patient)}</td>
                        <td style={{textAlign: 'left'}}>{patient.gender}</td>
                        <td style={{textAlign: 'left'}}>{getPatientContact(patient)}</td>
                        <td style={{textAlign: 'left'}}>
                          {formatShortDate(patient.lastCheckup || patient.createdAt)}
                        </td>
                        <td style={{textAlign: 'center'}} className="action-cell">
                          {todaysCheckups?.some(checkup => checkup.patientId === patient.id) ? (
                            <span className="badge bg-success">Checked In Today</span>
                          ) : (
                            <span className="badge bg-secondary">Available</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </div>

          {/* Summary Statistics */}
          <div className="mt-4 p-3 bg-light rounded">
            <div className="row text-center">
              <div className="col-md-3">
                <div className="stat-item">
                  <h4 className="text-primary mb-1">{familiesData?.length || 0}</h4>
                  <small className="text-muted">Total Families</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-item">
                  <h4 className="text-success mb-1">{patientsData?.length || 0}</h4>
                  <small className="text-muted">Total Patients</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-item">
                  <h4 className="text-info mb-1">{todaysCheckups?.length || 0}</h4>
                  <small className="text-muted">Today's Checkups</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-item">
                  <h4 className="text-warning mb-1">{patientsData?.filter(p => !p.familyId).length || 0}</h4>
                  <small className="text-muted">Unassigned Patients</small>
                </div>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default PatientDatabase;
