import React, { useState, useEffect, useMemo } from 'react';
import './PatientHealthStock.css';

const PatientHealthStock = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [vaccines, setVaccines] = useState([]);
  const [prescriptionSearch, setPrescriptionSearch] = useState('');
  const [vaccineSearch, setVaccineSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Pagination states
  const [prescriptionPage, setPrescriptionPage] = useState(1);
  const [vaccinePage, setVaccinePage] = useState(1);
  const prescriptionItemsPerPage = 10;
  const vaccineItemsPerPage = 7;

  // Fetch inventory data
  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      
      // Fetch medications/prescriptions
      const medicationsResponse = await fetch('/api/inventory/medications');
      const medicationsData = await medicationsResponse.json();
      
      // Fetch vaccines
      const vaccinesResponse = await fetch('/api/inventory/vaccines');
      const vaccinesData = await vaccinesResponse.json();
      
      // Show all medications and vaccines in stock
      const availablePrescriptions = medicationsData.filter(med => 
        (med.quantityInStock || med.unitsInStock) > 0
      );
      
      const availableVaccines = vaccinesData.filter(vaccine => 
        (vaccine.dosesInStock || vaccine.quantityInStock || vaccine.unitsInStock) > 0
      );
      
      setPrescriptions(availablePrescriptions);
      setVaccines(availableVaccines);
    } catch (error) {
      console.error('Error fetching inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
    
    // Auto-refresh every hour
    const refreshInterval = setInterval(() => {
      fetchInventoryData();
    }, 3600000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Get disease/indication info for medications
  const getMedicationInfo = (medication) => {
    return medication.indication || medication.notes || 
           `Used for ${medication.category?.toLowerCase()} conditions`;
  };
  
  // Get vaccine info
  const getVaccineInfo = (vaccine) => {
    return vaccine.description || vaccine.notes || 
           `Prevents ${vaccine.name.toLowerCase()}`;
  };

  // Smart search for prescriptions
  const getSmartPrescriptionResults = () => {
    let filtered = prescriptions;
    
    if (prescriptionSearch.trim()) {
      const searchTerm = prescriptionSearch.toLowerCase().trim();
      
      // Smart search mapping for common conditions/symptoms
      const conditionMapping = {
        'flu': ['paracetamol', 'ibuprofen', 'cetirizine', 'loratadine'],
        'fever': ['paracetamol', 'ibuprofen', 'mefenamic'],
        'pain': ['paracetamol', 'ibuprofen', 'mefenamic', 'tramadol'],
        'headache': ['paracetamol', 'ibuprofen', 'mefenamic'],
        'cold': ['cetirizine', 'loratadine', 'paracetamol'],
        'allergy': ['cetirizine', 'loratadine'],
        'cough': ['salbutamol'],
        'asthma': ['salbutamol'],
        'infection': ['amoxicillin', 'azithromycin'],
        'antibiotic': ['amoxicillin', 'azithromycin'],
        'diabetes': ['metformin'],
        'hypertension': ['amlodipine', 'losartan'],
        'blood pressure': ['amlodipine', 'losartan']
      };
      
      // Check if search term matches any condition
      let relevantMedications = [];
      for (const [condition, medications] of Object.entries(conditionMapping)) {
        if (condition.includes(searchTerm) || searchTerm.includes(condition)) {
          relevantMedications = [...relevantMedications, ...medications];
        }
      }
      
      filtered = prescriptions.filter(prescription => {
        const name = prescription.name.toLowerCase();
        const category = prescription.category?.toLowerCase() || '';
        
        // Direct name match
        if (name.includes(searchTerm)) return true;
        
        // Category match
        if (category.includes(searchTerm)) return true;
        
        // Smart condition match
        if (relevantMedications.some(med => name.includes(med))) return true;
        
        return false;
      });
    }
    
    // Apply pagination
    const startIndex = (prescriptionPage - 1) * prescriptionItemsPerPage;
    return filtered.slice(startIndex, startIndex + prescriptionItemsPerPage);
  };
  
  // Get total pages for prescriptions  
  const getTotalPrescriptionPages = () => {
    if (!prescriptionSearch.trim()) {
      return Math.ceil(prescriptions.length / prescriptionItemsPerPage);
    }
    
    const searchTerm = prescriptionSearch.toLowerCase().trim();
    
    // Apply same filtering logic as getSmartPrescriptionResults
    const conditionMapping = {
      'flu': ['paracetamol', 'ibuprofen', 'cetirizine', 'loratadine'],
      'fever': ['paracetamol', 'ibuprofen', 'mefenamic'],
      'pain': ['paracetamol', 'ibuprofen', 'mefenamic', 'tramadol'],
      'headache': ['paracetamol', 'ibuprofen', 'mefenamic'],
      'cold': ['cetirizine', 'loratadine', 'paracetamol'],
      'allergy': ['cetirizine', 'loratadine'],
      'cough': ['salbutamol'],
      'asthma': ['salbutamol'],
      'infection': ['amoxicillin', 'azithromycin'],
      'antibiotic': ['amoxicillin', 'azithromycin'],
      'diabetes': ['metformin'],
      'hypertension': ['amlodipine', 'losartan'],
      'blood pressure': ['amlodipine', 'losartan']
    };
    
    let relevantMedications = [];
    for (const [condition, medications] of Object.entries(conditionMapping)) {
      if (condition.includes(searchTerm) || searchTerm.includes(condition)) {
        relevantMedications = [...relevantMedications, ...medications];
      }
    }
    
    const filtered = prescriptions.filter(prescription => {
      const name = prescription.name.toLowerCase();
      const category = prescription.category?.toLowerCase() || '';
      
      if (name.includes(searchTerm)) return true;
      if (category.includes(searchTerm)) return true;
      if (relevantMedications.some(med => name.includes(med))) return true;
      
      return false;
    });
    
    return Math.ceil(filtered.length / prescriptionItemsPerPage);
  };

  // Simple search for vaccines with pagination
  const getFilteredVaccines = () => {
    let filtered = vaccines;
    
    if (vaccineSearch.trim()) {
      const searchTerm = vaccineSearch.toLowerCase().trim();
      filtered = vaccines.filter(vaccine => 
        vaccine.name.toLowerCase().includes(searchTerm) ||
        vaccine.category?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply pagination
    const startIndex = (vaccinePage - 1) * vaccineItemsPerPage;
    return filtered.slice(startIndex, startIndex + vaccineItemsPerPage);
  };
  
  // Get total pages for vaccines
  const getTotalVaccinePages = () => {
    let filtered = vaccines;
    
    if (vaccineSearch.trim()) {
      const searchTerm = vaccineSearch.toLowerCase().trim();
      filtered = vaccines.filter(vaccine => 
        vaccine.name.toLowerCase().includes(searchTerm) ||
        vaccine.category?.toLowerCase().includes(searchTerm)
      );
    }
    
    return Math.ceil(filtered.length / vaccineItemsPerPage);
  };

  // Get total counts for display
  const getTotalPrescriptionCount = () => {
    if (!prescriptionSearch.trim()) {
      return prescriptions.length;
    }
    
    const searchTerm = prescriptionSearch.toLowerCase().trim();
    const conditionMapping = {
      'flu': ['paracetamol', 'ibuprofen', 'cetirizine', 'loratadine'],
      'fever': ['paracetamol', 'ibuprofen', 'mefenamic'],
      'pain': ['paracetamol', 'ibuprofen', 'mefenamic', 'tramadol'],
      'headache': ['paracetamol', 'ibuprofen', 'mefenamic'],
      'cold': ['cetirizine', 'loratadine', 'paracetamol'],
      'allergy': ['cetirizine', 'loratadine'],
      'cough': ['salbutamol'],
      'asthma': ['salbutamol'],
      'infection': ['amoxicillin', 'azithromycin'],
      'antibiotic': ['amoxicillin', 'azithromycin'],
      'diabetes': ['metformin'],
      'hypertension': ['amlodipine', 'losartan'],
      'blood pressure': ['amlodipine', 'losartan']
    };
    
    let relevantMedications = [];
    for (const [condition, medications] of Object.entries(conditionMapping)) {
      if (condition.includes(searchTerm) || searchTerm.includes(condition)) {
        relevantMedications = [...relevantMedications, ...medications];
      }
    }
    
    return prescriptions.filter(prescription => {
      const name = prescription.name.toLowerCase();
      const category = prescription.category?.toLowerCase() || '';
      
      if (name.includes(searchTerm)) return true;
      if (category.includes(searchTerm)) return true;
      if (relevantMedications.some(med => name.includes(med))) return true;
      
      return false;
    }).length;
  };

  const getTotalVaccineCount = () => {
    if (!vaccineSearch.trim()) {
      return vaccines.length;
    }
    
    const searchTerm = vaccineSearch.toLowerCase().trim();
    return vaccines.filter(vaccine => 
      vaccine.name.toLowerCase().includes(searchTerm) ||
      vaccine.category?.toLowerCase().includes(searchTerm)
    ).length;
  };

  // Memoize filtered results
  const currentPrescriptionResults = useMemo(() => {
    return getSmartPrescriptionResults();
  }, [prescriptions, prescriptionSearch, prescriptionPage]);

  const currentVaccineResults = useMemo(() => {
    return getFilteredVaccines();
  }, [vaccines, vaccineSearch, vaccinePage]);

  if (loading) {
    return (
      <div className="patient-health-stock-loading">
        <div className="loading-spinner"></div>
        <p>Loading health stock information...</p>
      </div>
    );
  }

  return (
    <div className="patient-health-stock">
      {/* Main Content Grid */}
      <div className="patient-health-stock-grid">
        
        {/* Prescriptions Section */}
        <div className="patient-health-section prescriptions-section">
          <div className="patient-section-header">
            <h2 className="patient-section-title">
              <i className="fas fa-pills"></i>
              Available Prescriptions
            </h2>
            <div className="patient-section-count">
              {getTotalPrescriptionCount()} medications available
            </div>
          </div>
          
          <div className="patient-search-container">
            <div className="patient-search-input-wrapper">
              <input
                type="text"
                className="patient-search-input"
                placeholder="Search by medication name or condition (e.g., 'flu', 'fever', 'pain')..."
                value={prescriptionSearch}
                onChange={(e) => {
                  setPrescriptionSearch(e.target.value);
                  setPrescriptionPage(1);
                }}
              />
              {prescriptionSearch && (
                <button 
                  className="patient-clear-search"
                  onClick={() => setPrescriptionSearch('')}
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>

          <div className="patient-items-list">
            <div className="patient-list-header">
              <div className="col-name">Medication</div>
              <div className="col-category">Category</div>
              <div className="col-strength">Strength</div>
              <div className="col-info">Treats/Indication</div>
            </div>
            {currentPrescriptionResults.map(prescription => (
              <div key={prescription.id} className="patient-list-item prescription-item">
                <div className="col-name">
                  <strong>{prescription.name}</strong>
                  <small>{prescription.form || prescription.dosageForm}</small>
                </div>
                <div className="col-category">{prescription.category}</div>
                <div className="col-strength">{prescription.strength}</div>
                <div className="col-info">{getMedicationInfo(prescription)}</div>
              </div>
            ))}
            
            {currentPrescriptionResults.length === 0 && (
              <div className="patient-no-results">
                <i className="fas fa-search"></i>
                <p>No prescriptions found matching your search.</p>
                <small>Try searching for conditions like "flu", "fever", or medication names.</small>
              </div>
            )}
          </div>
          
          {/* Prescription Pagination */}
          {getTotalPrescriptionPages() > 1 && (
            <div className="patient-pagination-controls">
              <button 
                className="patient-pagination-btn"
                onClick={() => setPrescriptionPage(Math.max(1, prescriptionPage - 1))}
                disabled={prescriptionPage === 1}
              >
                <i className="fas fa-chevron-left"></i> Previous
              </button>
              
              <div className="patient-pagination-info">
                Page {prescriptionPage} of {getTotalPrescriptionPages()}
              </div>
              
              <button 
                className="patient-pagination-btn"
                onClick={() => setPrescriptionPage(Math.min(getTotalPrescriptionPages(), prescriptionPage + 1))}
                disabled={prescriptionPage === getTotalPrescriptionPages()}
              >
                Next <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </div>

        {/* Vaccination Services Section */}
        <div className="patient-health-section vaccination-section">
          <div className="patient-section-header">
            <h2 className="patient-section-title">
              <i className="fas fa-syringe"></i>
              Vaccination Services
            </h2>
            <div className="patient-section-count">
              {getTotalVaccineCount()} vaccines available
            </div>
          </div>
          
          <div className="patient-search-container">
            <div className="patient-search-input-wrapper">
              <input
                type="text"
                className="patient-search-input"
                placeholder="Search vaccines..."
                value={vaccineSearch}
                onChange={(e) => {
                  setVaccineSearch(e.target.value);
                  setVaccinePage(1);
                }}
              />
              {vaccineSearch && (
                <button 
                  className="patient-clear-search"
                  onClick={() => setVaccineSearch('')}
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>

          <div className="patient-items-list">
            <div className="patient-list-header">
              <div className="col-name">Vaccine</div>
              <div className="col-category">Category</div>
              <div className="col-strength">Age Group</div>
              <div className="col-info">Prevents/Description</div>
            </div>
            {currentVaccineResults.map(vaccine => (
              <div key={vaccine.id} className="patient-list-item vaccine-item">
                <div className="col-name">
                  <strong>{vaccine.name}</strong>
                  <small>Available during service hours</small>
                </div>
                <div className="col-category">{vaccine.category}</div>
                <div className="col-strength">{vaccine.ageGroup || vaccine.targetGroup || 'All ages'}</div>
                <div className="col-info">{getVaccineInfo(vaccine)}</div>
              </div>
            ))}
            
            {currentVaccineResults.length === 0 && (
              <div className="patient-no-results">
                <i className="fas fa-search"></i>
                <p>No vaccines found matching your search.</p>
              </div>
            )}
          </div>
          
          {/* Vaccine Pagination */}
          {getTotalVaccinePages() > 1 && (
            <div className="patient-pagination-controls">
              <button 
                className="patient-pagination-btn"
                onClick={() => setVaccinePage(Math.max(1, vaccinePage - 1))}
                disabled={vaccinePage === 1}
              >
                <i className="fas fa-chevron-left"></i> Previous
              </button>
              
              <div className="patient-pagination-info">
                Page {vaccinePage} of {getTotalVaccinePages()}
              </div>
              
              <button 
                className="patient-pagination-btn"
                onClick={() => setVaccinePage(Math.min(getTotalVaccinePages(), vaccinePage + 1))}
                disabled={vaccinePage === getTotalVaccinePages()}
              >
                Next <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Service Hours Section at Bottom */}
      <div className="patient-service-hours-section">
        <div className="patient-service-hours-container">
          <h3 className="patient-service-hours-title">
            <i className="fas fa-clock"></i> Vaccination Service Hours
          </h3>
          <div className="patient-service-hours-grid">
            <div className="patient-service-hours-card">
              <div className="service-line"><strong>Monday - Friday:</strong> 8:00 AM - 5:00 PM</div>
              <div className="service-line"><strong>Saturday:</strong> 8:00 AM - 12:00 PM</div>
              <div className="service-line"><strong>Sunday:</strong> Closed</div>
              <div className="service-line"><strong>Lunch Break:</strong> 12:00 PM - 2:00 PM</div>
            </div>
            <div className="patient-service-info-card">
              <div className="service-note">
                <i className="fas fa-info-circle"></i> Walk-in available • Appointments recommended
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientHealthStock;
