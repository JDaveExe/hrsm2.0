import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { Card, Table, Button, Tabs, Tab, Modal, Form, Row, Col, Alert } from 'react-bootstrap';
import { QRCodeSVG } from 'qrcode.react';
import { useData } from '../../../context/DataContext';
import { usePagination } from '../../../hooks/useOptimizedInventory';
import adminService from '../../../services/adminService';
import PatientInfoCards from '../../PatientInfoCards';
import PatientActionsSection from '../../PatientActionsSection';
import '../styles/PatientManagement.css';
import '../styles/PatientDatabaseModals.css';

const PatientManagement = memo(() => {
  const { 
    patientsData, 
    familiesData, 
    unsortedMembersData,
    todaysCheckups,
    fetchAllPatients,
    fetchAllFamilies,
    fetchUnsortedMembers 
  } = useData();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [tabKey, setTabKey] = useState('families');
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [showPatientDetailsModal, setShowPatientDetailsModal] = useState(false);
  const [showAssignFamilyModal, setShowAssignFamilyModal] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [showAutosortConfirmModal, setShowAutosortConfirmModal] = useState(false);
  const [autosortResults, setAutosortResults] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [selectedUnsortedPatient, setSelectedUnsortedPatient] = useState(null);
  const [showManageDropdown, setShowManageDropdown] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoadingAutosort, setIsLoadingAutosort] = useState(false);
  const [alert, setAlert] = useState(null);
  const [addingFamilyFromPatient, setAddingFamilyFromPatient] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);
  const [showViewRegistrationModal, setShowViewRegistrationModal] = useState(false);
  const [editPatientData, setEditPatientData] = useState(null);
  const [qrCodeData, setQRCodeData] = useState('');
  const [patientsWithQR, setPatientsWithQR] = useState(new Set()); // Track patients who have generated QR codes
  const [selectedFamilyForAssignment, setSelectedFamilyForAssignment] = useState(''); // For manual family assignment
  const [generatedPassword, setGeneratedPassword] = useState(null); // Store generated password for notice

  // Sort configurations
  const [familySortConfig, setFamilySortConfig] = useState({ key: null, direction: 'ascending' });
  const [memberSortConfig, setMemberSortConfig] = useState({ key: null, direction: 'ascending' });
  
  // Pagination configurations
  const [familyCurrentPage, setFamilyCurrentPage] = useState(1);
  const [memberCurrentPage, setMemberCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Check for active tab from session storage (for navigation from other components)
  useEffect(() => {
    const activeTab = sessionStorage.getItem('activeTab');
    if (activeTab) {
      setTabKey(activeTab);
      // Clear the session storage to avoid persisting the tab selection
      sessionStorage.removeItem('activeTab');
    }
  }, []);

  // Form data with optimized state management (prevents input delays)
  const [patientFormData, setPatientFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    dateOfBirth: '',
    age: '',
    gender: '',
    civilStatus: '',
    contactNumber: '',
    email: '',
    houseNo: '',
    street: '',
    barangay: '',
    city: 'Pasig City',
    region: 'Metro Manila',
    postalCode: '1600',
    philHealthNumber: '',
    bloodType: '',
    medicalConditions: '',
    familyId: ''
  });

  const [familyFormData, setFamilyFormData] = useState({
    familyName: '',
    surname: '',
    headOfFamily: '',
    contactNumber: '',
    notes: ''
  });

  // Optimized form change handler (prevents input delays)
  const handlePatientFormChange = useCallback((field, value) => {
    setPatientFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-calculate age from date of birth
      if (field === 'dateOfBirth') {
        if (value) {
          const today = new Date();
          const birthDate = new Date(value);
          // Check if the date is valid before calculating age
          if (!isNaN(birthDate.getTime())) {
            const age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
            newData.age = age >= 0 ? age.toString() : '';
          } else {
            newData.age = '';
          }
        } else {
          newData.age = '';
        }
      }
      
      return newData;
    });
  }, []);

  const handleFamilyFormChange = useCallback((field, value) => {
    setFamilyFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Utility functions
  const getPatientFullName = useCallback((patient) => {
    const parts = [
      patient.firstName,
      patient.middleName,
      patient.lastName,
      patient.suffix
    ].filter(Boolean);
    return parts.join(' ') || 'Unknown';
  }, []);

  const getPatientAge = useCallback((patient) => {
    if (patient.age) return patient.age;
    if (patient.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(patient.dateOfBirth);
      const age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
      return age;
    }
    return 'N/A';
  }, []);

  const getPatientContact = useCallback((patient) => {
    return patient.contactNumber || patient.phone || 'N/A';
  }, []);

  const getFamilyHead = useCallback((family) => {
    return family.headOfFamily || 'Not specified';
  }, []);

  const getFamilyMemberCount = useCallback((family) => {
    if (!patientsData) return 0;
    return patientsData.filter(patient => patient.familyId === family.id).length;
  }, [patientsData]);

  const getFamilyMembers = useCallback((familyId) => {
    if (!patientsData || !Array.isArray(patientsData)) return [];
    return patientsData.filter(patient => patient.familyId === familyId);
  }, [patientsData]);

  const formatShortDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    try {
      // Handle date strings like '2024-01-01T00:00:00.000Z' or '2024-01-01'
      const cleanDateString = dateString.split('T')[0];
      const parts = cleanDateString.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // month is 0-indexed in JS Date
      const day = parseInt(parts[2], 10);

      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return 'N/A';
      }

      const date = new Date(Date.UTC(year, month, day));
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long', // Using 'long' for full month name as per user request hint
        day: 'numeric',
        timeZone: 'UTC' // Display date as it is, without timezone shift
      });
    } catch {
      return 'N/A';
    }
  }, []);

  // Sorting logic
  const requestSort = useCallback((key, sortConfig, setSortConfig) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  }, []);

  const sortData = useCallback((data, sortConfig) => {
    if (!data || !Array.isArray(data) || !sortConfig.key) return data || [];
    
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
  }, []);

  // Filtered and sorted data
  const filteredFamilies = useMemo(() => {
    if (!familiesData) return [];
    return familiesData.filter(family => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const familyName = family.familyName ? family.familyName.toLowerCase() : '';
      const familyId = family.id ? family.id.toString().toLowerCase() : '';
      const headOfFamily = getFamilyHead(family).toLowerCase();
      return familyName.includes(term) || 
             familyId.includes(term) ||
             headOfFamily.includes(term);
    });
  }, [familiesData, searchTerm, getFamilyHead]);

  const filteredPatients = useMemo(() => {
    if (!patientsData) return [];
    return patientsData.filter(patient => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const fullName = getPatientFullName(patient).toLowerCase();
      const patientId = patient.id ? patient.id.toString().toLowerCase() : '';
      const contact = getPatientContact(patient).toLowerCase();
      return fullName.includes(term) || 
             patientId.includes(term) ||
             contact.includes(term);
    });
  }, [patientsData, searchTerm, getPatientFullName, getPatientContact]);

  const sortedFamilies = useMemo(() => {
    return sortData(filteredFamilies, familySortConfig);
  }, [filteredFamilies, familySortConfig, sortData]);

  const sortedPatients = useMemo(() => {
    return sortData(filteredPatients, memberSortConfig);
  }, [filteredPatients, memberSortConfig, sortData]);

  // Pagination for families
  const familyPagination = usePagination(sortedFamilies, itemsPerPage, familyCurrentPage);
  
  // Pagination for patients
  const patientPagination = usePagination(sortedPatients, itemsPerPage, memberCurrentPage);

  // Event handlers
  const handlePatientSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
    // Reset pagination when searching
    setFamilyCurrentPage(1);
    setMemberCurrentPage(1);
  }, []);

  // Reset pagination when search term changes
  useEffect(() => {
    setFamilyCurrentPage(1);
    setMemberCurrentPage(1);
  }, [searchTerm]);

  const handleAddPatient = useCallback(() => {
    setShowAddPatientModal(true);
  }, []);

  const handleAddFamily = useCallback(() => {
    setShowAddFamilyModal(true);
  }, []);

  const handleRefreshData = useCallback(async () => {
    // PREVENT LOGOUT: Check if user is still authenticated before refresh
    if (!window.__authToken) {
      console.warn('No auth token available, skipping refresh');
      setAlert({ type: 'warning', message: 'Please log in again to refresh data.' });
      return;
    }

    setLoading(true);
    console.log('Starting data refresh...');
    
    try {
      // PREVENT LOGOUT: Disable global logout temporarily during refresh
      const originalLogout = window.__authLogout;
      window.__authLogout = null;
      
      try {
        await Promise.all([
          fetchAllPatients().catch(err => {
            console.warn('Failed to fetch patients during refresh:', err);
            return [];
          }),
          fetchAllFamilies().catch(err => {
            console.warn('Failed to fetch families during refresh:', err);
            return [];
          }),
          fetchUnsortedMembers ? fetchUnsortedMembers().catch(err => {
            console.warn('Failed to fetch unsorted members during refresh:', err);
            return [];
          }) : Promise.resolve()
        ]);
        
        console.log('Data refresh completed successfully');
        setAlert({ type: 'success', message: 'Data refreshed successfully!' });
      } finally {
        // RESTORE: Re-enable global logout
        window.__authLogout = originalLogout;
      }
    } catch (error) {
      console.error('Refresh error:', error);
      setAlert({ type: 'danger', message: 'Failed to refresh data.' });
    } finally {
      setLoading(false);
    }
  }, [fetchAllPatients, fetchAllFamilies, fetchUnsortedMembers]);

  const handleViewPatient = useCallback((patient) => {
    setSelectedPatient(patient);
    setShowPatientDetailsModal(true);
  }, []);

  const handleViewFamily = useCallback((family) => {
    setSelectedFamily(family);
    setShowFamilyModal(true);
  }, []);

  const handleAutoLogin = useCallback(async (patient) => {
    if (!patient) {
      setAlert({ type: 'danger', message: 'No patient selected for check-in' });
      return;
    }

    // Check if patient is already in today's checkups
    const existingCheckup = todaysCheckups?.find(checkup => checkup.patientId === patient.id);
    
    if (existingCheckup) {
      setAlert({ type: 'warning', message: `${patient.firstName} ${patient.lastName} is already checked in for today.` });
      return;
    }

    // Create checkup entry
    const newCheckup = {
      id: Date.now(), // Simple ID generation
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      age: patient.age || new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear(),
      gender: patient.gender || 'Not specified',
      contactNumber: patient.contactNumber || 'N/A',
      checkInTime: new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      serviceType: '',
      status: 'checked-in',
      priority: 'Normal',
      vitalSignsCollected: false,
      doctorNotified: false,
      notes: '',
      checkInMethod: 'staff-assisted'
    };

    // Add to today's checkups through API
    try {
      const response = await fetch('/api/checkups/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: patient.id,
          serviceType: newCheckup.serviceType,
          priority: newCheckup.priority,
          notes: newCheckup.notes,
          checkInMethod: newCheckup.checkInMethod
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setAlert({ type: 'success', message: `${patient.firstName} ${patient.lastName} has been checked in for today.` });
        
        // Force refresh the todaysCheckups data
        fetchAllPatients();
        
        // Also refresh CheckupManager's data if available (with small delay to ensure backend processing)
        setTimeout(() => {
          if (typeof window.refreshTodaysCheckups === 'function') {
            window.refreshTodaysCheckups();
          }
        }, 500);
      } else {
        console.error('API Error:', result);
        setAlert({ type: 'danger', message: result.error || 'Failed to check in patient' });
      }
    } catch (error) {
      console.error('Error checking in patient:', error);
      setAlert({ type: 'danger', message: 'Could not check in patient. Please try again.' });
    }
  }, [todaysCheckups, fetchAllPatients, setAlert]);

  const handleOpenAssignFamilyModal = useCallback((patient) => {
    setSelectedUnsortedPatient(patient);
    setShowAssignFamilyModal(true);
  }, []);

  const handleManageDropdown = useCallback(() => {
    setShowManageDropdown(prev => !prev);
  }, []);

  const handleQRCode = useCallback((patient) => {
    if (!patient) {
      setAlert({ type: 'danger', message: 'No patient selected for QR code generation' });
      return;
    }

    // Generate a secure token for the patient check-in
    const checkInToken = btoa(JSON.stringify({
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      timestamp: Date.now(),
      action: 'checkin'
    }));

    // Create the check-in URL
    const baseUrl = window.location.origin;
    const checkInUrl = `${baseUrl}/patient-checkin?token=${checkInToken}`;
    
    setQRCodeData(checkInUrl);
    setShowQRModal(true);
    
    // Add patient to the set of patients with QR codes
    setPatientsWithQR(prev => new Set(prev).add(patient.id));
    
    console.log('Generated QR Code URL:', checkInUrl);
  }, []);

  const handleReassignFamily = useCallback(() => {
    setConfirmAction('reassign');
    setSelectedFamilyForAssignment(''); // Clear previous selection
    setShowConfirmModal(true);
    setShowManageDropdown(false);
  }, []);

  const handleDeletePatient = useCallback(() => {
    setConfirmAction('delete');
    setShowConfirmModal(true);
    setShowManageDropdown(false);
  }, []);

  const handleEditPatient = useCallback(() => {
    setEditPatientData({ ...selectedPatient });
    setShowEditPatientModal(true);
    setShowManageDropdown(false);
  }, [selectedPatient]);

  const handleViewRegistrationForm = useCallback(() => {
    setShowViewRegistrationModal(true);
    setShowManageDropdown(false);
  }, []);

  const handleSaveEditPatient = useCallback(async () => {
    // Temporarily prevent logout during API operation
    const originalLogout = window.__authLogout;
    
    try {
      // PREVENT LOGOUT: Check if user is still authenticated
      if (!window.__authToken) {
        console.warn('No auth token available, skipping edit patient');
        setAlert({ type: 'warning', message: 'Please log in again to edit patient.' });
        return;
      }

      window.__authLogout = null;

      setLoading(true);
      
      // Validate required fields
      const requiredFields = [
        { field: 'firstName', message: 'First Name is required' },
        { field: 'lastName', message: 'Last Name is required' },
        { field: 'dateOfBirth', message: 'Date of Birth is required' },
        { field: 'gender', message: 'Gender is required' },
        { field: 'civilStatus', message: 'Civil Status is required' },
        { field: 'contactNumber', message: 'Contact Number is required' }
      ];

      for (const { field, message } of requiredFields) {
        if (!editPatientData[field] || editPatientData[field].toString().trim() === '') {
          setAlert({ type: 'danger', message });
          // Restore logout function before returning
          setLoading(false);
          window.__authLogout = originalLogout;
          return;
        }
      }

      // Call API to update patient
      await adminService.updatePatient(editPatientData.id, editPatientData);
      
      // Refresh data
      await Promise.all([
        fetchAllPatients(),
        fetchAllFamilies()
      ]);
      
      // Update selected patient data
      setSelectedPatient(editPatientData);
      
      // Close modal and show success
      setShowEditPatientModal(false);
      setAlert({ type: 'success', message: 'Patient information updated successfully!' });
    } catch (error) {
      console.error('Error updating patient:', error);
      setAlert({ type: 'danger', message: 'Error updating patient. Please try again.' });
    } finally {
      setLoading(false);
      // Restore logout function
      window.__authLogout = originalLogout;
    }
  }, [editPatientData, fetchAllPatients, fetchAllFamilies]);

  const handleEditPatientFormChange = useCallback((field, value) => {
    setEditPatientData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-calculate age from date of birth
      if (field === 'dateOfBirth') {
        if (value) {
          const today = new Date();
          const birthDate = new Date(value);
          if (!isNaN(birthDate.getTime())) {
            const age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
            newData.age = age >= 0 ? age.toString() : '';
          } else {
            newData.age = '';
          }
        } else {
          newData.age = '';
        }
      }
      
      return newData;
    });
  }, []);

  // Patient action handlers (functional implementations)
  const handleAutosort = useCallback(async () => {
    // PREVENT LOGOUT: Check if user is still authenticated before autosort
    if (!window.__authToken) {
      console.warn('No auth token available, skipping autosort');
      setAlert({ type: 'warning', message: 'Please log in again to perform autosort.' });
      return;
    }

    setIsLoadingAutosort(true);
    console.log('Starting autosort analysis...');
    
    try {
      // PREVENT LOGOUT: Disable global logout temporarily during autosort
      const originalLogout = window.__authLogout;
      window.__authLogout = null;
      
      try {
        console.log('Running autosort analysis...');
        const results = await adminService.autosortPatients();
        console.log('Autosort results:', results);
        
        // Show results in confirmation modal
        setAutosortResults(results);
        setShowAutosortConfirmModal(true);
        
      } finally {
        // RESTORE: Re-enable global logout
        window.__authLogout = originalLogout;
      }
    } catch (error) {
      console.error('Autosort error:', error);
      setAlert({ type: 'danger', message: 'Failed to analyze patients for auto-sorting.' });
    } finally {
      setIsLoadingAutosort(false);
    }
  }, []);

  const handleConfirmAutosort = useCallback(async () => {
    try {
      // Refresh data to show the changes
      await Promise.all([
        fetchAllPatients(),
        fetchAllFamilies(),
        fetchUnsortedMembers()
      ]);
      
      const sortedCount = autosortResults?.sorted?.length || 0;
      const needsManualCount = autosortResults?.needsManualAssignment?.length || 0;
      
      let message = `Autosort completed! ${sortedCount} patients assigned to families.`;
      if (needsManualCount > 0) {
        message += ` ${needsManualCount} patients need manual assignment.`;
      }
      
      setAlert({ type: 'success', message });
      setShowAutosortConfirmModal(false);
      setAutosortResults(null);
      
    } catch (error) {
      console.error('Error refreshing data after autosort:', error);
      setAlert({ type: 'warning', message: 'Autosort completed but failed to refresh data. Please refresh manually.' });
    }
  }, [autosortResults, fetchAllPatients, fetchAllFamilies, fetchUnsortedMembers]);

  const handleCancelAutosort = useCallback(() => {
    setShowAutosortConfirmModal(false);
    setAutosortResults(null);
  }, []);

  const resetForms = useCallback(() => {
    setPatientFormData({
      firstName: '',
      middleName: '',
      lastName: '',
      suffix: '',
      dateOfBirth: '',
      age: '',
      gender: '',
      civilStatus: '',
      contactNumber: '',
      email: '',
      houseNo: '',
      street: '',
      barangay: '',
      city: 'Pasig City',
      region: 'Metro Manila',
      postalCode: '1600',
      philHealthNumber: '',
      bloodType: '',
      medicalConditions: '',
      familyId: ''
    });
    setFamilyFormData({
      familyName: '',
      surname: '',
      headOfFamily: '',
      contactNumber: '',
      notes: ''
    });
    setAddingFamilyFromPatient(false);
  }, []);

  // Save handlers for form submissions
  const handleSavePatient = useCallback(async () => {
    // Temporarily prevent logout during API operation
    const originalLogout = window.__authLogout;
    
    try {
      // PREVENT LOGOUT: Check if user is still authenticated
      if (!window.__authToken) {
        console.warn('No auth token available, skipping save patient');
        setAlert({ type: 'warning', message: 'Please log in again to save patient.' });
        return;
      }

      window.__authLogout = null;

      // Validate required fields with specific messages
      const requiredFields = [
        { field: 'firstName', message: 'First Name is required' },
        { field: 'lastName', message: 'Last Name is required' },
        { field: 'dateOfBirth', message: 'Date of Birth is required' },
        { field: 'gender', message: 'Gender is required' },
        { field: 'civilStatus', message: 'Civil Status is required' },
        { field: 'contactNumber', message: 'Contact Number is required' },
        { field: 'street', message: 'Street is required' },
        { field: 'barangay', message: 'Barangay is required' }
      ];

      // Check for missing required fields
      for (const { field, message } of requiredFields) {
        if (!patientFormData[field] || patientFormData[field].toString().trim() === '') {
          setAlert({ type: 'danger', message });
          // Restore logout function before returning
          window.__authLogout = originalLogout;
          return;
        }
      }

      // Validate phone number format
      if (patientFormData.contactNumber) {
        const phoneRegex = /^09\d{9}$/;
        if (!phoneRegex.test(patientFormData.contactNumber)) {
          setAlert({ type: 'danger', message: 'Phone number must be exactly 11 digits starting with 09 (e.g., 09171234567)' });
          // Restore logout function before returning
          window.__authLogout = originalLogout;
          return;
        }
      }

      // Validate email field - must be either valid email or "N/A"
      if (patientFormData.email && 
          patientFormData.email.trim() !== '' && 
          patientFormData.email.toLowerCase() !== 'n/a') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(patientFormData.email)) {
          setAlert({ type: 'danger', message: 'Please enter a valid email address or type "N/A" if the patient has no email' });
          // Restore logout function before returning
          window.__authLogout = originalLogout;
          return;
        }
      }

      setLoading(true);

      // Create patient data object - dateOfBirth is already a 'YYYY-MM-DD' string
      const patientData = { ...patientFormData };

      // Make API call to create patient
      const response = await adminService.createPatient(patientData);
      
      // Clear form and close modal
      resetForms();
      setShowAddPatientModal(false);
      
      // Show generated password if user account was created
      if (response.hasUserAccount && response.generatedPassword) {
        setGeneratedPassword({
          password: response.generatedPassword,
          patientName: `${patientData.firstName} ${patientData.lastName}`,
          email: patientData.email,
          contactNumber: patientData.contactNumber
        });
      }
      
      // Refresh patients list
      await Promise.all([
        fetchAllPatients(),
        fetchAllFamilies()
      ]);
      
      // Show success message
      setAlert({ type: 'success', message: 'Patient added successfully!' });
    } catch (error) {
      console.error('Error saving patient:', error);
      setAlert({ type: 'danger', message: 'Error saving patient. Please try again.' });
    } finally {
      setLoading(false);
      // Restore logout function
      window.__authLogout = originalLogout;
    }
  }, [patientFormData, fetchAllPatients, fetchAllFamilies, resetForms]);

  const handleSaveFamily = useCallback(async () => {
    // Temporarily prevent logout during API operation
    const originalLogout = window.__authLogout;
    
    try {
      // PREVENT LOGOUT: Check if user is still authenticated
      if (!window.__authToken) {
        console.warn('No auth token available, skipping save family');
        setAlert({ type: 'warning', message: 'Please log in again to save family.' });
        return;
      }

      window.__authLogout = null;

      // Validate required fields
      if (!familyFormData.familyName.trim() || !familyFormData.surname.trim()) {
        setAlert({ type: 'danger', message: 'Family Name and Surname are required fields.' });
        // Restore logout function before returning
        window.__authLogout = originalLogout;
        return;
      }

      // Validate contact number if provided
      if (familyFormData.contactNumber.trim()) {
        if (familyFormData.contactNumber.length !== 11) {
          setAlert({ type: 'danger', message: 'Contact number must be exactly 11 digits.' });
          // Restore logout function before returning
          window.__authLogout = originalLogout;
          return;
        }
        if (!/^\d{11}$/.test(familyFormData.contactNumber)) {
          setAlert({ type: 'danger', message: 'Contact number must contain only numbers.' });
          // Restore logout function before returning
          window.__authLogout = originalLogout;
          return;
        }
      }

      setLoading(true);

      // Create family data object
      const familyData = {
        familyName: familyFormData.familyName.trim(),
        surname: familyFormData.surname.trim(),
        headOfFamily: familyFormData.headOfFamily.trim() || '',
        contactNumber: familyFormData.contactNumber.trim(),
        notes: familyFormData.notes.trim()
      };

      // Call API to create family
      const newFamily = await adminService.createFamily(familyData);
      
      // Refresh families data
      await Promise.all([
        fetchAllPatients(),
        fetchAllFamilies()
      ]);
      
      // Close modal and clear form
      setShowAddFamilyModal(false);
      resetForms();
      
      // If we came from Add Patient modal, go back to it and select the new family
      if (addingFamilyFromPatient) {
        setPatientFormData(prev => ({
          ...prev,
          familyId: newFamily.id
        }));
        setAddingFamilyFromPatient(false);
        setShowAddPatientModal(true);
        setAlert({ type: 'success', message: `Family "${newFamily.familyName}" created and assigned to patient!` });
      } else {
        // Show regular success message
        setAlert({ type: 'success', message: 'Family created successfully!' });
      }
    } catch (error) {
      console.error('Error saving family:', error);
      setAlert({ type: 'danger', message: 'Error saving family. Please try again.' });
    } finally {
      setLoading(false);
      // Restore logout function
      window.__authLogout = originalLogout;
    }
  }, [familyFormData, fetchAllPatients, fetchAllFamilies, resetForms, patientFormData.firstName, patientFormData.lastName]);

  return (
    <div className="patient-management">
      {alert && (
        <Alert 
          variant={alert.type} 
          onClose={() => setAlert(null)} 
          dismissible
          className="mb-3"
        >
          {alert.message}
        </Alert>
      )}

      {generatedPassword && (
        <Alert 
          variant="info" 
          onClose={() => setGeneratedPassword(null)} 
          dismissible
          className="mb-3"
        >
          <Alert.Heading>
            <i className="bi bi-key me-2"></i>
            Patient Login Credentials Generated
          </Alert.Heading>
          <p className="mb-2">
            <strong>Patient:</strong> {generatedPassword.patientName}
          </p>
          {generatedPassword.email && (
            <p className="mb-2">
              <strong>Login Username (Email):</strong> {generatedPassword.email}
            </p>
          )}
          {generatedPassword.contactNumber && (
            <p className="mb-2">
              <strong>Login Username (Phone):</strong> {generatedPassword.contactNumber}
            </p>
          )}
          <p className="mb-2">
            <strong>Generated Password:</strong> <code className="bg-light px-2 py-1 rounded">{generatedPassword.password}</code>
          </p>
          <hr />
          <p className="mb-0 text-muted">
            <i className="bi bi-info-circle me-1"></i>
            The password is based on their date of birth (dd-mm-yyyy format). The patient can change this password in their account settings after logging in.
          </p>
        </Alert>
      )}

      <Card>
        <Card.Header>
          <div className="management-header">
            <h3 className="management-title">
              <i className="bi bi-clipboard2-heart me-2"></i>
              Patient Database
            </h3>
            <div className="management-actions">
              <div className="search-box">
                <i className="bi bi-search search-icon"></i>
                <input 
                  type="text" 
                  placeholder="Search patient or family..." 
                  className="search-input"
                  value={searchTerm}
                  onChange={handlePatientSearch}
                />
              </div>
              <Button 
                variant="primary" 
                onClick={handleAddPatient}
                disabled={loading}
              >
                <i className="bi bi-plus-circle me-1"></i>
                Add Patient
              </Button>
              <Button 
                variant="success" 
                onClick={handleAddFamily}
                disabled={loading}
                className="ms-2"
              >
                <i className="bi bi-people-fill me-1"></i>
                Add Family
              </Button>
              <Button 
                variant="outline-secondary" 
                onClick={handleRefreshData}
                disabled={loading}
                className="ms-2"
              >
                <i className={`bi ${loading ? 'bi-arrow-clockwise rotate' : 'bi-arrow-clockwise'} me-1`}></i>
                Refresh Data
              </Button>
            </div>
          </div>
        </Card.Header>

        <Card.Body>
          <Tabs
            activeKey={tabKey}
            onSelect={(k) => setTabKey(k)}
            className="mb-3"
          >
            <Tab eventKey="families" title="Family Records">
              <div className="table-container">
                <Table hover responsive className="data-table">
                  <thead>
                    <tr>
                      <th 
                        style={{textAlign: 'left', cursor: 'pointer', userSelect: 'none'}}
                        onClick={() => requestSort('id', familySortConfig, setFamilySortConfig)}
                      >
                        Family ID
                        {familySortConfig.key === 'id' && (
                          <i className={`bi bi-arrow-${familySortConfig.direction === 'ascending' ? 'up' : 'down'} ms-1`}></i>
                        )}
                      </th>
                      <th 
                        style={{textAlign: 'left', cursor: 'pointer', userSelect: 'none'}}
                        onClick={() => requestSort('familyName', familySortConfig, setFamilySortConfig)}
                      >
                        Family Name
                        {familySortConfig.key === 'familyName' && (
                          <i className={`bi bi-arrow-${familySortConfig.direction === 'ascending' ? 'up' : 'down'} ms-1`}></i>
                        )}
                      </th>
                      <th style={{textAlign: 'left'}}>Family Head (Optional)</th>
                      <th 
                        style={{textAlign: 'right', cursor: 'pointer', userSelect: 'none'}}
                        onClick={() => requestSort('memberCount', familySortConfig, setFamilySortConfig)}
                      >
                        Number of Members
                        {familySortConfig.key === 'memberCount' && (
                          <i className={`bi bi-arrow-${familySortConfig.direction === 'ascending' ? 'up' : 'down'} ms-1`}></i>
                        )}
                      </th>
                      <th 
                        style={{textAlign: 'left', cursor: 'pointer', userSelect: 'none'}}
                        onClick={() => requestSort('createdAt', familySortConfig, setFamilySortConfig)}
                      >
                        Date Registered
                        {familySortConfig.key === 'createdAt' && (
                          <i className={`bi bi-arrow-${familySortConfig.direction === 'ascending' ? 'up' : 'down'} ms-1`}></i>
                        )}
                      </th>
                      <th style={{textAlign: 'center'}}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {familyPagination.currentPageItems.map((family) => (
                      <tr key={family.id}>
                        <td style={{textAlign: 'left'}}>{family.id}</td>
                        <td style={{textAlign: 'left'}}>{family.familyName}</td>
                        <td style={{textAlign: 'left'}}>{getFamilyHead(family)}</td>
                        <td style={{textAlign: 'right'}}>{getFamilyMemberCount(family)}</td>
                        <td style={{textAlign: 'left'}}>{formatShortDate(family.createdAt || family.registrationDate)}</td>
                        <td style={{textAlign: 'center'}} className="action-cell">
                          <Button variant="outline-primary" size="sm" onClick={() => handleViewFamily(family)}>
                            View Members
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                
                {/* Family Records Pagination */}
                {familyPagination.totalPages > 1 && (
                  <div className="pagination-container d-flex justify-content-between align-items-center mt-3">
                    <div className="pagination-info">
                      Showing {familyPagination.startIndex + 1} to {Math.min(familyPagination.endIndex, familyPagination.totalItems)} of {familyPagination.totalItems} families
                    </div>
                    <div className="pagination-controls">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => setFamilyCurrentPage(familyCurrentPage - 1)}
                        disabled={!familyPagination.hasPreviousPage}
                        className="me-1"
                      >
                        <i className="bi bi-chevron-left"></i>
                      </Button>
                      
                      {Array.from({ length: familyPagination.totalPages }, (_, i) => (
                        <Button
                          key={i + 1}
                          variant={familyCurrentPage === i + 1 ? "primary" : "outline-secondary"}
                          size="sm"
                          onClick={() => setFamilyCurrentPage(i + 1)}
                          className="me-1"
                        >
                          {i + 1}
                        </Button>
                      ))}
                      
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => setFamilyCurrentPage(familyCurrentPage + 1)}
                        disabled={!familyPagination.hasNextPage}
                      >
                        <i className="bi bi-chevron-right"></i>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Tab>

            <Tab eventKey="members" title="Individual Members">
              <div className="table-container">
                <Table hover responsive className="data-table">
                  <thead>
                    <tr>
                      <th 
                        style={{textAlign: 'left', cursor: 'pointer', userSelect: 'none'}}
                        onClick={() => requestSort('id', memberSortConfig, setMemberSortConfig)}
                      >
                        Patient ID
                        {memberSortConfig.key === 'id' && (
                          <i className={`bi bi-arrow-${memberSortConfig.direction === 'ascending' ? 'up' : 'down'} ms-1`}></i>
                        )}
                      </th>
                      <th 
                        style={{textAlign: 'left', cursor: 'pointer', userSelect: 'none'}}
                        onClick={() => requestSort('familyId', memberSortConfig, setMemberSortConfig)}
                      >
                        Family ID
                        {memberSortConfig.key === 'familyId' && (
                          <i className={`bi bi-arrow-${memberSortConfig.direction === 'ascending' ? 'up' : 'down'} ms-1`}></i>
                        )}
                      </th>
                      <th style={{textAlign: 'left', minWidth: '200px', width: '250px'}}>Name</th>
                      <th style={{textAlign: 'right'}}>Age</th>
                      <th style={{textAlign: 'left'}}>Gender</th>
                      <th style={{textAlign: 'left'}}>Contact Number</th>
                      <th 
                        style={{textAlign: 'left', cursor: 'pointer', userSelect: 'none'}}
                        onClick={() => requestSort('lastCheckup', memberSortConfig, setMemberSortConfig)}
                      >
                        Last Checkup
                        {memberSortConfig.key === 'lastCheckup' && (
                          <i className={`bi bi-arrow-${memberSortConfig.direction === 'ascending' ? 'up' : 'down'} ms-1`}></i>
                        )}
                      </th>
                      <th style={{textAlign: 'center'}}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientPagination.currentPageItems.map((patient) => (
                      <tr key={patient.id}>
                        <td style={{textAlign: 'left'}}>PT-{String(patient.id).padStart(4, '0')}</td>
                        <td style={{textAlign: 'left'}}>{patient.familyId || 'Unassigned'}</td>
                        <td style={{textAlign: 'left', minWidth: '200px', padding: '12px 8px'}}>
                          {getPatientFullName(patient)}
                        </td>
                        <td style={{textAlign: 'right'}}>{getPatientAge(patient)}</td>
                        <td style={{textAlign: 'left'}}>{patient.gender}</td>
                        <td style={{textAlign: 'left'}}>{getPatientContact(patient)}</td>
                        <td style={{textAlign: 'left'}}>
                          {formatShortDate(patient.lastCheckup || patient.createdAt)}
                        </td>
                        <td style={{textAlign: 'center'}} className="action-cell">
                          <div className="d-flex gap-1 justify-content-center">
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              onClick={() => handleViewPatient(patient)}
                            >
                              <i className="bi bi-eye me-1"></i>
                              View Info
                            </Button>
                            <Button 
                              variant="outline-success" 
                              size="sm" 
                              onClick={() => handleAutoLogin(patient)}
                              disabled={todaysCheckups?.some(checkup => checkup.patientId === patient.id)}
                            >
                              <i className="bi bi-calendar-plus me-1"></i>
                              {todaysCheckups?.some(checkup => checkup.patientId === patient.id) ? 'Checked In' : 'Check In Today'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                
                {/* Individual Members Pagination */}
                {patientPagination.totalPages > 1 && (
                  <div className="pagination-container d-flex justify-content-between align-items-center mt-3">
                    <div className="pagination-info">
                      Showing {patientPagination.startIndex + 1} to {Math.min(patientPagination.endIndex, patientPagination.totalItems)} of {patientPagination.totalItems} patients
                    </div>
                    <div className="pagination-controls">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => setMemberCurrentPage(memberCurrentPage - 1)}
                        disabled={!patientPagination.hasPreviousPage}
                        className="me-1"
                      >
                        <i className="bi bi-chevron-left"></i>
                      </Button>
                      
                      {Array.from({ length: patientPagination.totalPages }, (_, i) => (
                        <Button
                          key={i + 1}
                          variant={memberCurrentPage === i + 1 ? "primary" : "outline-secondary"}
                          size="sm"
                          onClick={() => setMemberCurrentPage(i + 1)}
                          className="me-1"
                        >
                          {i + 1}
                        </Button>
                      ))}
                      
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => setMemberCurrentPage(memberCurrentPage + 1)}
                        disabled={!patientPagination.hasNextPage}
                      >
                        <i className="bi bi-chevron-right"></i>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Tab>

            <Tab eventKey="unsorted" title={`Unsorted Members (${unsortedMembersData?.length || 0})`}>
              <div className="unsorted-section">
                <div className="section-header mb-4">
                  <div className="section-info">
                    <h4>Patients Without Family Assignment</h4>
                    <p className="text-muted mb-0">
                      These patients registered through the public form and need to be assigned to families.
                    </p>
                  </div>
                  <div className="section-actions">
                    <Button 
                      variant="success"
                      onClick={handleAutosort}
                      disabled={!unsortedMembersData?.length || isLoadingAutosort}
                    >
                      <i className="bi bi-magic me-1"></i>
                      {isLoadingAutosort ? 'Autosorting...' : 'AutoSort by Surname'}
                    </Button>
                  </div>
                </div>
                
                {!unsortedMembersData?.length ? (
                  <div className="empty-state">
                    <i className="bi bi-check-circle"></i>
                    <h4>All patients are sorted into families!</h4>
                    <p>No unsorted patients found. All patients have been assigned to families.</p>
                  </div>
                ) : (
                  <div className="table-container">
                    <Table hover responsive className="data-table">
                      <thead>
                        <tr>
                          <th style={{textAlign: 'left'}}>Name</th>
                          <th style={{textAlign: 'left'}}>Gender</th>
                          <th style={{textAlign: 'right'}}>Age</th>
                          <th style={{textAlign: 'left'}}>Contact</th>
                          <th style={{textAlign: 'left'}}>Registration Date</th>
                          <th style={{textAlign: 'center'}}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(unsortedMembersData || []).map(patient => (
                          <tr key={patient.id}>
                            <td style={{textAlign: 'left'}}>
                              <strong>{patient.firstName} {patient.lastName}</strong>
                            </td>
                            <td style={{textAlign: 'left'}}>{patient.gender}</td>
                            <td style={{textAlign: 'right'}}>{patient.age || 'N/A'}</td>
                            <td style={{textAlign: 'left'}}>{patient.contactNumber || 'N/A'}</td>
                            <td style={{textAlign: 'left'}}>
                              {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'N/A'}
                            </td>
                            <td style={{textAlign: 'center'}} className="action-cell">
                              <Button 
                                variant="outline-success" 
                                size="sm" 
                                onClick={() => handleOpenAssignFamilyModal(patient)}
                              >
                                Assign to Family
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </div>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      {/* Add Patient Modal with Optimized Forms */}
      <Modal 
        show={showAddPatientModal} 
        onHide={() => {setShowAddPatientModal(false); resetForms();}}
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Add New Patient</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {/* Personal Information Card */}
            <Card className="mb-3">
              <Card.Header as="h5" className="my-2 bg-light">
                <i className="bi bi-person me-2"></i>Personal Information
              </Card.Header>
              <Card.Body>
                <Row className="mb-3">
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>First Name <span className="text-danger">*</span></Form.Label>
                      <Form.Control 
                        type="text" 
                        value={patientFormData.firstName} 
                        onChange={(e) => handlePatientFormChange('firstName', e.target.value)} 
                        required 
                        placeholder="Enter first name"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Middle Name</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={patientFormData.middleName} 
                        onChange={(e) => handlePatientFormChange('middleName', e.target.value)}
                        placeholder="Enter middle name"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Last Name <span className="text-danger">*</span></Form.Label>
                      <Form.Control 
                        type="text" 
                        value={patientFormData.lastName} 
                        onChange={(e) => handlePatientFormChange('lastName', e.target.value)} 
                        required 
                        placeholder="Enter last name"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Suffix</Form.Label>
                      <Form.Select 
                        value={patientFormData.suffix} 
                        onChange={(e) => handlePatientFormChange('suffix', e.target.value)}
                      >
                        <option value="">Select</option>
                        <option value="Jr.">Jr.</option>
                        <option value="Sr.">Sr.</option>
                        <option value="II">II</option>
                        <option value="III">III</option>
                        <option value="IV">IV</option>
                        <option value="V">V</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row className="mb-3">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Date of Birth <span className="text-danger">*</span></Form.Label>
                      <Form.Control 
                        type="date" 
                        value={patientFormData.dateOfBirth} 
                        onChange={(e) => handlePatientFormChange('dateOfBirth', e.target.value)} 
                        max={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>Age</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={patientFormData.age} 
                        readOnly 
                        className="bg-light"
                        placeholder="Auto-calculated"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Gender <span className="text-danger">*</span></Form.Label>
                      <Form.Select
                        value={patientFormData.gender}
                        onChange={(e) => handlePatientFormChange('gender', e.target.value)}
                        required
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Civil Status <span className="text-danger">*</span></Form.Label>
                      <Form.Select
                        value={patientFormData.civilStatus}
                        onChange={(e) => handlePatientFormChange('civilStatus', e.target.value)}
                        required
                      >
                        <option value="">Select Status</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
            
            {/* Contact Information Card */}
            <Card className="mb-3">
              <Card.Header as="h5" className="my-2 bg-light">
                <i className="bi bi-telephone me-2"></i>Contact Information
              </Card.Header>
              <Card.Body>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Email (Optional)</Form.Label>
                      <Form.Control 
                        type="email" 
                        value={patientFormData.email} 
                        onChange={(e) => handlePatientFormChange('email', e.target.value)}
                        placeholder="Enter email or 'N/A' if none"
                      />
                      <Form.Text className="text-muted">
                        Optional: Enter a valid email address or type "N/A" if the patient has no email
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Phone Number <span className="text-danger">*</span></Form.Label>
                      <Form.Control 
                        type="tel" 
                        value={patientFormData.contactNumber} 
                        onChange={(e) => handlePatientFormChange('contactNumber', e.target.value)} 
                        placeholder="09XXXXXXXXX" 
                        pattern="^09\\d{9}$" 
                        maxLength="11"
                        title="Must be a valid PH mobile number starting with 09 (11 digits total)"
                        required
                      />
                      <Form.Text className="text-muted">
                        Format: 09XXXXXXXXX (11 digits total)
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
            
            {/* Address Information Card */}
            <Card className="mb-3">
              <Card.Header as="h5" className="my-2 bg-light">
                <i className="bi bi-geo-alt me-2"></i>Address
              </Card.Header>
              <Card.Body>
                <Row className="mb-3">
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>House No.</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={patientFormData.houseNo} 
                        onChange={(e) => handlePatientFormChange('houseNo', e.target.value)}
                        placeholder="123"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Street <span className="text-danger">*</span></Form.Label>
                      <Form.Select
                        value={patientFormData.street}
                        onChange={(e) => handlePatientFormChange('street', e.target.value)}
                        required
                      >
                        <option value="">Select Street</option>
                        <option value="Amang Rodriguez Avenue">Amang Rodriguez Avenue</option>
                        <option value="C. Raymundo Avenue">C. Raymundo Avenue</option>
                        <option value="Ortigas Avenue">Ortigas Avenue</option>
                        <option value="Shaw Boulevard">Shaw Boulevard</option>
                        <option value="E. Rodriguez Jr. Avenue (C-5)">E. Rodriguez Jr. Avenue (C-5)</option>
                        <option value="Marcos Highway">Marcos Highway</option>
                        <option value="Julia Vargas Avenue">Julia Vargas Avenue</option>
                        <option value="F. Legaspi Bridge">F. Legaspi Bridge</option>
                        <option value="San Guillermo Street">San Guillermo Street</option>
                        <option value="Dr. Sixto Antonio Avenue">Dr. Sixto Antonio Avenue</option>
                        <option value="Other">Other</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Barangay <span className="text-danger">*</span></Form.Label>
                      <Form.Select
                        value={patientFormData.barangay}
                        onChange={(e) => handlePatientFormChange('barangay', e.target.value)}
                        required
                      >
                        <option value="">Select Barangay</option>
                        <option value="Bagong Ilog">Bagong Ilog</option>
                        <option value="Bagong Katipunan">Bagong Katipunan</option>
                        <option value="Bambang">Bambang</option>
                        <option value="Buting">Buting</option>
                        <option value="Caniogan">Caniogan</option>
                        <option value="Dela Paz">Dela Paz</option>
                        <option value="Kalawaan">Kalawaan</option>
                        <option value="Kapasigan">Kapasigan</option>
                        <option value="Kapitolyo">Kapitolyo</option>
                        <option value="Malinao">Malinao</option>
                        <option value="Manggahan">Manggahan</option>
                        <option value="Maybunga">Maybunga</option>
                        <option value="Oranbo">Oranbo</option>
                        <option value="Palatiw">Palatiw</option>
                        <option value="Pinagbuhatan">Pinagbuhatan</option>
                        <option value="Pineda">Pineda</option>
                        <option value="Rosario">Rosario</option>
                        <option value="Sagad">Sagad</option>
                        <option value="San Antonio">San Antonio</option>
                        <option value="San Joaquin">San Joaquin</option>
                        <option value="San Jose">San Jose</option>
                        <option value="San Miguel">San Miguel</option>
                        <option value="San Nicolas">San Nicolas</option>
                        <option value="Santa Cruz">Santa Cruz</option>
                        <option value="Santa Lucia">Santa Lucia</option>
                        <option value="Santa Rosa">Santa Rosa</option>
                        <option value="Santo Tomas">Santo Tomas</option>
                        <option value="Santolan">Santolan</option>
                        <option value="Sumilang">Sumilang</option>
                        <option value="Ugong">Ugong</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>City</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={patientFormData.city} 
                        onChange={(e) => handlePatientFormChange('city', e.target.value)}
                        readOnly
                        className="bg-light"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>Postal Code</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={patientFormData.postalCode} 
                        onChange={(e) => handlePatientFormChange('postalCode', e.target.value)}
                        readOnly
                        className="bg-light"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Medical Information Card */}
            <Card className="mb-3">
              <Card.Header as="h5" className="my-2 bg-light">
                <i className="bi bi-heart-pulse me-2"></i>Medical Information
              </Card.Header>
              <Card.Body>
                <Row className="mb-3">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>PhilHealth Number</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={patientFormData.philHealthNumber} 
                        onChange={(e) => handlePatientFormChange('philHealthNumber', e.target.value)}
                        placeholder="Enter PhilHealth number"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Blood Type</Form.Label>
                      <Form.Select
                        value={patientFormData.bloodType}
                        onChange={(e) => handlePatientFormChange('bloodType', e.target.value)}
                      >
                        <option value="">Select Blood Type</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Family Assignment</Form.Label>
                      <div className="d-flex gap-2">
                        <Form.Select
                          value={patientFormData.familyId}
                          onChange={(e) => handlePatientFormChange('familyId', e.target.value)}
                          style={{flex: 1}}
                        >
                          <option value="">No Family (Individual Patient)</option>
                          {familiesData?.map(family => (
                            <option key={family.id} value={family.id}>
                              {family.familyName} (ID: {family.id})
                            </option>
                          ))}
                        </Form.Select>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => {
                            setAddingFamilyFromPatient(true);
                            setShowAddFamilyModal(true);
                          }}
                          title="Add New Family"
                          style={{whiteSpace: 'nowrap'}}
                        >
                          <i className="bi bi-plus-circle"></i> Add Family
                        </Button>
                      </div>
                      <Form.Text className="text-muted">
                        Family assignment is optional. You can add the patient individually or create a new family.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>Medical Conditions</Form.Label>
                      <Form.Control 
                        as="textarea"
                        rows={3}
                        value={patientFormData.medicalConditions} 
                        onChange={(e) => handlePatientFormChange('medicalConditions', e.target.value)}
                        placeholder="Enter any known medical conditions, allergies, or notes..."
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {setShowAddPatientModal(false); resetForms();}}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSavePatient} disabled={loading}>
            <i className="bi bi-person-plus me-1"></i>
            {loading ? 'Adding...' : 'Add Patient'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Family Modal */}
      <Modal 
        show={showAddFamilyModal} 
        onHide={() => {
          setShowAddFamilyModal(false); 
          resetForms();
          setAddingFamilyFromPatient(false);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Add New Family</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Family Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control 
                    type="text" 
                    value={familyFormData.familyName} 
                    onChange={(e) => handleFamilyFormChange('familyName', e.target.value)}
                    placeholder="Enter family name"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Surname <span className="text-danger">*</span></Form.Label>
                  <Form.Control 
                    type="text" 
                    value={familyFormData.surname} 
                    onChange={(e) => handleFamilyFormChange('surname', e.target.value)}
                    placeholder="Enter surname"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Head of Family</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={familyFormData.headOfFamily} 
                    onChange={(e) => handleFamilyFormChange('headOfFamily', e.target.value)}
                    placeholder="Enter head of family name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Contact Number</Form.Label>
                  <Form.Control 
                    type="tel" 
                    value={familyFormData.contactNumber} 
                    onChange={(e) => handleFamilyFormChange('contactNumber', e.target.value)}
                    placeholder="09XXXXXXXXX"
                    pattern="^09\\d{9}$" 
                    maxLength="11"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Notes</Form.Label>
                  <Form.Control 
                    as="textarea"
                    rows={3}
                    value={familyFormData.notes} 
                    onChange={(e) => handleFamilyFormChange('notes', e.target.value)}
                    placeholder="Enter any additional notes about the family..."
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowAddFamilyModal(false); 
            resetForms();
            setAddingFamilyFromPatient(false);
          }}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveFamily} disabled={loading}>
            <i className="bi bi-people-fill me-1"></i>
            {loading ? 'Adding...' : 'Add Family'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Assign Family Modal */}
      <Modal 
        show={showAssignFamilyModal} 
        onHide={() => setShowAssignFamilyModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Assign Patient to Family</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUnsortedPatient && (
            <div>
              <div className="mb-3">
                <h6>Patient: <strong>{selectedUnsortedPatient.firstName} {selectedUnsortedPatient.lastName}</strong></h6>
                <p className="text-muted mb-0">Select a family to assign this patient to:</p>
              </div>
              <Form>
                <Form.Group>
                  <Form.Label>Select Family</Form.Label>
                  <Form.Select required>
                    <option value="">Choose a family...</option>
                    {familiesData?.map(family => (
                      <option key={family.id} value={family.id}>
                        {family.familyName} (ID: {family.id}) - {getFamilyMemberCount(family)} members
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Form>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssignFamilyModal(false)}>
            Cancel
          </Button>
          <Button variant="primary">
            <i className="bi bi-person-check me-1"></i>
            Assign to Family
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Patient Details Modal - Enhanced Version */}
      <Modal 
        show={showPatientDetailsModal} 
        onHide={() => {
          setShowPatientDetailsModal(false);
          setShowManageDropdown(false);
        }}
        size="xl"
        centered
        className="patient-details-modal patient-details-modal-wider"
      >
        <Modal.Header 
          closeButton 
          style={{
            background: 'var(--sidebar-bg)', 
            color: 'var(--sidebar-text)', 
            border: 'none',
            borderRadius: '12px 12px 0 0'
          }}
        >
          <Modal.Title className="d-flex align-items-center">
            <i className="bi bi-person-circle me-3" style={{fontSize: '1.5rem'}}></i>
            Patient Information
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body style={{background: 'var(--bg-primary)', padding: 0}}>
          {selectedPatient && (
            <div style={{padding: '24px'}}>
              {/* Header Section with Patient Name and Actions */}
              <div className="d-flex justify-content-between align-items-center mb-4" style={{
                background: 'var(--bg-secondary)', 
                padding: '20px', 
                borderRadius: '12px',
                border: '1px solid var(--border-primary)'
              }}>
                <div>
                  <h3 style={{color: 'var(--text-primary)', margin: 0, fontWeight: 600}}>
                    {selectedPatient.fullName || getPatientFullName(selectedPatient)}
                  </h3>
                  <span style={{
                    color: 'var(--accent-primary)', 
                    fontSize: '0.9rem', 
                    fontWeight: 500
                  }}>
                    Patient ID: PT-{String(selectedPatient.id).padStart(4, '0')}
                  </span>
                </div>
                
                <div className="d-flex gap-2">
                  <Button 
                    variant="warning" 
                    size="sm"
                    className="auto-login-btn"
                    style={{borderRadius: '8px', fontWeight: 500}}
                    onClick={() => handleAutoLogin(selectedPatient)}
                  >
                    <i className="bi bi-check-circle me-1"></i>
                    Auto Login
                  </Button>
                  <Button 
                    variant="outline-success" 
                    size="sm"
                    style={{borderRadius: '8px', fontWeight: 500}}
                    onClick={() => handleQRCode(selectedPatient)}
                  >
                    <i className="bi bi-qr-code me-1"></i>
                    {patientsWithQR.has(selectedPatient?.id) ? 'View QR' : 'Generate QR'}
                  </Button>
                  <div className="position-relative">
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={handleManageDropdown}
                      style={{borderRadius: '8px', fontWeight: 500}}
                    >
                      <i className="bi bi-gear me-1"></i>
                      Manage
                      <i className={`bi ${showManageDropdown ? 'bi-chevron-up' : 'bi-chevron-down'} ms-1`}></i>
                    </Button>
                    {showManageDropdown && (
                      <div 
                        className="position-absolute" 
                        style={{
                          top: '100%',
                          right: 0,
                          zIndex: 1000,
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-primary)',
                          borderRadius: '8px',
                          minWidth: '200px',
                          marginTop: '4px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                      >
                        <button 
                          className="w-100 btn btn-sm text-start d-flex align-items-center gap-2"
                          onClick={handleEditPatient}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--primary)',
                            padding: '8px 16px'
                          }}
                        >
                          <i className="bi bi-pencil-square"></i>
                          Edit Patient Info
                        </button>
                        <button 
                          className="w-100 btn btn-sm text-start d-flex align-items-center gap-2"
                          onClick={handleViewRegistrationForm}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--info)',
                            padding: '8px 16px'
                          }}
                        >
                          <i className="bi bi-file-text"></i>
                          View Registration Form
                        </button>
                        <hr style={{margin: '4px 0', borderColor: 'var(--border-primary)'}} />
                        <button 
                          className="w-100 btn btn-sm text-start d-flex align-items-center gap-2"
                          onClick={handleReassignFamily}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--warning)',
                            padding: '8px 16px'
                          }}
                        >
                          <i className="bi bi-arrow-left-right"></i>
                          Reassign to New Family
                        </button>
                        <hr style={{margin: '4px 0', borderColor: 'var(--border-primary)'}} />
                        <button 
                          className="w-100 btn btn-sm text-start d-flex align-items-center gap-2"
                          onClick={handleDeletePatient}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--error)',
                            padding: '8px 16px'
                          }}
                        >
                          <i className="bi bi-trash"></i>
                          Delete Patient
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Information Cards Grid */}
              <PatientInfoCards selectedPatient={selectedPatient} />

              {/* Patient Actions Section */}
              <PatientActionsSection 
                selectedPatient={selectedPatient}
              />
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Confirmation Modal for Manage Actions */}
      <Modal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        centered
        size="sm"
      >
        <Modal.Header 
          closeButton
          style={{
            background: confirmAction === 'delete' ? 'var(--error)' : 'var(--warning)',
            color: 'white',
            border: 'none'
          }}
        >
          <Modal.Title>
            <i className={`bi ${confirmAction === 'delete' ? 'bi-exclamation-triangle' : 'bi-question-circle'} me-2`}></i>
            {confirmAction === 'reassign' ? 'Confirm Family Reassignment' : 'Confirm Patient Deletion'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{background: 'var(--bg-secondary)'}}>
          <div className="text-center">
            <div className="mb-3">
              <i 
                className={`bi ${confirmAction === 'delete' ? 'bi-exclamation-triangle' : 'bi-question-circle'}`}
                style={{
                  fontSize: '3rem',
                  color: confirmAction === 'delete' ? 'var(--error)' : 'var(--warning)'
                }}
              ></i>
            </div>
            <div>
              {confirmAction === 'reassign' ? (
                <>
                  <h6 style={{color: 'var(--text-primary)'}}>
                    Reassign Patient to New Family?
                  </h6>
                  <p style={{color: 'var(--text-secondary)'}}>
                    Patient: <strong>{selectedPatient?.firstName} {selectedPatient?.lastName}</strong>
                  </p>
                  <p style={{color: 'var(--text-secondary)'}}>
                    Current Family: <strong>{selectedPatient?.familyName || 'Unassigned'}</strong>
                  </p>
                  
                  <div className="mt-3">
                    <label style={{color: 'var(--text-primary)', fontWeight: 'bold'}}>
                      Select New Family:
                    </label>
                    <select 
                      className="form-select mt-2"
                      value={selectedFamilyForAssignment}
                      onChange={(e) => setSelectedFamilyForAssignment(e.target.value)}
                      style={{
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <option value="">Choose a family...</option>
                      {familiesData
                        .filter(family => family.id !== selectedPatient?.familyId)
                        .map(family => (
                          <option key={family.id} value={family.id}>
                            {family.familyName} ({family.surname})
                          </option>
                        ))
                      }
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <h6 style={{color: 'var(--text-primary)'}}>
                    Delete Patient Record?
                  </h6>
                  <p style={{color: 'var(--text-secondary)'}}>
                    This action cannot be undone. All patient data will be permanently deleted.
                  </p>
                </>
              )}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer style={{background: 'var(--bg-secondary)', border: 'none'}}>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>
          <Button 
            variant={confirmAction === 'delete' ? 'danger' : 'warning'}
            onClick={async () => {
              if (confirmAction === 'reassign') {
                // PREVENT LOGOUT: Check if user is still authenticated
                if (!window.__authToken) {
                  console.warn('No auth token available, skipping reassign');
                  setAlert({ type: 'warning', message: 'Please log in again to reassign patient.' });
                  setShowConfirmModal(false);
                  return;
                }

                // Temporarily prevent logout during API operation
                const originalLogout = window.__authLogout;
                window.__authLogout = null;

                try {
                  setLoading(true);
                  console.log('Reassigning patient:', selectedPatient, 'to family:', selectedFamilyForAssignment);
                  
                  // Validate family selection
                  if (!selectedFamilyForAssignment) {
                    setAlert({ type: 'danger', message: 'Please select a family to assign the patient to.' });
                    window.__authLogout = originalLogout;
                    return;
                  }

                  // Call API to assign patient to family
                  await adminService.assignPatientToFamily(selectedPatient.id, selectedFamilyForAssignment);
                  
                  // Refresh data
                  await Promise.all([
                    fetchAllPatients(),
                    fetchAllFamilies()
                  ]);
                  
                  setShowConfirmModal(false);
                  setAlert({ type: 'success', message: `Patient ${selectedPatient.firstName} ${selectedPatient.lastName} has been successfully assigned to the selected family!` });
                } catch (error) {
                  console.error('Error reassigning patient:', error);
                  setAlert({ type: 'danger', message: 'Error reassigning patient. Please try again.' });
                } finally {
                  setLoading(false);
                  // Restore logout function
                  window.__authLogout = originalLogout;
                }
              } else {
                console.log(`${confirmAction} action confirmed for patient:`, selectedPatient);
                setShowConfirmModal(false);
                // Implementation for actual delete would go here
              }
            }}
          >
            {confirmAction === 'reassign' ? 'Reassign' : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Family Members Modal */}
      <Modal 
        show={showFamilyModal} 
        onHide={() => setShowFamilyModal(false)} 
        size="lg"
        className="family-members-modal-wide"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-people-fill me-2"></i>
            Family Members
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedFamily && (
            <>
              <div className="mb-4">
                <h5 className="text-primary">{selectedFamily.familyName}</h5>
                <div className="row">
                  <div className="col-md-6">
                    <p><strong>Family ID:</strong> {selectedFamily.id}</p>
                    <p><strong>Head of Family:</strong> {selectedFamily.headOfFamily || 'Not specified'}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Contact Number:</strong> {selectedFamily.contactNumber || 'N/A'}</p>
                    <p><strong>Registration Date:</strong> {formatShortDate(selectedFamily.createdAt || selectedFamily.registrationDate)}</p>
                  </div>
                </div>
              </div>
              
              <Table hover responsive className="data-table">
                <thead>
                  <tr>
                    <th style={{textAlign: 'left'}}>Patient ID</th>
                    <th style={{textAlign: 'left'}}>Name</th>
                    <th style={{textAlign: 'right'}}>Age</th>
                    <th style={{textAlign: 'left'}}>Gender</th>
                    <th style={{textAlign: 'left'}}>Contact Number</th>
                    <th style={{textAlign: 'left'}}>Last Checkup</th>
                    <th style={{textAlign: 'center'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFamilyMembers(selectedFamily.id).length > 0 ? (
                    getFamilyMembers(selectedFamily.id).map(member => (
                      <tr key={member.id}>
                        <td style={{textAlign: 'left'}}>PT-{String(member.id).padStart(4, '0')}</td>
                        <td style={{textAlign: 'left'}}>{getPatientFullName(member)}</td>
                        <td style={{textAlign: 'right'}}>{getPatientAge(member)}</td>
                        <td style={{textAlign: 'left'}}>{member.gender}</td>
                        <td style={{textAlign: 'left'}}>{getPatientContact(member)}</td>
                        <td style={{textAlign: 'left'}}>{formatShortDate(member.lastCheckup || member.createdAt)}</td>
                        <td style={{textAlign: 'center'}} className="action-cell">
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            onClick={() => { 
                              setShowFamilyModal(false); 
                              setTimeout(() => {
                                setSelectedPatient(member);
                                setShowPatientDetailsModal(true);
                              }, 300); 
                            }}
                          >
                            View Information
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center text-muted py-4">
                        <i className="bi bi-people me-2"></i>
                        No members found in this family
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFamilyModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* QR Code Modal */}
      <Modal show={showQRModal} onHide={() => setShowQRModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-qr-code me-2"></i>
            Patient Check-in QR Code
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {qrCodeData && selectedPatient ? (
            <div>
              <div className="text-center mb-4">
                <h5 className="mb-3">
                  <strong>{selectedPatient.firstName} {selectedPatient.lastName}</strong>
                </h5>
                <p className="text-muted mb-4">
                  Scan this QR code to check in for today's appointment
                </p>
                
                <div 
                  id="qr-code-container" 
                  className="d-inline-block p-4 bg-white border rounded"
                  style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}
                >
                  <QRCodeSVG 
                    value={qrCodeData} 
                    size={250}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="M"
                    includeMargin={true}
                  />
                </div>
              </div>
              
              <div className="row">
                <div className="col-md-6">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">
                        <i className="bi bi-info-circle me-2"></i>
                        Instructions
                      </h6>
                    </div>
                    <div className="card-body">
                      <ol className="mb-0">
                        <li>Open your camera app</li>
                        <li>Point camera at QR code</li>
                        <li>Tap the notification that appears</li>
                        <li>Complete your check-in</li>
                      </ol>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">
                        <i className="bi bi-shield-check me-2"></i>
                        Security
                      </h6>
                    </div>
                    <div className="card-body">
                      <p className="mb-1">
                        <small>
                          <strong>Valid for:</strong> Today's appointment only<br/>
                          <strong>Generated:</strong> {new Date().toLocaleString()}<br/>
                          <strong>Patient ID:</strong> {selectedPatient.id}
                        </small>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="alert alert-info mt-3">
                <div className="d-flex align-items-start">
                  <i className="bi bi-lightbulb me-2 mt-1"></i>
                  <div>
                    <strong>Note:</strong> QR codes do not expire and can be used multiple times. 
                    However, each scan will check the patient in for today's appointment only.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Generating QR Code...</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <div>
            <Button 
              variant="info" 
              onClick={() => {
                const qrContainer = document.getElementById('qr-code-container');
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const svgData = new XMLSerializer().serializeToString(qrContainer.querySelector('svg'));
                const img = new Image();
                
                img.onload = function() {
                  canvas.width = img.width;
                  canvas.height = img.height;
                  ctx.fillStyle = 'white';
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                  ctx.drawImage(img, 0, 0);
                  
                  const link = document.createElement('a');
                  link.download = `${selectedPatient.firstName}_${selectedPatient.lastName}_QR_Code.png`;
                  link.href = canvas.toDataURL();
                  link.click();
                };
                
                img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
              }}
            >
              <i className="bi bi-download me-2"></i>
              Download
            </Button>
            
            <Button 
              variant="outline-info" 
              className="ms-2"
              onClick={() => {
                const printWindow = window.open('', '_blank');
                const qrContainer = document.getElementById('qr-code-container').outerHTML;
                
                printWindow.document.write(`
                  <html>
                    <head>
                      <title>QR Code - ${selectedPatient.firstName} ${selectedPatient.lastName}</title>
                      <style>
                        body { 
                          font-family: Arial, sans-serif; 
                          text-align: center; 
                          padding: 20px; 
                        }
                        .header { 
                          margin-bottom: 20px; 
                        }
                        .qr-container { 
                          margin: 20px auto; 
                        }
                        .instructions { 
                          margin-top: 20px; 
                          text-align: left; 
                          max-width: 400px; 
                          margin-left: auto; 
                          margin-right: auto; 
                        }
                      </style>
                    </head>
                    <body>
                      <div class="header">
                        <h2>Patient Check-in QR Code</h2>
                        <h3>${selectedPatient.firstName} ${selectedPatient.lastName}</h3>
                        <p>Scan to check in for today's appointment</p>
                      </div>
                      <div class="qr-container">
                        ${qrContainer}
                      </div>
                      <div class="instructions">
                        <h4>Instructions:</h4>
                        <ol>
                          <li>Open your camera app</li>
                          <li>Point camera at QR code</li>
                          <li>Tap the notification that appears</li>
                          <li>Complete your check-in</li>
                        </ol>
                        <p><small>Generated: ${new Date().toLocaleString()}</small></p>
                      </div>
                    </body>
                  </html>
                `);
                printWindow.document.close();
                printWindow.print();
              }}
            >
              <i className="bi bi-printer me-2"></i>
              Print
            </Button>
          </div>
          
          <Button variant="secondary" onClick={() => setShowQRModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Patient Modal */}
      <Modal 
        show={showEditPatientModal} 
        onHide={() => setShowEditPatientModal(false)}
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-pencil-square me-2"></i>
            Edit Patient Information
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editPatientData && (
            <Form>
              {/* Personal Information Card */}
              <Card className="mb-3">
                <Card.Header as="h5" className="my-2 bg-light">
                  <i className="bi bi-person me-2"></i>Personal Information
                </Card.Header>
                <Card.Body>
                  <Row className="mb-3">
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>First Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control 
                          type="text" 
                          value={editPatientData.firstName || ''} 
                          onChange={(e) => handleEditPatientFormChange('firstName', e.target.value)} 
                          required 
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Middle Name</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={editPatientData.middleName || ''} 
                          onChange={(e) => handleEditPatientFormChange('middleName', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Last Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control 
                          type="text" 
                          value={editPatientData.lastName || ''} 
                          onChange={(e) => handleEditPatientFormChange('lastName', e.target.value)} 
                          required 
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Suffix</Form.Label>
                        <Form.Select 
                          value={editPatientData.suffix || ''} 
                          onChange={(e) => handleEditPatientFormChange('suffix', e.target.value)}
                        >
                          <option value="">Select</option>
                          <option value="Jr.">Jr.</option>
                          <option value="Sr.">Sr.</option>
                          <option value="II">II</option>
                          <option value="III">III</option>
                          <option value="IV">IV</option>
                          <option value="V">V</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row className="mb-3">
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Date of Birth <span className="text-danger">*</span></Form.Label>
                        <Form.Control 
                          type="date" 
                          value={editPatientData.dateOfBirth ? editPatientData.dateOfBirth.split('T')[0] : ''} 
                          onChange={(e) => handleEditPatientFormChange('dateOfBirth', e.target.value)} 
                          max={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={2}>
                      <Form.Group>
                        <Form.Label>Age</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={editPatientData.age || ''} 
                          readOnly 
                          className="bg-light"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Gender <span className="text-danger">*</span></Form.Label>
                        <Form.Select
                          value={editPatientData.gender || ''}
                          onChange={(e) => handleEditPatientFormChange('gender', e.target.value)}
                          required
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Civil Status <span className="text-danger">*</span></Form.Label>
                        <Form.Select
                          value={editPatientData.civilStatus || ''}
                          onChange={(e) => handleEditPatientFormChange('civilStatus', e.target.value)}
                          required
                        >
                          <option value="">Select Status</option>
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                          <option value="Divorced">Divorced</option>
                          <option value="Widowed">Widowed</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
              
              {/* Contact Information */}
              <Card className="mb-3">
                <Card.Header as="h5" className="my-2 bg-light">
                  <i className="bi bi-telephone me-2"></i>Contact Information
                </Card.Header>
                <Card.Body>
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Email</Form.Label>
                        <Form.Control 
                          type="email" 
                          value={editPatientData.email || ''} 
                          onChange={(e) => handleEditPatientFormChange('email', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Phone Number <span className="text-danger">*</span></Form.Label>
                        <Form.Control 
                          type="tel" 
                          value={editPatientData.contactNumber || ''} 
                          onChange={(e) => handleEditPatientFormChange('contactNumber', e.target.value)} 
                          placeholder="09XXXXXXXXX" 
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Medical Information */}
              <Card className="mb-3">
                <Card.Header as="h5" className="my-2 bg-light">
                  <i className="bi bi-heart-pulse me-2"></i>Medical Information
                </Card.Header>
                <Card.Body>
                  <Row className="mb-3">
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>PhilHealth Number</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={editPatientData.philHealthNumber || ''} 
                          onChange={(e) => handleEditPatientFormChange('philHealthNumber', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Blood Type</Form.Label>
                        <Form.Select
                          value={editPatientData.bloodType || ''}
                          onChange={(e) => handleEditPatientFormChange('bloodType', e.target.value)}
                        >
                          <option value="">Select Blood Type</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Family Assignment</Form.Label>
                        <Form.Select
                          value={editPatientData.familyId || ''}
                          onChange={(e) => handleEditPatientFormChange('familyId', e.target.value)}
                        >
                          <option value="">No Family (Individual Patient)</option>
                          {familiesData?.map(family => (
                            <option key={family.id} value={family.id}>
                              {family.familyName} (ID: {family.id})
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label>Medical Conditions</Form.Label>
                        <Form.Control 
                          as="textarea"
                          rows={3}
                          value={editPatientData.medicalConditions || ''} 
                          onChange={(e) => handleEditPatientFormChange('medicalConditions', e.target.value)}
                          placeholder="Enter any known medical conditions, allergies, or notes..."
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditPatientModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveEditPatient} disabled={loading}>
            <i className="bi bi-check-circle me-1"></i>
            {loading ? 'Updating...' : 'Update Patient'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Registration Form Modal */}
      <Modal 
        show={showViewRegistrationModal} 
        onHide={() => setShowViewRegistrationModal(false)}
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-file-text me-2"></i>
            Patient Registration Form
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPatient && (
            <div>
              <div className="text-center mb-4">
                <h4 className="text-primary">{getPatientFullName(selectedPatient)}</h4>
                <p className="text-muted">Patient ID: PT-{String(selectedPatient.id).padStart(4, '0')}</p>
              </div>

              {/* Registration Information in Read-Only Format */}
              <Card className="mb-3">
                <Card.Header as="h5" className="my-2 bg-light">
                  <i className="bi bi-person me-2"></i>Personal Information
                </Card.Header>
                <Card.Body>
                  <Row className="mb-3">
                    <Col md={3}>
                      <strong>First Name:</strong><br/>
                      {selectedPatient.firstName || 'N/A'}
                    </Col>
                    <Col md={3}>
                      <strong>Middle Name:</strong><br/>
                      {selectedPatient.middleName || 'N/A'}
                    </Col>
                    <Col md={3}>
                      <strong>Last Name:</strong><br/>
                      {selectedPatient.lastName || 'N/A'}
                    </Col>
                    <Col md={3}>
                      <strong>Suffix:</strong><br/>
                      {selectedPatient.suffix || 'N/A'}
                    </Col>
                  </Row>
                  <Row className="mb-3">
                    <Col md={3}>
                      <strong>Date of Birth:</strong><br/>
                      {formatShortDate(selectedPatient.dateOfBirth)}
                    </Col>
                    <Col md={2}>
                      <strong>Age:</strong><br/>
                      {getPatientAge(selectedPatient)}
                    </Col>
                    <Col md={3}>
                      <strong>Gender:</strong><br/>
                      {selectedPatient.gender || 'N/A'}
                    </Col>
                    <Col md={4}>
                      <strong>Civil Status:</strong><br/>
                      {selectedPatient.civilStatus || 'N/A'}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Card className="mb-3">
                <Card.Header as="h5" className="my-2 bg-light">
                  <i className="bi bi-telephone me-2"></i>Contact Information
                </Card.Header>
                <Card.Body>
                  <Row className="mb-3">
                    <Col md={6}>
                      <strong>Email:</strong><br/>
                      {selectedPatient.email || 'N/A'}
                    </Col>
                    <Col md={6}>
                      <strong>Phone Number:</strong><br/>
                      {selectedPatient.contactNumber || 'N/A'}
                    </Col>
                  </Row>
                  <Row>
                    <Col md={12}>
                      <strong>Address:</strong><br/>
                      {[
                        selectedPatient.houseNo,
                        selectedPatient.street,
                        selectedPatient.barangay,
                        selectedPatient.city,
                        selectedPatient.region
                      ].filter(Boolean).join(', ') || 'N/A'}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Card className="mb-3">
                <Card.Header as="h5" className="my-2 bg-light">
                  <i className="bi bi-heart-pulse me-2"></i>Medical Information
                </Card.Header>
                <Card.Body>
                  <Row className="mb-3">
                    <Col md={4}>
                      <strong>PhilHealth Number:</strong><br/>
                      {selectedPatient.philHealthNumber || 'N/A'}
                    </Col>
                    <Col md={4}>
                      <strong>Blood Type:</strong><br/>
                      {selectedPatient.bloodType || 'N/A'}
                    </Col>
                    <Col md={4}>
                      <strong>Family ID:</strong><br/>
                      {selectedPatient.familyId || 'Individual Patient'}
                    </Col>
                  </Row>
                  <Row>
                    <Col md={12}>
                      <strong>Medical Conditions:</strong><br/>
                      <div className="border rounded p-2 bg-light" style={{minHeight: '60px'}}>
                        {selectedPatient.medicalConditions || 'No medical conditions reported'}
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Card>
                <Card.Header as="h5" className="my-2 bg-light">
                  <i className="bi bi-calendar me-2"></i>Registration Details
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <strong>Registration Date:</strong><br/>
                      {formatShortDate(selectedPatient.createdAt)}
                    </Col>
                    <Col md={6}>
                      <strong>Last Updated:</strong><br/>
                      {formatShortDate(selectedPatient.updatedAt || selectedPatient.createdAt)}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="primary" 
            onClick={() => {
              setShowViewRegistrationModal(false);
              setTimeout(() => {
                setEditPatientData({ ...selectedPatient });
                setShowEditPatientModal(true);
              }, 300);
            }}
          >
            <i className="bi bi-pencil-square me-1"></i>
            Edit Information
          </Button>
          <Button variant="secondary" onClick={() => setShowViewRegistrationModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Autosort Confirmation Modal */}
      <Modal 
        show={showAutosortConfirmModal} 
        onHide={handleCancelAutosort}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-sort-alpha-down me-2"></i>
            Autosort Results
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {autosortResults && (
            <>
              <div className="mb-4">
                <h5 className="text-success">
                  <i className="bi bi-check-circle me-2"></i>
                  Successfully Matched ({autosortResults.sorted?.length || 0})
                </h5>
                {autosortResults.sorted?.length > 0 ? (
                  <div className="border rounded p-3 bg-light-success">
                    {autosortResults.sorted.map((item, index) => (
                      <div key={index} className="mb-2">
                        <strong>{item.patient.firstName} {item.patient.lastName}</strong> 
                        <i className="bi bi-arrow-right mx-2"></i>
                        <span className="text-primary">{item.family.familyName} Family</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No patients were automatically matched to existing families.</p>
                )}
              </div>

              <div className="mb-4">
                <h5 className="text-warning">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Need Manual Assignment ({autosortResults.needsManualAssignment?.length || 0})
                </h5>
                {autosortResults.needsManualAssignment?.length > 0 ? (
                  <div className="border rounded p-3 bg-light-warning">
                    {autosortResults.needsManualAssignment.map((patient, index) => (
                      <div key={index} className="mb-1">
                        <strong>{patient.firstName} {patient.lastName}</strong> 
                        <span className="text-muted"> - No matching family found</span>
                      </div>
                    ))}
                    <div className="mt-2">
                      <small className="text-muted">
                        These patients will remain in the unsorted list and can be assigned manually.
                      </small>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted">All patients were successfully matched!</p>
                )}
              </div>

              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                <strong>Autosort Process:</strong> Patients are matched to families based on their surname. 
                Only exact surname matches are automatically assigned.
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancelAutosort}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleConfirmAutosort}
            disabled={!autosortResults?.sorted?.length}
          >
            <i className="bi bi-check2 me-2"></i>
            Confirm Assignment{autosortResults?.sorted?.length > 0 ? ` (${autosortResults.sorted.length})` : ''}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
});

PatientManagement.displayName = 'PatientManagement';

export default PatientManagement;
