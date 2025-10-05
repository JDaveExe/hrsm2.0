// Direct database test to verify diagnosis storage
// Run this in the backend directory: node test-diagnosis-database.js

const { CheckInSession, Patient, User } = require('./models');
const { sequelize } = require('./config/database');

async function testDiagnosisDatabase() {
  try {
    console.log('🔍 Testing Diagnosis Database Storage...');
    
    // Check existing sessions
    console.log('\n📋 Step 1: Checking existing sessions...');
    const allSessions = await CheckInSession.findAll({
      include: [
        { model: Patient, as: 'Patient' },
        { model: User, as: 'assignedDoctorUser' }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    
    console.log(`Found ${allSessions.length} recent sessions:`);
    allSessions.forEach((session, index) => {
      console.log(`${index + 1}. Session ${session.id}: Status=${session.status}, Diagnosis="${session.diagnosis || 'None'}", Patient=${session.Patient?.firstName || 'Unknown'}`);
    });
    
    // Check for sessions with diagnoses
    console.log('\n🩺 Step 2: Checking sessions with diagnoses...');
    const sessionsWithDiagnosis = await CheckInSession.findAll({
      where: {
        diagnosis: {
          [require('sequelize').Op.and]: [
            { [require('sequelize').Op.ne]: null },
            { [require('sequelize').Op.ne]: '' }
          ]
        }
      },
      include: [{ model: Patient, as: 'Patient' }]
    });
    
    console.log(`Found ${sessionsWithDiagnosis.length} sessions with diagnoses:`);
    sessionsWithDiagnosis.forEach((session, index) => {
      console.log(`${index + 1}. Session ${session.id}: "${session.diagnosis}" - Patient: ${session.Patient?.firstName || 'Unknown'}`);
    });
    
    // Create a test diagnosis entry
    console.log('\n📝 Step 3: Creating test diagnosis entry...');
    
    // Find a completed session without diagnosis or create one
    let testSession = await CheckInSession.findOne({
      where: {
        status: 'completed',
        diagnosis: { [require('sequelize').Op.or]: [null, ''] }
      }
    });
    
    if (testSession) {
      console.log(`Using existing session ${testSession.id} for diagnosis test`);
      
      // Update with test diagnosis
      await testSession.update({
        diagnosis: 'Upper Respiratory Tract Infection (URTI)',
        chiefComplaint: 'Patient complains of persistent cough and fever',
        presentSymptoms: 'Dry cough, fever (38.5°C), sore throat, body aches',
        doctorNotes: 'Patient shows signs of viral upper respiratory infection. Recommended rest and symptomatic treatment.'
      });
      
      console.log('✅ Successfully added test diagnosis to existing session');
      
    } else {
      console.log('⚠️  No suitable existing session found for diagnosis test');
      console.log('💡 Recommendation: Complete a checkup through the doctor interface to test diagnosis workflow');
    }
    
    // Test the analytics query
    console.log('\n📊 Step 4: Testing diagnosis analytics query...');
    const diagnosisAnalytics = await CheckInSession.findAll({
      where: {
        status: 'completed',
        diagnosis: {
          [require('sequelize').Op.and]: [
            { [require('sequelize').Op.ne]: null },
            { [require('sequelize').Op.ne]: '' },
            { [require('sequelize').Op.ne]: 'sample' },
            { [require('sequelize').Op.ne]: 'sample data' }
          ]
        }
      },
      include: [{ model: Patient, as: 'Patient', attributes: ['dateOfBirth'] }],
      attributes: ['diagnosis', 'createdAt']
    });
    
    console.log(`Analytics query found ${diagnosisAnalytics.length} sessions with valid diagnoses`);
    
    if (diagnosisAnalytics.length > 0) {
      console.log('📈 Diagnosis data for analytics:');
      diagnosisAnalytics.forEach((session, index) => {
        const age = session.Patient?.dateOfBirth ? 
          new Date().getFullYear() - new Date(session.Patient.dateOfBirth).getFullYear() : 'Unknown';
        console.log(`${index + 1}. "${session.diagnosis}" - Patient age: ${age}`);
      });
    }
    
    console.log('\n✅ Diagnosis database test complete!');
    
  } catch (error) {
    console.error('❌ Error testing diagnosis database:', error);
  } finally {
    await sequelize.close();
  }
}

testDiagnosisDatabase();