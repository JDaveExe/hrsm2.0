/**
 * Seed Default Accounts Script
 * Creates initial admin, doctor, and management accounts in the database
 * Run this once after setting up a new database
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const User = require('../models/User');

async function seedDefaultAccounts() {
    console.log('🌱 Starting default accounts seeding...\n');
    
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('✅ Database connection established\n');

        const accountsToCreate = [];

        // Admin Account
        const adminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
        const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'AdminSecure123!';
        const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@hrsm.local';

        const existingAdmin = await User.findOne({ 
            where: { username: adminUsername } 
        });

        if (!existingAdmin) {
            accountsToCreate.push({
                username: adminUsername,
                email: adminEmail,
                password: await bcrypt.hash(adminPassword, 10),
                role: 'admin',
                firstName: 'System',
                lastName: 'Administrator',
                position: 'System Administrator',
                isActive: true,
                contactNumber: '09000000000'
            });
            console.log(`📝 Admin account will be created: ${adminUsername}`);
        } else {
            console.log(`⏭️  Admin account already exists: ${adminUsername}`);
        }

        // Doctor Account
        const doctorUsername = process.env.DEFAULT_DOCTOR_USERNAME || 'doctor';
        const doctorPassword = process.env.DEFAULT_DOCTOR_PASSWORD || 'DoctorSecure123!';
        const doctorEmail = process.env.DEFAULT_DOCTOR_EMAIL || 'doctor@hrsm.local';

        const existingDoctor = await User.findOne({ 
            where: { username: doctorUsername } 
        });

        if (!existingDoctor) {
            accountsToCreate.push({
                username: doctorUsername,
                email: doctorEmail,
                password: await bcrypt.hash(doctorPassword, 10),
                role: 'doctor',
                firstName: 'Dr. System',
                lastName: 'Doctor',
                position: 'General Practitioner',
                isActive: true,
                contactNumber: '09000000001'
            });
            console.log(`📝 Doctor account will be created: ${doctorUsername}`);
        } else {
            console.log(`⏭️  Doctor account already exists: ${doctorUsername}`);
        }

        // Management Account
        const managementUsername = process.env.DEFAULT_MANAGEMENT_USERNAME || 'management';
        const managementPassword = process.env.DEFAULT_MANAGEMENT_PASSWORD || 'ManagementSecure123!';
        const managementEmail = process.env.DEFAULT_MANAGEMENT_EMAIL || 'management@hrsm.local';

        const existingManagement = await User.findOne({ 
            where: { username: managementUsername } 
        });

        if (!existingManagement) {
            accountsToCreate.push({
                username: managementUsername,
                email: managementEmail,
                password: await bcrypt.hash(managementPassword, 10),
                role: 'management',
                firstName: 'Management',
                lastName: 'Dashboard',
                position: 'Health Management',
                isActive: true,
                contactNumber: '09000000002'
            });
            console.log(`📝 Management account will be created: ${managementUsername}`);
        } else {
            console.log(`⏭️  Management account already exists: ${managementUsername}`);
        }

        // Create accounts
        if (accountsToCreate.length > 0) {
            console.log(`\n🔨 Creating ${accountsToCreate.length} account(s)...\n`);
            
            for (const account of accountsToCreate) {
                await User.create(account);
                console.log(`✅ Created: ${account.username} (${account.role})`);
            }

            console.log('\n' + '='.repeat(70));
            console.log('✅ DEFAULT ACCOUNTS CREATED SUCCESSFULLY!');
            console.log('='.repeat(70));
            console.log('\n📋 Account Credentials:\n');

            if (accountsToCreate.find(a => a.username === adminUsername)) {
                console.log(`👤 Admin Account:`);
                console.log(`   Username: ${adminUsername}`);
                console.log(`   Password: ${adminPassword}`);
                console.log(`   Email: ${adminEmail}\n`);
            }

            if (accountsToCreate.find(a => a.username === doctorUsername)) {
                console.log(`👤 Doctor Account:`);
                console.log(`   Username: ${doctorUsername}`);
                console.log(`   Password: ${doctorPassword}`);
                console.log(`   Email: ${doctorEmail}\n`);
            }

            if (accountsToCreate.find(a => a.username === managementUsername)) {
                console.log(`👤 Management Account:`);
                console.log(`   Username: ${managementUsername}`);
                console.log(`   Password: ${managementPassword}`);
                console.log(`   Email: ${managementEmail}\n`);
            }

            console.log('⚠️  IMPORTANT SECURITY NOTICE:');
            console.log('   1. Change these passwords immediately after first login!');
            console.log('   2. Keep these credentials secure and confidential.');
            console.log('   3. Do not share these credentials in public repositories.');
            console.log('   4. For production, use strong unique passwords.\n');

        } else {
            console.log('\n✅ All default accounts already exist. No action needed.\n');
        }

    } catch (error) {
        console.error('\n❌ Error seeding default accounts:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
        console.log('✅ Database connection closed\n');
    }
}

// Run the seeding
seedDefaultAccounts()
    .then(() => {
        console.log('🎉 Seeding completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Seeding failed:', error);
        process.exit(1);
    });
