require('dotenv').config({ path: './backend/.env' });
const { Sequelize, DataTypes } = require('sequelize');

console.log('🧹 Doctor Session Cleanup - Delete Stale Sessions');
console.log('=================================================');

// Database connection
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false
  }
);

// Define DoctorSession model
const DoctorSession = sequelize.define('DoctorSession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  doctorId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('online', 'offline', 'busy'),
    allowNull: false
  },
  loginTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  logoutTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastActivity: {
    type: DataTypes.DATE,
    allowNull: true
  },
  currentPatientId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  sessionToken: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'doctor_sessions',
  timestamps: true
});

// User model
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
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('patient', 'doctor', 'admin', 'staff', 'management'),
    allowNull: false
  }
}, {
  tableName: 'users',
  timestamps: true
});

// Set up associations
DoctorSession.belongsTo(User, { foreignKey: 'doctorId', as: 'doctor' });

async function cleanupStaleSessions() {
  try {
    console.log('🔗 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected successfully!');

    // Calculate stale threshold (5 minutes ago)
    const staleThreshold = new Date(Date.now() - 5 * 60 * 1000);
    console.log(`\n⏰ Stale threshold: ${staleThreshold.toLocaleString()}`);
    console.log('   (Sessions older than this will be deleted)');

    // Find stale sessions (both online and busy)
    const staleSessions = await DoctorSession.findAll({
      where: {
        status: ['online', 'busy'],
        lastActivity: {
          [Sequelize.Op.lt]: staleThreshold
        }
      },
      include: [
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'username', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['lastActivity', 'DESC']]
    });

    if (staleSessions.length === 0) {
      console.log('\n✅ No stale sessions found - all sessions are current!');
    } else {
      console.log(`\n🧹 Found ${staleSessions.length} stale session(s) to delete:`);
      
      for (const session of staleSessions) {
        const lastActivity = new Date(session.lastActivity);
        const minutesAgo = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60));
        const daysAgo = Math.floor(minutesAgo / (60 * 24));
        const doctorName = session.doctor ? `${session.doctor.firstName} ${session.doctor.lastName}` : 'Unknown';
        
        console.log(`- ${doctorName}: ${session.status}`);
        console.log(`  Last Activity: ${lastActivity.toLocaleString()}`);
        console.log(`  Age: ${daysAgo > 0 ? `${daysAgo} days, ` : ''}${minutesAgo % (60 * 24)} minutes ago`);
        console.log(`  Session ID: ${session.id}`);
        console.log('  ---');
      }

      // Delete stale sessions
      const deletedCount = await DoctorSession.destroy({
        where: {
          status: ['online', 'busy'],
          lastActivity: {
            [Sequelize.Op.lt]: staleThreshold
          }
        }
      });

      console.log(`\n✅ Deleted ${deletedCount} stale session(s)`);
    }

    // Show current active sessions after cleanup
    console.log('\n📊 Current Active Doctor Sessions (after cleanup):');
    const activeSessions = await DoctorSession.findAll({
      where: {
        status: ['online', 'busy']
      },
      include: [
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'username', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['lastActivity', 'DESC']]
    });

    if (activeSessions.length === 0) {
      console.log('✅ No active doctor sessions found');
    } else {
      activeSessions.forEach((session, index) => {
        const lastActivity = session.lastActivity ? new Date(session.lastActivity) : null;
        const now = new Date();
        const minutesAgo = lastActivity ? Math.floor((now - lastActivity) / (1000 * 60)) : 'N/A';
        const doctorName = session.doctor ? `${session.doctor.firstName} ${session.doctor.lastName}` : 'Unknown';
        
        console.log(`${index + 1}. Doctor: ${doctorName} (ID: ${session.doctorId})`);
        console.log(`   Status: ${session.status}`);
        console.log(`   Last Activity: ${lastActivity ? lastActivity.toLocaleString() : 'Never'}`);
        console.log(`   Minutes Ago: ${minutesAgo}`);
        console.log('   ---');
      });
    }

    console.log('\n🎉 Cleanup completed successfully!');
    console.log('📢 The doctor availability issue should now be fixed!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await sequelize.close();
    console.log('🔐 Database connection closed');
  }
}

cleanupStaleSessions();