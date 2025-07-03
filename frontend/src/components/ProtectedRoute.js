import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
    // Retrieve authentication details from localStorage for both users and workers
    const userToken = localStorage.getItem('token');
    const userRole = localStorage.getItem('role'); // Expected to be lowercase (e.g., "individual", "commercial", "charity")

    const workerToken = localStorage.getItem('workerToken');
    const workerRole = localStorage.getItem('workerRole'); // Expected to be "worker"

    let isAuthenticated = false;
    let actualRole = null;

    // Determine authentication status and actual role based on available tokens
    // Worker login is checked first if there's a possibility of overlapping tokens or roles
    if (workerToken && workerRole === 'worker') {
        isAuthenticated = true;
        actualRole = 'worker';
    } else if (userToken && userRole) { // Check for user token and role
        isAuthenticated = true;
        actualRole = userRole;
    }

    // If neither user nor worker is authenticated, redirect to login page
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // If authentication is successful, but specific roles are required for the route
    if (allowedRoles && allowedRoles.length > 0) {
        // Check if the authenticated user's role is included in the allowed roles
        if (!actualRole || !allowedRoles.includes(actualRole)) {
            console.warn(`Access denied: User role '${actualRole}' not in allowed roles: ${allowedRoles.join(', ')}`);

            // Smart Redirection: Redirect authenticated users to their appropriate dashboard
            // based on their actual role if they try to access a forbidden route.
            if (actualRole === 'worker') {
                return <Navigate to="/worker/dashboard" replace />;
            }
            // For regular user roles
            else if (['individual', 'commercial', 'charity'].includes(actualRole)) {
                if (actualRole === 'commercial') {
                    return <Navigate to="/commercial-dashboard" replace />;
                }
                return <Navigate to="/profile" replace />; // Default for individual/charity users
            }
            // Fallback for any other unexpected role or scenario (e.g., if actualRole is null for some reason)
            return <Navigate to="/" replace />; // Send to home page
        }
    }

    // If authenticated and authorized (role matches allowedRoles or no specific roles required), render the child routes
    return <Outlet />;
};

export default ProtectedRoute;
