const mysql = require('mysql2/promise');
const axios = require('axios');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(70)}${colors.reset}`),
  step: (msg) => console.log(`\n${colors.bright}${colors.blue}▶ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.yellow}ℹ ${msg}${colors.reset}`),
  data: (label, value) => console.log(`   ${colors.cyan}${label}:${colors.reset} ${value}`)
};

async function diagnoseDateTimeIssue() {
  let connection;
  
  try {
    log.header();
    console.log(`${colors.bright}${colors.cyan}DATETIME & TIMEZONE DIAGNOSTIC${colors.reset}`);
    log.header();
    
    // Connect to database
    log.step('STEP 1: Connect to MySQL Database');
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hrsm2'
    });
    log.success('Connected to database');
    
    // Step 2: Check MySQL timezone settings
    log.step('STEP 2: Check MySQL Timezone Settings');
    const [timezoneInfo] = await connection.execute(`
      SELECT 
        @@global.time_zone as global_timezone,
        @@session.time_zone as session_timezone,
        NOW() as mysql_now,
        CURDATE() as mysql_curdate,
        CURTIME() as mysql_curtime
    `);
    
    log.info('MySQL Timezone Information:');
    log.data('Global Timezone', timezoneInfo[0].global_timezone);
    log.data('Session Timezone', timezoneInfo[0].session_timezone);
    log.data('MySQL NOW()', timezoneInfo[0].mysql_now);
    log.data('MySQL CURDATE()', timezoneInfo[0].mysql_curdate);
    log.data('MySQL CURTIME()', timezoneInfo[0].mysql_curtime);
    
    // Check system/Node.js timezone
    log.step('STEP 3: Check Node.js/System Timezone');
    const nodeNow = new Date();
    log.data('Node.js Date.now()', nodeNow.toISOString());
    log.data('Local Date', nodeNow.toLocaleString());
    log.data('Local Date (en-PH)', nodeNow.toLocaleString('en-PH', { timeZone: 'Asia/Manila' }));
    log.data('UTC Date', nodeNow.toUTCString());
    log.data('Timezone Offset', `${nodeNow.getTimezoneOffset()} minutes`);
    log.data('Day of Week', nodeNow.toLocaleDateString('en-US', { weekday: 'long' }));
    
    // Check recent check-in sessions
    log.step('STEP 4: Check Recent Check-in Sessions');
    const [recentCheckups] = await connection.execute(`
      SELECT 
        id,
        patientId,
        status,
        createdAt,
        updatedAt,
        DATE(updatedAt) as update_date,
        DAYNAME(updatedAt) as day_name,
        TIME(updatedAt) as update_time,
        CONVERT_TZ(updatedAt, '+00:00', '+08:00') as manila_time
      FROM check_in_sessions
      WHERE updatedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY updatedAt DESC
      LIMIT 10
    `);
    
    log.info(`Found ${recentCheckups.length} recent checkups:`);
    recentCheckups.forEach((checkup, index) => {
      console.log(`\n   ${colors.bright}Checkup #${index + 1}:${colors.reset}`);
      log.data('   ID', checkup.id);
      log.data('   Status', checkup.status);
      log.data('   Created At', checkup.createdAt);
      log.data('   Updated At', checkup.updatedAt);
      log.data('   Date (MySQL)', checkup.update_date);
      log.data('   Day Name', checkup.day_name);
      log.data('   Time', checkup.update_time);
      log.data('   Manila Time', checkup.manila_time);
    });
    
    // Check what the dashboard API returns
    log.step('STEP 5: Check Dashboard API Response');
    try {
      const response = await axios.get('http://localhost:5000/api/dashboard/stats');
      log.success('Dashboard API responded');
      
      if (response.data.checkupTrends && response.data.checkupTrends.length > 0) {
        log.info('Checkup Trends from API:');
        response.data.checkupTrends.forEach(trend => {
          log.data(`   ${trend.dayName}`, `${trend.completedCheckups} checkups (Date: ${trend.date})`);
        });
      } else {
        log.info('No checkup trends data in API response');
      }
    } catch (apiError) {
      log.error(`Dashboard API Error: ${apiError.message}`);
    }
    
    // Check current week calculation
    log.step('STEP 6: Check Week Calculation');
    const [weekCalc] = await connection.execute(`
      SELECT 
        CURDATE() as current_date,
        WEEKDAY(CURDATE()) as weekday_number,
        DAYNAME(CURDATE()) as day_name,
        DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) as monday_of_week,
        DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 6 DAY) as sunday_of_week
    `);
    
    log.info('Current Week Calculation:');
    log.data('Current Date', weekCalc[0].current_date);
    log.data('Weekday Number', `${weekCalc[0].weekday_number} (0=Monday, 6=Sunday)`);
    log.data('Day Name', weekCalc[0].day_name);
    log.data('Week Start (Monday)', weekCalc[0].monday_of_week);
    log.data('Week End (Sunday)', weekCalc[0].sunday_of_week);
    
    // Check if today's checkups appear
    log.step('STEP 7: Check Today\'s Checkups');
    const [todayCheckups] = await connection.execute(`
      SELECT 
        COUNT(*) as count,
        MIN(updatedAt) as first_checkup,
        MAX(updatedAt) as last_checkup
      FROM check_in_sessions
      WHERE DATE(updatedAt) = CURDATE()
        AND status = 'completed'
    `);
    
    if (todayCheckups[0].count > 0) {
      log.success(`Found ${todayCheckups[0].count} completed checkups today`);
      log.data('First Checkup', todayCheckups[0].first_checkup);
      log.data('Last Checkup', todayCheckups[0].last_checkup);
    } else {
      log.info('No completed checkups found for today');
    }
    
    // Summary
    log.header();
    console.log(`${colors.bright}${colors.yellow}SUMMARY & RECOMMENDATIONS:${colors.reset}\n`);
    
    const mysqlTimezone = timezoneResults[0].session_timezone;
    const nodeOffset = nodeNow.getTimezoneOffset();
    const expectedOffset = -480; // Philippines is UTC+8 = -480 minutes
    
    if (mysqlTimezone === 'SYSTEM' || mysqlTimezone === '+00:00') {
      console.log(`${colors.red}⚠️  ISSUE FOUND: MySQL is using ${mysqlTimezone} timezone${colors.reset}`);
      console.log(`${colors.yellow}   Philippines should be UTC+8 (Asia/Manila)${colors.reset}`);
      console.log(`${colors.yellow}   This causes a ${Math.abs(8)} hour difference!${colors.reset}`);
      console.log(`\n${colors.green}SOLUTION:${colors.reset}`);
      console.log(`   1. Set MySQL timezone to '+08:00' or 'Asia/Manila'`);
      console.log(`   2. Update my.ini/my.cnf: default-time-zone='+08:00'`);
      console.log(`   3. Or use CONVERT_TZ in queries`);
    } else if (mysqlTimezone === '+08:00' || mysqlTimezone.includes('Asia')) {
      log.success('MySQL timezone appears correct for Philippines');
    }
    
    if (nodeOffset !== expectedOffset) {
      console.log(`\n${colors.yellow}⚠️  Node.js timezone offset: ${nodeOffset} minutes${colors.reset}`);
      console.log(`${colors.yellow}   Expected for Philippines: ${expectedOffset} minutes${colors.reset}`);
    }
    
    log.header();
    
  } catch (error) {
    log.error(`Diagnostic failed: ${error.message}`);
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
      log.info('Database connection closed');
    }
  }
}

diagnoseDateTimeIssue();
