const express = require('express');
const router = express.Router();
const { authenticateToken: auth } = require('../middleware/auth');

// Import database models based on your database setup
// Using file-based storage for now, can be upgraded to Sequelize models later
const fs = require('fs').promises;
const path = require('path');
const AuditLogger = require('../utils/auditLogger');

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
router.post('/vaccines', auth, async (req, res) => {
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
    
    // Log vaccine addition audit trail
    const vaccineForAudit = {
      id: newVaccine.id,
      vaccineName: newVaccine.name,
      dosesInStock: newVaccine.quantityInStock || newVaccine.dosesInStock || newVaccine.unitsInStock || 0,
      manufacturer: newVaccine.manufacturer || 'Unknown Manufacturer'
    };
    await AuditLogger.logVaccineAddition(req, vaccineForAudit);
    
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
    
    const oldVaccine = { ...vaccines[index] };
    vaccines[index] = {
      ...vaccines[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    await writeJsonFile(vaccinesDataPath, vaccines);
    
    // Log vaccine update audit
    await AuditLogger.logInventoryAction(req, 'vaccine_updated', `updated vaccine: ${vaccines[index].name}`, {
      itemType: 'vaccine',
      itemId: vaccines[index].id,
      itemName: vaccines[index].name,
      action: 'update',
      changes: req.body,
      oldData: oldVaccine,
      newData: vaccines[index]
    });
    
    res.json(vaccines[index]);
  } catch (error) {
    console.error('Error updating vaccine:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete vaccine
router.delete('/vaccines/:id', auth, async (req, res) => {
  try {
    const vaccines = await readJsonFile(vaccinesDataPath);
    const index = vaccines.findIndex(v => v.id === parseInt(req.params.id));
    
    if (index === -1) {
      return res.status(404).json({ error: 'Vaccine not found' });
    }
    
    const deletedVaccine = vaccines[index];
    vaccines.splice(index, 1);
    await writeJsonFile(vaccinesDataPath, vaccines);
    
    console.log(`✅ Deleted vaccine: ${deletedVaccine.name}`);
    
    // Audit logging for vaccine removal
    if (req.user) {
      Promise.resolve().then(async () => {
        try {
          await AuditLogger.logVaccineRemoval(req, deletedVaccine);
        } catch (error) {
          console.warn('Non-critical: Audit logging failed:', error.message);
        }
      });
    }
    
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
router.post('/medications', auth, async (req, res) => {
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
    
    // Log medication addition audit trail
    const medicationForAudit = {
      id: newMedication.id,
      medicationName: newMedication.name,
      brandName: newMedication.brandName || newMedication.brand || '',
      form: newMedication.dosageForm || newMedication.form || '',
      strength: newMedication.strength || '',
      unitsInStock: newMedication.quantityInStock || newMedication.unitsInStock || 0,
      manufacturer: newMedication.manufacturer || 'Unknown Manufacturer'
    };
    await AuditLogger.logMedicationAddition(req, medicationForAudit);
    
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
    
    const oldMedication = { ...medications[index] };
    medications[index] = {
      ...medications[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    await writeJsonFile(medicationsDataPath, medications);
    
    // Log medication update audit
    await AuditLogger.logInventoryAction(req, 'medication_updated', `updated medication: ${medications[index].name}`, {
      itemType: 'medication',
      itemId: medications[index].id,
      itemName: medications[index].name,
      action: 'update',
      changes: req.body,
      oldData: oldMedication,
      newData: medications[index]
    });
    
    res.json(medications[index]);
  } catch (error) {
    console.error('Error updating medication:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete medication
router.delete('/medications/:id', auth, async (req, res) => {
  try {
    const medications = await readJsonFile(medicationsDataPath);
    const index = medications.findIndex(m => m.id === parseInt(req.params.id));
    
    if (index === -1) {
      return res.status(404).json({ error: 'Medication not found' });
    }
    
    const deletedMedication = medications[index];
    medications.splice(index, 1);
    await writeJsonFile(medicationsDataPath, medications);
    
    console.log(`✅ Deleted medication: ${deletedMedication.name}`);
    
    // Audit logging for medication removal
    if (req.user) {
      Promise.resolve().then(async () => {
        try {
          await AuditLogger.logMedicationRemoval(req, deletedMedication);
        } catch (error) {
          console.warn('Non-critical: Audit logging failed:', error.message);
        }
      });
    }
    
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

// INVENTORY ANALYTICS ENDPOINTS

// Get detailed inventory analytics
router.get('/analytics', async (req, res) => {
  try {
    const vaccines = await readJsonFile(vaccinesDataPath);
    const medications = await readJsonFile(medicationsDataPath);
    
    // Category distribution for vaccines
    const vaccineCategoryStats = {};
    vaccines.forEach(v => {
      const category = v.category || 'Uncategorized';
      vaccineCategoryStats[category] = (vaccineCategoryStats[category] || 0) + 1;
    });
    
    // Category distribution for medications  
    const medicationCategoryStats = {};
    medications.forEach(m => {
      const category = m.category || 'Uncategorized';
      medicationCategoryStats[category] = (medicationCategoryStats[category] || 0) + 1;
    });
    
    // Stock status distribution
    const vaccineStockStatus = {
      'Available': vaccines.filter(v => v.status === 'Available').length,
      'Low Stock': vaccines.filter(v => v.status === 'Low Stock').length,
      'Out of Stock': vaccines.filter(v => v.status === 'Out of Stock').length
    };
    
    const medicationStockStatus = {
      'Available': medications.filter(m => m.status === 'Available').length,
      'Low Stock': medications.filter(m => m.status === 'Low Stock').length,
      'Out of Stock': medications.filter(m => m.status === 'Out of Stock').length
    };
    
    // Expiry analysis
    const today = new Date();
    const getExpiryCategory = (expiryDate) => {
      const expiry = new Date(expiryDate);
      const diffTime = expiry - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return 'Expired';
      if (diffDays <= 30) return 'Expiring Soon (≤30 days)';
      if (diffDays <= 90) return 'Expiring Medium (31-90 days)';
      return 'Good (>90 days)';
    };
    
    const vaccineExpiryAnalysis = {};
    vaccines.forEach(v => {
      if (v.expiryDate) {
        const category = getExpiryCategory(v.expiryDate);
        vaccineExpiryAnalysis[category] = (vaccineExpiryAnalysis[category] || 0) + 1;
      }
    });
    
    const medicationExpiryAnalysis = {};
    medications.forEach(m => {
      if (m.expiryDate) {
        const category = getExpiryCategory(m.expiryDate);
        medicationExpiryAnalysis[category] = (medicationExpiryAnalysis[category] || 0) + 1;
      }
    });
    
    // Top manufacturers
    const vaccineManufacturers = {};
    vaccines.forEach(v => {
      const manufacturer = v.manufacturer || 'Unknown';
      vaccineManufacturers[manufacturer] = (vaccineManufacturers[manufacturer] || 0) + 1;
    });
    
    const medicationManufacturers = {};
    medications.forEach(m => {
      const manufacturer = m.manufacturer || 'Unknown';
      medicationManufacturers[manufacturer] = (medicationManufacturers[manufacturer] || 0) + 1;
    });
    
    // Convert to sorted arrays for frontend charts
    const topVaccineManufacturers = Object.entries(vaccineManufacturers)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
      
    const topMedicationManufacturers = Object.entries(medicationManufacturers)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
    
    // Value analysis
    const vaccineValue = vaccines.reduce((sum, v) => {
      const stock = v.dosesInStock || 0;
      const cost = v.unitCost || 0;
      return sum + (stock * cost);
    }, 0);
    
    const medicationValue = medications.reduce((sum, m) => {
      const stock = m.unitsInStock || 0;
      const cost = m.unitCost || 0;
      return sum + (stock * cost);
    }, 0);
    
    res.json({
      categoryDistribution: {
        vaccines: vaccineCategoryStats,
        medications: medicationCategoryStats
      },
      stockStatus: {
        vaccines: vaccineStockStatus,
        medications: medicationStockStatus
      },
      expiryAnalysis: {
        vaccines: vaccineExpiryAnalysis,
        medications: medicationExpiryAnalysis
      },
      topManufacturers: {
        vaccines: topVaccineManufacturers,
        medications: topMedicationManufacturers
      },
      inventoryValue: {
        vaccines: Math.round(vaccineValue * 100) / 100,
        medications: Math.round(medicationValue * 100) / 100,
        total: Math.round((vaccineValue + medicationValue) * 100) / 100
      },
      summary: {
        totalItems: vaccines.length + medications.length,
        totalVaccines: vaccines.length,
        totalMedications: medications.length,
        criticalStockItems: vaccines.filter(v => v.status === 'Low Stock' || v.status === 'Out of Stock').length +
                           medications.filter(m => m.status === 'Low Stock' || m.status === 'Out of Stock').length
      }
    });
  } catch (error) {
    console.error('Error fetching inventory analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get low stock alerts
router.get('/alerts', async (req, res) => {
  try {
    const vaccines = await readJsonFile(vaccinesDataPath);
    const medications = await readJsonFile(medicationsDataPath);
    
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    const alerts = {
      lowStock: [],
      outOfStock: [],
      expiring: [],
      expired: []
    };
    
    // Process vaccines
    vaccines.forEach(vaccine => {
      if (vaccine.status === 'Out of Stock') {
        alerts.outOfStock.push({
          id: vaccine.id,
          name: vaccine.name,
          type: 'vaccine',
          category: vaccine.category,
          currentStock: vaccine.dosesInStock || 0,
          minimumStock: vaccine.minimumStock || 0
        });
      } else if (vaccine.status === 'Low Stock') {
        alerts.lowStock.push({
          id: vaccine.id,
          name: vaccine.name,
          type: 'vaccine',
          category: vaccine.category,
          currentStock: vaccine.dosesInStock || 0,
          minimumStock: vaccine.minimumStock || 0
        });
      }
      
      // Check expiry
      if (vaccine.expiryDate) {
        const expiryDate = new Date(vaccine.expiryDate);
        if (expiryDate < today) {
          alerts.expired.push({
            id: vaccine.id,
            name: vaccine.name,
            type: 'vaccine',
            expiryDate: vaccine.expiryDate,
            daysOverdue: Math.ceil((today - expiryDate) / (1000 * 60 * 60 * 24))
          });
        } else if (expiryDate <= thirtyDaysFromNow) {
          alerts.expiring.push({
            id: vaccine.id,
            name: vaccine.name,
            type: 'vaccine',
            expiryDate: vaccine.expiryDate,
            daysUntilExpiry: Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24))
          });
        }
      }
    });
    
    // Process medications
    medications.forEach(medication => {
      if (medication.status === 'Out of Stock') {
        alerts.outOfStock.push({
          id: medication.id,
          name: medication.name,
          type: 'medication',
          category: medication.category,
          currentStock: medication.unitsInStock || 0,
          minimumStock: medication.minimumStock || 0
        });
      } else if (medication.status === 'Low Stock') {
        alerts.lowStock.push({
          id: medication.id,
          name: medication.name,
          type: 'medication',
          category: medication.category,
          currentStock: medication.unitsInStock || 0,
          minimumStock: medication.minimumStock || 0
        });
      }
      
      // Check expiry
      if (medication.expiryDate) {
        const expiryDate = new Date(medication.expiryDate);
        if (expiryDate < today) {
          alerts.expired.push({
            id: medication.id,
            name: medication.name,
            type: 'medication',
            expiryDate: medication.expiryDate,
            daysOverdue: Math.ceil((today - expiryDate) / (1000 * 60 * 60 * 24))
          });
        } else if (expiryDate <= thirtyDaysFromNow) {
          alerts.expiring.push({
            id: medication.id,
            name: medication.name,
            type: 'medication',
            expiryDate: medication.expiryDate,
            daysUntilExpiry: Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24))
          });
        }
      }
    });
    
    res.json({
      alerts,
      summary: {
        totalAlerts: alerts.lowStock.length + alerts.outOfStock.length + alerts.expiring.length + alerts.expired.length,
        criticalAlerts: alerts.outOfStock.length + alerts.expired.length,
        warningAlerts: alerts.lowStock.length + alerts.expiring.length
      }
    });
  } catch (error) {
    console.error('Error fetching inventory alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get inventory usage trends (mock data for now, can be enhanced with real usage tracking)
router.get('/usage-trends', async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const days = parseInt(period);
    
    // Generate mock usage data for demonstration
    // In a real system, this would come from usage tracking/prescription data
    const trends = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      trends.push({
        date: date.toISOString().split('T')[0],
        vaccinesUsed: Math.floor(Math.random() * 10) + 1,
        medicationsUsed: Math.floor(Math.random() * 25) + 5,
        totalValue: Math.floor(Math.random() * 1000) + 200
      });
    }
    
    // Calculate totals and averages
    const totalVaccinesUsed = trends.reduce((sum, day) => sum + day.vaccinesUsed, 0);
    const totalMedicationsUsed = trends.reduce((sum, day) => sum + day.medicationsUsed, 0);
    const totalValue = trends.reduce((sum, day) => sum + day.totalValue, 0);
    
    res.json({
      trends,
      summary: {
        period: `${days} days`,
        totalVaccinesUsed,
        totalMedicationsUsed,
        totalValue,
        avgVaccinesPerDay: Math.round((totalVaccinesUsed / days) * 100) / 100,
        avgMedicationsPerDay: Math.round((totalMedicationsUsed / days) * 100) / 100,
        avgValuePerDay: Math.round((totalValue / days) * 100) / 100
      }
    });
  } catch (error) {
    console.error('Error fetching usage trends:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// MANAGEMENT DASHBOARD SPECIFIC ENDPOINTS

// Get vaccine usage distribution for Management Dashboard
router.get('/vaccine-usage-distribution', async (req, res) => {
  try {
    console.log('💉 Fetching vaccine usage distribution for Management Dashboard...');
    
    const vaccines = await readJsonFile(vaccinesDataPath);
    
    // Calculate usage based on stock depletion (initial stock - current stock)
    // Note: This assumes vaccines had higher initial stock values
    const usageData = vaccines
      .filter(vaccine => vaccine.isActive !== false) // Only active vaccines
      .map(vaccine => {
        // Calculate estimated usage (this is simplified - in real system would track actual usage)
        const minimumStock = vaccine.minimumStock || 0;
        const currentStock = vaccine.dosesInStock || 0;
        
        // Simple heuristic: vaccines with lower stock relative to minimum have been used more
        const stockRatio = currentStock / Math.max(minimumStock, 1);
        const estimatedUsage = stockRatio < 2 ? Math.floor(Math.random() * 50) + 10 : Math.floor(Math.random() * 20) + 5;
        
        return {
          vaccine_name: vaccine.name,
          usage_count: estimatedUsage,
          category: vaccine.category,
          manufacturer: vaccine.manufacturer,
          current_stock: currentStock,
          minimum_stock: minimumStock
        };
      })
      .sort((a, b) => b.usage_count - a.usage_count) // Sort by usage count descending
      .slice(0, 10); // Top 10 most used vaccines
    
    const totalUsage = usageData.reduce((sum, vaccine) => sum + vaccine.usage_count, 0);
    
    console.log('✅ Vaccine usage distribution processed:', {
      totalVaccines: vaccines.length,
      usageDataCount: usageData.length,
      totalUsage: totalUsage,
      topVaccines: usageData.slice(0, 3).map(v => `${v.vaccine_name}: ${v.usage_count}`)
    });
    
    res.json({
      usage: usageData,
      total_usage: totalUsage,
      vaccines_count: usageData.length
    });
  } catch (error) {
    console.error('❌ Error fetching vaccine usage distribution:', error);
    res.status(500).json({
      message: 'Error fetching vaccine usage distribution',
      error: error.message
    });
  }
});

// Get vaccine category distribution for Management Dashboard
router.get('/vaccine-category-distribution', async (req, res) => {
  try {
    console.log('📊 Fetching vaccine category distribution for Management Dashboard...');
    
    const vaccines = await readJsonFile(vaccinesDataPath);
    
    // Group vaccines by category and calculate distribution
    const categoryStats = {};
    const categoryUsage = {};
    
    vaccines
      .filter(vaccine => vaccine.isActive !== false) // Only active vaccines
      .forEach(vaccine => {
        const category = vaccine.category || 'Uncategorized';
        const currentStock = vaccine.dosesInStock || 0;
        const minimumStock = vaccine.minimumStock || 0;
        
        // Count vaccines per category
        categoryStats[category] = (categoryStats[category] || 0) + 1;
        
        // Calculate estimated usage per category (similar logic as above)
        const stockRatio = currentStock / Math.max(minimumStock, 1);
        const estimatedUsage = stockRatio < 2 ? Math.floor(Math.random() * 50) + 10 : Math.floor(Math.random() * 20) + 5;
        categoryUsage[category] = (categoryUsage[category] || 0) + estimatedUsage;
      });
    
    // Convert to array format for charts
    const categoryDistribution = Object.entries(categoryStats).map(([category, count]) => ({
      category,
      vaccine_count: count,
      usage_count: categoryUsage[category] || 0,
      percentage: ((count / vaccines.filter(v => v.isActive !== false).length) * 100).toFixed(1)
    }));
    
    // Sort by usage count
    const sortedDistribution = categoryDistribution.sort((a, b) => b.usage_count - a.usage_count);
    
    console.log('✅ Vaccine category distribution processed:', {
      totalCategories: sortedDistribution.length,
      categories: sortedDistribution.map(c => `${c.category}: ${c.vaccine_count} vaccines, ${c.usage_count} usage`)
    });
    
    res.json({
      categories: sortedDistribution.map(item => ({
        category: item.category,
        count: item.vaccine_count,
        percentage: parseFloat(item.percentage)
      })),
      total_categories: sortedDistribution.length
    });
  } catch (error) {
    console.error('❌ Error fetching vaccine category distribution:', error);
    res.status(500).json({
      message: 'Error fetching vaccine category distribution',
      error: error.message
    });
  }
});

module.exports = router;
