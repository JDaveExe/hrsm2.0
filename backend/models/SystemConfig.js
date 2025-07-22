const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
  // Configuration key (unique identifier)
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  // Configuration value
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // Data type for validation
  dataType: {
    type: String,
    required: true,
    enum: ['string', 'number', 'boolean', 'object', 'array'],
    default: 'string'
  },
  
  // Configuration category
  category: {
    type: String,
    required: true,
    enum: [
      'general',
      'appointment',
      'notification',
      'security',
      'qr_code',
      'vital_signs',
      'medical_records',
      'user_management',
      'family_management',
      'system_maintenance'
    ],
    default: 'general'
  },
  
  // Display information
  displayName: {
    type: String,
    required: true
  },
  
  description: {
    type: String,
    required: true
  },
  
  // Validation rules
  validation: {
    required: {
      type: Boolean,
      default: false
    },
    min: Number,
    max: Number,
    pattern: String,
    options: [String] // For enum-like configurations
  },
  
  // Access control
  isPublic: {
    type: Boolean,
    default: false // If true, can be read by non-admin users
  },
  
  isEditable: {
    type: Boolean,
    default: true // If false, cannot be modified through API
  },
  
  // Change tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Version history
  version: {
    type: Number,
    default: 1
  },
  
  previousValue: mongoose.Schema.Types.Mixed,
  changeHistory: [{
    value: mongoose.Schema.Types.Mixed,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }]
}, {
  timestamps: true
});

// Indexes
systemConfigSchema.index({ key: 1 });
systemConfigSchema.index({ category: 1 });
systemConfigSchema.index({ isPublic: 1 });

// Virtual for formatted value based on data type
systemConfigSchema.virtual('formattedValue').get(function() {
  switch (this.dataType) {
    case 'boolean':
      return Boolean(this.value);
    case 'number':
      return Number(this.value);
    case 'object':
    case 'array':
      return typeof this.value === 'object' ? this.value : JSON.parse(this.value);
    default:
      return String(this.value);
  }
});

// Method to validate value against validation rules
systemConfigSchema.methods.validateValue = function(newValue) {
  const { validation } = this;
  
  if (!validation) return { isValid: true };
  
  // Required check
  if (validation.required && (newValue === null || newValue === undefined || newValue === '')) {
    return { isValid: false, error: 'Value is required' };
  }
  
  // Type-specific validation
  switch (this.dataType) {
    case 'number':
      if (isNaN(Number(newValue))) {
        return { isValid: false, error: 'Value must be a number' };
      }
      const numValue = Number(newValue);
      if (validation.min !== undefined && numValue < validation.min) {
        return { isValid: false, error: `Value must be at least ${validation.min}` };
      }
      if (validation.max !== undefined && numValue > validation.max) {
        return { isValid: false, error: `Value must be at most ${validation.max}` };
      }
      break;
      
    case 'string':
      if (validation.pattern) {
        const regex = new RegExp(validation.pattern);
        if (!regex.test(newValue)) {
          return { isValid: false, error: 'Value does not match required pattern' };
        }
      }
      if (validation.options && validation.options.length > 0) {
        if (!validation.options.includes(newValue)) {
          return { isValid: false, error: `Value must be one of: ${validation.options.join(', ')}` };
        }
      }
      break;
      
    case 'boolean':
      if (typeof newValue !== 'boolean' && newValue !== 'true' && newValue !== 'false') {
        return { isValid: false, error: 'Value must be a boolean' };
      }
      break;
  }
  
  return { isValid: true };
};

// Method to update configuration value
systemConfigSchema.methods.updateValue = function(newValue, updatedBy, reason = '') {
  const validation = this.validateValue(newValue);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }
  
  // Store previous value in history
  this.changeHistory.push({
    value: this.value,
    changedBy: this.updatedBy || this.createdBy,
    changedAt: this.updatedAt || this.createdAt,
    reason: reason
  });
  
  // Update values
  this.previousValue = this.value;
  this.value = newValue;
  this.updatedBy = updatedBy;
  this.version += 1;
  
  return this;
};

// Static method to get configuration by key
systemConfigSchema.statics.getConfig = async function(key) {
  const config = await this.findOne({ key });
  return config ? config.formattedValue : null;
};

// Static method to set configuration
systemConfigSchema.statics.setConfig = async function(key, value, updatedBy, reason = '') {
  const config = await this.findOne({ key });
  if (!config) {
    throw new Error(`Configuration key '${key}' not found`);
  }
  
  if (!config.isEditable) {
    throw new Error(`Configuration key '${key}' is not editable`);
  }
  
  config.updateValue(value, updatedBy, reason);
  await config.save();
  
  return config;
};

