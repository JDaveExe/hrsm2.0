import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useAuth } from '../../../context/AuthContext';
import appointmentService from '../../../services/appointmentService';
import patientService from '../../../services/patientService';
import userService from '../../../services/userService';
import './AppointmentManager.css';
import './AppointmentManager_overlay.css';
import './AppointmentRequestsModal.css';

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
  const cardsPerPage = 4;
  
  // Appointment requests states
  const [showAppointmentRequests, setShowAppointmentRequests] = useState(false);
  const [appointmentRequests, setAppointmentRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  
  // Confirmation and rejection states
  const [showApproveConfirmation, setShowApproveConfirmation] = useState(false);
  const [showRejectConfirmation, setShowRejectConfirmation] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Search and sorting states for appointment requests
  const [requestSearchTerm, setRequestSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date'); // 'date', 'patient', 'type'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'

  // Mock data removed - using real data from database





  const [formData, setFormData] = useState({
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

  // Function to fetch appointment requests
  const fetchAppointmentRequests = async () => {
    try {
      setRequestsLoading(true);
      const requests = await appointmentService.getAppointmentRequests();
      setAppointmentRequests(requests || []);
      setRequestCount(requests?.length || 0);
    } catch (err) {
      console.error('Error fetching appointment requests:', err);
      setError('Failed to load appointment requests');
    } finally {
      setRequestsLoading(false);
    }
  };

  // Filter and sort appointment requests
  const getFilteredAndSortedRequests = () => {
    let filteredRequests = appointmentRequests.filter(request => {
      const patientName = request.patientName || 
        `${patients.find(p => p.id === request.patientId)?.firstName || ''} 
        ${patients.find(p => p.id === request.patientId)?.lastName || ''}`.trim();
      return patientName.toLowerCase().includes(requestSearchTerm.toLowerCase());
    });

    return filteredRequests.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'patient':
          aValue = a.patientName || `${patients.find(p => p.id === a.patientId)?.firstName || ''} ${patients.find(p => p.id === a.patientId)?.lastName || ''}`.trim();
          bValue = b.patientName || `${patients.find(p => p.id === b.patientId)?.firstName || ''} ${patients.find(p => p.id === b.patientId)?.lastName || ''}`.trim();
          break;
        case 'type':
          aValue = a.appointmentType || a.type || 'Consultation';
          bValue = b.appointmentType || b.type || 'Consultation';
          break;
        case 'date':
        default:
          aValue = new Date(a.requestedDate || a.appointmentDate);
          bValue = new Date(b.requestedDate || b.appointmentDate);
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };
  
  // Function to initiate approval confirmation
  const initiateApproval = (request) => {
    setSelectedRequest(request);
    setSelectedRequestId(request.id);
    setShowApproveConfirmation(true);
  };
  
  // Function to initiate rejection confirmation
  const initiateRejection = (request) => {
    setSelectedRequest(request);
    setSelectedRequestId(request.id);
    setRejectionReason('');
    setShowRejectConfirmation(true);
  };
  
  // Function to confirm and execute approval
  const confirmApproval = async () => {
    try {
      console.log('Approving appointment request:', selectedRequestId);
      await appointmentService.approveAppointmentRequest(selectedRequestId);
      setSuccess('Appointment request approved successfully - refreshing appointments...');
      
      // Close confirmation modal
      setShowApproveConfirmation(false);
      
      // Refresh appointment requests first
      await fetchAppointmentRequests();
      
      // Update request count for the badge
      try {
        const requestsCount = await appointmentService.getAppointmentRequestsCount();
        setRequestCount(requestsCount || 0);
      } catch (countError) {
        console.error('Error updating request count:', countError);
      }
      
      // Wait a moment for backend processing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Directly refresh appointments to show the newly approved appointment
      try {
        const updatedAppointments = await appointmentService.getAppointments();
        setAppointments(updatedAppointments || []);
        
        // Filter today's appointments
        const today = new Date().toDateString();
        const todaysAppts = (updatedAppointments || []).filter(apt => {
          const aptDate = new Date(apt.appointmentDate || apt.date).toDateString();
          return aptDate === today;
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
      await appointmentService.rejectAppointmentRequest(selectedRequestId, rejectionReason);
      setSuccess('Appointment request rejected');
      
      // Close confirmation modal
      setShowRejectConfirmation(false);
      setRejectionReason('');
      
      // Refresh the requests list
      await fetchAppointmentRequests();
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
      
      // Filter today's appointments
      const today = new Date().toISOString().split('T')[0];
      const todayAppts = appointmentsData.filter(apt => {
        if (apt.date) {
          const aptDate = new Date(apt.date).toISOString().split('T')[0];
          return aptDate === today;
        }
        return false;
      });
      
      console.log('Today\'s appointments found:', todayAppts.length);
      setTodayAppointments(todayAppts);
      
      // Also fetch appointment requests count
      try {
        const requestsCount = await appointmentService.getAppointmentRequestsCount();
        setRequestCount(requestsCount || 0);
      } catch (reqErr) {
        console.error('Error getting appointment requests count:', reqErr);
        // Not critical, so just log error but don't show to user
      }
      
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
          type: formData.type,
          status: 'approved', // Auto-approved by admin
          duration: formData.duration,
          notes: formData.notes,
          symptoms: formData.symptoms,
          createdBy: 'admin',
          needsPatientAcceptance: true,
          statusColor: '#28a745' // Green for approved
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
          const todayAppointment = {
            ...newAppointment,
            time: formData.appointmentTime,
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

  // Get status color based on status
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return { backgroundColor: '#28a745', color: 'white' }; // Green
      case 'pending':
        return { backgroundColor: '#fd7e14', color: 'black' }; // Dark orange with black text
      case 'accepted':
        return { backgroundColor: '#ffc107', color: 'black' }; // Yellow with black text
      case 'completed':
        return { backgroundColor: '#6c757d', color: 'white' }; // Gray
      case 'cancelled':
        return { backgroundColor: '#dc3545', color: 'white' }; // Red
      default:
        return { backgroundColor: '#007bff', color: 'white' }; // Blue (default)
    }
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
          <button className="btn btn-primary me-2" onClick={() => {
            console.log('Add Appointment button clicked, navigating to Patient Database');
            // Navigate to Patient Database with Individual Members tab active
            if (window.navigateToPatientDatabase) {
              window.navigateToPatientDatabase('Patient Database', 'members');
            } else {
              // Fallback navigation method
              console.log('Global navigation function not available, using fallback');
              window.dispatchEvent(new CustomEvent('navigate-to-patient-database', {
                detail: { path: 'Patient Database', tab: 'members' }
              }));
            }
          }}>
            <i className="bi bi-person-plus me-2"></i>
            Add Appointment
          </button>
          <button 
            className="btn btn-info me-2" 
            onClick={() => {
              console.log('Appointment Requests button clicked');
              fetchAppointmentRequests();
              setShowAppointmentRequests(true);
              console.log('Modal should be showing now');
            }}
          >
            <i className="bi bi-bell me-2"></i>
            Appointment Requests
            {requestCount > 0 && (
              <span className="badge">{requestCount}</span>
            )}
          </button>
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
                      <div className="patient-name">{appointment.patient}</div>
                      <div className="appointment-type">{appointment.type}</div>
                      <div className="doctor-name">{appointment.doctor}</div>
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
                  <div className="section-actions" style={{ marginBottom: '1rem' }}>
                    <div className="search-bar">
                      <i className="bi bi-search search-icon"></i>
                      <input
                        type="text"
                        placeholder="Search appointments..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="appointments-card-table-container">
                    <table className="appointments-card-table">
                      <thead>
                        <tr>
                          <th>Patient</th>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Type</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.filter(appointment =>
                          (getPatientName(appointment).toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (appointment.type && appointment.type.toLowerCase().includes(searchTerm.toLowerCase())))
                        ).map((appointment) => (
                          <tr key={appointment.id}>
                            <td>{getPatientName(appointment)}</td>
                            <td>{new Date(appointment.appointmentDate).toLocaleDateString()}</td>
                            <td>{formatTime(appointment.appointmentTime)}</td>
                            <td>{appointment.type || 'Consultation'}</td>
                            <td>
                              <span className={`status-indicator`} style={{ backgroundColor: getStatusColor(appointment.status) }}>
                                {appointment.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                      <span className={`status-badge`} style={{ backgroundColor: getStatusColor(appointment.status) }}>
                        {appointment.status}
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

                <div className="form-group">
                  <label htmlFor="doctorId">Doctor *</label>
                  <select 
                    id="doctorId"
                    value={formData.doctorId} 
                    onChange={(e) => setFormData({...formData, doctorId: e.target.value})}
                    required
                  >
                    <option value="">Select Doctor</option>
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name || `Dr. ${doctor.firstName} ${doctor.lastName}`}
                      </option>
                    ))}
                  </select>
                </div>
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
                      <span className={`status-badge`} style={{ backgroundColor: getStatusColor(appointment.status) }}>
                        {appointment.status}
                      </span>
                    </div>
                    <div className="appointment-info">
                      <div className="info-row">
                        <i className="bi bi-person-check me-2"></i>
                        <span>{getDoctorName(appointment.doctorId)}</span>
                      </div>
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
                        value={`${sortBy}-${sortOrder}`}
                        onChange={(e) => {
                          const [newSortBy, newSortOrder] = e.target.value.split('-');
                          setSortBy(newSortBy);
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

      {/* Rejection Confirmation Modal */}
      {showRejectConfirmation && selectedRequest && (
        <div className="appointment-approval-modal-overlay">
          <div className="appointment-approval-modal">
            <div className="appointment-rejection-modal-header">
              <h3>Confirm Appointment Rejection</h3>
              <button 
                className="appointment-approval-modal-close" 
                onClick={() => setShowRejectConfirmation(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="appointment-approval-modal-body">
              <p>Please provide a reason for rejecting this appointment request:</p>
              
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
              </div>

              <div className="rejection-reason-container">
                <label htmlFor="rejectionReason">Reason for Rejection:</label>
                <textarea
                  id="rejectionReason"
                  className="rejection-reason-textarea"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejecting this appointment request..."
                  required
                />
              </div>

              <div className="rejection-actions">
                <button className="btn-cancel" onClick={() => setShowRejectConfirmation(false)}>
                  Cancel
                </button>
                <button 
                  className="btn-confirm-reject" 
                  onClick={confirmRejection}
                  disabled={!rejectionReason.trim()}
                >
                  <i className="bi bi-x-circle me-2"></i>
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
