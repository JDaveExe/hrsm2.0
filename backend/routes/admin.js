const express = require('express');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const router = express.Router();

// Import models
const User = require('../models/User');
const Patient = require('../models/Patient');
const Family = require('../models/Family');
const Appointment = require('../models/Appointment');

// Import middleware
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Import validation rules
const { registerValidation } = require('../utils/validators');

// Import utilities
const { generateQRCode, generateChecksum } = require('../utils/qrGenerator');

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
router.get('/dashboard', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get dashboard statistics
    const stats = {
      totalPatients: await Patient.countDocuments({ isActive: true }),
      totalFamilies: await Family.countDocuments({ isActive: true }),
      unsortedMembers: await Patient.countDocuments({ 
        familyId: null, 
        isActive: true 
      }),
      todaysCheckups: await Appointment.countDocuments({
        checkInDate: { $gte: today, $lt: tomorrow },
        status: { $nin: ['cancelled'] }
      }),
      totalUsers: await User.countDocuments({ isActive: true }),
      doctorsCount: await User.countDocuments({ 
        role: 'doctor', 
        isActive: true 
      }),
      patientsCount: await User.countDocuments({ 
        role: 'patient', 
        isActive: true 
      })
    };

    // Get recent registrations (last 7 days)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const recentRegistrations = await Patient.find({
      createdAt: { $gte: lastWeek }
    })
    .populate('userId', 'profile.firstName profile.lastName email')
    .sort({ createdAt: -1 })
    .limit(10);

    res.json({
      success: true,
      data: {
        statistics: stats,
        recentRegistrations
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
});

// @desc    Get all patients with pagination and filters
// @route   GET /api/admin/patients
// @access  Private (Admin only)
router.get('/patients', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filter = 'all' // all, sorted, unsorted
    } = req.query;

    // Build query
    let query = { isActive: true };
    
    // Apply filters
    if (filter === 'sorted') {
      query.familyId = { $ne: null };
    } else if (filter === 'unsorted') {
      query.familyId = null;
    }

    // Search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { patientId: searchRegex },
        { 'personalInfo.emergencyContact.name': searchRegex }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get patients with user and family data
    const patients = await Patient.find(query)
      .populate('userId', 'profile.firstName profile.lastName email profile.contactNumber')
      .populate('familyId', 'familyName familyId')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalPatients = await Patient.countDocuments(query);
    const totalPages = Math.ceil(totalPatients / parseInt(limit));

    res.json({
      success: true,
      data: {
        patients,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalPatients,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patients'
    });
  }
});

// @desc    Staff-assisted patient registration with family assignment
// @route   POST /api/admin/patients
// @access  Private (Admin only)
router.post('/patients', auth, roleCheck(['admin']), registerValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      username,
      email,
      password,
      firstName,
      lastName,
      contactNumber,
      address,
      dateOfBirth,
      gender,
      bloodType,
      emergencyContact,
      familyId, // Optional: existing family ID
      createNewFamily, // Boolean: create new family
      familyName, // Required if creating new family
      familyAddress // Optional: family address if creating new family
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user account
    const user = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'patient',
      profile: {
        firstName,
        lastName,
        contactNumber,
        address,
        dateOfBirth,
        gender
      }
    });

    await user.save();

    // Create patient profile
    const patient = new Patient({
      userId: user._id,
      personalInfo: {
        birthDate: dateOfBirth,
        gender,
        bloodType,
        emergencyContact
      },
      registrationType: 'admin', // Admin-created
      assignedBy: req.user.userId
    });

    // Generate QR code
    const qrCodeData = {
      patientId: patient.patientId,
      email: user.email,
      phone: contactNumber,
      name: `${firstName} ${lastName}`,
      checksum: generateChecksum(patient.patientId, user.email)
    };

    patient.qrCode = await generateQRCode(JSON.stringify(qrCodeData));
    patient.qrCodeGeneratedAt = new Date();

    await patient.save();

    // Handle family assignment
    let family = null;
    
    if (createNewFamily && familyName) {
      // Create new family
      family = new Family({
        familyName,
        headOfFamily: patient._id,
        members: [{
          patientId: patient._id,
          relationship: 'Head',
          isPrimary: true
        }],
        address: familyAddress || {
          street: address,
          barangay: 'Maybunga',
          city: 'Pasig',
          province: 'Metro Manila'
        }
      });

      await family.save();

      // Update patient with family ID
      patient.familyId = family._id;
      patient.assignedAt = new Date();
      await patient.save();

    } else if (familyId) {
      // Assign to existing family
      family = await Family.findById(familyId);
      if (!family) {
        return res.status(400).json({
          success: false,
          message: 'Selected family not found'
        });
      }

      // Add patient to family members
      family.members.push({
        patientId: patient._id,
        relationship: 'Member', // Can be updated later
        isPrimary: false
      });

      await family.save();

      // Update patient with family ID
      patient.familyId = family._id;
      patient.assignedAt = new Date();
      await patient.save();
    }
    // If neither option is selected, patient remains in "Unsorted Members"

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profile: user.profile
        },
        patient: {
          id: patient._id,
          patientId: patient.patientId,
          qrCode: patient.qrCode,
          familyAssigned: !!patient.familyId
        },
        family: family ? {
          id: family._id,
          familyId: family.familyId,
          familyName: family.familyName
        } : null
      }
    });

  } catch (error) {
    console.error('Admin patient registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during patient registration'
    });
  }
});

