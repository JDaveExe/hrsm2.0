import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useAuth } from '../../../context/AuthContext';
import appointmentService from '../../../services/appointmentService';
import patientService from '../../../services/patientService';
import userService from '../../../services/userService';
import './AppointmentManager.css';
import './AppointmentManager_overlay.css';

const AppointmentManager = () => {
  const { authData, isAuthenticated, user, token } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [activeTab, setActiveTab] = useState('appointments'); // 'appointments' or 'history'
  const [activeSubTab, setActiveSubTab] = useState('today'); // 'today', 'all', 'calendar'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  
  // Calendar-specific states
  const [selectedDayAppointments, setSelectedDayAppointments] = useState([]);
  const [clickedDate, setClickedDate] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);
  
  // Form-specific states
  const [patientSearch, setPatientSearch] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [availableServices, setAvailableServices] = useState([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [cardsPerPage, setCardsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('status-priority'); // Default sort by status priority
  
  // Additional state variables needed for the component
  const [showAppointmentRequests, setShowAppointmentRequests] = useState(false);
  const [appointmentRequests, setAppointmentRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const [showApproveConfirmation, setShowApproveConfirmation] = useState(false);
  const [showRejectConfirmation, setShowRejectConfirmation] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [smartSuggestions, setSmartSuggestions] = useState([]);
  const [appointmentLimits, setAppointmentLimits] = useState(null);
  const [limitsLoading, setLimitsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [requestSearchTerm, setRequestSearchTerm] = useState('');
  const [requestSortBy, setRequestSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  const [formData, setFormData] = useState({
    patientId: '',
    // doctorId removed - doctor availability is not predictable
    appointmentDate: '',
    appointmentTime: '',
    duration: 30,
    type: '',
    status: 'approved', // Admin appointments are auto-approved
    notes: '',
    symptoms: ''
  });

  // Rejection templates constant
  const REJECTION_TEMPLATES = [
    { id: 'unavailable', title: 'Time Unavailable', reason: 'The requested time slot is not available. Please select an alternative time.' },
    { id: 'duplicate', title: 'Duplicate Request', reason: 'You already have an appointment scheduled for this date.' },
    { id: 'insufficient_info', title: 'Insufficient Information', reason: 'Please provide more details about your symptoms or reason for visit.' },
    { id: 'emergency', title: 'Emergency Required', reason: 'Based on your symptoms, please visit the emergency department immediately.' },
    { id: 'specialist', title: 'Specialist Needed', reason: 'Your condition requires a specialist consultation. Please contact the appropriate department.' }
  ];

  // Function to get display status based on appointment date and current status
  const getDisplayStatus = (appointment) => {
    if (appointment.status === 'Completed' || appointment.status === 'No Show' || appointment.status === 'Cancelled') {
      return appointment.status;
    }
    
    // Check if appointment is within 2 days (upcoming)
    const appointmentDate = new Date(appointment.appointmentDate || appointment.date);
    const today = new Date();
    const diffTime = appointmentDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // If appointment is within 2 days (including today), show as "Upcoming"
    if (diffDays >= 0 && diffDays <= 2) {
      return 'Upcoming';
    }
    
    // Otherwise show as "Scheduled" 
    return 'Scheduled';
  };

  // Filter and sort appointment requests
  const getFilteredAndSortedRequests = () => {
    if (!appointmentRequests || !Array.isArray(appointmentRequests)) return [];
    
    let filtered = appointmentRequests.filter(request => {
      if (!request) return false;
      
      const patientName = request.patientName || 
        `${patients.find(p => p.id === request.patientId)?.firstName || ''} 
        ${patients.find(p => p.id === request.patientId)?.lastName || ''}`;
      
      return patientName.toLowerCase().includes(requestSearchTerm.toLowerCase());
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let valueA, valueB;
      
      switch (requestSortBy) {
        case 'date':
          valueA = new Date(a.requestedDate || a.appointmentDate || '1970-01-01');
          valueB = new Date(b.requestedDate || b.appointmentDate || '1970-01-01');
          break;
        case 'patient':
          valueA = a.patientName || `${patients.find(p => p.id === a.patientId)?.firstName || ''} ${patients.find(p => p.id === a.patientId)?.lastName || ''}`;
          valueB = b.patientName || `${patients.find(p => p.id === b.patientId)?.firstName || ''} ${patients.find(p => p.id === b.patientId)?.lastName || ''}`;
          break;
        case 'type':
          valueA = a.type || a.appointmentType || '';
          valueB = b.type || b.appointmentType || '';
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      } else {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      }
    });

    return filtered;
  };

  // Function to fetch appointment requests (no longer used since request system is removed)
  const fetchAppointmentRequests = async () => {
    try {
      setRequestsLoading(true);
      // No longer fetching requests since the appointment request system was removed
      setAppointmentRequests([]);
    } catch (error) {
      console.error('Error fetching appointment requests:', error);
      setAppointmentRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };

  // Function to initiate approval process
  const initiateApproval = (request) => {
    setSelectedRequest(request);
    setSelectedRequestId(request.id);
    setShowApproveConfirmation(true);
  };

  // Function to initiate rejection process
  const initiateRejection = (request) => {
    setSelectedRequest(request);
    setSelectedRequestId(request.id);
    setRejectionReason('');
    setSelectedTemplate('');
    setSmartSuggestions([]);
    setShowRejectConfirmation(true);
  };

  // Function to handle template selection
  const selectTemplate = (template) => {
    setSelectedTemplate(template.id);
    setRejectionReason(template.reason);
  };

  // Function to handle suggestion selection
  const selectSuggestion = (suggestion) => {
    setRejectionReason(suggestion.reason);
    setSelectedTemplate('custom_suggestion');
  };

  // Function to handle custom reason input
  const handleCustomReason = (value) => {
    setRejectionReason(value);
    setSelectedTemplate('custom');
  };

  // Function to fetch appointment limits for a patient and date
  const fetchAppointmentLimits = async (patientId, date) => {
    if (!patientId || !date) {
      setAppointmentLimits(null);
      return;
    }

    try {
      setLimitsLoading(true);
      const response = await fetch(`/api/appointments/limits?patientId=${patientId}&date=${date}`);
      
      if (response.ok) {
        const limitsData = await response.json();
        setAppointmentLimits(limitsData);
      } else {
        console.error('Failed to fetch appointment limits');
        setAppointmentLimits(null);
      }
    } catch (error) {
      console.error('Error fetching appointment limits:', error);
      setAppointmentLimits(null);
    } finally {
      setLimitsLoading(false);
    }
  };

  // Function to fetch available time slots for a date and patient
  const fetchAvailableSlots = async (date, patientId) => {
    if (!date) {
      setAvailableSlots([]);
      return;
    }

    try {
      const queryParams = new URLSearchParams({ date });
      if (patientId) queryParams.append('patientId', patientId);
      
      const response = await fetch(`/api/appointments/available-slots?${queryParams}`);
      
      if (response.ok) {
        const slotsData = await response.json();
        setAvailableSlots(slotsData.slots || []);
      } else {
        console.error('Failed to fetch available slots');
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
      setAvailableSlots([]);
    }
  };

  // Function to confirm and execute approval (disabled since request system is removed)
  const confirmApproval = async () => {
    try {
      console.log('Appointment request system is disabled');
      setError('Appointment request system has been removed. Appointments are now created directly.');
      
      // Close confirmation modal
      setShowApproveConfirmation(false);
      
      // Refresh appointment requests first
      await fetchAppointmentRequests();
      
      // Update request count for the badge (set to 0 since request system is removed)
      setRequestCount(0);
      
      // Wait a moment for backend processing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Directly refresh appointments to show the newly approved appointment
      try {
        const updatedAppointments = await appointmentService.getAppointments();
        setAppointments(updatedAppointments || []);
        
        // Filter today's appointments - exclude No Show and Cancelled appointments from today's schedule
        const today = new Date().toDateString();
        const todaysAppts = (updatedAppointments || []).filter(apt => {
          const aptDate = new Date(apt.appointmentDate || apt.date).toDateString();
          const isToday = aptDate === today;
          const isNotNoShow = apt.status !== 'No Show';
          const isNotCancelled = apt.status !== 'Cancelled';
          return isToday && isNotNoShow && isNotCancelled;
        });
        setTodayAppointments(todaysAppts);
        
        console.log('Updated appointments after approval:', updatedAppointments?.length || 0);
        
        // Backup system removed - appointments now come directly from database
      } catch (refreshError) {
        console.error('Error refreshing appointments after approval:', refreshError);
        // Fallback to full data reload
        await loadInitialData();
      }
      
      console.log('Appointment approval completed, data refreshed');
    } catch (err) {
      console.error('Error approving appointment request:', err);
      setError('Failed to approve appointment request');
      setShowApproveConfirmation(false);
    }
  };
  
  // Function to confirm and execute rejection
  const confirmRejection = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    
    try {
      // Since appointment request system is removed, this function is disabled
      console.warn('Appointment request system has been removed');
      setError('Appointment request system is no longer available');
      
      // Close confirmation modal
      setShowRejectConfirmation(false);
      setRejectionReason('');
    } catch (err) {
      console.error('Error rejecting appointment request:', err);
      setError('Failed to reject appointment request');
      setShowRejectConfirmation(false);
    }
  };
  
  // Functions for service scheduling
  const isDateTimeSelected = () => {
    return formData.appointmentDate && formData.appointmentTime;
  };

  const updateAvailableServices = (date, time) => {
    if (!date || !time) {
      setAvailableServices([]);
      return;
    }

    // Basic service schedule - you can expand this based on your requirements
    const dayOfWeek = new Date(date).getDay(); // 0 = Sunday, 1 = Monday, etc.
    const hour = parseInt(time.split(':')[0]);
    
    let services = [];
    
    // Monday to Friday services
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      if (hour >= 8 && hour < 12) {
        services = ['General Consultation', 'Regular Checkup', 'Follow-up', 'Medical Certificate'];
      } else if (hour >= 13 && hour < 17) {
        services = ['General Consultation', 'Follow-up', 'Emergency', 'Surgery Consultation'];
      } else if (hour >= 17 && hour < 20) {
        services = ['Emergency', 'General Consultation'];
      }
    }
    // Weekend services (limited)
    else if (dayOfWeek === 0 || dayOfWeek === 6) {
      if (hour >= 9 && hour < 17) {
        services = ['Emergency', 'General Consultation'];
      }
    }

    // Always available services
    if (services.length === 0) {
      services = ['Emergency'];
    }

    setAvailableServices(services);
  };

  const appointmentTypes = [
    'Regular Checkup', 'Follow-up', 'Medical Certificate', 
    'Consultation', 'Emergency', 'Surgery', 'Therapy'
  ];

  const appointmentStatuses = [
    'Scheduled', 'Confirmed', 'In Progress', 'Completed', 
    'Cancelled', 'No Show', 'Rescheduled'
  ];

  const priorityLevels = ['Low', 'Normal', 'High', 'Urgent'];

  // Initialize component
  useEffect(() => {
    console.log('AppointmentManager mounted, loading initial data...');
    loadInitialData();
  }, []);

  // Handle clicking outside patient dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPatientDropdown && !event.target.closest('.patient-search-container')) {
        setShowPatientDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPatientDropdown]);

  // Handle authentication changes
  useEffect(() => {
    const hasValidAuth = isAuthenticated && authData?.token && authData?.user;
    
    if (hasValidAuth) {
      console.log('🔐 Valid authentication detected, reloading data...');
      loadInitialData();
    } else if (!isAuthenticated) {
      console.log('🔓 Authentication lost, clearing data...');
      setAppointments([]);
      setPatients([]);
      setDoctors([]);
      setTodayAppointments([]);
    }
  }, [isAuthenticated, authData]);

  // Fetch appointment limits and available slots when patient or date changes
  useEffect(() => {
    if (formData.patientId && formData.appointmentDate) {
      fetchAppointmentLimits(formData.patientId, formData.appointmentDate);
      fetchAvailableSlots(formData.appointmentDate, formData.patientId);
    } else {
      setAppointmentLimits(null);
      setAvailableSlots([]);
    }
  }, [formData.patientId, formData.appointmentDate]);

  const loadInitialData = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      setError('');
      console.log('🚀 Starting to load initial data...');
      
      // FORCE CLEAR SESSION STORAGE - Remove cached sample data
      console.log('🧹 Clearing sessionStorage backup_appointments...');
      sessionStorage.removeItem('backup_appointments');
      console.log('✅ SessionStorage cleared');
      
      // Enhanced auth check - require all components for valid auth
      const hasValidAuth = isAuthenticated && authData?.token && authData?.user;
      
      console.log('🔍 Enhanced Auth Check:', {
        isAuthenticated,
        hasAuthData: !!authData,
        hasToken: !!authData?.token,
        hasUser: !!authData?.user,
        userRole: authData?.user?.role,
        hasValidAuth,
        fullAuthData: authData // For debugging
      });
      
      if (!hasValidAuth) {
        console.warn('⚠️  Invalid authentication state - clearing appointments');
        setAppointments([]);
        setError('Please log in to access appointments.');
        setLoading(false);
        return;
        return;
      }

      // Check user role using AuthContext
      const userData = authData?.user;
      console.log('User data from AuthContext:', userData);
      if (!userData || (userData.role !== 'admin' && userData.role !== 'doctor')) {
        setError('Access denied. Admin or doctor privileges required.');
        return;
      }

      // Try to load data gracefully
      console.log('🔄 Attempting to load data from APIs with authentication...');
      const results = await Promise.allSettled([
        appointmentService.getAppointments().then(result => {
          console.log('✅ Appointments API succeeded:', result?.length || 0, 'appointments');
          return result;
        }).catch(err => {
          console.error('❌ Appointments API failed:', err.message || err);
          console.error('Full error:', err);
          return [];
        }),
        patientService.getPatients().then(result => {
          console.log('✅ Patients API succeeded:', result?.length || 0, 'patients');
          return result;
        }).catch(err => {
          console.error('❌ Patients API failed:', err.message || err);
          return [];
        }),
        userService.getUsers().then(result => {
          console.log('✅ Users API succeeded:', result?.length || 0, 'users');
          return result;
        }).catch(err => {
          console.error('❌ Users API failed:', err.message || err);
          return [];
        })
      ]);

      const [appointmentsResult, patientsResult, usersResult] = results;
      console.log('API Results:', {
        appointments: appointmentsResult.status,
        patients: patientsResult.status,
        users: usersResult.status
      });

      // Use real data from API
      const appointmentsData = appointmentsResult.status === 'fulfilled' && appointmentsResult.value?.length > 0 
        ? appointmentsResult.value 
        : [];

      console.log('📋 Processing appointments data:', {
        apiStatus: appointmentsResult.status,
        apiValue: appointmentsResult.value,
        finalCount: appointmentsData.length,
        sampleData: appointmentsData.slice(0, 2)
      });

      if (appointmentsData.length === 0) {
        console.warn('⚠️  NO APPOINTMENTS FOUND - This is likely why they disappear on refresh!');
        if (appointmentsResult.status === 'rejected') {
          console.error('API rejection reason:', appointmentsResult.reason);
        }
      }
      
      const patientsData = patientsResult.status === 'fulfilled' && patientsResult.value?.length > 0
        ? patientsResult.value
        : [
            { id: 1, name: 'Maria Santos', email: 'maria@example.com' },
            { id: 2, name: 'Carlos Mendoza', email: 'carlos@example.com' },
            { id: 3, name: 'Ana Reyes', email: 'ana@example.com' },
            { id: 4, name: 'Pedro Garcia', email: 'pedro@example.com' },
            { id: 5, name: 'Sofia Lopez', email: 'sofia@example.com' },
            { id: 6, name: 'Miguel Torres', email: 'miguel@example.com' }
          ];
      
      const usersData = usersResult.status === 'fulfilled' && usersResult.value.length > 0
        ? usersResult.value
        : [
            { id: 1, name: 'Dr. Santos', role: 'doctor', email: 'santos@example.com' },
            { id: 2, name: 'Dr. Martinez', role: 'doctor', email: 'martinez@example.com' },
            { id: 3, name: 'Dr. Garcia', role: 'doctor', email: 'garcia@example.com' }
          ];

      console.log('Final data:', {
        appointments: appointmentsData.length,
        patients: patientsData.length,
        users: usersData.length,
        doctors: usersData.filter(user => user.role === 'Doctor' || user.role === 'doctor' || user.role === 'Admin' || user.role === 'admin').length
      });

      // Use appointments data directly from API (no backup system)
      console.log('� Using appointments directly from database:', appointmentsData.length);
      setAppointments(appointmentsData);
      setPatients(patientsData);
      
      // Filter doctors and admins from users (case insensitive)
      const doctorUsers = usersData.filter(user => {
        const role = user.role?.toLowerCase();
        return role === 'doctor' || role === 'admin';
      });
      
      console.log('Filtered doctors:', doctorUsers);
      setDoctors(doctorUsers);
      
      // Filter today's appointments - exclude No Show appointments
      const today = new Date().toISOString().split('T')[0];
      const todayAppts = appointmentsData.filter(apt => {
        let isToday = false;
        if (apt.date) {
          const aptDate = new Date(apt.date).toISOString().split('T')[0];
          isToday = aptDate === today;
        } else if (apt.appointmentDate) {
          const aptDate = new Date(apt.appointmentDate).toISOString().split('T')[0];
          isToday = aptDate === today;
        }
        
        // Exclude No Show and Cancelled appointments from today's schedule
        const isNotNoShow = apt.status !== 'No Show';
        const isNotCancelled = apt.status !== 'Cancelled';
        
        return isToday && isNotNoShow && isNotCancelled;
      });
      
      console.log('Today\'s appointments found:', todayAppts.length);
      setTodayAppointments(todayAppts);
      
      // Set request count to 0 since appointment request system is removed
      setRequestCount(0);
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load appointment data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      let newAppointment = null;
      
      if (editingAppointment) {
        // Try to update via API first
        try {
          await appointmentService.updateAppointment(editingAppointment.id, formData);
          setSuccess('Appointment updated successfully');
        } catch (apiError) {
          // If API fails, update local state
          const updatedAppointments = appointments.map(apt => 
            apt.id === editingAppointment.id ? { ...apt, ...formData } : apt
          );
          setAppointments(updatedAppointments);
          
          // Update today's appointments if needed
          const today = new Date().toISOString().split('T')[0];
          if (formData.appointmentDate === today) {
            const updatedTodayAppts = todayAppointments.map(apt => 
              apt.id === editingAppointment.id ? { ...apt, ...formData } : apt
            );
            setTodayAppointments(updatedTodayAppts);
          }
          
          setSuccess('Appointment updated successfully (local)');
        }
      } else {
        // Create new appointment - Admin scheduling (auto-approved)
        const appointmentData = {
          id: Date.now(), // Generate temporary ID
          patientId: formData.patientId,
          patientName: patients.find(p => p.id === parseInt(formData.patientId))?.name || 
                      `${patients.find(p => p.id === parseInt(formData.patientId))?.firstName || ''} ${patients.find(p => p.id === parseInt(formData.patientId))?.lastName || ''}`.trim() || 
                      'Unknown Patient',
          doctor: 'Admin Scheduled', // Admin is scheduling for patient
          appointmentDate: formData.appointmentDate,
          appointmentTime: formData.appointmentTime,
          date: formData.appointmentDate, // Ensure both date properties exist
          time: formData.appointmentTime, // Ensure both time properties exist
          type: formData.type,
          status: 'approved', // Auto-approved by admin
          duration: formData.duration,
          notes: formData.notes,
          symptoms: formData.symptoms,
          createdBy: 'admin',
          needsPatientAcceptance: true,
          statusColor: '#28a745', // Green for approved
          isActive: true // Ensure isActive property
        };

        try {
          // Try API first
          const apiResponse = await appointmentService.createAppointment(formData);
          newAppointment = apiResponse;
          setSuccess('Appointment created successfully');
        } catch (apiError) {
          // If API fails, add to local state
          newAppointment = appointmentData;
          setSuccess('Appointment scheduled successfully (local)');
        }

        // Update appointments list
        setAppointments(prev => [...prev, newAppointment]);

        // Check if appointment is for today and add to today's schedule
        const today = new Date().toISOString().split('T')[0];
        if (formData.appointmentDate === today) {
          // Ensure today's appointment has consistent structure
          const todayAppointment = {
            ...newAppointment,
            // No need to add extra time property as it's already in appointmentTime
            duration: `${formData.duration}min`
          };
          setTodayAppointments(prev => [...prev, todayAppointment]);
        }
      }

      resetForm();
    } catch (err) {
      setError('Failed to save appointment: ' + err.message);
    }
  };

  const resetForm = () => {
    console.log('resetForm called, current showForm:', showForm);
    setFormData({
      patientId: '',
      doctorId: '1', // Default to first doctor (admin scheduling)
      appointmentDate: '',
      appointmentTime: '',
      duration: 30,
      type: '',
      status: 'approved', // Admin appointments are auto-approved
      notes: '',
      symptoms: ''
    });
    
    // Reset patient search
    setPatientSearch('');
    setFilteredPatients([]);
    setShowPatientDropdown(false);
    
    setEditingAppointment(null);
    setShowForm(false);
    console.log('resetForm completed, showForm set to false');
  };

  const handleEdit = (appointment) => {
    setEditingAppointment(appointment);
    setFormData({
      patientId: appointment.patientId || '',
      doctorId: appointment.doctorId || '',
      appointmentDate: appointment.appointmentDate ? appointment.appointmentDate.split('T')[0] : '',
      appointmentTime: appointment.appointmentTime || '',
      duration: appointment.duration || 30,
      type: appointment.type || 'Consultation',
      status: appointment.status || 'Scheduled',
      priority: appointment.priority || 'Normal',
      notes: appointment.notes || '',
      symptoms: appointment.symptoms || ''
    });
    
    // Set patient search for editing
    if (appointment.patientId) {
      const patient = patients.find(p => p.id === appointment.patientId);
      if (patient) {
        setPatientSearch(`${patient.firstName} ${patient.lastName} (ID: ${patient.id})`);
      }
    }
    
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        await appointmentService.deleteAppointment(id);
        setSuccess('Appointment deleted successfully');
        loadInitialData();
      } catch (err) {
        setError('Failed to delete appointment: ' + err.message);
      }
    }
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getCurrentUser = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.role || 'User';
    } catch {
      return 'User';
    }
  };

  // Pagination functions
  const getPaginatedAppointments = () => {
    const startIndex = currentPage * cardsPerPage;
    const endIndex = startIndex + cardsPerPage;
    return todayAppointments.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(todayAppointments.length / cardsPerPage);
  };

  const goToNextPage = () => {
    if (currentPage < getTotalPages() - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDate = firstDay.getDay();
    
    const days = [];
    
    // Previous month days
    for (let i = startDate - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      days.push({ date: currentDate, isCurrentMonth: true });
    }
    
    // Next month days to fill the grid
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    return days;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const hasAppointment = (date) => {
    // Check if there are any appointments on this specific date
    if (!date || !appointments || appointments.length === 0) return false;
    
    try {
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      return appointments.some(apt => {
        if (!apt || !apt.appointmentDate) return false;
        try {
          const aptDate = new Date(apt.appointmentDate);
          if (isNaN(aptDate.getTime())) return false; // Invalid date check
          const aptDateStr = aptDate.toISOString().split('T')[0];
          return aptDateStr === dateStr;
        } catch (error) {
          console.warn('Invalid appointment date:', apt.appointmentDate);
          return false;
        }
      });
    } catch (error) {
      console.warn('Invalid date in hasAppointment:', date);
      return false;
    }
  };

  const getAppointmentsForDate = (date) => {
    // Get all appointments for a specific date
    if (!date || !appointments || appointments.length === 0) return [];
    
    try {
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      return appointments.filter(apt => {
        if (!apt || !apt.appointmentDate) return false;
        try {
          const aptDate = new Date(apt.appointmentDate);
          if (isNaN(aptDate.getTime())) return false; // Invalid date check
          const aptDateStr = aptDate.toISOString().split('T')[0];
          return aptDateStr === dateStr;
        } catch (error) {
          console.warn('Invalid appointment date:', apt.appointmentDate);
          return false;
        }
      }).sort((a, b) => {
        // Sort by appointment time
        if (!a.appointmentTime || !b.appointmentTime) return 0;
        return a.appointmentTime.localeCompare(b.appointmentTime);
      });
    } catch (error) {
      console.warn('Invalid date in getAppointmentsForDate:', date);
      return [];
    }
  };

  const handleDayClick = (date) => {
    if (!date || !appointments) return;
    try {
      const dayAppointments = getAppointmentsForDate(date);
      if (dayAppointments.length > 0) {
        setSelectedDayAppointments(dayAppointments);
        setClickedDate(date);
        setShowDayModal(true);
      }
    } catch (error) {
      console.warn('Error in handleDayClick:', error);
    }
  };

  const formatTime = (timeString) => {
    // Convert 24-hour time to 12-hour format
    if (!timeString) return 'N/A';
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (error) {
      console.warn('Invalid time format:', timeString);
      return timeString || 'N/A';
    }
  };

  const getPatientName = (appointment) => {
    // Handle different data structures for patient names
    if (!appointment) return 'Unknown Patient';
    
    // If appointment has direct patientName property (from requests)
    if (appointment.patientName && appointment.patientName.trim()) {
      return appointment.patientName.trim();
    }
    
    // If appointment has patientId, look up in patients array
    const patientId = appointment.patientId || appointment.patient_id;
    if (patientId && patients && patients.length > 0) {
      const patient = patients.find(p => p && (p.id === patientId || p.id === parseInt(patientId)));
      if (patient) {
        return `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || patient.name || 'Unknown Patient';
      }
    }
    
    // If appointment has patient object embedded
    if (appointment.patient) {
      const patient = appointment.patient;
      return `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || patient.name || 'Unknown Patient';
    }
    
    return 'Unknown Patient';
  };

  const getDoctorName = (doctorId) => {
    if (!doctorId || !doctors) return 'Unknown Doctor';
    const doctor = doctors.find(d => d && d.id === doctorId);
    return doctor ? `Dr. ${doctor.lastName || doctor.firstName || 'Unknown'}` : 'Unknown Doctor';
  };

  // Get status color based on status (returns color string for backgroundColor)
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'upcoming':
        return '#ff6b35'; // Orange for upcoming appointments
      case 'scheduled':
        return '#007bff'; // Blue for scheduled appointments
      case 'completed':
        return '#28a745'; // Green for completed appointments
      case 'no show':
        return '#dc3545'; // Red for no show appointments
      case 'cancelled':
        return '#6c757d'; // Gray for cancelled appointments
      // Legacy statuses (for backward compatibility)
      case 'approved':
        return '#28a745'; // Green
      case 'pending':
        return '#fd7e14'; // Orange
      case 'accepted':
        return '#ffc107'; // Yellow
      default:
        return '#007bff'; // Blue (default)
    }
  };

  // Get status style object (for components that expect style object)
  const getStatusStyle = (status) => {
    const backgroundColor = getStatusColor(status);
    return {
      backgroundColor,
      color: ['#ffc107', '#fd7e14'].includes(backgroundColor) ? 'black' : 'white'
    };
  };

  // Patient search functions
  const handlePatientSearch = (searchValue) => {
    setPatientSearch(searchValue);
    
    // Clear form patientId if user is typing something new
    if (formData.patientId && searchValue !== `${formData.patientName} (ID: ${formData.patientId})`) {
      setFormData({
        ...formData,
        patientId: '',
        patientName: ''
      });
    }
    
    if (searchValue.length > 1) { // Show results after 2 characters
      const filtered = patients.filter(patient => {
        const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
        const patientId = patient.id.toString();
        const email = patient.email?.toLowerCase() || '';
        const phone = patient.contactNumber || '';
        
        return fullName.includes(searchValue.toLowerCase()) || 
               patientId.includes(searchValue) ||
               email.includes(searchValue.toLowerCase()) ||
               phone.includes(searchValue);
      });
      setFilteredPatients(filtered.slice(0, 8)); // Limit to 8 results
      setShowPatientDropdown(filtered.length > 0);
    } else {
      setFilteredPatients([]);
      setShowPatientDropdown(false);
    }
  };

  const selectPatient = (patient) => {
    setFormData({
      ...formData,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`
    });
    setPatientSearch(`${patient.firstName} ${patient.lastName} (ID: ${patient.id})`);
    setShowPatientDropdown(false);
  };

  const clearPatientSelection = () => {
    setFormData({
      ...formData,
      patientId: '',
      patientName: ''
    });
    setPatientSearch('');
    setShowPatientDropdown(false);
  };

  const filteredAppointments = appointments
    .filter(appointment => {
      // Filter by tab type - show all appointments for 'appointments' tab, completed/cancelled for 'history' tab
      const statusMatch = activeTab === 'appointments' 
        ? ['Scheduled', 'Confirmed', 'In Progress'].includes(appointment.status)
        : ['Completed', 'Cancelled'].includes(appointment.status);
      
      // Filter by search term
      const searchMatch = appointment.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.type?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return statusMatch && searchMatch;
    });

  if (loading) {
    return (
      <div className="appointment-manager">
        <div className="simple-loading">
          Loading...
        </div>
      </div>
    );
  }

  if (error && (error.includes('Authentication required') || error.includes('Access denied'))) {
    return (
      <div className="appointment-manager">
        <div className="error-container">
          <h3>🔒 {error.includes('Authentication') ? 'Authentication Required' : 'Access Denied'}</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="appointment-manager">
      {/* Main Tabs */}
      <div className="action-tabs">
        <button 
          className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          <i className="bi bi-calendar3 me-2"></i>
          All Appointments
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <i className="bi bi-clock-history me-2"></i>
          Appointment History
        </button>
        
        <div className="tab-actions">
          <button className="btn btn-secondary" onClick={loadInitialData}>
            <i className="bi bi-arrow-clockwise me-2"></i>
            Refresh
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Appointments Tab Content */}
      {activeTab === 'appointments' && (
        <div className="appointments-comprehensive">
          <div className="all-appointments">
            <div className="management-header">
              <h3>Appointment Management</h3>
            </div>

            {/* Today's Schedule Cards */}
            <div className="todays-schedule-card">
              <h4>
                <i className="bi bi-clock me-2"></i>
                Today's Schedule - {getCurrentDate()}
              </h4>
              <div className="schedule-cards-grid">
                {getPaginatedAppointments().map(appointment => (
                  <div key={appointment.id} className={`schedule-card ${appointment.status.toLowerCase().replace(' ', '-')}`}>
                    <div className="card-time">
                      <span className="time">{appointment.time}</span>
                      <span className="duration">{appointment.duration}</span>
                    </div>
                    <div className="card-content">
                      <div className="patient-name">{getPatientName(appointment)}</div>
                      <div className="appointment-type">{appointment.type}</div>
                    </div>
                    <div className="card-status">
                      <span className={`status-indicator`} style={{ backgroundColor: getStatusColor(appointment.status) }}>
                        {appointment.status}
                      </span>
                    </div>
                    <div className="card-actions">
                      <button className="card-action-btn edit" title="Edit">
                        <i className="bi bi-pencil"></i>
                      </button>
                    </div>
                  </div>
                ))}
                {todayAppointments.length === 0 && (
                  <div className="no-appointments-card">
                    <i className="bi bi-calendar-x"></i>
                    <p>No appointments scheduled for today</p>
                  </div>
                )}
              </div>
              
              {/* Pagination Controls */}
              {todayAppointments.length > cardsPerPage && (
                <div className="schedule-pagination">
                  <button 
                    className="pagination-button" 
                    onClick={goToPrevPage}
                    disabled={currentPage === 0}
                  >
                    <i className="bi bi-chevron-left"></i>
                    Previous
                  </button>
                  
                  <span className="pagination-info">
                    Page {currentPage + 1} of {getTotalPages()} 
                    ({todayAppointments.length} total appointments)
                  </span>
                  
                  <button 
                    className="pagination-button" 
                    onClick={goToNextPage}
                    disabled={currentPage >= getTotalPages() - 1}
                  >
                    Next
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              )}
            </div>

            {/* Content Cards Layout - All Appointments and Calendar side by side */}
            <div className="content-cards-layout">
              {/* All Appointments Card */}
              <div className="content-card">
                <div className="content-card-header">
                  <i className="bi bi-calendar-check me-2"></i>
                  All Appointments
                </div>
                <div className="content-card-body">
                  <div className="section-actions" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="search-bar">
                      <i className="bi bi-search search-icon"></i>
                      <input
                        type="text"
                        placeholder="Search appointments..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(0); // Reset to first page when searching
                        }}
                      />
                    </div>
                    <div className="appointments-per-page-selector">
                      <span>Show: </span>
                      <select 
                        value={cardsPerPage} 
                        onChange={(e) => {
                          setCardsPerPage(parseInt(e.target.value));
                          setCurrentPage(0);
                        }}
                        style={{ marginLeft: '5px', padding: '4px', borderRadius: '4px', border: '1px solid #ddd' }}
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={20}>20</option>
                      </select>
                    </div>
                    <div className="appointments-sort-selector">
                      <span>Sort by: </span>
                      <select 
                        value={sortBy} 
                        onChange={(e) => {
                          setSortBy(e.target.value);
                          setCurrentPage(0);
                        }}
                        style={{ marginLeft: '5px', padding: '4px', borderRadius: '4px', border: '1px solid #ddd' }}
                      >
                        <option value="status-priority">Status Priority</option>
                        <option value="date-desc">Date (Newest First)</option>
                        <option value="date-asc">Date (Oldest First)</option>
                        <option value="time-desc">Time (Latest First)</option>
                        <option value="time-asc">Time (Earliest First)</option>
                      </select>
                    </div>
                  </div>

                  <div className="appointments-card-table-container">
                    <table className="appointments-card-table">
                      <thead>
                        <tr>
                          <th>Patient</th>
                          <th style={{ cursor: 'pointer' }} onClick={() => setSortBy(sortBy === 'date-asc' ? 'date-desc' : 'date-asc')}>
                            Date {sortBy === 'date-asc' ? '↑' : sortBy === 'date-desc' ? '↓' : ''}
                          </th>
                          <th style={{ cursor: 'pointer' }} onClick={() => setSortBy(sortBy === 'time-asc' ? 'time-desc' : 'time-asc')}>
                            Time {sortBy === 'time-asc' ? '↑' : sortBy === 'time-desc' ? '↓' : ''}
                          </th>
                          <th>Type</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          // Filter and sort appointments with null checks
                          if (!appointments || !Array.isArray(appointments)) {
                            return (
                              <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                                  No appointments data available
                                </td>
                              </tr>
                            );
                          }

                          let filteredAppointments = appointments.filter(appointment => {
                            // Add null checks to prevent errors
                            if (!appointment || !appointment.id) return false;
                            
                            // Filter out cancelled appointments from admin view (only show: Scheduled, Completed, No Show)
                            // Note: "Upcoming" is derived from "Scheduled" appointments based on date
                            const allowedStatuses = ['Scheduled', 'Completed', 'No Show'];
                            const statusFilter = allowedStatuses.includes(appointment.status);
                            
                            // Filter by search term with null checks
                            try {
                              const patientName = getPatientName(appointment) || '';
                              const appointmentType = appointment.type || '';
                              const searchFilter = patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                  appointmentType.toLowerCase().includes(searchTerm.toLowerCase());
                              
                              return statusFilter && searchFilter;
                            } catch (error) {
                              console.warn('Error filtering appointment:', appointment.id, error);
                              return false;
                            }
                          });
                          
                          // Sort appointments with null checks
                          filteredAppointments.sort((a, b) => {
                            try {
                              if (sortBy === 'status-priority') {
                                // Status priority order based on display status: Upcoming, Scheduled, Completed, No Show
                                const statusOrder = { 'Upcoming': 1, 'Scheduled': 2, 'Completed': 3, 'No Show': 4 };
                                const displayStatusA = getDisplayStatus(a);
                                const displayStatusB = getDisplayStatus(b);
                                const statusA = statusOrder[displayStatusA] || 999;
                                const statusB = statusOrder[displayStatusB] || 999;
                                if (statusA !== statusB) return statusA - statusB;
                                // If same status, sort by date (newest first)
                                const dateA = new Date(a.appointmentDate || a.date || '1970-01-01');
                                const dateB = new Date(b.appointmentDate || b.date || '1970-01-01');
                                return dateB - dateA;
                              } else if (sortBy === 'date-asc') {
                                const dateA = new Date(a.appointmentDate || a.date || '1970-01-01');
                                const dateB = new Date(b.appointmentDate || b.date || '1970-01-01');
                                return dateA - dateB;
                              } else if (sortBy === 'date-desc') {
                                const dateA = new Date(a.appointmentDate || a.date || '1970-01-01');
                                const dateB = new Date(b.appointmentDate || b.date || '1970-01-01');
                                return dateB - dateA;
                              } else if (sortBy === 'time-asc') {
                                const timeA = a.appointmentTime || a.time || '00:00';
                                const timeB = b.appointmentTime || b.time || '00:00';
                                return timeA.localeCompare(timeB);
                              } else if (sortBy === 'time-desc') {
                                const timeA = a.appointmentTime || a.time || '00:00';
                                const timeB = b.appointmentTime || b.time || '00:00';
                                return timeB.localeCompare(timeA);
                              }
                              return 0;
                            } catch (error) {
                              console.warn('Error sorting appointments:', error);
                              return 0;
                            }
                          });
                          
                          // Calculate pagination
                          const startIndex = currentPage * cardsPerPage;
                          const endIndex = startIndex + cardsPerPage;
                          const paginatedAppointments = filteredAppointments.slice(startIndex, endIndex);
                          
                          return paginatedAppointments.map((appointment) => {
                            // Add individual appointment error handling
                            try {
                              if (!appointment || !appointment.id) {
                                return null;
                              }

                              const appointmentDate = appointment.appointmentDate || appointment.date;
                              const appointmentTime = appointment.appointmentTime || appointment.time;
                              
                              return (
                                <tr key={`appointment-${appointment.id}`}>
                                  <td>
                                    {(() => {
                                      try {
                                        const patientName = getPatientName(appointment);
                                        return typeof patientName === 'string' ? patientName : 'Unknown Patient';
                                      } catch (error) {
                                        console.warn('Patient name rendering error:', error);
                                        return 'Unknown Patient';
                                      }
                                    })()}
                                  </td>
                                  <td>
                                    {(() => {
                                      try {
                                        if (!appointmentDate) return 'No Date';
                                        const date = new Date(appointmentDate);
                                        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
                                      } catch (error) {
                                        console.warn('Date rendering error:', error);
                                        return 'Invalid Date';
                                      }
                                    })()}
                                  </td>
                                  <td>
                                    {(() => {
                                      try {
                                        const formattedTime = formatTime(appointmentTime);
                                        return typeof formattedTime === 'string' ? formattedTime : 'N/A';
                                      } catch (error) {
                                        console.warn('Time rendering error:', error);
                                        return 'N/A';
                                      }
                                    })()}
                                  </td>
                                  <td>
                                    {(() => {
                                      try {
                                        const appointmentType = appointment.type || 'Consultation';
                                        return typeof appointmentType === 'string' ? appointmentType : 'Consultation';
                                      } catch (error) {
                                        console.warn('Appointment type rendering error:', error);
                                        return 'Consultation';
                                      }
                                    })()}
                                  </td>
                                  <td>
                                    {(() => {
                                      try {
                                        const status = appointment.status || 'Unknown';
                                        const statusStyle = getStatusStyle(status);
                                        return (
                                          <span 
                                            className="status-indicator" 
                                            style={statusStyle}
                                          >
                                            {typeof status === 'string' ? status : 'Unknown'}
                                          </span>
                                        );
                                      } catch (error) {
                                        console.warn('Status rendering error:', error);
                                        return (
                                          <span className="status-indicator">
                                            Unknown
                                          </span>
                                        );
                                      }
                                    })()}
                                  </td>
                                </tr>
                              );
                            } catch (error) {
                              console.error('Error rendering appointment:', appointment?.id, error);
                              return (
                                <tr key={`error-${appointment?.id || Math.random()}`}>
                                  <td colSpan="5" style={{ color: 'red', textAlign: 'center' }}>
                                    Error loading appointment data
                                  </td>
                                </tr>
                              );
                            }
                          }).filter(Boolean);
                        })()}
                      </tbody>
                    </table>
                    
                    {/* Pagination Controls */}
                    {(() => {
                      if (!appointments || !Array.isArray(appointments)) {
                        return null;
                      }
                      
                      const filteredCount = appointments.filter(appointment => {
                        if (!appointment || !appointment.id) return false;
                        
                        try {
                          const statusFilter = appointment.status !== 'pending';
                          const patientName = getPatientName(appointment) || '';
                          const appointmentType = appointment.type || '';
                          const searchFilter = patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                              appointmentType.toLowerCase().includes(searchTerm.toLowerCase());
                          return statusFilter && searchFilter;
                        } catch (error) {
                          console.warn('Error in pagination filter:', error);
                          return false;
                        }
                      }).length;
                      
                      const totalPages = Math.ceil(filteredCount / cardsPerPage);
                      
                      if (totalPages <= 1) return null;
                      
                      return (
                        <div className="pagination-controls" style={{ 
                          display: 'flex', 
                          justifyContent: 'center', 
                          alignItems: 'center', 
                          gap: '10px', 
                          marginTop: '15px',
                          padding: '10px'
                        }}>
                          <button 
                            className="btn btn-sm"
                            disabled={currentPage === 0}
                            onClick={() => setCurrentPage(0)}
                            style={{ opacity: currentPage === 0 ? 0.5 : 1 }}
                          >
                            <i className="bi bi-chevron-double-left"></i>
                          </button>
                          <button 
                            className="btn btn-sm"
                            disabled={currentPage === 0}
                            onClick={() => setCurrentPage(currentPage - 1)}
                            style={{ opacity: currentPage === 0 ? 0.5 : 1 }}
                          >
                            <i className="bi bi-chevron-left"></i>
                          </button>
                          <span style={{ padding: '0 15px', fontSize: '14px' }}>
                            Page {currentPage + 1} of {totalPages}
                          </span>
                          <button 
                            className="btn btn-sm"
                            disabled={currentPage >= totalPages - 1}
                            onClick={() => setCurrentPage(currentPage + 1)}
                            style={{ opacity: currentPage >= totalPages - 1 ? 0.5 : 1 }}
                          >
                            <i className="bi bi-chevron-right"></i>
                          </button>
                          <button 
                            className="btn btn-sm"
                            disabled={currentPage >= totalPages - 1}
                            onClick={() => setCurrentPage(totalPages - 1)}
                            style={{ opacity: currentPage >= totalPages - 1 ? 0.5 : 1 }}
                          >
                            <i className="bi bi-chevron-double-right"></i>
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Calendar Card */}
              <div className="content-card">
                <div className="content-card-header">
                  <i className="bi bi-calendar3 me-2"></i>
                  Calendar View
                </div>
                <div className="content-card-body">
                  <div className="calendar-container">
                    <div className="calendar-header">
                      <button className="calendar-nav-btn" onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}>
                        <i className="bi bi-chevron-left"></i>
                      </button>
                      <h4 className="current-month">
                        {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </h4>
                      <button className="calendar-nav-btn" onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}>
                        <i className="bi bi-chevron-right"></i>
                      </button>
                    </div>
                    
                    <div className="calendar-grid">
                      <div className="calendar-weekdays">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="weekday">{day}</div>
                        ))}
                      </div>
                      
                      <div className="calendar-days">
                        {getDaysInMonth(selectedDate).map((day, index) => {
                          if (!day || !day.date) return null;
                          
                          let hasAppt = false;
                          let dayAppointments = [];
                          let appointmentCount = 0;
                          
                          try {
                            hasAppt = hasAppointment(day.date);
                            dayAppointments = getAppointmentsForDate(day.date);
                            appointmentCount = dayAppointments.length;
                          } catch (error) {
                            console.warn('Error processing day appointments:', error);
                          }
                          
                          return (
                            <div
                              key={index}
                              className={`calendar-day ${isToday(day.date) ? 'today' : ''} ${!day.isCurrentMonth ? 'other-month' : ''} ${hasAppt ? 'has-appointments' : ''}`}
                              onClick={() => day.isCurrentMonth && day.date && handleDayClick(day.date)}
                            >
                              <span>{day.date.getDate()}</span>
                              {appointmentCount > 0 && (
                                <div className="appointment-indicator">
                                  <i className="bi bi-pin-angle-fill appointment-pin"></i>
                                  <span className="appointment-count">{appointmentCount}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appointment History Tab Content */}
      {activeTab === 'history' && (
        <div className="appointment-history">
          <div className="management-header">
            <h3>Appointment History</h3>
            <div className="history-filters">
              <select className="form-select filter-select">
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select className="form-select filter-select">
                <option value="all">All Time</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
              </select>
              <div className="search-box">
                <i className="bi bi-search search-icon"></i>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search history..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="table-container">
            <table className="appointments-grid-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Patient</th>
                  <th>Type</th>
                  <th>Doctor</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map(appointment => (
                  <tr key={appointment.id}>
                    <td>
                      <div className="datetime-info">
                        <span className="date">{appointment.date}</span>
                        <span className="time">{appointment.time}</span>
                      </div>
                    </td>
                    <td>
                      <div className="patient-info">
                        <span className="name">{appointment.patient}</span>
                        <span className="id">PT-{String(appointment.id).padStart(4, '0')}</span>
                      </div>
                    </td>
                    <td>
                      <span className="type-badge">{appointment.type}</span>
                    </td>
                    <td>Dr. Santos</td>
                    <td>
                      <span className={`status-badge`} style={{ backgroundColor: getStatusColor(getDisplayStatus(appointment)) }}>
                        {getDisplayStatus(appointment)}
                      </span>
                    </td>
                    <td>30 min</td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn view" title="View Details">
                          <i className="bi bi-eye"></i>
                        </button>
                        <button className="action-btn reprint" title="Reprint Records">
                          <i className="bi bi-printer"></i>
                        </button>
                        <button className="action-btn repeat" title="Schedule Similar">
                          <i className="bi bi-arrow-repeat"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Schedule Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingAppointment ? 'Edit Appointment' : 'Quick Schedule Appointment'}</h3>
              <button 
                type="button"
                className="close-btn" 
                onClick={resetForm}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="appointment-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="patientId">Patient *</label>
                  <select 
                    id="patientId"
                    value={formData.patientId} 
                    onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                    required
                  >
                    <option value="">Select Patient</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name || `${patient.firstName} ${patient.lastName}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Doctor selection removed - doctor availability is not predictable */}
              </div>

              <div className="form-row three-col">
                <div className="form-group">
                  <label htmlFor="appointmentDate">Date *</label>
                  <input
                    id="appointmentDate"
                    type="date"
                    value={formData.appointmentDate}
                    onChange={(e) => setFormData({...formData, appointmentDate: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="appointmentTime">Time *</label>
                  <input
                    id="appointmentTime"
                    type="time"
                    value={formData.appointmentTime}
                    onChange={(e) => setFormData({...formData, appointmentTime: e.target.value})}
                    required
                  />
                </div>

                {/* Appointment Limits Information */}
                {(appointmentLimits || availableSlots.length > 0) && (
                  <div className="appointment-limits-section">
                    <h4>
                      <i className="bi bi-info-circle me-2"></i>
                      Appointment Availability
                    </h4>
                    
                    {limitsLoading && (
                      <div className="limits-loading">
                        <i className="bi bi-clock"></i> Checking availability...
                      </div>
                    )}

                    {appointmentLimits && !limitsLoading && (
                      <div className="limits-info">
                        <div className="limits-grid">
                          <div className="limit-item">
                            <span className="limit-label">Patient Daily Limit:</span>
                            <span className={`limit-value ${appointmentLimits.usage.patientDaily >= appointmentLimits.limits.maxPerPatientPerDay ? 'limit-exceeded' : 'limit-ok'}`}>
                              {appointmentLimits.usage.patientDaily} / {appointmentLimits.limits.maxPerPatientPerDay}
                            </span>
                          </div>
                          <div className="limit-item">
                            <span className="limit-label">Patient Weekly Limit:</span>
                            <span className={`limit-value ${appointmentLimits.usage.patientWeekly >= appointmentLimits.limits.maxPerPatientPerWeek ? 'limit-exceeded' : 'limit-ok'}`}>
                              {appointmentLimits.usage.patientWeekly} / {appointmentLimits.limits.maxPerPatientPerWeek}
                            </span>
                          </div>
                          <div className="limit-item">
                            <span className="limit-label">Facility Daily Capacity:</span>
                            <span className={`limit-value ${appointmentLimits.usage.totalDaily >= appointmentLimits.limits.maxTotalPerDay ? 'limit-exceeded' : 'limit-ok'}`}>
                              {appointmentLimits.usage.totalDaily} / {appointmentLimits.limits.maxTotalPerDay}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {availableSlots.length > 0 && (
                      <div className="available-slots-section">
                        <h5>Available Time Slots:</h5>
                        <div className="slots-grid">
                          {availableSlots.map((slot, index) => (
                            <button
                              key={index}
                              type="button"
                              className={`slot-button ${slot.available ? 'slot-available' : 'slot-unavailable'} ${formData.appointmentTime === slot.time ? 'slot-selected' : ''}`}
                              onClick={() => slot.available && setFormData({...formData, appointmentTime: slot.time})}
                              disabled={!slot.available}
                              title={slot.reason || (slot.available ? 'Available' : 'Not available')}
                            >
                              {slot.time}
                              {!slot.available && <i className="bi bi-x-circle ms-1"></i>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="duration">Duration (minutes)</label>
                  <select
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="type">Appointment Type</label>
                  <select 
                    id="type"
                    value={formData.type} 
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    {appointmentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="priority">Priority</label>
                  <select 
                    id="priority"
                    value={formData.priority} 
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  >
                    {priorityLevels.map(priority => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group full-width">
                <label htmlFor="notes">Reason for Visit</label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="3"
                  placeholder="Enter the reason for this appointment..."
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="symptoms">Symptoms (Optional)</label>
                <textarea
                  id="symptoms"
                  value={formData.symptoms}
                  onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                  rows="2"
                  placeholder="Describe any symptoms the patient is experiencing..."
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingAppointment ? 'Update Appointment' : 'Schedule Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Schedule Overlay Accordion */}
      {showForm && (
        <>
          <div className="overlay-backdrop" onClick={resetForm}></div>
          <div className="overlay-accordion">
            <div className="accordion-header">
              <h3>
                {editingAppointment ? 'Edit Appointment' : 'Quick Schedule Appointment'}
              </h3>
              <button className="close-button" onClick={resetForm}>×</button>
            </div>
            <div className="accordion-content">
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Patient *</label>
                    <div className="patient-search-container">
                      <div className="search-bar">
                        <i className="bi bi-search search-icon"></i>
                        <input
                          type="text"
                          placeholder="Search by patient name, ID, email, or phone..."
                          value={patientSearch}
                          onChange={(e) => handlePatientSearch(e.target.value)}
                          onFocus={() => {
                            if (filteredPatients.length > 0) {
                              setShowPatientDropdown(true);
                            }
                          }}
                          className="search-input patient-search-input"
                          required
                        />
                        {patientSearch && (
                          <button
                            type="button"
                            className="clear-search-btn"
                            onClick={clearPatientSelection}
                          >
                            <i className="bi bi-x"></i>
                          </button>
                        )}
                      </div>
                      {showPatientDropdown && filteredPatients.length > 0 && (
                        <div className="patient-dropdown">
                          {filteredPatients.map(patient => (
                            <div
                              key={patient.id}
                              className="patient-option"
                              onClick={() => selectPatient(patient)}
                            >
                              <div className="patient-info">
                                <div className="patient-name">
                                  {`${patient.firstName} ${patient.lastName}`}
                                </div>
                                <div className="patient-details">
                                  <span className="patient-id">ID: {patient.id}</span>
                                  {patient.email && (
                                    <span className="patient-email">• {patient.email}</span>
                                  )}
                                </div>
                              </div>
                              {patient.contactNumber && (
                                <span className="patient-contact">
                                  <i className="bi bi-telephone"></i>
                                  {patient.contactNumber}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {patientSearch.length > 1 && filteredPatients.length === 0 && showPatientDropdown && (
                        <div className="patient-dropdown no-results">
                          <div className="no-results-message">
                            <i className="bi bi-search"></i>
                            <span>No patients found matching "{patientSearch}"</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Date *</label>
                    <input
                      type="date"
                      value={formData.appointmentDate}
                      onChange={(e) => {
                        setFormData({...formData, appointmentDate: e.target.value});
                      }}
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label>Time *</label>
                    <input
                      type="time"
                      value={formData.appointmentTime}
                      onChange={(e) => {
                        setFormData({...formData, appointmentTime: e.target.value});
                      }}
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label>Type *</label>
                    <select 
                      value={formData.type} 
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      required
                    >
                      <option value="">Select appointment type</option>
                      <option value="Follow-up">Follow-up</option>
                      {(() => {
                        // Show Vaccination option only during specific times and days
                        if (formData.appointmentDate && formData.appointmentTime) {
                          const selectedDate = new Date(formData.appointmentDate);
                          const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
                          const hour = parseInt(formData.appointmentTime.split(':')[0]);
                          
                          // Vaccination available Monday-Friday, 8AM-4PM
                          if (dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 8 && hour < 16) {
                            return <option value="Vaccination">Vaccination</option>;
                          }
                        }
                        return null;
                      })()}
                    </select>
                  </div>

                  <div className="form-field form-field-wide">
                    <label>Additional Notes (Optional)</label>
                    <textarea
                      value={formData.symptoms}
                      onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                      rows="3"
                      placeholder="Add any additional notes or patient information..."
                    />
                  </div>
                </div>
                
                <div className="accordion-actions">
                  <button type="button" className="btn-secondary" onClick={resetForm}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingAppointment ? 'Update Appointment' : 'Schedule Appointment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Day Appointments Modal */}
      <Modal show={showDayModal} onHide={() => setShowDayModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            Appointments for {clickedDate && clickedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            <span className="appointment-count-badge ms-2">{selectedDayAppointments.length}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDayAppointments.length > 0 ? (
            <div className="appointments-timeline">
              {selectedDayAppointments.map((appointment, index) => (
                <div key={appointment.id} className="timeline-appointment">
                  <div className="appointment-time">
                    {formatTime(appointment.appointmentTime)}
                  </div>
                  <div className="appointment-details">
                    <div className="appointment-header">
                      <h4>{getPatientName(appointment)}</h4>
                      <span className={`status-badge`} style={{ backgroundColor: getStatusColor(getDisplayStatus(appointment)) }}>
                        {getDisplayStatus(appointment)}
                      </span>
                    </div>
                    <div className="appointment-info">
                      <div className="info-row">
                        <i className="bi bi-clipboard-heart me-2"></i>
                        <span>{appointment.type}</span>
                      </div>
                      <div className="info-row">
                        <i className="bi bi-clock me-2"></i>
                        <span>{appointment.duration || 30} minutes</span>
                      </div>
                      {appointment.notes && (
                        <div className="info-row">
                          <i className="bi bi-journal-text me-2"></i>
                          <span>{appointment.notes}</span>
                        </div>
                      )}
                      {appointment.urgencyLevel && (
                        <div className="info-row">
                          <i className="bi bi-exclamation-triangle me-2"></i>
                          <span className={`urgency-${appointment.urgencyLevel}`}>
                            {appointment.urgencyLevel.charAt(0).toUpperCase() + appointment.urgencyLevel.slice(1)} Priority
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-appointments">
              <i className="bi bi-calendar-x"></i>
              <p>No appointments scheduled for this day</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDayModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Appointment Requests Modal */}
      {showAppointmentRequests && (
        <div className="appointment-requests-modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="appointment-requests-modal" style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '1000px',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
          }}>
            <div className="appointment-requests-modal-header">
              <h3>
                <i className="bi bi-calendar-check me-2"></i>
                Appointment Requests
              </h3>
              <button 
                className="appointment-requests-modal-close" 
                onClick={() => setShowAppointmentRequests(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="appointment-requests-modal-body">
              {requestsLoading ? (
                <div className="requests-loading">
                  <i className="bi bi-hourglass-split spin-animation"></i>
                  <p>Loading appointment requests...</p>
                </div>
              ) : appointmentRequests.length === 0 ? (
                <div className="no-requests">
                  <i className="bi bi-calendar-check"></i>
                  <p>No pending appointment requests</p>
                </div>
              ) : (
                <div className="requests-list">
                  <div className="requests-controls">
                    <div className="search-section">
                      <input
                        type="text"
                        className="search-input"
                        placeholder="Search by patient name..."
                        value={requestSearchTerm}
                        onChange={(e) => setRequestSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="sort-section">
                      <select
                        className="sort-select"
                        value={`${requestSortBy}-${sortOrder}`}
                        onChange={(e) => {
                          const [newSortBy, newSortOrder] = e.target.value.split('-');
                          setRequestSortBy(newSortBy);
                          setSortOrder(newSortOrder);
                        }}
                      >
                        <option value="date-asc">Date (Oldest First)</option>
                        <option value="date-desc">Date (Newest First)</option>
                        <option value="patient-asc">Patient (A-Z)</option>
                        <option value="patient-desc">Patient (Z-A)</option>
                        <option value="type-asc">Type (A-Z)</option>
                        <option value="type-desc">Type (Z-A)</option>
                      </select>
                    </div>
                  </div>
                  <h4>Pending Requests ({getFilteredAndSortedRequests().length})</h4>
                  <div className="requests-table-container">
                    <table className="requests-table">
                      <thead>
                        <tr>
                          <th>Patient</th>
                          <th>Date & Time</th>
                          <th>Type</th>
                          <th>Details</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredAndSortedRequests().map(request => (
                          <tr key={request.id}>
                            <td>
                              {request.patientName || 
                                `${patients.find(p => p.id === request.patientId)?.firstName || ''} 
                                ${patients.find(p => p.id === request.patientId)?.lastName || ''}`}
                            </td>
                            <td className="datetime-cell">
                              {(() => {
                                try {
                                  const date = new Date(request.requestedDate || request.appointmentDate);
                                  const time = request.requestedTime || request.appointmentTime;
                                  if (isNaN(date.getTime())) {
                                    return 'Invalid Date';
                                  }
                                  return `${date.toLocaleDateString()} at ${time}`;
                                } catch (error) {
                                  return 'Invalid Date';
                                }
                              })()}
                            </td>
                            <td>{request.appointmentType || request.type || 'Consultation'}</td>
                            <td className="details-cell">
                              <button 
                                className="btn-details"
                                onClick={() => {
                                  const details = [];
                                  if (request.symptoms) details.push(`Symptoms: ${request.symptoms}`);
                                  if (request.notes) details.push(`Notes: ${request.notes}`);
                                  const message = details.length > 0 ? details.join('\n\n') : 'No additional details provided';
                                  alert(message);
                                }}
                              >
                                <i className="bi bi-info-circle"></i>
                                View Details
                              </button>
                            </td>
                            <td className="actions-cell">
                              <button 
                                className="btn-approve"
                                onClick={() => initiateApproval(request)}
                              >
                                <i className="bi bi-check-circle-fill"></i>
                                Approve
                              </button>
                              <button 
                                className="btn-reject"
                                onClick={() => initiateRejection(request)}
                              >
                                <i className="bi bi-x-circle-fill"></i>
                                Reject
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approval Confirmation Modal */}
      {showApproveConfirmation && selectedRequest && (
        <div className="appointment-approval-modal-overlay">
          <div className="appointment-approval-modal">
            <div className="appointment-approval-modal-header">
              <h3>Confirm Appointment Approval</h3>
              <button 
                className="appointment-approval-modal-close" 
                onClick={() => setShowApproveConfirmation(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="appointment-approval-modal-body">
              <p>Are you sure you want to approve this appointment request?</p>
              
              <div className="request-details">
                <div className="detail-row">
                  <span className="detail-label">Patient:</span>
                  <span className="detail-value">
                    {selectedRequest.patientName || 
                      `${patients.find(p => p.id === selectedRequest.patientId)?.firstName || ''} 
                      ${patients.find(p => p.id === selectedRequest.patientId)?.lastName || ''}`}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date:</span>
                  <span className="detail-value">
                    {(() => {
                      try {
                        const date = new Date(selectedRequest.requestedDate || selectedRequest.appointmentDate);
                        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
                      } catch (error) {
                        return 'Invalid Date';
                      }
                    })()}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Time:</span>
                  <span className="detail-value">{selectedRequest.requestedTime || selectedRequest.appointmentTime || 'Not specified'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Type:</span>
                  <span className="detail-value">{selectedRequest.type || 'Consultation'}</span>
                </div>
              </div>

              <div className="approval-actions">
                <button className="btn-cancel" onClick={() => setShowApproveConfirmation(false)}>
                  Cancel
                </button>
                <button className="btn-confirm-approve" onClick={confirmApproval}>
                  <i className="bi bi-check-circle me-2"></i>
                  Confirm Approval
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Rejection Confirmation Modal */}
      {showRejectConfirmation && selectedRequest && (
        <div className="admin-rejection-modal-overlay">
          <div className="admin-rejection-modal">
            <div className="admin-rejection-modal-header">
              <h3>
                <i className="bi bi-exclamation-triangle me-2"></i>
                Reject Appointment Request
              </h3>
              <button 
                className="admin-rejection-modal-close" 
                onClick={() => setShowRejectConfirmation(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            
            <div className="admin-rejection-modal-body">
              <div className="rejection-patient-info">
                <div className="patient-details-card">
                  <div className="detail-row">
                    <span className="detail-label">
                      <i className="bi bi-person me-1"></i>
                      Patient:
                    </span>
                    <span className="detail-value">
                      {selectedRequest.patientName || 
                        `${patients.find(p => p.id === selectedRequest.patientId)?.firstName || ''} 
                        ${patients.find(p => p.id === selectedRequest.patientId)?.lastName || ''}`}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">
                      <i className="bi bi-calendar me-1"></i>
                      Date:
                    </span>
                    <span className="detail-value">
                      {(() => {
                        try {
                          const date = new Date(selectedRequest.requestedDate || selectedRequest.appointmentDate);
                          return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
                        } catch (error) {
                          return 'Invalid Date';
                        }
                      })()}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">
                      <i className="bi bi-clock me-1"></i>
                      Time:
                    </span>
                    <span className="detail-value">
                      {selectedRequest.requestedTime || selectedRequest.appointmentTime || 'Not specified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Smart Suggestions Section */}
              {smartSuggestions.length > 0 && (
                <div className="smart-suggestions-section">
                  <h4>
                    <i className="bi bi-lightbulb me-2"></i>
                    Smart Suggestions
                  </h4>
                  <div className="suggestions-list">
                    {smartSuggestions.map((suggestion, index) => (
                      <div 
                        key={index}
                        className={`suggestion-item ${suggestion.priority}`}
                        onClick={() => selectSuggestion(suggestion)}
                      >
                        <div className="suggestion-priority">
                          {suggestion.priority === 'high' && <i className="bi bi-exclamation-triangle-fill text-danger"></i>}
                          {suggestion.priority === 'medium' && <i className="bi bi-exclamation-circle-fill text-warning"></i>}
                          {suggestion.priority === 'low' && <i className="bi bi-info-circle-fill text-info"></i>}
                        </div>
                        <div className="suggestion-text">{suggestion.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Templates Section */}
              <div className="rejection-templates-section">
                <h4>
                  <i className="bi bi-collection me-2"></i>
                  Quick Templates
                </h4>
                <div className="templates-grid">
                  {REJECTION_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      className={`template-button ${selectedTemplate === template.id ? 'selected' : ''}`}
                      onClick={() => selectTemplate(template)}
                    >
                      <span className="template-title">{template.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Reason Section */}
              <div className="rejection-reason-section">
                <label htmlFor="rejectionReason">
                  <i className="bi bi-chat-text me-2"></i>
                  Rejection Reason:
                </label>
                <textarea
                  id="rejectionReason"
                  className="rejection-reason-textarea"
                  value={rejectionReason}
                  onChange={(e) => handleCustomReason(e.target.value)}
                  placeholder="Select a template above or write a custom reason for rejecting this appointment request..."
                  rows={4}
                  required
                />
              </div>

              <div className="rejection-actions">
                <button 
                  className="btn-cancel" 
                  onClick={() => setShowRejectConfirmation(false)}
                >
                  <i className="bi bi-x me-2"></i>
                  Cancel
                </button>
                <button 
                  className="btn-confirm-reject" 
                  onClick={confirmRejection}
                  disabled={!rejectionReason.trim()}
                >
                  <i className="bi bi-check-circle me-2"></i>
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentManager;
