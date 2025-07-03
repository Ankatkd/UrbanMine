import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Header() {
    const navigate = useNavigate();

    // State to track user login status and role (for regular users)
    const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
    const [userRole, setUserRole] = useState(localStorage.getItem('role')); // 'individual', 'commercial', 'charity'

    // State to track worker login status and role
    const [isWorkerLoggedIn, setIsWorkerLoggedIn] = useState(localStorage.getItem('workerToken') ? true : false);
    const [workerRole, setWorkerRole] = useState(localStorage.getItem('workerRole')); // 'worker'

    // Effect hook to listen for login status changes across the application
    useEffect(() => {
        const updateLoginStatusAndRole = () => {
            // Update regular user login status
            setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
            setUserRole(localStorage.getItem('role'));

            // Update worker login status
            setIsWorkerLoggedIn(localStorage.getItem('workerToken') ? true : false);
            setWorkerRole(localStorage.getItem('workerRole'));
        };

        // Add event listener for custom 'loginStatusChanged' event
        window.addEventListener('loginStatusChanged', updateLoginStatusAndRole);
        updateLoginStatusAndRole(); // Call once on mount to set initial state based on localStorage

        // Cleanup: Remove event listener when component unmounts
        return () => {
            window.removeEventListener('loginStatusChanged', updateLoginStatusAndRole);
        };
    }, []); // Empty dependency array means this effect runs only once on mount and cleans up on unmount

    // Determine the *currently active* login state and role for navigation logic
    // Worker login takes precedence if both somehow happen to be logged in (shouldn't happen with correct logout)
    const effectiveIsLoggedIn = isLoggedIn || isWorkerLoggedIn;
    let effectiveRole = null;

    if (isWorkerLoggedIn) {
        effectiveRole = workerRole;
    } else if (isLoggedIn) {
        effectiveRole = userRole;
    }

    return (
        <header className="bg-green-800 text-white p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                {/* Logo/Title - navigates to home on click */}
                <h1 className="text-2xl font-bold cursor-pointer" onClick={() => navigate('/')}>
                    ♻️ E-Waste Management
                </h1>

                <nav className="flex items-center space-x-4">
                    <Link to="/" className="hover:text-gray-300">Home</Link>

                    {/* Conditional rendering for "Buy" link, only for logged-in commercial users */}
                    {isLoggedIn && userRole === 'commercial' && (
                        <Link to="/buy" className="hover:text-gray-300">Buy</Link>
                    )}

                    <Link to="/maps" className="hover:text-gray-300">Nearest Centers</Link>
                    <Link to="/our-mission" className="hover:text-gray-300">Our Mission</Link>

                    {/* The Login link should only appear if NEITHER a regular user NOR a worker is logged in */}
                    {!effectiveIsLoggedIn && (
                        <Link to="/login" className="hover:text-gray-300">Login</Link>
                    )}

                    <Link to="/register" className="hover:text-gray-300">Join us</Link>
                    <Link to="/contact" className="hover:text-gray-300">Contact</Link>

                    {/* Profile icon: Always visible, but directs based on login status and role */}
                    <div
                        onClick={() => {
                            if (effectiveIsLoggedIn) {
                                // If logged in, navigate to the appropriate dashboard/profile based on role
                                if (effectiveRole === 'worker') {
                                    navigate('/worker/dashboard');
                                } else if (effectiveRole === 'commercial') {
                                    navigate('/commercial-dashboard');
                                } else if (['individual', 'charity'].includes(effectiveRole)) {
                                    navigate('/profile');
                                } else {
                                    // Fallback for an authenticated user with an unrecognized role
                                    console.warn("Authenticated user with unknown effective role:", effectiveRole);
                                    navigate('/'); // Send to home page or a generic dashboard
                                }
                            } else {
                                // If not logged in, direct to the login page
                                navigate('/login');
                            }
                        }}
                        title={effectiveIsLoggedIn ? "Profile/Dashboard" : "Login"}
                        className="ml-4 w-10 h-10 bg-white text-green-800 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                    >
                        👤
                    </div>
                </nav>
            </div>
        </header>
    );
}

export default Header;
