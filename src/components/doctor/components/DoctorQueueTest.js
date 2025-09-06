import React, { useState, useEffect } from 'react';

// Simple test component to debug doctor queue API
const DoctorQueueTest = () => {
  const [queueData, setQueueData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Testing API call to /api/doctor/queue');
      
      const response = await fetch('/api/doctor/queue', {
        headers: {
          'Authorization': `Bearer ${window.__authToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('Queue data received:', data);
        setQueueData(data);
      } else {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        setError(`API Error: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(`Network Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-fetch on mount
    fetchQueue();
  }, []);

  return (
    <div style={{ padding: '20px', border: '2px solid #007bff', margin: '20px', borderRadius: '8px' }}>
      <h3>🧪 Doctor Queue API Test</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={fetchQueue} 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Loading...' : 'Refresh Queue Data'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: '20px', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div>
        <h4>Queue Data ({queueData.length} patients):</h4>
        {queueData.length === 0 ? (
          <p style={{ color: '#666' }}>No patients in queue</p>
        ) : (
          queueData.map((patient, index) => (
            <div 
              key={patient.id || index} 
              style={{ 
                border: '1px solid #ddd', 
                margin: '10px 0', 
                padding: '15px', 
                borderRadius: '4px',
                backgroundColor: '#f9f9f9'
              }}
            >
              <h5>Patient #{index + 1}</h5>
              <p><strong>ID:</strong> {patient.id}</p>
              <p><strong>Patient Name:</strong> "{patient.patientName || 'MISSING'}"</p>
              <p><strong>Service Type:</strong> "{patient.serviceType || 'MISSING'}"</p>
              <p><strong>Status:</strong> {patient.status}</p>
              <p><strong>Age/Gender:</strong> {patient.age} / {patient.gender}</p>
              <p><strong>Contact:</strong> {patient.contactNumber}</p>
              <p><strong>Check-in Time:</strong> {patient.checkInTime}</p>
              <p><strong>Queued At:</strong> {patient.queuedAt}</p>
              <p><strong>Priority:</strong> {patient.priority}</p>
              
              <details style={{ marginTop: '10px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Raw Data</summary>
                <pre style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
                  {JSON.stringify(patient, null, 2)}
                </pre>
              </details>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DoctorQueueTest;
