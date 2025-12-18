import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Register() {
  const navigate = useNavigate();

  // State for form data
  const [formData, setFormData] = useState({
    fullname: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    location: '',
    role: 'individual'
  });

  // State for error and success messages
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear messages on change
    setError('');
    setSuccess('');
  };

  // Validate form data
  const validateForm = () => {
    const { fullname, phone, email, password, confirmPassword, location } = formData;

    if (fullname.length < 4) {
      setError('Full name must be at least 4 characters long');
      return false;
    }

    if (!/^\d{10}$/.test(phone)) {
      setError('Phone number must be exactly 10 digits');
      return false;
    }

    if (!email.includes('@')) {
      setError('Email must contain "@" symbol');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (location.trim() === '') {
      setError('Location is required');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      // Make a POST request to the registration API
      const response = await axios.post('http://localhost:8082/api/register', {
        fullname: formData.fullname,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        location: formData.location,
        role: formData.role
      });

      const { userId } = response.data;

      setSuccess('Registration successful!');
      localStorage.setItem('userId', userId);

      // Redirect to the login page after 2 seconds
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
    }
  };

  return (
    // Main container with a vibrant gradient background
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-green-100 to-green-200 p-6">
      <div className="max-w-xl w-full bg-white p-10 rounded-2xl shadow-2xl border border-gray-100 transform transition-all duration-300 hover:shadow-3xl">
        <div className="flex justify-center mb-6">
          {/* A sparkling emoji for a new user */}
          <span role="img" aria-label="sparkles" className="text-5xl transform transition-transform duration-500 hover:scale-125">🌟</span>
        </div>
        <h2 className="text-4xl font-bold text-center text-green-700 mb-2 font-sans">
          Join Us!
        </h2>
        <p className="text-center text-gray-500 mb-8 font-light">
          Create your account to start your journey.
        </p>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-center font-medium">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-center font-medium">{success}</div>}

        <form onSubmit={handleSubmit}>
          {/* Input Fields */}
          <div className="grid md:grid-cols-2 md:gap-6">
            {[
              { label: 'Full Name', name: 'fullname', type: 'text' },
              { label: 'Phone Number', name: 'phone', type: 'tel' },
              { label: 'Email', name: 'email', type: 'email' },
              { label: 'Location', name: 'location', type: 'text' },
              { label: 'Password', name: 'password', type: 'password' },
              { label: 'Confirm Password', name: 'confirmPassword', type: 'password' }
            ].map(({ label, name, type }) => (
              <div className="mb-6" key={name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type={type}
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition duration-200"
                  placeholder={`Enter your ${label.toLowerCase()}`}
                  required
                />
              </div>
            ))}
          </div>

          {/* Role Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <div className="relative">
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 appearance-none pr-10 transition duration-200"
              >
                <option value="individual">Individual</option>
                <option value="commercial">Commercial</option>
                <option value="charity">Charity</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg font-bold text-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            Register
          </button>
        </form>

        {/* Login Redirect */}
        <p className="mt-6 text-sm text-gray-500 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-green-600 font-bold hover:underline transition duration-200">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
