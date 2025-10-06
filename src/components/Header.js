import React, { useState, useEffect, useMemo, memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/LoginSignup.css'; // Navbar & auth shared styles

const Header = memo(() => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const visiblePaths = ['/', '/auth', '/health-stock', '/services', '/contact'];

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
        </div>
      </div>
      {/* Main navigation now in blue bar (previously date/time bar) */}
      <nav className="main-navigation">
        <div className="nav-links">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>HOME</Link>
          <Link to="/health-stock" className={location.pathname === '/health-stock' ? 'active' : ''}>HEALTH STOCK</Link>
          <Link to="/services" className={location.pathname === '/services' ? 'active' : ''}>SERVICES</Link>
          <Link to="/auth" className={location.pathname === '/auth' ? 'active' : ''}>SIGN IN / SIGN UP</Link>
          <Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''}>CONTACT US</Link>
        </div>
      </nav>
    </header>
  );
});

export default Header;
