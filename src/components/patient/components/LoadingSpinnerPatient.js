import React from 'react';
import '../styles/LoadingSpinnerPatient.css';

const LoadingSpinnerPatient = ({ 
  size = 'medium', 
  message = 'Loading...', 
  overlay = false 
}) => {
  const spinnerClass = `loading-spinner-patient ${size}`;
  
  if (overlay) {
    return (
      <div className="loading-overlay-patient">
        <div className="loading-content-patient">
          <div className={spinnerClass}>
            <div className="spinner-patient"></div>
          </div>
          <p className="loading-message-patient">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="loading-container-patient">
      <div className={spinnerClass}>
        <div className="spinner-patient"></div>
      </div>
      <p className="loading-message-patient">{message}</p>
    </div>
  );
};

export default LoadingSpinnerPatient;
