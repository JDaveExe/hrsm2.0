const { sequelize } = require('./backend/config/database');

async function migrateEmergencyAppointmentFields() {
  try {
    console.log('🚨 ═══════════════════════════════════════════════════════');
    console.log('   EMERGENCY APPOINTMENT FIELDS MIGRATION');
    console.log('   ═══════════════════════════════════════════════════════\n');

    console.log('🔌 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected to database successfully\n');

    console.log('📊 Current appointments table structure:');
    const [currentStructure] = await sequelize.query('DESCRIBE appointments');
    console.table(currentStructure.map(col => ({
      Field: col.Field,
      Type: col.Type,
      Null: col.Null,
      Key: col.Key,
      Default: col.Default
    })));

    // Check if fields already exist
    const isEmergencyExists = currentStructure.some(col => col.Field === 'isEmergency');
    const emergencyReasonExists = currentStructure.some(col => col.Field === 'emergencyReason');
    const emergencyReasonCategoryExists = currentStructure.some(col => col.Field === 'emergencyReasonCategory');

    if (isEmergencyExists && emergencyReasonExists && emergencyReasonCategoryExists) {
      console.log('\n✅ Emergency fields already exist! No migration needed.');
      await sequelize.close();
      return;
    }

    console.log('\n🔄 Starting migration...');
    console.log('🔒 Starting transaction for safe migration\n');

    await sequelize.query('START TRANSACTION');

    try {
      // Add isEmergency field
      if (!isEmergencyExists) {
        console.log('➕ Adding isEmergency field...');
        await sequelize.query(`
          ALTER TABLE appointments 
          ADD COLUMN isEmergency TINYINT(1) NOT NULL DEFAULT 0 
          COMMENT 'Flag indicating if this is an emergency appointment'
          AFTER status
        `);
        console.log('   ✅ isEmergency field added');
      } else {
        console.log('   ⏭️  isEmergency field already exists');
      }

      // Add emergencyReason field
      if (!emergencyReasonExists) {
        console.log('➕ Adding emergencyReason field...');
        await sequelize.query(`
          ALTER TABLE appointments 
          ADD COLUMN emergencyReason TEXT NULL 
          COMMENT 'Detailed reason for emergency appointment'
          AFTER isEmergency
        `);
        console.log('   ✅ emergencyReason field added');
      } else {
        console.log('   ⏭️  emergencyReason field already exists');
      }

      // Add emergencyReasonCategory field
      if (!emergencyReasonCategoryExists) {
        console.log('➕ Adding emergencyReasonCategory field...');
        await sequelize.query(`
          ALTER TABLE appointments 
          ADD COLUMN emergencyReasonCategory ENUM(
            'Severe Pain',
            'High Fever (>39°C)',
            'Injury/Accident',
            'Breathing Difficulty',
            'Severe Allergic Reaction',
            'Other Critical'
          ) NULL 
          COMMENT 'Category of emergency reason'
          AFTER emergencyReason
        `);
        console.log('   ✅ emergencyReasonCategory field added');
      } else {
        console.log('   ⏭️  emergencyReasonCategory field already exists');
      }

      // Create index for efficient emergency queries
      console.log('\n🔍 Creating index for emergency appointments...');
      try {
        await sequelize.query(`
          CREATE INDEX idx_appointments_emergency 
          ON appointments(isEmergency, appointmentDate, appointmentTime)
        `);
        console.log('   ✅ Index created successfully');
      } catch (indexError) {
        if (indexError.message.includes('Duplicate key name')) {
          console.log('   ⏭️  Index already exists');
        } else {
          throw indexError;
        }
      }

      // Commit transaction
      console.log('\n💾 Committing changes...');
      await sequelize.query('COMMIT');
      console.log('   ✅ Changes committed successfully');

      // Show updated structure
      console.log('\n📊 Updated appointments table structure:');
      const [newStructure] = await sequelize.query('DESCRIBE appointments');
      
      // Show only the new fields
      const newFields = newStructure.filter(col => 
        ['isEmergency', 'emergencyReason', 'emergencyReasonCategory'].includes(col.Field)
      );
      
      console.table(newFields.map(col => ({
        Field: col.Field,
        Type: col.Type,
        Null: col.Null,
        Default: col.Default,
        Extra: col.Extra
      })));

      // Show statistics
      console.log('\n📊 Appointment Statistics:');
      const [stats] = await sequelize.query(`
        SELECT 
          COUNT(*) as total_appointments,
          SUM(CASE WHEN isEmergency = 1 THEN 1 ELSE 0 END) as emergency_count,
          SUM(CASE WHEN isEmergency = 0 THEN 1 ELSE 0 END) as regular_count
        FROM appointments
      `);
      console.table(stats);

      console.log('\n✅ ═══════════════════════════════════════════════════════');
      console.log('   MIGRATION COMPLETED SUCCESSFULLY! 🎉');
      console.log('   ═══════════════════════════════════════════════════════');
      console.log('\n📝 Summary:');
      console.log('   • isEmergency field: ✅ Added (BOOLEAN, default FALSE)');
      console.log('   • emergencyReason field: ✅ Added (TEXT, nullable)');
      console.log('   • emergencyReasonCategory field: ✅ Added (ENUM, 6 options)');
      console.log('   • Performance index: ✅ Created');
      console.log('\n🚀 Emergency Appointment feature is now ready to use!\n');

    } catch (error) {
      console.error('\n❌ Migration failed! Rolling back...');
      await sequelize.query('ROLLBACK');
      throw error;
    }

    await sequelize.close();
    console.log('✅ Database connection closed\n');

  } catch (error) {
    console.error('\n❌ Error during migration:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

console.log('\n');
migrateEmergencyAppointmentFields();
