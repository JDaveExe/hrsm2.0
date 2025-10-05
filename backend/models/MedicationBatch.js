const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MedicationBatch = sequelize.define('MedicationBatch', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: 'Unique batch record identifier'
    },
    
    medicationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'medications',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT', // Prevent deletion if batches exist
      comment: 'Reference to parent medication'
    },
    
    batchNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true, // Ensure batch numbers are unique across all medications
      comment: 'Unique batch identifier (e.g., PAR-1010, AMB-2024-001)'
    },
    
    quantityReceived: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [1],
          msg: 'Quantity received must be at least 1'
        }
      },
      comment: 'Original quantity when batch was received'
    },
    
    quantityRemaining: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: function() {
        return this.quantityReceived || 0;
      },
      validate: {
        min: {
          args: [0],
          msg: 'Quantity remaining cannot be negative'
        },
        isValidRemaining(value) {
          if (value > this.quantityReceived) {
            throw new Error('Quantity remaining cannot exceed quantity received');
          }
        }
      },
      comment: 'Current remaining quantity in this batch'
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
      comment: 'Cost per unit for this specific batch'
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
      comment: 'Expiration date for this specific batch'
    },
    
    receivedDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Date when this batch was received in inventory'
    },
    
    supplier: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Supplier or manufacturer of this batch'
    },
    
    purchaseOrderNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Reference to purchase order'
    },
    
    storageLocation: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Physical storage location (e.g., Shelf A-1, Fridge B-2)'
    },
    
    status: {
      type: DataTypes.ENUM,
      values: ['active', 'expired', 'recalled', 'depleted', 'quarantine'],
      allowNull: false,
      defaultValue: 'active',
      comment: 'Current status of this batch'
    },
    
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional notes about this batch'
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
    quantityUsed: {
      type: DataTypes.VIRTUAL,
      get() {
        return (this.quantityReceived || 0) - (this.quantityRemaining || 0);
      },
      comment: 'Calculated quantity used from this batch'
    },
    
    usagePercentage: {
      type: DataTypes.VIRTUAL,
      get() {
        if (!this.quantityReceived || this.quantityReceived === 0) return 0;
        return Math.round(((this.quantityReceived - this.quantityRemaining) / this.quantityReceived) * 100);
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
    }
  }, {
    tableName: 'medication_batches',
    timestamps: true, // Adds createdAt and updatedAt
    indexes: [
      {
        unique: true,
        fields: ['batchNumber'],
        name: 'unique_batch_number'
      },
      {
        fields: ['medicationId'],
        name: 'idx_medication_batches_medication_id'
      },
      {
        fields: ['expiryDate'],
        name: 'idx_medication_batches_expiry_date'
      },
      {
        fields: ['status'],
        name: 'idx_medication_batches_status'
      },
      {
        fields: ['medicationId', 'expiryDate'],
        name: 'idx_medication_fifo'
      },
      {
        fields: ['medicationId', 'status', 'expiryDate'],
        name: 'idx_medication_active_fifo'
      }
    ],
    hooks: {
      beforeCreate: async (batch, options) => {
        // Auto-set quantityRemaining if not provided
        if (batch.quantityRemaining === null || batch.quantityRemaining === undefined) {
          batch.quantityRemaining = batch.quantityReceived;
        }
        
        // Auto-update status based on expiry date
        if (batch.expiryDate && new Date(batch.expiryDate) < new Date()) {
          batch.status = 'expired';
        }
      },
      
      beforeUpdate: async (batch, options) => {
        // Auto-update status if quantity becomes zero
        if (batch.quantityRemaining === 0 && batch.status === 'active') {
          batch.status = 'depleted';
        }
        
        // Auto-update status based on expiry date
        if (batch.expiryDate && new Date(batch.expiryDate) < new Date() && batch.status === 'active') {
          batch.status = 'expired';
        }
      }
    },
    validate: {
      quantityConsistency() {
        if (this.quantityRemaining > this.quantityReceived) {
          throw new Error('Quantity remaining cannot exceed quantity received');
        }
      }
    }
  });

  // Class methods for batch operations
  MedicationBatch.getFifoQueue = function(medicationId, excludeStatuses = ['expired', 'depleted', 'recalled']) {
    return this.findAll({
      where: {
        medicationId: medicationId,
        status: {
          [sequelize.Sequelize.Op.notIn]: excludeStatuses
        },
        quantityRemaining: {
          [sequelize.Sequelize.Op.gt]: 0
        }
      },
      order: [
        ['expiryDate', 'ASC'], // First In, First Out by expiry date
        ['receivedDate', 'ASC'] // Secondary sort by received date
      ]
    });
  };

  MedicationBatch.getExpiringBatches = function(daysAhead = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    return this.findAll({
      where: {
        expiryDate: {
          [sequelize.Sequelize.Op.lte]: futureDate,
          [sequelize.Sequelize.Op.gt]: new Date()
        },
        status: 'active',
        quantityRemaining: {
          [sequelize.Sequelize.Op.gt]: 0
        }
      },
      order: [['expiryDate', 'ASC']],
      include: [{
        model: sequelize.models.Medication,
        as: 'medication',
        attributes: ['name', 'strength', 'form']
      }]
    });
  };

  MedicationBatch.getTotalStock = function(medicationId) {
    return this.sum('quantityRemaining', {
      where: {
        medicationId: medicationId,
        status: {
          [sequelize.Sequelize.Op.notIn]: ['expired', 'depleted', 'recalled']
        }
      }
    });
  };

  return MedicationBatch;
};