const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const VaccineBatch = sequelize.define('VaccineBatch', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: 'Unique vaccine batch record identifier'
    },
    
    vaccineId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Reference to vaccine ID in vaccines.json file (not database foreign key)'
    },
    
    // Store vaccine name for easier querying without JSON lookups
    vaccineName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Vaccine name from JSON data for easier identification and querying'
    },
    
    batchNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true, // Ensure batch numbers are unique across all vaccines
      comment: 'Unique batch identifier (e.g., BCG-2024-001, HEP-2025-010)'
    },
    
    lotNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Vaccine lot number for tracking and safety'
    },
    
    dosesReceived: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [1],
          msg: 'Doses received must be at least 1'
        }
      },
      comment: 'Original number of doses when batch was received'
    },
    
    dosesRemaining: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: function() {
        return this.dosesReceived || 0;
      },
      validate: {
        min: {
          args: [0],
          msg: 'Doses remaining cannot be negative'
        },
        isValidRemaining(value) {
          if (value > this.dosesReceived) {
            throw new Error('Doses remaining cannot exceed doses received');
          }
        }
      },
      comment: 'Current remaining doses in this batch'
    },
    
    unitCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'Unit cost must be non-negative'
        }
      },
      comment: 'Cost per dose for this specific batch'
    },
    
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: {
          msg: 'Expiry date must be a valid date'
        }
        // Removed future date validation for migration - allow expired dates
      },
      comment: 'Expiration date for this specific vaccine batch'
    },
    
    receivedDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Date when this batch was received in inventory'
    },
    
    manufacturer: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Manufacturer of this vaccine batch'
    },
    
    supplier: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Supplier or distributor of this batch'
    },
    
    purchaseOrderNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Reference to purchase order'
    },
    
    storageLocation: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Physical storage location (e.g., Cold Storage A-1, Freezer B-2)'
    },
    
    storageTemperature: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Required storage temperature (e.g., 2-8°C, -15°C to -25°C)'
    },
    
    vvmStage: {
      type: DataTypes.ENUM,
      values: ['1', '2', '3', '4'],
      allowNull: true,
      comment: 'Vaccine Vial Monitor stage (1=good, 4=expired)'
    },
    
    status: {
      type: DataTypes.ENUM,
      values: ['active', 'expired', 'recalled', 'depleted', 'quarantine', 'discarded'],
      allowNull: false,
      defaultValue: 'active',
      comment: 'Current status of this vaccine batch'
    },
    
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional notes about this batch (cold chain breaks, etc.)'
    },
    
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'User ID who created this batch record'
    },
    
    lastUpdatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'User ID who last updated this batch'
    },
    
    // Virtual fields for calculated values
    dosesUsed: {
      type: DataTypes.VIRTUAL,
      get() {
        return (this.dosesReceived || 0) - (this.dosesRemaining || 0);
      },
      comment: 'Calculated doses used from this batch'
    },
    
    usagePercentage: {
      type: DataTypes.VIRTUAL,
      get() {
        if (!this.dosesReceived || this.dosesReceived === 0) return 0;
        return Math.round(((this.dosesReceived - this.dosesRemaining) / this.dosesReceived) * 100);
      },
      comment: 'Percentage of batch used'
    },
    
    daysUntilExpiry: {
      type: DataTypes.VIRTUAL,
      get() {
        if (!this.expiryDate) return null;
        const today = new Date();
        const expiry = new Date(this.expiryDate);
        const diffTime = expiry - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      },
      comment: 'Days until expiry (negative if expired)'
    },
    
    isExpired: {
      type: DataTypes.VIRTUAL,
      get() {
        if (!this.expiryDate) return false;
        return new Date(this.expiryDate) < new Date();
      },
      comment: 'Boolean indicating if batch is expired'
    },
    
    isExpiringSoon: {
      type: DataTypes.VIRTUAL,
      get() {
        const daysUntilExpiry = this.daysUntilExpiry;
        return daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30;
      },
      comment: 'Boolean indicating if batch expires within 30 days'
    },
    
    isColdChainCritical: {
      type: DataTypes.VIRTUAL,
      get() {
        // Mark as critical if storage temp is specified and it's a cold chain vaccine
        return this.storageTemperature && (
          this.storageTemperature.includes('°C') || 
          this.storageTemperature.toLowerCase().includes('cold') ||
          this.storageTemperature.toLowerCase().includes('freeze')
        );
      },
      comment: 'Boolean indicating if vaccine requires cold chain management'
    }
  }, {
    tableName: 'vaccine_batches',
    timestamps: true, // Adds createdAt and updatedAt
    indexes: [
      {
        unique: true,
        fields: ['batchNumber'],
        name: 'unique_vaccine_batch_number'
      },
      {
        fields: ['vaccineId'],
        name: 'idx_vaccine_batches_vaccine_id'
      },
      {
        fields: ['expiryDate'],
        name: 'idx_vaccine_batches_expiry_date'
      },
      {
        fields: ['status'],
        name: 'idx_vaccine_batches_status'
      },
      {
        fields: ['vaccineId', 'expiryDate'],
        name: 'idx_vaccine_fifo'
      },
      {
        fields: ['vaccineId', 'status', 'expiryDate'],
        name: 'idx_vaccine_active_fifo'
      },
      {
        fields: ['lotNumber'],
        name: 'idx_vaccine_batches_lot_number'
      }
    ],
    hooks: {
      beforeCreate: async (batch, options) => {
        // Auto-set dosesRemaining if not provided
        if (batch.dosesRemaining === null || batch.dosesRemaining === undefined) {
          batch.dosesRemaining = batch.dosesReceived;
        }
        
        // Auto-update status based on expiry date
        if (batch.expiryDate && new Date(batch.expiryDate) < new Date()) {
          batch.status = 'expired';
        }
      },
      
      beforeUpdate: async (batch, options) => {
        // Auto-update status if quantity becomes zero
        if (batch.dosesRemaining === 0 && batch.status === 'active') {
          batch.status = 'depleted';
        }
        
        // Auto-update status based on expiry date
        if (batch.expiryDate && new Date(batch.expiryDate) < new Date() && batch.status === 'active') {
          batch.status = 'expired';
        }
      }
    },
    validate: {
      doseConsistency() {
        if (this.dosesRemaining > this.dosesReceived) {
          throw new Error('Doses remaining cannot exceed doses received');
        }
      }
    }
  });

  // Class methods for batch operations
  VaccineBatch.getFifoQueue = function(vaccineId, excludeStatuses = ['expired', 'depleted', 'recalled']) {
    return this.findAll({
      where: {
        vaccineId: vaccineId,
        status: {
          [sequelize.Sequelize.Op.notIn]: excludeStatuses
        },
        dosesRemaining: {
          [sequelize.Sequelize.Op.gt]: 0
        }
      },
      order: [
        ['expiryDate', 'ASC'], // First In, First Out by expiry date
        ['receivedDate', 'ASC'] // Secondary sort by received date
      ]
    });
  };

  VaccineBatch.getExpiringBatches = function(daysAhead = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    return this.findAll({
      where: {
        expiryDate: {
          [sequelize.Sequelize.Op.lte]: futureDate,
          [sequelize.Sequelize.Op.gt]: new Date()
        },
        status: 'active',
        dosesRemaining: {
          [sequelize.Sequelize.Op.gt]: 0
        }
      },
      order: [['expiryDate', 'ASC']],
      include: [{
        model: sequelize.models.Vaccine,
        as: 'vaccine',
        attributes: ['name', 'manufacturer']
      }]
    });
  };

  VaccineBatch.getTotalDoses = function(vaccineId) {
    return this.sum('dosesRemaining', {
      where: {
        vaccineId: vaccineId,
        status: {
          [sequelize.Sequelize.Op.notIn]: ['expired', 'depleted', 'recalled']
        }
      }
    });
  };

  return VaccineBatch;
};