const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkVaccinationRecords() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root', 
      password: '',
      database: 'hrsm2'
    });

    console.log('💉 CHECKING VACCINATION RECORDS STATUS\n');

    // 1. Check vaccination table
    console.log('📊 VACCINATION TABLE:');
    const [vaccinationCount] = await connection.execute('SELECT COUNT(*) as total FROM vaccinations');
    console.log(`  Total vaccination records: ${vaccinationCount[0].total}`);

    if (vaccinationCount[0].total > 0) {
      const [vaccinations] = await connection.execute(`
        SELECT 
          id,
          patientId,
          vaccineName,
          DATE(administeredAt) as date_given,
          administeredAt,
          administeredBy,
          dose,
          adverseReactions
        FROM vaccinations 
        ORDER BY administeredAt DESC
        LIMIT 10
      `);
      
      console.log('  Recent vaccination records:');
      vaccinations.forEach(vax => {
        console.log(`    ID: ${vax.id}, Patient: ${vax.patientId}, Vaccine: ${vax.vaccineName}`);
        console.log(`      Date: ${vax.date_given}, Dose: ${vax.dose}, By: ${vax.administeredBy}`);
        console.log(`      Adverse reactions: ${vax.adverseReactions || 'none'}`);
      });
    }

    // 2. Check check_in_sessions with vaccination service type
    console.log('\n💉 CHECK-IN SESSIONS WITH VACCINATION SERVICE:');
    const [vaccinationSessions] = await connection.execute(`
      SELECT 
        id,
        patientId,
        serviceType,
        status,
        assignedDoctor,
        DATE(createdAt) as created_date,
        TIME(createdAt) as created_time,
        vaccination,
        vitalSigns,
        vitalSignsTime
      FROM check_in_sessions 
      WHERE serviceType LIKE '%vaccination%' OR serviceType = 'vaccination'
      ORDER BY createdAt DESC
      LIMIT 10
    `);

    console.log(`  Vaccination check-in sessions: ${vaccinationSessions.length}`);
    vaccinationSessions.forEach(session => {
      console.log(`    ID: ${session.id}, Patient: ${session.patientId}, Status: ${session.status}`);
      console.log(`      Service: ${session.serviceType}, Doctor: ${session.assignedDoctor}`);
      console.log(`      Created: ${session.created_date} ${session.created_time}`);
      console.log(`      Vaccination data: ${session.vaccination || 'null'}`);
      console.log(`      Vital signs: ${session.vitalSigns || 'null'}`);
    });

    // 3. Check vital_signs table
    console.log('\n🩺 VITAL SIGNS TABLE:');
    const [vitalSignsCount] = await connection.execute('SELECT COUNT(*) as total FROM vital_signs');
    console.log(`  Total vital signs records: ${vitalSignsCount[0].total}`);

    if (vitalSignsCount[0].total > 0) {
      const [vitalSigns] = await connection.execute(`
        SELECT 
          id,
          patientId,
          temperature,
          heartRate,
          systolicBP,
          diastolicBP,
          respiratoryRate,
          oxygenSaturation,
          weight,
          height,
          DATE(recordedAt) as recorded_date,
          clinicalNotes
        FROM vital_signs 
        ORDER BY recordedAt DESC
        LIMIT 10
      `);
      
      console.log('  Recent vital signs records:');
      vitalSigns.forEach(vital => {
        console.log(`    ID: ${vital.id}, Patient: ${vital.patientId}, Date: ${vital.recorded_date}`);
        console.log(`      Temp: ${vital.temperature}°C, HR: ${vital.heartRate}bpm, BP: ${vital.systolicBP}/${vital.diastolicBP}`);
        console.log(`      Resp: ${vital.respiratoryRate}, O2: ${vital.oxygenSaturation}%, Weight: ${vital.weight}kg, Height: ${vital.height}cm`);
        console.log(`      Notes: ${vital.clinicalNotes || 'none'}`);
      });
    }

    // 4. Check for vaccination sessions that might need vital signs placeholder
    console.log('\n🔍 VACCINATION SESSIONS NEEDING VITAL SIGNS UPDATES:');
    const [vaccinationNeedingUpdate] = await connection.execute(`
      SELECT 
        c.id,
        c.patientId,
        c.serviceType,
        c.vitalSigns,
        c.vitalSignsTime,
        DATE(c.createdAt) as session_date
      FROM check_in_sessions c
      WHERE (c.serviceType LIKE '%vaccination%' OR c.serviceType = 'vaccination')
        AND (c.vitalSigns IS NULL OR c.vitalSigns = '')
      ORDER BY c.createdAt DESC
    `);

    if (vaccinationNeedingUpdate.length > 0) {
      console.log(`  Found ${vaccinationNeedingUpdate.length} vaccination sessions with empty vital signs:`);
      vaccinationNeedingUpdate.forEach(session => {
        console.log(`    Session ID: ${session.id}, Patient: ${session.patientId}, Date: ${session.session_date}`);
        console.log(`      Service: ${session.serviceType}, Current vital signs: ${session.vitalSigns || 'empty'}`);
      });
    } else {
      console.log('  No vaccination sessions found with empty vital signs');
    }

    console.log('\n📝 RECOMMENDATIONS:');
    if (vaccinationCount[0].total === 0 && vaccinationSessions.length === 0) {
      console.log('  ✅ No vaccination records found - likely cleaned up with test data');
    } else {
      console.log(`  📊 Found ${vaccinationSessions.length} vaccination check-in sessions`);
      console.log(`  💉 Found ${vaccinationCount[0].total} vaccination table records`);
      
      if (vaccinationNeedingUpdate.length > 0) {
        console.log(`  🔧 Need to update ${vaccinationNeedingUpdate.length} vaccination sessions with 'vaccination' placeholder for empty vital signs`);
      }
    }

  } catch (error) {
    console.error('❌ Error checking vaccination records:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

checkVaccinationRecords();