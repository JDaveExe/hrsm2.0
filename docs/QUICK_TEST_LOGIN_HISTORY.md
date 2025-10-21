# 🧪 Quick Test Guide - Login History Feature

## Quick Start Testing

### Step 1: Start the Backend Server
```bash
cd backend
node server.js
```

**Expected Console Output:**
```
✅ Connected to MySQL database: hrsm2
✅ Twilio SMS service initialized successfully
Server running on port 5000
```

---

### Step 2: Start the Frontend
```bash
# In another terminal
cd C:\Users\dolfo\hrsm2.0
npm start
```

---

### Step 3: Test Login Event Logging

1. **Go to login page:** http://localhost:3000
2. **Login as a patient:**
   - Username: `patient`
   - Password: `patient123`
3. **Watch backend console** for audit log message

**Expected Backend Console:**
- No errors during login
- Audit log entry created successfully

---

### Step 4: View Login History

1. **Navigate to:** Patient Dashboard
2. **Click on:** Settings (in sidebar)
3. **Click on:** Login History (dropdown item)

**What You Should See:**
```
┌────────────────────────────────────────┐
│  📅 Login History                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                        │
│  Recent Login Activity            [1]  │
│  ────────────────────────────────────  │
│  2025-10-06 at 02:30 PM               │
│  Desktop - Chrome - 192.168.1.1       │
│                                        │
└────────────────────────────────────────┘
```

---

### Step 5: Test Multiple Logins

1. **Logout** from patient dashboard
2. **Login again** as the same patient
3. **Navigate back** to Login History
4. **Verify:** You now see **2 login records**

---

### Step 6: Test Different Browsers

1. **Open Chrome:** Login as patient
2. **Open Firefox:** Login as patient
3. **View Login History**

**Expected Result:**
- See separate entries for Chrome and Firefox
- Device column shows correct browser

---

## Verification Checklist

### Frontend Checks
- [ ] Sidebar shows "Login History" (not "Custom & History")
- [ ] Icon is clock-history (not gear)
- [ ] Page loads without errors
- [ ] Loading spinner shows initially
- [ ] Login history displays after loading

### Backend Checks
- [ ] No errors in backend console during login
- [ ] Audit log entry created on login
- [ ] API endpoint responds at `/api/audit/login-history`
- [ ] Returns JSON with login data

### Data Checks
- [ ] Date format is correct (YYYY-MM-DD)
- [ ] Time format is readable (HH:MM AM/PM)
- [ ] Device shows browser name
- [ ] Location shows IP address
- [ ] Most recent login is at top

---

## Test Different Scenarios

### Scenario 1: New User (No Login History)
1. Create a new patient account
2. Login once
3. View Login History

**Expected:**
- Shows **1 login record**
- That's the current session

---

### Scenario 2: Empty State
1. Login as a user who has never logged in before
2. View Login History

**Expected:**
```
┌────────────────────────────────────────┐
│  🕐                                    │
│  No login history available yet        │
│  Your login activity will appear here  │
└────────────────────────────────────────┘
```

---

### Scenario 3: Error Handling
1. **Stop the backend server**
2. **Navigate to Login History**

**Expected:**
```
⚠️ Unable to load login history
```

---

## Database Verification

### Check the audit_logs Table

```sql
-- Connect to your database
USE hrsm2;

-- View recent login events
SELECT 
    id,
    userId,
    userName,
    action,
    timestamp,
    ipAddress,
    userAgent
FROM audit_logs
WHERE action = 'user_login'
ORDER BY timestamp DESC
LIMIT 10;
```

**Expected Result:**
- See login records for your test user
- `action` = 'user_login'
- `timestamp` matches your login time

---

## API Testing (Optional)

### Test with Postman or curl

```bash
# 1. Login to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login": "patient", "password": "patient123"}'

# Copy the token from response

# 2. Get login history
curl -X GET http://localhost:5000/api/audit/login-history \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "date": "2025-10-06",
      "time": "02:30 PM",
      "device": "Desktop - Chrome",
      "location": "::1",
      "timestamp": "2025-10-06T14:30:00.000Z",
      "fullUserAgent": "Mozilla/5.0..."
    }
  ],
  "count": 1,
  "message": "Retrieved 1 login records"
}
```

---

## Common Issues & Solutions

### Issue: "No login history" but I just logged in

**Solution:**
1. Check if backend is running
2. Look for errors in backend console
3. Verify audit log entry was created
4. Refresh the Login History page

---

### Issue: Shows IP as "::1" instead of real IP

**Explanation:**
- `::1` is IPv6 localhost
- This is normal when testing locally
- Real deployments will show actual IPs

---

### Issue: Device shows "Unknown Browser"

**Cause:**
- User agent string not recognized
- Rare or old browser

**Solution:**
- Expected behavior for unusual browsers
- Common browsers (Chrome, Firefox, Safari, Edge) are detected

---

### Issue: Time format is wrong

**Check:**
- System timezone settings
- Backend server timezone
- Database timezone configuration

---

## Performance Check

### Expected Performance:
- **API Response Time:** < 100ms
- **Page Load Time:** < 1 second
- **Data Fetch Time:** < 500ms

### How to Check:
1. Open Browser DevTools (F12)
2. Go to Network tab
3. Navigate to Login History
4. Look for `login-history` API call
5. Check response time

**Acceptable:** < 500ms  
**Good:** < 200ms  
**Excellent:** < 100ms

---

## Success Criteria

### ✅ Feature is Working If:
1. Sidebar shows "Login History" menu item
2. Page loads without errors
3. Shows real login data (not mock data)
4. New logins appear immediately after refresh
5. Data is formatted correctly
6. No console errors in browser or backend

---

## Next Steps After Testing

### If Everything Works:
- ✅ Feature is ready to use!
- ✅ No further action needed
- ✅ Can deploy to production

### If Issues Found:
1. Check backend console for errors
2. Check browser console for errors
3. Verify database connection
4. Review the implementation guide: `LOGIN_HISTORY_IMPLEMENTATION.md`

---

## Quick Commands Reference

```bash
# Start backend
cd backend && node server.js

# Start frontend
npm start

# Check database
mysql -u root -p hrsm2
SELECT * FROM audit_logs WHERE action='user_login' LIMIT 5;

# View logs
# (Check terminal where backend is running)
```

---

## Test Report Template

```
✅ PASSED / ❌ FAILED

Date: _____________
Tester: _____________

[ ] Backend starts without errors
[ ] Frontend starts without errors
[ ] Can login successfully
[ ] Login event is logged in database
[ ] Login History page loads
[ ] Shows real data (not mock data)
[ ] Multiple logins show correctly
[ ] Browser detection works
[ ] Error handling works
[ ] Empty state shows correctly

Issues Found:
_________________________________
_________________________________
_________________________________

Notes:
_________________________________
_________________________________
_________________________________
```

---

**Happy Testing! 🚀**

If everything works, you're ready to show off your new Login History feature!
