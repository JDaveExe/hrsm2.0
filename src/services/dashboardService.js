import api from './axiosConfig';

class DashboardService {
  constructor() {
    this.endpoint = '/api/dashboard';
  }

  // Get comprehensive dashboard statistics
  async getStats() {
    const response = await api.get(`${this.endpoint}/stats`);
    return response.data;
  }

  // Get families with pagination and filters
  async getFamilies(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    
    const response = await api.get(`${this.endpoint}/families?${params}`);
    return response.data;
  }

  // Get families for dashboard stats only
  async getFamiliesStats() {
    const response = await api.get(`${this.endpoint}/families?limit=1`);
    return response.data.pagination.total;
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();

// TanStack Query options for dashboard data
export const dashboardQueryOptions = {
  // Get dashboard statistics
  stats: () => ({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardService.getStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  }),

  // Get families with filters
  families: (filters = {}) => ({
    queryKey: ['dashboard', 'families', filters],
    queryFn: () => dashboardService.getFamilies(filters),
    staleTime: 1 * 60 * 1000, // 1 minute
  }),

  // Get families count only
  familiesCount: () => ({
    queryKey: ['dashboard', 'families', 'count'],
    queryFn: () => dashboardService.getFamiliesStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  }),
};

export default dashboardService;
