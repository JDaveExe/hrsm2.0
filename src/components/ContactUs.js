import React, { useState } from 'react';
import '../styles/ContactUs.css';
import phoneIcon from '../images/phone.png';
import mailIcon from '../images/mail.png';

const ContactPage = () => {
  return (
    <div className="contact-page">
      <div className="contact-container">
      <div className="left-section">
        <h2 className="contact-title">Contact Us</h2>
        
        <div className="section">
          <h3 className="section-title">Medical Record Request Status</h3>
          <p className="section-text">
            To check on the status of your medical record request, please call or email us 
            with the following information:
          </p>
          <ul className="info-list">
            <li>Patient's First Name</li>
            <li>Patient's Last Name</li>
          </ul>
          <div className="contact-detail">
            <div className="contact-item">
              <img src={phoneIcon} alt="Phone" className="contact-icon" />
              <a href="tel:8662947183">(866) 294-7183</a>
            </div>
            <div className="contact-item">
              <img src={mailIcon} alt="Email" className="contact-icon" />
              <a href="mailto:info@maybungahaalthcenter.com">info@maybungahaalthcenter.com</a>
            </div>
          </div>
        </div>
        
        <div className="section">
          <h3 className="section-title">Client Support for Existing Storage & Shred Clients</h3>
          <p className="section-text">
            Do you need help placing an order or help with an existing order or other service needs? 
            We've got you covered.
          </p>
          <p className="section-text">
            Please reach out to your <a href="#" className="link-text">local HealthCenter</a> for prompt assistance.
          </p>
        </div>
        
        <div className="section">
          <h3 className="section-title">Sales Inquiries</h3>
          <p className="section-text">
            Interested in our services? Reach out to us by filling out the form to the right for a 
            custom information management solution to fit all of your secure document storage, 
            destruction, and imaging needs.
          </p>
          <div className="contact-detail">
            <div className="contact-item">
            <img src={phoneIcon} alt="Phone" className="contact-icon" />
              <a href="tel:8662947183">(866) 294-7183</a>
            </div>
            <div className="contact-item">
              <img src={mailIcon} alt="Email" className="contact-icon" />
              <a href="mailto:info@maybungahaalthcenter.com">info@maybungahaalthcenter.com</a>
            </div>
          </div>
        </div>
      </div>
      
      <div className="right-section">
        <div className="quote-form">
          <h3 className="form-title">Request a Quote</h3>
          <QuoteRequestForm />        </div>
      </div>
    </div>
    </div>
  );
};

const QuoteRequestForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    suffix: '',
    email: '',
    phoneNumber: '',
    areaOfInterest: '',
    message: ''
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
    console.log(formData);
  };

  return (
    <form className="quote-request-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="firstName">First Name</label>
          <input 
            type="text" 
            id="firstName" 
            name="firstName" 
            value={formData.firstName} 
            onChange={handleChange} 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="lastName">Last Name</label>
          <input 
            type="text" 
            id="lastName" 
            name="lastName" 
            value={formData.lastName} 
            onChange={handleChange} 
          />
        </div>
        
        <div className="form-group suffix-group">
          <label htmlFor="suffix">Suffix</label>
          <input 
            type="text" 
            id="suffix" 
            name="suffix" 
            value={formData.suffix} 
            onChange={handleChange} 
          />
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            value={formData.email} 
            onChange={handleChange} 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="phoneNumber">Phone Number</label>
          <input 
            type="tel" 
            id="phoneNumber" 
            name="phoneNumber" 
            value={formData.phoneNumber} 
            onChange={handleChange} 
          />
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="areaOfInterest">Area of Interest</label>
        <select 
          id="areaOfInterest" 
          name="areaOfInterest" 
          value={formData.areaOfInterest} 
          onChange={handleChange}
        >
          <option value="">Please Select</option>
          <option value="storage">Document Storage</option>
          <option value="shredding">Document Shredding</option>
          <option value="imaging">Document Imaging</option>
          <option value="records">Medical Records</option>
        </select>
      </div>
      
      <div className="form-group">
        <label htmlFor="message">How can we Help?</label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={4}
        />
      </div>
      
      <button type="submit" className="submit-button">Submit</button>
    </form>
  );
};

export default ContactPage;