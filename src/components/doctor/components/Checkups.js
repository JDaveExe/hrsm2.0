import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Accordion } from 'react-bootstrap';
import { useData } from '../../../context/DataContext';
import { doctorSessionService } from '../../../services/doctorSessionService';
import LoadingSpinnerDoc from './LoadingSpinnerDoc';
import VitalSignsModal from '../../VitalSignsModal';
import '../styles/Checkups.css';
import '../styles/DiagnosisSelector.css';

// Medication Item Component
import MedicationItem from './MedicationItem';

// Philippines Healthcare Common Diseases Data
const COMMON_DISEASES = [
  // Infectious Diseases
  { category: 'Infectious Diseases', name: 'Upper Respiratory Tract Infection (URTI)', icd10: 'J06.9' },
  { category: 'Infectious Diseases', name: 'Pneumonia', icd10: 'J18.9' },
  { category: 'Infectious Diseases', name: 'Acute Diarrhea/Gastroenteritis', icd10: 'K59.1' },
  { category: 'Infectious Diseases', name: 'Skin Infection (Impetigo)', icd10: 'L01.0' },
  { category: 'Infectious Diseases', name: 'Urinary Tract Infection (UTI)', icd10: 'N39.0' },
  { category: 'Infectious Diseases', name: 'Dengue Fever', icd10: 'A90' },
  { category: 'Infectious Diseases', name: 'Typhoid Fever', icd10: 'A01.0' },
  
  // Non-Communicable Diseases
  { category: 'Cardiovascular', name: 'Hypertension', icd10: 'I10' },
  { category: 'Endocrine', name: 'Diabetes Mellitus Type 2', icd10: 'E11.9' },
  { category: 'Respiratory', name: 'Bronchial Asthma', icd10: 'J45.9' },
  { category: 'Gastrointestinal', name: 'Gastritis', icd10: 'K29.7' },
  { category: 'Gastrointestinal', name: 'GERD', icd10: 'K21.9' },
  { category: 'Neurological', name: 'Headache/Migraine', icd10: 'G43.9' },
  { category: 'Musculoskeletal', name: 'Arthritis/Joint Pain', icd10: 'M79.3' },
  
  // Common Symptoms
  { category: 'Symptoms', name: 'Fever (unspecified)', icd10: 'R50.9' },
  { category: 'Symptoms', name: 'Cough and Colds', icd10: 'R05' },
  { category: 'Symptoms', name: 'Abdominal Pain', icd10: 'R10.4' },
  { category: 'Symptoms', name: 'Back Pain', icd10: 'M54.9' },
  { category: 'Symptoms', name: 'Allergic Reaction', icd10: 'T78.4' },
  
  // Maternal & Child Health
  { category: 'Maternal Health', name: 'Prenatal Checkup (Normal Pregnancy)', icd10: 'Z34.9' },
  { category: 'Child Health', name: 'Routine Immunization', icd10: 'Z23' },
  { category: 'Child Health', name: 'Malnutrition', icd10: 'E46' },
  { category: 'Child Health', name: 'Common Cold in Children', icd10: 'J00' }
];

