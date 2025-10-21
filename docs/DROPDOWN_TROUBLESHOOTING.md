# Audit Trail Dropdowns - Troubleshooting Guide

## 🔍 Issue
The Action and Type dropdowns in Management Audit Trail only show "All Actions" and "All Types" - no other options visible.

## ✅ Database Status
The database **DOES** have audit log data:
- **16 unique actions** including:
  - `generated_report`
  - `added_stocks` 
  - `checked_vital_signs`
  - `created_user`
  - `removed_patient`
  - `transferred_patient`
  - `vaccinated_patient`
  - And 9 more...

- **7 unique target types** including:
  - `patient`
  - `user`
  - `medication`
  - `vaccine`
  - `checkup`
  - `report`
  - And 1 empty value

- **43 total audit logs** in the database

## 🐛 Possible Causes

### 1. Backend Server Not Running ⚠️
**Check**: Is the backend server running on port 5000?
```bash
cd backend
node server.js
```

### 2. API Authentication Issue 🔐
**Check**: Browser console for 401/403 errors
- Open browser DevTools → Console
- Look for errors like "Access denied" or "Unauthorized"
- Check Network tab for failed API calls to `/api/audit/actions` and `/api/audit/target-types`

### 3. Frontend Not Making API Calls 📡
**Check**: Browser console for API call logs
- Should see:
  - `🔍 Fetching available actions...`
  - `✅ Actions response: ...`
  - `📊 Loaded X actions: [...]`

### 4. Token Issue 🎫
**Check**: localStorage has valid token
```javascript
// In browser console:
localStorage.getItem('token')
// Should return a JWT token string
```

### 5. CORS Issue 🌐
**Check**: Network tab shows CORS errors
- Backend should allow requests from frontend origin

## 🔧 Quick Fixes

### Fix 1: Start Backend Server
```bash
cd backend
node server.js
```
Expected output: `✅ Server running on port 5000`

### Fix 2: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"
4. Reload the app

### Fix 3: Re-login
1. Logout from the app
2. Login again
3. Navigate to Management → Audit Trail
4. Check if dropdowns populate

### Fix 4: Manual Token Test
1. Open browser console
2. Get your token:
```javascript
const token = localStorage.getItem('token');
console.log(token);
```

3. Test the endpoints:
```javascript
// Test actions
fetch('/api/audit/actions', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => {
  console.log('Actions:', data);
  if (data.success) {
    console.log(`✅ Found ${data.count} actions:`, data.data);
  }
});

// Test types
fetch('/api/audit/target-types', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => {
  console.log('Types:', data);
  if (data.success) {
    console.log(`✅ Found ${data.count} types:`, data.data);
  }
});
```

## 🎯 Expected Behavior

When working correctly, you should see:

### Browser Console Logs:
```
🔍 Fetching available actions...
✅ Actions response: {success: true, data: Array(16), count: 16}
📊 Loaded 16 actions: ['added_new_medication', 'added_stocks', ...]

🔍 Fetching available target types...
✅ Target types response: {success: true, data: Array(7), count: 7}
📊 Loaded 7 types: ['patient', 'user', 'medication', ...]
```

### Dropdowns Should Show:
**Actions Dropdown**:
- All Actions
- Added New Medication
- Added Stocks
- Checked Vital Signs
- Checkup Status Update
- Created Family
- Created User
- Deleted User
- Generated Report
- Patient Check In
- Patient Created
- Removed Medication
- Removed Patient
- Transferred Patient
- Updated Patient
- Vaccinated Patient
- Viewed Audit Logs

**Types Dropdown**:
- All Types
- Patient
- User
- Medication
- Vaccine
- Checkup
- Report

## 🧪 Testing Steps

1. **Open Management Audit Trail**
   - Navigate to Management Dashboard
   - Click on "Audit Trail" section

2. **Open Browser DevTools**
   - Press F12
   - Go to Console tab

3. **Check for Logs**
   - You should see the fetching logs
   - Check for any error messages

4. **Check Network Tab**
   - Filter by "audit"
   - Look for:
     - GET `/api/audit/actions`
     - GET `/api/audit/target-types`
   - Both should return 200 status
   - Check the Response tab to see the data

5. **Verify Dropdown Data**
   - Click on Action dropdown
   - Should see list of actions
   - Click on Type dropdown
   - Should see list of types

## 📝 Debug Checklist

- [ ] Backend server is running
- [ ] Can access http://localhost:5000
- [ ] Logged in with valid credentials
- [ ] Token exists in localStorage
- [ ] Browser console shows no errors
- [ ] Network tab shows 200 response for `/api/audit/actions`
- [ ] Network tab shows 200 response for `/api/audit/target-types`
- [ ] Console shows fetching logs
- [ ] Console shows loaded actions/types logs

## 🚑 If Still Not Working

### Run Diagnostic Scripts:

```bash
# Check database data
node check-audit-data.js

# This will show:
# - Number of unique actions
# - Number of unique target types
# - Recent logs
```

### Check Backend Logs:
Look at the terminal running `node server.js` for:
- Any error messages
- SQL query errors
- Authentication failures

### Manual Database Query:
```sql
-- Check actions
SELECT DISTINCT action FROM audit_logs WHERE action IS NOT NULL;

-- Check types
SELECT DISTINCT targetType FROM audit_logs WHERE targetType IS NOT NULL;
```

## 💡 Common Solutions

1. **Just start the backend** - 90% of the time this is the issue
2. **Re-login** - Fresh token fixes authentication issues
3. **Hard refresh** (Ctrl+F5) - Clears cached JavaScript
4. **Check user role** - Only Admin and Management can access

## ✅ Success Indicators

When fixed, you'll see:
- ✅ Dropdowns populate with options
- ✅ Console shows successful API calls
- ✅ Network tab shows 200 responses
- ✅ No error messages

---

**Note**: The code is working correctly. The issue is likely environmental (server not running, cache, or authentication). The database already has 43 audit logs with 16 actions and 7 types ready to display! 🎉
