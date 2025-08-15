# 🔄 Auto-Login Feature Guide

## Overview

The HRSM 2.0 system now includes an **automatic doctor login feature** when running multiple instances for testing. This eliminates the need to manually log in as a doctor every time you start the second instance.

## How It Works

### 🔍 Port Detection
- The system detects when it's running on port `3001` (second instance)
- When detected, it automatically attempts to log in using the doctor credentials
- This happens seamlessly in the background without user intervention

### 🩺 Auto-Login Process
1. **Detection**: App detects it's running on port 3001
2. **Auto-Login**: Automatically logs in with `doctor/doctor123`
3. **Redirect**: Immediately redirects to the Doctor Dashboard
4. **Visual Feedback**: Shows loading screen with "Second Instance Detected" message

## Visual Indicators

### 📊 Header Indicator
When running on port 3001, you'll see a green badge in the header:
```
🩺 DOCTOR MODE (Port 3001)
```

### ⏳ Loading Screen
During auto-login, you'll see:
- Spinner animation
- "Second Instance Detected" message
- "Automatically logging in as Doctor..." text
- Port indicator

## Usage Instructions

### 🚀 Quick Start
1. Run `start-multi-instance.bat`
2. Wait for both instances to start
3. **Port 3000**: Manual login (admin/doctor/patient)
4. **Port 3001**: Automatic doctor login ✨

### 🌐 Access URLs
- **Primary Instance**: `http://localhost:3000` (Manual login)
- **Doctor Instance**: `http://localhost:3001` (Auto-login as doctor)

## Troubleshooting

### 🔧 Common Issues

#### Auto-login doesn't work
- **Check**: Ensure backend is running on port 5000
- **Check**: Verify second instance is on port 3001
- **Solution**: Clear browser cache and restart instances

#### Already logged in message
- **Cause**: Previous session data in browser storage
- **Solution**: Clear localStorage or use incognito/private window

#### Port conflict
- **Cause**: Another service using port 3001
- **Solution**: Check running processes and free the port

### 📝 Manual Override
If auto-login fails, you can still manually:
1. Navigate to the login page
2. Enter `doctor` / `doctor123`
3. Click "Log In"

## Benefits

### 🎯 For Testing
- **Faster Setup**: No manual login required for doctor testing
- **Consistent State**: Always starts with doctor account
- **Clear Separation**: Port 3000 for admin/manual, Port 3001 for doctor

### 🛠️ For Development
- **Reduced Friction**: Streamlined testing workflow
- **Visual Clarity**: Clear indicators of which instance you're using
- **Reliable Testing**: Consistent doctor dashboard access

## Technical Details

### 🔍 Implementation
- **Detection**: Uses `window.location.port` to detect port 3001
- **Auto-Login**: Calls `authService.login('doctor', 'doctor123')`
- **State Management**: Uses React Context for authentication state
- **Navigation**: Automatically redirects to `/doctor/dashboard`

### 🔒 Security Notes
- Auto-login only works on development ports (3001)
- Uses the same secure authentication flow as manual login
- Does not bypass any security measures
- Only activates for non-authenticated users

## Configuration

### 📊 Customization
To modify the auto-login behavior, edit:
```javascript
// In LoginSignup.js
const currentPort = window.location.port;
if (currentPort === '3001' && !isAuthenticated && !autoLoginAttempted) {
  // Auto-login logic here
}
```

### 🎨 Styling
To modify the visual indicators, edit:
```javascript
// In Header.js - For header badge
// In LoginSignup.js - For loading screen
```

---

**Last Updated**: August 14, 2025  
**Feature Version**: HRSM 2.0 Auto-Login v1.0
