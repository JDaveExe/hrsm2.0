import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useAuth } from './context/AuthContext';
import authService from './services/authService';
import './App.css';
import Header from './components/Header'; // Keep Header for immediate load
import ProtectedRoute from './components/ProtectedRoute'; // Keep ProtectedRoute for immediate load
import SessionWarningModal from './components/auth/SessionWarningModal'; // Import session warning modal
import CriticalAlertBanner from './components/CriticalAlertBanner'; // Import critical alert banner

// Import context providers
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { queryClient } from './services/queryClient';

// Import asset loading manager
// eslint-disable-next-line no-unused-vars
// import AssetLoadingManager from './utils/AssetLoadingManager';
import CSSLoadingGuard from './components/CSSLoadingGuard';
import AssetErrorBoundary from './components/AssetErrorBoundary';
// eslint-disable-next-line no-unused-vars
// import CSSMonitor from './utils/CSSMonitor';

import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/LoginSignup.css';
import './styles/Services.css';
import './styles/Appointments.css';

// Lazy load components
const Homepage = lazy(() => import('./components/Homepage'));
const LoginSignup = lazy(() => import('./components/LoginSignup'));
const Services = lazy(() => import('./components/Services'));
const ContactUs = lazy(() => import('./components/ContactUs'));
const Appointments = lazy(() => import('./components/Appointments'));
const HealthStock = lazy(() => import('./components/HealthStock'));
const DoctorLayout = lazy(() => import('./components/doctor/DoctorLayout'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const PatientLayout = lazy(() => import('./components/patient/PatientLayout'));
const ManagementDashboard = lazy(() => import('./components/ManagementDashboard'));

// Auto-login component to handle port-based auto login
const AutoLoginHandler = () => {
  const { isAuthenticated, login } = useAuth();
  const [autoLoginAttempted, setAutoLoginAttempted] = React.useState(false);
  
  useEffect(() => {
    // Only run once and only if not already authenticated and not already attempted
    if (isAuthenticated || autoLoginAttempted) {
      return;
    }
    
    // Don't auto-login if user is on login/registration page
    const currentPath = window.location.pathname;
    if (currentPath === '/' || currentPath.includes('login') || currentPath.includes('register')) {
      console.log('🚫 Auto-login disabled - user is on login/registration page');
      return;
    }
    
    const currentPort = window.location.port;
    
    // Define auto-login mapping for different ports
    const autoLoginConfig = {
      '3001': { username: 'doctor', password: 'doctor123', role: 'doctor', dashboard: '/doctor/dashboard' },
      '3002': { username: 'patient', password: 'patient123', role: 'patient', dashboard: '/patient/dashboard' },
      '3003': { username: 'management', password: 'management123', role: 'management', dashboard: '/management/dashboard' }
    };
    
    const config = autoLoginConfig[currentPort];
    
    // If running on a configured port
    if (config) {
      setAutoLoginAttempted(true); // Mark as attempted immediately to prevent loops
      console.log(`🔄 Auto-login detected for port ${currentPort} - logging in as ${config.role}...`);
      
      const autoLogin = async () => {
        try {
          const response = await authService.login(config.username, config.password);
          if (response && response.user) {
            login({ user: response.user, token: response.token });
            console.log(`✅ Auto-login successful for ${config.role}`);
            // Don't use window.location.href - let React Router handle navigation
          }
        } catch (error) {
          console.error('❌ Auto-login failed:', error);
        }
      };
      
      // Add a small delay to let the component mount properly
      setTimeout(autoLogin, 500);
    }
  }, []); // Remove dependencies that cause loops
  
  return null; // This component doesn't render anything
};

function App() {
  // Initialize asset loading manager
  useEffect(() => {
    // DISABLED: Asset manager is automatically initialized when imported (causes rapid re-renders)
    // console.log('Asset Loading Manager initialized');
    
    // DISABLED: Initialize CSS Monitor (causes rapid re-renders)
    // console.log('CSS Monitor initialized');
    
    // DISABLED: Additional CSS integrity check (causes rapid re-renders)
    // const checkCSSIntegrity = () => {
    //   const links = document.querySelectorAll('link[rel="stylesheet"]');
    //   links.forEach(link => {
    //     if (link.sheet === null) {
    //       console.warn('CSS failed to load:', link.href);
    //       // Attempt to reload failed CSS
    //       const newLink = link.cloneNode();
    //       newLink.href = link.href + '?reload=' + Date.now();
    //       link.parentNode.replaceChild(newLink, link);
    //     }
    //   });
    // };

    // DISABLED: Check CSS integrity after component mount (causes timers)
    // setTimeout(checkCSSIntegrity, 2000);
  }, []);

  return (
    <AssetErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <DataProvider>
            <AutoLoginHandler />
            <CSSLoadingGuard>
              <Router>
            <div className="App">
              {/* Critical Alert Banner - Shows at top of all pages for admin/management */}
              <CriticalAlertBanner />
              <Header /> {/* Add Header component here */}
              <div className="main-content">
                <Suspense fallback={
                  <div className="d-flex justify-content-center align-items-center" style={{height: '50vh'}}>
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                }>
                  <Routes>
                    <Route path="/" element={<Homepage />} />
                    <Route path="/auth" element={<LoginSignup />} />
                    <Route path="/login" element={<Navigate to="/auth" replace />} />
                    <Route path="/health-stock" element={<HealthStock />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/contact" element={<ContactUs />} />
                    <Route 
                      path="/doctor/dashboard" 
                    element={
                      <ProtectedRoute allowedRoles={['doctor']}>
                        <DoctorLayout />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/dashboard" 
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/patient/dashboard" 
                    element={
                      <ProtectedRoute allowedRoles={['patient']}>
                        <PatientLayout />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/management/dashboard" 
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'management']}>
                        <ManagementDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  {/* Add other routes here */}
                </Routes>
              </Suspense>
            </div>
            {/* Global Session Warning Modal */}
            <SessionWarningModal />
          </div>
          </Router>
            </CSSLoadingGuard>
        </DataProvider>
      </AuthProvider>
      {/* React Query Devtools - only in development */}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
    </AssetErrorBoundary>
  );
}

export default App;
