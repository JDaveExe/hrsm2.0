import React from 'react';
import '../styles/LoadingSpinnerDoc.css';

const LoadingSpinnerDoc = ({ size = 'medium', message = 'Loading...' }) => {
  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'spinner-doc-small';
      case 'large': return 'spinner-doc-large';
      default: return 'spinner-doc-medium';
    }
  };

  return (
    <div className="loading-spinner-doc-container">
      <div className={`loading-spinner-doc ${getSizeClass()}`}>
        <div className="spinner-doc-ring spinner-doc-ring-1"></div>
        <div className="spinner-doc-ring spinner-doc-ring-2"></div>
        <div className="spinner-doc-ring spinner-doc-ring-3"></div>
      </div>
      {message && <p className="loading-spinner-doc-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinnerDoc;