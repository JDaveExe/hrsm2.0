const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const Patient = require('../models/Patient');
const User = require('../models/User');
const Family = require('../models/Family');
const { authenticateToken: auth } = require('../middleware/auth');
const { smartIdAllocation } = require('../middleware/smartIdAllocation');

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
