const { sequelize } = require('../config/database');

/**
 * Smart ID Allocation System
 * 
 * ID Ranges:
 * - Regular patients: 100-9999 (database AUTO_INCREMENT)
 * - Admin/Doctor creation: 10003+ (database AUTO_INCREMENT) 
 * - Patient overflow: 11000+ (when patients hit 9999)
 * - Hardcoded test accounts: 100001-100003 (virtual, not in DB)
 */

class IdAllocationService {
    
    /**
     * Get the next available ID for admin/doctor creation
     * Ensures IDs start from 10003 and continue sequentially
     */
    static async getNextAdminDoctorId() {
        try {
            // Get current max admin/doctor/management ID in the 10000+ range
            const [results] = await sequelize.query(`
                SELECT MAX(id) as maxId 
                FROM users 
                WHERE role IN ('admin', 'doctor', 'management') 
                AND id >= 10003
            `);
            
            const maxId = results[0].maxId || 10002; // Start from 10003 if none exist
            return maxId + 1;
            
        } catch (error) {
            console.error('Error getting next admin/doctor ID:', error);
            return 10003; // Fallback to starting ID
        }
    }
    
    /**
     * Get the next available ID for patient creation
     * Handles overflow from 9999 to 11000+ range
     */
    static async getNextPatientId() {
        try {
            // Check current max patient ID in regular range (100-9999)
            const [regularResults] = await sequelize.query(`
                SELECT MAX(id) as maxId 
                FROM patients 
                WHERE id BETWEEN 100 AND 9999
            `);
            
            const maxRegularId = regularResults[0].maxId || 99;
            
            // If we haven't hit 9999 yet, continue in regular range
            if (maxRegularId < 9999) {
                return maxRegularId + 1;
            }
            
            // If regular range is full, move to overflow range (11000+)
            const [overflowResults] = await sequelize.query(`
                SELECT MAX(id) as maxId 
                FROM patients 
                WHERE id >= 11000
            `);
            
            const maxOverflowId = overflowResults[0].maxId || 10999;
            return maxOverflowId + 1;
            
        } catch (error) {
            console.error('Error getting next patient ID:', error);
            return 100; // Fallback to starting ID
        }
    }
    
    /**
     * Set AUTO_INCREMENT for users table based on role
     */
    static async setUserAutoIncrement(role) {
        try {
            let nextId;
            
            if (role === 'patient') {
                nextId = await this.getNextPatientId();
            } else if (role === 'admin' || role === 'doctor') {
                nextId = await this.getNextAdminDoctorId();
            } else {
                nextId = 100; // Default fallback
            }
            
            await sequelize.query(`ALTER TABLE users AUTO_INCREMENT = ${nextId}`);
            console.log(`🎯 Set users AUTO_INCREMENT to ${nextId} for ${role} creation`);
            
            return nextId;
            
        } catch (error) {
            console.error('Error setting user AUTO_INCREMENT:', error);
            throw error;
        }
    }
    
    /**
     * Set AUTO_INCREMENT for patients table with overflow handling
     */
    static async setPatientAutoIncrement() {
        try {
            const nextId = await this.getNextPatientId();
            await sequelize.query(`ALTER TABLE patients AUTO_INCREMENT = ${nextId}`);
            console.log(`🎯 Set patients AUTO_INCREMENT to ${nextId}`);
            
            return nextId;
            
        } catch (error) {
            console.error('Error setting patient AUTO_INCREMENT:', error);
            throw error;
        }
    }
    
    /**
     * Get current ID allocation status
     */
    static async getAllocationStatus() {
        try {
            const status = {
                hardcodedAccounts: {
                    range: '100001-100003',
                    description: 'Virtual test accounts (admin/doctor/patient)'
                },
                regularPatients: {
                    range: '100-9999',
                    current: 0,
                    remaining: 0
                },
                adminDoctor: {
                    range: '10003+',
                    current: 0
                },
                patientOverflow: {
                    range: '11000+',
                    current: 0
                }
            };
            
            // Get regular patient status
            const [patientResults] = await sequelize.query(`
                SELECT COUNT(*) as count, MAX(id) as maxId 
                FROM patients 
                WHERE id BETWEEN 100 AND 9999
            `);
            
            status.regularPatients.current = patientResults[0].maxId || 0;
            status.regularPatients.remaining = 9999 - status.regularPatients.current;
            
            // Get admin/doctor status
            const [adminResults] = await sequelize.query(`
                SELECT COUNT(*) as count, MAX(id) as maxId 
                FROM users 
                WHERE role IN ('admin', 'doctor') AND id >= 10003
            `);
            
            status.adminDoctor.current = adminResults[0].maxId || 0;
            
            // Get patient overflow status
            const [overflowResults] = await sequelize.query(`
                SELECT COUNT(*) as count, MAX(id) as maxId 
                FROM patients 
                WHERE id >= 11000
            `);
            
            status.patientOverflow.current = overflowResults[0].maxId || 0;
            
            return status;
            
        } catch (error) {
            console.error('Error getting allocation status:', error);
            throw error;
        }
    }
}

module.exports = IdAllocationService;
