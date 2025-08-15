import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
        const token = localStorage.getItem('token');
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
      // This would typically come from a usage tracking endpoint
      // For now, return mock data based on current stock levels
      const vaccines = await this.getAllVaccines();
      
      return vaccines.map(vaccine => ({
        name: vaccine.name,
        used: Math.floor(Math.random() * 50), // Mock usage data
        remaining: vaccine.dosesInStock,
        category: vaccine.category
      }));
    } catch (error) {
      console.error('Error fetching vaccine usage stats:', error);
      throw error;
    }
  }

  async getMedicationUsageStats(timeframe = '30days') {
    try {
      // This would typically come from a usage tracking endpoint
      // For now, return mock data based on current stock levels
      const medications = await this.getAllMedications();
      
      return medications.map(medication => ({
        name: medication.name,
        used: Math.floor(Math.random() * 100), // Mock usage data
        remaining: medication.unitsInStock,
        category: medication.category
      }));
    } catch (error) {
      console.error('Error fetching medication usage stats:', error);
      throw error;
    }
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
}

export default new InventoryService();
