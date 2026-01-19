package com.ewaste.ewaste_backend.controller;

import com.ewaste.ewaste_backend.request.DirectionsRequest;
import com.ewaste.ewaste_backend.request.FindPlaceRequest;
import com.ewaste.ewaste_backend.request.NearbySearchRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@RestController
@RequestMapping("/api/maps")
@CrossOrigin
public class GoogleMapsController {

    @Value("${google.maps.api.key}")
    private String googleMapsApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping({"/nearbysearch", "/nearby-search"})
    public ResponseEntity<String> getNearbyEwasteCenters(@RequestBody NearbySearchRequest request) {
        String url = UriComponentsBuilder.fromHttpUrl("https://maps.googleapis.com/maps/api/place/nearbysearch/json")
                .queryParam("location", request.getLatitude() + "," + request.getLongitude())
                .queryParam("radius", request.getRadius() > 0 ? request.getRadius() : 5000)
                .queryParam("keyword", request.getKeyword())
                .queryParam("key", googleMapsApiKey)
                .toUriString();

        ResponseEntity<String> externalResponse = restTemplate.getForEntity(url, String.class);

        // Return body & status only, stripping GoMaps Pro headers to avoid duplicate CORS
        return ResponseEntity
                .status(externalResponse.getStatusCode())
                .body(externalResponse.getBody());
    }

    @PostMapping("/directions")
    public ResponseEntity<String> getDirections(@RequestBody DirectionsRequest request) {
        String url = UriComponentsBuilder.fromHttpUrl("https://maps.googleapis.com/maps/api/directions/json")
                .queryParam("origin", request.getOrigin())
                .queryParam("destination", request.getDestination())
                .queryParam("key", googleMapsApiKey)
                .toUriString();

        ResponseEntity<String> externalResponse = restTemplate.getForEntity(url, String.class);

        return ResponseEntity
                .status(externalResponse.getStatusCode())
                .body(externalResponse.getBody());
    }

    @PostMapping({"/findplacefromtext", "/find-place"})
    public ResponseEntity<String> findPlaceFromText(@RequestBody FindPlaceRequest request) {
        String url = UriComponentsBuilder.fromHttpUrl("https://maps.googleapis.com/maps/api/place/findplacefromtext/json")
                .queryParam("input", request.getInput())
                .queryParam("inputtype", "textquery")
                .queryParam("fields", "geometry,name")
                .queryParam("key", googleMapsApiKey)
                .toUriString();

        ResponseEntity<String> externalResponse = restTemplate.getForEntity(url, String.class);

        return ResponseEntity
                .status(externalResponse.getStatusCode())
                .body(externalResponse.getBody());
    }

    @GetMapping("/photo")
    public ResponseEntity<Void> getPlacePhoto(@RequestParam("photoreference") String photoReference,
                                              @RequestParam(value = "maxwidth", required = false, defaultValue = "400") int maxWidth) {
        String url = UriComponentsBuilder.fromHttpUrl("https://maps.googleapis.com/maps/api/place/photo")
                .queryParam("maxwidth", maxWidth)
                .queryParam("photoreference", photoReference)
                .queryParam("key", googleMapsApiKey)
                .toUriString();

        return ResponseEntity.status(HttpStatus.FOUND)
                .header("Location", url)
                .build();
    }
}
