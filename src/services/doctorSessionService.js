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
  }
};