import React, { useState, useEffect } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet marker icon not showing
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});


// Basic Polyline Decoder
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


// Component to control map view when route or places change
const MapViewController = ({ currentMapCenter, routeData, places, selectedPlace }) => {
  const map = useMap();

  useEffect(() => {
    if (routeData && routeData.overview_polyline && routeData.overview_polyline.points) {
      const polylinePoints = decodePolyline(routeData.overview_polyline.points);
      if (polylinePoints.length > 0) {
        const bounds = L.latLngBounds(polylinePoints);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } else if (selectedPlace && currentMapCenter) {
        const bounds = L.latLngBounds([currentMapCenter, [selectedPlace.geometry.location.lat, selectedPlace.geometry.location.lng]]);
        map.fitBounds(bounds, { padding: [50, 50] });
    } else if (currentMapCenter) {
      map.setView(currentMapCenter, 13);
    } else if (places.length > 0) {
        map.setView([places[0].geometry.location.lat, places[0].geometry.location.lng], 13);
    }
  }, [currentMapCenter, routeData, places, selectedPlace, map]);

  return null;
};


const Maps = () => {
  const [addressInput, setAddressInput] = useState("");
  const [currentMapCenter, setCurrentMapCenter] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("e-waste center");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [routeData, setRouteData] = useState(null);

  // IMPORTANT: Replace with your actual GoMaps.pro API Key
  const GOMAPS_API_KEY = 'AlzaSya5QD-sqq93fLWzpsX9LYdlTZqugV3vLXQ';
  const defaultMapCenter = { lat: 18.5204, lng: 73.8567 }; // Pune, India

  useEffect(() => {
    handleUseMyLocation();
  }, []);

  // Location Handling Functions
  const handleUseMyLocation = () => {
    setLoading(true);
    setError(null);
    setPlaces([]);
    setRouteData(null);
    setSelectedPlace(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser. Please enter an address manually.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentMapCenter({ lat: latitude, lng: longitude });
        setAddressInput("");
        handleSearch(latitude, longitude);
      },
      (err) => {
        console.error("Unable to retrieve your location:", err);
        if (err.code === err.PERMISSION_DENIED) {
          setError("Location access denied. Please enable location services in your browser settings or enter an address manually.");
        } else {
          setError("Unable to retrieve your location. Please try again or enter an address manually.");
        }
        setLoading(false);
      }
    );
  };

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

    try {
      const geoResponse = await axios.get(
        "https://maps.gomaps.pro/maps/api/place/findplacefromtext/json",
        {
          params: {
            input: addressInput,
            inputtype: "textquery",
            fields: "geometry",
            key: GOMAPS_API_KEY,
          },
        }
      );

      if (geoResponse.data.status === 'OK' && geoResponse.data.candidates.length > 0) {
        const { lat, lng } = geoResponse.data.candidates[0].geometry.location;
        setCurrentMapCenter({ lat, lng });
        handleSearch(lat, lng);
      } else {
        setError(`Could not find coordinates for "${addressInput}". Status: ${geoResponse.data.status}`);
        setLoading(false);
      }

    } catch (error) {
      console.error("Geocoding or search failed", error);
      setError("Failed to resolve address or search for places.");
      setLoading(false);
    }
  };

  const handleSearch = async (lat = null, lng = null) => {
    setLoading(true);
    setError(null);
    setPlaces([]);
    setRouteData(null);
    setSelectedPlace(null);

    const searchLat = lat || currentMapCenter?.lat;
    const searchLng = lng || currentMapCenter?.lng;

    if (!searchLat || !searchLng) {
      setError("No location available. Please enable location services or enter an address.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        "https://maps.gomaps.pro/maps/api/place/nearbysearch/json",
        {
          params: {
            keyword: searchQuery,
            location: `${searchLat},${searchLng}`,
            rankby: 'distance', // This tells the API to sort results by distance
            // When rankby is 'distance', 'radius' is not allowed and should be omitted.
            language: "en",
            key: GOMAPS_API_KEY,
          },
        }
      );

      if (response.data.status === 'OK') {
        setPlaces(response.data.results);
      } else {
        setError(`Error from GoMaps Nearby Search API: ${response.data.status}`);
      }
    } catch (error) {
      console.error("Search failed", error);
      setError(`Search failed: ${error.message || 'Network error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Directions Function
  const getDirections = async (destinationPlace) => {
    if (!currentMapCenter) {
      setError("Your current location is not available to calculate directions.");
      return;
    }
    setLoading(true);
    setError(null);
    setRouteData(null);
    setSelectedPlace(destinationPlace);

    try {
      const origin = `${currentMapCenter.lat},${currentMapCenter.lng}`;
      const destination = `${destinationPlace.geometry.location.lat},${destinationPlace.geometry.location.lng}`;

      const response = await axios.get(
        "https://maps.gomaps.pro/maps/api/directions/json",
        {
          params: {
            origin: origin,
            destination: destination,
            key: GOMAPS_API_KEY,
          },
        }
      );

      if (response.data.status === 'OK' && response.data.routes.length > 0) {
        setRouteData(response.data.routes[0]);
      } else {
        setError(`Could not find directions. Status: ${response.data.status}`);
      }
    } catch (error) {
      console.error("Directions failed", error);
      setError(`Failed to get directions: ${error.message || 'Network error'}`);
    } finally {
      setLoading(false);
    }
  };

  const clearRoute = () => {
    setRouteData(null);
    setSelectedPlace(null);
  };


  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-100 p-8 flex flex-col items-center">
      <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-10">
        Find Nearby Services
      </h1>

      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-7xl">
        {/* Left Side: Location Input and Search Results */}
        <div className="w-full lg:w-1/3 p-4 bg-white rounded-lg shadow-lg flex flex-col">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Search Options</h2>

          {/* Search Query Input */}
          <div className="mb-4">
            <label htmlFor="search-query" className="block text-gray-700 text-sm font-bold mb-2">
              What are you looking for?
            </label>
            <input
              type="text"
              id="search-query"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="e.g., e-waste center, kabaddi wale"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Manual Address Input (Fallback/Alternative) */}
          <div className="mb-4">
            <label htmlFor="address-input" className="block text-gray-700 text-sm font-bold mb-2">
              Or Enter Location Manually:
            </label>
            <input
              type="text"
              id="address-input"
              className="w-full px-4 py-2 border rounded shadow"
              placeholder="e.g., Pune, India"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Search Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <button
              onClick={handleManualAddressSearch}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full sm:flex-1"
              disabled={loading}
            >
              Search by Address
            </button>
            <button
              onClick={handleUseMyLocation}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full sm:flex-1"
              disabled={loading}
            >
              Use My Location
            </button>
          </div>

          {/* Messages */}
          {loading && <p className="text-blue-600 text-center mt-4">Loading...</p>}
          {error && <p className="text-red-600 text-center mt-4">{error}</p>}
          {currentMapCenter && (
            <p className="text-sm text-gray-600 mt-4 text-center">
              Your Location: {currentMapCenter.lat?.toFixed(4)}, {currentMapCenter.lng?.toFixed(4)}
            </p>
          )}

          {/* Clear Route Button */}
          {routeData && (
              <button
                onClick={clearRoute}
                className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 w-full"
              >
                Clear Route
              </button>
          )}

          {/* Search Results Display */}
          {places.length > 0 && (
            <div className="mt-6 border-t border-gray-200 pt-6 flex-grow overflow-y-auto max-h-[300px]">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Found Places:</h2>
              <ul className="space-y-3">
                {places.map((place) => (
                  <li key={place.place_id} className="p-3 border border-gray-200 rounded-md bg-white shadow-sm">
                    <h3 className="font-bold text-gray-900">{place.name}</h3>
                    <p className="text-sm text-gray-600">{place.vicinity || place.formatted_address}</p>
                    {/* Display Photo if available */}
                    {place.photos && place.photos.length > 0 && (
                      <img
                        src={`https://maps.gomaps.pro/maps/api/place/photo?photo_reference=${place.photos[0].photo_reference}&maxwidth=200&key=${GOMAPS_API_KEY}`}
                        alt={place.name}
                        className="w-full h-auto rounded-md mt-2 object-cover"
                        onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/200?text=No+Image" }} // Fallback for broken images
                      />
                    )}
                    {place.rating && (
                      <p className="text-xs text-gray-700">Rating: {place.rating} ({place.user_ratings_total || 0} reviews)</p>
                    )}
                    {place.opening_hours && place.opening_hours.open_now !== undefined && (
                      <p className={`text-xs ${place.opening_hours.open_now ? 'text-green-700' : 'text-red-700'}`}>
                        {place.opening_hours.open_now ? 'Open Now' : 'Closed'}
                      </p>
                    )}
                    <button
                      onClick={() => getDirections(place)}
                      className="mt-2 bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
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
            <p className="text-gray-600 text-center mt-4">No results found for "{searchQuery}" near your location.</p>
          )}
        </div>

        {/* Right Side: Interactive Map & Route Steps */}
        <div className="w-full lg:w-2/3 h-[600px] rounded-lg shadow-lg overflow-hidden flex flex-col bg-gray-200">
            {/* Interactive Map */}
            {(currentMapCenter || places.length > 0) ? (
                <MapContainer
                    center={currentMapCenter || defaultMapCenter}
                    zoom={currentMapCenter ? 13 : 10}
                    scrollWheelZoom={true}
                    className="flex-grow z-0"
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

                    {currentMapCenter && (
                        <Marker position={currentMapCenter}>
                            <Popup>Your Current Location</Popup>
                        </Marker>
                    )}

                    {!selectedPlace && places.map((place) => (
                        <Marker key={place.place_id} position={[place.geometry.location.lat, place.geometry.location.lng]}>
                            <Popup>
                                <strong>{place.name}</strong><br />
                                {place.vicinity || place.formatted_address}<br />
                                {place.photos && place.photos.length > 0 && (
                                    <img
                                      src={`https://maps.gomaps.pro/maps/api/place/photo?photo_reference=${place.photos[0].photo_reference}&maxwidth=100&key=${GOMAPS_API_KEY}`}
                                      alt={place.name}
                                      className="w-full h-auto rounded-md mt-2 object-cover"
                                      onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/100?text=No+Image" }}
                                    />
                                )}
                                {place.rating && `Rating: ${place.rating}`}<br />
                                {place.opening_hours && place.opening_hours.open_now !== undefined && (
                                    <span>{place.opening_hours.open_now ? 'Open Now' : 'Closed'}</span>
                                )}
                                <br/>
                                <button
                                    onClick={() => getDirections(place)}
                                    className="mt-2 bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700"
                                >
                                    Get Directions
                                </button>
                            </Popup>
                        </Marker>
                    ))}

                    {selectedPlace && (
                        <Marker position={[selectedPlace.geometry.location.lat, selectedPlace.geometry.location.lng]}>
                            <Popup>Destination: {selectedPlace.name}</Popup>
                        </Marker>
                    )}

                    {routeData && routeData.overview_polyline && routeData.overview_polyline.points && (
                        <Polyline
                            positions={decodePolyline(routeData.overview_polyline.points)}
                            color="blue"
                            weight={5}
                            opacity={0.7}
                        />
                    )}

                </MapContainer>
            ) : (
                <div className="flex-grow flex items-center justify-center text-gray-500">
                    <p>Fetching your location or awaiting search...</p>
                </div>
            )}


            {/* Route Steps Display */}
            {routeData && (
                <div className="p-4 bg-white flex-shrink-0 overflow-y-auto max-h-[200px]">
                    <h2 className="text-xl font-semibold mb-3 text-gray-800">
                        Directions to {selectedPlace?.name}
                    </h2>
                    <p className="text-sm text-gray-700 mb-2">
                        Distance: {routeData.legs[0]?.distance?.text || 'N/A'}, Duration: {routeData.legs[0]?.duration?.text || 'N/A'}
                    </p>
                    <ul className="space-y-2">
                        {routeData.legs[0]?.steps.map((step, index) => (
                            <li key={index} className="text-sm text-gray-800" dangerouslySetInnerHTML={{ __html: `${index + 1}. ${step.html_instructions}` }}>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Maps;