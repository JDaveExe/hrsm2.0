const express = require('express');
const router = express.Router();
const { Vaccination, Patient } = require('../models');
const { authenticateToken: auth } = require('../middleware/auth');
const { Op, Sequelize } = require('sequelize');

// Get all vaccination records
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50, patientId, dateFrom, dateTo } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    
    if (patientId) {
      whereClause.patientId = patientId;
    }
    
    if (dateFrom && dateTo) {
      whereClause.administeredAt = {
        [Op.between]: [new Date(dateFrom), new Date(dateTo)]
      };
    }

    const vaccinations = await Vaccination.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['administeredAt', 'DESC']],
      include: ['Patient'] // Assuming there's a Patient association
    });

    res.json({
      vaccinations: vaccinations.rows,
      pagination: {
        total: vaccinations.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(vaccinations.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching vaccinations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get vaccination records for a specific patient
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const vaccinations = await Vaccination.findAll({
      where: { patientId },
      order: [['administeredAt', 'DESC']]
    });

    res.json(vaccinations);
  } catch (error) {
    console.error('Error fetching patient vaccinations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get vaccination statistics
router.get('/statistics', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const whereClause = {};
    if (startDate && endDate) {
      whereClause.administeredAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Total vaccinations count
    const totalVaccinations = await Vaccination.count({ where: whereClause });
    
    // Vaccinations by vaccine type
    const vaccinationsByType = await Vaccination.findAll({
      where: whereClause,
      attributes: [
        'vaccineName',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['vaccineName'],
      order: [[Sequelize.literal('count'), 'DESC']]
    });

    // Vaccinations by category
    const vaccinationsByCategory = await Vaccination.findAll({
      where: whereClause,
      attributes: [
        'category',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['category'],
      order: [[Sequelize.literal('count'), 'DESC']]
    });

    // Vaccinations by month (last 12 months)
    const monthlyVaccinations = await Vaccination.findAll({
      where: {
        ...whereClause,
        administeredAt: {
          [Op.gte]: new Date(new Date().setFullYear(new Date().getFullYear() - 1))
        }
      },
      attributes: [
        [Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('administeredAt')), 'month'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: [Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('administeredAt'))],
      order: [[Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('administeredAt')), 'ASC']]
    });

    res.json({
      totalVaccinations,
      vaccinationsByType,
      vaccinationsByCategory,
      monthlyVaccinations
    });
  } catch (error) {
    console.error('Error fetching vaccination statistics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new vaccination record
router.post('/', auth, async (req, res) => {
  try {
    const {
      patientId,
      sessionId,
      vaccineId,
      vaccineName,
      batchNumber,
      lotNumber,
      expiryDate,
      administrationSite,
      dose,
      administeredBy,
      notes,
      adverseReactions,
      administeredAt,
      category,
      administrationRoute
    } = req.body;

    // Validate required fields
    if (!patientId || !vaccineName || !administeredBy) {
      return res.status(400).json({
        message: 'Patient ID, vaccine name, and administered by are required'
      });
    }

    // Check if patient exists (you might want to validate this)
    // const patient = await Patient.findByPk(patientId);
    // if (!patient) {
    //   return res.status(404).json({ message: 'Patient not found' });
    // }

    // Validate vaccine stock availability before creating vaccination record
    if (vaccineId) {
      try {
        const path = require('path');
        const fs = require('fs').promises;
        
        const vaccinesDataPath = path.join(__dirname, '../data/vaccines.json');
        const vaccinesData = JSON.parse(await fs.readFile(vaccinesDataPath, 'utf8'));
        
        const vaccine = vaccinesData.find(v => v.id === parseInt(vaccineId));
        
        if (!vaccine) {
          return res.status(404).json({
            message: `Vaccine with ID ${vaccineId} not found in inventory`
          });
        }
        
        if (vaccine.dosesInStock <= 0) {
          return res.status(400).json({
            message: `Cannot complete vaccination: No stock available for ${vaccine.name}. Current stock: ${vaccine.dosesInStock}`,
            vaccine: vaccine.name,
            currentStock: vaccine.dosesInStock
          });
        }
      } catch (error) {
        console.error('Error checking vaccine inventory:', error);
        return res.status(500).json({
          message: 'Failed to check vaccine availability'
        });
      }
    }

    // First, update vaccine inventory (decrease stock) - do this BEFORE creating vaccination record
    if (vaccineId) {
      try {
        const path = require('path');
        const fs = require('fs').promises;
        
        // Read current vaccines data
        const vaccinesDataPath = path.join(__dirname, '../data/vaccines.json');
        const vaccinesData = JSON.parse(await fs.readFile(vaccinesDataPath, 'utf8'));
        
        // Find the vaccine to update
        const vaccineIndex = vaccinesData.findIndex(v => v.id === parseInt(vaccineId));
        
        if (vaccineIndex !== -1) {
          const vaccine = vaccinesData[vaccineIndex];
          
          // Check if there's sufficient stock (double-check even though we validated earlier)
          if (vaccine.dosesInStock <= 0) {
            return res.status(400).json({
              message: `Cannot complete vaccination: No stock available for ${vaccine.name}. Current stock: ${vaccine.dosesInStock}`
            });
          }
          
          // Reduce stock by 1
          vaccinesData[vaccineIndex].dosesInStock -= 1;
          vaccinesData[vaccineIndex].updatedAt = new Date().toISOString();
          
          // Write back to file
          await fs.writeFile(vaccinesDataPath, JSON.stringify(vaccinesData, null, 2));
          
          console.log(`Inventory updated: ${vaccine.name} stock reduced from ${vaccine.dosesInStock + 1} to ${vaccine.dosesInStock}`);
        } else {
          return res.status(404).json({
            message: `Vaccine with ID ${vaccineId} not found in inventory`
          });
        }
      } catch (inventoryError) {
        console.error('Error updating vaccine inventory:', inventoryError);
        return res.status(500).json({
          message: 'Failed to update vaccine inventory. Vaccination not completed.',
          error: inventoryError.message
        });
      }
    }

    // Create vaccination record AFTER successful inventory update
    const vaccination = await Vaccination.create({
      patientId,
      sessionId,
      vaccineId,
      vaccineName,
      batchNumber,
      lotNumber,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      administrationSite,
      dose: dose || '1',
      administeredBy,
      notes,
      adverseReactions: adverseReactions || 'none',
      administeredAt: administeredAt ? new Date(administeredAt) : new Date(),
      category,
      administrationRoute,
      createdBy: req.user.id // Assuming auth middleware adds user to req
    });

    res.status(201).json({
      message: 'Vaccination record created successfully',
      vaccination
    });
  } catch (error) {
    console.error('Error creating vaccination record:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a vaccination record
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.createdBy;
    
    const vaccination = await Vaccination.findByPk(id);
    if (!vaccination) {
      return res.status(404).json({ message: 'Vaccination record not found' });
    }

    await vaccination.update({
      ...updateData,
      updatedBy: req.user.id
    });

    res.json({
      message: 'Vaccination record updated successfully',
      vaccination
    });
  } catch (error) {
    console.error('Error updating vaccination record:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a vaccination record (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const vaccination = await Vaccination.findByPk(id);
    if (!vaccination) {
      return res.status(404).json({ message: 'Vaccination record not found' });
    }

    // Soft delete by setting deletedAt timestamp
    await vaccination.update({
      deletedAt: new Date(),
      deletedBy: req.user.id
    });

    res.json({ message: 'Vaccination record deleted successfully' });
  } catch (error) {
    console.error('Error deleting vaccination record:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get vaccination schedule/recommendations for a patient
router.get('/schedule/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // This would contain logic to determine what vaccines are due
    // based on patient age, previous vaccinations, and vaccination schedule
    
    // For now, return a sample schedule
    const schedule = {
      patientId,
      upcomingVaccinations: [
        {
          vaccine: 'Influenza Vaccine',
          dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
          category: 'Annual',
          priority: 'routine'
        },
        {
          vaccine: 'Tetanus Booster',
          dueDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          category: 'Adult',
          priority: 'routine'
        }
      ],
      overdueVaccinations: [],
      completedVaccinations: await Vaccination.findAll({
        where: { patientId },
        order: [['administeredAt', 'DESC']]
      })
    };

    res.json(schedule);
  } catch (error) {
    console.error('Error fetching vaccination schedule:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all vaccinations for today
router.get('/today', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const vaccinationsToday = await Vaccination.findAll({
      where: {
        administeredAt: {
          [Op.between]: [today, tomorrow]
        }
      },
      attributes: ['id', 'patientId', 'vaccineName', 'administeredAt'],
      order: [['administeredAt', 'DESC']]
    });

    res.json(vaccinationsToday);
  } catch (error) {
    console.error('Error fetching today\'s vaccinations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check if a specific patient has been vaccinated today
router.get('/check-today/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const vaccinationToday = await Vaccination.findOne({
      where: {
        patientId: parseInt(patientId),
        administeredAt: {
          [Op.between]: [today, tomorrow]
        }
      }
    });

    res.json({ 
      hasVaccinationToday: !!vaccinationToday,
      vaccination: vaccinationToday ? {
        id: vaccinationToday.id,
        vaccineName: vaccinationToday.vaccineName,
        administeredAt: vaccinationToday.administeredAt
      } : null
    });
  } catch (error) {
    console.error('Error checking today\'s vaccination:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;