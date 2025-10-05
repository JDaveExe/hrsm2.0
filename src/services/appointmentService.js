// API service for appointment management
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class AppointmentService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/appointments`;
  }

  // Helper method to get auth headers
  getAuthHeaders() {
    // TEMPORARY FIX: Use same auth approach as other services
    // This matches patientService and userService authentication
    console.log('🔑 AppointmentService using temp-admin-token (matching other services)');
    
    return {
      'Content-Type': 'application/json',
      'x-auth-token': 'temp-admin-token',
      // Override any Bearer token that might be set by interceptors
      'Authorization': undefined
    };
  }
  
  // Method to verify authentication setup
  verifyAuth() {
    const headers = this.getAuthHeaders();
    const hasToken = !!headers.Authorization && headers.Authorization !== 'Bearer ';
    
    console.log('🔍 AppointmentService Auth Verification:', {
      hasValidToken: hasToken,
      authorizationHeader: hasToken ? headers.Authorization.substring(0, 20) + '...' : 'Missing',
      allTokenLocations: {
        'localStorage.token': !!localStorage.getItem('token'),
        'localStorage.authToken': !!localStorage.getItem('authToken'),
        'localStorage.userToken': !!localStorage.getItem('userToken'),
        'sessionStorage.token': !!sessionStorage.getItem('token'),
        'sessionStorage.authData': !!sessionStorage.getItem('authData')
      }
    });
    
    return hasToken;
  }
  
  // Helper method to identify token source for debugging
  getTokenSource(token) {
    if (localStorage.getItem('token') === token) return 'localStorage.token';
    if (localStorage.getItem('authToken') === token) return 'localStorage.authToken';
    if (localStorage.getItem('userToken') === token) return 'localStorage.userToken';
    if (sessionStorage.getItem('token') === token) return 'sessionStorage.token';
    
    try {
      const authData = sessionStorage.getItem('authData');
      if (authData && JSON.parse(authData).token === token) {
        return 'sessionStorage.authData';
      }
    } catch (e) {
      // ignore
    }
    
    return 'unknown';
  }

  // Helper method to handle API responses
  async handleResponse(response) {
    if (!response.ok) {
      let errorMessage = 'An error occurred';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.msg || errorData.error || errorMessage;
      } catch (parseError) {
        // If response isn't JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      
      // Handle specific status codes
      if (response.status === 401) {
        errorMessage = 'Authentication required. Please log in.';
        // Don't redirect automatically - let the component handle it
      } else if (response.status === 403) {
        errorMessage = 'You do not have permission to access this resource.';
      } else if (response.status === 404) {
        errorMessage = 'The requested resource was not found.';
      } else if (response.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      throw new Error(errorMessage);
    }
    
    try {
      return await response.json();
    } catch (parseError) {
      // If response isn't JSON, return empty object
      return {};
    }
  }

  // Get all appointments with filters
  async getAppointments(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query parameters
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });

      const response = await fetch(`${this.baseURL}?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  }

  // Get appointment by ID
  async getAppointmentById(id) {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching appointment:', error);
      throw error;
    }
  }

  // Create new appointment
  async createAppointment(appointmentData) {
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(appointmentData)
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  // Update appointment
  async updateAppointment(id, appointmentData) {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(appointmentData)
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  }

  // Cancel appointment (dedicated method for clarity)
  async cancelAppointment(id) {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status: 'Cancelled' })
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  }



  // Delete appointment
  async deleteAppointment(id) {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  }

  // Get today's appointments
  async getTodaysAppointments() {
    try {
      const response = await fetch(`${this.baseURL}/today`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching today\'s appointments:', error);
      throw error;
    }
  }

  // Get calendar view
  async getCalendarView(startDate, endDate) {
    try {
      const queryParams = new URLSearchParams({
        startDate: startDate,
        endDate: endDate
      });

      const response = await fetch(`${this.baseURL}/calendar?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching calendar view:', error);
      throw error;
    }
  }

  // Check for scheduling conflicts
  async checkConflicts(appointmentData) {
    try {
      const response = await fetch(`${this.baseURL}/check-conflicts`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(appointmentData)
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error checking conflicts:', error);
      throw error;
    }
  }

  // Get doctor's schedule
  async getDoctorSchedule(doctorId, date) {
    try {
      const queryParams = new URLSearchParams({
        doctorId: doctorId,
        date: date
      });

      const response = await fetch(`${this.baseURL}/doctor-schedule?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching doctor schedule:', error);
      throw error;
    }
  }

  // Start appointment session
  async startSession(appointmentId) {
    try {
      const response = await fetch(`${this.baseURL}/${appointmentId}/start-session`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error starting appointment session:', error);
      throw error;
    }
  }

  // End appointment session
  async endSession(appointmentId, sessionData) {
    try {
      const response = await fetch(`${this.baseURL}/${appointmentId}/end-session`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(sessionData)
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error ending appointment session:', error);
      throw error;
    }
  }

  // Get appointment statistics
  async getStatistics(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });

      const response = await fetch(`${this.baseURL}/statistics?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching appointment statistics:', error);
      throw error;
    }
  }

  // ==================== APPOINTMENT REQUESTS METHODS ====================



  // Update overdue appointments status
  async updateOverdueStatus() {
    try {
      const response = await fetch(`${this.baseURL}/update-overdue-status`, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error updating overdue appointments:', error);
      throw error;
    }
  }

  // Mark appointment as completed (Patient action)
  async markAppointmentCompleted(appointmentId) {
    try {
      const response = await fetch(`${this.baseURL}/${appointmentId}/mark-completed`, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error marking appointment as completed:', error);
      throw error;
    }
  }


}

export default new AppointmentService();
