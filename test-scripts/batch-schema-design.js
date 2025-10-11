// MEDICATION BATCHES TABLE DESIGN
// Pharmaceutical-grade batch tracking system

const { DataTypes } = require('sequelize');

// This is the NEW table structure for proper batch management
const MedicationBatchSchema = {
  tableName: 'medication_batches',
  
  fields: {
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
      comment: 'Unique batch identifier (e.g., PAR-1010, AMB-2024-001)'
    },
    
    quantityReceived: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      },
      comment: 'Original quantity when batch was received'
    },
    
    quantityRemaining: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Current remaining quantity in this batch'
    },
    
    unitCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      },
      comment: 'Cost per unit for this specific batch'
    },
    
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: false,
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
    }
  },
  
  indexes: [
    {
      unique: true,
      fields: ['batchNumber'], // Ensure batch numbers are unique
      name: 'unique_batch_number'
    },
    {
      fields: ['medicationId'],
      name: 'idx_medication_batches_medication_id'
    },
    {
      fields: ['expiryDate'],
      name: 'idx_medication_batches_expiry_date' // For FIFO queries
    },
    {
      fields: ['status'],
      name: 'idx_medication_batches_status'
    },
    {
      fields: ['medicationId', 'expiryDate'], // Composite index for FIFO
      name: 'idx_medication_fifo'
    }
  ],
  
  associations: {
    belongsTo: {
      model: 'Medication',
      foreignKey: 'medicationId',
      as: 'medication'
    }
  }
};

// UPDATED MEDICATIONS TABLE STRUCTURE
const UpdatedMedicationSchema = {
  // Remove these fields (move to batches):
  fieldsToRemove: [
    'batchNumber',     // Now in medication_batches
    'unitsInStock',    // Now calculated from batches
    'expiryDate'       // Now in medication_batches
  ],
  
  // Add these calculated fields:
  fieldsToAdd: {
    totalStock: {
      type: DataTypes.VIRTUAL,
      get() {
        // Calculate from associated batches
        return this.batches ? 
          this.batches.reduce((sum, batch) => sum + (batch.quantityRemaining || 0), 0) : 0;
      },
      comment: 'Total stock across all active batches'
    },
    
    nextExpiryDate: {
      type: DataTypes.VIRTUAL,
      get() {
        // Get earliest expiry date from active batches
        if (!this.batches || this.batches.length === 0) return null;
        
        const activeBatches = this.batches.filter(batch => 
          batch.status === 'active' && batch.quantityRemaining > 0
        );
        
        if (activeBatches.length === 0) return null;
        
        return activeBatches
          .map(batch => new Date(batch.expiryDate))
          .sort((a, b) => a - b)[0]; // Earliest date first
      },
      comment: 'Earliest expiry date from active batches'
    },
    
    batchCount: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.batches ? 
          this.batches.filter(batch => batch.status === 'active').length : 0;
      },
      comment: 'Number of active batches'
    }
  },
  
  associations: {
    hasMany: {
      model: 'MedicationBatch',
      foreignKey: 'medicationId',
      as: 'batches'
    }
  }
};

console.log('📋 PHARMACEUTICAL BATCH SYSTEM SCHEMA DESIGN');
console.log('==============================================\n');

console.log('🏗️  NEW TABLE: medication_batches');
console.log('✅ Tracks multiple batches per medication');
console.log('✅ Proper FIFO (First In, First Out) support');
console.log('✅ Individual batch expiry dates');
console.log('✅ Quantity tracking per batch');
console.log('✅ Supplier and cost tracking');
console.log('✅ Status management (active/expired/recalled)');

console.log('\n🔄 UPDATED TABLE: medications');
console.log('❌ Removed: batchNumber, unitsInStock, expiryDate');
console.log('✅ Added: Virtual fields for calculated values');
console.log('✅ totalStock = sum of all batch quantities');
console.log('✅ nextExpiryDate = earliest batch expiry');

console.log('\n📊 EXAMPLE DATA STRUCTURE:');
console.log(`
Paracetamol (Medication):
├── id: 1
├── name: "Paracetamol"
├── totalStock: 1244 (calculated)
├── nextExpiryDate: "2025-10-08" (earliest)
└── batches: [
    {
      id: 1,
      batchNumber: "PAR-1010",
      quantityReceived: 1000,
      quantityRemaining: 800,
      expiryDate: "2027-11-11",
      status: "active"
    },
    {
      id: 2,
      batchNumber: "PAR-1015", 
      quantityReceived: 500,
      quantityRemaining: 244,
      expiryDate: "2025-10-08", ← EXPIRES FIRST
      status: "active"
    },
    {
      id: 3,
      batchNumber: "PAR-1020",
      quantityReceived: 300,
      quantityRemaining: 200,
      expiryDate: "2028-03-15",
      status: "active"
    }
]
`);

console.log('\n🎯 BENEFITS OF NEW STRUCTURE:');
console.log('✅ Multiple batches per medication');
console.log('✅ Automatic FIFO dispensing');
console.log('✅ Accurate expiry tracking');
console.log('✅ No data overwriting');
console.log('✅ Pharmaceutical industry standard');
console.log('✅ Audit trail for each batch');

console.log('\n⚠️  NEXT STEPS:');
console.log('1. Create MedicationBatch model');
console.log('2. Update Medication model');
console.log('3. Create migration script');
console.log('4. Test in development environment');

module.exports = {
  MedicationBatchSchema,
  UpdatedMedicationSchema
};