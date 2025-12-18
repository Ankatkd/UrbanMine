package com.ewaste.ewaste_backend.service;

import com.ewaste.ewaste_backend.request.DirectionsRequest;
import com.ewaste.ewaste_backend.request.FindPlaceRequest;
import com.ewaste.ewaste_backend.request.NearbySearchRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * A service class for interacting with the Google Maps Platform APIs.
 * This service acts as a secure proxy for front-end requests.
 */
// filepath: [GoogleMapsApiService.java](http://_vscodecontentref_/3)
// ...existing code...
@Service
public class GoogleMapsApiService {

    @Value("${google.maps.api.key}")
    private String apiKey;

    private static final String BASE_URL = "https://maps.googleapis.com/maps/api";
    private final RestTemplate restTemplate;

    public GoogleMapsApiService() {
        this.restTemplate = new RestTemplate();
    }

    public String findPlaceFromText(FindPlaceRequest request) {
        String url = BASE_URL + "/place/findplacefromtext/json?input=" +
                     request.getInput() +
                     "&inputtype=textquery&fields=geometry,name&key=" +
                     apiKey;
        System.out.println("GoogleMapsApiService: Calling Find Place from Text API: " + url);
        return restTemplate.getForObject(url, String.class);
    }

    public String nearbySearch(NearbySearchRequest request) {
        String location = request.getLatitude() + "," + request.getLongitude();
        String url = BASE_URL + "/place/nearbysearch/json?location=" +
                     location +
                     "&radius=" +
                     (request.getRadius() > 0 ? request.getRadius() : 50000) +
                     "&keyword=" +
                     request.getKeyword() +
                     "&key=" +
                     apiKey;
        System.out.println("GoogleMapsApiService: Calling Nearby Search API: " + url);
        return restTemplate.getForObject(url, String.class);
    }

    public String getDirections(DirectionsRequest request) {
        String url = BASE_URL + "/directions/json?origin=" +
                     request.getOrigin() +
                     "&destination=" +
                     request.getDestination() +
                     "&mode=driving&key=" +
                     apiKey;
        System.out.println("GoogleMapsApiService: Calling Directions API: " + url);
        return restTemplate.getForObject(url, String.class);
    }

    public byte[] getPlacePhoto(String photoReference, int maxWidth) {
        String url = BASE_URL + "/place/photo?maxwidth=" + maxWidth +
                     "&photoreference=" + photoReference +
                     "&key=" + apiKey;
        System.out.println("GoogleMapsApiService: Calling Place Photo API.");
        return restTemplate.getForObject(url, byte[].class);
    }
}

