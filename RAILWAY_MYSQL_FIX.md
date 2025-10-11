# 🔧 Railway Deployment Troubleshooting - MySQL Table Issues

## Problem: Backend Crashes Due to Missing Tables

When deploying to Railway, your backend was crashing because:

1. **Tables don't exist** - Railway MySQL starts empty
2. **Sequelize sync disabled** - Your server.js has sync commented out
3. **No automatic initialization** - Tables need manual creation

---

## ✅ Solution Implemented

### 1. Production Database Initialization Script

Created: `backend/scripts/init-production-db.js`

This script:
- Tests database connection
- Creates all required tables
- Sets up default admin account
- Verifies table creation

### 2. Updated Backend Package.json

Added new script:
```json
"init-db": "node scripts/init-production-db.js"
```

### 3. Updated Server Startup Logic

Modified `server.js` to:
- Not crash if tables are missing
- Show helpful initialization message
- Work in both development and production

---

## 🚀 How to Use on Railway

### Method 1: Using Railway CLI (Recommended)

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Link to your project**:
   ```bash
   railway link
   ```

4. **Run initialization**:
   ```bash
   railway run npm run init-db
   ```

This will create all tables and the default admin account.

### Method 2: Using API Endpoint

1. **Wait for backend to deploy** (even if it shows errors about missing tables)

2. **Call the initialization endpoint**:
   ```bash
   curl -X POST https://your-backend.up.railway.app/api/init/init-database
   ```

   Or use Postman/Insomnia:
   - Method: POST
   - URL: `https://your-backend.up.railway.app/api/init/init-database`

3. **Check the response** - should show success message

4. **Backend will automatically work** once tables exist

### Method 3: Manual SQL Execution

If you prefer manual control:

1. **Connect to Railway MySQL**:
   - Go to Railway Dashboard
   - Click on MySQL service
   - Copy connection details
   - Use MySQL Workbench or similar tool

2. **Run table creation manually** using your local Sequelize models

---

## 📋 Tables That Will Be Created

Your initialization script will create these tables:

- `users` - Staff accounts (admin, doctors, nurses)
- `patients` - Patient records
- `families` - Family groupings
- `appointments` - Appointment scheduling
- `vital_signs` - Patient vitals (BP, temp, etc.)
- `checkups` - Medical checkup records
- `diagnoses` - Diagnosis information
- `prescriptions` - Medication prescriptions
- `medications` - Medication inventory
- `medication_batches` - Medication batch tracking
- `vaccinations` - Vaccination records
- `vaccine_batches` - Vaccine batch tracking
- `immunization_history` - Patient immunization history
- `inventory` - General inventory
- `audit_logs` - System audit trail
- `audit_notifications` - Audit alerts
- `notifications` - User notifications
- `doctor_sessions` - Doctor session management
- `lab_referrals` - Laboratory referrals
- Plus any relationship tables (junction tables)

---

## ⚠️ Common Issues & Fixes

### Issue: "Cannot connect to database"

**Symptoms**: Backend crashes immediately
```
❌ Unable to connect to the database: Access denied
```

**Fix**:
1. Check Railway MySQL service is running
2. Verify environment variables:
   ```bash
   railway variables
   ```
3. Ensure variables are linked: `${{MySQL.MYSQLHOST}}`

### Issue: "Table doesn't exist"

**Symptoms**: API calls fail with table errors
```
Error: Table 'railway.users' doesn't exist
```

**Fix**:
1. Run the initialization script:
   ```bash
   railway run npm run init-db
   ```
2. Or call the API endpoint

### Issue: "Initialization script times out"

**Symptoms**: Script runs but doesn't complete

**Fix**:
1. Increase Railway service memory (if on free tier)
2. Run initialization locally connected to Railway MySQL:
   ```bash
   # Set environment variables locally
   export MYSQLHOST=your-railway-host
   export MYSQLPORT=your-railway-port
   export MYSQLDATABASE=railway
   export MYSQLUSER=your-user
   export MYSQLPASSWORD=your-password
   
   # Run script
   npm run init-db
   ```

### Issue: "Default admin account not created"

**Symptoms**: Can't log in after deployment

**Fix**:
1. Check User model has `createDefaultUsers()` method
2. Run seed script instead:
   ```bash
   railway run npm run seed:accounts
   ```
3. Or create manually via MySQL client

---

## 🎯 Deployment Checklist

Use this checklist for fresh Railway deployment:

- [ ] Backend service created with root directory: `backend`
- [ ] MySQL database added to project
- [ ] Environment variables configured (see RAILWAY_DEPLOYMENT_GUIDE.md)
- [ ] Backend deployed successfully
- [ ] Run `railway run npm run init-db` to create tables
- [ ] Verify tables exist in Railway MySQL dashboard
- [ ] Test login with default admin account
- [ ] Change default admin password
- [ ] Frontend service created with root directory: `/`
- [ ] Frontend environment variables set (`REACT_APP_API_URL`)
- [ ] Frontend deployed successfully
- [ ] Update backend CORS_ORIGIN to match frontend URL
- [ ] Test full application workflow

---

## 🔍 Debugging Tools

### Check Railway Logs

```bash
# Backend logs
railway logs --service backend

# Follow logs in real-time
railway logs --service backend --follow
```

### Check Database Tables

```bash
# Connect to Railway MySQL
railway connect MySQL

# Then run SQL:
SHOW TABLES;
DESCRIBE users;
SELECT COUNT(*) FROM users;
```

### Test Database Connection

Create a simple test script:
```javascript
// test-db-connection.js
require('dotenv').config();
const { sequelize } = require('./config/database');

async function test() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connection successful');
    
    const tables = await sequelize.query('SHOW TABLES');
    console.log('Tables:', tables[0]);
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
  process.exit();
}

test();
```

Run it:
```bash
railway run node test-db-connection.js
```

---

## 📞 Need More Help?

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Sequelize Docs**: https://sequelize.org/docs/v6/

---

## 🎉 Success Indicators

You'll know everything is working when:

✅ Backend starts without errors
✅ Can access `https://your-backend.up.railway.app/api/health`
✅ Can log in with admin credentials
✅ No table errors in Railway logs
✅ Frontend can make API calls successfully
✅ Data persists between deployments

