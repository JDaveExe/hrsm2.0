import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { QRCodeSVG } from 'qrcode.react';
import './PatientQRModal.css';

const PatientQRModal = ({ 
  show, 
  onHide, 
  patientData, 
  qrCodeData 
}) => {
  
  const handleDownload = () => {
    if (!qrCodeData || !patientData) return;
    
    const qrContainer = document.getElementById('patient-qr-code-container');
    if (!qrContainer) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svgData = new XMLSerializer().serializeToString(qrContainer.querySelector('svg'));
    const img = new Image();
    
    img.onload = function() {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Fill background with white
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      const link = document.createElement('a');
      link.download = `${patientData.firstName}_${patientData.lastName}_QR_Code.png`;
      link.href = canvas.toDataURL();
      link.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handlePrint = () => {
    if (!qrCodeData || !patientData) return;
    
    const printWindow = window.open('', '_blank');
    const qrContainer = document.getElementById('patient-qr-code-container').outerHTML;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${patientData.firstName} ${patientData.lastName}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px; 
            }
            .header { 
              margin-bottom: 20px; 
            }
            .qr-container { 
              margin: 20px auto; 
            }
            .instructions { 
              margin-top: 20px; 
              text-align: left; 
              max-width: 400px; 
              margin-left: auto; 
              margin-right: auto; 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Patient Check-in QR Code</h2>
            <h3>${patientData.firstName} ${patientData.lastName}</h3>
            <p>Scan to check in for today's appointment</p>
          </div>
          <div class="qr-container">
            ${qrContainer}
          </div>
          <div class="instructions">
            <h4>Instructions:</h4>
            <ol>
              <li>Open your camera app</li>
              <li>Point camera at QR code</li>
              <li>Tap the notification that appears</li>
              <li>Complete your check-in</li>
            </ol>
            <p><small>Generated: ${new Date().toLocaleString()}</small></p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      centered 
      size="lg"
      className="patient-qr-modal"
    >
      <Modal.Header closeButton className="patient-qr-modal-header">
        <Modal.Title>
          <i className="bi bi-qr-code me-2"></i>
          My QR Code
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="patient-qr-modal-body">
        {qrCodeData && patientData ? (
          <div>
            <div className="text-center mb-4">
              <h5 className="mb-3 patient-qr-title">
                <strong>{patientData.firstName} {patientData.lastName}</strong>
              </h5>
              <p className="text-muted mb-4 patient-qr-subtitle">
                Scan this QR code to check in for your appointments
              </p>
              
              <div 
                id="patient-qr-code-container" 
                className="d-inline-block p-4 bg-white border rounded patient-qr-container"
              >
                <QRCodeSVG 
                  value={qrCodeData} 
                  size={250}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                  includeMargin={true}
                />
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-6">
                <div className="card patient-qr-instructions-card">
                  <div className="card-header patient-qr-card-header">
                    <h6 className="mb-0">
                      <i className="bi bi-info-circle me-2"></i>
                      How to Use Your QR Code
                    </h6>
                  </div>
                  <div className="card-body patient-qr-card-body">
                    <ol className="mb-0 patient-qr-instructions">
                      <li>Open your camera app on your phone</li>
                      <li>Point the camera at this QR code</li>
                      <li>Tap the notification that appears</li>
                      <li>You'll be automatically checked in</li>
                    </ol>
                  </div>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="card patient-qr-info-card">
                  <div className="card-header patient-qr-card-header">
                    <h6 className="mb-0">
                      <i className="bi bi-shield-check me-2"></i>
                      Important Notes
                    </h6>
                  </div>
                  <div className="card-body patient-qr-card-body">
                    <ul className="mb-0 patient-qr-notes">
                      <li>This QR code is unique to you</li>
                      <li>It can be used multiple times</li>
                      <li>Each scan checks you in for today only</li>
                      <li>Keep this QR code safe and private</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="alert alert-info mt-3 patient-qr-alert">
              <i className="bi bi-lightbulb me-2"></i>
              <strong>Tip:</strong> Save this QR code to your phone's photo gallery for quick access during visits.
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Generating Your QR Code...</p>
          </div>
        )}
      </Modal.Body>
      
      <Modal.Footer className="patient-qr-modal-footer">
        <Button 
          variant="info" 
          onClick={handleDownload}
          className="patient-qr-btn-download"
          disabled={!qrCodeData}
        >
          <i className="bi bi-download me-2"></i>
          Download
        </Button>
        
        <Button 
          variant="outline-info" 
          onClick={handlePrint}
          className="patient-qr-btn-print"
          disabled={!qrCodeData}
        >
          <i className="bi bi-printer me-2"></i>
          Print
        </Button>
        
        <Button 
          variant="secondary" 
          onClick={onHide}
          className="patient-qr-btn-close"
        >
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PatientQRModal;