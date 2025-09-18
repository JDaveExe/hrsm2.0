import React, { useState, useEffect } from 'react';
import appointmentService from '../../../services/appointmentService';
import patientService from '../../../services/patientService';
import userService from '../../../services/userService';
import LoadingSpinnerDoc from './LoadingSpinnerDoc';
import '../styles/Appointments.css';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableTypes, setAvailableTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('appointments');
  const [currentPage, setCurrentPage] = useState(0);
  const [cardsPerPage] = useState(4);
  const [showDayAppointments, setShowDayAppointments] = useState(false);
  const [selectedDayAppointments, setSelectedDayAppointments] = useState([]);
  const [clickedDate, setClickedDate] = useState(null);
  
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: '',
    appointmentTime: '',
    type: '', // Start empty - will be populated based on date/time
    notes: '',
    status: 'Scheduled'
  });

  useEffect(() => {
    loadInitialData();
    loadPatients();
    loadDoctors();
  }, []);

  // Load patients from database
  const loadPatients = async () => {
    setLoadingPatients(true);
    try {
      const patientsData = await patientService.getAllPatients();
      console.log('📋 Loaded patients:', patientsData);
      
      if (patientsData && Array.isArray(patientsData)) {
        setPatients(patientsData);
      } else {
        console.warn('Invalid patients data received:', patientsData);
        setPatients([]);
      }
    } catch (err) {
      console.error('Error loading patients:', err);
      setError('Failed to load patients. Please try again.');
      setPatients([]);
    } finally {
      setLoadingPatients(false);
    }
  };

  // Load doctors from database
  const loadDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const doctorsData = await userService.getUsers();
      console.log('👨‍⚕️ Loaded users:', doctorsData);
      
      if (doctorsData && Array.isArray(doctorsData)) {
        // Filter only doctors
        const doctorUsers = doctorsData.filter(user => 
          user.role === 'Doctor' || user.role === 'Admin'
        );
        setDoctors(doctorUsers);
        console.log('👨‍⚕️ Filtered doctors:', doctorUsers);
      } else {
        console.warn('Invalid doctors data received:', doctorsData);
        setDoctors([]);
      }
    } catch (err) {
      console.error('Error loading doctors:', err);
      setError('Failed to load doctors. Please try again.');
      setDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  };

  // Reload appointments when selected date changes (for calendar view)
  useEffect(() => {
    if (activeTab === 'appointments') {
      loadMonthAppointments();
    }
  }, [selectedDate, activeTab]);

  const loadMonthAppointments = async () => {
    try {
      const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      const monthData = await appointmentService.getCalendarView(
        startDate.toISOString().split('T')[0], 
        endDate.toISOString().split('T')[0]
      );
      
      if (monthData && Array.isArray(monthData)) {
        const processedAppointments = monthData.map(apt => ({
          id: apt.id,
          patient: apt.patient_name || `${apt.Patient?.first_name} ${apt.Patient?.last_name}` || 'Unknown Patient',
          appointmentDate: apt.appointment_date,
          appointmentTime: apt.appointment_time,
          type: apt.type || 'Consultation',
          status: apt.status || 'Scheduled',
          scheduledBy: apt.created_by_role || 'admin',
          doctor: apt.doctor_name || `${apt.Doctor?.first_name} ${apt.Doctor?.last_name}` || 'Unknown Doctor'
        }));
        setAppointments(processedAppointments);
      }
    } catch (err) {
      console.error('Error loading month appointments:', err);
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      // Load today's appointments
      const todaysData = await appointmentService.getTodaysAppointments();
      console.log('Today\'s appointments:', todaysData);
      
      // Load all appointments for the current month
      const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      const allData = await appointmentService.getCalendarView(
        startDate.toISOString().split('T')[0], 
        endDate.toISOString().split('T')[0]
      );
      console.log('All appointments:', allData);
      
      // Process today's appointments
      if (todaysData && Array.isArray(todaysData)) {
        const processedTodayAppointments = todaysData.map(apt => ({
          id: apt.id,
          patient: apt.patient_name || `${apt.Patient?.first_name} ${apt.Patient?.last_name}` || 'Unknown Patient',
          time: formatTime(apt.appointment_time),
          duration: apt.duration || '30 min',
          type: apt.type || 'Consultation',
          doctor: apt.doctor_name || `${apt.Doctor?.first_name} ${apt.Doctor?.last_name}` || 'Unknown Doctor',
          status: apt.status || 'Scheduled',
          scheduledBy: apt.created_by_role || 'admin'
        }));
        setTodayAppointments(processedTodayAppointments);
      } else {
        setTodayAppointments([]);
      }
      
      // Process all appointments
      if (allData && Array.isArray(allData)) {
        const processedAllAppointments = allData.map(apt => ({
          id: apt.id,
          patient: apt.patient_name || `${apt.Patient?.first_name} ${apt.Patient?.last_name}` || 'Unknown Patient',
          appointmentDate: apt.appointment_date,
          appointmentTime: apt.appointment_time,
          type: apt.type || 'Consultation',
          status: apt.status || 'Scheduled',
          scheduledBy: apt.created_by_role || 'admin',
          doctor: apt.doctor_name || `${apt.Doctor?.first_name} ${apt.Doctor?.last_name}` || 'Unknown Doctor'
        }));
        setAppointments(processedAllAppointments);
      } else {
        setAppointments([]);
      }
      
    } catch (err) {
      console.error('Error loading appointment data:', err);
      setError(`Failed to load appointment data: ${err.message}`);
      // Set empty arrays on error instead of mock data
      setTodayAppointments([]);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // Load available appointment types based on date and time
  const loadAvailableTypes = async (date, time, doctorId) => {
    if (!date || !time) {
      setAvailableTypes([]);
      return;
    }

    setLoadingTypes(true);
    try {
      // Check for conflicts and available slots
      const conflictCheck = await appointmentService.checkConflicts({
        appointmentDate: date,
        appointmentTime: time,
        doctorId: doctorId || formData.doctorId
      });

      console.log('🔍 Conflict check result:', conflictCheck);

      // All appointment types available if no conflicts
      const allTypes = [
        'Consultation',
        'Follow-up',
        'Check-up',
        'Vaccination',
        'Emergency',
        'Lab Test'
      ];

      // If there are conflicts, remove certain types that require more time
      if (conflictCheck && conflictCheck.hasConflict) {
        // Only allow quick appointments if there are conflicts
        const quickTypes = [
          'Follow-up',
          'Consultation'
        ];
        setAvailableTypes(quickTypes);
      } else {
        // All types available
        setAvailableTypes(allTypes);
      }

    } catch (err) {
      console.error('Error checking available types:', err);
      // Fallback to basic types if API fails
      setAvailableTypes([
        'Consultation',
        'Follow-up',
        'Check-up'
      ]);
    } finally {
      setLoadingTypes(false);
    }
  };

  // Handle date/time change to update available types
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.patientId || !formData.doctorId || !formData.appointmentDate || 
        !formData.appointmentTime || !formData.type) {
      alert('Please fill in all required fields');
      return;
    }

    // Check if types are still loading
    if (loadingTypes) {
      alert('Please wait for appointment types to load');
      return;
    }

    try {
      const appointmentData = {
        ...formData,
        appointmentDateTime: `${formData.appointmentDate} ${formData.appointmentTime}`,
      };

      console.log('Creating appointment:', appointmentData);
      
      const response = await appointmentService.createAppointment(appointmentData);
      
      if (response) {
        alert('Appointment scheduled successfully!');
        setShowForm(false);
        
        // Reset form
        setFormData({
          patientId: '',
          doctorId: '',
          appointmentDate: '',
          appointmentTime: '',
          type: '',
          status: 'Scheduled',
          reason: '',
          notes: ''
        });
        setAvailableTypes([]);
        
        // Reload appointments
        loadInitialData();
        loadMonthAppointments();
      }
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      alert('Failed to schedule appointment. Please try again.');
    }
  };

  const handleDateTimeChange = (field, value) => {
    const updatedFormData = { ...formData, [field]: value };
    setFormData(updatedFormData);

    // Clear type selection when date/time changes
    if (field === 'appointmentDate' || field === 'appointmentTime') {
      setFormData(prev => ({ ...prev, type: '' }));
      
      // Load available types if both date and time are selected
      if (updatedFormData.appointmentDate && updatedFormData.appointmentTime) {
        loadAvailableTypes(updatedFormData.appointmentDate, updatedFormData.appointmentTime, updatedFormData.doctorId);
      } else {
        setAvailableTypes([]);
      }
    }
  };

  // Refresh data function
  const handleRefresh = async () => {
    await loadInitialData();
    await loadPatients();
    await loadDoctors();
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
      return user.role || 'Doctor';
    } catch {
      return 'Doctor';
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
    const dateString = date.toISOString().split('T')[0];
    return appointments.some(apt => apt.appointmentDate === dateString);
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${period}`;
    } catch {
      return timeString;
    }
  };

  const getPatientName = (patientId) => {
    return `Patient ${patientId}`;
  };

  const handleDayClick = (date) => {
    if (!date) return;
    
    // Set the selected date and show form for new appointment
    setSelectedDate(date);
    setFormData({
      ...formData,
      appointmentDate: date.toISOString().split('T')[0]
    });
    setShowForm(true);
  };

  // Handle form submission for creating/updating appointments
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const appointmentData = {
        patient_id: formData.patientId,
        doctor_id: formData.doctorId,
        appointment_date: formData.appointmentDate,
        appointment_time: formData.appointmentTime,
        type: formData.type,
        notes: formData.notes,
        status: formData.status
      };

      if (editingAppointment) {
        // Update existing appointment
        await appointmentService.updateAppointment(editingAppointment.id, appointmentData);
        setSuccess('Appointment updated successfully!');
      } else {
        // Create new appointment
        await appointmentService.createAppointment(appointmentData);
        setSuccess('Appointment scheduled successfully!');
      }

      // Reset form and close modal
      setShowForm(false);
      setEditingAppointment(null);
      setAvailableTypes([]);
      setFormData({
        patientId: '',
        doctorId: '',
        appointmentDate: '',
        appointmentTime: '',
        type: '',
        notes: '',
        status: 'Scheduled'
      });

      // Reload data
      await loadInitialData();
      
    } catch (err) {
      console.error('Error saving appointment:', err);
      setError(`Failed to save appointment: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle appointment deletion
  const handleDelete = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) {
      return;
    }

    setLoading(true);
    try {
      await appointmentService.deleteAppointment(appointmentId);
      setSuccess('Appointment deleted successfully!');
      await loadInitialData(); // Reload data
    } catch (err) {
      console.error('Error deleting appointment:', err);
      setError(`Failed to delete appointment: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle appointment editing
  const handleEdit = (appointment) => {
    setEditingAppointment(appointment);
    setFormData({
      patientId: appointment.patient_id || '',
      doctorId: appointment.doctor_id || '',
      appointmentDate: appointment.appointmentDate || appointment.appointment_date || '',
      appointmentTime: appointment.appointmentTime || appointment.appointment_time || '',
      type: appointment.type || 'Consultation',
      notes: appointment.notes || '',
      status: appointment.status || 'Scheduled'
    });
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="appointment-manager">
        <LoadingSpinnerDoc message="Loading appointment management..." />
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
          Appointments
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
          <button className="action-btn schedule" onClick={() => setShowForm(true)}>
            <i className="bi bi-plus-lg me-2"></i>
            Schedule Appointment
          </button>
          <button className="action-btn refresh" onClick={loadInitialData}>
            <i className="bi bi-arrow-clockwise me-2"></i>
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Appointments Tab Content */}
      {activeTab === 'appointments' && (
        <div className="appointments-comprehensive">
          <div className="all-appointments">
            <div className="management-header">
              <h3>Appointment Management</h3>
              <div className="header-right">
                {todayAppointments.length > cardsPerPage && (
                  <div className="header-pagination">
                    <button 
                      className="pagination-btn" 
                      onClick={goToPrevPage}
                      disabled={currentPage === 0}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>
                    
                    <span className="pagination-numbers">
                      {Array.from({ length: getTotalPages() }, (_, i) => (
                        <button
                          key={i}
                          className={`page-number ${currentPage === i ? 'active' : ''}`}
                          onClick={() => setCurrentPage(i)}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </span>
                    
                    <button 
                      className="pagination-btn" 
                      onClick={goToNextPage}
                      disabled={currentPage >= getTotalPages() - 1}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </div>
                )}
                <span className="current-date">Doctor Portal</span>
              </div>
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
                      <div className="scheduled-by">
                        <span className={`scheduled-by-badge scheduled-by-${appointment.scheduledBy}`}>
                          {appointment.scheduledBy === 'admin' ? 'Admin' : 'Doctor'}
                        </span>
                      </div>
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
                          <th>Scheduled By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.filter(appointment =>
                          (appointment.patient && appointment.patient.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (appointment.type && appointment.type.toLowerCase().includes(searchTerm.toLowerCase()))
                        ).map((appointment) => (
                          <tr key={appointment.id}>
                            <td>{appointment.patient}</td>
                            <td>{appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString() : 'Today'}</td>
                            <td>{appointment.appointmentTime ? formatTime(appointment.appointmentTime) : appointment.time}</td>
                            <td>{appointment.type || 'Consultation'}</td>
                            <td>
                              <span className={`status-indicator ${appointment.status.toLowerCase().replace(' ', '-')}`}>
                                {appointment.status}
                              </span>
                            </td>
                            <td>
                              <span className={`scheduled-by-badge scheduled-by-${appointment.scheduledBy}`}>
                                {appointment.scheduledBy === 'admin' ? 'Admin' : 'Doctor'}
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
                          
                          let hasAppt = hasAppointment(day.date);
                          
                          return (
                            <div
                              key={index}
                              className={`calendar-day ${isToday(day.date) ? 'today' : ''} ${!day.isCurrentMonth ? 'other-month' : ''} ${hasAppt ? 'has-appointments' : ''}`}
                              onClick={() => day.isCurrentMonth && day.date && handleDayClick(day.date)}
                            >
                              <span>{day.date.getDate()}</span>
                              {hasAppt && (
                                <div className="appointment-indicator">
                                  <i className="bi bi-pin-angle-fill appointment-pin"></i>
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

          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Scheduled By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.filter(appointment => 
                  ['Completed', 'Cancelled'].includes(appointment.status)
                ).map((appointment) => (
                  <tr key={appointment.id}>
                    <td>
                      <div className="patient-info">
                        <div className="patient-name">{appointment.patient}</div>
                        <span className="id">PT-{String(appointment.id).padStart(4, '0')}</span>
                      </div>
                    </td>
                    <td>{appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString() : 'Today'}</td>
                    <td>{appointment.appointmentTime ? formatTime(appointment.appointmentTime) : appointment.time}</td>
                    <td>
                      <span className="type-badge">{appointment.type}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${appointment.status.toLowerCase().replace(' ', '-')}`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td>
                      <span className={`scheduled-by-badge scheduled-by-${appointment.scheduledBy}`}>
                        {appointment.scheduledBy === 'admin' ? 'Admin' : 'Doctor'}
                      </span>
                    </td>
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
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h3>{editingAppointment ? 'Edit Appointment' : 'Schedule New Appointment'}</h3>
              <button 
                className="close-btn" 
                onClick={() => {
                  setShowForm(false);
                  setEditingAppointment(null);
                }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleScheduleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Patient *</label>
                    <select 
                      className="form-control"
                      value={formData.patientId}
                      onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                      required
                    >
                      <option value="">
                        {loadingPatients ? 'Loading patients...' : 'Select Patient'}
                      </option>
                      {patients.map(patient => (
                        <option key={patient.id} value={patient.id}>
                          {`${patient.firstName} ${patient.lastName}`}
                          {patient.familyCode && ` (Family: ${patient.familyCode})`}
                        </option>
                      ))}
                    </select>
                    {loadingPatients && <small className="text-muted">Loading patients from database...</small>}
                  </div>
                  
                  <div className="form-group">
                    <label>Doctor *</label>
                    <select 
                      className="form-control"
                      value={formData.doctorId}
                      onChange={(e) => {
                        setFormData({...formData, doctorId: e.target.value});
                        // Reload available types if date/time are selected
                        if (formData.appointmentDate && formData.appointmentTime) {
                          loadAvailableTypes(formData.appointmentDate, formData.appointmentTime, e.target.value);
                        }
                      }}
                      required
                    >
                      <option value="">
                        {loadingDoctors ? 'Loading doctors...' : 'Select Doctor'}
                      </option>
                      {doctors.map(doctor => (
                        <option key={doctor.id} value={doctor.id}>
                          Dr. {`${doctor.firstName} ${doctor.lastName}`}
                          {doctor.position && ` - ${doctor.position}`}
                        </option>
                      ))}
                    </select>
                    {loadingDoctors && <small className="text-muted">Loading doctors from database...</small>}
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Date *</label>
                    <input 
                      type="date" 
                      className="form-control"
                      value={formData.appointmentDate}
                      onChange={(e) => handleDateTimeChange('appointmentDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]} // Prevent past dates
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Time *</label>
                    <input 
                      type="time" 
                      className="form-control"
                      value={formData.appointmentTime}
                      onChange={(e) => handleDateTimeChange('appointmentTime', e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Appointment Type *</label>
                    <select 
                      className="form-control"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      disabled={!formData.appointmentDate || !formData.appointmentTime || loadingTypes}
                      required
                    >
                      <option value="">
                        {!formData.appointmentDate || !formData.appointmentTime 
                          ? 'Please select date and time first'
                          : loadingTypes 
                          ? 'Checking availability...'
                          : availableTypes.length === 0
                          ? 'No available types for this time'
                          : 'Select Appointment Type'
                        }
                      </option>
                      {availableTypes.map(type => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    {loadingTypes && <small className="text-muted">Checking available appointment types...</small>}
                    {!loadingTypes && formData.appointmentDate && formData.appointmentTime && availableTypes.length === 0 && (
                      <small className="text-warning">This time slot may have conflicts. Please try a different time.</small>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label>Status</label>
                    <select 
                      className="form-control"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Notes</label>
                  <textarea 
                    className="form-control"
                    rows="3"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  ></textarea>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowForm(false);
                      setEditingAppointment(null);
                      // Reset form data
                      setFormData({
                        patientId: '',
                        doctorId: '',
                        appointmentDate: '',
                        appointmentTime: '',
                        type: '',
                        status: 'Scheduled',
                        reason: '',
                        notes: ''
                      });
                      setAvailableTypes([]);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                  >
                    {editingAppointment ? 'Update Appointment' : 'Schedule Appointment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
