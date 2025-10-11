const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyRealData() {
  let connection;
  
  try {
    // Database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hrsm2'
    });

    console.log('🔍 VERIFYING REAL vs SAMPLE DATA\n');

    // 1. Check actual completed checkups with details
    console.log('📋 CHECKING COMPLETED CHECKUPS:');
    const [checkups] = await connection.execute(`
      SELECT 
        id,
        patient_id,
        status,
        DATE(created_at) as date_created,
        DATE(updated_at) as date_completed,
        created_at,
        updated_at
      FROM medical_checkups 
      WHERE status = 'completed'
      ORDER BY updated_at DESC
      LIMIT 20
    `);

    console.log(`  Total completed checkups found: ${checkups.length}`);
    if (checkups.length > 0) {
      console.log('  Recent completed checkups:');
      checkups.slice(0, 10).forEach(checkup => {
        console.log(`    ID: ${checkup.id}, Patient: ${checkup.patient_id}, Completed: ${checkup.date_completed} (${checkup.updated_at})`);
      });
    }

    // 2. Get checkup count by month for 2025
    console.log('\n📊 CHECKUPS BY MONTH (2025):');
    const [monthlyCheckups] = await connection.execute(`
      SELECT 
        YEAR(updated_at) as year,
        MONTH(updated_at) as month,
        MONTHNAME(updated_at) as month_name,
        COUNT(*) as count,
        MIN(DATE(updated_at)) as first_date,
        MAX(DATE(updated_at)) as last_date
      FROM medical_checkups 
      WHERE status = 'completed' AND YEAR(updated_at) = 2025
      GROUP BY YEAR(updated_at), MONTH(updated_at)
      ORDER BY year, month
    `);

    monthlyCheckups.forEach(month => {
      console.log(`    ${month.month_name} ${month.year}: ${month.count} checkups (${month.first_date} to ${month.last_date})`);
    });

    // 3. Check vaccination records
    console.log('\n💉 CHECKING VACCINATION RECORDS:');
    const [vaccinations] = await connection.execute(`
      SELECT 
        id,
        patient_id,
        vaccine_name,
        DATE(vaccination_date) as date_given,
        vaccination_date,
        status
      FROM vaccination_records 
      ORDER BY vaccination_date DESC
      LIMIT 20
    `);

    console.log(`  Total vaccination records found: ${vaccinations.length}`);
    if (vaccinations.length > 0) {
      console.log('  Recent vaccinations:');
      vaccinations.slice(0, 10).forEach(vax => {
        console.log(`    ID: ${vax.id}, Patient: ${vax.patient_id}, Vaccine: ${vax.vaccine_name}, Date: ${vax.date_given}`);
      });
    }

    // 4. Check if there are any patterns that suggest sample/generated data
    console.log('\n🔍 CHECKING FOR SAMPLE DATA PATTERNS:');
    
    // Check for suspicious patterns in dates
    const [datePatterns] = await connection.execute(`
      SELECT 
        DATE(updated_at) as completion_date,
        COUNT(*) as count
      FROM medical_checkups 
      WHERE status = 'completed' AND YEAR(updated_at) = 2025
      GROUP BY DATE(updated_at)
      HAVING COUNT(*) > 5
      ORDER BY count DESC
      LIMIT 10
    `);

    if (datePatterns.length > 0) {
      console.log('  Dates with unusually high checkup counts (possible sample data):');
      datePatterns.forEach(pattern => {
        console.log(`    ${pattern.completion_date}: ${pattern.count} checkups`);
      });
    }

    // 5. Check patient IDs to see if they're real or generated
    console.log('\n👥 CHECKING PATIENT DATA:');
    const [patients] = await connection.execute(`
      SELECT 
        id,
        first_name,
        last_name,
        DATE(created_at) as date_created
      FROM patients 
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.log('  Recent patients:');
    patients.forEach(patient => {
      console.log(`    ID: ${patient.id}, Name: ${patient.first_name} ${patient.last_name}, Created: ${patient.date_created}`);
    });

    // 6. Check for bulk insertion timestamps (indicates sample data)
    console.log('\n⏰ CHECKING FOR BULK DATA INSERTION:');
    const [bulkInserts] = await connection.execute(`
      SELECT 
        DATE(created_at) as creation_date,
        HOUR(created_at) as creation_hour,
        COUNT(*) as count
      FROM medical_checkups
      GROUP BY DATE(created_at), HOUR(created_at)
      HAVING COUNT(*) > 10
      ORDER BY count DESC
      LIMIT 5
    `);

    if (bulkInserts.length > 0) {
      console.log('  Bulk insertion patterns (suggests sample data):');
      bulkInserts.forEach(bulk => {
        console.log(`    ${bulk.creation_date} at ${bulk.creation_hour}:00: ${bulk.count} checkups created`);
      });
    }

    // 7. Summary
    console.log('\n📝 SUMMARY:');
    const totalCheckups = checkups.length > 0 ? await connection.execute('SELECT COUNT(*) as total FROM medical_checkups WHERE status = "completed"') : [[{total: 0}]];
    const totalVaccinations = vaccinations.length > 0 ? await connection.execute('SELECT COUNT(*) as total FROM vaccination_records') : [[{total: 0}]];
    
    console.log(`  Total completed checkups: ${totalCheckups[0][0].total}`);
    console.log(`  Total vaccinations: ${totalVaccinations[0][0].total}`);
    
    if (totalCheckups[0][0].total > 100) {
      console.log('  ⚠️  HIGH VOLUME: This seems like a lot of data for a test system');
    }
    
    if (datePatterns.length > 0) {
      console.log('  ⚠️  PATTERN DETECTED: Multiple checkups on same dates suggest sample data');
    }

  } catch (error) {
    console.error('❌ Error verifying data:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verifyRealData();