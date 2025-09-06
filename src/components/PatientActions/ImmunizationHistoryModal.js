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

  const fetchImmunizationHistory = async () => {
    setLoading(true);
    try {
      // Sample data - replace with actual API call
      const sampleHistory = [
        {
          id: 1,
          vaccine: 'COVID-19 mRNA Vaccine (Pfizer)',
          description: 'mRNA vaccine against SARS-CoV-2',
          dateGiven: '2025-06-15',
          dose: 'Booster',
          provider: 'Dr. Juan Cruz',
          status: 'Complete',
          details: 'Vaccine: COVID-19 mRNA (Pfizer)\nLot Number: FK8891\nManufacturer: Pfizer-BioNTech\nExpiry Date: Dec 2025\nSite: Left arm\nNo adverse reactions reported'
        },
        {
          id: 2,
          vaccine: 'Hepatitis B Vaccine',
          description: 'Protects against hepatitis B virus',
          dateGiven: '2024-03-20',
          dose: 'Series Complete',
          provider: 'Dr. Maria Santos',
          status: 'Complete',
          details: 'Vaccine: Hepatitis B\nSeries: 3 doses completed\nDates: Birth, 1 month, 6 months\nAll doses administered properly\nImmunity: Lifetime protection'
        },
        {
          id: 3,
          vaccine: 'Measles, Mumps, and Rubella (MMR)',
          description: 'Combined vaccine for MMR protection',
          dateGiven: '2024-01-15',
          dose: 'Dose 2',
          provider: 'Dr. Ana Reyes',
          status: 'Complete',
          details: 'Vaccine: MMR (Measles, Mumps, Rubella)\nDose: 2 of 2\nFirst dose: 9 months\nSecond dose: 15 months\nProtection: Lifetime immunity expected'
        },
        {
          id: 4,
          vaccine: 'Pneumococcal Conjugate (PCV)',
          description: 'Protects against pneumococcal disease',
          dateGiven: '2023-12-10',
          dose: 'Booster',
          provider: 'Dr. Carlos Mendoza',
          status: 'Complete',
          details: 'Vaccine: Pneumococcal Conjugate (PCV)\nSchedule: 6, 10, 14 weeks + booster\nCurrent: Booster dose completed\nProtection: Against 13 pneumococcal strains\nNext due: Adult booster at age 65'
        },
        {
          id: 5,
          vaccine: 'Influenza Vaccine',
          description: 'Annual flu protection',
          dateGiven: '2024-10-20',
          dose: 'Annual 2024',
          provider: 'Dr. Maria Santos',
          status: 'Due',
          details: 'Vaccine: Influenza (Flu Shot)\nSeason: 2024-2025\nType: Quadrivalent inactivated\nNext dose: October 2025\nNote: Annual vaccination recommended'
        }
      ];
      setImmunizationHistory(sampleHistory);
    } catch (error) {
      console.error('Error fetching immunization history:', error);
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
                    Routine Childhood ({immunizationHistory.filter(v => ['Hepatitis B', 'MMR', 'PCV'].some(type => v.vaccine.includes(type))).length})
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
                    COVID-19 Series ({immunizationHistory.filter(v => v.vaccine.includes('COVID')).length})
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
                    Annual Vaccines ({immunizationHistory.filter(v => v.vaccine.includes('Influenza')).length})
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
                    Special (0)
                  </div>
                </div>
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
                      {immunizationHistory.map((record) => (
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
                      ))}
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
                    <div className="row">
                      <div className="col-md-6">
                        <div style={{color: isDarkMode ? '#e2e8f0' : '#856404', fontWeight: '600', fontSize: '0.9rem'}}>
                          <i className="bi bi-exclamation-triangle me-2"></i>
                          Influenza Vaccine (2025)
                        </div>
                        <small style={{color: isDarkMode ? '#94a3b8' : '#6c757d'}}>
                          Due: October 2025 | Annual flu shot
                        </small>
                      </div>
                      <div className="col-md-6">
                        <div style={{color: isDarkMode ? '#e2e8f0' : '#856404', fontWeight: '600', fontSize: '0.9rem'}}>
                          <i className="bi bi-info-circle me-2"></i>
                          Tetanus-Diphtheria (Td)
                        </div>
                        <small style={{color: isDarkMode ? '#94a3b8' : '#6c757d'}}>
                          Due: March 2026 | 10-year booster
                        </small>
                      </div>
                    </div>
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
                      <div style={{color: '#0ea5e9', fontSize: '1.5rem', fontWeight: 'bold'}}>95%</div>
                      <div style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.8rem'}}>Compliance</div>
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
                      <div style={{color: '#f59e0b', fontSize: '1.5rem', fontWeight: 'bold'}}>2</div>
                      <div style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.7rem'}}>Due Soon</div>
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
                      <div style={{color: '#ef4444', fontSize: '1.5rem', fontWeight: 'bold'}}>0</div>
                      <div style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.8rem'}}>Overdue</div>
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
