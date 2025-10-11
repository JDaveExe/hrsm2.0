// check-backend-routes.js
// Simple script to check which backend routes have audit logging integrated

const fs = require('fs');
const path = require('path');

function checkRouteFiles() {
  console.log('🔍 Checking Backend Routes for Audit Integration...\n');

  const routeFiles = [
    'backend/routes/admin.js',
    'backend/routes/auth.js', 
    'backend/routes/patients.js',
    'backend/routes/checkups.js',
    'backend/routes/vaccinations.js',
    'backend/routes/audit.js'
  ];

  routeFiles.forEach(filePath => {
    console.log(`📁 Checking ${filePath}...`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`   ❌ File does not exist`);
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for audit imports
    const hasAuditImport = content.includes('auditLogger') || content.includes('AuditLogger');
    console.log(`   ${hasAuditImport ? '✅' : '❌'} Has audit import: ${hasAuditImport}`);
    
    // Check for specific audit function calls
    const auditFunctions = [
      'logPatientRemoval',
      'logPatientCheckIn', 
      'logVitalSignsCheck',
      'logPatientTransfer',
      'logVaccination',
      'logUserCreation',
      'logCheckupStart',
      'logMedicationManagement',
      'logVaccineManagement',
      'logStockManagement',
      'logReportCreation'
    ];
    
    let foundFunctions = [];
    auditFunctions.forEach(func => {
      if (content.includes(func)) {
        foundFunctions.push(func);
      }
    });
    
    if (foundFunctions.length > 0) {
      console.log(`   ✅ Found audit calls: ${foundFunctions.join(', ')}`);
    } else {
      console.log(`   ❌ No audit function calls found`);
    }
    
    // Check for specific routes that should have audit
    const routePatterns = [
      { pattern: '/remove-patient', audit: 'logPatientRemoval' },
      { pattern: '/check-in', audit: 'logPatientCheckIn' },
      { pattern: '/vital-signs', audit: 'logVitalSignsCheck' },
      { pattern: '/transfer', audit: 'logPatientTransfer' },
      { pattern: '/vaccinate', audit: 'logVaccination' },
      { pattern: '/register', audit: 'logUserCreation' },
      { pattern: '/start', audit: 'logCheckupStart' }
    ];
    
    routePatterns.forEach(route => {
      const hasRoute = content.includes(route.pattern);
      const hasAudit = content.includes(route.audit);
      if (hasRoute) {
        console.log(`   📍 Route ${route.pattern}: ${hasAudit ? '✅' : '❌'} audit integrated`);
      }
    });
    
    console.log('');
  });
}

function createMissingRouteIntegration() {
  console.log('🔧 Creating Route Integration Plan...\n');
  
  const integrationPlan = {
    'backend/routes/admin.js': [
      { route: 'POST /remove-patient', audit: 'logPatientRemoval' },
      { route: 'POST /check-in-patient', audit: 'logPatientCheckIn' },
      { route: 'POST /vital-signs', audit: 'logVitalSignsCheck' },
      { route: 'POST /transfer-patient', audit: 'logPatientTransfer' }
    ],
    'backend/routes/auth.js': [
      { route: 'POST /register', audit: 'logUserCreation' }
    ],
    'backend/routes/vaccinations.js': [
      { route: 'POST /administer', audit: 'logVaccination' }
    ],
    'backend/routes/checkups.js': [
      { route: 'POST /start', audit: 'logCheckupStart' },
      { route: 'POST /finish', audit: 'logCheckupFinish' }
    ]
  };
  
  Object.entries(integrationPlan).forEach(([file, routes]) => {
    console.log(`📁 ${file}:`);
    routes.forEach(route => {
      console.log(`   • ${route.route} → ${route.audit}()`);
    });
    console.log('');
  });
}

if (require.main === module) {
  checkRouteFiles();
  createMissingRouteIntegration();
}