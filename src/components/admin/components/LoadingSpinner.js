import React, { memo } from 'react';
import '../styles/LoadingSpinner.css';

const LoadingSpinner = memo(({ 
  message = 'Loading...', 
  size = 'medium', 
  overlay = true,
  color = 'primary' 
}) => {
  const spinnerClass = `loading-spinner-component size-${size} color-${color}`;
  
  if (overlay) {
    return (
      <div className="loading-overlay">
        <div className="loading-content">
          <div className={spinnerClass}>
            <div className="spinner"></div>
          </div>
          {message && <p className="loading-message">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="loading-inline">
      <div className={spinnerClass}>
        <div className="spinner"></div>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
