import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState({
    id: '',
    fullname: '',
    email: '',
    phone: '',
    location: '',
    role: '',
  });

  const [pickups, setPickups] = useState([]);
  const [view, setView] = useState('dashboard');
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (!userId || localStorage.getItem('isLoggedIn') !== 'true') {
      handleLogout();
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await api.get(`/api/user/${userId}`);
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          handleLogout();
        }
      }
    };

    const fetchPickups = async () => {
      try {
        const response = await api.get(`/api/pickups/user/${userId}`);
        setPickups(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching pickups:', error);
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          handleLogout();
        }
        setPickups([]);
      }
    };

    fetchProfile();
    fetchPickups();
  }, [userId, navigate]);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    try {
      const updateData = { ...user };
      const response = await api.put(`/api/user/update`, updateData);

      if (response.status === 200) {
        alert('Profile updated successfully!');
        setView('dashboard');
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile: ' + (error.response?.data?.message || error.message || 'An unknown error occurred.'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('workerToken');
    localStorage.removeItem('workerRole');
    localStorage.removeItem('workerUsername');
    window.dispatchEvent(new Event('loginStatusChanged'));
    navigate('/login');
  };

  const wasteItems = [
    { name: 'Laptop', price: '₹1,500*', image: 'https://www.diamondcomputers.co.uk/193-large_default/services-and-repairs-laptop-broken-screen-replacements.jpg' },
    { name: 'Mobile / Tablet', price: '₹800*', image: 'https://cityrepair.au/wp-content/uploads/2022/07/Galaxy-Tab-Screen-repair.jpg.webp' },
    { name: 'Fridge', price: '₹1,500*', image: 'https://images.jdmagicbox.com/quickquotes/images_main/refrigerator-scrap-2219509427-iw6dq6oa.jpg' },
    { name: 'TV', price: '₹800*', image: 'https://i.pinimg.com/736x/9d/c0/7e/9dc07e2422dd353ca0547d877500635b.jpg' },
    { name: 'Cooler', price: '₹500*', image: 'https://5.imimg.com/data5/SELLER/Default/2022/2/KV/DD/HM/146664232/cooler-waste-scrap-500x500.png' },
    { name: 'Washing Machine', price: '₹1,200*', image: 'https://as1.ftcdn.net/jpg/02/80/56/26/1000_F_280562639_qYris0M1bcJHBSjTmrtt1ueHLaDCw3Bd.jpg' },
    { name: 'Microwave', price: '₹700*', image: 'https://c8.alamy.com/comp/2KYKPA1/old-broken-small-hot-plate-oven-and-other-old-e-waste-appliances-pilled-up-in-the-background-2KYKPA1.jpg' },
  ];

  const getImageUrl = (base64Data) => {
    if (base64Data) {
      return `data:image/jpeg;base64,${base64Data}`;
    }
    return 'https://via.placeholder.com/50';
  };

  const menuItems = [
    { name: 'Dashboard', icon: '🧭', view: 'dashboard' },
    { name: 'Edit Profile', icon: '🛠️', view: 'edit' },
    { name: 'Pickup History', icon: '📜', view: 'pickup' },
  ];

  return (
    <div className="flex bg-gray-100 min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-green-800 text-white p-6 flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-extrabold mb-8 text-white">
            ♻️ E-Waste Hub
          </h1>
          <ul className="space-y-4">
            {menuItems.map((item) => (
              <li
                key={item.name}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${view === item.view
                    ? 'bg-green-700 font-bold shadow-inner'
                    : 'hover:bg-green-700 hover:bg-opacity-70'
                  }`}
                onClick={() => setView(item.view)}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.name}</span>
              </li>
            ))}
            <li
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 bg-yellow-400 text-green-900 font-bold hover:bg-yellow-500 hover:scale-105 transform"
              onClick={() => navigate('/pickup')}
            >
              <span className="text-xl">📦</span>
              <span>Schedule Pickup</span>
            </li>
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto relative">
        <button
          onClick={handleLogout}
          className="absolute top-8 right-8 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors duration-200 shadow-md flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h6a1 1 0 110 2H4v10h12V4h-6a1 1 0 110-2h6a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4a1 1 0 011-1zm10.707 9.293a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L10.586 13H4a1 1 0 110-2h6.586l-1.293-1.293a1 1 0 011.414-1.414l3 3z" clipRule="evenodd" />
          </svg>
          Logout
        </button>

        <h2 className="text-4xl font-extrabold text-green-900 mb-8">
          Welcome, {user.fullname || 'User'}!
        </h2>

        {/* Dashboard */}
        {view === 'dashboard' && (
          <>
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8 text-center max-w-2xl mx-auto border border-gray-200">
              <img
                src="https://i.pravatar.cc/150?img=3"
                alt="Profile"
                className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-green-500 shadow-md"
              />
              <h3 className="text-2xl font-bold text-gray-800">{user.fullname}</h3>
              <p className="text-green-600 font-semibold">{user.role}</p>
              <p className="text-gray-500 mt-2">{user.location}</p>
              <div className="mt-4 flex justify-center space-x-4 text-gray-600">
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  {user.email}
                </span>
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.163 18 3 13.837 3 8V6a1 1 0 011-1h2z" />
                  </svg>
                  {user.phone}
                </span>
              </div>
            </div>

            <section className="mt-12">
              <h3 className="text-2xl font-bold text-green-800 mb-4">Your Pickup Analytics</h3>
              <div className="bg-white p-6 rounded-xl shadow-md">
                <ul className="mb-4 text-lg text-gray-700">
                  <li className="mb-2">
                    You have scheduled a total of{' '}
                    <strong className="text-green-600">{pickups.length}</strong> E-Waste
                    pickups.
                  </li>
                  <li>
                    Your next scheduled pickup is on:{' '}
                    <strong className="text-green-600">
                      {pickups.length > 0 ? new Date(pickups[0].date).toLocaleDateString() : 'N/A'}
                    </strong>
                  </li>
                </ul>
              </div>
            </section>

            <section className="mt-12">
              <h3 className="text-2xl font-bold text-green-800 mb-4">Estimated Recycling Prices</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {wasteItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-5 rounded-xl shadow-md text-center transform transition-transform duration-200 hover:scale-105 border border-gray-200"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-32 w-full object-cover rounded-lg mb-4"
                    />
                    <p className="font-bold text-lg text-gray-800">{item.name}</p>
                    <p className="text-green-600 font-extrabold text-xl mt-1">{item.price}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Edit Profile */}
        {view === 'edit' && (
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl mx-auto border border-gray-200">
            <h2 className="text-3xl font-bold text-green-800 mb-6">Edit Profile</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Full Name</label>
                <input
                  name="fullname"
                  value={user.fullname}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
                  placeholder="Full Name"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Location</label>
                <input
                  name="location"
                  value={user.location}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
                  placeholder="Location"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">New Password</label>
                <input
                  name="password"
                  value={user.password || ''}
                  onChange={handleChange}
                  type="password"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
                  placeholder="New Password (leave blank if not changing)"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Email</label>
                <input
                  name="email"
                  value={user.email}
                  disabled
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-gray-500"
                  placeholder="Email"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Role</label>
                <input
                  name="role"
                  value={user.role}
                  disabled
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-gray-500"
                  placeholder="Role"
                />
              </div>
              <button
                onClick={handleUpdate}
                className="w-full bg-green-700 text-white px-4 py-3 rounded-lg font-bold hover:bg-green-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Pickup History */}
        {view === 'pickup' && (
          <section className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
            <h2 className="text-3xl font-bold text-green-800 mb-6">Pickup History</h2>
            {pickups.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-collapse">
                  <thead className="bg-green-50">
                    <tr className="text-left">
                      <th className="p-4 border-b border-gray-300 text-sm font-semibold text-gray-700">Date & Time</th>
                      <th className="p-4 border-b border-gray-300 text-sm font-semibold text-gray-700">Waste Type</th>
                      <th className="p-4 border-b border-gray-300 text-sm font-semibold text-gray-700">Status</th>
                      <th className="p-4 border-b border-gray-300 text-sm font-semibold text-gray-700">Items & Value</th>
                      <th className="p-4 border-b border-gray-300 text-sm font-semibold text-gray-700">Address</th>
                      <th className="p-4 border-b border-gray-300 text-sm font-semibold text-gray-700">Image</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pickups.map((pickup, i) => (
                      <tr key={i} className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
                        <td className="p-4 text-sm text-gray-800">
                          <div>{pickup.date || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{pickup.time || 'N/A'}</div>
                        </td>
                        <td className="p-4 text-sm text-gray-800">{pickup.wasteType || 'N/A'}</td>
                        <td className="p-4 text-sm text-gray-800">
                          <div className="flex flex-col gap-1">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold text-center ${pickup.status === 'COMPLETED' ? 'bg-green-200 text-green-800' :
                                pickup.status === 'CANCELLED' ? 'bg-red-200 text-red-800' :
                                  'bg-blue-100 text-blue-800'
                              }`}>
                              {pickup.status}
                            </span>
                            {pickup.trackingStatus && (
                              <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-center">
                                Tracker: {pickup.trackingStatus}
                              </span>
                            )}
                            {pickup.rescheduleReason && (
                              <span className="text-xs text-orange-600 italic max-w-[150px]">
                                Rescheduled: {pickup.rescheduleReason}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-800">
                          <div className="font-semibold text-green-700">
                            Total: ₹{pickup.estimatedValue ? pickup.estimatedValue.toFixed(2) : '0.00'}
                          </div>
                          {pickup.items && pickup.items.length > 0 ? (
                            <div className="mt-1 text-xs text-gray-600">
                              <p className="font-bold border-b border-gray-200 pb-1 mb-1">Added Items:</p>
                              {pickup.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between gap-2">
                                  <span>• {item.wasteType}</span>
                                  <span>₹{item.estimatedValue}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">No extra items</span>
                          )}
                        </td>
                        <td className="p-4 text-sm text-gray-800">
                          <div className="max-w-[150px] truncate">{pickup.address}</div>
                          <div className="text-xs text-gray-500">{pickup.city}, {pickup.pincode}</div>
                        </td>
                        <td className="p-4 text-sm text-gray-800">
                          {pickup.imageData ? (
                            <img
                              src={pickup.imageData.startsWith('/uploads') ? `http://localhost:8082${pickup.imageData}` : getImageUrl(pickup.imageData)}
                              alt="Pickup Item"
                              className="w-16 h-16 object-cover rounded-lg shadow border border-gray-200"
                            />
                          ) : (
                            <span className="text-gray-400 text-xs">No Image</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No pickup records found. Schedule your first pickup!</p>
            )}
          </section>
        )}

        <div className="bg-green-50 border border-green-200 p-6 rounded-xl text-sm text-green-800 mt-12 shadow-inner">
          <h4 className="font-extrabold text-lg mb-2">Terms & Conditions:</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>Prices shown are approximate and may vary based on item condition and location.</li>
            <li>Items must be in a recyclable state (no excessive damage or contamination).</li>
            <li>Pickups are subject to availability and area coverage.</li>
            <li>We reserve the right to reject items that don’t meet minimum requirements.</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default Profile;