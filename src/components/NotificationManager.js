import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/NotificationManager.css';

const NotificationManager = ({ patients = [] }) => {
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [notificationType, setNotificationType] = useState('appointment_reminder');
  const [customMessage, setCustomMessage] = useState('');
  const [appointmentDetails, setAppointmentDetails] = useState({
    date: '',
    time: '',
    doctor: '',
    type: 'Consultation'
  });
  const [vaccineDetails, setVaccineDetails] = useState({
    name: '',
    date: '',
    dose: '1st dose'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [sendingStatus, setSendingStatus] = useState(null);
  const [serviceStatus, setServiceStatus] = useState({
    sms: { available: false, status: 'unknown' },
    email: { available: false, status: 'unknown' }
  });

  // Fetch service status on component mount
  useEffect(() => {
    fetchServiceStatus();
  }, []);

  const fetchServiceStatus = async () => {
    try {
      const [smsStatus, emailStatus] = await Promise.all([
        axios.get('/api/notifications/sms-status'),
        axios.get('/api/notifications/email-status')
      ]);

      setServiceStatus({
        sms: {
          available: smsStatus.data.success && smsStatus.data.status.available,
          status: smsStatus.data.status
        },
        email: {
          available: emailStatus.data.success && emailStatus.data.status.available,
          status: emailStatus.data.status
        }
      });
    } catch (error) {
      console.error('Failed to fetch service status:', error);
    }
  };

  const handlePatientSelection = (patientId) => {
    setSelectedPatients(prev => {
      if (prev.includes(patientId)) {
        return prev.filter(id => id !== patientId);
      } else {
        return [...prev, patientId];
      }
    });
  };

  const selectAllPatients = () => {
    if (selectedPatients.length === patients.length) {
      setSelectedPatients([]);
    } else {
      setSelectedPatients(patients.map(p => p.id));
    }
  };

  const sendNotification = async () => {
    if (selectedPatients.length === 0) {
      alert('Please select at least one patient');
      return;
    }

    setIsLoading(true);
    setSendingStatus(null);

    try {
      const selectedPatientData = patients.filter(p => selectedPatients.includes(p.id));
      let variables = {};

      // Prepare variables based on notification type
      switch (notificationType) {
        case 'appointment_reminder':
          variables = {
            appointmentDate: appointmentDetails.date,
            appointmentTime: appointmentDetails.time,
            doctorName: appointmentDetails.doctor,
            appointmentType: appointmentDetails.type
          };
          break;
        case 'vaccination_reminder':
          variables = {
            vaccineName: vaccineDetails.name,
            vaccineDate: vaccineDetails.date,
            dosage: vaccineDetails.dose
          };
          break;
        case 'checkup_reminder':
          // No additional variables needed
          break;
        case 'custom':
          variables = { customMessage };
          break;
        default:
          break;
      }

      let response;
      if (selectedPatientData.length === 1) {
        // Send single notification
        response = await axios.post('/api/notifications/send-notification', {
          patient: selectedPatientData[0],
          type: notificationType,
          variables: variables,
          options: {}
        });
      } else {
        // Send bulk notifications
        response = await axios.post('/api/notifications/send-bulk-notifications', {
          patients: selectedPatientData,
          type: notificationType,
          variables: variables,
          options: {}
        });
      }

      if (response.data.success) {
        setSendingStatus({
          type: 'success',
          message: `Notifications sent successfully! ${response.data.stats ? 
            `SMS: ${response.data.stats.sms.successful}/${response.data.stats.sms.total}, 
             Email: ${response.data.stats.email.successful}/${response.data.stats.email.total}` 
            : ''}`
        });
      } else {
        setSendingStatus({
          type: 'error',
          message: response.data.error || 'Failed to send notifications'
        });
      }
    } catch (error) {
      console.error('Notification error:', error);
      setSendingStatus({
        type: 'error',
        message: error.response?.data?.error || 'Failed to send notifications'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testNotification = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/notifications/test-notification', {
        contact: '+639123456789', // Test number
        method: 'auto'
      });

      if (response.data.success) {
        setSendingStatus({
          type: 'success',
          message: 'Test notification sent successfully!'
        });
      } else {
        setSendingStatus({
          type: 'error',
          message: 'Test notification failed'
        });
      }
    } catch (error) {
      setSendingStatus({
        type: 'error',
        message: 'Test notification failed'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderNotificationForm = () => {
    switch (notificationType) {
      case 'appointment_reminder':
        return (
          <div className="notification-form">
            <h6>Appointment Details</h6>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={appointmentDetails.date}
                    onChange={(e) => setAppointmentDetails(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label>Time</label>
                  <input
                    type="time"
                    className="form-control"
                    value={appointmentDetails.time}
                    onChange={(e) => setAppointmentDetails(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label>Doctor</label>
                  <input
                    type="text"
                    className="form-control"
                    value={appointmentDetails.doctor}
                    onChange={(e) => setAppointmentDetails(prev => ({ ...prev, doctor: e.target.value }))}
                    placeholder="Dr. Name"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label>Appointment Type</label>
                  <select
                    className="form-control"
                    value={appointmentDetails.type}
                    onChange={(e) => setAppointmentDetails(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="Consultation">Consultation</option>
                    <option value="Check-up">Check-up</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Vaccination">Vaccination</option>
                    <option value="Lab Test">Lab Test</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 'vaccination_reminder':
        return (
          <div className="notification-form">
            <h6>Vaccination Details</h6>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label>Vaccine Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={vaccineDetails.name}
                    onChange={(e) => setVaccineDetails(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., COVID-19, Hepatitis B"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={vaccineDetails.date}
                    onChange={(e) => setVaccineDetails(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>Dose</label>
              <select
                className="form-control"
                value={vaccineDetails.dose}
                onChange={(e) => setVaccineDetails(prev => ({ ...prev, dose: e.target.value }))}
              >
                <option value="1st dose">1st dose</option>
                <option value="2nd dose">2nd dose</option>
                <option value="3rd dose">3rd dose</option>
                <option value="Booster">Booster</option>
              </select>
            </div>
          </div>
        );

      case 'custom':
        return (
          <div className="notification-form">
            <h6>Custom Message</h6>
            <div className="form-group">
              <label>Message</label>
              <textarea
                className="form-control"
                rows="4"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Enter your custom message here..."
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="notification-manager">
      <div className="notification-header">
        <h4>
          <i className="fas fa-bell"></i> Notification Manager
        </h4>
        <div className="service-status">
          <span className={`status-indicator ${serviceStatus.sms.available ? 'available' : 'unavailable'}`}>
            SMS {serviceStatus.sms.available ? '✓' : '✗'}
          </span>
          <span className={`status-indicator ${serviceStatus.email.available ? 'available' : 'unavailable'}`}>
            Email {serviceStatus.email.available ? '✓' : '✗'}
          </span>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="patient-selection">
            <h5>Select Patients</h5>
            <div className="select-all-container">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={selectedPatients.length === patients.length && patients.length > 0}
                  onChange={selectAllPatients}
                />
                <span className="checkmark"></span>
                Select All ({patients.length} patients)
              </label>
            </div>
            
            <div className="patient-list">
              {patients.map(patient => (
                <div key={patient.id} className="patient-item">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={selectedPatients.includes(patient.id)}
                      onChange={() => handlePatientSelection(patient.id)}
                    />
                    <span className="checkmark"></span>
                    <div className="patient-info">
                      <strong>{patient.firstName} {patient.lastName}</strong>
                      <div className="contact-info">
                        {patient.phoneNumber && (
                          <span className="phone">
                            <i className="fas fa-phone"></i> {patient.phoneNumber}
                          </span>
                        )}
                        {patient.email && (
                          <span className="email">
                            <i className="fas fa-envelope"></i> {patient.email}
                          </span>
                        )}
                        {!patient.phoneNumber && !patient.email && (
                          <span className="no-contact">No contact info</span>
                        )}
                      </div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="notification-setup">
            <h5>Notification Setup</h5>
            
            <div className="form-group">
              <label>Notification Type</label>
              <select
                className="form-control"
                value={notificationType}
                onChange={(e) => setNotificationType(e.target.value)}
              >
                <option value="appointment_reminder">Appointment Reminder</option>
                <option value="vaccination_reminder">Vaccination Reminder</option>
                <option value="checkup_reminder">Regular Checkup Reminder</option>
                <option value="custom">Custom Message</option>
              </select>
            </div>

            {renderNotificationForm()}

            {sendingStatus && (
              <div className={`alert ${sendingStatus.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
                {sendingStatus.message}
              </div>
            )}

            <div className="notification-actions">
              <button
                className="btn btn-primary btn-lg"
                onClick={sendNotification}
                disabled={isLoading || selectedPatients.length === 0}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm mr-2"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-2"></i>
                    Send Notifications ({selectedPatients.length})
                  </>
                )}
              </button>

              <button
                className="btn btn-outline-secondary"
                onClick={testNotification}
                disabled={isLoading}
              >
                <i className="fas fa-vial mr-2"></i>
                Test Notification
              </button>

              <button
                className="btn btn-outline-info"
                onClick={fetchServiceStatus}
                disabled={isLoading}
              >
                <i className="fas fa-sync mr-2"></i>
                Refresh Status
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationManager;
