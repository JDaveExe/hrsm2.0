const { User, CheckInSession, Patient } = require('./backend/models');
const { sequelize } = require('./backend/config/database');

async function checkDoctorData() {
  try {
    await sequelize.authenticate();
    console.log('🔗 Connected to database');

    // 1. Check existing doctors
    console.log('\n=== EXISTING DOCTORS ===');
    const doctors = await User.findAll({
      where: { role: 'Doctor' },
      attributes: ['id', 'username', 'firstName', 'lastName', 'email', 'role']
    });
    
    console.log(`Found ${doctors.length} doctors:`);
    doctors.forEach(doctor => {
      console.log(`- ID: ${doctor.id}, Name: ${doctor.firstName} ${doctor.lastName}, Username: ${doctor.username}`);
    });

    // 2. Check sample checkup history with assignedDoctor data
    console.log('\n=== SAMPLE CHECKUP HISTORY ===');
    const checkups = await CheckInSession.findAll({
      where: {
        assignedDoctor: { [require('sequelize').Op.ne]: null }
      },
      include: [{
        model: Patient,
        as: 'Patient',
        attributes: ['firstName', 'lastName']
      }],
      limit: 5,
      attributes: ['id', 'patientId', 'assignedDoctor', 'serviceType', 'completedAt']
    });

    console.log(`Found ${checkups.length} checkups with assigned doctors:`);
    checkups.forEach(checkup => {
      const patientName = checkup.Patient ? 
        `${checkup.Patient.firstName} ${checkup.Patient.lastName}` : 'Unknown';
      console.log(`- Patient: ${patientName}, Doctor: ${checkup.assignedDoctor}, Service: ${checkup.serviceType}`);
    });

    // 3. Check what type of data assignedDoctor contains
    console.log('\n=== ASSIGNED DOCTOR DATA ANALYSIS ===');
    const allCheckups = await CheckInSession.findAll({
      where: {
        assignedDoctor: { [require('sequelize').Op.ne]: null }
      },
      attributes: ['assignedDoctor']
    });

    const doctorValues = [...new Set(allCheckups.map(c => c.assignedDoctor))];
    console.log('Unique assignedDoctor values:', doctorValues);

    // Check if these match doctor IDs
    const doctorIds = doctors.map(d => d.id.toString());
    console.log('Doctor IDs:', doctorIds);
    
    const isNumericIds = doctorValues.every(val => !isNaN(val) && doctorIds.includes(val.toString()));
    console.log('Are assignedDoctor values numeric IDs?', isNumericIds);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkDoctorData();
