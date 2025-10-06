// VACCINE BATCH MANAGEMENT SYSTEM
// Safe implementation for vaccine batch tracking

const express = require('express');
const router = express.Router();
const { authenticateToken: auth } = require('../middleware/auth');
const { sequelize } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');
const AuditLogger = require('../utils/auditLogger');

// JSON vaccine data path
const vaccinesJsonPath = path.join(__dirname, '../data/vaccines.json');

// Initialize models (no associations since vaccines are in JSON)
let VaccineBatch;

async function initializeVaccineModels() {
    if (!VaccineBatch) {
        const VaccineBatchModel = require('../models/VaccineBatch');
        VaccineBatch = VaccineBatchModel(sequelize);
        
        // Create the table if it doesn't exist
        await VaccineBatch.sync({ alter: false });
    }
}

// Helper function to read vaccine JSON data
async function getVaccineFromJson(vaccineId) {
    try {
        const vaccinesData = await fs.readFile(vaccinesJsonPath, 'utf8');
        const vaccines = JSON.parse(vaccinesData);
        const vaccine = vaccines.find(v => v.id === parseInt(vaccineId));
        console.log('🔍 Looking for vaccine ID:', vaccineId, 'parsed as:', parseInt(vaccineId));
        console.log('🔍 Found vaccine:', vaccine ? vaccine.name : 'NOT FOUND');
        console.log('🔍 Total vaccines in file:', vaccines.length);
        return vaccine;
    } catch (error) {
        console.error('Error reading vaccines.json:', error);
        return null;
    }
}

// VACCINE BATCH MANAGEMENT ENDPOINTS

// Get all batches for a specific vaccine
router.get('/:vaccineId/batches', async (req, res) => {
    try {
        await initializeVaccineModels();
        
        const { vaccineId } = req.params;
        
        // Get batches without trying to include Vaccine model (since vaccines are in JSON)
        const batches = await VaccineBatch.findAll({
            where: { vaccineId },
            order: [['expiryDate', 'ASC']]
        });
        
        res.json(batches);
    } catch (error) {
        console.error('Error fetching vaccine batches:', error);
        res.status(500).json({ 
            error: 'Failed to fetch vaccine batches',
            message: error.message 
        });
    }
});

// Create new vaccine batch
router.post('/:vaccineId/batches', auth, async (req, res) => {
    try {
        await initializeVaccineModels();
        
        const { vaccineId } = req.params;
        const {
            batchNumber,
            lotNumber,
            dosesReceived,
            unitCost,
            expiryDate,
            manufacturer,
            supplier,
            purchaseOrderNumber,
            storageLocation,
            storageTemperature,
            notes
        } = req.body;
        
        // Validate required fields
        if (!batchNumber || !dosesReceived || !expiryDate) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['batchNumber', 'dosesReceived', 'expiryDate']
            });
        }
        
        // Check if vaccine exists in JSON
        const vaccine = await getVaccineFromJson(vaccineId);
        if (!vaccine) {
            return res.status(404).json({ error: 'Vaccine not found' });
        }
        
        console.log('Found vaccine:', vaccine.name, 'for ID:', vaccineId);
        
        // Ensure we have a vaccine name
        if (!vaccine.name) {
            console.error('❌ Vaccine found but name is missing:', vaccine);
            return res.status(400).json({ error: 'Vaccine data is incomplete - missing name' });
        }
        
        // Check if batch number already exists
        const existingBatch = await VaccineBatch.findOne({
            where: { batchNumber }
        });
        
        if (existingBatch) {
            return res.status(400).json({ 
                error: 'Batch number already exists',
                existingBatch: existingBatch.batchNumber
            });
        }
        
        // Create new vaccine batch
        const newBatch = await VaccineBatch.create({
            vaccineId,
            vaccineName: vaccine.name, // Add required vaccine name
            batchNumber,
            lotNumber,
            dosesReceived,
            dosesRemaining: dosesReceived, // Initially all doses are remaining
            unitCost: unitCost || vaccine.unitCost || 0,
            expiryDate,
            manufacturer: manufacturer || vaccine.manufacturer,
            supplier,
            purchaseOrderNumber,
            storageLocation,
            storageTemperature,
            notes,
            status: 'active',
            createdBy: req.user?.id || 1 // Default to system user
        });
        
        // Log stock addition audit trail - using consolidated stock_update
        const vaccineForAudit = {
            id: vaccine.id,
            vaccineName: vaccine.name,
            batchNumber: batchNumber
        };
        await AuditLogger.logStockUpdate(req, vaccineForAudit, 'added', dosesReceived, 'vaccine', {
            expiryDate: expiryDate,
            batchNumber: batchNumber
        });
        
        res.status(201).json({
            message: 'Vaccine batch created successfully',
            batch: newBatch
        });
        
    } catch (error) {
        console.error('Error creating vaccine batch:', error);
        res.status(500).json({ 
            error: 'Failed to create vaccine batch',
            message: error.message 
        });
    }
});

