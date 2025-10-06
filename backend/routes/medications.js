const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Data file path
const medicationsDataPath = path.join(__dirname, '../data/medications.json');

// Helper function to read JSON data
const readJsonFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
};

// Get all medications with stock information
router.get('/', async (req, res) => {
  try {
    // Read from JSON file instead of database
    const medications = await readJsonFile(medicationsDataPath);
    
    // Filter for active medications and format for frontend
    const activeMedications = medications
      .filter(med => med.isActive !== false && med.status === 'Available')
      .map(med => ({
        id: med.id,
        name: med.name,
        genericName: med.genericName,
        brandName: med.brandName,
        category: med.category,
        dosage: med.dosage,
        form: med.form,
        strength: med.strength,
        unitsInStock: med.unitsInStock,
        minimumStock: med.minimumStock,
        status: med.status,
        dosageInstructions: med.dosageInstructions,
        indication: med.indication
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    console.log(`📋 Loaded ${activeMedications.length} active medications from JSON file`);
    res.json(activeMedications);
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

    // Read from JSON file
    const medications = await readJsonFile(medicationsDataPath);
    
    const searchTerm = q.toLowerCase();
    const results = medications
      .filter(med => 
        med.isActive !== false && 
        med.status === 'Available' &&
        (
          med.name.toLowerCase().includes(searchTerm) ||
          med.genericName?.toLowerCase().includes(searchTerm) ||
          med.brandName?.toLowerCase().includes(searchTerm) ||
          med.category?.toLowerCase().includes(searchTerm)
        )
      )
      .map(med => ({
        id: med.id,
        name: med.name,
        genericName: med.genericName,
        brandName: med.brandName,
        category: med.category,
        dosage: med.dosage,
        form: med.form,
        strength: med.strength,
        unitsInStock: med.unitsInStock,
        minimumStock: med.minimumStock,
        status: med.status,
        dosageInstructions: med.dosageInstructions,
        indication: med.indication
      }))
      .slice(0, 20)
      .sort((a, b) => a.name.localeCompare(b.name));

    console.log(`🔍 Found ${results.length} medications matching "${q}"`);
    res.json(results);
  } catch (error) {
    console.error('Error searching medications:', error);
    res.status(500).json({ 
      error: 'Failed to search medications',
      message: error.message 
    });
  }
});

module.exports = router;
