import React, { useState, useEffect, useCallback, useRef } from "react";
// We rely on the environment to provide the 'react-leaflet' and 'leaflet' packages.
// Note: Explicit CSS imports are removed to prevent compilation errors in this environment.
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// --- Configuration ---
const SEARCH_RADIUS_METERS = 50000; // 50 km radius

// Fix for default Leaflet marker icon not showing
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom icon for user's location
const userLocationIcon = L.icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI2IiBmaWxsPSIjNDg5MjZmIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiI+PC9jaXJjbGU+PC9zdmc+',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
});

// --- Utility Functions ---

// Polyline decoding function
const decodePolyline = (encoded) => {
    const points = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
        let b;
        let shift = 0;
        let result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;

        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        points.push([lat / 1e5, lng / 1e5]);
    }
    return points;
};

// Utility function for robust API calls with exponential backoff (for backend)
const fetchWithRetry = async (url, options = {}, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) {
                return response.json();
            }
            if (response.status === 429 || response.status >= 500) {
                const delay = Math.pow(2, i) * 1000 + Math.random() * 500;
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                const errorBody = await response.json().catch(() => ({}));
                throw new Error(`API error ${response.status}: ${errorBody.error_message || 'Unknown error'}`);
            }
        } catch (error) {
            if (i === maxRetries - 1) {
                console.error("API request failed after multiple retries:", error);
                throw new Error(`API request failed after multiple retries: ${error.message}`);
            }
        }
    }
};

// For photo URLs, you can create a backend endpoint if you want to proxy images
const getPhotoUrl = (photoReference, maxWidth = 200) => {
    return `/api/maps/photo?photoreference=${photoReference}&maxwidth=${maxWidth}`;
};

