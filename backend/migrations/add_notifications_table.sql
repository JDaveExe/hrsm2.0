-- Create notifications table for the HRSM system
-- This table stores all patient notifications with proper foreign key relationships

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'appointment_request',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    appointment_data JSONB, -- Store appointment details as JSON
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add indexes for performance
    INDEX idx_notifications_patient_id (patient_id),
    INDEX idx_notifications_status (status),
    INDEX idx_notifications_created_at (created_at)
);

-- Add trigger to update updated_at automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add some sample data for testing
INSERT INTO notifications (patient_id, title, message, type, status, appointment_data) VALUES 
(113, 'Appointment Request', 'You have a new appointment request for General Consultation', 'appointment_request', 'pending', '{"date": "2025-09-20", "time": "10:00 AM", "service": "General Consultation", "notes": "Regular checkup"}'),
(134, 'Appointment Request', 'You have a new appointment request for Follow-up Consultation', 'appointment_request', 'pending', '{"date": "2025-09-20", "time": "2:00 PM", "service": "Follow-up Consultation", "notes": "Follow-up visit"}');

-- Check the data
SELECT * FROM notifications;