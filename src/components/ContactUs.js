import React, { useState } from 'react';
import '../styles/ContactUs.css';

const ContactPage = () => {
  return (
    <div className="contact-page">
      {/* Header Section */}
      <div className="contact-header">
        <div className="container">
          <h1 className="contact-title">Contact Our Healthcare Center</h1>
          <p className="contact-subtitle">
            We're here to help with your healthcare needs. Get in touch with us for appointments, 
            medical records, or any questions about our services.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="contact-content">
        <div className="container">
          <div className="contact-grid">
            {/* Contact Information */}
            <div className="contact-info-section">
              <div className="info-card">
                <div className="card-header">
                  <i className="bi bi-geo-alt-fill"></i>
                  <h3>Visit Our Health Center</h3>
                </div>
                <div className="card-content">
                  <p><strong>Barangay Health Center</strong></p>
                  <p>123 Healthcare Street</p>
                  <p>Barangay Community, City 12345</p>
                  <p>Philippines</p>
                </div>
              </div>

              <div className="info-card">
                <div className="card-header">
                  <i className="bi bi-telephone-fill"></i>
                  <h3>Call Us</h3>
                </div>
                <div className="card-content">
                  <p><strong>Main Line:</strong> <a href="tel:+639123456789">(0912) 345-6789</a></p>
                  <p><strong>Emergency:</strong> <a href="tel:911">911</a></p>
                  <p><strong>Appointment Line:</strong> <a href="tel:+639123456790">(0912) 345-6790</a></p>
                </div>
              </div>

              <div className="info-card">
                <div className="card-header">
                  <i className="bi bi-envelope-fill"></i>
                  <h3>Email Us</h3>
                </div>
                <div className="card-content">
                  <p><strong>General Inquiries:</strong> <a href="mailto:info@barangayhealth.com">info@barangayhealth.com</a></p>
                  <p><strong>Appointments:</strong> <a href="mailto:appointments@barangayhealth.com">appointments@barangayhealth.com</a></p>
                  <p><strong>Medical Records:</strong> <a href="mailto:records@barangayhealth.com">records@barangayhealth.com</a></p>
                </div>
              </div>

              <div className="info-card">
                <div className="card-header">
                  <i className="bi bi-clock-fill"></i>
                  <h3>Operating Hours</h3>
                </div>
                <div className="card-content">
                  <div className="schedule-item">
                    <span>Monday - Friday:</span>
                    <span>8:00 AM - 5:00 PM</span>
                  </div>
                  <div className="schedule-item">
                    <span>Saturday:</span>
                    <span>8:00 AM - 2:00 PM</span>
                  </div>
                  <div className="schedule-item">
                    <span>Sunday:</span>
                    <span>Emergency Only</span>
                  </div>
                  <div className="emergency-note">
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    <span>Emergency services available 24/7</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="contact-form-section">
              <div className="form-card">
                <h3>Send Us a Message</h3>
                <p>Have questions or need assistance? Fill out the form below and we'll get back to you as soon as possible.</p>
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Quick Links */}
      <div className="quick-links-section">
        <div className="container">
          <h3>Quick Service Links</h3>
          <div className="quick-links-grid">
            <a href="/auth" className="quick-link-card">
              <i className="bi bi-calendar-plus"></i>
              <span>Book Appointment</span>
            </a>
            <a href="/services" className="quick-link-card">
              <i className="bi bi-heart-pulse"></i>
              <span>View Services</span>
            </a>
            <a href="#medical-records" className="quick-link-card">
              <i className="bi bi-file-medical"></i>
              <span>Medical Records</span>
            </a>
            <a href="#emergency" className="quick-link-card">
              <i className="bi bi-exclamation-triangle"></i>
              <span>Emergency Info</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContactForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    serviceType: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    console.log('Contact form submitted:', formData);
    alert('Thank you for your message! We will get back to you soon.');
  };

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="firstName">First Name *</label>
          <input 
            type="text" 
            id="firstName" 
            name="firstName" 
            value={formData.firstName} 
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="lastName">Last Name *</label>
          <input 
            type="text" 
            id="lastName" 
            name="lastName" 
            value={formData.lastName} 
            onChange={handleChange}
            required
          />
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="email">Email Address *</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            value={formData.email} 
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <input 
            type="tel" 
            id="phone" 
            name="phone" 
            value={formData.phone} 
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="serviceType">Type of Inquiry</label>
        <select 
          id="serviceType" 
          name="serviceType" 
          value={formData.serviceType} 
          onChange={handleChange}
        >
          <option value="">Please Select</option>
          <option value="appointment">Appointment Booking</option>
          <option value="medical-records">Medical Records Request</option>
          <option value="general-inquiry">General Health Inquiry</option>
          <option value="emergency">Emergency Information</option>
          <option value="feedback">Feedback/Complaints</option>
          <option value="other">Other</option>
        </select>
      </div>
      
      <div className="form-group">
        <label htmlFor="subject">Subject</label>
        <input 
          type="text" 
          id="subject" 
          name="subject" 
          value={formData.subject} 
          onChange={handleChange}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="message">Message *</label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={5}
          placeholder="Please describe how we can help you..."
          required
        />
      </div>
      
      <button type="submit" className="submit-button">
        <i className="bi bi-send"></i>
        Send Message
      </button>
    </form>
  );
};

export default ContactPage;