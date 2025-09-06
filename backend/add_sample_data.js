const { sequelize } = require('./config/database');

async function addSampleData() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Sample prescriptions and vaccinations data
    const sampleSessions = [
      {
        patientId: 1,
        serviceType: 'General Checkup',
        status: 'completed',
        prescription: JSON.stringify([
          { medicine: 'Paracetamol', dosage: '500mg', frequency: 'Twice daily', duration: '5 days' },
          { medicine: 'Amoxicillin', dosage: '250mg', frequency: 'Three times daily', duration: '7 days' }
        ]),
        vaccination: JSON.stringify([
          { vaccine: 'COVID-19', batch: 'CV001', date: '2025-09-04' }
        ]),
        completedAt: new Date(),
        checkInTime: new Date()
      },
      {
        patientId: 2,
        serviceType: 'Vaccination',
        status: 'completed',
        vaccination: JSON.stringify([
          { vaccine: 'Influenza', batch: 'FLU001', date: '2025-09-04' },
          { vaccine: 'Hepatitis B', batch: 'HEP001', date: '2025-09-04' }
        ]),
        completedAt: new Date(),
        checkInTime: new Date()
      },
      {
        patientId: 3,
        serviceType: 'Follow-up',
        status: 'completed',
        prescription: JSON.stringify([
          { medicine: 'Ibuprofen', dosage: '400mg', frequency: 'As needed', duration: '10 days' },
          { medicine: 'Cetirizine', dosage: '10mg', frequency: 'Once daily', duration: '14 days' }
        ]),
        completedAt: new Date(),
        checkInTime: new Date()
      }
    ];
    
    const insertQuery = `
      INSERT INTO check_in_sessions 
      (patientId, serviceType, status, prescription, vaccination, completedAt, checkInTime, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    for (const session of sampleSessions) {
      await sequelize.query(insertQuery, {
        replacements: [
          session.patientId,
          session.serviceType,
          session.status,
          session.prescription || null,
          session.vaccination || null,
          session.completedAt,
          session.checkInTime
        ]
      });
    }
    
    console.log('✅ Sample data added successfully');
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sequelize.close();
  }
}

addSampleData();
