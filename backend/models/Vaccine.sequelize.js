const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Vaccine = sequelize.define('Vaccine', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    manufacturer: {
      type: DataTypes.STRING,
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM,
      values: [
        'Routine Childhood',
        'Additional Routine',
        'Travel & Special',
        'COVID-19',
        'Adult Vaccination',
        'Emergency'
      ],
      allowNull: false
    },
    batchNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    dosesInStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    minimumStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10
    },
    unitCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    storageTemp: {
      type: DataTypes.STRING,
      allowNull: true
    },
    administrationRoute: {
      type: DataTypes.ENUM,
      values: ['Intramuscular', 'Oral', 'Subcutaneous', 'Intradermal', 'Nasal'],
      allowNull: false
    },
    ageGroups: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of applicable age groups'
    },
    dosageSchedule: {
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
    status: {
      type: DataTypes.ENUM,
      values: ['Available', 'Low Stock', 'Out of Stock', 'Expired', 'Recalled'],
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
    tableName: 'vaccines',
    timestamps: true,
    indexes: [
      {
        fields: ['name']
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

  return Vaccine;
};
