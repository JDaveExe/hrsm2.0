// Doctor Session Service
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const doctorSessionService = {
  // Get all doctors with their availability status (online, busy, offline)
  getAllDoctors: async () => {
    try {
      const response = await fetch(`${BASE_URL}/doctor/sessions/all`);
      if (!response.ok) {
        throw new Error(`Failed to fetch all doctors: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching all doctors:', error);
      throw error;
    }
  },

  // Get all online doctors (backwards compatibility)
  getOnlineDoctors: async () => {
    try {
      const response = await fetch(`${BASE_URL}/doctor/sessions/online`);
      if (!response.ok) {
        throw new Error(`Failed to fetch online doctors: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching online doctors:', error);
      throw error;
    }
  },

  // Get specific doctor's status
  getDoctorStatus: async (doctorId) => {
    try {
      const response = await fetch(`${BASE_URL}/doctor/sessions/status/${doctorId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch doctor status: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching doctor status:', error);
      throw error;
    }
  },

  // Update doctor status
  updateDoctorStatus: async (doctorId, status, patientId = null) => {
    try {
      const response = await fetch(`${BASE_URL}/doctor/sessions/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctorId,
          status,
          patientId
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update doctor status: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating doctor status:', error);
      throw error;
    }
  },

  // Send heartbeat
  sendHeartbeat: async (doctorId) => {
    try {
      const response = await fetch(`${BASE_URL}/doctor/sessions/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ doctorId }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send heartbeat: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error sending heartbeat:', error);
      throw error;
    }
  },

  // Doctor login
  loginDoctor: async (doctorId, sessionToken = null) => {
    try {
      const response = await fetch(`${BASE_URL}/doctor/sessions/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctorId,
          sessionToken
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to login doctor: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error logging in doctor:', error);
      throw error;
    }
  },

  // Doctor logout
  logoutDoctor: async (doctorId) => {
    try {
      const response = await fetch(`${BASE_URL}/doctor/sessions/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctorId
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to logout doctor: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error logging out doctor:', error);
      throw error;
    }
  },

  // Clean up stale sessions
  cleanupStaleSessions: async () => {
    try {
      const response = await fetch(`${BASE_URL}/doctor/sessions/cleanup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to cleanup stale sessions: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error cleaning up stale sessions:', error);
      throw error;
    }
  },

  // Start heartbeat interval for a doctor (call when doctor logs in)
  startHeartbeat: (doctorId, intervalMs = 60000) => { // Default 1 minute
    const heartbeatInterval = setInterval(async () => {
      try {
        await doctorSessionService.sendHeartbeat(doctorId);
        console.log(`Heartbeat sent for doctor ${doctorId}`);
      } catch (error) {
        console.error(`Failed to send heartbeat for doctor ${doctorId}:`, error);
        // If heartbeat fails, clear the interval
        clearInterval(heartbeatInterval);
      }
    }, intervalMs);
    
    // Store interval ID for cleanup
    window.__doctorHeartbeatInterval = heartbeatInterval;
    return heartbeatInterval;
  },

  // Stop heartbeat interval (call when doctor logs out)
  stopHeartbeat: () => {
    if (window.__doctorHeartbeatInterval) {
      clearInterval(window.__doctorHeartbeatInterval);
      window.__doctorHeartbeatInterval = null;
      console.log('Heartbeat stopped');
    }
  }
};