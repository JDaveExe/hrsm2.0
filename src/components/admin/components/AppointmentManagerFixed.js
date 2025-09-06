import React, { useState, useEffect } from 'react';
import appointmentService from '../../../services/appointmentService';
import patientService from '../../../services/patientService';
import userService from '../../../services/userService';
import './AppointmentManager.css';

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
  const [activeTab, setActiveTab] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');

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
      statusColor: '#007bff'
    },
    {
      id: 2,
      time: '10:15 AM',
      duration: '45min',
      patient: 'Carlos Mendoza',
      type: 'Follow-up',
      doctor: 'Dr. Martinez',
      status: 'IN PROGRESS',
      statusColor: '#ffc107'
    },
    {
      id: 3,
      time: '11:45 AM',
      duration: '30min',
      patient: 'Ana Reyes',
      type: 'Medical Certificate',
      doctor: 'Dr. Santos',
      status: 'SCHEDULED',
      statusColor: '#007bff'
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
      statusColor: '#007bff'
    },
    {
      id: 2,
      patient: 'Carlos Mendoza',
      date: 'Aug 4, 2025',
      time: '10:15 AM',
      type: 'Follow-up',
      status: 'IN PROGRESS',
      statusColor: '#ffc107'
    },
    {
      id: 3,
      patient: 'Ana Reyes',
      date: 'Aug 4, 2025',
      time: '11:45 AM',
      type: 'Medical Certificate',
      status: 'SCHEDULED',
      statusColor: '#007bff'
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
  }, []);

  const loadInitialData = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (!token || !user) {
        setError('Authentication required. Please log in to access appointment management.');
        return;
      }

      try {
        const userData = JSON.parse(user);
        if (!userData || (userData.role !== 'admin' && userData.role !== 'doctor')) {
          setError('Access denied. Admin or doctor privileges required.');
          return;
        }
      } catch (parseError) {
        setError('Invalid session data. Please log in again.');
        return;
      }

      // Try to load data gracefully
      const results = await Promise.allSettled([
        appointmentService.getAppointments().catch(() => []),
        patientService.getPatients().catch(() => []),
        userService.getUsers().catch(() => [])
      ]);

      const [appointmentsResult, patientsResult, usersResult] = results;

      setAppointments(appointmentsResult.status === 'fulfilled' ? (appointmentsResult.value || []) : []);
      setPatients(patientsResult.status === 'fulfilled' ? (patientsResult.value || []) : []);
      
      const users = usersResult.status === 'fulfilled' ? (usersResult.value || []) : [];
      setDoctors(users.filter(user => user.role === 'doctor' || user.role === 'admin'));
      
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
      if (editingAppointment) {
        await appointmentService.updateAppointment(editingAppointment.id, formData);
        setSuccess('Appointment updated successfully');
      } else {
        await appointmentService.createAppointment(formData);
        setSuccess('Appointment created successfully');
      }

      resetForm();
      loadInitialData();
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
    // Mock appointment check
    const day = date.getDate();
    return [4, 8, 15, 22, 29].includes(day) && date.getMonth() === new Date().getMonth();
  };

  const filteredAppointments = mockAllAppointments.filter(appointment =>
    appointment.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="appointment-manager">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading appointment management...</p>
        </div>
      </div>
    );
  }

  if (error && (error.includes('Authentication required') || error.includes('Access denied'))) {
    return (
      <div className="appointment-manager">
        <div className="loading-spinner">
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
      {/* Header */}
      <div className="appointment-header">
        <div className="header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-text">HRSM</span>
            <span className="breadcrumb-separator">{'>'}</span>
            <span className="breadcrumb-current">Appointment Scheduling</span>
          </div>
          <h1>Appointment Scheduling</h1>
        </div>
        <div className="header-right">
          <span className="current-date">{getCurrentDate()}</span>
          <span className="user-role">{getCurrentUser()}</span>
        </div>
      </div>

      {/* Action Tabs */}
      <div className="action-tabs">
        <button 
          className={`tab-btn ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          Today
        </button>
        <button 
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Appointments
        </button>
        <button 
          className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          Calendar
        </button>
        
        <div className="tab-actions">
          {activeTab === 'all' && (
            <input
              type="text"
              className="search-input"
              placeholder="Search appointments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          )}
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + New Appointment
          </button>
          <button className="btn btn-secondary">
            Export
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Today's Schedule */}
      {activeTab === 'today' && (
        <div className="todays-schedule">
          <div className="schedule-header">
            <h2>Today's Schedule</h2>
          </div>
          <div className="schedule-grid">
            {mockTodayAppointments.map(appointment => (
              <div key={appointment.id} className="appointment-card">
                <div className="appointment-time">
                  <span className="time">{appointment.time}</span>
                  <span className="duration">{appointment.duration}</span>
                </div>
                <div className="appointment-details">
                  <h4>{appointment.patient}</h4>
                  <p>Type: {appointment.type}</p>
                  <p>Doctor: {appointment.doctor}</p>
                </div>
                <div className="appointment-status">
                  <span 
                    className={`status-badge status-${appointment.status.toLowerCase().replace(' ', '-')}`}
                  >
                    {appointment.status}
                  </span>
                </div>
                <div className="appointment-actions">
                  <button className="action-btn" title="View">👁</button>
                  <button className="action-btn" title="Edit">✏️</button>
                  <button className="action-btn" title="Call">📞</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                        <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(appointment)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(appointment.id)}>
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
              <h3>{editingAppointment ? 'Edit Appointment' : 'Quick Schedule'}</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="appointment-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Patient</label>
                  <select 
                    value={formData.patientId} 
                    onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                    required
                  >
                    <option value="">Select Patient</option>
                    <option value="1">Maria Santos</option>
                    <option value="2">Carlos Mendoza</option>
                    <option value="3">Ana Reyes</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Doctor</label>
                  <select 
                    value={formData.doctorId} 
                    onChange={(e) => setFormData({...formData, doctorId: e.target.value})}
                    required
                  >
                    <option value="">Select Doctor</option>
                    <option value="1">Dr. Santos</option>
                    <option value="2">Dr. Martinez</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={formData.appointmentDate}
                    onChange={(e) => setFormData({...formData, appointmentDate: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Time</label>
                  <input
                    type="time"
                    value={formData.appointmentTime}
                    onChange={(e) => setFormData({...formData, appointmentTime: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                    min="15"
                    max="240"
                    step="15"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select 
                    value={formData.type} 
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    {appointmentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select 
                    value={formData.status} 
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    {appointmentStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select 
                    value={formData.priority} 
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  >
                    {priorityLevels.map(priority => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Reason for Visit</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="3"
                  placeholder="Reason for appointment..."
                />
              </div>

              <div className="form-group">
                <label>Symptoms</label>
                <textarea
                  value={formData.symptoms}
                  onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                  rows="2"
                  placeholder="Patient symptoms..."
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

export default AppointmentManager;
