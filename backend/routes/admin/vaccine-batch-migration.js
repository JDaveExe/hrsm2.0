const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Import database connection and VaccineBatch model
const { sequelize } = require('../../config/database');

// Define VaccineBatch model
const VaccineBatch = require('../../models/VaccineBatch')(sequelize);

/**
 * Create batch records for vaccines from JSON data
 * POST /api/admin/migrate-vaccine-batches
 */
router.post('/migrate-vaccine-batches', async (req, res) => {
  const transaction = await VaccineBatch.sequelize.transaction();
  
  try {
    console.log('🚀 Starting vaccine batch migration...');
    
    // Read the prepared batch data
    const batchDataPath = path.join(__dirname, '../../vaccine-batch-creation-data.json');
    const batchData = JSON.parse(fs.readFileSync(batchDataPath, 'utf8'));
    
    console.log(`📋 Found ${batchData.totalBatches} batches to create`);
    
    // Check for existing batches to avoid duplicates
    const existingBatches = await VaccineBatch.findAll({
      attributes: ['vaccineId', 'batchNumber'],
      transaction
    });
    
    const existingBatchKeys = new Set(
      existingBatches.map(b => `${b.vaccineId}-${b.batchNumber}`)
    );
    
    // Filter out batches that already exist
    const newBatches = batchData.batches.filter(batch => {
      const key = `${batch.vaccineId}-${batch.batchNumber}`;
      return !existingBatchKeys.has(key);
    });
    
    console.log(`✅ ${newBatches.length} new batches to create (${batchData.totalBatches - newBatches.length} already exist)`);
    
    if (newBatches.length === 0) {
      await transaction.commit();
      return res.json({
        success: true,
        message: 'All vaccine batches already exist',
        created: 0,
        skipped: batchData.totalBatches
      });
    }
    
    // Create batch records
    const createdBatches = await VaccineBatch.bulkCreate(newBatches, {
      transaction,
      validate: true,
      returning: true
    });
    
    await transaction.commit();
    
    console.log(`✅ Successfully created ${createdBatches.length} vaccine batch records`);
    
    // Create summary report
    const summary = {
      timestamp: new Date().toISOString(),
      totalProcessed: batchData.totalBatches,
      created: createdBatches.length,
      skipped: batchData.totalBatches - newBatches.length,
      totalDoses: newBatches.reduce((sum, batch) => sum + batch.dosesReceived, 0),
      createdBatches: createdBatches.map(batch => ({
        id: batch.id,
        vaccineId: batch.vaccineId,
        vaccineName: batch.vaccineName,
        batchNumber: batch.batchNumber,
        dosesReceived: batch.dosesReceived,
        expiryDate: batch.expiryDate,
        status: batch.status
      }))
    };
    
    // Save migration report
    fs.writeFileSync(
      path.join(__dirname, '../../vaccine-batch-migration-report.json'),
      JSON.stringify(summary, null, 2)
    );
    
    res.json({
      success: true,
      message: `Successfully created ${createdBatches.length} vaccine batch records`,
      ...summary
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error migrating vaccine batches:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to migrate vaccine batches',
      error: error.message
    });
  }
});

/**
 * Get vaccine batch migration status
 * GET /api/admin/vaccine-batch-status
 */
router.get('/vaccine-batch-status', async (req, res) => {
  try {
    // Read vaccines.json
    const vaccinesPath = path.join(__dirname, '../data/vaccines.json');
    const vaccinesData = JSON.parse(fs.readFileSync(vaccinesPath, 'utf8'));
    
    // Get all vaccine batches
    const batches = await VaccineBatch.findAll({
      attributes: ['vaccineId', 'vaccineName', 'batchNumber', 'dosesRemaining', 'status', 'expiryDate']
    });
    
    // Analyze coverage
    const vaccinesWithStock = vaccinesData.filter(v => v.dosesInStock > 0);
    const vaccineBatches = batches.reduce((acc, batch) => {
      if (!acc[batch.vaccineId]) acc[batch.vaccineId] = [];
      acc[batch.vaccineId].push(batch);
      return acc;
    }, {});
    
    const analysis = vaccinesWithStock.map(vaccine => {
      const batches = vaccineBatches[vaccine.id] || [];
      const totalBatchStock = batches.reduce((sum, batch) => sum + batch.dosesRemaining, 0);
      
      return {
        vaccineId: vaccine.id,
        vaccineName: vaccine.name,
        jsonStock: vaccine.dosesInStock,
        batchCount: batches.length,
        batchStock: totalBatchStock,
        hasBatches: batches.length > 0,
        stockMatch: vaccine.dosesInStock === totalBatchStock,
        batches: batches
      };
    });
    
    const summary = {
      totalVaccines: vaccinesData.length,
      vaccinesWithStock: vaccinesWithStock.length,
      vaccinesWithBatches: analysis.filter(v => v.hasBatches).length,
      vaccinesWithoutBatches: analysis.filter(v => !v.hasBatches).length,
      stockMatches: analysis.filter(v => v.stockMatch).length,
      stockMismatches: analysis.filter(v => v.hasBatches && !v.stockMatch).length
    };
    
    res.json({
      success: true,
      summary,
      details: analysis
    });
    
  } catch (error) {
    console.error('❌ Error checking vaccine batch status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check vaccine batch status',
      error: error.message
    });
  }
});

module.exports = router;