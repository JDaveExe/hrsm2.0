# Patient Data Cleanup Script

This script helps you clear all patient and family data to start with a fresh database.

## How to Use

### Option 1: Using the Batch File (Easiest)
1. Double-click `clear-patient-data.bat`
2. Select your cleanup mode:
   - **Option 1**: Clear database (for production/MySQL)
   - **Option 2**: Clear JSON files (for development)
3. Type "YES" to confirm

### Option 2: Using npm Scripts
```bash
# Clear database (production)
npm run clear-data

# Clear development JSON files
npm run clear-data-dev
```

### Option 3: Direct Node.js Execution
```bash
# Clear database
node scripts/clearPatientData.js

# Clear development files
node scripts/clearPatientData.js --dev
```

## What Gets Cleared

### Database Mode (Production)
- All patients from `patients` table
- All families from `families` table
- Related records in:
  - `medical_records`
  - `appointments`
  - `vital_signs`
  - `prescriptions`
  - `audit_logs`
- Resets auto-increment counters to 1

### Development Mode
- Clears JSON files:
  - `src/data/patients.json`
  - `src/data/families.json`
  - `backend/data/patients.json`
  - `backend/data/families.json`

## Safety Features

- **Confirmation Required**: Script asks for "YES" confirmation
- **Transaction Support**: Database operations use transactions
- **Rollback on Error**: If something fails, changes are rolled back
- **Backup Suggestion**: Always backup your database before running

## After Running

1. Refresh your admin dashboard
2. Patient and Family tables will be empty
3. You can start adding fresh data
4. Family assignment in patient form is now optional with "Add Family" button

## Family Assignment Improvements

The patient form now includes:
- ✅ **Optional family assignment** - patients can be added individually
- ✅ **"Add Family" button** - create new families while adding patients
- ✅ **Auto-assignment** - newly created families are automatically assigned
- ✅ **Clear labeling** - shows "No Family (Individual Patient)" option

## Troubleshooting

If you encounter errors:
1. Make sure the database is running
2. Check database credentials in the script
3. Ensure you have proper permissions
4. For JSON mode, check file permissions

## Requirements

- Node.js installed
- MySQL running (for database mode)
- Proper database credentials configured
