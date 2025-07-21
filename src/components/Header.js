import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/LoginSignup.css'; // Assuming navbar styles are here

const Header = () => {
  const location = useLocation();
  const visiblePaths = ['/', '/auth', '/services', '/about-us', '/contact'];

  if (!visiblePaths.includes(location.pathname)) {
    return null;
  }
  
  return (
    <nav className="navbar fixed-top">
      <div className="container-fluid">
        <Link to="/" className="navbar-brand">Maybunga Health Center</Link>
        <div className="navbar-links">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>HOME</Link>
          <Link to="/auth" className={location.pathname === '/auth' ? 'active' : ''}>SIGN IN / SIGN UP</Link>
          <Link to="/services" className={location.pathname === '/services' ? 'active' : ''}>SERVICES</Link>
          <Link to="/about-us" className={location.pathname === '/about-us' ? 'active' : ''}>ABOUT US</Link>
          <Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''}>CONTACT US</Link>
        </div>
      </div>
    </nav>
  );
};

export default Header;
