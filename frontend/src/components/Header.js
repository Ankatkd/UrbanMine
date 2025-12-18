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

    // Mobile menu state
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        <header className="bg-gradient-to-r from-green-800 to-green-700 text-white shadow-lg sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center py-4">
                    {/* Logo/Title - navigates to home on click */}
                    <div
                        className="flex items-center cursor-pointer group"
                        onClick={() => navigate('/')}
                    >
                        <span className="text-3xl mr-2 group-hover:rotate-12 transition-transform duration-300">♻️</span>
                        <h1 className="text-2xl font-bold group-hover:text-green-200 transition-colors duration-300">
                            UrbanMine
                        </h1>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center space-x-6">
                        <Link
                            to="/"
                            className="hover:text-green-200 transition-colors duration-200 font-medium"
                        >
                            Home
                        </Link>

                        {/* Conditional rendering for "Buy" link, only for logged-in commercial users */}
                        {isLoggedIn && userRole === 'commercial' && (
                            <Link
                                to="/buy"
                                className="hover:text-green-200 transition-colors duration-200 font-medium"
                            >
                                Buy
                            </Link>
                        )}

                        <Link
                            to="/maps"
                            className="hover:text-green-200 transition-colors duration-200 font-medium"
                        >
                            Nearest Centers
                        </Link>
                        <Link
                            to="/mission"
                            className="hover:text-green-200 transition-colors duration-200 font-medium"
                        >
                            Mission
                        </Link>

                        {/* Worker-specific navigation links */}
                        {isWorkerLoggedIn && (
                            <>
                                <Link
                                    to="/worker/dashboard"
                                    className="hover:text-green-200 transition-colors duration-200 font-medium"
                                >
                                    Dashboard
                                </Link>
                            </>
                        )}

                        {/* The Login link should only appear if NEITHER a regular user NOR a worker is logged in */}
                        {!effectiveIsLoggedIn && (
                            <Link
                                to="/login"
                                className="hover:text-green-200 transition-colors duration-200 font-medium"
                            >
                                Login
                            </Link>
                        )}

                        {/* Worker Login/Register links - only show when no one is logged in */}
                        {!effectiveIsLoggedIn && (
                            <>
                                <Link
                                    to="/worker/login"
                                    className="hover:text-green-200 transition-colors duration-200 font-medium"
                                >
                                    Worker Login
                                </Link>
                            </>
                        )}

                        <Link
                            to="/register"
                            className="hover:text-green-200 transition-colors duration-200 font-medium"
                        >
                            Join us
                        </Link>
                        <Link
                            to="/contact"
                            className="hover:text-green-200 transition-colors duration-200 font-medium"
                        >
                            Contact
                        </Link>

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
                            className="ml-4 w-12 h-12 bg-white text-green-800 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 hover:bg-green-100 transition-all duration-300 shadow-lg"
                        >
                            <span className="text-xl">
                                {effectiveIsLoggedIn ? '👤' : '🔑'}
                            </span>
                        </div>
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="lg:hidden p-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isMobileMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile Navigation Menu */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden pb-4 border-t border-green-600">
                        <nav className="flex flex-col space-y-2 pt-4">
                            <Link
                                to="/"
                                className="px-4 py-2 hover:bg-green-700 rounded-lg transition-colors duration-200 font-medium"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                🏠 Home
                            </Link>

                            {/* Conditional rendering for "Buy" link, only for logged-in commercial users */}
                            {isLoggedIn && userRole === 'commercial' && (
                                <Link
                                    to="/buy"
                                    className="px-4 py-2 hover:bg-green-700 rounded-lg transition-colors duration-200 font-medium"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    🛒 Buy
                                </Link>
                            )}

                            <Link
                                to="/maps"
                                className="px-4 py-2 hover:bg-green-700 rounded-lg transition-colors duration-200 font-medium"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                📍 Nearest Centers
                            </Link>
                            <Link
                                to="/mission"
                                className="px-4 py-2 hover:bg-green-700 rounded-lg transition-colors duration-200 font-medium"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                🎯 Mission
                            </Link>

                            {/* Worker-specific navigation links */}
                            {isWorkerLoggedIn && (
                                <Link
                                    to="/worker/dashboard"
                                    className="px-4 py-2 hover:bg-green-700 rounded-lg transition-colors duration-200 font-medium"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    👷 Dashboard
                                </Link>
                            )}

                            {/* The Login link should only appear if NEITHER a regular user NOR a worker is logged in */}
                            {!effectiveIsLoggedIn && (
                                <Link
                                    to="/login"
                                    className="px-4 py-2 hover:bg-green-700 rounded-lg transition-colors duration-200 font-medium"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    🔑 Login
                                </Link>
                            )}

                            {/* Worker Login/Register links - only show when no one is logged in */}
                            {!effectiveIsLoggedIn && (
                                <Link
                                    to="/worker/login"
                                    className="px-4 py-2 hover:bg-green-700 rounded-lg transition-colors duration-200 font-medium"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    👷 Worker Login
                                </Link>
                            )}

                            <Link
                                to="/register"
                                className="px-4 py-2 hover:bg-green-700 rounded-lg transition-colors duration-200 font-medium"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                ✨ Join us
                            </Link>
                            <Link
                                to="/contact"
                                className="px-4 py-2 hover:bg-green-700 rounded-lg transition-colors duration-200 font-medium"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                📞 Contact
                            </Link>

                            {/* Mobile Profile Button */}
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
                                    setIsMobileMenuOpen(false);
                                }}
                                className="px-4 py-2 hover:bg-green-700 rounded-lg transition-colors duration-200 font-medium cursor-pointer"
                            >
                                {effectiveIsLoggedIn ? '👤 Profile/Dashboard' : '🔑 Login'}
                            </div>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
}

export default Header;
