#!/usr/bin/env node

console.log('\n🏥 HRSM 2.0 - Multi-User Testing Guide');
console.log('=====================================');

console.log('\n📋 Available Test Accounts:');
console.log('');

console.log('🔹 ADMIN ACCOUNT:');
console.log('   Username: admin');
console.log('   Password: admin123');
console.log('   Dashboard: http://localhost:3000 → Admin Dashboard');
console.log('   Features: Full system administration, user management, reports');

console.log('\n🔹 DOCTOR ACCOUNT:');
console.log('   Username: doctor');
console.log('   Password: doctor123');
console.log('   Dashboard: http://localhost:3000 → Doctor Dashboard');
console.log('   Features: Patient consultations, medical records, appointments');

console.log('\n🔹 PATIENT ACCOUNT:');
console.log('   Username: patient');
console.log('   Password: patient123');
console.log('   Dashboard: http://localhost:3001 → Patient Dashboard');
console.log('   Features: Personal records, appointment booking, prescriptions');

console.log('\n🚀 Quick Setup Instructions:');
console.log('1. Run: start-multi-instance.bat');
console.log('2. Wait for both frontend instances to start');
console.log('3. Open two browser windows:');
console.log('   - http://localhost:3000 (for admin/doctor testing)');
console.log('   - http://localhost:3001 (for patient testing)');

console.log('\n⚠️  Important Notes:');
console.log('• Both instances share the same backend database');
console.log('• Patient dashboard should be tested on port 3001');
console.log('• Admin and Doctor can be tested on port 3000');
console.log('• Clear browser cache if you encounter login issues');

console.log('\n💡 Testing Tips:');
console.log('• Test role-based access by trying different accounts');
console.log('• Verify that each dashboard shows appropriate features');
console.log('• Check that patients can only access their own data');
console.log('• Ensure admins can manage all system components');

console.log('\n📞 Troubleshooting:');
console.log('• If login fails, check that backend is running on port 5000');
console.log('• If port conflict occurs, manually set PORT=3002 for third instance');
console.log('• Check browser console for any JavaScript errors');

console.log('\n✅ Happy Testing!\n');
