package com.ewaste.ewaste_backend.service;

import org.springframework.stereotype.Service;
import java.util.Optional;

/**
 * A service class for handling map-related functionalities.
 * This is a placeholder; you need to implement the actual business logic here.
 */
@Service
public class GoMapsProService {

    public GoMapsProService() {
        // Default constructor
    }

    /**
     * Geocodes an address to return its latitude and longitude.
     * This is a placeholder; you need to implement the actual geocoding logic.
     *
     * @param address The address string to geocode.
     * @return An Optional containing a double array [latitude, longitude] if geocoding is successful.
     * Returns Optional.empty() if geocoding fails or no coordinates are found.
     */
    public Optional<double[]> geocodeAddress(String address) {
        // TODO: Implement actual geocoding logic here.
        // This will typically involve calling a third-party geocoding API
        // (e.g., GoMaps Pro Geocoding API).
        System.out.println("GoMapsProService: Geocoding address: " + address);

        // Placeholder for demonstration:
        // In a real application, you would make an API call and parse the response.
        if (address != null && !address.trim().isEmpty()) {
            double latitude;
            double longitude;

            // Example: Assign coordinates based on city for testing.
            // You'll replace this with a real geocoding API call.
            String lowerCaseAddress = address.toLowerCase();
            if (lowerCaseAddress.contains("pune")) {
                latitude = 18.5204;
                longitude = 73.8567;
            } else if (lowerCaseAddress.contains("mumbai")) {
                latitude = 19.0760;
                longitude = 72.8777;
            } else if (lowerCaseAddress.contains("chembur")) {
                latitude = 19.0558;
                longitude = 72.9097;
            } else if (lowerCaseAddress.contains("lohegaon")) {
                latitude = 18.5835;
                longitude = 73.9142;
            }
            else {
                System.out.println("GoMapsProService: No specific dummy coordinates for address: " + address + ". Returning empty Optional.");
                return Optional.empty();
            }
            return Optional.of(new double[]{latitude, longitude});
        } else {
            System.out.println("GoMapsProService: Empty address provided for geocoding. Returning empty Optional.");
            return Optional.empty();
        }
    }

    /**
     * Calculates the distance between two sets of latitude and longitude coordinates using the Haversine formula.
     *
     * @param lat1 Latitude of point 1
     * @param lon1 Longitude of point 1
     * @param lat2 Latitude of point 2
     * @param lon2 Longitude of point 2
     * @return Distance in kilometers.
     */
    public double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Radius of Earth in kilometers

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // distance in km
    }
}