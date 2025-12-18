import React, { useState } from 'react';
import { loginWorker } from '../services/workerApi';
import { useNavigate, Link } from 'react-router-dom';

const WorkerLogin = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(''); // Success message
  const [error, setError] = useState(''); // Error message
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    
    if (!identifier.trim()) {
      newErrors.identifier = 'Username is required';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await loginWorker({ identifier, password });

      localStorage.setItem('workerToken', response.token);
      localStorage.setItem('workerRole', response.role);
      localStorage.setItem('workerUsername', identifier);

      window.dispatchEvent(new Event('loginStatusChanged'));
      navigate('/worker/dashboard');
    } catch (err) {
      if (typeof err === 'object' && err !== null && err.message) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError('An unknown error occurred during worker login.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-green-600 rounded-full mb-6 animate-pulse">
            <span className="text-4xl">👷</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Worker <span className="text-blue-600">Login</span>
          </h1>
          <p className="text-gray-600">Welcome back! Please sign in to your account.</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-green-600 p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-2">Sign In</h2>
            <p className="text-blue-100">Access your worker dashboard</p>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div>
                <label htmlFor="identifier" className="block text-sm font-semibold text-gray-700 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  id="identifier"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (errors.identifier) {
                      setErrors({ ...errors, identifier: '' });
                    }
                  }}
                  className={`w-full p-4 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition duration-300 ${
                    errors.identifier ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter your username"
                  disabled={isLoading}
                />
                {errors.identifier && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.identifier}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) {
                        setErrors({ ...errors, password: '' });
                      }
                    }}
                    className={`w-full p-4 pr-12 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition duration-300 ${
                      errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
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

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Signing In...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span className="mr-2">🔑</span>
                      Sign In
                    </div>
                  )}
                </button>
              </div>
            </form>

            {/* Messages */}
            {message && (
              <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-xl text-center">
                <div className="flex items-center justify-center text-green-700">
                  <span className="mr-2">✅</span>
                  {message}
                </div>
              </div>
            )}

            {error && (
              <div className="mt-6 p-4 bg-red-100 border border-red-300 rounded-xl text-center">
                <div className="flex items-center justify-center text-red-700">
                  <span className="mr-2">❌</span>
                  {error}
                </div>
              </div>
            )}

            {/* Register Link */}
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link
                  to="/worker/register"
                  className="text-blue-600 hover:text-blue-800 font-semibold transition duration-200"
                >
                  Register here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerLogin;
