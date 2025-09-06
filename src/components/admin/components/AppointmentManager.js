import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import appointmentService from '../../../services/appointmentService';
import patientService from '../../../services/patientService';
import userService from '../../../services/userService';
import './AppointmentManager.css';
import './AppointmentManager_overlay.css';

const AppointmentManager = () => {
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
  const [showDayAppointments, setShowDayAppointments] = useState(false);
  const [clickedDate, setClickedDate] = useState(null);
  
  // Form-specific states
  const [patientSearch, setPatientSearch] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [availableServices, setAvailableServices] = useState([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const cardsPerPage = 4;

  // Mock data removed - using real data from database





  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: '',
    appointmentTime: '',
    duration: 30,
    type: 'Consultation',
    status: 'Scheduled',
    priority: 'Normal',
    notes: '',
    symptoms: ''
  });

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

  const loadInitialData = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      setError('');
      console.log('Starting to load initial data...');
      
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      console.log('Auth check - token:', !!token, 'user:', !!user);
      
      if (!token || !user) {
        console.log('No authentication found, using empty data');
        // Use empty data when not authenticated
        setAppointments([]);
        setPatients([
          { id: 1, name: 'Maria Santos', email: 'maria@example.com' },
          { id: 2, name: 'Carlos Mendoza', email: 'carlos@example.com' },
          { id: 3, name: 'Ana Reyes', email: 'ana@example.com' },
          { id: 4, name: 'Pedro Garcia', email: 'pedro@example.com' },
          { id: 5, name: 'Sofia Lopez', email: 'sofia@example.com' },
          { id: 6, name: 'Miguel Torres', email: 'miguel@example.com' }
        ]);
        setDoctors([
          { id: 1, name: 'Dr. Santos', role: 'doctor', email: 'santos@example.com' },
          { id: 2, name: 'Dr. Martinez', role: 'doctor', email: 'martinez@example.com' },
          { id: 3, name: 'Dr. Garcia', role: 'doctor', email: 'garcia@example.com' }
        ]);
        setTodayAppointments([]);
        return;
      }

      try {
        const userData = JSON.parse(user);
        console.log('User data:', userData);
        if (!userData || (userData.role !== 'admin' && userData.role !== 'doctor')) {
          setError('Access denied. Admin or doctor privileges required.');
          return;
        }
      } catch (parseError) {
        console.error('Error parsing user data:', parseError);
        setError('Invalid session data. Please log in again.');
        return;
      }

      // Try to load data gracefully
      console.log('Attempting to load data from APIs...');
      const results = await Promise.allSettled([
        appointmentService.getAppointments().catch(err => {
          console.error('Appointments API failed:', err);
          return [];
        }),
        patientService.getPatients().catch(err => {
          console.error('Patients API failed:', err);
          return [];
        }),
        userService.getUsers().catch(err => {
          console.error('Users API failed:', err);
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
      const appointmentsData = appointmentsResult.status === 'fulfilled' && appointmentsResult.value.length > 0 
        ? appointmentsResult.value 
        : [];
      
      const patientsData = patientsResult.status === 'fulfilled' && patientsResult.value.length > 0
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
        // Create new appointment
        const appointmentData = {
          id: Date.now(), // Generate temporary ID
          patient: patients.find(p => p.id === parseInt(formData.patientId))?.name || 'Unknown Patient',
          doctor: doctors.find(d => d.id === parseInt(formData.doctorId))?.name || 'Unknown Doctor',
          date: formData.appointmentDate,
          time: formData.appointmentTime,
          type: formData.type,
          status: formData.status,
          priority: formData.priority,
          duration: formData.duration,
          notes: formData.notes,
          symptoms: formData.symptoms,
          statusColor: formData.status === 'Scheduled' ? '#007bff' : 
                      formData.status === 'In Progress' ? '#ffc107' : 
                      formData.status === 'Completed' ? '#28a745' : '#6c757d'
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
      doctorId: '',
      appointmentDate: '',
      appointmentTime: '',
      duration: 30,
      type: 'Consultation',
      status: 'Scheduled',
      priority: 'Normal',
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
        // Show appointments for this day
        setSelectedDayAppointments(dayAppointments);
        setClickedDate(date);
        setShowDayAppointments(true);
      } else {
        // No appointments, show quick schedule form for this date
        setSelectedDate(date);
        setShowForm(true);
      }
    } catch (error) {
      console.warn('Error in handleDayClick:', error);
      // Fallback to showing quick schedule form
      setSelectedDate(date);
      setShowForm(true);
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

  const getPatientName = (patientId) => {
    if (!patientId || !patients) return 'Unknown Patient';
    const patient = patients.find(p => p && p.id === patientId);
    return patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : 'Unknown Patient';
  };

  const getDoctorName = (doctorId) => {
    if (!doctorId || !doctors) return 'Unknown Doctor';
    const doctor = doctors.find(d => d && d.id === doctorId);
    return doctor ? `Dr. ${doctor.lastName || doctor.firstName || 'Unknown'}` : 'Unknown Doctor';
  };

  // Patient search functions
  const handlePatientSearch = (searchValue) => {
    setPatientSearch(searchValue);
    
    if (searchValue.length > 0) {
      const filtered = patients.filter(patient => {
        const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
        const patientId = patient.id.toString();
        return fullName.includes(searchValue.toLowerCase()) || 
               patientId.includes(searchValue);
      });
      setFilteredPatients(filtered.slice(0, 10)); // Limit to 10 results
      setShowPatientDropdown(true);
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
          <input
            type="text"
            className="search-input"
            placeholder="Search appointments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn btn-primary" onClick={() => {
            console.log('Quick Schedule button clicked, showForm:', showForm);
            setShowForm(true);
            console.log('showForm set to true');
          }}>
            <i className="bi bi-lightning-charge me-2"></i>
            Quick Schedule
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
                      <span className={`status-indicator ${appointment.status.toLowerCase().replace(' ', '-')}`}>
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
                          (getPatientName(appointment.patientId).toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (appointment.type && appointment.type.toLowerCase().includes(searchTerm.toLowerCase())))
                        ).map((appointment) => (
                          <tr key={appointment.id}>
                            <td>{getPatientName(appointment.patientId)}</td>
                            <td>{new Date(appointment.appointmentDate).toLocaleDateString()}</td>
                            <td>{formatTime(appointment.appointmentTime)}</td>
                            <td>{appointment.type || 'Consultation'}</td>
                            <td>
                              <span className={`status-indicator ${appointment.status.toLowerCase().replace(' ', '-')}`}>
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
                      <span className={`status-badge ${appointment.status.toLowerCase().replace(' ', '-')}`}>
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
                      <input
                        type="text"
                        placeholder="Search by patient name or ID..."
                        value={patientSearch}
                        onChange={(e) => handlePatientSearch(e.target.value)}
                        onFocus={() => setShowPatientDropdown(filteredPatients.length > 0)}
                        className="patient-search-input"
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
                      {showPatientDropdown && filteredPatients.length > 0 && (
                        <div className="patient-dropdown">
                          {filteredPatients.map(patient => (
                            <div
                              key={patient.id}
                              className="patient-option"
                              onClick={() => selectPatient(patient)}
                            >
                              <div className="patient-info">
                                <span className="patient-name">
                                  {`${patient.firstName} ${patient.lastName}`}
                                </span>
                                <span className="patient-id">ID: {patient.id}</span>
                              </div>
                              {patient.contactNumber && (
                                <span className="patient-contact">{patient.contactNumber}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="form-field">
                    <label>Doctor *</label>
                    <select value={formData.doctorId} onChange={(e) => setFormData({...formData, doctorId: e.target.value})} required>
                      <option value="">Select Doctor</option>
                      {doctors.map(doctor => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.firstName && doctor.lastName 
                            ? `Dr. ${doctor.firstName} ${doctor.lastName}`
                            : `Dr. ${doctor.username || doctor.email}`
                          }
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Date *</label>
                    <input
                      type="date"
                      value={formData.appointmentDate}
                      onChange={(e) => {
                        setFormData({...formData, appointmentDate: e.target.value});
                        updateAvailableServices(e.target.value, formData.appointmentTime);
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
                        updateAvailableServices(formData.appointmentDate, e.target.value);
                      }}
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label>Type</label>
                    <select 
                      value={formData.type} 
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      disabled={!isDateTimeSelected()}
                    >
                      <option value="">
                        {isDateTimeSelected() ? 'Select consultation type...' : 'Please select date and time first'}
                      </option>
                      {availableServices.map(service => (
                        <option key={service} value={service}>{service}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Priority</label>
                    <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})}>
                      {priorityLevels.map(priority => (
                        <option key={priority} value={priority}>{priority}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field form-field-wide">
                    <label>Reason for Visit</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      rows="2"
                      placeholder="Enter the reason for this appointment..."
                    />
                  </div>

                  <div className="form-field form-field-wide">
                    <label>Symptoms (Optional)</label>
                    <textarea
                      value={formData.symptoms}
                      onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                      rows="2"
                      placeholder="Describe any symptoms the patient is experiencing..."
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

      {/* Day Appointments Accordion */}
      {showDayAppointments && (
        <div className="day-appointments-accordion">
          <div className="accordion-header" onClick={() => setShowDayAppointments(false)}>
            <div className="accordion-title">
              <i className="bi bi-calendar-day me-2"></i>
              Appointments for {clickedDate?.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
              <span className="appointment-count-badge">{selectedDayAppointments.length}</span>
            </div>
            <i className="bi bi-chevron-up accordion-toggle"></i>
          </div>
          
          <div className="accordion-content">
            {selectedDayAppointments.length > 0 ? (
              <div className="appointments-timeline">
                {selectedDayAppointments.map((appointment, index) => (
                  <div key={appointment.id} className="timeline-appointment">
                    <div className="appointment-time">
                      {formatTime(appointment.appointmentTime)}
                    </div>
                    <div className="appointment-details">
                      <div className="appointment-header">
                        <h4>{getPatientName(appointment.patientId)}</h4>
                        <span className={`status-badge status-${appointment.status.toLowerCase()}`}>
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
                    <div className="appointment-actions">
                      <button 
                        className="btn-sm btn-outline"
                        onClick={() => {
                          setEditingAppointment(appointment);
                          setShowDayAppointments(false);
                          setShowForm(true);
                        }}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
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
            
            <div className="day-appointments-footer">
              <button 
                className="btn-secondary"
                onClick={() => {
                  setSelectedDate(clickedDate);
                  setShowDayAppointments(false);
                  setShowForm(true);
                }}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Add New Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentManager;
