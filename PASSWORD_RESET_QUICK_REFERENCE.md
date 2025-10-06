# Password Reset - Quick Reference

## 🚀 Quick Commands

### Testing
```bash
# Test patient self-service password reset
node test-password-reset.js

# Test admin password reset
node test-admin-password-reset.js
```

### Cleanup
```bash
# Remove test users (safe, 5-second warning)
node cleanup-test-users.js

# Deep cleanup (orphaned records + test users)
node cleanup-database-deep.js
```

## 📍 Feature Locations

### Patient Side
- **Path**: Patient Dashboard → My Profile → Edit Information
- **Field**: Contact Information section, beside Phone Number
- **Shows**: Password field (asterisks when viewing)

### Admin Side
- **Path**: Admin Dashboard → Patient Management → Edit Patient Info
- **Field**: Contact Information section (3rd column)
- **Shows**: Password field (optional, leave blank to keep current)

## ✅ How It Works

### Patient Changes Own Password
1. Password field shows asterisks (••••••••)
2. Enter new password → Confirm field appears
3. Enter same password again
4. Save → Old password invalidated
5. Login with new password

### Admin Resets Patient Password
1. Select patient → Edit Patient Info
2. Scroll to Contact Information (Password field)
3. Enter new password → Confirm field appears
4. Enter same password again
5. Save → Patient's old password invalidated
6. Inform patient of new password

## 🔐 Security

- ✅ Bcrypt hashing (10 salt rounds)
- ✅ Automatic hashing via Sequelize hooks
- ✅ Old password invalidated immediately
- ✅ No password stored in plain text
- ✅ No password returned in API responses
- ✅ Audit trail logging (without password)

## ⚠️ Validation Rules

- Minimum 6 characters
- Must enter twice (new + confirm)
- Passwords must match
- Optional field (leave blank = keep current)

## 🧪 Test Coverage

✅ Patient self-service password reset
✅ Admin password reset
✅ Login with email + new password
✅ Login with phone + new password
✅ Old password rejection
✅ Credential update integration
✅ Database cleanup

## 📊 Database Cleanup Stats

Last Cleanup:
- Test users removed: 5
- Orphaned users removed: 20
- Total records cleaned: 25
- Status: ✅ Database clean

## 🛠️ Troubleshooting

### Password not updating?
- Check backend is running
- Check for validation errors in frontend
- Verify password meets 6-character minimum
- Confirm passwords match

### Old password still works?
- Restart backend server
- Clear browser cache
- Check User model beforeUpdate hook is working

### Test script fails?
- Check MySQL is running
- Verify database credentials in script
- Ensure backend is running on port 5000

## 📝 Code References

**Patient Profile Password Field**
- File: `src/components/patient/components/PatientProfile.js`
- Function: `renderPasswordField()`
- State: `isChangingPassword`, `passwordData`

**Admin Edit Patient Password Field**
- File: `src/components/admin/components/PatientManagement.js`
- State: `isChangingPatientPassword`, `patientPasswordData`
- Handler: `handleSaveEditPatient()`

**Backend Password Handling**
- File: `backend/routes/patients.js`
- Routes: `/api/patients/me/profile`, `/api/patients/:id`
- Hook: User model `beforeUpdate` (auto-hashing)

---

**Status**: ✅ **FULLY OPERATIONAL**
**Last Updated**: October 6, 2025
**Version**: 1.0 - Production Ready
