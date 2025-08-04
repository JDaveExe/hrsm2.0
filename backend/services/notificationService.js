const smsService = require('./smsService');
const emailService = require('./emailService');

class NotificationService {
  constructor() {
    this.preferredMethod = process.env.DEFAULT_NOTIFICATION_METHOD || 'auto'; // auto, sms, email
    this.fallbackEnabled = process.env.NOTIFICATION_FALLBACK === 'true' || true;
  }

  // Determine the best notification method for a patient
  determineNotificationMethod(patient) {
    const hasPhone = patient.contactNumber && 
                     patient.contactNumber !== 'N/A' && 
                     patient.contactNumber !== 'n/a' && 
                     this.isValidPhoneNumber(patient.contactNumber);
    
    const hasEmail = patient.email && 
                     patient.email !== 'N/A' && 
                     patient.email !== 'n/a' && 
                     this.isValidEmail(patient.email);

    // Priority logic:
    // 1. If patient has both phone and email, prefer SMS (faster and more immediate)
    // 2. If patient has only one method, use that
    // 3. If patient has neither, return null
    
    if (this.preferredMethod === 'sms' && hasPhone) {
      return { method: 'sms', contact: patient.contactNumber, fallback: hasEmail ? 'email' : null };
    }
    
    if (this.preferredMethod === 'email' && hasEmail) {
      return { method: 'email', contact: patient.email, fallback: hasPhone ? 'sms' : null };
    }
    
    // Auto mode - prefer SMS, fallback to email
    if (hasPhone) {
      return { method: 'sms', contact: patient.contactNumber, fallback: hasEmail ? 'email' : null };
    }
    
    if (hasEmail) {
      return { method: 'email', contact: patient.email, fallback: null };
    }
    
    return null; // No contact method available
  }

  isValidPhoneNumber(phone) {
    return smsService.isValidPhilippineNumber(phone);
  }

  isValidEmail(email) {
    return emailService.isValidEmail(email);
  }

  // Send notification with automatic method selection
  async sendNotification(patient, type, variables = {}, options = {}) {
    try {
      const notificationConfig = this.determineNotificationMethod(patient);
      
      if (!notificationConfig) {
        return {
          success: false,
          error: 'No valid contact method found for patient',
          patientId: patient.id,
          patientName: this.getPatientName(patient)
        };
      }

      const messageContent = this.getNotificationContent(type, variables, notificationConfig.method);
      const subject = this.getNotificationSubject(type, variables);

      let result;

      // Try primary method
      if (notificationConfig.method === 'sms') {
        result = await this.sendSMSNotification(
          notificationConfig.contact, 
          messageContent, 
          patient, 
          type, 
          options
        );
      } else {
        result = await this.sendEmailNotification(
          notificationConfig.contact, 
          subject,
          messageContent, 
          patient, 
          type, 
          options
        );
      }

      // If primary method failed and fallback is available
      if (!result.success && this.fallbackEnabled && notificationConfig.fallback) {
        console.log(`Primary method (${notificationConfig.method}) failed, trying fallback (${notificationConfig.fallback})`);
        
        const fallbackContact = notificationConfig.fallback === 'email' ? patient.email : patient.contactNumber;
        const fallbackContent = this.getNotificationContent(type, variables, notificationConfig.fallback);
        
        if (notificationConfig.fallback === 'sms') {
          result = await this.sendSMSNotification(fallbackContact, fallbackContent, patient, type, options);
        } else {
          result = await this.sendEmailNotification(fallbackContact, subject, fallbackContent, patient, type, options);
        }
        
        if (result.success) {
          result.usedFallback = true;
          result.primaryMethod = notificationConfig.method;
          result.fallbackMethod = notificationConfig.fallback;
        }
      }

      return {
        ...result,
        patientId: patient.id,
        patientName: this.getPatientName(patient),
        type: type,
        primaryMethod: notificationConfig.method,
        fallbackAvailable: !!notificationConfig.fallback
      };

    } catch (error) {
      console.error('Notification Service Error:', error);
      return {
        success: false,
        error: error.message,
        patientId: patient.id,
        patientName: this.getPatientName(patient)
      };
    }
  }

  // Send SMS notification
  async sendSMSNotification(phoneNumber, message, patient, type, options = {}) {
    return await smsService.sendSMS(phoneNumber, message, {
      urgency: options.urgency || 'normal',
      patientId: patient.id,
      patientName: this.getPatientName(patient),
      type: type
    });
  }

  // Send email notification
  async sendEmailNotification(email, subject, content, patient, type, options = {}) {
    return await emailService.sendEmail(email, subject, content, {
      patientName: this.getPatientName(patient),
      urgency: options.urgency || 'normal',
      type: type
    });
  }

  // Get notification content based on type and method
  getNotificationContent(type, variables, method) {
    if (method === 'sms') {
      return smsService.getTemplate(type, variables);
    } else {
      return emailService.getTemplate(type, variables);
    }
  }

