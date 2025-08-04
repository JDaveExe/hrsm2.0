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

module.exports = router;
