const QRCode = require('qrcode');
const crypto = require('crypto');

/**
 * Generate QR code for patient check-in
 * @param {Object|String} data - Data to encode in QR code
 * @param {Object} options - QR code generation options
 * @returns {Promise<String>} Base64 encoded QR code image
 */
const generateQRCode = async (data, options = {}) => {
  try {
    const defaultOptions = {
      width: 256,
      height: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M',
      ...options
    };

    // Convert data to string if it's an object
    const qrData = typeof data === 'object' ? JSON.stringify(data) : data;

    // Generate QR code as data URL (base64)
    const qrCodeDataURL = await QRCode.toDataURL(qrData, defaultOptions);
    
    return qrCodeDataURL;
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generate patient QR code with specific format
 * @param {Object} patientInfo - Patient information
 * @returns {Promise<String>} Base64 encoded QR code
 */
const generatePatientQRCode = async (patientInfo) => {
  try {
    const {
      patientId,
      email,
      phone,
      name,
      userId
    } = patientInfo;

    // Create QR code data structure
    const qrCodeData = {
      type: 'patient_checkin',
      patientId,
      email,
      phone,
      name,
      timestamp: new Date().toISOString(),
      checksum: generateChecksum(patientId, email, userId)
    };

    // Generate QR code
    const qrCode = await generateQRCode(qrCodeData, {
      width: 300,
      height: 300,
      color: {
        dark: '#2563eb', // Blue color for healthcare theme
        light: '#ffffff'
      }
    });

    return qrCode;
  } catch (error) {
    console.error('Patient QR code generation error:', error);
    throw new Error('Failed to generate patient QR code');
  }
};

/**
 * Generate appointment QR code
 * @param {Object} appointmentInfo - Appointment information
 * @returns {Promise<String>} Base64 encoded QR code
 */
const generateAppointmentQRCode = async (appointmentInfo) => {
  try {
    const {
      appointmentId,
      patientId,
      serviceType,
      date,
      timeSlot
    } = appointmentInfo;

    const qrCodeData = {
      type: 'appointment_checkin',
      appointmentId,
      patientId,
      serviceType,
      date,
      timeSlot,
      timestamp: new Date().toISOString(),
      checksum: generateChecksum(appointmentId, patientId)
    };

    const qrCode = await generateQRCode(qrCodeData, {
      width: 256,
      height: 256,
      color: {
        dark: '#059669', // Green color for appointments
        light: '#ffffff'
      }
    });

    return qrCode;
  } catch (error) {
    console.error('Appointment QR code generation error:', error);
    throw new Error('Failed to generate appointment QR code');
  }
};

/**
 * Verify QR code data integrity
 * @param {Object} qrData - Parsed QR code data
 * @returns {Boolean} True if QR code is valid
 */
const verifyQRCode = (qrData) => {
  try {
    const { type, checksum, timestamp } = qrData;

    // Check if QR code has expired (24 hours for patient QR codes)
    const qrTimestamp = new Date(timestamp);
    const now = new Date();
    const hoursDiff = Math.abs(now - qrTimestamp) / 36e5; // Convert to hours

    if (type === 'patient_checkin' && hoursDiff > 24) {
      return false;
    }

    // Verify checksum
    let expectedChecksum;
    if (type === 'patient_checkin') {
      expectedChecksum = generateChecksum(qrData.patientId, qrData.email, qrData.userId);
    } else if (type === 'appointment_checkin') {
      expectedChecksum = generateChecksum(qrData.appointmentId, qrData.patientId);
    }

    return checksum === expectedChecksum;
  } catch (error) {
    console.error('QR code verification error:', error);
    return false;
  }
};

/**
 * Parse QR code data
 * @param {String} qrCodeString - QR code string data
 * @returns {Object|null} Parsed QR code data or null if invalid
 */
const parseQRCode = (qrCodeString) => {
  try {
    const qrData = JSON.parse(qrCodeString);
    
    // Validate required fields
    if (!qrData.type || !qrData.checksum || !qrData.timestamp) {
      return null;
    }

    return qrData;
  } catch (error) {
    console.error('QR code parsing error:', error);
    return null;
  }
};

/**
 * Generate secure checksum for QR code validation
 * @param {...String} values - Values to include in checksum
 * @returns {String} MD5 checksum
 */
const generateChecksum = (...values) => {
  const combinedString = values.join('|') + process.env.JWT_SECRET;
  return crypto
    .createHash('md5')
    .update(combinedString)
    .digest('hex')
    .substring(0, 12);
};

/**
 * Generate QR code for staff access (admin/doctor)
 * @param {Object} staffInfo - Staff information
 * @returns {Promise<String>} Base64 encoded QR code
 */
const generateStaffQRCode = async (staffInfo) => {
  try {
    const {
      userId,
      role,
      name,
      department
    } = staffInfo;

    const qrCodeData = {
      type: 'staff_access',
      userId,
      role,
      name,
      department,
      timestamp: new Date().toISOString(),
      checksum: generateChecksum(userId, role)
    };

    const qrCode = await generateQRCode(qrCodeData, {
      width: 256,
      height: 256,
      color: {
        dark: '#dc2626', // Red color for staff access
        light: '#ffffff'
      }
    });

    return qrCode;
  } catch (error) {
    console.error('Staff QR code generation error:', error);
    throw new Error('Failed to generate staff QR code');
  }
};

/**
 * Regenerate patient QR code (invalidates old one)
 * @param {Object} patientInfo - Updated patient information
 * @returns {Promise<String>} New QR code
 */
const regeneratePatientQRCode = async (patientInfo) => {
  try {
    // Add regeneration timestamp to ensure uniqueness
    const updatedPatientInfo = {
      ...patientInfo,
      regeneratedAt: new Date().toISOString()
    };

    return await generatePatientQRCode(updatedPatientInfo);
  } catch (error) {
    console.error('QR code regeneration error:', error);
    throw new Error('Failed to regenerate QR code');
  }
};

module.exports = {
  generateQRCode,
  generatePatientQRCode,
  generateAppointmentQRCode,
  generateStaffQRCode,
  regeneratePatientQRCode,
  verifyQRCode,
  parseQRCode,
  generateChecksum
};
