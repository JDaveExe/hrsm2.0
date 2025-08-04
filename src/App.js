import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Header from './components/Header'; // Import the new Header component
import Homepage from './components/Homepage';
import LoginSignup from './components/LoginSignup'; // Import the new component
import AboutUs from './components/AboutUs'; // Import the AboutUs component
import ContactUs from './components/ContactUs'; // Import the ContactUs component
import DocDashboard from './components/DocDashboard';
import AdminDashboard from './components/AdminDashboard';
import PatientDashboard from './components/PatientDashboard';
import ProtectedRoute from './components/ProtectedRoute'; // Import protected route

// Import context providers
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/LoginSignup.css';
import './styles/AboutUs.css';
import './styles/AdminDashboard.css';

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <div className="App">
            <Header /> {/* Add Header component here */}
            <div className="main-content">
              <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/auth" element={<LoginSignup />} /> {/* Changed to LoginSignup */}
                <Route path="/about-us" element={<AboutUs />} /> {/* Updated route */}
                <Route path="/contact" element={<ContactUs />} /> {/* Updated route */}
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
            </div>
          </div>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
