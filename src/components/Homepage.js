import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import homeImage from "../images/home.jpg";
import devicesImage from "../images/devices.png";
import ucheckImage from "../images/ucheck.png";
import sealMainImage from "../images/sealmain.png";
import sealGovImage from "../images/sealgov.png";
import "../styles/Homepage.css";

const Homepage = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    // DISABLED timer to prevent reload issues (Quick workaround)
    // const timer = setInterval(() => {
    //   setCurrentDateTime(new Date());
    // }, 1000);
    // return () => clearInterval(timer);
    
    // Set time once only
    setCurrentDateTime(new Date());
  }, []);

  const formatDate = (date) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: true 
    });
  };
  return (
  <div className="homepage">

      {/* Government Header Section - Pasig Style */}
      <div className="government-header">
        <div className="government-header-content">
          <div className="government-seal-container">
            <img src={sealGovImage} alt="Government Seal" className="main-government-seal" />
          </div>
          <div className="government-text">
            <h1 className="government-title">BARANGAY MAYBUNGA</h1>
            <h2 className="government-subtitle">HEALTHCARE MANAGEMENT SYSTEM</h2>
            <p className="government-tagline">Digital Health Services for the Community</p>
          </div>
          <div className="barangay-seal-container">
            <img src={sealMainImage} alt="Barangay Maybunga Seal" className="barangay-seal" />
          </div>
        </div>
      </div>

      {/* Blue Banner Section - Pasig Style */}
      <div className="blue-banner-section">
        <div className="banner-content">
          <div className="banner-left">
            <div className="info-circle">
              <span className="info-icon">i</span>
            </div>
          </div>
          <div className="banner-center">
            <h2 className="banner-title">HEALTHCARE MANAGEMENT SYSTEM</h2>
            <p className="banner-subtitle">Digital Health Services for the Community</p>
          </div>
          <div className="banner-right">
            <div className="hero-actions">
              <Link to="/auth" className="cta-button primary">Patient Portal</Link>
              <Link to="/contact" className="cta-button secondary">Emergency Contact</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Services Section */}
      <div className="quick-services">
        <div className="container">
          <h2>Our Services</h2>
          <div className="services-row">
            <div className="service-card">
              <div className="service-icon">🏥</div>
              <h3>General Consultation</h3>
              <p>Primary healthcare services for all ages</p>
            </div>
            <div className="service-card">
              <div className="service-icon">💉</div>
              <h3>Immunization</h3>
              <p>Vaccination programs for children and adults</p>
            </div>
            <div className="service-card">
              <div className="service-icon">🩺</div>
              <h3>Health Monitoring</h3>
              <p>Regular check-ups and vital signs tracking</p>
            </div>
            <div className="service-card">
              <div className="service-icon">📋</div>
              <h3>Medical Records</h3>
              <p>Secure digital health record management</p>
            </div>
          </div>
        </div>
      </div>

      {/* About Section - Enhanced with AboutUs Content */}
      <div className="about-section">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <h2>About Barangay Maybunga Healthcare Management System</h2>
              <p>
                Improving healthcare through innovation is at the heart of Maybunga Health Center's work. 
                We provide electronic health records (EHR), practice management, and revenue cycle management 
                solutions that help practices grow profitably, remain compliant, work more efficiently, and 
                improve patient outcomes.
              </p>
              <p>
                Maybunga Health Center was established to serve the growing healthcare needs of the community. 
                Over the years, it has evolved from a small local clinic into a modern healthcare facility, 
                providing accessible and quality medical services with integrated digital healthcare solutions.
              </p>
            </div>
            <div className="about-image">
              <img src={require('../images/center.jpg')} alt="Barangay Maybunga Health Center" />
            </div>
          </div>
        </div>
      </div>

      {/* Health Programs Section */}
      <div className="health-programs-section">
        <div className="container">
          <h2>Community Health Programs</h2>
          <p>Comprehensive health initiatives for every member of our community</p>
          <div className="programs-grid">
            <div className="program-card">
              <div className="program-header">
                <div className="program-icon">👶</div>
                <h3>Maternal & Child Health</h3>
              </div>
              <ul className="program-features">
                <li>Prenatal care and check-ups</li>
                <li>Newborn screening</li>
                <li>Child immunization</li>
                <li>Nutrition counseling</li>
              </ul>
            </div>
            <div className="program-card">
              <div className="program-header">
                <div className="program-icon">👴</div>
                <h3>Senior Citizen Care</h3>
              </div>
              <ul className="program-features">
                <li>Regular health monitoring</li>
                <li>Free medicine program</li>
                <li>Physical therapy sessions</li>
                <li>Health education</li>
              </ul>
            </div>
            <div className="program-card">
              <div className="program-header">
                <div className="program-icon">💊</div>
                <h3>Chronic Disease Management</h3>
              </div>
              <ul className="program-features">
                <li>Diabetes monitoring</li>
                <li>Hypertension management</li>
                <li>Regular consultations</li>
                <li>Lifestyle counseling</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Pasig Style */}
      <footer className="government-footer">
        <div className="footer-content">
          <div className="footer-section vision-section">
            <h3 className="footer-title">Vision</h3>
            <p className="vision-text">
              Barangay Maybunga Healthcare Management System envisions to be the premier 
              digital healthcare platform that provides accessible, quality, and comprehensive 
              health services to all community members. We are committed to delivering 
              innovative healthcare solutions through technology, promoting health equity, 
              and fostering a healthy, resilient community guided by transparency, 
              accountability, and patient-centered care.
            </p>
            
            {/* Compact Contact & Hours */}
            <div className="footer-info-compact">
              <div className="info-row">
                <span className="info-label">🚨 Emergency:</span>
                <span>911 | (02) 8123-4567</span>
              </div>
              <div className="info-row">
                <span className="info-label">🕐 Hours:</span>
                <span>Mon-Fri: 8AM-5PM | Sat: 8AM-12PM | Sun: Emergency Only</span>
              </div>
              <div className="info-row">
                <span className="info-label">📍 Location:</span>
                <span>123 Maybunga Street, Pasig City | health@maybunga.gov.ph</span>
              </div>
            </div>
          </div>
          
          <div className="footer-section portals-section">
            <h3 className="footer-title">Portals</h3>
            <ul className="portals-list">
              <li><Link to="/auth" className="portal-link">Patient Portal</Link></li>
              <li><Link to="/contact" className="portal-link">Book Appointment</Link></li>
              <li><a href="#" onClick={e => e.preventDefault()} className="portal-link">Telemedicine</a></li>
              <li><a href="#" onClick={e => e.preventDefault()} className="portal-link">Health Records</a></li>
              <li><a href="#" onClick={e => e.preventDefault()} className="portal-link">Lab Results</a></li>
              <li><a href="#" onClick={e => e.preventDefault()} className="portal-link">Vaccination Schedule</a></li>
              <li><a href="#" onClick={e => e.preventDefault()} className="portal-link">Emergency Hotline</a></li>
              <li><a href="#" onClick={e => e.preventDefault()} className="portal-link">Health Programs</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <div className="social-media-section">
              <div className="social-icons">
                <a href="#" onClick={e => e.preventDefault()} aria-label="X (Twitter)" className="social-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </a>
                <a href="#" onClick={e => e.preventDefault()} aria-label="GitHub" className="social-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                  </svg>
                </a>
                <a href="#" onClick={e => e.preventDefault()} aria-label="LinkedIn" className="social-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect x="2" y="9" width="4" height="12" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="copyright-section">
              <p>© 2025 Barangay Maybunga Healthcare Management System. All Rights Reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;