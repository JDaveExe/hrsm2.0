require('dotenv').config();
const mongoose = require('mongoose');
const Appointment = require('./models/Appointment');

async function showAppointments() {
  try {
    console.log('🔍 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Get all appointments
    const appointments = await Appointment.find({}).lean();
    
    console.log(`📅 Found ${appointments.length} appointments in the database:`);
    
    if (appointments.length === 0) {
      console.log('❌ No appointments found in the database');
    } else {
      // Display detailed information about each appointment
      appointments.forEach((appt, index) => {
        console.log(`\n📌 APPOINTMENT #${index + 1}:`);
        console.log(`ID: ${appt._id}`);
        console.log(`Patient ID: ${appt.patientId}`);
        console.log(`Doctor ID: ${appt.doctorId || 'Not assigned'}`);
        console.log(`Date: ${appt.appointmentDate}`);
        console.log(`Time: ${appt.appointmentTime}`);
        console.log(`Type: ${appt.type}`);
        console.log(`Status: ${appt.status}`);
        console.log(`Symptoms: ${appt.symptoms || 'None'}`);
        console.log(`Notes: ${appt.notes || 'None'}`);
        console.log(`Created At: ${appt.createdAt}`);
        console.log(`Updated At: ${appt.updatedAt}`);
      });
    }
    
    // Check the in-memory data as well
    console.log('\n🧠 Checking in-memory appointment data...');
    const inMemoryData = global.appointments || [];
    console.log(`Found ${inMemoryData.length} appointments in memory:`);
    
    if (inMemoryData.length > 0) {
      inMemoryData.forEach((appt, index) => {
        console.log(`\n🔹 IN-MEMORY APPOINTMENT #${index + 1}:`);
        console.log(JSON.stringify(appt, null, 2));
      });
    } else {
      console.log('❌ No in-memory appointments found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from database');
  }
}

showAppointments();