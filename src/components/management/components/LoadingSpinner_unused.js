import React from 'react';

const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '300px' }}>
      <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
        <span className="visually-hidden">Loading...</span>
      </div>
      <h5 className="text-muted">{message}</h5>
      <p className="text-secondary">Please wait while we load your data...</p>
    </div>
  );
};

export default LoadingSpinner;
