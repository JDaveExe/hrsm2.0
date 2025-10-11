# Test Scripts & Utilities

This folder contains all testing, analysis, and utility scripts for the HRSM 2.0 project.

## 📁 Contents

### Analysis Scripts (`analyze-*.js`)
Scripts for analyzing database data, patient records, inventory, and system metrics.

### Check Scripts (`check-*.js`)
Scripts for checking database states, verifying data integrity, and validating system configurations.

### Browser Test Scripts (`browser-*.js`)
Client-side testing scripts for browser console testing of frontend features.

### Batch Scripts (`batch-*.js`)
Scripts for batch data operations, migrations, and bulk updates.

### Audit Scripts (`audit-*.js`)
Scripts for analyzing and managing audit trail data.

### Create Scripts (`create-*.js`)
Scripts for creating test data, sample records, and initial database entries.

### Fix Scripts (`fix-*.js`)
Scripts for fixing data issues, correcting database states, and resolving system problems.

### Migrate Scripts (`migrate-*.js`)
Database migration scripts for schema changes and data transformations.

### Seed Scripts (`seed-*.js`)
Scripts for seeding test data and populating development databases.

### Setup Scripts (`setup-*.js`)
Scripts for setting up test environments and configurations.

### Update Scripts (`update-*.js`)
Scripts for updating existing records and modifying data.

### Verify Scripts (`verify-*.js`)
Scripts for verifying system functionality, data integrity, and feature implementations.

## 🚀 Usage

These scripts are typically run directly with Node.js from the project root:

```bash
node test-scripts/script-name.js
```

## ⚠️ Important Notes

- Most scripts require the backend server to be running
- Scripts may modify database data - use with caution
- Always review script contents before running
- Some scripts are for development/testing only
- Not intended for production use

## 📝 Organization

This folder was created to clean up the root directory and improve project organization.
All testing and utility scripts have been moved here for better maintainability.

**Date Organized:** October 11, 2025
