import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import sealMainImage from '../../images/sealmain.png';
import sealGovImage from '../../images/sealgov.png';
import './styles/ActionModals.css';

const TreatmentRecordModal = ({ show, onHide, selectedPatient, isDarkMode = false }) => {
  const [treatmentRecords, setTreatmentRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [revealedRecords, setRevealedRecords] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 3;

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

  // Fetch treatment records (completed checkups) for the patient
  const fetchTreatmentRecords = async () => {
    if (!selectedPatient?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/checkups/history/${selectedPatient.id}`);
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
    if (show && selectedPatient) {
      fetchTreatmentRecords();
      setRevealedRecords(new Set());
      setCurrentPage(1);
    }
  }, [show, selectedPatient]);

  const handleRevealRecord = (recordId) => {
    setRevealedRecords(prev => {
      const newSet = new Set(prev);
      newSet.add(recordId);
      return newSet;
    });
  };

  // Pagination logic
  const totalPages = Math.ceil(treatmentRecords.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const paginatedRecords = treatmentRecords.slice(startIndex, startIndex + recordsPerPage);

  // Print individual treatment record
  const handlePrintRecord = (record) => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to print treatment records');
        return;
      }

      const patientName = getPatientFullName(selectedPatient);
      const patientAge = getPatientAge(selectedPatient);
      const patientID = selectedPatient?.patientId || selectedPatient?.id || 'N/A';

      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Treatment Record - ${patientName}</title>
          <style>
            @media print {
              @page {
                size: letter;
                margin: 10mm 12mm;
                margin-header: 0;
                margin-footer: 0;
              }
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .clinical-section {
                margin-bottom: 8px;
              }
            }

            body { 
              font-family: 'Arial', sans-serif; 
              margin: 0;
              padding: 12mm;
              color: #333;
              line-height: 1.4;
              font-size: 10pt;
            }
            
            /* Compact Government Header */
            .government-header {
              text-align: center;
              padding: 10px 0;
              border-bottom: 2px solid #28a745;
              margin-bottom: 12px;
            }
            
            .government-header-content {
              display: flex;
              align-items: center;
              justify-content: space-between;
              max-width: 750px;
              margin: 0 auto;
              padding: 0 10px;
            }
            
            .government-seal, .barangay-seal {
              width: 50px;
              height: 50px;
              object-fit: contain;
            }
            
            .government-text {
              flex: 1;
              text-align: center;
              padding: 0 12px;
            }
            
            .government-title {
              font-size: 18px;
              font-weight: bold;
              color: #1a472a;
              margin: 0 0 2px 0;
              letter-spacing: 0.5px;
            }
            
            .government-subtitle {
              font-size: 14px;
              font-weight: 600;
              color: #28a745;
              margin: 0 0 2px 0;
            }
            
            .government-tagline {
              font-size: 9px;
              color: #666;
              font-style: italic;
              margin: 0;
            }

            /* Document Title */
            .document-title {
              text-align: center;
              margin: 10px 0 8px 0;
              padding: 6px;
              background: #f8f9fa;
              border-left: 2px solid #28a745;
            }

            .document-title h1 {
              color: #28a745;
              font-size: 16px;
              margin: 0 0 3px 0;
              font-weight: bold;
            }

            .document-date {
              color: #666;
              font-size: 9px;
              margin: 0;
            }

            /* Patient Information */
            .patient-info {
              background: #f8f9fa;
              padding: 8px 10px;
              border-radius: 4px;
              margin-bottom: 10px;
              border: 1px solid #dee2e6;
            }

            .patient-info h3 {
              color: #28a745;
              font-size: 12px;
              margin: 0 0 6px 0;
              padding-bottom: 5px;
              border-bottom: 1px solid #28a745;
            }

            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 5px;
            }

            .info-item {
              display: flex;
              padding: 3px 0;
              font-size: 9.5pt;
            }

            .info-label {
              font-weight: 600;
              color: #495057;
              min-width: 100px;
              font-size: 9.5pt;
            }

            .info-value {
              color: #212529;
              font-size: 9.5pt;
            }

            /* Clinical Section - Simplified without colors */
            .clinical-section {
              margin-bottom: 10px;
              page-break-inside: avoid;
            }

            .section-title {
              font-size: 11px;
              font-weight: bold;
              color: #333;
              padding: 4px 0;
              margin: 0 0 5px 0;
              border-bottom: 1px solid #dee2e6;
            }

            .section-content {
              padding: 6px 8px;
              background: #ffffff;
              border: 1px solid #e9ecef;
              border-radius: 3px;
              min-height: 35px;
              line-height: 1.4;
              font-size: 9.5pt;
            }

            .section-content p {
              margin: 0;
              color: #212529;
            }

            .prescription-list {
              list-style: none;
              padding: 0;
              margin: 5px 0;
            }

            .prescription-item {
              padding: 5px 8px;
              margin: 4px 0;
              background: #f8f9fa;
              border-left: 2px solid #6c757d;
              border-radius: 2px;
              font-size: 9.5pt;
            }

            .prescription-name {
              font-weight: 600;
              color: #495057;
              font-size: 9.5pt;
            }

            /* Footer */
            .document-footer {
              margin-top: 10px;
              padding-top: 6px;
              border-top: 1px solid #dee2e6;
              text-align: center;
              page-break-inside: avoid;
            }

            .print-info {
              font-size: 8px;
              color: #999;
              line-height: 1.3;
            }
          </style>
        </head>
        <body>
          <!-- Compact Government Header -->
          <div class="government-header">
            <div class="government-header-content">
              <div class="government-seal-container">
                <img src="${sealGovImage}" alt="Government Seal" class="government-seal" />
              </div>
              <div class="government-text">
                <h1 class="government-title">BARANGAY MAYBUNGA</h1>
                <h2 class="government-subtitle">HEALTHCARE MANAGEMENT SYSTEM</h2>
                <p class="government-tagline">Digital Health Services for the Community</p>
              </div>
              <div class="barangay-seal-container">
                <img src="${sealMainImage}" alt="Barangay Maybunga Seal" class="barangay-seal" />
              </div>
            </div>
          </div>

          <!-- Document Title -->
          <div class="document-title">
            <h1>📋 Treatment Record</h1>
            <div class="document-date">
              ${formatDate(record.completedAt || record.updatedAt)} at ${formatTime(record.completedAt || record.updatedAt)}
            </div>
          </div>

          <!-- Patient Information -->
          <div class="patient-info">
            <h3>👤 Patient Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Full Name:</span>
                <span class="info-value">${patientName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Patient ID:</span>
                <span class="info-value">${patientID}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Age:</span>
                <span class="info-value">${patientAge} years old</span>
              </div>
              <div class="info-item">
                <span class="info-label">Gender:</span>
                <span class="info-value">${selectedPatient?.gender || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Doctor:</span>
                <span class="info-value">${record.assignedDoctor || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Service Type:</span>
                <span class="info-value">${record.serviceType || 'General Checkup'}</span>
              </div>
            </div>
          </div>

          <!-- Chief Complaint -->
          <div class="clinical-section">
            <div class="section-title">Chief Complaint</div>
            <div class="section-content">
              <p>${record.chiefComplaint || 'No chief complaint recorded.'}</p>
            </div>
          </div>

          <!-- Present Symptoms -->
          <div class="clinical-section">
            <div class="section-title">Present Symptoms</div>
            <div class="section-content">
              <p>${record.presentSymptoms || 'No symptoms recorded.'}</p>
            </div>
          </div>

          <!-- Diagnosis -->
          <div class="clinical-section">
            <div class="section-title">Diagnosis</div>
            <div class="section-content">
              <p>${record.diagnosis || 'No diagnosis recorded.'}</p>
            </div>
          </div>

          <!-- Treatment Plan -->
          <div class="clinical-section">
            <div class="section-title">Treatment Plan</div>
            <div class="section-content">
              <p>${record.treatmentPlan || 'No treatment plan recorded.'}</p>
            </div>
          </div>

          <!-- Prescription -->
          <div class="clinical-section">
            <div class="section-title">Prescription</div>
            <div class="section-content">
              ${record.prescription && record.prescription !== 'N/A' ? 
                `<ul class="prescription-list">
                  ${record.prescription.split('\n').filter(line => line.trim()).map(line => 
                    `<li class="prescription-item">
                      <div class="prescription-name">${line}</div>
                    </li>`
                  ).join('')}
                </ul>` 
                : '<p>No prescription given.</p>'
              }
            </div>
          </div>

          <!-- Additional Doctor Notes -->
          ${record.doctorNotes ? `
          <div class="clinical-section">
            <div class="section-title">Additional Doctor's Notes</div>
            <div class="section-content">
              <p>${record.doctorNotes}</p>
            </div>
          </div>
          ` : ''}

          <!-- Footer -->
          <div class="document-footer">
            <div class="print-info">
              Document generated on ${new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} at ${new Date().toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              })}
              <br>
              Barangay Maybunga Healthcare Management System | Digital Health Records
            </div>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Wait for images to load before printing
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };

      console.log('Treatment record printed successfully');
    } catch (error) {
      console.error('Error printing treatment record:', error);
      alert('Failed to print treatment record. Please try again.');
    }
  };

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
    <Modal 
      show={show} 
      onHide={onHide}
      dialogClassName="action-modal-wide"
      centered
      className="treatment-record-modal"
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
          <i className="bi bi-clipboard-medical me-2"></i>
          Treatment Records - {getPatientFullName(selectedPatient)}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{
        background: isDarkMode ? '#1e293b' : '#ffffff', 
        color: isDarkMode ? '#e2e8f0' : '#2c3e50',
        padding: '24px',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        {selectedPatient && (
          <>
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
                    <div className="col-md-4">
                      <span style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.9rem'}}>
                        <strong>Patient ID:</strong> PT-{String(selectedPatient.id).padStart(4, '0')}
                      </span>
                    </div>
                    <div className="col-md-4">
                      <span style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.9rem'}}>
                        <strong>Age:</strong> {getPatientAge(selectedPatient)} years old
                      </span>
                    </div>
                    <div className="col-md-4">
                      <span style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.9rem'}}>
                        <strong>Total Records:</strong> {treatmentRecords.length}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 text-end">
                  <div style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.9rem'}}>
                    <div><strong>Accessed:</strong> {formatDate(new Date().toISOString())}</div>
                    <div><strong>Time:</strong> {formatTime(new Date().toISOString())}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading treatment records...</span>
                </div>
                <p className="mt-2">Loading treatment records...</p>
              </div>
            )}

            {/* No Records State */}
            {!loading && treatmentRecords.length === 0 && (
              <div className="text-center py-4">
                <i className="bi bi-clipboard-x" style={{fontSize: '3rem', color: '#6c757d'}}></i>
                <h5 className="mt-3" style={{color: isDarkMode ? '#94a3b8' : '#6c757d'}}>No Treatment Records Found</h5>
                <p style={{color: isDarkMode ? '#94a3b8' : '#6c757d'}}>
                  This patient has no completed treatment records in the system.
                </p>
              </div>
            )}

            {/* Treatment Records */}
            {!loading && treatmentRecords.length > 0 && (
              <>
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.9rem'}}>
                      Showing {startIndex + 1}-{Math.min(startIndex + recordsPerPage, treatmentRecords.length)} of {treatmentRecords.length} records
                    </span>
                    <div>
                      <Button 
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="me-2"
                      >
                        <i className="bi bi-chevron-left"></i>
                      </Button>
                      <span className="mx-2" style={{fontSize: '0.9rem'}}>
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button 
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <i className="bi bi-chevron-right"></i>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Records Grid */}
                <div className="treatment-records-grid">
                  {paginatedRecords.map((record, index) => {
                    const isRevealed = revealedRecords.has(record.id);
                    return (
                      <div 
                        key={record.id} 
                        className="treatment-record-card mb-4"
                        style={{
                          border: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`,
                          borderRadius: '8px',
                          background: isDarkMode ? '#334155' : '#ffffff'
                        }}
                      >
                        {/* Record Header */}
                        <div 
                          className="record-header p-3"
                          style={{
                            background: isDarkMode ? '#1e293b' : '#f8f9fa',
                            borderBottom: `1px solid ${isDarkMode ? '#475569' : '#dee2e6'}`,
                            borderRadius: '8px 8px 0 0'
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <div className="d-flex align-items-center gap-3 mb-2">
                                <span className="record-number badge bg-primary">
                                  #{startIndex + index + 1}
                                </span>
                                {getStatusBadge(record.status)}
                                <span style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.9rem'}}>
                                  Service: {record.serviceType || 'General'}
                                </span>
                              </div>
                              <div className="d-flex gap-4">
                                <span style={{color: isDarkMode ? '#e2e8f0' : '#2c3e50', fontSize: '0.95rem'}}>
                                  <i className="bi bi-calendar3 me-1"></i>
                                  <strong>Date:</strong> {formatDate(record.completedAt || record.updatedAt)}
                                </span>
                                <span style={{color: isDarkMode ? '#e2e8f0' : '#2c3e50', fontSize: '0.95rem'}}>
                                  <i className="bi bi-clock me-1"></i>
                                  <strong>Time:</strong> {formatTime(record.completedAt || record.updatedAt)}
                                </span>
                                {record.assignedDoctor && (
                                  <span style={{color: isDarkMode ? '#e2e8f0' : '#2c3e50', fontSize: '0.95rem'}}>
                                    <i className="bi bi-person-circle me-1"></i>
                                    <strong>Doctor:</strong> {record.assignedDoctor}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Print Button & Read-only indicator */}
                            <div className="d-flex align-items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => handlePrintRecord(record)}
                                style={{
                                  background: '#10b981',
                                  border: 'none',
                                  color: '#ffffff',
                                  padding: '6px 12px'
                                }}
                                title="Print this record"
                              >
                                <i className="bi bi-printer me-1"></i>
                                Print
                              </Button>
                              <span 
                                className="badge"
                                style={{
                                  background: 'rgba(16, 185, 129, 0.1)',
                                  color: '#10b981',
                                  border: '1px solid #10b981'
                                }}
                              >
                                <i className="bi bi-eye-slash me-1"></i>
                                Read-Only
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Record Content - with spoiler/blur functionality */}
                        <div className="record-content p-3 position-relative">
                          {!isRevealed && (
                            <div 
                              className="spoiler-overlay position-absolute w-100 h-100 d-flex align-items-center justify-content-center"
                              style={{
                                background: 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(8px)',
                                zIndex: 10,
                                top: 0,
                                left: 0,
                                borderRadius: '0 0 8px 8px'
                              }}
                            >
                              <Button
                                variant="primary"
                                onClick={() => handleRevealRecord(record.id)}
                                className="spoiler-reveal-btn"
                              >
                                <i className="bi bi-eye me-2"></i>
                                Reveal Treatment Details
                              </Button>
                            </div>
                          )}

                          <div className={`content-sections ${!isRevealed ? 'spoiler-blurred' : ''}`}>
                            {/* Clinical Information Row */}
                            <div className="row mb-3">
                              <div className="col-md-6">
                                <div className="content-section">
                                  <h6 className="section-title mb-3" style={{color: '#10b981', fontWeight: '600'}}>
                                    <i className="bi bi-chat-square-text me-2"></i>
                                    Chief Complaint & History
                                  </h6>
                                  
                                  <div className="content-item mb-3">
                                    <label className="content-label" style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.85rem', fontWeight: '600'}}>
                                      Chief Complaint
                                    </label>
                                    <div 
                                      className="content-display p-2"
                                      style={{
                                        background: isDarkMode ? '#374151' : '#f8f9fa',
                                        border: `1px solid ${isDarkMode ? '#4b5563' : '#dee2e6'}`,
                                        borderRadius: '4px',
                                        color: isDarkMode ? '#e5e7eb' : '#495057',
                                        minHeight: '60px',
                                        fontSize: '0.9rem'
                                      }}
                                    >
                                      {record.chiefComplaint || 'No chief complaint recorded.'}
                                    </div>
                                  </div>

                                  <div className="content-item">
                                    <label className="content-label" style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.85rem', fontWeight: '600'}}>
                                      Present Symptoms
                                    </label>
                                    <div 
                                      className="content-display p-2"
                                      style={{
                                        background: isDarkMode ? '#374151' : '#f8f9fa',
                                        border: `1px solid ${isDarkMode ? '#4b5563' : '#dee2e6'}`,
                                        borderRadius: '4px',
                                        color: isDarkMode ? '#e5e7eb' : '#495057',
                                        minHeight: '60px',
                                        fontSize: '0.9rem'
                                      }}
                                    >
                                      {record.presentSymptoms || 'No symptoms recorded.'}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="col-md-6">
                                <div className="content-section">
                                  <h6 className="section-title mb-3" style={{color: '#10b981', fontWeight: '600'}}>
                                    <i className="bi bi-clipboard-plus me-2"></i>
                                    Diagnosis & Treatment
                                  </h6>
                                  
                                  <div className="content-item mb-3">
                                    <label className="content-label" style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.85rem', fontWeight: '600'}}>
                                      Diagnosis Notes
                                    </label>
                                    <div 
                                      className="content-display p-2"
                                      style={{
                                        background: isDarkMode ? '#374151' : '#f8f9fa',
                                        border: `1px solid ${isDarkMode ? '#4b5563' : '#dee2e6'}`,
                                        borderRadius: '4px',
                                        color: isDarkMode ? '#e5e7eb' : '#495057',
                                        minHeight: '60px',
                                        fontSize: '0.9rem'
                                      }}
                                    >
                                      {record.diagnosis || 'No diagnosis recorded.'}
                                    </div>
                                  </div>

                                  <div className="content-item">
                                    <label className="content-label" style={{color: isDarkMode ? '#94a3b8' : '#6c757d', fontSize: '0.85rem', fontWeight: '600'}}>
                                      Treatment Plan
                                    </label>
                                    <div 
                                      className="content-display p-2"
                                      style={{
                                        background: isDarkMode ? '#374151' : '#f8f9fa',
                                        border: `1px solid ${isDarkMode ? '#4b5563' : '#dee2e6'}`,
                                        borderRadius: '4px',
                                        color: isDarkMode ? '#e5e7eb' : '#495057',
                                        minHeight: '60px',
                                        fontSize: '0.9rem'
                                      }}
                                    >
                                      {record.treatmentPlan || 'No treatment plan recorded.'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Prescriptions Section */}
                            <div className="prescriptions-section mt-4">
                              <h6 className="section-title mb-3" style={{color: '#10b981', fontWeight: '600'}}>
                                <i className="bi bi-prescription2 me-2"></i>
                                Prescriptions
                                {(record.prescriptions || []).length > 0 && (
                                  <span className="badge bg-secondary ms-2">{record.prescriptions.length}</span>
                                )}
                              </h6>
                              
                              {(record.prescriptions || []).length > 0 ? (
                                <div className="prescriptions-grid">
                                  {record.prescriptions.map((prescription, idx) => (
                                    <div 
                                      key={idx} 
                                      className="prescription-card mb-2 p-3"
                                      style={{
                                        background: isDarkMode ? '#374151' : '#f8f9fa',
                                        border: `1px solid ${isDarkMode ? '#4b5563' : '#dee2e6'}`,
                                        borderRadius: '6px'
                                      }}
                                    >
                                      <div className="prescription-header mb-2">
                                        <h6 className="medication-name mb-1" style={{color: isDarkMode ? '#e2e8f0' : '#2c3e50', fontWeight: '600'}}>
                                          {prescription.medication}
                                        </h6>
                                        {prescription.genericName && (
                                          <small style={{color: isDarkMode ? '#94a3b8' : '#6c757d'}}>
                                            Generic: {prescription.genericName}
                                          </small>
                                        )}
                                      </div>
                                      <div className="prescription-details">
                                        <div className="row">
                                          <div className="col-6">
                                            <small style={{color: isDarkMode ? '#94a3b8' : '#6c757d'}}>
                                              <strong>Quantity:</strong> {prescription.quantity}
                                            </small>
                                          </div>
                                          <div className="col-6">
                                            <small style={{color: isDarkMode ? '#94a3b8' : '#6c757d'}}>
                                              <strong>Instructions:</strong> {prescription.instructions}
                                            </small>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div 
                                  className="no-prescriptions text-center py-3"
                                  style={{
                                    background: isDarkMode ? '#374151' : '#f8f9fa',
                                    border: `1px solid ${isDarkMode ? '#4b5563' : '#dee2e6'}`,
                                    borderRadius: '6px',
                                    color: isDarkMode ? '#94a3b8' : '#6c757d'
                                  }}
                                >
                                  <i className="bi bi-prescription2" style={{fontSize: '1.5rem'}}></i>
                                  <p className="mb-0 mt-2">No prescriptions were prescribed for this treatment.</p>
                                </div>
                              )}
                            </div>

                            {/* Doctor's Notes Section */}
                            {record.doctorNotes && (
                              <div className="doctor-notes-section mt-4">
                                <h6 className="section-title mb-3" style={{color: '#10b981', fontWeight: '600'}}>
                                  <i className="bi bi-journal-medical me-2"></i>
                                  Doctor's Additional Notes
                                </h6>
                                <div 
                                  className="content-display p-3"
                                  style={{
                                    background: isDarkMode ? '#374151' : '#f8f9fa',
                                    border: `1px solid ${isDarkMode ? '#4b5563' : '#dee2e6'}`,
                                    borderRadius: '6px',
                                    color: isDarkMode ? '#e5e7eb' : '#495057',
                                    fontSize: '0.9rem'
                                  }}
                                >
                                  {record.doctorNotes}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
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
      </Modal.Footer>
    </Modal>
  );
};

export default TreatmentRecordModal;
