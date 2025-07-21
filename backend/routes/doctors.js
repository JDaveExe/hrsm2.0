const express = require('express');
const router = express.Router();

// @desc    Health check for doctor routes
// @route   GET /api/doctors/health
// @access  Public
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Doctor routes are working',
    timestamp: new Date().toISOString()
  });
});

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Public
router.get('/', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Get all doctors endpoint not implemented yet'
  });
});

// @desc    Get doctor by ID
// @route   GET /api/doctors/:id
// @access  Public
router.get('/:id', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Get doctor by ID endpoint not implemented yet'
  });
});

// @desc    Create new doctor
// @route   POST /api/doctors
// @access  Private/Admin
router.post('/', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Create doctor endpoint not implemented yet'
  });
});

// @desc    Update doctor
// @route   PUT /api/doctors/:id
// @access  Private
router.put('/:id', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Update doctor endpoint not implemented yet'
  });
});

module.exports = router;
