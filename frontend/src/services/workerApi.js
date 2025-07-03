import axios from 'axios';

// Base URL for your backend API
export const API_BASE_URL = 'http://localhost:8082'; // IMPORTANT: Ensure this matches your Spring Boot backend URL

// Dedicated Axios instance for worker-related API calls
const workerApi = axios.create({
    baseURL: `${API_BASE_URL}/api/worker`, // All worker endpoints start with /api/worker
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor for workerApi: Attaches the worker's JWT token
workerApi.interceptors.request.use(
    (config) => {
        const workerToken = localStorage.getItem('workerToken'); // Retrieve the worker's JWT token
        if (workerToken) {
            config.headers.Authorization = `Bearer ${workerToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor for workerApi: Handles global error conditions like unauthorized access (401/403)
workerApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            console.error('Worker API Error: Unauthorized or Forbidden. Logging out worker due to invalid/expired token.');
            // Clear worker-specific tokens
            localStorage.removeItem('workerToken');
            localStorage.removeItem('workerRole');
            localStorage.removeItem('workerUsername');
            // Dispatch a custom event to notify other parts of the app (like Header)
            window.dispatchEvent(new Event('loginStatusChanged'));
            // Redirect to worker login
            window.location.href = '/worker/login';
        }
        return Promise.reject(error);
    }
);

// --- Public Worker Endpoints (do not use workerApi interceptor as they are for authentication itself) ---

export const loginWorker = async (credentials) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/worker/login`, credentials);
        return response.data; // This should contain the worker token and role
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data.message || 'Worker login failed');
        } else {
            throw new Error('Network error or server unavailable');
        }
    }
};

// NEW: Service function for worker registration
export const registerWorker = async (workerData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/worker/register`, workerData);
        return response.data; // Should return a success message string
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data || 'Worker registration failed'); // Backend sends a string message
        } else {
            throw new Error('Network error or server unavailable');
        }
    }
};

// --- Authenticated Worker Endpoints (use workerApi instance) ---

export const getWorkerProfile = async () => {
    const response = await workerApi.get('/profile');
    return response.data;
};

export const getWorkerPickupRequests = async () => {
    const response = await workerApi.get('/pickups');
    return response.data;
};

export const getTodaysPendingPickups = async () => {
    const response = await workerApi.get('/pickups/today/pending');
    return response.data;
};

export const getUnassignedPickups = async () => {
    const response = await workerApi.get('/pickups/unassigned');
    return response.data;
};

export const assignPickup = async (requestId) => {
    const response = await workerApi.post(`/pickups/${requestId}/assign`);
    return response.data;
};

export const updatePickupRequestStatus = async (requestId, statusData) => {
    const response = await workerApi.put(`/pickups/${requestId}/status`, statusData);
    return response.data;
};

export const getAllWorkerPickupLogs = async () => {
    const response = await workerApi.get('/logs');
    return response.data;
};