import React from 'react';
import { 
  useAppointments, 
  useTodaysAppointments, 
  useCreateAppointment,
  useUpdateAppointment,
  useDeleteAppointment 
} from '../hooks/useAppointments';

// Example component showing modern data fetching patterns
const ModernAppointmentsExample = () => {
  // ===== QUERIES =====
  
  // Get today's appointments with auto-refetch
  const { 
    data: todaysAppointments = [], 
    isLoading: loadingToday, 
    error: todayError,
    refetch: refetchToday 
  } = useTodaysAppointments();

  // Get all appointments with filters
  const { 
    data: allAppointments = [], 
    isLoading: loadingAll, 
    error: allError 
  } = useAppointments({
    status: 'scheduled',
    limit: 50
  });

  // ===== MUTATIONS =====
  
  // Create appointment mutation
  const createAppointmentMutation = useCreateAppointment({
    onSuccess: () => {
      alert('Appointment created successfully!');
      // TanStack Query automatically updates the cache
    },
    onError: (error) => {
      alert(`Error creating appointment: ${error.message}`);
    }
  });

  // Update appointment mutation
  const updateAppointmentMutation = useUpdateAppointment({
    onSuccess: () => {
      alert('Appointment updated successfully!');
    }
  });

  // Delete appointment mutation
  const deleteAppointmentMutation = useDeleteAppointment({
    onSuccess: () => {
      alert('Appointment deleted successfully!');
    }
  });

  // ===== EVENT HANDLERS =====
  
  const handleCreateAppointment = () => {
    const newAppointment = {
      patientId: 1,
      doctorId: 1,
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      type: 'consultation',
      notes: 'Sample appointment created with modern API'
    };
    
    createAppointmentMutation.mutate(newAppointment);
  };

  const handleUpdateAppointment = (id) => {
    updateAppointmentMutation.mutate({
      id,
      updates: {
        status: 'confirmed',
        notes: 'Updated with modern API'
      }
    });
  };

  const handleDeleteAppointment = (id) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      deleteAppointmentMutation.mutate(id);
    }
  };

  // ===== RENDER =====
  
  return (
    <div className="container mt-4">
      <h2>🚀 Modern Appointments API Example</h2>
      
      {/* Action Buttons */}
      <div className="mb-4">
        <button 
          className="btn btn-primary me-2"
          onClick={handleCreateAppointment}
          disabled={createAppointmentMutation.isPending}
        >
          {createAppointmentMutation.isPending ? 'Creating...' : 'Create Sample Appointment'}
        </button>
        
        <button 
          className="btn btn-secondary"
          onClick={() => refetchToday()}
        >
          Refresh Today's Appointments
        </button>
      </div>

      {/* Today's Appointments */}
      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5>📅 Today's Appointments</h5>
              {loadingToday && <span className="badge bg-info">Loading...</span>}
            </div>
            <div className="card-body">
              {todayError && (
                <div className="alert alert-danger">
                  Error: {todayError.message}
                </div>
              )}
              
              {todaysAppointments.length === 0 ? (
                <p className="text-muted">No appointments for today</p>
              ) : (
                <ul className="list-group">
                  {todaysAppointments.map((appointment) => (
                    <li key={appointment.id} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{appointment.time}</strong> - {appointment.patientName}
                        <br />
                        <small className="text-muted">{appointment.type}</small>
                      </div>
                      <div>
                        <button 
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => handleUpdateAppointment(appointment.id)}
                          disabled={updateAppointmentMutation.isPending}
                        >
                          ✓
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteAppointment(appointment.id)}
                          disabled={deleteAppointmentMutation.isPending}
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* All Appointments */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5>📋 All Scheduled Appointments</h5>
              {loadingAll && <span className="badge bg-info">Loading...</span>}
            </div>
            <div className="card-body">
              {allError && (
                <div className="alert alert-danger">
                  Error: {allError.message}
                </div>
              )}
              
              {allAppointments.length === 0 ? (
                <p className="text-muted">No scheduled appointments</p>
              ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {allAppointments.map((appointment) => (
                    <div key={appointment.id} className="border-bottom py-2">
                      <div className="d-flex justify-content-between">
                        <div>
                          <strong>{appointment.date} {appointment.time}</strong>
                          <br />
                          {appointment.patientName} - {appointment.type}
                        </div>
                        <span className={`badge bg-${appointment.status === 'confirmed' ? 'success' : 'warning'}`}>
                          {appointment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* API Benefits Info */}
      <div className="mt-4">
        <div className="alert alert-info">
          <h6>✨ Modern API Benefits:</h6>
          <ul className="mb-0">
            <li><strong>Automatic Caching:</strong> Data is cached and shared across components</li>
            <li><strong>Smart Refetching:</strong> Auto-refetch on window focus, network reconnect</li>
            <li><strong>Optimistic Updates:</strong> UI updates immediately, rollback on error</li>
            <li><strong>Error Handling:</strong> Unified error handling with retry logic</li>
            <li><strong>Loading States:</strong> Built-in loading and pending states</li>
            <li><strong>Data Synchronization:</strong> Mutations automatically update related queries</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ModernAppointmentsExample;
