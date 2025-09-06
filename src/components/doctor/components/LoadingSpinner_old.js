import React from 'react';
import '../styles/LoadingSpinnerDoc.css';

const LoadingSpinnerDoc = ({ message = 'Loading...', size = 'medium' }) => {
  return (
    <div className={`loading-spinner-container-doc ${size}`}>
      <div className="loading-spinner-doc">
        <div className="spinner-ring-doc"></div>
        <div className="spinner-ring-doc"></div>
        <div className="spinner-ring-doc"></div>
        <div className="spinner-ring-doc"></div>
      </div>
      <p className="loading-message-doc">{message}</p>
    </div>
  );
};

export default LoadingSpinnerDoc;
