import { QueryClient } from '@tanstack/react-query';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache time: 10 minutes
      cacheTime: 10 * 60 * 1000,
      // Retry on failure
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (except 401)
        if (error?.response?.status >= 400 && error?.response?.status < 500 && error?.response?.status !== 401) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      // Refetch on window focus
      refetchOnWindowFocus: true,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});

// Query keys for consistent caching
export const queryKeys = {
  // Patients
  patients: ['patients'],
  patient: (id) => ['patients', id],
  patientStats: ['patients', 'stats'],
  
  // Appointments
  appointments: ['appointments'],
  appointment: (id) => ['appointments', id],
  appointmentsToday: ['appointments', 'today'],
  appointmentStats: ['appointments', 'stats'],
  
  // Users
  users: ['users'],
  user: (id) => ['users', id],
  currentUser: ['users', 'current'],
  
  // Admin
  adminStats: ['admin', 'stats'],
  systemHealth: ['admin', 'health'],
  
  // Inventory
  inventory: ['inventory'],
  inventoryAlerts: ['inventory', 'alerts'],
  
  // Notifications
  notifications: ['notifications'],
  unreadNotifications: ['notifications', 'unread'],
};

// Helper function to invalidate related queries
export const invalidateQueries = {
  patients: () => queryClient.invalidateQueries({ queryKey: queryKeys.patients }),
  appointments: () => queryClient.invalidateQueries({ queryKey: queryKeys.appointments }),
  users: () => queryClient.invalidateQueries({ queryKey: queryKeys.users }),
  inventory: () => queryClient.invalidateQueries({ queryKey: queryKeys.inventory }),
  notifications: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
  all: () => queryClient.invalidateQueries(),
};
