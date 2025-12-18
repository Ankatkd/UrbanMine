import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import api from '../services/api';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

function Pickup() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    userId: '',
    date: null,
    time: '',
    address: '',
    pincode: '',
    city: '',
    state: '',
    schedulerName: '',
    phone: '',
    email: '',
    image: null,
    wasteType: '',
    latitude: null,
    longitude: null,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState('');
  const [dailyPickupCounts, setDailyPickupCounts] = useState({});
  const [analysisResult, setAnalysisResult] = useState(null);
  const MAX_PICKUPS_PER_DAY = 5;
  const FIXED_PICKUP_PRICE_RUPEES = 40;
  const RAZORPAY_KEY_ID = 'rzp_test_bx3dOuw8U5uwJ3';

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const storedUserId = localStorage.getItem('userId');
    if (!isLoggedIn || !storedUserId) {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await api.get(`/api/user/${storedUserId}`);
        const userData = response.data;
        setFormData((prevDetails) => ({
          ...prevDetails,
          userId: userData.id,
          address: userData.location || '',
          phone: userData.phone || '',
          email: userData.email || '',
          schedulerName: userData.fullname || '',
        }));
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };

    setFormData((prev) => ({ ...prev, userId: storedUserId }));
    fetchUserData();
  }, [navigate]);

  useEffect(() => {
    const fetchPickupCounts = async () => {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const futureDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      const endDate = futureDate.toISOString().split('T')[0];

      try {
        const response = await api.get(`/api/pickups/counts?startDate=${startDate}&endDate=${endDate}`);
        setDailyPickupCounts(response.data);
      } catch (error) {
        console.error('Frontend: Error fetching daily pickup counts:', error);
      }
    };
    fetchPickupCounts();
  }, []);

  useEffect(() => {
    const fetchLocation = async () => {
      const { pincode } = formData;
      if (pincode.length === 6) {
        setPincodeError('');
        try {
          const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
          const data = await response.json();
          if (data && data[0] && data[0].Status === 'Success') {
            const postOffice = data[0].PostOffice[0];
            setFormData((prev) => ({
              ...prev,
              city: postOffice.District,
              state: postOffice.State,
            }));
          } else {
            setPincodeError('Invalid Pincode. Please enter a valid 6-digit Pincode.');
            setFormData((prev) => ({
              ...prev,
              city: '',
              state: '',
            }));
          }
        } catch (error) {
          console.error('Error fetching pincode data:', error);
          setPincodeError('Failed to fetch location. Please enter manually.');
          setFormData((prev) => ({
            ...prev,
            city: '',
            state: '',
          }));
        }
      } else if (pincode.length > 0 && pincode.length < 6) {
        setPincodeError('Pincode must be 6 digits.');
        setFormData((prev) => ({
          ...prev,
          city: '',
          state: '',
        }));
      } else {
        setPincodeError('');
        setFormData((prev) => ({
          ...prev,
          city: '',
          state: '',
        }));
      }
    };

    const debounceTimeout = setTimeout(() => {
      fetchLocation();
    }, 500);
    return () => clearTimeout(debounceTimeout);
  }, [formData.pincode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, date: date }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    } else {
      setFormData((prev) => ({ ...prev, image: null }));
      setImagePreview(null);
    }
  };

  const submitPickupDetails = async () => {
    setLoading(true);
    const submitFormData = new FormData();
    submitFormData.append('userId', formData.userId);
    submitFormData.append('date', formData.date ? formData.date.toISOString().split('T')[0] : '');
    submitFormData.append('time', formData.time);
    submitFormData.append('address', formData.address);
    submitFormData.append('pincode', formData.pincode);
    submitFormData.append('city', formData.city);
    submitFormData.append('state', formData.state);
    submitFormData.append('schedulerName', formData.schedulerName);
    submitFormData.append('phone', formData.phone);
    submitFormData.append('email', formData.email);
    submitFormData.append('wasteType', formData.wasteType);
    submitFormData.append('status', localStorage.getItem('userRole') === 'charity' ? 'Pending' : 'Paid - Pending Pickup');
    if (formData.latitude) submitFormData.append('latitude', formData.latitude);
    if (formData.longitude) submitFormData.append('longitude', formData.longitude);
    if (formData.image) {
      submitFormData.append('image', formData.image);
    }

    // Add analysis results if available
    if (analysisResult) {
      if (analysisResult.brand) submitFormData.append('brand', analysisResult.brand);
      if (analysisResult.totalEstimatedValue) submitFormData.append('estimatedValue', analysisResult.totalEstimatedValue);
      if (analysisResult.detectedItem) submitFormData.append('itemDetails', analysisResult.detectedItem);
    }

    try {
      const res = await api.post('/api/pickups/schedule', submitFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data && res.data.status === 'success') {
        alert('Pickup scheduled successfully!');
        navigate('/profile');
        const dateString = formData.date.toISOString().split('T')[0];
        setDailyPickupCounts((prev) => ({
          ...prev,
          [dateString]: (prev[dateString] || 0) + 1,
        }));
      } else {
        alert(`Failed to schedule pickup. Server response: ${res.data.message || 'Unknown error.'}`);
      }
    } catch (err) {
      console.error('Error submitting pickup details:', err);
      let errorMessage = 'Error occurred while scheduling pickup. Please try again.';
      if (err.response) {
        if (err.response.data && err.response.data.message) {
          errorMessage = 'Error occurred while scheduling pickup: ' + err.response.data.message;
        } else {
          errorMessage = 'Error occurred while scheduling pickup: ' + (err.response.statusText || 'Unknown server error.');
        }
      }
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (
      !formData.date ||
      !formData.time ||
      !formData.address ||
      !formData.pincode ||
      !formData.city ||
      !formData.state ||
      !formData.schedulerName ||
      !formData.phone ||
      !formData.email ||
      !formData.wasteType ||
      !formData.image
    ) {
      alert('Please fill in all required fields and upload an image before proceeding to payment.');
      return;
    }

    if (pincodeError) {
      alert(pincodeError);
      return;
    }

    if (formData.date) {
      const dateString = formData.date.toISOString().split('T')[0];
      const selectedDateCount = dailyPickupCounts[dateString] || 0;
      if (selectedDateCount >= MAX_PICKUPS_PER_DAY) {
        alert(`The selected date (${dateString}) has reached its maximum pickups. Choose another date.`);
        return;
      }
    }

    setLoading(true);
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      alert('Razorpay SDK failed to load.');
      setLoading(false);
      return;
    }

    try {
      const orderRes = await api.post('/api/razorpay/create-order', {
        amount: FIXED_PICKUP_PRICE_RUPEES,
        currency: 'INR',
      });

      const orderData = orderRes.data;

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'E-Waste Management',
        description: 'Pickup Charge',
        order_id: orderData.id,
        handler: async (response) => {
          alert('Payment successful! Payment ID: ' + response.razorpay_payment_id);
          await submitPickupDetails();
        },
        prefill: {
          name: formData.schedulerName,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: '#2f855a',
        },
      };

      const razor = new window.Razorpay(options);
      razor.on('payment.failed', function (response) {
        alert('Payment failed: ' + response.error.code + ' - ' + response.error.description);
        console.error('Payment failed details:', response.error);
        setLoading(false);
      });
      razor.open();
    } catch (err) {
      console.error('Payment initiation failed:', err);
      let errorMessage = 'Payment initiation failed: ';
      if (err.response) {
        errorMessage += err.response.data.message || err.response.data.error || err.response.statusText;
      } else if (err.request) {
        errorMessage += 'No response from backend.';
      } else {
        errorMessage += err.message;
      }
      alert(errorMessage);
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.image) {
      alert('Please upload an image of the item.');
      return;
    }
    if (pincodeError) {
      alert(pincodeError);
      return;
    }
    if (formData.date) {
      const dateString = formData.date.toISOString().split('T')[0];
      const selectedDateCount = dailyPickupCounts[dateString] || 0;
      if (selectedDateCount >= MAX_PICKUPS_PER_DAY) {
        alert(`Selected date (${dateString}) has reached its limit.`);
        return;
      }
    }
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'charity') {
      submitPickupDetails();
    } else {
      handlePayment();
    }
  };

  const highlightDates = (date) => {
    const dateString = date.toISOString().split('T')[0];
    const count = dailyPickupCounts[dateString] || 0;
    return count >= MAX_PICKUPS_PER_DAY ? 'red-date' : '';
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 via-white to-green-50 min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            Schedule <span className="text-green-600">E-Waste Pickup</span>
          </h2>
          <p className="text-gray-600 text-lg">
            Help us create a sustainable future by properly disposing of your electronic waste
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <div className="bg-gray-50 p-6 rounded-2xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">👤</span>
              Personal Information
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Full Name</label>
                <input
                  type="text"
                  name="schedulerName"
                  value={formData.schedulerName}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition duration-200"
                  placeholder="Enter your full name"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition duration-200"
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-700 text-sm font-semibold mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition duration-200"
                  placeholder="Enter your phone number"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Address Information Section */}
          <div className="bg-blue-50 p-6 rounded-2xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">📍</span>
              Pickup Address
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Full Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition duration-200"
                  placeholder="Enter complete pickup address"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.geolocation) {
                      setLoading(true);
                      navigator.geolocation.getCurrentPosition(
                        async (position) => {
                          const { latitude, longitude } = position.coords;
                          setFormData((prev) => ({
                            ...prev,
                            latitude,
                            longitude
                          }));

                          // Optional: Reverse geocoding to fill address details
                          try {
                            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                            const data = await response.json();
                            if (data && data.address) {
                              setFormData((prev) => ({
                                ...prev,
                                latitude,
                                longitude,
                                address: data.display_name || prev.address,
                                pincode: data.address.postcode || prev.pincode,
                                city: data.address.city || data.address.town || prev.city,
                                state: data.address.state || prev.state
                              }));
                            }
                          } catch (error) {
                            console.error("Reverse geocoding failed", error);
                          } finally {
                            setLoading(false);
                          }
                          alert("Location fetched successfully!");
                        },
                        (error) => {
                          console.error("Error getting location", error);
                          alert("Failed to get location. Please allow location access.");
                          setLoading(false);
                        }
                      );
                    } else {
                      alert("Geolocation is not supported by this browser.");
                    }
                  }}
                  className="mt-2 text-sm text-green-600 hover:text-green-800 font-semibold focus:outline-none"
                >
                  📍 Use Current Location
                </button>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  className={`w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition duration-200 ${pincodeError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  placeholder="Enter 6-digit pincode"
                  maxLength="6"
                  required
                  disabled={loading}
                />
                {pincodeError && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {pincodeError}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm bg-gray-100 cursor-not-allowed"
                    required
                    disabled={true}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm bg-gray-100 cursor-not-allowed"
                    required
                    disabled={true}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Information Section */}
          <div className="bg-green-50 p-6 rounded-2xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">📅</span>
              Pickup Schedule
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Preferred Pickup Date</label>
                <DatePicker
                  selected={formData.date}
                  onChange={handleDateChange}
                  minDate={new Date()}
                  filterDate={(date) => date.getDay() !== 0}
                  dayClassName={highlightDates}
                  dateFormat="yyyy-MM-dd"
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition duration-200"
                  placeholderText="Select a date"
                  required
                  disabled={loading}
                />
                <p className="text-sm text-gray-500 mt-2 flex items-center">
                  <span className="text-red-500 mr-1">🔴</span>
                  Red dates are fully booked
                </p>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Preferred Pickup Time</label>
                <select
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition duration-200"
                  required
                  disabled={loading}
                >
                  <option value="">Select Time Slot</option>
                  <option value="09:00-12:00">🌅 09:00 AM - 12:00 PM</option>
                  <option value="12:00-15:00">☀️ 12:00 PM - 03:00 PM</option>
                  <option value="15:00-18:00">🌆 03:00 PM - 06:00 PM</option>
                </select>
              </div>
            </div>
          </div>

          {/* E-Waste Type Section */}
          <div className="bg-purple-50 p-6 rounded-2xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">♻️</span>
              E-Waste Type
            </h3>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Select Type of E-Waste</label>
              <select
                name="wasteType"
                value={formData.wasteType}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition duration-200"
                required
                disabled={loading}
              >
                <option value="">Choose waste type</option>
                <option value="Computers_Laptops">💻 Computers & Laptops</option>
                <option value="Monitors_TVs">📺 Monitors & TVs (CRT, LCD, LED)</option>
                <option value="Mobile_Phones_Tablets">📱 Mobile Phones & Tablets</option>
                <option value="Printers_Scanners_Copiers">🖨️ Printers, Scanners & Copiers</option>
                <option value="Networking_Equipment">🌐 Networking Equipment (Routers, Modems)</option>
                <option value="Servers_Data_Center_Equipment">🖥️ Servers & Data Center Equipment</option>
                <option value="Batteries">🔋 Batteries (Li-ion, NiCad, Lead-acid)</option>
                <option value="Cables_Wires">🔌 Cables & Wires</option>
                <option value="Small_Home_Appliances">🏠 Small Home Appliances (Toasters, Kettles)</option>
                <option value="Large_Home_Appliances">🏠 Large Home Appliances (Refrigerators, Washing Machines)</option>
                <option value="Audio_Video_Equipment">🎵 Audio & Video Equipment (Stereos, DVDs)</option>
                <option value="Gaming_Consoles">🎮 Gaming Consoles</option>
                <option value="Medical_Equipment">🏥 Medical Equipment (Non-Hazardous E-waste)</option>
                <option value="Lab_Equipment">🧪 Laboratory Equipment (Non-Hazardous E-waste)</option>
                <option value="Other">❓ Other (Please specify)</option>
              </select>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="bg-yellow-50 p-6 rounded-2xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">📸</span>
              Upload Item Image
            </h3>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Upload Image of E-Waste Item</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition duration-200">
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  ref={fileInputRef}
                  className="hidden"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  📁 Choose Image
                </button>
                <p className="text-gray-500 text-sm mt-2">
                  Upload a clear image of the e-waste item for better processing
                </p>
              </div>
              {imagePreview && (
                <div className="mt-4 text-center">
                  <img
                    src={imagePreview}
                    alt="Waste Item Preview"
                    className="max-h-48 rounded-lg shadow-md mx-auto border-2 border-gray-200"
                  />
                  <p className="text-sm text-gray-600 mt-2">Preview of uploaded image</p>
                </div>
              )}
            </div>
          </div>


          {/* AI Analysis Section */}
          <div className="bg-indigo-50 p-6 rounded-2xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">🤖</span>
              AI Waste Analysis
            </h3>
            <div className="text-center">
              {!formData.image ? (
                <p className="text-gray-500">Upload an image above to enable AI analysis.</p>
              ) : (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!formData.image) return;
                      setLoading(true);
                      try {
                        const analysisFormData = new FormData();
                        analysisFormData.append('image', formData.image);
                        const res = await api.post('/api/waste/analyze', analysisFormData, {
                          headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        setAnalysisResult(res.data);
                      } catch (err) {
                        console.error("Analysis failed", err);
                        alert("Failed to analyze image. Please try again.");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition duration-200 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Analyzing...' : '🔍 Analyze Image'}
                  </button>

                  {analysisResult && (
                    <div className="mt-4 bg-white p-4 rounded-xl shadow-md text-left">
                      <h4 className="font-bold text-lg text-gray-800 mb-2">Analysis Result:</h4>
                      <p className="text-gray-700 mb-1"><strong>Brand:</strong> {analysisResult.brand}</p>
                      <p className="text-gray-700 mb-2"><strong>Detected Item:</strong> {analysisResult.detectedItem} <span className="text-sm text-gray-500">({(analysisResult.confidence * 100).toFixed(1)}% confidence)</span></p>

                      <h5 className="font-semibold text-gray-700 mb-2">Recyclable Elements:</h5>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Element</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (g)</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Value (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {analysisResult.elements.map((el, idx) => (
                              <tr key={idx}>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{el.name}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{el.weightGrams.toFixed(2)}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">₹{el.value.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50">
                            <tr>
                              <td colSpan="2" className="px-3 py-2 text-right font-bold text-gray-900">Total Estimated Value:</td>
                              <td className="px-3 py-2 font-bold text-green-600">₹{analysisResult.totalEstimatedValue.toFixed(2)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 italic">* Values are estimates based on market rates.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              className={`w-full text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${loading
                ? 'bg-gray-400 cursor-not-allowed'
                : localStorage.getItem('userRole') === 'charity'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                }`}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span className="mr-2">
                    {localStorage.getItem('userRole') === 'charity' ? '♻️' : '💳'}
                  </span>
                  {localStorage.getItem('userRole') === 'charity'
                    ? 'Schedule Free Pickup'
                    : `Proceed to Payment (₹${FIXED_PICKUP_PRICE_RUPEES})`
                  }
                </div>
              )}
            </button>
            {localStorage.getItem('userRole') !== 'charity' && (
              <p className="text-sm text-gray-500 mt-2">
                Secure payment powered by Razorpay
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default Pickup;