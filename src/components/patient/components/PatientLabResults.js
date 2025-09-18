import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import PropTypes from 'prop-types';
import './PatientMedicalRecords.css'; // Reuse the existing styles

const PatientLabResults = ({ onRefresh }) => {
  // State management
  const { user } = useAuth();
  const [labReferrals, setLabReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 5;

  // Optimized data fetching with useCallback to prevent unnecessary re-renders
  const fetchLabReferrals = useCallback(async () => {
    if (!user?.patientId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get token from sessionStorage authData (consistent with auth system)
      let token = null;
      try {
        const authData = sessionStorage.getItem('authData');
        if (authData) {
          const parsed = JSON.parse(authData);
          token = parsed?.token;
        }
      } catch (error) {
        console.error('Error parsing authData:', error);
      }

      const response = await fetch(`http://localhost:5000/api/lab-referrals/patient/${user.patientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const referrals = await response.json();
        // Sort by most recent first
        const sortedReferrals = referrals.sort((a, b) => 
          new Date(b.createdAt || b.referralDate) - new Date(a.createdAt || a.referralDate)
        );
        setLabReferrals(sortedReferrals);
      } else if (response.status === 404) {
        // No referrals found - this is normal
        setLabReferrals([]);
      } else {
        throw new Error('Failed to fetch lab referrals');
      }
    } catch (error) {
      console.error('Error fetching lab referrals:', error);
      setError('Unable to load lab referrals');
      setLabReferrals([]);
    } finally {
      setLoading(false);
    }
  }, [user?.patientId]);

  // Fetch data on component mount and when user changes
  useEffect(() => {
    fetchLabReferrals();
  }, [fetchLabReferrals]);

  // Expose refresh function to parent
  useEffect(() => {
    if (onRefresh) {
      onRefresh.current = fetchLabReferrals;
    }
    // Also expose globally for layout refresh
    window.refreshLabResults = fetchLabReferrals;
    
    return () => {
      window.refreshLabResults = null;
    };
  }, [fetchLabReferrals, onRefresh]);

  // Memoized pagination calculations for performance
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(labReferrals.length / recordsPerPage);
    const startIndex = (currentPage - 1) * recordsPerPage;
    const paginatedReferrals = labReferrals.slice(startIndex, startIndex + recordsPerPage);
    
    return {
      totalPages,
      startIndex,
      paginatedReferrals
    };
  }, [labReferrals, currentPage, recordsPerPage]);

  const { totalPages, startIndex, paginatedReferrals } = paginationData;

  // Optimized date formatting with memoization
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  const formatTime = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Status badge component with memoization
  const getStatusBadge = useCallback((status, hasResults) => {
    let badgeClass = 'status-badge ';
    let icon = '';
    let text = '';

    if (hasResults) {
      badgeClass += 'completed';
      icon = 'bi-check-circle';
      text = 'Results Available';
    } else {
      switch (status?.toLowerCase()) {
        case 'completed':
        case 'sent':
          badgeClass += 'pending';
          icon = 'bi-clock';
          text = 'Pending Results';
          break;
        case 'cancelled':
          badgeClass += 'cancelled';
          icon = 'bi-x-circle';
          text = 'Cancelled';
          break;
        default:
          badgeClass += 'pending';
          icon = 'bi-hourglass-split';
          text = 'Processing';
      }
    }

    return (
      <span className={badgeClass}>
        <i className={`bi ${icon}`}></i>
        {text}
      </span>
    );
  }, []);

  // Mock data for demonstration (remove this when backend is ready)
  const mockLabReferrals = useMemo(() => [
    {
      id: 1,
      referralDate: '2025-09-07T10:30:00.000Z',
      referralType: 'laboratory',
      facility: 'Philippine General Hospital',
      department: 'Clinical Laboratory',
      reason: 'Complete Blood Count and Urinalysis for routine health checkup',
      clinicalHistory: 'Annual physical examination. Patient reports no symptoms.',
      testTypes: ['Complete Blood Count (CBC)', 'Urinalysis', 'Blood Chemistry'],
      urgency: 'routine',
      status: 'sent',
      hasResults: true,
      resultsDate: '2025-09-08T14:00:00.000Z',
      referringDoctor: 'Dr. John Smith'
    },
    {
      id: 2,
      referralDate: '2025-09-05T15:45:00.000Z',
      referralType: 'laboratory',
      facility: 'Makati Medical Center',
      department: 'Laboratory Services',
      reason: 'Lipid profile and blood glucose monitoring',
      clinicalHistory: 'Follow-up for hypertension management.',
      testTypes: ['Lipid Profile', 'Fasting Blood Glucose', 'HbA1c'],
      urgency: 'routine',
      status: 'pending',
      hasResults: false,
      referringDoctor: 'Dr. John Smith'
    }
  ], []);

  // Use mock data if no real data (for demonstration)
  const displayReferrals = labReferrals.length > 0 ? labReferrals : mockLabReferrals;
  const displayPaginated = labReferrals.length > 0 ? paginatedReferrals : mockLabReferrals.slice(startIndex, startIndex + recordsPerPage);

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
                <i className="bi bi-clipboard-data"></i>
                <strong>Total Lab Referrals:</strong> {displayReferrals.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="records-content">
        <div className="content-header">
          <h3 className="section-title">
            <i className="bi bi-clipboard-data"></i>
            Laboratory Referrals & Results
          </h3>
          <p className="section-description">
            View your laboratory test referrals, track test status, and access your results when available.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner">
              <div className="spinner-border text-danger" role="status">
                <span className="visually-hidden">Loading lab referrals...</span>
              </div>
              <p className="loading-text">Loading your lab referrals...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-container">
            <div className="error-content">
              <i className="bi bi-exclamation-triangle error-icon"></i>
              <h3 className="error-title">Unable to Load Lab Referrals</h3>
              <p className="error-description">{error}</p>
              <button 
                className="btn btn-outline-danger"
                onClick={fetchLabReferrals}
              >
                <i className="bi bi-arrow-clockwise"></i>
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* No Referrals State */}
        {!loading && !error && displayReferrals.length === 0 && (
          <div className="no-records-container">
            <div className="no-records-content">
              <i className="bi bi-clipboard-data no-records-icon"></i>
              <h3 className="no-records-title">No Lab Referrals Found</h3>
              <p className="no-records-description">
                You have no laboratory referrals in the system yet.
              </p>
              <div className="no-records-help">
                <p><strong>Lab referrals will appear here when:</strong></p>
                <ul>
                  <li>Your doctor orders laboratory tests</li>
                  <li>You need routine health screenings</li>
                  <li>Follow-up tests are required</li>
                </ul>
                <div className="help-note">
                  <i className="bi bi-info-circle"></i>
                  <span>Your doctor will issue lab referrals during consultations when tests are needed.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lab Referrals Accordion */}
        {!loading && !error && displayReferrals.length > 0 && (
          <>
            {/* Pagination Controls - Top */}
            {totalPages > 1 && (
              <div className="pagination-controls top">
                <div className="pagination-info">
                  <span>Showing {startIndex + 1}-{Math.min(startIndex + recordsPerPage, displayReferrals.length)} of {displayReferrals.length} referrals</span>
                </div>
                <div className="pagination-buttons">
                  <button 
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <i className="bi bi-chevron-left"></i>
                    Previous
                  </button>
                  <span className="page-info">Page {currentPage} of {totalPages}</span>
                  <button 
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>
            )}

            <div className="treatment-records-accordion">
              <div className="accordion" id="labReferralsAccordion">
                {displayPaginated.map((referral, index) => {
                  const referralNumber = startIndex + index + 1;
                  const referralDate = formatDate(referral.referralDate || referral.createdAt);
                  const referralTime = formatTime(referral.referralDate || referral.createdAt);
                  const accordionId = `referral-${referral.id}`;
                  
                  return (
                    <div key={referral.id} className="accordion-item treatment-record-item">
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
                                <span className="record-number">#{referralNumber}</span>
                                {getStatusBadge(referral.status, referral.hasResults)}
                                <span className="service-type">
                                  <i className="bi bi-clipboard-data"></i>
                                  Laboratory Tests
                                </span>
                              </div>
                              <div className="date-info">
                                <span className="record-date">
                                  <i className="bi bi-calendar3"></i>
                                  {referralDate}
                                </span>
                                <span className="record-time">
                                  <i className="bi bi-clock"></i>
                                  {referralTime}
                                </span>
                              </div>
                            </div>
                            <div className="doctor-preview">
                              <i className="bi bi-hospital"></i>
                              <span>{referral.facility}</span>
                            </div>
                          </div>
                        </button>
                      </h2>

                      {/* Accordion Content */}
                      <div 
                        id={`collapse-${accordionId}`}
                        className="accordion-collapse collapse"
                        aria-labelledby={`heading-${accordionId}`}
                        data-bs-parent="#labReferralsAccordion"
                      >
                        <div className="accordion-body">
                          <div className="record-content">
                            {/* Referral Information */}
                            <div className="clinical-sections">
                              <div className="clinical-section">
                                <h6 className="section-title">
                                  <i className="bi bi-hospital"></i>
                                  Referral Information
                                </h6>
                                
                                <div className="content-item">
                                  <label className="content-label">Healthcare Facility</label>
                                  <div className="content-display">
                                    {referral.facility || 'Not specified'}
                                  </div>
                                </div>

                                <div className="content-item">
                                  <label className="content-label">Department</label>
                                  <div className="content-display">
                                    {referral.department || 'Laboratory Services'}
                                  </div>
                                </div>

                                <div className="content-item">
                                  <label className="content-label">Referring Doctor</label>
                                  <div className="content-display">
                                    {referral.referringDoctor || 'Not specified'}
                                  </div>
                                </div>

                                <div className="content-item">
                                  <label className="content-label">Urgency Level</label>
                                  <div className="content-display">
                                    <span className={`urgency-badge ${referral.urgency || 'routine'}`}>
                                      {(referral.urgency || 'routine').charAt(0).toUpperCase() + (referral.urgency || 'routine').slice(1)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="clinical-section">
                                <h6 className="section-title">
                                  <i className="bi bi-clipboard-medical"></i>
                                  Clinical Details
                                </h6>
                                
                                <div className="content-item">
                                  <label className="content-label">Reason for Referral</label>
                                  <div className="content-display">
                                    {referral.reason || 'No reason specified'}
                                  </div>
                                </div>

                                <div className="content-item">
                                  <label className="content-label">Clinical History</label>
                                  <div className="content-display">
                                    {referral.clinicalHistory || 'No clinical history provided'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Tests Requested */}
                            <div className="prescriptions-section">
                              <h6 className="section-title">
                                <i className="bi bi-clipboard-check"></i>
                                Tests Requested
                                {(referral.testTypes || []).length > 0 && (
                                  <span className="prescription-count">{referral.testTypes.length}</span>
                                )}
                              </h6>
                              
                              {(referral.testTypes || []).length > 0 ? (
                                <div className="prescriptions-grid">
                                  {referral.testTypes.map((test, idx) => (
                                    <div key={idx} className="prescription-card">
                                      <div className="prescription-header">
                                        <h6 className="medication-name">{test}</h6>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="no-prescriptions">
                                  <i className="bi bi-clipboard-check"></i>
                                  <p>No specific tests listed in this referral.</p>
                                </div>
                              )}
                            </div>

                            {/* Results Section */}
                            {referral.hasResults ? (
                              <div className="doctor-notes-section">
                                <h6 className="section-title">
                                  <i className="bi bi-file-earmark-medical"></i>
                                  Lab Results Available
                                </h6>
                                <div className="content-display notes">
                                  <div className="results-available">
                                    <i className="bi bi-check-circle-fill text-success"></i>
                                    <span>Results received on {formatDate(referral.resultsDate)}</span>
                                  </div>
                                  <p className="mt-2 text-muted">
                                    Contact your healthcare provider to discuss these results or request a copy.
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="doctor-notes-section">
                                <h6 className="section-title">
                                  <i className="bi bi-hourglass-split"></i>
                                  Results Status
                                </h6>
                                <div className="content-display notes">
                                  <div className="results-pending">
                                    <i className="bi bi-clock text-warning"></i>
                                    <span>Waiting for results from {referral.facility}</span>
                                  </div>
                                  <p className="mt-2 text-muted">
                                    You will be notified when results are available.
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Record Actions */}
                            <div className="record-actions">
                              <button 
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => window.print()}
                                title="Print this referral"
                              >
                                <i className="bi bi-printer"></i>
                                Print Referral
                              </button>
                              {referral.hasResults && (
                                <button 
                                  className="btn btn-danger btn-sm"
                                  title="View results"
                                  onClick={() => alert('Results viewing feature coming soon!')}
                                >
                                  <i className="bi bi-file-earmark-medical"></i>
                                  View Results
                                </button>
                              )}
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
                    className="btn btn-outline-danger"
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
                        className={`btn ${pageNum === currentPage ? 'btn-danger' : 'btn-outline-danger'}`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>
                  <button 
                    className="btn btn-outline-danger"
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

PatientLabResults.propTypes = {
  onRefresh: PropTypes.object
};

export default PatientLabResults;
