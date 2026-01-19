import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../services/api';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password, role: 'admin' })
      });
      const data = await response.json();

      if (response.ok) {
        if (!data.token) {
          setMessage('Login successful, but token missing.');
          return;
        }
        localStorage.setItem('token', data.token);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('loginTime', Date.now().toString());
        // Force role to lowercase 'admin' for ProtectedRoute matching
        localStorage.setItem('role', 'admin');
        window.dispatchEvent(new Event('loginStatusChanged'));
        navigate('/admin');
      } else {
        setMessage(data.message || 'Admin login failed.');
      }
    } catch (err) {
      setMessage('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-green-50 to-blue-50 p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">Admin Login</h2>
        <p className="text-center text-gray-600 mb-8">Sign in to manage the platform</p>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <input
              id="email"
              type="email"
              className="w-full p-4 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 border-gray-300"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <input
              id="password"
              type="password"
              className="w-full p-4 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 border-gray-300"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          <button
            type="submit"
            className={`w-full text-white p-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 transform hover:scale-105 ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {message && (
          <div className="mt-4 p-4 rounded-xl text-center text-sm font-medium bg-red-50 text-red-700 border border-red-200">
            {message}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link to="/" className="text-green-700 hover:underline">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;


