const express = require('express');
const router = express.Router();
const { CheckInSession, User, sequelize } = require('../models');
const { Op } = require('sequelize');
const Sequelize = require('sequelize');
const { authenticateToken: auth } = require('../middleware/auth');

// Helper function to get date range
const getDateRange = (period = '30d') => {
  const end = new Date();
  const start = new Date();
  
  switch (period) {
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
    case '90d':
      start.setDate(start.getDate() - 90);
      break;
    case '1y':
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }
  
  return { start, end };
};

// Doctor Workload Distribution - Count of completed checkups per doctor
router.get('/doctor-workload', auth, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const { start, end } = getDateRange(period);

    const workloadData = await CheckInSession.findAll({
      attributes: [
        'assignedDoctor',
        [Sequelize.fn('COUNT', Sequelize.col('CheckInSession.id')), 'completedCheckups']
      ],
      include: [{
        model: User,
        as: 'assignedDoctorUser',
        attributes: ['id', 'firstName', 'lastName', 'username', 'position'],
        required: true
      }],
      where: {
        status: 'completed',
        completedAt: {
          [Op.between]: [start, end]
        },
        assignedDoctor: {
          [Op.not]: null
        }
      },
      group: ['assignedDoctor', 'assignedDoctorUser.id'],
      order: [[Sequelize.fn('COUNT', Sequelize.col('CheckInSession.id')), 'DESC']]
    });

    const formattedData = workloadData.map(item => ({
      doctorId: item.assignedDoctor,
      doctorName: `${item.assignedDoctorUser.firstName} ${item.assignedDoctorUser.lastName}`,
      position: item.assignedDoctorUser.position,
      completedCheckups: parseInt(item.dataValues.completedCheckups),
      percentage: 0 // Will be calculated on frontend
    }));

    // Calculate percentages
    const totalCheckups = formattedData.reduce((sum, item) => sum + item.completedCheckups, 0);
    formattedData.forEach(item => {
      item.percentage = totalCheckups > 0 ? ((item.completedCheckups / totalCheckups) * 100).toFixed(1) : 0;
    });

    res.json({
      success: true,
      data: formattedData,
      summary: {
        totalDoctors: formattedData.length,
        totalCheckups,
        period,
        dateRange: { start, end }
      }
    });
  } catch (error) {
    console.error('Error fetching doctor workload data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch doctor workload data',
      message: error.message 
    });
  }
});

// Doctor Patient Volume Trends - Daily/weekly trends per doctor
router.get('/doctor-volume-trends', auth, async (req, res) => {
  try {
    const { period = '30d', groupBy = 'day' } = req.query;
    const { start, end } = getDateRange(period);

    // Determine date format based on groupBy
    let dateFormat;
    switch (groupBy) {
      case 'hour':
        dateFormat = '%Y-%m-%d %H:00:00';
        break;
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        dateFormat = '%Y-%u'; // Year-Week
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const volumeData = await CheckInSession.findAll({
      attributes: [
        'assignedDoctor',
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('completedAt'), dateFormat), 'dateGroup'],
        [Sequelize.fn('COUNT', Sequelize.col('CheckInSession.id')), 'checkupCount']
      ],
      include: [{
        model: User,
        as: 'assignedDoctorUser',
        attributes: ['id', 'firstName', 'lastName', 'position'],
        required: true
      }],
      where: {
        status: 'completed',
        completedAt: {
          [Op.between]: [start, end]
        },
        assignedDoctor: {
          [Op.not]: null
        }
      },
      group: ['assignedDoctor', 'dateGroup', 'assignedDoctorUser.id'],
      order: ['dateGroup', 'assignedDoctor']
    });

    // Transform data into time series format
    const doctorMap = new Map();
    const allDates = new Set();

    volumeData.forEach(item => {
      const doctorId = item.assignedDoctor;
      const doctorName = `${item.assignedDoctorUser.firstName} ${item.assignedDoctorUser.lastName}`;
      const dateGroup = item.dataValues.dateGroup;
      const count = parseInt(item.dataValues.checkupCount);

      if (!doctorMap.has(doctorId)) {
        doctorMap.set(doctorId, {
          doctorId,
          doctorName,
          position: item.assignedDoctorUser.position,
          data: new Map()
        });
      }

      doctorMap.get(doctorId).data.set(dateGroup, count);
      allDates.add(dateGroup);
    });

    // Convert to array format suitable for charts
    const sortedDates = Array.from(allDates).sort();
    const doctors = Array.from(doctorMap.values()).map(doctor => ({
      ...doctor,
      data: sortedDates.map(date => ({
        date,
        count: doctor.data.get(date) || 0
      })),
      totalCheckups: Array.from(doctor.data.values()).reduce((sum, count) => sum + count, 0)
    }));

    res.json({
      success: true,
      data: {
        doctors,
        dates: sortedDates,
        summary: {
          totalDoctors: doctors.length,
          totalCheckups: doctors.reduce((sum, doctor) => sum + doctor.totalCheckups, 0),
          period,
          groupBy,
          dateRange: { start, end }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching doctor volume trends:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch doctor volume trends',
      message: error.message 
    });
  }
});

// Test endpoint without authentication for debugging
router.get('/test-workload', async (req, res) => {
  try {
    console.log('🧪 Testing doctor workload endpoint...');
    
    const { period = '30d' } = req.query;
    const { start: startDate, end: endDate } = getDateRange(period);
    
    const workloadData = await CheckInSession.findAll({
      where: {
        completedAt: {
          [Op.between]: [startDate, endDate]
        },
        status: 'completed'
      },
      include: [{
        model: User,
        as: 'assignedDoctorUser',
        attributes: ['id', 'firstName', 'lastName', 'role']
      }],
      attributes: ['id', 'assignedDoctor', 'completedAt']
    });

    console.log(`📊 Found ${workloadData.length} completed sessions`);
    
    res.json({
      success: true,
      data: workloadData.slice(0, 10), // Show first 10 for testing
      totalCount: workloadData.length,
      period,
      dateRange: { startDate, endDate }
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;