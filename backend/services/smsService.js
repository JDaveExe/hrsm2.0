const twilio = require('twilio');

class SMSService {
  constructor() {
    this.client = null;
    this.isConfigured = false;
    this.isProduction = process.env.NODE_ENV === 'production';
    this.useMockMode = process.env.ENABLE_SMS_MOCK === 'true';
    this.provider = process.env.SMS_PROVIDER || 'twilio';
    
    this.initializeTwilio();
  }

  initializeTwilio() {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;

      // Check if mock mode is explicitly enabled
      if (this.useMockMode) {
        console.log('⚠️  SMS Mock Mode enabled - SMS will be simulated (not sent)');
        this.provider = 'mock';
        return;
      }

      if (accountSid && authToken && fromNumber) {
        // Validate credentials are not placeholder values
        if (accountSid === 'your_twilio_account_sid_here' || 
            authToken === 'your_twilio_auth_token_here' ||
            fromNumber === '+1234567890') {
          console.log('⚠️  Twilio credentials are placeholder values, using mock SMS service');
          console.log('⚠️  Please update your .env file with real Twilio credentials');
          this.provider = 'mock';
          return;
        }

        this.client = twilio(accountSid, authToken);
        this.fromNumber = fromNumber;
        this.isConfigured = true;
        this.provider = 'twilio';
        console.log('✅ Twilio SMS service initialized successfully');
        console.log(`📱 SMS Provider: ${this.provider} | From Number: ${this.fromNumber}`);
      } else {
        console.log('⚠️  Twilio credentials not found, using mock SMS service');
        console.log('⚠️  Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env');
        this.provider = 'mock';
      }
    } catch (error) {
      console.error('❌ Failed to initialize Twilio:', error.message);
      this.provider = 'mock';
    }
  }

  // Format Philippine phone numbers
  formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }

    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // Philippine number validation and formatting
    if (cleaned.startsWith('639') && cleaned.length === 12) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('09') && cleaned.length === 11) {
      return `+63${cleaned.substring(1)}`;
    } else if (cleaned.startsWith('9') && cleaned.length === 10) {
      return `+63${cleaned}`;
    } else if (cleaned.length === 10) {
      return `+639${cleaned}`;
    }

    throw new Error('Invalid Philippine phone number format');
  }

  // Validate phone number
  isValidPhilippineNumber(phoneNumber) {
    try {
      const formatted = this.formatPhoneNumber(phoneNumber);
      return formatted.match(/^\+639\d{9}$/);
    } catch {
      return false;
    }
  }

  // Send SMS using Twilio
  async sendSMSWithTwilio(to, message, options = {}) {
    try {
      const formattedNumber = this.formatPhoneNumber(to);
      
      const messageOptions = {
        body: message,
        from: this.fromNumber,
        to: formattedNumber,
        ...options
      };

      const result = await this.client.messages.create(messageOptions);
      
      return {
        success: true,
        messageId: result.sid,
        status: result.status,
        to: result.to,
        from: result.from,
        provider: 'twilio',
        cost: result.price,
        direction: result.direction,
        dateSent: result.dateCreated
      };
    } catch (error) {
      console.error('Twilio SMS Error:', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  // Mock SMS for development
  async sendMockSMS(to, message, options = {}) {
    return new Promise((resolve) => {
      // Simulate network delay
      const delay = Math.random() * 2000 + 1000; // 1-3 seconds
      
      setTimeout(() => {
        const formattedNumber = this.formatPhoneNumber(to);
        const mockId = `MOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Simulate 5% failure rate
        const shouldFail = Math.random() < 0.05;
        
        if (shouldFail) {
          console.log(`📱 [MOCK SMS - FAILED] To: ${formattedNumber}, Message: ${message}`);
          resolve({
            success: false,
            error: 'Mock SMS delivery failed',
            provider: 'mock'
          });
        } else {
          console.log(`📱 [MOCK SMS - SUCCESS] To: ${formattedNumber}, Message: ${message}`);
          resolve({
            success: true,
            messageId: mockId,
            status: 'delivered',
            to: formattedNumber,
            from: '+15551234567',
            provider: 'mock',
            cost: '$0.075',
            direction: 'outbound-api',
            dateSent: new Date()
          });
        }
      }, delay);
    });
  }

  // Main send SMS method
  async sendSMS(recipient, message, options = {}) {
    try {
      // Validate inputs
      if (!recipient) {
        throw new Error('Recipient phone number is required');
      }

      if (!message || message.trim().length === 0) {
        throw new Error('Message content is required');
      }

      // Check message length (Twilio limit is 1600 characters)
      if (message.length > 1600) {
        throw new Error('Message too long. Maximum 1600 characters allowed.');
      }

      // Validate phone number format
      if (!this.isValidPhilippineNumber(recipient)) {
        throw new Error('Invalid Philippine phone number format');
      }

      const messageData = {
        recipient: this.formatPhoneNumber(recipient),
        message: message.trim(),
        urgency: options.urgency || 'normal',
        patientId: options.patientId || null,
        patientName: options.patientName || null,
        type: options.type || 'general',
        sentAt: new Date(),
        provider: this.provider
      };

      let result;

      if (this.provider === 'twilio' && this.isConfigured) {
        try {
          result = await this.sendSMSWithTwilio(recipient, message, options);
        } catch (error) {
          console.warn('Twilio failed, falling back to mock mode:', error.message);
          result = await this.sendMockSMS(recipient, message, options);
          result.fallback = true;
        }
      } else {
        result = await this.sendMockSMS(recipient, message, options);
      }

      // Log the SMS attempt (you can save this to database later)
      console.log('SMS Sent:', {
        ...messageData,
        success: result.success,
        messageId: result.messageId,
        status: result.status
      });

      return {
        ...result,
        messageData
      };

    } catch (error) {
      console.error('SMS Service Error:', error);
      return {
        success: false,
        error: error.message,
        provider: this.provider
      };
    }
  }

  // Get service status
  getStatus() {
    return {
      provider: this.provider,
      twilioConfigured: this.isConfigured,
      ready: this.provider === 'mock' || this.isConfigured,
      fromNumber: this.fromNumber || 'N/A'
    };
  }

  // Bulk SMS sending
  async sendBulkSMS(recipients, message, options = {}) {
    const results = [];
    const batchSize = 5; // Send 5 at a time to avoid rate limits
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const batchPromises = batch.map(recipient => 
        this.sendSMS(recipient.phone, message, {
          ...options,
          patientId: recipient.patientId,
          patientName: recipient.name
        })
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  // SMS Templates
  getTemplate(templateType, variables = {}) {
    const templates = {
      appointment_reminder: `Hi ${variables.patientName}! This is a reminder that you have an appointment scheduled for ${variables.date} at ${variables.time}. Please arrive 15 minutes early. - Maybunga Health Center`,
      
      appointment_confirmation: `Your appointment has been confirmed for ${variables.date} at ${variables.time}. Location: Maybunga Health Center. For questions, please call us. Thank you!`,
      
      vaccination_reminder: `Hi ${variables.patientName}! Your ${variables.vaccineName} vaccination is due on ${variables.dueDate}. Please schedule an appointment. - Maybunga Health Center`,
      
      checkup_reminder: `Hello ${variables.patientName}! It's time for your regular health checkup. Please visit us or call to schedule an appointment. - Maybunga Health Center`,
      
      prescription_ready: `Hi ${variables.patientName}! Your prescription is ready for pickup at Maybunga Health Center. Please bring a valid ID. Operating hours: 8AM-5PM.`,
      
      emergency_alert: `EMERGENCY ALERT: ${variables.message} Please contact Maybunga Health Center immediately or go to the nearest hospital.`,
      
      general_announcement: `${variables.message} - Maybunga Health Center`
    };

    return templates[templateType] || variables.message;
  }
}

// Singleton instance
const smsService = new SMSService();

module.exports = smsService;
