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

import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/LoginSignup.css';
import './styles/AboutUs.css';
import './styles/AdminDashboard.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header /> {/* Add Header component here */}
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/auth" element={<LoginSignup />} /> {/* Changed to LoginSignup */}
            <Route path="/about-us" element={<AboutUs />} /> {/* Updated route */}
            <Route path="/contact" element={<ContactUs />} /> {/* Updated route */}
            <Route path="/docdashboard" element={<DocDashboard />} />
            <Route path="/admdashboard" element={<AdminDashboard />} />
            <Route path="/patientdashboard" element={<PatientDashboard />} />
            {/* Add other routes here */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
