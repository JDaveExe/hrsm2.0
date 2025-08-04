const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Family = sequelize.define('Family', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  familyName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  surname: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  headOfFamily: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  contactNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true,
    validate: {
      len: [11, 11], // Exactly 11 digits
      isNumeric: true, // Only numbers allowed
      notEmpty: function(value) {
        if (value && value.length === 0) {
          throw new Error('Contact number cannot be empty if provided');
        }
      }
    }
  },
  address: {
    type: DataTypes.STRING,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'families',
  timestamps: true,
});

module.exports = Family;
