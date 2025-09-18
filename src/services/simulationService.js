// simulationService.js - Service for handling simulation mode functionality

class SimulationService {
  static instance = null;
  
  constructor() {
    if (SimulationService.instance) {
      return SimulationService.instance;
    }
    
    this.simulationStatus = null;
    this.listeners = [];
    
    // Load simulation status from localStorage
    this.loadSimulationStatus();
    
    // Listen for localStorage changes
    window.addEventListener('storage', this.handleStorageChange.bind(this));
    
    SimulationService.instance = this;
  }

  loadSimulationStatus() {
    try {
      const stored = localStorage.getItem('simulationModeStatus');
      if (stored) {
        this.simulationStatus = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading simulation status:', error);
      this.simulationStatus = {
        enabled: false,
        currentSimulatedDate: null,
        activatedBy: null,
        activatedAt: null,
        smsSimulation: false,
        emailSimulation: false,
        dataSimulation: false,
        chartSimulation: false
      };
    }
  }

  handleStorageChange(event) {
    if (event.key === 'simulationModeStatus') {
      this.loadSimulationStatus();
      this.notifyListeners();
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.simulationStatus));
  }

  // Core simulation functions
  isSimulationEnabled() {
    return this.simulationStatus?.enabled || false;
  }

  getCurrentEffectiveDate() {
    if (this.isSimulationEnabled() && this.simulationStatus.currentSimulatedDate) {
      // Calculate current simulated time by adding elapsed real time to the simulated start time
      const simulatedStartTime = new Date(this.simulationStatus.currentSimulatedDate);
      const activatedAt = new Date(this.simulationStatus.activatedAt || Date.now());
      const elapsedTime = Date.now() - activatedAt.getTime();
      return new Date(simulatedStartTime.getTime() + elapsedTime);
    }
    return new Date();
  }

  getCurrentEffectiveDateString() {
    return this.getCurrentEffectiveDate().toISOString();
  }

  // Service mocking functions
  shouldMockSMS() {
    return this.isSimulationEnabled() && this.simulationStatus?.smsSimulation;
  }

  shouldMockEmail() {
    return this.isSimulationEnabled() && this.simulationStatus?.emailSimulation;
  }

  shouldGenerateTestData() {
    return this.isSimulationEnabled() && this.simulationStatus?.dataSimulation;
  }

  shouldSimulateCharts() {
    return this.isSimulationEnabled() && this.simulationStatus?.chartSimulation;
  }

  // Chart simulation data generators
  generateSimulatedPatientData() {
    if (!this.shouldSimulateCharts()) {
      return null;
    }

    const currentDate = this.getCurrentEffectiveDate();
    const months = [];
    const patientCounts = [];
    
    // Generate 12 months of simulated data
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
      
      // Generate realistic patient growth with some randomness
      const baseCount = 800 + (11 - i) * 15; // Growth trend
      const variation = Math.floor(Math.random() * 100) - 50; // Random variation
      patientCounts.push(Math.max(baseCount + variation, 700));
    }

    return {
      labels: months,
      datasets: [{
        label: 'Total Patients (Simulated)',
        data: patientCounts,
        borderColor: '#9BC4E2',
        backgroundColor: 'rgba(155, 196, 226, 0.1)',
        tension: 0.1
      }]
    };
  }

  generateSimulatedAppointmentData() {
    if (!this.shouldSimulateCharts()) {
      return null;
    }

    const currentDate = this.getCurrentEffectiveDate();
    const days = [];
    const appointmentCounts = [];
    
    // Generate 7 days of appointment data
    for (let i = 6; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - i);
      days.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
      
      // Simulate appointment patterns (higher on weekdays)
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const baseCount = isWeekend ? 5 : 25;
      const variation = Math.floor(Math.random() * 10) - 5;
      appointmentCounts.push(Math.max(baseCount + variation, 0));
    }

    return {
      labels: days,
      datasets: [{
        label: 'Daily Appointments (Simulated)',
        data: appointmentCounts,
        backgroundColor: '#9BC4E2'
      }]
    };
  }

  generateSimulatedServiceData() {
    if (!this.shouldSimulateCharts()) {
      return null;
    }

    const services = [
      'General Checkup',
      'Blood Pressure',
      'Diabetes Care',
      'Prenatal Care',
      'Immunization',
      'Family Planning',
      'Mental Health'
    ];

    const data = services.map(() => Math.floor(Math.random() * 100) + 20);

    return {
      labels: services,
      datasets: [{
        data: data,
        backgroundColor: [
          '#9BC4E2', '#7FB5DC', '#E8F3FF', '#B8D4EA',
          '#A6CDE5', '#94C0DF', '#82B3DA', '#70A6D4'
        ]
      }]
    };
  }

  // Time manipulation for testing time-sensitive features
  getTimeForFeature(featureName) {
    if (!this.isSimulationEnabled()) {
      return new Date();
    }

    const effectiveDate = this.getCurrentEffectiveDate();
    
    // Allow different features to have different time offsets for testing
    switch (featureName) {
      case 'appointment_reminders':
        // Test appointment reminders by advancing time
        return new Date(effectiveDate.getTime() + (24 * 60 * 60 * 1000)); // +1 day
      case 'medication_alerts':
        // Test medication alerts
        return new Date(effectiveDate.getTime() + (8 * 60 * 60 * 1000)); // +8 hours
      case 'followup_notifications':
        // Test follow-up notifications
        return new Date(effectiveDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // +7 days
      default:
        return effectiveDate;
    }
  }

  // Debug information
  getSimulationInfo() {
    return {
      enabled: this.isSimulationEnabled(),
      currentSimulatedDate: this.simulationStatus?.currentSimulatedDate,
      effectiveDate: this.getCurrentEffectiveDate(),
      activatedBy: this.simulationStatus?.activatedBy,
      activatedAt: this.simulationStatus?.activatedAt,
      services: {
        sms: this.shouldMockSMS(),
        email: this.shouldMockEmail(),
        data: this.shouldGenerateTestData(),
        charts: this.shouldSimulateCharts()
      }
    };
  }
}

// Export singleton instance
const simulationService = new SimulationService();
export default simulationService;

// Export static methods for convenience
export const {
  isSimulationEnabled,
  getCurrentEffectiveDate,
  getCurrentEffectiveDateString,
  shouldMockSMS,
  shouldMockEmail,
  shouldGenerateTestData,
  shouldSimulateCharts,
  generateSimulatedPatientData,
  generateSimulatedAppointmentData,
  generateSimulatedServiceData,
  getTimeForFeature,
  getSimulationInfo
} = simulationService;
