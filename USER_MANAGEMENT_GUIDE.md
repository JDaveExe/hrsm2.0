# User Management System - Setup Instructions

## 🚀 Quick Start Guide

### 1. Start the Backend Server
```bash
# Option 1: Use the batch file (Windows)
Double-click: start-backend.bat

# Option 2: Manual start
cd backend
npm start
```

### 2. Start the Frontend
```bash
cd hrsm2
npm start
```

## ✨ New Features Added

### 🔒 Form Data Persistence
- **Auto-save**: Form data is automatically saved to localStorage as you type
- **Browser Protection**: Warns before leaving page with unsaved changes
- **Back/Forward Control**: Prevents accidental navigation loss
- **Refresh Safe**: Form data survives browser refresh

### 👁️ Password Visibility
- **Eye Icon**: Click to toggle password visibility
- **Both Fields**: Works for password and confirm password
- **Bootstrap Icons**: Uses `bi-eye` and `bi-eye-slash`

### 🔄 Connection Status
- **Real-time Indicator**: Shows database connection status
- **Color Coded**: Green (Connected) / Red (Disconnected)
- **Error Messages**: Clear feedback when backend is offline

### 🧹 Form Management
- **Clear Form Button**: Manual form reset with localStorage cleanup
- **Auto-reset**: Form clears on successful submission
- **Smart Navigation**: Automatic cleanup when navigating to Add User

## 🔧 Technical Implementation

### Form Persistence Features:
```javascript
// Auto-save form data
useEffect(() => {
  if (userFormData.firstName || userFormData.lastName || userFormData.emailInitials) {
    localStorage.setItem('adminUserFormData', JSON.stringify(userFormData));
  }
}, [userFormData]);

// Browser navigation protection
const handleBeforeUnload = (e) => {
  if (userFormData.firstName || userFormData.lastName || userFormData.emailInitials) {
    e.preventDefault();
    e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
  }
};
```

### Password Visibility:
```javascript
<InputGroup>
  <Form.Control
    type={showPassword ? "text" : "password"}
    // ... other props
  />
  <InputGroup.Text 
    style={{ cursor: 'pointer' }}
    onClick={() => setShowPassword(!showPassword)}
  >
    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
  </InputGroup.Text>
</InputGroup>
```

## 🛠️ Backend Requirements

### Database Configuration (.env):
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=hrsm2
```

### MySQL Setup:
1. Install MySQL 8.0+
2. Create database: `CREATE DATABASE hrsm2;`
3. Update .env with your MySQL credentials
4. Start the backend server

## 📝 Usage Instructions

### Adding New Users:
1. Navigate to User Management
2. Click "Manage" → "Add User"
3. Select user type (Admin/Medical Staff)
4. Fill in the form (auto-saved as you type)
5. Use eye icon to toggle password visibility
6. Click "Create User Account" or "Clear Form"

### Form Data Safety:
- Form data persists across browser refresh
- Warning appears before navigating away with unsaved data
- Clear form manually or automatically on successful submission
- Connection status shows real-time backend availability

## 🐛 Troubleshooting

### Backend Not Connected:
1. Check if MySQL is running
2. Verify database credentials in .env
3. Ensure backend server is started
4. Check console for error messages

### Form Data Lost:
- Form data should auto-save to localStorage
- Check browser developer tools → Application → Local Storage
- Look for keys: adminUserFormData, adminSelectedUserType

### Password Field Issues:
- Eye icon should appear on the right side of password fields
- Click to toggle between hidden/visible
- Bootstrap icons must be properly loaded
