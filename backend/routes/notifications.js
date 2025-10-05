const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const smsService = require('../services/smsService');
const emailService = require('../services/emailService');

// Send single notification
router.post('/send-notification', async (req, res) => {
  try {
    const { patient, type, variables, options } = req.body;

    if (!patient) {
      return res.status(400).json({
        success: false,
        error: 'Patient information is required'
      });
    }

    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Notification type is required'
      });
    }

    const result = await notificationService.sendNotification(
      patient,
      type,
      variables || {},
      options || {}
    );

    res.json(result);
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Send bulk notifications
router.post('/send-bulk-notifications', async (req, res) => {
  try {
    const { patients, type, variables, options } = req.body;

    if (!Array.isArray(patients) || patients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Patients array is required and cannot be empty'
      });
    }

    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Notification type is required'
      });
    }

    const result = await notificationService.sendBulkNotifications(
      patients,
      type,
      variables || {},
      options || {}
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Send bulk notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Send SMS directly
router.post('/send-sms', async (req, res) => {
  try {
    const { recipient, message, options } = req.body;

    if (!recipient) {
      return res.status(400).json({
        success: false,
        error: 'Recipient phone number is required'
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message content is required'
      });
    }

    const result = await smsService.sendSMS(recipient, message, options || {});
    res.json(result);
  } catch (error) {
    console.error('Send SMS error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Send email directly
router.post('/send-email', async (req, res) => {
  try {
    const { recipient, subject, content, options } = req.body;

    if (!recipient) {
      return res.status(400).json({
        success: false,
        error: 'Recipient email address is required'
      });
    }

    if (!subject) {
      return res.status(400).json({
        success: false,
        error: 'Email subject is required'
      });
    }

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Email content is required'
      });
    }

    const result = await emailService.sendEmail(recipient, subject, content, options || {});
    res.json(result);
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Send appointment reminder
router.post('/send-appointment-reminder', async (req, res) => {
  try {
    const { patient, appointment } = req.body;

    if (!patient || !appointment) {
      return res.status(400).json({
        success: false,
        error: 'Patient and appointment information are required'
      });
    }

    const result = await notificationService.sendAppointmentReminder(patient, appointment);
    res.json(result);
  } catch (error) {
    console.error('Send appointment reminder error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Send vaccination reminder
router.post('/send-vaccination-reminder', async (req, res) => {
  try {
    const { patient, vaccine } = req.body;

    if (!patient || !vaccine) {
      return res.status(400).json({
        success: false,
        error: 'Patient and vaccine information are required'
      });
    }

    const result = await notificationService.sendVaccinationReminder(patient, vaccine);
    res.json(result);
  } catch (error) {
    console.error('Send vaccination reminder error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Send checkup reminder
router.post('/send-checkup-reminder', async (req, res) => {
  try {
    const { patient } = req.body;

    if (!patient) {
      return res.status(400).json({
        success: false,
        error: 'Patient information is required'
      });
    }

    const result = await notificationService.sendCheckupReminder(patient);
    res.json(result);
  } catch (error) {
    console.error('Send checkup reminder error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Send emergency alert
router.post('/send-emergency-alert', async (req, res) => {
  try {
    const { patient, message } = req.body;

    if (!patient || !message) {
      return res.status(400).json({
        success: false,
        error: 'Patient information and message are required'
      });
    }

    const result = await notificationService.sendEmergencyAlert(patient, message);
    res.json(result);
  } catch (error) {
    console.error('Send emergency alert error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get notification service status
router.get('/status', async (req, res) => {
  try {
    const status = notificationService.getStatus();
    res.json({
      success: true,
      status: status
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Test notification
router.post('/test-notification', async (req, res) => {
  try {
    const { contact, method } = req.body;

    if (!contact) {
      return res.status(400).json({
        success: false,
        error: 'Test contact (phone number or email) is required'
      });
    }

    const result = await notificationService.testNotification(contact, method || 'auto');
    res.json(result);
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get SMS service status
router.get('/sms-status', async (req, res) => {
  try {
    const status = smsService.getStatus();
    res.json({
      success: true,
      status: status
    });
  } catch (error) {
    console.error('Get SMS status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get email service status
router.get('/email-status', async (req, res) => {
  try {
    const status = emailService.getStatus();
    res.json({
      success: true,
      status: status
    });
  } catch (error) {
    console.error('Get email status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Webhook for SMS delivery status (Twilio callback)
router.post('/sms-delivery-status', (req, res) => {
  try {
    const { MessageSid, MessageStatus, To, From } = req.body;
    
    console.log('SMS Delivery Status Update:', {
      messageId: MessageSid,
      status: MessageStatus,
      to: To,
      from: From,
      timestamp: new Date()
    });

    // Here you can update your database with the delivery status
    // await updateSMSDeliveryStatus(MessageSid, MessageStatus);

    res.status(200).send('OK');
  } catch (error) {
    console.error('SMS delivery status webhook error:', error);
    res.status(500).send('Error processing webhook');
  }
});

// ========================================
// DATABASE NOTIFICATION ROUTES (NEW)
// For patient appointment notifications
// ========================================

// Restore database import now that routes are working
const { sequelize } = require('../config/database');

// GET /api/notifications/patient/:patientId - Get all notifications for a patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { status = 'all' } = req.query;
    
    let query = 'SELECT * FROM notifications WHERE patient_id = ?';
    let params = [patientId];
    
    // Filter by status if specified
    if (status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [result] = await sequelize.query(query, { replacements: params });
    
    res.json({
      success: true,
      notifications: result,
      count: result.length
    });
    
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// GET /api/notifications/patient/:patientId/unread - Get unread count only
router.get('/patient/:patientId/unread', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const [result] = await sequelize.query(
      'SELECT COUNT(*) as count FROM notifications WHERE patient_id = ? AND status IN (?, ?)',
      { replacements: [patientId, 'pending', 'unread'] }
    );
    
    res.json({
      success: true,
      unreadCount: parseInt(result[0].count)
    });
    
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error.message
    });
  }
});

// POST /api/notifications/create - Create a new notification (Admin only)
router.post('/create', async (req, res) => {
  try {
    const {
      patient_id,
      title,
      message,
      type = 'appointment_request',
      appointment_data = {}
    } = req.body;
    
    // Validate required fields
    if (!patient_id || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'patient_id, title, and message are required'
      });
    }
    
    // Verify patient exists
    const [patientCheck] = await sequelize.query('SELECT id FROM patients WHERE id = ?', { replacements: [patient_id] });
    if (patientCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    const [result] = await sequelize.query(
      `INSERT INTO notifications (patient_id, title, message, type, appointment_data) 
       VALUES (?, ?, ?, ?, ?)`,
      { 
        replacements: [patient_id, title, message, type, JSON.stringify(appointment_data)]
      }
    );
    
    // Get the created notification using the insertId
    const insertId = result.insertId || result;
    const [createdNotification] = await sequelize.query(
      'SELECT * FROM notifications WHERE id = ?',
      { 
        replacements: [insertId]
      }
    );
    
    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      notification: createdNotification[0]
    });
    
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
      error: error.message
    });
  }
});

// PUT /api/notifications/:id/status - Update notification status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'read', 'accepted', 'declined', 'expired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    const [result] = await sequelize.query(
      'UPDATE notifications SET status = ?, updated_at = NOW() WHERE id = ?',
      { replacements: [status, id] }
    );
    
    // Check if any rows were affected
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    // Get the updated notification
    const [updatedNotification] = await sequelize.query(
      'SELECT * FROM notifications WHERE id = ?',
      { replacements: [id] }
    );
    
    res.json({
      success: true,
      message: 'Notification status updated',
      notification: updatedNotification[0]
    });
    
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification',
      error: error.message
    });
  }
});

// TEMPORARY SETUP ROUTE - Remove after database is set up
router.get('/setup-table', async (req, res) => {
  try {
    console.log('🗄️ Creating notifications table...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'appointment_request',
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        appointment_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_notifications_patient_id (patient_id),
        INDEX idx_notifications_status (status)
      )
    `;
    
    await sequelize.query(createTableSQL);
    console.log('✅ Table created successfully');
    
    // Insert test data
    console.log('📝 Inserting test notifications...');
    const insertSQL = `
      INSERT IGNORE INTO notifications (patient_id, title, message, type, status, appointment_data) VALUES 
      (113, 'Appointment Request', 'You have a new appointment request for General Consultation on September 20, 2025 at 10:00 AM', 'appointment_request', 'pending', '{"date": "2025-09-20", "time": "10:00 AM", "service": "General Consultation", "notes": "Regular checkup"}'),
      (134, 'Follow-up Appointment', 'You have a follow-up appointment request for September 20, 2025 at 2:00 PM', 'appointment_request', 'pending', '{"date": "2025-09-20", "time": "2:00 PM", "service": "Follow-up Consultation", "notes": "Follow-up visit"}')
    `;
    
    await sequelize.query(insertSQL);
    console.log('✅ Test data inserted');
    
    // Verify data
    const [notifications] = await sequelize.query('SELECT * FROM notifications');
    
    res.json({ 
      success: true, 
      message: 'Notifications table created and test data inserted',
      notifications: notifications,
      count: notifications.length
    });
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// TEST ROUTE - Simple route to verify notifications API is working
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Notifications API is working - routes are accessible!',
    timestamp: new Date().toISOString(),
    routes: [
      'GET /api/notifications/test',
      'GET /api/notifications/setup-table',
      'GET /api/notifications/patient/:patientId',
      'POST /api/notifications/create'
    ]
  });
});

// SIMPLE PATIENT ROUTE TEST - without database
router.get('/patient/:patientId/simple', (req, res) => {
  const { patientId } = req.params;
  res.json({
    success: true,
    message: `Route working for patient ${patientId}`,
    patientId: patientId,
    mockNotifications: [
      {
        id: 1,
        patient_id: parseInt(patientId),
        title: 'Test Notification',
        message: 'This is a test notification to verify the route is working',
        status: 'pending',
        created_at: new Date().toISOString()
      }
    ]
  });
});

module.exports = router;
