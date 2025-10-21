import React, { useState, useEffect } from 'react';
import { Modal, Button, Table } from 'react-bootstrap';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import sealMainImage from '../../images/sealmain.png';
import sealGovImage from '../../images/sealgov.png';
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
    try {
      const patientName = getPatientFullName(selectedPatient);
      const patientAge = getPatientAge(selectedPatient);
      const patientID = selectedPatient?.patientId || selectedPatient?.id || 'N/A';
      
      // Create HTML content for the immunization card
      const printWindow = window.open('', '_blank');
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Immunization Card - ${patientName}</title>
          <style>
            @page {
              size: A4;
              margin: 10mm;
              margin-header: 0mm;
              margin-footer: 0mm;
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: Arial, sans-serif;
              padding: 12mm;
              background: white;
              line-height: 1.4;
              font-size: 10pt;
            }
            
            .government-header {
              text-align: center;
              margin-bottom: 12mm;
              padding-bottom: 5mm;
              border-bottom: 3px solid #0ea5e9;
            }
            
            .seals {
              display: flex;
              justify-content: center;
              align-items: center;
              gap: 15px;
              margin-bottom: 8px;
            }
            
            .seal-img {
              width: 50px;
              height: 50px;
              object-fit: contain;
            }
            
            .header-title {
              font-size: 18px;
              font-weight: bold;
              color: #1e40af;
              margin: 5px 0;
            }
            
            .header-subtitle {
              font-size: 11px;
              color: #64748b;
              margin: 2px 0;
            }
            
            .card-title {
              text-align: center;
              font-size: 16px;
              font-weight: bold;
              color: #0ea5e9;
              margin: 15px 0 10px 0;
              padding: 8px;
              background: #f0f9ff;
              border-radius: 5px;
            }
            
            .patient-info {
              background: #f8fafc;
              padding: 10px;
              border-radius: 5px;
              margin-bottom: 15px;
              border: 1px solid #e2e8f0;
            }
            
            .info-row {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 5px;
            }
            
            .info-label {
              font-weight: bold;
              color: #334155;
              font-size: 9.5pt;
            }
            
            .info-value {
              color: #475569;
              font-size: 9.5pt;
            }
            
            .vaccination-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              font-size: 9pt;
            }
            
            .vaccination-table th {
              background: #0ea5e9;
              color: white;
              padding: 8px 6px;
              text-align: left;
              font-weight: 600;
              font-size: 9pt;
              border: 1px solid #0284c7;
            }
            
            .vaccination-table td {
              padding: 6px;
              border: 1px solid #e2e8f0;
              font-size: 9pt;
              line-height: 1.3;
            }
            
            .vaccination-table tr:nth-child(even) {
              background: #f8fafc;
            }
            
            .section-title {
              font-weight: bold;
              color: #1e40af;
              margin-top: 15px;
              margin-bottom: 8px;
              font-size: 11pt;
              padding-bottom: 3px;
              border-bottom: 2px solid #0ea5e9;
            }
            
            .footer {
              margin-top: 20px;
              padding-top: 10px;
              border-top: 1px solid #e2e8f0;
              text-align: center;
              font-size: 8pt;
              color: #64748b;
            }
            
            .signature-section {
              margin-top: 30mm;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20mm;
            }
            
            .signature-box {
              text-align: center;
            }
            
            .signature-line {
              border-top: 1px solid #000;
              margin-top: 15mm;
              padding-top: 3px;
              font-size: 9pt;
              font-weight: bold;
            }
            
            .signature-label {
              font-size: 8pt;
              color: #64748b;
              margin-top: 2px;
            }
            
            @media print {
              body {
                padding: 8mm;
              }
              
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="government-header">
            <div class="seals">
              <img src="${sealGovImage}" alt="Government Seal" class="seal-img" />
              <div style="text-align: center;">
                <div class="header-subtitle">Republic of the Philippines</div>
                <div class="header-title">BARANGAY HEALTH CENTER</div>
                <div class="header-subtitle">Immunization Program</div>
              </div>
              <img src="${sealMainImage}" alt="Main Seal" class="seal-img" />
            </div>
          </div>
          
          <div class="card-title">
            IMMUNIZATION CARD
          </div>
          
          <div class="patient-info">
            <div class="info-row">
              <div><span class="info-label">Name:</span> <span class="info-value">${patientName}</span></div>
              <div><span class="info-label">Patient ID:</span> <span class="info-value">PT-${String(patientID).padStart(4, '0')}</span></div>
            </div>
            <div class="info-row">
              <div><span class="info-label">Date of Birth:</span> <span class="info-value">${selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : 'N/A'}</span></div>
              <div><span class="info-label">Age:</span> <span class="info-value">${patientAge} years old</span></div>
            </div>
            <div class="info-row">
              <div><span class="info-label">Gender:</span> <span class="info-value">${selectedPatient.gender || 'N/A'}</span></div>
              <div><span class="info-label">Card Generated:</span> <span class="info-value">${new Date().toLocaleDateString()}</span></div>
            </div>
          </div>
          
          <div class="section-title">Vaccination Records</div>
          
          <table class="vaccination-table">
            <thead>
              <tr>
                <th style="width: 30%;">Vaccine Name</th>
                <th style="width: 15%;">Date Given</th>
                <th style="width: 12%;">Dose</th>
                <th style="width: 18%;">Provider</th>
                <th style="width: 25%;">Notes</th>
              </tr>
            </thead>
            <tbody>
              ${immunizationHistory.length === 0 ? `
                <tr>
                  <td colspan="5" style="text-align: center; padding: 20px; color: #64748b;">
                    No vaccination records found
                  </td>
                </tr>
              ` : immunizationHistory.map(record => `
                <tr>
                  <td><strong>${record.vaccine}</strong></td>
                  <td>${new Date(record.dateGiven).toLocaleDateString()}</td>
                  <td>${record.dose}</td>
                  <td>${record.provider}</td>
                  <td style="font-size: 8.5pt;">${record.description}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">Healthcare Provider</div>
              <div class="signature-label">Name and Signature</div>
            </div>
            <div class="signature-box">
              <div class="signature-line">Date</div>
              <div class="signature-label">Last Updated</div>
            </div>
          </div>
          
          <div class="footer">
            <p>This is an official immunization record. Keep this card for your records.</p>
            <p style="margin-top: 5px;">For questions or concerns, please contact the Barangay Health Center.</p>
            <p style="margin-top: 5px; font-style: italic;">Generated on ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #0ea5e9; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
              Print Card
            </button>
            <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; margin-left: 10px;">
              Close
            </button>
          </div>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // Wait a moment for images to load, then trigger print dialog
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
      
    } catch (error) {
      console.error('Error generating immunization card:', error);
      alert('Failed to generate immunization card. Please try again.');
    }
  };

  const handleExportHistory = () => {
    try {
      // Create new PDF document
      const doc = new jsPDF();
      
      const patientName = getPatientFullName(selectedPatient);
      const patientAge = getPatientAge(selectedPatient);
      const patientID = selectedPatient?.patientId || selectedPatient?.id || 'N/A';
      
      // Add government seals
      const sealSize = 25;
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Left seal (government)
      doc.addImage(sealGovImage, 'PNG', 40, 10, sealSize, sealSize);
      
      // Right seal (main)
      doc.addImage(sealMainImage, 'PNG', pageWidth - 65, 10, sealSize, sealSize);
      
      // Add header with health center name
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Republic of the Philippines', pageWidth / 2, 15, { align: 'center' });
      
      doc.setFontSize(16);
      doc.setTextColor(14, 165, 233);
      doc.setFont(undefined, 'bold');
      doc.text('BARANGAY HEALTH CENTER', pageWidth / 2, 22, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.setFont(undefined, 'normal');
      doc.text('Immunization Program', pageWidth / 2, 27, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'bold');
      doc.text('Immunization History Report', pageWidth / 2, 35, { align: 'center' });
      
      // Add horizontal line
      doc.setDrawColor(14, 165, 233);
      doc.setLineWidth(0.5);
      doc.line(20, 40, pageWidth - 20, 40);
      
      // Patient Information Section
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Patient Information', 20, 50);
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(`Name: ${patientName}`, 20, 58);
      doc.text(`Patient ID: PT-${String(patientID).padStart(4, '0')}`, 20, 64);
      doc.text(`Age: ${patientAge} years old`, 120, 58);
      doc.text(`Gender: ${selectedPatient?.gender || 'N/A'}`, 120, 64);
      doc.text(`Date of Birth: ${selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : 'N/A'}`, 20, 70);
      
      // Vaccination Statistics
      const totalVaccines = immunizationHistory.length;
      const categories = categorizeVaccines(immunizationHistory);
      const complianceRate = calculateComplianceRate(immunizationHistory, patientAge);
      
      doc.setFont(undefined, 'bold');
      doc.text('Vaccination Summary', 20, 80);
      doc.setFont(undefined, 'normal');
      doc.text(`Total Vaccines: ${totalVaccines}`, 20, 88);
      doc.text(`Routine Childhood: ${categories.routineChildhood}`, 70, 88);
      doc.text(`COVID-19 Series: ${categories.covidSeries}`, 120, 88);
      doc.text(`Annual Vaccines: ${categories.annual}`, 170, 88);
      doc.text(`Compliance Rate: ${complianceRate}%`, 20, 94);
      doc.text(`Last Vaccination: ${immunizationHistory.length > 0 ? new Date(immunizationHistory[0].dateGiven).toLocaleDateString() : 'N/A'}`, 70, 94);
      
      // Immunization History Table
      doc.setFont(undefined, 'bold');
      doc.setFontSize(12);
      doc.text('Vaccination Records', 20, 104);
      
      // Prepare table data
      const tableData = immunizationHistory.map(record => [
        record.vaccine,
        new Date(record.dateGiven).toLocaleDateString(),
        record.dose,
        record.provider,
        record.status
      ]);
      
      // Create table using autoTable
      autoTable(doc, {
        startY: 108,
        head: [['Vaccine Name', 'Date Given', 'Dose', 'Provider', 'Status']],
        body: tableData.length > 0 ? tableData : [['No vaccination records found', '', '', '', '']],
        theme: 'striped',
        headStyles: {
          fillColor: [14, 165, 233],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        styles: {
          fontSize: 9,
          cellPadding: 4
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        margin: { left: 20, right: 20 }
      });
      
      // Add footer
      const finalY = doc.lastAutoTable.finalY || 200;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Report generated on ${new Date().toLocaleString()}`, pageWidth / 2, finalY + 15, { align: 'center' });
      doc.text('This is an official immunization record from the Barangay Health Center', pageWidth / 2, finalY + 20, { align: 'center' });
      
      // Save the PDF
      doc.save(`Immunization_History_${patientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      console.log('Immunization history PDF exported successfully');
    } catch (error) {
      console.error('Error exporting immunization history:', error);
      alert('Failed to export immunization history. Please try again.');
    }
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
                  const patientAge = getPatientAge(selectedPatient);
                  const showRoutineChildhood = patientAge <= 17; // Only show for patients 17 and under
                  
                  return (
                    <>
                      {showRoutineChildhood && (
                        <div className={`col-md-${showRoutineChildhood ? '3' : '4'}`}>
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
                      )}
                      <div className={`col-md-${showRoutineChildhood ? '3' : '4'}`}>
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
                      <div className={`col-md-${showRoutineChildhood ? '3' : '4'}`}>
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
                      <div className={`col-md-${showRoutineChildhood ? '3' : '4'}`}>
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
