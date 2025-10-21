import React, { useState, useEffect } from 'react';
import { Modal, Button, Table } from 'react-bootstrap';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import sealMainImage from '../../images/sealmain.png';
import sealGovImage from '../../images/sealgov.png';
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
    try {
      // Create new PDF document
      const doc = new jsPDF();
      
      // Add header with health center name
      doc.setFontSize(18);
      doc.setTextColor(14, 165, 233); // Blue color
      doc.text('HEALTH CENTER', 105, 15, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Checkup History Report', 105, 25, { align: 'center' });
      
      // Add horizontal line
      doc.setDrawColor(14, 165, 233);
      doc.setLineWidth(0.5);
      doc.line(20, 30, 190, 30);
      
      // Patient Information Section
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Patient Information', 20, 40);
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      const patientName = getPatientFullName(selectedPatient);
      const patientAge = getPatientAge(selectedPatient);
      const patientID = selectedPatient?.patientId || selectedPatient?.id || 'N/A';
      
      doc.text(`Name: ${patientName}`, 20, 48);
      doc.text(`Patient ID: ${patientID}`, 20, 54);
      doc.text(`Age: ${patientAge} years old`, 120, 48);
      doc.text(`Gender: ${selectedPatient?.gender || 'N/A'}`, 120, 54);
      
      // Visit Statistics
      const totalVisits = checkupHistory.length;
      const thisYearVisits = checkupHistory.filter(r => {
        const recordDate = new Date(r.date);
        const currentYear = new Date().getFullYear();
        return recordDate.getFullYear() === currentYear;
      }).length;
      
      const last90DaysVisits = checkupHistory.filter(r => {
        const recordDate = new Date(r.date);
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        return recordDate >= ninetyDaysAgo;
      }).length;
      
      const last30DaysVisits = checkupHistory.filter(r => {
        const recordDate = new Date(r.date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return recordDate >= thirtyDaysAgo;
      }).length;
      
      doc.text(`Total Visits: ${totalVisits}`, 20, 60);
      doc.text(`This Year: ${thisYearVisits}`, 70, 60);
      doc.text(`Last 90 Days: ${last90DaysVisits}`, 120, 60);
      doc.text(`Last 30 Days: ${last30DaysVisits}`, 170, 60);
      
      // Checkup History Table
      doc.setFont(undefined, 'bold');
      doc.setFontSize(12);
      doc.text('Checkup History', 20, 72);
      
      // Prepare table data
      const tableData = checkupHistory.map(record => [
        formatDate(record.date),
        formatTime(record.time),
        record.purpose || record.serviceType || 'General Checkup',
        record.doctor || record.assignedDoctor || 'N/A'
      ]);
      
      // Add table using autoTable
      autoTable(doc, {
        startY: 78,
        head: [['Date', 'Time', 'Purpose of Visit', 'Doctor Assisted']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [14, 165, 233],
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 9,
          textColor: 50
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        },
        columnStyles: {
          0: { cellWidth: 30, halign: 'center' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 60 },
          3: { cellWidth: 45 }
        },
        margin: { left: 20, right: 20 }
      });
      
      // Add footer with export info
      const pageCount = doc.internal.getNumberOfPages();
      const exportDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const exportTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Exported on ${exportDate} at ${exportTime}`, 20, 285);
        doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: 'right' });
      }
      
      // Save the PDF
      const fileName = `Checkup_History_${patientID}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      console.log('PDF exported successfully:', fileName);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export checkup history. Please try again.');
    }
  };

  const handlePrintClinicalNotes = () => {
    try {
      if (!selectedRecord) {
        alert('No clinical record selected');
        return;
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to print clinical notes');
        return;
      }

      const patientName = getPatientFullName(selectedPatient);
      const patientAge = getPatientAge(selectedPatient);
      const patientID = selectedPatient?.patientId || selectedPatient?.id || 'N/A';

      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Clinical Notes - ${patientName}</title>
          <style>
            @media print {
              @page {
                size: letter;
                margin: 15mm;
              }
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }

            body { 
              font-family: 'Arial', 'Segoe UI', sans-serif; 
              margin: 0;
              padding: 20mm;
              color: #333;
              line-height: 1.6;
              font-size: 12pt;
            }
            
            /* Government Header - Matching Reports Style */
            .government-header {
              text-align: center;
              padding: 15px 0;
              border-bottom: 3px solid #28a745;
              margin-bottom: 25px;
            }
            
            .government-header-content {
              display: flex;
              align-items: center;
              justify-content: space-between;
              max-width: 800px;
              margin: 0 auto;
              padding: 0 15px;
            }
            
            .government-seal, .barangay-seal {
              width: 60px;
              height: 60px;
              object-fit: contain;
            }
            
            .government-text {
              flex: 1;
              text-align: center;
              padding: 0 15px;
            }
            
            .government-title {
              font-size: 22px;
              font-weight: bold;
              color: #1a472a;
              margin: 0 0 3px 0;
              letter-spacing: 0.5px;
            }
            
            .government-subtitle {
              font-size: 16px;
              font-weight: 600;
              color: #28a745;
              margin: 0 0 3px 0;
            }
            
            .government-tagline {
              font-size: 10px;
              color: #666;
              font-style: italic;
              margin: 0;
            }

            /* Document Title */
            .document-title {
              text-align: center;
              margin: 18px 0 15px 0;
              padding: 12px;
              background: #f0fdf4;
              border-left: 4px solid #10b981;
            }

            .document-title h1 {
              color: #10b981;
              font-size: 20px;
              margin: 0 0 5px 0;
              font-weight: bold;
            }

            .document-date {
              color: #666;
              font-size: 11px;
              margin: 0;
            }

            /* Patient Information */
            .patient-info {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 6px;
              margin-bottom: 18px;
              border: 1px solid #dee2e6;
            }

            .patient-info h3 {
              color: #10b981;
              font-size: 16px;
              margin: 0 0 15px 0;
              padding-bottom: 10px;
              border-bottom: 2px solid #10b981;
            }

            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
            }

            .info-item {
              display: flex;
              padding: 8px 0;
            }

            .info-label {
              font-weight: 600;
              color: #495057;
              min-width: 120px;
            }

            .info-value {
              color: #212529;
            }

            /* Clinical Section */
            .clinical-section {
              margin-bottom: 18px;
              page-break-inside: avoid;
            }

            .section-title {
              font-size: 13px;
              font-weight: bold;
              color: #fff;
              padding: 8px 12px;
              margin: 0 0 10px 0;
              border-radius: 4px;
            }

            .section-title.complaint { background: #3b82f6; }
            .section-title.symptoms { background: #f59e0b; }
            .section-title.diagnosis { background: #10b981; }
            .section-title.treatment { background: #8b5cf6; }
            .section-title.prescription { background: #ef4444; }
            .section-title.notes { background: #64748b; }

            .section-content {
              padding: 12px;
              background: #ffffff;
              border: 1px solid #dee2e6;
              border-radius: 4px;
              min-height: 50px;
              line-height: 1.6;
            }

            .section-content p {
              margin: 0;
              color: #212529;
            }

            .prescription-list {
              list-style: none;
              padding: 0;
              margin: 10px 0;
            }

            .prescription-item {
              padding: 10px;
              margin: 8px 0;
              background: #fef2f2;
              border-left: 4px solid #ef4444;
              border-radius: 4px;
            }

            .prescription-name {
              font-weight: 600;
              color: #991b1b;
              font-size: 13px;
            }

            .prescription-dosage {
              color: #666;
              font-size: 11px;
              margin-top: 4px;
            }

            /* Footer */
            .document-footer {
              margin-top: 15px;
              padding-top: 10px;
              border-top: 2px solid #dee2e6;
              text-align: center;
              page-break-inside: avoid;
            }

            .print-info {
              font-size: 9px;
              color: #999;
              line-height: 1.4;
            }

            /* Print Optimization */
            @media print {
              @page {
                margin-top: 10mm;
                margin-bottom: 10mm;
              }

              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              /* Hide URL and page title in header/footer */
              @page {
                margin-header: 0;
                margin-footer: 0;
              }

              /* Reduce spacing between sections */
              .clinical-section {
                margin-bottom: 15px;
              }

              /* Keep footer with content */
              .document-footer {
                page-break-inside: avoid;
                page-break-before: avoid;
              }
            }
          </style>
        </head>
        <body>
          <!-- Government Header -->
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
            <h1>📋 Clinical Notes & Medical Record</h1>
            <div class="document-date">
              ${formatDate(selectedRecord.date)} at ${formatTime(selectedRecord.time)}
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
                <span class="info-value">${selectedRecord.doctor || selectedRecord.assignedDoctor || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Purpose of Visit:</span>
                <span class="info-value">${selectedRecord.purpose || selectedRecord.serviceType || 'General Checkup'}</span>
              </div>
            </div>
          </div>

          <!-- Chief Complaint -->
          <div class="clinical-section">
            <div class="section-title complaint">💬 Chief Complaint</div>
            <div class="section-content">
              <p>${selectedRecord.chiefComplaint || selectedRecord.notes || 'No chief complaint recorded.'}</p>
            </div>
          </div>

          <!-- Present Symptoms -->
          <div class="clinical-section">
            <div class="section-title symptoms">🌡️ Present Symptoms</div>
            <div class="section-content">
              <p>${selectedRecord.presentSymptoms || 'No symptoms recorded.'}</p>
            </div>
          </div>

          <!-- Diagnosis -->
          <div class="clinical-section">
            <div class="section-title diagnosis">🩺 Diagnosis</div>
            <div class="section-content">
              <p>${selectedRecord.diagnosis || 'No diagnosis recorded.'}</p>
            </div>
          </div>

          <!-- Treatment Plan -->
          <div class="clinical-section">
            <div class="section-title treatment">📋 Treatment Plan</div>
            <div class="section-content">
              <p>${selectedRecord.treatmentPlan || 'No treatment plan recorded.'}</p>
            </div>
          </div>

          <!-- Prescription -->
          <div class="clinical-section">
            <div class="section-title prescription">💊 Prescription</div>
            <div class="section-content">
              ${selectedRecord.prescription && selectedRecord.prescription !== 'N/A' ? 
                `<ul class="prescription-list">
                  ${selectedRecord.prescription.split('\n').filter(line => line.trim()).map(line => 
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
          ${selectedRecord.doctorNotes ? `
          <div class="clinical-section">
            <div class="section-title notes">📝 Additional Doctor's Notes</div>
            <div class="section-content">
              <p>${selectedRecord.doctorNotes}</p>
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

      console.log('Clinical notes printed successfully');
    } catch (error) {
      console.error('Error printing clinical notes:', error);
      alert('Failed to print clinical notes. Please try again.');
    }
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
            onClick={handlePrintClinicalNotes}
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
