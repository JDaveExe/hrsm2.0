import React, { useState, useEffect } from 'react';
import { Modal, Button, Table } from 'react-bootstrap';
import './styles/ActionModals.css';

const CheckupHistoryModal = ({ show, onHide, selectedPatient, isDarkMode = false }) => {
  const [checkupHistory, setCheckupHistory] = useState([]);
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
      fetchCheckupHistory();
    }
  }, [show, selectedPatient]);

  const fetchCheckupHistory = async () => {
    setLoading(true);
    try {
      // Sample data - replace with actual API call
      const sampleHistory = [
        {
          id: 1,
          date: '2025-07-28',
          time: '10:30 AM',
          purpose: 'General Checkup',
          doctor: 'Dr. Maria Santos',
          notes: 'Patient shows good vital signs\nBlood pressure: 120/80 mmHg\nTemperature: 36.5°C\nRecommended: Continue current medications\nFollow-up: 1 month'
        },
        {
          id: 2,
          date: '2025-06-15',
          time: '02:15 PM',
          purpose: 'Vaccination - COVID-19 Booster',
          doctor: 'Dr. Juan Cruz',
          notes: 'COVID-19 Booster vaccine administered\nVaccine: Pfizer-BioNTech\nLot No: FK8891\nNo adverse reactions observed\nNext dose: Not required'
        },
        {
          id: 3,
          date: '2025-05-20',
          time: '09:45 AM',
          purpose: 'Medical Certificate',
          doctor: 'Dr. Ana Reyes',
          notes: 'Medical certificate issued for employment\nPatient is physically fit to work\nNo medical restrictions\nValid for 6 months\nCertificate No: MC-2025-0520-001'
        },
        {
          id: 4,
          date: '2025-04-10',
          time: '11:20 AM',
          purpose: 'Follow-up Consultation',
          doctor: 'Dr. Maria Santos',
          notes: 'Follow-up for hypertension management\nBlood pressure improved: 130/85 mmHg\nPatient responsive to medication\nContinue Amlodipine 5mg daily\nNext follow-up: 3 months'
        },
        {
          id: 5,
          date: '2025-03-05',
          time: '03:30 PM',
          purpose: 'Annual Physical Examination',
          doctor: 'Dr. Carlos Mendoza',
          notes: 'Complete physical examination performed\nBP: 140/90 mmHg (elevated)\nBMI: 24.5 (normal)\nRecommended: Start antihypertensive medication\nLab tests: CBC, Lipid profile, FBS ordered\nLifestyle modifications advised'
        }
      ];
      setCheckupHistory(sampleHistory);
    } catch (error) {
      console.error('Error fetching checkup history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewNotes = (record) => {
    alert(`Doctor Notes:\n\n${record.notes}`);
  };

  const handleExportHistory = () => {
    alert('Checkup history exported successfully!');
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      dialogClassName="action-modal-wide"
      centered
      className="checkup-history-modal"
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
          <i className="bi bi-clipboard-pulse me-2"></i>
          Checkup History
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
                    <div><strong>Total Visits:</strong> {checkupHistory.length}</div>
                    <div><strong>Last Visit:</strong> {checkupHistory.length > 0 ? new Date(checkupHistory[0].date).toLocaleDateString() : 'N/A'}</div>
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
                <p className="mt-3">Loading checkup history...</p>
              </div>
            ) : checkupHistory.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-clipboard-x" style={{fontSize: '4rem', color: '#6c757d'}}></i>
                <h5 className="mt-3" style={{color: isDarkMode ? '#94a3b8' : '#6c757d'}}>No Checkup History</h5>
                <p style={{color: isDarkMode ? '#94a3b8' : '#6c757d'}}>
                  No checkup records found for this patient.
                </p>
              </div>
            ) : (
              <>
                {/* Checkup History Table */}
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
                        }}>Date</th>
                        <th style={{
                          color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                          fontWeight: '600',
                          padding: '12px 16px',
                          fontSize: '0.9rem',
                          border: 'none'
                        }}>Time</th>
                        <th style={{
                          color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                          fontWeight: '600',
                          padding: '12px 16px',
                          fontSize: '0.9rem',
                          border: 'none'
                        }}>Purpose of Visit</th>
                        <th style={{
                          color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                          fontWeight: '600',
                          padding: '12px 16px',
                          fontSize: '0.9rem',
                          border: 'none'
                        }}>Doctor Assisted</th>
                        <th style={{
                          color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                          fontWeight: '600',
                          padding: '12px 16px',
                          fontSize: '0.9rem',
                          border: 'none',
                          textAlign: 'center'
                        }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checkupHistory.map((record, index) => (
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
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td style={{
                            color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                            padding: '12px 16px',
                            fontSize: '0.9rem',
                            border: 'none'
                          }}>
                            {record.time}
                          </td>
                          <td style={{
                            color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                            padding: '12px 16px',
                            fontSize: '0.9rem',
                            border: 'none'
                          }}>
                            {record.purpose}
                          </td>
                          <td style={{
                            color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                            padding: '12px 16px',
                            fontSize: '0.9rem',
                            border: 'none'
                          }}>
                            {record.doctor}
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
                              onClick={() => handleViewNotes(record)}
                            >
                              <i className="bi bi-sticky me-1"></i>
                              Notes
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {/* Summary Stats */}
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
                      <div style={{color: '#0ea5e9', fontSize: '1.5rem', fontWeight: 'bold'}}>{checkupHistory.length}</div>
                      <div style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.8rem'}}>Total Visits</div>
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
                      <div style={{color: '#10b981', fontSize: '1.5rem', fontWeight: 'bold'}}>
                        {checkupHistory.filter(r => new Date(r.date).getFullYear() === new Date().getFullYear()).length}
                      </div>
                      <div style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.8rem'}}>This Year</div>
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
                      <div style={{color: '#f59e0b', fontSize: '1.5rem', fontWeight: 'bold'}}>
                        {checkupHistory.filter(r => {
                          const recordDate = new Date(r.date);
                          const ninetyDaysAgo = new Date();
                          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
                          return recordDate >= ninetyDaysAgo;
                        }).length}
                      </div>
                      <div style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.8rem'}}>Last 90 Days</div>
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
                      <div style={{color: '#ef4444', fontSize: '1.5rem', fontWeight: 'bold'}}>
                        {checkupHistory.filter(r => {
                          const recordDate = new Date(r.date);
                          const thirtyDaysAgo = new Date();
                          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                          return recordDate >= thirtyDaysAgo;
                        }).length}
                      </div>
                      <div style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.8rem'}}>Last 30 Days</div>
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
          onClick={handleExportHistory}
        >
          <i className="bi bi-download me-2"></i>
          Export History
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CheckupHistoryModal;
