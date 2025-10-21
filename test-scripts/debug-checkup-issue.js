// Debug script to investigate checkup display issue
const { CheckInSession, Patient } = require('./backend/models');
const { Op } = require('sequelize');

async function debugCheckupIssue() {
  try {
    console.log('=== DEBUGGING CHECKUP DISPLAY ISSUE - DEEP DIVE ===');
    
    // 1. Check if checkup ID 897 exists and its current status
    console.log('\n1. Looking for checkup session ID 897...');
    const checkup897 = await CheckInSession.findByPk(897);
    if (checkup897) {
      console.log('Found checkup 897:', {
        id: checkup897.id,
        patientId: checkup897.patientId,
        status: checkup897.status,
        assignedDoctor: checkup897.assignedDoctor,
        checkInTime: checkup897.checkInTime,
        startedAt: checkup897.startedAt,
        completedAt: checkup897.completedAt
      });
    } else {
      console.log('Checkup 897 NOT FOUND in database');
    }
    
    // 2. Simulate the doctor checkups query for doctor 10017
    console.log('\n2. Simulating doctor checkups query for doctor 10017...');
    const doctorCheckups = await CheckInSession.findAll({
      where: {
        status: {
          [Op.in]: ['started', 'in-progress', 'completed', 'transferred']
        },
        assignedDoctor: 10017
      },
      include: [
        {
          model: Patient,
          as: 'Patient',
          attributes: ['id', 'firstName', 'lastName', 'dateOfBirth', 'gender', 'contactNumber', 'familyId']
        }
      ],
      order: [['checkInTime', 'DESC']],
      limit: 10
    });
    
    console.log(`Found ${doctorCheckups.length} checkups for doctor 10017:`);
    doctorCheckups.forEach(session => {
      const patient = session.Patient;
      const patientName = patient ? `${patient.firstName} ${patient.lastName}` : session.patientName || 'Unknown Patient';
      
      console.log(`- ID: ${session.id}, Patient: ${patientName}, Status: ${session.status}, Time: ${session.checkInTime}`);
    });
    
    // 3. Check for ongoing checkups validation that might be blocking
    console.log('\n3. Checking for ongoing checkups that might block new checkups...');
    const ongoingCheckups = await CheckInSession.findAll({
      where: {
        assignedDoctor: 10017,
        status: {
          [Op.in]: ['started', 'in-progress']
        }
      }
    });
    
    console.log(`Found ${ongoingCheckups.length} ongoing checkups for doctor 10017:`);
    ongoingCheckups.forEach(session => {
      console.log(`- ID: ${session.id}, Patient: ${session.patientId}, Status: ${session.status}, Started: ${session.checkInTime}`);
    });
    
    // 4. Check all checkups for this doctor (any status)
    console.log('\n4. All checkups for doctor 10017 (any status):');
    const allDoctorCheckups = await CheckInSession.findAll({
      where: {
        assignedDoctor: 10017
      },
      order: [['id', 'DESC']],
      limit: 10,
      attributes: ['id', 'patientId', 'status', 'checkInTime', 'startedAt']
    });
    
    allDoctorCheckups.forEach(session => {
      console.log(`- ID: ${session.id}, Patient: ${session.patientId}, Status: '${session.status}', CheckIn: ${session.checkInTime}`);
    });
    
    console.log('\n=== DEBUG COMPLETE ===');
    
  } catch (error) {
    console.error('Debug error:', error);
  }
  
  process.exit(0);
}

debugCheckupIssue();