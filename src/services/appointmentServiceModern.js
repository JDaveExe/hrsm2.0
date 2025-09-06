import api from './axiosConfig';
import { queryKeys } from './queryClient';

// Modern Appointment Service using Axios + TanStack Query patterns
class AppointmentService {
  constructor() {
    this.endpoint = '/api/appointments';
  }

  // ===== QUERY FUNCTIONS (for useQuery) =====
  
  // Get all appointments with filters
  async getAppointments(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.status) params.append('status', filters.status);
    if (filters.doctorId) params.append('doctorId', filters.doctorId);
    if (filters.patientId) params.append('patientId', filters.patientId);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);
    
    const response = await api.get(`${this.endpoint}?${params}`);
    return response.data;
  }

  // Get single appointment by ID
  async getAppointment(id) {
    const response = await api.get(`${this.endpoint}/${id}`);
    return response.data;
  }

  // Get today's appointments
  async getTodaysAppointments() {
    const response = await api.get(`${this.endpoint}/today`);
    return response.data;
  }

  // Get appointment statistics
  async getAppointmentStats(filters = {}) {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.doctorId) params.append('doctorId', filters.doctorId);
    
    const response = await api.get(`${this.endpoint}/statistics?${params}`);
    return response.data;
  }

  // Get calendar view of appointments
  async getCalendarAppointments(month, year) {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    
    const response = await api.get(`${this.endpoint}/calendar?${params}`);
    return response.data;
  }

  // Get doctor schedule
  async getDoctorSchedule(doctorId, date) {
    const params = new URLSearchParams();
    if (doctorId) params.append('doctorId', doctorId);
    if (date) params.append('date', date);
    
    const response = await api.get(`${this.endpoint}/doctor-schedule?${params}`);
    return response.data;
  }

  // ===== MUTATION FUNCTIONS (for useMutation) =====

  // Create new appointment
  async createAppointment(appointmentData) {
    const response = await api.post(this.endpoint, appointmentData);
    return response.data;
  }

  // Update appointment
  async updateAppointment(id, updates) {
    const response = await api.put(`${this.endpoint}/${id}`, updates);
    return response.data;
  }

  // Delete appointment
  async deleteAppointment(id) {
    const response = await api.delete(`${this.endpoint}/${id}`);
    return response.data;
  }

  // Check for appointment conflicts
  async checkConflicts(appointmentData) {
    const response = await api.post(`${this.endpoint}/check-conflicts`, appointmentData);
    return response.data;
  }

  // Start appointment session
  async startSession(appointmentId) {
    const response = await api.post(`${this.endpoint}/${appointmentId}/start-session`);
    return response.data;
  }

  // End appointment session
  async endSession(appointmentId, sessionData = {}) {
    const response = await api.post(`${this.endpoint}/${appointmentId}/end-session`, sessionData);
    return response.data;
  }
}

// Export singleton instance
export const appointmentService = new AppointmentService();

// ===== TANSTACK QUERY HOOKS =====

export const appointmentQueries = {
  // Query key factories
  all: () => queryKeys.appointments,
  lists: () => [...appointmentQueries.all(), 'list'],
  list: (filters) => [...appointmentQueries.lists(), filters],
  details: () => [...appointmentQueries.all(), 'detail'],
  detail: (id) => [...appointmentQueries.details(), id],
  today: () => [...appointmentQueries.all(), 'today'],
  stats: (filters) => [...appointmentQueries.all(), 'stats', filters],
  calendar: (month, year) => [...appointmentQueries.all(), 'calendar', month, year],
  doctorSchedule: (doctorId, date) => [...appointmentQueries.all(), 'doctor-schedule', doctorId, date],
};

// Ready-to-use query options for React Query
export const appointmentQueryOptions = {
  // Get appointments with filters
  appointments: (filters = {}) => ({
    queryKey: appointmentQueries.list(filters),
    queryFn: () => appointmentService.getAppointments(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  }),

  // Get single appointment
  appointment: (id) => ({
    queryKey: appointmentQueries.detail(id),
    queryFn: () => appointmentService.getAppointment(id),
    enabled: !!id,
  }),

  // Get today's appointments
  todaysAppointments: () => ({
    queryKey: appointmentQueries.today(),
    queryFn: () => appointmentService.getTodaysAppointments(),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  }),

  // Get appointment statistics
  appointmentStats: (filters = {}) => ({
    queryKey: appointmentQueries.stats(filters),
    queryFn: () => appointmentService.getAppointmentStats(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes
  }),

  // Get calendar appointments
  calendarAppointments: (month, year) => ({
    queryKey: appointmentQueries.calendar(month, year),
    queryFn: () => appointmentService.getCalendarAppointments(month, year),
    enabled: !!(month && year),
  }),

  // Get doctor schedule
  doctorSchedule: (doctorId, date) => ({
    queryKey: appointmentQueries.doctorSchedule(doctorId, date),
    queryFn: () => appointmentService.getDoctorSchedule(doctorId, date),
    enabled: !!(doctorId && date),
  }),
};