  // Get notification subject (for emails)
  getNotificationSubject(type, variables) {
    const subjects = {
      appointment_reminder: 'Appointment Reminder - Maybunga Health Center',
      appointment_confirmation: 'Appointment Confirmed - Maybunga Health Center',
      vaccination_reminder: `${variables.vaccineName} Vaccination Reminder`,
      checkup_reminder: 'Health Checkup Reminder',
      prescription_ready: 'Prescription Ready for Pickup',
      lab_results_ready: 'Laboratory Results Available',
      emergency_alert: '🚨 URGENT: Health Alert',
      general_announcement: 'Important Announcement - Maybunga Health Center'
    };

    return subjects[type] || 'Notification from Maybunga Health Center';
  }

  // Helper to get patient full name
  getPatientName(patient) {
    if (patient.name) return patient.name;
    return `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Patient';
  }

  // Bulk notifications with intelligent routing
  async sendBulkNotifications(patients, type, variables = {}, options = {}) {
    const results = [];
    const smsRecipients = [];
    const emailRecipients = [];

    // Group patients by preferred notification method
    patients.forEach(patient => {
      const config = this.determineNotificationMethod(patient);
      if (config) {
        if (config.method === 'sms') {
          smsRecipients.push({
            phone: config.contact,
            patientId: patient.id,
            name: this.getPatientName(patient),
            patient: patient
          });
        } else {
          emailRecipients.push({
            email: config.contact,
            patientId: patient.id,
            name: this.getPatientName(patient),
            patient: patient
          });
        }
      } else {
        results.push({
          success: false,
          error: 'No contact method available',
          patientId: patient.id,
          patientName: this.getPatientName(patient)
        });
      }
    });

    // Send SMS notifications in bulk
    if (smsRecipients.length > 0) {
      const smsMessage = smsService.getTemplate(type, variables);
      const smsResults = await smsService.sendBulkSMS(smsRecipients, smsMessage, {
        urgency: options.urgency,
        type: type
      });
      results.push(...smsResults.map((result, index) => ({
        ...result,
        patientId: smsRecipients[index].patientId,
        patientName: smsRecipients[index].name,
        method: 'sms'
      })));
    }

    // Send email notifications in bulk
    if (emailRecipients.length > 0) {
      const emailContent = emailService.getTemplate(type, variables);
      const emailSubject = this.getNotificationSubject(type, variables);
      const emailResults = await emailService.sendBulkEmails(emailRecipients, emailSubject, emailContent, {
        urgency: options.urgency,
        type: type
      });
      results.push(...emailResults.map((result, index) => ({
        ...result,
        patientId: emailRecipients[index].patientId,
        patientName: emailRecipients[index].name,
        method: 'email'
      })));
    }

    return {
      total: patients.length,
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      smsCount: smsRecipients.length,
      emailCount: emailRecipients.length,
      results: results
    };
  }

  // Send appointment reminders
  async sendAppointmentReminder(patient, appointment) {
    const variables = {
      patientName: this.getPatientName(patient),
      date: this.formatDate(appointment.date),
      time: appointment.time,
      type: appointment.type || 'Check-up',
      doctor: appointment.doctor || 'Staff Doctor'
    };

    return await this.sendNotification(patient, 'appointment_reminder', variables, {
      urgency: 'normal'
    });
  }

  // Send vaccination reminders
  async sendVaccinationReminder(patient, vaccine) {
    const variables = {
      patientName: this.getPatientName(patient),
      vaccineName: vaccine.name,
      dueDate: this.formatDate(vaccine.dueDate)
    };

    return await this.sendNotification(patient, 'vaccination_reminder', variables, {
      urgency: 'high'
    });
  }

  // Send checkup reminders
  async sendCheckupReminder(patient) {
    const variables = {
      patientName: this.getPatientName(patient)
    };

    return await this.sendNotification(patient, 'checkup_reminder', variables, {
      urgency: 'normal'
    });
  }

  // Send emergency alerts
  async sendEmergencyAlert(patient, message) {
    const variables = {
      patientName: this.getPatientName(patient),
      message: message
    };

    return await this.sendNotification(patient, 'emergency_alert', variables, {
      urgency: 'urgent'
    });
  }

  // Utility method to format dates
  formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Get service status
  getStatus() {
    return {
      sms: smsService.getStatus(),
      email: emailService.getStatus(),
      preferredMethod: this.preferredMethod,
      fallbackEnabled: this.fallbackEnabled
    };
  }

  // Test notification system
  async testNotification(testContact, method = 'auto') {
    const testPatient = {
      id: 999,
      firstName: 'Test',
      lastName: 'Patient',
      contactNumber: method === 'sms' || method === 'auto' ? testContact : null,
      email: method === 'email' || method === 'auto' ? testContact : null
    };

    return await this.sendNotification(testPatient, 'general_announcement', {
      patientName: 'Test Patient',
      message: 'This is a test notification from Maybunga Health Center. If you received this message, the notification system is working correctly!'
    });
  }
}

// Singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;
