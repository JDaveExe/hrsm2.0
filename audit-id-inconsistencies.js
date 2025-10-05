// Comprehensive audit for User ID vs Patient ID inconsistencies
const fs = require('fs');
const path = require('path');

async function auditIdInconsistencies() {
    console.log('🔍 COMPREHENSIVE ID INCONSISTENCY AUDIT');
    console.log('======================================\n');
    
    const issues = [];
    
    // 1. Search for user.id usage in patient contexts
    console.log('📁 SCANNING FRONTEND FILES...');
    console.log('-----------------------------');
    
    const searchPatterns = [
        { pattern: /user\.id/g, description: 'user.id usage' },
        { pattern: /localStorage\.getItem\(['"]patientId['"]\)/g, description: 'localStorage patientId access' },
        { pattern: /\/patient\/\$\{user\.id\}/g, description: 'API calls with user.id' },
        { pattern: /patientId.*user\.id/g, description: 'patientId assigned from user.id' },
        { pattern: /notifications\/patient\/\$\{.*\}/g, description: 'notification API calls' }
    ];
    
    function scanDirectory(dir, extensions = ['.js', '.jsx', '.ts', '.tsx']) {
        const files = [];
        
        function scanRecursive(currentDir) {
            const entries = fs.readdirSync(currentDir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(currentDir, entry.name);
                
                if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                    scanRecursive(fullPath);
                } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
                    files.push(fullPath);
                }
            }
        }
        
        scanRecursive(dir);
        return files;
    }
    
    const frontendFiles = scanDirectory('./src');
    const backendFiles = scanDirectory('./backend');
    
    // Scan frontend files
    console.log(`🔍 Scanning ${frontendFiles.length} frontend files...`);
    
    frontendFiles.forEach(filePath => {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const relativePath = path.relative('.', filePath);
            
            searchPatterns.forEach(({ pattern, description }) => {
                const matches = [...content.matchAll(pattern)];
                if (matches.length > 0) {
                    matches.forEach(match => {
                        const lines = content.substring(0, match.index).split('\n');
                        const lineNumber = lines.length;
                        const line = lines[lineNumber - 1].trim();
                        
                        issues.push({
                            type: 'frontend',
                            file: relativePath,
                            line: lineNumber,
                            description,
                            code: line,
                            severity: getSeverity(description, line)
                        });
                    });
                }
            });
        } catch (error) {
            console.warn(`⚠️ Could not read ${filePath}: ${error.message}`);
        }
    });
    
    // Scan backend files
    console.log(`🔍 Scanning ${backendFiles.length} backend files...`);
    
    const backendPatterns = [
        { pattern: /req\.user\.id/g, description: 'req.user.id in patient context' },
        { pattern: /userId.*patient/gi, description: 'userId in patient operations' },
        { pattern: /patient_id.*user/gi, description: 'patient_id from user data' }
    ];
    
    backendFiles.forEach(filePath => {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const relativePath = path.relative('.', filePath);
            
            backendPatterns.forEach(({ pattern, description }) => {
                const matches = [...content.matchAll(pattern)];
                if (matches.length > 0) {
                    matches.forEach(match => {
                        const lines = content.substring(0, match.index).split('\n');
                        const lineNumber = lines.length;
                        const line = lines[lineNumber - 1].trim();
                        
                        issues.push({
                            type: 'backend',
                            file: relativePath,
                            line: lineNumber,
                            description,
                            code: line,
                            severity: getSeverity(description, line)
                        });
                    });
                }
            });
        } catch (error) {
            console.warn(`⚠️ Could not read ${filePath}: ${error.message}`);
        }
    });
    
    // Categorize and report issues
    console.log('\n📊 AUDIT RESULTS:');
    console.log('================');
    
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const highIssues = issues.filter(i => i.severity === 'high');
    const mediumIssues = issues.filter(i => i.severity === 'medium');
    const lowIssues = issues.filter(i => i.severity === 'low');
    
    console.log(`🔴 Critical issues: ${criticalIssues.length}`);
    console.log(`🟠 High priority: ${highIssues.length}`);
    console.log(`🟡 Medium priority: ${mediumIssues.length}`);
    console.log(`🟢 Low priority: ${lowIssues.length}`);
    console.log(`📊 Total issues: ${issues.length}`);
    
    // Report critical issues first
    if (criticalIssues.length > 0) {
        console.log('\n🔴 CRITICAL ISSUES (Fix immediately):');
        console.log('===================================');
        criticalIssues.forEach(issue => {
            console.log(`${issue.file}:${issue.line}`);
            console.log(`   ${issue.description}`);
            console.log(`   Code: ${issue.code}`);
            console.log('');
        });
    }
    
    // Report high priority issues
    if (highIssues.length > 0) {
        console.log('\n🟠 HIGH PRIORITY ISSUES:');
        console.log('=======================');
        highIssues.forEach(issue => {
            console.log(`${issue.file}:${issue.line} - ${issue.description}`);
            console.log(`   Code: ${issue.code}`);
        });
    }
    
    // Generate fix script
    console.log('\n🔧 SUGGESTED FIXES:');
    console.log('==================');
    
    const fixes = generateFixes(issues);
    fixes.forEach(fix => {
        console.log(`📝 ${fix.file}`);
        console.log(`   Issue: ${fix.issue}`);
        console.log(`   Fix: ${fix.solution}`);
        console.log('');
    });
    
    // Save detailed report
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            total: issues.length,
            critical: criticalIssues.length,
            high: highIssues.length,
            medium: mediumIssues.length,
            low: lowIssues.length
        },
        issues,
        fixes
    };
    
    fs.writeFileSync('ID_INCONSISTENCY_AUDIT_REPORT.json', JSON.stringify(report, null, 2));
    console.log('📄 Detailed report saved to: ID_INCONSISTENCY_AUDIT_REPORT.json');
    
    return report;
}

function getSeverity(description, code) {
    // Critical: Direct API calls with wrong ID
    if (description.includes('API calls with user.id') || 
        description.includes('notification API calls')) {
        return 'critical';
    }
    
    // High: Patient operations using user data
    if (description.includes('patient context') || 
        description.includes('patientId assigned from user.id')) {
        return 'high';
    }
    
    // Medium: localStorage usage (needs updating)
    if (description.includes('localStorage')) {
        return 'medium';
    }
    
    // Low: General user.id usage (may be legitimate)
    return 'low';
}

function generateFixes(issues) {
    const fixes = [];
    
    issues.forEach(issue => {
        if (issue.severity === 'critical' && issue.description.includes('API calls')) {
            fixes.push({
                file: issue.file,
                line: issue.line,
                issue: issue.description,
                solution: 'Replace user.id with getPatientIdForAPI(user) from patientIdMapping.js'
            });
        }
        
        if (issue.description.includes('localStorage patientId')) {
            fixes.push({
                file: issue.file,
                line: issue.line,
                issue: issue.description,
                solution: 'Use getPatientIdForAPI() instead of direct localStorage access'
            });
        }
    });
    
    return fixes;
}

auditIdInconsistencies().catch(console.error);