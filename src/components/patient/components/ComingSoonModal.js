import React from 'react';
import PropTypes from 'prop-types';
import './PatientMedicalRecords.css';

const ComingSoonModal = ({ isOpen, onClose, featureName = "Immunizations" }) => {
  if (!isOpen) return null;

  // Dynamic content based on feature
  const getFeatureContent = () => {
    switch (featureName) {
      case 'Health Tracking':
        return {
          icon: 'bi bi-heart-pulse',
          features: [
            'Real-time vital signs monitoring',
            'Health metrics tracking and trends',
            'Personalized health insights with AI',
            'Activity and wellness goal setting',
            'Integration with wearable devices'
          ]
        };
      case 'Immunizations':
      default:
        return {
          icon: 'bi bi-shield-plus',
          features: [
            'Complete immunization history tracking',
            'Vaccination schedule management',
            'Reminder notifications for upcoming vaccines',
            'Digital vaccination certificates',
            'Integration with healthcare providers'
          ]
        };
    }
  };

  const content = getFeatureContent();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="coming-soon-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h4 className="modal-title">
            <i className="bi bi-tools"></i>
            Feature Under Development
          </h4>
          <button 
            className="btn-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        
        <div className="modal-body">
          <div className="coming-soon-content">
            <div className="feature-icon">
              <i className={content.icon}></i>
            </div>
            
            <h5 className="feature-title">{featureName}</h5>
            
            <p className="feature-description">
              The {featureName.toLowerCase()} feature is currently under development. 
              Our development team is working hard to bring you this functionality soon.
            </p>
            
            <div className="feature-details">
              <h6>What's Coming:</h6>
              <ul>
                {content.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
            
            <div className="timeline-info">
              <div className="timeline-item">
                <i className="bi bi-clock"></i>
                <span>Expected Release: IDK</span>
              </div>
              <div className="timeline-item">
                <i className="bi bi-gear"></i>
                <span>Current Status: In Development</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            className="btn btn-primary"
            onClick={onClose}
          >
            <i className="bi bi-check-circle"></i>
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};

ComingSoonModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  featureName: PropTypes.string
};

export default ComingSoonModal;
