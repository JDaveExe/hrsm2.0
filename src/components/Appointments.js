import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Appointments.css';

const Appointments = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in and get their role
    const checkAuthentication = () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (token && user) {
        try {
          const userData = JSON.parse(user);
          setUserRole(userData.role);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error parsing user data:', error);
          // Clear invalid data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    checkAuthentication();
  }, []);

  // If still loading, show loading state
  if (loading) {
    return (
      <div className="appointments-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div className="appointments-container">
        <div className="auth-required">
          <div className="auth-prompt">
            <div className="auth-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <circle cx="12" cy="16" r="1"></circle>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h2>Patient Login Required</h2>
            <p>You need to be logged in with a patient account to book and manage appointments.</p>
            <div className="auth-actions">
              <Link to="/auth" className="login-btn primary">
                Sign In / Sign Up
              </Link>
            </div>
            <div className="auth-info">
              <h3>Why do I need to login?</h3>
              <ul>
                <li>Secure access to your medical appointments</li>
                <li>View your appointment history</li>
                <li>Manage and reschedule appointments</li>
                <li>Receive appointment reminders</li>
                <li>Access your medical records</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If authenticated but not a patient, show access denied with option to switch accounts
  if (userRole !== 'patient') {
    return (
      <div className="appointments-container">
        <div className="auth-required">
          <div className="auth-prompt">
            <div className="auth-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <h2>Patient Account Required</h2>
            <p>This section is only available for patients. Please login with a patient account or create a new patient account.</p>
            <div className="auth-actions">
              <Link to="/auth" className="login-btn primary">
                Switch to Patient Account
              </Link>
            </div>
            <div className="auth-info">
              <h3>Need a patient account?</h3>
              <ul>
                <li>Create a free patient account to book appointments</li>
                <li>Access your medical records securely</li>
                <li>Receive appointment reminders and notifications</li>
                <li>Manage your healthcare information online</li>
                <li>View lab results and prescriptions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If authenticated as patient, show appointments interface
  return (
    <div className="appointments-container">
      <div className="appointments-header">
        <h1>My Appointments</h1>
        <p>Book and manage your medical appointments</p>
      </div>

      <div className="appointments-content">
        <div className="appointments-actions">
          <button className="btn-primary">Book New Appointment</button>
          <button className="btn-secondary">View Appointment History</button>
        </div>

        <div className="appointments-grid">
          <div className="appointment-card upcoming">
            <div className="appointment-header">
              <h3>Upcoming Appointments</h3>
              <span className="count">0</span>
            </div>
            <p>No upcoming appointments scheduled.</p>
            <button className="book-btn">Book Appointment</button>
          </div>

          <div className="appointment-card recent">
            <div className="appointment-header">
              <h3>Recent Appointments</h3>
              <span className="count">0</span>
            </div>
            <p>No recent appointments found.</p>
            <button className="history-btn">View History</button>
          </div>

          <div className="appointment-card quick-actions">
            <h3>Quick Actions</h3>
            <div className="quick-action-buttons">
              <button className="quick-btn">Emergency Appointment</button>
              <button className="quick-btn">Reschedule</button>
              <button className="quick-btn">Cancel Appointment</button>
              <button className="quick-btn">Contact Clinic</button>
            </div>
          </div>
        </div>

        <div className="appointment-info">
          <h3>Appointment Guidelines</h3>
          <div className="info-grid">
            <div className="info-item">
              <h4>📅 Booking</h4>
              <p>Appointments can be booked up to 30 days in advance</p>
            </div>
            <div className="info-item">
              <h4>⏰ Timing</h4>
              <p>Please arrive 15 minutes before your scheduled time</p>
            </div>
            <div className="info-item">
              <h4>📋 Requirements</h4>
              <p>Bring valid ID and any relevant medical documents</p>
            </div>
            <div className="info-item">
              <h4>🔄 Changes</h4>
              <p>Reschedule or cancel at least 24 hours in advance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appointments;
