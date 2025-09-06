import React, { memo } from 'react';
import PropTypes from 'prop-types';

const PatientCommunication = memo(({ communicationType, user, secureApiCall, onRefresh }) => {
  return (
    <div className="patient-communication">
      <h2>{communicationType}</h2>
      <p>Your {communicationType.toLowerCase()} will be managed here.</p>
      <div className="placeholder-content">
        <div className="placeholder-card">
          <h3>{communicationType}</h3>
          <p>This section will contain your {communicationType.toLowerCase()} interface.</p>
        </div>
      </div>
    </div>
  );
});

PatientCommunication.displayName = 'PatientCommunication';

PatientCommunication.propTypes = {
  communicationType: PropTypes.string.isRequired,
  user: PropTypes.object,
  secureApiCall: PropTypes.func,
  onRefresh: PropTypes.func
};

export default PatientCommunication;
