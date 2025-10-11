require('dotenv').config({ path: './backend/.env' });
const express = require('express');
const { sequelize } = require('./backend/config/database');

// Import models with associations
require('./backend/models');
const Appointment = require('./backend/models/Appointment');
const Patient = require('./backend/models/Patient');

async function testAppointmentsAPI() {
  try {
    console.log('🔍 Testing appointments API response...');
    
    await sequelize.authenticate();
    console.log('✅ Database connection established.');
    
    // Check what the appointments route would return
    const appointments = await Appointment.findAll({
      where: { isActive: true },
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'contactNumber', 'email']
        }
      ],
      order: [['appointmentDate', 'ASC'], ['appointmentTime', 'ASC']]
    });
    
    console.log(`\n📊 Database appointments: ${appointments.length}`);
    
    appointments.forEach((apt, index) => {
      console.log(`${index + 1}. ${apt.patient ? apt.patient.firstName + ' ' + apt.patient.lastName : 'Unknown Patient'}`);
      console.log(`   Date: ${apt.appointmentDate}, Time: ${apt.appointmentTime}`);
      console.log(`   Type: ${apt.type}, Status: ${apt.status}`);
      console.log(`   ID: ${apt.id}\n`);
    });
    
    // Check if there's hardcoded pendingAppointments in memory
    console.log('📊 In-memory pendingAppointments array would be empty on server restart.');
    
    console.log('\n🤔 If UI still shows Ricardo Aquino appointments, they must be:');
    console.log('   1. Hardcoded in the frontend');
    console.log('   2. Coming from browser cache/localStorage');
    console.log('   3. From a different API endpoint');
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error testing appointments API:', error);
  }
}

testAppointmentsAPI();