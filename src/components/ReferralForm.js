import React, { useState, useRef } from 'react';
import { Modal, Button, Form, Row, Col, Card, Table } from 'react-bootstrap';
import { useReactToPrint } from 'react-to-print';
import '../styles/ReferralForm.css';

const ReferralForm = ({ show, onHide, selectedPatient }) => {
  const componentRef = useRef();
  
  const [referralData, setReferralData] = useState({
    fullName: '',
    age: '',
    sex: '',
    houseNo: '',
    street: '',
    barangay: '',
    city: 'Pasig',
    province: 'Metro Manila',
    date: new Date().toISOString().split('T')[0],
    // Laboratory tests
    hematology: {
      cbcWithPc: false,
      bloodTypingWithRh: false,
      hbsag: false,
      hivScreening: false
    },
    clinicalMicroscopy: {
      urinalysis: false
    },
    clinicalChemistry: {
      fbgs: false,
      ogtt: false
    },
    sonologicExamination: {
      tvs: false
    },
    // Additional fields
    clinicalFindings: '',
    requestingPhysician: '',
    referredTo: '',
    notes: ''
  });

  // Pre-populate form if patient is selected
  React.useEffect(() => {
    if (selectedPatient) {
      const patientAge = selectedPatient.age || calculateAge(selectedPatient.dateOfBirth);
      setReferralData(prev => ({
        ...prev,
        fullName: `${selectedPatient.firstName || ''} ${selectedPatient.middleName || ''} ${selectedPatient.lastName || ''}`.trim(),
        age: patientAge.toString(),
        sex: selectedPatient.gender || '',
        houseNo: selectedPatient.houseNo || '',
        street: selectedPatient.street || '',
        barangay: selectedPatient.barangay || '',
        city: selectedPatient.city || 'Pasig',
        province: selectedPatient.region || 'Metro Manila'
      }));
    }
  }, [selectedPatient]);

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return '';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleShowReferralHistory = () => {
    alert('Referral History:\n\n• Lab Request - June 10, 2025 (CBC, Urinalysis)\n• X-Ray Referral - May 15, 2025 (Chest X-Ray)\n• Specialist Referral - April 20, 2025 (Cardiologist)\n• Lab Request - March 5, 2025 (Blood Chemistry)');
  };

  const handleInputChange = (field, value) => {
    setReferralData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTestChange = (category, test, checked) => {
    setReferralData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [test]: checked
      }
    }));
  };

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Referral_Slip_${referralData.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 0.5in;
      }
      @media print {
        body { 
          font-family: Arial, sans-serif; 
          font-size: 12px;
          line-height: 1.4;
        }
        .no-print { 
          display: none !important; 
        }
        .print-only {
          display: block !important;
        }
        .page-break {
          page-break-before: always;
        }
      }
    `
  });

  const handleSave = () => {
    // Here you would save the referral data to your backend
    console.log('Saving referral data:', referralData);
    alert('Referral slip saved successfully!');
  };

  const handleReset = () => {
    setReferralData({
      fullName: '',
      age: '',
      sex: '',
      houseNo: '',
      street: '',
      barangay: '',
      city: 'Pasig',
      province: 'Metro Manila',
      date: new Date().toISOString().split('T')[0],
      hematology: {
        cbcWithPc: false,
        bloodTypingWithRh: false,
        hbsag: false,
        hivScreening: false
      },
      clinicalMicroscopy: {
        urinalysis: false
      },
      clinicalChemistry: {
        fbgs: false,
        ogtt: false
      },
      sonologicExamination: {
        tvs: false
      },
      clinicalFindings: '',
      requestingPhysician: '',
      referredTo: '',
      notes: ''
    });
  };

  const getSelectedTests = () => {
    const selected = [];
    
    // Hematology tests
    if (referralData.hematology.cbcWithPc) selected.push('CBC with PC');
    if (referralData.hematology.bloodTypingWithRh) selected.push('Blood Typing with Rh');
    if (referralData.hematology.hbsag) selected.push('HBsAg');
    if (referralData.hematology.hivScreening) selected.push('HIV Screening');
    
    // Clinical Microscopy
    if (referralData.clinicalMicroscopy.urinalysis) selected.push('Urinalysis');
    
    // Clinical Chemistry
    if (referralData.clinicalChemistry.fbgs) selected.push('FBGS (Fasting Blood Glucose)');
    if (referralData.clinicalChemistry.ogtt) selected.push('OGTT (Oral Glucose Tolerance Test)');
    
    // Sonologic Examination
    if (referralData.sonologicExamination.tvs) selected.push('TVS (Transvaginal Sonography)');
    
    return selected;
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      size="lg"
      centered
      className="referral-modal"
    >
      <Modal.Header closeButton style={{ background: '#0ea5e9', color: '#ffffff', border: 'none' }}>
        <Modal.Title className="w-100 text-center fw-bold">
          <i className="bi bi-file-medical me-2"></i>
          Laboratory Referral Form
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{ background: '#ffffff', padding: '0', maxHeight: '80vh', overflowY: 'auto' }}>
        {/* Form Section */}
        <div className="p-4 no-print" style={{ maxWidth: '210mm', margin: '0 auto' }}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: '600', color: '#2c3e50' }}>Full Name</Form.Label>
                <Form.Control
                  type="text"
                  value={referralData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Enter patient's full name"
                  style={{ borderRadius: '8px', border: '2px solid #e9ecef', backgroundColor: '#f8f9fa' }}
                  readOnly
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: '600', color: '#2c3e50' }}>Age</Form.Label>
                <Form.Control
                  type="number"
                  value={referralData.age}
                  placeholder="Age"
                  style={{ borderRadius: '8px', border: '2px solid #e9ecef', backgroundColor: '#f8f9fa' }}
                  readOnly
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: '600', color: '#2c3e50' }}>Sex</Form.Label>
                <Form.Control
                  type="text"
                  value={referralData.sex}
                  placeholder="Sex"
                  style={{ borderRadius: '8px', border: '2px solid #e9ecef', backgroundColor: '#f8f9fa' }}
                  readOnly
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: '600', color: '#2c3e50' }}>House No.</Form.Label>
                <Form.Control
                  type="text"
                  value={referralData.houseNo}
                  placeholder="House No."
                  style={{ borderRadius: '8px', border: '2px solid #e9ecef', backgroundColor: '#f8f9fa' }}
                  readOnly
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: '600', color: '#2c3e50' }}>Street</Form.Label>
                <Form.Control
                  type="text"
                  value={referralData.street}
                  placeholder="Street"
                  style={{ borderRadius: '8px', border: '2px solid #e9ecef', backgroundColor: '#f8f9fa' }}
                  readOnly
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: '600', color: '#2c3e50' }}>Barangay</Form.Label>
                <Form.Control
                  type="text"
                  value={referralData.barangay}
                  placeholder="Barangay"
                  style={{ borderRadius: '8px', border: '2px solid #e9ecef', backgroundColor: '#f8f9fa' }}
                  readOnly
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: '600', color: '#2c3e50' }}>Date</Form.Label>
                <Form.Control
                  type="date"
                  value={referralData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  style={{ borderRadius: '8px', border: '2px solid #e9ecef' }}
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Laboratory Tests Section */}
          <Card className="mb-4" style={{ border: '2px solid #e9ecef', borderRadius: '12px' }}>
            <Card.Header style={{ background: '#f8f9fa', borderRadius: '10px 10px 0 0', padding: '16px' }}>
              <h5 style={{ color: '#2c3e50', fontWeight: '600', margin: 0 }}>
                <i className="bi bi-clipboard2-check me-2"></i>
                Laboratory Request Form
              </h5>
            </Card.Header>
            <Card.Body style={{ padding: '24px' }}>
              <Row>
                {/* Hematology */}
                <Col md={3}>
                  <div className="test-category">
                    <h6 style={{ color: '#e74c3c', fontWeight: '600', marginBottom: '16px', borderBottom: '2px solid #e74c3c', paddingBottom: '8px' }}>
                      Hematology
                    </h6>
                    <div className="test-items">
                      <Form.Check
                        type="checkbox"
                        id="cbcWithPc"
                        label="CBC with PC"
                        checked={referralData.hematology.cbcWithPc}
                        onChange={(e) => handleTestChange('hematology', 'cbcWithPc', e.target.checked)}
                        className="mb-2"
                        style={{ fontSize: '14px' }}
                      />
                      <Form.Check
                        type="checkbox"
                        id="bloodTypingWithRh"
                        label="Blood Typing with Rh"
                        checked={referralData.hematology.bloodTypingWithRh}
                        onChange={(e) => handleTestChange('hematology', 'bloodTypingWithRh', e.target.checked)}
                        className="mb-2"
                        style={{ fontSize: '14px' }}
                      />
                      <Form.Check
                        type="checkbox"
                        id="hbsag"
                        label="HBsAg"
                        checked={referralData.hematology.hbsag}
                        onChange={(e) => handleTestChange('hematology', 'hbsag', e.target.checked)}
                        className="mb-2"
                        style={{ fontSize: '14px' }}
                      />
                      <Form.Check
                        type="checkbox"
                        id="hivScreening"
                        label="HIV Screening"
                        checked={referralData.hematology.hivScreening}
                        onChange={(e) => handleTestChange('hematology', 'hivScreening', e.target.checked)}
                        className="mb-2"
                        style={{ fontSize: '14px' }}
                      />
                    </div>
                  </div>
                </Col>

                {/* Clinical Microscopy */}
                <Col md={3}>
                  <div className="test-category">
                    <h6 style={{ color: '#3498db', fontWeight: '600', marginBottom: '16px', borderBottom: '2px solid #3498db', paddingBottom: '8px' }}>
                      Clinical Microscopy
                    </h6>
                    <div className="test-items">
                      <Form.Check
                        type="checkbox"
                        id="urinalysis"
                        label="Urinalysis"
                        checked={referralData.clinicalMicroscopy.urinalysis}
                        onChange={(e) => handleTestChange('clinicalMicroscopy', 'urinalysis', e.target.checked)}
                        className="mb-2"
                        style={{ fontSize: '14px' }}
                      />
                    </div>
                  </div>
                </Col>

                {/* Clinical Chemistry */}
                <Col md={3}>
                  <div className="test-category">
                    <h6 style={{ color: '#f39c12', fontWeight: '600', marginBottom: '16px', borderBottom: '2px solid #f39c12', paddingBottom: '8px' }}>
                      Clinical Chemistry
                    </h6>
                    <div className="test-items">
                      <Form.Check
                        type="checkbox"
                        id="fbgs"
                        label="FBGS (Fasting Blood Glucose)"
                        checked={referralData.clinicalChemistry.fbgs}
                        onChange={(e) => handleTestChange('clinicalChemistry', 'fbgs', e.target.checked)}
                        className="mb-2"
                        style={{ fontSize: '14px' }}
                      />
                      <Form.Check
                        type="checkbox"
                        id="ogtt"
                        label="OGTT (Oral Glucose Tolerance Test)"
                        checked={referralData.clinicalChemistry.ogtt}
                        onChange={(e) => handleTestChange('clinicalChemistry', 'ogtt', e.target.checked)}
                        className="mb-2"
                        style={{ fontSize: '14px' }}
                      />
                    </div>
                  </div>
                </Col>

                {/* Sonologic Examination */}
                <Col md={3}>
                  <div className="test-category">
                    <h6 style={{ color: '#9b59b6', fontWeight: '600', marginBottom: '16px', borderBottom: '2px solid #9b59b6', paddingBottom: '8px' }}>
                      Sonologic Examination
                    </h6>
                    <div className="test-items">
                      <Form.Check
                        type="checkbox"
                        id="tvs"
                        label="TVS (Transvaginal Sonography)"
                        checked={referralData.sonologicExamination.tvs}
                        onChange={(e) => handleTestChange('sonologicExamination', 'tvs', e.target.checked)}
                        className="mb-2"
                        style={{ fontSize: '14px' }}
                      />
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Additional Information */}
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: '600', color: '#2c3e50' }}>Clinical Findings / Diagnosis</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={referralData.clinicalFindings}
                  onChange={(e) => handleInputChange('clinicalFindings', e.target.value)}
                  placeholder="Enter clinical findings or diagnosis..."
                  style={{ borderRadius: '8px', border: '2px solid #e9ecef' }}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: '600', color: '#2c3e50' }}>Requesting Physician</Form.Label>
                <Form.Control
                  type="text"
                  value={referralData.requestingPhysician}
                  onChange={(e) => handleInputChange('requestingPhysician', e.target.value)}
                  placeholder="Dr. Name"
                  style={{ borderRadius: '8px', border: '2px solid #e9ecef' }}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: '600', color: '#2c3e50' }}>Referred To</Form.Label>
                <Form.Control
                  type="text"
                  value={referralData.referredTo}
                  onChange={(e) => handleInputChange('referredTo', e.target.value)}
                  placeholder="Laboratory / Hospital Name"
                  style={{ borderRadius: '8px', border: '2px solid #e9ecef' }}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label style={{ fontWeight: '600', color: '#2c3e50' }}>Additional Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={referralData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional notes or special instructions..."
              style={{ borderRadius: '8px', border: '2px solid #e9ecef' }}
            />
          </Form.Group>
        </div>

        {/* Print Preview Section */}
        <div ref={componentRef} className="print-section" style={{ display: 'none' }}>
          <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', fontSize: '14px', lineHeight: '1.6' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '3px solid #0ea5e9', paddingBottom: '20px' }}>
              <h2 style={{ color: '#0ea5e9', fontWeight: 'bold', margin: '0', fontSize: '24px' }}>
                MAYBUNGA HEALTH CENTER
              </h2>
              <h3 style={{ color: '#2c3e50', margin: '5px 0', fontSize: '18px' }}>
                REFERRAL SLIP
              </h3>
              <p style={{ margin: '0', color: '#666', fontSize: '12px' }}>
                Laboratory Request Form
              </p>
            </div>

            {/* Patient Information */}
            <div style={{ marginBottom: '25px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold', width: '15%' }}>Full Name:</td>
                    <td style={{ padding: '8px 0', borderBottom: '1px solid #ccc', width: '35%' }}>
                      {referralData.fullName}
                    </td>
                    <td style={{ padding: '8px 0', fontWeight: 'bold', width: '15%', paddingLeft: '20px' }}>Age/Sex:</td>
                    <td style={{ padding: '8px 0', borderBottom: '1px solid #ccc', width: '35%' }}>
                      {referralData.age} / {referralData.sex}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Address:</td>
                    <td style={{ padding: '8px 0', borderBottom: '1px solid #ccc' }} colSpan="3">
                      {`${referralData.houseNo} ${referralData.street}, ${referralData.barangay}, ${referralData.city}, ${referralData.province}`}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Date:</td>
                    <td style={{ padding: '8px 0', borderBottom: '1px solid #ccc' }}>
                      {new Date(referralData.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td colSpan="2"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Laboratory Tests */}
            <div style={{ marginBottom: '25px' }}>
              <h4 style={{ color: '#2c3e50', fontWeight: 'bold', marginBottom: '15px', borderBottom: '2px solid #0ea5e9', paddingBottom: '5px' }}>
                LABORATORY REQUEST FORM
              </h4>
              
              {getSelectedTests().length > 0 ? (
                <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                  <h5 style={{ color: '#0ea5e9', marginBottom: '10px', fontWeight: '600' }}>
                    Requested Tests:
                  </h5>
                  <ul style={{ margin: '0', paddingLeft: '20px' }}>
                    {getSelectedTests().map((test, index) => (
                      <li key={index} style={{ marginBottom: '5px', fontSize: '14px' }}>
                        {test}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p style={{ color: '#666', fontStyle: 'italic' }}>No tests selected</p>
              )}
            </div>

            {/* Clinical Information */}
            {(referralData.clinicalFindings || referralData.requestingPhysician || referralData.referredTo || referralData.notes) && (
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ color: '#2c3e50', fontWeight: 'bold', marginBottom: '15px', borderBottom: '2px solid #0ea5e9', paddingBottom: '5px' }}>
                  CLINICAL INFORMATION
                </h4>
                
                {referralData.clinicalFindings && (
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Clinical Findings/Diagnosis:</strong>
                    <p style={{ margin: '5px 0', padding: '8px', background: '#f8f9fa', borderRadius: '4px' }}>
                      {referralData.clinicalFindings}
                    </p>
                  </div>
                )}
                
                {referralData.notes && (
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Additional Notes:</strong>
                    <p style={{ margin: '5px 0', padding: '8px', background: '#f8f9fa', borderRadius: '4px' }}>
                      {referralData.notes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Signatures */}
            <div style={{ marginTop: '40px' }}>
              <table style={{ width: '100%' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '50%', textAlign: 'center', paddingRight: '20px' }}>
                      <div style={{ borderBottom: '1px solid #000', marginBottom: '5px', minHeight: '30px', display: 'flex', alignItems: 'end', justifyContent: 'center', paddingBottom: '5px' }}>
                        {referralData.requestingPhysician && (
                          <span style={{ fontWeight: 'bold' }}>{referralData.requestingPhysician}</span>
                        )}
                      </div>
                      <p style={{ margin: '0', fontSize: '12px', fontWeight: 'bold' }}>
                        Requesting Physician
                      </p>
                    </td>
                    <td style={{ width: '50%', textAlign: 'center', paddingLeft: '20px' }}>
                      <div style={{ borderBottom: '1px solid #000', marginBottom: '5px', minHeight: '30px', display: 'flex', alignItems: 'end', justifyContent: 'center', paddingBottom: '5px' }}>
                        {referralData.referredTo && (
                          <span style={{ fontWeight: 'bold' }}>{referralData.referredTo}</span>
                        )}
                      </div>
                      <p style={{ margin: '0', fontSize: '12px', fontWeight: 'bold' }}>
                        Laboratory/Facility
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '11px', color: '#666' }}>
              <p style={{ margin: '0' }}>
                Generated on {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>
      </Modal.Body>
      
      <Modal.Footer style={{ background: '#f8f9fa', border: 'none', padding: '20px' }}>
        <Button 
          variant="outline-secondary" 
          onClick={handleReset}
          style={{ borderRadius: '8px', padding: '8px 16px' }}
        >
          <i className="bi bi-arrow-clockwise me-2"></i>
          Reset Form
        </Button>
        <Button 
          variant="warning" 
          onClick={handleShowReferralHistory}
          style={{ 
            borderRadius: '8px', 
            padding: '8px 16px',
            backgroundColor: '#ffc107',
            borderColor: '#ffc107',
            color: '#000'
          }}
        >
          <i className="bi bi-clock-history me-2"></i>
          Referral History
        </Button>
        <Button 
          variant="success" 
          onClick={handleSave}
          style={{ borderRadius: '8px', padding: '8px 16px' }}
        >
          <i className="bi bi-save me-2"></i>
          Save Referral
        </Button>
        <Button 
          variant="primary" 
          onClick={handlePrint}
          style={{ borderRadius: '8px', padding: '8px 16px', background: '#0ea5e9', border: 'none' }}
        >
          <i className="bi bi-printer me-2"></i>
          Print Referral
        </Button>
        <Button 
          variant="secondary" 
          onClick={onHide}
          style={{ borderRadius: '8px', padding: '8px 16px' }}
        >
          <i className="bi bi-x-circle me-2"></i>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReferralForm;
