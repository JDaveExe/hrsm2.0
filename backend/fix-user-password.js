const { sequelize } = require('./config/database');
const User = require('./models/User');
const Patient = require('./models/Patient');
const bcrypt = require('bcryptjs');

const fixUserPassword = async () => {
  console.log('🔧 Fixing user password...\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Find the problematic user
    const user = await User.findOne({
      where: { email: 'testpatient238787@example.com' }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ Found user:', user.email);

    // Find the associated patient to get the correct date of birth
    const patient = await Patient.findOne({
      where: { userId: user.id }
    });

    if (!patient) {
      console.log('❌ Associated patient not found');
      return;
    }

    console.log('✅ Found patient:', patient.firstName, patient.lastName);
    console.log('📅 Date of birth:', patient.dateOfBirth);

    // Generate the correct password from the patient's date of birth
    const dateOfBirth = new Date(patient.dateOfBirth);
    const day = String(dateOfBirth.getDate()).padStart(2, '0');
    const month = String(dateOfBirth.getMonth() + 1).padStart(2, '0');
    const year = dateOfBirth.getFullYear();
    const correctPassword = `${day}-${month}-${year}`;

    console.log('🔐 Correct password should be:', correctPassword);

    // Hash the correct password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(correctPassword, salt);

    // Update the user's password
    await user.update({
      password: hashedPassword
    });

    console.log('✅ Password updated successfully!');

    // Test the fix
    const updatedUser = await User.findByPk(user.id);
    const isValid = await bcrypt.compare(correctPassword, updatedUser.password);
    
    if (isValid) {
      console.log('🎉 Password fix verified! User can now login with:', correctPassword);
    } else {
      console.log('❌ Password fix failed');
    }

  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await sequelize.close();
  }
};

fixUserPassword();
