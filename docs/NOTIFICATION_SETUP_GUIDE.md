# SMS/Email Notification System Setup Guide

This guide will help you set up the SMS and Email notification system for the Healthcare Management System.

## Prerequisites

### For SMS Notifications (Twilio)
1. Create a Twilio account at [https://www.twilio.com](https://www.twilio.com)
2. Get your Account SID and Auth Token from the Twilio Console
3. Purchase a phone number from Twilio (for sending SMS)

### For Email Notifications
Choose one of the following options:

#### Option 1: Gmail (Recommended)
1. Enable 2-Factor Authentication on your Google Account
2. Generate an App Password:
   - Go to Google Account Settings → Security
   - Select "App passwords" under "Signing in to Google"
   - Generate a password for "Mail"
   - Use this password in the configuration

#### Option 2: Outlook/Hotmail
1. Enable 2-Factor Authentication
2. Generate an App Password in Account Security settings

#### Option 3: Custom SMTP
1. Get SMTP server details from your email provider
2. Ensure SMTP access is enabled

## Installation

### 1. Install Required Dependencies

Navigate to the backend directory and install the required packages:

```bash
cd backend
npm install twilio nodemailer
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit the `.env` file with your actual credentials:

```env
# SMS Service Configuration (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# Email Service Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
EMAIL_FROM_NAME=Maybunga Health Center

# Notification Service Settings
NOTIFICATION_MODE=development
ENABLE_SMS_MOCK=true
ENABLE_EMAIL_MOCK=false
```

### 3. Development Mode Setup

For development and testing, you can enable mock mode:

- `ENABLE_SMS_MOCK=true` - SMS messages will be logged to console instead of sent
- `ENABLE_EMAIL_MOCK=false` - Emails will be sent normally for testing
- `NOTIFICATION_MODE=development` - Enables additional logging

### 4. Production Setup

For production deployment:

1. Set `NOTIFICATION_MODE=production`
2. Set `ENABLE_SMS_MOCK=false`
3. Set `ENABLE_EMAIL_MOCK=false`
4. Configure webhook URL for SMS delivery status:
   ```env
   TWILIO_WEBHOOK_URL=https://yourdomain.com/api/notifications/sms-delivery-status
   ```

## Configuration Details

### Twilio Setup

1. **Account SID & Auth Token**:
   - Found in your Twilio Console dashboard
   - Keep these secure and never commit to version control

2. **Phone Number**:
   - Must be a Twilio phone number
   - Format: +1234567890 (include country code)
   - For Philippines: +63XXXXXXXXXX

3. **Webhook Configuration** (Production):
   - Set up webhook in Twilio Console
   - URL: `https://yourdomain.com/api/notifications/sms-delivery-status`
   - HTTP Method: POST
   - This enables delivery status tracking

### Email Service Configuration

#### Gmail Configuration:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your-app-password
```

#### Outlook Configuration:
```env
EMAIL_SERVICE=outlook
EMAIL_USER=youremail@outlook.com
EMAIL_PASS=your-app-password
```

#### Custom SMTP Configuration:
```env
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=true
EMAIL_USER=youremail@yourdomain.com
EMAIL_PASS=your-password
```

## Testing the Setup

### 1. Test Notification Services

Use the API endpoints to test:

```bash
# Test SMS service status
curl http://localhost:5000/api/notifications/sms-status

# Test email service status
curl http://localhost:5000/api/notifications/email-status

# Send test notification
curl -X POST http://localhost:5000/api/notifications/test-notification \
  -H "Content-Type: application/json" \
  -d '{"contact": "+639123456789", "method": "auto"}'
```

### 2. Frontend Testing

1. Navigate to the Admin Dashboard
2. Go to "Notifications" → "Send Notifications"
3. Select patients and choose notification type
4. Send test notifications

## Features

### SMS Notifications
- ✅ Twilio integration with Philippine phone number support
- ✅ Automatic phone number formatting (+639XXXXXXXXXX)
- ✅ Mock mode for development
- ✅ Bulk SMS sending
- ✅ Delivery status tracking (webhook)
- ✅ Template-based messages

### Email Notifications
- ✅ Multiple email service support (Gmail, Outlook, SMTP)
- ✅ HTML email templates
- ✅ Bulk email sending
- ✅ Attachment support
- ✅ Email verification

### Notification Types
- ✅ Appointment reminders
- ✅ Vaccination reminders
- ✅ General checkup reminders
- ✅ Custom messages
- ✅ Emergency alerts

### Smart Routing
- ✅ Automatic SMS/Email selection based on patient contact info
- ✅ Fallback from SMS to Email if no phone number
- ✅ Bulk notification with individual routing

## API Endpoints

### Notification Management
- `POST /api/notifications/send-notification` - Send single notification
- `POST /api/notifications/send-bulk-notifications` - Send bulk notifications
- `POST /api/notifications/send-appointment-reminder` - Send appointment reminder
- `POST /api/notifications/send-vaccination-reminder` - Send vaccination reminder
- `POST /api/notifications/send-checkup-reminder` - Send checkup reminder

### Direct Messaging
- `POST /api/notifications/send-sms` - Send SMS directly
- `POST /api/notifications/send-email` - Send email directly

### Service Management
- `GET /api/notifications/status` - Get overall notification service status
- `GET /api/notifications/sms-status` - Get SMS service status
- `GET /api/notifications/email-status` - Get email service status
- `POST /api/notifications/test-notification` - Send test notification

### Webhooks
- `POST /api/notifications/sms-delivery-status` - Twilio delivery status webhook

## Troubleshooting

### Common Issues

1. **SMS Not Sending**:
   - Check Twilio credentials
   - Verify phone number format
   - Check Twilio account balance
   - Ensure phone number is verified in Twilio (trial accounts)

2. **Email Not Sending**:
   - Verify app password is correct
   - Check if 2FA is enabled
   - Ensure "Less secure app access" is enabled (if applicable)
   - Check email service configuration

3. **Phone Number Format**:
   - Philippine numbers: +639XXXXXXXXXX
   - Remove leading 0: 09123456789 → +639123456789
   - Include country code always

4. **Development Mode Issues**:
   - Check console logs for mock messages
   - Verify environment variables are loaded
   - Ensure `NOTIFICATION_MODE=development`

### Logs and Debugging

Check logs in:
- Console output (development mode)
- `logs/notifications.log` (if configured)
- Browser network tab for API responses

### Support

For additional support:
1. Check Twilio documentation: [https://www.twilio.com/docs](https://www.twilio.com/docs)
2. Check Nodemailer documentation: [https://nodemailer.com](https://nodemailer.com)
3. Review the notification service code in `backend/services/`

## Security Considerations

1. **Environment Variables**:
   - Never commit `.env` files to version control
   - Use strong, unique passwords
   - Regularly rotate credentials

2. **API Security**:
   - Implement proper authentication
   - Rate limiting for notification endpoints
   - Input validation and sanitization

3. **Data Privacy**:
   - Log only necessary information
   - Encrypt sensitive data in logs
   - Comply with data protection regulations
