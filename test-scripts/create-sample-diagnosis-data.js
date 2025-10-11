// Create sample diagnosis data for testing the complete workflow
const { CheckInSession, Patient, User } = require('./backend/models');
const { Op } = require('sequelize');

async function createSampleDiagnosisData() {
  console.log('🏥 Creating Sample Diagnosis Data for Testing...\n');

  try {
    // First, check if there are existing patients
    const patients = await Patient.findAll({ limit: 5 });
    console.log(`Found ${patients.length} patients in database`);

    if (patients.length === 0) {
      console.log('❌ No patients found. Please ensure there are patients in the database first.');
      return;
    }

    // Check for existing doctors
    const doctors = await User.findAll({ 
      where: { role: 'doctor' },
      limit: 3 
    });
    console.log(`Found ${doctors.length} doctors in database`);

    // Sample diagnosis data to create
    const sampleDiagnoses = [
      {
        diagnosis: 'Upper Respiratory Tract Infection (URTI)',
        chiefComplaint: 'Patient complains of persistent cough and runny nose',
        presentSymptoms: 'Dry cough, nasal congestion, mild fever',
        treatmentPlan: 'Symptomatic treatment with rest and fluids',
        doctorNotes: 'Viral URTI, patient advised to monitor symptoms'
      },
      {
        diagnosis: 'Hypertension',
        chiefComplaint: 'Patient reports headaches and dizziness',
        presentSymptoms: 'Elevated blood pressure (150/95), headaches',
        treatmentPlan: 'Antihypertensive medication, lifestyle modification',
        doctorNotes: 'Stage 1 hypertension, requires monitoring'
      },
      {
        diagnosis: 'Type 2 Diabetes Mellitus',
        chiefComplaint: 'Patient experiencing increased thirst and frequent urination',
        presentSymptoms: 'Polyuria, polydipsia, elevated blood glucose',
        treatmentPlan: 'Metformin therapy, dietary counseling',
        doctorNotes: 'New diagnosis of T2DM, patient education provided'
      },
      {
        diagnosis: 'Acute Gastritis',
        chiefComplaint: 'Patient reports stomach pain and nausea',
        presentSymptoms: 'Epigastric pain, nausea, mild vomiting',
        treatmentPlan: 'PPI therapy, dietary modifications',
        doctorNotes: 'Acute gastritis likely stress-related'
      },
      {
        diagnosis: 'Common Cold',
        chiefComplaint: 'Patient has cold symptoms for 3 days',
        presentSymptoms: 'Rhinorrhea, sneezing, mild throat discomfort',
        treatmentPlan: 'Symptomatic treatment, rest, increased fluid intake',
        doctorNotes: 'Viral upper respiratory infection, self-limiting'
      }
    ];

    // Create sample completed checkup sessions
    const sessionsCreated = [];
    
    for (let i = 0; i < sampleDiagnoses.length && i < patients.length; i++) {
      const patient = patients[i];
      const doctor = doctors[i % doctors.length] || doctors[0];
      const diagnosisData = sampleDiagnoses[i];

      // Create a completed checkup session
      const session = await CheckInSession.create({
        patientId: patient.id,
        serviceType: 'consultation',
        priority: 'normal',
        status: 'completed',
        checkInTime: new Date(Date.now() - (i + 1) * 3600000), // Spread over last few hours
        completedAt: new Date(Date.now() - i * 1800000), // Completed 30 min intervals
        assignedDoctorId: doctor ? doctor.id : null,
        chiefComplaint: diagnosisData.chiefComplaint,
        presentSymptoms: diagnosisData.presentSymptoms,
        diagnosis: diagnosisData.diagnosis,
        treatmentPlan: diagnosisData.treatmentPlan,
        doctorNotes: diagnosisData.doctorNotes,
        prescription: JSON.stringify([
          {
            medication: i % 2 === 0 ? 'Paracetamol' : 'Ibuprofen',
            dosage: '500mg',
            quantity: 10,
            instructions: 'Take as needed for symptoms'
          }
        ])
      });

      sessionsCreated.push(session);
      console.log(`✅ Created checkup session ${session.id} with diagnosis: ${diagnosisData.diagnosis}`);
    }

    console.log(`\n🎉 Successfully created ${sessionsCreated.length} sample diagnosis records!`);
    
    // Verify the data was created
    console.log('\n🔍 Verifying created data...');
    const completedSessions = await CheckInSession.findAll({
      where: {
        status: 'completed',
        diagnosis: { [Op.ne]: null }
      },
      include: [
        {
          model: Patient,
          as: 'Patient',
          attributes: ['firstName', 'lastName', 'dateOfBirth']
        }
      ]
    });

    console.log(`Found ${completedSessions.length} completed sessions with diagnoses:`);
    completedSessions.forEach((session, index) => {
      const patientName = session.Patient ? 
        `${session.Patient.firstName} ${session.Patient.lastName}` : 
        'Unknown Patient';
      console.log(`  ${index + 1}. ${patientName}: ${session.diagnosis}`);
    });

    console.log('\n✅ Sample diagnosis data creation completed!');
    console.log('Now you can:');
    console.log('1. Run the diagnosis analytics test again');
    console.log('2. Check the Healthcare Insights dashboard');
    console.log('3. Verify the "Most Diagnosed Diseases" chart shows data');

  } catch (error) {
    console.error('❌ Error creating sample diagnosis data:', error);
    throw error;
  }
}

// Run the function
createSampleDiagnosisData()
  .then(() => {
    console.log('\n🎯 Process completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Process failed:', error.message);
    process.exit(1);
  });