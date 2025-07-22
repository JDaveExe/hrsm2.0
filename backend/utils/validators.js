const { body } = require('express-validator');

// Registration validation rules
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),

  body('email')
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),

  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),

  body('contactNumber')
    .optional()
    .matches(/^[\+]?[0-9\s\-\(\)]+$/)
    .withMessage('Please provide a valid contact number'),

  body('dateOfBirth')
    .isISO8601()
    .withMessage('Please provide a valid date of birth')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 0 || age > 120) {
        throw new Error('Invalid date of birth');
      }
      return true;
    }),

  body('gender')
    .isIn(['Male', 'Female'])
    .withMessage('Gender must be either Male or Female'),

  body('bloodType')
    .optional()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Invalid blood type'),

  body('emergencyContact.name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Emergency contact name must be less than 100 characters'),

  body('emergencyContact.phoneNumber')
    .optional()
    .matches(/^[\+]?[0-9\s\-\(\)]+$/)
    .withMessage('Please provide a valid emergency contact number')
];

// Login validation rules
const loginValidation = [
  body('email')
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// QR Code validation rules
const qrCodeValidation = [
  body('qrData')
    .notEmpty()
    .withMessage('QR code data is required')
    .isJSON()
    .withMessage('QR code data must be valid JSON'),

  body('serviceType')
    .optional()
    .isIn([
      'consultation',
      'dental-consultation',
      'dental-procedure',
      'dental-fluoride',
      'follow-up',
      'out-patient',
      'parental-consultation',
      'vaccination-bcg',
      'vaccination-hepatitis-b',
      'vaccination-polio',
      'vaccination-dtap',
      'vaccination-mmr',
      'vaccination-varicella',
      'vaccination-pneumococcal',
      'vaccination-hepatitis-a',
      'vaccination-influenza',
      'vaccination-rabies'
    ])
    .withMessage('Invalid service type')
];

// Vital signs validation rules
const vitalSignsValidation = [
  body('bloodPressureSystolic')
    .optional()
    .isFloat({ min: 90, max: 180 })
    .withMessage('Systolic blood pressure must be between 90 and 180 mmHg'),

  body('bloodPressureDiastolic')
    .optional()
    .isFloat({ min: 60, max: 110 })
    .withMessage('Diastolic blood pressure must be between 60 and 110 mmHg'),

  body('temperature')
    .optional()
    .isFloat({ min: 35.0, max: 42.0 })
    .withMessage('Temperature must be between 35.0°C and 42.0°C'),

  body('weight')
    .optional()
    .isFloat({ min: 2.0, max: 300.0 })
    .withMessage('Weight must be between 2.0 kg and 300.0 kg'),

  body('height')
    .optional()
    .isFloat({ min: 40, max: 250 })
    .withMessage('Height must be between 40 cm and 250 cm'),

  body('heartRate')
    .optional()
    .isInt({ min: 50, max: 120 })
    .withMessage('Heart rate must be between 50 and 120 bpm'),

  body('respiratoryRate')
    .optional()
    .isInt({ min: 8, max: 30 })
    .withMessage('Respiratory rate must be between 8 and 30 brpm'),

  body('oxygenSaturation')
    .optional()
    .isFloat({ min: 70, max: 100 })
    .withMessage('Oxygen saturation must be between 70% and 100%')
];

// Password change validation
const passwordChangeValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    })
];

// Patient profile update validation
const patientUpdateValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be less than 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be less than 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),

  body('contactNumber')
    .optional()
    .matches(/^[\+]?[0-9\s\-\(\)]+$/)
    .withMessage('Please provide a valid contact number'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address must be less than 200 characters'),

  body('bloodType')
    .optional()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Invalid blood type'),

  body('emergencyContact.name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Emergency contact name must be less than 100 characters'),

  body('emergencyContact.phoneNumber')
    .optional()
    .matches(/^[\+]?[0-9\s\-\(\)]+$/)
    .withMessage('Please provide a valid emergency contact number')
];

// Appointment validation
const appointmentValidation = [
  body('serviceType')
    .isIn([
      'consultation',
      'dental-consultation',
      'dental-procedure',
      'dental-fluoride',
      'follow-up',
      'out-patient',
      'parental-consultation',
      'vaccination-bcg',
      'vaccination-hepatitis-b',
      'vaccination-polio',
      'vaccination-dtap',
      'vaccination-mmr',
      'vaccination-varicella',
      'vaccination-pneumococcal',
      'vaccination-hepatitis-a',
      'vaccination-influenza',
      'vaccination-rabies'
    ])
    .withMessage('Invalid service type'),

  body('timeSlot')
    .isIn(['morning', 'afternoon'])
    .withMessage('Time slot must be either morning or afternoon'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters'),

  body('symptoms')
    .optional()
    .isArray()
    .withMessage('Symptoms must be an array'),

  body('symptoms.*')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Each symptom must be less than 100 characters')
];

module.exports = {
  registerValidation,
  loginValidation,
  qrCodeValidation,
  vitalSignsValidation,
  passwordChangeValidation,
  patientUpdateValidation,
  appointmentValidation
};
