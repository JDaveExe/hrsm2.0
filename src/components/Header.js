import React, { useState, useEffect, useMemo, memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/LoginSignup.css'; // Navbar & auth shared styles

const Header = memo(() => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const visiblePaths = ['/', '/auth', '/appointments', '/services', '/contact'];

  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  
  useEffect(() => {
    // DISABLED rapid timer to prevent startup crashes (Quick workaround)
    // const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    // return () => clearInterval(timer);
    
    // Update time every minute instead
    const timer = setInterval(() => setCurrentDateTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const shouldShowHeader = useMemo(() => 
    visiblePaths.includes(location.pathname), 
    [location.pathname]
  );

  // Check for special instance modes based on port
  const currentPort = window.location.port;
  const instanceConfig = {
    '3001': { label: '🩺 DOCTOR MODE', color: '#28a745' },
    '3002': { label: '👤 PATIENT MODE', color: '#007bff' },
    '3003': { label: '⚙️ ADMIN MODE', color: '#dc3545' }
  };
  
  const instanceMode = instanceConfig[currentPort];

  const { dateStr, timeStr } = useMemo(() => ({
    dateStr: currentDateTime.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    }),
    timeStr: currentDateTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: true 
    })
  }), [currentDateTime]);

  if (!shouldShowHeader) return null;

  return (
    <header className="site-header">
      {/* Top info bar now shows date/time (previously nav style) */}
      <div className="top-info-bar">
        <div className="top-info-inner">
          <span className="top-date">{dateStr}</span>
          <span className="top-time">{timeStr}</span>
          {instanceMode && (
            <span 
              className="instance-indicator" 
              style={{
                marginLeft: '20px',
                padding: '4px 8px',
                backgroundColor: instanceMode.color,
                color: 'white',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              {instanceMode.label} (Port {currentPort})
            </span>
          )}
        </div>
      </div>
      {/* Main navigation now in blue bar (previously date/time bar) */}
      <nav className="main-navigation">
        <div className="nav-links">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>HOME</Link>
          <Link to="/appointments" className={location.pathname === '/appointments' ? 'active' : ''}>APPOINTMENTS</Link>
          <Link to="/services" className={location.pathname === '/services' ? 'active' : ''}>SERVICES</Link>
          <Link to="/auth" className={location.pathname === '/auth' ? 'active' : ''}>SIGN IN / SIGN UP</Link>
          <Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''}>CONTACT US</Link>
        </div>
      </nav>
    </header>
  );
});

export default Header;
