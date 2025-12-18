import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  // State variables for form inputs and messages
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  // Hook for navigation
  const navigate = useNavigate();

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!identifier.trim()) {
      newErrors.identifier = 'Email or phone number is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier) && !/^\d{10}$/.test(identifier.replace(/\D/g, ''))) {
      newErrors.identifier = 'Please enter a valid email or 10-digit phone number';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!role) {
      newErrors.role = 'Please select your role';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission for login
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Make a POST request to the login API endpoint
      const response = await fetch('http://localhost:8082/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, password, role }),
      });

      const data = await response.json();

      if (response.ok) {
        // Handle successful login
        if (data.token) {
          // Store token in local storage
          localStorage.setItem('token', data.token);
        } else {
          // Handle case where token is missing
          console.error("Login response did not contain a token.");
          setMessage("Login successful, but no token received. Please try again or contact support.");
          return;
        }

        // Store other user data in local storage
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('loginTime', Date.now().toString());
        localStorage.setItem('role', data.role);

        // Dispatch an event to notify other components of the login status change
        window.dispatchEvent(new Event('loginStatusChanged'));

        // Navigate based on the user's role
        const loggedInRole = data.role;
        if (loggedInRole === 'admin') {
          navigate('/admin');
        } else if (loggedInRole === 'commercial') {
          navigate('/commercial-dashboard');
        } else if (loggedInRole === 'individual' || loggedInRole === 'charity') {
          navigate('/profile');
        } else {
          console.warn("Unknown role encountered after login:", loggedInRole);
          navigate('/');
        }
      } else {
        // Handle failed login
        setMessage(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      // Handle network or other errors
      console.error('Login error:', error);
      setMessage('An error occurred during login. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 transform transition-all duration-500 hover:shadow-3xl">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <span role="img" aria-label="recycle" className="text-6xl transform transition-transform duration-700 hover:rotate-[360deg] hover:scale-110">♻️</span>
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-2">
          Welcome <span className="text-green-600">Back</span>
        </h2>
        <p className="text-center text-gray-600 mb-8 font-medium">
          Sign in to your account to continue your eco-journey
        </p>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="identifier" className="block text-sm font-semibold text-gray-700 mb-2">
              Email or Phone Number
            </label>
            <input
              type="text"
              id="identifier"
              name="identifier"
              className={`w-full p-4 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition duration-300 ${
                errors.identifier ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter your email or phone number"
              disabled={isLoading}
            />
            {errors.identifier && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <span className="mr-1">⚠️</span>
                {errors.identifier}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                className={`w-full p-4 pr-12 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition duration-300 ${
                  errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition duration-200"
                disabled={isLoading}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <span className="mr-1">⚠️</span>
                {errors.password}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">
              Select Your Role
            </label>
            <div className="relative">
              <select
                id="role"
                name="role"
                className={`w-full p-4 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 appearance-none pr-10 transition duration-300 ${
                  errors.role ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={isLoading}
              >
                <option value="" disabled>Choose your role</option>
                <option value="individual">👤 Individual</option>
                <option value="commercial">🏢 Commercial</option>
                <option value="charity">❤️ Charity</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            {errors.role && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <span className="mr-1">⚠️</span>
                {errors.role}
              </p>
            )}
          </div>
          <button
            type="submit"
            className={`w-full text-white p-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
            }`}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Signing In...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-4 rounded-xl text-center text-sm font-medium ${
            message.includes('successful') || message.includes('success') 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <div className="flex items-center justify-center">
              <span className="mr-2">
                {message.includes('successful') || message.includes('success') ? '✅' : '❌'}
              </span>
              {message}
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            Don't have an account?
          </p>
          <Link 
            to="/register" 
            className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
