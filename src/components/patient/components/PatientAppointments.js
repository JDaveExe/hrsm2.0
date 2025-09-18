import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
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
  const [shouldAutoSubmit, setShouldAutoSubmit] = useState(false);
  const [isServiceDisabled, setIsServiceDisabled] = useState(true);
  const handleBookAppointmentRef = useRef();
  const [availableServices, setAvailableServices] = useState([]);
  const [lastBookingTime, setLastBookingTime] = useState(null);
  const [todayBookingCount, setTodayBookingCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

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

  // Load notifications from localStorage
  const loadNotifications = useCallback(() => {
    if (!user || !user.id) return;
    
    try {
      const storedNotifications = localStorage.getItem('patientNotifications');
      if (storedNotifications) {
        const allNotifications = JSON.parse(storedNotifications);
        const userNotifications = allNotifications.filter(notif => 
          notif.patientId === user.id && notif.status === 'pending'
        );
        setNotifications(userNotifications);
        setNotificationCount(userNotifications.length);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, [user]);

  // Load notifications on component mount and set up polling
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Handle notification acceptance
  const handleAcceptNotification = async (notificationId) => {
    try {
      setIsLoading(true);
      
      const storedNotifications = localStorage.getItem('patientNotifications');
      if (!storedNotifications) {
        throw new Error('No notifications found');
      }
      
      const allNotifications = JSON.parse(storedNotifications);
      const notification = allNotifications.find(notif => notif.id === notificationId);
      
      if (!notification) {
        throw new Error('Notification not found');
      }
      
      // Create the actual appointment in the system
      const appointmentData = {
        patientId: user.patientId || user.id,
        patientName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || 'Patient',
        appointmentDate: notification.appointmentDate,
        appointmentTime: notification.appointmentTime,
        type: notification.serviceType || 'General Consultation',
        serviceType: notification.serviceType || 'General Consultation',
        notes: notification.notes || '',
        status: 'accepted', // Patient accepted
        duration: 30,
        createdBy: 'patient_acceptance',
        acceptedAt: new Date().toISOString(),
        originalNotificationId: notificationId
      };
      
      // Try to create appointment via API
      try {
        await appointmentService.createAppointment(appointmentData);
        console.log('✅ Appointment created via API:', appointmentData);
      } catch (apiError) {
        // If API fails, store locally
        console.warn('API failed, storing appointment locally:', apiError);
        const existingAppointments = JSON.parse(localStorage.getItem('patient_appointments') || '[]');
        const newAppointment = {
          ...appointmentData,
          id: Date.now(),
          date: appointmentData.appointmentDate,
          time: appointmentData.appointmentTime
        };
        existingAppointments.push(newAppointment);
        localStorage.setItem('patient_appointments', JSON.stringify(existingAppointments));
      }
      
      // Update notification status
      const updatedNotifications = allNotifications.map(notif => 
        notif.id === notificationId ? { ...notif, status: 'accepted', acceptedAt: new Date().toISOString() } : notif
      );
      localStorage.setItem('patientNotifications', JSON.stringify(updatedNotifications));
      
      // Refresh both notifications and appointments
      loadNotifications();
      await loadAppointments();
      
      setSuccess('Appointment accepted and added to your schedule!');
      setTimeout(() => setSuccess(''), 5000);
      
    } catch (error) {
      console.error('Error accepting notification:', error);
      setError(`Failed to accept appointment: ${error.message}`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle notification decline
  const handleDeclineNotification = async (notificationId) => {
    try {
      const storedNotifications = localStorage.getItem('patientNotifications');
      if (storedNotifications) {
        const allNotifications = JSON.parse(storedNotifications);
        const updatedNotifications = allNotifications.map(notif => 
          notif.id === notificationId ? { ...notif, status: 'declined', declinedAt: new Date().toISOString() } : notif
        );
        localStorage.setItem('patientNotifications', JSON.stringify(updatedNotifications));
        loadNotifications(); // Refresh notifications
        setSuccess('Appointment declined.');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error declining notification:', error);
      setError('Failed to decline appointment');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Get the minimum bookable date (2 days ahead, excluding weekends)
  const getMinBookableDate = () => {
    const today = new Date();
    let minDate = new Date(today);
    
    // Add 2 days minimum
    minDate.setDate(today.getDate() + 2);
    
    // If the minimum date falls on a weekend, move to next Monday
    while (isWeekend(minDate.toISOString().split('T')[0])) {
      minDate.setDate(minDate.getDate() + 1);
    }
    
    return minDate.toISOString().split('T')[0];
  };

  // Check if a date is valid for booking (not today, tomorrow, or weekend)
  const isValidBookingDate = (date) => {
    const today = new Date();
    const selectedDate = new Date(date);
    const daysDiff = Math.ceil((selectedDate - today) / (1000 * 60 * 60 * 24));
    
    // Must be at least 2 days ahead and not a weekend
    return daysDiff >= 2 && !isWeekend(date);
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

  // Get approved appointments that need patient acceptance
  const getApprovedAppointments = () => {
    return appointments.filter(apt => 
      apt.status === 'approved' && 
      apt.needsPatientAcceptance === true
    );
  };

  // Handle accepting an admin-scheduled appointment
  const handleAcceptAppointment = async (appointmentId) => {
    try {
      setIsLoading(true);
      
      // Update appointment status to 'accepted'
      const updatedAppointment = {
        status: 'accepted',
        needsPatientAcceptance: false,
        patientAcceptedAt: new Date().toISOString()
      };
      
      await appointmentService.updateAppointment(appointmentId, updatedAppointment);
      
      // Refresh appointments
      await loadAppointments();
      
      setSuccess('Appointment accepted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('Error accepting appointment:', error);
      setError('Failed to accept appointment. Please try again.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // Automatically update overdue appointments
  const updateOverdueAppointments = useCallback(async () => {
    try {
      await appointmentService.updateOverdueStatus();
    } catch (err) {
      console.error('Error updating overdue appointments:', err);
    }
  }, []);

  // Mark appointment as completed
  const handleMarkCompleted = async (appointmentId) => {
    try {
      setIsLoading(true);
      await appointmentService.markAppointmentCompleted(appointmentId);
      
      // Refresh appointments
      await loadAppointments();
      
      setSuccess('Appointment marked as completed!');
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('Error marking appointment as completed:', error);
      setError('Failed to mark appointment as completed. Please try again.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // Load appointments
  const loadAppointments = useCallback(async () => {
    if (!user?.patientId && !user?.id) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // First, update any overdue appointments
      await updateOverdueAppointments();
      
      let allAppointments = [];
      
      // Try to load from API first
      try {
        const response = await appointmentService.getAppointments();
        const userAppointments = response.filter(
          apt => apt.patientId === (user.patientId || user.id)
        );
        
        // Transform backend field names to frontend expected format
        const transformedAppointments = userAppointments.map(apt => ({
          ...apt,
          date: apt.appointmentDate || apt.date,
          time: apt.appointmentTime || apt.time,
          serviceType: apt.type || apt.serviceType
        }));
        
        allAppointments = [...transformedAppointments];
        
      } catch (apiError) {
        console.warn('API appointments loading failed:', apiError);
      }
      
      // Also load locally stored appointments (from accepted notifications)
      try {
        const localAppointments = JSON.parse(localStorage.getItem('patient_appointments') || '[]');
        const userLocalAppointments = localAppointments.filter(
          apt => apt.patientId === (user.patientId || user.id)
        );
        
        // Avoid duplicates by checking if appointment already exists from API
        const uniqueLocalAppointments = userLocalAppointments.filter(localApt => 
          !allAppointments.some(apiApt => 
            apiApt.appointmentDate === localApt.appointmentDate && 
            apiApt.appointmentTime === localApt.appointmentTime &&
            apiApt.patientId === localApt.patientId
          )
        );
        
        allAppointments = [...allAppointments, ...uniqueLocalAppointments];
        
      } catch (localError) {
        console.warn('Local appointments loading failed:', localError);
      }
      
      setAppointments(allAppointments);
      
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
  }, [user?.patientId, user?.id, updateOverdueAppointments]);

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
      
      // Clear symptoms when Vaccination is selected
      if (field === 'serviceType' && value === 'Vaccination') {
        updated.symptoms = '';
      }
      
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

  // Handle auto-submit when timer expires
  useEffect(() => {
    if (shouldAutoSubmit && handleBookAppointmentRef.current) {
      // Create a synthetic event to trigger handleBookAppointment
      const syntheticEvent = { preventDefault: () => {} };
      handleBookAppointmentRef.current(syntheticEvent);
    }
  }, [shouldAutoSubmit]);

  // Confirmation timer
  useEffect(() => {
    let timer;
    if (showConfirmation && confirmationTimer > 0) {
      timer = setTimeout(() => {
        setConfirmationTimer(prev => prev - 1);
      }, 1000);
    } else if (showConfirmation && confirmationTimer === 0) {
      // Set flag to auto-submit
      setShouldAutoSubmit(true);
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

    // Show confirmation dialog or check auto-submit
    if (!showConfirmation && !shouldAutoSubmit) {
      setShowConfirmation(true);
      setConfirmationTimer(5);
      return;
    }

    // Reset auto-submit flag if it was set
    if (shouldAutoSubmit) {
      setShouldAutoSubmit(false);
    }

    // Proceed with booking after confirmation
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('🔄 Submitting appointment request...', {
        patientId: user.patientId,
        patientName: user.name || `${user.firstName} ${user.lastName}`,
        appointmentType: bookingForm.serviceType,
        requestedDate: bookingForm.date,
        requestedTime: bookingForm.time,
        symptoms: bookingForm.symptoms,
        notes: bookingForm.notes
      });

      // Submit appointment request to admin instead of directly creating appointment
      const result = await appointmentService.submitAppointmentRequest({
        patientId: user.patientId,
        patientName: user.name || `${user.firstName} ${user.lastName}`,
        appointmentType: bookingForm.serviceType,
        requestedDate: bookingForm.date,
        requestedTime: bookingForm.time,
        symptoms: bookingForm.symptoms,
        notes: bookingForm.notes,
        status: 'pending',
        requestDate: new Date().toISOString()
      });

      console.log('✅ Appointment request submitted successfully:', result);

      setSuccess('Appointment request submitted successfully! You will be notified once the admin reviews your request.');
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
      console.error('Error submitting appointment request:', err);
      setError('Failed to submit appointment request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.patientId, bookingForm, showConfirmation, todayBookingCount, lastBookingTime]);

  // Assign function to ref for auto-submit
  handleBookAppointmentRef.current = handleBookAppointment;

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
        isToday: currentDate.toDateString() === today.toDateString(),
        isValidBookingDate: isValidBookingDate(currentDate.toISOString().split('T')[0])
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

      {/* Admin Scheduled Appointments Notification */}
      {getApprovedAppointments().length > 0 && (
        <div className="alert alert-warning d-flex align-items-center" role="alert" style={{ backgroundColor: '#fff3cd', borderColor: '#ffeaa7', color: '#856404' }}>
          <div className="me-3">
            <i className="bi bi-exclamation-triangle-fill fs-4"></i>
          </div>
          <div className="flex-grow-1">
            <h6 className="mb-2">
              <strong>New Appointment{getApprovedAppointments().length > 1 ? 's' : ''} Scheduled</strong>
            </h6>
            <p className="mb-2">
              Your healthcare provider has scheduled {getApprovedAppointments().length} appointment{getApprovedAppointments().length > 1 ? 's' : ''} for you. 
              Please review and accept to confirm your attendance.
            </p>
            <div className="d-flex flex-wrap gap-2">
              {getApprovedAppointments().map(appointment => (
                <div key={appointment.id} className="admin-appointment-notification">
                  <div className="d-flex align-items-center justify-content-between bg-light rounded p-2">
                    <div className="me-3">
                      <div className="fw-bold">{appointment.serviceType || appointment.type}</div>
                      <div className="text-muted small">
                        {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                      </div>
                    </div>
                    <button 
                      className="btn btn-success btn-sm"
                      onClick={() => handleAcceptAppointment(appointment.id)}
                      disabled={isLoading}
                    >
                      <i className="bi bi-check-circle me-1"></i>
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
                        {appointment.status === 'Confirmed' && (
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => handleMarkCompleted(appointment.id)}
                            title="Mark appointment as completed"
                          >
                            <i className="bi bi-check-circle"></i>
                            Complete
                          </button>
                        )}
                        {appointment.status !== 'Cancelled' && appointment.status !== 'Completed' && appointment.status !== 'No Show' && (
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
                <div className="appointments-list">
                  {/* Backend Integration Ready:
                      - Container optimized for appointment cards
                      - Proper scrolling with flex layout
                      - Gap spacing for multiple cards
                      - Hover effects and transitions ready
                  */}
                </div>
              )}
            </div>
          </div>
          
          {/* All Appointments Section - Table Format */}
          <div className="all-appointments-section">
            <div className="section-header" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <h2 className="section-title">
                <i className="bi bi-list-check"></i>
                All Appointments
              </h2>
              <div className="patient-notification-section">
                <button 
                  className={`patient-notification-btn ${notificationCount > 0 ? 'has-notifications' : ''}`}
                  onClick={() => setShowNotificationModal(true)}
                  title={`${notificationCount} notification${notificationCount !== 1 ? 's' : ''}`}
                >
                  <i className="bi bi-bell"></i>
                  {notificationCount > 0 && (
                    <span className="patient-notification-badge">{notificationCount}</span>
                  )}
                  Notifications
                </button>
              </div>
            </div>
            
            <div className="all-appointments-container">
              {appointments.length > 0 ? (
                <div className="appointments-table-container">
                  <table className="appointments-table">
                    <thead>
                      <tr>
                        <th className="col-date">
                          <i className="bi bi-calendar3"></i>
                          Date
                        </th>
                        <th className="col-time">
                          <i className="bi bi-clock"></i>
                          Time
                        </th>
                        <th className="col-type">
                          <i className="bi bi-clipboard-pulse"></i>
                          Type
                        </th>
                        <th className="col-symptoms">
                          <i className="bi bi-chat-dots"></i>
                          Symptoms/Notes
                        </th>
                        <th className="col-status">
                          <i className="bi bi-info-circle"></i>
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map(appointment => (
                        <tr key={appointment.id} className={`appointment-row status-${appointment.status?.toLowerCase() || 'pending'}`}>
                          <td className="col-date">
                            <div className="date-cell">
                              {new Date(appointment.date).toLocaleDateString('en-US', { 
                                weekday: 'short',
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                          </td>
                          <td className="col-time">
                            <div className="time-cell">
                              {appointment.time}
                            </div>
                          </td>
                          <td className="col-type">
                            <div className="type-cell">
                              <span className="service-type">
                                {appointment.serviceType || 'General Consultation'}
                              </span>
                            </div>
                          </td>
                          <td className="col-symptoms">
                            <div className="symptoms-cell">
                              {(appointment.symptoms || appointment.notes) ? (
                                <button 
                                  className="details-btn btn btn-sm btn-outline-info"
                                  onClick={() => {
                                    const details = [];
                                    if (appointment.symptoms) {
                                      details.push(`Symptoms:\n${appointment.symptoms}`);
                                    }
                                    if (appointment.notes) {
                                      details.push(`Notes:\n${appointment.notes}`);
                                    }
                                    alert(details.join('\n\n'));
                                  }}
                                  title="View symptoms and notes details"
                                >
                                  <i className="bi bi-info-circle"></i>
                                  Details
                                </button>
                              ) : (
                                <span className="no-details text-muted">No details</span>
                              )}
                            </div>
                          </td>
                          <td className="col-status">
                            <span className={`status-badge status-${appointment.status?.toLowerCase() || 'pending'}`}>
                              {appointment.status?.charAt(0).toUpperCase() + appointment.status?.slice(1) || 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="no-all-appointments">
                  <div className="empty-state">
                    <div className="empty-icon">
                      <i className="bi bi-inbox"></i>
                    </div>
                    <h4>No appointments yet</h4>
                    <p>You haven't booked any appointments yet. Use the calendar to schedule your first appointment.</p>
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
                    <span className="nav-arrow nav-arrow-left"></span>
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
                    <span className="nav-arrow nav-arrow-right"></span>
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
                      className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${day.isToday ? 'today' : ''} ${day.hasAppointment ? 'has-appointment' : ''} ${!isValidBookingDate(day.date.toISOString().split('T')[0]) ? 'date-disabled' : ''}`}
                      onClick={() => {
                        const dateStr = day.date.toISOString().split('T')[0];
                        if (day.isCurrentMonth && isValidBookingDate(dateStr)) {
                          setSelectedDate(day.date);
                          setShowDateModal(true);
                        }
                      }}
                      style={{
                        cursor: !isValidBookingDate(day.date.toISOString().split('T')[0]) ? 'not-allowed' : 'pointer',
                        opacity: !isValidBookingDate(day.date.toISOString().split('T')[0]) ? 0.5 : 1
                      }}
                    >
                      <span className="day-number">{day.date.getDate()}</span>
                      {day.hasAppointment && <div className="appointment-indicator"></div>}
                      {!isValidBookingDate(day.date.toISOString().split('T')[0]) && (
                        <div className="date-disabled-indicator">
                          <i className="bi bi-x-circle" style={{ fontSize: '0.8rem', color: '#dc3545' }}></i>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Calendar Legend */}
              <div className="calendar-legend">
                <div className="legend-item">
                  <div className="legend-color today-indicator"></div>
                  <span>Today ({new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})</span>
                </div>
                <div className="legend-item">
                  <i className="bi bi-x-circle legend-icon"></i>
                  <span>Unavailable (weekends & dates within 2 days)</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color available-indicator"></div>
                  <span>Available for booking</span>
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
                    min={getMinBookableDate()}
                  />
                  {bookingForm.date && !isValidBookingDate(bookingForm.date) && (
                    <div className="form-text text-danger">
                      <i className="bi bi-exclamation-triangle"></i>
                      {isWeekend(bookingForm.date) 
                        ? 'Appointments are not available on weekends. Please select a weekday.'
                        : 'Appointments must be booked at least 2 days in advance. Please select a date starting from ' + new Date(getMinBookableDate()).toLocaleDateString() + '.'}
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
                    disabled={bookingForm.date && !isValidBookingDate(bookingForm.date)}
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
              {bookingForm.serviceType !== 'Vaccination' && (
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
              )}
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
                      isLoading
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

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="modal fade show patient-notification-modal" style={{ display: 'block' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-bell"></i>
                  Your Notifications ({notificationCount})
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowNotificationModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {notifications.length > 0 ? (
                  <div className="notifications-list">
                    {notifications.map(notification => (
                      <div key={notification.id} className="notification-item">
                        <div className="notification-content">
                          <div className="notification-header">
                            <h6 className="notification-title">
                              <i className="bi bi-calendar-plus"></i>
                              New Appointment Scheduled
                            </h6>
                            <span className="notification-time">
                              {new Date(notification.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="notification-details">
                            <p><strong>Date:</strong> {new Date(notification.appointmentDate).toLocaleDateString()}</p>
                            <p><strong>Time:</strong> {notification.appointmentTime}</p>
                            <p><strong>Service:</strong> {notification.serviceType}</p>
                            <p><strong>Doctor:</strong> {notification.doctorName || 'Dr. Smith'}</p>
                            {notification.notes && (
                              <p><strong>Notes:</strong> {notification.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="notification-actions">
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleAcceptNotification(notification.id)}
                          >
                            <i className="bi bi-check-circle"></i>
                            Accept
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleDeclineNotification(notification.id)}
                          >
                            <i className="bi bi-x-circle"></i>
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-notifications">
                    <div className="empty-state">
                      <i className="bi bi-bell-slash"></i>
                      <h6>No New Notifications</h6>
                      <p>You're all caught up! No new appointment notifications at this time.</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowNotificationModal(false)}
                >
                  Close
                </button>
              </div>
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
