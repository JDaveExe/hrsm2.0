# Profile Recent Activities Fix

## 🐛 Issue Found
The "Recent Activities" section in profile pages wasn't showing any activities because the backend audit logging calls were incorrect.

## 🔍 Root Cause
In `backend/routes/profile.js`, the code was calling `AuditLogger.log()`, but this method **doesn't exist** in the AuditLogger utility class. 

**The AuditLogger class has:**
- Specific methods like `logUserCreation()`, `logPatientRemoval()`, etc.
- But NO generic `.log()` method

**The correct approach is to use:**
- `AuditLog.create()` directly with the proper structure

## ✅ What Was Fixed

### 1. Profile Update Audit Log (Line ~161)
**Before:**
```javascript
await AuditLogger.log({
  userId: req.user.id,
  username: req.user.username,
  userRole: req.user.role,
  action: 'updated_profile',
  targetType: 'user',
  targetId: req.user.id,
  description: `Updated profile: ${changes.join(', ')}`,
  ipAddress: req.ip,
  userAgent: req.get('user-agent'),
  metadata: { oldValues, newValues: updateFields }
});
```

**After:**
```javascript
const userName = `${user.firstName} ${user.lastName}`.trim() || req.user.username || 'Unknown User';
await AuditLog.create({
  userId: req.user.id,
  userName: userName,
  userRole: req.user.role,
  action: 'updated_profile',
  actionDescription: `${userName} updated their profile: ${changes.join(', ')}`,
  targetType: 'user',
  targetId: req.user.id,
  targetName: userName,
  metadata: { oldValues, newValues: updateFields },
  ipAddress: req.ip,
  userAgent: req.get('user-agent'),
  timestamp: new Date()
});
```

### 2. Admin Updates User Profile Audit Log (Line ~285)
**Before:**
```javascript
await AuditLogger.log({
  userId: req.user.id,
  username: req.user.username,
  userRole: req.user.role,
  action: 'updated_user_profile',
  ...
});
```

**After:**
```javascript
const adminName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.username || 'Admin';
const targetUserName = `${user.firstName} ${user.lastName}`.trim();
await AuditLog.create({
  userId: req.user.id,
  userName: adminName,
  userRole: req.user.role,
  action: 'updated_user_profile',
  actionDescription: `${adminName} updated user profile for ${targetUserName}: ${changes.join(', ')}`,
  targetType: 'user',
  targetId: user.id,
  targetName: targetUserName,
  metadata: { targetUser: targetUserName, oldValues, newValues: updateFields },
  ipAddress: req.ip,
  userAgent: req.get('user-agent'),
  timestamp: new Date()
});
```

### 3. Password Change Audit Log (Line ~473)
**Before:**
```javascript
await AuditLogger.log({
  userId: req.user.id,
  username: req.user.username,
  userRole: req.user.role,
  action: 'changed_password',
  ...
});
```

**After:**
```javascript
const userName = `${user.firstName} ${user.lastName}`.trim() || req.user.username || 'Unknown User';
await AuditLog.create({
  userId: req.user.id,
  userName: userName,
  userRole: req.user.role,
  action: 'changed_password',
  actionDescription: `${userName} changed their account password`,
  targetType: 'user',
  targetId: req.user.id,
  targetName: userName,
  metadata: {},
  ipAddress: req.ip,
  userAgent: req.get('user-agent'),
  timestamp: new Date()
});
```

## 📋 Required Fields for AuditLog.create()

Based on the AuditLog model, these fields are **required**:
- ✅ `userId` - User performing the action
- ✅ `userName` - Full name of user (firstName + lastName)
- ✅ `userRole` - Role of user (admin, doctor, management)
- ✅ `action` - Action identifier (e.g., 'updated_profile')
- ✅ `actionDescription` - Human-readable description
- ✅ `timestamp` - When the action occurred

Optional but recommended:
- `targetType` - What was affected (user, patient, etc.)
- `targetId` - ID of the target
- `targetName` - Name of the target
- `metadata` - Additional data as JSON
- `ipAddress` - User's IP address
- `userAgent` - User's browser info

## 🧪 Testing Instructions

### Backend Testing
1. **Restart the backend server** to load the fixed code:
   ```powershell
   # Stop the current backend (Ctrl+C in its terminal)
   # Then restart:
   cd c:\Users\dolfo\hrsm2.0\backend
   node server.js
   ```

### Frontend Testing
2. **Test Profile Update:**
   - Go to Admin Dashboard → Settings → My Profile
   - Click "Edit" button
   - Change your email or contact number
   - Click "Save Changes"
   - **Check Recent Activities** - should show "updated their profile: email" or similar

3. **Test Password Change:**
   - While in My Profile page
   - Click "Change Password" button
   - Enter current and new password
   - Click "Update Password"
   - **Check Recent Activities** - should show "changed their account password"

4. **Test Admin User Update:**
   - Go to User Management
   - Click "Edit" on any user
   - Change their name or email
   - Click "Save Changes"
   - Go to My Profile → Recent Activities
   - Should show "Admin updated user profile for [User Name]: name, email"

### Expected Results
- ✅ Each action should appear in the Recent Activities section
- ✅ Activities should show timestamp (e.g., "2 minutes ago")
- ✅ Actions should be sorted newest first
- ✅ Only YOUR activities should appear (filtered by your userId)
- ✅ Pagination should work if you have more than 10 activities

## 🎯 How Recent Activities Works

### Backend Flow
1. When you update profile → `PUT /api/profile/me`
2. Route creates audit log → `AuditLog.create({ userId: req.user.id, ... })`
3. Log is saved to database with your userId

### Frontend Flow
1. Profile page loads → Calls `GET /api/profile/activities/me`
2. Backend filters logs → `WHERE userId = req.user.id`
3. Returns your activities → Displayed in Recent Activities card

### Role-Based Filtering
- **Admin**: Sees all actions they performed (updates, deletions, user management)
- **Doctor**: Sees all their patient-related actions (checkups, prescriptions, etc.)
- **Management**: Sees their inventory and report actions

## 📝 Notes
- All three profile pages (Admin, Doctor, Management) use the same backend endpoint
- Activities are automatically filtered by the logged-in user's ID
- The frontend already had correct token usage after our earlier fix
- This fix completes the audit trail integration for profiles

## 🚀 Next Steps
After confirming activities appear:
1. Test Doctor profile activities (should show patient checkups, etc.)
2. Test Management profile activities (should show inventory actions, etc.)
3. Verify pagination works for users with many activities
4. Check that timestamps are displayed correctly

---
**Status**: ✅ Backend audit logging fixed - Ready for testing!
