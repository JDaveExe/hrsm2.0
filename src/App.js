import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Header from './components/Header'; // Keep Header for immediate load
import ProtectedRoute from './components/ProtectedRoute'; // Keep ProtectedRoute for immediate load

// Import context providers
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/LoginSignup.css';
import './styles/Services.css';
import './styles/AdminDashboard.css';
import './styles/Appointments.css';

// Lazy load components
const Homepage = lazy(() => import('./components/Homepage'));
const LoginSignup = lazy(() => import('./components/LoginSignup'));
const Services = lazy(() => import('./components/Services'));
const ContactUs = lazy(() => import('./components/ContactUs'));
const Appointments = lazy(() => import('./components/Appointments'));
const DocDashboard = lazy(() => import('./components/DocDashboard'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const PatientDashboard = lazy(() => import('./components/PatientDashboard'));

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <div className="App">
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
                  <Route path="/appointments" element={<Appointments />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/contact" element={<ContactUs />} />
                  <Route 
                    path="/doctor/dashboard" 
                    element={
                      <ProtectedRoute allowedRoles={['doctor']}>
                        <DocDashboard />
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
                        <PatientDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  {/* Add other routes here */}
                </Routes>
              </Suspense>
            </div>
          </div>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
