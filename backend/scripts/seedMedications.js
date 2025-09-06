const { sequelize } = require('../config/database');

const seedMedications = async () => {
  try {
    console.log('🌱 Starting medication seeding...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Load and initialize the Medication model
    const MedicationModel = require('../models/Prescription.sequelize');
    const Medication = MedicationModel(sequelize);

    // Sync the model to create the table
    await Medication.sync({ force: false });
    console.log('✅ Medications table ready');

    // Check if medications already exist
    const existingCount = await Medication.count();
    if (existingCount > 0) {
      console.log(`ℹ️  Found ${existingCount} existing medications in database`);
      console.log('To see all medications, check the database or run the test script');
      return;
    }

    // Sample medications to seed
    const sampleMedications = [
      {
        name: 'Paracetamol',
        genericName: 'Acetaminophen',
        brandName: 'Biogesic',
        category: 'Analgesics & Antipyretics',
        dosage: '500mg',
        form: 'Tablet',
        strength: '500mg',
        manufacturer: 'Unilab',
        batchNumber: 'PAR2024001',
        unitsInStock: 1000,
        minimumStock: 100,
        unitCost: 2.50,
        sellingPrice: 5.00,
        expiryDate: new Date('2025-12-31'),
        storageConditions: 'Store at room temperature',
        administrationRoute: 'Oral',
        indication: 'Pain relief and fever reduction',
        dosageInstructions: 'Take 1-2 tablets every 4-6 hours as needed',
        isPrescriptionRequired: false,
        status: 'Available',
        isActive: true
      },
      {
        name: 'Amoxicillin',
        genericName: 'Amoxicillin',
        brandName: 'Amoxil',
        category: 'Antibiotics',
        dosage: '500mg',
        form: 'Capsule',
        strength: '500mg',
        manufacturer: 'GSK',
        batchNumber: 'AMX2024001',
        unitsInStock: 500,
        minimumStock: 50,
        unitCost: 15.00,
        sellingPrice: 25.00,
        expiryDate: new Date('2025-06-30'),
        storageConditions: 'Store in cool, dry place',
        administrationRoute: 'Oral',
        indication: 'Bacterial infections',
        dosageInstructions: 'Take 1 capsule 3 times daily for 7 days',
        isPrescriptionRequired: true,
        status: 'Available',
        isActive: true
      },
      {
        name: 'Ibuprofen',
        genericName: 'Ibuprofen',
        brandName: 'Advil',
        category: 'Anti-inflammatory & Steroids',
        dosage: '400mg',
        form: 'Tablet',
        strength: '400mg',
        manufacturer: 'Pfizer',
        batchNumber: 'IBU2024001',
        unitsInStock: 750,
        minimumStock: 75,
        unitCost: 3.00,
        sellingPrice: 6.00,
        expiryDate: new Date('2026-01-15'),
        storageConditions: 'Store at room temperature',
        administrationRoute: 'Oral',
        indication: 'Pain, inflammation, and fever',
        dosageInstructions: 'Take 1 tablet every 6-8 hours with food',
        isPrescriptionRequired: false,
        status: 'Available',
        isActive: true
      },
      {
        name: 'Cetirizine',
        genericName: 'Cetirizine HCl',
        brandName: 'Zyrtec',
        category: 'Antihistamines & Allergy',
        dosage: '10mg',
        form: 'Tablet',
        strength: '10mg',
        manufacturer: 'Johnson & Johnson',
        batchNumber: 'CET2024001',
        unitsInStock: 300,
        minimumStock: 30,
        unitCost: 8.00,
        sellingPrice: 15.00,
        expiryDate: new Date('2025-09-30'),
        storageConditions: 'Store at room temperature',
        administrationRoute: 'Oral',
        indication: 'Allergic rhinitis and urticaria',
        dosageInstructions: 'Take 1 tablet once daily',
        isPrescriptionRequired: false,
        status: 'Available',
        isActive: true
      },
      {
        name: 'Omeprazole',
        genericName: 'Omeprazole',
        brandName: 'Losec',
        category: 'Gastrointestinal Medications',
        dosage: '20mg',
        form: 'Capsule',
        strength: '20mg',
        manufacturer: 'AstraZeneca',
        batchNumber: 'OME2024001',
        unitsInStock: 200,
        minimumStock: 25,
        unitCost: 12.00,
        sellingPrice: 20.00,
        expiryDate: new Date('2025-11-30'),
        storageConditions: 'Store in cool, dry place',
        administrationRoute: 'Oral',
        indication: 'Gastric acid reduction',
        dosageInstructions: 'Take 1 capsule daily before breakfast',
        isPrescriptionRequired: true,
        status: 'Available',
        isActive: true
      }
    ];

    // Insert medications
    const createdMedications = await Medication.bulkCreate(sampleMedications);
    console.log(`✅ Successfully seeded ${createdMedications.length} medications`);

    // Display seeded medications
    console.log('\n📋 Seeded medications:');
    createdMedications.forEach(med => {
      console.log(`   - ${med.name} (${med.brandName}): ${med.unitsInStock} units`);
    });

    console.log('\n🚀 Medication seeding completed successfully!');
    console.log('You can now test the inventory deduction functionality.');

  } catch (error) {
    console.error('❌ Error during medication seeding:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
};

seedMedications();
