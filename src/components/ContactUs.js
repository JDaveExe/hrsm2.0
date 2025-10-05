import React, { useState } from 'react';
import '../styles/ContactUs.css';

const ContactPage = () => {
  return (
    <div className="contact-us-page">
      {/* Header Section */}
      <div className="contact-us-header">
        <div className="contact-us-container">
          <h1 className="contact-us-title">Contact Our Healthcare Center</h1>
          <p className="contact-us-subtitle">
            We're here to help with your healthcare needs. Get in touch with us for appointments, 
            medical records, or any questions about our services.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="contact-us-content">
        <div className="contact-us-container">
          <div className="contact-us-cards-grid">
            <div className="contact-us-info-card">
              <div className="contact-us-card-header">
                <i className="bi bi-geo-alt-fill contact-us-icon"></i>
                <h3>Visit Our Health Center</h3>
              </div>
              <div className="contact-us-card-content">
                <p><strong>Barangay Health Center</strong></p>
                <p>123 Healthcare Street</p>
                <p>Barangay Community, City 12345</p>
                <p>Philippines</p>
              </div>
            </div>

            <div className="contact-us-info-card">
              <div className="contact-us-card-header">
                <i className="bi bi-telephone-fill contact-us-icon"></i>
                <h3>Call Us</h3>
              </div>
              <div className="contact-us-card-content">
                <p><strong>Main Line:</strong> <a href="tel:+63026428645">+63 026428645</a></p>
              </div>
            </div>

            <div className="contact-us-info-card">
              <div className="contact-us-card-header">
                <i className="bi bi-envelope-fill contact-us-icon"></i>
                <h3>Email Us</h3>
              </div>
              <div className="contact-us-card-content">
                <p><strong>General Inquiries:</strong> <a href="mailto:maybungafloodwayhc@gmail.com">maybungafloodwayhc@gmail.com</a></p>
              </div>
            </div>
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
    <form className="contact-us-form" onSubmit={handleSubmit}>
      <div className="contact-us-form-row">
        <div className="contact-us-form-group">
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
        
        <div className="contact-us-form-group">
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
      
      <div className="contact-us-form-row">
        <div className="contact-us-form-group">
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
        
        <div className="contact-us-form-group">
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

      <div className="contact-us-form-group">
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
      
      <div className="contact-us-form-group">
        <label htmlFor="subject">Subject</label>
        <input 
          type="text" 
          id="subject" 
          name="subject" 
          value={formData.subject} 
          onChange={handleChange}
        />
      </div>
      
      <div className="contact-us-form-group">
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
      
      <button type="submit" className="contact-us-submit-button">
        <i className="bi bi-send contact-us-send-icon"></i>
        Send Message
      </button>
    </form>
  );
};

export default ContactPage;