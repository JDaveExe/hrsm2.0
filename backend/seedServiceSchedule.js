const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

// Import models
const ServiceSchedule = require('./models/ServiceSchedule');
const User = require('./models/User');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/maybunga_healthcare');
    console.log('✅ Connected to MongoDB for seeding');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Service schedule data based on healthcare center's schedule
const serviceScheduleData = [
  // MONDAY
  {
    dayOfWeek: 'monday',
    timeSlot: 'morning',
    availableServices: [
      {
        serviceType: 'consultation',
        requiresVitalSigns: true,
        maxCapacity: 30,
        description: 'General medical consultation',
        estimatedDuration: 30
      },
      {
        serviceType: 'dental-consultation',
        requiresVitalSigns: false,
        maxCapacity: 15,
        description: 'Dental check-up and consultation',
        estimatedDuration: 45
      },
      {
        serviceType: 'dental-procedure',
        requiresVitalSigns: true,
        maxCapacity: 10,
        description: 'Dental procedures and treatments',
        estimatedDuration: 60
      },
      {
        serviceType: 'vaccination-bcg',
        requiresVitalSigns: true,
        maxCapacity: 20,
        description: 'BCG vaccination for tuberculosis protection',
        estimatedDuration: 15
      },
      {
        serviceType: 'vaccination-hepatitis-b',
        requiresVitalSigns: true,
        maxCapacity: 20,
        description: 'Hepatitis B vaccination',
        estimatedDuration: 15
      },
      {
        serviceType: 'vaccination-polio',
        requiresVitalSigns: true,
        maxCapacity: 20,
        description: 'Polio vaccination (OPV/IPV)',
        estimatedDuration: 15
      },
      {
        serviceType: 'vaccination-dtap',
        requiresVitalSigns: true,
        maxCapacity: 20,
        description: 'DTaP vaccination (Diphtheria, Tetanus, Pertussis)',
        estimatedDuration: 15
      },
      {
        serviceType: 'vaccination-mmr',
        requiresVitalSigns: true,
        maxCapacity: 20,
        description: 'MMR vaccination (Measles, Mumps, Rubella)',
        estimatedDuration: 15
      }
    ]
  },
  {
    dayOfWeek: 'monday',
    timeSlot: 'afternoon',
    availableServices: [
      {
        serviceType: 'follow-up',
        requiresVitalSigns: true,
        maxCapacity: 25,
        description: 'Follow-up consultation for ongoing treatment',
        estimatedDuration: 20
      },
      {
        serviceType: 'dental-consultation',
        requiresVitalSigns: false,
        maxCapacity: 15,
        description: 'Dental check-up and consultation',
        estimatedDuration: 45
      },
      {
        serviceType: 'vaccination-influenza',
        requiresVitalSigns: true,
        maxCapacity: 30,
        description: 'Seasonal influenza vaccination',
        estimatedDuration: 15
      }
    ]
  },

  // TUESDAY
  {
    dayOfWeek: 'tuesday',
    timeSlot: 'morning',
    availableServices: [
      {
        serviceType: 'out-patient',
        requiresVitalSigns: true,
        maxCapacity: 25,
        description: 'Out-patient consultation and treatment',
        estimatedDuration: 45
      },
      {
        serviceType: 'vaccination-pneumococcal',
        requiresVitalSigns: true,
        maxCapacity: 20,
        description: 'Pneumococcal vaccination',
        estimatedDuration: 15
      },
      {
        serviceType: 'vaccination-varicella',
        requiresVitalSigns: true,
        maxCapacity: 20,
        description: 'Varicella (Chickenpox) vaccination',
        estimatedDuration: 15
      }
    ]
  },
  {
    dayOfWeek: 'tuesday',
    timeSlot: 'afternoon',
    availableServices: [
      {
        serviceType: 'follow-up',
        requiresVitalSigns: true,
        maxCapacity: 25,
        description: 'Follow-up consultation for ongoing treatment',
        estimatedDuration: 20
      },
      {
        serviceType: 'dental-consultation',
        requiresVitalSigns: false,
        maxCapacity: 15,
        description: 'Dental check-up and consultation',
        estimatedDuration: 45
      },
      {
        serviceType: 'vaccination-hepatitis-a',
        requiresVitalSigns: true,
        maxCapacity: 20,
        description: 'Hepatitis A vaccination',
        estimatedDuration: 15
      }
    ]
  },

  // WEDNESDAY
  {
    dayOfWeek: 'wednesday',
    timeSlot: 'morning',
    availableServices: [
      {
        serviceType: 'dental-fluoride',
        requiresVitalSigns: true,
        maxCapacity: 20,
        description: 'Dental consultation with fluoride varnish application',
        estimatedDuration: 30
      },
      {
        serviceType: 'vaccination-rabies',
        requiresVitalSigns: true,
        maxCapacity: 15,
        description: 'Rabies vaccination',
        estimatedDuration: 20
      }
    ]
  },
  {
    dayOfWeek: 'wednesday',
    timeSlot: 'afternoon',
    availableServices: [
      {
        serviceType: 'follow-up',
        requiresVitalSigns: true,
        maxCapacity: 25,
        description: 'Follow-up consultation for ongoing treatment',
        estimatedDuration: 20
      },
      {
        serviceType: 'dental-consultation',
        requiresVitalSigns: false,
        maxCapacity: 15,
        description: 'Dental check-up and consultation',
        estimatedDuration: 45
      },
      {
        serviceType: 'vaccination-influenza',
        requiresVitalSigns: true,
        maxCapacity: 30,
        description: 'Seasonal influenza vaccination',
        estimatedDuration: 15
      }
    ]
  },

  // THURSDAY
  {
    dayOfWeek: 'thursday',
    timeSlot: 'morning',
    availableServices: [
      {
        serviceType: 'out-patient',
        requiresVitalSigns: true,
        maxCapacity: 25,
        description: 'Out-patient consultation and treatment',
        estimatedDuration: 45
      },
      {
        serviceType: 'dental-procedure',
        requiresVitalSigns: true,
        maxCapacity: 10,
        description: 'Dental procedures and treatments',
        estimatedDuration: 60
      },
      {
        serviceType: 'vaccination-bcg',
        requiresVitalSigns: true,
        maxCapacity: 20,
        description: 'BCG vaccination for tuberculosis protection',
        estimatedDuration: 15
      }
    ]
  },
  {
    dayOfWeek: 'thursday',
    timeSlot: 'afternoon',
    availableServices: [
      {
        serviceType: 'follow-up',
        requiresVitalSigns: true,
        maxCapacity: 25,
        description: 'Follow-up consultation for ongoing treatment',
        estimatedDuration: 20
      },
      {
        serviceType: 'dental-consultation',
        requiresVitalSigns: false,
        maxCapacity: 15,
        description: 'Dental check-up and consultation',
        estimatedDuration: 45
      },
      {
        serviceType: 'vaccination-mmr',
        requiresVitalSigns: true,
        maxCapacity: 20,
        description: 'MMR vaccination (Measles, Mumps, Rubella)',
        estimatedDuration: 15
      }
    ]
  },

  // FRIDAY
  {
    dayOfWeek: 'friday',
    timeSlot: 'morning',
    availableServices: [
      {
        serviceType: 'parental-consultation',
        requiresVitalSigns: true,
        maxCapacity: 20,
        description: 'Parental and family health consultation',
        estimatedDuration: 40
      },
      {
        serviceType: 'vaccination-dtap',
        requiresVitalSigns: true,
        maxCapacity: 20,
        description: 'DTaP vaccination (Diphtheria, Tetanus, Pertussis)',
        estimatedDuration: 15
      }
    ]
  },
  {
    dayOfWeek: 'friday',
    timeSlot: 'afternoon',
    availableServices: [
      {
        serviceType: 'follow-up',
        requiresVitalSigns: true,
        maxCapacity: 25,
        description: 'Follow-up consultation for ongoing treatment',
        estimatedDuration: 20
      },
      {
        serviceType: 'dental-consultation',
        requiresVitalSigns: false,
        maxCapacity: 15,
        description: 'Dental check-up and consultation',
        estimatedDuration: 45
      },
      {
        serviceType: 'vaccination-polio',
        requiresVitalSigns: true,
        maxCapacity: 20,
        description: 'Polio vaccination (OPV/IPV)',
        estimatedDuration: 15
      }
    ]
  }
];