// --- Map Controller Component (Handles View Changes) ---
const MapViewController = ({ currentMapCenter, routeData, places, selectedPlace }) => {
    const map = useMap();

    useEffect(() => {
        let markers = [];

        if (routeData && routeData.overview_polyline && routeData.overview_polyline.points) {
            // 1. Fit bounds to the whole route
            const polylinePoints = decodePolyline(routeData.overview_polyline.points);
            if (polylinePoints.length > 0) {
                const bounds = L.latLngBounds(polylinePoints);
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        } else if (places.length > 0) {
            // 2. Fit bounds to cover all found places
            markers = places.map(p => [p.geometry.location.lat, p.geometry.location.lng]);
            if (currentMapCenter) {
                markers.push([currentMapCenter.lat, currentMapCenter.lng]);
            }
            if (markers.length > 0) {
                const bounds = L.latLngBounds(markers);
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        } else if (currentMapCenter) {
            // 3. Default view to the current center
            map.setView(currentMapCenter, 13);
        }
    }, [currentMapCenter, routeData, places, map]);

    return null;
};

// --- Main Application Component ---
const Maps = () => {
    const [addressInput, setAddressInput] = useState("");
    const [currentMapCenter, setCurrentMapCenter] = useState(null);
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("e-waste center");
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [routeData, setRouteData] = useState(null);
    const [initialLoad, setInitialLoad] = useState(true);

    const [warning, setWarning] = useState(null);

    const defaultMapCenter = { lat: 18.5204, lng: 73.8567 }; // Default to Pune, India

    const clearRoute = () => {
        setRouteData(null);
        setSelectedPlace(null);
        setWarning(null);
    };

    // --- API Handlers ---

    const handleSearch = useCallback(async (lat, lng, query) => {
        setLoading(true);
        setError(null);
        setWarning(null);
        setPlaces([]);
        setRouteData(null);
        setSelectedPlace(null);

        if (!lat || !lng) {
            setError("No location available. Cannot perform nearby search.");
            setLoading(false);
            return;
        }

        const performSearch = async (searchTerm) => {
            return await fetchWithRetry(
                '/api/maps/nearby-search',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        latitude: lat,
                        longitude: lng,
                        keyword: searchTerm,
                        radius: SEARCH_RADIUS_METERS
                    })
                }
            );
        };

        try {
            let data = await performSearch(query);
            let usedFallback = false;
            let finalQuery = query;

            // Fallback Logic
            if ((!data.results || data.results.length === 0) &&
                (query.toLowerCase().includes('e-waste') || query.toLowerCase().includes('ewaste'))) {

                console.log("No results for e-waste, trying 'recycling center'...");
                finalQuery = "recycling center";
                data = await performSearch(finalQuery);

                if (!data.results || data.results.length === 0) {
                    console.log("No results for recycling center, trying 'electronics store'...");
                    finalQuery = "electronics store";
                    data = await performSearch(finalQuery);
                }

                if (data.results && data.results.length > 0) {
                    usedFallback = true;
                }
            }

            if (data.status === 'OK' && data.results) {
                setPlaces(data.results);
                if (data.results.length === 0) {
                    setError(`No results found for "${query}" near your location.`);
                } else if (usedFallback) {
                    setWarning(`No specific "${query}" found. Showing results for "${finalQuery}" instead.`);
                }
            } else {
                setError(`Error from API: ${data.error_message || data.status}`);
            }
        } catch (err) {
            setError(`Search failed: ${err.message || 'Network error'}`);
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    const handleUseMyLocation = useCallback(() => {
        setLoading(true);
        setError(null);
        setWarning(null);
        setPlaces([]);
        setRouteData(null);
        setSelectedPlace(null);
        setInitialLoad(false);

        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser. Please enter an address manually.");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const newCenter = { lat: latitude, lng: longitude };
                setCurrentMapCenter(newCenter);
                setAddressInput("");
                handleSearch(latitude, longitude, searchQuery);
            },
            (err) => {
                console.error("Unable to retrieve your location:", err);
                const errorMessage = (err.code === err.PERMISSION_DENIED)
                    ? "Location access denied. Please enable location services or enter an address manually."
                    : "Unable to retrieve your location. Please try again or enter an address manually.";
                setError(errorMessage);
                setLoading(false);
            }
        );
    }, [handleSearch, searchQuery]);

    useEffect(() => {
        if (initialLoad) {
            handleUseMyLocation();
        }
    }, [handleUseMyLocation, initialLoad]);

    const handleManualAddressSearch = async () => {
        if (!addressInput.trim()) {
            setError("Please enter an address to search.");
            return;
        }
        setLoading(true);
        setError(null);
        setPlaces([]);
        setRouteData(null);
        setSelectedPlace(null);
        setCurrentMapCenter(null);
        setInitialLoad(false);

        try {
            const geoData = await fetchWithRetry(
                '/api/maps/find-place',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ input: addressInput })
                }
            );

            if (geoData.status === 'OK' && geoData.candidates.length > 0) {
                const candidate = geoData.candidates[0];
                if (candidate.geometry && candidate.geometry.location) {
                    const { lat, lng } = candidate.geometry.location;
                    setCurrentMapCenter({ lat, lng });
                    await handleSearch(lat, lng, searchQuery);
                } else {
                    setError(`Location data missing for "${addressInput}".`);
                    setLoading(false);
                }
            } else {
                setError(`Could not find coordinates for "${addressInput}". Status: ${geoData.status}.`);
                setLoading(false);
            }
        } catch (err) {
            console.error("Geocoding failed", err);
            setError(`Failed to resolve address: ${err.message}`);
            setLoading(false);
        }
    };

    const getDirections = async (destinationPlace) => {
        if (!currentMapCenter) {
            setError("Your current location is not available to calculate directions. Please use 'Use My Location' or 'Search by Address' first.");
            return;
        }
        setLoading(true);
        setError(null);
        setRouteData(null);
        setSelectedPlace(destinationPlace);

        try {
            const data = await fetchWithRetry(
                '/api/maps/directions',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        origin: `${currentMapCenter.lat},${currentMapCenter.lng}`,
                        destination: `${destinationPlace.geometry.location.lat},${destinationPlace.geometry.location.lng}`
                    })
                }
            );

            if (data.status === 'OK' && data.routes.length > 0) {
                setRouteData(data.routes[0]);
            } else {
                setError(`Could not find directions. Status: ${data.error_message || data.status}`);
                setSelectedPlace(null);
            }
        } catch (err) {
            console.error("Directions failed", err);
            setError(`Failed to get directions: ${err.message || 'Network error'}`);
            setSelectedPlace(null);
        } finally {
            setLoading(false);
        }
    };

    // --- Event Handlers for Inputs ---
    const handleAddressKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleManualAddressSearch();
        }
    };

    const handleSearchQueryKeyPress = (e) => {
        if (e.key === 'Enter') {
            if (currentMapCenter) {
                handleSearch(currentMapCenter.lat, currentMapCenter.lng, searchQuery);
            } else {
                handleManualAddressSearch();
            }
        }
    };

    // --- Render Functions ---

    const renderDirectionsPanel = () => {
        if (!routeData) return null;

        const leg = routeData.legs[0];

        return (
            <div className="p-6 bg-white flex-shrink-0 overflow-y-auto max-h-[200px] border-t border-gray-200">
                <h2 className="text-xl font-semibold mb-3 text-gray-800">
                    🗺️ Directions to <span className="text-purple-600">{selectedPlace?.name}</span>
                </h2>
                <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-green-50 rounded-lg shadow-inner">
                    <span className="text-base font-bold text-green-800">
                        📏 Distance: {leg.distance?.text || 'N/A'}
                    </span>
                    <span className="text-base font-bold text-green-800">
                        ⏱️ Duration: {leg.duration?.text || 'N/A'}
                    </span>
                </div>
                <div className="text-sm text-gray-700">
                    <h3 className="font-semibold mb-2">Detailed Steps:</h3>
                    <ul className="space-y-2 max-h-24 overflow-y-auto pr-2">
                        {leg.steps.map((step, index) => (
                            <li
                                key={index}
                                className="p-2 bg-gray-50 rounded"
                                dangerouslySetInnerHTML={{ __html: `${index + 1}. ${step.html_instructions}` }}
                            />
                        ))}
                    </ul>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                        Find Nearby <span className="text-green-600">E-Waste Centers</span>
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Discover recycling centers, collection points, and e-waste management services near you
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Panel: Search and Results */}
                    <div className="w-full lg:w-1/3 p-6 bg-white rounded-2xl shadow-xl flex flex-col">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Search Options</h2>

                        <div className="mb-6">
                            <label htmlFor="search-query" className="block text-gray-700 text-sm font-semibold mb-3">
                                What are you looking for?
                            </label>
                            <input
                                type="text"
                                id="search-query"
                                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition duration-200"
                                placeholder="e.g., e-waste center, recycling facility"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={handleSearchQueryKeyPress}
                                disabled={loading}
                            />
                        </div>

                        <div className="mb-6">
                            <label htmlFor="address-input" className="block text-gray-700 text-sm font-semibold mb-3">
                                Or Enter Location Manually:
                            </label>
                            <input
                                type="text"
                                id="address-input"
                                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition duration-200"
                                placeholder="e.g., Pune, India"
                                value={addressInput}
                                onChange={(e) => setAddressInput(e.target.value)}
                                onKeyPress={handleAddressKeyPress}
                                disabled={loading}
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            <button
                                onClick={handleManualAddressSearch}
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 w-full sm:flex-1 font-semibold transition-all duration-300 transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                {loading && addressInput ? 'Searching Address...' : 'Search by Address'}
                            </button>
                            <button
                                onClick={handleUseMyLocation}
                                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 w-full sm:flex-1 font-semibold transition-all duration-300 transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                {loading && !addressInput ? 'Locating...' : 'Use My Location'}
                            </button>
                        </div>

                        {/* Status Messages */}
                        {loading && (
                            <div className="flex items-center justify-center mt-4 p-4 bg-blue-50 rounded-lg">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                                <p className="text-blue-600 font-medium">Searching...</p>
                            </div>
                        )}
                        {error && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg shadow-inner">
                                <p className="text-red-600 text-sm font-medium">🚨 {error}</p>
                            </div>
                        )}
                        {warning && (
                            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg shadow-inner">
                                <p className="text-yellow-700 text-sm font-medium">⚠️ {warning}</p>
                            </div>
                        )}
                        {currentMapCenter && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg shadow-inner">
                                <p className="text-sm text-green-700 text-center">
                                    📍 Location Center: {currentMapCenter.lat?.toFixed(4)}, {currentMapCenter.lng?.toFixed(4)}
                                </p>
                            </div>
                        )}

                        {routeData && (
                            <button
                                onClick={clearRoute}
                                className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 w-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-md"
                            >
                                Clear Route and Show All Results
                            </button>
                        )}

                        {/* Search Results List */}
                        {places.length > 0 && (
                            <div className="mt-6 border-t border-gray-200 pt-6 flex-grow overflow-y-auto max-h-[400px]">
                                <h2 className="text-xl font-semibold mb-4 text-gray-800">Found Places ({places.length}):</h2>
                                <ul className="space-y-4">
                                    {places.map((place) => (
                                        <li key={place.place_id} className="p-4 border border-gray-200 rounded-xl bg-white shadow-md transition-all duration-300 hover:shadow-lg">
                                            <h3 className="font-bold text-gray-900 mb-2">{place.name}</h3>
                                            <p className="text-sm text-gray-600 mb-3">{place.vicinity || place.formatted_address}</p>

                                            {place.photos && place.photos.length > 0 && (
                                                <img
                                                    src={getPhotoUrl(place.photos[0].photo_reference)}
                                                    alt={place.name}
                                                    className="w-full h-32 rounded-lg mb-3 object-cover"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/200x128/e5e7eb/6b7280?text=No+Image" }}
                                                />
                                            )}

                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {place.rating && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                        ⭐ {place.rating} ({place.user_ratings_total || 0})
                                                    </span>
                                                )}
                                                {place.opening_hours && place.opening_hours.open_now !== undefined && (
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${place.opening_hours.open_now ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {place.opening_hours.open_now ? '🟢 Open Now' : '🔴 Closed'}
                                                    </span>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => getDirections(place)}
                                                className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-all duration-300 transform hover:scale-[1.02] shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={loading}
                                            >
                                                Get Directions
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {places.length === 0 && !loading && !error && currentMapCenter && (
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
                                <p className="text-gray-600">No results found for "{searchQuery}" near your location.</p>
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Map View and Directions */}
                    <div className="w-full lg:w-2/3 h-[600px] rounded-2xl shadow-2xl overflow-hidden flex flex-col bg-gray-200">
                        {(currentMapCenter || places.length > 0) ? (
                            <MapContainer
                                center={currentMapCenter || defaultMapCenter}
                                zoom={currentMapCenter ? 13 : 10}
                                scrollWheelZoom={true}
                                className="flex-grow z-0"
                                style={{ height: routeData ? '400px' : '100%' }} // Adjust map height if directions are visible
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />

                                <MapViewController
                                    currentMapCenter={currentMapCenter}
                                    routeData={routeData}
                                    places={places}
                                    selectedPlace={selectedPlace}
                                />

                                {/* Current Location Marker */}
                                {currentMapCenter && (
                                    <Marker position={currentMapCenter} icon={userLocationIcon}>
                                        <Popup>Your Location Center</Popup>
                                    </Marker>
                                )}

                                {/* Place Markers (shows all places only if no route is active) */}
                                {!routeData && places.map((place) => (
                                    <Marker
                                        key={place.place_id}
                                        position={[place.geometry.location.lat, place.geometry.location.lng]}
                                        eventHandlers={{
                                            click: () => getDirections(place)
                                        }}
                                    >
                                        <Popup>
                                            <div className="font-sans text-sm">
                                                <strong className="text-gray-900">{place.name}</strong><br />
                                                <span className="text-xs text-gray-600">{place.vicinity || place.formatted_address}</span><br />
                                                {/* Directions button in popup uses the primary getDirections function */}
                                                <button
                                                    onClick={() => getDirections(place)}
                                                    className="mt-2 bg-purple-600 text-white px-2 py-1 rounded text-xs font-semibold hover:bg-purple-700"
                                                >
                                                    Get Directions
                                                </button>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}

                                {/* Route Destination Marker (if a route is active) */}
                                {selectedPlace && (
                                    <Marker position={[selectedPlace.geometry.location.lat, selectedPlace.geometry.location.lng]}>
                                        <Popup>Destination: {selectedPlace.name}</Popup>
                                    </Marker>
                                )}

                                {/* Route Polyline */}
                                {routeData && routeData.overview_polyline && routeData.overview_polyline.points && (
                                    <Polyline
                                        positions={decodePolyline(routeData.overview_polyline.points)}
                                        color="#6D28D9" // Purple color for the route
                                        weight={6}
                                        opacity={0.8}
                                    />
                                )}

                            </MapContainer>
                        ) : (
                            <div className="flex-grow flex items-center justify-center text-gray-500 bg-gradient-to-br from-gray-100 to-gray-200">
                                <div className="text-center p-8 rounded-xl bg-white shadow-lg">
                                    <div className="animate-pulse rounded-full h-12 w-12 border-b-4 border-green-600 mx-auto mb-4"></div>
                                    <p className="text-lg font-medium">Fetching location or awaiting search...</p>
                                </div>
                            </div>
                        )}

                        {/* Directions Summary Panel */}
                        {renderDirectionsPanel()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Maps;