import axios from 'axios';

// Base URL for your backend API
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8082'; // IMPORTANT: Ensure this matches your Spring Boot backend URL

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: This runs BEFORE every request is sent.
// Its purpose is to attach the JWT token from localStorage to the Authorization header
// for all requests made using this 'api' (Axios) instance.
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token'); // Retrieve the user's JWT token
        if (token) {
            // If a token exists, add it to the Authorization header in the Bearer format
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config; // Return the modified config
    },
    (error) => {
        // Handle request errors (e.g., network issues before sending)
        return Promise.reject(error);
    }
);

// Response Interceptor: This runs AFTER a response is received.
// It's useful for handling global error conditions like unauthorized access (401)
// or forbidden access (403), which often mean the token is invalid or expired.
api.interceptors.response.use(
    (response) => response, // If the response is successful (2xx status), just pass it through
    (error) => {
        // Check if the error response exists and if its status is 401 (Unauthorized) or 403 (Forbidden)
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            console.error('API Error: Unauthorized or Forbidden. Logging out user due to invalid/expired token.');
            // Dispatch a custom event. This is a robust way to inform other parts of the application
            // (like the Header or the App component) that the user's login status needs to be re-evaluated,
            // typically leading to a logout.
            window.dispatchEvent(new Event('loginStatusChanged'));
            // Note: Direct navigation (e.g., `window.location.href = '/login';`) is often done
            // by a component that listens to `loginStatusChanged` to avoid direct side effects
            // within the interceptor.
        }
        return Promise.reject(error); // Propagate the error so calling components can also handle it
    }
);

export default api; // Export the configured Axios instance