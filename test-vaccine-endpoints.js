/**
 * Test script for new vaccine analytics and immunization history endpoints
 * Tests both API endpoints with comprehensive validation
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000';
const TEST_CREDENTIALS = {
  login: 'admin',
  password: 'admin123'
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

const log = (color, message) => console.log(`${colors[color]}${message}${colors.reset}`);

class VaccineEndpointTester {
  constructor() {
    this.authToken = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  // Authentication
  async authenticate() {
    try {
      log('blue', '\n🔐 Authenticating with backend...');
      
      const response = await axios.post(`${BASE_URL}/api/auth/login`, TEST_CREDENTIALS);
      
      if (response.data.token) {
        this.authToken = response.data.token;
        log('green', `✅ Authentication successful`);
        log('cyan', `   Token: ${this.authToken.substring(0, 20)}...`);
        return true;
      } else {
        log('red', '❌ Authentication failed - no token received');
        log('red', `   Response: ${JSON.stringify(response.data, null, 2)}`);
        return false;
      }
    } catch (error) {
      log('red', `❌ Authentication error: ${error.response?.data?.message || error.message}`);
      if (error.response?.data) {
        log('red', `   Response data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      return false;
    }
  }

  // Helper method for authenticated requests
  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json'
    };
  }

  // Test helper
  async runTest(testName, testFunction) {
    try {
      log('yellow', `\n📋 Running test: ${testName}`);
      this.testResults.total++;
      
      await testFunction();
      
      this.testResults.passed++;
      log('green', `✅ ${testName} - PASSED`);
    } catch (error) {
      this.testResults.failed++;
      log('red', `❌ ${testName} - FAILED`);
      log('red', `   Error: ${error.message}`);
      if (error.response?.data) {
        log('red', `   Response: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }
  }

  // Vaccine Analytics Tests
  async testVaccineUsageAnalytics() {
    const response = await axios.get(`${BASE_URL}/api/vaccine-analytics/usage`, {
      headers: this.getAuthHeaders()
    });

    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    const data = response.data;
    
    // Validate response structure
    if (!data.success) {
      throw new Error('Response success field is false');
    }

    if (!data.summary || !data.topVaccines || !data.trends) {
      throw new Error('Missing required response fields');
    }

    // Validate summary data
    if (typeof data.summary.totalVaccinesAdministered !== 'number') {
      throw new Error('Invalid totalVaccinesAdministered type');
    }

    if (!Array.isArray(data.topVaccines) || data.topVaccines.length === 0) {
      throw new Error('topVaccines should be a non-empty array');
    }

    if (!Array.isArray(data.vaccines) || data.vaccines.length === 0) {
      throw new Error('vaccines should be a non-empty array');
    }

    // Validate vaccine data structure
    const firstVaccine = data.vaccines[0];
    const requiredVaccineFields = ['id', 'name', 'category', 'totalAdministered', 'thisMonth', 'ageGroups'];
    
    for (const field of requiredVaccineFields) {
      if (!(field in firstVaccine)) {
        throw new Error(`Missing required vaccine field: ${field}`);
      }
    }

    // Validate trends data
    if (!data.trends.daily || !data.trends.weekly || !data.trends.monthly) {
      throw new Error('Missing trends data (daily, weekly, monthly)');
    }

    log('cyan', `   📊 Total vaccines administered: ${data.summary.totalVaccinesAdministered}`);
    log('cyan', `   📈 Vaccines this month: ${data.summary.totalThisMonth}`);
    log('cyan', `   🏆 Most used vaccine: ${data.summary.mostUsedVaccine.name}`);
    log('cyan', `   📋 Active vaccine types: ${data.summary.activeVaccineTypes}`);
    log('cyan', `   📅 Daily trends: ${data.trends.daily.length} days`);
    log('cyan', `   📊 Weekly trends: ${data.trends.weekly.length} weeks`);
    log('cyan', `   📈 Monthly trends: ${data.trends.monthly.length} months`);
  }

  async testVaccineTrends() {
    const periods = ['daily', 'weekly', 'monthly'];
    
    for (const period of periods) {
      const response = await axios.get(`${BASE_URL}/api/vaccine-analytics/trends/${period}`, {
        headers: this.getAuthHeaders()
      });

      if (response.status !== 200) {
        throw new Error(`Expected status 200 for ${period} trends, got ${response.status}`);
      }

      const data = response.data;
      
      if (!data.success || !data.trends || !Array.isArray(data.trends)) {
        throw new Error(`Invalid ${period} trends response structure`);
      }

      if (data.period !== period) {
        throw new Error(`Expected period ${period}, got ${data.period}`);
      }

      log('cyan', `   📊 ${period} trends: ${data.trends.length} entries`);
    }
  }

  async testVaccinationCoverage() {
    const response = await axios.get(`${BASE_URL}/api/vaccine-analytics/coverage`, {
      headers: this.getAuthHeaders()
    });

    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    const data = response.data;
    
    if (!data.success || !data.coverage) {
      throw new Error('Invalid coverage response structure');
    }

    // Validate coverage data structure
    const coverage = data.coverage;
    if (!coverage.byAgeGroup || !coverage.byVaccineType || !coverage.overallStatistics) {
      throw new Error('Missing coverage data sections');
    }

    // Validate age groups
    const ageGroups = ['newborn', 'infant', 'child', 'adult', 'elderly'];
    for (const ageGroup of ageGroups) {
      if (!coverage.byAgeGroup[ageGroup]) {
        throw new Error(`Missing age group data: ${ageGroup}`);
      }
      
      const groupData = coverage.byAgeGroup[ageGroup];
      if (typeof groupData.coverage !== 'number' || groupData.coverage < 0 || groupData.coverage > 100) {
        throw new Error(`Invalid coverage percentage for ${ageGroup}`);
      }
    }

    log('cyan', `   🎯 Overall coverage: ${coverage.overallStatistics.overallCoverage}%`);
    log('cyan', `   👥 Total eligible population: ${coverage.overallStatistics.totalEligiblePopulation}`);
    log('cyan', `   💉 Total vaccinated: ${coverage.overallStatistics.totalVaccinated}`);
    log('cyan', `   🏥 Herd immunity threshold: ${coverage.overallStatistics.herdImmunityThreshold}%`);
  }

  // Immunization History Tests
  async testPatientImmunizationHistory() {
    const patientIds = [1, 2, 3]; // Test with available patient IDs
    
    for (const patientId of patientIds) {
      const response = await axios.get(`${BASE_URL}/api/immunization-history/patient/${patientId}`, {
        headers: this.getAuthHeaders()
      });

      if (response.status !== 200) {
        throw new Error(`Expected status 200 for patient ${patientId}, got ${response.status}`);
      }

      const data = response.data;
      
      if (!data.success || !data.patient) {
        throw new Error(`Invalid patient immunization response for patient ${patientId}`);
      }

      const patient = data.patient;
      
      // Validate patient data structure
      const requiredSections = ['demographics', 'contactInfo', 'medicalInfo', 'immunizationSummary', 'vaccinationHistory'];
      for (const section of requiredSections) {
        if (!patient[section]) {
          throw new Error(`Missing patient section: ${section}`);
        }
      }

      // Validate vaccination history
      if (!Array.isArray(patient.vaccinationHistory)) {
        throw new Error('vaccinationHistory should be an array');
      }

      if (patient.vaccinationHistory.length > 0) {
        const firstVaccine = patient.vaccinationHistory[0];
        const requiredVaccineFields = ['vaccineName', 'dateAdministered', 'doseNumber', 'administeredBy'];
        
        for (const field of requiredVaccineFields) {
          if (!(field in firstVaccine)) {
            throw new Error(`Missing vaccination history field: ${field}`);
          }
        }
      }

      log('cyan', `   👤 Patient ${patientId}: ${patient.demographics.name}`);
      log('cyan', `   📊 Completion rate: ${patient.immunizationSummary.completionRate}%`);
      log('cyan', `   💉 Total vaccines: ${patient.immunizationSummary.totalVaccinesReceived}`);
      log('cyan', `   📅 Status: ${patient.immunizationSummary.status}`);
      log('cyan', `   ⏰ Upcoming: ${patient.upcomingVaccinations.length} vaccines`);
      log('cyan', `   ⚠️  Overdue: ${patient.missedVaccinations.length} vaccines`);
    }
  }

  async testPatientsSummary() {
    const response = await axios.get(`${BASE_URL}/api/immunization-history/patients`, {
      headers: this.getAuthHeaders()
    });

    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    const data = response.data;
    
    if (!data.success || !data.patients || !data.stats) {
      throw new Error('Invalid patients summary response structure');
    }

    if (!Array.isArray(data.patients) || data.patients.length === 0) {
      throw new Error('patients should be a non-empty array');
    }

    // Validate stats
    const stats = data.stats;
    const requiredStats = ['totalPatients', 'upToDate', 'overdue', 'averageCompletionRate'];
    for (const stat of requiredStats) {
      if (!(stat in stats)) {
        throw new Error(`Missing stat: ${stat}`);
      }
    }

    log('cyan', `   👥 Total patients: ${stats.totalPatients}`);
    log('cyan', `   ✅ Up to date: ${stats.upToDate}`);
    log('cyan', `   ⚠️  Overdue: ${stats.overdue}`);
    log('cyan', `   📊 Average completion: ${stats.averageCompletionRate}%`);
  }

  async testOverdueVaccinations() {
    const response = await axios.get(`${BASE_URL}/api/immunization-history/overdue`, {
      headers: this.getAuthHeaders()
    });

    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    const data = response.data;
    
    if (!data.success || !data.summary || !data.overduePatients) {
      throw new Error('Invalid overdue vaccinations response structure');
    }

    if (!Array.isArray(data.overduePatients)) {
      throw new Error('overduePatients should be an array');
    }

    log('cyan', `   ⚠️  Total patients overdue: ${data.summary.totalPatientsOverdue}`);
    log('cyan', `   💉 Total overdue vaccinations: ${data.summary.totalOverdueVaccinations}`);
    log('cyan', `   🚨 High urgency patients: ${data.summary.highUrgency}`);
    if (data.summary.averageDaysOverdue > 0) {
      log('cyan', `   📅 Average days overdue: ${data.summary.averageDaysOverdue}`);
    }
  }

  async testVaccinationSchedule() {
    const patientId = 1; // Test with first patient
    
    const response = await axios.get(`${BASE_URL}/api/immunization-history/schedule/${patientId}`, {
      headers: this.getAuthHeaders()
    });

    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    const data = response.data;
    
    if (!data.success || !data.patient || !data.schedule) {
      throw new Error('Invalid vaccination schedule response structure');
    }

    if (!Array.isArray(data.schedule)) {
      throw new Error('schedule should be an array');
    }

    const completedCount = data.schedule.filter(item => item.status === 'Completed').length;
    const upcomingCount = data.schedule.filter(item => item.status === 'Due Soon' || item.status === 'Scheduled').length;
    const overdueCount = data.schedule.filter(item => item.status === 'Overdue').length;

    log('cyan', `   👤 Patient: ${data.patient.name}`);
    log('cyan', `   📋 Total schedule items: ${data.schedule.length}`);
    log('cyan', `   ✅ Completed: ${completedCount}`);
    log('cyan', `   ⏰ Upcoming: ${upcomingCount}`);
    log('cyan', `   ⚠️  Overdue: ${overdueCount}`);
  }

  // Test invalid endpoints
  async testInvalidEndpoints() {
    // Test invalid patient ID
    try {
      await axios.get(`${BASE_URL}/api/immunization-history/patient/999`, {
        headers: this.getAuthHeaders()
      });
      throw new Error('Expected 404 for invalid patient ID');
    } catch (error) {
      if (error.response?.status !== 404) {
        throw new Error(`Expected 404, got ${error.response?.status || 'no response'}`);
      }
    }

    // Test invalid trend period
    try {
      await axios.get(`${BASE_URL}/api/vaccine-analytics/trends/invalid`, {
        headers: this.getAuthHeaders()
      });
      throw new Error('Expected 400 for invalid trend period');
    } catch (error) {
      if (error.response?.status !== 400) {
        throw new Error(`Expected 400, got ${error.response?.status || 'no response'}`);
      }
    }

    log('cyan', `   ✅ Invalid endpoints properly return error codes`);
  }

  // Main test runner
  async runAllTests() {
    log('bright', '\n🧪 STARTING VACCINE ENDPOINTS COMPREHENSIVE TEST');
    log('bright', '='.repeat(60));

    // Authenticate first
    const authenticated = await this.authenticate();
    if (!authenticated) {
      log('red', '\n❌ Cannot proceed without authentication');
      return;
    }

    // Vaccine Analytics Tests
    log('magenta', '\n📊 VACCINE ANALYTICS TESTS');
    log('magenta', '-'.repeat(30));

    await this.runTest('Vaccine Usage Analytics', () => this.testVaccineUsageAnalytics());
    await this.runTest('Vaccine Trends (All Periods)', () => this.testVaccineTrends());
    await this.runTest('Vaccination Coverage Statistics', () => this.testVaccinationCoverage());

    // Immunization History Tests
    log('magenta', '\n📋 IMMUNIZATION HISTORY TESTS');
    log('magenta', '-'.repeat(35));

    await this.runTest('Patient Immunization History', () => this.testPatientImmunizationHistory());
    await this.runTest('Patients Summary', () => this.testPatientsSummary());
    await this.runTest('Overdue Vaccinations', () => this.testOverdueVaccinations());
    await this.runTest('Vaccination Schedule', () => this.testVaccinationSchedule());

    // Error Handling Tests
    log('magenta', '\n🚫 ERROR HANDLING TESTS');
    log('magenta', '-'.repeat(25));

    await this.runTest('Invalid Endpoints', () => this.testInvalidEndpoints());

    // Final Results
    log('bright', '\n📊 TEST RESULTS SUMMARY');
    log('bright', '='.repeat(25));
    
    if (this.testResults.failed === 0) {
      log('green', `🎉 ALL TESTS PASSED! (${this.testResults.passed}/${this.testResults.total})`);
    } else {
      log('yellow', `⚠️  ${this.testResults.passed} passed, ${this.testResults.failed} failed (${this.testResults.total} total)`);
    }

    log('cyan', '\n📋 Available Endpoints:');
    log('cyan', '  GET /api/vaccine-analytics/usage');
    log('cyan', '  GET /api/vaccine-analytics/trends/:period');
    log('cyan', '  GET /api/vaccine-analytics/coverage');
    log('cyan', '  GET /api/immunization-history/patient/:patientId');
    log('cyan', '  GET /api/immunization-history/patients');
    log('cyan', '  GET /api/immunization-history/overdue');
    log('cyan', '  GET /api/immunization-history/schedule/:patientId');

    if (this.testResults.failed === 0) {
      log('green', '\n✅ Both vaccine analytics and immunization history endpoints are working correctly!');
    }
  }
}

// Run the tests
const tester = new VaccineEndpointTester();
tester.runAllTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});

module.exports = VaccineEndpointTester;