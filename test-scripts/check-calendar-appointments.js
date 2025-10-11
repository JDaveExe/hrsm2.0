require('dotenv').config();
const { Appointment, Patient, User } = require('./backend/models');
const { connectDB } = require('./backend/config/database');

async function checkCalendarAppointments() {
  try {
    console.log('🔍 Connecting to database...');
    await connectDB();
    
    console.log('\n📅 Checking ALL appointments in database...\n');
    
    const appointments = await Appointment.findAll({
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      order: [['appointmentDate', 'ASC'], ['appointmentTime', 'ASC']]
    });
    
    console.log(`Found ${appointments.length} appointments in database:\n`);
    
    if (appointments.length === 0) {
      console.log('❌ NO APPOINTMENTS FOUND IN DATABASE!');
      console.log('This explains why the calendar is empty.\n');
      return;
    }
    
    // Group by date for calendar view
    const appointmentsByDate = {};
    
    appointments.forEach((apt, index) => {
      const dateKey = apt.appointmentDate;
      if (!appointmentsByDate[dateKey]) {
        appointmentsByDate[dateKey] = [];
      }
      
      const patientName = apt.patient 
        ? `${apt.patient.firstName} ${apt.patient.lastName}`
        : 'Unknown Patient';
      
      const doctorName = apt.doctor
        ? `${apt.doctor.firstName} ${apt.doctor.lastName}`
        : 'Unassigned';
      
      appointmentsByDate[dateKey].push({
        id: apt.id,
        time: apt.appointmentTime,
        patient: patientName,
        doctor: doctorName,
        type: apt.type,
        status: apt.status
      });
      
      console.log(`📋 Appointment #${index + 1}:`);
      console.log(`   ID: ${apt.id}`);
      console.log(`   Date: ${apt.appointmentDate}`);
      console.log(`   Time: ${apt.appointmentTime}`);
      console.log(`   Patient: ${patientName} (ID: ${apt.patientId})`);
      console.log(`   Doctor: ${doctorName} (ID: ${apt.doctorId || 'N/A'})`);
      console.log(`   Type: ${apt.type}`);
      console.log(`   Status: ${apt.status}`);
      console.log(`   Created: ${apt.createdAt}`);
      console.log('');
    });
    
    console.log('\n📊 CALENDAR VIEW - Appointments by Date:\n');
    Object.keys(appointmentsByDate).sort().forEach(date => {
      const appts = appointmentsByDate[date];
      console.log(`📅 ${date} (${appts.length} appointments):`);
      appts.forEach(apt => {
        console.log(`   • ${apt.time} - ${apt.patient} - ${apt.type} - ${apt.status}`);
      });
      console.log('');
    });
    
    // Check for October 2025 appointments specifically
    console.log('\n🔍 October 2025 appointments:');
    const octoberAppts = appointments.filter(apt => {
      return apt.appointmentDate && apt.appointmentDate.startsWith('2025-10');
    });
    
    if (octoberAppts.length > 0) {
      console.log(`✅ Found ${octoberAppts.length} appointments in October 2025`);
      octoberAppts.forEach(apt => {
        console.log(`   - ${apt.appointmentDate} at ${apt.appointmentTime}`);
      });
    } else {
      console.log('❌ No appointments found in October 2025');
      console.log('This is why the calendar appears empty for this month!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkCalendarAppointments();
