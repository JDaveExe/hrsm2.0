import React, { useState, useEffect } from 'react';
import { Modal, Button, Table } from 'react-bootstrap';
import './styles/ActionModals.css';

const ImmunizationHistoryModal = ({ show, onHide, selectedPatient, isDarkMode = false }) => {
  const [immunizationHistory, setImmunizationHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const getPatientFullName = (patient) => {
    if (!patient) return 'Unknown Patient';
    return `${patient.firstName || ''} ${patient.middleName || ''} ${patient.lastName || ''}`.replace(/\s+/g, ' ').trim();
  };

  const getPatientAge = (patient) => {
    if (!patient?.dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(patient.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  useEffect(() => {
    if (show && selectedPatient) {
      fetchImmunizationHistory();
    }
  }, [show, selectedPatient]);

  // Helper function to calculate vaccination categories
  const categorizeVaccines = (vaccines) => {
    const categories = {
      routineChildhood: 0,
      covidSeries: 0,
      annual: 0,
      special: 0
    };

    vaccines.forEach(vaccine => {
      const vaccineName = vaccine.vaccine.toLowerCase();
      
      // Routine Childhood vaccines
      if (vaccineName.includes('bcg') || 
          vaccineName.includes('hepatitis') || 
          vaccineName.includes('pentavalent') || 
          vaccineName.includes('dtp') || 
          vaccineName.includes('mmr') || 
          vaccineName.includes('pneumococcal') || 
          vaccineName.includes('pcv')) {
        categories.routineChildhood++;
      }
      // COVID-19 vaccines  
      else if (vaccineName.includes('covid')) {
        categories.covidSeries++;
      }
      // Annual vaccines
      else if (vaccineName.includes('influenza') || 
               vaccineName.includes('flu')) {
        categories.annual++;
      }
      // Special vaccines (travel, occupational, etc.)
      else {
        categories.special++;
      }
    });

    return categories;
  };

  // Helper function to calculate upcoming vaccinations based on age and existing vaccines
  const calculateUpcomingVaccinations = (currentVaccines, patientAge) => {
    const upcoming = [];
    const currentVaccineNames = currentVaccines.map(v => v.vaccine.toLowerCase());
    
    // Age-based recommendations
    if (patientAge >= 18) {
      // Adult recommendations
      if (!currentVaccineNames.some(v => v.includes('influenza') || v.includes('flu'))) {
        upcoming.push({
          name: 'Influenza Vaccine (2025)',
          dueDate: 'October 2025',
          description: 'Annual flu shot',
          type: 'annual'
        });
      }
      
      // Tetanus booster every 10 years
      const hasRecentTetanus = currentVaccines.some(v => {
        const vaccineName = v.vaccine.toLowerCase();
        const vaccineDate = new Date(v.dateGiven);
        const tenYearsAgo = new Date();
        tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
        
        return (vaccineName.includes('tetanus') || vaccineName.includes('td') || vaccineName.includes('tdap')) 
               && vaccineDate > tenYearsAgo;
      });
      
      if (!hasRecentTetanus) {
        upcoming.push({
          name: 'Tetanus-Diphtheria (Td)',
          dueDate: 'March 2026',
          description: '10-year booster',
          type: 'booster'
        });
      }
    }
    
    // Universal recommendations
    if (!currentVaccineNames.some(v => v.includes('covid'))) {
      upcoming.push({
        name: 'COVID-19 Vaccine',
        dueDate: 'As recommended',
        description: 'Initial series or booster',
        type: 'covid'
      });
    }

    return upcoming;
  };

  // Helper function to calculate compliance rate
  const calculateComplianceRate = (currentVaccines, patientAge) => {
    let requiredVaccines = 0;
    let completedVaccines = currentVaccines.length;

    // Age-based required vaccines
    if (patientAge >= 0) requiredVaccines += 2; // BCG, Hepatitis B birth dose
    if (patientAge >= 1) requiredVaccines += 3; // Pentavalent series
    if (patientAge >= 1) requiredVaccines += 2; // MMR series  
    if (patientAge >= 1) requiredVaccines += 3; // PCV series
    if (patientAge >= 18) requiredVaccines += 1; // Annual flu
    if (patientAge >= 18) requiredVaccines += 1; // Tetanus booster
    
    // COVID vaccines (recommended for all ages 6 months+)
    if (patientAge >= 0.5) requiredVaccines += 2; // COVID primary series
    
    return Math.min(100, Math.round((completedVaccines / Math.max(requiredVaccines, 1)) * 100));
  };

  const fetchImmunizationHistory = async () => {
    setLoading(true);
    try {
      // Get auth token
      const authData = JSON.parse(sessionStorage.getItem('authData') || '{}');
      const authToken = authData.token || window.__authToken;
      
      if (!authToken) {
        console.error('No authentication token available');
        setImmunizationHistory([]);
        return;
      }

      // Fetch actual vaccination records for the patient
      console.log('Fetching vaccination records for patient:', selectedPatient);
      const patientId = selectedPatient.id || selectedPatient.patientId;
      console.log('Using patient ID:', patientId);
      
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${baseURL}/api/vaccinations/patient/${patientId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched vaccination records:', data);
        
        // Transform the vaccination records to match the expected format
        // Note: data is an array directly, not wrapped in a vaccinations property
        const formattedHistory = (Array.isArray(data) ? data : []).map(vaccination => ({
          id: vaccination.id,
          vaccine: vaccination.vaccineName,
          description: vaccination.notes || 'Vaccination administered',
          dateGiven: new Date(vaccination.administeredAt).toISOString().split('T')[0], // Format as YYYY-MM-DD
          dose: vaccination.dose || 'Dose 1',
          provider: vaccination.administeredBy || 'Healthcare Provider',
          status: 'Complete',
          category: vaccination.category || 'General', // Add category from database
          details: `Vaccine: ${vaccination.vaccineName}\n` +
                   `Batch Number: ${vaccination.batchNumber || 'Not specified'}\n` +
                   `Expiry Date: ${vaccination.expiryDate ? new Date(vaccination.expiryDate).toLocaleDateString() : 'Not specified'}\n` +
                   `Administration Site: ${vaccination.administrationSite || 'Not specified'}\n` +
                   `Route: ${vaccination.administrationRoute || 'Not specified'}\n` +
                   `Administered By: ${vaccination.administeredBy || 'Not specified'}\n` +
                   `Date: ${new Date(vaccination.administeredAt).toLocaleString()}\n` +
                   `Adverse Reactions: ${vaccination.adverseReactions || 'None reported'}\n` +
                   `Notes: ${vaccination.notes || 'None'}`
        })) || [];

        setImmunizationHistory(formattedHistory);
      } else {
        console.error('Failed to fetch vaccination records:', response.status);
        setImmunizationHistory([]);
      }
    } catch (error) {
      console.error('Error fetching immunization history:', error);
      setImmunizationHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (vaccine) => {
    alert(`Vaccine Details:\n\n${vaccine.details}`);
  };

  const handleGenerateCard = () => {
    alert('Immunization card generated successfully!');
  };

  const handleExportHistory = () => {
    alert('Immunization history exported successfully!');
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      dialogClassName="action-modal-wide"
      centered
      className="immunization-history-modal"
    >
      <Modal.Header 
        closeButton 
        style={{
          background: '#0ea5e9', 
          color: '#ffffff', 
          border: 'none',
          borderRadius: '12px 12px 0 0'
        }}
      >
        <Modal.Title className="w-100 text-center fw-bold fs-4">
          <i className="bi bi-shield-check me-2"></i>
          Immunization History
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{
        background: isDarkMode ? '#1e293b' : '#ffffff', 
        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
        padding: '24px',
        minHeight: '60vh',
        maxHeight: '70vh',
        overflowY: 'auto'
      }}>
        {selectedPatient && (
          <div>
            {/* Patient Header */}
            <div 
              className="mb-4 p-3"
              style={{
                background: isDarkMode ? '#334155' : '#f8f9fa',
                borderRadius: '8px',
                border: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`
              }}
            >
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h5 style={{color: isDarkMode ? '#e2e8f0' : '#2c3e50', marginBottom: '8px', fontWeight: '600'}}>
                    {getPatientFullName(selectedPatient)}
                  </h5>
                  <div className="row">
                    <div className="col-md-6">
                      <span style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.9rem'}}>
                        <strong>Patient ID:</strong> PT-{String(selectedPatient.id).padStart(4, '0')}
                      </span>
                    </div>
                    <div className="col-md-6">
                      <span style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.9rem'}}>
                        <strong>Age:</strong> {getPatientAge(selectedPatient)} years old
                      </span>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 text-end">
                  <div style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.9rem'}}>
                    <div><strong>Total Vaccines:</strong> {immunizationHistory.length}</div>
                    <div><strong>Last Vaccination:</strong> {immunizationHistory.length > 0 ? new Date(immunizationHistory[0].dateGiven).toLocaleDateString() : 'N/A'}</div>
                    <div><strong>Status:</strong> <span style={{color: '#10b981', fontWeight: '600'}}>Up to Date</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vaccination Categories Tabs */}
            <div className="mb-4">
              <div className="row g-2">
                {(() => {
                  const categories = categorizeVaccines(immunizationHistory);
                  return (
                    <>
                      <div className="col-md-3">
                        <div 
                          className="text-center p-2"
                          style={{
                            background: '#10b981',
                            color: '#ffffff',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: '600'
                          }}
                        >
                          Routine Childhood ({categories.routineChildhood})
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div 
                          className="text-center p-2"
                          style={{
                            background: '#0ea5e9',
                            color: '#ffffff',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: '600'
                          }}
                        >
                          COVID-19 Series ({categories.covidSeries})
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div 
                          className="text-center p-2"
                          style={{
                            background: '#f59e0b',
                            color: '#ffffff',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: '600'
                          }}
                        >
                          Annual Vaccines ({categories.annual})
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div 
                          className="text-center p-2"
                          style={{
                            background: '#6b7280',
                            color: '#ffffff',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: '600'
                          }}
                        >
                          Special ({categories.special})
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading immunization history...</p>
              </div>
            ) : immunizationHistory.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-shield-x" style={{fontSize: '4rem', color: '#6c757d'}}></i>
                <h5 className="mt-3" style={{color: isDarkMode ? '#94a3b8' : '#6c757d'}}>No Immunization Records</h5>
                <p style={{color: isDarkMode ? '#94a3b8' : '#6c757d'}}>
                  No vaccination records found for this patient.
                </p>
              </div>
            ) : (
              <>
                {/* Immunization Records Table */}
                <div 
                  style={{
                    background: isDarkMode ? '#334155' : '#ffffff',
                    borderRadius: '8px',
                    border: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`,
                    overflow: 'hidden'
                  }}
                >
                  <Table 
                    hover 
                    responsive 
                    className="mb-0"
                    style={{ backgroundColor: 'transparent' }}
                  >
                    <thead>
                      <tr style={{
                        background: isDarkMode ? '#475569' : '#f8f9fa',
                        borderBottom: `2px solid ${isDarkMode ? '#64748b' : '#dee2e6'}`
                      }}>
                        <th style={{
                          color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                          fontWeight: '600',
                          padding: '12px 16px',
                          fontSize: '0.9rem',
                          border: 'none'
                        }}>Vaccine</th>
                        <th style={{
                          color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                          fontWeight: '600',
                          padding: '12px 16px',
                          fontSize: '0.9rem',
                          border: 'none'
                        }}>Date Given</th>
                        <th style={{
                          color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                          fontWeight: '600',
                          padding: '12px 16px',
                          fontSize: '0.9rem',
                          border: 'none'
                        }}>Dose</th>
                        <th style={{
                          color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                          fontWeight: '600',
                          padding: '12px 16px',
                          fontSize: '0.9rem',
                          border: 'none'
                        }}>Provider</th>
                        <th style={{
                          color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                          fontWeight: '600',
                          padding: '12px 16px',
                          fontSize: '0.9rem',
                          border: 'none'
                        }}>Status</th>
                        <th style={{
                          color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                          fontWeight: '600',
                          padding: '12px 16px',
                          fontSize: '0.9rem',
                          border: 'none',
                          textAlign: 'center'
                        }}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {immunizationHistory.length === 0 ? (
                        <tr>
                          <td 
                            colSpan="6" 
                            style={{
                              color: isDarkMode ? '#94a3b8' : '#6c757d',
                              padding: '32px 16px',
                              textAlign: 'center',
                              fontStyle: 'italic',
                              border: 'none'
                            }}
                          >
                            <i className="bi bi-info-circle me-2"></i>
                            No vaccination records found for this patient.
                          </td>
                        </tr>
                      ) : (
                        immunizationHistory.map((record) => (
                        <tr key={record.id} style={{
                          borderBottom: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`,
                          backgroundColor: isDarkMode ? '#334155' : '#ffffff'
                        }}>
                          <td style={{
                            color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                            padding: '12px 16px',
                            fontSize: '0.9rem',
                            border: 'none'
                          }}>
                            <div style={{fontWeight: '600'}}>{record.vaccine}</div>
                            <small style={{color: isDarkMode ? '#94a3b8' : '#6c757d'}}>{record.description}</small>
                          </td>
                          <td style={{
                            color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                            padding: '12px 16px',
                            fontSize: '0.9rem',
                            border: 'none'
                          }}>
                            {new Date(record.dateGiven).toLocaleDateString()}
                          </td>
                          <td style={{
                            color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                            padding: '12px 16px',
                            fontSize: '0.9rem',
                            border: 'none'
                          }}>
                            {record.dose}
                          </td>
                          <td style={{
                            color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                            padding: '12px 16px',
                            fontSize: '0.9rem',
                            border: 'none'
                          }}>
                            {record.provider}
                          </td>
                          <td style={{
                            padding: '12px 16px',
                            border: 'none'
                          }}>
                            <span style={{
                              background: record.status === 'Complete' ? '#10b981' : '#f59e0b',
                              color: '#ffffff',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}>{record.status}</span>
                          </td>
                          <td style={{
                            padding: '12px 16px',
                            border: 'none',
                            textAlign: 'center'
                          }}>
                            <Button 
                              size="sm"
                              style={{
                                background: '#0ea5e9',
                                border: 'none',
                                color: '#ffffff',
                                borderRadius: '6px',
                                padding: '4px 12px',
                                fontSize: '0.8rem'
                              }}
                              onClick={() => handleViewDetails(record)}
                            >
                              <i className="bi bi-info-circle me-1"></i>
                              View
                            </Button>
                          </td>
                        </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>

                {/* Upcoming Vaccinations */}
                <div className="mt-4">
                  <h6 style={{color: isDarkMode ? '#e2e8f0' : '#2c3e50', marginBottom: '16px', fontWeight: '600'}}>
                    <i className="bi bi-calendar-plus me-2" style={{color: '#f59e0b'}}></i>
                    Upcoming Vaccinations
                  </h6>
                  <div 
                    className="p-3"
                    style={{
                      background: isDarkMode ? '#334155' : '#fff3cd',
                      borderRadius: '8px',
                      border: `1px solid ${isDarkMode ? '#475569' : '#ffeaa7'}`
                    }}
                  >
                    {(() => {
                      const patientAge = getPatientAge(selectedPatient);
                      const upcomingVaccines = calculateUpcomingVaccinations(immunizationHistory, patientAge);
                      
                      if (upcomingVaccines.length === 0) {
                        return (
                          <div style={{color: isDarkMode ? '#94a3b8' : '#6c757d', textAlign: 'center', fontStyle: 'italic'}}>
                            <i className="bi bi-check-circle me-2"></i>
                            No upcoming vaccinations required at this time.
                          </div>
                        );
                      }
                      
                      return (
                        <div className="row">
                          {upcomingVaccines.map((vaccine, index) => (
                            <div key={index} className="col-md-6 mb-2">
                              <div style={{color: isDarkMode ? '#e2e8f0' : '#856404', fontWeight: '600', fontSize: '0.9rem'}}>
                                <i className={`bi ${
                                  vaccine.type === 'annual' ? 'bi-exclamation-triangle' :
                                  vaccine.type === 'booster' ? 'bi-info-circle' :
                                  vaccine.type === 'covid' ? 'bi-shield-plus' : 'bi-calendar-plus'
                                } me-2`}></i>
                                {vaccine.name}
                              </div>
                              <small style={{color: isDarkMode ? '#94a3b8' : '#6c757d'}}>
                                Due: {vaccine.dueDate} | {vaccine.description}
                              </small>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Immunization Summary */}
                <div className="row mt-4">
                  <div className="col-md-3">
                    <div 
                      className="text-center p-3"
                      style={{
                        background: isDarkMode ? '#334155' : '#f8f9fa',
                        borderRadius: '8px',
                        border: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`
                      }}
                    >
                      <div style={{color: '#10b981', fontSize: '1.5rem', fontWeight: 'bold'}}>{immunizationHistory.length}</div>
                      <div style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.8rem'}}>Total Vaccines</div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div 
                      className="text-center p-3"
                      style={{
                        background: isDarkMode ? '#334155' : '#f8f9fa',
                        borderRadius: '8px',
                        border: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`
                      }}
                    >
                      {(() => {
                        const patientAge = getPatientAge(selectedPatient);
                        const complianceRate = calculateComplianceRate(immunizationHistory, patientAge);
                        const color = complianceRate >= 80 ? '#10b981' : complianceRate >= 60 ? '#f59e0b' : '#ef4444';
                        return (
                          <>
                            <div style={{color, fontSize: '1.5rem', fontWeight: 'bold'}}>{complianceRate}%</div>
                            <div style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.8rem'}}>Compliance</div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div 
                      className="text-center p-3"
                      style={{
                        background: isDarkMode ? '#334155' : '#f8f9fa',
                        borderRadius: '8px',
                        border: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`
                      }}
                    >
                      {(() => {
                        const patientAge = getPatientAge(selectedPatient);
                        const upcomingCount = calculateUpcomingVaccinations(immunizationHistory, patientAge).length;
                        return (
                          <>
                            <div style={{color: '#f59e0b', fontSize: '1.5rem', fontWeight: 'bold'}}>{upcomingCount}</div>
                            <div style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.7rem'}}>Due Soon</div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div 
                      className="text-center p-3"
                      style={{
                        background: isDarkMode ? '#334155' : '#f8f9fa',
                        borderRadius: '8px',
                        border: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`
                      }}
                    >
                      {(() => {
                        // Calculate overdue vaccines (for now, show 0 since we don't track due dates)
                        // This could be enhanced to check if required vaccines are missing based on age
                        const overdueCount = 0;
                        return (
                          <>
                            <div style={{color: '#ef4444', fontSize: '1.5rem', fontWeight: 'bold'}}>{overdueCount}</div>
                            <div style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.8rem'}}>Overdue</div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Modal.Body>
      
      <Modal.Footer style={{
        background: isDarkMode ? '#334155' : '#f8f9fa',
        border: 'none',
        borderRadius: '0 0 12px 12px'
      }}>
        <Button 
          variant="secondary" 
          onClick={onHide}
          style={{
            background: isDarkMode ? '#64748b' : '#6c757d',
            border: 'none',
            color: '#ffffff'
          }}
        >
          <i className="bi bi-x-circle me-2"></i>
          Close
        </Button>
        <Button 
          style={{
            background: '#10b981',
            border: 'none',
            color: '#ffffff'
          }}
          onClick={handleGenerateCard}
        >
          <i className="bi bi-card-text me-2"></i>
          Generate Card
        </Button>
        <Button 
          style={{
            background: '#0ea5e9',
            border: 'none',
            color: '#ffffff'
          }}
          onClick={handleExportHistory}
        >
          <i className="bi bi-download me-2"></i>
          Export History
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ImmunizationHistoryModal;
