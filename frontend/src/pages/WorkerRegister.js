import React, { useState } from 'react';
import { registerWorker } from '../services/workerApi';
import { useNavigate, Link } from 'react-router-dom';

const WorkerRegister = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullname: '',
    phone: '',
    email: '',
    city: '',
    pincode: '',
    location: '',
    aadhar: ''
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingStatus, setGeocodingStatus] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.fullname.trim()) {
      newErrors.fullname = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Please enter a valid 6-digit pincode';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    
    if (!formData.aadhar.trim()) {
      newErrors.aadhar = 'Aadhar number is required';
    } else if (!/^\d{12}$/.test(formData.aadhar.replace(/\D/g, ''))) {
      newErrors.aadhar = 'Please enter a valid 12-digit Aadhar number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setGeocodingStatus('');
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setIsGeocoding(true);
    setGeocodingStatus('🔍 Finding coordinates for your location...');

    try {
      const response = await registerWorker(formData);
      setGeocodingStatus('✅ Location coordinates found successfully!');
      setMessage(response);
      setTimeout(() => {
      navigate('/worker/login');
      }, 2000);
    } catch (err) {
      setIsGeocoding(false);
      if (typeof err === 'object' && err !== null && err.message) {
        setError(err.message);
        if (err.message.includes('geographical coordinates') || err.message.includes('location')) {
          setGeocodingStatus('❌ Could not find coordinates for this location. Please provide a more specific address.');
        }
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError('An unknown error occurred during registration.');
      }
    } finally {
      setIsLoading(false);
      setIsGeocoding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-green-600 rounded-full mb-6 animate-pulse">
            <span className="text-4xl">👷</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Join Our <span className="text-blue-600">Worker</span> Team
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Help us make a difference in e-waste management. Register as a worker and be part of the solution.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-green-600 p-8 text-white text-center">
            <h2 className="text-3xl font-bold mb-2">Worker Registration</h2>
            <p className="text-blue-100">Fill in your details to get started</p>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information Section */}
              <div className="bg-blue-50 p-6 rounded-2xl">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">👤</span>
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
                    <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                      Username *
                    </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
                      className={`w-full p-4 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition duration-300 ${
                        errors.username ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter your username"
                      disabled={isLoading}
                    />
                    {errors.username && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {errors.username}
                      </p>
                    )}
          </div>

          <div>
                    <label htmlFor="fullname" className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name *
                    </label>
            <input
              type="text"
              id="fullname"
              name="fullname"
              value={formData.fullname}
              onChange={handleChange}
                      className={`w-full p-4 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition duration-300 ${
                        errors.fullname ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter your full name"
                      disabled={isLoading}
                    />
                    {errors.fullname && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {errors.fullname}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="bg-green-50 p-6 rounded-2xl">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">📞</span>
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full p-4 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition duration-300 ${
                        errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter your email"
                      disabled={isLoading}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {errors.email}
                      </p>
                    )}
          </div>

          <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number *
                    </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
                      className={`w-full p-4 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition duration-300 ${
                        errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter your phone number"
                      disabled={isLoading}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {errors.phone}
                      </p>
                    )}
                  </div>
          </div>
          </div>

              {/* Location Information Section */}
              <div className="bg-purple-50 p-6 rounded-2xl">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">📍</span>
                  Location Information
                </h3>
                <div className="mb-4 p-3 bg-blue-100 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">📍 Note:</span> We'll automatically find your exact coordinates for efficient pickup assignment. 
                    Please provide a detailed address including street name, area, and nearby landmarks.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
                    <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
                      City *
                    </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
                      className={`w-full p-4 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition duration-300 ${
                        errors.city ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter your city"
                      disabled={isLoading}
                    />
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {errors.city}
                      </p>
                    )}
          </div>

          <div>
                    <label htmlFor="pincode" className="block text-sm font-semibold text-gray-700 mb-2">
                      Pincode *
                    </label>
            <input
              type="text"
              id="pincode"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
                      className={`w-full p-4 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition duration-300 ${
                        errors.pincode ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter pincode"
                      disabled={isLoading}
                    />
                    {errors.pincode && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {errors.pincode}
                      </p>
                    )}
          </div>

          <div>
                    <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">
                      Location * 
                      {isGeocoding && (
                        <span className="ml-2 text-blue-600 text-sm font-normal">
                          🔍 Finding coordinates...
                        </span>
                      )}
                    </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
                      className={`w-full p-4 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition duration-300 ${
                        errors.location ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter your detailed location (e.g., Street, Area, Landmark)"
                      disabled={isLoading}
                    />
                    {geocodingStatus && (
                      <p className={`text-sm mt-1 flex items-center ${
                        geocodingStatus.includes('success') ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        <span className="mr-1">📍</span>
                        {geocodingStatus}
                      </p>
                    )}
                    {errors.location && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {errors.location}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Aadhar Section */}
              <div className="bg-blue-50 p-6 rounded-2xl">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🆔</span>
                  Aadhar Details
                </h3>
                <div>
                  <label htmlFor="aadhar" className="block text-sm font-semibold text-gray-700 mb-2">
                    Aadhar Number *
                  </label>
                  <input
                    type="text"
                    id="aadhar"
                    name="aadhar"
                    value={formData.aadhar}
                    onChange={handleChange}
                    className={`w-full p-4 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition duration-300 ${
                      errors.aadhar ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter your 12-digit Aadhar number"
                    maxLength="12"
                    disabled={isLoading}
                  />
                  {errors.aadhar && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {errors.aadhar}
                    </p>
                  )}
                </div>
              </div>

              {/* Security Section */}
              <div className="bg-yellow-50 p-6 rounded-2xl">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🔐</span>
                  Security
                </h3>
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full p-4 pr-12 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition duration-300 ${
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
          </div>

              {/* Submit Button */}
              <div className="text-center">
          <button
            type="submit"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-12 py-4 rounded-full font-semibold text-lg hover:from-blue-700 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      {isGeocoding ? 'Finding location coordinates...' : 'Registering...'}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span className="mr-2">👷</span>
                      Register as Worker
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

            {/* Login Link */}
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/worker/login"
                  className="text-blue-600 hover:text-blue-800 font-semibold transition duration-200"
                >
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerRegister;
