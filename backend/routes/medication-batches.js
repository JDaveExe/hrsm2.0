// SAFE BATCH SYSTEM IMPLEMENTATION
// Phase 1: Add MedicationBatch model and batch endpoints without breaking existing system

const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');

// Initialize models
let Medication, MedicationBatch;

async function initializeModels() {
    if (!Medication) {
        const MedicationModel = require('../models/Prescription.sequelize');
        Medication = MedicationModel(sequelize);
    }
    
    if (!MedicationBatch) {
        const MedicationBatchModel = require('../models/MedicationBatch');
        MedicationBatch = MedicationBatchModel(sequelize);
        
        // Create the table if it doesn't exist
        await MedicationBatch.sync({ alter: false }); // Don't alter existing table structure
    }
    
    // Set up associations if not already done
    if (!Medication.associations.batches) {
        Medication.hasMany(MedicationBatch, {
            foreignKey: 'medicationId',
            as: 'batches'
        });
        
        MedicationBatch.belongsTo(Medication, {
            foreignKey: 'medicationId',
            as: 'medication'
        });
    }
}

// BATCH MANAGEMENT ENDPOINTS (New, safe)

// Get all batches for a specific medication
router.get('/:medicationId/batches', async (req, res) => {
    try {
        await initializeModels();
        
        const { medicationId } = req.params;
        
        const batches = await MedicationBatch.findAll({
            where: { medicationId },
            order: [['expiryDate', 'ASC']],
            include: [{
                model: Medication,
                as: 'medication',
                attributes: ['name', 'strength', 'form']
            }]
        });
        
        res.json(batches);
    } catch (error) {
        console.error('Error fetching batches:', error);
        res.status(500).json({ 
            error: 'Failed to fetch batches',
            message: error.message 
        });
    }
});

// Create new batch (this will replace the old add-stock logic)
router.post('/:medicationId/batches', async (req, res) => {
    try {
        await initializeModels();
        
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
        
        // Check if medication exists
        const medication = await Medication.findByPk(medicationId);
        if (!medication) {
            return res.status(404).json({ error: 'Medication not found' });
        }
        
        // Check if batch number already exists
        const existingBatch = await MedicationBatch.findOne({
            where: { batchNumber }
        });
        
        if (existingBatch) {
            return res.status(400).json({ 
                error: 'Batch number already exists',
                existingBatch: existingBatch.batchNumber
            });
        }
        
        // Create new batch
        const newBatch = await MedicationBatch.create({
            medicationId,
            batchNumber,
            quantityReceived,
            quantityRemaining: quantityReceived, // Initially all quantity is remaining
            unitCost: unitCost || medication.unitCost || 0,
            expiryDate,
            supplier: supplier || medication.manufacturer,
            purchaseOrderNumber,
            storageLocation,
            notes,
            status: 'active',
            createdBy: req.user?.id || 1 // Default to system user
        });
        
        res.status(201).json({
            message: 'Batch created successfully',
            batch: newBatch
        });
        
    } catch (error) {
        console.error('Error creating batch:', error);
        res.status(500).json({ 
            error: 'Failed to create batch',
            message: error.message 
        });
    }
});

