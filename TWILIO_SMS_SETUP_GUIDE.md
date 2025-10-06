# Twilio SMS Setup Guide for HRSM 2.0

## Overview
This guide will help you configure real SMS functionality using Twilio for the Patient Database SMS notification feature.

---

## Prerequisites
- A Twilio account (free trial or paid)
- A Philippine phone number from Twilio (or international number if testing outside Philippines)
- Access to your backend `.env` file

---

## Step 1: Create a Twilio Account

### Option A: Free Trial (Recommended for Testing)
1. Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up for a free account
3. Verify your email address
4. Complete the phone verification process
5. You'll receive **$15 USD in free credits** (~200 SMS to Philippine numbers)

### Option B: Paid Account (For Production)
1. Go to [https://www.twilio.com/](https://www.twilio.com/)
2. Sign up and complete the payment setup
3. Add funds to your account as needed

---

## Step 2: Get Your Twilio Credentials

Once logged in to your Twilio Console:

1. **Go to the Dashboard**: [https://console.twilio.com/](https://console.twilio.com/)
2. **Find your credentials** in the "Account Info" section:
   - **Account SID** (starts with "AC...")
   - **Auth Token** (click the eye icon to reveal)
   
   > ⚠️ **IMPORTANT**: Never share these credentials or commit them to version control!

---

## Step 3: Get a Twilio Phone Number

### For Philippine SMS (Recommended):
1. In Twilio Console, go to **Phone Numbers** → **Buy a number**
2. Select country: **United States** (Twilio doesn't offer direct PH numbers, but US numbers work for sending to PH)
3. Filter by **SMS** capability
4. Choose a number and click **Buy**
5. Cost: ~$1-2 USD/month

### Important Notes:
- **Trial accounts** can only send SMS to verified phone numbers
- To verify a phone: Go to **Phone Numbers** → **Verified Caller IDs**
- For **production**, upgrade your account to send to any number

---

## Step 4: Configure Your Backend

1. **Open** `backend\.env` file in your project
2. **Replace** the placeholder values with your actual Twilio credentials:

```env
# SMS Service Configuration (Twilio)
TWILIO_ACCOUNT_SID=AC********************************  # Your actual Account SID
TWILIO_AUTH_TOKEN=********************************    # Your actual Auth Token
TWILIO_PHONE_NUMBER=+1234567890                      # Your Twilio phone number (e.g., +19876543210)
TWILIO_WEBHOOK_URL=http://localhost:5000/api/notifications/sms-delivery-status

# Notification Service Settings
NOTIFICATION_MODE=production

# Development Settings - Set to false to use real SMS
ENABLE_SMS_MOCK=false

# SMS Provider - Keep as twilio
SMS_PROVIDER=twilio
```

### Configuration Fields Explained:

| Field | Description | Example |
|-------|-------------|---------|
| `TWILIO_ACCOUNT_SID` | Your unique Twilio Account SID | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Your Twilio Auth Token (keep secret!) | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_PHONE_NUMBER` | Your Twilio phone number in E.164 format | `+19876543210` |
| `ENABLE_SMS_MOCK` | `false` = Real SMS, `true` = Mock/Testing | `false` |
| `SMS_PROVIDER` | SMS service provider | `twilio` |

---

## Step 5: Test Your Configuration

### 5.1 Restart Your Backend Server

```bash
cd backend
node server.js
```

**Look for this message in the console:**
```
✅ Twilio SMS service initialized successfully
📱 SMS Provider: twilio | From Number: +19876543210
```

**If you see mock mode warning:**
```
⚠️  Twilio credentials are placeholder values, using mock SMS service
```
→ Double-check your `.env` file has the correct credentials

---

### 5.2 Test Sending an SMS

1. Open your application
2. Go to **Admin** → **Patient Database**
3. Click **View Info** on any patient
4. Click the **SMS** button (💬 icon)
5. Fill in the form:
   - Make sure the phone number is in Philippine format: `09171234567`
   - Select urgency level
   - Type a test message
6. Click **Send SMS**

---

### 5.3 Verify SMS Delivery

**For Trial Accounts:**
- You can only send to **verified phone numbers**
- To verify: Twilio Console → **Phone Numbers** → **Verified Caller IDs**
- Add your test phone number there

**Check Delivery Status:**
1. Go to Twilio Console → **Monitor** → **Logs** → **Messaging**
2. You should see your sent message with status: `delivered`, `sent`, or `failed`

---

## Step 6: Understanding SMS Costs

### Twilio Pricing (as of 2024):
- **SMS to Philippine Mobile**: ~$0.0750 USD per message
- **Trial Credit**: $15 = approximately **200 SMS messages**
- **Pay-as-you-go**: No monthly fees, only pay per SMS sent

### Cost Management Tips:
1. **Trial Account**: Perfect for testing and small-scale use
2. **Monitor Usage**: Check Twilio Console → **Usage** → **Messaging**
3. **Set Alerts**: Configure budget alerts in Twilio Console
4. **Rate Limiting**: The system sends SMS in batches to avoid spam

---

## Step 7: Philippine Phone Number Format

The system automatically formats Philippine phone numbers:

| Input Format | Converted To | Valid? |
|--------------|--------------|--------|
| `09171234567` | `+639171234567` | ✅ Yes |
| `9171234567` | `+639171234567` | ✅ Yes |
| `639171234567` | `+639171234567` | ✅ Yes |
| `+639171234567` | `+639171234567` | ✅ Yes |
| `081234567` | Invalid | ❌ No (not mobile) |

---

## Troubleshooting

### Issue 1: "Mock Mode" or "Placeholder credentials" message

**Solution:**
- Check your `.env` file has real Twilio credentials (not placeholder text)
- Make sure there are no extra spaces in the credentials
- Restart your backend server after updating `.env`

---

### Issue 2: SMS not sending (Trial Account)

**Solution:**
- **Verify the recipient phone number** in Twilio Console
- Go to: **Phone Numbers** → **Verified Caller IDs** → **Add a new number**
- Twilio will send a verification code to that number

---

### Issue 3: "Invalid phone number" error

**Solution:**
- Make sure phone number is Philippine mobile format (starts with 09)
- Must be 11 digits: `09171234567`
- The system auto-converts to international format: `+639171234567`

---

### Issue 4: "Authentication error" from Twilio

**Solution:**
- Double-check your **Account SID** and **Auth Token**
- Make sure you copied them correctly from Twilio Console
- No extra spaces before or after the values in `.env`

---

### Issue 5: "Insufficient funds" or "Account suspended"

**Solution:**
- **Trial Account**: You may have used all $15 credit
- **Check balance**: Twilio Console → **Account** → **Billing**
- Add funds or upgrade to a paid account

---

## Production Deployment

When deploying to production:

### 1. Upgrade Twilio Account
- Remove trial restrictions
- Can send to any phone number (not just verified)

### 2. Update Environment Variables
```env
NOTIFICATION_MODE=production
ENABLE_SMS_MOCK=false
NODE_ENV=production
```

### 3. Configure Webhook (Optional)
For delivery status tracking:
```env
TWILIO_WEBHOOK_URL=https://yourdomain.com/api/notifications/sms-delivery-status
```

Then in Twilio Console:
- Go to your phone number settings
- Configure Messaging webhook
- URL: `https://yourdomain.com/api/notifications/sms-delivery-status`
- Method: `POST`

### 4. Security Best Practices
- ✅ Never commit `.env` file to git
- ✅ Use environment variables in production server
- ✅ Rotate Auth Token periodically
- ✅ Enable two-factor authentication on Twilio account
- ✅ Monitor usage and set up alerts

---

## Testing Checklist

Before going live, verify:

- [ ] Twilio credentials are configured in `.env`
- [ ] Backend server shows "Twilio initialized successfully"
- [ ] Can send SMS to verified test number
- [ ] SMS arrives within 1-3 seconds
- [ ] Phone number formatting works correctly
- [ ] Error messages display properly
- [ ] Loading state shows while sending
- [ ] Success notification appears after sending

---

## Additional Resources

- **Twilio Documentation**: [https://www.twilio.com/docs/sms](https://www.twilio.com/docs/sms)
- **Philippine SMS Guide**: [https://www.twilio.com/docs/sms/tutorials/how-to-send-sms-messages-philippines](https://www.twilio.com/docs/sms/tutorials/how-to-send-sms-messages-philippines)
- **Twilio Console**: [https://console.twilio.com/](https://console.twilio.com/)
- **Twilio Support**: [https://support.twilio.com/](https://support.twilio.com/)

---

## Need Help?

If you encounter issues:

1. **Check backend console** for error messages
2. **Check browser console** for API errors
3. **Review Twilio logs** in Console → Monitor → Logs
4. **Verify .env configuration** matches this guide
5. **Test with Twilio's API Explorer** to rule out credential issues

---

## Summary

✅ **Email option removed** - SMS only  
✅ **Mock mode disabled** - Real SMS via Twilio  
✅ **Auto phone formatting** - Philippine numbers supported  
✅ **Production ready** - Just add your Twilio credentials  

**Next Steps:**
1. Create/upgrade Twilio account
2. Get your credentials (SID, Token, Phone Number)
3. Update `backend\.env` file
4. Restart backend server
5. Test sending SMS!

---

**Important**: The system will automatically use mock mode if credentials are not configured or are invalid. This prevents errors but won't send real SMS. Always check the backend console for initialization messages.
