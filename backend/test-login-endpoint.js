const { sequelize } = require('./config/database');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

const testLoginEndpoint = async () => {
  console.log('🔐 Testing login endpoint logic step by step...\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Simulate the exact login request
    const login = 'testpatient238787@example.com';
    const password = '15-05-1990';

    console.log(`📧 Login: ${login}`);
    console.log(`🔐 Password: ${password}`);

    // Step 1: Check if it's email format
    const isEmailFormat = login.includes('@');
    console.log(`📧 Is email format: ${isEmailFormat}`);

    // Step 2: Check if it's a patient account first
    if (isEmailFormat) {
      console.log('\n1️⃣ Checking if this is a patient account...');
      const patientUser = await User.findOne({
        where: {
          [Op.or]: [
            { username: login },
            { email: login }
          ],
          role: 'patient',
          isActive: true
        }
      });

      if (patientUser) {
        console.log('✅ Found patient account:', {
          id: patientUser.id,
          email: patientUser.email,
          role: patientUser.role
        });

        // Test password verification
        console.log('\n🔐 Testing password verification...');
        const isMatch = await bcrypt.compare(password, patientUser.password);
        console.log(`Password match: ${isMatch}`);

        if (isMatch) {
          console.log('✅ LOGIN SHOULD SUCCEED FOR PATIENT!');
          return;
        } else {
          console.log('❌ Password verification failed');
          return;
        }
      } else {
        console.log('❌ No patient account found with this email');
      }
    }

    // Step 3: Check domain restriction for admin/doctor
    if (isEmailFormat && !login.endsWith('@brgymaybunga.health')) {
      console.log('❌ Email domain restriction triggered - should return "Invalid credentials"');
      return;
    }

    // Step 4: General user lookup
    console.log('\n2️⃣ Checking general user lookup...');
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
      console.log('✅ User found in general lookup:', {
        id: user.id,
        email: user.email,
        role: user.role
      });

      const isMatch = await bcrypt.compare(password, user.password);
      console.log(`Password match: ${isMatch}`);

      if (isMatch) {
        console.log('✅ LOGIN SHOULD SUCCEED!');
      } else {
        console.log('❌ Password verification failed');
      }
    } else {
      console.log('❌ No user found in general lookup');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
};

testLoginEndpoint();
