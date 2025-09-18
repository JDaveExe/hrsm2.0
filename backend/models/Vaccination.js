const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Vaccination = sequelize.define('Vaccination', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  patientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'patients',
      key: 'id'
    }
  },
  sessionId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'References the checkup session if part of a checkup'
  },
  vaccineId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    // No foreign key constraint since Vaccines table doesn't exist
    comment: 'Reference to vaccine inventory (future implementation)'
  },
  vaccineName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Name of the vaccine administered'
  },
  batchNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Batch number of the vaccine'
  },
  lotNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Lot number of the vaccine'
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Expiry date of the vaccine batch'
  },
  administrationSite: {
    type: DataTypes.ENUM('left-arm', 'right-arm', 'left-thigh', 'right-thigh', 'oral', 'intranasal'),
    allowNull: false,
    defaultValue: 'left-arm',
    comment: 'Body site where vaccine was administered'
  },
  administrationRoute: {
    type: DataTypes.ENUM('Intramuscular', 'Subcutaneous', 'Oral', 'Intranasal', 'Intradermal'),
    allowNull: false,
    defaultValue: 'Intramuscular',
    comment: 'Route of administration'
  },
  dose: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '1',
    comment: 'Dose number (e.g., 1, 2, booster)'
  },
  administeredBy: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Name of healthcare provider who administered vaccine'
  },
  administeredAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Date and time of administration'
  },
  category: {
    type: DataTypes.ENUM('Routine Childhood', 'Adult', 'Adolescent', 'Annual', 'Emergency Use', 'Travel', 'Occupational'),
    allowNull: true,
    comment: 'Category of vaccination'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Clinical notes or observations'
  },
  adverseReactions: {
    type: DataTypes.ENUM('none', 'mild-pain', 'mild-swelling', 'mild-redness', 'other'),
    allowNull: false,
    defaultValue: 'none',
    comment: 'Any immediate adverse reactions observed'
  },
  adverseReactionNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Details of adverse reactions if any'
  },
  consentGiven: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Whether patient/guardian consent was obtained'
  },
  nextDueDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date when next dose is due (if applicable)'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID of user who created this record'
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID of user who last updated this record'
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Soft delete timestamp'
  },
  deletedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID of user who deleted this record'
  }
}, {
  tableName: 'vaccinations',
  timestamps: true,
  paranoid: false, // We're handling soft deletes manually with deletedAt
  indexes: [
    {
      fields: ['patientId']
    },
    {
      fields: ['vaccineId']
    },
    {
      fields: ['administeredAt']
    },
    {
      fields: ['sessionId']
    },
    {
      fields: ['category']
    },
    {
      fields: ['deletedAt']
    }
  ]
});

// Define associations
Vaccination.associate = (models) => {
  // Association with Patient
  Vaccination.belongsTo(models.Patient, {
    foreignKey: 'patientId',
    as: 'patient'
  });

  // Association with User (created by)
  Vaccination.belongsTo(models.User, {
    foreignKey: 'createdBy',
    as: 'createdBy'
  });

  // Association with User (updated by)
  Vaccination.belongsTo(models.User, {
    foreignKey: 'updatedBy',
    as: 'updatedBy'
  });

  // Association with User (deleted by)
  Vaccination.belongsTo(models.User, {
    foreignKey: 'deletedBy',
    as: 'deletedBy'
  });
};

module.exports = Vaccination;