const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'doctor', 'patient'),
    allowNull: false,
    defaultValue: 'patient',
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  contactNumber: {
    type: DataTypes.STRING,
  },
  address: {
    type: DataTypes.STRING,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
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
    },
  },
});

// Instance method to compare password
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Static method to create default users
User.createDefaultUsers = async function() {
  try {
    // Check if admin exists
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    
    if (!adminExists) {
      await User.create({
        username: 'admin',
        email: 'admin@maybunga.healthcare',
        password: 'admin123',
        role: 'admin',
        firstName: 'System',
        lastName: 'Administrator',
        contactNumber: '09123456789',
        address: 'Maybunga Health Center'
      });
      console.log('✅ Default admin user created');
    }

    // Check if doctor exists
    const doctorExists = await User.findOne({ where: { role: 'doctor' } });
    
    if (!doctorExists) {
      await User.create({
        username: 'doctor',
        email: 'doctor@maybunga.healthcare',
        password: 'doctor123',
        role: 'doctor',
        firstName: 'Dr. John',
        lastName: 'Smith',
        contactNumber: '09123456790',
        address: 'Maybunga Health Center'
      });
      console.log('✅ Default doctor user created');
    }

    console.log('✅ Default users initialization complete');
  } catch (error) {
    console.error('❌ Error creating default users:', error.message);
  }
};

// Static method to check if user can be deleted (prevent deletion of default admin/doctor)
User.canDeleteUser = async function(userId) {
  try {
    const user = await User.findByPk(userId);
    if (!user) return false; // User not found

    // Prevent deletion of the default admin and doctor accounts
    if (user.username === 'admin' || user.username === 'doctor') {
      return false;
    }

    // Prevent deletion of the last active admin or doctor
    if (user.role === 'admin') {
      const adminCount = await User.count({ where: { role: 'admin', isActive: true } });
      if (adminCount <= 1) {
        return false; // Do not allow deleting the last admin
      }
    }

    if (user.role === 'doctor') {
      const doctorCount = await User.count({ where: { role: 'doctor', isActive: true } });
      if (doctorCount <= 1) {
        return false; // Do not allow deleting the last doctor
      }
    }

    return true; // Allow deletion for other users
  } catch (error) {
    console.error('Error checking user deletion permission:', error);
    return false;
  }
};

module.exports = User;
