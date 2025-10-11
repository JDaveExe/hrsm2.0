/**
 * Test script to verify Management Dashboard charts update correctly
 * when new vaccinations and prescriptions are added
 */
const axios = require('axios');
const mysql = require('mysql2/promise');

const BASE_URL = 'http://localhost:5000';

// Database connection
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hrsm2'
};

async function getChartData() {
  try {
    const [vaccineResponse, prescriptionResponse] = await Promise.all([
      axios.get(`${BASE_URL}/api/dashboard/vaccine-usage`),
      axios.get(`${BASE_URL}/api/dashboard/prescription-distribution`)
    ]);
    
    return {
      vaccines: vaccineResponse.data,
      prescriptions: prescriptionResponse.data,
      totalVaccineUses: vaccineResponse.data.reduce((sum, v) => sum + v.usage_count, 0),
      totalPrescriptionUses: prescriptionResponse.data.reduce((sum, p) => sum + p.usage_count, 0)
    };
  } catch (error) {
    console.error('Error fetching chart data:', error.message);
    return null;
  }
}

async function testChartCounting() {
  console.log('🧪 Testing Management Dashboard Chart Counting\n');
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Step 1: Get initial chart data
    console.log('📊 Step 1: Getting initial chart data...');
    const initialData = await getChartData();
    if (!initialData) {
      console.log('❌ Failed to get initial data');
      return;
    }
    
    console.log('📈 Initial Chart State:');
    console.log(`   Vaccine Usage Distribution: ${initialData.vaccines.length} vaccines, ${initialData.totalVaccineUses} total uses`);
    console.log(`   Category Distribution: Vaccines (${initialData.totalVaccineUses}) vs Prescriptions (${initialData.totalPrescriptionUses})`);
    
    // Step 2: Find an existing patient and add a test vaccination
    console.log('\n💉 Step 2: Adding a test vaccination...');
    const today = new Date().toISOString().split('T')[0];
    
    // Get an existing patient ID
    const [patients] = await connection.execute('SELECT id FROM patients LIMIT 1');
    if (patients.length === 0) {
      console.log('❌ No patients found in database');
      return;
    }
    const patientId = patients[0].id;
    console.log(`   Using patient ID: ${patientId}`);
    
    await connection.execute(`
      INSERT INTO vaccinations (
        patientId, vaccineName, administrationSite, administrationRoute, dose, 
        administeredBy, administeredAt, category, notes, consentGiven,
        createdAt, updatedAt
      ) VALUES (
        ?, 'Test Hepatitis B Vaccine', 'left-arm', 'Intramuscular', '1ml',
        'Dr. Test', ?, 'Routine Childhood', 'Test vaccination for chart counting', 1,
        NOW(), NOW()
      )
    `, [patientId, today]);
    
    console.log('✅ Added test vaccination: Test Hepatitis B Vaccine');
    
    // Step 3: Add a test prescription (simulate by adding to check_in_sessions)
    console.log('\n💊 Step 3: Adding a test prescription...');
    
    await connection.execute(`
      INSERT INTO check_in_sessions (
        patientId, serviceType, status, prescription, createdAt, updatedAt
      ) VALUES (
        ?, 'regular-checkup', 'completed', 
        '[{"medication": "Test Amoxicillin 500mg", "dosage": "500mg", "frequency": "3 times daily", "duration": "7 days"}]',
        NOW(), NOW()
      )
    `, [patientId]);
    
    console.log('✅ Added test prescription: Test Amoxicillin 500mg');
    
    // Step 4: Get updated chart data
    console.log('\n📊 Step 4: Getting updated chart data...');
    const updatedData = await getChartData();
    if (!updatedData) {
      console.log('❌ Failed to get updated data');
      return;
    }
    
    console.log('📈 Updated Chart State:');
    console.log(`   Vaccine Usage Distribution: ${updatedData.vaccines.length} vaccines, ${updatedData.totalVaccineUses} total uses`);
    console.log(`   Category Distribution: Vaccines (${updatedData.totalVaccineUses}) vs Prescriptions (${updatedData.totalPrescriptionUses})`);
    
    // Step 5: Verify the changes
    console.log('\n🔍 Step 5: Verification...');
    const vaccineIncrease = updatedData.totalVaccineUses - initialData.totalVaccineUses;
    const prescriptionIncrease = updatedData.totalPrescriptionUses - initialData.totalPrescriptionUses;
    
    console.log(`📊 Vaccine usage change: +${vaccineIncrease} (expected: +1)`);
    console.log(`📊 Prescription usage change: +${prescriptionIncrease} (expected: +1)`);
    
    // Check if Test Hepatitis B Vaccine appears in vaccine distribution
    const testVaccine = updatedData.vaccines.find(v => v.vaccine_name === 'Test Hepatitis B Vaccine');
    if (testVaccine) {
      console.log(`✅ Test vaccine found in Vaccine Usage Distribution: ${testVaccine.usage_count} use(s)`);
    } else {
      console.log('❌ Test vaccine NOT found in Vaccine Usage Distribution');
    }
    
    // Check if Test Amoxicillin appears in prescription distribution
    const testPrescription = updatedData.prescriptions.find(p => p.prescription_name === 'Test Amoxicillin 500mg');
    if (testPrescription) {
      console.log(`✅ Test prescription found in Prescription Distribution: ${testPrescription.usage_count} use(s)`);
    } else {
      console.log('❌ Test prescription NOT found in Prescription Distribution');
    }
    
    // Step 6: Results summary
    console.log('\n🎯 Test Results:');
    if (vaccineIncrease === 1) {
      console.log('✅ Vaccine Usage Distribution: COUNTING CORRECTLY');
    } else {
      console.log('❌ Vaccine Usage Distribution: NOT counting correctly');
    }
    
    if (prescriptionIncrease === 1) {
      console.log('✅ Category Distribution (Prescriptions): COUNTING CORRECTLY');
    } else {
      console.log('❌ Category Distribution (Prescriptions): NOT counting correctly');
    }
    
    // Step 7: Cleanup test data
    console.log('\n🧹 Step 7: Cleaning up test data...');
    await connection.execute(`
      DELETE FROM vaccinations 
      WHERE vaccineName = 'Test Hepatitis B Vaccine' AND notes = 'Test vaccination for chart counting'
    `);
    
    await connection.execute(`
      DELETE FROM check_in_sessions 
      WHERE prescription LIKE '%Test Amoxicillin 500mg%'
    `);
    
    console.log('✅ Test data cleaned up');
    
    await connection.end();
    
    console.log('\n🎉 Chart counting test completed!');
    console.log('💡 Now complete a real vaccination/prescription in the system to see live updates!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testChartCounting();