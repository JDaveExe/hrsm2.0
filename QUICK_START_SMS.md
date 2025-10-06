# 🚀 Quick Start: Real SMS Setup

## What Changed?
✅ Email option **REMOVED** - SMS only now  
✅ Mock Mode **DISABLED** - Real SMS via Twilio  
✅ UI **SIMPLIFIED** - Cleaner, focused interface  

---

## ⚡ Quick Setup (5 Minutes)

### Step 1: Create Twilio Account
🔗 Go to: https://www.twilio.com/try-twilio
- Sign up (free)
- Get $15 credit (~200 SMS)

### Step 2: Get Your Credentials
📱 From Twilio Console Dashboard:
- Copy **Account SID** (starts with AC...)
- Copy **Auth Token** (click eye icon)
- Buy a **Phone Number** ($1-2/month)

### Step 3: Update Your .env File
📝 Edit: `backend\.env`

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxx    # ← Paste your SID
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx      # ← Paste your Token
TWILIO_PHONE_NUMBER=+1234567890                 # ← Your Twilio number

ENABLE_SMS_MOCK=false                           # ← Must be false!
SMS_PROVIDER=twilio                             # ← Must be twilio!
NOTIFICATION_MODE=production                    # ← Must be production!
```

### Step 4: Restart Backend
```bash
cd backend
node server.js
```

**Look for:** ✅ Twilio SMS service initialized successfully

### Step 5: Test It!
1. Admin → Patient Database → View Info → SMS 💬
2. Enter message and send
3. Check phone for SMS!

---

## 🎯 Where to Find SMS Feature

**Navigation Path:**
```
Admin Dashboard 
  └─ Patient Database
      └─ Click "View Info" on any patient
          └─ Click SMS button (💬 icon)
```

---

## ⚠️ Trial Account Note

**Trial accounts can ONLY send to verified numbers!**

**To verify a number:**
1. Go to Twilio Console
2. Phone Numbers → Verified Caller IDs
3. Click "+ Add a new number"
4. Enter the phone number
5. Receive & enter verification code

**Or upgrade to paid account** (no restrictions)

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Still seeing "Mock Mode" | Check `.env` has real credentials, restart server |
| SMS not arriving | Verify recipient number in Twilio Console |
| "Invalid phone number" | Use format: 09171234567 (11 digits) |
| Authentication error | Double-check SID and Token in `.env` |
| Insufficient funds | Check Twilio balance, add funds |

---

## 💰 Cost Information

- **Trial**: $15 free credit (~200 SMS)
- **Philippine SMS**: ~$0.075 per message
- **Phone Number**: ~$1-2/month
- **No monthly fees**: Pay per SMS only

**Monitor usage:** Twilio Console → Usage → Messaging

---

## 📚 Full Documentation

- **Setup Guide**: `TWILIO_SMS_SETUP_GUIDE.md`
- **Summary**: `SMS_IMPLEMENTATION_SUMMARY.md`
- **Twilio Docs**: https://www.twilio.com/docs/sms

---

## ✅ Quick Checklist

Before going live, verify:

- [ ] Twilio account created
- [ ] Credentials in `.env` (not placeholder values)
- [ ] Backend restarted
- [ ] Console shows "Twilio initialized successfully"
- [ ] Test phone number verified (for trial)
- [ ] Test SMS sent and received
- [ ] Backend console shows successful delivery

---

## 🆘 Need Help?

1. Check backend console for errors
2. Check browser console (F12) for API errors
3. Review Twilio Console → Monitor → Logs
4. Read full setup guide: `TWILIO_SMS_SETUP_GUIDE.md`

---

**That's it! You're ready to send real SMS! 🎉**
