// MEDICATION BATCH SYSTEM - JSON FILE STORAGE
// Provides proper batch tracking with FIFO deduction

const express = require('express');
const router = express.Router();
const { authenticateToken: auth } = require('../middleware/auth');
const fs = require('fs').promises;
const path = require('path');
const AuditLogger = require('../utils/auditLogger');

// Data file paths
const medicationsDataPath = path.join(__dirname, '../data/medications.json');
const batchesDataPath = path.join(__dirname, '../data/medication_batches.json');

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

// Get all batches for a specific medication
router.get('/:medicationId/batches', async (req, res) => {
  try {
    const { medicationId } = req.params;
    const batches = await readJsonFile(batchesDataPath);
    
    // Filter batches for this medication and sort by expiry date (FIFO)
    const medicationBatches = batches
      .filter(batch => batch.medicationId === parseInt(medicationId))
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
    
    console.log(`📦 Found ${medicationBatches.length} batches for medication ${medicationId}`);
    res.json(medicationBatches);
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ 
      error: 'Failed to fetch batches',
      message: error.message 
    });
  }
});

// Get all batches (for management overview)
router.get('/', async (req, res) => {
  try {
    const batches = await readJsonFile(batchesDataPath);
    const medications = await readJsonFile(medicationsDataPath);
    
    // Enrich batches with medication info
    const enrichedBatches = batches.map(batch => {
      const medication = medications.find(m => m.id === batch.medicationId);
      return {
        ...batch,
        medicationName: medication?.name || 'Unknown',
        medicationForm: medication?.form || '',
        medicationStrength: medication?.strength || ''
      };
    }).sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
    
    console.log(`📦 Loaded ${enrichedBatches.length} total medication batches`);
    res.json(enrichedBatches);
  } catch (error) {
    console.error('Error fetching all batches:', error);
    res.status(500).json({ 
      error: 'Failed to fetch batches',
      message: error.message 
    });
  }
});

// Create new batch (add stock)
router.post('/:medicationId/batches', auth, async (req, res) => {
  try {
    const { medicationId } = req.params;
    const {
      batchNumber,
      quantityReceived,
      unitCost,
      expiryDate,
      supplier,
      purchaseOrderNumber,
      storageLocation,
      notes
    } = req.body;
    
    // Validate required fields
    if (!batchNumber || !quantityReceived || !expiryDate) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['batchNumber', 'quantityReceived', 'expiryDate']
      });
    }
    
    // Read data files
    const medications = await readJsonFile(medicationsDataPath);
    const batches = await readJsonFile(batchesDataPath);
    
    // Check if medication exists
    const medicationIndex = medications.findIndex(m => m.id === parseInt(medicationId));
    if (medicationIndex === -1) {
      return res.status(404).json({ error: 'Medication not found' });
    }
    
    const medication = medications[medicationIndex];
    
    // Check if batch number already exists for this medication
    const existingBatch = batches.find(
      b => b.medicationId === parseInt(medicationId) && b.batchNumber === batchNumber
    );
    
    if (existingBatch) {
      return res.status(400).json({ 
        error: 'Batch number already exists for this medication',
        existingBatch 
      });
    }
    
    // Create new batch
    const newBatch = {
      id: batches.length > 0 ? Math.max(...batches.map(b => b.id)) + 1 : 1,
      medicationId: parseInt(medicationId),
      batchNumber,
      quantityReceived: parseInt(quantityReceived),
      quantityRemaining: parseInt(quantityReceived),
      unitCost: parseFloat(unitCost) || medication.unitCost || 0,
      expiryDate,
      supplier: supplier || 'Unknown',
      purchaseOrderNumber: purchaseOrderNumber || null,
      storageLocation: storageLocation || 'Main Storage',
      notes: notes || '',
      status: 'active',
      receivedDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add batch to batches array
    batches.push(newBatch);
    
    // Update medication's total stock
    medication.unitsInStock = (medication.unitsInStock || 0) + parseInt(quantityReceived);
    medication.updatedAt = new Date().toISOString();
    
    // Remove legacy batch fields if they exist
    delete medication.batchNumber;
    
    medications[medicationIndex] = medication;
    
    // Save both files
    await writeJsonFile(batchesDataPath, batches);
    await writeJsonFile(medicationsDataPath, medications);
    
    console.log(`✅ Created batch ${batchNumber} for ${medication.name}: +${quantityReceived} units`);
    
    // Audit logging for stock addition - using consolidated stock_update
    if (req.user) {
      Promise.resolve().then(async () => {
        try {
          const medicationForAudit = {
            id: medication.id,
            medicationName: medication.name
          };
          await AuditLogger.logStockUpdate(req, medicationForAudit, 'added', parseInt(quantityReceived), 'medication', {
            expiryDate: expiryDate,
            batchNumber: batchNumber
          });
        } catch (error) {
          console.warn('Non-critical: Audit logging failed:', error.message);
        }
      });
    }
    
    res.status(201).json({
      message: 'Batch created successfully',
      batch: newBatch,
      medication: {
        id: medication.id,
        name: medication.name,
        unitsInStock: medication.unitsInStock
      }
    });
  } catch (error) {
    console.error('Error creating batch:', error);
    res.status(500).json({ 
      error: 'Failed to create batch',
      message: error.message 
    });
  }
});

module.exports = router;