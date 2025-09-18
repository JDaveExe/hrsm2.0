import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import PropTypes from 'prop-types';
import './PatientMedicalRecords.css'; // Reuse the existing styles

const PatientPrescriptions = ({ onRefresh }) => {
  // State management
  const { user } = useAuth();
  const [activePrescriptions, setActivePrescriptions] = useState([]);
  const [prescriptionHistory, setPrescriptionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'

  // Pagination state for history
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 5;

  // Get auth token
  const getAuthToken = useCallback(() => {
    try {
      const authData = sessionStorage.getItem('authData');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed?.token;
      }
    } catch (error) {
      console.error('Error parsing authData:', error);
    }
    return null;
  }, []);

  // Fetch active prescriptions
  const fetchActivePrescriptions = useCallback(async () => {
    if (!user?.patientId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = getAuthToken();
      const response = await fetch(`http://localhost:5000/api/patient/${user.patientId}/prescriptions/active`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setActivePrescriptions(data.activePrescriptions || []);
      } else if (response.status === 404) {
        setActivePrescriptions([]);
      } else {
        throw new Error('Failed to fetch active prescriptions');
      }
    } catch (error) {
      console.error('Error fetching active prescriptions:', error);
      setError('Unable to load active prescriptions');
      setActivePrescriptions([]);
    } finally {
      setLoading(false);
    }
  }, [user?.patientId, getAuthToken]);

  // Fetch prescription history
  const fetchPrescriptionHistory = useCallback(async () => {
    if (!user?.patientId) return;
    
    try {
      const token = getAuthToken();
      const response = await fetch(`http://localhost:5000/api/patient/${user.patientId}/prescriptions/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPrescriptionHistory(data.prescriptionHistory || []);
      } else if (response.status === 404) {
        setPrescriptionHistory([]);
      } else {
        throw new Error('Failed to fetch prescription history');
      }
    } catch (error) {
      console.error('Error fetching prescription history:', error);
      setPrescriptionHistory([]);
    }
  }, [user?.patientId, getAuthToken]);

  // Fetch data on component mount
  useEffect(() => {
    fetchActivePrescriptions();
    if (activeTab === 'history') {
      fetchPrescriptionHistory();
    }
  }, [fetchActivePrescriptions, fetchPrescriptionHistory, activeTab]);

  // Expose refresh function to parent
  useEffect(() => {
    if (onRefresh) {
      onRefresh.current = () => {
        fetchActivePrescriptions();
        fetchPrescriptionHistory();
      };
    }
    // Also expose globally for layout refresh
    window.refreshPrescriptions = () => {
      fetchActivePrescriptions();
      fetchPrescriptionHistory();
    };
    
    return () => {
      window.refreshPrescriptions = null;
    };
  }, [fetchActivePrescriptions, fetchPrescriptionHistory, onRefresh]);

  // Pagination for history
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(prescriptionHistory.length / recordsPerPage);
    const startIndex = (currentPage - 1) * recordsPerPage;
    const paginatedHistory = prescriptionHistory.slice(startIndex, startIndex + recordsPerPage);
    
    return {
      totalPages,
      startIndex,
      paginatedHistory
    };
  }, [prescriptionHistory, currentPage, recordsPerPage]);

  const { totalPages, startIndex, paginatedHistory } = paginationData;

  // Format date
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  // Get status badge
  const getStatusBadge = useCallback((status) => {
    let badgeClass = 'status-badge ';
    let icon = '';
    let text = '';

    switch (status?.toLowerCase()) {
      case 'active':
      case 'current':
        badgeClass += 'active';
        icon = 'bi-clock';
        text = 'Active';
        break;
      case 'completed':
      case 'finished':
        badgeClass += 'completed';
        icon = 'bi-check-circle';
        text = 'Completed';
        break;
      default:
        badgeClass += 'pending';
        icon = 'bi-hourglass-split';
        text = 'Ongoing';
    }

    return (
      <span className={badgeClass}>
        <i className={`bi ${icon}`}></i>
        {text}
      </span>
    );
  }, []);

  if (loading) {
    return (
      <div className="patient-treatment-records">
        <div className="loading-container">
          <div className="spinner-border text-danger" role="status">
            <span className="visually-hidden">Loading prescriptions...</span>
          </div>
          <p className="loading-text">Loading your prescriptions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="patient-treatment-records">
        <div className="error-container">
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle"></i>
            <strong>Unable to Load Prescriptions</strong>
            <p>{error}</p>
            <button 
              className="btn btn-outline-danger btn-sm mt-2" 
              onClick={fetchActivePrescriptions}
            >
              <i className="bi bi-arrow-clockwise"></i>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-treatment-records">
      {/* Patient Info Panel */}
      <div className="patient-info-panel">
        <div className="patient-info-content">
          <div className="patient-details">
            <h2 className="patient-name">
              {user?.firstName} {user?.lastName}
            </h2>
            <div className="patient-metadata">
              <span className="metadata-item">
                <i className="bi bi-person-badge"></i>
                <strong>Patient ID:</strong> PT-{String(user?.patientId || '0000').padStart(4, '0')}
              </span>
              <span className="metadata-item">
                <i className="bi bi-calendar3"></i>
                <strong>Today:</strong> {new Date().toLocaleDateString()}
              </span>
              <span className="metadata-item">
                <i className="bi bi-prescription2"></i>
                <strong>Active Prescriptions:</strong> {activePrescriptions.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="records-tabs">
        <button 
          className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          <i className="bi bi-clock"></i>
          Active Prescriptions ({activePrescriptions.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('history');
            if (prescriptionHistory.length === 0) {
              fetchPrescriptionHistory();
            }
          }}
        >
          <i className="bi bi-file-medical"></i>
          Prescription History ({prescriptionHistory.length})
        </button>
      </div>

      {/* Content Area */}
      <div className="records-content">
        {/* Active Prescriptions */}
        {activeTab === 'active' && (
          <div className="prescriptions-section">
            <div className="section-header">
              <div className="section-title">
                <i className="bi bi-prescription2"></i>
                <h3>Active Prescriptions</h3>
                <span className="record-count">{activePrescriptions.length} prescription{activePrescriptions.length !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {activePrescriptions.length > 0 ? (
              <div className="prescriptions-grid">
                {activePrescriptions.map((prescription, index) => (
                  <div key={prescription.id || index} className="prescription-card enhanced">
                    <div className="prescription-header">
                      <div className="medication-info">
                        <h4 className="medication-name">{prescription.medication}</h4>
                        {prescription.genericName && (
                          <p className="generic-name">Generic: {prescription.genericName}</p>
                        )}
                        <div className="dosage-info">
                          <span className="dosage">{prescription.dosage}</span>
                          {prescription.form && <span className="form"> • {prescription.form}</span>}
                        </div>
                      </div>
                      <div className="prescription-status">
                        {getStatusBadge(prescription.status)}
                        <small className="prescription-date">
                          Prescribed: {formatDate(prescription.prescriptionDate)}
                        </small>
                      </div>
                    </div>

                    <div className="prescription-details">
                      <div className="detail-grid">
                        <div className="detail-item">
                          <i className="bi bi-clock"></i>
                          <div>
                            <span className="detail-label">Frequency</span>
                            <span className="detail-value">{prescription.frequency || 'As directed'}</span>
                          </div>
                        </div>
                        <div className="detail-item">
                          <i className="bi bi-calendar-range"></i>
                          <div>
                            <span className="detail-label">Duration</span>
                            <span className="detail-value">{prescription.duration || 'Ongoing'}</span>
                          </div>
                        </div>
                        <div className="detail-item">
                          <i className="bi bi-capsule"></i>
                          <div>
                            <span className="detail-label">Quantity</span>
                            <span className="detail-value">{prescription.quantity} units</span>
                          </div>
                        </div>
                        <div className="detail-item">
                          <i className="bi bi-person-badge"></i>
                          <div>
                            <span className="detail-label">Prescribed by</span>
                            <span className="detail-value">{prescription.doctorName}</span>
                          </div>
                        </div>
                      </div>

                      {prescription.instructions && (
                        <div className="instructions-section">
                          <i className="bi bi-info-circle"></i>
                          <div>
                            <span className="detail-label">Instructions</span>
                            <p className="instructions-text">{prescription.instructions}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-records">
                <i className="bi bi-prescription2"></i>
                <h4>No Active Prescriptions</h4>
                <p>You don't have any active prescriptions at the moment.</p>
              </div>
            )}
          </div>
        )}

        {/* Prescription History */}
        {activeTab === 'history' && (
          <div className="prescriptions-section">
            <div className="section-header">
              <div className="section-title">
                <i className="bi bi-file-medical"></i>
                <h3>Prescription History</h3>
                <span className="record-count">{prescriptionHistory.length} total prescription{prescriptionHistory.length !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {prescriptionHistory.length > 0 ? (
              <>
                <div className="prescriptions-grid">
                  {paginatedHistory.map((prescription, index) => (
                    <div key={prescription.id || index} className="prescription-card enhanced">
                      <div className="prescription-header">
                        <div className="medication-info">
                          <h4 className="medication-name">{prescription.medication}</h4>
                          {prescription.genericName && (
                            <p className="generic-name">Generic: {prescription.genericName}</p>
                          )}
                          <div className="dosage-info">
                            <span className="dosage">{prescription.dosage}</span>
                            {prescription.form && <span className="form"> • {prescription.form}</span>}
                          </div>
                        </div>
                        <div className="prescription-status">
                          {getStatusBadge(prescription.status)}
                          <small className="prescription-date">
                            Prescribed: {formatDate(prescription.prescriptionDate)}
                          </small>
                        </div>
                      </div>

                      <div className="prescription-details">
                        <div className="detail-grid">
                          <div className="detail-item">
                            <i className="bi bi-clock"></i>
                            <div>
                              <span className="detail-label">Frequency</span>
                              <span className="detail-value">{prescription.frequency || 'As directed'}</span>
                            </div>
                          </div>
                          <div className="detail-item">
                            <i className="bi bi-calendar-range"></i>
                            <div>
                              <span className="detail-label">Duration</span>
                              <span className="detail-value">{prescription.duration || 'Ongoing'}</span>
                            </div>
                          </div>
                          <div className="detail-item">
                            <i className="bi bi-capsule"></i>
                            <div>
                              <span className="detail-label">Quantity</span>
                              <span className="detail-value">{prescription.quantity} units</span>
                            </div>
                          </div>
                          <div className="detail-item">
                            <i className="bi bi-person-badge"></i>
                            <div>
                              <span className="detail-label">Prescribed by</span>
                              <span className="detail-value">{prescription.doctorName}</span>
                            </div>
                          </div>
                        </div>

                        {prescription.instructions && (
                          <div className="instructions-section">
                            <i className="bi bi-info-circle"></i>
                            <div>
                              <span className="detail-label">Instructions</span>
                              <p className="instructions-text">{prescription.instructions}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination for History */}
                {totalPages > 1 && (
                  <div className="pagination-container">
                    <nav aria-label="Prescription history pagination">
                      <ul className="pagination justify-content-center">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                          >
                            First
                          </button>
                        </li>
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </button>
                        </li>
                        
                        {/* Page numbers */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = Math.max(1, currentPage - 2) + i;
                          if (pageNum <= totalPages) {
                            return (
                              <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                                <button 
                                  className="page-link" 
                                  onClick={() => setCurrentPage(pageNum)}
                                >
                                  {pageNum}
                                </button>
                              </li>
                            );
                          }
                          return null;
                        })}
                        
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </button>
                        </li>
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                          >
                            Last
                          </button>
                        </li>
                      </ul>
                    </nav>
                    <div className="pagination-info">
                      Showing {startIndex + 1} to {Math.min(startIndex + recordsPerPage, prescriptionHistory.length)} of {prescriptionHistory.length} prescriptions
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="no-records">
                <i className="bi bi-file-medical"></i>
                <h4>No Prescription History</h4>
                <p>You don't have any prescription history yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

PatientPrescriptions.propTypes = {
  onRefresh: PropTypes.shape({
    current: PropTypes.func
  })
};

export default PatientPrescriptions;
