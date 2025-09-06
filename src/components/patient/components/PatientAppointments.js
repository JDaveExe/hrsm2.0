import React, { useState, useEffect, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import appointmentService from '../../../services/appointmentService';
import LoadingSpinnerPatient from './LoadingSpinnerPatient';
import '../styles/PatientAppointments.css';

const PatientAppointments = memo(({ user, currentDateTime, isLoading: parentLoading, onRefresh }) => {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationTimer, setConfirmationTimer] = useState(5);
  const [isServiceDisabled, setIsServiceDisabled] = useState(true);
  const [availableServices, setAvailableServices] = useState([]);
  const [lastBookingTime, setLastBookingTime] = useState(null);
  const [todayBookingCount, setTodayBookingCount] = useState(0);

  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    date: '',
    time: '',
    serviceType: '',
    symptoms: '',
    notes: ''
  });

  // Check if date is weekend (Saturday or Sunday)
  const isWeekend = (date) => {
    const day = new Date(date).getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  };

  // Available service types based on date/time
  const getAvailableServices = (date, time) => {
    if (!date || !time || isWeekend(date)) return [];
    
    const allServices = [
      'General Consultation',
      'Health Checkup',
      'Follow-up Visit',
      'Specialist Consultation',
      'Emergency Consultation'
    ];
    
    // You can add more logic here based on time slots, doctor availability, etc.
    return allServices;
  };

  // Load appointments
  const loadAppointments = useCallback(async () => {
    if (!user?.patientId) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await appointmentService.getAppointments();
      const userAppointments = response.filter(
        apt => apt.patientId === user.patientId
      );
      setAppointments(userAppointments);
      
      // Check booking restrictions after loading appointments
      setTimeout(() => {
        checkBookingRestrictions();
      }, 100);
      
    } catch (err) {
      console.error('Error loading appointments:', err);
      setError('Failed to load appointments. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.patientId]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments, refreshTrigger]);

  // Check service availability based on date and time
  const checkServiceAvailability = useCallback(async (date, time) => {
    if (!date || !time) {
      setAvailableServices([]);
      return;
    }

    try {
      // Simulate checking available services for the selected date/time
      // In a real application, this would make an API call
      const allServices = [
        'General Consultation',
        'Dental Checkup', 
        'Vaccination',
        'Health Screening',
        'Follow-up'
      ];

      // Mock logic: Different services available at different times
      const hour = parseInt(time.split(':')[0]);
      let available = [];

      if (hour >= 8 && hour < 12) {
        available = allServices; // All services in morning
      } else if (hour >= 14 && hour < 17) {
        available = allServices.slice(0, 3); // Limited services in afternoon
      } else {
        available = ['General Consultation']; // Only emergency consultation outside hours
      }

      setAvailableServices(available);
    } catch (err) {
      console.error('Error checking service availability:', err);
      setAvailableServices([]);
    }
  }, []);

  // Check booking restrictions
  const checkBookingRestrictions = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayAppointmentsCount = appointments.filter(apt => 
      apt.date === today && apt.status !== 'cancelled'
    ).length;
    
    setTodayBookingCount(todayAppointmentsCount);

    // Check if user has booked within last 30 minutes
    const lastBooking = appointments
      .filter(apt => apt.patientId === user?.patientId)
      .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))[0];
    
    if (lastBooking) {
      const lastBookingTime = new Date(lastBooking.createdAt || lastBooking.date);
      const timeDiff = (new Date() - lastBookingTime) / (1000 * 60); // difference in minutes
      
      if (timeDiff < 30) {
        setLastBookingTime(lastBookingTime);
      } else {
        setLastBookingTime(null);
      }
    }
  }, [appointments, user?.patientId]);

  // Handle form changes
  const handleFormChange = useCallback((field, value) => {
    setBookingForm(prev => {
      const updated = { ...prev, [field]: value };
      
      // Enable service dropdown only if date and time are filled
      const hasDateTime = updated.date && updated.time;
      setIsServiceDisabled(!hasDateTime);
      
      // Check service availability when date or time changes
      if (field === 'date' || field === 'time') {
        checkServiceAvailability(updated.date, updated.time);
      }
      
      return updated;
    });
  }, [checkServiceAvailability]);

  // Run booking restrictions check when appointments change
  useEffect(() => {
    checkBookingRestrictions();
  }, [checkBookingRestrictions]);

  // Confirmation timer
  useEffect(() => {
    let timer;
    if (showConfirmation && confirmationTimer > 0) {
      timer = setTimeout(() => {
        setConfirmationTimer(prev => prev - 1);
      }, 1000);
    } else if (showConfirmation && confirmationTimer === 0) {
      setShowConfirmation(false);
      setConfirmationTimer(5);
    }
    return () => clearTimeout(timer);
  }, [showConfirmation, confirmationTimer]);

  // Book appointment handler
  const handleBookAppointment = useCallback(async (e) => {
    e.preventDefault();
    if (!user?.patientId) return;

    // Check weekend restriction
    if (bookingForm.date && isWeekend(bookingForm.date)) {
      setError('Appointments are not available on weekends. Please select a weekday.');
      return;
    }

    // Check restrictions
    if (todayBookingCount >= 2) {
      setError('You can only book 2 appointments per day. Please try again tomorrow.');
      return;
    }

    if (lastBookingTime) {
      const remainingMinutes = 30 - Math.floor((new Date() - lastBookingTime) / (1000 * 60));
      setError(`Please wait ${remainingMinutes} more minutes before booking another appointment.`);
      return;
    }

    // Show confirmation dialog
    if (!showConfirmation) {
      setShowConfirmation(true);
      setConfirmationTimer(5);
      return;
    }

    // Proceed with booking after confirmation
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await appointmentService.createAppointment({
        patientId: user.patientId,
        date: bookingForm.date,
        time: bookingForm.time,
        serviceType: bookingForm.serviceType,
        symptoms: bookingForm.symptoms,
        notes: bookingForm.notes
      });

      setSuccess('Appointment booked successfully!');
      setShowBookingModal(false);
      setShowDateModal(false);
      setShowConfirmation(false);
      setConfirmationTimer(5);
      setBookingForm({
        date: '',
        time: '',
        serviceType: '',
        symptoms: '',
        notes: ''
      });
      setIsServiceDisabled(true);
      setAvailableServices([]);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Error booking appointment:', err);
      setError('Failed to book appointment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.patientId, bookingForm, showConfirmation, todayBookingCount, lastBookingTime]);

  // Cancel appointment
  const handleCancelAppointment = useCallback(async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      await appointmentService.updateAppointment(appointmentId, { status: 'cancelled' });
      setSuccess('Appointment cancelled successfully.');
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      setError('Failed to cancel appointment. Please try again.');
    }
  }, []);

  // Filter appointments
  const todaysAppointments = appointments.filter(apt => {
    const today = new Date().toDateString();
    const aptDate = new Date(apt.date).toDateString();
    return aptDate === today;
  });

  const upcomingAppointments = appointments.filter(apt => {
    const today = new Date();
    const aptDate = new Date(apt.date);
    return aptDate > today;
  });

  // Generate calendar for current month
  const generateCalendar = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const hasAppointment = appointments.some(apt => {
        const aptDate = new Date(apt.date);
        return aptDate.toDateString() === currentDate.toDateString();
      });
      
      days.push({
        date: currentDate,
        isCurrentMonth: currentDate.getMonth() === month,
        hasAppointment,
        isToday: currentDate.toDateString() === today.toDateString()
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendar();
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const currentMonth = monthNames[new Date().getMonth()];
  const currentYear = new Date().getFullYear();

  if (isLoading && !appointments.length) {
    return <LoadingSpinnerPatient />;
  }

  return (
    <div className="patient-appointments">
      {/* Alert Messages */}
      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill"></i>
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success" role="alert">
          <i className="bi bi-check-circle-fill"></i>
          {success}
        </div>
      )}

      {/* Page Header with Stats and Actions */}
      <div className="page-header">
        <div className="title-section">
          <h1 className="page-title">
            <i className="bi bi-calendar-heart"></i>
            My Appointments
          </h1>
          <p className="page-subtitle">Manage your healthcare appointments</p>
        </div>
        
        {/* Stats Cards in Header */}
        <div className="header-stats">
          <div className="stat-notification-card stat-today">
            <div className="stat-content">
              <div className="stat-number">{todaysAppointments.length}</div>
              <div className="stat-label">Today</div>
            </div>
          </div>
          
          <div className="stat-notification-card stat-upcoming">
            <div className="stat-content">
              <div className="stat-number">{upcomingAppointments.length}</div>
              <div className="stat-label">Upcoming</div>
            </div>
          </div>
          
          <div className="stat-notification-card stat-total">
            <div className="stat-content">
              <div className="stat-number">{appointments.length}</div>
              <div className="stat-label">Total</div>
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            className="book-appointment-btn"
            onClick={() => setShowBookingModal(true)}
          >
            <i className="bi bi-plus-circle"></i>
            Book Appointment
          </button>
        </div>
      </div>

      {/* Main Content Layout - Side by Side */}
      <div className="main-content-layout">
        
        {/* Left Side - Today's Schedule */}
        <div className="todays-schedule-column">
          <div className="todays-schedule-section">
            <div className="section-header">
              <h2 className="section-title">
                <i className="bi bi-calendar-day"></i>
                Today's Schedule - {new Date().toLocaleDateString()}
              </h2>
            </div>
            
            <div className="appointments-container">
              {todaysAppointments.length > 0 ? (
                <div className="appointments-list">
                  {todaysAppointments.map(appointment => (
                    <div key={appointment.id} className="appointment-card doctor-style">
                      <div className="appointment-time-badge">
                        <i className="bi bi-clock"></i>
                        {appointment.time}
                      </div>
                      <div className="appointment-content">
                        <div className="appointment-header">
                          <h4 className="appointment-type">
                            <i className="bi bi-clipboard-pulse"></i>
                            {appointment.serviceType || 'General Consultation'}
                          </h4>
                          <span className={`status-badge status-${appointment.status?.toLowerCase() || 'scheduled'}`}>
                            {appointment.status || 'Scheduled'}
                          </span>
                        </div>
                        <div className="appointment-details">
                          {appointment.symptoms && (
                            <p className="appointment-symptoms">
                              <i className="bi bi-chat-dots"></i>
                              {appointment.symptoms}
                            </p>
                          )}
                          {appointment.notes && (
                            <p className="appointment-notes">
                              <i className="bi bi-sticky"></i>
                              {appointment.notes}
                            </p>
                          )}
                        </div>
                        <div className="appointment-meta">
                          <span className="appointment-date">
                            <i className="bi bi-calendar"></i>
                            {new Date(appointment.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="appointment-actions">
                        <button className="btn btn-sm btn-outline-primary">
                          <i className="bi bi-eye"></i>
                          View
                        </button>
                        {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleCancelAppointment(appointment.id)}
                          >
                            <i className="bi bi-x-circle"></i>
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-appointments-today">
                  <div className="empty-state">
                    <div className="empty-icon">
                      <i className="bi bi-calendar-x"></i>
                    </div>
                    <h4>No appointments today</h4>
                    <p>You have no scheduled appointments for today.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Calendar */}
        <div className="calendar-column">
          <div className="calendar-section">
            <div className="calendar-container">
              <div className="calendar-header">
                <div className="calendar-nav">
                  <button 
                    className="btn btn-outline-secondary btn-sm nav-btn"
                    onClick={() => {
                      const prevMonth = new Date();
                      prevMonth.setMonth(prevMonth.getMonth() - 1);
                      // Handle month navigation
                    }}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  <h3 className="calendar-title">
                    <i className="bi bi-calendar3"></i>
                    {currentMonth} {currentYear}
                  </h3>
                  <button 
                    className="btn btn-outline-secondary btn-sm nav-btn"
                    onClick={() => {
                      const nextMonth = new Date();
                      nextMonth.setMonth(nextMonth.getMonth() + 1);
                      // Handle month navigation
                    }}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>
              
              <div className="calendar-grid">
                <div className="calendar-weekdays">
                  <div className="calendar-day-name">Sun</div>
                  <div className="calendar-day-name">Mon</div>
                  <div className="calendar-day-name">Tue</div>
                  <div className="calendar-day-name">Wed</div>
                  <div className="calendar-day-name">Thu</div>
                  <div className="calendar-day-name">Fri</div>
                  <div className="calendar-day-name">Sat</div>
                </div>
                <div className="calendar-days">
                  {calendarDays.map((day, index) => (
                    <div
                      key={index}
                      className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${day.isToday ? 'today' : ''} ${day.hasAppointment ? 'has-appointment' : ''} ${isWeekend(day.date) ? 'weekend-disabled' : ''}`}
                      onClick={() => {
                        if (day.isCurrentMonth && day.date >= new Date() && !isWeekend(day.date)) {
                          setSelectedDate(day.date);
                          setShowDateModal(true);
                        }
                      }}
                      style={{
                        cursor: isWeekend(day.date) ? 'not-allowed' : 'pointer',
                        opacity: isWeekend(day.date) ? 0.5 : 1
                      }}
                    >
                      <span className="day-number">{day.date.getDate()}</span>
                      {day.hasAppointment && <div className="appointment-indicator"></div>}
                      {isWeekend(day.date) && (
                        <div className="weekend-indicator">
                          <i className="bi bi-x-circle" style={{ fontSize: '0.8rem', color: '#dc3545' }}></i>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <div className="appointments-section">
          <h2 className="section-title">
            <i className="bi bi-calendar-plus"></i>
            Upcoming Appointments
          </h2>
          <div className="appointments-grid">
            {upcomingAppointments.map(appointment => (
              <div key={appointment.id} className="appointment-card appointment-upcoming">
                <div className="appointment-header">
                  <div className="appointment-type">
                    <i className="bi bi-clipboard-pulse"></i>
                    {appointment.serviceType || 'General Consultation'}
                  </div>
                  <span className={`status-badge status-${appointment.status?.toLowerCase() || 'scheduled'}`}>
                    {appointment.status || 'Scheduled'}
                  </span>
                </div>
                <div className="appointment-details">
                  <div>
                    <i className="bi bi-clock"></i>
                    <span className="appointment-time">{appointment.time}</span>
                  </div>
                  <div>
                    <i className="bi bi-calendar"></i>
                    <span className="appointment-datetime">
                      {new Date(appointment.date).toLocaleDateString()}
                    </span>
                  </div>
                  {appointment.symptoms && (
                    <div>
                      <i className="bi bi-chat-dots"></i>
                      <span className="appointment-symptoms">{appointment.symptoms}</span>
                    </div>
                  )}
                </div>
                <div className="appointment-actions">
                  {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleCancelAppointment(appointment.id)}
                    >
                      <i className="bi bi-x-circle"></i>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="booking-modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="booking-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <i className="bi bi-calendar-plus"></i>
                Book New Appointment
              </h3>
              <button 
                className="close-btn"
                onClick={() => setShowBookingModal(false)}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>
            <form className="booking-form" onSubmit={handleBookAppointment}>
              <div className="form-row">
                <div className="form-group">
                  <label>
                    <i className="bi bi-calendar"></i>
                    Date
                  </label>
                  <input
                    type="date"
                    value={bookingForm.date}
                    onChange={(e) => handleFormChange('date', e.target.value)}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {bookingForm.date && isWeekend(bookingForm.date) && (
                    <div className="form-text text-danger">
                      <i className="bi bi-exclamation-triangle"></i>
                      Appointments are not available on weekends. Please select a weekday.
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>
                    <i className="bi bi-clock"></i>
                    Time
                  </label>
                  <input
                    type="time"
                    value={bookingForm.time}
                    onChange={(e) => handleFormChange('time', e.target.value)}
                    required
                    disabled={bookingForm.date && isWeekend(bookingForm.date)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>
                  <i className="bi bi-clipboard-pulse"></i>
                  Service Type
                </label>
                <select
                  value={bookingForm.serviceType}
                  onChange={(e) => handleFormChange('serviceType', e.target.value)}
                  required
                  disabled={isServiceDisabled}
                >
                  <option value="">
                    {bookingForm.date && isWeekend(bookingForm.date) ? 
                      'Weekends not available' :
                      isServiceDisabled ? 
                      'Please select date and time first' : 
                      'Select Service'}
                  </option>
                  {availableServices.map(service => (
                    <option key={service} value={service}>{service}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>
                  <i className="bi bi-chat-dots"></i>
                  Symptoms (Optional)
                </label>
                <textarea
                  value={bookingForm.symptoms}
                  onChange={(e) => handleFormChange('symptoms', e.target.value)}
                  placeholder="Describe your symptoms or reason for visit..."
                />
              </div>
              <div className="form-group">
                <label>
                  <i className="bi bi-journal-text"></i>
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={bookingForm.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  placeholder="Any additional information..."
                />
              </div>
              
              {/* Booking Restrictions Alert */}
              {(todayBookingCount >= 2 || lastBookingTime) && (
                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle"></i>
                  {todayBookingCount >= 2 ? 
                    'You have reached the daily limit of 2 appointments.' :
                    `Please wait ${30 - Math.floor((new Date() - lastBookingTime) / (1000 * 60))} more minutes before booking again.`
                  }
                </div>
              )}

              {/* Confirmation Dialog */}
              {showConfirmation && (
                <div className="confirmation-dialog">
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle"></i>
                    <strong>Confirm Booking:</strong> You can only book 2 appointments per day. 
                    Confirm in {confirmationTimer} seconds...
                  </div>
                </div>
              )}
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowBookingModal(false);
                    setShowConfirmation(false);
                    setConfirmationTimer(5);
                  }}
                >
                  <i className="bi bi-x"></i>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={
                    isLoading || 
                    (showConfirmation && confirmationTimer > 0) || 
                    todayBookingCount >= 2 || 
                    lastBookingTime ||
                    (bookingForm.date && isWeekend(bookingForm.date)) ||
                    isServiceDisabled
                  }
                >
                  <i className="bi bi-check"></i>
                  {isLoading ? 'Booking...' : 
                   showConfirmation ? `Confirm (${confirmationTimer}s)` : 
                   bookingForm.date && isWeekend(bookingForm.date) ? 'Weekends Not Available' :
                   'Book Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Date Modal for Calendar Clicks */}
      {showDateModal && selectedDate && (
        <div className="booking-modal-overlay" onClick={() => setShowDateModal(false)}>
          <div className="booking-modal booking-modal-calendar" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <i className="bi bi-calendar-plus"></i>
                Schedule for {selectedDate.toLocaleDateString()}
              </h3>
              <button 
                className="close-btn"
                onClick={() => setShowDateModal(false)}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div className="date-modal-content">
              <div className="patient-info">
                <div className="patient-details">
                  <h4>{user?.firstName} {user?.lastName}</h4>
                  <p>Age: {user?.age || 'N/A'} | Gender: {user?.gender || 'N/A'}</p>
                  <p>Patient ID: {user?.patientId} | Family ID: {user?.familyId || 'N/A'}</p>
                </div>
              </div>
              
              {/* Booking Restrictions Info */}
              <div className="appointment-note">
                <div className="alert alert-info">
                  <i className="bi bi-info-circle"></i>
                  <strong>Booking Rules:</strong> Maximum 2 appointments per day. 30-minute wait between bookings. Weekends not available.
                </div>
              </div>

              {/* Booking Restrictions Alert */}
              {(todayBookingCount >= 2 || lastBookingTime) && (
                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle"></i>
                  {todayBookingCount >= 2 ? 
                    'You have reached the daily limit of 2 appointments.' :
                    `Please wait ${30 - Math.floor((new Date() - lastBookingTime) / (1000 * 60))} more minutes before booking again.`
                  }
                </div>
              )}

              {/* Weekend Warning */}
              {selectedDate && isWeekend(selectedDate) && (
                <div className="alert alert-danger">
                  <i className="bi bi-x-circle"></i>
                  <strong>Weekend Selected:</strong> Appointments are not available on weekends. Please select a weekday.
                </div>
              )}

              {/* Confirmation Dialog */}
              {showConfirmation && (
                <div className="confirmation-dialog">
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle"></i>
                    <strong>Confirm Booking:</strong> You can only book 2 appointments per day. 
                    Confirm in {confirmationTimer} seconds...
                  </div>
                </div>
              )}
              
              <form className="booking-form" onSubmit={(e) => {
                e.preventDefault();
                
                // Check restrictions before proceeding
                if (todayBookingCount >= 2) {
                  setError('You can only book 2 appointments per day. Please try again tomorrow.');
                  return;
                }

                if (lastBookingTime) {
                  const remainingMinutes = 30 - Math.floor((new Date() - lastBookingTime) / (1000 * 60));
                  setError(`Please wait ${remainingMinutes} more minutes before booking another appointment.`);
                  return;
                }

                if (selectedDate && isWeekend(selectedDate)) {
                  setError('Appointments are not available on weekends. Please select a weekday.');
                  return;
                }

                // Show confirmation dialog first
                if (!showConfirmation) {
                  setShowConfirmation(true);
                  setConfirmationTimer(5);
                  return;
                }

                // Proceed with booking
                const dateString = selectedDate.toISOString().split('T')[0];
                const updatedForm = {
                  ...bookingForm,
                  date: dateString
                };
                setBookingForm(updatedForm);
                
                // Trigger the booking
                handleBookAppointment({
                  preventDefault: () => {},
                  target: {
                    date: { value: dateString },
                    time: { value: bookingForm.time },
                    serviceType: { value: bookingForm.serviceType },
                    symptoms: { value: bookingForm.symptoms || '' },
                    notes: { value: bookingForm.notes || '' }
                  }
                });
              }}>
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <i className="bi bi-clock"></i>
                      Time
                    </label>
                    <input
                      type="time"
                      value={bookingForm.time}
                      onChange={(e) => handleFormChange('time', e.target.value)}
                      required
                      disabled={selectedDate && isWeekend(selectedDate)}
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      <i className="bi bi-clipboard-pulse"></i>
                      Service Type
                    </label>
                    <select
                      value={bookingForm.serviceType}
                      onChange={(e) => handleFormChange('serviceType', e.target.value)}
                      required
                      disabled={!bookingForm.time || (selectedDate && isWeekend(selectedDate))}
                    >
                      <option value="">
                        {selectedDate && isWeekend(selectedDate) ? 
                          'Weekends not available' :
                          !bookingForm.time ? 
                          'Please select time first' : 
                          'Select Service'}
                      </option>
                      {bookingForm.time && selectedDate && !isWeekend(selectedDate) && 
                        getAvailableServices(selectedDate.toISOString().split('T')[0], bookingForm.time).map(service => (
                          <option key={service} value={service}>{service}</option>
                        ))
                      }
                    </select>
                  </div>
                </div>
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowDateModal(false);
                      setShowConfirmation(false);
                      setConfirmationTimer(5);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={
                      !bookingForm.time || 
                      !bookingForm.serviceType || 
                      (selectedDate && isWeekend(selectedDate)) ||
                      todayBookingCount >= 2 ||
                      lastBookingTime ||
                      isLoading ||
                      (showConfirmation && confirmationTimer > 0)
                    }
                  >
                    <i className="bi bi-calendar-plus"></i>
                    {isLoading ? 'Booking...' : 
                     showConfirmation ? `Confirm (${confirmationTimer}s)` : 
                     selectedDate && isWeekend(selectedDate) ? 'Weekends Not Available' :
                     'Book Appointment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

PatientAppointments.propTypes = {
  user: PropTypes.object.isRequired,
  currentDateTime: PropTypes.instanceOf(Date),
  isLoading: PropTypes.bool,
  onRefresh: PropTypes.func
};

PatientAppointments.defaultProps = {
  currentDateTime: new Date(),
  isLoading: false,
  onRefresh: () => {}
};

export default PatientAppointments;
