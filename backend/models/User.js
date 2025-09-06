const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  contactNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('patient', 'doctor', 'admin', 'staff'),
    allowNull: false,
    defaultValue: 'patient'
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  middleName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  position: {
    type: DataTypes.STRING,
    allowNull: true
  },
  accessLevel: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Static methods
User.createDefaultUsers = async function() {
  try {
    // Default users to create
    const defaultUsers = [
      {
        username: 'admin',
        email: 'admin@brgymaybunga.health',
        password: 'admin123',
        role: 'admin',
        firstName: 'System',
        lastName: 'Administrator',
        position: 'System Administrator',
        accessLevel: 10,
        isActive: true
      },
      {
        username: 'doctor',
        email: 'doctor@brgymaybunga.health',
        password: 'doctor123',
        role: 'doctor',
        firstName: 'Default',
        lastName: 'Doctor',
        position: 'General Practitioner',
        accessLevel: 5,
        isActive: true
      },
      {
        username: 'patient',
        email: 'patient@brgymaybunga.health',
        password: 'patient123',
        role: 'patient',
        firstName: 'Test',
        lastName: 'Patient',
        accessLevel: 1,
        isActive: true
      }
    ];

    // Create each default user if they don't exist
    for (const userData of defaultUsers) {
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { username: userData.username },
            { email: userData.email }
          ]
        }
      });

      if (!existingUser) {
        await User.create(userData);
        console.log(`✅ Created default ${userData.role} user: ${userData.username}`);
      } else {
        console.log(`ℹ️ Default ${userData.role} user already exists: ${userData.username}`);
      }
    }
  } catch (error) {
    console.error('Error creating default users:', error);
    throw error;
  }
};

module.exports = User;
