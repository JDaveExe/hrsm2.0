const { sequelize } = require('./config/database');
const User = require('./models/User');
const Patient = require('./models/Patient');
const bcrypt = require('bcryptjs');

const testPatientCreation = async () => {
  console.log('🧪 Testing current patient creation process...\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Simulate the exact patient creation process
    const patientData = {
      firstName: 'Debug',
      lastName: 'Test',
      dateOfBirth: '1990-05-15', // Same date as the problematic patient
      gender: 'Male',
      email: 'debugtest@example.com',
      contactNumber: '09123456789'
    };

    console.log('📅 Input date:', patientData.dateOfBirth);
    
    // Replicate the exact password generation logic from patients.js
    const dateOfBirth = new Date(patientData.dateOfBirth);
    console.log('📅 Parsed date object:', dateOfBirth);
    console.log('📅 getDate():', dateOfBirth.getDate());
    console.log('📅 getMonth():', dateOfBirth.getMonth());
    console.log('📅 getFullYear():', dateOfBirth.getFullYear());
    
    const day = String(dateOfBirth.getDate()).padStart(2, '0');
    const month = String(dateOfBirth.getMonth() + 1).padStart(2, '0');
    const year = dateOfBirth.getFullYear();
    const generatedPassword = `${day}-${month}-${year}`;

    console.log(`🔐 Generated password: "${generatedPassword}"`);

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(generatedPassword, salt);
    console.log('🔐 Hashed password:', hashedPassword);

    // Test verification immediately
    const verification = await bcrypt.compare(generatedPassword, hashedPassword);
    console.log('✅ Immediate verification:', verification);

    // Check if user already exists and clean up
    const existingUser = await User.findOne({
      where: { email: patientData.email }
    });
    
    if (existingUser) {
      console.log('🧹 Cleaning up existing test user...');
      await User.destroy({ where: { email: patientData.email } });
      await Patient.destroy({ where: { userId: existingUser.id } });
    }

    // Create user with the hashed password
    const user = await User.create({
      username: patientData.email,
      email: patientData.email,
      contactNumber: patientData.contactNumber,
      password: hashedPassword,
      role: 'patient',
      firstName: patientData.firstName,
      lastName: patientData.lastName
    });

    console.log('✅ User created with ID:', user.id);

    // Test login immediately after creation
    const loginTest = await bcrypt.compare(generatedPassword, user.password);
    console.log('🔐 Login test result:', loginTest);

    if (!loginTest) {
      console.log('❌ Login test failed! Something is wrong with the process.');
    } else {
      console.log('✅ Login test successful! The process works correctly.');
    }

    // Clean up
    console.log('🧹 Cleaning up test data...');
    await User.destroy({ where: { id: user.id } });

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
};

testPatientCreation();
