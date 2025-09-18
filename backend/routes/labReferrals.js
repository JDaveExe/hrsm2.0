const express = require('express');
const { authenticateToken: auth } = require('../middleware/auth');

const router = express.Router();

// Mock data for lab referrals (replace with actual database implementation)
let mockLabReferrals = [
  {
    id: 1,
    patientId: 40, // Josuke's Patient ID
    referralDate: '2025-09-07T10:30:00.000Z',
    referralType: 'laboratory',
    facility: 'Philippine General Hospital',
    department: 'Clinical Laboratory',
    specialist: 'Dr. Anna Garcia',
    reason: 'Complete Blood Count and Urinalysis for routine health checkup',
    clinicalHistory: 'Annual physical examination. Patient reports no symptoms.',
    currentMedications: 'None',
    testTypes: ['Complete Blood Count (CBC)', 'Urinalysis', 'Blood Chemistry'],
    urgency: 'routine',
    preferredDate: '2025-09-08',
    additionalNotes: 'Patient to fast 12 hours before blood draw',
    status: 'completed',
    referralId: 'REF-001235',
    referredBy: 'Dr. John Smith',
    hasResults: true,
    resultsUploaded: true,
    resultsFile: 'josuke_lab_results_090825.pdf',
    resultsDate: '2025-09-08T14:20:00.000Z',
    resultsNotes: 'All values within normal limits. Continue current health maintenance.',
    createdAt: '2025-09-07T10:30:00.000Z',
    updatedAt: '2025-09-08T14:20:00.000Z'
  },
  {
    id: 2,
    patientId: 113, // Kaleia's Patient ID
    referralDate: '2025-09-07T15:30:00.000Z',
    referralType: 'laboratory',
    facility: 'Asian Hospital and Medical Center',
    department: 'Clinical Laboratory',
    specialist: 'Dr. Maria Santos',
    reason: 'CBC and Blood Chemistry Panel - investigating fatigue',
    clinicalHistory: 'Patient presents with fatigue and dizziness. Need to rule out anemia and check metabolic panel.',
    currentMedications: 'None',
    testTypes: ['Complete Blood Count (CBC)', 'Comprehensive Metabolic Panel', 'Iron Studies'],
    urgency: 'routine',
    preferredDate: '2025-09-10',
    additionalNotes: 'Patient is fasting for 12 hours before blood draw',
    status: 'pending',
    referralId: 'REF-001236',
    referredBy: 'Dr. John Smith',
    hasResults: false,
    resultsUploaded: false,
    resultsFile: null,
    resultsDate: null,
    resultsNotes: null,
    createdAt: '2025-09-07T15:30:00.000Z',
    updatedAt: '2025-09-07T15:30:00.000Z'
  },
  {
    id: 3,
    patientId: 40, // Josuke's Patient ID
    referralDate: '2025-09-05T15:45:00.000Z',
    referralType: 'laboratory',
    facility: 'Makati Medical Center',
    department: 'Laboratory Services',
    specialist: 'Dr. Robert Chen',
    reason: 'Lipid profile and blood glucose monitoring',
    clinicalHistory: 'Follow-up for hypertension management.',
    currentMedications: 'Amlodipine 5mg daily',
    testTypes: ['Lipid Profile', 'Fasting Blood Glucose', 'HbA1c'],
    urgency: 'routine',
    preferredDate: '2025-09-06',
    additionalNotes: 'Patient should fast 12 hours before test',
    status: 'pending',
    referralId: 'REF-001237',
    referredBy: 'Dr. John Smith',
    hasResults: false,
    resultsUploaded: false,
    resultsFile: null,
    resultsDate: null,
    resultsNotes: null,
    createdAt: '2025-09-05T15:45:00.000Z',
    updatedAt: '2025-09-05T15:45:00.000Z'
  }
];

// @route   GET api/lab-referrals/patient/:patientId
// @desc    Get lab referrals for a specific patient
// @access  Private
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    
    console.log(`📋 Getting lab referrals for patient ID: ${patientId}`);
    
    // Filter referrals for the specific patient
    const patientReferrals = mockLabReferrals.filter(
      referral => referral.patientId.toString() === patientId.toString()
    );
    
    console.log(`📋 Found ${patientReferrals.length} lab referrals for patient ${patientId}`);
    
    res.json(patientReferrals);
  } catch (error) {
    console.error('Error fetching lab referrals:', error);
    res.status(500).json({ 
      msg: 'Server error while fetching lab referrals',
      error: error.message 
    });
  }
});

// @route   GET api/lab-referrals/:id
// @desc    Get a specific lab referral
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const referral = mockLabReferrals.find(ref => ref.id.toString() === id.toString());
    
    if (!referral) {
      return res.status(404).json({ msg: 'Lab referral not found' });
    }
    
    res.json(referral);
  } catch (error) {
    console.error('Error fetching lab referral:', error);
    res.status(500).json({ 
      msg: 'Server error while fetching lab referral',
      error: error.message 
    });
  }
});

// @route   POST api/lab-referrals
// @desc    Create a new lab referral
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      patientId,
      referralType,
      facility,
      department,
      reason,
      clinicalHistory,
      testTypes,
      urgency,
      referringDoctor
    } = req.body;
    
    // Generate new ID
    const newId = Math.max(...mockLabReferrals.map(r => r.id)) + 1;
    
    const newReferral = {
      id: newId,
      patientId: parseInt(patientId),
      referralDate: new Date().toISOString(),
      referralType: referralType || 'laboratory',
      facility,
      department,
      reason,
      clinicalHistory,
      testTypes: Array.isArray(testTypes) ? testTypes : [],
      urgency: urgency || 'routine',
      status: 'pending',
      hasResults: false,
      referringDoctor,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    mockLabReferrals.push(newReferral);
    
    console.log(`📋 Created new lab referral ID: ${newId} for patient ${patientId}`);
    
    res.status(201).json(newReferral);
  } catch (error) {
    console.error('Error creating lab referral:', error);
    res.status(500).json({ 
      msg: 'Server error while creating lab referral',
      error: error.message 
    });
  }
});

