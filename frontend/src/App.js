import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import Maps from './pages/Maps';
import Pickup from './pages/Pickup';
import Buy from './pages/Buy';
import CommercialDashboard from './pages/CommercialDashboard';
import Contact from './pages/Contact';
import OurMission from './pages/OurMission';

// Import your new worker components
import WorkerRegister from './pages/WorkerRegister';
import WorkerLogin from './pages/WorkerLogin';
import WorkerDashboard from './pages/WorkerDashboard';

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/maps" element={<Maps />} />
        <Route path="/buy" element={<Buy />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/our-mission" element={<OurMission />} />

        {/* Worker Specific Public Routes */}
        <Route path="/worker/register" element={<WorkerRegister />} />
        <Route path="/worker/login" element={<WorkerLogin />} />

        {/* Protected Routes for Regular Users - allowedRoles must be lowercase here */}
        <Route element={<ProtectedRoute allowedRoles={['individual', 'commercial', 'charity']} />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/pickup" element={<Pickup />} />
            <Route path="/commercial-dashboard" element={<CommercialDashboard />} />
            {/* Add other user-specific protected routes here */}
        </Route>

        {/* Protected Routes for Workers - allowedRoles must be lowercase here */}
        <Route element={<ProtectedRoute allowedRoles={['worker']} />}>
            <Route path="/worker/dashboard" element={<WorkerDashboard />} />
            {/* Add other worker-specific protected routes here, e.g., for updating pickup status */}
        </Route>

        {/* Fallback for unknown routes */}
        <Route path="*" element={<h2>404 Not Found</h2>} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;