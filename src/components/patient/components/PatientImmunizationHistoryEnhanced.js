import React, { useState, useEffect } from 'react';
import '../styles/PatientImmunizationHistoryEnhanced.css';

const PatientImmunizationHistoryEnhanced = ({ user, onBack }) => {
  const [immunizationHistory, setImmunizationHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const getPatientAge = (patient) => {
    if (!patient?.dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(patient.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  useEffect(() => {
    if (user?.patientId) {
      fetchImmunizationHistory();
    }
  }, [user?.patientId]);

  const fetchImmunizationHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const authData = JSON.parse(sessionStorage.getItem('authData') || '{}');
      const authToken = authData.token;
      
      if (!authToken) {
        setError('Authentication required');
        return;
      }

      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${baseURL}/api/vaccinations/patient/${user.patientId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const formattedHistory = data.map(vaccination => ({
          id: vaccination.id,
          vaccine: vaccination.vaccineName,
          dateGiven: new Date(vaccination.administeredAt).toISOString().split('T')[0],
          dose: vaccination.dose || 'Dose 1',
          provider: vaccination.administeredBy || 'Healthcare Provider',
          status: 'Complete',
          category: vaccination.category || 'General',
          batchNumber: vaccination.batchNumber,
          expiryDate: vaccination.expiryDate,
          administrationSite: vaccination.administrationSite,
          administrationRoute: vaccination.administrationRoute,
          adverseReactions: vaccination.adverseReactions
        }));

        setImmunizationHistory(formattedHistory);
      } else {
        setError('Failed to load immunization history');
      }
    } catch (err) {
      console.error('Error fetching immunization history:', err);
      setError('Unable to load immunization history');
    } finally {
      setLoading(false);
    }
  };

  const categorizeVaccines = (vaccines) => {
    const categories = {
      routineChildhood: 0,
      covidSeries: 0,
      annual: 0,
      special: 0
    };

    vaccines.forEach(vaccine => {
      const vaccineName = vaccine.vaccine.toLowerCase();
      
      if (vaccineName.includes('covid') || vaccineName.includes('coronavirus')) {
        categories.covidSeries++;
      } else if (vaccineName.includes('flu') || vaccineName.includes('influenza') || 
                 vaccineName.includes('annual') || vaccineName.includes('yearly')) {
        categories.annual++;
      } else if (vaccineName.includes('hepatitis') || vaccineName.includes('mmr') || 
                 vaccineName.includes('dtap') || vaccineName.includes('polio') ||
                 vaccineName.includes('bcg') || vaccineName.includes('dpt')) {
        categories.routineChildhood++;
      } else {
        categories.special++;
      }
    });

    return categories;
  };

  const getFilteredVaccines = () => {
    if (activeTab === 'all') return immunizationHistory;
    
    return immunizationHistory.filter(vaccine => {
      const vaccineName = vaccine.vaccine.toLowerCase();
      
      switch (activeTab) {
        case 'routine':
          return vaccineName.includes('hepatitis') || vaccineName.includes('mmr') || 
                 vaccineName.includes('dtap') || vaccineName.includes('polio') ||
                 vaccineName.includes('bcg') || vaccineName.includes('dpt');
        case 'covid':
          return vaccineName.includes('covid') || vaccineName.includes('coronavirus');
        case 'annual':
          return vaccineName.includes('flu') || vaccineName.includes('influenza') || 
                 vaccineName.includes('annual') || vaccineName.includes('yearly');
        case 'special':
          return !vaccineName.includes('covid') && !vaccineName.includes('coronavirus') &&
                 !vaccineName.includes('flu') && !vaccineName.includes('influenza') &&
                 !vaccineName.includes('hepatitis') && !vaccineName.includes('mmr') &&
                 !vaccineName.includes('dtap') && !vaccineName.includes('polio') &&
                 !vaccineName.includes('bcg') && !vaccineName.includes('dpt');
        default:
          return true;
      }
    });
  };

  const calculateUpcomingVaccinations = (history, patientAge) => {
    const upcoming = [];
    
    // Sample upcoming vaccination logic
    if (patientAge >= 18) {
      const hasRecentFlu = history.some(v => 
        v.vaccine.toLowerCase().includes('flu') && 
        new Date(v.dateGiven) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      );
      
      if (!hasRecentFlu) {
        upcoming.push({
          name: 'Annual Flu Vaccine',
          dueDate: 'September 2025',
          type: 'annual',
          description: 'Recommended annually during flu season'
        });
      }

      const hasRecentTetanus = history.some(v => 
        v.vaccine.toLowerCase().includes('tetanus') && 
        new Date(v.dateGiven) > new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000)
      );
      
      if (!hasRecentTetanus) {
        upcoming.push({
          name: 'Tetanus Booster',
          dueDate: 'October 2025',
          type: 'booster',
          description: 'Required every 10 years for adults'
        });
      }
    }
    
    return upcoming;
  };

  const calculateComplianceRate = (history, age) => {
    // Simple compliance calculation based on age and expected vaccines
    const expectedVaccinesForAge = age < 18 ? Math.min(age * 2, 20) : 15;
    const actualVaccines = history.length;
    return Math.min(Math.round((actualVaccines / expectedVaccinesForAge) * 100), 100);
  };

  const patientAge = getPatientAge(user);
  const categories = categorizeVaccines(immunizationHistory);
  const filteredVaccines = getFilteredVaccines();
  const upcomingVaccines = calculateUpcomingVaccinations(immunizationHistory, patientAge);
  const complianceRate = calculateComplianceRate(immunizationHistory, patientAge);

  if (loading) {
    return (
      <div className="patient-immunization-enhanced">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your immunization records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-immunization-enhanced">
      {/* Header with patient colors */}
      <div className="immun-header">
        <button className="back-btn" onClick={onBack}>
          <i className="bi bi-arrow-left"></i>
          Back to Dashboard
        </button>
        <div className="header-content">
          <div className="header-title">
            <i className="bi bi-shield-check"></i>
            <h1>Immunization History</h1>
          </div>
          <p className="header-subtitle">Your complete vaccination records and health protection status</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle"></i>
          {error}
        </div>
      )}

      {/* Patient Information Card */}
      <div className="patient-info-section">
        <div className="patient-details-card">
          <div className="patient-info">
            <div className="patient-name-section">
              <h2>{user?.firstName} {user?.lastName}</h2>
              <span className="patient-id">Patient ID: PT-{String(user?.patientId || '0000').padStart(4, '0')}</span>
            </div>
            <div className="patient-stats">
              <div className="stat-item">
                <span className="stat-label">Age:</span>
                <span className="stat-value">{patientAge} years old</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Vaccines:</span>
                <span className="stat-value">{immunizationHistory.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Last Vaccination:</span>
                <span className="stat-value">
                  {immunizationHistory.length > 0 
                    ? new Date(immunizationHistory[0].dateGiven).toLocaleDateString() 
                    : 'N/A'}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Status:</span>
                <span className={`stat-value status ${complianceRate >= 80 ? 'up-to-date' : 'needs-attention'}`}>
                  {complianceRate >= 80 ? 'Up to Date' : 'Needs Attention'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Statistics Cards */}
      <div className="summary-cards">
        <div className="summary-card total-vaccines">
          <div className="card-icon">
            <i className="bi bi-shield-check"></i>
          </div>
          <div className="card-content">
            <div className="card-value">{immunizationHistory.length}</div>
            <div className="card-label">Total Vaccines</div>
          </div>
        </div>
        <div className="summary-card compliance-rate">
          <div className="card-icon">
            <i className="bi bi-graph-up"></i>
          </div>
          <div className="card-content">
            <div className={`card-value ${complianceRate >= 80 ? 'good' : complianceRate >= 60 ? 'warning' : 'danger'}`}>
              {complianceRate}%
            </div>
            <div className="card-label">Compliance Rate</div>
          </div>
        </div>
        <div className="summary-card upcoming">
          <div className="card-icon">
            <i className="bi bi-calendar-plus"></i>
          </div>
          <div className="card-content">
            <div className="card-value">{upcomingVaccines.length}</div>
            <div className="card-label">Due Soon</div>
          </div>
        </div>
        <div className="summary-card overdue">
          <div className="card-icon">
            <i className="bi bi-exclamation-triangle"></i>
          </div>
          <div className="card-content">
            <div className="card-value">0</div>
            <div className="card-label">Overdue</div>
          </div>
        </div>
      </div>

      {/* Vaccination Category Tabs */}
      <div className="vaccination-tabs">
        <button 
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <span className="tab-icon routine-childhood">●</span>
          All Vaccines ({immunizationHistory.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'routine' ? 'active' : ''}`}
          onClick={() => setActiveTab('routine')}
        >
          <span className="tab-icon routine-childhood">●</span>
          Routine Childhood ({categories.routineChildhood})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'covid' ? 'active' : ''}`}
          onClick={() => setActiveTab('covid')}
        >
          <span className="tab-icon covid-series">●</span>
          COVID-19 Series ({categories.covidSeries})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'annual' ? 'active' : ''}`}
          onClick={() => setActiveTab('annual')}
        >
          <span className="tab-icon annual">●</span>
          Annual Vaccines ({categories.annual})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'special' ? 'active' : ''}`}
          onClick={() => setActiveTab('special')}
        >
          <span className="tab-icon special">●</span>
          Special ({categories.special})
        </button>
      </div>

      {/* Vaccination Records Table */}
      <div className="vaccination-records-section">
        {filteredVaccines.length === 0 ? (
          <div className="no-records">
            <div className="no-records-icon">
              <i className="bi bi-shield-x"></i>
            </div>
            <h3>No Immunization Records</h3>
            <p>No vaccination records found for this patient.</p>
          </div>
        ) : (
          <div className="records-table-container">
            <table className="immunization-table">
              <thead>
                <tr>
                  <th>Vaccine</th>
                  <th>Date Given</th>
                  <th>Dose</th>
                  <th>Provider</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVaccines.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <div className="vaccine-info">
                        <div className="vaccine-name">{record.vaccine}</div>
                        {record.batchNumber && (
                          <small className="batch-number">Batch: {record.batchNumber}</small>
                        )}
                      </div>
                    </td>
                    <td>{new Date(record.dateGiven).toLocaleDateString()}</td>
                    <td>{record.dose}</td>
                    <td>{record.provider}</td>
                    <td>
                      <span className="status-badge complete">
                        <i className="bi bi-check-circle"></i>
                        Complete
                      </span>
                    </td>
                    <td>
                      <button 
                        className="action-btn view-details"
                        onClick={() => alert(`Vaccine Details:\n\nVaccine: ${record.vaccine}\nDate: ${record.dateGiven}\nProvider: ${record.provider}\nSite: ${record.administrationSite || 'Not specified'}\nRoute: ${record.administrationRoute || 'Not specified'}\nAdverse Reactions: ${record.adverseReactions || 'None'}`)}
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upcoming Vaccinations */}
      {upcomingVaccines.length > 0 && (
        <div className="upcoming-vaccinations-section">
          <h3>
            <i className="bi bi-calendar-plus"></i>
            Upcoming Vaccinations
          </h3>
          <div className="upcoming-grid">
            {upcomingVaccines.map((vaccine, index) => (
              <div key={index} className={`upcoming-card ${vaccine.type}`}>
                <div className="upcoming-header">
                  <div className="upcoming-name">{vaccine.name}</div>
                  <div className="upcoming-type">{vaccine.type}</div>
                </div>
                <div className="upcoming-details">
                  <div className="upcoming-due">Due: {vaccine.dueDate}</div>
                  <div className="upcoming-description">{vaccine.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="action-btn primary" onClick={() => alert('Immunization card generation feature coming soon!')}>
          <i className="bi bi-card-text"></i>
          Generate Immunization Card
        </button>
        <button className="action-btn secondary" onClick={() => alert('Export feature coming soon!')}>
          <i className="bi bi-download"></i>
          Export History
        </button>
      </div>
    </div>
  );
};

export default PatientImmunizationHistoryEnhanced;