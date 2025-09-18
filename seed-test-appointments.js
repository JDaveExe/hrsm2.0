// Script to seed the database with test appointments
// This will create some sample appointments to test the system

const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');

console.log('🌱 Seeding Database with Test Appointments');
console.log('==========================================\n');

// Simple test to create appointments via API
async function seedAppointments() {
  const testAppointments = [
    {
      patientId: 1,
      doctorId: 1,
      appointmentDate: '2025-09-17', // Today
      appointmentTime: '09:00',
      type: 'Check-up',
      duration: 30,
      priority: 'Normal',
      notes: 'Regular health check-up',
      status: 'approved'
    },
    {
      patientId: 2,
      doctorId: 1,
      appointmentDate: '2025-09-17', // Today
      appointmentTime: '10:30',
      type: 'Follow-up',
      duration: 45,
      priority: 'High',
      notes: 'Follow-up on previous consultation',
      status: 'approved'
    },
    {
      patientId: 3,
      doctorId: 2,
      appointmentDate: '2025-09-18', // Tomorrow
      appointmentTime: '14:00',
      type: 'Consultation',
      duration: 60,
      priority: 'Normal',
      notes: 'Initial consultation for new patient',
      status: 'pending'
    },
    {
      patientId: 4,
      doctorId: 2,
      appointmentDate: '2025-09-19', // Day after tomorrow
      appointmentTime: '11:00',
      type: 'Vaccination',
      duration: 15,
      priority: 'Normal',
      notes: 'COVID-19 booster shot',
      status: 'approved'
    },
    {
      patientId: 5,
      doctorId: 1,
      appointmentDate: '2025-09-20', // Future
      appointmentTime: '15:30',
      type: 'Lab Test',
      duration: 30,
      priority: 'High',
      notes: 'Blood work and analysis',
      status: 'pending'
    }
  ];

  console.log('Test Appointments to Create:');
  testAppointments.forEach((apt, index) => {
    console.log(`  ${index + 1}. ${apt.appointmentDate} ${apt.appointmentTime} - ${apt.type} (Patient ${apt.patientId})`);
  });
  console.log('');

  // Instructions for manual creation
  console.log('📋 Manual API Testing Instructions:');
  console.log('=====================================');
  
  testAppointments.forEach((apt, index) => {
    console.log(`\n${index + 1}. Create ${apt.type} appointment:`);
    console.log('POST http://localhost:5000/api/appointments');
    console.log('Headers: {"x-auth-token": "temp-admin-token", "Content-Type": "application/json"}');
    console.log('Body:');
    console.log(JSON.stringify(apt, null, 2));
  });

  console.log('\n\n🔧 PowerShell Commands to Create Appointments:');
  console.log('==============================================');

  testAppointments.forEach((apt, index) => {
    const body = JSON.stringify(apt).replace(/"/g, '\\"');
    console.log(`\n# Appointment ${index + 1}: ${apt.type} on ${apt.appointmentDate}`);
    console.log(`Invoke-WebRequest -Uri "http://localhost:5000/api/appointments" -Method POST -Headers @{"x-auth-token"="temp-admin-token"; "Content-Type"="application/json"} -Body '${body}'`);
  });

  console.log('\n\n🎯 Expected Results:');
  console.log('===================');
  console.log('✅ Each API call should return 201 Created');
  console.log('✅ After creating appointments, refresh the admin dashboard');
  console.log('✅ Should see "Appointments API succeeded: X appointments"');
  console.log('✅ Today\'s schedule should show appointments for today');
  console.log('✅ Calendar should show days with appointment indicators');
  console.log('✅ No more "NO APPOINTMENTS FOUND" warnings');

  console.log('\n\n🔍 Verification Steps:');
  console.log('=====================');
  console.log('1. Run the PowerShell commands above to create test appointments');
  console.log('2. Check API response: GET http://localhost:5000/api/appointments');
  console.log('3. Refresh admin dashboard in browser');
  console.log('4. Verify appointments appear in Today\'s Schedule and All Appointments');
  console.log('5. Check calendar for appointment indicators on respective dates');
}

// Check current appointments first
async function checkCurrentAppointments() {
  console.log('🔍 Checking Current Appointments in Database');
  console.log('==========================================');
  
  try {
    const response = await fetch('http://localhost:5000/api/appointments', {
      headers: {
        'x-auth-token': 'temp-admin-token',
        'Content-Type': 'application/json'
      }
    });
    
    const appointments = await response.json();
    
    console.log(`Current appointments in database: ${appointments.length}`);
    
    if (appointments.length === 0) {
      console.log('❌ Database is empty - this explains the "NO APPOINTMENTS FOUND" issue');
      console.log('💡 Solution: Create test appointments using the commands below');
    } else {
      console.log('✅ Database has appointments:');
      appointments.forEach((apt, index) => {
        console.log(`  ${index + 1}. ${apt.appointmentDate} ${apt.appointmentTime} - ${apt.type} (${apt.status})`);
      });
    }
    
    console.log('');
    
  } catch (error) {
    console.error('❌ Failed to check appointments:', error.message);
    console.log('🔍 This might indicate a backend connectivity issue');
    console.log('');
  }
}

// Main execution
async function main() {
  try {
    await checkCurrentAppointments();
    await seedAppointments();
    
    console.log('\n✅ Database seeding analysis complete!');
    console.log('🎯 Next step: Run the PowerShell commands to create test appointments');
    
  } catch (error) {
    console.error('❌ Seeding analysis failed:', error);
  }
}

// Execute
main();