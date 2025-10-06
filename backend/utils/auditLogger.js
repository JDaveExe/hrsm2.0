const AuditLog = require('../models/AuditLog');

/**
 * Audit Logging Utility Functions
 * 
 * This module provides functions to log various actions performed by users
 * in the healthcare management system for security and compliance purposes.
 */

class AuditLogger {
  
  /**
   * List of critical actions that should trigger notifications
   */
  static CRITICAL_ACTIONS = [
    'removed_patient',
    'deleted_patient',
    'deleted_user',
    'created_user',
    'added_new_user',
    'created_family',
    'patient_created',
    'failed_login',
    'multiple_failed_logins',
    'backup_restored' // Backup restore is a critical action
  ];

  /**
   * Check if an action should trigger a critical notification
   * @param {string} action - Action type
   * @returns {boolean}
   */
  static isCriticalAction(action) {
    return this.CRITICAL_ACTIONS.includes(action);
  }

  /**
   * Create notification for critical audit events
   * @param {Object} auditLogEntry - The audit log entry
   */
  static async createNotificationIfCritical(auditLogEntry) {
    if (!this.isCriticalAction(auditLogEntry.action)) {
      return null; // Not a critical action
    }

    try {
      const AuditNotification = require('../models/AuditNotification');
      
      // Determine severity based on action type
      let severity = 'high';
      if (['removed_patient', 'deleted_patient', 'deleted_user', 'multiple_failed_logins'].includes(auditLogEntry.action)) {
        severity = 'critical';
      }

      const notification = await AuditNotification.createFromAuditLog(auditLogEntry, severity);
      console.log(`🚨 Critical event notification created: ${notification.title}`);
      return notification;
    } catch (error) {
      console.error('❌ Error creating audit notification:', error);
      return null;
    }
  }
  
  /**
   * Extract user information from request object
   * Fetches full user details from database if not in JWT
   * @param {Object} req - Express request object
   * @returns {Object} User information
   */
  static async extractUserInfo(req) {
    const user = req.user || {};
    
    // Determine user name
    let userName = 'Unknown User';
    let userId = null;
    let userRole = null;
    
    if (user.id === 1) {
      userName = 'System Administrator';
      userId = user.id;
      userRole = user.role || 'admin';
    } else if (user.id === 2) {
      userName = 'Default Doctor';
      userId = user.id;
      userRole = user.role || 'doctor';
    } else if (user.id === 3) {
      userName = 'Default Patient';
      userId = user.id;
      userRole = user.role || 'patient';
    } else if (user && user.id) {
      userId = user.id;
      userRole = user.role;
      
      // Check if firstName and lastName exist in req.user
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      
      if (fullName) {
        // We have the name already
        userName = fullName;
      } else if (user.username) {
        // Use username as fallback
        userName = user.username;
      } else {
        // Fetch from database (JWT doesn't include firstName/lastName)
        try {
          const User = require('../models/User');
          const dbUser = await User.findByPk(user.id, {
            attributes: ['firstName', 'lastName', 'username']
          });
          
          if (dbUser) {
            const dbFirstName = dbUser.firstName || '';
            const dbLastName = dbUser.lastName || '';
            const dbFullName = `${dbFirstName} ${dbLastName}`.trim();
            userName = dbFullName || dbUser.username || `User ${user.id}`;
          } else {
            userName = `User ${user.id}`;
          }
        } catch (dbError) {
          console.warn('⚠️  AuditLogger: Could not fetch user details from DB:', dbError.message);
          userName = `User ${user.id}`;
        }
      }
    } else {
      // No user in request - system operation
      console.warn('⚠️  AuditLogger: Using system fallback for audit log');
      userName = 'System';
      userId = 0;
      userRole = 'admin';
    }
    
    return {
      userId: userId,
      userRole: userRole,
      userName: userName,
      ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 
                 (req.connection?.socket ? req.connection.socket.remoteAddress : null),
      userAgent: req.get('User-Agent'),
      sessionId: req.session?.id || req.sessionID || null
    };
  }

  /**
   * Log when admin removes a patient
   * @param {Object} req - Express request object
   * @param {Object} patient - Patient object that was deleted
   */
  static async logPatientRemoval(req, patient) {
    const userInfo = await this.extractUserInfo(req);
    const patientName = `${patient.firstName} ${patient.lastName}`.trim();
    
    const auditEntry = await AuditLog.logAction({
      ...userInfo,
      action: 'removed_patient',
      actionDescription: `${userInfo.userName} removed patient ${patientName}`,
      targetType: 'patient',
      targetId: patient.id,
      targetName: patientName,
      metadata: {
        patientId: patient.id,
        patientName: patientName,
        deletedAt: new Date().toISOString()
      }
    });

    // Create critical notification
    await this.createNotificationIfCritical(auditEntry);
  }