// @desc    Get unsorted members (patients without family assignment)
// @route   GET /api/admin/unsorted-members
// @access  Private (Admin only)
router.get('/unsorted-members', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = ''
    } = req.query;

    // Build query for unsorted members
    let query = { 
      familyId: null, 
      isActive: true 
    };

    // Search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { patientId: searchRegex },
        { 'personalInfo.emergencyContact.name': searchRegex }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get unsorted patients
    const unsortedPatients = await Patient.find(query)
      .populate('userId', 'profile.firstName profile.lastName email profile.contactNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const totalUnsorted = await Patient.countDocuments(query);
    const totalPages = Math.ceil(totalUnsorted / parseInt(limit));

    res.json({
      success: true,
      data: {
        unsortedPatients,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUnsorted,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get unsorted members error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unsorted members'
    });
  }
});

// @desc    Auto-sort patients by surname similarity
// @route   POST /api/admin/auto-sort
// @access  Private (Admin only)
router.post('/auto-sort', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const { patientIds, createNewFamilies = false } = req.body;

    if (!patientIds || !Array.isArray(patientIds)) {
      return res.status(400).json({
        success: false,
        message: 'Patient IDs array is required'
      });
    }

    // Get unsorted patients
    const patients = await Patient.find({
      _id: { $in: patientIds },
      familyId: null,
      isActive: true
    }).populate('userId', 'profile.firstName profile.lastName');

    if (patients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid unsorted patients found'
      });
    }

    const sortingResults = {
      matched: [],
      suggestions: [],
      errors: []
    };

    // Get all existing families for surname matching
    const existingFamilies = await Family.find({ isActive: true });

    for (const patient of patients) {
      const patientLastName = patient.userId.profile.lastName.toLowerCase().trim();
      
      // Normalize surname (remove spaces, handle common variations)
      const normalizedSurname = patientLastName
        .replace(/\s+/g, '')
        .replace(/dela/g, 'de la')
        .replace(/delos/g, 'de los');

      // Find potential family matches
      const potentialMatches = existingFamilies.filter(family => {
        const familyName = family.familyName.toLowerCase().trim();
        const normalizedFamilyName = familyName
          .replace(/\s+/g, '')
          .replace(/dela/g, 'de la')
          .replace(/delos/g, 'de los');

        // Check for exact match or surname inclusion
        return normalizedFamilyName.includes(normalizedSurname) || 
               normalizedSurname.includes(normalizedFamilyName.split(' ')[0]);
      });

      if (potentialMatches.length === 1) {
        // Exact match found - auto-assign
        const family = potentialMatches[0];
        
        // Add patient to family
        family.members.push({
          patientId: patient._id,
          relationship: 'Member',
          isPrimary: false
        });
        
        await family.save();

        // Update patient
        patient.familyId = family._id;
        patient.assignedBy = req.user.userId;
        patient.assignedAt = new Date();
        await patient.save();

        sortingResults.matched.push({
          patientId: patient._id,
          patientName: `${patient.userId.profile.firstName} ${patient.userId.profile.lastName}`,
          assignedToFamily: family.familyName,
          confidence: 'high'
        });

      } else if (potentialMatches.length > 1) {
        // Multiple matches - suggest to user
        sortingResults.suggestions.push({
          patientId: patient._id,
          patientName: `${patient.userId.profile.firstName} ${patient.userId.profile.lastName}`,
          potentialFamilies: potentialMatches.map(f => ({
            familyId: f._id,
            familyName: f.familyName,
            memberCount: f.members.length
          }))
        });

      } else if (createNewFamilies) {
        // No matches - create new family
        const newFamily = new Family({
          familyName: `${patient.userId.profile.lastName} Family`,
          headOfFamily: patient._id,
          members: [{
            patientId: patient._id,
            relationship: 'Head',
            isPrimary: true
          }],
          address: {
            street: patient.userId.profile.address || '',
            barangay: 'Maybunga',
            city: 'Pasig',
            province: 'Metro Manila'
          }
        });

        await newFamily.save();

        // Update patient
        patient.familyId = newFamily._id;
        patient.assignedBy = req.user.userId;
        patient.assignedAt = new Date();
        await patient.save();

        sortingResults.matched.push({
          patientId: patient._id,
          patientName: `${patient.userId.profile.firstName} ${patient.userId.profile.lastName}`,
          assignedToFamily: newFamily.familyName,
          confidence: 'new_family'
        });
      }
    }

    res.json({
      success: true,
      message: 'Auto-sort completed',
      data: sortingResults
    });

  } catch (error) {
    console.error('Auto-sort error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during auto-sort process'
    });
  }
});

