const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Medication = sequelize.define('Medication', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    genericName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    brandName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    category: {
      type: DataTypes.ENUM,
      values: [
        'Analgesics & Antipyretics',
        'Antibiotics',
        'Anti-inflammatory & Steroids',
        'Cardiovascular Medications',
        'Respiratory Medications',
        'Gastrointestinal Medications',
        'Antihistamines & Allergy',
        'Dermatological',
        'Endocrine & Diabetes',
        'Neurological & Psychiatric',
        'Vitamins & Supplements',
        'Herbal & Traditional',
        'Ophthalmic',
        'Otic (Ear)',
        'Emergency & Critical Care',
        'Contraceptives',
        'Anti-parasitic'
      ],
      allowNull: false
    },
    dosage: {
      type: DataTypes.STRING,
      allowNull: false
    },
    form: {
      type: DataTypes.ENUM,
      values: [
        'Tablet',
        'Capsule',
        'Syrup',
        'Suspension',
        'Injection',
        'Drops',
        'Cream',
        'Ointment',
        'Lotion',
        'Inhaler',
        'Nebule',
        'Powder',
        'Suppository'
      ],
      allowNull: false
    },
    strength: {
      type: DataTypes.STRING,
      allowNull: false
    },
    manufacturer: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    // REMOVED FIELDS (now handled by MedicationBatch):
    // - batchNumber (moved to MedicationBatch table)
    // - unitsInStock (now calculated from batches)
    // - expiryDate (moved to MedicationBatch table)
    
    minimumStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 50
    },
    
    // Keep unitCost and sellingPrice as defaults for new batches
    unitCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Default unit cost for new batches'
    },
    sellingPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Default selling price'
    },
    
    storageConditions: {
      type: DataTypes.STRING,
      allowNull: true
    },
    administrationRoute: {
      type: DataTypes.STRING,
      allowNull: true
    },
    indication: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    dosageInstructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    sideEffects: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    contraindications: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    interactions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    precautions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isPrescriptionRequired: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    status: {
      type: DataTypes.ENUM,
      values: ['Available', 'Low Stock', 'Out of Stock', 'Expired', 'Discontinued'],
      allowNull: false,
      defaultValue: 'Available'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // NEW VIRTUAL FIELDS (calculated from batches)
    totalStock: {
      type: DataTypes.VIRTUAL,
      get() {
        if (!this.batches) return 0;
        return this.batches
          .filter(batch => batch.status === 'active' && batch.quantityRemaining > 0)
          .reduce((sum, batch) => sum + (batch.quantityRemaining || 0), 0);
      },
      comment: 'Total stock across all active batches'
    },
    
    unitsInStock: {
      type: DataTypes.VIRTUAL,
      get() {
        // Alias for totalStock to maintain compatibility
        return this.totalStock;
      },
      comment: 'Alias for totalStock for backward compatibility'
    },
    
    quantityInStock: {
      type: DataTypes.VIRTUAL,
      get() {
        // Another alias for totalStock to maintain compatibility
        return this.totalStock;
      },
      comment: 'Another alias for totalStock for backward compatibility'
    },
    
    nextExpiryDate: {
      type: DataTypes.VIRTUAL,
      get() {
        if (!this.batches || this.batches.length === 0) return null;
        
        const activeBatches = this.batches.filter(batch => 
          batch.status === 'active' && batch.quantityRemaining > 0
        );
        
        if (activeBatches.length === 0) return null;
        
        const earliestExpiry = activeBatches
          .map(batch => new Date(batch.expiryDate))
          .sort((a, b) => a - b)[0];
        
        return earliestExpiry;
      },
      comment: 'Earliest expiry date from active batches'
    },
    
    expiryDate: {
      type: DataTypes.VIRTUAL,
      get() {
        // Alias for nextExpiryDate to maintain compatibility
        return this.nextExpiryDate;
      },
      comment: 'Alias for nextExpiryDate for backward compatibility'
    },
    
    batchCount: {
      type: DataTypes.VIRTUAL,
      get() {
        if (!this.batches) return 0;
        return this.batches.filter(batch => batch.status === 'active').length;
      },
      comment: 'Number of active batches'
    },
    
    expiringBatchesCount: {
      type: DataTypes.VIRTUAL,
      get() {
        if (!this.batches) return 0;
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        return this.batches.filter(batch => 
          batch.status === 'active' && 
          batch.quantityRemaining > 0 &&
          new Date(batch.expiryDate) <= thirtyDaysFromNow
        ).length;
      },
      comment: 'Number of batches expiring within 30 days'
    },
    
    averageUnitCost: {
      type: DataTypes.VIRTUAL,
      get() {
        if (!this.batches) return this.unitCost || 0;
        
        const activeBatches = this.batches.filter(batch => 
          batch.status === 'active' && batch.quantityRemaining > 0
        );
        
        if (activeBatches.length === 0) return this.unitCost || 0;
        
        const totalValue = activeBatches.reduce((sum, batch) => 
          sum + (batch.unitCost * batch.quantityRemaining), 0
        );
        const totalQuantity = activeBatches.reduce((sum, batch) => 
          sum + batch.quantityRemaining, 0
        );
        
        return totalQuantity > 0 ? (totalValue / totalQuantity) : (this.unitCost || 0);
      },
      comment: 'Weighted average unit cost across active batches'
    }
  }, {
    tableName: 'medications',
    timestamps: true,
    indexes: [
      {
        fields: ['name']
      },
      {
        fields: ['genericName']
      },
      {
        fields: ['category']
      },
      {
        fields: ['status']
      }
      // Removed expiryDate index since it's now virtual
    ],
    hooks: {
      afterFind: async (medications, options) => {
        // Auto-update status based on stock levels
        if (Array.isArray(medications)) {
          for (const medication of medications) {
            if (medication.batches) {
              await updateMedicationStatus(medication);
            }
          }
        } else if (medications && medications.batches) {
          await updateMedicationStatus(medications);
        }
      }
    }
  });

  // Helper function to update medication status based on stock
  async function updateMedicationStatus(medication) {
    const totalStock = medication.totalStock;
    const minimumStock = medication.minimumStock;
    
    let newStatus = 'Available';
    
    if (totalStock === 0) {
      newStatus = 'Out of Stock';
    } else if (totalStock <= minimumStock) {
      newStatus = 'Low Stock';
    } else if (medication.nextExpiryDate && new Date(medication.nextExpiryDate) < new Date()) {
      newStatus = 'Expired';
    }
    
    if (medication.status !== newStatus) {
      await medication.update({ status: newStatus }, { hooks: false });
    }
  }

  // Define associations
  Medication.associate = (models) => {
    Medication.hasMany(models.MedicationBatch, {
      foreignKey: 'medicationId',
      as: 'batches',
      onDelete: 'RESTRICT' // Prevent medication deletion if batches exist
    });
  };

  // Class methods for batch-related operations
  Medication.findWithBatches = function(options = {}) {
    return this.findAll({
      ...options,
      include: [{
        model: sequelize.models.MedicationBatch,
        as: 'batches',
        where: {
          status: {
            [sequelize.Sequelize.Op.ne]: 'depleted'
          }
        },
        required: false,
        order: [['expiryDate', 'ASC']]
      }]
    });
  };

  Medication.findByIdWithBatches = function(id) {
    return this.findByPk(id, {
      include: [{
        model: sequelize.models.MedicationBatch,
        as: 'batches',
        order: [['expiryDate', 'ASC']]
      }]
    });
  };

  Medication.getLowStockMedications = function() {
    return this.findWithBatches({
      having: sequelize.literal('totalStock <= minimumStock')
    });
  };

  Medication.getExpiringMedications = function(daysAhead = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    return this.findWithBatches({
      having: sequelize.literal(`nextExpiryDate <= '${futureDate.toISOString()}'`)
    });
  };

  return Medication;
};