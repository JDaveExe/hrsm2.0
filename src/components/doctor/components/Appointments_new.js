import React, { useState, useEffect } from 'react';
import LoadingSpinnerDoc from './LoadingSpinnerDoc';
import '../styles/Appointments.css';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
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
    type: 'Consultation',
    notes: '',
    status: 'Scheduled'
  });

  // Mock data for fallback
  const mockTodayAppointments = [
    {
      id: 1,
      patient: 'John Doe',
      time: '09:00 AM',
      duration: '30 min',
      type: 'Consultation',
      doctor: 'Dr. Smith',
      status: 'Scheduled',
      scheduledBy: 'admin'
    },
    {
      id: 2,
      patient: 'Jane Smith',
      time: '10:30 AM',
      duration: '45 min',
      type: 'Follow-up',
      doctor: 'Dr. Johnson',
      status: 'Confirmed',
      scheduledBy: 'doctor'
    },
    {
      id: 3,
      patient: 'Bob Wilson',
      time: '02:00 PM',
      duration: '30 min',
      type: 'Check-up',
      doctor: 'Dr. Brown',
      status: 'Scheduled',
      scheduledBy: 'admin'
    },
    {
      id: 4,
      patient: 'Alice Johnson',
      time: '03:30 PM',
      duration: '60 min',
      type: 'Consultation',
      doctor: 'Dr. Davis',
      status: 'In Progress',
      scheduledBy: 'doctor'
    },
    {
      id: 5,
      patient: 'Charlie Brown',
      time: '04:00 PM',
      duration: '30 min',
      type: 'Check-up',
      doctor: 'Dr. Martinez',
      status: 'Scheduled',
      scheduledBy: 'admin'
    }
  ];

  const mockAllAppointments = [
    ...mockTodayAppointments,
    {
      id: 6,
      patient: 'Diana Prince',
      appointmentDate: '2025-09-01',
      appointmentTime: '11:00',
      type: 'Follow-up',
      status: 'Scheduled',
      scheduledBy: 'doctor'
    },
    {
      id: 7,
      patient: 'Bruce Wayne',
      appointmentDate: '2025-09-02',
      appointmentTime: '14:30',
      type: 'Check-up',
      status: 'Confirmed',
      scheduledBy: 'admin'
    }
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Use mock data as fallback
      setTodayAppointments(mockTodayAppointments);
      setAppointments(mockAllAppointments);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load appointment data. Using mock data.');
      // Still set mock data even on error
      setTodayAppointments(mockTodayAppointments);
      setAppointments(mockAllAppointments);
    } finally {
      setLoading(false);
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
    // Mock appointment check
    const day = date.getDate();
    return [4, 8, 15, 22, 29].includes(day) && date.getMonth() === new Date().getMonth();
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
    
    // Mock handling - in real app would fetch appointments for this date
    setSelectedDate(date);
    setShowForm(true);
  };

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
              <span className="current-date">Doctor Portal</span>
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
              <form>
                <div className="form-row">
                  <div className="form-group">
                    <label>Patient</label>
                    <select 
                      className="form-control"
                      value={formData.patientId}
                      onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                    >
                      <option value="">Select Patient</option>
                      <option value="1">John Doe</option>
                      <option value="2">Jane Smith</option>
                      <option value="3">Bob Wilson</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Doctor</label>
                    <select 
                      className="form-control"
                      value={formData.doctorId}
                      onChange={(e) => setFormData({...formData, doctorId: e.target.value})}
                    >
                      <option value="">Select Doctor</option>
                      <option value="1">Dr. Smith</option>
                      <option value="2">Dr. Johnson</option>
                      <option value="3">Dr. Brown</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Date</label>
                    <input 
                      type="date" 
                      className="form-control"
                      value={formData.appointmentDate}
                      onChange={(e) => setFormData({...formData, appointmentDate: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Time</label>
                    <input 
                      type="time" 
                      className="form-control"
                      value={formData.appointmentTime}
                      onChange={(e) => setFormData({...formData, appointmentTime: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Type</label>
                    <select 
                      className="form-control"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="Consultation">Consultation</option>
                      <option value="Follow-up">Follow-up</option>
                      <option value="Check-up">Check-up</option>
                      <option value="Vaccination">Vaccination</option>
                    </select>
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
