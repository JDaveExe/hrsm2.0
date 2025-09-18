import React, { useState, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import './PatientMedicalRecords.css';

const PatientCommunication = memo(({ user, secureApiCall, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('messages'); // 'messages', 'notifications', 'emergency'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mock data for demonstration - replace with real API calls
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'Dr. Sarah Wilson',
      subject: 'Lab Results Available',
      message: 'Your recent blood work results are now available for review.',
      date: '2025-09-07',
      time: '14:30',
      read: false,
      type: 'medical'
    },
    {
      id: 2,
      sender: 'Clinic Administrator',
      subject: 'Appointment Reminder',
      message: 'This is a reminder about your upcoming appointment on September 10th.',
      date: '2025-09-06',
      time: '09:15',
      read: true,
      type: 'appointment'
    }
  ]);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Prescription Ready',
      message: 'Your prescription for Amoxicillin is ready for pickup.',
      date: '2025-09-08',
      time: '10:00',
      type: 'prescription',
      read: false
    },
    {
      id: 2,
      title: 'Annual Checkup Due',
      message: 'Your annual physical examination is due. Please schedule an appointment.',
      date: '2025-09-05',
      time: '08:00',
      type: 'reminder',
      read: true
    }
  ]);

  const [emergencyContacts, setEmergencyContacts] = useState([
    {
      id: 1,
      name: 'Emergency Hotline',
      phone: '911',
      type: 'emergency',
      available: '24/7'
    },
    {
      id: 2,
      name: 'Clinic After Hours',
      phone: '(555) 123-4567',
      type: 'medical',
      available: '6 PM - 8 AM'
    },
    {
      id: 3,
      name: 'Poison Control',
      phone: '1-800-222-1222',
      type: 'poison',
      available: '24/7'
    }
  ]);

  const handleMarkAsRead = useCallback((type, id) => {
    if (type === 'messages') {
      setMessages(prev => prev.map(msg => 
        msg.id === id ? { ...msg, read: true } : msg
      ));
    } else if (type === 'notifications') {
      setNotifications(prev => prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      ));
    }
  }, []);

  const getUnreadCount = (type) => {
    if (type === 'messages') {
      return messages.filter(msg => !msg.read).length;
    } else if (type === 'notifications') {
      return notifications.filter(notif => !notif.read).length;
    }
    return 0;
  };

  const renderMessages = () => (
    <div className="communication-section">
      <div className="section-header">
        <div className="section-title">
          <i className="bi bi-envelope"></i>
          <h3>Messages</h3>
        </div>
        <button className="btn btn-primary btn-sm">
          <i className="bi bi-plus"></i>
          New Message
        </button>
      </div>

      {messages.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-inbox"></i>
          <p>No messages yet</p>
        </div>
      ) : (
        <div className="messages-list">
          {messages.map(message => (
            <div 
              key={message.id} 
              className={`message-card ${!message.read ? 'unread' : ''}`}
              onClick={() => handleMarkAsRead('messages', message.id)}
            >
              <div className="message-header">
                <div className="sender-info">
                  <span className="sender-name">{message.sender}</span>
                  <span className="message-date">{message.date} at {message.time}</span>
                </div>
                {!message.read && <div className="unread-indicator"></div>}
              </div>
              <div className="message-subject">{message.subject}</div>
              <div className="message-preview">{message.message}</div>
              <div className="message-type">
                <span className={`type-badge ${message.type}`}>
                  {message.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderNotifications = () => (
    <div className="communication-section">
      <div className="section-header">
        <div className="section-title">
          <i className="bi bi-bell"></i>
          <h3>Notifications</h3>
        </div>
        <button className="btn btn-outline-secondary btn-sm">
          <i className="bi bi-check-all"></i>
          Mark All Read
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-bell-slash"></i>
          <p>No notifications</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`notification-card ${!notification.read ? 'unread' : ''}`}
              onClick={() => handleMarkAsRead('notifications', notification.id)}
            >
              <div className="notification-header">
                <div className="notification-title">{notification.title}</div>
                <div className="notification-date">{notification.date} at {notification.time}</div>
                {!notification.read && <div className="unread-indicator"></div>}
              </div>
              <div className="notification-message">{notification.message}</div>
              <div className="notification-type">
                <span className={`type-badge ${notification.type}`}>
                  {notification.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderEmergencyContacts = () => (
    <div className="communication-section">
      <div className="section-header">
        <div className="section-title">
          <i className="bi bi-telephone-plus"></i>
          <h3>Emergency Contacts</h3>
        </div>
        <button className="btn btn-danger btn-sm">
          <i className="bi bi-plus"></i>
          Add Contact
        </button>
      </div>

      <div className="emergency-contacts-list">
        {emergencyContacts.map(contact => (
          <div key={contact.id} className="emergency-contact-card">
            <div className="contact-info">
              <div className="contact-name">{contact.name}</div>
              <div className="contact-phone">
                <a href={`tel:${contact.phone}`}>
                  <i className="bi bi-telephone"></i>
                  {contact.phone}
                </a>
              </div>
              <div className="contact-availability">
                Available: {contact.available}
              </div>
            </div>
            <div className="contact-actions">
              <button className="btn btn-success btn-sm">
                <i className="bi bi-telephone"></i>
                Call
              </button>
              <span className={`contact-type-badge ${contact.type}`}>
                {contact.type}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="emergency-info">
        <div className="alert alert-warning">
          <i className="bi bi-exclamation-triangle"></i>
          <strong>Emergency Situations:</strong> If you are experiencing a life-threatening emergency, 
          call 911 immediately. Do not use this messaging system for urgent medical needs.
        </div>
      </div>
    </div>
  );

  return (
    <div className="patient-records-container">
      {/* Stats Header */}
      <div className="communication-stats">
        <div className="stat-item">
          <span className="stat-number">{getUnreadCount('messages')}</span>
          <span className="stat-label">Unread</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{getUnreadCount('notifications')}</span>
          <span className="stat-label">New</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{emergencyContacts.length}</span>
          <span className="stat-label">Contacts</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="records-tabs">
        <button 
          className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          <i className="bi bi-envelope"></i>
          Messages ({getUnreadCount('messages')} unread)
        </button>
        <button 
          className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <i className="bi bi-bell"></i>
          Notifications ({getUnreadCount('notifications')} new)
        </button>
        <button 
          className={`tab-btn ${activeTab === 'emergency' ? 'active' : ''}`}
          onClick={() => setActiveTab('emergency')}
        >
          <i className="bi bi-telephone-plus"></i>
          Emergency Contacts ({emergencyContacts.length})
        </button>
      </div>

      {/* Content Area */}
      <div className="records-content">
        {activeTab === 'messages' && renderMessages()}
        {activeTab === 'notifications' && renderNotifications()}
        {activeTab === 'emergency' && renderEmergencyContacts()}
      </div>
    </div>
  );
});

PatientCommunication.displayName = 'PatientCommunication';

PatientCommunication.propTypes = {
  user: PropTypes.object,
  secureApiCall: PropTypes.func,
  onRefresh: PropTypes.func
};

export default PatientCommunication;
