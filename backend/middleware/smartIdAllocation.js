const IdAllocationService = require('../services/IdAllocationService');

/**
 * Middleware to set appropriate AUTO_INCREMENT before user/patient creation
 */
const smartIdAllocation = (role = null) => {
    return async (req, res, next) => {
        try {
            // Determine role from request if not provided
            const userRole = role || req.body.role || req.body.accessLevel?.toLowerCase();
            
            if (userRole === 'patient') {
                // Set both user and patient AUTO_INCREMENT for patient creation
                await IdAllocationService.setUserAutoIncrement('patient');
                await IdAllocationService.setPatientAutoIncrement();
            } else if (userRole === 'admin' || userRole === 'doctor' || userRole === 'administrator' || userRole === 'management') {
                // Set user AUTO_INCREMENT for admin/doctor/management creation
                await IdAllocationService.setUserAutoIncrement(userRole === 'administrator' ? 'admin' : userRole);
            }
            
            next();
            
        } catch (error) {
            console.error('Smart ID allocation error:', error);
            // Don't fail the request, just log the error and continue
            next();
        }
    };
};

module.exports = { smartIdAllocation, IdAllocationService };