// Get vaccine with all batches (enhanced inventory view)
router.get('/:vaccineId/enhanced', async (req, res) => {
    try {
        await initializeVaccineModels();
        
        const { vaccineId } = req.params;
        
        // Get vaccine from JSON
        const vaccine = await getVaccineFromJson(vaccineId);
        if (!vaccine) {
            return res.status(404).json({ error: 'Vaccine not found' });
        }
        
        // Get all batches for this vaccine (including expired ones for display)
        const batches = await VaccineBatch.findAll({
            where: { 
                vaccineId: parseInt(vaccineId)
            },
            order: [['expiryDate', 'ASC']]
        });
        
        // Calculate enhanced data
        const totalDoses = batches.reduce((sum, batch) => sum + batch.dosesRemaining, 0);
        const nextExpiryDate = batches.length > 0 ? batches[0].expiryDate : null;
        const batchCount = batches.length;
        
        // Enhanced vaccine object
        const enhancedVaccine = {
            ...vaccine,
            totalDoses,
            nextExpiryDate,
            batchCount,
            batches: batches.map(batch => ({
                id: batch.id,
                batchNumber: batch.batchNumber,
                lotNumber: batch.lotNumber,
                dosesRemaining: batch.dosesRemaining,
                expiryDate: batch.expiryDate,
                unitCost: batch.unitCost,
                status: batch.status,
                daysUntilExpiry: Math.ceil((new Date(batch.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)),
                storageTemperature: batch.storageTemperature,
                isColdChain: batch.isColdChainCritical
            }))
        };
        
        res.json(enhancedVaccine);
        
    } catch (error) {
        console.error('Error fetching enhanced vaccine:', error);
        res.status(500).json({ 
            error: 'Failed to fetch enhanced vaccine data',
            message: error.message 
        });
    }
});

// Get expiring vaccine batches (default 30 days)
router.get('/expiring', async (req, res) => {
    try {
        await initializeVaccineModels();
        
        const daysAhead = 30;
        const expiringBatches = await VaccineBatch.getExpiringBatches(daysAhead);
        
        res.json({
            daysAhead,
            count: expiringBatches.length,
            batches: expiringBatches.map(batch => ({
                id: batch.id,
                batchNumber: batch.batchNumber,
                lotNumber: batch.lotNumber,
                vaccineName: batch.vaccine?.name,
                dosesRemaining: batch.dosesRemaining,
                expiryDate: batch.expiryDate,
                daysUntilExpiry: Math.ceil((new Date(batch.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)),
                storageTemperature: batch.storageTemperature,
                status: batch.status
            }))
        });
    } catch (error) {
        console.error('Error getting expiring vaccine batches:', error);
        res.status(500).json({ 
            error: 'Failed to get expiring vaccine batches',
            message: error.message 
        });
    }
});

// Get expiring vaccine batches
router.get('/expiring/:daysAhead', async (req, res) => {
    try {
        await initializeVaccineModels();
        
        const daysAhead = parseInt(req.params.daysAhead) || 30;
        const expiringBatches = await VaccineBatch.getExpiringBatches(daysAhead);
        
        res.json({
            daysAhead,
            count: expiringBatches.length,
            batches: expiringBatches.map(batch => ({
                id: batch.id,
                batchNumber: batch.batchNumber,
                lotNumber: batch.lotNumber,
                vaccineName: batch.vaccine?.name,
                dosesRemaining: batch.dosesRemaining,
                expiryDate: batch.expiryDate,
                daysUntilExpiry: batch.daysUntilExpiry,
                status: batch.status
            }))
        });
        
    } catch (error) {
        console.error('Error fetching expiring vaccine batches:', error);
        res.status(500).json({ 
            error: 'Failed to fetch expiring vaccine batches',
            message: error.message 
        });
    }
});

// VACCINE MIGRATION ENDPOINT (Migration already completed manually)
router.post('/migrate-to-batches', async (req, res) => {
    try {
        console.log('🚨 VACCINE BATCH MIGRATION REQUEST');
        
        await initializeVaccineModels();
        
        // Count existing batches
        const existingBatches = await VaccineBatch.count();
        
        if (existingBatches > 0) {
            return res.json({
                message: 'Vaccine migration already completed',
                totalVaccines: 24,
                migratedCount: existingBatches,
                errors: 0,
                errorDetails: [],
                status: 'Already migrated - migration completed manually'
            });
        } else {
            return res.json({
                message: 'No vaccine batches found - migration may be needed',
                totalVaccines: 0,
                migratedCount: 0,
                errors: 1,
                errorDetails: ['No vaccine batches found in database'],
                status: 'Migration needed'
            });
        }
        
    } catch (error) {
        console.error('Vaccine migration error:', error);
        res.status(500).json({ 
            error: 'Vaccine migration failed',
            message: error.message 
        });
    }
});

// VACCINE BATCH DISPOSAL ENDPOINT
router.delete('/:batchId/dispose', async (req, res) => {
    try {
        await initializeVaccineModels();
        
        const { batchId } = req.params;
        
        // Find the batch
        const batch = await VaccineBatch.findByPk(batchId);
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
        
        // Log disposal to audit trail
        await AuditLogger.logItemDisposal(req, batch, 'vaccine', 'expired');
        
        res.json({
            message: 'Batch disposed successfully',
            batchId: batch.id,
            batchNumber: batch.batchNumber,
            disposedAt: new Date()
        });
        
    } catch (error) {
        console.error('Error disposing vaccine batch:', error);
        res.status(500).json({ 
            error: 'Failed to dispose batch',
            message: error.message 
        });
    }
});

module.exports = router;