// Diagnosis Selector Component
const DiagnosisSelector = ({ checkupId, selectedDiagnosis, customDiagnosis, severity, onChange }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [localCustomDiagnosis, setLocalCustomDiagnosis] = useState(customDiagnosis || '');
  const [localSeverity, setLocalSeverity] = useState(severity || 'mild');
  
  const dropdownRef = useRef(null);
  
  // Filter diseases based on search term
  const filteredDiseases = COMMON_DISEASES.filter(disease =>
    disease.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    disease.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Group diseases by category for better organization
  const groupedDiseases = filteredDiseases.reduce((acc, disease) => {
    if (!acc[disease.category]) {
      acc[disease.category] = [];
    }
    acc[disease.category].push(disease);
    return acc;
  }, {});
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleDiseaseSelect = (disease) => {
    setShowCustomInput(false);
    setIsDropdownOpen(false);
    setSearchTerm('');
    
    onChange({
      primaryDiagnosis: disease.name,
      customDiagnosis: '',
      severity: localSeverity,
      icd10: disease.icd10
    });
  };
  
  const handleCustomSubmit = () => {
    if (localCustomDiagnosis.trim()) {
      setShowCustomInput(false);
      setIsDropdownOpen(false);
      
      onChange({
        primaryDiagnosis: '',
        customDiagnosis: localCustomDiagnosis.trim(),
        severity: localSeverity,
        icd10: ''
      });
    }
  };
  
  const handleSeverityChange = (newSeverity) => {
    setLocalSeverity(newSeverity);
    
    onChange({
      primaryDiagnosis: selectedDiagnosis,
      customDiagnosis: localCustomDiagnosis,
      severity: newSeverity,
      icd10: ''
    });
  };
  
  const currentDiagnosis = selectedDiagnosis || customDiagnosis || '';
  
  return (
    <div className="diagnosis-selector-container" ref={dropdownRef}>
      {/* Main Diagnosis Input */}
      <div 
        className={`diagnosis-input-wrapper ${isDropdownOpen ? 'diagnosis-input-focused' : ''}`}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <input
          type="text"
          className="diagnosis-input"
          placeholder="Select or search for diagnosis..."
          value={currentDiagnosis}
          readOnly
        />
        <i className={`bi ${isDropdownOpen ? 'bi-chevron-up' : 'bi-chevron-down'} diagnosis-chevron`}></i>
      </div>
      
      {/* Dropdown */}
      {isDropdownOpen && (
        <div className="diagnosis-dropdown">
          {/* Search Bar */}
          <div className="diagnosis-search-wrapper">
            <input
              type="text"
              className="diagnosis-search"
              placeholder="Search diseases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            <i className="bi bi-search diagnosis-search-icon"></i>
          </div>
          
          {/* Custom Diagnosis Option */}
          <div className="diagnosis-dropdown-section">
            <button
              className="diagnosis-custom-btn"
              onClick={() => {
                setShowCustomInput(true);
                setSearchTerm('');
              }}
            >
              <i className="bi bi-plus-circle"></i>
              Add Custom Diagnosis
            </button>
          </div>
          
          {/* Custom Input Form */}
          {showCustomInput && (
            <div className="diagnosis-custom-form">
              <input
                type="text"
                className="diagnosis-custom-input"
                placeholder="Enter custom diagnosis..."
                value={localCustomDiagnosis}
                onChange={(e) => setLocalCustomDiagnosis(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCustomSubmit()}
                autoFocus
              />
              <div className="diagnosis-custom-actions">
                <button className="diagnosis-custom-save" onClick={handleCustomSubmit}>
                  <i className="bi bi-check"></i>
                </button>
                <button 
                  className="diagnosis-custom-cancel" 
                  onClick={() => {
                    setShowCustomInput(false);
                    setLocalCustomDiagnosis('');
                  }}
                >
                  <i className="bi bi-x"></i>
                </button>
              </div>
            </div>
          )}
          
          {/* Disease Categories */}
          {!showCustomInput && (
            <div className="diagnosis-dropdown-content">
              {Object.keys(groupedDiseases).length === 0 ? (
                <div className="diagnosis-no-results">
                  <i className="bi bi-search"></i>
                  No diseases found matching "{searchTerm}"
                </div>
              ) : (
                Object.entries(groupedDiseases).map(([category, diseases]) => (
                  <div key={category} className="diagnosis-category">
                    <div className="diagnosis-category-header">{category}</div>
                    {diseases.map((disease) => (
                      <button
                        key={disease.name}
                        className="diagnosis-option"
                        onClick={() => handleDiseaseSelect(disease)}
                      >
                        <div className="diagnosis-option-content">
                          <span className="diagnosis-name">{disease.name}</span>
                          <span className="diagnosis-icd">{disease.icd10}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Severity Selector */}
      {currentDiagnosis && (
        <div className="diagnosis-severity-wrapper">
          <label className="diagnosis-severity-label">Severity:</label>
          <div className="diagnosis-severity-options">
            {['mild', 'moderate', 'severe'].map((level) => (
              <button
                key={level}
                className={`diagnosis-severity-btn ${localSeverity === level ? 'active' : ''}`}
                onClick={() => handleSeverityChange(level)}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Secure Caching Utility
const SecureCache = {
  // Simple encryption for sensitive data
  encrypt: (data, key) => {
    const jsonString = JSON.stringify(data);
    let encrypted = '';
    for (let i = 0; i < jsonString.length; i++) {
      encrypted += String.fromCharCode(jsonString.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(encrypted);
  },
  
  decrypt: (encryptedData, key) => {
    try {
      const encrypted = atob(encryptedData);
      let decrypted = '';
      for (let i = 0; i < encrypted.length; i++) {
        decrypted += String.fromCharCode(encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return JSON.parse(decrypted);
    } catch (error) {
      console.warn('Failed to decrypt cache data:', error);
      return null;
    }
  },
  
  // Generate session-based encryption key
  getSessionKey: () => {
    const sessionId = sessionStorage.getItem('hrsm_session_id') || 'default_session';
    const timestamp = Math.floor(Date.now() / (1000 * 60 * 30)); // Changes every 30 minutes
    return `${sessionId}_${timestamp}`;
  },
  
  // Set cache with encryption and expiration
  set: (key, data, expirationMinutes = 15) => {
    const cacheKey = `hrsm_cache_${key}`;
    const sessionKey = SecureCache.getSessionKey();
    const expirationTime = Date.now() + (expirationMinutes * 60 * 1000);
    
    const cacheData = {
      data: data,
      expiration: expirationTime,
      checksum: btoa(JSON.stringify(data)).slice(-10) // Simple integrity check
    };
    
    const encrypted = SecureCache.encrypt(cacheData, sessionKey);
    localStorage.setItem(cacheKey, encrypted);
    
    // Set automatic cleanup
    setTimeout(() => {
      SecureCache.remove(key);
    }, expirationMinutes * 60 * 1000);
  },
  
  // Get cache with decryption and validation
  get: (key) => {
    const cacheKey = `hrsm_cache_${key}`;
    const encrypted = localStorage.getItem(cacheKey);
    
    if (!encrypted) return null;
    
    const sessionKey = SecureCache.getSessionKey();
    const cacheData = SecureCache.decrypt(encrypted, sessionKey);
    
    if (!cacheData) {
      SecureCache.remove(key);
      return null;
    }
    
    // Check expiration
    if (Date.now() > cacheData.expiration) {
      SecureCache.remove(key);
      return null;
    }
    
    // Validate integrity
    const currentChecksum = btoa(JSON.stringify(cacheData.data)).slice(-10);
    if (currentChecksum !== cacheData.checksum) {
      SecureCache.remove(key);
      return null;
    }
    
    return cacheData.data;
  },
  
  // Remove cache
  remove: (key) => {
    const cacheKey = `hrsm_cache_${key}`;
    localStorage.removeItem(cacheKey);
  },
  
  // Clear all expired caches
  clearExpired: () => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('hrsm_cache_'));
    keys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const sessionKey = SecureCache.getSessionKey();
          const cacheData = SecureCache.decrypt(data, sessionKey);
          if (!cacheData || Date.now() > cacheData.expiration) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          localStorage.removeItem(key);
        }
      }
    });
  }
};

const Checkups = ({ currentDateTime, user, secureApiCall }) => {
  const { 
    doctorCheckupsData: initialDoctorCheckupsData, 
    updateCheckupStatus, 
    updateCheckupNotes,
    refreshDoctorCheckups 
  } = useData();
  
  const [doctorCheckupsData, setDoctorCheckupsData] = useState(initialDoctorCheckupsData);
  const [selectedCheckup, setSelectedCheckup] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterTab, setFilterTab] = useState('ongoing');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // New state to manage active accordion keys
  const [activeKey, setActiveKey] = useState(null);
  
  // Ref for debouncing notes updates
  const updateTimeoutRef = useRef(null);

  // Track revealed finished checkups (for spoiler functionality)
  const [revealedFinished, setRevealedFinished] = useState(new Set());

  // Pagination and sorting state
  const [currentPage, setCurrentPage] = useState(1);
  const [timeFilter, setTimeFilter] = useState('all');
  const itemsPerPage = 10;
  
  // Search state for finished section
  const [finishedSearchTerm, setFinishedSearchTerm] = useState('');
  const finishedItemsPerPage = 6; // Show 6 items (2 rows of 3) per page for finished section

  // Doctor notes modal state
  const [showDoctorNotesModal, setShowDoctorNotesModal] = useState(false);
  const [selectedCheckupNotes, setSelectedCheckupNotes] = useState(null);
  
  // Vital signs modal state
  const [showVitalSignsModal, setShowVitalSignsModal] = useState(false);
  const [selectedVitalSignsCheckup, setSelectedVitalSignsCheckup] = useState(null);

  // Reset accordion state when changing tabs
  useEffect(() => {
    setActiveKey(null);
    setCurrentPage(1); // Reset to first page when changing tabs
  }, [filterTab, timeFilter]);

  // Filter checkups by time range
  const filterByTimeRange = (checkups) => {
    if (timeFilter === 'all') return checkups;
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeFilter) {
      case '2days':
        cutoffDate.setDate(now.getDate() - 2);
        break;
      case '2weeks':
        cutoffDate.setDate(now.getDate() - 14);
        break;
      case '3months':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      default:
        return checkups;
    }
    
    return checkups.filter(checkup => {
      const checkupDate = new Date(checkup.completedAt || checkup.updatedAt || checkup.createdAt);
      return checkupDate >= cutoffDate;
    });
  };

  // Filter and sort checkups
  const getFilteredCheckups = () => {
    let filtered = doctorCheckupsData;
    
    // Filter by status
    if (filterTab === 'ongoing') {
      filtered = filtered.filter(checkup => 
        checkup.status === 'in-progress' || checkup.status === 'started' || checkup.status === 'transferred'
      );
    } else if (filterTab === 'finished') {
      filtered = filtered.filter(checkup => checkup.status === 'completed' || checkup.status === 'vaccination-completed');
      // Get only recent finished (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      filtered = filtered.filter(checkup => {
        const completedDate = new Date(checkup.completedAt || checkup.updatedAt);
        return completedDate >= yesterday;
      });
      
      // Apply search filter for finished section
      if (finishedSearchTerm) {
        filtered = filtered.filter(checkup => 
          checkup.patientName.toLowerCase().includes(finishedSearchTerm.toLowerCase()) ||
          checkup.patientId.toLowerCase().includes(finishedSearchTerm.toLowerCase()) ||
          (checkup.familyId && checkup.familyId.toLowerCase().includes(finishedSearchTerm.toLowerCase()))
        );
      }
    } else if (filterTab === 'history') {
      filtered = filtered.filter(checkup => checkup.status === 'completed' || checkup.status === 'vaccination-completed');
      filtered = filterByTimeRange(filtered);
    }
    
    // Sort by completion time (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.completedAt || a.updatedAt || a.createdAt);
      const dateB = new Date(b.completedAt || b.updatedAt || b.createdAt);
      return dateB - dateA;
    });
    
    return filtered;
  };

  // Group checkups by patient for history section
  const groupCheckupsByPatient = (checkups) => {
    const grouped = {};
    checkups.forEach(checkup => {
      const patientKey = `${checkup.patientId}-${checkup.patientName}`;
      if (!grouped[patientKey]) {
        grouped[patientKey] = {
          patientId: checkup.patientId,
          patientName: checkup.patientName,
          familyId: checkup.familyId,
          age: checkup.age,
          gender: checkup.gender,
          contactNumber: checkup.contactNumber,
          checkups: []
        };
      }
      grouped[patientKey].checkups.push(checkup);
    });
    
    // Sort checkups within each patient group by date (newest first)
    Object.values(grouped).forEach(patient => {
      patient.checkups.sort((a, b) => {
        const dateA = new Date(a.completedAt || a.updatedAt || a.createdAt);
        const dateB = new Date(b.completedAt || b.updatedAt || b.createdAt);
        return dateB - dateA;
      });
    });
    
    return Object.values(grouped);
  };

  const filteredCheckups = useMemo(() => getFilteredCheckups(), [doctorCheckupsData, filterTab, finishedSearchTerm, timeFilter]);
  
  // Pagination logic - different page sizes for different tabs
  const paginationData = useMemo(() => {
    let dataToProcess = filteredCheckups;
    
    // For history tab, group by patient first
    if (filterTab === 'history') {
      dataToProcess = groupCheckupsByPatient(filteredCheckups);
    }
    
    const currentItemsPerPage = filterTab === 'finished' ? finishedItemsPerPage : itemsPerPage;
    const totalPages = Math.ceil(dataToProcess.length / currentItemsPerPage);
    const startIndex = (currentPage - 1) * currentItemsPerPage;
    const paginatedData = dataToProcess.slice(startIndex, startIndex + currentItemsPerPage);
    
    return {
      currentItemsPerPage,
      totalPages,
      startIndex,
      paginatedData: filterTab === 'history' ? paginatedData : filteredCheckups.slice(startIndex, startIndex + currentItemsPerPage)
    };
  }, [filteredCheckups, filterTab, finishedItemsPerPage, itemsPerPage, currentPage]);

  // Destructure pagination data
  const { currentItemsPerPage, totalPages, startIndex, paginatedData } = paginationData;
  const paginatedCheckups = filterTab === 'history' ? filteredCheckups : paginatedData;

  // Calculate enhanced stats for history sidebar
  const getHistoryStats = () => {
    const allCompleted = doctorCheckupsData.filter(c => c.status === 'completed' || c.status === 'vaccination-completed');
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const todayCheckups = allCompleted.filter(c => {
      const checkupDate = new Date(c.completedAt || c.updatedAt);
      return checkupDate >= todayStart;
    });
    
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);
    
    const thisWeekCheckups = allCompleted.filter(c => {
      const checkupDate = new Date(c.completedAt || c.updatedAt);
      return checkupDate >= thisWeekStart;
    });
    
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthCheckups = allCompleted.filter(c => {
      const checkupDate = new Date(c.completedAt || c.updatedAt);
      return checkupDate >= thisMonthStart;
    });
    
    // Calculate average time for completed checkups
    const checkupsWithDuration = allCompleted.filter(c => c.startedAt && c.completedAt);
    const avgDuration = checkupsWithDuration.length > 0 
      ? checkupsWithDuration.reduce((sum, c) => {
          const duration = new Date(c.completedAt) - new Date(c.startedAt);
          return sum + duration;
        }, 0) / checkupsWithDuration.length
      : 0;
    
    const avgMinutes = Math.round(avgDuration / (1000 * 60));
    
    return {
      today: todayCheckups.length,
      thisWeek: thisWeekCheckups.length,
      thisMonth: thisMonthCheckups.length,
      total: allCompleted.length,
      avgTime: avgMinutes,
      withPrescriptions: allCompleted.filter(c => c.prescriptions && c.prescriptions.length > 0).length
    };
  };
  
  // Medication selection states
  const [availableMedications, setAvailableMedications] = useState([]);
  const [medicationSearch, setMedicationSearch] = useState('');
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [selectedCheckupForMedication, setSelectedCheckupForMedication] = useState(null);
  const [loadingMedications, setLoadingMedications] = useState(true);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState({});

  useEffect(() => {
    // Simply update local state with server data - no complex merging that overwrites user input
    // Only do this on initial load, not during user interaction
    if (isInitialLoad) {
      setDoctorCheckupsData(initialDoctorCheckupsData);
    }
  }, [initialDoctorCheckupsData, isInitialLoad]); // Only run on initial load

  // Load available medications on component mount
  useEffect(() => {
    const fetchMedications = async () => {
      setLoadingMedications(true);
      try {
        const response = await fetch('/api/medications', {
          headers: {
            'Authorization': `Bearer ${window.__authToken}`
          }
        });
        if (response.ok) {
          const medications = await response.json();
          setAvailableMedications(medications);
        }
      } catch (error) {
        console.error('Failed to load medications:', error);
      } finally {
        setLoadingMedications(false);
      }
    };
    fetchMedications();
  }, []);

  // Filter medications based on search
  const filteredMedications = availableMedications.filter(medication =>
    medicationSearch === '' ||
    medication.name.toLowerCase().includes(medicationSearch.toLowerCase()) ||
    medication.genericName.toLowerCase().includes(medicationSearch.toLowerCase()) ||
    medication.category.toLowerCase().includes(medicationSearch.toLowerCase())
  );

  // Load initial checkups data when component mounts
  useEffect(() => {
    const loadInitialData = async () => {
      console.log('Checkups: Component mounted, loading initial checkups data...');
      
      // Generate a unique session ID for this session if not exists
      if (!sessionStorage.getItem('hrsm_session_id')) {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('hrsm_session_id', sessionId);
      }
      
      // Clean up any expired cache entries on component mount
      SecureCache.clearExpired();
      
      await refreshDoctorCheckups();
      setIsInitialLoad(false);
    };
    loadInitialData();
    
    // Cleanup function to clear sensitive data when component unmounts
    return () => {
      // Clear all cache entries for this session when component unmounts
      const keys = Object.keys(localStorage).filter(key => key.startsWith('hrsm_cache_checkup_'));
      keys.forEach(key => localStorage.removeItem(key));
    };
  }, [refreshDoctorCheckups]);

  // Auto-refresh checkups data every 30 seconds (only when not actively editing)
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && 
          !showMedicationModal && 
          !showDoctorNotesModal &&
          !showVitalSignsModal &&
          !updateTimeoutRef.current) { // Only skip if user is actively typing (has pending update)
        console.log('Auto-refreshing checkups data (no active editing detected)');
        refreshDoctorCheckups();
        
        // Also clean up expired caches periodically
        SecureCache.clearExpired();
      } else if (updateTimeoutRef.current) {
        console.log('Skipping auto-refresh due to pending updates');
      }
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, [refreshDoctorCheckups, showMedicationModal, showDoctorNotesModal, showVitalSignsModal]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      'started': { class: 'info', icon: 'bi-play-circle', text: 'Started' },
      'in-progress': { class: 'primary', icon: 'bi-activity', text: 'In Progress' },
      'completed': { class: 'success', icon: 'bi-check-circle', text: 'Completed' },
      'cancelled': { class: 'danger', icon: 'bi-x-circle', text: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig['started'];
    
    return (
      <span className={`status-badge status-${config.class}`}>
        <i className={`bi ${config.icon}`}></i>
        {config.text}
      </span>
    );
  };

  const handleCompleteCheckup = async (checkupId) => {
    setIsProcessing(true);
    try {
      // Get the current checkup data to send all clinical information
      const currentCheckup = doctorCheckupsData.find(c => c.id === checkupId);
      const prescriptions = currentCheckup?.prescriptions || [];
      
      // Prepare comprehensive completion data
      const completionData = {
        completedAt: new Date().toISOString(),
        completedBy: user?.id,
        doctorId: user?.id,
        doctorName: user?.firstName ? `Dr. ${user.firstName} ${user.lastName}` : 'Unknown Doctor',
        prescriptions: prescriptions,
        chiefComplaint: currentCheckup?.chiefComplaint || '',
        presentSymptoms: currentCheckup?.presentSymptoms || '',
        diagnosis: currentCheckup?.diagnosis || '',
        treatmentPlan: currentCheckup?.treatmentPlan || '',
        doctorNotes: currentCheckup?.doctorNotes || '',
        notes: currentCheckup?.notes || ''
      };
      
      console.log('🚀 Completing checkup with data:', { checkupId, completionData });
      
      const result = await updateCheckupStatus(checkupId, 'completed', completionData);
      
      if (result.success) {
        // Show completion success message
        console.log('✅ Checkup completed successfully with all clinical notes saved');
        console.log('📊 Updated checkup data:', result.data);
        
        // Set doctor status back to "online" when checkup is completed
        if (user?.id) {
          try {
            await doctorSessionService.updateDoctorStatus(user.id, 'online');
            console.log('✅ Doctor status updated to online after completing checkup');
          } catch (error) {
            console.warn('Failed to update doctor status to online:', error);
          }
        }
        
        // Refresh checkups to get latest data
        await refreshDoctorCheckups();
        
        // Add a small delay to ensure data is refreshed before filtering
        setTimeout(() => {
          console.log('🔄 Current doctorCheckupsData after refresh:', doctorCheckupsData);
        }, 1000);
      } else {
        console.error('Failed to complete checkup:', result.error);
        // Show error to user if needed
        alert(result.error || 'Failed to complete checkup');
      }
    } catch (error) {
      console.error('Failed to complete checkup:', error);
      alert('Failed to complete checkup. Please check the console for details.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler functions for the new checkup card functionality
  const handleNotesChange = (checkupId, field, value) => {
    console.log(`handleNotesChange called: checkupId=${checkupId}, field=${field}, value length=${value?.length || 0}`);
    
    // Update local state immediately - this is the source of truth for the UI
    setDoctorCheckupsData(prev => 
      prev.map(checkup => 
        checkup.id === checkupId 
          ? { ...checkup, [field]: value }
          : checkup
      )
    );
    
    // Store in secure cache as backup (but don't rely on it for UI state)
    const backupKey = `checkup_${checkupId}_${field}`;
    SecureCache.set(backupKey, value, 5);
    
    // Clear existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Debounced save to server (but don't change UI state based on server response)
    updateTimeoutRef.current = setTimeout(async () => {
      try {
        console.log(`Saving ${field} to server for checkup ${checkupId}...`);
        
        // Get the current value from our local state
        const currentData = doctorCheckupsData;
        const currentCheckup = currentData.find(c => c.id === checkupId);
        if (!currentCheckup) return;
        
        if (field === 'doctorNotes' || field === 'chiefComplaint' || field === 'presentSymptoms' || field === 'diagnosis' || field === 'treatmentPlan') {
          // For all clinical note fields, use the notes endpoint with all clinical data
          await updateCheckupNotes(checkupId, currentCheckup.notes, currentCheckup?.prescriptions || [], {
            chiefComplaint: currentCheckup.chiefComplaint || '',
            presentSymptoms: currentCheckup.presentSymptoms || '',
            diagnosis: currentCheckup.diagnosis || '',
            treatmentPlan: currentCheckup.treatmentPlan || '',
            doctorNotes: currentCheckup.doctorNotes || ''
          });
        } else {
          // For other fields (like status changes), use the status endpoint
          await updateCheckupStatus(checkupId, currentCheckup.status || 'in-progress', {
            ...currentCheckup
          });
        }
        
        console.log(`Successfully saved ${field} to server for checkup ${checkupId}`);
        
        // Clear the backup since it's now saved
        SecureCache.remove(backupKey);
        
      } catch (error) {
        console.error(`Failed to save ${field} for checkup ${checkupId}:`, error);
        // Don't modify UI state on save failure - user input is preserved
      }
    }, 2000); // Save 2 seconds after user stops typing
  };

  const handleAddPrescription = (checkupId) => {
    setSelectedCheckupForMedication(checkupId);
    setShowMedicationModal(true);
  };

  const handleSelectMedication = (medication, quantity) => {
    if (!selectedCheckupForMedication || !quantity || quantity <= 0) return;
    
    const newPrescription = {
      medication: medication.name,
      genericName: medication.genericName,
      dosage: medication.dosage,
      form: medication.form,
      strength: medication.strength,
      quantity: parseInt(quantity),
      instructions: medication.dosageInstructions || "Take as directed",
      medicationId: medication.id
    };
    
    setDoctorCheckupsData(prev => 
      prev.map(checkup => 
        checkup.id === selectedCheckupForMedication 
          ? { 
              ...checkup, 
              prescriptions: [...(checkup.prescriptions || []), newPrescription]
            }
          : checkup
      )
    );
    
    // Save to backend immediately
    const updatePrescriptions = async () => {
      try {
        const checkup = doctorCheckupsData.find(c => c.id === selectedCheckupForMedication);
        const updatedPrescriptions = [...(checkup?.prescriptions || []), newPrescription];
        await updateCheckupNotes(selectedCheckupForMedication, checkup?.notes || '', updatedPrescriptions, {
          chiefComplaint: checkup?.chiefComplaint || '',
          presentSymptoms: checkup?.presentSymptoms || '',
          diagnosis: checkup?.diagnosis || '',
          treatmentPlan: checkup?.treatmentPlan || '',
          doctorNotes: checkup?.doctorNotes || ''
        });
      } catch (error) {
        console.error('Failed to save prescription:', error);
      }
    };
    updatePrescriptions();
    
    setShowMedicationModal(false);
    setSelectedCheckupForMedication(null);
    setMedicationSearch('');
  };

  const handleAddMedicationToCheckup = (checkupId, medication, quantity, instructions = '') => {
    const newPrescription = {
      medication: medication.name,
      genericName: medication.genericName,
      dosage: medication.dosage,
      form: medication.form,
      strength: medication.strength,
      quantity: parseInt(quantity),
      instructions: instructions || medication.dosageInstructions || "Take as directed",
      medicationId: medication.id
    };
    
    setDoctorCheckupsData(prev => 
      prev.map(checkup => 
        checkup.id === checkupId 
          ? { 
              ...checkup, 
              prescriptions: [...(checkup.prescriptions || []), newPrescription]
            }
          : checkup
      )
    );
    
    // Close the medication panel after adding
    setSelectedCheckupForMedication(null);
    setShowPrescriptionForm(prev => ({
      ...prev,
      [checkupId]: false
    }));
  };

  const handleRemovePrescription = async (checkupId, prescriptionIndex) => {
    const checkup = doctorCheckupsData.find(c => c.id === checkupId);
    const updatedPrescriptions = checkup.prescriptions.filter((_, idx) => idx !== prescriptionIndex);
    
    setDoctorCheckupsData(prev => 
      prev.map(c => 
        c.id === checkupId 
          ? { ...c, prescriptions: updatedPrescriptions }
          : c
      )
    );
    
    try {
      await updateCheckupNotes(checkupId, checkup.notes, updatedPrescriptions, {
        chiefComplaint: checkup?.chiefComplaint || '',
        presentSymptoms: checkup?.presentSymptoms || '',
        diagnosis: checkup?.diagnosis || '',
        treatmentPlan: checkup?.treatmentPlan || '',
        doctorNotes: checkup?.doctorNotes || ''
      });
    } catch (error) {
      console.error('Failed to update prescriptions:', error);
    }
  };

  const handleViewPatientInfo = (checkup) => {
    // This will open the patient info modal
    setSelectedCheckup(checkup);
  };

  const handleViewVitalSigns = (checkup) => {
    // This will open the vital signs modal
    console.log('Viewing vital signs for:', checkup.patientName);
    setSelectedVitalSignsCheckup(checkup);
    setShowVitalSignsModal(true);
  };

  const handleViewDoctorNotes = (checkup) => {
    setSelectedCheckupNotes(checkup);
    setShowDoctorNotesModal(true);
  };

  const handleDiagnosisChange = (checkupId, diagnosisData) => {
    console.log('Updating diagnosis for checkup:', checkupId, diagnosisData);
    
    // Determine the main diagnosis from either primary or custom diagnosis
    const mainDiagnosis = diagnosisData.primaryDiagnosis || diagnosisData.customDiagnosis || '';
    
    // Update the checkup data immediately for UI responsiveness
    const checkupData = {
      primaryDiagnosis: diagnosisData.primaryDiagnosis,
      customDiagnosis: diagnosisData.customDiagnosis,
      severity: diagnosisData.severity,
      // Set the main diagnosis field that will be saved to database and used by analytics
      diagnosis: mainDiagnosis
    };
    
    console.log('🏥 Setting main diagnosis field to:', mainDiagnosis);
    
    // Update via the existing notes change handler
    Object.keys(checkupData).forEach(key => {
      handleNotesChange(checkupId, key, checkupData[key]);
    });
  };

  const handleRevealFinished = (checkupId) => {
    setRevealedFinished(prev => new Set([...prev, checkupId]));
  };

  const formatDuration = (startTime) => {
    if (!startTime) return 'N/A';
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now - start;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMins % 60}m`;
    }
    return `${diffMins}m`;
  };

  if (isInitialLoad) {
    return <LoadingSpinnerDoc message="Loading checkups..." />;
  }

  return (
    <div className="checkups-container">
      <div className="checkups-header">
        <div className="header-info">
          <h2>
            <i className="bi bi-clipboard-pulse"></i>
            Doctor Checkups
          </h2>
          <p className="checkups-subtitle">
            Manage active checkup sessions and review completed checkups
          </p>
        </div>
        
        {filterTab !== 'history' && (
          <div className="checkups-stats">
            <div className="stat-card ongoing">
              <div className="stat-number">
                {doctorCheckupsData.filter(c => c.status === 'in-progress' || c.status === 'started').length}
              </div>
              <div className="stat-label">Ongoing</div>
            </div>
            <div className="stat-card finished">
              <div className="stat-number">
                {doctorCheckupsData.filter(c => c.status === 'completed' || c.status === 'vaccination-completed').length}
              </div>
              <div className="stat-label">Finished</div>
            </div>
            <div className="stat-card total">
              <div className="stat-number">
                {doctorCheckupsData.length}
              </div>
              <div className="stat-label">Total</div>
            </div>
          </div>
        )}
      </div>

      <div className="checkups-filters">
        <div className="filter-buttons">
          {['ongoing', 'finished', 'history'].map(tab => (
            <button
              key={tab}
              className={`filter-btn ${filterTab === tab ? 'active' : ''}`}
              onClick={() => setFilterTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>

        {filterTab === 'finished' && (
          <div className="controls-row">
            <div className="search-filter">
              <label htmlFor="finishedSearch">Search patients:</label>
              <input
                id="finishedSearch"
                type="text"
                value={finishedSearchTerm}
                onChange={(e) => {
                  setFinishedSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page when searching
                }}
                placeholder="Search by name, ID, or family ID..."
                className="search-input"
              />
            </div>

            {totalPages > 1 && (
              <div className="pagination-controls">
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
                <span className="pagination-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            )}
          </div>
        )}

        {filterTab === 'history' && (
          <div className="controls-row">
            <div className="time-filter">
              <label htmlFor="timeFilter">Filter by:</label>
              <select 
                id="timeFilter"
                value={timeFilter} 
                onChange={(e) => setTimeFilter(e.target.value)}
                className="time-filter-select"
              >
                <option value="2days">Last 2 Days</option>
                <option value="2weeks">Last 2 Weeks</option>
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="all">All Time</option>
              </select>
            </div>

            {totalPages > 1 && (
              <div className="pagination-controls">
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="checkups-content">
        {(filterTab === 'history' ? paginatedCheckups : filteredCheckups).length === 0 ? (
          <div className="empty-checkups">
            <i className="bi bi-clipboard-x"></i>
            <h3>No checkups found</h3>
            <p>
              {filterTab === 'ongoing' 
                ? 'No ongoing checkups at the moment.'
                : filterTab === 'finished'
                ? 'No finished checkups found.'
                : 'No checkup history available.'
              }
            </p>
          </div>
        ) : filterTab === 'ongoing' ? (
          <div className="ongoing-checkups-container">
            {filteredCheckups.map((checkup, index) => (
              <div 
                key={checkup.id} 
                className="ongoing-checkup-wrapper"
              >
                <div className={`ongoing-checkup-card ${checkup.status}`}>
                  <div className="ongoing-card-number">
                    {index + 1}
                  </div>
                  
                  {/* Header - Patient name with status beside, details below */}
                  <div className="card-header">
                    <div className="patient-header-layout">
                      <div className="name-and-status">
                        <h4 className="patient-name">{checkup.patientName}</h4>
                        <div className="status-section">
                          {getStatusBadge(checkup.status)}
                        </div>
                      </div>
                      <div className="patient-details-row">
                        <span className="patient-detail">PT-{String(checkup.patientId || '').padStart(4, '0')}</span>
                        <span className="patient-detail">Fam: {checkup.familyId || 'N/A'}</span>
                        <span className="patient-detail">{checkup.age} years old</span>
                        <span className="patient-detail">{checkup.gender}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Content Area - Side by Side Layout like Treatment Record */}
                  <div className="card-content">
                    <div className="content-sections-row">
                      {/* Left Side - Chief Complaint & History */}
                      <div className="content-section">
                        <h6 className="section-title">
                          <i className="bi bi-chat-dots me-2"></i>
                          Chief Complaint & History
                        </h6>
                        
                        <div className="notes-section highlighted">
                          <label className="form-label">Chief Complaint</label>
                          <textarea
                            className="notes-textarea small"
                            placeholder="Patient's main concern or reason for visit..."
                            value={checkup.chiefComplaint || ''}
                            onChange={(e) => handleNotesChange(checkup.id, 'chiefComplaint', e.target.value)}
                            rows="3"
                          />
                        </div>
                        
                        <div className="notes-section highlighted">
                          <label className="form-label">Present Symptoms</label>
                          <textarea
                            className="notes-textarea small"
                            placeholder="Detailed description of symptoms, duration, severity..."
                            value={checkup.presentSymptoms || ''}
                            onChange={(e) => handleNotesChange(checkup.id, 'presentSymptoms', e.target.value)}
                            rows="4"
                          />
                        </div>
                      </div>
                      
                      {/* Right Side - Diagnosis & Treatment */}
                      <div className="content-section">
                        <h6 className="section-title">
                          <i className="bi bi-prescription2 me-2"></i>
                          Diagnosis & Treatment
                        </h6>
                        
                        <div className="notes-section highlighted">
                          <label className="form-label">Primary Diagnosis</label>
                          <DiagnosisSelector
                            checkupId={checkup.id}
                            selectedDiagnosis={checkup.primaryDiagnosis || ''}
                            customDiagnosis={checkup.customDiagnosis || ''}
                            severity={checkup.severity || 'mild'}
                            onChange={(diagnosisData) => handleDiagnosisChange(checkup.id, diagnosisData)}
                          />
                        </div>
                        
                        <div className="notes-section highlighted">
                          <label className="form-label">Clinical Notes</label>
                          <textarea
                            className="notes-textarea small"
                            placeholder="Additional diagnosis details, observations, differential diagnosis..."
                            value={checkup.diagnosis || ''}
                            onChange={(e) => handleNotesChange(checkup.id, 'diagnosis', e.target.value)}
                            rows="2"
                          />
                        </div>
                        
                        <div className="notes-section highlighted">
                          <label className="form-label">Treatment Plan</label>
                          <textarea
                            className="notes-textarea small"
                            placeholder="Treatment procedures, interventions planned..."
                            value={checkup.treatmentPlan || ''}
                            onChange={(e) => handleNotesChange(checkup.id, 'treatmentPlan', e.target.value)}
                            rows="3"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Prescription Section - Full Width */}
                    <div className="prescription-section-full">
                      <div className="prescription-header">
                        <h6 className="section-title">
                          <i className="bi bi-prescription2 me-2"></i>
                          Prescriptions
                          {(checkup.prescriptions || []).length > 0 && (
                            <span className="prescription-count">({checkup.prescriptions.length})</span>
                          )}
                        </h6>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            const isCurrentlyOpen = showPrescriptionForm[checkup.id];
                            setShowPrescriptionForm({
                              ...showPrescriptionForm,
                              [checkup.id]: !isCurrentlyOpen
                            });
                            if (!isCurrentlyOpen) {
                              setSelectedCheckupForMedication(checkup.id);
                            } else {
                              setSelectedCheckupForMedication(null);
                            }
                          }}
                        >
                          <i className="bi bi-plus-circle me-1"></i>
                          {showPrescriptionForm[checkup.id] ? 'Hide Prescriptions' : 'Add Prescription'}
                        </button>
                      </div>
                      
                      {/* Prescriptions Grid */}
                      <div className="prescriptions-grid">
                        {(checkup.prescriptions || []).length > 0 ? (
                          checkup.prescriptions.map((prescription, idx) => (
                            <div key={idx} className="prescription-card">
                              <div className="prescription-header-card">
                                <strong className="medication-name">{prescription.medication}</strong>
                                <button 
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleRemovePrescription(checkup.id, idx)}
                                  title="Remove prescription"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                              <div className="prescription-details">
                                <div className="detail-item">
                                  <span className="detail-label">Quantity:</span>
                                  <span className="detail-value">{prescription.quantity}</span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">Instructions:</span>
                                  <span className="detail-value">{prescription.instructions}</span>
                                </div>
                                {prescription.genericName && (
                                  <div className="detail-item">
                                    <span className="detail-label">Generic:</span>
                                    <span className="detail-value">{prescription.genericName}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="no-prescriptions-placeholder">
                            <i className="bi bi-prescription2"></i>
                            <p>No prescriptions added yet. Click "Add Prescription" to get started.</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Medication selection prompt when form is open */}
                      {showPrescriptionForm[checkup.id] && (
                        <div className="medication-selection-prompt">
                          <div className="prompt-content">
                            <i className="bi bi-arrow-right-circle me-2"></i>
                            <span>Select a medication from the panel on the right to add to prescription</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Bottom Full Width - Doctor's Notes */}
                    <div className="doctor-notes-section">
                      <h6 className="section-title">
                        <i className="bi bi-journal-text me-2"></i>
                        Doctor's Additional Notes
                      </h6>
                      <div className="notes-section highlighted">
                        <textarea
                          className="notes-textarea full-width"
                          placeholder="Additional clinical notes, observations, or instructions..."
                          value={checkup.doctorNotes || ''}
                          onChange={(e) => handleNotesChange(checkup.id, 'doctorNotes', e.target.value)}
                          rows="3"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Footer Actions */}
                  <div className="card-actions">
                    <div className="action-buttons">
                      <button
                        className="btn btn-warning"
                        onClick={() => handleViewVitalSigns(checkup)}
                        title="View vital signs from admin examination"
                      >
                        <i className="bi bi-heart-pulse"></i>
                        Vital Signs
                      </button>
                      <button
                        className="btn btn-success"
                        onClick={() => handleCompleteCheckup(checkup.id)}
                        disabled={isProcessing || (!checkup.chiefComplaint && !checkup.diagnosis && (!checkup.prescriptions || checkup.prescriptions.length === 0))}
                        title={(!checkup.chiefComplaint && !checkup.diagnosis && (!checkup.prescriptions || checkup.prescriptions.length === 0)) ? "Please add chief complaint, diagnosis, or prescriptions before finishing" : "Complete checkup"}
                      >
                        <i className="bi bi-check-circle"></i>
                        Finished
                      </button>
                    </div>
                  </div>
                </div>

                {/* Medication Selection Panel - Always beside the card */}
                <div className="medication-selection-panel">
                  <div className="medication-panel-header">
                    <h5>
                      <i className="bi bi-capsule"></i>
                      Add Medications
                    </h5>
                    <button 
                      className="medication-close-btn"
                      onClick={() => {
                        setSelectedCheckupForMedication(null);
                        setShowPrescriptionForm({
                          ...showPrescriptionForm,
                          [checkup.id]: false
                        });
                      }}
                      title="Close medication panel"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>

                  {/* Transparent banner when Add Prescription not clicked */}
                  {!showPrescriptionForm[checkup.id] && (
                    <div className="prescription-inactive-banner">
                      <div className="prescription-inactive-content">
                        <i className="bi bi-info-circle"></i>
                        <p>The "Add Prescription" button is not yet clicked</p>
                        <small>Click the button in the prescription section to activate</small>
                      </div>
                    </div>
                  )}

                  {/* Active medication form - only show when prescription form is active */}
                  {showPrescriptionForm[checkup.id] && (
                    <>
                      <div className="search-box">
                        <input
                          type="text"
                          placeholder="Search medications..."
                          value={medicationSearch}
                          onChange={(e) => setMedicationSearch(e.target.value)}
                          className="form-control form-control-sm"
                        />
                        <i className="bi bi-search search-icon"></i>
                      </div>

                      <div className="medications-list">
                        {loadingMedications ? (
                          <div className="loading-medications">
                            <i className="bi bi-hourglass-split"></i>
                            Loading medications...
                          </div>
                        ) : filteredMedications.length === 0 ? (
                          <div className="no-medications">
                            <i className="bi bi-exclamation-circle"></i>
                            {medicationSearch ? 'No medications found' : 'No medications available'}
                          </div>
                        ) : (
                          filteredMedications.map(medication => (
                            <MedicationItem
                              key={medication.id}
                              medication={medication}
                              onSelect={(med, quantity, instructions) => 
                                handleAddMedicationToCheckup(checkup.id, med, quantity, instructions)
                              }
                            />
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : filterTab === 'finished' ? (
          /* Finished - Same format as ongoing but read-only with spoiler */
          <div className="checkups-grid finished-grid">
            {paginatedCheckups.map((checkup, index) => {
              const isRevealed = revealedFinished.has(checkup.id);
              return (
                <div 
                  key={checkup.id} 
                  className="checkup-row"
                >
                  <div className={`checkup-card finished ${checkup.status}`}>
                    <div className="checkup-number">
                      {(currentPage - 1) * currentItemsPerPage + index + 1}
                    </div>
                    
                    {/* Read-only banner */}
                    <div className="read-only-banner">
                      <i className="bi bi-eye-slash me-2"></i>
                      <span>Read-Only</span>
                    </div>
                    
                    {/* Header - Patient name with status beside, details below */}
                    <div className="patient-header-layout">
                      <div className="name-and-status">
                        <h4 className="patient-name">{checkup.patientName}</h4>
                        <div className="status-badge-container">
                          {getStatusBadge(checkup.status)}
                        </div>
                      </div>
                      <div className="patient-details-row">
                        <div className="patient-detail">
                          <i className="bi bi-person-badge"></i>
                          <span>ID: {checkup.patientId}</span>
                        </div>
                        <div className="patient-detail">
                          <i className="bi bi-people"></i>
                          <span>Fam: {checkup.familyId || 'N/A'}</span>
                        </div>
                        <div className="patient-detail">
                          <i className="bi bi-calendar3"></i>
                          <span>{checkup.age}y / {checkup.gender}</span>
                        </div>
                        <div className="patient-detail">
                          <i className="bi bi-telephone"></i>
                          <span>{checkup.contactNumber}</span>
                        </div>
                        <div className="patient-detail">
                          <i className="bi bi-clock"></i>
                          <span>Completed: {new Date(checkup.completedAt || checkup.updatedAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Content - Either blurred with spoiler button or revealed */}
                    <div className={`content-sections-row ${!isRevealed ? 'spoiler-blurred' : ''}`}>
                      {!isRevealed && (
                        <div className="spoiler-overlay">
                          <button 
                            className="spoiler-reveal-btn"
                            onClick={() => handleRevealFinished(checkup.id)}
                          >
                            <i className="bi bi-eye"></i>
                            <span>Reveal Details</span>
                          </button>
                        </div>
                      )}
                      
                      <div className="content-section left">
                        <div className="section-card">
                          <h6 className="section-title">
                            <i className="bi bi-chat-square-text me-2"></i>
                            Chief Complaint & History
                          </h6>
                          <div className="content-grid">
                            <div className="content-item">
                              <label className="content-label">Chief Complaint</label>
                              <div className="content-display readonly">
                                {checkup.chiefComplaint || 'No chief complaint recorded.'}
                              </div>
                            </div>
                            <div className="content-item">
                              <label className="content-label">Present Symptoms</label>
                              <div className="content-display readonly">
                                {checkup.presentSymptoms || 'No symptoms recorded.'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="content-section right">
                        <div className="section-card">
                          <h6 className="section-title">
                            <i className="bi bi-clipboard-plus me-2"></i>
                            Diagnosis & Treatment
                          </h6>
                          <div className="content-grid">
                            <div className="content-item">
                              <label className="content-label">Diagnosis Notes</label>
                              <div className="content-display readonly">
                                {checkup.diagnosis || 'No diagnosis recorded.'}
                              </div>
                            </div>
                            <div className="content-item">
                              <label className="content-label">Treatment Plan</label>
                              <div className="content-display readonly">
                                {checkup.treatmentPlan || 'No treatment plan recorded.'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Prescription Section - Full Width */}
                    <div className={`prescription-section-full readonly ${!isRevealed ? 'spoiler-blurred' : ''}`}>
                      <div className="prescription-header">
                        <h6 className="section-title">
                          <i className="bi bi-prescription2 me-2"></i>
                          Prescriptions
                          {(checkup.prescriptions || []).length > 0 && (
                            <span className="prescription-count">{checkup.prescriptions.length}</span>
                          )}
                        </h6>
                        <button
                          className="doctor-notes-btn"
                          onClick={() => handleViewDoctorNotes(checkup)}
                          title="View Doctor's Notes"
                        >
                          <i className="bi bi-journal-medical"></i>
                          Doctor's Notes
                        </button>
                      </div>
                      
                      <div className="prescriptions-grid">
                        {(checkup.prescriptions || []).length > 0 ? (
                          checkup.prescriptions.map((prescription, idx) => (
                            <div key={idx} className="prescription-card readonly">
                              <div className="prescription-header-card">
                                <span className="medication-name">{prescription.medication}</span>
                              </div>
                              <div className="prescription-details">
                                <div className="detail-item">
                                  <span className="detail-label">Quantity:</span>
                                  <span className="detail-value">{prescription.quantity}</span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">Instructions:</span>
                                  <span className="detail-value">{prescription.instructions}</span>
                                </div>
                                {prescription.genericName && (
                                  <div className="detail-item">
                                    <span className="detail-label">Generic:</span>
                                    <span className="detail-value">{prescription.genericName}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="no-prescriptions-placeholder">
                            <i className="bi bi-prescription2"></i>
                            <p>No prescriptions were prescribed for this checkup.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* History - Grouped by Patient with Multiple Checkups */
          <div className="history-layout">
            <div className="history-list">
              {paginatedData.map((patientGroup) => (
                <div key={`${patientGroup.patientId}-${patientGroup.patientName}`} className="history-patient-group">
                  <div 
                    className="history-patient-header"
                    onClick={() => {
                      const newKey = `patient-${patientGroup.patientId}`;
                      setActiveKey(activeKey === newKey ? null : newKey);
                    }}
                  >
                    <div className="patient-info-row">
                      <span className="patient-name">{patientGroup.patientName}</span>
                      <span className="patient-id">ID: {patientGroup.patientId}</span>
                      <span className="family-id">Fam: {patientGroup.familyId || 'N/A'}</span>
                      <span className="age-gender">{patientGroup.age}y / {patientGroup.gender}</span>
                      <span className="checkup-count">{patientGroup.checkups.length} checkup{patientGroup.checkups.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className="expand-icon">
                      <i className={`bi ${activeKey === `patient-${patientGroup.patientId}` ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                    </div>
                  </div>
                  
                  {activeKey === `patient-${patientGroup.patientId}` && (
                    <div className="patient-checkups-list">
                      {patientGroup.checkups.map((checkup, index) => (
                        <div key={checkup.id} className="history-checkup-item">
                          <div className="checkup-header">
                            <div className="checkup-info">
                              <span className="checkup-number">#{index + 1}</span>
                              <span className="checkup-date">
                                {new Date(checkup.completedAt || checkup.updatedAt).toLocaleDateString()}
                              </span>
                              <span className="checkup-time">
                                {new Date(checkup.completedAt || checkup.updatedAt).toLocaleTimeString()}
                              </span>
                              <span className="service-type">{checkup.serviceType}</span>
                            </div>
                          </div>
                          
                          <div className="content-row">
                            <div className="chief-complaint-section">
                              <label className="section-label">
                                <i className="bi bi-chat-square-text text-primary"></i>
                                Chief Complaint
                              </label>
                              <div className="content-display readonly">
                                {checkup.chiefComplaint || 'No chief complaint recorded.'}
                              </div>
                            </div>

                            <div className="diagnosis-section">
                              <label className="section-label">
                                <i className="bi bi-clipboard-pulse text-success"></i>
                                Diagnosis & Treatment
                              </label>
                              <div className="content-display readonly">
                                <strong>Diagnosis:</strong> {checkup.diagnosis || 'No diagnosis recorded.'}<br/>
                                <strong>Treatment:</strong> {checkup.treatmentPlan || 'No treatment plan recorded.'}
                              </div>
                            </div>
                          </div>

                          <div className="content-row">
                            <div className="symptoms-section">
                              <label className="section-label">
                                <i className="bi bi-thermometer text-warning"></i>
                                Present Symptoms
                              </label>
                              <div className="content-display readonly">
                                {checkup.presentSymptoms || 'No symptoms recorded.'}
                              </div>
                              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                                <button
                                  className="doctor-notes-btn"
                                  onClick={() => handleViewDoctorNotes(checkup)}
                                  title="View Doctor's Notes"
                                >
                                  <i className="bi bi-journal-medical"></i>
                                  Doctor's Notes
                                </button>
                              </div>
                            </div>
                            
                            <div className="prescription-section">
                              <label className="section-label">
                                <i className="bi bi-prescription2"></i>
                                Prescriptions {(checkup.prescriptions || []).length > 0 && `(${checkup.prescriptions.length})`}
                              </label>
                              <div className="prescriptions-list">
                                {(checkup.prescriptions || []).length > 0 ? (
                                  checkup.prescriptions.map((prescription, idx) => (
                                    <div key={idx} className="prescription-item read-only">
                                      <div className="prescription-header-card">
                                        <strong className="medication-name">{prescription.medication}</strong>
                                      </div>
                                      <div className="prescription-details">
                                        <div className="detail-item">
                                          <span className="detail-label">Quantity:</span>
                                          <span className="detail-value">{prescription.quantity}</span>
                                        </div>
                                        <div className="detail-item">
                                          <span className="detail-label">Instructions:</span>
                                          <span className="detail-value">{prescription.instructions}</span>
                                        </div>
                                        {prescription.genericName && (
                                          <div className="detail-item">
                                            <span className="detail-label">Generic:</span>
                                            <span className="detail-value">{prescription.genericName}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="no-prescriptions">No prescriptions were added.</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="history-stats-sidebar">
              <div className="stats-card enhanced">
                <h4>
                  <i className="bi bi-graph-up"></i>
                  Summary
                </h4>
                <div className="stat-item">
                  <span className="stat-label">Today</span>
                  <span className="stat-value">{getHistoryStats().today}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">This Week</span>
                  <span className="stat-value">{getHistoryStats().thisWeek}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">This Month</span>
                  <span className="stat-value">{getHistoryStats().thisMonth}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Completed</span>
                  <span className="stat-value">{getHistoryStats().total}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">With Prescriptions</span>
                  <span className="stat-value">{getHistoryStats().withPrescriptions}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Avg. Duration</span>
                  <span className="stat-value">{getHistoryStats().avgTime} min</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Showing</span>
                  <span className="stat-value">{timeFilter === 'all' ? 'All' : timeFilter === '2days' ? '2 Days' : timeFilter === '2weeks' ? '2 Weeks' : timeFilter === '3months' ? '3 Months' : '6 Months'}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Results</span>
                  <span className="stat-value">{filteredCheckups.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Medication Selection Modal */}
      {showMedicationModal && (
        <div className="modal-overlay" onClick={() => setShowMedicationModal(false)}>
          <div className="modal-content modal-large medication-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Select Medication</h3>
              <button 
                className="close-btn" 
                onClick={() => setShowMedicationModal(false)}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="medication-search-section">
                <div className="search-box">
                  <i className="bi bi-search"></i>
                  <input
                    type="text"
                    placeholder="Search medications by name, generic name, or brand..."
                    value={medicationSearch}
                    onChange={(e) => setMedicationSearch(e.target.value)}
                    className="medication-search-input"
                  />
                </div>
              </div>
              
              <div className="medication-list">
                {availableMedications
                  .filter(med => 
                    medicationSearch.length < 2 || 
                    med.name.toLowerCase().includes(medicationSearch.toLowerCase()) ||
                    med.genericName?.toLowerCase().includes(medicationSearch.toLowerCase()) ||
                    med.brandName?.toLowerCase().includes(medicationSearch.toLowerCase())
                  )
                  .slice(0, 20)
                  .map(medication => (
                    <MedicationItem 
                      key={medication.id} 
                      medication={medication} 
                      onSelect={handleSelectMedication}
                    />
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Checkup Details Modal */}
      {selectedCheckup && (
        <div className="modal-overlay" onClick={() => setSelectedCheckup(null)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Checkup Details</h3>
              <button 
                className="close-btn" 
                onClick={() => setSelectedCheckup(null)}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="checkup-details-modal">
                <div className="detail-section">
                  <h4>Patient Information</h4>
                  <div className="detail-row">
                    <strong>Name:</strong> {selectedCheckup.patientName}
                  </div>
                  <div className="detail-row">
                    <strong>Patient ID:</strong> {selectedCheckup.patientId}
                  </div>
                  <div className="detail-row">
                    <strong>Age/Gender:</strong> {selectedCheckup.age} / {selectedCheckup.gender}
                  </div>
                  <div className="detail-row">
                    <strong>Contact:</strong> {selectedCheckup.contactNumber}
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Checkup Information</h4>
                  <div className="detail-row">
                    <strong>Service Type:</strong> {selectedCheckup.serviceType}
                  </div>
                  <div className="detail-row">
                    <strong>Priority:</strong> {selectedCheckup.priority}
                  </div>
                  <div className="detail-row">
                    <strong>Status:</strong> {getStatusBadge(selectedCheckup.status)}
                  </div>
                  <div className="detail-row">
                    <strong>Started At:</strong> {selectedCheckup.startedAt ? new Date(selectedCheckup.startedAt).toLocaleString() : 'N/A'}
                  </div>
                  {selectedCheckup.completedAt && (
                    <div className="detail-row">
                      <strong>Completed At:</strong> {new Date(selectedCheckup.completedAt).toLocaleString()}
                    </div>
                  )}
                  {selectedCheckup.startedAt && (
                    <div className="detail-row">
                      <strong>Duration:</strong> {formatDuration(selectedCheckup.startedAt)}
                    </div>
                  )}
                </div>

                {selectedCheckup.notes && (
                  <div className="detail-section">
                    <h4>Notes</h4>
                    <div className="detail-row">
                      <p>{selectedCheckup.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setSelectedCheckup(null)}
              >
                Close
              </button>
              {(selectedCheckup.status === 'in-progress' || selectedCheckup.status === 'started') && (
                <button
                  className="btn btn-success"
                  onClick={() => {
                    handleCompleteCheckup(selectedCheckup.id);
                    setSelectedCheckup(null);
                  }}
                  disabled={isProcessing}
                >
                  <i className="bi bi-check-circle"></i>
                  Complete Checkup
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Doctor Notes Modal */}
      {showDoctorNotesModal && selectedCheckupNotes && (
        <div className="doctor-notes-modal-overlay" onClick={() => setShowDoctorNotesModal(false)}>
          <div className="modal-content doctor-notes-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <i className="bi bi-journal-medical me-2"></i>
                Doctor's Notes - {selectedCheckupNotes.patientName}
              </h3>
              <button
                className="close-btn"
                onClick={() => setShowDoctorNotesModal(false)}
                aria-label="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="modal-body">
              {selectedCheckupNotes.doctorNotes ? (
                <div className="doctor-notes-content">
                  {selectedCheckupNotes.doctorNotes}
                </div>
              ) : (
                <div className="doctor-notes-empty">
                  <i className="bi bi-journal-x" style={{ fontSize: '2rem', marginBottom: '10px', display: 'block' }}></i>
                  No doctor's notes were recorded for this checkup.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vital Signs Modal */}
      {showVitalSignsModal && selectedVitalSignsCheckup && (
        <VitalSignsModal
          show={showVitalSignsModal}
          onHide={() => {
            setShowVitalSignsModal(false);
            setSelectedVitalSignsCheckup(null);
          }}
          patient={{
            id: selectedVitalSignsCheckup.patientId,
            patientName: selectedVitalSignsCheckup.patientName,
            firstName: selectedVitalSignsCheckup.patientName?.split(' ')[0] || '',
            lastName: selectedVitalSignsCheckup.patientName?.split(' ').slice(1).join(' ') || ''
          }}
          isReadOnly={true}
          initialData={selectedVitalSignsCheckup.vitalSigns || {}}
          onViewHistory={() => {
            console.log('View vital signs history for patient:', selectedVitalSignsCheckup.patientId);
          }}
          onEdit={() => {
            console.log('Edit vital signs for patient:', selectedVitalSignsCheckup.patientId);
          }}
        />
      )}
    </div>
  );
};

export default Checkups;

/* Additional CSS for Patient Grouping in History */
const styles = `
.history-patient-group {
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 16px;
  background: #f8f9fa;
}

.history-patient-header {
  padding: 16px;
  background: #fff;
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid #eee;
}

.history-patient-header:hover {
  background: #f5f5f5;
}

.history-patient-header .patient-info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.history-patient-header .checkup-count {
  margin-left: auto;
  background: #007bff;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85em;
  font-weight: 500;
}

.patient-checkups-list {
  padding: 0 16px 16px;
}

.history-checkup-item {
  background: white;
  border: 1px solid #eee;
  border-radius: 6px;
  margin-bottom: 12px;
  padding: 16px;
}

.checkup-header {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 12px;
  margin-bottom: 16px;
}

.checkup-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.checkup-number {
  background: #28a745;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.9em;
}

.checkup-date, .checkup-time {
  color: #666;
  font-size: 0.95em;
}

.service-type {
  background: #17a2b8;
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85em;
}
`;

// Inject styles if not already present
if (!document.querySelector('#checkups-patient-grouping-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'checkups-patient-grouping-styles';
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}
