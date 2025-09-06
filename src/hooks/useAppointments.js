import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentService, appointmentQueryOptions } from '../services/appointmentServiceModern';
import { invalidateQueries } from '../services/queryClient';

// ===== APPOINTMENT QUERIES =====

// Hook for getting appointments with filters
export const useAppointments = (filters = {}, options = {}) => {
  return useQuery({
    ...appointmentQueryOptions.appointments(filters),
    ...options,
  });
};

// Hook for getting a single appointment
export const useAppointment = (id, options = {}) => {
  return useQuery({
    ...appointmentQueryOptions.appointment(id),
    ...options,
  });
};

// Hook for getting today's appointments
export const useTodaysAppointments = (options = {}) => {
  return useQuery({
    ...appointmentQueryOptions.todaysAppointments(),
    ...options,
  });
};

// Hook for appointment statistics
export const useAppointmentStats = (filters = {}, options = {}) => {
  return useQuery({
    ...appointmentQueryOptions.appointmentStats(filters),
    ...options,
  });
};

// Hook for calendar appointments
export const useCalendarAppointments = (month, year, options = {}) => {
  return useQuery({
    ...appointmentQueryOptions.calendarAppointments(month, year),
    ...options,
  });
};

// Hook for doctor schedule
export const useDoctorSchedule = (doctorId, date, options = {}) => {
  return useQuery({
    ...appointmentQueryOptions.doctorSchedule(doctorId, date),
    ...options,
  });
};

// ===== APPOINTMENT MUTATIONS =====

// Hook for creating appointments
export const useCreateAppointment = (options = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (appointmentData) => appointmentService.createAppointment(appointmentData),
    onSuccess: (data) => {
      // Invalidate and refetch appointment queries
      invalidateQueries.appointments();
      
      // Optionally add the new appointment to existing cache
      queryClient.setQueryData(['appointments', 'list'], (oldData) => {
        if (oldData) {
          return {
            ...oldData,
            appointments: [data, ...oldData.appointments],
          };
        }
        return oldData;
      });
      
      // Call custom onSuccess if provided
      options.onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Error creating appointment:', error);
      options.onError?.(error);
    },
    ...options,
  });
};

// Hook for updating appointments
export const useUpdateAppointment = (options = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }) => appointmentService.updateAppointment(id, updates),
    onSuccess: (data, variables) => {
      // Update the specific appointment in cache
      queryClient.setQueryData(['appointments', 'detail', variables.id], data);
      
      // Invalidate lists to ensure consistency
      invalidateQueries.appointments();
      
      options.onSuccess?.(data, variables);
    },
    onError: (error) => {
      console.error('Error updating appointment:', error);
      options.onError?.(error);
    },
    ...options,
  });
};

// Hook for deleting appointments
export const useDeleteAppointment = (options = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => appointmentService.deleteAppointment(id),
    onSuccess: (data, id) => {
      // Remove from cache
      queryClient.removeQueries(['appointments', 'detail', id]);
      
      // Update lists
      queryClient.setQueriesData(['appointments', 'list'], (oldData) => {
        if (oldData?.appointments) {
          return {
            ...oldData,
            appointments: oldData.appointments.filter(apt => apt.id !== id),
          };
        }
        return oldData;
      });
      
      options.onSuccess?.(data, id);
    },
    onError: (error) => {
      console.error('Error deleting appointment:', error);
      options.onError?.(error);
    },
    ...options,
  });
};

// Hook for checking appointment conflicts
export const useCheckAppointmentConflicts = (options = {}) => {
  return useMutation({
    mutationFn: (appointmentData) => appointmentService.checkConflicts(appointmentData),
    ...options,
  });
};

// Hook for starting appointment session
export const useStartAppointmentSession = (options = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (appointmentId) => appointmentService.startSession(appointmentId),
    onSuccess: (data, appointmentId) => {
      // Update the appointment status in cache
      queryClient.setQueryData(['appointments', 'detail', appointmentId], (oldData) => {
        if (oldData) {
          return { ...oldData, status: 'in-progress', sessionStarted: true };
        }
        return oldData;
      });
      
      // Invalidate today's appointments
      queryClient.invalidateQueries(['appointments', 'today']);
      
      options.onSuccess?.(data, appointmentId);
    },
    ...options,
  });
};

// Hook for ending appointment session
export const useEndAppointmentSession = (options = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ appointmentId, sessionData }) => appointmentService.endSession(appointmentId, sessionData),
    onSuccess: (data, { appointmentId }) => {
      // Update the appointment status in cache
      queryClient.setQueryData(['appointments', 'detail', appointmentId], (oldData) => {
        if (oldData) {
          return { ...oldData, status: 'completed', sessionEnded: true };
        }
        return oldData;
      });
      
      // Invalidate today's appointments and stats
      queryClient.invalidateQueries(['appointments', 'today']);
      queryClient.invalidateQueries(['appointments', 'stats']);
      
      options.onSuccess?.(data, { appointmentId });
    },
    ...options,
  });
};
