package com.ewaste.ewaste_backend.service;

import com.ewaste.ewaste_backend.model.Worker;
import com.ewaste.ewaste_backend.request.FindPlaceRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class DistanceCalculationService {

    @Autowired
    private GoogleMapsApiService googleMapsApiService;

    /**
     * Calculate the distance between two points using the Haversine formula
     * @param lat1 Latitude of first point
     * @param lon1 Longitude of first point
     * @param lat2 Latitude of second point
     * @param lon2 Longitude of second point
     * @return Distance in kilometers
     */
    public double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Radius of the earth in km
        
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = R * c; // convert to kilometers
        
        return distance;
    }

    /**
     * Calculate distance between two pincodes/addresses using Google Maps Geocoding.
     *
     * @param pincode1 First pincode/address.
     * @param pincode2 Second pincode/address.
     * @return Approximate distance in kilometers, or Double.MAX_VALUE on failure.
     */
    public double calculateDistanceByPincode(String pincode1, String pincode2) {
        try {
            // Geocode pincode 1 using Google Maps API
            double[] coords1 = geocodeAddress(pincode1);
            if (coords1 == null) {
                System.out.println("❌ Geocoding failed for pincode 1: " + pincode1);
                return Double.MAX_VALUE;
            }

            // Geocode pincode 2 using Google Maps API
            double[] coords2 = geocodeAddress(pincode2);
            if (coords2 == null) {
                System.out.println("❌ Geocoding failed for pincode 2: " + pincode2);
                return Double.MAX_VALUE;
            }
            
            return calculateDistance(coords1[0], coords1[1], coords2[0], coords2[1]);
        } catch (Exception e) {
            System.err.println("❌ Error during distance calculation: " + e.getMessage());
            return Double.MAX_VALUE;
        }
    }

    /**
     * Converts a pincode/address into coordinates using the Google Maps API 
     * (Find Place from Text endpoint).
     *
     * NOTE: This method uses simple regex for demonstration/placeholder JSON parsing. 
     * In a production Spring application, you MUST use a robust library like Jackson 
     * or Gson for reliable JSON deserialization.
     * * @param address Pincode or address string.
     * @return [latitude, longitude] array, or null if geocoding fails.
     */
    private double[] geocodeAddress(String address) {
        if (address == null || address.trim().isEmpty()) {
            return null;
        }
        
        try {
            FindPlaceRequest request = new FindPlaceRequest();
            request.setInput(address);
            
            // Call the proxy service to hit the Google Maps Find Place API
            String jsonResponse = googleMapsApiService.findPlaceFromText(request);
            
            // --- PLACEHOLDER: FRAGILE JSON PARSING (REPLACE ME) ---
            // We look for "lat" and "lng" values in the raw JSON response.
            
            Pattern latPattern = Pattern.compile("\"lat\"\\s*:\\s*(-?\\d+\\.\\d+)");
            Pattern lngPattern = Pattern.compile("\"lng\"\\s*:\\s*(-?\\d+\\.\\d+)");

            Matcher latMatcher = latPattern.matcher(jsonResponse);
            Matcher lngMatcher = lngPattern.matcher(jsonResponse);

            if (latMatcher.find() && lngMatcher.find()) {
                double lat = Double.parseDouble(latMatcher.group(1));
                // NOTE: We assume the second group found is the corresponding longitude for the first candidate
                double lng = Double.parseDouble(lngMatcher.group(1)); 
                return new double[]{lat, lng};
            }
            
            System.out.println("Geocoding failed for address: " + address + ". Could not parse coordinates from API response.");
            return null;

        } catch (HttpClientErrorException e) {
            System.err.println("API error for geocoding " + address + ": " + e.getStatusCode());
            return null;
        } catch (Exception e) {
            System.err.println("General error during geocoding " + address + ": " + e.getMessage());
            return null;
        }
    }

    /**
     * Find the nearest worker to a pickup location
     * @param pickupPincode Pincode of the pickup location
     * @param workers List of available workers
     * @return The nearest worker, or null if no workers available
     */
    public Worker findNearestWorker(String pickupPincode, List<Worker> workers) {
        if (workers == null || workers.isEmpty()) {
            System.out.println("❌ No workers provided for distance calculation");
            return null;
        }

        Worker nearestWorker = null;
        double minDistance = Double.MAX_VALUE;

        System.out.println("🔍 Calculating distances from pickup location (" + pickupPincode + ") to workers:");

        for (Worker worker : workers) {
            if (worker.getPincode() != null && !worker.getPincode().isEmpty()) {
                double distance = calculateDistanceByPincode(pickupPincode, worker.getPincode());
                
                // Skip if distance calculation failed (returned Double.MAX_VALUE)
                if (distance == Double.MAX_VALUE) {
                    System.out.println("   ⚠️ Skipping distance calculation for worker " + worker.getUsername() + " due to geocoding failure.");
                    continue;
                }

                System.out.println("   📍 Worker " + worker.getUsername() + 
                                 " (Pincode: " + worker.getPincode() + 
                                 ") - Distance: " + String.format("%.2f", distance) + " km");
                
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestWorker = worker;
                }
            } else {
                System.out.println("   ⚠️ Worker " + worker.getUsername() + " has no pincode");
            }
        }

        if (nearestWorker != null && minDistance != Double.MAX_VALUE) {
            System.out.println("🎯 Nearest worker: " + nearestWorker.getUsername() + 
                             " at " + String.format("%.2f", minDistance) + " km");
        } else if (nearestWorker != null) {
             System.out.println("🎯 Nearest worker found, but distance could not be calculated accurately.");
        } else {
            System.out.println("❌ No valid worker found with pincode");
        }

        return nearestWorker;
    }

    /**
     * Find the nearest worker to a specific latitude and longitude
     * @param lat Latitude of the pickup location
     * @param lon Longitude of the pickup location
     * @param workers List of available workers
     * @return The nearest worker, or null if no workers available
     */
    public Worker findNearestWorker(double lat, double lon, List<Worker> workers) {
        if (workers == null || workers.isEmpty()) {
            System.out.println("❌ No workers provided for distance calculation");
            return null;
        }

        Worker nearestWorker = null;
        double minDistance = Double.MAX_VALUE;

        System.out.println("🔍 Calculating distances from pickup location (" + lat + ", " + lon + ") to workers:");

        for (Worker worker : workers) {
            double workerLat = 0;
            double workerLon = 0;
            boolean hasCoords = false;

            if (worker.getLatitude() != null && worker.getLongitude() != null) {
                workerLat = worker.getLatitude();
                workerLon = worker.getLongitude();
                hasCoords = true;
            } else if (worker.getPincode() != null && !worker.getPincode().isEmpty()) {
                // Fallback to pincode if coordinates are missing
                double[] workerCoords = geocodeAddress(worker.getPincode());
                if (workerCoords != null) {
                    workerLat = workerCoords[0];
                    workerLon = workerCoords[1];
                    hasCoords = true;
                }
            }

            if (hasCoords) {
                double distance = calculateDistance(lat, lon, workerLat, workerLon);
                
                System.out.println("   📍 Worker " + worker.getUsername() + 
                                 " - Distance: " + String.format("%.2f", distance) + " km");
                
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestWorker = worker;
                }
            } else {
                 System.out.println("   ⚠️ Worker " + worker.getUsername() + " has no location data");
            }
        }

        if (nearestWorker != null) {
            System.out.println("🎯 Nearest worker: " + nearestWorker.getUsername() + 
                             " at " + String.format("%.2f", minDistance) + " km");
        }

        return nearestWorker;
    }

    /**
     * Find workers within a specified radius of a pickup location
     * @param pickupPincode Pincode of the pickup location
     * @param workers List of available workers
     * @param radiusKm Radius in kilometers
     * @return List of workers within the radius, sorted by distance
     */
    public List<Worker> findWorkersWithinRadius(String pickupPincode, List<Worker> workers, double radiusKm) {
        if (workers == null || workers.isEmpty()) {
            return new ArrayList<>();
        }

        List<Worker> nearbyWorkers = new ArrayList<>();
        
        for (Worker worker : workers) {
            if (worker.getPincode() != null && !worker.getPincode().isEmpty()) {
                double distance = calculateDistanceByPincode(pickupPincode, worker.getPincode());
                if (distance != Double.MAX_VALUE && distance <= radiusKm) {
                    nearbyWorkers.add(worker);
                }
            }
        }

        // TODO: Sort the workers by distance if needed.
        return nearbyWorkers;
    }
}
