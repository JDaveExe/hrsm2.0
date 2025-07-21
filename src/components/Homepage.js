import React from "react";
import { Link } from "react-router-dom";
import homeImage from "../images/home.jpg";
import devicesImage from "../images/devices.png";
import ucheckImage from "../images/ucheck.png";
import developerImage from "../images/Developer.png";
import wdesignerImage from "../images/Wdesigner.png";
import xImage from "../images/x.png";
import githubImage from "../images/github.png";
import linkedinImage from "../images/linkedin.png";
import "../styles/Homepage.css";

const Homepage = () => {
  return (
    <div className="homepage">
      {/* Hero Section with Overlaid Feature Boxes */}
      <div className="hero-section" style={{ backgroundImage: `url(${homeImage})` }}>
        <div className="hero-content">
          <h1>Focus on Patient Care,<br />Not Paperwork.</h1>
          <p>A healthcare management system that lets you<br />prioritize what matters most.</p>
        </div>
        
        {/* Feature Boxes Overlaid on Hero Image */}
        <div className="feature-boxes">
          <div className="feature-box">
            <h3>Patient Record Management System</h3>
            <p>Securely store and manage patient data.</p>
          </div>
          
          <div className="feature-box darker">
            <h3>QR Code-Based Access</h3>
            <p>Easily retrieve medical records using QR codes.</p>
          </div>
          
          <div className="feature-box">
            <h3>Consultation and Tracking</h3>
            <p>Doctors can log consultations and patient vitals.</p>
          </div>
        </div>
      </div>

      {/* Smart Healthcare Management Section */}
      <div className="smart-healthcare-section">
        <div className="section-text">
          <h2>Smart Healthcare Management at Your Fingertips™</h2>
          
          <div className="features-icons">
            <div className="feature-icon">
              <img src={ucheckImage} alt="QR Code Scanning" />
              <p>QR Code Scanning</p>
            </div>
            
            <div className="feature-icon">
              <img src={ucheckImage} alt="User-Friendly Dashboard" />
              <p>User-Friendly Dashboard</p>
            </div>
          </div>
        </div>
        
        <div className="devices-container">
          <img src={devicesImage} alt="Manage Your Health Center Anytime, Anywhere" />
          <div className="devices-text">
            <h3>Manage Your Health Center<br />Anytime, Anywhere</h3>
          </div>
        </div>
      </div>

      {/* Meet the Developers Section */}
      <div className="developers-section">
        <h2>Meet the Developers</h2>
        <p>A group of passionate developers who helped us achieve this system.</p>
        
        <div className="developers-container">
          <div className="developer-card">
            <img src={developerImage} alt="Developer" />
            <p>Name</p>
            <div className="social-links">
              <a href="#" onClick={e => e.preventDefault()}><img src={xImage} alt="X" /></a>
              <a href="#" onClick={e => e.preventDefault()}><img src={githubImage} alt="GitHub" /></a>
              <a href="#" onClick={e => e.preventDefault()}><img src={linkedinImage} alt="LinkedIn" /></a>
            </div>
          </div>
          
          <div className="developer-card">
            <img src={wdesignerImage} alt="Designer" />
            <p>Name</p>
            <div className="social-links">
              <a href="#" onClick={e => e.preventDefault()}><img src={xImage} alt="X" /></a>
              <a href="#" onClick={e => e.preventDefault()}><img src={githubImage} alt="GitHub" /></a>
              <a href="#" onClick={e => e.preventDefault()}><img src={linkedinImage} alt="LinkedIn" /></a>
            </div>
          </div>
          
          <div className="developer-card">
            <img src={developerImage} alt="Developer" />
            <p>Name</p>
            <div className="social-links">
              <a href="#" onClick={e => e.preventDefault()}><img src={xImage} alt="X" /></a>
              <a href="#" onClick={e => e.preventDefault()}><img src={githubImage} alt="GitHub" /></a>
              <a href="#" onClick={e => e.preventDefault()}><img src={linkedinImage} alt="LinkedIn" /></a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-300">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-6 md:mb-0">
              <h2 className="text-xl font-bold mb-4">Created with React.js</h2>
              <div className="flex space-x-4">
                <a href="#" onClick={e => e.preventDefault()} aria-label="X (Twitter)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </a>
                <a href="#" onClick={e => e.preventDefault()} aria-label="GitHub">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                  </svg>
                </a>
                <a href="#" onClick={e => e.preventDefault()} aria-label="LinkedIn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect x="2" y="9" width="4" height="12" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div className="mb-6 md:mb-0">
              <h3 className="font-bold mb-4">About</h3>
              <ul className="space-y-2">
                <li><Link to="/about-us" className="hover:underline">About Us</Link></li>
                <li><a href="#" onClick={e => e.preventDefault()} className="hover:underline">News & Updates</a></li>
                <li><a href="#" onClick={e => e.preventDefault()} className="hover:underline">Careers</a></li>
                <li><a href="#" onClick={e => e.preventDefault()} className="hover:underline">Testimonials</a></li>
                <li><a href="#" onClick={e => e.preventDefault()} className="hover:underline">Logos & Branding</a></li>
                <li><a href="#" onClick={e => e.preventDefault()} className="hover:underline">Press</a></li>
              </ul>
            </div>
            
            <div className="mb-6 md:mb-0">
              <h3 className="font-bold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" onClick={e => e.preventDefault()} className="hover:underline">Support Center</a></li>
                <li><a href="#" onClick={e => e.preventDefault()} className="hover:underline">Developer API & SDK</a></li>
                <li><a href="#" onClick={e => e.preventDefault()} className="hover:underline">EHR FAQ</a></li>
                <li><a href="#" onClick={e => e.preventDefault()} className="hover:underline">Medical Form Library</a></li>
                <li><a href="#" onClick={e => e.preventDefault()} className="hover:underline">Insurance Lookup</a></li>
                <li><a href="#" onClick={e => e.preventDefault()} className="hover:underline">ICD & HCPCS Lookup</a></li>
                <li><a href="#" onClick={e => e.preventDefault()} className="hover:underline">App Directory</a></li>
                <li><a href="#" onClick={e => e.preventDefault()} className="hover:underline">Our Podcast</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">LEGAL</h3>
              <ul className="space-y-2">
                <li><Link to="/contact" className="hover:underline">Contact Us</Link></li>
                <li><a href="#" onClick={e => e.preventDefault()} className="hover:underline">Security Policy</a></li>
                <li><a href="#" onClick={e => e.preventDefault()} className="hover:underline">API Policy</a></li>
                <li><a href="#" onClick={e => e.preventDefault()} className="hover:underline">OnPatient Terms of Use</a></li>
                <li><a href="#" onClick={e => e.preventDefault()} className="hover:underline">OnPatient Privacy Policy</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-300 py-4 text-center">
          <p>© 2025 Copyright EverHealth Solutions Inc. DBA Maybunga Healthcenter.</p>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;