package com.ewaste.ewaste_backend.controller;

import com.ewaste.ewaste_backend.dto.PickupUpdateDTO; // Assuming this DTO is still used for other updates
import com.ewaste.ewaste_backend.model.PickupRequest;
import com.ewaste.ewaste_backend.service.PickupRequestService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.io.IOException; // Import IOException for file handling

@RestController
@RequestMapping("/api/pickups")
@CrossOrigin // Removed (origins = "http://localhost:3000") - handled by global CorsConfig
public class PickupController {

    @Autowired
    private PickupRequestService pickupRequestService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PickupRequest>> getPickupsByUser(@PathVariable Long userId) {
        List<PickupRequest> pickups = pickupRequestService.getPickupsByUserId(userId);
        return ResponseEntity.ok(pickups);
    }

    // FIXED: schedulePickup method. It now prepares a PickupRequest object
    // and passes it to the service, where imageData will be byte[].
    @PostMapping("/schedule")
    public ResponseEntity<Map<String, String>> schedulePickup(
            @RequestParam("userId") Long userId,
            @RequestParam("date") String date,
            @RequestParam("time") String time,
            @RequestParam("address") String address,
            @RequestParam("pincode") String pincode,
            @RequestParam("city") String city,
            @RequestParam("state") String state,
            @RequestParam("schedulerName") String schedulerName,
            @RequestParam("phone") String phone,
            @RequestParam("email") String email,
            @RequestParam("wasteType") String wasteType,
            @RequestParam("status") String status,
            @RequestParam(value = "image", required = false) MultipartFile image) {

        Map<String, String> response = new HashMap<>();

        try {
            PickupRequest pickupRequest = new PickupRequest();
            pickupRequest.setUserId(userId);
            pickupRequest.setDate(date);
            pickupRequest.setTime(time);
            pickupRequest.setAddress(address);
            pickupRequest.setPincode(pincode);
            pickupRequest.setCity(city);
            pickupRequest.setState(state);
            pickupRequest.setSchedulerName(schedulerName);
            pickupRequest.setPhone(phone);
            pickupRequest.setEmail(email);
            pickupRequest.setWasteType(wasteType);
            pickupRequest.setStatus(status);

            // This line will now compile because PickupRequest.imageData is byte[]
            if (image != null && !image.isEmpty()) {
                pickupRequest.setImageData(image.getBytes());
            }

            // Call the service method, passing the PickupRequest object
            pickupRequestService.savePickupRequest(pickupRequest);

            response.put("status", "success");
            response.put("message", "Pickup request submitted successfully!");
            return ResponseEntity.ok(response);

        } catch (IOException e) { // Catch specific IOException for file operations
            e.printStackTrace();
            response.put("status", "error");
            response.put("message", "Error processing image for pickup request: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("status", "error");
            response.put("message", "Error submitting pickup request: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // This endpoint should ideally be for workers or admin, protected by roles
    @PutMapping("/update-status-weight")
    public ResponseEntity<Map<String, String>> updatePickupStatusAndWeight(@RequestBody PickupUpdateDTO updateDTO) {
        Map<String, String> response = new HashMap<>();
        try {
            // This method might need a workerId or adminId to log who made the update.
            // For now, it calls the existing service method.
            pickupRequestService.updatePickupStatusAndWeight(updateDTO);
            response.put("status", "success");
            response.put("message", "Pickup request updated successfully!");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("status", "error");
            response.put("message", "Error updating pickup request: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/counts")
    public ResponseEntity<Map<String, Long>> getDailyPickupCounts(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        System.out.println("Backend: Received request for pickup counts from " + startDate + " to " + endDate);
        Map<String, Long> counts = pickupRequestService.getDailyPickupCounts(startDate, endDate);
        System.out.println("Backend: Returning counts: " + counts);
        return ResponseEntity.ok(counts);
    }
}
