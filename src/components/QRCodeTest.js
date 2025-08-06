import React from 'react';
import { QRCodeCanvas as QRCode } from 'qrcode.react';

const QRCodeTest = () => {
  // Sample patient data for testing
  const samplePatient = {
    id: 1,
    firstName: 'Maria',
    lastName: 'Santos',
    dateOfBirth: '1985-03-15',
    contactNumber: '09123456789'
  };

  // Generate login initials function (same as in AdminDashboard)
  const generatePatientLoginInitials = (patient) => {
    if (!patient) return 'N/A';
    
    const firstName = patient.firstName || '';
    const lastName = patient.lastName || '';
    const patientId = patient.id || '';
    
    // Generate initials: FirstInitial + LastInitial + PatientID
    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();
    const paddedId = String(patientId).padStart(4, '0');
    
    return `${firstInitial}${lastInitial}${paddedId}`;
  };

  // Generate QR code data function (same as in AdminDashboard)
  const generateQRCodeData = (patient) => {
    if (!patient) return '';
    
    const loginInitials = generatePatientLoginInitials(patient);
    const patientId = `PT-${String(patient.id).padStart(4, '0')}`;
    const fullName = `${patient.firstName} ${patient.lastName}`;
    const dateOfBirth = patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '';
    
    // QR Code data format for healthcare center login
    return JSON.stringify({
      type: 'PATIENT_LOGIN',
      loginInitials: loginInitials,
      patientId: patientId,
      name: fullName,
      dateOfBirth: dateOfBirth,
      generatedAt: new Date().toISOString(),
      healthCenter: 'Maybunga Health Center'
    });
  };

  const loginInitials = generatePatientLoginInitials(samplePatient);
  const qrData = generateQRCodeData(samplePatient);

  return (
    <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <h2>QR Code Test - Patient Login System</h2>
      
      <div style={{ margin: '20px 0' }}>
        <h3>Sample Patient: {samplePatient.firstName} {samplePatient.lastName}</h3>
        <p><strong>Patient ID:</strong> PT-{String(samplePatient.id).padStart(4, '0')}</p>
        <p><strong>Login Initials:</strong> <span style={{ 
          fontSize: '20px', 
          fontWeight: 'bold', 
          backgroundColor: '#e3f2fd', 
          padding: '5px 10px', 
          borderRadius: '5px' 
        }}>{loginInitials}</span></p>
      </div>

      <div style={{ 
        display: 'inline-block', 
        padding: '20px', 
        backgroundColor: 'white', 
        border: '2px solid #333', 
        borderRadius: '10px' 
      }}>
        <QRCode 
          value={qrData}
          size={200}
          bgColor={"#ffffff"}
          fgColor={"#000000"}
          level={"H"}
          includeMargin={true}
        />
      </div>

      <div style={{ marginTop: '20px', maxWidth: '600px', margin: '20px auto' }}>
        <h4>QR Code Data Structure:</h4>
        <pre style={{ 
          textAlign: 'left', 
          backgroundColor: '#f5f5f5', 
          padding: '15px', 
          borderRadius: '5px',
          fontSize: '12px',
          overflow: 'auto'
        }}>
          {JSON.stringify(JSON.parse(qrData), null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '20px', backgroundColor: '#fff3cd', padding: '15px', borderRadius: '5px' }}>
        <h4>How it works:</h4>
        <ul style={{ textAlign: 'left', display: 'inline-block' }}>
          <li>Patient presents QR code at healthcare center reception</li>
          <li>Staff scans QR code to automatically retrieve patient information</li>
          <li>Alternatively, staff can manually enter login initials: <strong>{loginInitials}</strong></li>
          <li>System verifies patient identity and initiates check-in process</li>
          <li>QR code contains encrypted patient data for secure access</li>
        </ul>
      </div>
    </div>
  );
};

export default QRCodeTest;