// Get medication with all batches (enhanced inventory view)
router.get('/:medicationId/enhanced', async (req, res) => {
    try {
        await initializeModels();
        
        const { medicationId } = req.params;
        
        const medication = await Medication.findByPk(medicationId, {
            include: [{
                model: MedicationBatch,
                as: 'batches',
                where: { status: 'active' },
                required: false,
                order: [['expiryDate', 'ASC']]
            }]
        });
        
        if (!medication) {
            return res.status(404).json({ error: 'Medication not found' });
        }
        
        // Calculate enhanced data
        const activeBatches = medication.batches || [];
        const totalStock = activeBatches.reduce((sum, batch) => sum + batch.quantityRemaining, 0);
        const nextExpiryDate = activeBatches.length > 0 ? activeBatches[0].expiryDate : null;
        const batchCount = activeBatches.length;
        
        // Enhanced medication object
        const enhancedMedication = {
            ...medication.toJSON(),
            totalStock,
            nextExpiryDate,
            batchCount,
            batches: activeBatches.map(batch => ({
                id: batch.id,
                batchNumber: batch.batchNumber,
                quantityRemaining: batch.quantityRemaining,
                expiryDate: batch.expiryDate,
                unitCost: batch.unitCost,
                status: batch.status,
                daysUntilExpiry: Math.ceil((new Date(batch.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
            }))
        };
        
        res.json(enhancedMedication);
        
    } catch (error) {
        console.error('Error fetching enhanced medication:', error);
        res.status(500).json({ 
            error: 'Failed to fetch enhanced medication data',
            message: error.message 
        });
    }
});

// MIGRATION ENDPOINT (Test only - will create batch records from existing data)
router.post('/migrate-to-batches', async (req, res) => {
    try {
        console.log('🚨 STARTING BATCH MIGRATION');
        
        await initializeModels();
        
        // Get all medications
        const medications = await Medication.findAll({
            where: { isActive: true }
        });
        
        let migratedCount = 0;
        let errors = [];
        
        for (const medication of medications) {
            try {
                // Check if this medication already has batches
                const existingBatches = await MedicationBatch.findAll({
                    where: { medicationId: medication.id }
                });
                
                if (existingBatches.length > 0) {
                    console.log(`Skipping ${medication.name} - already has batches`);
                    continue;
                }
                
                // Create batch from existing medication data
                if (medication.batchNumber && medication.unitsInStock) {
                    await MedicationBatch.create({
                        medicationId: medication.id,
                        batchNumber: medication.batchNumber,
                        quantityReceived: medication.unitsInStock,
                        quantityRemaining: medication.unitsInStock,
                        unitCost: medication.unitCost || 0,
                        expiryDate: medication.expiryDate,
                        supplier: medication.manufacturer || 'Unknown',
                        status: new Date(medication.expiryDate) < new Date() ? 'expired' : 'active',
                        notes: 'Migrated from legacy system',
                        createdBy: 1
                    });
                    
                    migratedCount++;
                    console.log(`✅ Migrated: ${medication.name}`);
                } else {
                    errors.push(`Missing data for ${medication.name}`);
                }
                
            } catch (error) {
                errors.push(`Error migrating ${medication.name}: ${error.message}`);
            }
        }
        
        res.json({
            message: 'Migration completed',
            totalMedications: medications.length,
            migratedCount,
            errors: errors.length,
            errorDetails: errors
        });
        
    } catch (error) {
        console.error('Migration error:', error);
        res.status(500).json({ 
            error: 'Migration failed',
            message: error.message 
        });
    }
});

// MEDICATION BATCH DISPOSAL ENDPOINT
router.delete('/:batchId/dispose', async (req, res) => {
    try {
        await initializeMedicationModels();
        
        const { batchId } = req.params;
        
        // Find the batch
        const batch = await MedicationBatch.findByPk(batchId);
        if (!batch) {
            return res.status(404).json({ error: 'Batch not found' });
        }
        
        // Check if batch is expired
        const isExpired = new Date(batch.expiryDate) < new Date();
        if (!isExpired) {
            return res.status(400).json({ 
                error: 'Cannot dispose non-expired batch',
                message: 'Only expired batches can be disposed'
            });
        }
        
        // Update batch status to disposed instead of deleting
        await batch.update({
            status: 'Disposed',
            disposedAt: new Date(),
            disposedBy: req.user?.id || 1, // Default to admin user
            notes: (batch.notes || '') + ` | Disposed on ${new Date().toLocaleDateString()}`
        });
        
        res.json({
            message: 'Batch disposed successfully',
            batchId: batch.id,
            batchNumber: batch.batchNumber,
            disposedAt: new Date()
        });
        
    } catch (error) {
        console.error('Error disposing medication batch:', error);
        res.status(500).json({ 
            error: 'Failed to dispose batch',
            message: error.message 
        });
    }
});

module.exports = router;