// Static method to get configurations by category
systemConfigSchema.statics.getByCategory = async function(category, includeNonPublic = false) {
  const filter = { category };
  if (!includeNonPublic) {
    filter.isPublic = true;
  }
  
  return this.find(filter).sort({ displayName: 1 });
};

// Static method to initialize default configurations
systemConfigSchema.statics.initializeDefaults = async function(adminUserId) {
  const defaultConfigs = [
    // General Settings
    {
      key: 'system_name',
      value: 'Maybunga Healthcare Management System',
      dataType: 'string',
      category: 'general',
      displayName: 'System Name',
      description: 'The display name of the healthcare management system',
      isPublic: true,
      createdBy: adminUserId
    },
    {
      key: 'clinic_name',
      value: 'Maybunga Health Center',
      dataType: 'string',
      category: 'general',
      displayName: 'Clinic Name',
      description: 'The name of the healthcare facility',
      isPublic: true,
      createdBy: adminUserId
    },
    {
      key: 'clinic_address',
      value: 'Maybunga, Pasig City, Philippines',
      dataType: 'string',
      category: 'general',
      displayName: 'Clinic Address',
      description: 'The physical address of the healthcare facility',
      isPublic: true,
      createdBy: adminUserId
    },
    {
      key: 'clinic_contact',
      value: '+63-XXX-XXX-XXXX',
      dataType: 'string',
      category: 'general',
      displayName: 'Clinic Contact Number',
      description: 'Primary contact number for the clinic',
      isPublic: true,
      createdBy: adminUserId
    },
    
    // Appointment Settings
    {
      key: 'appointment_duration',
      value: 30,
      dataType: 'number',
      category: 'appointment',
      displayName: 'Default Appointment Duration (minutes)',
      description: 'Default duration for appointments in minutes',
      validation: { min: 15, max: 120 },
      isPublic: true,
      createdBy: adminUserId
    },
    {
      key: 'advance_booking_days',
      value: 30,
      dataType: 'number',
      category: 'appointment',
      displayName: 'Advance Booking Limit (days)',
      description: 'Maximum number of days in advance appointments can be booked',
      validation: { min: 1, max: 365 },
      isPublic: true,
      createdBy: adminUserId
    },
    {
      key: 'same_day_booking',
      value: true,
      dataType: 'boolean',
      category: 'appointment',
      displayName: 'Allow Same Day Booking',
      description: 'Whether patients can book appointments for the same day',
      isPublic: true,
      createdBy: adminUserId
    },
    
    // QR Code Settings
    {
      key: 'qr_code_expiry_hours',
      value: 24,
      dataType: 'number',
      category: 'qr_code',
      displayName: 'QR Code Expiry (hours)',
      description: 'Number of hours before a QR code expires',
      validation: { min: 1, max: 168 }, // 1 hour to 1 week
      createdBy: adminUserId
    },
    {
      key: 'qr_code_size',
      value: 200,
      dataType: 'number',
      category: 'qr_code',
      displayName: 'QR Code Size (pixels)',
      description: 'Size of generated QR codes in pixels',
      validation: { min: 100, max: 500 },
      createdBy: adminUserId
    },
    
    // Security Settings
    {
      key: 'session_timeout_minutes',
      value: 60,
      dataType: 'number',
      category: 'security',
      displayName: 'Session Timeout (minutes)',
      description: 'Number of minutes before user sessions expire',
      validation: { min: 15, max: 480 }, // 15 minutes to 8 hours
      createdBy: adminUserId
    },
    {
      key: 'password_min_length',
      value: 6,
      dataType: 'number',
      category: 'security',
      displayName: 'Minimum Password Length',
      description: 'Minimum number of characters required for passwords',
      validation: { min: 6, max: 50 },
      createdBy: adminUserId
    },
    {
      key: 'max_login_attempts',
      value: 5,
      dataType: 'number',
      category: 'security',
      displayName: 'Maximum Login Attempts',
      description: 'Maximum number of failed login attempts before account lockout',
      validation: { min: 3, max: 10 },
      createdBy: adminUserId
    },
    
    // Notification Settings
    {
      key: 'email_notifications',
      value: true,
      dataType: 'boolean',
      category: 'notification',
      displayName: 'Enable Email Notifications',
      description: 'Whether to send email notifications to users',
      isPublic: true,
      createdBy: adminUserId
    },
    {
      key: 'sms_notifications',
      value: false,
      dataType: 'boolean',
      category: 'notification',
      displayName: 'Enable SMS Notifications',
      description: 'Whether to send SMS notifications to users',
      isPublic: true,
      createdBy: adminUserId
    }
  ];
  
  for (const configData of defaultConfigs) {
    const existing = await this.findOne({ key: configData.key });
    if (!existing) {
      await this.create(configData);
    }
  }
};

const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);

module.exports = SystemConfig;
