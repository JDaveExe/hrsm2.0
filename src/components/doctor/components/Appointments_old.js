import React, { useState, useEffect } from 'react';
import appointmentService from '../../../services/appointmentService';
import patientService from '../../../services/patientService';
import userService from '../../../services/userService';
import '../styles/Appointments.css';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // Mock data for demonstration
  const mockTodayAppointments = [
    {
      id: 1,
      time: '09:30 AM',
      duration: '30min',
      patient: 'Maria Santos',
      type: 'Regular Checkup',
      doctor: 'Dr. Santos',
      status: 'SCHEDULED',
      statusColor: '#007bff',
      scheduledBy: 'admin', // Added indicator
      scheduledByUser: 'admin@brgymaybunga.health'
    },
    {
      id: 2,
      time: '10:15 AM',
      duration: '45min',
      patient: 'Carlos Mendoza',
      type: 'Follow-up',
      doctor: 'Dr. Martinez',
      status: 'IN PROGRESS',
      statusColor: '#ffc107',
      scheduledBy: 'doctor', // Added indicator
      scheduledByUser: 'doctor@brgymaybunga.health'
    },
    {
      id: 3,
      time: '11:45 AM',
      duration: '30min',
      patient: 'Ana Reyes',
      type: 'Medical Certificate',
      doctor: 'Dr. Santos',
      status: 'SCHEDULED',
      statusColor: '#007bff',
      scheduledBy: 'doctor', // Added indicator
      scheduledByUser: 'doctor@brgymaybunga.health'
    }
  ];

  const mockAllAppointments = [
    {
      id: 1,
      patient: 'Maria Santos',
      date: 'Aug 4, 2025',
      time: '09:30 AM',
      type: 'Regular Checkup',
      status: 'SCHEDULED',
      statusColor: '#007bff',
      scheduledBy: 'admin',
      scheduledByUser: 'admin@brgymaybunga.health'
    },
    {
      id: 2,
      patient: 'Carlos Mendoza',
      date: 'Aug 4, 2025',
      time: '10:15 AM',
      type: 'Follow-up',
      status: 'IN PROGRESS',
      statusColor: '#ffc107',
      scheduledBy: 'doctor',
      scheduledByUser: 'doctor@brgymaybunga.health'
    },
    {
      id: 3,
      patient: 'Ana Reyes',
      date: 'Aug 4, 2025',
      time: '11:45 AM',
      type: 'Medical Certificate',
      status: 'SCHEDULED',
      statusColor: '#007bff',
      scheduledBy: 'doctor',
      scheduledByUser: 'doctor@brgymaybunga.health'
    }
  ];

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
    loadInitialData();
    getCurrentUser();
  }, []);

  const getCurrentUser = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setCurrentUser(user);
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const loadInitialData = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (!token || !user) {
        setError('Authentication required. Please login to continue.');
        return;
      }

      // Try to load real data, fallback to mock data
      try {
        const [appointmentsData, patientsData, doctorsData] = await Promise.all([
          appointmentService.getAppointments(),
          patientService.getAllPatients(),
          userService.getDoctors()
        ]);

        setAppointments(appointmentsData || []);
        setPatients(patientsData || []);
        setDoctors(doctorsData || []);
        
        // Filter today's appointments
        const today = new Date().toISOString().split('T')[0];
        const todayAppts = (appointmentsData || []).filter(apt => 
          apt.appointmentDate && apt.appointmentDate.split('T')[0] === today
        );
        setTodayAppointments(todayAppts);

      } catch (apiError) {
        console.warn('API not available, using mock data:', apiError);
        // Use mock data
        setAppointments(mockAllAppointments);
        setTodayAppointments(mockTodayAppointments);
        setPatients([
          { id: 1, name: 'Maria Santos' },
          { id: 2, name: 'Carlos Mendoza' },
          { id: 3, name: 'Ana Reyes' }
        ]);
        setDoctors([
          { id: 1, name: 'Dr. Santos' },
          { id: 2, name: 'Dr. Martinez' }
        ]);
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
      const appointmentData = {
        ...formData,
        scheduledBy: currentUser?.role || 'doctor',
        scheduledByUser: currentUser?.username || currentUser?.email || 'doctor@brgymaybunga.health'
      };

      if (editingAppointment) {
        // Update appointment
        await appointmentService.updateAppointment(editingAppointment.id, appointmentData);
        setSuccess('Appointment updated successfully');
        loadInitialData();
      } else {
        // Create new appointment
        await appointmentService.createAppointment(appointmentData);
        setSuccess('Appointment scheduled successfully');
        loadInitialData();
      }

      resetForm();
    } catch (err) {
      setError('Failed to save appointment: ' + err.message);
    }
  };

  const resetForm = () => {
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
    setEditingAppointment(null);
    setShowForm(false);
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

  // Filter appointments based on search term
  const filteredAppointments = appointments.filter(appointment =>
    appointment.patient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calendar helper functions
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
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    // Next month days
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    return days;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const hasAppointment = (date) => {
    return appointments.some(apt => {
      const aptDate = new Date(apt.date || apt.appointmentDate);
      return aptDate.toDateString() === date.toDateString();
    });
  };

  const getScheduledByBadge = (appointment) => {
    const scheduledBy = appointment.scheduledBy;
    const badgeClass = scheduledBy === 'admin' ? 'scheduled-by-admin' : 'scheduled-by-doctor';
    const icon = scheduledBy === 'admin' ? 'bi-shield-check' : 'bi-person-check';
    const text = scheduledBy === 'admin' ? 'Admin' : 'Doctor';
    
    return (
      <span className={`scheduled-by-badge ${badgeClass}`} title={`Scheduled by: ${appointment.scheduledByUser || text}`}>
        <i className={`bi ${icon} me-1`}></i>
        {text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="appointment-manager">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="appointment-manager">
      {/* Header */}
      <div className="management-header">
        <h2>
          <i className="bi bi-calendar-check me-2"></i>
          Appointment Management
          <span className="user-role-badge ms-2">Doctor Portal</span>
        </h2>
        
        <div className="tab-actions">
          <input
            type="text"
            className="search-input"
            placeholder="Search appointments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            className="btn btn-primary" 
            onClick={() => setShowForm(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Schedule Appointment
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={loadInitialData}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Refresh
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <i className="bi bi-list-ul me-2"></i>
          All Appointments
        </button>
        <button 
          className={`tab ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <i className="bi bi-calendar3 me-2"></i>
          Calendar View
        </button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-tabs">
          {activeTab === 'all' && (
            <button className="content-tab active">All Appointments</button>
          )}
          {activeTab === 'calendar' && (
            <button className="content-tab active">Calendar View</button>
          )}
        </div>

        <div className="tab-content">
          {/* All Appointments Table */}
          {activeTab === 'all' && (
            <div className="table-container">
              <table className="appointments-grid-table">
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
                  {filteredAppointments.map(appointment => (
                    <tr key={appointment.id}>
                      <td>{appointment.patient}</td>
                      <td>{appointment.date}</td>
                      <td>{appointment.time}</td>
                      <td>{appointment.type}</td>
                      <td>
                        <span 
                          className={`status-badge status-${appointment.status.toLowerCase().replace(' ', '-')}`}
                        >
                          {appointment.status}
                        </span>
                      </td>
                      <td>
                        {getScheduledByBadge(appointment)}
                      </td>
                      <td>
                        <button 
                          className="btn btn-sm btn-secondary" 
                          onClick={() => handleEdit(appointment)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-sm btn-danger" 
                          onClick={() => handleDelete(appointment.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Calendar View */}
          {activeTab === 'calendar' && (
            <div className="calendar-view">
              <div className="calendar-header">
                <button 
                  className="nav-btn"
                  onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
                >
                  ‹
                </button>
                <h3>
                  {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <button 
                  className="nav-btn"
                  onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
                >
                  ›
                </button>
              </div>

              <div className="calendar-grid">
                <div className="calendar-weekdays">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="weekday">{day}</div>
                  ))}
                </div>
                <div className="calendar-days">
                  {getDaysInMonth(selectedDate).map((day, index) => (
                    <div 
                      key={index}
                      className={`calendar-day ${isToday(day.date) ? 'today' : ''} ${hasAppointment(day.date) ? 'has-appointment' : ''} ${!day.isCurrentMonth ? 'other-month' : ''}`}
                      onClick={() => day.isCurrentMonth && setShowForm(true)}
                    >
                      {day.date.getDate()}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Schedule Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingAppointment ? 'Edit Appointment' : 'Schedule New Appointment'}</h3>
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
                        {patient.name}
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
                        {doctor.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="appointmentDate">Date *</label>
                  <input 
                    type="date" 
                    id="appointmentDate"
                    value={formData.appointmentDate} 
                    onChange={(e) => setFormData({...formData, appointmentDate: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="appointmentTime">Time *</label>
                  <input 
                    type="time" 
                    id="appointmentTime"
                    value={formData.appointmentTime} 
                    onChange={(e) => setFormData({...formData, appointmentTime: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="type">Type *</label>
                  <select 
                    id="type"
                    value={formData.type} 
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    required
                  >
                    {appointmentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="status">Status *</label>
                  <select 
                    id="status"
                    value={formData.status} 
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    required
                  >
                    {appointmentStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="duration">Duration (minutes)</label>
                  <input 
                    type="number" 
                    id="duration"
                    value={formData.duration} 
                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                    min="15"
                    max="240"
                    step="15"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="priority">Priority</label>
                  <select 
                    id="priority"
                    value={formData.priority} 
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  >
                    {priorityLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea 
                  id="notes"
                  value={formData.notes} 
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="3"
                  placeholder="Additional notes or comments..."
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingAppointment ? 'Update Appointment' : 'Schedule Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
