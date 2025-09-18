const express = require('express');
const router = express.Router();
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

// Get detailed inventory analytics
router.get('/', async (req, res) => {
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

module.exports = router;
