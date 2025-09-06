import { useQuery } from '@tanstack/react-query';
import { dashboardQueryOptions } from '../services/dashboardService';

// Hook for getting dashboard statistics
export const useDashboardStats = (options = {}) => {
  return useQuery({
    ...dashboardQueryOptions.stats(),
    ...options,
  });
};

// Hook for getting families data
export const useDashboardFamilies = (filters = {}, options = {}) => {
  return useQuery({
    ...dashboardQueryOptions.families(filters),
    ...options,
  });
};

// Hook for getting families count only
export const useFamiliesCount = (options = {}) => {
  return useQuery({
    ...dashboardQueryOptions.familiesCount(),
    ...options,
  });
};
