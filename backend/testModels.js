/**
 * Database Models Test Script
 * Tests MongoDB connection and model functionality
 */

require('dotenv').config({ path: 'c:/Users/dolfo/hrsm2/backend/.env' });
const mongoose = require('mongoose');

// Import models
const User = require('./models/User');
const Patient = require('./models/Patient');
const Appointment = require('./models/Appointment');
const MedicalRecord = require('./models/MedicalRecord');
const Prescription = require('./models/Prescription');
const Family = require('./models/Family');
const Notification = require('./models/Notification');

// Import utilities
const { hashPassword, validatePasswordStrength } = require('./utils/passwordUtils');
const { generateTokens } = require('./config/auth');

/**
 * Test database connection and models
 */
async function testModels() {
  try {
    console.log('🔧 Starting database models test...\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/maybunga_healthcare', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB successfully\n');

    // Test 1: User Model
    console.log('👤 Testing User Model...');
    const testUser = new User({
      username: 'testdoctor',
      email: 'testdoctor@maybunga.com',
      password: 'SecurePass123!',
      role: 'doctor',
      profile: {
        firstName: 'Dr. John',
        lastName: 'Doe',
        contactNumber: '+63 912 345 6789',
        address: 'Maybunga, Marikina City',
        dateOfBirth: new Date('1980-05-15'),
        gender: 'Male'
      }
    });

    // Test password validation
    const passwordValidation = validatePasswordStrength('SecurePass123!');
    console.log('   Password Validation:', passwordValidation);

    await testUser.save();
    console.log('   ✅ User created successfully:', testUser.profile.fullName);

    // Test password comparison
    const isPasswordValid = await testUser.comparePassword('SecurePass123!');
    console.log('   ✅ Password comparison works:', isPasswordValid);

    // Test 2: Patient Model
    console.log('\n🏥 Testing Patient Model...');
    const testPatient = new Patient({
      userId: testUser._id,
      personalInfo: {
        birthDate: new Date('1990-03-20'),
        gender: 'Male',
        bloodType: 'O+',
        emergencyContact: {
          name: 'Jane Doe',
          relationship: 'Spouse',
          phoneNumber: '+63 912 345 6789'
        },
        insurance: {
          provider: 'PhilHealth',
          policyNumber: 'PH123456789',
          expiryDate: new Date('2025-12-31')
        }
      }
    });

    await testPatient.save();
    console.log('   ✅ Patient created successfully:', testPatient.patientId);
    console.log('   ✅ Patient age calculated:', testPatient.age, 'years');

    // Generate QR code
    const qrCode = await testPatient.generateQRCode();
    await testPatient.save();
    console.log('   ✅ QR Code generated:', qrCode);

    // Test 3: Appointment Model
    console.log('\n📅 Testing Appointment Model...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const testAppointment = new Appointment({
      patientId: testPatient._id,
      doctorId: testUser._id,
      appointmentDate: tomorrow,
      appointmentTime: '10:00',
      type: 'consultation',
      reason: 'Regular checkup',
      symptoms: ['Fever', 'Headache']
    });

    await testAppointment.save();
    console.log('   ✅ Appointment created successfully:', testAppointment.appointmentId);
    console.log('   ✅ Appointment DateTime:', testAppointment.appointmentDateTime);

    // Test 4: Medical Record Model
    console.log('\n📋 Testing Medical Record Model...');
    const testMedicalRecord = new MedicalRecord({
      patientId: testPatient._id,
      doctorId: testUser._id,
      appointmentId: testAppointment._id,
      recordType: 'treatment',
      date: new Date(),
      diagnosis: 'Common cold',
      treatment: 'Rest and medication',
      medications: [{
        name: 'Paracetamol',
        dosage: '500mg',
        frequency: 'Every 6 hours',
        duration: '3 days'
      }],
      vitals: {
        bloodPressure: '120/80',
        temperature: 37.2,
        weight: 70,
        height: 175,
        heartRate: 75
      }
    });

    await testMedicalRecord.save();
    console.log('   ✅ Medical Record created successfully:', testMedicalRecord.recordId);
    console.log('   ✅ BMI calculated:', testMedicalRecord.bmi);

    // Test 5: Prescription Model
    console.log('\n💊 Testing Prescription Model...');
    const testPrescription = new Prescription({
      patientId: testPatient._id,
      doctorId: testUser._id,
      appointmentId: testAppointment._id,
      medicalRecordId: testMedicalRecord._id,
      medications: [{
        name: 'Paracetamol',
        genericName: 'Acetaminophen',
        dosage: '500mg',
        frequency: 'Every 6 hours',
        duration: '3 days',
        instructions: 'Take with food',
        quantity: 12,
        refills: 0
      }],
      dateIssued: new Date(),
      pharmacy: {
        name: 'Maybunga Pharmacy',
        address: 'Maybunga, Marikina City',
        contactNumber: '+63 2 1234 5678'
      }
    });

    await testPrescription.save();
    console.log('   ✅ Prescription created successfully:', testPrescription.prescriptionId);
    console.log('   ✅ Total duration:', testPrescription.totalDuration);

    // Test 6: Family Model
    console.log('\n👨‍👩‍👧‍👦 Testing Family Model...');
    const testFamily = new Family({
      familyName: 'Doe Family',
      headOfFamily: testPatient._id,
      members: [{
        patientId: testPatient._id,
        relationship: 'Head of Family',
        isPrimary: true
      }],
      address: {
        street: '123 Main Street',
        barangay: 'Maybunga',
        city: 'Marikina',
        province: 'Metro Manila',
        zipCode: '1800'
      },
      contactNumber: '+63 912 345 6789'
    });

    await testFamily.save();
    console.log('   ✅ Family created successfully:', testFamily.familyId);
    console.log('   ✅ Full address:', testFamily.fullAddress);

    // Test 7: Notification Model
    console.log('\n🔔 Testing Notification Model...');
    const testNotification = new Notification({
      recipientId: testUser._id,
      type: 'appointment',
      title: 'Appointment Reminder',
      message: 'You have an appointment tomorrow at 10:00 AM',
      data: {
        appointmentId: testAppointment._id,
        patientName: testUser.profile.fullName
      },
      priority: 'normal'
    });

    await testNotification.save();
    console.log('   ✅ Notification created successfully');
    console.log('   ✅ Time ago:', testNotification.timeAgo);

    // Test 8: JWT Token Generation
    console.log('\n🔐 Testing JWT Token Generation...');
    const tokens = generateTokens(testUser);
    console.log('   ✅ Access Token generated (length):', tokens.accessToken.length);
    console.log('   ✅ Refresh Token generated (length):', tokens.refreshToken.length);

    // Test 9: Model Relationships
    console.log('\n🔗 Testing Model Relationships...');
    const populatedAppointment = await Appointment.findById(testAppointment._id)
      .populate('patientId', 'patientId personalInfo')
      .populate('doctorId', 'profile.firstName profile.lastName');
    
    console.log('   ✅ Populated appointment patient:', populatedAppointment.patientId.patientId);
    console.log('   ✅ Populated appointment doctor:', populatedAppointment.doctorId.profile.fullName);

    // Test 10: Static Methods
    console.log('\n⚡ Testing Static Methods...');
    const todaysAppointments = await Appointment.findTodaysAppointments(testUser._id);
    console.log('   ✅ Today\'s appointments found:', todaysAppointments.length);

    const activePrescrip = await Prescription.findActiveByPatient(testPatient._id);
    console.log('   ✅ Active prescriptions found:', activePrescrip.length);

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('   ✅ Database Connection: Success');
    console.log('   ✅ User Model: Success');
    console.log('   ✅ Patient Model: Success');
    console.log('   ✅ Appointment Model: Success');
    console.log('   ✅ Medical Record Model: Success');
    console.log('   ✅ Prescription Model: Success');
    console.log('   ✅ Family Model: Success');
    console.log('   ✅ Notification Model: Success');
    console.log('   ✅ JWT Token Generation: Success');
    console.log('   ✅ Model Relationships: Success');
    console.log('   ✅ Static Methods: Success');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n📡 Database connection closed');
  }
}

// Run tests
if (require.main === module) {
  testModels();
}

module.exports = testModels;
