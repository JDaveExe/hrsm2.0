import React, { useState, useEffect } from 'react';
import { Accordion } from 'react-bootstrap';
import { useData } from '../../../context/DataContext';
import LoadingSpinnerDoc from './LoadingSpinnerDoc';
import '../styles/Checkups.css';

// Medication Item Component
import MedicationItem from './MedicationItem';

const Checkups = ({ currentDateTime, user, secureApiCall }) => {
  const { 
    doctorCheckupsData: initialDoctorCheckupsData, 
    updateCheckupStatus, 
    updateCheckupNotes,
    refreshDoctorCheckups 
  } = useData();
  
  const [doctorCheckupsData, setDoctorCheckupsData] = useState(initialDoctorCheckupsData);
  const [selectedCheckup, setSelectedCheckup] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterTab, setFilterTab] = useState('ongoing');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // New state to manage active accordion keys
  const [activeKey, setActiveKey] = useState(null);

  // Pagination and sorting state
  const [currentPage, setCurrentPage] = useState(1);
  const [timeFilter, setTimeFilter] = useState('all');
  const itemsPerPage = 10;

  // Reset accordion state when changing tabs
  useEffect(() => {
    setActiveKey(null);
    setCurrentPage(1); // Reset to first page when changing tabs
  }, [filterTab, timeFilter]);

  // Filter checkups by time range
  const filterByTimeRange = (checkups) => {
    if (timeFilter === 'all') return checkups;
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeFilter) {
      case '2days':
        cutoffDate.setDate(now.getDate() - 2);
        break;
      case '2weeks':
        cutoffDate.setDate(now.getDate() - 14);
        break;
      case '3months':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      default:
        return checkups;
    }
    
    return checkups.filter(checkup => {
      const checkupDate = new Date(checkup.completedAt || checkup.updatedAt || checkup.createdAt);
      return checkupDate >= cutoffDate;
    });
  };

  // Filter and sort checkups
  const getFilteredCheckups = () => {
    let filtered = doctorCheckupsData;
    
    // Filter by status
    if (filterTab === 'ongoing') {
      filtered = filtered.filter(checkup => 
        checkup.status === 'in-progress' || checkup.status === 'started' || checkup.status === 'transferred'
      );
    } else if (filterTab === 'finished') {
      filtered = filtered.filter(checkup => checkup.status === 'completed');
      // Get only recent finished (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      filtered = filtered.filter(checkup => {
        const completedDate = new Date(checkup.completedAt || checkup.updatedAt);
        return completedDate >= yesterday;
      });
    } else if (filterTab === 'history') {
      filtered = filtered.filter(checkup => checkup.status === 'completed');
      filtered = filterByTimeRange(filtered);
    }
    
    // Sort by completion time (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.completedAt || a.updatedAt || a.createdAt);
      const dateB = new Date(b.completedAt || b.updatedAt || b.createdAt);
      return dateB - dateA;
    });
    
    return filtered;
  };

  const filteredCheckups = getFilteredCheckups();
  
  // Pagination logic
  const totalPages = Math.ceil(filteredCheckups.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCheckups = filteredCheckups.slice(startIndex, startIndex + itemsPerPage);

  // Calculate enhanced stats for history sidebar
  const getHistoryStats = () => {
    const allCompleted = doctorCheckupsData.filter(c => c.status === 'completed');
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const todayCheckups = allCompleted.filter(c => {
      const checkupDate = new Date(c.completedAt || c.updatedAt);
      return checkupDate >= todayStart;
    });
    
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);
    
    const thisWeekCheckups = allCompleted.filter(c => {
      const checkupDate = new Date(c.completedAt || c.updatedAt);
      return checkupDate >= thisWeekStart;
    });
    
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthCheckups = allCompleted.filter(c => {
      const checkupDate = new Date(c.completedAt || c.updatedAt);
      return checkupDate >= thisMonthStart;
    });
    
    // Calculate average time for completed checkups
    const checkupsWithDuration = allCompleted.filter(c => c.startedAt && c.completedAt);
    const avgDuration = checkupsWithDuration.length > 0 
      ? checkupsWithDuration.reduce((sum, c) => {
          const duration = new Date(c.completedAt) - new Date(c.startedAt);
          return sum + duration;
        }, 0) / checkupsWithDuration.length
      : 0;
    
    const avgMinutes = Math.round(avgDuration / (1000 * 60));
    
    return {
      today: todayCheckups.length,
      thisWeek: thisWeekCheckups.length,
      thisMonth: thisMonthCheckups.length,
      total: allCompleted.length,
      avgTime: avgMinutes,
      withPrescriptions: allCompleted.filter(c => c.prescriptions && c.prescriptions.length > 0).length
    };
  };
  
  // Medication selection states
  const [availableMedications, setAvailableMedications] = useState([]);
  const [medicationSearch, setMedicationSearch] = useState('');
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [selectedCheckupForMedication, setSelectedCheckupForMedication] = useState(null);
  const [loadingMedications, setLoadingMedications] = useState(true);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState({});

  useEffect(() => {
    setDoctorCheckupsData(initialDoctorCheckupsData);
  }, [initialDoctorCheckupsData]);

  // Load available medications on component mount
  useEffect(() => {
    const fetchMedications = async () => {
      setLoadingMedications(true);
      try {
        const response = await fetch('/api/medications', {
          headers: {
            'Authorization': `Bearer ${window.__authToken}`
          }
        });
        if (response.ok) {
          const medications = await response.json();
          setAvailableMedications(medications);
        }
      } catch (error) {
        console.error('Failed to load medications:', error);
      } finally {
        setLoadingMedications(false);
      }
    };
    fetchMedications();
  }, []);

  // Filter medications based on search
  const filteredMedications = availableMedications.filter(medication =>
    medicationSearch === '' ||
    medication.name.toLowerCase().includes(medicationSearch.toLowerCase()) ||
    medication.genericName.toLowerCase().includes(medicationSearch.toLowerCase()) ||
    medication.category.toLowerCase().includes(medicationSearch.toLowerCase())
  );

  // Load initial checkups data when component mounts
  useEffect(() => {
    const loadInitialData = async () => {
      console.log('Checkups: Component mounted, loading initial checkups data...');
      await refreshDoctorCheckups();
      setIsInitialLoad(false);
    };
    loadInitialData();
  }, [refreshDoctorCheckups]);

  // Add debugging for doctorCheckupsData changes
  useEffect(() => {
    console.log('Checkups: doctorCheckupsData changed:', {
      isArray: Array.isArray(doctorCheckupsData),
      length: doctorCheckupsData?.length,
      data: doctorCheckupsData
    });
  }, [doctorCheckupsData]);

  // Auto-refresh checkups data every 30 seconds
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshDoctorCheckups();
      }
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, [refreshDoctorCheckups]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      'started': { class: 'info', icon: 'bi-play-circle', text: 'Started' },
      'in-progress': { class: 'primary', icon: 'bi-activity', text: 'In Progress' },
      'completed': { class: 'success', icon: 'bi-check-circle', text: 'Completed' },
      'cancelled': { class: 'danger', icon: 'bi-x-circle', text: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig['started'];
    
    return (
      <span className={`status-badge status-${config.class}`}>
        <i className={`bi ${config.icon}`}></i>
        {config.text}
      </span>
    );
  };

  const handleCompleteCheckup = async (checkupId) => {
    setIsProcessing(true);
    try {
      // Get the current checkup data to send prescriptions
      const currentCheckup = doctorCheckupsData.find(c => c.id === checkupId);
      const prescriptions = currentCheckup?.prescriptions || [];
      
      const result = await updateCheckupStatus(checkupId, 'completed', {
        completedAt: new Date().toISOString(),
        completedBy: user?.id,
        prescriptions: prescriptions
      });
      
      if (result.success) {
        // Refresh checkups to get latest data
        await refreshDoctorCheckups();
      } else {
        console.error('Failed to complete checkup:', result.error);
        // Show error to user if needed
        alert(result.error || 'Failed to complete checkup');
      }
    } catch (error) {
      console.error('Failed to complete checkup:', error);
      alert('Failed to complete checkup. Please check the console for details.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler functions for the new checkup card functionality
  const handleNotesChange = async (checkupId, notes) => {
    // Update local state immediately
    setDoctorCheckupsData(prev => 
      prev.map(checkup => 
        checkup.id === checkupId 
          ? { ...checkup, notes }
          : checkup
      )
    );
    
    // Debounce the API call to avoid too many requests
    clearTimeout(window.notesTimeout);
    window.notesTimeout = setTimeout(async () => {
      try {
        await updateCheckupNotes(checkupId, notes, 
          doctorCheckupsData.find(c => c.id === checkupId)?.prescriptions || []
        );
      } catch (error) {
        console.error('Failed to update notes:', error);
      }
    }, 1000);
  };

  const handleAddPrescription = (checkupId) => {
    setSelectedCheckupForMedication(checkupId);
    setShowMedicationModal(true);
  };

  const handleSelectMedication = (medication, quantity) => {
    if (!selectedCheckupForMedication || !quantity || quantity <= 0) return;
    
    const newPrescription = {
      medication: medication.name,
      genericName: medication.genericName,
      dosage: medication.dosage,
      form: medication.form,
      strength: medication.strength,
      quantity: parseInt(quantity),
      instructions: medication.dosageInstructions || "Take as directed",
      medicationId: medication.id
    };
    
    setDoctorCheckupsData(prev => 
      prev.map(checkup => 
        checkup.id === selectedCheckupForMedication 
          ? { 
              ...checkup, 
              prescriptions: [...(checkup.prescriptions || []), newPrescription]
            }
          : checkup
      )
    );
    
    setShowMedicationModal(false);
    setSelectedCheckupForMedication(null);
    setMedicationSearch('');
  };

  const handleAddMedicationToCheckup = (checkupId, medication, quantity, instructions = '') => {
    const newPrescription = {
      medication: medication.name,
      genericName: medication.genericName,
      dosage: medication.dosage,
      form: medication.form,
      strength: medication.strength,
      quantity: parseInt(quantity),
      instructions: instructions || medication.dosageInstructions || "Take as directed",
      medicationId: medication.id
    };
    
    setDoctorCheckupsData(prev => 
      prev.map(checkup => 
        checkup.id === checkupId 
          ? { 
              ...checkup, 
              prescriptions: [...(checkup.prescriptions || []), newPrescription]
            }
          : checkup
      )
    );
    
    // Close the medication panel after adding
    setSelectedCheckupForMedication(null);
    setShowPrescriptionForm(prev => ({
      ...prev,
      [checkupId]: false
    }));
  };

  const handleRemovePrescription = async (checkupId, prescriptionIndex) => {
    const checkup = doctorCheckupsData.find(c => c.id === checkupId);
    const updatedPrescriptions = checkup.prescriptions.filter((_, idx) => idx !== prescriptionIndex);
    
    setDoctorCheckupsData(prev => 
      prev.map(c => 
        c.id === checkupId 
          ? { ...c, prescriptions: updatedPrescriptions }
          : c
      )
    );
    
    try {
      await updateCheckupNotes(checkupId, checkup.notes, updatedPrescriptions);
    } catch (error) {
      console.error('Failed to update prescriptions:', error);
    }
  };

  const handleViewPatientInfo = (checkup) => {
    // This will open the patient info modal
    setSelectedCheckup(checkup);
  };

  const handleViewVitalSigns = (checkup) => {
    // This will open the vital signs modal
    console.log('Viewing vital signs for:', checkup.patientName);
    // TODO: Implement vital signs modal
  };

  const formatDuration = (startTime) => {
    if (!startTime) return 'N/A';
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now - start;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMins % 60}m`;
    }
    return `${diffMins}m`;
  };

  if (isInitialLoad) {
    return <LoadingSpinnerDoc message="Loading checkups..." />;
  }

  console.log('Checkups: Rendering with doctorCheckupsData:', doctorCheckupsData);
  console.log('Checkups: Filtered checkups length:', filteredCheckups.length);

  return (
    <div className="checkups-container">
      <div className="checkups-header">
        <div className="header-info">
          <h2>
            <i className="bi bi-clipboard-pulse"></i>
            Doctor Checkups
          </h2>
          <p className="checkups-subtitle">
            Manage active checkup sessions and review completed checkups
          </p>
        </div>
        
        {filterTab !== 'history' && (
          <div className="checkups-stats">
            <div className="stat-card ongoing">
              <div className="stat-number">
                {doctorCheckupsData.filter(c => c.status === 'in-progress' || c.status === 'started').length}
              </div>
              <div className="stat-label">Ongoing</div>
            </div>
            <div className="stat-card finished">
              <div className="stat-number">
                {doctorCheckupsData.filter(c => c.status === 'completed').length}
              </div>
              <div className="stat-label">Finished</div>
            </div>
            <div className="stat-card total">
              <div className="stat-number">
                {doctorCheckupsData.length}
              </div>
              <div className="stat-label">Total</div>
            </div>
          </div>
        )}
      </div>

      <div className="checkups-filters">
        <div className="filter-buttons">
          {['ongoing', 'finished', 'history'].map(tab => (
            <button
              key={tab}
              className={`filter-btn ${filterTab === tab ? 'active' : ''}`}
              onClick={() => setFilterTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>

        {filterTab === 'history' && (
          <div className="controls-row">
            <div className="time-filter">
              <label htmlFor="timeFilter">Filter by:</label>
              <select 
                id="timeFilter"
                value={timeFilter} 
                onChange={(e) => setTimeFilter(e.target.value)}
                className="time-filter-select"
              >
                <option value="2days">Last 2 Days</option>
                <option value="2weeks">Last 2 Weeks</option>
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="all">All Time</option>
              </select>
            </div>

            {totalPages > 1 && (
              <div className="pagination-controls">
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="checkups-content">
        {(filterTab === 'history' ? paginatedCheckups : filteredCheckups).length === 0 ? (
          <div className="empty-checkups">
            <i className="bi bi-clipboard-x"></i>
            <h3>No checkups found</h3>
            <p>
              {filterTab === 'ongoing' 
                ? 'No ongoing checkups at the moment.'
                : filterTab === 'finished'
                ? 'No finished checkups found.'
                : 'No checkup history available.'
              }
            </p>
          </div>
        ) : filterTab === 'ongoing' ? (
          <div className="checkups-grid">
            {filteredCheckups.map((checkup, index) => (
              <div 
                key={checkup.id} 
                className="checkup-row"
              >
                <div className={`checkup-card ${checkup.status}`}>
                  <div className="checkup-number">
                    {index + 1}
                  </div>
                  
                  {/* Header */}
                  <div className="card-header">
                    <div className="patient-info">
                      <h4>{checkup.patientName}</h4>
                      <p className="patient-id">ID: {checkup.patientId}</p>
                      <p className="patient-details">Family ID: {checkup.familyId}</p>
                      <p className="patient-details">{checkup.age} years / {checkup.gender}</p>
                    </div>
                    {getStatusBadge(checkup.status)}
                  </div>
                  
                  {/* Content Area - Notes */}
                  <div className="card-content">
                    <div className="notes-section">
                      <label className="section-label">
                        <i className="bi bi-journal-text"></i>
                        Doctor's Notes
                      </label>
                      <textarea
                        className="notes-textarea"
                        placeholder="Enter your notes about the patient's condition, observations, diagnosis..."
                        value={checkup.notes || ''}
                        onChange={(e) => handleNotesChange(checkup.id, e.target.value)}
                      />
                    </div>
                    
                    <div className="prescription-section">
                      <div className="prescription-header">
                        <label className="section-label">
                          <i className="bi bi-prescription2"></i>
                          Prescriptions
                          {(checkup.prescriptions || []).length > 0 && (
                            <span className="prescription-count">({checkup.prescriptions.length})</span>
                          )}
                        </label>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            const isCurrentlyOpen = showPrescriptionForm[checkup.id];
                            setShowPrescriptionForm({
                              ...showPrescriptionForm,
                              [checkup.id]: !isCurrentlyOpen
                            });
                            if (!isCurrentlyOpen) {
                              setSelectedCheckupForMedication(checkup.id);
                            } else {
                              setSelectedCheckupForMedication(null);
                            }
                          }}
                        >
                          {showPrescriptionForm[checkup.id] ? 'Hide Prescriptions' : 'Add Prescription'}
                        </button>
                      </div>
                      
                      {/* Always show existing prescriptions */}
                      <div className="prescriptions-list">
                        {(checkup.prescriptions || []).length > 0 ? (
                          checkup.prescriptions.map((prescription, idx) => (
                            <div key={idx} className="prescription-item">
                              <div className="prescription-details">
                                <strong>{prescription.medication}</strong>
                                <span className="quantity">Qty: {prescription.quantity}</span>
                                <span className="instructions">{prescription.instructions}</span>
                              </div>
                              <button 
                                className="btn btn-danger btn-sm"
                                onClick={() => handleRemovePrescription(checkup.id, idx)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          ))
                        ) : (
                          !showPrescriptionForm[checkup.id] && <p className="no-prescriptions">No prescriptions added yet</p>
                        )}
                      </div>
                      
                      {/* Only show medication selection when form is open */}
                      {showPrescriptionForm[checkup.id] && (
                        <div className="medication-selection-inner">
                          <p className="select-medication-prompt">Select a medication to add to prescription:</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Footer Actions */}
                  <div className="card-actions">
                    <div className="action-buttons">
                      <button
                        className="btn btn-info"
                        onClick={() => handleViewPatientInfo(checkup)}
                      >
                        <i className="bi bi-person-circle"></i>
                        View Info
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleViewVitalSigns(checkup)}
                      >
                        <i className="bi bi-heart-pulse"></i>
                        Vital Signs
                      </button>
                      <button
                        className="btn btn-success"
                        onClick={() => handleCompleteCheckup(checkup.id)}
                        disabled={isProcessing || (!checkup.notes && (!checkup.prescriptions || checkup.prescriptions.length === 0))}
                        title={(!checkup.notes && (!checkup.prescriptions || checkup.prescriptions.length === 0)) ? "Please add notes or prescriptions before finishing" : "Complete checkup"}
                      >
                        <i className="bi bi-check-circle"></i>
                        Finished
                      </button>
                    </div>
                  </div>
                </div>

                {/* Medication Selection Panel - Beside the card */}
                {selectedCheckupForMedication === checkup.id && (
                  <div className="medication-selection-panel">
                  <div className="medication-panel-header">
                    <h5>
                      <i className="bi bi-capsule"></i>
                      Add Medications
                    </h5>
                    <button 
                      className="medication-close-btn"
                      onClick={() => {
                        setSelectedCheckupForMedication(null);
                        setShowPrescriptionForm({
                          ...showPrescriptionForm,
                          [checkup.id]: false
                        });
                      }}
                      title="Close medication panel"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                  <div className="search-box">
                    <input
                      type="text"
                      placeholder="Search medications..."
                      value={medicationSearch}
                      onChange={(e) => setMedicationSearch(e.target.value)}
                      className="form-control form-control-sm"
                    />
                    <i className="bi bi-search search-icon"></i>
                  </div>

                  <div className="medications-list">
                    {loadingMedications ? (
                      <div className="loading-medications">
                        <i className="bi bi-hourglass-split"></i>
                        Loading medications...
                      </div>
                    ) : filteredMedications.length === 0 ? (
                      <div className="no-medications">
                        <i className="bi bi-exclamation-circle"></i>
                        {medicationSearch ? 'No medications found' : 'No medications available'}
                      </div>
                    ) : (
                      filteredMedications.map(medication => (
                        <MedicationItem
                          key={medication.id}
                          medication={medication}
                          onSelect={(med, quantity, instructions) => 
                            handleAddMedicationToCheckup(checkup.id, med, quantity, instructions)
                          }
                        />
                      ))
                    )}
                  </div>
                </div>
                )}
              </div>
            ))}
          </div>
        ) : filterTab === 'finished' ? (
          /* Finished - Compact Card Grid View */
          <div className="finished-cards-grid">
            {filteredCheckups.map((checkup) => (
              <div key={checkup.id} className="finished-card compact">
                <div className="finished-card-header">
                  <div className="patient-info">
                    <h5 className="patient-name">{checkup.patientName}</h5>
                    <div className="patient-details-row">
                      <span>ID: {checkup.patientId}</span>
                      <span>Fam: {checkup.familyId || 'N/A'}</span>
                      <span>{checkup.age}y / {checkup.gender}</span>
                    </div>
                  </div>
                  <div className="completion-info">
                    <div className="status-badge">
                      {getStatusBadge(checkup.status)}
                    </div>
                    <div className="completion-time">
                      {new Date(checkup.completedAt || checkup.updatedAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                
                <div className="finished-card-content">
                  <div className="content-row compact">
                    <div className="notes-section">
                      <label className="section-label">
                        <i className="bi bi-journal-text"></i>
                        Notes
                      </label>
                      <div className="notes-content compact">
                        {checkup.notes || 'No notes recorded.'}
                      </div>
                    </div>
                    
                    <div className="prescription-section">
                      <label className="section-label">
                        <i className="bi bi-prescription2"></i>
                        Prescriptions
                      </label>
                      <div className="prescriptions-list compact">
                        {(checkup.prescriptions || []).length > 0 ? (
                          checkup.prescriptions.map((prescription, idx) => (
                            <div key={idx} className="prescription-item read-only compact">
                              <div className="prescription-details">
                                <strong>{prescription.medication}</strong>
                                <span className="quantity">Qty: {prescription.quantity}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="no-prescriptions">No prescriptions</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* History - List View with Enhanced Stats Sidebar */
          <div className="history-layout">
            <div className="history-list">
              {paginatedCheckups.map((checkup) => (
                <div key={checkup.id} className="history-accordion-item">
                  <div 
                    className="history-item-header"
                    onClick={() => {
                      const newKey = `history-${checkup.id}`;
                      setActiveKey(activeKey === newKey ? null : newKey);
                    }}
                  >
                    <div className="patient-info-row">
                      <span className="patient-name">{checkup.patientName}</span>
                      <span className="patient-id">ID: {checkup.patientId}</span>
                      <span className="family-id">Fam: {checkup.familyId || 'N/A'}</span>
                      <span className="age-gender">{checkup.age}y / {checkup.gender}</span>
                      <span className="completion-time">
                        {new Date(checkup.completedAt || checkup.updatedAt).toLocaleDateString()} {new Date(checkup.completedAt || checkup.updatedAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="expand-icon">
                      <i className={`bi ${activeKey === `history-${checkup.id}` ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                    </div>
                  </div>
                  
                  {activeKey === `history-${checkup.id}` && (
                    <div className="history-item-content">
                      <div className="content-row">
                        <div className="notes-section">
                          <label className="section-label">
                            <i className="bi bi-journal-text"></i>
                            Doctor's Notes
                          </label>
                          <div className="notes-content">
                            {checkup.notes || 'No notes recorded.'}
                          </div>
                        </div>
                        
                        <div className="prescription-section">
                          <label className="section-label">
                            <i className="bi bi-prescription2"></i>
                            Prescriptions
                          </label>
                          <div className="prescriptions-list">
                            {(checkup.prescriptions || []).length > 0 ? (
                              checkup.prescriptions.map((prescription, idx) => (
                                <div key={idx} className="prescription-item read-only">
                                  <div className="prescription-details">
                                    <strong>{prescription.medication}</strong>
                                    <span className="quantity">Qty: {prescription.quantity}</span>
                                    <span className="instructions">{prescription.instructions}</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="no-prescriptions">No prescriptions were added.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="history-stats-sidebar">
              <div className="stats-card enhanced">
                <h4>
                  <i className="bi bi-graph-up"></i>
                  Summary
                </h4>
                <div className="stat-item">
                  <span className="stat-label">Today</span>
                  <span className="stat-value">{getHistoryStats().today}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">This Week</span>
                  <span className="stat-value">{getHistoryStats().thisWeek}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">This Month</span>
                  <span className="stat-value">{getHistoryStats().thisMonth}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Completed</span>
                  <span className="stat-value">{getHistoryStats().total}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">With Prescriptions</span>
                  <span className="stat-value">{getHistoryStats().withPrescriptions}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Avg. Duration</span>
                  <span className="stat-value">{getHistoryStats().avgTime} min</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Showing</span>
                  <span className="stat-value">{timeFilter === 'all' ? 'All' : timeFilter === '2days' ? '2 Days' : timeFilter === '2weeks' ? '2 Weeks' : timeFilter === '3months' ? '3 Months' : '6 Months'}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Results</span>
                  <span className="stat-value">{filteredCheckups.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Medication Selection Modal */}
      {showMedicationModal && (
        <div className="modal-overlay" onClick={() => setShowMedicationModal(false)}>
          <div className="modal-content modal-large medication-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Select Medication</h3>
              <button 
                className="close-btn" 
                onClick={() => setShowMedicationModal(false)}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="medication-search-section">
                <div className="search-box">
                  <i className="bi bi-search"></i>
                  <input
                    type="text"
                    placeholder="Search medications by name, generic name, or brand..."
                    value={medicationSearch}
                    onChange={(e) => setMedicationSearch(e.target.value)}
                    className="medication-search-input"
                  />
                </div>
              </div>
              
              <div className="medication-list">
                {availableMedications
                  .filter(med => 
                    medicationSearch.length < 2 || 
                    med.name.toLowerCase().includes(medicationSearch.toLowerCase()) ||
                    med.genericName?.toLowerCase().includes(medicationSearch.toLowerCase()) ||
                    med.brandName?.toLowerCase().includes(medicationSearch.toLowerCase())
                  )
                  .slice(0, 20)
                  .map(medication => (
                    <MedicationItem 
                      key={medication.id} 
                      medication={medication} 
                      onSelect={handleSelectMedication}
                    />
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Checkup Details Modal */}
      {selectedCheckup && (
        <div className="modal-overlay" onClick={() => setSelectedCheckup(null)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Checkup Details</h3>
              <button 
                className="close-btn" 
                onClick={() => setSelectedCheckup(null)}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="checkup-details-modal">
                <div className="detail-section">
                  <h4>Patient Information</h4>
                  <div className="detail-row">
                    <strong>Name:</strong> {selectedCheckup.patientName}
                  </div>
                  <div className="detail-row">
                    <strong>Patient ID:</strong> {selectedCheckup.patientId}
                  </div>
                  <div className="detail-row">
                    <strong>Age/Gender:</strong> {selectedCheckup.age} / {selectedCheckup.gender}
                  </div>
                  <div className="detail-row">
                    <strong>Contact:</strong> {selectedCheckup.contactNumber}
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Checkup Information</h4>
                  <div className="detail-row">
                    <strong>Service Type:</strong> {selectedCheckup.serviceType}
                  </div>
                  <div className="detail-row">
                    <strong>Priority:</strong> {selectedCheckup.priority}
                  </div>
                  <div className="detail-row">
                    <strong>Status:</strong> {getStatusBadge(selectedCheckup.status)}
                  </div>
                  <div className="detail-row">
                    <strong>Started At:</strong> {selectedCheckup.startedAt ? new Date(selectedCheckup.startedAt).toLocaleString() : 'N/A'}
                  </div>
                  {selectedCheckup.completedAt && (
                    <div className="detail-row">
                      <strong>Completed At:</strong> {new Date(selectedCheckup.completedAt).toLocaleString()}
                    </div>
                  )}
                  {selectedCheckup.startedAt && (
                    <div className="detail-row">
                      <strong>Duration:</strong> {formatDuration(selectedCheckup.startedAt)}
                    </div>
                  )}
                </div>

                {selectedCheckup.notes && (
                  <div className="detail-section">
                    <h4>Notes</h4>
                    <div className="detail-row">
                      <p>{selectedCheckup.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setSelectedCheckup(null)}
              >
                Close
              </button>
              {(selectedCheckup.status === 'in-progress' || selectedCheckup.status === 'started') && (
                <button
                  className="btn btn-success"
                  onClick={() => {
                    handleCompleteCheckup(selectedCheckup.id);
                    setSelectedCheckup(null);
                  }}
                  disabled={isProcessing}
                >
                  <i className="bi bi-check-circle"></i>
                  Complete Checkup
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkups;
