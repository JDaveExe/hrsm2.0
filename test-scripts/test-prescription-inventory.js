const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test prescription inventory deduction functionality
async function testPrescriptionInventoryDeduction() {
  console.log('🧪 Testing Prescription Inventory Deduction System\n');
  
  try {
    // Step 0: Login to get authentication token
    console.log('🔐 Step 0: Authenticating as doctor...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      login: 'doctor',
      password: 'doctor123'
    });
    
    const token = loginResponse.data.token;
    const doctorUser = loginResponse.data.user;
    const doctorId = doctorUser.id;
    console.log(`✅ Authentication successful - Doctor ID: ${doctorId}\n`);
    
    // Set default headers for all requests
    axios.defaults.headers.common['x-auth-token'] = token;
    // Step 1: Check current medication inventory
    console.log('📋 Step 1: Checking current medication inventory...');
    const inventoryResponse = await axios.get(`${BASE_URL}/inventory/medications`);
    const medications = inventoryResponse.data;
    
    if (!medications || medications.length === 0) {
      console.log('❌ No medications found in inventory. Adding test medication...');
      
      // Add a test medication
      const testMedication = {
        name: 'Test Paracetamol 500mg',
        unitsInStock: 100,
        minimumStock: 20,
        unitCost: 5.50,
        manufacturer: 'Test Pharma',
        batchNumber: 'TEST001',
        expiryDate: '2025-12-31',
        description: 'Test medication for prescription deduction'
      };
      
      const addMedResponse = await axios.post(`${BASE_URL}/inventory/medications`, testMedication);
      console.log('✅ Test medication added:', addMedResponse.data.name);
    }
    
    // Get updated inventory
    const updatedInventoryResponse = await axios.get(`${BASE_URL}/inventory/medications`);
    const updatedMedications = updatedInventoryResponse.data;
    
    // Select first medication for testing
    const testMedication = updatedMedications[0];
    const originalStock = testMedication.unitsInStock;
    
    console.log(`📦 Selected medication: ${testMedication.name}`);
    console.log(`📊 Original stock: ${originalStock} units\n`);
    
    // Step 2: Get existing patients
    console.log('👤 Step 2: Getting existing patients...');
    let testPatient;
    
    try {
      const patientsResponse = await axios.get(`${BASE_URL}/patients`);
      const patients = patientsResponse.data;
      
      if (patients && patients.length > 0) {
        testPatient = patients[0]; // Use first existing patient
        console.log(`✅ Using existing patient: ${testPatient.firstName} ${testPatient.lastName} (ID: ${testPatient.id})`);
      } else {
        console.log('Creating test patient...');
        const patientData = {
          firstName: 'TestPrescription',
          lastName: 'Patient',
          dateOfBirth: '1990-01-01',
          gender: 'Male',
          contactNumber: '555-0123',
          address: 'Test Address',
          emergencyContact: '555-0124'
        };
        
        const createPatientResponse = await axios.post(`${BASE_URL}/patients`, patientData);
        testPatient = createPatientResponse.data;
        console.log('✅ Test patient created');
      }
    } catch (error) {
      console.error('❌ Could not get or create patient:', error.message);
      return;
    }
    
    // Step 3: Create a check-in session
    console.log('🏥 Step 3: Creating check-in session...');
    const sessionData = {
      patientId: testPatient.id,
      chiefComplaint: 'Fever and headache - prescription test',
      vitalSigns: {
        temperature: '38.5',
        bloodPressure: '120/80',
        heartRate: '75',
        respiratoryRate: '16'
      },
      notes: 'Test session for prescription inventory deduction'
    };
    
    const sessionResponse = await axios.post(`${BASE_URL}/checkups`, sessionData);
    const sessionId = sessionResponse.data.id;
    console.log(`✅ Check-in session created with ID: ${sessionId}\n`);
    
    // Step 4: Complete the checkup with prescription
    console.log('💊 Step 4: Completing checkup with prescription...');
    const prescriptionQuantity = 5; // Test with 5 units
    
    const completionData = {
      status: 'completed',
      diagnosis: 'Fever - treated with medication',
      treatment: 'Prescribed paracetamol for fever',
      prescriptions: [
        {
          medication: testMedication.name,
          dosage: '500mg',
          frequency: 'Twice daily',
          duration: '5 days',
          quantity: prescriptionQuantity,
          instructions: 'Take after meals'
        }
      ],
      doctorId: doctorId // Use authenticated doctor ID
    };
    
    console.log(`📝 Prescribing ${prescriptionQuantity} units of ${testMedication.name}...`);
    
    const completionResponse = await axios.put(`${BASE_URL}/checkups/${sessionId}/status`, completionData);
    console.log('✅ Checkup completed successfully\n');
    
    // Step 5: Verify inventory reduction
    console.log('🔍 Step 5: Verifying inventory reduction...');
    const finalInventoryResponse = await axios.get(`${BASE_URL}/inventory/medications`);
    const finalMedications = finalInventoryResponse.data;
    const updatedMedication = finalMedications.find(m => m.name === testMedication.name);
    
    const finalStock = updatedMedication.unitsInStock;
    const expectedStock = originalStock - prescriptionQuantity;
    
    console.log(`📊 Original stock: ${originalStock} units`);
    console.log(`📝 Prescribed quantity: ${prescriptionQuantity} units`);
    console.log(`📦 Final stock: ${finalStock} units`);
    console.log(`🎯 Expected stock: ${expectedStock} units`);
    
    if (finalStock === expectedStock) {
      console.log('✅ SUCCESS: Inventory correctly reduced by prescribed amount!');
      
      // Check status update
      if (finalStock <= updatedMedication.minimumStock) {
        console.log(`⚠️ Medication status updated: ${updatedMedication.status}`);
      }
      
    } else {
      console.log('❌ FAILURE: Inventory reduction did not work as expected');
      console.log(`Expected: ${expectedStock}, Got: ${finalStock}`);
    }
    
    // Step 6: Check prescription analytics
    console.log('\n📈 Step 6: Verifying prescription analytics...');
    try {
      const analyticsResponse = await axios.get(`${BASE_URL}/dashboard/prescription-analytics`);
      console.log('✅ Prescription analytics updated:');
      console.log(`📊 Total prescriptions: ${analyticsResponse.data.summary.totalPrescriptions}`);
      console.log(`💊 Total medications dispensed: ${analyticsResponse.data.summary.totalMedicationsDispensed}`);
    } catch (error) {
      console.log('⚠️ Could not fetch prescription analytics');
    }
    
    console.log('\n🎉 Prescription inventory deduction test completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testPrescriptionInventoryDeduction();
