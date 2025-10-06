-- Direct SQL commands to clear audit logs
-- Run these commands directly in your MySQL database

-- Step 1: Check current count
SELECT COUNT(*) as current_audit_logs FROM audit_logs;

-- Step 2: Clear all audit log data
DELETE FROM audit_logs;

-- Step 3: Reset auto-increment counter to start fresh
ALTER TABLE audit_logs AUTO_INCREMENT = 1;

-- Step 4: Verify the table is empty
SELECT COUNT(*) as remaining_audit_logs FROM audit_logs;

-- Optional: Show table structure to confirm it's ready
DESCRIBE audit_logs;