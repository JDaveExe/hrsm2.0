import React, { useState, useEffect } from 'react';
import '../styles/PatientImmunizationHistory.css';

const PatientImmunizationHistory = ({ user, onBack }) => {
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
        const formattedHistory = (Array.isArray(data) ? data : []).map(vaccination => ({
          id: vaccination.id,
          vaccine: vaccination.vaccineName,
          description: vaccination.notes || 'Vaccination administered',
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
      if (vaccineName.includes('bcg') || vaccineName.includes('hepatitis') || 
          vaccineName.includes('pentavalent') || vaccineName.includes('dtp') || 
          vaccineName.includes('mmr') || vaccineName.includes('polio') || 
          vaccineName.includes('pneumococcal') || vaccineName.includes('pcv')) {
        categories.routineChildhood++;
      } else if (vaccineName.includes('covid')) {
        categories.covidSeries++;
      } else if (vaccineName.includes('influenza') || vaccineName.includes('flu')) {
        categories.annual++;
      } else {
        categories.special++;
      }
    });

    return categories;
  };

  const calculateUpcomingVaccinations = (currentVaccines, patientAge) => {
    const upcoming = [];
    const currentVaccineNames = currentVaccines.map(v => v.vaccine.toLowerCase());
    
    if (patientAge >= 18) {
      if (!currentVaccineNames.some(v => v.includes('influenza') || v.includes('flu'))) {
        upcoming.push({
          name: 'Influenza Vaccine (2025)',
          dueDate: 'October 2025',
          description: 'Annual flu shot',
          type: 'annual'
        });
      }
      
      const hasRecentTetanus = currentVaccines.some(v => {
        const vaccineName = v.vaccine.toLowerCase();
        const vaccineDate = new Date(v.dateGiven);
        const tenYearsAgo = new Date();
        tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
        
        return (vaccineName.includes('tetanus') || vaccineName.includes('td') || vaccineName.includes('tdap')) 
               && vaccineDate > tenYearsAgo;
      });
      
      if (!hasRecentTetanus) {
        upcoming.push({
          name: 'Tetanus-Diphtheria (Td)',
          dueDate: 'March 2026',
          description: '10-year booster',
          type: 'booster'
        });
      }
    }
    
    if (!currentVaccineNames.some(v => v.includes('covid'))) {
      upcoming.push({
        name: 'COVID-19 Vaccine',
        dueDate: 'As recommended',
        description: 'Initial series or booster',
        type: 'covid'
      });
    }

    return upcoming;
  };

  const calculateComplianceRate = (currentVaccines, patientAge) => {
    let requiredVaccines = 0;
    let completedVaccines = currentVaccines.length;

    if (patientAge >= 0) requiredVaccines += 2;
    if (patientAge >= 1) requiredVaccines += 5;
    if (patientAge >= 18) requiredVaccines += 2;
    if (patientAge >= 0.5) requiredVaccines += 2;
    
    return Math.min(100, Math.round((completedVaccines / Math.max(requiredVaccines, 1)) * 100));
  };

  const filterVaccinesByCategory = (vaccines, category) => {
    if (category === 'all') return vaccines;
    
    return vaccines.filter(vaccine => {
      const vaccineName = vaccine.vaccine.toLowerCase();
      switch (category) {
        case 'routine':
          return vaccineName.includes('bcg') || vaccineName.includes('hepatitis') || 
                 vaccineName.includes('pentavalent') || vaccineName.includes('dtp') || 
                 vaccineName.includes('mmr') || vaccineName.includes('polio') || 
                 vaccineName.includes('pneumococcal') || vaccineName.includes('pcv');
        case 'covid':
          return vaccineName.includes('covid');
        case 'annual':
          return vaccineName.includes('influenza') || vaccineName.includes('flu');
        case 'special':
          return !vaccineName.includes('bcg') && !vaccineName.includes('hepatitis') && 
                 !vaccineName.includes('pentavalent') && !vaccineName.includes('dtp') && 
                 !vaccineName.includes('mmr') && !vaccineName.includes('polio') && 
                 !vaccineName.includes('pneumococcal') && !vaccineName.includes('pcv') &&
                 !vaccineName.includes('covid') && !vaccineName.includes('influenza') && 
                 !vaccineName.includes('flu');
        default:
          return true;
      }
    });
  };

  const filteredVaccines = filterVaccinesByCategory(immunizationHistory, activeTab);
  const categories = categorizeVaccines(immunizationHistory);
  const patientAge = getPatientAge(user);
  const upcomingVaccines = calculateUpcomingVaccinations(immunizationHistory, patientAge);
  const complianceRate = calculateComplianceRate(immunizationHistory, patientAge);

  if (loading) {
    return (
      <div className="patient-immunization-history">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading immunization history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-immunization-history">
      {error && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle"></i>
          {error}
        </div>
      )}

      {/* Patient Info Card with Integrated Stats */}
      <div className="patient-info-card">
        <div className="patient-details">
          <div className="patient-name">
            <h2>{user.firstName} {user.lastName}</h2>
            <span className="patient-id">Patient ID: PT-{String(user.patientId).padStart(4, '0')}</span>
          </div>
          
          {/* Integrated Summary Statistics */}
          <div className="integrated-stats">
            <div className="stat-card total">
              <div className="stat-value">{immunizationHistory.length}</div>
              <div className="stat-label">Total Vaccines</div>
            </div>
            <div className="stat-card compliance">
              <div className="stat-value" style={{color: complianceRate >= 80 ? '#20c997' : complianceRate >= 60 ? '#ffc107' : '#dc3545'}}>
                {complianceRate}%
              </div>
              <div className="stat-label">Compliance</div>
            </div>
            <div className="stat-card upcoming">
              <div className="stat-value" style={{color: '#17a2b8'}}>{upcomingVaccines.length}</div>
              <div className="stat-label">Due Soon</div>
            </div>
            <div className="stat-card overdue">
              <div className="stat-value" style={{color: '#dc3545'}}>0</div>
              <div className="stat-label">Overdue</div>
            </div>
          </div>
          
          <div className="patient-meta">
            <span><strong>Age:</strong> {patientAge} years old</span>
            <span><strong>Last Vaccination:</strong> {immunizationHistory.length > 0 ? new Date(immunizationHistory[0].dateGiven).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="category-tabs">
        <button 
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Vaccines ({immunizationHistory.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'routine' ? 'active' : ''}`}
          onClick={() => setActiveTab('routine')}
        >
          Routine ({categories.routineChildhood})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'covid' ? 'active' : ''}`}
          onClick={() => setActiveTab('covid')}
        >
          COVID-19 ({categories.covidSeries})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'annual' ? 'active' : ''}`}
          onClick={() => setActiveTab('annual')}
        >
          Annual ({categories.annual})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'special' ? 'active' : ''}`}
          onClick={() => setActiveTab('special')}
        >
          Special ({categories.special})
        </button>
      </div>

      {/* Side by Side Layout for Records and Upcoming */}
      <div className="content-layout">
        {/* Vaccination Records */}
        <div className="vaccination-records">
          <h3>
            <i className="bi bi-shield-check"></i>
            Vaccination Records
          </h3>
          {filteredVaccines.length === 0 ? (
            <div className="no-records">
              <i className="bi bi-shield-x"></i>
              <h4>No Records Found</h4>
              <p>No vaccination records found for this category.</p>
            </div>
          ) : (
            <div className="records-grid">
              {filteredVaccines.map((vaccine) => (
                <div key={vaccine.id} className="vaccine-card">
                  <div className="vaccine-header">
                    <div className="vaccine-name">{vaccine.vaccine}</div>
                    <div className="vaccine-status complete">Complete</div>
                  </div>
                  <div className="vaccine-details">
                    <div className="detail-row">
                      <span className="label">Date Given:</span>
                      <span className="value">{new Date(vaccine.dateGiven).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Dose:</span>
                      <span className="value">{vaccine.dose}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Provider:</span>
                      <span className="value">{vaccine.provider}</span>
                    </div>
                    {vaccine.batchNumber && (
                      <div className="detail-row">
                        <span className="label">Batch:</span>
                        <span className="value">{vaccine.batchNumber}</span>
                      </div>
                    )}
                    {vaccine.administrationSite && (
                      <div className="detail-row">
                        <span className="label">Site:</span>
                        <span className="value">{vaccine.administrationSite}</span>
                      </div>
                    )}
                  </div>
                  <div className="vaccine-description">{vaccine.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Vaccinations */}
        <div className="upcoming-vaccinations">
          <h3>
            <i className="bi bi-calendar-plus"></i>
            Upcoming Vaccinations
          </h3>
          {upcomingVaccines.length > 0 ? (
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
          ) : (
            <div className="no-records">
              <i className="bi bi-calendar-check"></i>
              <h4>No Upcoming Vaccinations</h4>
              <p>All vaccinations are up to date.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default PatientImmunizationHistory;