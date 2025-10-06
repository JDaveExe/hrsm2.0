import React, { useState, useCallback, memo, useEffect } from 'react';
import PropTypes from 'prop-types';
import './PatientMedicalRecords.css';

const PatientSettings = memo(({ user, secureApiCall, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Login history data state
  const [loginHistory, setLoginHistory] = useState([]);

  // Fetch login history data
  const fetchHistoryData = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Get auth token from session storage
      const authData = sessionStorage.getItem('authData');
      const token = authData ? JSON.parse(authData).token : null;
      
      if (!token) {
        setError('Authentication token not found');
        setLoading(false);
        return;
      }

      // Fetch real login history from backend
      const response = await fetch('/api/audit/login-history', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch login history');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setLoginHistory(result.data);
      } else {
        throw new Error(result.msg || 'Failed to load login history');
      }
    } catch (error) {
      console.error('Error fetching login history:', error);
      setError('Unable to load login history');
      // Fallback to empty array instead of static data
      setLoginHistory([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchHistoryData();
  }, [fetchHistoryData]);



  const exportData = useCallback(async () => {
    try {
      const data = {
        userInfo: {
          name: `${user?.firstName} ${user?.lastName}`,
          patientId: user?.patientId,
          exportDate: new Date().toISOString()
        },
        loginHistory
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `patient-data-${user?.patientId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  }, [loginHistory, user]);



  const renderHistory = () => (
    <div className="settings-section">
      <div className="section-header">
        <div className="section-title">
          <i className="bi bi-clock-history"></i>
          <h3>Login History</h3>
        </div>
        <button className="btn btn-primary btn-sm" onClick={exportData}>
          <i className="bi bi-download"></i>
          Export Data
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <i className="bi bi-hourglass-split"></i>
          <p>Loading login history...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      ) : (
        <div className="history-grid">
          {/* Login History */}
          <div className="history-card">
            <div className="history-header">
              <i className="bi bi-shield-lock"></i>
              <h4>Recent Login Activity</h4>
              <span className="count-badge">{loginHistory.length}</span>
            </div>
            <div className="history-content">
              {loginHistory.length === 0 ? (
                <div className="empty-state" style={{ textAlign: 'center', padding: '2rem' }}>
                  <i className="bi bi-clock-history" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
                  <p>No login history available yet</p>
                  <small className="text-muted">Your login activity will appear here</small>
                </div>
              ) : (
                <div className="history-list">
                  {loginHistory.map((login, index) => (
                    <div key={login.id || index} className="history-item">
                      <span className="date">{login.date} at {login.time}</span>
                      <span className="description">{login.device} - {login.location}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="data-management">
        <div className="alert alert-info">
          <i className="bi bi-info-circle"></i>
          <div>
            <strong>Data Management:</strong> You can export your login history.
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="patient-records-container">
      {/* Page Header */}
      <div className="records-header">
        <div className="section-title">
          <i className="bi bi-clock-history"></i>
          <h2>History</h2>
          <span className="count-badge">{loginHistory.length} items</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="records-content">
        {renderHistory()}
      </div>
    </div>
  );
});

PatientSettings.displayName = 'PatientSettings';

PatientSettings.propTypes = {
  user: PropTypes.object,
  secureApiCall: PropTypes.func,
  onRefresh: PropTypes.func
};

export default PatientSettings;
