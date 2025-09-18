// Quick date check
const today = new Date();
console.log('JavaScript Date Info:');
console.log('Full date:', today.toString());
console.log('UTC date:', today.toUTCString());
console.log('Local date string:', today.toLocaleDateString());
console.log('Day of week:', today.toLocaleDateString('en-US', { weekday: 'long' }));
console.log('Weekday index (0=Sunday):', today.getDay());
console.log('ISO date:', today.toISOString().split('T')[0]);

// Check MySQL CURDATE() equivalent
console.log('\nMySQL CURDATE() equivalent:', today.toISOString().split('T')[0]);

// Check what our current week range should be
const weekday = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
const mondayOffset = weekday === 0 ? 6 : weekday - 1; // Convert to Monday=0 system

const mondayDate = new Date(today);
mondayDate.setDate(today.getDate() - mondayOffset);
mondayDate.setHours(0, 0, 0, 0);

const sundayDate = new Date(mondayDate);
sundayDate.setDate(mondayDate.getDate() + 6);
sundayDate.setHours(23, 59, 59, 999);

console.log('\nCurrent week range (Monday to Sunday):');
console.log('Monday:', mondayDate.toISOString().split('T')[0]);
console.log('Sunday:', sundayDate.toISOString().split('T')[0]);