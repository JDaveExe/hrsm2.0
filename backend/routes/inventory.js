const express = require('express');
const router = express.Router();

// Import database models based on your database setup
// Using file-based storage for now, can be upgraded to Sequelize models later
const fs = require('fs').promises;
const path = require('path');

// Data file paths
const vaccinesDataPath = path.join(__dirname, '../data/vaccines.json');
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

// Helper function to write JSON data
const writeJsonFile = async (filePath, data) => {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
};

// VACCINE ROUTES

// Get all vaccines
router.get('/vaccines', async (req, res) => {
  try {
    const vaccines = await readJsonFile(vaccinesDataPath);
    res.json(vaccines);
  } catch (error) {
    console.error('Error fetching vaccines:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get vaccine by ID
router.get('/vaccines/:id', async (req, res) => {
  try {
    const vaccines = await readJsonFile(vaccinesDataPath);
    const vaccine = vaccines.find(v => v.id === parseInt(req.params.id));
    
    if (!vaccine) {
      return res.status(404).json({ error: 'Vaccine not found' });
    }
    
    res.json(vaccine);
  } catch (error) {
    console.error('Error fetching vaccine:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new vaccine
router.post('/vaccines', async (req, res) => {
  try {
    const vaccines = await readJsonFile(vaccinesDataPath);
    const newVaccine = {
      id: vaccines.length > 0 ? Math.max(...vaccines.map(v => v.id)) + 1 : 1,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    vaccines.push(newVaccine);
    await writeJsonFile(vaccinesDataPath, vaccines);
    
    res.status(201).json(newVaccine);
  } catch (error) {
    console.error('Error creating vaccine:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update vaccine
router.put('/vaccines/:id', async (req, res) => {
  try {
    const vaccines = await readJsonFile(vaccinesDataPath);
    const index = vaccines.findIndex(v => v.id === parseInt(req.params.id));
    
    if (index === -1) {
      return res.status(404).json({ error: 'Vaccine not found' });
    }
    
    vaccines[index] = {
      ...vaccines[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    await writeJsonFile(vaccinesDataPath, vaccines);
    res.json(vaccines[index]);
  } catch (error) {
    console.error('Error updating vaccine:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete vaccine
router.delete('/vaccines/:id', async (req, res) => {
  try {
    const vaccines = await readJsonFile(vaccinesDataPath);
    const index = vaccines.findIndex(v => v.id === parseInt(req.params.id));
    
    if (index === -1) {
      return res.status(404).json({ error: 'Vaccine not found' });
    }
    
    vaccines.splice(index, 1);
    await writeJsonFile(vaccinesDataPath, vaccines);
    
    res.json({ message: 'Vaccine deleted successfully' });
  } catch (error) {
    console.error('Error deleting vaccine:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// MEDICATION ROUTES

// Get all medications
router.get('/medications', async (req, res) => {
  try {
    const medications = await readJsonFile(medicationsDataPath);
    res.json(medications);
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get medication by ID
router.get('/medications/:id', async (req, res) => {
  try {
    const medications = await readJsonFile(medicationsDataPath);
    const medication = medications.find(m => m.id === parseInt(req.params.id));
    
    if (!medication) {
      return res.status(404).json({ error: 'Medication not found' });
    }
    
    res.json(medication);
  } catch (error) {
    console.error('Error fetching medication:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new medication
router.post('/medications', async (req, res) => {
  try {
    const medications = await readJsonFile(medicationsDataPath);
    const newMedication = {
      id: medications.length > 0 ? Math.max(...medications.map(m => m.id)) + 1 : 1,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    medications.push(newMedication);
    await writeJsonFile(medicationsDataPath, medications);
    
    res.status(201).json(newMedication);
  } catch (error) {
    console.error('Error creating medication:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update medication
router.put('/medications/:id', async (req, res) => {
  try {
    const medications = await readJsonFile(medicationsDataPath);
    const index = medications.findIndex(m => m.id === parseInt(req.params.id));
    
    if (index === -1) {
      return res.status(404).json({ error: 'Medication not found' });
    }
    
    medications[index] = {
      ...medications[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    await writeJsonFile(medicationsDataPath, medications);
    res.json(medications[index]);
  } catch (error) {
    console.error('Error updating medication:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete medication
router.delete('/medications/:id', async (req, res) => {
  try {
    const medications = await readJsonFile(medicationsDataPath);
    const index = medications.findIndex(m => m.id === parseInt(req.params.id));
    
    if (index === -1) {
      return res.status(404).json({ error: 'Medication not found' });
    }
    
    medications.splice(index, 1);
    await writeJsonFile(medicationsDataPath, medications);
    
    res.json({ message: 'Medication deleted successfully' });
  } catch (error) {
    console.error('Error deleting medication:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// INVENTORY STATISTICS

// Get inventory summary
router.get('/summary', async (req, res) => {
  try {
    const vaccines = await readJsonFile(vaccinesDataPath);
    const medications = await readJsonFile(medicationsDataPath);
    
    // Calculate vaccine statistics
    const vaccineStats = {
      total: vaccines.length,
      available: vaccines.filter(v => v.status === 'Available').length,
      lowStock: vaccines.filter(v => v.status === 'Low Stock').length,
      outOfStock: vaccines.filter(v => v.status === 'Out of Stock').length,
      expiring: vaccines.filter(v => {
        const expiryDate = new Date(v.expiryDate);
        const today = new Date();
        const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
        return expiryDate <= thirtyDaysFromNow && expiryDate > today;
      }).length,
      totalDoses: vaccines.reduce((sum, v) => sum + (v.dosesInStock || 0), 0)
    };
    
    // Calculate medication statistics
    const medicationStats = {
      total: medications.length,
      available: medications.filter(m => m.status === 'Available').length,
      lowStock: medications.filter(m => m.status === 'Low Stock').length,
      outOfStock: medications.filter(m => m.status === 'Out of Stock').length,
      expiring: medications.filter(m => {
        const expiryDate = new Date(m.expiryDate);
        const today = new Date();
        const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
        return expiryDate <= thirtyDaysFromNow && expiryDate > today;
      }).length,
      totalUnits: medications.reduce((sum, m) => sum + (m.unitsInStock || 0), 0)
    };
    
    res.json({
      vaccines: vaccineStats,
      medications: medicationStats
    });
  } catch (error) {
    console.error('Error fetching inventory summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update stock levels
router.post('/update-stock', async (req, res) => {
  try {
    const { type, id, quantity, operation } = req.body; // operation: 'add' or 'subtract'
    
    if (type === 'vaccine') {
      const vaccines = await readJsonFile(vaccinesDataPath);
      const index = vaccines.findIndex(v => v.id === parseInt(id));
      
      if (index === -1) {
        return res.status(404).json({ error: 'Vaccine not found' });
      }
      
      const currentStock = vaccines[index].dosesInStock || 0;
      vaccines[index].dosesInStock = operation === 'add' 
        ? currentStock + quantity 
        : Math.max(0, currentStock - quantity);
      
      // Update status based on stock level
      if (vaccines[index].dosesInStock === 0) {
        vaccines[index].status = 'Out of Stock';
      } else if (vaccines[index].dosesInStock <= vaccines[index].minimumStock) {
        vaccines[index].status = 'Low Stock';
      } else {
        vaccines[index].status = 'Available';
      }
      
      vaccines[index].updatedAt = new Date().toISOString();
      await writeJsonFile(vaccinesDataPath, vaccines);
      
      res.json(vaccines[index]);
    } else if (type === 'medication') {
      const medications = await readJsonFile(medicationsDataPath);
      const index = medications.findIndex(m => m.id === parseInt(id));
      
      if (index === -1) {
        return res.status(404).json({ error: 'Medication not found' });
      }
      
      const currentStock = medications[index].unitsInStock || 0;
      medications[index].unitsInStock = operation === 'add' 
        ? currentStock + quantity 
        : Math.max(0, currentStock - quantity);
      
      // Update status based on stock level
      if (medications[index].unitsInStock === 0) {
        medications[index].status = 'Out of Stock';
      } else if (medications[index].unitsInStock <= medications[index].minimumStock) {
        medications[index].status = 'Low Stock';
      } else {
        medications[index].status = 'Available';
      }
      
      medications[index].updatedAt = new Date().toISOString();
      await writeJsonFile(medicationsDataPath, medications);
      
      res.json(medications[index]);
    } else {
      res.status(400).json({ error: 'Invalid type. Must be "vaccine" or "medication"' });
    }
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