// @desc    Manually assign patient to family
// @route   PUT /api/admin/patients/:id/assign-family
// @access  Private (Admin only)
router.put('/patients/:id/assign-family', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const { familyId, relationship = 'Member' } = req.body;

    // Find patient
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Find family
    const family = await Family.findById(familyId);
    if (!family) {
      return res.status(404).json({
        success: false,
        message: 'Family not found'
      });
    }

    // Remove from previous family if assigned
    if (patient.familyId) {
      const oldFamily = await Family.findById(patient.familyId);
      if (oldFamily) {
        oldFamily.members = oldFamily.members.filter(
          member => !member.patientId.equals(patient._id)
        );
        await oldFamily.save();
      }
    }

    // Add to new family
    family.members.push({
      patientId: patient._id,
      relationship,
      isPrimary: false
    });
    await family.save();

    // Update patient
    patient.familyId = family._id;
    patient.assignedBy = req.user.userId;
    patient.assignedAt = new Date();
    await patient.save();

    res.json({
      success: true,
      message: 'Patient assigned to family successfully',
      data: {
        patientId: patient._id,
        familyName: family.familyName,
        relationship
      }
    });

  } catch (error) {
    console.error('Assign family error:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning patient to family'
    });
  }
});

// @desc    Get all families with pagination
// @route   GET /api/admin/families
// @access  Private (Admin only)
router.get('/families', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = { isActive: true };

    // Search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { familyName: searchRegex },
        { familyId: searchRegex }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get families with member count
    const families = await Family.find(query)
      .populate('headOfFamily', 'patientId userId')
      .populate('members.patientId', 'patientId userId')
      .populate('members.patientId.userId', 'profile.firstName profile.lastName')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const totalFamilies = await Family.countDocuments(query);
    const totalPages = Math.ceil(totalFamilies / parseInt(limit));

    res.json({
      success: true,
      data: {
        families,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalFamilies,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get families error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching families'
    });
  }
});

// @desc    Create new family
// @route   POST /api/admin/families
// @access  Private (Admin only)
router.post('/families', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const {
      familyName,
      headOfFamilyId,
      address,
      contactNumber,
      emergencyContact,
      notes
    } = req.body;

    // Validate required fields
    if (!familyName || !headOfFamilyId) {
      return res.status(400).json({
        success: false,
        message: 'Family name and head of family are required'
      });
    }

    // Check if patient exists and is not already assigned to a family
    const patient = await Patient.findById(headOfFamilyId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    if (patient.familyId) {
      return res.status(400).json({
        success: false,
        message: 'Patient is already assigned to a family'
      });
    }

    // Create new family
    const family = new Family({
      familyName,
      headOfFamily: headOfFamilyId,
      members: [{
        patientId: headOfFamilyId,
        relationship: 'Head',
        isPrimary: true
      }],
      address: address || {
        barangay: 'Maybunga',
        city: 'Pasig',
        province: 'Metro Manila'
      },
      contactNumber,
      emergencyContact,
      notes
    });

    await family.save();

    // Update patient with family assignment
    patient.familyId = family._id;
    patient.assignedBy = req.user.userId;
    patient.assignedAt = new Date();
    await patient.save();

    // Populate family data for response
    await family.populate('headOfFamily', 'patientId userId');
    await family.populate('members.patientId', 'patientId userId');

    res.status(201).json({
      success: true,
      message: 'Family created successfully',
      data: family
    });

  } catch (error) {
    console.error('Create family error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating family'
    });
  }
});

// @desc    Update family information
// @route   PUT /api/admin/families/:id
// @access  Private (Admin only)
router.put('/families/:id', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const {
      familyName,
      address,
      contactNumber,
      emergencyContact,
      notes
    } = req.body;

    const family = await Family.findById(req.params.id);
    if (!family) {
      return res.status(404).json({
        success: false,
        message: 'Family not found'
      });
    }

    // Update family information
    if (familyName) family.familyName = familyName;
    if (address) family.address = { ...family.address, ...address };
    if (contactNumber) family.contactNumber = contactNumber;
    if (emergencyContact) family.emergencyContact = { ...family.emergencyContact, ...emergencyContact };
    if (notes !== undefined) family.notes = notes;

    await family.save();

    res.json({
      success: true,
      message: 'Family updated successfully',
      data: family
    });

  } catch (error) {
    console.error('Update family error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating family'
    });
  }
});

// @desc    Delete family (soft delete)
// @route   DELETE /api/admin/families/:id
// @access  Private (Admin only)
router.delete('/families/:id', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);
    if (!family) {
      return res.status(404).json({
        success: false,
        message: 'Family not found'
      });
    }

    // Remove family assignment from all members
    await Patient.updateMany(
      { familyId: family._id },
      { 
        familyId: null,
        assignedBy: null,
        assignedAt: null
      }
    );

    // Soft delete family
    family.isActive = false;
    await family.save();

    res.json({
      success: true,
      message: 'Family deleted successfully. All members moved to unsorted.'
    });

  } catch (error) {
    console.error('Delete family error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting family'
    });
  }
});

module.exports = router;
