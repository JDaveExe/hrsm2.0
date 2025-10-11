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
  // Emergency appointment states
  const [showEmergencyWarningModal, setShowEmergencyWarningModal] = useState(false);
  const [showEmergencyBookingModal, setShowEmergencyBookingModal] = useState(false);
  const [emergencyWarningCountdown, setEmergencyWarningCountdown] = useState(3);
  const [emergencyUsageData, setEmergencyUsageData] = useState(null);
  const [emergencyBookingForm, setEmergencyBookingForm] = useState({
    date: '',
    time: '',
    reasonCategory: '',
    reasonDetails: '',
    symptoms: ''
  });
  // Modal states for appointment management
  const [selectedAppointmentForView, setSelectedAppointmentForView] = useState(null);
  const [selectedAppointmentForCancel, setSelectedAppointmentForCancel] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  
  // Daily limit checking
  const [isDailyLimitReached, setIsDailyLimitReached] = useState(false);
  const [dailyAppointmentCount, setDailyAppointmentCount] = useState(0);

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

  // Check if appointment can be cancelled (not if date/time has passed and status allows cancellation)
  const canCancelAppointment = (appointment) => {
    if (!appointment || appointment.status === 'Cancelled' || appointment.status === 'Completed') {
      return false;
    }
    
    const now = new Date();
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    
    // Can cancel if appointment is in the future
    return appointmentDateTime > now;
  };

  // Get the minimum bookable date (2 days ahead, excluding weekends)
  // Patients aged 60+ can book anytime (no 2-day restriction)
  const getMinBookableDate = () => {
    const today = new Date();
    let minDate = new Date(today);
    
    // Check if patient is 60 or older
    const isSenior = user?.age && parseInt(user.age) >= 60;
    
    if (isSenior) {
      // Seniors can book starting today
      // Just skip weekends
      while (isWeekend(minDate.toISOString().split('T')[0])) {
        minDate.setDate(minDate.getDate() + 1);
      }
    } else {
      // Regular patients: Add 2 days minimum
      minDate.setDate(today.getDate() + 2);
      
      // If the minimum date falls on a weekend, move to next Monday
      while (isWeekend(minDate.toISOString().split('T')[0])) {
        minDate.setDate(minDate.getDate() + 1);
      }
    }
    
    return minDate.toISOString().split('T')[0];
  };

  // Check if a date is valid for booking
  // Patients aged 60+ can book anytime (no 2-day restriction)
  const isValidBookingDate = (date) => {
    const today = new Date();
    const selectedDate = new Date(date);
    const daysDiff = Math.ceil((selectedDate - today) / (1000 * 60 * 60 * 24));
    
    // Check if patient is 60 or older
    const isSenior = user?.age && parseInt(user.age) >= 60;
    
    if (isSenior) {
      // Seniors can book anytime (today or future), just not on weekends
      return daysDiff >= 0 && !isWeekend(date);
    } else {
      // Regular patients: Must be at least 2 days ahead and not a weekend
      return daysDiff >= 2 && !isWeekend(date);
    }
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

  // Modal handlers
  const handleViewAppointment = (appointment) => {
    setSelectedAppointmentForView(appointment);
    setShowViewModal(true);
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
      apt.date === today && apt.status !== 'Cancelled'
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
      
      // Check daily limit when date changes
      if (field === 'date' && value) {
        checkDailyLimit(value).then(result => {
          setDailyAppointmentCount(result.count);
          setIsDailyLimitReached(result.isLimitReached);
        });
      }
      
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
  // Function to check daily appointment limit
  const checkDailyLimit = async (selectedDate) => {
    try {
      const response = await fetch(`/api/appointments/daily-count?date=${selectedDate}`);
      const data = await response.json();
      return {
        count: data.count || 0,
        isLimitReached: data.count >= 12
      };
    } catch (error) {
      console.error('Error checking daily limit:', error);
      return { count: 0, isLimitReached: false };
    }
  };

  const handleBookAppointment = useCallback(async (e) => {
    e.preventDefault();
    if (!user?.patientId) return;

    // Check weekend restriction
    if (bookingForm.date && isWeekend(bookingForm.date)) {
      setError('Appointments are not available on weekends. Please select a weekday.');
      return;
    }

    // Check daily appointment limit before proceeding
    const dailyCheck = await checkDailyLimit(bookingForm.date);
    if (dailyCheck.isLimitReached) {
      setError('This date is fully booked (12 appointments maximum per day). Please select a different date.');
      return;
    }

    // Check if patient already has an active appointment
    const hasActiveAppointment = appointments.some(apt => 
      apt.status === 'Scheduled'
    );

    if (hasActiveAppointment) {
      setError('You already have an active appointment. Please cancel your existing appointment before booking a new one.');
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

      // Create appointment directly (no approval needed)
      const result = await appointmentService.createAppointment({
        patientId: user.patientId,
        appointmentDate: bookingForm.date,
        appointmentTime: bookingForm.time,
        type: bookingForm.serviceType,
        duration: 30, // Default 30 minutes duration
        symptoms: bookingForm.symptoms,
        notes: bookingForm.notes,
        priority: 'Normal'
      });

      console.log('✅ Appointment created successfully:', result);

      setSuccess('Appointment booked successfully! Your appointment has been scheduled.');
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
      
      // Handle specific error codes from backend
      const errorData = err.response?.data;
      if (errorData?.errorCode) {
        switch (errorData.errorCode) {
          case 'DAILY_LIMIT_REACHED':
            setError('This date is fully booked. Please select a different date.');
            break;
          case 'EXACT_TIME_CONFLICT':
            setError(errorData.error || 'This time slot is already taken. Please choose a different time.');
            break;
          case 'BUFFER_TIME_CONFLICT':
            setError(errorData.error || 'This time is too close to another appointment. Please choose a time at least 30 minutes away.');
            break;
          default:
            setError(errorData.error || errorData.msg || 'Failed to book appointment. Please try again.');
        }
      } else {
        setError(errorData?.error || errorData?.msg || 'Failed to submit appointment request. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.patientId, bookingForm, showConfirmation, todayBookingCount, lastBookingTime]);

  // Assign function to ref for auto-submit
  handleBookAppointmentRef.current = handleBookAppointment;

  // Cancel appointment - updated to work with modal system
  const handleCancelAppointment = useCallback((appointment) => {
    // If it's just an ID (old usage), find the appointment
    if (typeof appointment === 'string' || typeof appointment === 'number') {
      const foundAppointment = appointments.find(apt => apt.id === appointment);
      if (foundAppointment) {
        setSelectedAppointmentForCancel(foundAppointment);
        setShowCancelModal(true);
      }
    } else {
      // New usage - appointment object passed directly
      setSelectedAppointmentForCancel(appointment);
      setShowCancelModal(true);
    }
  }, [appointments]);

  // Confirm cancel appointment
  const handleConfirmCancel = useCallback(async () => {
    if (!selectedAppointmentForCancel) return;

    try {
      await appointmentService.cancelAppointment(selectedAppointmentForCancel.id);
      setSuccess('Appointment cancelled successfully.');
      setShowCancelModal(false);
      setSelectedAppointmentForCancel(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      setError('Failed to cancel appointment. Please try again.');
      setShowCancelModal(false);
      setSelectedAppointmentForCancel(null);
    }
  }, [selectedAppointmentForCancel]);

  // Emergency Appointment Handlers
  const handleEmergencyButtonClick = async () => {
    try {
      // Close the booking modal if it's open
      setShowBookingModal(false);
      
      // Check emergency usage limits before showing warning
      const patientId = user?.patientId || user?.id;
      const response = await appointmentService.checkEmergencyUsage(patientId);
      setEmergencyUsageData(response);
      
      if (!response.canRequestEmergency) {
        if (response.cooldown.isWithinCooldown) {
          setError(`You must wait ${response.cooldown.daysUntilCooldownEnds} more days before requesting another emergency appointment (14-day cooldown).`);
        } else if (response.limits.monthlyLimitReached) {
          setError(`You have reached the maximum of 2 emergency appointments per 30 days. Please wait ${response.limits.daysUntilMonthlyReset} days or book a regular appointment.`);
        }
        setTimeout(() => setError(''), 7000);
        return;
      }
      
      // Show warning modal and start countdown
      setEmergencyWarningCountdown(3);
      setShowEmergencyWarningModal(true);
    } catch (error) {
      console.error('Error checking emergency usage:', error);
      setError('Failed to check emergency appointment eligibility. Please try again.');
      setTimeout(() => setError(''), 5000);
    }
  };

  // Emergency warning countdown timer
  useEffect(() => {
    if (showEmergencyWarningModal && emergencyWarningCountdown > 0) {
      const timer = setTimeout(() => {
        setEmergencyWarningCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showEmergencyWarningModal, emergencyWarningCountdown]);

  const handleEmergencyWarningAccept = () => {
    setShowEmergencyWarningModal(false);
    setShowEmergencyBookingModal(true);
    // Set default date to today for emergency
    const today = new Date().toISOString().split('T')[0];
    setEmergencyBookingForm(prev => ({ ...prev, date: today }));
  };

  const handleEmergencyWarningCancel = () => {
    setShowEmergencyWarningModal(false);
    setEmergencyWarningCountdown(3);
  };

  const handleEmergencyBookingFormChange = (field, value) => {
    setEmergencyBookingForm(prev => ({ ...prev, [field]: value }));
  };

  const handleEmergencyBookingSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!emergencyBookingForm.date || !emergencyBookingForm.time || 
        !emergencyBookingForm.reasonCategory || !emergencyBookingForm.reasonDetails) {
      setError('Please fill in all required fields.');
      setTimeout(() => setError(''), 5000);
      return;
    }
    
    try {
      setIsLoading(true);
      const patientId = user?.patientId || user?.id;
      
      const appointmentData = {
        patientId: patientId,
        appointmentDate: emergencyBookingForm.date,
        appointmentTime: emergencyBookingForm.time,
        type: 'Emergency Consultation',
        priority: 'Emergency',
        symptoms: emergencyBookingForm.symptoms || '',
        notes: `Emergency Reason: ${emergencyBookingForm.reasonDetails}`,
        vitalSignsRequired: true,
        isEmergency: true,
        emergencyReason: emergencyBookingForm.reasonDetails,
        emergencyReasonCategory: emergencyBookingForm.reasonCategory
      };
      
      await appointmentService.createAppointment(appointmentData);
      
      setSuccess('🚨 Emergency appointment booked successfully! Admin has been notified.');
      setShowEmergencyBookingModal(false);
      setEmergencyBookingForm({
        date: '',
        time: '',
        reasonCategory: '',
        reasonDetails: '',
        symptoms: ''
      });
      setRefreshTrigger(prev => prev + 1);
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Error booking emergency appointment:', error);
      const errorData = error.response?.data;
      
      if (errorData?.errorCode === 'EMERGENCY_MONTHLY_LIMIT') {
        setError('You have reached the monthly limit of 2 emergency appointments.');
      } else if (errorData?.errorCode === 'EMERGENCY_COOLDOWN') {
        setError(errorData.error || 'You must wait before requesting another emergency appointment.');
      } else {
        setError(errorData?.error || 'Failed to book emergency appointment. Please try again.');
      }
      
      setTimeout(() => setError(''), 7000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmergencyBookingCancel = () => {
    setShowEmergencyBookingModal(false);
    setEmergencyBookingForm({
      date: '',
      time: '',
      reasonCategory: '',
      reasonDetails: '',
      symptoms: ''
    });
  };

  // Filter appointments - exclude cancelled appointments from today's schedule
  const todaysAppointments = appointments.filter(apt => {
    const today = new Date().toDateString();
    const aptDate = new Date(apt.date).toDateString();
    return aptDate === today && apt.status !== 'Cancelled';
  });

  // Upcoming appointments - only admin-scheduled appointments within 3 days that need patient action
  const upcomingAppointments = appointments.filter(apt => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const aptDate = new Date(apt.date);
    aptDate.setHours(0, 0, 0, 0);
    
    // Calculate days difference
    const daysDifference = (aptDate - today) / (1000 * 60 * 60 * 24);
    
    // Only show appointments:
    // 1. Within 3 days (0 to 3 days from now)
    // 2. That are scheduled and within 3 days
    // 3. OR accepted appointments within 3 days
    const isWithin3Days = daysDifference >= 0 && daysDifference <= 3;
    const isScheduledAndNear = apt.status === 'scheduled' && isWithin3Days;
    
    return isWithin3Days && isScheduledAndNear;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  // All appointments history (sorted by date descending - most recent first)
  const allAppointmentsHistory = appointments
    .sort((a, b) => new Date(b.date) - new Date(a.date));

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
      
      const isSaturday = currentDate.getDay() === 6; // 6 = Saturday
      
      days.push({
        date: currentDate,
        isCurrentMonth: currentDate.getMonth() === month,
        hasAppointment,
        isToday: currentDate.toDateString() === today.toDateString(),
        isValidBookingDate: isValidBookingDate(currentDate.toISOString().split('T')[0]) && !isSaturday,
        isSaturday: isSaturday,
        isUnavailable: isSaturday // Mark Saturdays as unavailable
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

      {/* Main Content Layout - New Three-Section Grid Design */}
      <div className="patient-appointments-main-grid">
        
        {/* Left Content - Contains top row and all appointments */}
        <div className="patient-appointments-left-content">
          
          {/* Top Row - Today's Schedule and Upcoming Appointments Side by Side */}
          <div className="patient-appointments-top-row">
            
            {/* Today's Schedule Section */}
            <div className="patient-appointments-todays-schedule">
              <div className="patient-appointments-section-header">
                <h2 className="patient-appointments-section-title">
                  <i className="bi bi-calendar-day"></i>
                  Today's Schedule - {new Date().toLocaleDateString()}
                </h2>
              </div>
              
              <div className="patient-appointments-todays-content">
                {todaysAppointments.length > 0 ? (
                  <div className="patient-appointments-todays-cards">
                    {todaysAppointments.map(appointment => (
                      <div key={appointment.id} className="patient-appointment-today-card">
                        <div className="patient-appointment-card-header">
                          <div className="patient-appointment-time">
                            <i className="bi bi-clock me-2"></i>
                            {appointment.time}
                          </div>
                          <span className={`patient-appointment-status-badge patient-appointment-status-${appointment.status?.toLowerCase() || 'scheduled'}`}>
                            {appointment.status || 'Scheduled'}
                          </span>
                        </div>
                        <div className="patient-appointment-card-body">
                          <h4 className="patient-appointment-service">
                            <i className="bi bi-clipboard-pulse me-2"></i>
                            {appointment.serviceType || 'General Consultation'}
                          </h4>
                          {appointment.symptoms && (
                            <p className="patient-appointment-symptoms">
                              <i className="bi bi-heart-pulse me-2"></i>
                              {appointment.symptoms}
                            </p>
                          )}
                        </div>
                        <div className="patient-appointment-card-actions">
                          <button 
                            className="patient-appointment-btn patient-appointment-btn-view"
                            onClick={() => handleViewAppointment(appointment)}
                          >
                            <i className="bi bi-eye me-1"></i>
                            View Details
                          </button>
                          {appointment.status !== 'Cancelled' && (
                            <button
                              className="patient-appointment-btn patient-appointment-btn-cancel"
                              onClick={() => handleCancelAppointment(appointment)}
                            >
                              <i className="bi bi-x-circle me-1"></i>
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="patient-appointments-todays-empty">
                    <div className="patient-appointments-empty-state">
                      <i className="bi bi-calendar-x"></i>
                      <p>No appointments scheduled for today</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Upcoming Appointments Section - Card Format */}
            <div className="patient-appointments-upcoming-section">
              <div className="patient-appointments-section-header">
                <h2 className="patient-appointments-section-title">
                  <i className="bi bi-calendar-plus"></i>
                  Upcoming Appointments
                </h2>
              </div>
              
              <div className="patient-appointments-upcoming-content">
                {upcomingAppointments.length > 0 ? (
                  <div className="patient-appointments-upcoming-cards">
                    {upcomingAppointments.map(appointment => (
                      <div key={appointment.id} className="patient-appointment-upcoming-card">
                        <div className="patient-appointment-card-header">
                          <div className="patient-appointment-date">
                            <i className="bi bi-calendar3 me-2"></i>
                            {new Date(appointment.date).toLocaleDateString('en-US', { 
                              weekday: 'short',
                              month: 'short', 
                              day: 'numeric'
                            })}
                          </div>
                          <div className="patient-appointment-time">
                            <i className="bi bi-clock me-2"></i>
                            {appointment.time}
                          </div>
                        </div>
                        <div className="patient-appointment-card-body">
                          <h4 className="patient-appointment-service">
                            <i className="bi bi-clipboard-pulse me-2"></i>
                            {appointment.serviceType || 'General Consultation'}
                          </h4>
                          <span className={`patient-appointment-status-badge patient-appointment-status-${appointment.status?.toLowerCase() || 'scheduled'}`}>
                            {appointment.status || 'Scheduled'}
                          </span>
                        </div>
                        <div className="patient-appointment-card-actions">
                          <button 
                            className="patient-appointment-btn patient-appointment-btn-view"
                            onClick={() => handleViewAppointment(appointment)}
                            title="View details"
                          >
                            <i className="bi bi-eye me-1"></i>
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="patient-appointments-upcoming-empty">
                    <div className="patient-appointments-empty-state">
                      <i className="bi bi-calendar-x"></i>
                      <h4>No upcoming appointments</h4>
                      <p>You don't have any upcoming appointments scheduled.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* All Appointments History Section - Below the top row */}
          <div className="patient-appointments-history-section">
            <div className="patient-appointments-section-header">
              <h2 className="patient-appointments-section-title">
                <i className="bi bi-list-check"></i>
                All Appointments History
              </h2>
            </div>
            
            <div className="patient-appointments-history-content">
              {allAppointmentsHistory.length > 0 ? (
                <div className="patient-appointments-history-wrapper">
                  <table className="patient-appointments-history-table">
                    <thead>
                      <tr>
                        <th className="patient-appointments-col-date">
                          <i className="bi bi-calendar3"></i>
                          Date
                        </th>
                        <th className="patient-appointments-col-time">
                          <i className="bi bi-clock"></i>
                          Time
                        </th>
                        <th className="patient-appointments-col-type">
                          <i className="bi bi-clipboard-pulse"></i>
                          Type
                        </th>
                        <th className="patient-appointments-col-status">
                          <i className="bi bi-info-circle"></i>
                          Status
                        </th>
                        <th className="patient-appointments-col-actions">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {allAppointmentsHistory.map(appointment => (
                        <tr key={appointment.id} className={`patient-appointments-history-row patient-appointments-status-${appointment.status?.toLowerCase() || 'scheduled'}`}>
                          <td className="patient-appointments-col-date">
                            <div className="patient-appointments-date-cell">
                              {new Date(appointment.date).toLocaleDateString('en-US', { 
                                weekday: 'short',
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                          </td>
                          <td className="patient-appointments-col-time">
                            <div className="patient-appointments-time-cell">
                              {appointment.time}
                            </div>
                          </td>
                          <td className="patient-appointments-col-type">
                            <div className="patient-appointments-type-cell">
                              {appointment.serviceType || 'General Consultation'}
                            </div>
                          </td>
                          <td className="patient-appointments-col-status">
                            <span className={`patient-appointments-status-badge patient-appointments-status-${appointment.status?.toLowerCase() || 'scheduled'}`}>
                              {appointment.status || 'Scheduled'}
                            </span>
                          </td>
                          <td className="patient-appointments-col-actions">
                            <div className="patient-appointments-actions-cell">
                              <button 
                                className="patient-appointments-btn patient-appointments-btn-view" 
                                onClick={() => handleViewAppointment(appointment)}
                                title="View details"
                              >
                                View Details
                              </button>
                              {canCancelAppointment(appointment) && (
                                <button 
                                  className="patient-appointments-btn patient-appointments-btn-cancel" 
                                  onClick={() => handleCancelAppointment(appointment)}
                                  title="Cancel appointment"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="patient-appointments-history-empty">
                  <div className="patient-appointments-empty-state">
                    <i className="bi bi-inbox"></i>
                    <h4>No appointment history</h4>
                    <p>Your appointment history will appear here once you have appointments.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Calendar */}
        <div className="patient-appointments-right-column">
          <div className="patient-appointments-calendar-section">
            <div className="patient-appointments-calendar-container">
              <div className="patient-appointments-calendar-header">
                <div className="patient-appointments-calendar-nav">
                  <button 
                    className="patient-appointments-calendar-nav-btn patient-appointments-nav-prev"
                    onClick={() => {
                      const prevMonth = new Date();
                      prevMonth.setMonth(prevMonth.getMonth() - 1);
                      // Handle month navigation
                    }}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  <h3 className="patient-appointments-calendar-title">
                    <i className="bi bi-calendar3"></i>
                    {currentMonth} {currentYear}
                  </h3>
                  <button 
                    className="patient-appointments-calendar-nav-btn patient-appointments-nav-next"
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
              
              <div className="patient-appointments-calendar-grid">
                <div className="patient-appointments-calendar-weekdays">
                  <div className="patient-appointments-calendar-day-name">Sun</div>
                  <div className="patient-appointments-calendar-day-name">Mon</div>
                  <div className="patient-appointments-calendar-day-name">Tue</div>
                  <div className="patient-appointments-calendar-day-name">Wed</div>
                  <div className="patient-appointments-calendar-day-name">Thu</div>
                  <div className="patient-appointments-calendar-day-name">Fri</div>
                  <div className="patient-appointments-calendar-day-name">Sat</div>
                </div>
                <div className="patient-appointments-calendar-days">
                  {calendarDays.map((day, index) => (
                    <div
                      key={index}
                      className={`patient-appointments-calendar-day ${!day.isCurrentMonth ? 'patient-appointments-other-month' : ''} ${day.isToday ? 'patient-appointments-today' : ''} ${day.hasAppointment ? 'patient-appointments-has-appointment' : ''} ${!isValidBookingDate(day.date.toISOString().split('T')[0]) ? 'patient-appointments-date-disabled' : ''} ${day.isSaturday ? 'patient-appointments-saturday-unavailable' : ''}`}
                      onClick={() => {
                        const dateStr = day.date.toISOString().split('T')[0];
                        if (day.isCurrentMonth && isValidBookingDate(dateStr) && !day.isSaturday) {
                          setSelectedDate(day.date);
                          setShowDateModal(true);
                        }
                      }}
                    >
                      <span className="patient-appointments-day-number">{day.date.getDate()}</span>
                      {day.hasAppointment && <div className="patient-appointments-appointment-indicator"></div>}
                      {day.isSaturday && (
                        <div className="patient-appointments-saturday-indicator">
                          <i className="bi bi-calendar-x"></i>
                        </div>
                      )}
                      {!isValidBookingDate(day.date.toISOString().split('T')[0]) && !day.isSaturday && (
                        <div className="patient-appointments-date-disabled-indicator">
                          <i className="bi bi-x-circle"></i>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Calendar Legend */}
              <div className="patient-appointments-calendar-legend">
                <div className="patient-appointments-legend-item">
                  <div className="patient-appointments-legend-color patient-appointments-today-indicator"></div>
                  <span>Today ({new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})</span>
                </div>
                <div className="patient-appointments-legend-item">
                  <i className="bi bi-calendar-x patient-appointments-legend-icon"></i>
                  <span>Saturdays (Unavailable)</span>
                </div>
                <div className="patient-appointments-legend-item">
                  <i className="bi bi-x-circle patient-appointments-legend-icon"></i>
                  <span>Unavailable (Sundays & dates within 2 days)</span>
                </div>
                <div className="patient-appointments-legend-item">
                  <div className="patient-appointments-legend-color patient-appointments-available-indicator"></div>
                  <span>Available for booking</span>
                </div>
                <div className="patient-appointments-legend-item">
                  <div className="patient-appointments-legend-color patient-appointments-has-appointment-indicator"></div>
                  <span>Has appointment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>



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
                className="emergency-apt-trigger-btn-modal"
                onClick={handleEmergencyButtonClick}
                title="Request Emergency Consultation"
                type="button"
              >
                <i className="bi bi-exclamation-triangle-fill"></i>
                Emergency
              </button>
            </div>
            
            {/* Daily Limit Message */}
            {isDailyLimitReached && bookingForm.date && (
              <div className="daily-limit-message booking-disabled">
                <h3>This Date is Fully Booked</h3>
                <p>
                  {dailyAppointmentCount}/12 appointments have been scheduled for this date. 
                  Please select a different date to continue booking.
                </p>
              </div>
            )}
            
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
                    isDailyLimitReached ||
                    isServiceDisabled
                  }
                >
                  <i className="bi bi-check"></i>
                  {isLoading ? 'Booking...' : 
                   showConfirmation ? `Confirm (${confirmationTimer}s)` : 
                   bookingForm.date && isWeekend(bookingForm.date) ? 'Weekends Not Available' :
                   isDailyLimitReached ? 'Date Fully Booked' :
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
            
            {/* Daily Limit Message for Date Modal */}
            {isDailyLimitReached && (
              <div className="daily-limit-message booking-disabled">
                <h3>This Date is Fully Booked</h3>
                <p>
                  {dailyAppointmentCount}/12 appointments have been scheduled for this date. 
                  Please select a different date to continue booking.
                </p>
              </div>
            )}
            
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
                      isDailyLimitReached ||
                      todayBookingCount >= 2 ||
                      lastBookingTime ||
                      isLoading
                    }
                  >
                    <i className="bi bi-calendar-plus"></i>
                    {isLoading ? 'Booking...' : 
                     showConfirmation ? `Confirm (${confirmationTimer}s)` : 
                     selectedDate && isWeekend(selectedDate) ? 'Weekends Not Available' :
                     isDailyLimitReached ? 'Date Fully Booked' :
                     'Book Appointment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}



      {/* View Appointment Modal */}
      {showViewModal && selectedAppointmentForView && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Appointment Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowViewModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-sm-3"><strong>Date:</strong></div>
                  <div className="col-sm-9">
                    {new Date(selectedAppointmentForView.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-sm-3"><strong>Time:</strong></div>
                  <div className="col-sm-9">{selectedAppointmentForView.time}</div>
                </div>
                <div className="row mb-3">
                  <div className="col-sm-3"><strong>Service:</strong></div>
                  <div className="col-sm-9">{selectedAppointmentForView.serviceType || 'General Consultation'}</div>
                </div>
                <div className="row mb-3">
                  <div className="col-sm-3"><strong>Status:</strong></div>
                  <div className="col-sm-9">
                    <span className={`appointments-status-badge appointments-status-${selectedAppointmentForView.status?.toLowerCase() || 'scheduled'}`}>
                      {selectedAppointmentForView.status?.charAt(0).toUpperCase() + selectedAppointmentForView.status?.slice(1) || 'Scheduled'}
                    </span>
                  </div>
                </div>
                {selectedAppointmentForView.notes && (
                  <div className="row mb-3">
                    <div className="col-sm-3"><strong>Notes:</strong></div>
                    <div className="col-sm-9">{selectedAppointmentForView.notes}</div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Appointment Modal */}
      {showCancelModal && selectedAppointmentForCancel && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Cancel Appointment</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCancelModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to cancel this appointment?</p>
                <div className="appointment-summary">
                  <div><strong>Date:</strong> {new Date(selectedAppointmentForCancel.date).toLocaleDateString()}</div>
                  <div><strong>Time:</strong> {selectedAppointmentForCancel.time}</div>
                  <div><strong>Service:</strong> {selectedAppointmentForCancel.serviceType || 'General Consultation'}</div>
                </div>
                <div className="alert alert-warning mt-3">
                  <i className="bi bi-exclamation-triangle"></i>
                  This action cannot be undone. You may need to reschedule if you change your mind.
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCancelModal(false)}
                >
                  Keep Appointment
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleConfirmCancel}
                >
                  Cancel Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Emergency Warning Modal */}
      {showEmergencyWarningModal && (
        <div className="emergency-apt-warning-overlay">
          <div className="emergency-apt-warning-modal">
            <div className="emergency-apt-warning-header">
              <i className="bi bi-exclamation-triangle-fill emergency-apt-warning-icon"></i>
              <h3>Emergency Appointment Warning</h3>
            </div>
            
            <div className="emergency-apt-warning-content">
              <div className="emergency-apt-warning-message">
                <p><strong>⚠️ Important Information:</strong></p>
                <ul>
                  <li>Emergency appointments bypass the standard 2-day advance booking requirement</li>
                  <li>This feature is for genuine medical emergencies only</li>
                  <li>You have a <strong>monthly limit of 2 emergency appointments</strong></li>
                  <li>There is a <strong>14-day cooldown</strong> between emergency appointments</li>
                  <li>Misuse may result in restriction of this feature</li>
                  <li>The admin team will be immediately notified of your request</li>
                </ul>
              </div>
              
              <div className="emergency-apt-warning-countdown">
                <div className="emergency-apt-countdown-bar">
                  <div 
                    className="emergency-apt-countdown-progress" 
                    style={{ width: `${(3 - emergencyWarningCountdown) / 3 * 100}%` }}
                  ></div>
                </div>
                <p className="emergency-apt-countdown-text">
                  {emergencyWarningCountdown > 0 
                    ? `Please read carefully (${emergencyWarningCountdown}s)` 
                    : 'You may proceed'}
                </p>
              </div>
            </div>
            
            <div className="emergency-apt-warning-actions">
              <button 
                className="emergency-apt-btn-cancel"
                onClick={handleEmergencyWarningCancel}
              >
                Cancel
              </button>
              <button 
                className="emergency-apt-btn-accept"
                onClick={handleEmergencyWarningAccept}
                disabled={emergencyWarningCountdown > 0}
              >
                {emergencyWarningCountdown > 0 ? `Wait ${emergencyWarningCountdown}s` : 'I Understand'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Booking Modal */}
      {showEmergencyBookingModal && (
        <div className="emergency-apt-booking-overlay">
          <div className="emergency-apt-booking-modal">
            <div className="emergency-apt-booking-header">
              <i className="bi bi-hospital-fill emergency-apt-booking-icon"></i>
              <h3>🚨 Emergency Consultation Booking</h3>
            </div>
            
            <form onSubmit={handleEmergencyBookingSubmit} className="emergency-apt-booking-form">
              <div className="emergency-apt-info-banner">
                <i className="bi bi-info-circle-fill"></i>
                <span>Service Type: <strong>Emergency Consultation</strong> (Cannot be changed)</span>
              </div>
              
              <div className="emergency-apt-form-row">
                <div className="emergency-apt-form-group">
                  <label>
                    <i className="bi bi-calendar-event"></i>
                    Date <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    value={emergencyBookingForm.date}
                    onChange={(e) => handleEmergencyBookingFormChange('date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    max={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // Tomorrow
                    required
                    className="emergency-apt-input"
                  />
                  <small className="emergency-apt-hint">Emergency: Today or tomorrow only</small>
                </div>
                
                <div className="emergency-apt-form-group">
                  <label>
                    <i className="bi bi-clock"></i>
                    Time <span className="required">*</span>
                  </label>
                  <input
                    type="time"
                    value={emergencyBookingForm.time}
                    onChange={(e) => handleEmergencyBookingFormChange('time', e.target.value)}
                    required
                    className="emergency-apt-input"
                  />
                </div>
              </div>
              
              <div className="emergency-apt-form-group">
                <label>
                  <i className="bi bi-exclamation-octagon"></i>
                  Emergency Category <span className="required">*</span>
                </label>
                <select
                  value={emergencyBookingForm.reasonCategory}
                  onChange={(e) => handleEmergencyBookingFormChange('reasonCategory', e.target.value)}
                  required
                  className="emergency-apt-select"
                >
                  <option value="">Select emergency category</option>
                  <option value="Severe Pain">Severe Pain</option>
                  <option value="High Fever (>39°C)">High Fever (&gt;39°C)</option>
                  <option value="Injury/Accident">Injury/Accident</option>
                  <option value="Breathing Difficulty">Breathing Difficulty</option>
                  <option value="Severe Allergic Reaction">Severe Allergic Reaction</option>
                  <option value="Other Critical">Other Critical Condition</option>
                </select>
              </div>
              
              <div className="emergency-apt-form-group">
                <label>
                  <i className="bi bi-file-text"></i>
                  Emergency Reason Details <span className="required">*</span>
                </label>
                <textarea
                  value={emergencyBookingForm.reasonDetails}
                  onChange={(e) => handleEmergencyBookingFormChange('reasonDetails', e.target.value)}
                  placeholder="Please describe your emergency situation in detail..."
                  required
                  rows="4"
                  className="emergency-apt-textarea"
                  minLength="20"
                ></textarea>
                <small className="emergency-apt-hint">Minimum 20 characters required</small>
              </div>
              
              <div className="emergency-apt-form-group">
                <label>
                  <i className="bi bi-clipboard-pulse"></i>
                  Additional Symptoms (Optional)
                </label>
                <textarea
                  value={emergencyBookingForm.symptoms}
                  onChange={(e) => handleEmergencyBookingFormChange('symptoms', e.target.value)}
                  placeholder="Any other symptoms you're experiencing..."
                  rows="3"
                  className="emergency-apt-textarea"
                ></textarea>
              </div>
              
              {emergencyUsageData && (
                <div className="emergency-apt-usage-info">
                  <p>
                    <strong>Your Emergency Usage:</strong> {emergencyUsageData.usage.emergencyCount30Days} of {emergencyUsageData.usage.monthlyLimit} used this month
                  </p>
                </div>
              )}
              
              <div className="emergency-apt-booking-actions">
                <button 
                  type="button"
                  className="emergency-apt-btn-cancel"
                  onClick={handleEmergencyBookingCancel}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="emergency-apt-btn-submit"
                  disabled={isLoading}
                >
                  <i className="bi bi-send-fill"></i>
                  {isLoading ? 'Submitting...' : 'Book Emergency Appointment'}
                </button>
              </div>
            </form>
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
