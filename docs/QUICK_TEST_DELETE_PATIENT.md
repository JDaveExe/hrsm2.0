# 🧪 Quick Test: Delete Patient with Cooldown

## Fast Test Steps

### 1️⃣ Start Backend & Frontend

```powershell
# Terminal 1
cd backend
node server.js

# Terminal 2
npm start
```

### 2️⃣ Delete a Patient

1. Login as admin
2. Go to **Admin > Patient Database**
3. Click any patient → **View Info**
4. Click **Manage** dropdown (top right)
5. Click **Delete Patient** (red with trash icon)
6. Confirm by clicking **Delete**

### 3️⃣ Observe Cooldown

Watch the button change:
```
Delete → Wait 10s → Wait 9s → ... → Wait 1s → Delete
```

Button is **disabled** during countdown!

### 4️⃣ Check Audit Trail

1. Go to **Admin > Settings > Audit Trail**
2. Look for newest entry:
   - **Action:** `removed_patient` (red badge)
   - **Description:** "Your Name removed patient Patient Name"
   - **Timestamp:** Just now

---

## Expected Results

### ✅ Frontend
- Patient disappears from list
- Success message: "Patient [Name] has been permanently deleted."
- Delete button disabled for 10 seconds
- Button text shows countdown

### ✅ Backend Console
- No errors
- Shows DELETE request logged

### ✅ Audit Trail
- New entry with `removed_patient` action
- Shows admin name and patient name
- Includes timestamp and IP address

### ✅ Database
```sql
-- Check audit_logs table
SELECT * FROM audit_logs 
WHERE action = 'removed_patient' 
ORDER BY timestamp DESC 
LIMIT 1;

-- Should show your recent deletion
```

---

## Quick Database Check (Optional)

```sql
-- Open MySQL
mysql -u root -p hrsm2

-- Check recent audit logs
SELECT 
    id,
    userName,
    action,
    actionDescription,
    timestamp
FROM audit_logs
WHERE action = 'removed_patient'
ORDER BY timestamp DESC
LIMIT 5;
```

**Expected Output:**
```
+------+-----------+-----------------+----------------------------------+---------------------+
| id   | userName  | action          | actionDescription                | timestamp           |
+------+-----------+-----------------+----------------------------------+---------------------+
| 1234 | Admin     | removed_patient | Admin removed patient John Doe   | 2025-10-06 14:30:00 |
+------+-----------+-----------------+----------------------------------+---------------------+
```

---

## Troubleshooting

### Button stays "Delete" (no cooldown)
**Problem:** Cooldown not triggering  
**Check:** Look for errors in browser console

### No audit log appears
**Problem:** Backend not logging  
**Check:** Backend console for errors during deletion

### Patient not deleted
**Problem:** API error  
**Check:** Network tab in DevTools (F12)

---

## Quick Commands

```powershell
# View backend logs
cd backend
node server.js

# View frontend errors
# Open browser console (F12)
# Check Console tab

# Database check
mysql -u root -p hrsm2
SELECT * FROM audit_logs WHERE action='removed_patient' ORDER BY timestamp DESC LIMIT 1;
```

---

## Test Report Template

```
✅ PASSED / ❌ FAILED

[ ] Patient deleted successfully
[ ] Success message appeared
[ ] Patient removed from list
[ ] Delete button showed "Wait 10s"
[ ] Cooldown counted down to 0
[ ] Audit log entry created
[ ] Audit log shows correct info
[ ] No errors in console
[ ] Can delete another patient after 10s

Notes:
_________________________________
```

---

## 🎯 Success = All Green Checkmarks!

If everything works:
- ✅ Feature is production-ready
- ✅ Safe to use in production
- ✅ Audit trail is working

---

**Happy Testing! 🚀**
