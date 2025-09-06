-- Add serviceType column to appointments table
ALTER TABLE appointments ADD COLUMN serviceType VARCHAR(100) DEFAULT 'General Consultation';

-- Update existing records with default service type
UPDATE appointments SET serviceType = 'General Consultation' WHERE serviceType IS NULL;

-- Show the updated table structure
DESCRIBE appointments;