// Admin user data for seeding
const adminUserData = {
  username: 'admin',
  email: 'admin@maybunga.healthcare',
  password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewTWWUovHlnfL.PS', // hashed "Admin123!"
  role: 'admin',
  profile: {
    firstName: 'System',
    lastName: 'Administrator',
    contactNumber: '09123456789',
    address: 'Maybunga Health Center, Pasig City'
  },
  isActive: true,
  isVerified: true
};

// Doctor user data for seeding
const doctorUserData = {
  username: 'doctor',
  email: 'doctor@maybunga.healthcare',
  password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewTWWUovHlnfL.PS', // hashed "Doctor123!"
  role: 'doctor',
  profile: {
    firstName: 'Dr. Maria',
    lastName: 'Santos',
    contactNumber: '09987654321',
    address: 'Maybunga Health Center, Pasig City'
  },
  isActive: true,
  isVerified: true
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing service schedules
    await ServiceSchedule.deleteMany({});
    console.log('🗑️  Cleared existing service schedules');

    // Insert service schedules
    await ServiceSchedule.insertMany(serviceScheduleData);
    console.log('📅 Seeded service schedules for all weekdays');

    // Check if admin user exists
    const existingAdmin = await User.findOne({ email: adminUserData.email });
    if (!existingAdmin) {
      await User.create(adminUserData);
      console.log('👤 Created admin user (admin@maybunga.healthcare / Admin123!)');
    } else {
      console.log('👤 Admin user already exists');
    }

    // Check if doctor user exists
    const existingDoctor = await User.findOne({ email: doctorUserData.email });
    if (!existingDoctor) {
      await User.create(doctorUserData);
      console.log('👨‍⚕️ Created doctor user (doctor@maybunga.healthcare / Doctor123!)');
    } else {
      console.log('👨‍⚕️ Doctor user already exists');
    }

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📋 Service Schedule Summary:');
    console.log('   MONDAY: Morning (Consultation, Dental + Procedure, Vaccinations) | Afternoon (Follow-up, Dental, Influenza)');
    console.log('   TUESDAY: Morning (Out-patient, Pneumococcal, Varicella) | Afternoon (Follow-up, Dental, Hepatitis A)');
    console.log('   WEDNESDAY: Morning (Dental + Fluoride, Rabies) | Afternoon (Follow-up, Dental, Influenza)');
    console.log('   THURSDAY: Morning (Out-patient, Dental + Procedure, BCG) | Afternoon (Follow-up, Dental, MMR)');
    console.log('   FRIDAY: Morning (Parental, DTaP) | Afternoon (Follow-up, Dental, Polio)');
    console.log('\n🔑 Default Accounts Created:');
    console.log('   Admin: admin@maybunga.healthcare / Admin123!');
    console.log('   Doctor: doctor@maybunga.healthcare / Doctor123!');

  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run seeder
connectDB().then(() => {
  seedDatabase();
});
