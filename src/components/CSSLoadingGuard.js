import React, { useEffect, useState } from 'react';

const CSSLoadingGuard = ({ children }) => {
  const [cssStatus, setCssStatus] = useState('checking');
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    // Much simpler, safer approach - just add the class after a brief delay
    // The CSS will handle the specific icon issues without hiding content
    const timer = setTimeout(() => {
      document.body.classList.add('styles-loaded');
      setCssStatus('loaded');
      setShowFallback(false);
    }, 100); // Very short delay, just enough for initial render

    return () => clearTimeout(timer);
  }, []);

  if (cssStatus === 'critical-failure') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Arial, sans-serif',
        zIndex: 9999
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          maxWidth: '500px',
          margin: '20px'
        }}>
          <h2 style={{ color: '#dc3545', marginBottom: '20px' }}>
            ⚠️ Styling Issue Detected
          </h2>
          <p style={{ marginBottom: '20px', lineHeight: '1.5' }}>
            The application's stylesheets failed to load properly. 
            This can happen due to network issues or browser cache problems.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '5px',
              cursor: 'pointer',
              margin: '5px',
              fontSize: '16px'
            }}
          >
            🔄 Reload Page
          </button>
          <button 
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            }}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '5px',
              cursor: 'pointer',
              margin: '5px',
              fontSize: '16px'
            }}
          >
            🗑️ Clear Cache & Reload
          </button>
        </div>
      </div>
    );
  }

  if (showFallback) {
    return (
      <div>
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          backgroundColor: '#fff3cd',
          color: '#856404',
          padding: '10px 15px',
          borderRadius: '5px',
          border: '1px solid #ffeaa7',
          zIndex: 1000,
          fontSize: '14px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          ⚠️ Loading backup stylesheets...
        </div>
        {children}
      </div>
    );
  }

  return children;
};

export default CSSLoadingGuard;
