import axios from 'axios';
import { QueryClient } from '@tanstack/react-query';

// Create axios instance with security configurations
const patientApi = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Request interceptor for authentication
patientApi.interceptors.request.use(
  (config) => {
    // Get auth token from secure storage (sessionStorage for better security than localStorage)
    const token = sessionStorage.getItem('patient_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add CSRF token if available
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    
    // Add request timestamp for additional security
    config.headers['X-Request-Time'] = Date.now().toString();
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and security
patientApi.interceptors.response.use(
  (response) => {
    // Log successful requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Response:', response.config.url, response.status);
    }
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle authentication errors
      if (status === 401) {
        // Clear auth data and redirect to login
        sessionStorage.removeItem('patient_auth_token');
        sessionStorage.removeItem('patient_user_data');
        window.location.href = '/patient/login';
        return Promise.reject(new Error('Authentication required'));
      }
      
      // Handle authorization errors
      if (status === 403) {
        return Promise.reject(new Error('Access denied'));
      }
      
      // Handle rate limiting
      if (status === 429) {
        return Promise.reject(new Error('Too many requests. Please try again later.'));
      }
      
      // Handle server errors
      if (status >= 500) {
        return Promise.reject(new Error('Server error. Please try again later.'));
      }
      
      // Handle validation errors
      if (status === 400 && data.message) {
        return Promise.reject(new Error(data.message));
      }
    }
    
    // Handle network errors
    if (error.code === 'NETWORK_ERROR' || !error.response) {
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }
    
    return Promise.reject(error);
  }
);

// Patient API endpoints
export const patientApiEndpoints = {
  // Profile endpoints
  getProfile: () => patientApi.get('/patient/profile'),
  updateProfile: (data) => patientApi.put('/patient/profile', data),
  
  // Appointment endpoints
  getUpcomingAppointments: () => patientApi.get('/patient/appointments/upcoming'),
  getAppointmentHistory: () => patientApi.get('/patient/appointments/history'),
  bookAppointment: (data) => patientApi.post('/patient/appointments', data),
  cancelAppointment: (id) => patientApi.delete(`/patient/appointments/${id}`),
  
  // Medical records endpoints
  getTreatmentRecords: () => patientApi.get('/patient/medical-records/treatment'),
  getDentalRecords: () => patientApi.get('/patient/medical-records/dental'),
  getImmunizationRecords: () => patientApi.get('/patient/medical-records/immunization'),
  getLabResults: () => patientApi.get('/patient/medical-records/lab-results'),
  
  // Prescription endpoints
  getActivePrescriptions: () => patientApi.get('/patient/prescriptions/active'),
  getPrescriptionHistory: () => patientApi.get('/patient/prescriptions/history'),
  getMedicationReminders: () => patientApi.get('/patient/prescriptions/reminders'),
  setMedicationReminder: (data) => patientApi.post('/patient/prescriptions/reminders', data),
  
  // Health tracking endpoints
  getVitalSigns: () => patientApi.get('/patient/health/vital-signs'),
  addVitalSigns: (data) => patientApi.post('/patient/health/vital-signs', data),
  getHealthGoals: () => patientApi.get('/patient/health/goals'),
  updateHealthGoals: (data) => patientApi.put('/patient/health/goals', data),
  getSymptomsHistory: () => patientApi.get('/patient/health/symptoms'),
  logSymptoms: (data) => patientApi.post('/patient/health/symptoms', data),
  
  // Communication endpoints
  getMessages: () => patientApi.get('/patient/communications/messages'),
  sendMessage: (data) => patientApi.post('/patient/communications/messages', data),
  markMessageAsRead: (id) => patientApi.put(`/patient/communications/messages/${id}/read`),
  getNotifications: () => patientApi.get('/patient/communications/notifications'),
  markNotificationAsRead: (id) => patientApi.put(`/patient/communications/notifications/${id}/read`),
  getEmergencyContacts: () => patientApi.get('/patient/emergency-contacts'),
  updateEmergencyContacts: (data) => patientApi.put('/patient/emergency-contacts', data),
  
  // Settings endpoints
  getSettings: () => patientApi.get('/patient/settings'),
  updateSettings: (data) => patientApi.put('/patient/settings', data),
  changePassword: (data) => patientApi.put('/patient/settings/password', data),
  enableTwoFactor: (data) => patientApi.post('/patient/settings/2fa/enable', data),
  disableTwoFactor: (data) => patientApi.post('/patient/settings/2fa/disable', data),
};

// Query keys for TanStack Query
export const patientQueryKeys = {
  profile: ['patient', 'profile'],
  appointments: {
    all: ['patient', 'appointments'],
    upcoming: ['patient', 'appointments', 'upcoming'],
    history: ['patient', 'appointments', 'history'],
  },
  medicalRecords: {
    all: ['patient', 'medical-records'],
    treatment: ['patient', 'medical-records', 'treatment'],
    dental: ['patient', 'medical-records', 'dental'],
    immunization: ['patient', 'medical-records', 'immunization'],
    labResults: ['patient', 'medical-records', 'lab-results'],
  },
  prescriptions: {
    all: ['patient', 'prescriptions'],
    active: ['patient', 'prescriptions', 'active'],
    history: ['patient', 'prescriptions', 'history'],
    reminders: ['patient', 'prescriptions', 'reminders'],
  },
  healthData: {
    all: ['patient', 'health'],
    vitalSigns: ['patient', 'health', 'vital-signs'],
    goals: ['patient', 'health', 'goals'],
    symptoms: ['patient', 'health', 'symptoms'],
  },
  communications: {
    all: ['patient', 'communications'],
    messages: ['patient', 'communications', 'messages'],
    notifications: ['patient', 'communications', 'notifications'],
    emergencyContacts: ['patient', 'emergency-contacts'],
  },
  settings: ['patient', 'settings'],
};

// Security utilities
export const securityUtils = {
  // Sanitize input data
  sanitizeInput: (input) => {
    if (typeof input === 'string') {
      return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    return input;
  },
  
  // Validate email format
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  // Validate phone number format
  isValidPhone: (phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  },
  
  // Generate secure random string
  generateSecureId: () => {
    return crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
  },
  
  // Clear sensitive data from memory
  clearSensitiveData: () => {
    sessionStorage.removeItem('patient_auth_token');
    sessionStorage.removeItem('patient_user_data');
    sessionStorage.removeItem('patient_session_data');
  },
};

// Enhanced QueryClient configuration for patient dashboard
export const createPatientQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          // Don't retry on auth errors
          if (error?.response?.status === 401 || error?.response?.status === 403) {
            return false;
          }
          // Retry up to 2 times for other errors
          return failureCount < 2;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: false,
        onError: (error) => {
          console.error('Mutation error:', error);
          // You can add global error handling here
        },
      },
    },
  });
};

export default patientApi;
