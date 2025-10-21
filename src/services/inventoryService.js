import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

class InventoryService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/inventory`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token') || window.__authToken;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // VACCINE METHODS

  async getAllVaccines() {
    try {
      const response = await this.api.get('/vaccines');
      return response.data;
    } catch (error) {
      console.error('Error fetching vaccines:', error);
      throw error;
    }
  }

  async getVaccineById(id) {
    try {
      const response = await this.api.get(`/vaccines/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching vaccine:', error);
      throw error;
    }
  }

  async createVaccine(vaccineData) {
    try {
      const response = await this.api.post('/vaccines', vaccineData);
      return response.data;
    } catch (error) {
      console.error('Error creating vaccine:', error);
      throw error;
    }
  }

  async updateVaccine(id, vaccineData) {
    try {
      const response = await this.api.put(`/vaccines/${id}`, vaccineData);
      return response.data;
    } catch (error) {
      console.error('Error updating vaccine:', error);
      throw error;
    }
  }

  async deleteVaccine(id) {
    try {
      const response = await this.api.delete(`/vaccines/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting vaccine:', error);
      throw error;
    }
  }

  // MEDICATION METHODS

  async getAllMedications() {
    try {
      const response = await this.api.get('/medications');
      return response.data;
    } catch (error) {
      console.error('Error fetching medications:', error);
      throw error;
    }
  }

  async getMedicationById(id) {
    try {
      const response = await this.api.get(`/medications/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching medication:', error);
      throw error;
    }
  }

  async createMedication(medicationData) {
    try {
      const response = await this.api.post('/medications', medicationData);
      return response.data;
    } catch (error) {
      console.error('Error creating medication:', error);
      throw error;
    }
  }

  async updateMedication(id, medicationData) {
    try {
      const response = await this.api.put(`/medications/${id}`, medicationData);
      return response.data;
    } catch (error) {
      console.error('Error updating medication:', error);
      throw error;
    }
  }

  async deleteMedication(id) {
    try {
      const response = await this.api.delete(`/medications/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting medication:', error);
      throw error;
    }
  }

  // INVENTORY MANAGEMENT METHODS

  async getInventorySummary() {
    try {
      const response = await this.api.get('/summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory summary:', error);
      throw error;
    }
  }

  async updateStock(type, id, quantity, operation) {
    try {
      const response = await this.api.post('/update-stock', {
        type,
        id,
        quantity,
        operation
      });
      return response.data;
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  }

  // SEARCH AND FILTER METHODS

  async searchVaccines(searchTerm, filters = {}) {
    try {
      const vaccines = await this.getAllVaccines();
      let filteredVaccines = vaccines;

      // Apply search term
      if (searchTerm) {
        filteredVaccines = filteredVaccines.filter(vaccine =>
          vaccine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vaccine.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vaccine.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Apply filters
      if (filters.category && filters.category !== 'all') {
        filteredVaccines = filteredVaccines.filter(vaccine => 
          vaccine.category === filters.category
        );
      }

      if (filters.status && filters.status !== 'all') {
        filteredVaccines = filteredVaccines.filter(vaccine => 
          vaccine.status === filters.status
        );
      }

      if (filters.lowStock) {
        filteredVaccines = filteredVaccines.filter(vaccine => 
          vaccine.dosesInStock <= vaccine.minimumStock
        );
      }

      if (filters.expiringSoon) {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        filteredVaccines = filteredVaccines.filter(vaccine => {
          const expiryDate = new Date(vaccine.expiryDate);
          return expiryDate <= thirtyDaysFromNow && expiryDate > new Date();
        });
      }

      return filteredVaccines;
    } catch (error) {
      console.error('Error searching vaccines:', error);
      throw error;
    }
  }

  async searchMedications(searchTerm, filters = {}) {
    try {
      const medications = await this.getAllMedications();
      let filteredMedications = medications;

      // Apply search term
      if (searchTerm) {
        filteredMedications = filteredMedications.filter(medication =>
          medication.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          medication.genericName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          medication.brandName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          medication.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Apply filters
      if (filters.category && filters.category !== 'all') {
        filteredMedications = filteredMedications.filter(medication => 
          medication.category === filters.category
        );
      }

      if (filters.status && filters.status !== 'all') {
        filteredMedications = filteredMedications.filter(medication => 
          medication.status === filters.status
        );
      }

      if (filters.lowStock) {
        filteredMedications = filteredMedications.filter(medication => 
          medication.unitsInStock <= medication.minimumStock
        );
      }

      if (filters.expiringSoon) {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        filteredMedications = filteredMedications.filter(medication => {
          const expiryDate = new Date(medication.expiryDate);
          return expiryDate <= thirtyDaysFromNow && expiryDate > new Date();
        });
      }

      if (filters.prescriptionRequired !== undefined) {
        filteredMedications = filteredMedications.filter(medication => 
          medication.isPrescriptionRequired === filters.prescriptionRequired
        );
      }

      return filteredMedications;
    } catch (error) {
      console.error('Error searching medications:', error);
      throw error;
    }
  }

  // UTILITY METHODS

  getVaccineCategories() {
    return [
      'Routine Childhood',
      'Additional Routine', 
      'Travel & Special',
      'COVID-19',
      'Adult Vaccination',
      'Emergency'
    ];
  }

  getMedicationCategories() {
    return [
      'Analgesics & Antipyretics',
      'Antibiotics',
      'Anti-inflammatory & Steroids',
      'Cardiovascular Medications',
      'Respiratory Medications',
      'Gastrointestinal Medications',
      'Antihistamines & Allergy',
      'Dermatological',
      'Endocrine & Diabetes',
      'Neurological & Psychiatric',
      'Vitamins & Supplements',
      'Herbal & Traditional',
      'Ophthalmic',
      'Otic (Ear)',
      'Emergency & Critical Care',
      'Contraceptives',
      'Anti-parasitic'
    ];
  }

  getMedicationForms() {
    return [
      'Tablet',
      'Capsule',
      'Syrup',
      'Suspension',
      'Injection',
      'Drops',
      'Cream',
      'Ointment',
      'Lotion',
      'Inhaler',
      'Nebule',
      'Powder',
      'Suppository'
    ];
  }

  getVaccineAdministrationRoutes() {
    return [
      'Intramuscular',
      'Oral',
      'Subcutaneous',
      'Intradermal',
      'Nasal'
    ];
  }

  // ANALYTICS METHODS

  async getVaccineUsageStats(timeframe = '30days') {
    try {
      const response = await this.api.get(`/usage-trends?period=30`);
      return response.data;
    } catch (error) {
      console.error('Error fetching vaccine usage stats:', error);
      
      // Return mock data as fallback
      return {
        trends: this.generateMockUsageTrends(30),
        summary: {
          period: '30 days',
          totalVaccinesUsed: 245,
          avgVaccinesPerDay: 8.2
        }
      };
    }
  }

  async getMedicationUsageStats(timeframe = '30days') {
    try {
      const response = await this.api.get(`/usage-trends?period=30`);
      return response.data;
    } catch (error) {
      console.error('Error fetching medication usage stats:', error);
      
      // Return mock data as fallback
      return {
        trends: this.generateMockUsageTrends(30),
        summary: {
          period: '30 days',
          totalMedicationsUsed: 486,
          avgMedicationsPerDay: 16.2
        }
      };
    }
  }

  async getInventoryAnalytics() {
    try {
      const response = await axios.get(`${API_BASE_URL}/inventory-analytics/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory analytics:', error);
      throw error;
    }
  }

  async getInventoryAlerts() {
    try {
      const response = await axios.get(`${API_BASE_URL}/inventory-analytics/alerts`);
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory alerts:', error);
      throw error;
    }
  }

  async getUsageTrends(period = 30) {
    try {
      const response = await axios.get(`${API_BASE_URL}/inventory-analytics/usage-trends?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching usage trends:', error);
      throw error;
    }
  }

  generateMockUsageTrends(days) {
    const trends = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      trends.push({
        date: date.toISOString().split('T')[0],
        vaccinesUsed: Math.floor(Math.random() * 10) + 1,
        medicationsUsed: Math.floor(Math.random() * 25) + 5,
        totalValue: Math.floor(Math.random() * 1000) + 200
      });
    }
    
    return trends;
  }

  // PRESCRIPTION ANALYTICS METHODS
  
  async getPrescriptionAnalytics(timePeriod = '30days') {
    try {
      console.log(`📊 Fetching prescription analytics for ${timePeriod}...`);
      
      // Use dashboard API directly (not inventory API)
      const token = localStorage.getItem('token') || window.__authToken;
      const dashboardApi = axios.create({
        baseURL: `${API_BASE_URL}/dashboard`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const response = await dashboardApi.get(`/prescription-analytics?timePeriod=${timePeriod}`);
      
      console.log('✅ Prescription analytics received:', {
        totalPrescriptions: response.data.summary.totalPrescriptions,
        topMedicationsCount: response.data.topMedications.length,
        dailyTrendsCount: response.data.dailyTrends.length
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching prescription analytics:', error);
      console.warn('Falling back to mock data for prescription analytics');
      
      // Return mock data as fallback
      return {
        summary: {
          totalPrescriptions: 24,
          totalMedicationsDispensed: 67,
          avgMedicationsPerPrescription: 2.79,
          timePeriod
        },
        topMedications: [
          { name: 'Paracetamol', totalQuantity: 45, prescriptionCount: 15, avgQuantityPerPrescription: 3 },
          { name: 'Amoxicillin', totalQuantity: 28, prescriptionCount: 7, avgQuantityPerPrescription: 4 },
          { name: 'Ibuprofen', totalQuantity: 20, prescriptionCount: 10, avgQuantityPerPrescription: 2 },
          { name: 'Cetirizine', totalQuantity: 15, prescriptionCount: 5, avgQuantityPerPrescription: 3 },
          { name: 'Aspirin', totalQuantity: 12, prescriptionCount: 4, avgQuantityPerPrescription: 3 }
        ],
        dailyTrends: this.generateMockDailyTrends(timePeriod),
        prescriptionsByDoctor: [
          { doctorId: '100002', prescriptionCount: 15 },
          { doctorId: '100003', prescriptionCount: 9 }
        ]
      };
    }
  }

  async getMedicineUsageAnalytics() {
    try {
      console.log('💊 Fetching medicine usage analytics...');
      
      // Use dashboard API directly (not inventory API)
      const token = localStorage.getItem('token') || window.__authToken;
      const dashboardApi = axios.create({
        baseURL: `${API_BASE_URL}/dashboard`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const response = await dashboardApi.get('/medicine-usage');
      
      console.log('✅ Medicine usage analytics received:', {
        totalMedicines: response.data.length,
        topMedicines: response.data.slice(0, 3).map(m => m.medicine_name)
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching medicine usage analytics:', error);
      console.warn('Falling back to mock data for medicine usage analytics');
      
      // Return mock data as fallback
      return [
        { medicine_name: 'Paracetamol', usage_count: 15, total_quantity: 45, avg_quantity_per_prescription: 3 },
        { medicine_name: 'Amoxicillin', usage_count: 7, total_quantity: 28, avg_quantity_per_prescription: 4 },
        { medicine_name: 'Ibuprofen', usage_count: 10, total_quantity: 20, avg_quantity_per_prescription: 2 }
      ];
    }
  }

  generateMockDailyTrends(timePeriod) {
    const days = timePeriod === '7days' ? 7 : 30;
    const trends = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      trends.push({
        date: dateStr,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        prescriptionCount: Math.floor(Math.random() * 5) + 1 // 1-5 prescriptions per day
      });
    }
    
    return trends;
  }

  // PATIENT ANALYTICS METHODS
  
  async getPatientAnalytics() {
    try {
      console.log('📊 Fetching patient analytics...');
      
      const response = await this.api.get('/dashboard/patient-analytics');
      
      console.log('✅ Patient analytics received:', {
        totalPatients: response.data.demographics.totalPatients,
        ageGroupsCount: response.data.demographics.ageGroups.length,
        registrationTrendsCount: response.data.registrationTrends.length,
        topActiveCount: response.data.checkupFrequency.length,
        civilStatusCount: response.data.civilStatus.length
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching patient analytics:', error);
      console.warn('Falling back to mock data for patient analytics');
      
      // Return mock data as fallback
      return {
        summary: {
          totalPatients: 156,
          malePatients: 67,
          femalePatients: 89,
          newRegistrationsThisMonth: 12
        },
        demographics: {
          ageGroups: {
            '0-18': 23,
            '19-35': 45,
            '36-50': 38,
            '51-65': 32,
            '65+': 18
          },
          genderDistribution: {
            Male: 67,
            Female: 89
          },
          civilStatus: [
            { civilStatus: 'Single', count: 62 },
            { civilStatus: 'Married', count: 71 },
            { civilStatus: 'Divorced', count: 15 },
            { civilStatus: 'Widowed', count: 8 }
          ]
        },
        registrationTrends: this.generateMockRegistrationTrends(),
        checkupFrequency: {
          mostActivePatients: this.generateMockCheckupFrequency(),
          totalPatientsWithCheckups: 10
        },
        monthlyActivity: this.generateMockMonthlyActivity()
      };
    }
  }

  generateMockRegistrationTrends() {
    const months = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthYear = date.toISOString().slice(0, 7); // YYYY-MM format
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      months.push({
        month: monthYear,
        monthName: monthName,
        newRegistrations: Math.floor(Math.random() * 15) + 5 // 5-20 registrations per month
      });
    }
    
    return months;
  }

  generateMockCheckupFrequency() {
    const patients = [
      'Maria Santos', 'Juan Cruz', 'Ana Lopez', 'Carlos Garcia', 'Sofia Rivera',
      'Miguel Torres', 'Elena Morales', 'Diego Fernandez', 'Carmen Ruiz', 'Antonio Silva'
    ];
    
    return patients.map((name, index) => ({
      id: index + 1,
      name: name,
      checkupCount: Math.floor(Math.random() * 8) + 3, // 3-10 checkups
      lastCheckup: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    })).sort((a, b) => b.checkupCount - a.checkupCount);
  }

  generateMockMonthlyActivity() {
    const months = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthYear = date.toISOString().slice(0, 7); // YYYY-MM format
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      months.push({
        month: monthYear,
        monthName: monthName,
        activePatients: Math.floor(Math.random() * 40) + 20, // 20-60 active patients per month
        totalCheckups: Math.floor(Math.random() * 50) + 30 // 30-80 checkups per month
      });
    }
    
    return months;
  }

  // EXPORT METHODS

  async exportInventoryData(format = 'json') {
    try {
      const [vaccines, medications] = await Promise.all([
        this.getAllVaccines(),
        this.getAllMedications()
      ]);

      const inventoryData = {
        vaccines,
        medications,
        exportDate: new Date().toISOString(),
        summary: await this.getInventorySummary()
      };

      if (format === 'csv') {
        // Convert to CSV format
        return this.convertToCSV(inventoryData);
      }

      return inventoryData;
    } catch (error) {
      console.error('Error exporting inventory data:', error);
      throw error;
    }
  }

  convertToCSV(data) {
    // Helper method to convert inventory data to CSV format
    const csvLines = [];
    
    // Vaccines CSV
    csvLines.push('=== VACCINES ===');
    csvLines.push('Name,Category,Manufacturer,Stock,Minimum Stock,Expiry Date,Status');
    data.vaccines.forEach(vaccine => {
      csvLines.push([
        vaccine.name,
        vaccine.category,
        vaccine.manufacturer,
        vaccine.dosesInStock,
        vaccine.minimumStock,
        vaccine.expiryDate,
        vaccine.status
      ].join(','));
    });

    csvLines.push('');

    // Medications CSV
    csvLines.push('=== MEDICATIONS ===');
    csvLines.push('Name,Generic Name,Category,Dosage,Stock,Minimum Stock,Expiry Date,Status');
    data.medications.forEach(medication => {
      csvLines.push([
        medication.name,
        medication.genericName || '',
        medication.category,
        medication.dosage,
        medication.unitsInStock,
        medication.minimumStock,
        medication.expiryDate,
        medication.status
      ].join(','));
    });

    return csvLines.join('\n');
  }

  // STOCK MANAGEMENT METHODS
  
  async addVaccineStock(vaccineId, stockData) {
    try {
      const response = await this.api.post('/update-stock', {
        type: 'vaccine',
        id: vaccineId,
        quantity: parseInt(stockData.amount),
        operation: 'add'
      });
      
      // If we have additional data like batch number and expiry date, update those separately
      if (stockData.batchNumber || stockData.expiryDate || stockData.lotNumber) {
        const vaccine = await this.getVaccineById(vaccineId);
        const updateData = {};
        
        if (stockData.batchNumber) {
          updateData.batchNumber = stockData.batchNumber;
        }
        if (stockData.expiryDate) {
          updateData.expiryDate = stockData.expiryDate;
        }
        if (stockData.lotNumber) {
          updateData.lotNumber = stockData.lotNumber;
        }
        
        await this.updateVaccine(vaccineId, { ...vaccine, ...updateData });
      }
      
      return response.data;
    } catch (error) {
      console.error('Error adding vaccine stock:', error);
      throw error;
    }
  }

  async addMedicationStock(medicationId, stockData) {
    try {
      const response = await this.api.post('/update-stock', {
        type: 'medication',
        id: medicationId,
        quantity: parseInt(stockData.amount),
        operation: 'add'
      });
      
      // If we have additional data like batch number and expiry date, update those separately
      if (stockData.batchNumber || stockData.expiryDate) {
        const medication = await this.getMedicationById(medicationId);
        const updateData = {};
        
        if (stockData.batchNumber) {
          updateData.batchNumber = stockData.batchNumber;
        }
        if (stockData.expiryDate) {
          updateData.expiryDate = stockData.expiryDate;
        }
        
        await this.updateMedication(medicationId, { ...medication, ...updateData });
      }
      
      return response.data;
    } catch (error) {
      console.error('Error adding medication stock:', error);
      throw error;
    }
  }

  // MANAGEMENT DASHBOARD ANALYTICS METHODS

  async getVaccineUsageDistribution() {
    try {
      console.log('💉 Fetching REAL vaccine usage distribution for Management Dashboard...');
      console.log('🔗 Using Admin dashboard endpoint for real data');
      
      // Use the same real data endpoint that Admin dashboard uses
      const response = await axios.get('/api/dashboard/vaccine-usage');
      
      // Transform to match expected format
      const transformedData = {
        usage: response.data.map(item => ({
          vaccine_name: item.vaccine_name,
          usage_count: item.usage_count,
          category: 'Real Usage', // All real usage from patient records
          manufacturer: 'Various',
          current_stock: 0,
          minimum_stock: 0
        })),
        total_usage: response.data.reduce((sum, item) => sum + item.usage_count, 0),
        vaccines_count: response.data.length
      };
      
      console.log('✅ REAL vaccine usage distribution received:', {
        totalUsage: transformedData.total_usage,
        vaccinesCount: transformedData.vaccines_count,
        topVaccines: transformedData.usage.slice(0, 3).map(v => v.vaccine_name),
        dataSource: 'Real patient vaccination records'
      });
      
      return transformedData;
    } catch (error) {
      console.error('❌ Error fetching real vaccine usage distribution:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      console.warn('❌ No real vaccine usage data available - returning empty dataset');
      
      // Return empty data structure when API fails
      return {
        usage: [],
        total_usage: 0,
        vaccines_count: 0
      };
    }
  }

  async getVaccineCategoryDistribution() {
    try {
      console.log('📊 Fetching REAL category distribution (vaccines + prescriptions) for Management Dashboard...');
      console.log('🔗 Getting both vaccine and prescription usage data');
      
      // Get both vaccine and prescription data in parallel
      const [vaccineResponse, prescriptionResponse] = await Promise.all([
        axios.get('/api/dashboard/vaccine-usage'),
        axios.get('/api/dashboard/prescription-distribution')
      ]);
      
      // Create combined categories
      const categoryMap = {
        'Vaccines': { count: 0, usage: 0 },
        'Prescriptions': { count: 0, usage: 0 }
      };
      let totalUsage = 0;
      
      // Add vaccine data
      vaccineResponse.data.forEach(vaccine => {
        categoryMap['Vaccines'].count += 1;
        categoryMap['Vaccines'].usage += vaccine.usage_count;
        totalUsage += vaccine.usage_count;
      });
      
      // Add prescription data
      prescriptionResponse.data.forEach(prescription => {
        categoryMap['Prescriptions'].count += 1;
        categoryMap['Prescriptions'].usage += prescription.usage_count;
        totalUsage += prescription.usage_count;
      });
      
      // Convert to expected format with clear separation
      const categories = Object.entries(categoryMap).map(([category, data]) => ({
        category,
        count: data.usage, // Total usage count for this category
        itemCount: data.count, // Number of different items in this category
        percentage: totalUsage > 0 ? (data.usage / totalUsage) * 100 : 0,
        description: category === 'Vaccines' ? `${data.usage} vaccine administrations` : `${data.usage} prescription uses`
      })).sort((a, b) => b.percentage - a.percentage);
      
      const result = {
        categories,
        total_categories: categories.length
      };
      
      console.log('✅ REAL category distribution received:', {
        totalCategories: result.total_categories,
        categories: result.categories.map(c => `${c.category}: ${c.count} uses (${c.percentage.toFixed(1)}%)`),
        dataSource: 'Real patient vaccination and prescription records'
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching real vaccine category distribution:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      console.warn('❌ No real vaccine category data available - returning empty dataset');
      
      // Return empty data structure when API fails
      return {
        categories: [],
        total_categories: 0
      };
    }
  }

  // ==================== MEDICAL SUPPLIES METHODS ====================

  async getAllMedicalSupplies() {
    try {
      const response = await this.api.get('/medical-supplies');
      return response.data;
    } catch (error) {
      console.error('Error fetching medical supplies:', error);
      throw error;
    }
  }

  async getMedicalSupplyById(id) {
    try {
      const response = await this.api.get(`/medical-supplies/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching medical supply:', error);
      throw error;
    }
  }

  async createMedicalSupply(supplyData) {
    try {
      const response = await this.api.post('/medical-supplies', supplyData);
      return response.data;
    } catch (error) {
      console.error('Error creating medical supply:', error);
      throw error;
    }
  }

  async updateMedicalSupply(id, supplyData) {
    try {
      const response = await this.api.put(`/medical-supplies/${id}`, supplyData);
      return response.data;
    } catch (error) {
      console.error('Error updating medical supply:', error);
      throw error;
    }
  }

  async deleteMedicalSupply(id) {
    try {
      const response = await this.api.delete(`/medical-supplies/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting medical supply:', error);
      throw error;
    }
  }

  async addMedicalSupplyStock(id, data) {
    try {
      const response = await this.api.post(`/medical-supplies/${id}/add-stock`, data);
      return response.data;
    } catch (error) {
      console.error('Error adding medical supply stock:', error);
      throw error;
    }
  }

  // Daily usage log methods
  async logDailyUsage(usageData) {
    try {
      const response = await this.api.post('/medical-supplies/usage-log', usageData);
      return response.data;
    } catch (error) {
      console.error('Error logging daily usage:', error);
      throw error;
    }
  }

  async getAllUsageLogs() {
    try {
      const response = await this.api.get('/medical-supplies/usage-log');
      return response.data;
    } catch (error) {
      console.error('Error fetching usage logs:', error);
      throw error;
    }
  }

  async getUsageLogsByDateRange(startDate, endDate) {
    try {
      const response = await this.api.get('/medical-supplies/usage-log/range', {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching usage logs by date range:', error);
      throw error;
    }
  }
}

export default new InventoryService();
