import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import './PatientMedicalRecords.css';

const PatientMedicalRecords = ({ onRefresh }) => {
  const { user } = useAuth();
  const [treatmentRecords, setTreatmentRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 4; // Show 4 records per page for better layout

  // Format date and time utilities
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Time';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getPatientFullName = () => {
    if (!user) return 'Unknown Patient';
    return `${user.firstName || ''} ${user.middleName || ''} ${user.lastName || ''}`.replace(/\s+/g, ' ').trim();
  };

  const getPatientAge = () => {
    if (!user?.dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(user.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Fetch treatment records (completed checkups) for the patient
  const fetchTreatmentRecords = async () => {
    if (!user?.patientId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/checkups/history/${user.patientId}`);
      if (response.ok) {
        const records = await response.json();
        // Filter only completed checkups and sort by most recent first
        const completedRecords = records
          .filter(record => record.status === 'completed')
          .sort((a, b) => new Date(b.completedAt || b.updatedAt) - new Date(a.completedAt || a.updatedAt));
        setTreatmentRecords(completedRecords);
      } else {
        console.error('Failed to fetch treatment records');
        setTreatmentRecords([]);
      }
    } catch (error) {
      console.error('Error fetching treatment records:', error);
      setTreatmentRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTreatmentRecords();
    setCurrentPage(1);
  }, [user]);

  // Listen for refresh events from parent (header refresh button)
  useEffect(() => {
    if (onRefresh) {
      // Override the parent refresh to call our specific refresh
      const originalRefresh = onRefresh;
      window.refreshTreatmentRecords = fetchTreatmentRecords;
      
      return () => {
        delete window.refreshTreatmentRecords;
      };
    }
  }, [onRefresh, fetchTreatmentRecords]);

  // Pagination logic
  const totalPages = Math.ceil(treatmentRecords.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const paginatedRecords = treatmentRecords.slice(startIndex, startIndex + recordsPerPage);

  const getStatusBadge = (status) => {
    const statusConfig = {
      'completed': { class: 'completed', icon: 'bi-check-circle-fill', text: 'Completed' },
      'started': { class: 'ongoing', icon: 'bi-clock', text: 'In Progress' },
      'waiting': { class: 'waiting', icon: 'bi-hourglass-split', text: 'Waiting' }
    };
    
    const config = statusConfig[status] || statusConfig['completed'];
    
    return (
      <span className={`status-badge status-${config.class}`}>
        <i className={`bi ${config.icon}`}></i>
        {config.text}
      </span>
    );
  };

  return (
    <div className="patient-treatment-records">
      {/* Patient Information Panel */}
      <div className="patient-info-panel">
        <div className="patient-info-content">
          <div className="patient-details">
            <h2 className="patient-name">{getPatientFullName()}</h2>
            <div className="patient-metadata">
              <div className="metadata-item">
                <i className="bi bi-person-badge"></i>
                <span><strong>Patient ID:</strong> PT-{String(user?.id || '').padStart(4, '0')}</span>
              </div>
              <div className="metadata-item">
                <i className="bi bi-calendar-heart"></i>
                <span><strong>Age:</strong> {getPatientAge()} years old</span>
              </div>
              <div className="metadata-item">
                <i className="bi bi-clipboard-data"></i>
                <span><strong>Total Records:</strong> {treatmentRecords.length}</span>
              </div>
              <div className="metadata-item">
                <i className="bi bi-shield-check"></i>
                <span><strong>Account:</strong> Patient Portal</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="records-content">
        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading treatment records...</span>
              </div>
              <p className="loading-text">Loading your treatment records...</p>
            </div>
          </div>
        )}

        {/* No Records State */}
        {!loading && treatmentRecords.length === 0 && (
          <div className="no-records-container">
            <div className="no-records-content">
              <i className="bi bi-clipboard-x no-records-icon"></i>
              <h3 className="no-records-title">No Treatment Records Found</h3>
              <p className="no-records-description">
                You have no completed treatment records in the system.
              </p>
              <div className="no-records-help">
                <p><strong>Treatment records will appear here after:</strong></p>
                <ul>
                  <li>Completing a doctor's checkup</li>
                  <li>Finishing a medical consultation</li>
                  <li>Receiving prescribed treatments</li>
                </ul>
                <div className="help-note">
                  <i className="bi bi-info-circle"></i>
                  <span>Once you complete your first checkup with a doctor, your treatment history will be displayed here with all medical details.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Treatment Records */}
        {!loading && treatmentRecords.length > 0 && (
          <>
            {/* Pagination Controls - Top */}
            {totalPages > 1 && (
              <div className="pagination-controls top">
                <div className="pagination-info">
                  <span>Showing {startIndex + 1}-{Math.min(startIndex + recordsPerPage, treatmentRecords.length)} of {treatmentRecords.length} records</span>
                </div>
                <div className="pagination-buttons">
                  <button 
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <i className="bi bi-chevron-left"></i>
                    Previous
                  </button>
                  <span className="page-indicator">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button 
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>
            )}

            {/* Records Grid */}
            <div className="treatment-records-accordion">
              <div className="accordion" id="treatmentRecordsAccordion">
                {paginatedRecords.map((record, index) => {
                  const recordNumber = startIndex + index + 1;
                  const recordDate = formatDate(record.completedAt || record.updatedAt);
                  const recordTime = formatTime(record.completedAt || record.updatedAt);
                  const serviceType = record.serviceType || 'General Checkup';
                  const accordionId = `record-${record.id}`;
                  const isFirstRecord = false; // All accordions closed by default
                  
                  return (
                    <div key={record.id} className="accordion-item treatment-record-item">
                      {/* Accordion Header */}
                      <h2 className="accordion-header" id={`heading-${accordionId}`}>
                        <button 
                          className="accordion-button collapsed"
                          type="button" 
                          data-bs-toggle="collapse" 
                          data-bs-target={`#collapse-${accordionId}`}
                          aria-expanded="false"
                          aria-controls={`collapse-${accordionId}`}
                        >
                          <div className="accordion-title-content">
                            <div className="title-main">
                              <div className="record-info">
                                <span className="record-number">#{recordNumber}</span>
                                {getStatusBadge(record.status)}
                                <span className="service-type">
                                  <i className="bi bi-hospital"></i>
                                  {serviceType}
                                </span>
                              </div>
                              <div className="date-info">
                                <span className="record-date">
                                  <i className="bi bi-calendar3"></i>
                                  {recordDate}
                                </span>
                                <span className="record-time">
                                  <i className="bi bi-clock"></i>
                                  {recordTime}
                                </span>
                              </div>
                            </div>
                            {record.assignedDoctor && (
                              <div className="doctor-preview">
                                <i className="bi bi-person-circle"></i>
                                <span>Dr. {record.assignedDoctor}</span>
                              </div>
                            )}
                          </div>
                        </button>
                      </h2>

                      {/* Accordion Content */}
                      <div 
                        id={`collapse-${accordionId}`}
                        className="accordion-collapse collapse"
                        aria-labelledby={`heading-${accordionId}`}
                        data-bs-parent="#treatmentRecordsAccordion"
                      >
                        <div className="accordion-body">
                          {/* Record Content */}
                          <div className="record-content">
                            {/* Clinical Information Row */}
                            <div className="clinical-sections">
                              <div className="clinical-section">
                                <h6 className="section-title">
                                  <i className="bi bi-chat-square-text"></i>
                                  Chief Complaint & History
                                </h6>
                                
                                <div className="content-item">
                                  <label className="content-label">Chief Complaint</label>
                                  <div className="content-display">
                                    {record.chiefComplaint || 'No chief complaint recorded.'}
                                  </div>
                                </div>

                                <div className="content-item">
                                  <label className="content-label">Present Symptoms</label>
                                  <div className="content-display">
                                    {record.presentSymptoms || 'No symptoms recorded.'}
                                  </div>
                                </div>
                              </div>

                              <div className="clinical-section">
                                <h6 className="section-title">
                                  <i className="bi bi-clipboard-plus"></i>
                                  Diagnosis & Treatment
                                </h6>
                                
                                <div className="content-item">
                                  <label className="content-label">Diagnosis Notes</label>
                                  <div className="content-display">
                                    {record.diagnosis || 'No diagnosis recorded.'}
                                  </div>
                                </div>

                                <div className="content-item">
                                  <label className="content-label">Treatment Plan</label>
                                  <div className="content-display">
                                    {record.treatmentPlan || 'No treatment plan recorded.'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Prescriptions Section */}
                            <div className="prescriptions-section">
                              <h6 className="section-title">
                                <i className="bi bi-prescription2"></i>
                                Prescriptions
                                {(record.prescriptions || []).length > 0 && (
                                  <span className="prescription-count">{record.prescriptions.length}</span>
                                )}
                              </h6>
                              
                              {(record.prescriptions || []).length > 0 ? (
                                <div className="prescriptions-grid">
                                  {record.prescriptions.map((prescription, idx) => (
                                    <div key={idx} className="prescription-card">
                                      <div className="prescription-header">
                                        <h6 className="medication-name">{prescription.medication}</h6>
                                        {prescription.genericName && (
                                          <small className="generic-name">Generic: {prescription.genericName}</small>
                                        )}
                                      </div>
                                      <div className="prescription-details">
                                        <div className="detail-row">
                                          <div className="detail-item">
                                            <span className="detail-label">Quantity:</span>
                                            <span className="detail-value">{prescription.quantity}</span>
                                          </div>
                                          <div className="detail-item">
                                            <span className="detail-label">Instructions:</span>
                                            <span className="detail-value">{prescription.instructions}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="no-prescriptions">
                                  <i className="bi bi-prescription2"></i>
                                  <p>No prescriptions were prescribed for this treatment.</p>
                                </div>
                              )}
                            </div>

                            {/* Doctor's Notes Section */}
                            {record.doctorNotes && (
                              <div className="doctor-notes-section">
                                <h6 className="section-title">
                                  <i className="bi bi-journal-medical"></i>
                                  Doctor's Additional Notes
                                </h6>
                                <div className="content-display notes">
                                  {record.doctorNotes}
                                </div>
                              </div>
                            )}

                            {/* Record Actions */}
                            <div className="record-actions">
                              <button 
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => window.print()}
                                title="Print this treatment record"
                              >
                                <i className="bi bi-printer"></i>
                                Print Record
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pagination Controls - Bottom */}
            {totalPages > 1 && (
              <div className="pagination-controls bottom">
                <div className="pagination-buttons">
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <i className="bi bi-chevron-left"></i>
                    Previous
                  </button>
                  <div className="page-numbers">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                      <button
                        key={pageNum}
                        className={`btn ${pageNum === currentPage ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PatientMedicalRecords;
