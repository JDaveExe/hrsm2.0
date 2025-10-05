require('dotenv').config({ path: './backend/.env' });
const { Sequelize, DataTypes } = require('sequelize');

console.log('🧹 Manual Doctor Session Cleanup (Final)');
console.log('=========================================');

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

// Define DoctorSession model with correct table name
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

// User model with correct field names
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

    console.log('\n📊 Current Doctor Sessions (before cleanup):');
    const allSessions = await DoctorSession.findAll({
      include: [
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'username', 'firstName', 'lastName', 'email', 'role']
        }
      ],
      order: [['lastActivity', 'DESC']]
    });

    if (allSessions.length === 0) {
      console.log('❌ No doctor sessions found');
      await sequelize.close();
      return;
    }

    allSessions.forEach((session, index) => {
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

    // Calculate stale threshold (5 minutes ago)
    const staleThreshold = new Date(Date.now() - 5 * 60 * 1000);
    console.log(`\n⏰ Stale threshold: ${staleThreshold.toLocaleString()}`);
    console.log('   (Sessions older than this will be marked offline)');

    // Find stale sessions
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
      ]
    });

    if (staleSessions.length === 0) {
      console.log('\n✅ No stale sessions found - all sessions are current!');
    } else {
      console.log(`\n🧹 Found ${staleSessions.length} stale session(s) to clean up:`);
      
      for (const session of staleSessions) {
        const lastActivity = new Date(session.lastActivity);
        const minutesAgo = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60));
        const doctorName = session.doctor ? `${session.doctor.firstName} ${session.doctor.lastName}` : 'Unknown';
        
        console.log(`- ${doctorName}: ${session.status} (${minutesAgo} minutes ago)`);
      }

      // Update stale sessions to offline
      const [affectedRows] = await DoctorSession.update(
        { 
          status: 'offline',
          logoutTime: new Date()
        },
        {
          where: {
            status: ['online', 'busy'],
            lastActivity: {
              [Sequelize.Op.lt]: staleThreshold
            }
          }
        }
      );

      console.log(`\n✅ Updated ${affectedRows} stale session(s) to offline status`);
    }

    console.log('\n📊 Final Doctor Sessions (after cleanup):');
    const finalSessions = await DoctorSession.findAll({
      include: [
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'username', 'firstName', 'lastName', 'email', 'role']
        }
      ],
      order: [['lastActivity', 'DESC']]
    });

    finalSessions.forEach((session, index) => {
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

    console.log('\n🎉 Cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await sequelize.close();
    console.log('🔐 Database connection closed');
  }
}

cleanupStaleSessions();