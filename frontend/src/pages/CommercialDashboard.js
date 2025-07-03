import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function CommercialDashboard() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(localStorage.getItem('role'));
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  useEffect(() => {
    if (!isLoggedIn || userRole !== 'commercial') {
      navigate('/login');
    }
  }, [isLoggedIn, userRole, navigate]);

  if (!isLoggedIn || userRole !== 'commercial') {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-100 p-8 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-10">
        Commercial Partner Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center justify-center text-center">
          <h2 className="text-3xl font-bold text-green-800 mb-4">Buy E-Waste</h2>
          <p className="text-gray-700 mb-6 text-lg">
            View available e-waste for tender and submit your bids for procurement.
          </p>
          <button
            onClick={() => navigate('/buy')}
            className="bg-blue-600 text-white text-xl px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-300"
          >
            Browse E-Waste
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center justify-center text-center">
          <h2 className="text-3xl font-bold text-green-800 mb-4">Sell E-Waste</h2>
          <p className="text-gray-700 mb-6 text-lg">
            Schedule pickups for large quantities of e-waste (e.g., <strong>more than 70 Kgs estimated cost</strong>).
          </p>
          <button
            onClick={() => navigate('/pickup')}
            className="bg-green-600 text-white text-xl px-8 py-3 rounded-lg hover:bg-green-700 transition-colors duration-300"
          >
            Schedule Large Pickup
          </button>
        </div>
      </div>

      <p className="mt-10 text-gray-600 text-center">
        As a commercial partner, you have access to specialized services for e-waste management.
      </p>
    </div>
  );
}

export default CommercialDashboard;
