const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');

// Get all medications with stock information
router.get('/', async (req, res) => {
  try {
    // Load the Medication model
    const MedicationModel = require('../models/Prescription.sequelize');
    const Medication = MedicationModel(sequelize);

    const medications = await Medication.findAll({
      where: { isActive: true },
      attributes: [
        'id', 'name', 'genericName', 'brandName', 'category', 
        'dosage', 'form', 'strength', 'unitsInStock', 'minimumStock', 
        'status', 'dosageInstructions', 'indication'
      ],
      order: [['name', 'ASC']]
    });

    res.json(medications);
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({ 
      error: 'Failed to fetch medications',
      message: error.message 
    });
  }
});

// Search medications
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }

    // Load the Medication model
    const MedicationModel = require('../models/Prescription.sequelize');
    const Medication = MedicationModel(sequelize);

    const medications = await Medication.findAll({
      where: {
        isActive: true,
        [require('sequelize').Op.or]: [
          { name: { [require('sequelize').Op.like]: `%${q}%` } },
          { genericName: { [require('sequelize').Op.like]: `%${q}%` } },
          { brandName: { [require('sequelize').Op.like]: `%${q}%` } }
        ]
      },
      attributes: [
        'id', 'name', 'genericName', 'brandName', 'category', 
        'dosage', 'form', 'strength', 'unitsInStock', 'minimumStock', 
        'status', 'dosageInstructions', 'indication'
      ],
      limit: 20,
      order: [['name', 'ASC']]
    });

    res.json(medications);
  } catch (error) {
    console.error('Error searching medications:', error);
    res.status(500).json({ 
      error: 'Failed to search medications',
      message: error.message 
    });
  }
});

module.exports = router;
