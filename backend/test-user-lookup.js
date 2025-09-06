const { sequelize } = require('./config/database');
const User = require('./models/User');
const { Op } = require('sequelize');

const testUserLookup = async () => {
  console.log('🔍 Testing user lookup logic...\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    const login = 'testpatient238787@example.com';
    
    // Test the first query (checking for patient account)
    console.log('1️⃣ Testing patient account check...');
    const potentialPatient = await User.findOne({
      where: {
        [Op.or]: [
          { username: login },
          { email: login }
        ],
        role: 'patient',
        isActive: true
      }
    });
    
    if (potentialPatient) {
      console.log('✅ Patient found in first check:', {
        id: potentialPatient.id,
        username: potentialPatient.username,
        email: potentialPatient.email,
        role: potentialPatient.role,
        isActive: potentialPatient.isActive
      });
    } else {
      console.log('❌ Patient NOT found in first check');
    }

    // Test the second query (main user lookup)
    console.log('\n2️⃣ Testing main user lookup...');
    const user = await User.findOne({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { username: login },
              { email: login }
            ]
          },
          { role: { [Op.in]: ['admin', 'doctor', 'patient'] } },
          { isActive: true }
        ]
      }
    });

    if (user) {
      console.log('✅ User found in main lookup:', {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      });
    } else {
      console.log('❌ User NOT found in main lookup');
    }

    // Check the user's isActive status
    console.log('\n3️⃣ Checking user details...');
    const userDetails = await User.findOne({
      where: {
        email: login
      }
    });

    if (userDetails) {
      console.log('User details:', {
        id: userDetails.id,
        username: userDetails.username,
        email: userDetails.email,
        role: userDetails.role,
        isActive: userDetails.isActive,
        accessLevel: userDetails.accessLevel
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
};

testUserLookup();