  /**
   * Log when admin checks vital signs of a patient
   * @param {Object} req - Express request object
   * @param {Object} patient - Patient object
   * @param {Object} vitalSigns - Vital signs data
   */
  static async logVitalSignsCheck(req, patient, vitalSigns) {
    const userInfo = await this.extractUserInfo(req);
    const patientName = `${patient.firstName} ${patient.lastName}`.trim();
    
    await AuditLog.logAction({
      ...userInfo,
      action: 'checked_vital_signs',
      actionDescription: `${userInfo.userName} checked the vital signs of patient ${patientName}`,
      targetType: 'patient',
      targetId: patient.id,
      targetName: patientName,
      metadata: {
        patientId: patient.id,
        patientName: patientName,
        vitalSigns: vitalSigns,
        checkedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Log patient creation
   * @param {Object} req - Express request object
   * @param {number} patientId - Patient ID  
   * @param {string} patientName - Patient name
   * @param {Object} details - Additional details
   */
  static async logPatientCreation(req, patientId, patientName, details = {}) {
    const userInfo = await this.extractUserInfo(req);
    
    await AuditLog.logAction({
      ...userInfo,
      action: 'created_patient',
      actionDescription: `${userInfo.userName} created patient ${patientName}`,
      targetType: 'patient',
      targetId: patientId,
      targetName: patientName,
      metadata: {
        patientId: patientId,
        patientName: patientName,
        details: details,
        createdAt: new Date().toISOString()
      }
    });
  }

  /**
   * Log patient update
   * @param {Object} req - Express request object
   * @param {number} patientId - Patient ID  
   * @param {string} patientName - Patient name
   * @param {Object} details - Additional details
   */
  static async logPatientUpdate(req, patientId, patientName, details = {}) {
    const userInfo = await this.extractUserInfo(req);
    
    await AuditLog.logAction({
      ...userInfo,
      action: 'updated_patient',
      actionDescription: `${userInfo.userName} updated patient ${patientName}`,
      targetType: 'patient',
      targetId: patientId,
      targetName: patientName,
      metadata: {
        patientId: patientId,
        patientName: patientName,
        details: details,
        updatedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Log checkup status change
   * @param {number} userId - User ID
   * @param {number} sessionId - Session ID  
   * @param {string} patientName - Patient name
   * @param {Object} details - Additional details
   */
  static async logCheckupStatusChange(userId, sessionId, patientName, details = {}) {
    await AuditLog.logAction({
      userId: userId,
      userName: userId ? await this.getUserName(userId) : 'System Administrator',
      action: 'changed_checkup_status',
      actionDescription: `Checkup status changed for patient ${patientName}`,
      targetType: 'checkup',
      targetId: sessionId,
      targetName: patientName,
      metadata: {
        sessionId: sessionId,
        patientName: patientName,
        details: details,
        changedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Log checkup completion (force complete)
   * @param {number} userId - User ID
   * @param {number} sessionId - Session ID  
   * @param {string} patientName - Patient name
   * @param {Object} details - Additional details
   */
  static async logCheckupForceComplete(userId, sessionId, patientName, details = {}) {
    await AuditLog.logAction({
      userId: userId,
      userName: userId ? await this.getUserName(userId) : 'System Administrator',
      action: 'force_completed_checkup',
      actionDescription: `Checkup force completed for patient ${patientName}`,
      targetType: 'checkup',
      targetId: sessionId,
      targetName: patientName,
      metadata: {
        sessionId: sessionId,
        patientName: patientName,
        details: details,
        completedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Log when admin transfers patient to doctor
   * @param {Object} req - Express request object
   * @param {Object} patient - Patient object
   * @param {Object} doctor - Doctor object
   */
  static async logPatientTransfer(req, patient, doctor) {
    const userInfo = await this.extractUserInfo(req);
    const patientName = `${patient.firstName} ${patient.lastName}`.trim();
    const doctorName = `${doctor.firstName} ${doctor.lastName}`.trim();
    
    await AuditLog.logAction({
      ...userInfo,
      action: 'transferred_patient',
      actionDescription: `${userInfo.userName} added patient ${patientName} to queue for doctor ${doctorName}`,
      targetType: 'patient',
      targetId: patient.id,
      targetName: patientName,
      metadata: {
        patientId: patient.id,
        patientName: patientName,
        doctorId: doctor.id,
        doctorName: doctorName,
        transferredAt: new Date().toISOString()
      }
    });
  }

  /**
   * Log when patient is vaccinated
   * @param {Object} req - Express request object
   * @param {Object} patient - Patient object
   * @param {Object} vaccine - Vaccine information
   */
  static async logVaccination(req, patient, vaccine) {
    const userInfo = await this.extractUserInfo(req);
    const patientName = `${patient.firstName} ${patient.lastName}`.trim();
    const vaccineName = vaccine.name || vaccine.vaccineName || 'Unknown Vaccine';
    
    await AuditLog.logAction({
      ...userInfo,
      action: 'vaccinated_patient',
      actionDescription: `${userInfo.userName} vaccinated patient ${patientName} with ${vaccineName} at ${new Date().toLocaleString()}`,
      targetType: 'patient',
      targetId: patient.id,
      targetName: patientName,
      metadata: {
        patientId: patient.id,
        patientName: patientName,
        vaccine: vaccine,
        vaccinatedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Log when admin adds new user
   * @param {Object} req - Express request object
   * @param {Object} newUser - New user object
   */
  static async logUserCreation(req, newUser) {
    const userInfo = await this.extractUserInfo(req);
    const newUserName = `${newUser.firstName} ${newUser.lastName}`.trim();
    const newUserRole = newUser.accessLevel || newUser.role || 'Unknown Role';
    
    const auditEntry = await AuditLog.logAction({
      ...userInfo,
      action: 'added_new_user',
      actionDescription: `${userInfo.userName} added new user ${newUserName} as ${newUserRole}`,
      targetType: 'user',
      targetId: newUser.id,
      targetName: newUserName,
      metadata: {
        newUserId: newUser.id,
        newUserName: newUserName,
        newUserRole: newUserRole,
        newUserAccessLevel: newUser.accessLevel,
        createdAt: new Date().toISOString()
      }
    });

    // Create notification for user creation
    await this.createNotificationIfCritical(auditEntry);
  }

  /**
   * Log when doctor starts checkup
   * @param {Object} req - Express request object
   * @param {Object} patient - Patient object
   */
  static async logCheckupStart(req, patient) {
    const userInfo = await this.extractUserInfo(req);
    const patientName = `${patient.firstName} ${patient.lastName}`.trim();
    
    await AuditLog.logAction({
      ...userInfo,
      action: 'started_checkup',
      actionDescription: `${userInfo.userName} started the checkup at ${new Date().toLocaleString()} for patient ${patientName}`,
      targetType: 'checkup',
      targetId: patient.id,
      targetName: patientName,
      metadata: {
        patientId: patient.id,
        patientName: patientName,
        checkupStarted: new Date().toISOString()
      }
    });
  }

  /**
   * Log when doctor finishes checkup
   * @param {Object} req - Express request object
   * @param {Object} patient - Patient object
   */
  static async logCheckupCompletion(req, patient) {
    const userInfo = await this.extractUserInfo(req);
    const patientName = `${patient.firstName} ${patient.lastName}`.trim();
    
    await AuditLog.logAction({
      ...userInfo,
      action: 'finished_checkup',
      actionDescription: `${userInfo.userName} finished the checkup for patient ${patientName}`,
      targetType: 'checkup',
      targetId: patient.id,
      targetName: patientName,
      metadata: {
        patientId: patient.id,
        patientName: patientName,
        checkupCompleted: new Date().toISOString()
      }
    });
  }

  // Alias for compatibility
  static async logCheckupFinish(req, patient) {
    return this.logCheckupCompletion(req, patient);
  }

  /**
   * Log when management adds new medication
   * @param {Object} req - Express request object
   * @param {Object} medication - Medication object
   */
  static async logMedicationAddition(req, medication) {
    const userInfo = await this.extractUserInfo(req);
    const medicationDetails = `${medication.medicationName}, ${medication.brandName}, ${medication.form}, ${medication.strength}`;
    const unitsInStock = medication.unitsInStock || medication.quantityInStock || 0;
    const manufacturer = medication.manufacturer || 'Unknown Manufacturer';
    
    await AuditLog.logAction({
      ...userInfo,
      action: 'added_new_medication',
      actionDescription: `Added new medication ${medication.medicationName} (${medication.brandName}, ${medication.form}, ${medication.strength}, ${unitsInStock} units in stock) from ${manufacturer}`,
      targetType: 'medication',
      targetId: medication.id,
      targetName: medication.medicationName,
      metadata: {
        medicationId: medication.id,
        medicationName: medication.medicationName,
        brandName: medication.brandName,
        form: medication.form,
        strength: medication.strength,
        unitsInStock: unitsInStock,
        manufacturer: manufacturer,
        addedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Log when management adds new vaccine
   * @param {Object} req - Express request object
   * @param {Object} vaccine - Vaccine object
   */
  static async logVaccineAddition(req, vaccine) {
    const userInfo = await this.extractUserInfo(req);
    const dosesInStock = vaccine.dosesInStock || vaccine.quantityInStock || 0;
    const manufacturer = vaccine.manufacturer || 'Unknown Manufacturer';
    
    await AuditLog.logAction({
      ...userInfo,
      action: 'added_new_vaccine',
      actionDescription: `Added new vaccine ${vaccine.vaccineName} (${dosesInStock} doses in stock) from ${manufacturer}`,
      targetType: 'vaccine',
      targetId: vaccine.id,
      targetName: vaccine.vaccineName,
      metadata: {
        vaccineId: vaccine.id,
        vaccineName: vaccine.vaccineName,
        dosesInStock: dosesInStock,
        manufacturer: manufacturer,
        addedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Log when management adds stocks
   * @param {Object} req - Express request object
   * @param {Object} item - Medication or vaccine object
   * @param {number} quantityAdded - Quantity added
   * @param {Date} expiryDate - Expiry date
   * @param {string} itemType - 'medication' or 'vaccine'
   */
  static async logStockAddition(req, item, quantityAdded, expiryDate, itemType) {
    const userInfo = await this.extractUserInfo(req);
    const itemName = item.medicationName || item.vaccineName || 'Unknown Item';
    const expiryDateStr = expiryDate ? new Date(expiryDate).toLocaleDateString() : 'No expiry date';
    
    await AuditLog.logAction({
      ...userInfo,
      action: 'added_stocks',
      actionDescription: `Added stocks for ${itemName} with ${quantityAdded} more to be expired on ${expiryDateStr}`,
      targetType: itemType,
      targetId: item.id,
      targetName: itemName,
      metadata: {
        itemId: item.id,
        itemName: itemName,
        itemType: itemType,
        quantityAdded: quantityAdded,
        expiryDate: expiryDateStr,
        addedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Log when management removes a medication
   * @param {Object} req - Express request object
   * @param {Object} medication - Medication object being removed
   */
  static async logMedicationRemoval(req, medication) {
    const userInfo = await this.extractUserInfo(req);
    const medicationDetails = `${medication.name}${medication.brandName ? ` (${medication.brandName})` : ''}${medication.dosageForm ? `, ${medication.dosageForm}` : ''}${medication.strength ? `, ${medication.strength}` : ''}`;
    const stockInfo = medication.unitsInStock ? ` with ${medication.unitsInStock} units in stock` : '';
    
    await AuditLog.logAction({
      ...userInfo,
      action: 'removed_medication',
      actionDescription: `Removed medication ${medicationDetails}${stockInfo}`,
      targetType: 'medication',
      targetId: medication.id,
      targetName: medication.name,
      metadata: {
        medicationId: medication.id,
        medicationName: medication.name,
        brandName: medication.brandName,
        dosageForm: medication.dosageForm,
        strength: medication.strength,
        unitsInStock: medication.unitsInStock,
        manufacturer: medication.manufacturer,
        removedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Log when management removes a vaccine
   * @param {Object} req - Express request object
   * @param {Object} vaccine - Vaccine object being removed
   */
  static async logVaccineRemoval(req, vaccine) {
    const userInfo = await this.extractUserInfo(req);
    const vaccineDetails = vaccine.name;
    const stockInfo = vaccine.dosesInStock || vaccine.unitsInStock || vaccine.quantityInStock;
    const stockText = stockInfo ? ` with ${stockInfo} doses in stock` : '';
    
    await AuditLog.logAction({
      ...userInfo,
      action: 'removed_vaccine',
      actionDescription: `Removed vaccine ${vaccineDetails}${stockText}`,
      targetType: 'vaccine',
      targetId: vaccine.id,
      targetName: vaccine.name,
      metadata: {
        vaccineId: vaccine.id,
        vaccineName: vaccine.name,
        dosesInStock: stockInfo,
        manufacturer: vaccine.manufacturer,
        vaccineType: vaccine.vaccineType,
        removedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Log when management creates a report
   * @param {Object} req - Express request object
   * @param {Object} report - Report object
   */
  static async logReportCreation(req, report) {
    const userInfo = await this.extractUserInfo(req);
    const reportTitle = report.title || report.name || 'Untitled Report';
    
    await AuditLog.logAction({
      ...userInfo,
      action: 'created_report',
      actionDescription: `Created a report for ${reportTitle}`,
      targetType: 'report',
      targetId: report.id,
      targetName: reportTitle,
      metadata: {
        reportId: report.id,
        reportTitle: reportTitle,
        reportType: report.type || 'Unknown Type',
        createdAt: new Date().toISOString()
      }
    });
  }

  /**
   * Generic audit logging function for custom actions
   * @param {Object} req - Express request object
   * @param {string} action - Action identifier
   * @param {string} description - Human-readable description
   * @param {Object} options - Additional options (targetType, targetId, targetName, metadata)
   */
  static async logCustomAction(req, action, description, options = {}) {
    const userInfo = await this.extractUserInfo(req);
    
    await AuditLog.logAction({
      ...userInfo,
      action: action,
      actionDescription: description,
      targetType: options.targetType || null,
      targetId: options.targetId || null,
      targetName: options.targetName || null,
      metadata: options.metadata || null
    });
  }

  /**
   * Helper method to get user name by ID
   * @param {number} userId - User ID
   * @returns {string} User name
   */
  static async getUserName(userId) {
    try {
      const User = require('../models/User');
      const user = await User.findByPk(userId);
      if (user) {
        return `${user.firstName} ${user.lastName}`.trim() || user.username || 'Unknown User';
      }
      return 'Unknown User';
    } catch (error) {
      console.error('Error getting user name:', error);
      return 'Unknown User';
    }
  }

  /**
   * Log when admin creates a new user
   * @param {Object} req - Express request object
   * @param {Object} newUser - New user object
   */
  static async logUserCreation(req, newUser) {
    const userInfo = await this.extractUserInfo(req);
    const newUserName = `${newUser.firstName} ${newUser.lastName}`.trim();
    const newUserRole = newUser.accessLevel || newUser.role || 'Unknown Role';
    
    await AuditLog.logAction({
      ...userInfo,
      action: 'created_user',
      actionDescription: `${userInfo.userName} created new ${newUserRole} user: ${newUserName}`,
      targetType: 'user',
      targetId: newUser.id,
      targetName: newUserName,
      metadata: {
        newUserId: newUser.id,
        newUserName: newUserName,
        newUserRole: newUserRole,
        newUserEmail: newUser.email,
        newUserUsername: newUser.username,
        createdAt: new Date().toISOString()
      }
    });
  }

  /**
   * Log when admin updates a user
   * @param {Object} req - Express request object
   * @param {Object} user - Updated user object
   * @param {Object} changes - Changes made
   */
  static async logUserUpdate(req, user, changes = {}) {
    const userInfo = await this.extractUserInfo(req);
    const userName = `${user.firstName} ${user.lastName}`.trim();
    
    await AuditLog.logAction({
      ...userInfo,
      action: 'updated_user',
      actionDescription: `${userInfo.userName} updated user: ${userName}`,
      targetType: 'user',
      targetId: user.id,
      targetName: userName,
      metadata: {
        userId: user.id,
        userName: userName,
        changes: changes,
        updatedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Log when admin deletes a user
   * @param {Object} req - Express request object
   * @param {Object} user - Deleted user object
   */
  static async logUserDeletion(req, user) {
    const userInfo = await this.extractUserInfo(req);
    const userName = `${user.firstName} ${user.lastName}`.trim();
    
    const auditEntry = await AuditLog.logAction({
      ...userInfo,
      action: 'deleted_user',
      actionDescription: `${userInfo.userName} deleted user: ${userName}`,
      targetType: 'user',
      targetId: user.id,
      targetName: userName,
      metadata: {
        deletedUserId: user.id,
        deletedUserName: userName,
        deletedUserRole: user.role,
        deletedAt: new Date().toISOString()
      }
    });

    // Create critical notification for user deletion
    await this.createNotificationIfCritical(auditEntry);
  }

  /**
   * Log when user logs in
   * @param {Object} req - Express request object
   * @param {Object} user - User object
   */
  static async logUserLogin(req, user) {
    const userInfo = await this.extractUserInfo(req);
    const userName = `${user.firstName} ${user.lastName}`.trim();
    
    await AuditLog.logAction({
      ...userInfo,
      action: 'user_login',
      actionDescription: `User ${userName} logged in`,
      targetType: 'user',
      targetId: user.id,
      targetName: userName,
      metadata: {
        userId: user.id,
        userName: userName,
        userRole: user.role,
        loginTime: new Date().toISOString()
      }
    });
  }

  /**
   * Log when user logs out
   * @param {Object} req - Express request object
   * @param {Object} user - User object
   */
  static async logUserLogout(req, user) {
    const userInfo = await this.extractUserInfo(req);
    const userName = `${user.firstName} ${user.lastName}`.trim();
    
    await AuditLog.logAction({
      ...userInfo,
      action: 'user_logout',
      actionDescription: `User ${userName} logged out`,
      targetType: 'user',
      targetId: user.id,
      targetName: userName,
      metadata: {
        userId: user.id,
        userName: userName,
        userRole: user.role,
        logoutTime: new Date().toISOString()
      }
    });
  }

  /**
   * Log inventory management actions
   * @param {Object} req - Express request object
   * @param {string} action - Action type
   * @param {string} description - Description
   * @param {Object} details - Additional details
   */
  static async logInventoryAction(req, action, description, details = {}) {
    const userInfo = await this.extractUserInfo(req);
    
    await AuditLog.logAction({
      ...userInfo,
      action: action,
      actionDescription: `${userInfo.userName} ${description}`,
      targetType: details.itemType || 'inventory',
      targetId: details.itemId || null,
      targetName: details.itemName || 'Unknown Item',
      metadata: {
        ...details,
        actionTime: new Date().toISOString()
      }
    });
  }

  /**
   * Log report generation actions
   * @param {number} userId - User ID
   * @param {string} reportType - Type of report
   * @param {Object} details - Report details
   */
  static async logReportGeneration(userId, reportType, details = {}) {
    await AuditLog.logAction({
      userId: userId,
      userName: userId ? await this.getUserName(userId) : 'System Administrator',
      action: 'report_generated',
      actionDescription: `Generated ${reportType} report`,
      targetType: 'report',
      targetId: null,
      targetName: reportType,
      metadata: {
        reportType: reportType,
        ...details,
        generatedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Log patient QR check-in action (with req object for IP tracking)
   * @param {Object} req - Express request object
   * @param {number} patientId - Patient ID
   * @param {string} patientName - Patient name
   * @param {Object} details - Check-in details
   */
  static async logPatientCheckIn(req, patientId, patientName, details = {}) {
    const userInfo = await this.extractUserInfo(req);
    
    try {
      await AuditLog.logAction({
        ...userInfo,
        action: 'patient_check_in',
        actionDescription: `${userInfo.userName} checked in patient ${patientName} via ${details.method || 'QR scan'}`,
        targetType: 'patient',
        targetId: patientId,
        targetName: patientName,
        metadata: {
          patientId: patientId,
          patientName: patientName,
          ...details
        }
      });
    } catch (error) {
      console.error('❌ Failed to log patient check-in audit:', error.message);
      // Re-throw so calling code can handle it
      throw error;
    }
  }

  /**
   * Log checkup status update action
   * @param {number} doctorId - Doctor ID performing the action
   * @param {number} patientId - Patient ID
   * @param {string} patientName - Patient name
   * @param {Object} details - Update details
   */
  static async logCheckupStatusUpdate(doctorId, patientId, patientName, details = {}) {
    await AuditLog.logAction({
      userId: doctorId,
      userRole: 'doctor',
      userName: 'Doctor',
      ipAddress: null,
      userAgent: null,
      sessionId: null,
      action: 'checkup_status_update',
      actionDescription: `Updated checkup status for patient ${patientName} from ${details.oldStatus} to ${details.newStatus}`,
      targetType: 'checkup',
      targetId: details.sessionId,
      targetName: `Checkup for ${patientName}`,
      metadata: {
        patientId: patientId,
        patientName: patientName,
        doctorId: doctorId,
        ...details
      }
    });
  }

  /**
   * Log checkup force completion action
   * @param {number} userId - User ID performing the action
   * @param {number} patientId - Patient ID
   * @param {string} patientName - Patient name
   * @param {Object} details - Force completion details
   */
  static async logCheckupForceComplete(userId, patientId, patientName, details = {}) {
    await AuditLog.logAction({
      userId: userId,
      userRole: details.userRole || 'admin',
      userName: details.userRole === 'admin' ? 'Administrator' : 'Doctor',
      ipAddress: null,
      userAgent: null,
      sessionId: null,
      action: 'checkup_force_complete',
      actionDescription: `Force completed checkup for patient ${patientName}`,
      targetType: 'checkup',
      targetId: details.sessionId,
      targetName: `Checkup for ${patientName}`,
      metadata: {
        patientId: patientId,
        patientName: patientName,
        userId: userId,
        ...details
      }
    });
  }

  /**
   * Log patient creation action (with req object for IP tracking)
   * @param {Object} req - Express request object
   * @param {number} patientId - Created patient ID
   * @param {string} patientName - Created patient name
   * @param {Object} details - Patient creation details (familyId, hasUserAccount, etc.)
   */
  static async logPatientCreation(req, patientId, patientName, details = {}) {
    const userInfo = await this.extractUserInfo(req);
    
    try {
      const familyInfo = details.familyId 
        ? `Assigned to Family ID: ${details.familyId}${details.familyName ? ` (${details.familyName})` : ''}` 
        : 'No family assigned';
      
      const auditEntry = await AuditLog.create({
        userId: userInfo.userId,
        userRole: userInfo.userRole,
        userName: userInfo.userName,
        action: 'patient_created',
        actionDescription: `${userInfo.userName} created patient: ${patientName}. ${familyInfo}`,
        targetType: 'patient',
        targetId: patientId,
        targetName: patientName,
        metadata: {
          patientId: patientId,
          patientName: patientName,
          familyId: details.familyId || null,
          familyName: details.familyName || null,
          hasUserAccount: details.hasUserAccount || false,
          qrCode: details.qrCode || null,
          contactNumber: details.contactNumber || null,
          email: details.email || null,
          createdAt: new Date().toISOString()
        },
        ipAddress: userInfo.ipAddress,
        userAgent: userInfo.userAgent,
        sessionId: userInfo.sessionId,
        timestamp: new Date()
      });

      // Create critical notification for patient creation
      await this.createNotificationIfCritical(auditEntry);
      
      return auditEntry;
    } catch (error) {
      console.error('❌ Failed to log patient creation audit:', error.message);
      throw error;
    }
  }

  /**
   * Log family creation action (with req object for IP tracking)
   * @param {Object} req - Express request object
   * @param {number} familyId - Created family ID
   * @param {string} familyName - Created family name
   * @param {Object} details - Family creation details (surname, headOfFamily, etc.)
   */
  static async logFamilyCreation(req, familyId, familyName, details = {}) {
    const userInfo = await this.extractUserInfo(req);
    
    try {
      const auditEntry = await AuditLog.create({
        userId: userInfo.userId,
        userRole: userInfo.userRole,
        userName: userInfo.userName,
        action: 'created_family',
        actionDescription: `${userInfo.userName} created family: ${familyName}${details.surname ? ` (${details.surname})` : ''}`,
        targetType: 'family',
        targetId: familyId,
        targetName: familyName,
        metadata: {
          familyId: familyId,
          familyName: familyName,
          surname: details.surname || null,
          headOfFamily: details.headOfFamily || null,
          contactNumber: details.contactNumber || null,
          createdAt: new Date().toISOString()
        },
        ipAddress: userInfo.ipAddress,
        userAgent: userInfo.userAgent,
        sessionId: userInfo.sessionId,
        timestamp: new Date()
      });

      // Create critical notification for family creation
      await this.createNotificationIfCritical(auditEntry);
      
      return auditEntry;
    } catch (error) {
      console.error('❌ Failed to log family creation audit:', error.message);
      throw error;
    }
  }

  /**
   * Log family assignment action (when patient is assigned to a family)
   * @param {Object} req - Express request object
   * @param {number} patientId - Patient ID being assigned
   * @param {string} patientName - Patient name
   * @param {number} familyId - Family ID
   * @param {string} familyName - Family name
   * @param {Object} details - Additional details (newFamilyCreated, etc.)
   */
  static async logFamilyAssignment(req, patientId, patientName, familyId, familyName, details = {}) {
    const userInfo = await this.extractUserInfo(req);
    
    try {
      const actionDesc = details.newFamilyCreated 
        ? `${userInfo.userName} created family "${familyName}" and assigned patient ${patientName} to it`
        : `${userInfo.userName} assigned patient ${patientName} to family "${familyName}"`;
      
      const auditEntry = await AuditLog.create({
        userId: userInfo.userId,
        userRole: userInfo.userRole,
        userName: userInfo.userName,
        action: 'family_assigned',
        actionDescription: actionDesc,
        targetType: 'patient',
        targetId: patientId,
        targetName: patientName,
        metadata: {
          patientId: patientId,
          patientName: patientName,
          familyId: familyId,
          familyName: familyName,
          newFamilyCreated: details.newFamilyCreated || false,
          assignedAt: new Date().toISOString()
        },
        ipAddress: userInfo.ipAddress,
        userAgent: userInfo.userAgent,
        sessionId: userInfo.sessionId,
        timestamp: new Date()
      });
      
      return auditEntry;
    } catch (error) {
      console.error('❌ Failed to log family assignment audit:', error.message);
      throw error;
    }
  }

  /**
   * Log user deletion action (with req object for IP tracking)
   * @param {number} userId - Deleted user ID
   * @param {string} userName - Deleted user name
   * @param {string} userRole - Deleted user role
   * @param {number} performerId - ID of user performing deletion
   * @param {string} performerRole - Role of user performing deletion
   * @param {string} performerName - Name of user performing deletion
   * @param {Object} req - Express request object
   */
  static async logUserDeletion(userId, userName, userRole, performerId, performerRole, performerName, req) {
    const userInfo = await this.extractUserInfo(req);
    
    try {
      const auditEntry = await AuditLog.create({
        userId: performerId,
        userRole: performerRole,
        userName: performerName,
        action: 'deleted_user',
        actionDescription: `${performerName} deleted user account: ${userName} (${userRole})`,
        targetType: 'user',
        targetId: userId,
        targetName: userName,
        metadata: { 
          deletedUserId: userId,
          deletedUserName: userName,
          deletedUserRole: userRole,
          performedBy: performerName,
          deletedAt: new Date().toISOString()
        },
        ipAddress: userInfo.ipAddress,
        userAgent: userInfo.userAgent,
        sessionId: userInfo.sessionId,
        timestamp: new Date()
      });

      // Create critical notification for user deletion
      await this.createNotificationIfCritical(auditEntry);
      
      return auditEntry;
    } catch (error) {
      console.error('❌ Failed to log user deletion audit:', error.message);
      throw error;
    }
  }

  /**
   * Log report generation
   * @param {Object} req - Express request object
   * @param {string} reportType - Type of report generated
   * @param {Object} reportDetails - Report details (format, dateRange, filters, etc.)
   */
  static async logReportGeneration(req, reportType, reportDetails = {}) {
    const userInfo = await this.extractUserInfo(req);
    const reportName = reportDetails.reportName || reportType;
    const format = reportDetails.format || 'N/A';
    const dateRange = reportDetails.dateRange ? 
      `${reportDetails.dateRange.from || 'N/A'} to ${reportDetails.dateRange.to || 'N/A'}` : 
      'N/A';
    
    await AuditLog.logAction({
      ...userInfo,
      action: 'generated_report',
      actionDescription: `Generated ${reportName} report in ${format} format (Date range: ${dateRange})`,
      targetType: 'report',
      targetId: reportDetails.reportId || null,
      targetName: reportName,
      metadata: {
        reportType: reportType,
        reportName: reportName,
        format: format,
        dateRange: reportDetails.dateRange,
        filters: reportDetails.filters || {},
        isCustomReport: reportDetails.isCustomReport || false,
        generatedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Log disposal of expired inventory items
   * @param {Object} req - Express request object
   * @param {Object} item - Item being disposed (medication or vaccine batch)
   * @param {string} itemType - 'medication' or 'vaccine'
   * @param {string} reason - Reason for disposal (typically 'expired')
   */
  static async logItemDisposal(req, item, itemType, reason = 'expired') {
    const userInfo = await this.extractUserInfo(req);
    const itemName = item.medicationName || item.vaccineName || item.batchNumber || 'Unknown Item';
    const quantity = item.quantity || item.unitsInStock || 0;
    const expiryDate = item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A';
    
    await AuditLog.logAction({
      ...userInfo,
      action: 'disposed_item',
      actionDescription: `Disposed ${itemType} ${itemName} (Qty: ${quantity}, Expiry: ${expiryDate}, Reason: ${reason})`,
      targetType: itemType,
      targetId: item.id,
      targetName: itemName,
      metadata: {
        itemId: item.id,
        itemName: itemName,
        itemType: itemType,
        batchNumber: item.batchNumber,
        quantity: quantity,
        expiryDate: expiryDate,
        disposalReason: reason,
        disposedAt: new Date().toISOString(),
        disposedBy: userInfo.userName
      }
    });
  }

  /**
   * Log stock update (consolidated from add/deduct/adjust)
   * @param {Object} req - Express request object
   * @param {Object} item - Item being updated
   * @param {string} updateType - 'added', 'deducted', or 'adjusted'
   * @param {number} quantity - Quantity changed
   * @param {string} itemType - 'medication' or 'vaccine'
   * @param {Object} additionalDetails - Additional details like expiry date, reason, etc.
   */
  static async logStockUpdate(req, item, updateType, quantity, itemType, additionalDetails = {}) {
    const userInfo = await this.extractUserInfo(req);
    const itemName = item.medicationName || item.vaccineName || item.name || 'Unknown Item';
    
    let actionDescription = '';
    switch (updateType) {
      case 'added':
        const expiryDateStr = additionalDetails.expiryDate ? 
          new Date(additionalDetails.expiryDate).toLocaleDateString() : 
          'No expiry date';
        actionDescription = `Added ${quantity} units to ${itemName} (Expiry: ${expiryDateStr})`;
        break;
      case 'deducted':
        const deductReason = additionalDetails.reason || 'usage';
        actionDescription = `Deducted ${quantity} units from ${itemName} (Reason: ${deductReason})`;
        break;
      case 'adjusted':
        const oldQty = additionalDetails.oldQuantity || 0;
        const newQty = additionalDetails.newQuantity || quantity;
        actionDescription = `Adjusted ${itemName} stock from ${oldQty} to ${newQty} units`;
        break;
      default:
        actionDescription = `Updated stock for ${itemName} by ${quantity} units`;
    }
    
    await AuditLog.logAction({
      ...userInfo,
      action: 'stock_update',
      actionDescription: actionDescription,
      targetType: itemType,
      targetId: item.id,
      targetName: itemName,
      metadata: {
        itemId: item.id,
        itemName: itemName,
        itemType: itemType,
        updateType: updateType,
        quantity: quantity,
        expiryDate: additionalDetails.expiryDate || null,
        reason: additionalDetails.reason || null,
        oldQuantity: additionalDetails.oldQuantity || null,
        newQuantity: additionalDetails.newQuantity || null,
        batchNumber: item.batchNumber || null,
        updatedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Log when admin creates a backup
   * @param {Object} req - Express request object
   * @param {string} backupId - Backup ID
   * @param {Object} backupDetails - Backup details
   */
  static async logBackupCreation(req, backupId, backupDetails) {
    const userInfo = await this.extractUserInfo(req);
    
    const actionDescription = `Created system backup: ${backupDetails.description || 'No description'}`;
    
    await AuditLog.logAction({
      ...userInfo,
      action: 'backup_created',
      actionDescription: actionDescription,
      targetType: 'backup',
      targetId: backupId,
      targetName: backupDetails.description || backupId,
      metadata: {
        backupId: backupId,
        includeDatabase: backupDetails.includeDatabase,
        includeFiles: backupDetails.includeFiles,
        includeImages: backupDetails.includeImages,
        compressionLevel: backupDetails.compressionLevel,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Log when admin restores from a backup
   * @param {Object} req - Express request object
   * @param {string} backupId - Backup ID
   * @param {Object} restoreDetails - Restore details
   */
  static async logBackupRestore(req, backupId, restoreDetails) {
    const userInfo = await this.extractUserInfo(req);
    
    const actionDescription = `Restored system from backup: ${restoreDetails.backupDescription || backupId}`;
    
    // This is a critical action so mark it as such
    await AuditLog.logAction({
      ...userInfo,
      action: 'backup_restored',
      actionDescription: actionDescription,
      targetType: 'backup',
      targetId: backupId,
      targetName: restoreDetails.backupDescription || backupId,
      metadata: {
        backupId: backupId,
        restoreDatabase: restoreDetails.restoreDatabase,
        restoreFiles: restoreDetails.restoreFiles,
        restoreImages: restoreDetails.restoreImages,
        overwriteExisting: restoreDetails.overwriteExisting,
        timestamp: new Date().toISOString()
      }
    });
  }
}

module.exports = AuditLogger;
