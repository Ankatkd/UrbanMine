import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './Pickup.css';
import api from '../services/api';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
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
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState('');
  const [dailyPickupCounts, setDailyPickupCounts] = useState({});
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
  }, [formData.pincode]);

  const getTodayDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

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
    if (formData.image) {
      submitFormData.append('image', formData.image);
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
      if (
        err.response &&
        err.response.data &&
        err.response.data.message &&
        err.response.data.message.includes("Data too long for column 'status'")
      ) {
        alert('Failed to schedule pickup: The status field might be too long. Please inform the administrator.');
      } else if (err.response && err.response.data && err.response.data.message) {
        alert('Error occurred while scheduling pickup: ' + err.response.data.message);
      } else {
        alert('Error occurred while scheduling pickup. Please try again.');
      }
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

  const isDateDisabled = (date) => {
    const dateString = date.toISOString().split('T')[0];
    const count = dailyPickupCounts[dateString] || 0;
    return count >= MAX_PICKUPS_PER_DAY;
  };

  const highlightDates = (date) => {
    const dateString = date.toISOString().split('T')[0];
    const count = dailyPickupCounts[dateString] || 0;
    return count >= MAX_PICKUPS_PER_DAY ? 'red-date' : '';
  };

  return (
    <div className="pickup-wrapper bg-gray-100 min-h-screen flex items-center justify-center p-4">
      <div className="pickup-form-container bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
        <h2 className="text-3xl font-bold text-green-700 mb-6 text-center">Schedule E-Waste Pickup</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* User Details (pre-filled) */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Name:
            </label>
            <input
              type="text"
              name="schedulerName"
              value={formData.schedulerName}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email:
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Phone:
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
              disabled={loading}
            />
          </div>

          {/* Pickup Details */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Pickup Address:
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter full address"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Pincode:
            </label>
            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter 6-digit pincode"
              maxLength="6"
              required
              disabled={loading}
            />
            {pincodeError && <p className="text-red-500 text-xs italic mt-1">{pincodeError}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                City:
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100"
                required
                disabled={true} // Auto-filled
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                State:
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100"
                required
                disabled={true} // Auto-filled
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Preferred Pickup Date:
              </label>
              <DatePicker
                selected={formData.date}
                onChange={handleDateChange}
                minDate={new Date()}
                filterDate={(date) => date.getDay() !== 0}
                dayClassName={highlightDates}
                dateFormat="yyyy-MM-dd"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholderText="Select a date"
                required
                disabled={loading}
              />
              <p className="text-sm text-gray-500 mt-1">
                <span className="text-red-500">Red dates</span> are fully booked.
              </p>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Preferred Pickup Time:
              </label>
              <select
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
                disabled={loading}
              >
                <option value="">Select Time</option>
                <option value="09:00-12:00">09:00 AM - 12:00 PM</option>
                <option value="12:00-15:00">12:00 PM - 03:00 PM</option>
                <option value="15:00-18:00">03:00 PM - 06:00 PM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Type of E-Waste:
            </label>
            <select
              name="wasteType"
              value={formData.wasteType}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
              disabled={loading}
            >
              <option value="">Select Waste Type</option>
              <option value="Computers_Laptops">Computers & Laptops</option>
              <option value="Monitors_TVs">Monitors & TVs (CRT, LCD, LED)</option>
              <option value="Mobile_Phones_Tablets">Mobile Phones & Tablets</option>
              <option value="Printers_Scanners_Copiers">Printers, Scanners & Copiers</option>
              <option value="Networking_Equipment">Networking Equipment (Routers, Modems)</option>
              <option value="Servers_Data_Center_Equipment">Servers & Data Center Equipment</option>
              <option value="Batteries">Batteries (Li-ion, NiCad, Lead-acid)</option>
              <option value="Cables_Wires">Cables & Wires</option>
              <option value="Small_Home_Appliances">Small Home Appliances (Toasters, Kettles)</option>
              <option value="Large_Home_Appliances">Large Home Appliances (Refrigerators, Washing Machines)</option>
              <option value="Audio_Video_Equipment">Audio & Video Equipment (Stereos, DVDs)</option>
              <option value="Gaming_Consoles">Gaming Consoles</option>
              <option value="Medical_Equipment">Medical Equipment (Non-Hazardous E-waste)</option>
              <option value="Lab_Equipment">Laboratory Equipment (Non-Hazardous E-waste)</option>
              <option value="Other">Other (Please specify)</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Upload Image of Item:
            </label>
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleImageChange}
              ref={fileInputRef}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-green-50 file:text-green-700
                hover:file:bg-green-100"
              required
              disabled={loading}
            />
            {imagePreview && (
              <div className="mt-4">
                <img src={imagePreview} alt="Waste Item Preview" className="max-h-48 rounded shadow-md" />
              </div>
            )}
          </div>

          <button
            type="submit"
            className={`w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            {loading ? 'Processing...' : (localStorage.getItem('userRole') === 'charity' ? 'Schedule Free Pickup' : `Proceed to Payment (₹${FIXED_PICKUP_PRICE_RUPEES})`)}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Pickup;