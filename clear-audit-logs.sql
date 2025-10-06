-- Clear all audit log data to start fresh
DELETE FROM audit_logs;

-- Reset auto-increment counter
ALTER TABLE audit_logs AUTO_INCREMENT = 1;

-- Verify the table is empty
SELECT COUNT(*) as audit_log_count FROM audit_logs;