const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.provider = process.env.EMAIL_PROVIDER || 'gmail';
    
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      const emailConfig = this.getEmailConfig();
      
      if (emailConfig) {
        this.transporter = nodemailer.createTransporter(emailConfig);
        this.isConfigured = true;
        console.log('✅ Email service initialized successfully');
        
        // Verify the connection
        this.verifyConnection();
      } else {
        console.log('⚠️  Email credentials not found, email service disabled');
      }
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
    }
  }

  getEmailConfig() {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASSWORD;

    if (!user || !pass) {
      return null;
    }

    switch (this.provider) {
      case 'gmail':
        return {
          service: 'gmail',
          auth: {
            user: user,
            pass: pass // App-specific password for Gmail
          }
        };
      
      case 'outlook':
        return {
          service: 'hotmail',
          auth: {
            user: user,
            pass: pass
          }
        };
      
      case 'smtp':
        return {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: user,
            pass: pass
          }
        };
      
      default:
        return {
          service: 'gmail',
          auth: {
            user: user,
            pass: pass
          }
        };
    }
  }

  async verifyConnection() {
    if (!this.transporter) return false;
    
    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      return true;
    } catch (error) {
      console.warn('⚠️  Email service verification failed:', error.message);
      return false;
    }
  }

  // Validate email address
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Generate HTML email template
  generateEmailHTML(subject, content, patientName = '') {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background-color: #0ea5e9;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
            }
            .content {
                background-color: #f8f9fa;
                padding: 30px;
                border-radius: 0 0 8px 8px;
                border: 1px solid #dee2e6;
            }
            .footer {
                margin-top: 20px;
                padding: 15px;
                background-color: #e9ecef;
                border-radius: 8px;
                text-align: center;
                font-size: 0.9em;
                color: #6c757d;
            }
            .button {
                display: inline-block;
                background-color: #0ea5e9;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                margin: 10px 0;
            }
            .highlight {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                padding: 15px;
                border-radius: 6px;
                margin: 15px 0;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Maybunga Health Center</h1>
            <p>Barangay Maybunga, Pasig City</p>
        </div>
        
        <div class="content">
            ${patientName ? `<h2>Hello ${patientName}!</h2>` : '<h2>Hello!</h2>'}
            ${content}
        </div>
        
        <div class="footer">
            <p><strong>Maybunga Health Center</strong></p>
            <p>📍 Barangay Maybunga, Pasig City, Metro Manila</p>
            <p>📞 Contact: (02) 8xxx-xxxx | ✉️ Email: info@maybunga.health</p>
            <p>🕒 Operating Hours: Monday-Friday 8:00 AM - 5:00 PM</p>
            <hr style="margin: 15px 0;">
            <small>This is an automated message from Maybunga Health Center. Please do not reply to this email.</small>
        </div>
    </body>
    </html>
    `;
  }

  // Send email
  async sendEmail(to, subject, content, options = {}) {
    try {
      if (!this.isConfigured) {
        throw new Error('Email service not configured');
      }

      // Check if email is N/A, null, undefined, or empty
      if (!to || to === 'N/A' || to === 'n/a' || to.trim() === '') {
        console.log('📧 Skipping email - recipient has no valid email address (N/A or empty)');
        return {
          success: false,
          skipped: true,
          reason: 'No valid email address provided (N/A)',
          provider: 'email'
        };
      }

      if (!this.isValidEmail(to)) {
        throw new Error('Invalid email address format');
      }

      const htmlContent = this.generateEmailHTML(
        subject, 
        content, 
        options.patientName
      );

      const mailOptions = {
        from: {
          name: 'Maybunga Health Center',
          address: process.env.EMAIL_USER
        },
        to: to,
        subject: subject,
        html: htmlContent,
        text: content.replace(/<[^>]*>/g, ''), // Strip HTML for text version
        ...options.mailOptions
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('📧 Email sent successfully:', {
        to: to,
        subject: subject,
        messageId: result.messageId
      });

      return {
        success: true,
        messageId: result.messageId,
        to: to,
        subject: subject,
        provider: 'email',
        sentAt: new Date()
      };

    } catch (error) {
      console.error('Email Service Error:', error);
      return {
        success: false,
        error: error.message,
        provider: 'email'
      };
    }
  }

  // Bulk email sending
  async sendBulkEmails(recipients, subject, content, options = {}) {
    const results = [];
    const batchSize = 10; // Send 10 at a time
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const batchPromises = batch.map(recipient => 
        this.sendEmail(recipient.email, subject, content, {
          ...options,
          patientName: recipient.name
        })
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches to avoid rate limits
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return results;
  }

  // Email templates
  getTemplate(templateType, variables = {}) {
    const templates = {
      appointment_reminder: `
        <div class="highlight">
          <h3>🗓️ Appointment Reminder</h3>
          <p>You have an appointment scheduled for:</p>
          <ul>
            <li><strong>Date:</strong> ${variables.date}</li>
            <li><strong>Time:</strong> ${variables.time}</li>
            <li><strong>Type:</strong> ${variables.type || 'Check-up'}</li>
          </ul>
          <p>Please arrive 15 minutes early for check-in.</p>
        </div>
        <p>If you need to reschedule, please contact us as soon as possible.</p>
      `,

      appointment_confirmation: `
        <div class="highlight">
          <h3>✅ Appointment Confirmed</h3>
          <p>Your appointment has been successfully scheduled:</p>
          <ul>
            <li><strong>Date:</strong> ${variables.date}</li>
            <li><strong>Time:</strong> ${variables.time}</li>
            <li><strong>Doctor:</strong> ${variables.doctor || 'Staff Doctor'}</li>
          </ul>
        </div>
        <p>We look forward to seeing you. Please bring a valid ID and any relevant medical documents.</p>
      `,

      vaccination_reminder: `
        <div class="highlight">
          <h3>💉 Vaccination Reminder</h3>
          <p>It's time for your <strong>${variables.vaccineName}</strong> vaccination.</p>
          <p><strong>Due Date:</strong> ${variables.dueDate}</p>
        </div>
        <p>Please schedule an appointment with us to receive your vaccination. This is important for your health and protection.</p>
        <a href="#" class="button">Schedule Appointment</a>
      `,

      checkup_reminder: `
        <div class="highlight">
          <h3>🏥 Health Checkup Reminder</h3>
          <p>It's time for your regular health checkup!</p>
          <p>Regular checkups help us monitor your health and catch any potential issues early.</p>
        </div>
        <p>Please contact us to schedule your appointment.</p>
        <a href="#" class="button">Book Checkup</a>
      `,

      prescription_ready: `
        <div class="highlight">
          <h3>💊 Prescription Ready</h3>
          <p>Your prescription is ready for pickup!</p>
          <p><strong>Available:</strong> ${variables.availableDate || 'Now'}</p>
        </div>
        <p>Please visit our clinic during operating hours and bring a valid ID for pickup.</p>
        <p><strong>Operating Hours:</strong> Monday-Friday, 8:00 AM - 5:00 PM</p>
      `,

      lab_results_ready: `
        <div class="highlight">
          <h3>🔬 Laboratory Results Ready</h3>
          <p>Your laboratory test results are now available.</p>
          <p><strong>Test Date:</strong> ${variables.testDate}</p>
        </div>
        <p>Please visit our clinic to collect your results and discuss them with our healthcare team.</p>
        <a href="#" class="button">Schedule Consultation</a>
      `,

      general_announcement: `
        <div class="highlight">
          <h3>📢 Important Announcement</h3>
          <p>${variables.message}</p>
        </div>
        <p>Thank you for your attention and cooperation.</p>
      `
    };

    return templates[templateType] || `<p>${variables.message}</p>`;
  }

  // Get service status
  getStatus() {
    return {
      provider: this.provider,
      configured: this.isConfigured,
      ready: this.isConfigured,
      user: process.env.EMAIL_USER || 'Not configured'
    };
  }
}

// Singleton instance
const emailService = new EmailService();

module.exports = emailService;
