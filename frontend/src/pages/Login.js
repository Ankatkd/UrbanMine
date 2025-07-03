import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('individual'); // Default role
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await fetch('http://localhost:8082/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, password, role }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.token) {
          localStorage.setItem('token', data.token);
        } else {
          console.error("Login response did not contain a token.");
          setMessage("Login successful, but no token received. Please try again or contact support.");
          return;
        }

        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('loginTime', Date.now().toString());
        localStorage.setItem('role', data.role);

        window.dispatchEvent(new Event('loginStatusChanged'));

        const loggedInRole = data.role;
        if (loggedInRole === 'commercial') {
          navigate('/commercial-dashboard');
        } else if (loggedInRole === 'individual' || loggedInRole === 'charity') {
          navigate('/profile');
        } else {
          console.warn("Unknown role encountered after login:", loggedInRole);
          navigate('/');
        }
      } else {
        setMessage(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage('An error occurred during login. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-3xl font-extrabold text-green-800 mb-6 text-center">Login</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="identifier" className="block text-gray-700 mb-1">
              Email / Phone Number
            </label>
            <input
              type="text"
              id="identifier"
              name="identifier"
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="role" className="block text-gray-700 mb-1">
              Select Role
            </label>
            <select
              id="role"
              name="role"
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="">Select your role</option>
              <option value="individual">Individual</option>
              <option value="commercial">Commercial</option>
              <option value="charity">Charity</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-green-700 hover:bg-green-800 text-white p-3 rounded-lg font-medium"
          >
            Login
          </button>
        </form>

        {message && <p className="text-center text-red-600 mt-4">{message}</p>}

        <p className="mt-6 text-sm text-center text-gray-600">
          Don’t have an account?{' '}
          <Link to="/register" className="text-green-700 font-medium hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
