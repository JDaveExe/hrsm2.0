import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Services.css';

const Services = () => {
  const serviceSchedules = {
    "Regular Checkup": { 
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], 
      hours: "8:00 AM - 12:00 PM, 1:00 PM - 4:00 PM",
      description: "General health checkups and routine medical examinations"
    },
    "Follow-up": { 
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], 
      hours: "8:00 AM - 12:00 PM, 1:00 PM - 4:00 PM",
      description: "Follow-up consultations for ongoing treatments"
    },
    "Consultation": { 
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], 
      hours: "8:00 AM - 12:00 PM, 1:00 PM - 4:00 PM",
      description: "Medical consultations and health advice"
    },
    "Vaccination": { 
      days: ["Monday", "Wednesday", "Friday"], 
      hours: "9:00 AM - 12:00 PM, 2:00 PM - 3:00 PM",
      description: "Immunization programs for children and adults"
    },
    "Emergency": { 
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday",], 
      hours: "24/7 Available",
      description: "Emergency medical services available round the clock"
    }
  };

  return (
    <div className="services-page">
      {/* Header Section */}
      <div className="services-header">
        <div className="container">
          <h1 className="services-title">Healthcare Service Schedules</h1>
          <p className="services-subtitle">
            View our available healthcare services and their operating schedules. 
            Plan your visit according to the service timings below.
          </p>
        </div>
      </div>

      {/* Schedule Section with Notes */}
      <div className="schedules-section">
        <div className="container">
          <div className="schedule-content">
            <div className="schedule-table-container">
              <table className="schedule-table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Available Days</th>
                    <th>Operating Hours</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(serviceSchedules).map(([serviceName, schedule], index) => (
                    <tr key={index} className="schedule-row">
                      <td className="service-name">{serviceName}</td>
                      <td className="service-days">
                        <div className="days-container">
                          {schedule.days.map((day, dayIndex) => (
                            <span key={dayIndex} className="day-badge">
                              {day}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="service-hours">
                        <span className="hour-badge">{schedule.hours}</span>
                      </td>
                      <td className="service-description">{schedule.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Important Notes beside the table */}
            <div className="notes-sidebar">
              <div className="notes-card">
                <h3>
                  <i className="bi bi-info-circle"></i>
                  Important Notes
                </h3>
                <ul>
                  <li><strong>Appointments:</strong> We recommend scheduling appointments in advance to ensure availability.</li>
                  <li><strong>Emergency Services:</strong> Available 24/7 for urgent medical situations.</li>
                  <li><strong>Lunch Break:</strong> Regular services are suspended from 12:00 PM to 1:00 PM.</li>
                  <li><strong>Walk-ins:</strong> Accepted during operating hours, but appointments take priority.</li>
                  <li><strong>Required Documents:</strong> Please bring valid ID and any relevant medical records.</li>
                </ul>
              </div>
              
              {/* Appointment Section in Sidebar */}
              <div className="appointment-card-sidebar">
                <h3>Ready to Schedule an Appointment?</h3>
                <p>Contact us or visit our health center to book your appointment.</p>
                <div className="appointment-actions">
                  <Link to="/auth" className="cta-button primary">
                    <i className="bi bi-calendar-plus"></i>
                    Book Appointment
                  </Link>
                  <a href="tel:+639123456789" className="cta-button secondary">
                    <i className="bi bi-telephone"></i>
                    Call Us: 63 026428645
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;
