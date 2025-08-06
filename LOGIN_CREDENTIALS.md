# 🔐 Login Credentials Guide

## Default User Accounts

The system comes with pre-configured default user accounts for immediate testing and setup.

### Admin Account
- **Username:** `admin` or `admin@maybunga.health`
- **Password:** `admin123`
- **Access Level:** Full system administration
- **Capabilities:**
  - User management
  - Patient management
  - System configuration
  - Reports and analytics
  - All system features

### Doctor Account
- **Username:** `doctor` or `doctor@maybunga.health`
- **Password:** `doctor123`
- **Access Level:** Clinical operations
- **Capabilities:**
  - Patient consultations
  - Medical records
  - Appointment management
  - Clinical data entry

### Patient Account
- **Username:** `patient` or `patient@maybunga.health`
- **Password:** `patient123`
- **Access Level:** Patient portal
- **Capabilities:**
  - View personal medical records
  - Schedule appointments
  - Access prescription history
  - Update contact information

### Custom Created Accounts
When you create new admin or doctor accounts through the system:
- **Username format:** `[initials]@maybunga.health`
- **Login requirement:** Must use the full email address for login
- **Example:** If you create a user with initials "jdoe", you must login with `jdoe@maybunga.health`

## Login Instructions

1. **Navigate to the application:** Open your browser and go to `http://localhost:3000`

2. **Access the login page:** Click on "SIGN IN / SIGN UP" in the navigation bar

3. **Enter credentials:** 
   - Enter either `admin`, `doctor`, or `patient` as the username
   - Enter the corresponding password (`admin123`, `doctor123`, or `patient123`)

4. **Login:** Click the "Log In" button

5. **Automatic redirection:** You will be automatically redirected to the appropriate dashboard based on your role

## Important Notes

⚠️ **Security Notice:** These are default development credentials. In a production environment, you should:
- Change these default passwords immediately
- Create new admin and doctor accounts with strong passwords
- Disable or remove these default accounts
- Enable proper password policies

📝 **Account Management:** Once logged in as an admin, you can create additional user accounts through the User Management section in the Admin Dashboard.

🔄 **Password Reset:** If you forget your password for custom accounts, contact your system administrator or use the admin account to reset user passwords.

## Troubleshooting

### Common Issues

1. **"Invalid credentials" error:** 
   - Ensure you're using the exact usernames and passwords listed above
   - Check for typos (passwords are case-sensitive)
   - Clear browser cache and try again

2. **Login page not loading:**
   - Ensure the frontend is running on `http://localhost:3000`
   - Check that the backend is running on `http://localhost:5000`

3. **Network errors:**
   - Verify both frontend and backend servers are running
   - Check console for error messages
   - Ensure no firewall is blocking the connections

### Getting Help

If you continue to experience issues, check:
- Browser console for error messages
- Backend server logs
- Network tab in browser dev tools for failed requests

## Summary of Recent Fixes

### ✅ **Authentication System**
- Fixed user creation through Admin Dashboard
- Updated API endpoints to use correct data structure
- Fixed role-based routing for admin and doctor dashboards

### ✅ **User Management Table**
- Fixed empty table issue on browser refresh
- Added proper default permissions for user access rights
- Fixed property access errors (`userType` → `accessLevel`, added `accessRights`)

### ✅ **Login Security**
- Enhanced email domain validation for `@maybunga.health`
- Fixed password hashing in user creation
- Proper JWT token handling

### 🧪 **Current Status**
The system should now work properly for:
1. **Default login accounts** (admin/admin123, doctor/doctor123)
2. **Creating new users** through Admin Dashboard
3. **Role-based dashboard access**
4. **Persistent user management table**

---

**Last Updated:** August 3, 2025  
**System Version:** HRSM 2.0
