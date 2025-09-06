import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

// Fetch vital signs history for a patient
const fetchVitalSignsHistory = async (patientId) => {
  const { data } = await api.get(`/api/checkups/vital-signs/history/${patientId}`);
  return data;
};

// Record vital signs for a session
const recordVitalSigns = async ({ sessionId, vitalSigns }) => {
  const { data } = await api.post(`/api/checkups/${sessionId}/vital-signs`, vitalSigns);
  return data;
};

export const useVitalSignsHistory = (patientId) => {
  const { token, logout } = useAuth();
  
  // Set global token and logout function for axios interceptors
  useEffect(() => {
    window.__authToken = token;
    window.__authLogout = logout;
  }, [token, logout]);

  return useQuery({
    queryKey: ['vitalSignsHistory', patientId],
    queryFn: () => fetchVitalSignsHistory(patientId),
    enabled: !!token && !!patientId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useRecordVitalSigns = () => {
  const queryClient = useQueryClient();
  const { token, logout } = useAuth();
  
  // Set global token and logout function for axios interceptors
  useEffect(() => {
    window.__authToken = token;
    window.__authLogout = logout;
  }, [token, logout]);

  return useMutation({
    mutationFn: recordVitalSigns,
    onSuccess: (data, variables) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['todaysCheckups'] });
      queryClient.invalidateQueries({ queryKey: ['vitalSignsHistory', variables.sessionId] });
    },
  });
};