// @route   PUT api/lab-referrals/:id/results
// @desc    Update lab referral with results
// @access  Private
router.put('/:id/results', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { hasResults, resultsDate, resultsNotes } = req.body;
    
    const referralIndex = mockLabReferrals.findIndex(ref => ref.id.toString() === id.toString());
    
    if (referralIndex === -1) {
      return res.status(404).json({ msg: 'Lab referral not found' });
    }
    
    // Update the referral
    mockLabReferrals[referralIndex] = {
      ...mockLabReferrals[referralIndex],
      hasResults: hasResults || false,
      resultsDate: resultsDate || new Date().toISOString(),
      resultsNotes: resultsNotes || '',
      status: hasResults ? 'completed' : 'pending',
      updatedAt: new Date().toISOString()
    };
    
    console.log(`📋 Updated lab referral ID: ${id} with results status: ${hasResults}`);
    
    res.json(mockLabReferrals[referralIndex]);
  } catch (error) {
    console.error('Error updating lab referral results:', error);
    res.status(500).json({ 
      msg: 'Server error while updating lab referral results',
      error: error.message 
    });
  }
});

// @route   POST api/lab-referrals/submit/:patientId
// @desc    Submit new lab referral from admin form (with patient ID in URL)
// @access  Private
router.post('/submit/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    const referralData = req.body;
    const referredBy = req.user?.firstName && req.user?.lastName 
      ? `Dr. ${req.user.firstName} ${req.user.lastName}` 
      : 'Dr. Unknown';
    
    console.log('🔬 Submitting lab referral for patient:', patientId, 'Data:', referralData);
    
    // Generate new ID
    const newId = Math.max(...mockLabReferrals.map(ref => ref.id || 0)) + 1;
    
    const newReferral = {
      id: newId,
      patientId: parseInt(patientId),
      referralDate: new Date().toISOString(),
      referralType: referralData.referralType || 'laboratory',
      facility: referralData.facility || '',
      department: referralData.department || '',
      specialist: referralData.specialist || '',
      reason: referralData.reason || '',
      clinicalHistory: referralData.clinicalHistory || '',
      currentMedications: referralData.currentMedications || '',
      testTypes: referralData.testTypes || [],
      urgency: referralData.urgency || 'routine',
      preferredDate: referralData.preferredDate || '',
      additionalNotes: referralData.additionalNotes || '',
      status: 'pending',
      referralId: `REF-${Date.now().toString().slice(-6)}`,
      referredBy: referredBy,
      hasResults: false,
      resultsUploaded: false,
      resultsFile: null,
      resultsDate: null,
      resultsNotes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    mockLabReferrals.push(newReferral);
    
    console.log('✅ Lab referral submitted successfully:', newReferral.referralId);
    res.json({ 
      success: true, 
      message: 'Lab referral submitted successfully',
      referralId: newReferral.referralId,
      referral: newReferral
    });
  } catch (error) {
    console.error('Error submitting lab referral:', error);
    res.status(500).json({ 
      msg: 'Server error while submitting lab referral',
      error: error.message 
    });
  }
});

// @route   POST api/lab-referrals/submit
// @desc    Submit new lab referral from admin form
// @access  Private
router.post('/submit', auth, async (req, res) => {
  try {
    const { patientId, referralData, referredBy } = req.body;
    console.log('🔬 Submitting lab referral:', { patientId, referralData, referredBy });
    
    // Generate new ID
    const newId = Math.max(...mockLabReferrals.map(ref => ref.id || 0)) + 1;
    
    const newReferral = {
      id: newId,
      patientId: parseInt(patientId),
      referralDate: new Date().toISOString(),
      referralType: referralData.referralType || 'laboratory',
      facility: referralData.facility || '',
      department: referralData.department || '',
      specialist: referralData.specialist || '',
      reason: referralData.reason || '',
      clinicalHistory: referralData.clinicalHistory || '',
      currentMedications: referralData.currentMedications || '',
      urgency: referralData.urgency || 'routine',
      preferredDate: referralData.preferredDate || '',
      additionalNotes: referralData.additionalNotes || '',
      status: 'pending',
      referralId: `REF-${Date.now().toString().slice(-6)}`,
      referredBy: referredBy || 'Dr. Unknown',
      hasResults: false,
      resultsUploaded: false,
      resultsFile: null,
      resultsDate: null,
      resultsNotes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    mockLabReferrals.push(newReferral);
    
    console.log('✅ Lab referral submitted successfully:', newReferral.referralId);
    res.json({ 
      success: true, 
      referralId: newReferral.referralId,
      referral: newReferral
    });
  } catch (error) {
    console.error('Error submitting lab referral:', error);
    res.status(500).json({ 
      msg: 'Server error while submitting lab referral',
      error: error.message 
    });
  }
});

// @route   GET api/lab-referrals/all
// @desc    Get all lab referrals (for admin history view)
// @access  Private
router.get('/all', auth, async (req, res) => {
  try {
    console.log('📋 Getting all lab referrals for admin');
    
    // Sort by referral date, most recent first
    const allReferrals = [...mockLabReferrals].sort((a, b) => new Date(b.referralDate) - new Date(a.referralDate));
    
    res.json(allReferrals);
  } catch (error) {
    console.error('Error fetching all lab referrals:', error);
    res.status(500).json({ 
      msg: 'Server error while fetching lab referrals',
      error: error.message 
    });
  }
});

module.exports = router;
