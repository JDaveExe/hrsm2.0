import React, { memo } from 'react';
import PropTypes from 'prop-types';

const PatientMedicalRecords = memo(({ recordType, user, secureApiCall, onRefresh }) => {
  return (
    <div className="patient-medical-records">
      <h2>{recordType}</h2>
      <p>Your {recordType.toLowerCase()} will be displayed here.</p>
      <div className="placeholder-content">
        <div className="placeholder-card">
          <h3>{recordType}</h3>
          <p>This section will contain your {recordType.toLowerCase()} information.</p>
        </div>
      </div>
    </div>
  );
});

PatientMedicalRecords.displayName = 'PatientMedicalRecords';

PatientMedicalRecords.propTypes = {
  recordType: PropTypes.string.isRequired,
  user: PropTypes.object,
  secureApiCall: PropTypes.func,
  onRefresh: PropTypes.func
};

export default PatientMedicalRecords;
