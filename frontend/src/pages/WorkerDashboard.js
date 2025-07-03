import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getWorkerProfile,
    getWorkerPickupRequests,
    getTodaysPendingPickups,
    updatePickupRequestStatus,
    getAllWorkerPickupLogs,
    getUnassignedPickups, // NEW: Import the new service function
    assignPickup // NEW: Import the new service function
} from '../services/workerApi';
import moment from 'moment'; // For date formatting (ensure you have moment installed: npm install moment)

const WorkerDashboard = () => {
    const [workerProfile, setWorkerProfile] = useState(null);
    const [pickupRequests, setPickupRequests] = useState([]); // All assigned pickups (history)
    const [todaysPendingPickups, setTodaysPendingPickups] = useState([]); // Assigned for today, pending
    const [unassignedPickups, setUnassignedPickups] = useState([]); // NEW: State for unassigned pickups
    const [allWorkerLogs, setAllWorkerLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // State for the status update modal
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedPickup, setSelectedPickup] = useState(null);
    const [newStatusValue, setNewStatusValue] = useState('');
    const [collectedKgs, setCollectedKgs] = useState('');
    const [notes, setNotes] = useState('');

    const fetchDashboardData = async () => {
        setLoading(true);
        setError('');
        try {
            const profile = await getWorkerProfile();
            setWorkerProfile(profile);

            const requests = await getWorkerPickupRequests();
            setPickupRequests(requests);

            const todaysPickups = await getTodaysPendingPickups();
            setTodaysPendingPickups(todaysPickups);

            // NEW: Fetch unassigned pickups
            const unassigned = await getUnassignedPickups();
            setUnassignedPickups(unassigned);

            const logs = await getAllWorkerPickupLogs();
            setAllWorkerLogs(logs);

        } catch (err) {
            console.error("Failed to fetch worker dashboard data:", err);
            const errorMessage = (typeof err === 'object' && err !== null && err.message) ? err.message : 'Failed to load dashboard data. Please log in again.';
            setError(errorMessage);
            // If token is invalid or expired, clear it and redirect to login
            localStorage.removeItem('workerToken');
            localStorage.removeItem('workerRole');
            localStorage.removeItem('workerUsername');
            navigate('/worker/login'); // Redirect to worker login page
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('workerToken');
        localStorage.removeItem('workerRole');
        localStorage.removeItem('workerUsername');
        navigate('/worker/login');
    };

    const openUpdateModal = (pickup, status) => {
        setSelectedPickup(pickup);
        setNewStatusValue(status);
        setCollectedKgs(''); // Reset kgs
        setNotes(''); // Reset notes
        setShowUpdateModal(true);
    };

    const closeUpdateModal = () => {
        setShowUpdateModal(false);
        setSelectedPickup(null);
        setNewStatusValue('');
        setCollectedKgs('');
        setNotes('');
    };

    const handleSubmitStatusUpdate = async () => {
        if (!selectedPickup || !newStatusValue) return;

        const statusData = {
            status: newStatusValue,
            // Only send collectedKgs if the new status is "COMPLETED"
            collectedKgs: newStatusValue === 'COMPLETED' ? parseFloat(collectedKgs) : null,
            notes: notes || null
        };

        try {
            await updatePickupRequestStatus(selectedPickup.id, statusData);
            alert(`Pickup request ${selectedPickup.id} marked as ${newStatusValue}!`);
            closeUpdateModal();
            fetchDashboardData(); // Re-fetch all data to update dashboard
        } catch (err) {
            const errorMessage = (typeof err === 'object' && err !== null && err.message) ? err.message : 'Failed to update status.';
            setError(errorMessage);
            alert(`Error updating status: ${errorMessage}`);
        }
    };

    // NEW: Function to handle assigning a pickup to the current worker
    const handleAssignPickup = async (pickupId) => {
        try {
            await assignPickup(pickupId); // Call the new service function
            alert(`Pickup request ${pickupId} assigned to you!`);
            fetchDashboardData(); // Re-fetch all data to update lists
        } catch (err) {
            console.error("Failed to assign pickup:", err);
            const errorMessage = (typeof err === 'object' && err !== null && err.message) ? err.message : 'Failed to assign pickup.';
            alert(`Error assigning pickup: ${errorMessage}`);
        }
    };


    // Group requests by date for display
    const groupedRequests = pickupRequests.reduce((acc, request) => {
        // Ensure request.date is correctly formatted for moment if it's already a string like "YYYY-MM-DD"
        const date = moment(request.date).format('YYYY-MM-DD'); // Assuming 'date' field from backend is 'YYYY-MM-DD' string
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(request);
        return acc;
    }, {});

    // Sort dates for display (latest date first)
    const sortedDates = Object.keys(groupedRequests).sort((a, b) => b.localeCompare(a));


    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <p className="text-xl text-gray-700">Loading worker dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gray-100 p-4">
                <p className="text-red-600 text-lg mb-4">Error: {error}</p>
                <button
                    onClick={handleLogout}
                    className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-300"
                >
                    Go to Login
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4">
            <div className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-md mb-8">
                <h2 className="text-4xl font-bold text-center text-gray-900 mb-8">Worker Dashboard</h2>

                {/* Worker Profile Section */}
                <div className="mb-8 p-6 bg-indigo-50 rounded-lg shadow-inner">
                    <h3 className="text-2xl font-semibold text-indigo-800 mb-4">Welcome, {workerProfile?.fullname || workerProfile?.username}!</h3>
                    {workerProfile ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                            <p><strong className="font-medium">Username:</strong> {workerProfile.username}</p>
                            <p><strong className="font-medium">Email:</strong> {workerProfile.email}</p>
                            <p><strong className="font-medium">Phone:</strong> {workerProfile.phone}</p>
                            <p><strong className="font-medium">Location:</strong> {workerProfile.location}</p>
                        </div>
                    ) : (
                        <p className="text-center text-gray-600">Profile information not available.</p>
                    )}
                </div>

                {/* Today's Pending Pickups Notification - Only shows assigned and pending for today */}
                {todaysPendingPickups.length > 0 && (
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-8" role="alert">
                        <p className="font-bold text-lg mb-2">Today's Assigned Pickups!</p>
                        <ul className="list-disc list-inside ml-5">
                            {todaysPendingPickups.map(request => (
                                <li key={request.id} className="mb-2">
                                    <strong className="text-indigo-700">{request.wasteType}</strong> at {moment(request.time, "HH:mm").format("h:mm A")} from {request.address}, {request.city} (Contact: {request.schedulerName} - {request.phone})
                                    <span className="ml-2 px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">ACTION REQUIRED</span>
                                    <div className="mt-2 flex space-x-2">
                                        <button
                                            onClick={() => openUpdateModal(request, 'COMPLETED')}
                                            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition duration-150"
                                        >
                                            Mark as Completed
                                        </button>
                                        <button
                                            onClick={() => openUpdateModal(request, 'CANCELLED')}
                                            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition duration-150"
                                        >
                                            Mark as Cancelled
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {/* Message if no today's assigned pickups, and also no unassigned pickups */}
                {todaysPendingPickups.length === 0 && unassignedPickups.length === 0 && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-8" role="alert">
                        <p className="font-bold">No assigned pickups for today and no unassigned pickups available. Great job!</p>
                    </div>
                )}


                {/* NEW SECTION: Available Unassigned Pickups */}
                {unassignedPickups.length > 0 && (
                    <div className="mb-8 p-6 bg-blue-50 rounded-lg shadow-inner border border-blue-200">
                        <h3 className="text-2xl font-semibold text-blue-800 mb-4">Available Unassigned Pickups</h3>
                        <p className="text-gray-700 mb-4">Pickups listed below are waiting to be assigned to a worker. You can claim them!</p>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-blue-200">
                                <thead className="bg-blue-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Time</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Waste Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Address</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-blue-200">
                                    {unassignedPickups.map(pickup => (
                                        <tr key={pickup.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pickup.date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pickup.time}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pickup.wasteType}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pickup.address}, {pickup.city} ({pickup.pincode})</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${pickup.status === 'PENDING' || pickup.status === 'Paid - Pending Pickup' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {pickup.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleAssignPickup(pickup.id)}
                                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 transition duration-150"
                                                >
                                                    Assign to Me
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}


                {/* All Assigned Pickup Requests (History) */}
                <div className="mb-8">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-4">All My Assigned Pickups (History)</h3>
                    {sortedDates.length === 0 ? (
                        <p className="text-gray-600">No assigned pickup requests yet.</p>
                    ) : (
                        sortedDates.map(date => (
                            <div key={date} className="mb-6 p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
                                <h4 className="text-xl font-bold text-gray-700 mb-3">{moment(date).format('MMMM Do, YYYY')}</h4>
                                <div className="space-y-4">
                                    {groupedRequests[date].map(request => (
                                        <div key={request.id} className={`p-4 border rounded-md shadow-sm transition duration-200 ${request.status === 'COMPLETED' ? 'bg-green-50 border-green-200' : request.status === 'CANCELLED' ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
                                            <p className="text-lg font-semibold text-gray-800 mb-1">
                                                {request.wasteType} (Request ID: {request.id})
                                            </p>
                                            <p className="text-gray-600 text-sm">
                                                <strong className="font-medium">Time:</strong> {moment(request.time, "HH:mm").format("h:mm A")}
                                            </p>
                                            <p className="text-gray-600 text-sm">
                                                <strong className="font-medium">Address:</strong> {request.address}, {request.city}, {request.pincode}
                                            </p>
                                            <p className="text-gray-600 text-sm">
                                                <strong className="font-medium">Contact:</strong> {request.schedulerName} - {request.phone}
                                            </p>
                                            <p className="text-gray-600 text-sm">
                                                <strong className="font-medium">Status:</strong> <span className={`font-bold ${request.status === 'COMPLETED' ? 'text-green-600' : request.status === 'CANCELLED' ? 'text-red-600' : 'text-orange-600'}`}>{request.status}</span>
                                            </p>
                                            {request.status === 'COMPLETED' && (
                                                <p className="text-gray-600 text-sm">
                                                    <strong className="font-medium">Collected Kgs:</strong> {request.weightKg || 'N/A'} {/* Changed from collectedKgs */}
                                                </p>
                                            )}
                                            {/* Display Image if available */}
                                            {request.imageData && (
                                                <div className="mt-2">
                                                    <strong className="font-medium">Image:</strong>
                                                    <img
                                                        src={`http://localhost:8082${request.imageData}`}
                                                        alt="Pickup Item"
                                                        className="w-24 h-24 object-cover rounded-md mt-1"
                                                    />
                                                </div>
                                            )}
                                            {request.notes && (
                                                <p className="text-gray-600 text-sm">
                                                    <strong className="font-medium">Notes:</strong> {request.notes}
                                                </p>
                                            )}
                                            {request.status !== 'COMPLETED' && request.status !== 'CANCELLED' && (
                                                <div className="mt-3 flex space-x-2">
                                                    <button
                                                        onClick={() => openUpdateModal(request, 'COMPLETED')}
                                                        className="px-4 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600"
                                                    >
                                                        Mark as Completed
                                                    </button>
                                                    <button
                                                        onClick={() => openUpdateModal(request, 'CANCELLED')}
                                                        className="px-4 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
                                                    >
                                                        Mark as Cancelled
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>


                {/* Worker Activity Logs Section (History of Worker's actions) */}
                <div className="mb-8">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-4">My Activity Logs</h3>
                    {allWorkerLogs.length === 0 ? (
                        <p className="text-gray-600">No activity logs recorded yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {allWorkerLogs.map(log => (
                                <div key={log.id} className="p-4 bg-blue-50 rounded-lg shadow-sm border border-blue-200">
                                    <p className="text-sm text-gray-700">
                                        <strong className="font-medium">Timestamp:</strong> {moment(log.timestamp).format('YYYY-MM-DD HH:mm A')}
                                    </p>
                                    <p className="text-sm text-gray-700">
                                        <strong className="font-medium">Pickup Request:</strong> #{log.pickupRequest?.id} ({log.pickupRequest?.wasteType})
                                    </p>
                                    <p className="text-sm text-gray-700">
                                        <strong className="font-medium">Status Change:</strong> {log.oldStatus} <span className="font-bold text-blue-600">→</span> {log.newStatus}
                                    </p>
                                    {log.collectedKgs && (
                                        <p className="text-sm text-gray-700">
                                            <strong className="font-medium">Collected Kgs:</strong> {log.collectedKgs}
                                        </p>
                                    )}
                                    {log.notes && (
                                        <p className="text-sm text-gray-700">
                                            <strong className="font-medium">Notes:</strong> {log.notes}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>


                <div className="mt-8 text-center">
                    <button
                        onClick={handleLogout}
                        className="px-8 py-3 bg-red-500 text-white font-semibold rounded-md shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-300"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Status Update Modal */}
            {showUpdateModal && selectedPickup && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Update Pickup Status</h3>
                        <p className="mb-4">
                            Updating status for Pickup ID: <span className="font-semibold">{selectedPickup.id}</span> - {selectedPickup.wasteType} to <span className="font-semibold">{newStatusValue}</span>
                        </p>

                        {newStatusValue === 'COMPLETED' && (
                            <div className="mb-4">
                                <label htmlFor="collectedKgs" className="block text-gray-700 text-sm font-bold mb-2">
                                    Collected Kilograms (Kgs):
                                </label>
                                <input
                                    type="number"
                                    id="collectedKgs"
                                    value={collectedKgs}
                                    onChange={(e) => setCollectedKgs(e.target.value)}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    placeholder="e.g., 15.5"
                                    step="0.1"
                                />
                            </div>
                        )}

                        <div className="mb-4">
                            <label htmlFor="notes" className="block text-gray-700 text-sm font-bold mb-2">
                                Notes (Optional):
                            </label>
                            <textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24"
                                placeholder="Add any relevant notes about the pickup..."
                            ></textarea>
                        </div>

                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={closeUpdateModal}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitStatusUpdate}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                            >
                                Confirm Update
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkerDashboard;