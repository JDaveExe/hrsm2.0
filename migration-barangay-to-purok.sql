-- ============================================
-- BARANGAY TO PUROK MIGRATION SCRIPT
-- Date: October 11, 2025
-- IMPORTANT: CREATE BACKUP BEFORE RUNNING!
-- ============================================

USE hrsm2;

-- Display current table structure
DESCRIBE Patients;

-- Show sample data before migration
SELECT id, firstName, lastName, barangay, street, city 
FROM Patients 
LIMIT 5;

-- Start transaction for safety
START TRANSACTION;

-- Rename column from 'barangay' to 'purok'
ALTER TABLE Patients 
CHANGE COLUMN barangay purok VARCHAR(255);

-- Verify the change
DESCRIBE Patients;

-- Show sample data after migration
SELECT id, firstName, lastName, purok, street, city 
FROM Patients 
LIMIT 5;

-- Count records
SELECT 
    COUNT(*) as total_patients, 
    COUNT(purok) as patients_with_purok,
    COUNT(*) - COUNT(purok) as patients_without_purok
FROM Patients;

-- If everything looks good, COMMIT
-- If there's an issue, ROLLBACK
-- Uncomment one of the following:

-- COMMIT;  -- Uncomment this to save changes
-- ROLLBACK;  -- Uncomment this to undo changes

-- ============================================
-- ROLLBACK SCRIPT (if needed):
-- ALTER TABLE Patients CHANGE COLUMN purok barangay VARCHAR(255);
-- ============================================
