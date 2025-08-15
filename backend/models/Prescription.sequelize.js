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
    batchNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    unitsInStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    minimumStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 50
    },
    unitCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    sellingPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: false
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
      },
      {
        fields: ['expiryDate']
      }
    ]
  });

  return Medication;
};