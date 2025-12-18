import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';

const WorkerDashboard = () => {
    const [workerProfile, setWorkerProfile] = useState(null);
    const [activeTab, setActiveTab] = useState('upcoming'); // upcoming, history, missed
    const [pickups, setPickups] = useState([]);
    const [missedPickups, setMissedPickups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal States
    const [selectedPickup, setSelectedPickup] = useState(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);

    // Form States
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [rescheduleReason, setRescheduleReason] = useState('');
    const [newItemImage, setNewItemImage] = useState(null);
    const [newItemBrand, setNewItemBrand] = useState('');
    const [newItemDetails, setNewItemDetails] = useState('');
    const [uploadingItem, setUploadingItem] = useState(false);

    const navigate = useNavigate();

    // --- API Service Calls (Inlined for simplicity in overhaul, usually in service file) ---
    const getAuthHeader = () => {
        const token = localStorage.getItem('workerToken');
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const profileRes = await axios.get('http://localhost:8082/api/worker/profile', getAuthHeader());
            setWorkerProfile(profileRes.data);

            const pickupsRes = await axios.get('http://localhost:8082/api/worker/pickups', getAuthHeader());
            setPickups(pickupsRes.data);

            const missedRes = await axios.get('http://localhost:8082/api/worker/pickups/missed', getAuthHeader());
            setMissedPickups(missedRes.data);

            setLoading(false);
        } catch (err) {
            console.error("Dashboard Fetch Error:", err);
            setError("Failed to load dashboard. Please relogin.");
            if (err.response && err.response.status === 401) navigate('/worker/login');
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // --- Actions ---

    const handleMarkReached = async (id) => {
        try {
            await axios.put(`http://localhost:8082/api/worker/pickups/${id}/reached`, {}, getAuthHeader());
            alert("Status updated: Reached Location");
            fetchDashboardData();
        } catch (err) {
            alert("Failed to update status");
        }
    };

    const handleReschedule = async () => {
        if (!rescheduleDate || !rescheduleReason) return alert("Please fill details");
        try {
            await axios.post(`http://localhost:8082/api/worker/pickups/${selectedPickup.id}/reschedule`, {
                newDate: rescheduleDate,
                reason: rescheduleReason
            }, getAuthHeader());
            alert("Pickup Rescheduled");
            setShowRescheduleModal(false);
            fetchDashboardData();
        } catch (err) {
            alert("Failed to reschedule");
        }
    };

    const [newItemImages, setNewItemImages] = useState([]);

    const handleAddItem = async () => {
        if (!newItemImages || newItemImages.length === 0) return alert("Please select at least one image");

        setUploadingItem(true);

        const formData = new FormData();
        Array.from(newItemImages).forEach(file => {
            formData.append("images", file);
        });

        if (newItemBrand) formData.append("brand", newItemBrand);
        if (newItemDetails) formData.append("details", newItemDetails);

        try {
            await axios.post(`http://localhost:8082/api/worker/pickups/${selectedPickup.id}/items`, formData, {
                headers: {
                    ...getAuthHeader().headers,
                    "Content-Type": "multipart/form-data"
                }
            });
            alert("Item Added & Analyzed by AI!");
            setShowItemModal(false);
            setNewItemImages([]);
            setNewItemBrand('');
            setNewItemDetails('');
            fetchDashboardData();
        } catch (err) {
            console.error(err);
            if (err.response && err.response.status === 400) {
                alert("Verification Failed: " + err.response.data); // Show backend message regarding multiple images
            } else {
                alert("Failed to add item. Ensure images are valid.");
            }
        } finally {
            setUploadingItem(false);
        }
    };

    const handleMarkCompleted = async () => {
        // Logic for final completion (Legacy + New Items combined if needed, or just legacy logic)
        try {
            await axios.put(`http://localhost:8082/api/worker/pickups/${selectedPickup.id}/status`, {
                status: 'COMPLETED',
                collectedKgs: selectedPickup.weightKg || 0, // Should be input if needed
                notes: 'Completed via Dashboard'
            }, getAuthHeader());
            alert("Pickup Completed!");
            setShowStatusModal(false);
            fetchDashboardData();
        } catch (err) {
            alert("Failed to complete");
        }
    };


    // --- UI Render ---

    if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50"><div className="text-xl font-semibold text-blue-600">Loading Dashboard...</div></div>;

    const upcomingPickups = pickups.filter(p => p.status === 'ASSIGNED' || p.status === 'PENDING' || p.status === 'RESCHEDULED');
    const historyPickups = pickups.filter(p => p.status === 'COMPLETED' || p.status === 'CANCELLED');

    const renderPickupCard = (pickup) => (
        <div key={pickup.id} className="relative bg-white rounded-3xl p-6 shadow-sm border border-gray-100 transition-all hover:shadow-xl hover:-translate-y-1 overflow-hidden group">
            {/* Status Strip */}
            <div className={`absolute left-0 top-0 bottom-0 w-2 ${pickup.status === 'COMPLETED' ? 'bg-gradient-to-b from-green-400 to-green-600' :
                    pickup.status === 'CANCELLED' ? 'bg-gradient-to-b from-red-400 to-red-600' :
                        'bg-gradient-to-b from-blue-400 to-indigo-600'
                }`}></div>

            <div className="flex justify-between items-start mb-6 pl-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-mono tracking-wide">#{pickup.id}</span>
                        <span className="text-gray-400 text-sm">• {moment(pickup.date).format("MMM Do, dddd")}</span>
                    </div>
                    <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">{pickup.wasteType.replace(/_/g, " ")}</h3>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${pickup.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border border-green-200' :
                        pickup.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border border-red-200' :
                            'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                    {pickup.status}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6 pl-4 relative z-10">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">📍 Pickup Location</p>
                    <p className="font-semibold text-gray-800 text-lg leading-snug">{pickup.address}</p>
                    <p className="text-gray-500">{pickup.city} - {pickup.pincode}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">👤 Customer Details</p>
                    <p className="font-semibold text-gray-800 text-lg">{pickup.schedulerName}</p>
                    <a href={`tel:${pickup.phone}`} className="text-blue-600 hover:underline flex items-center gap-1 mt-1">
                        📞 {pickup.phone}
                    </a>
                </div>
            </div>

            {/* Tracking Flow */}
            <div className="mb-6 pl-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Live Status</p>
                <div className="flex items-center gap-2">
                    {['ASSIGNED', 'REACHED', 'COMPLETED', 'RECYCLED'].map((step, idx) => {
                        const currentIdx = ['ASSIGNED', 'REACHED', 'COMPLETED', 'RECYCLED'].indexOf(pickup.trackingStatus || 'ASSIGNED');
                        const isLast = idx === 3;
                        const isPassed = idx <= currentIdx;
                        return (
                            <div key={step} className="flex-1 flex items-center">
                                <div className={`h-2.5 w-full rounded-full transition-all duration-500 ${isPassed ? 'bg-green-500 shadow-md scale-100' : 'bg-gray-200'}`}></div>
                            </div>
                        )
                    })}
                </div>
                <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-wide">
                    <span>Assigned</span>
                    <span>Reached</span>
                    <span>Done</span>
                    <span>Recycled</span>
                </div>
            </div>


            {/* Items List */}
            {pickup.items && pickup.items.length > 0 && (
                <div className="pl-4 mb-6">
                    <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border border-gray-200">
                        <div className="flex justify-between items-center mb-3">
                            <p className="font-extrabold text-sm text-gray-700 uppercase flex items-center gap-2">
                                📦 Added Items
                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px]">{pickup.items.length}</span>
                            </p>
                            <p className="font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg border border-green-100">
                                Total: ₹{pickup.estimatedValue ? pickup.estimatedValue.toFixed(2) : '0.00'}
                            </p>
                        </div>

                        <div className="space-y-2">
                            {pickup.items.map(item => (
                                <div key={item.id} className="flex justify-between items-center text-sm p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all border border-transparent hover:border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-xs overflow-hidden">
                                            {item.imageData ? (
                                                <img src={`data:image/jpeg;base64,${item.imageData}`} className="w-full h-full object-cover" alt="thumb" />
                                            ) : '📷'}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">{item.wasteType}</p>
                                            <p className="text-xs text-gray-500">{item.brand} • {item.aiConfidence ? (item.aiConfidence * 100).toFixed(0) + '%' : 'N/A'} AI</p>
                                        </div>
                                    </div>
                                    <span className="font-mono font-medium text-gray-600">₹{item.estimatedValue}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}


            {/* Action Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pl-4">
                {!pickup.trackingStatus || pickup.trackingStatus === 'ASSIGNED' ? (
                    <button onClick={() => handleMarkReached(pickup.id)} className="col-span-1 bg-white border-2 border-purple-100 text-purple-700 py-3 rounded-xl font-bold hover:bg-purple-50 hover:border-purple-200 transition active:scale-95 shadow-sm">
                        📍 Mark Reached
                    </button>
                ) : null}

                <button onClick={() => { setSelectedPickup(pickup); setShowItemModal(true); }} className="col-span-1 bg-white border-2 border-blue-100 text-blue-700 py-3 rounded-xl font-bold hover:bg-blue-50 hover:border-blue-200 transition active:scale-95 shadow-sm flex items-center justify-center gap-2">
                    <span>➕</span> Add Item
                </button>

                <button onClick={() => { setSelectedPickup(pickup); setShowRescheduleModal(true); }} className="col-span-1 bg-white border-2 border-orange-100 text-orange-700 py-3 rounded-xl font-bold hover:bg-orange-50 hover:border-orange-200 transition active:scale-95 shadow-sm">
                    📅 Reschedule
                </button>

                <button onClick={() => { setSelectedPickup(pickup); setShowStatusModal(true); }} className="col-span-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:from-green-600 hover:to-emerald-700 transition active:scale-95 shadow-md flex items-center justify-center gap-2">
                    ✅ Complete
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Worker Dashboard</h1>
                    <p className="text-sm text-gray-500">Welcome, {workerProfile?.username}</p>
                </div>
                <button onClick={() => { localStorage.clear(); navigate('/worker/login'); }} className="text-red-500 font-semibold text-sm hover:underline">
                    Logout
                </button>
            </div>

            {/* Stats / Alerts */}
            {missedPickups.length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 m-6">
                    <p className="font-bold text-red-700">⚠️ You have {missedPickups.length} missed pickups!</p>
                    <p className="text-sm text-red-600">Please check the 'Missed' tab immediately.</p>
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-white px-6">
                {['upcoming', 'missed', 'history'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`mr-8 py-4 px-2 font-medium bg-transparent border-b-2 transition ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto p-6 space-y-6">
                {activeTab === 'upcoming' && (
                    <div className="space-y-6">{upcomingPickups.length > 0 ? upcomingPickups.map(renderPickupCard) :
                        <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-dashed border-gray-300">
                            <span className="text-4xl">🎉</span>
                            <p className="text-gray-500 mt-4 font-medium">All caught up! No upcoming pickups.</p>
                        </div>
                    }</div>
                )}
                {activeTab === 'missed' && (
                    <div className="space-y-6">{missedPickups.map(renderPickupCard)}</div>
                )}
                {activeTab === 'history' && (
                    <div className="space-y-6">{historyPickups.map(renderPickupCard)}</div>
                )}
            </div>

            {/* --- Modals --- */}

            {/* Add Item Modal */}
            {showItemModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold mb-4">Add Extra Item</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold mb-2">Item Photos (Multiple required for manual override)</label>
                            <input type="file" multiple accept="image/*" onChange={(e) => setNewItemImages(e.target.files)} className="w-full" />
                            {newItemImages.length > 0 && <p className="text-xs text-green-600 mt-1">{newItemImages.length} images selected</p>}
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold mb-2">Edit Brand (Optional)</label>
                            <input type="text" value={newItemBrand} onChange={(e) => setNewItemBrand(e.target.value)} className="w-full border p-2 rounded" placeholder="e.g. Dell" />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold mb-2">Details (Optional)</label>
                            <input type="text" value={newItemDetails} onChange={(e) => setNewItemDetails(e.target.value)} className="w-full border p-2 rounded" placeholder="Additional info" />
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setShowItemModal(false)} className="flex-1 py-2 rounded bg-gray-200 font-semibold">Cancel</button>
                            <button onClick={handleAddItem} disabled={uploadingItem} className="flex-1 py-2 rounded bg-blue-600 text-white font-semibold">
                                {uploadingItem ? 'Analyzing...' : 'Add Item'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reschedule Modal */}
            {showRescheduleModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold mb-4">Reschedule Pickup</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold mb-2">New Date</label>
                            <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} className="w-full border p-2 rounded" min={moment().format('YYYY-MM-DD')} />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold mb-2">Reason</label>
                            <textarea value={rescheduleReason} onChange={(e) => setRescheduleReason(e.target.value)} className="w-full border p-2 rounded h-20" placeholder="Why are you rescheduling?" />
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setShowRescheduleModal(false)} className="flex-1 py-2 rounded bg-gray-200 font-semibold">Cancel</button>
                            <button onClick={handleReschedule} className="flex-1 py-2 rounded bg-orange-600 text-white font-semibold">Reschedule</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Simple Status Modal Placeholder */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
                        <h3 className="text-xl font-bold mb-4">Complete Pickup?</h3>
                        <p className="mb-6 text-gray-600">Ensure all items are collected and weighed.</p>
                        <div className="flex gap-4">
                            <button onClick={() => setShowStatusModal(false)} className="flex-1 py-2 rounded bg-gray-200 font-semibold">Cancel</button>
                            <button onClick={handleMarkCompleted} className="flex-1 py-2 rounded bg-green-600 text-white font-semibold">Confirm</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default WorkerDashboard;