import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, Table, Modal, Form, Row, Col, Badge, InputGroup, Tab, Tabs, Alert } from 'react-bootstrap';
import { useData } from '../../../context/DataContext';
import { useCheckups } from '../../../hooks/useCheckups'; // Import the new hook
import { useVitalSignsHistory, useRecordVitalSigns } from '../../../hooks/useVitalSigns'; // Import vital signs hooks
import api from '../../../services/api'; // Import the new API service
import LoadingSpinner from './LoadingSpinner';
import VitalSignsModal from '../../VitalSignsModal';
import VaccinationModal from '../../VaccinationModal';
import DoctorPicker from '../../common/DoctorPicker';
import { doctorSessionService } from '../../../services/doctorSessionService';
import './styles/CheckupManager.css';
import '../../../styles/CheckupTableStyles.css';
import '../../../styles/VitalSignsModal.css';

const CheckupManager = () => {
  const { 
    patientsData, 
    sharedCheckupsData, 
    syncCheckupStatus,
    simulationModeStatus,
    doctorQueueData,
    updateDoctorQueueStatus,
    addToQueue,
    refreshDoctorQueue,
    refreshTodaysCheckups
  } = useData();

  // Use the new hooks to fetch data and mutations
  const { data: todaysCheckups, isLoading: loading, error, refetch } = useCheckups();
  const recordVitalSignsMutation = useRecordVitalSigns();

  // State management
  const [filteredCheckups, setFilteredCheckups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [doctorQueueSearch, setDoctorQueueSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('today');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  // Modal states
  const [showVitalSignsModal, setShowVitalSignsModal] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  // Vital signs form with normal ranges as placeholders
  const [vitalSigns, setVitalSigns] = useState({
    temperature: '',
    temperatureUnit: 'celsius',
    heartRate: '',
    systolicBP: '',
    diastolicBP: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    weight: '',
    weightUnit: 'kg',
    height: '',
    heightUnit: 'cm',
    clinicalNotes: ''
  });

  // Vital signs normal ranges for placeholders
  const normalRanges = {
    temperature: {
      celsius: '36.1-37.2',
      fahrenheit: '97-99'
    },
    heartRate: '60-100',
    respiratoryRate: '12-20',
    oxygenSaturation: '95-100',
    systolicBP: '90-120',
    diastolicBP: '60-80'
  };

  // Modal states for vital signs
  const [isVitalSignsReadOnly, setIsVitalSignsReadOnly] = useState(false);
  const [showVitalSignsHistory, setShowVitalSignsHistory] = useState(false);
  const [vitalSignsHistory, setVitalSignsHistory] = useState([]);
  const [vitalSignsHistoryPatientId, setVitalSignsHistoryPatientId] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState('');
  
  // Vaccination modal state
  const [showVaccinationModal, setShowVaccinationModal] = useState(false);
  const [vaccinatedTodayPatients, setVaccinatedTodayPatients] = useState(new Set()); // Track patients vaccinated today
  
  // Doctor selection states
  const [selectedDoctors, setSelectedDoctors] = useState({}); // Maps checkup.id -> selected doctor
  const [onlineDoctors, setOnlineDoctors] = useState([]);

  // Use vital signs history hook conditionally
  const { 
    data: vitalSignsHistoryData, 
    isLoading: vitalSignsHistoryLoading, 
    error: vitalSignsHistoryError 
  } = useVitalSignsHistory(vitalSignsHistoryPatientId);

  // Alert state for notifications
  const [alert, setAlert] = useState(null);

  // Patient management states
  // Patient database states removed as requested
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const [selectedForRemoval, setSelectedForRemoval] = useState([]);
  const [showRemoveConfirmation, setShowRemoveConfirmation] = useState(false);
  const [removeCountdown, setRemoveCountdown] = useState(5);

  // Add patient form
  const [addPatientForm, setAddPatientForm] = useState({
    patientId: '',
    serviceType: '', // Empty by default - admin will select based on schedule
    priority: 'Normal',
    notes: '',
    isEmergency: false
  });

  // Service schedule for the week
  const serviceSchedule = {
    'monday': {
      morning: ['general-checkup', 'blood-pressure', 'vaccination'],
      afternoon: ['prenatal-checkup', 'consultation', 'follow-up', 'vaccination']
    },
    'tuesday': {
      morning: ['pediatric-checkup', 'blood-pressure', 'vaccination'],
      afternoon: ['general-checkup', 'consultation', 'follow-up']
    },
    'wednesday': {
      morning: ['general-checkup', 'blood-pressure', 'prenatal-checkup', 'vaccination'],
      afternoon: ['vaccination', 'pediatric-checkup', 'follow-up']
    },
    'thursday': {
      morning: ['general-checkup', 'consultation', 'follow-up'],
      afternoon: ['blood-pressure', 'prenatal-checkup']
    },
    'friday': {
      morning: ['pediatric-checkup', 'blood-pressure', 'vaccination'],
      afternoon: ['general-checkup', 'consultation', 'follow-up', 'vaccination']
    }
  };

  // Emergency is always available
  const alwaysAvailableServices = ['emergency'];

  // Service types definition
  const allServiceTypes = [
    { value: 'general-checkup', label: 'General Checkup' },
    { value: 'blood-pressure', label: 'Blood Pressure Check' },
    { value: 'vaccination', label: 'Vaccination' },
    { value: 'pediatric-checkup', label: 'Pediatric Checkup' },
    { value: 'consultation', label: 'Doctor Consultation' },
    { value: 'follow-up', label: 'Follow-up Visit' },
    { value: 'emergency', label: 'Emergency' }
  ];
  
  // Filter service types based on current day and time
  const getAvailableServiceTypes = () => {
    const now = new Date();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const hour = now.getHours();
    const timeOfDay = hour < 12 ? 'morning' : 'afternoon';
    
    // Check if it's a weekend
    if (dayOfWeek === 'saturday' || dayOfWeek === 'sunday') {
      // Only emergency services on weekends
      return allServiceTypes.filter(service => 
        alwaysAvailableServices.includes(service.value)
      );
    }
    
    // Get the scheduled services for the current day and time
    const scheduledServices = serviceSchedule[dayOfWeek]?.[timeOfDay] || [];
    
    // Filter service types based on schedule
    return allServiceTypes.filter(service => 
      scheduledServices.includes(service.value) || 
      alwaysAvailableServices.includes(service.value)
    );
  };
  
  // Get filtered service types based on current schedule
  const serviceTypes = getAvailableServiceTypes();

  // Helper function to get service type label from value
  const getServiceTypeLabel = (serviceTypeValue) => {
    const service = allServiceTypes.find(s => s.value === serviceTypeValue);
    return service ? service.label : serviceTypeValue;
  };

  // Get current date for display
  const getCurrentDate = () => {
    if (simulationModeStatus?.enabled && simulationModeStatus?.currentSimulatedDate) {
      return new Date(simulationModeStatus.currentSimulatedDate);
    }
    return new Date();
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Unit conversion functions
  const convertTemperature = (temp, fromUnit, toUnit) => {
    if (fromUnit === toUnit) return temp;
    if (fromUnit === 'celsius' && toUnit === 'fahrenheit') {
      return ((parseFloat(temp) * 9/5) + 32).toFixed(1);
    }
    if (fromUnit === 'fahrenheit' && toUnit === 'celsius') {
      return ((parseFloat(temp) - 32) * 5/9).toFixed(1);
    }
    return temp;
  };

  const convertWeight = (weight, fromUnit, toUnit) => {
    if (fromUnit === toUnit) return weight;
    if (fromUnit === 'kg' && toUnit === 'lbs') {
      return (parseFloat(weight) * 2.20462).toFixed(1);
    }
    if (fromUnit === 'lbs' && toUnit === 'kg') {
      return (parseFloat(weight) / 2.20462).toFixed(1);
    }
    return weight;
  };

  const convertHeight = (height, fromUnit, toUnit) => {
    if (fromUnit === toUnit) return height;
    if (fromUnit === 'cm' && toUnit === 'ft') {
      const totalInches = parseFloat(height) / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = (totalInches % 12).toFixed(1);
      return `${feet}'${inches}"`;
    }
    if (fromUnit === 'ft' && toUnit === 'cm') {
      // Assuming format like "5'8"" or "5.67"
      let totalInches;
      if (height.includes("'")) {
        const parts = height.split("'");
        const feet = parseInt(parts[0]);
        const inches = parseFloat(parts[1].replace('"', ''));
        totalInches = feet * 12 + inches;
      } else {
        totalInches = parseFloat(height) * 12;
      }
      return (totalInches * 2.54).toFixed(1);
    }
    return height;
  };

  // Function to load last vital signs for a patient
  const loadLastVitalSigns = async (patientId) => {
    try {
      // Use the vital signs history hook data if available, or fetch it manually
      const response = await api.get(`/api/checkups/vital-signs/history/${patientId}`);
      console.log('loadLastVitalSigns response:', response.data);
      
      let history = [];
      if (response.data && response.data.vitalSigns && Array.isArray(response.data.vitalSigns)) {
        // Backend returns { vitalSigns: [], pagination: {} }
        history = response.data.vitalSigns;
      } else if (Array.isArray(response.data)) {
        // Backend returns array directly
        history = response.data;
      }
      
      if (history && history.length > 0) {
        const lastVitals = history[0]; // Assuming sorted by date desc
        console.log('Found last vitals:', lastVitals);
        return {
          height: lastVitals.height || '',
          heightUnit: lastVitals.heightUnit || 'cm',
          weight: lastVitals.weight || '',
          weightUnit: lastVitals.weightUnit || 'kg'
        };
      }
    } catch (error) {
      console.warn('Could not load vital signs history:', error);
    }
    return null;
  };

  // Load today's vaccinated patients
  const loadTodaysVaccinations = async () => {
    try {
      const authData = JSON.parse(sessionStorage.getItem('authData') || '{}');
      const authToken = authData.token || window.__authToken;
      
      if (!authToken) return;
      
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${baseURL}/api/vaccinations/today`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.ok) {
        const vaccinationsToday = await response.json();
        const patientIds = new Set(vaccinationsToday.map(v => v.patientId));
        setVaccinatedTodayPatients(patientIds);
      }
    } catch (error) {
      console.log('Could not load today\'s vaccinations:', error);
    }
  };

  // Load today's checkups and vaccination status on component mount
  useEffect(() => {
    // The useCheckups hook now handles data fetching, so we can remove the manual fetch.
    // We still might want to expose a refresh function if needed.
    window.refreshTodaysCheckups = () => {
      // This would be handled by refetching the query
      // For now, we can leave this as a placeholder
    };
    
    // Load today's vaccinated patients
    loadTodaysVaccinations();
    
    return () => {
      delete window.refreshTodaysCheckups;
    };
  }, []);

  // Filter checkups when search term or status filter changes
  useEffect(() => {
    if (todaysCheckups) {
      filterCheckups();
    }
  }, [todaysCheckups, searchTerm, statusFilter]);

  // Reset pagination when search term or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const filterCheckups = () => {
    let filtered = todaysCheckups || [];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(checkup =>
        checkup.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        checkup.patientId.toString().includes(searchTerm.toLowerCase()) ||
        checkup.serviceType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(checkup => {
        switch (statusFilter) {
          case 'checked-in':
            return checkup.status === 'checked-in';
          case 'vitals-recorded':
            return checkup.status === 'vitals-recorded';
          case 'doctor-notified':
            return checkup.status === 'doctor-notified';
          case 'in-progress':
            return checkup.status === 'in-progress';
          case 'completed':
            return checkup.status === 'completed' || checkup.status === 'vaccination-completed';
          default:
            return true;
        }
      });
    }

    setFilteredCheckups(filtered);
  };

  // Calculate pagination values
  const totalPages = Math.ceil(filteredCheckups.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCheckups = filteredCheckups.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleVitalSigns = async (patient) => {
    console.log('handleVitalSigns called with patient:', patient);
    setSelectedPatient(patient);
    
    try {
      // Check if patient has meaningful vital signs data (not just empty strings)
      const hasRealVitalSigns = patient.vitalSignsCollected && patient.vitalSigns && 
        Object.values(patient.vitalSigns).some(value => 
          value && value !== '' && value !== null && value !== undefined
        );
      
      if (hasRealVitalSigns) {
        console.log('Patient has existing vital signs with actual data:', patient.vitalSigns);
        const existingVitalSigns = {
          temperature: patient.vitalSigns.temperature || '',
          temperatureUnit: patient.vitalSigns.temperatureUnit || 'celsius',
          heartRate: patient.vitalSigns.heartRate || '',
          systolicBP: patient.vitalSigns.systolicBP || '',
          diastolicBP: patient.vitalSigns.diastolicBP || '',
          respiratoryRate: patient.vitalSigns.respiratoryRate || '',
          oxygenSaturation: patient.vitalSigns.oxygenSaturation || '',
          weight: patient.vitalSigns.weight || '',
          weightUnit: patient.vitalSigns.weightUnit || 'kg',
          height: patient.vitalSigns.height || '',
          heightUnit: patient.vitalSigns.heightUnit || 'cm',
          clinicalNotes: patient.vitalSigns.clinicalNotes || ''
        };
        console.log('Setting existing vital signs:', existingVitalSigns);
        setVitalSigns(existingVitalSigns);
        setIsVitalSignsReadOnly(true);
      } else {
        console.log('Patient has no meaningful vital signs data, creating new entry');
        // Reset vital signs form for new entry
        const newVitalSigns = {
          temperature: '',
          temperatureUnit: 'celsius',
          heartRate: '',
          systolicBP: '',
          diastolicBP: '',
          respiratoryRate: '',
          oxygenSaturation: '',
          weight: '',
          weightUnit: 'kg',
          height: '',
          heightUnit: 'cm',
          clinicalNotes: ''
        };
        
        // Load previous vital signs for height and weight if creating new record
        setIsVitalSignsReadOnly(false);
        const lastVitals = await loadLastVitalSigns(patient.patientId);
        if (lastVitals) {
          newVitalSigns.height = lastVitals.height || '';
          newVitalSigns.heightUnit = lastVitals.heightUnit || 'cm';
          newVitalSigns.weight = lastVitals.weight || '';
          newVitalSigns.weightUnit = lastVitals.weightUnit || 'kg';
        }
        
        console.log('Setting new vital signs with previous height/weight:', newVitalSigns);
        setVitalSigns(newVitalSigns);
      }
    } catch (error) {
      console.error('Error loading vital signs:', error);
      setAlert({ 
        type: 'warning', 
        message: 'Failed to load previous vital signs. Starting with empty form.' 
      });
      setIsVitalSignsReadOnly(false);
    }
    
    console.log('Opening vital signs modal');
    setShowVitalSignsModal(true);
  };

  const handleEditVitalSigns = () => {
    setIsVitalSignsReadOnly(false);
  };

  const handleViewVitalSignsHistory = async () => {
    if (!selectedPatient) return;
    
    try {
      // Set the patient ID to trigger the query
      setVitalSignsHistoryPatientId(selectedPatient.patientId);
      setShowVitalSignsHistory(true);
    } catch (error) {
      console.error('Error loading vital signs history:', error);
      setAlert({ 
        type: 'danger', 
        message: 'Could not load vital signs history. Please try again.' 
      });
    }
  };

  // Update vital signs history when data changes
  useEffect(() => {
    if (vitalSignsHistoryData) {
      let history = [];
      if (vitalSignsHistoryData.vitalSigns && Array.isArray(vitalSignsHistoryData.vitalSigns)) {
        // Backend returns { vitalSigns: [], pagination: {} }
        history = vitalSignsHistoryData.vitalSigns;
      } else if (Array.isArray(vitalSignsHistoryData)) {
        // Backend returns array directly
        history = vitalSignsHistoryData;
      }
      setVitalSignsHistory(history);
    }
  }, [vitalSignsHistoryData]);

  // Function to assign service type to a patient
  const handleServiceAssignment = async (patient, serviceType) => {
    if (!serviceType) {
      console.log('No service type selected');
      return;
    }

    console.log(`Assigning service type ${serviceType} to patient ${patient.id}`);
    
    try {
      // Get auth token properly
      const authData = JSON.parse(sessionStorage.getItem('authData') || '{}');
      const authToken = authData.token || window.__authToken;
      
      if (!authToken) {
        console.error('No authentication token available');
        alert('Authentication required. Please log in again.');
        return;
      }

      // Update the checkup with the selected service type
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${baseURL}/api/checkups/${patient.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          serviceType: serviceType
        })
      });

      if (response.ok) {
        console.log('Service type updated successfully');
        // Refresh the checkups data to show the update
        refetch();
        refreshTodaysCheckups();
      } else {
        console.error('Failed to update service type:', response.status);
        alert('Failed to update service type. Please try again.');
      }
    } catch (error) {
      console.error('Error updating service type:', error);
      alert('Error updating service type. Please try again.');
    }
  };

  // Vaccination handling functions
  const handleStartVaccination = async (patient) => {
    if (patient.serviceType !== 'vaccination') {
      setAlert({ 
        type: 'warning', 
        message: 'This function is only available for vaccination services.' 
      });
      return;
    }
    
    if (!patient.vitalSignsCollected) {
      setAlert({ 
        type: 'warning', 
        message: 'Please complete vital signs before starting vaccination.' 
      });
      return;
    }
    
    // Check if patient has already been vaccinated today
    try {
      const authData = JSON.parse(sessionStorage.getItem('authData') || '{}');
      const authToken = authData.token || window.__authToken;
      
      if (authToken) {
        const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const response = await fetch(`${baseURL}/api/vaccinations/check-today/${patient.patientId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.hasVaccinationToday) {
            setAlert({ 
              type: 'warning', 
              message: 'This patient has already received a vaccination today.' 
            });
            return;
          }
        }
      }
    } catch (error) {
      console.log('Could not check existing vaccinations:', error);
      // Continue anyway - the API check is optional
    }
    
    setSelectedPatient(patient);
    setShowVaccinationModal(true);
  };

  const handleVaccinationSave = async (vaccinationRecord) => {
    try {
      // Save vaccination record to backend
      const authData = JSON.parse(sessionStorage.getItem('authData') || '{}');
      const authToken = authData.token || window.__authToken;
      
      if (!authToken) {
        setAlert({ type: 'danger', message: 'Authentication required. Please log in again.' });
        return;
      }

      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${baseURL}/api/vaccinations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(vaccinationRecord)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update patient status to vaccination-completed
        await fetch(`${baseURL}/api/checkups/${selectedPatient.id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            status: 'vaccination-completed',
            notes: `Vaccination completed: ${vaccinationRecord.vaccineName}`,
            completionType: 'vaccination'
          })
        });

        setAlert({ 
          type: 'success', 
          message: `Vaccination completed successfully for ${selectedPatient.patientName}` 
        });
        
        // Add patient to vaccinated today set
        setVaccinatedTodayPatients(prev => new Set([...prev, selectedPatient.patientId]));
        
        // Close modal and refresh data
        setShowVaccinationModal(false);
        setSelectedPatient(null);
        refetch();
        refreshTodaysCheckups();
      } else {
        console.error('Vaccination save failed:', response.status, response.statusText);
        let errorMessage = `Failed to save vaccination record (${response.status})`;
        try {
          const error = await response.json();
          console.error('Error response:', error);
          errorMessage = error.message || errorMessage;
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
        }
        setAlert({ 
          type: 'danger', 
          message: errorMessage 
        });
      }
    } catch (error) {
      console.error('Error saving vaccination record:', error);
      console.error('Error details:', error.message, error.stack);
      setAlert({ 
        type: 'danger', 
        message: `Network error occurred while saving vaccination: ${error.message}. Please check your connection and try again.` 
      });
    }
  };

  // Function to load all patients from database
  // Patient database functions removed as requested

  // Function to view patient information
  const handleViewPatientInfo = (patient) => {
    alert(`Patient Information:\n\nName: ${patient.firstName} ${patient.lastName}\nID: ${patient.id}\nAge: ${patient.age || 'N/A'}\nGender: ${patient.gender || 'N/A'}\nContact: ${patient.contactNumber || 'No contact'}\nEmail: ${patient.email || 'No email'}\nAddress: ${patient.address || 'No address'}`);
  };

  // Function to toggle patient selection for removal
  const togglePatientForRemoval = (patientId) => {
    if (!isRemoveMode) return;

    setSelectedForRemoval(prev => 
      prev.includes(patientId) 
        ? prev.filter(id => id !== patientId)
        : [...prev, patientId]
    );
  };

  // Function to start remove mode
  const startRemoveMode = () => {
    if (isRemoveMode) {
      if (selectedForRemoval.length > 0) {
        setShowRemoveConfirmation(true);
        setRemoveCountdown(5);
        
        // Start countdown
        const countdown = setInterval(() => {
          setRemoveCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdown);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setAlert({ type: 'warning', message: 'Please select patients to remove' });
      }
    } else {
      setIsRemoveMode(true);
      setSelectedForRemoval([]);
    }
  };

  // Function to cancel remove mode
  const cancelRemoveMode = () => {
    setIsRemoveMode(false);
    setSelectedForRemoval([]);
    setShowRemoveConfirmation(false);
    setRemoveCountdown(5);
  };

  // Function to confirm removal
  const confirmRemovePatients = async () => {
    const removedPatients = todaysCheckups.filter(p => selectedForRemoval.includes(p.id));
    
    try {
      // Remove from backend if available
      for (const patient of removedPatients) {
        try {
          // Use the correct endpoint for removing checkup sessions
          await api.delete(`/api/checkups/today/${patient.patientId}`);
          console.log(`Successfully removed patient ${patient.patientId} from today's checkups`);
        } catch (backendError) {
          console.warn('Backend not available for removal, updating local state only:', backendError.message);
        }
      }
      
      // With TanStack Query, the data will be automatically refetched
      // No need to manually update local state
      
      setIsRemoveMode(false);
      setSelectedForRemoval([]);
      setShowRemoveConfirmation(false);
      setRemoveCountdown(5);
      
      setAlert({ 
        type: 'success', 
        message: `${removedPatients.length} patient(s) removed from today's checkups.` 
      });
      
      // Trigger a refetch of the data
      refetch();
    } catch (error) {
      console.error('Error removing patients:', error);
      setAlert({ 
        type: 'danger', 
        message: 'Failed to remove some patients. Please try again.' 
      });
    }
  };

  const handleSaveVitalSigns = async (modalVitalSigns) => {
    if (!selectedPatient) return;

    try {
      console.log('Saving vital signs for patient:', selectedPatient);
      console.log('Vital signs data from modal:', modalVitalSigns);
      
      // Create a timestamp for this vital signs record
      const recordTimestamp = new Date().toISOString();
      
      // Create a vital signs object with timestamp
      const vitalSignsRecord = {
        ...modalVitalSigns,
        createdAt: recordTimestamp,
        recordedAt: recordTimestamp
      };
      
      // Use the correct session ID for the API call
      const sessionId = selectedPatient.id;
      console.log('Using session ID for API call:', sessionId);
      
      // Use the mutation hook to save vital signs
      await recordVitalSignsMutation.mutateAsync({
        sessionId,
        vitalSigns: vitalSignsRecord
      });

      console.log('Vital signs saved successfully');

      // Reset form and close modal
      setVitalSigns({
        temperature: '',
        temperatureUnit: 'celsius',
        heartRate: '',
        systolicBP: '',
        diastolicBP: '',
        respiratoryRate: '',
        oxygenSaturation: '',
        weight: '',
        weightUnit: 'kg',
        height: '',
        heightUnit: 'cm',
        clinicalNotes: ''
      });
      setShowVitalSignsModal(false);
      setSelectedPatient(null);

      setAlert({ type: 'success', message: 'Vital signs recorded successfully!' });
    } catch (error) {
      console.error('Error saving vital signs:', error);
      setAlert({ type: 'danger', message: 'Error recording vital signs. Please try again.' });
    }
  };

  const handleDoctorSelect = (checkupId, doctor) => {
    setSelectedDoctors(prev => ({
      ...prev,
      [checkupId]: doctor
    }));
  };

  const handleNotifyDoctor = async (patient) => {
    if (!patient.vitalSignsCollected) {
      setAlert({ type: 'warning', message: 'Please collect vital signs before notifying the doctor.' });
      return;
    }

    const selectedDoctor = selectedDoctors[patient.id];
    if (!selectedDoctor) {
      setAlert({ type: 'warning', message: 'Please select an available doctor before adding to queue.' });
      return;
    }

    if (!selectedDoctor.isAvailable) {
      setAlert({ type: 'warning', message: 'Selected doctor is not available. Please choose another doctor.' });
      return;
    }

    try {
      // Use the optimized addToQueue function from DataContext with assigned doctor
      const result = await addToQueue({
        ...patient,
        assignedDoctor: selectedDoctor.id,
        assignedDoctorName: selectedDoctor.name
      });
      
      if (result.success) {
        setAlert({ 
          type: 'success', 
          message: `${selectedDoctor.name} has been notified about ${patient.patientName}. Patient assigned to doctor's queue.` 
        });
        
        // Clear the doctor selection for this patient
        setSelectedDoctors(prev => {
          const updated = { ...prev };
          delete updated[patient.id];
          return updated;
        });
        
        // Refresh data to ensure synchronization
        await Promise.all([
          refetch(),
          refreshDoctorQueue(),
          refreshTodaysCheckups()
        ]);
      } else {
        setAlert({ 
          type: 'danger', 
          message: result.message || 'Error notifying doctor. Please try again.' 
        });
      }
    } catch (error) {
      console.error('Error notifying doctor:', error);
      setAlert({ type: 'danger', message: 'Error assigning patient to doctor. Please try again.' });
    }
  };

  // Direct Queue functionality removed as requested

  const getStatusBadge = (checkup) => {
    switch (checkup.status) {
      case 'checked-in':
        return <Badge bg="secondary">Checked In</Badge>;
      case 'service-assigned':
        return <Badge bg="info">Service Assigned</Badge>;
      case 'vitals-recorded':
        return <Badge bg="warning">Vitals Recorded</Badge>;
      case 'ready-for-queue':
        return <Badge bg="success">Ready for Queue</Badge>;
      case 'in-progress':
        return <Badge bg="primary">With Doctor</Badge>;
      case 'completed':
        return <Badge bg="success">Completed</Badge>;
      case 'vaccination-completed':
        return <Badge bg="success">
          <i className="bi bi-shield-check me-1"></i>
          Vaccination Complete
        </Badge>;
      default:
        return <Badge bg="light" text="dark">{checkup.status}</Badge>;
    }
  };

  const getPriorityBadge = (priority) => {
    const variant = priority === 'Emergency' ? 'danger' : priority === 'High' ? 'warning' : 'secondary';
    return <Badge bg={variant}>{priority}</Badge>;
  };

  const getCheckInMethodIcon = (method) => {
    switch (method) {
      case 'qr-code':
        return <i className="bi bi-qr-code text-primary" title="QR Code Check-in"></i>;
      case 'qr-scan':
        return <i className="bi bi-qr-code-scan text-primary" title="QR Code Scan Check-in"></i>;
      case 'staff-assisted':
        return <i className="bi bi-person-check text-success" title="Staff Assisted"></i>;
      case 'online':
        return <i className="bi bi-laptop text-info" title="Online Check-in"></i>;
      default:
        return <i className="bi bi-question-circle text-muted"></i>;
    }
  };

  const getVitalStatus = (vital, value) => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    
    switch (vital) {
      case 'temperature':
        return `${value}°C`;
      case 'heartRate':
        return `${value} bpm`;
      case 'systolicBP':
      case 'diastolicBP':
        return `${value} mmHg`;
      case 'respiratoryRate':
        return `${value} /min`;
      case 'oxygenSaturation':
        return `${value}%`;
      case 'height':
        return `${value} cm`;
      case 'weight':
        return `${value} kg`;
      default:
        return value;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="checkup-manager">
      {/* Alert notifications */}
      {alert && (
        <Alert 
          variant={alert.type} 
          dismissible 
          onClose={() => setAlert(null)}
          className="mb-3"
        >
          {alert.message}
        </Alert>
      )}

      {/* Stats notifications positioned in top-right */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div></div>
        <div className="stats-notifications d-flex gap-2">
          <Badge bg="warning" className="stat-notif">
            <i className="bi bi-calendar me-1"></i>
            Total: {todaysCheckups.length}
          </Badge>
          <Badge bg="primary" className="stat-notif">
            <i className="bi bi-person-check me-1"></i>
            Checked In: {todaysCheckups.filter(c => c.status === 'checked-in' || c.status === 'service-assigned').length}
          </Badge>
          <Badge bg="success" className="stat-notif">
            <i className="bi bi-check-circle me-1"></i>
            Completed: {todaysCheckups.filter(c => c.status === 'vitals-recorded' || c.status === 'completed' || c.status === 'vaccination-completed').length}
          </Badge>
          <Badge bg="orange" className="stat-notif bg-warning">
            <i className="bi bi-clock me-1"></i>
            In Queue: {todaysCheckups.filter(c => c.status === 'ready-for-queue').length}
          </Badge>
        </div>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onSelect={setActiveTab} 
        className="checkup-tabs mb-4"
      >
        <Tab eventKey="today" title={
          <span>
            <i className="bi bi-clipboard2-pulse me-2"></i>
            Checkup
          </span>
        }>
          <div className="checkup-controls">
            <Row>
              <Col md={3}>
                <InputGroup>
                  <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search patients, ID, or service..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col md={3}>
                {totalPages > 1 && (
                  <div className="d-flex align-items-center justify-content-center">
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      onClick={handlePrevious}
                      disabled={currentPage === 1}
                      className="me-2"
                    >
                      <i className="bi bi-chevron-left"></i>
                    </Button>
                    <span className="mx-2 text-nowrap">
                      Page {currentPage} of {totalPages} 
                      <small className="text-muted ms-1">
                        ({filteredCheckups.length} total)
                      </small>
                    </span>
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      onClick={handleNext}
                      disabled={currentPage === totalPages}
                      className="ms-2"
                    >
                      <i className="bi bi-chevron-right"></i>
                    </Button>
                  </div>
                )}
              </Col>
              <Col md={6}>
                <div className="d-flex gap-2 justify-content-end">
                  <Button variant="success" onClick={refetch}>
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Refresh
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={() => {
                      // Navigate to Patient Database using AdminLayout navigation
                      if (typeof window.navigateToPatientDatabase === 'function') {
                        window.navigateToPatientDatabase('Patient Database', 'members');
                      } else {
                        // Fallback if the global function isn't available
                        setAlert({ type: 'warning', message: 'Patient Database navigation is not available. Please navigate manually to the Patient Database section.' });
                      }
                    }}
                  >
                    <i className="bi bi-person-plus me-1"></i>
                    Go to Patient Database
                  </Button>
                  <Button 
                    variant={isRemoveMode ? "danger" : "outline-danger"} 
                    onClick={startRemoveMode}
                    disabled={todaysCheckups.length === 0}
                    style={!isRemoveMode ? {
                      backgroundColor: '#dc3545',
                      borderColor: '#dc3545',
                      color: 'white'
                    } : {}}
                  >
                    <i className="bi bi-trash me-1"></i>
                    {isRemoveMode ? `Remove Selected (${selectedForRemoval.length})` : 'Remove Patients'}
                  </Button>
                  {isRemoveMode && (
                    <Button 
                      variant="secondary" 
                      onClick={cancelRemoveMode}
                      style={{
                        backgroundColor: '#6c757d',
                        borderColor: '#6c757d',
                        color: 'white'
                      }}
                    >
                      <i className="bi bi-x me-1"></i>
                      Cancel
                    </Button>
                  )}
                </div>
              </Col>
            </Row>
          </div>

          <div className="checkup-table-container">
            <Table hover responsive className="checkup-table">
              <thead>
                <tr>
                  <th style={{width: '3%'}}>#</th>
                  <th style={{width: '4%'}}>Method</th>
                  <th style={{width: '8%'}}>Patient ID</th>
                  <th style={{width: '12%'}}>Patient Name</th>
                  <th style={{width: '7%'}}>Age/Gender</th>
                  <th style={{width: '8%'}}>Check-in Time</th>
                  <th style={{width: '12%'}}>Service Type</th>
                  <th style={{width: '7%'}}>Priority</th>
                  <th style={{width: '12%'}}>Available Doctor</th>
                  <th style={{width: '8%'}}>Status</th>
                  <th style={{width: '19%'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentCheckups.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="text-center py-4 text-muted">
                      <i className="bi bi-calendar-x me-2"></i>
                      {searchTerm || statusFilter !== 'all' 
                        ? 'No checkups match your search criteria' 
                        : 'No checkups scheduled for today'
                      }
                    </td>
                  </tr>
                ) : (
                  currentCheckups.map((checkup, index) => (
                    <tr 
                      key={checkup.id} 
                      className={`checkup-row ${checkup.priority === 'Emergency' ? 'emergency-row' : ''} ${
                        isRemoveMode ? 'remove-mode-row' : ''
                      } ${
                        selectedForRemoval.includes(checkup.id) ? 'selected-for-removal' : ''
                      }`}
                      onClick={() => togglePatientForRemoval(checkup.id)}
                      style={{ 
                        cursor: isRemoveMode ? 'pointer' : 'default',
                        userSelect: isRemoveMode ? 'none' : 'auto'
                      }}
                    >
                      <td className="row-number">{startIndex + index + 1}</td>
                      <td className="method-cell">{getCheckInMethodIcon(checkup.checkInMethod)}</td>
                      <td className="patient-id">{checkup.patientId}</td>
                      <td className="patient-name">
                        <div>
                          <strong>{checkup.patientName}</strong>
                          <br />
                          <small className="text-muted">{checkup.contactNumber}</small>
                        </div>
                      </td>
                      <td>{checkup.age} / {checkup.gender}</td>
                      <td>{checkup.checkInTime}</td>
                      <td>
                        <Form.Select 
                          size="sm" 
                          value={checkup.serviceType || ""}
                          onChange={(e) => handleServiceAssignment(checkup, e.target.value)}
                          style={{ minWidth: '150px', maxWidth: '100%' }}
                          disabled={checkup.status === 'ready-for-queue'}
                        >
                          <option value="">Select Service</option>
                          {serviceTypes.map(service => (
                            <option key={service.value} value={service.value}>
                              {service.label}
                            </option>
                          ))}
                        </Form.Select>
                      </td>
                      <td>{getPriorityBadge(checkup.priority)}</td>
                      <td>
                        {checkup.serviceType === 'vaccination' ? (
                          <Badge bg="info" className="w-100 text-center py-2">
                            <i className="bi bi-shield-plus me-1"></i>
                            No Doctor Required
                          </Badge>
                        ) : (
                          <DoctorPicker
                            onDoctorSelect={(doctor) => handleDoctorSelect(checkup.id, doctor)}
                            selectedDoctor={selectedDoctors[checkup.id]}
                            disabled={!checkup.vitalSignsCollected || checkup.status === 'ready-for-queue'}
                            size="sm"
                            variant="outline-primary"
                            inQueue={checkup.status === 'ready-for-queue'}
                            assignedDoctor={checkup.status === 'ready-for-queue' ? {
                              name: checkup.assignedDoctorName || 'Unknown Doctor'
                            } : null}
                          />
                        )}
                      </td>
                      <td>{getStatusBadge(checkup)}</td>
                      <td>
                        <div className="action-buttons">
                          {/* Vital Signs Button - Always visible but conditionally enabled */}
                          <Button
                            variant={checkup.vitalSignsCollected ? "outline-success" : "outline-primary"}
                            size="sm"
                            onClick={() => handleVitalSigns(checkup)}
                            className="me-1"
                            disabled={!checkup.serviceType}
                            title={!checkup.serviceType ? "Please select a service type first" : ""}
                          >
                            <i className="bi bi-heart-pulse me-1"></i>
                            {checkup.vitalSignsCollected ? 'View Vital Signs' : 'Check Vital Signs'}
                          </Button>
                          
                          {/* Conditional Action Button based on Service Type */}
                          {checkup.status !== 'ready-for-queue' && checkup.status !== 'vaccination-completed' && checkup.status !== 'completed' && !vaccinatedTodayPatients.has(checkup.patientId) && (
                            checkup.serviceType === 'vaccination' ? (
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => handleStartVaccination(checkup)}
                                className="me-1"
                                disabled={!checkup.vitalSignsCollected}
                                title={
                                  !checkup.vitalSignsCollected 
                                    ? "Please complete vital signs first" 
                                    : "Start vaccination process"
                                }
                              >
                                <i className="bi bi-shield-plus me-1"></i>
                                Start Vaccination
                              </Button>
                            ) : (
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => handleNotifyDoctor(checkup)}
                                className="me-1"
                                disabled={!checkup.vitalSignsCollected || !selectedDoctors[checkup.id]}
                                title={
                                  !checkup.vitalSignsCollected 
                                    ? "Please complete vital signs first" 
                                    : !selectedDoctors[checkup.id]
                                    ? "Please select an available doctor first"
                                    : ""
                                }
                              >
                                <i className="bi bi-arrow-right-circle me-1"></i>
                                Add to Queue
                              </Button>
                            )
                          )}
                          
                          {/* In Queue Status - Show when patient is in queue */}
                          {checkup.status === 'ready-for-queue' && (
                            <Button
                              variant="success"
                              size="sm"
                              disabled
                              className="me-1"
                            >
                              <i className="bi bi-check-circle me-1"></i>
                              In Queue
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Tab>

        <Tab eventKey="queue" title={
          <span>
            <i className="bi bi-list-ol me-2"></i>
            Doctor Queue ({doctorQueueData.length})
          </span>
        }>
          {/* Queue controls - similar to checkup controls but without Add Patient */}
          <div className="checkup-controls">
            <Row>
              <Col md={4}>
                <InputGroup>
                  <InputGroup.Text>
                    <i className="bi bi-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search patients in queue..."
                    value={doctorQueueSearch}
                    onChange={(e) => setDoctorQueueSearch(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col md={8}>
                <div className="d-flex gap-2 justify-content-end">
                  <Button variant="success" onClick={refetch}>
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Refresh
                  </Button>
                </div>
              </Col>
            </Row>
          </div>

          <div className="queue-info">
            <p className="text-muted mb-3">
              <i className="bi bi-info-circle me-1"></i>
              Patients currently in the doctor's queue. These patients have completed check-in and vital signs collection.
            </p>
            
            {doctorQueueData.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-inbox display-4 text-muted"></i>
                <h4 className="mt-3 text-muted">No patients in queue</h4>
                <p className="text-muted">Patients will appear here after vital signs are recorded and doctor is notified.</p>
              </div>
            ) : (
              <Table hover responsive className="queue-table">
                <thead>
                  <tr>
                    <th>Position</th>
                    <th>Patient ID</th>
                    <th>Patient Name</th>
                    <th>Service Type</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assisted By</th>
                    <th>Added Time</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {doctorQueueData.map((item, index) => (
                    <tr key={item.id} className={`queue-item ${item.priority === 'Emergency' ? 'emergency-row' : ''}`}>
                      <td>{index + 1}</td>
                      <td>{item.patientId}</td>
                      <td>{item.patientName}</td>
                      <td>{item.serviceType}</td>
                      <td>{getPriorityBadge(item.priority)}</td>
                      <td>{getStatusBadge({ status: item.status })}</td>
                      <td>
                        {item.assignedDoctorName ? (
                          <div>
                            <i className="bi bi-person-check me-1 text-success"></i>
                            <strong>{item.assignedDoctorName}</strong>
                          </div>
                        ) : (
                          <span className="text-muted">
                            <i className="bi bi-person-dash me-1"></i>
                            Not assigned
                          </span>
                        )}
                      </td>
                      <td>{new Date(item.queuedAt || Date.now()).toLocaleTimeString()}</td>
                      <td>
                        <Badge bg={item.source === 'admin_checkup' ? 'primary' : 'secondary'}>
                          {item.source === 'admin_checkup' ? 'Checkup' : 'Manual'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </Tab>
      </Tabs>

      {/* Vital Signs Modal */}
      <VitalSignsModal
        show={showVitalSignsModal}
        onHide={() => {
          setShowVitalSignsModal(false);
          setIsVitalSignsReadOnly(false);
        }}
        patient={selectedPatient}
        isReadOnly={isVitalSignsReadOnly}
        initialData={vitalSigns}
        onSave={handleSaveVitalSigns}
        onViewHistory={handleViewVitalSignsHistory}
        onEdit={handleEditVitalSigns}
        normalRanges={normalRanges}
      />

      {/* Vaccination Modal */}
      <VaccinationModal
        show={showVaccinationModal}
        onHide={() => {
          setShowVaccinationModal(false);
          setSelectedPatient(null);
        }}
        patient={selectedPatient}
        onSave={handleVaccinationSave}
      />

      {/* Patient Database Modal removed as requested */}

      {/* Remove Confirmation Modal */}
      <Modal 
        show={showRemoveConfirmation} 
        onHide={() => setShowRemoveConfirmation(false)}
        centered
        className="remove-confirmation-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Confirm Removal
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="removal-summary">
            <p className="mb-3">
              You are about to remove the following {selectedForRemoval.length} patient(s) from today's checkups:
            </p>
            <ul className="list-group mb-3">
              {selectedForRemoval.map(patientId => {
                const patient = todaysCheckups.find(p => p.id === patientId);
                return (
                  <li key={patientId} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{patient?.patientName}</strong>
                      <br />
                      <small className="text-muted">
                        ID: {patient?.patientId} | Service: {patient?.serviceType || 'Not assigned'} | Status: {patient?.status}
                      </small>
                    </div>
                    <Badge bg="danger">Remove</Badge>
                  </li>
                );
              })}
            </ul>
            <div className="alert alert-warning">
              <i className="bi bi-exclamation-triangle me-2"></i>
              <strong>Warning:</strong> This action cannot be undone. All data for these checkups will be permanently removed.
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cancelRemoveMode}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={confirmRemovePatients}
            disabled={removeCountdown > 0}
          >
            <i className="bi bi-trash me-1"></i>
            {removeCountdown > 0 ? `Confirm Removal (${removeCountdown}s)` : 'Confirm Removal'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Vital Signs History Modal */}
      <Modal 
        show={showVitalSignsHistory} 
        onHide={() => setShowVitalSignsHistory(false)}
        size="xl"
        className="vital-signs-history-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-clock-history me-2 text-info"></i>
            Vital Signs History
            {selectedPatient && (
              <div className="patient-info">
                <small className="text-muted">
                  {selectedPatient.patientName} ({selectedPatient.patientId})
                </small>
              </div>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {alert && alert.message && alert.type && (
            <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible>
              {alert.message}
            </Alert>
          )}
          
          {!Array.isArray(vitalSignsHistory) ? (
            <div className="alert alert-danger">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              Error: Failed to load vital signs history data.
            </div>
          ) : vitalSignsHistory.length === 0 ? (
            <div className="text-center py-4">
              <i className="bi bi-clipboard-x display-4 text-muted"></i>
              <h5 className="mt-3 text-muted">No vital signs history found</h5>
              <p className="text-muted">This patient doesn't have any recorded vital signs yet.</p>
            </div>
          ) : (
            <Table hover responsive>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Temperature</th>
                  <th>Heart Rate</th>
                  <th>Blood Pressure</th>
                  <th>Respiratory Rate</th>
                  <th>SpO2</th>
                  <th>Height</th>
                  <th>Weight</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {vitalSignsHistory.map((record, index) => (
                  <tr key={index}>
                    <td>
                      <div>
                        <strong>{record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'N/A'}</strong>
                        <br />
                        <small className="text-muted">
                          {record.createdAt ? new Date(record.createdAt).toLocaleTimeString() : ''}
                        </small>
                      </div>
                    </td>
                    <td>
                      <Badge bg={getVitalStatus('temperature', record.temperature)}>
                        {record.temperature ? `${record.temperature}°${record.temperatureUnit === 'celsius' ? 'C' : 'F'}` : '-'}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={getVitalStatus('heartRate', record.heartRate)}>
                        {record.heartRate ? `${record.heartRate} bpm` : '-'}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={getVitalStatus('bloodPressure', { systolic: record.systolicBP, diastolic: record.diastolicBP })}>
                        {record.systolicBP && record.diastolicBP ? 
                          `${record.systolicBP}/${record.diastolicBP} mmHg` : '-'}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={getVitalStatus('respiratoryRate', record.respiratoryRate)}>
                        {record.respiratoryRate ? `${record.respiratoryRate}/min` : '-'}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={getVitalStatus('oxygenSaturation', record.oxygenSaturation)}>
                        {record.oxygenSaturation ? `${record.oxygenSaturation}%` : '-'}
                      </Badge>
                    </td>
                    <td>
                      {record.height ? `${record.height} ${record.heightUnit || 'cm'}` : '-'}
                    </td>
                    <td>
                      {record.weight ? `${record.weight} ${record.weightUnit || 'kg'}` : '-'}
                    </td>
                    <td>
                      {record.clinicalNotes ? (
                        <Button 
                          variant="outline-info" 
                          size="sm"
                          onClick={() => {
                            setSelectedNote(record.clinicalNotes);
                            setShowNoteModal(true);
                          }}
                        >
                          View Note
                        </Button>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowVitalSignsHistory(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Note Display Modal */}
      <Modal show={showNoteModal} onHide={() => setShowNoteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Clinical Note</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{selectedNote}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNoteModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CheckupManager;
