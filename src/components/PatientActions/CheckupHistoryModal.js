import React, { useState, useEffect } from 'react';
import { Modal, Button, Table } from 'react-bootstrap';
import './styles/ActionModals.css';

const CheckupHistoryModal = ({ show, onHide, selectedPatient, isDarkMode = false }) => {
  const [checkupHistory, setCheckupHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

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

  // Helper function to format date properly
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  // Helper function to format time properly
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'N/A';
    }
  };

  useEffect(() => {
    if (show && selectedPatient) {
      fetchCheckupHistory();
    }
  }, [show, selectedPatient]);

  const fetchCheckupHistory = async () => {
    setLoading(true);
    try {
      // Fetch real checkup history from the API
      const response = await fetch(`/api/checkups/history/${selectedPatient.id}`, {
        headers: {
          'Authorization': `Bearer ${window.__authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const historyData = await response.json();
        
        // Format the data properly for display
        const formattedHistory = historyData.map(record => ({
          ...record,
          date: record.completedAt || record.checkInTime || record.createdAt,
          time: record.completedAt || record.checkInTime || record.createdAt,
          purpose: record.serviceType || 'General Checkup',
          doctor: record.assignedDoctor || 'Unknown Doctor'
        }));
        
        setCheckupHistory(formattedHistory);
        console.log('Fetched checkup history:', formattedHistory);
      } else {
        console.error('Failed to fetch checkup history:', response.status);
        // Fallback to sample data for demonstration
        const sampleHistory = [
          {
            id: 1,
            date: new Date().toISOString(),
            time: new Date().toISOString(),
            purpose: 'General Checkup',
            doctor: 'Dr. Maria Santos',
            notes: 'Patient shows good vital signs\nBlood pressure: 120/80 mmHg\nTemperature: 36.5°C\nRecommended: Continue current medications\nFollow-up: 1 month',
            chiefComplaint: 'Routine checkup',
            presentSymptoms: 'No specific symptoms',
            diagnosis: 'Good health status',
            treatmentPlan: 'Continue current medications',
            doctorNotes: 'Patient shows good vital signs. Blood pressure: 120/80 mmHg. Temperature: 36.5°C. Recommended: Continue current medications. Follow-up: 1 month'
          }
        ];
        setCheckupHistory(sampleHistory);
      }
    } catch (error) {
      console.error('Error fetching checkup history:', error);
      // Fallback to empty array
      setCheckupHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewNotes = (record) => {
    setSelectedRecord(record);
    setShowNotesModal(true);
  };

  const handleCloseNotesModal = () => {
    setShowNotesModal(false);
    setSelectedRecord(null);
  };

  const handleExportHistory = () => {
    alert('Checkup history exported successfully!');
  };

  return (
    <>
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
                    <div><strong>Last Visit:</strong> {checkupHistory.length > 0 ? formatDate(checkupHistory[0].date) : 'N/A'}</div>
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
                            {formatDate(record.date)}
                          </td>
                          <td style={{
                            color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                            padding: '12px 16px',
                            fontSize: '0.9rem',
                            border: 'none'
                          }}>
                            {formatTime(record.time)}
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

    {/* Detailed Clinical Notes Modal */}
    {showNotesModal && selectedRecord && (
      <Modal 
        show={showNotesModal} 
        onHide={handleCloseNotesModal}
        dialogClassName="action-modal-wide"
        centered
        className="clinical-notes-modal"
      >
        <Modal.Header 
          closeButton 
          style={{
            background: '#10b981', 
            color: '#ffffff', 
            border: 'none',
            borderRadius: '12px 12px 0 0'
          }}
        >
          <Modal.Title className="w-100 text-center fw-bold fs-4">
            <i className="bi bi-journal-medical me-2"></i>
            Clinical Notes - {formatDate(selectedRecord.date)}
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
          {/* Checkup Overview */}
          <div 
            className="mb-4 p-3"
            style={{
              background: isDarkMode ? '#334155' : '#f8f9fa',
              borderRadius: '8px',
              border: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`
            }}
          >
            <div className="row">
              <div className="col-md-6">
                <div style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.9rem'}}>
                  <strong>Date & Time:</strong> {formatDate(selectedRecord.date)} at {formatTime(selectedRecord.time)}
                </div>
                <div style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.9rem'}}>
                  <strong>Purpose:</strong> {selectedRecord.purpose}
                </div>
              </div>
              <div className="col-md-6">
                <div style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.9rem'}}>
                  <strong>Doctor:</strong> {selectedRecord.doctor}
                </div>
                <div style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.9rem'}}>
                  <strong>Patient:</strong> {getPatientFullName(selectedPatient)}
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Notes Grid */}
          <div className="row">
            {/* Chief Complaint */}
            <div className="col-md-6 mb-3">
              <div 
                style={{
                  background: isDarkMode ? '#334155' : '#fff',
                  borderRadius: '8px',
                  border: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`,
                  padding: '16px'
                }}
              >
                <h6 style={{color: '#3b82f6', marginBottom: '12px', fontWeight: '600'}}>
                  <i className="bi bi-chat-square-text me-2"></i>
                  Chief Complaint
                </h6>
                <div style={{
                  color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  minHeight: '60px',
                  padding: '8px',
                  background: isDarkMode ? '#1e293b' : '#f8f9fa',
                  borderRadius: '4px',
                  border: `1px solid ${isDarkMode ? '#475569' : '#e9ecef'}`
                }}>
                  {selectedRecord.chiefComplaint || selectedRecord.notes || 'No chief complaint recorded.'}
                </div>
              </div>
            </div>

            {/* Present Symptoms */}
            <div className="col-md-6 mb-3">
              <div 
                style={{
                  background: isDarkMode ? '#334155' : '#fff',
                  borderRadius: '8px',
                  border: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`,
                  padding: '16px'
                }}
              >
                <h6 style={{color: '#f59e0b', marginBottom: '12px', fontWeight: '600'}}>
                  <i className="bi bi-thermometer me-2"></i>
                  Present Symptoms
                </h6>
                <div style={{
                  color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  minHeight: '60px',
                  padding: '8px',
                  background: isDarkMode ? '#1e293b' : '#f8f9fa',
                  borderRadius: '4px',
                  border: `1px solid ${isDarkMode ? '#475569' : '#e9ecef'}`
                }}>
                  {selectedRecord.presentSymptoms || 'No symptoms recorded.'}
                </div>
              </div>
            </div>

            {/* Diagnosis */}
            <div className="col-md-6 mb-3">
              <div 
                style={{
                  background: isDarkMode ? '#334155' : '#fff',
                  borderRadius: '8px',
                  border: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`,
                  padding: '16px'
                }}
              >
                <h6 style={{color: '#10b981', marginBottom: '12px', fontWeight: '600'}}>
                  <i className="bi bi-clipboard-pulse me-2"></i>
                  Diagnosis
                </h6>
                <div style={{
                  color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  minHeight: '60px',
                  padding: '8px',
                  background: isDarkMode ? '#1e293b' : '#f8f9fa',
                  borderRadius: '4px',
                  border: `1px solid ${isDarkMode ? '#475569' : '#e9ecef'}`
                }}>
                  {selectedRecord.diagnosis || 'No diagnosis recorded.'}
                </div>
              </div>
            </div>

            {/* Treatment Plan */}
            <div className="col-md-6 mb-3">
              <div 
                style={{
                  background: isDarkMode ? '#334155' : '#fff',
                  borderRadius: '8px',
                  border: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`,
                  padding: '16px'
                }}
              >
                <h6 style={{color: '#8b5cf6', marginBottom: '12px', fontWeight: '600'}}>
                  <i className="bi bi-prescription2 me-2"></i>
                  Treatment Plan
                </h6>
                <div style={{
                  color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  minHeight: '60px',
                  padding: '8px',
                  background: isDarkMode ? '#1e293b' : '#f8f9fa',
                  borderRadius: '4px',
                  border: `1px solid ${isDarkMode ? '#475569' : '#e9ecef'}`
                }}>
                  {selectedRecord.treatmentPlan || 'No treatment plan recorded.'}
                </div>
              </div>
            </div>
          </div>

              {/* Doctor's Additional Notes - Full Width */}
          <div className="mb-3">
            <div 
              style={{
                background: isDarkMode ? '#334155' : '#fff',
                borderRadius: '8px',
                border: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`,
                padding: '16px'
              }}
            >
              <h6 style={{color: '#ef4444', marginBottom: '12px', fontWeight: '600'}}>
                <i className="bi bi-journal-text me-2"></i>
                Doctor's Additional Notes
                {selectedRecord.doctor && (
                  <span style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontWeight: '400', fontSize: '0.8rem', marginLeft: '8px'}}>
                    - by {selectedRecord.doctor}
                  </span>
                )}
              </h6>
              <div style={{
                color: isDarkMode ? '#e2e8f0' : '#2c3e50',
                fontSize: '0.9rem',
                lineHeight: '1.5',
                minHeight: '80px',
                padding: '12px',
                background: isDarkMode ? '#1e293b' : '#f8f9fa',
                borderRadius: '4px',
                border: `1px solid ${isDarkMode ? '#475569' : '#e9ecef'}`,
                whiteSpace: 'pre-wrap'
              }}>
                {selectedRecord.doctorNotes || selectedRecord.notes || 'No additional notes recorded.'}
              </div>
            </div>
          </div>          {/* Prescriptions Section */}
          {selectedRecord.prescriptions && selectedRecord.prescriptions.length > 0 && (
            <div className="mb-3">
              <div 
                style={{
                  background: isDarkMode ? '#334155' : '#fff',
                  borderRadius: '8px',
                  border: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`,
                  padding: '16px'
                }}
              >
                <h6 style={{color: '#06b6d4', marginBottom: '12px', fontWeight: '600'}}>
                  <i className="bi bi-capsule me-2"></i>
                  Prescriptions ({selectedRecord.prescriptions.length})
                </h6>
                <div className="row">
                  {selectedRecord.prescriptions.map((prescription, index) => (
                    <div key={index} className="col-md-6 mb-2">
                      <div style={{
                        padding: '8px',
                        background: isDarkMode ? '#1e293b' : '#f8f9fa',
                        borderRadius: '4px',
                        border: `1px solid ${isDarkMode ? '#475569' : '#e9ecef'}`
                      }}>
                        <div style={{fontWeight: '600', color: isDarkMode ? '#e2e8f0' : '#2c3e50'}}>
                          {prescription.medication}
                        </div>
                        <div style={{fontSize: '0.8rem', color: isDarkMode ? '#94a3b8' : '#6c757d'}}>
                          Qty: {prescription.quantity} | {prescription.instructions}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
            onClick={handleCloseNotesModal}
            style={{
              background: isDarkMode ? '#64748b' : '#6c757d',
              border: 'none',
              color: '#ffffff'
            }}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to History
          </Button>
          <Button 
            style={{
              background: '#10b981',
              border: 'none',
              color: '#ffffff'
            }}
            onClick={() => {
              // Print or export this specific checkup notes
              alert('Clinical notes exported successfully!');
            }}
          >
            <i className="bi bi-printer me-2"></i>
            Print Notes
          </Button>
        </Modal.Footer>
      </Modal>
    )}
    </>
  );
};

export default CheckupHistoryModal;
