import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

const fetchTodaysCheckups = async () => {
  const { data } = await api.get('/api/checkups/today');
  return data;
};

export const useCheckups = () => {
  const { token, logout } = useAuth();
  
  // Set global token and logout function for axios interceptors
  useEffect(() => {
    window.__authToken = token;
    window.__authLogout = logout;
    
    return () => {
      if (!token) {
        delete window.__authToken;
        delete window.__authLogout;
      }
    };
  }, [token, logout]);

  return useQuery({
    queryKey: ['todaysCheckups'],
    queryFn: fetchTodaysCheckups,
    enabled: !!token, // Only run the query if the user is authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};
