const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const Patient = require('../models/Patient');
const User = require('../models/User');
const Family = require('../models/Family');
const { authenticateToken: auth } = require('../middleware/auth');
const { smartIdAllocation } = require('../middleware/smartIdAllocation');

// Ensure associations are loaded
require('../models/index');

const router = express.Router();

// @route   POST api/patients
// @desc    Create a new patient
// @access  Private (temporarily disabled for testing)
router.post(
  '/',
  [
    // Temporarily commented out auth for testing
    // auth, 
    smartIdAllocation('patient'), // Smart ID allocation for patients
    [
      body('firstName', 'First name is required').not().isEmpty(),
    body('lastName', 'Last name is required').not().isEmpty(),
    body('dateOfBirth', 'Date of birth is required').not().isEmpty(),
    body('gender', 'Gender is required').isIn(['Male', 'Female']),
    body('civilStatus')
      .optional({ checkFalsy: true })
      .isIn(['Single', 'Married', 'Divorced', 'Widowed'])
      .withMessage('Civil status must be Single, Married, Divorced, or Widowed'),
    body('contactNumber')
      .notEmpty()
      .withMessage('Contact number is required')
      .isLength({ min: 11, max: 11 })
      .withMessage('Contact number must be exactly 11 digits')
      .isNumeric()
      .withMessage('Contact number must contain only numbers'),
    body('email')
      .optional()
      .custom((value) => {
        // Allow empty, null, undefined, or "N/A" values
        if (!value || value === '' || value === null || value === undefined) {
          return true;
        }
        if (typeof value === 'string' && (value.toLowerCase() === 'n/a' || value.toLowerCase() === 'na')) {
          return true;
        }
        // If not N/A and has a value, validate as email
        if (value && value.length > 0) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            throw new Error('Must be a valid email address or "N/A"');
          }
        }
        return true;
      }),
    body('philHealthNumber')
      .optional({ checkFalsy: true })
      .isLength({ min: 1 })
      .withMessage('PhilHealth number cannot be empty if provided'),
  ]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Clean up empty strings by converting them to null
      const patientData = { ...req.body };
      
      // Convert empty strings and "N/A" to null for optional fields (email only, contact number is required)
      const fieldsToClean = ['email', 'philHealthNumber', 'middleName', 'suffix', 'civilStatus', 'houseNo', 'street', 'barangay', 'city', 'region'];
      
      fieldsToClean.forEach(field => {
        if (patientData[field] === '' || 
            (typeof patientData[field] === 'string' && 
             (patientData[field].toLowerCase() === 'n/a' || patientData[field].toLowerCase() === 'na'))) {
          patientData[field] = null;
        }
      });

      // Generate password from date of birth (dd-mm-yyyy format)
      const dateOfBirth = new Date(patientData.dateOfBirth);
      const day = String(dateOfBirth.getDate()).padStart(2, '0');
      const month = String(dateOfBirth.getMonth() + 1).padStart(2, '0');
      const year = dateOfBirth.getFullYear();
      const generatedPassword = `${day}-${month}-${year}`;

      // Generate QR code for the patient
      const qrCode = `PAT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      patientData.qrCode = qrCode;

      // Use database transaction to ensure atomic operation
      const { sequelize } = require('../config/database');
      const transaction = await sequelize.transaction();

      try {
        let user = null;
        
        // Create User account first if email or contact number provided
        if (patientData.email || patientData.contactNumber) {
          const username = patientData.email || patientData.contactNumber;
          
          // Check for existing user first to give better error message
          const whereConditions = [];
          
          if (patientData.email) {
            whereConditions.push({ email: patientData.email });
          }
          
          if (patientData.contactNumber) {
            whereConditions.push({ contactNumber: patientData.contactNumber });
          }
          
          // Only check for duplicates if we have actual values to check
          if (whereConditions.length > 0) {
            const existingUser = await User.findOne({
              where: {
                [Op.or]: whereConditions
              },
              transaction
            });

            if (existingUser) {
              await transaction.rollback();
              if (existingUser.email === patientData.email) {
                return res.status(400).json({ msg: 'This email is already registered' });
              }
              if (existingUser.contactNumber === patientData.contactNumber) {
                return res.status(400).json({ msg: 'This contact number is already registered' });
              }
            }
          }
          
          // Let the User model hook handle password hashing
          user = await User.create({
            username: username,
            email: patientData.email || null,
            contactNumber: patientData.contactNumber || null,
            password: generatedPassword, // Use plain password, hook will hash it
            role: 'patient',
            firstName: patientData.firstName,
            lastName: patientData.lastName,
            middleName: patientData.middleName
          }, { transaction });

          // Add userId to patient data
          patientData.userId = user.id;
        }

        // Create the patient record
        const patient = await Patient.create(patientData, { transaction });
        
        // Commit the transaction
        await transaction.commit();
        
        // Return patient data with generated password info
        res.status(201).json({
          ...patient.toJSON(),
          generatedPassword: generatedPassword, // Include password in response for admin to show user
          hasUserAccount: !!user
        });
        
      } catch (transactionError) {
        // Rollback the transaction on any error
        await transaction.rollback();
        throw transactionError; // Re-throw to be caught by outer catch
      }
    } catch (err) {
      console.error(err.message);
      // Handle unique constraint violation
      if (err.name === 'SequelizeUniqueConstraintError') {
        if (err.fields.contactNumber) {
          return res.status(400).json({ msg: 'This contact number is already registered' });
        }
        if (err.fields.email) {
          return res.status(400).json({ msg: 'This email is already registered' });
        }
        if (err.fields.philHealthNumber) {
          return res.status(400).json({ msg: 'This PhilHealth number is already registered' });
        }
      }
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/patients
// @desc    Get all patients with basic formatting
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const patients = await Patient.findAll({
      order: [['lastName', 'ASC']],
    });

    // Calculate age for each patient and format the data
    const formattedPatients = patients.map(patient => {
      const calculateAge = (dateOfBirth) => {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        return age;
      };

      return {
        ...patient.toJSON(),
        age: calculateAge(patient.dateOfBirth),
        fullName: `${patient.firstName} ${patient.middleName ? patient.middleName + ' ' : ''}${patient.lastName}${patient.suffix ? ' ' + patient.suffix : ''}`,
        formattedAddress: [
          patient.houseNo,
          patient.street,
          patient.barangay,
          patient.city,
          patient.region
        ].filter(Boolean).join(', ') || patient.address
      };
    });

    res.json(formattedPatients);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/patients/unsorted
// @desc    Get all patients without a family assignment
// @access  Private
router.get('/unsorted', auth, async (req, res) => {
  try {
    console.log('Fetching unsorted patients');
    const unsortedPatients = await Patient.findAll({
      where: { familyId: null },
      order: [['lastName', 'ASC'], ['firstName', 'ASC']],
      attributes: ['id', 'firstName', 'lastName', 'gender', 'dateOfBirth', 'contactNumber', 'email', 'familyId']
    });
    
    console.log(`Found ${unsortedPatients.length} unsorted patients`);
    res.json(unsortedPatients);
  } catch (err) {
    console.error('Error fetching unsorted patients:', err.message);
    res.status(500).json({ 
      msg: 'Server Error',
      error: err.message
    });
  }
});

// @route   GET api/patients/me/profile
// @desc    Get current patient's profile information
// @access  Private (Patient only)
router.get('/me/profile', auth, async (req, res) => {
  try {
    console.log('Profile request - User:', req.user);
    console.log('Profile request - User role:', req.user?.role);
    
    // Get the patient ID from the authenticated user
    const patientId = req.user.patientId;
    
    // If the user is using admin token but trying to access patient profile,
    // check if they have a patientId parameter or check session for patient info
    if (!patientId && req.user.role === 'Admin') {
      console.log('Admin user accessing patient profile without patientId');
      return res.status(400).json({ 
        msg: 'Admin users must specify a patient ID or log in as a patient',
        hint: 'This endpoint is for patients to view their own profile'
      });
    }
    
    if (!patientId) {
      console.log('No patientId found in user:', req.user);
      return res.status(404).json({ msg: 'Patient profile not found - No patientId in token' });
    }

    console.log('Looking for patient with ID:', patientId);

    // First, try to get the patient without includes to see if the basic record exists
    const patient = await Patient.findByPk(patientId);

    if (!patient) {
      console.log('Patient not found with ID:', patientId);
      return res.status(404).json({ msg: 'Patient profile not found' });
    }

    console.log('Found patient:', patient.firstName, patient.lastName);

    // Now try to get with associations
    let patientWithAssociations;
    try {
      patientWithAssociations = await Patient.findByPk(patientId, {
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'email', 'contactNumber', 'role'],
            required: false
          },
          {
            model: Family,
            as: 'family',
            attributes: ['id', 'familyName', 'surname'],
            required: false
          }
        ]
      });
    } catch (associationError) {
      console.log('Association error, using basic patient data:', associationError.message);
      patientWithAssociations = patient;
    }

    // Calculate age from date of birth
    const calculateAge = (dateOfBirth) => {
      if (!dateOfBirth) return 'N/A';
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    };

    // Format the patient profile data
    const profileData = {
      // Personal Information
      firstName: patientWithAssociations.firstName || 'N/A',
      middleName: patientWithAssociations.middleName || 'N/A',
      lastName: patientWithAssociations.lastName || 'N/A',
      suffix: patientWithAssociations.suffix || 'N/A',
      fullName: `${patientWithAssociations.firstName} ${patientWithAssociations.middleName ? patientWithAssociations.middleName + ' ' : ''}${patientWithAssociations.lastName}${patientWithAssociations.suffix ? ' ' + patientWithAssociations.suffix : ''}`,
      
      // Demographics
      dateOfBirth: patientWithAssociations.dateOfBirth || 'N/A',
      age: calculateAge(patientWithAssociations.dateOfBirth),
      gender: patientWithAssociations.gender || 'N/A',
      civilStatus: patientWithAssociations.civilStatus || 'N/A',
      
      // Contact Information
      contactNumber: patientWithAssociations.contactNumber || 'N/A',
      email: patientWithAssociations.email || 'N/A',
      
      // Address Information
      houseNo: patientWithAssociations.houseNo || 'N/A',
      street: patientWithAssociations.street || 'N/A',
      barangay: patientWithAssociations.barangay || 'N/A',
      city: patientWithAssociations.city || 'N/A',
      region: patientWithAssociations.region || 'N/A',
      formattedAddress: [
        patientWithAssociations.houseNo,
        patientWithAssociations.street,
        patientWithAssociations.barangay,
        patientWithAssociations.city,
        patientWithAssociations.region
      ].filter(val => val && val !== 'N/A').join(', ') || 'N/A',
      
      // Medical Information
      bloodType: patientWithAssociations.bloodType || 'N/A',
      philHealthNumber: patientWithAssociations.philHealthNumber || 'N/A',
      medicalConditions: patientWithAssociations.medicalConditions || 'N/A',
      
      // Emergency Contact (if available)
      emergencyContact: patientWithAssociations.emergencyContact || 'N/A',
      
      // Family Information
      family: (patientWithAssociations.family && patientWithAssociations.family.familyName) ? {
        id: patientWithAssociations.family.id,
        familyName: patientWithAssociations.family.familyName,
        surname: patientWithAssociations.family.surname
      } : 'N/A',
      familyId: (patientWithAssociations.family && patientWithAssociations.family.id) ? patientWithAssociations.family.id : 'N/A',
      
      // Registration Information
      registrationDate: patientWithAssociations.createdAt ? new Date(patientWithAssociations.createdAt).toLocaleDateString() : 'N/A',
      lastUpdated: patientWithAssociations.updatedAt ? new Date(patientWithAssociations.updatedAt).toLocaleDateString() : 'N/A',
      
      // Patient ID
      patientId: patientWithAssociations.id,
      
      // Account Information
      userId: patientWithAssociations.userId || 'N/A',
      qrCode: patientWithAssociations.qrCode || 'N/A',
      isActive: patientWithAssociations.isActive || false,
      createdAt: patientWithAssociations.createdAt,
      updatedAt: patientWithAssociations.updatedAt
    };

    console.log('Sending profile data successfully');
    res.json(profileData);
  } catch (err) {
    console.error('Error fetching patient profile:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ 
      msg: 'Server Error',
      error: err.message
    });
  }
});

// @route   PUT api/patients/me/profile
// @desc    Update current patient's profile information
// @access  Private
router.put('/me/profile', auth, async (req, res) => {
  try {
    console.log('Profile update request - User:', req.user);
    console.log('Profile update request - Body:', req.body);

    // Validate that we have a patientId in the token
    if (!req.user || !req.user.patientId) {
      console.log('No patientId found in token for profile update');
      return res.status(404).json({ msg: 'Patient profile not found - No patientId in token' });
    }

    const patientId = req.user.patientId;
    console.log('Attempting to update patient profile for ID:', patientId);

    // Find the patient to update - simplified approach
    const patient = await Patient.findByPk(patientId);

    if (!patient) {
      console.log('Patient not found for update:', patientId);
      return res.status(404).json({ msg: 'Patient profile not found' });
    }

    console.log('Found patient for update:', patient.id, patient.firstName, patient.lastName);

    // Extract updateable fields from request body
    const {
      firstName,
      middleName,
      lastName,
      suffix,
      dateOfBirth,
      gender,
      civilStatus,
      email,
      contactNumber,
      houseNo,
      street,
      barangay,
      city,
      philHealthNumber,
      bloodType,
      medicalConditions
    } = req.body;

    // Calculate age if dateOfBirth is provided
    let age;
    if (dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // Update patient record - convert empty strings to null for cleaner data
    const updateData = {};
    const cleanValue = (value) => (value === '' || value === 'N/A') ? null : value;
    
    if (firstName !== undefined) updateData.firstName = cleanValue(firstName);
    if (middleName !== undefined) updateData.middleName = cleanValue(middleName);
    if (lastName !== undefined) updateData.lastName = cleanValue(lastName);
    if (suffix !== undefined) updateData.suffix = cleanValue(suffix);
    if (dateOfBirth !== undefined) updateData.dateOfBirth = cleanValue(dateOfBirth);
    if (age !== undefined) updateData.age = age;
    if (gender !== undefined) updateData.gender = cleanValue(gender);
    if (civilStatus !== undefined) updateData.civilStatus = cleanValue(civilStatus);
    if (contactNumber !== undefined) updateData.contactNumber = cleanValue(contactNumber);
    if (houseNo !== undefined) updateData.houseNo = cleanValue(houseNo);
    if (street !== undefined) updateData.street = cleanValue(street);
    if (barangay !== undefined) updateData.barangay = cleanValue(barangay);
    if (city !== undefined) updateData.city = cleanValue(city);
    if (philHealthNumber !== undefined) updateData.philHealthNumber = cleanValue(philHealthNumber);
    if (bloodType !== undefined) updateData.bloodType = cleanValue(bloodType);
    if (medicalConditions !== undefined) updateData.medicalConditions = cleanValue(medicalConditions);

    console.log('Update data:', updateData);

    // Update the patient
    try {
      await patient.update(updateData);
      console.log('Patient updated successfully');
    } catch (updateError) {
      console.error('Error updating patient:', updateError.message);
      throw new Error(`Failed to update patient: ${updateError.message}`);
    }

    // Update email in User table if provided
    if (email !== undefined) {
      try {
        const user = await User.findOne({ where: { id: patient.userId } });
        if (user) {
          await user.update({ email: email });
          console.log('User email updated successfully');
        }
      } catch (userUpdateError) {
        console.log('Error updating user email:', userUpdateError.message);
        // Continue anyway, the patient data was updated successfully
      }
    }

    // Fetch updated patient data - simplified approach
    const updatedPatient = await Patient.findByPk(patientId);
    
    // Get user email separately if needed
    let userEmail = updatedPatient.email;
    try {
      const user = await User.findOne({ where: { id: updatedPatient.userId } });
      if (user && user.email) {
        userEmail = user.email;
      }
    } catch (userFetchError) {
      console.log('Could not fetch user email:', userFetchError.message);
    }

    // Get family info separately if needed
    let familyInfo = null;
    try {
      if (updatedPatient.familyId) {
        const family = await Family.findByPk(updatedPatient.familyId);
        if (family) {
          familyInfo = {
            id: family.id,
            familyName: family.familyName
          };
        }
      }
    } catch (familyFetchError) {
      console.log('Could not fetch family info:', familyFetchError.message);
    }

    // Format the updated profile data (same as GET route)
    const formatDisplayValue = (value) => value || 'N/A';
    const formatNameValue = (value) => value || '';
    
    const profileData = {
      patientId: updatedPatient.id,
      firstName: formatDisplayValue(updatedPatient.firstName),
      middleName: formatDisplayValue(updatedPatient.middleName),
      lastName: formatDisplayValue(updatedPatient.lastName),
      suffix: formatDisplayValue(updatedPatient.suffix),
      fullName: `${formatNameValue(updatedPatient.firstName)} ${formatNameValue(updatedPatient.middleName) ? formatNameValue(updatedPatient.middleName) + ' ' : ''}${formatNameValue(updatedPatient.lastName)}${formatNameValue(updatedPatient.suffix) ? ' ' + formatNameValue(updatedPatient.suffix) : ''}`.trim(),
      dateOfBirth: updatedPatient.dateOfBirth ? new Date(updatedPatient.dateOfBirth).toISOString().split('T')[0] : 'N/A',
      age: updatedPatient.age || 'N/A',
      gender: formatDisplayValue(updatedPatient.gender),
      civilStatus: formatDisplayValue(updatedPatient.civilStatus),
      email: userEmail || 'N/A',
      contactNumber: formatDisplayValue(updatedPatient.contactNumber),
      houseNo: formatDisplayValue(updatedPatient.houseNo),
      street: formatDisplayValue(updatedPatient.street),
      barangay: formatDisplayValue(updatedPatient.barangay),
      city: formatDisplayValue(updatedPatient.city),
      address: `${updatedPatient.houseNo ? updatedPatient.houseNo + ' ' : ''}${updatedPatient.street ? updatedPatient.street + ', ' : ''}${updatedPatient.barangay ? updatedPatient.barangay + ', ' : ''}${updatedPatient.city || 'Metro Manila'}`,
      philHealthNumber: formatDisplayValue(updatedPatient.philHealthNumber),
      bloodType: formatDisplayValue(updatedPatient.bloodType),
      medicalConditions: formatDisplayValue(updatedPatient.medicalConditions),
      familyId: familyInfo?.id || updatedPatient.familyId || 'N/A',
      familyName: familyInfo?.familyName || 'N/A',
      registrationDate: updatedPatient.createdAt ? new Date(updatedPatient.createdAt).toLocaleDateString() : 'N/A',
      lastUpdated: new Date().toLocaleDateString()
    };

    console.log('Profile updated successfully:', profileData);
    res.json(profileData);
  } catch (err) {
    console.error('Error updating patient profile:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ 
      msg: 'Server Error',
      error: err.message
    });
  }
});

// @route   GET api/patients/:id
// @desc    Get patient by ID with formatted information
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);

    if (!patient) {
      return res.status(404).json({ msg: 'Patient not found' });
    }

    // Calculate age from date of birth
    const calculateAge = (dateOfBirth) => {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    };

    // Format the patient data for frontend
    const formattedPatient = {
      id: patient.id,
      firstName: patient.firstName,
      middleName: patient.middleName || '',
      lastName: patient.lastName,
      suffix: patient.suffix || '',
      fullName: `${patient.firstName} ${patient.middleName ? patient.middleName + ' ' : ''}${patient.lastName}${patient.suffix ? ' ' + patient.suffix : ''}`,
      dateOfBirth: patient.dateOfBirth,
      age: calculateAge(patient.dateOfBirth),
      gender: patient.gender,
      civilStatus: patient.civilStatus || 'Not specified',
      contactNumber: patient.contactNumber,
      email: patient.email,
      address: patient.address,
      detailedAddress: {
        houseNo: patient.houseNo || '',
        street: patient.street || '',
        barangay: patient.barangay || '',
        city: patient.city || '',
        region: patient.region || ''
      },
      formattedAddress: [
        patient.houseNo,
        patient.street,
        patient.barangay,
        patient.city,
        patient.region
      ].filter(Boolean).join(', ') || patient.address,
      bloodType: patient.bloodType,
      philHealthNumber: patient.philHealthNumber || 'Not provided',
      emergencyContact: patient.emergencyContact,
      familyId: patient.familyId,
      qrCode: patient.qrCode,
      isActive: patient.isActive,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt
    };

    res.json(formattedPatient);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/patients/:id
// @desc    Update a patient
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);

    if (!patient) {
      return res.status(404).json({ msg: 'Patient not found' });
    }

    await patient.update(req.body);
    res.json(patient);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/patients/:id
// @desc    Delete a patient
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);

    if (!patient) {
      return res.status(404).json({ msg: 'Patient not found' });
    }

    await patient.destroy();
    res.json({ msg: 'Patient removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/patients/autosort
// @desc    Automatically sort patients by surname into existing families
// @access  Private
router.post('/autosort', auth, async (req, res) => {
  try {
    const unsortedPatients = await Patient.findAll({
      where: { familyId: null },
      order: [['lastName', 'ASC']],
    });

    const results = {
      sorted: [],
      needsNewFamily: []
    };

    for (const patient of unsortedPatients) {
      // Find existing family with same surname
      const existingFamily = await Family.findOne({
        where: { surname: patient.lastName }
      });

      if (existingFamily) {
        // Assign patient to existing family
        await patient.update({ familyId: existingFamily.id });
        results.sorted.push({
          patient: {
            id: patient.id,
            firstName: patient.firstName,
            lastName: patient.lastName
          },
          assignedToFamily: existingFamily.familyName
        });
      } else {
        // Patient needs new family
        results.needsNewFamily.push({
          id: patient.id,
          firstName: patient.firstName,
          lastName: patient.lastName
        });
      }
    }

    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/patients/autosort/create-families
// @desc    Auto-create families for unmatched patients
// @access  Private
router.post('/autosort/create-families', auth, async (req, res) => {
  try {
    const { patientIds } = req.body;
    
    const results = [];
    
    for (const patientId of patientIds) {
      const patient = await Patient.findByPk(patientId);
      if (patient && !patient.familyId) {
        // Create new family with patient's surname
        const newFamily = await Family.create({
          familyName: `${patient.lastName} Family`,
          surname: patient.lastName,
          headOfFamily: `${patient.firstName} ${patient.lastName}`,
          contactNumber: patient.contactNumber || '',
          address: patient.address || ''
        });

        // Assign patient to new family
        await patient.update({ familyId: newFamily.id });
        
        results.push({
          patient: {
            id: patient.id,
            firstName: patient.firstName,
            lastName: patient.lastName
          },
          newFamily: {
            id: newFamily.id,
            familyName: newFamily.familyName
          }
        });
      }
    }

    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/patients/:id/assign-family
// @desc    Manually assign a patient to a family
// @access  Private
router.put('/:id/assign-family', auth, async (req, res) => {
  try {
    console.log('Assign family request:', {
      patientId: req.params.id,
      familyId: req.body.familyId
    });
    
    const { familyId } = req.body;
    
    if (!familyId) {
      return res.status(400).json({ msg: 'Family ID is required' });
    }

    const patient = await Patient.findByPk(req.params.id);
    console.log('Found patient:', patient ? patient.toJSON() : 'Not found');

    if (!patient) {
      return res.status(404).json({ msg: 'Patient not found' });
    }

    // Verify family exists
    const family = await Family.findByPk(familyId);
    console.log('Found family:', family ? family.toJSON() : 'Not found');
    
    if (!family) {
      return res.status(404).json({ msg: 'Family not found' });
    }

    await patient.update({ familyId });
    console.log('Patient updated successfully');
    
    // Get updated patient with family information
    const updatedPatient = await Patient.findByPk(req.params.id, {
      include: [{ model: Family, as: 'family' }]
    });
    
    res.json({ 
      msg: 'Patient assigned to family successfully', 
      patient: updatedPatient, 
      family 
    });
  } catch (err) {
    console.error('Error in assign-family:', err.message);
    res.status(500).json({ 
      msg: 'Server Error',
      error: err.message
    });
  }
});

// @route   POST api/patients/create-test-data
// @desc    Create test patients for development (DISABLED IN PRODUCTION)
// @access  Private (Admin only)
// NOTE: This endpoint is commented out to prevent accidental test data creation
/*
router.post('/create-test-data', auth, async (req, res) => {
  try {
    // Create test patients
    const testPatients = [
      {
        firstName: 'Johnny',
        lastName: 'Joestar',
        dateOfBirth: '1990-01-15',
        gender: 'Male',
        contactNumber: '09123456789'
      },
      {
        firstName: 'Jane',
        lastName: 'Doe', 
        dateOfBirth: '1985-03-22',
        gender: 'Female',
        contactNumber: '09987654321'
      },
      {
        firstName: 'Bob',
        lastName: 'Smith',
        dateOfBirth: '1992-07-10',
        gender: 'Male',
        contactNumber: '09111222333'
      }
    ];

    const createdPatients = [];
    for (const patientData of testPatients) {
      const patient = await Patient.create(patientData);
      createdPatients.push(patient);
    }

    res.json({ 
      msg: 'Test patients created successfully', 
      patients: createdPatients 
    });
  } catch (err) {
    console.error('Error creating test data:', err.message);
    res.status(500).send('Server Error');
  }
});
*/

module.exports = router;
