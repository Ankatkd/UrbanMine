package com.ewaste.ewaste_backend.controller;

import com.ewaste.ewaste_backend.model.PickupRequest;
import com.ewaste.ewaste_backend.model.Worker;
import com.ewaste.ewaste_backend.service.AutoAssignmentService;
import com.ewaste.ewaste_backend.service.PickupRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auto-assignment")
@CrossOrigin
public class AutoAssignmentController {

    @Autowired
    private AutoAssignmentService autoAssignmentService;

    @Autowired
    private PickupRequestService pickupRequestService;

    /**
     * Manually trigger auto-assignment for all unassigned pickups
     */
    @PostMapping("/assign-all")
    public ResponseEntity<Map<String, Object>> assignAllUnassignedPickups() {
        try {
            List<PickupRequest> unassignedPickups = pickupRequestService.getUnassignedPendingPickups();
            int assignedCount = autoAssignmentService.autoAssignMultiplePickups(unassignedPickups);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("totalUnassigned", unassignedPickups.size());
            response.put("assignedCount", assignedCount);
            response.put("message", "Successfully assigned " + assignedCount + " out of " + unassignedPickups.size() + " unassigned pickups");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Find nearby workers for a specific pickup location
     */
    @GetMapping("/nearby-workers")
    public ResponseEntity<List<Worker>> findNearbyWorkers(
            @RequestParam String pincode,
            @RequestParam(defaultValue = "10") double radiusKm) {
        try {
            List<Worker> nearbyWorkers = autoAssignmentService.findNearbyWorkers(pincode, radiusKm);
            return ResponseEntity.ok(nearbyWorkers);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    /**
     * Get assignment statistics for a worker
     */
    @GetMapping("/worker/{workerId}/assignments")
    public ResponseEntity<Map<String, Object>> getWorkerAssignmentStats(@PathVariable Long workerId) {
        try {
            long assignmentCount = autoAssignmentService.getWorkerAssignmentCount(workerId);
            boolean isAvailable = autoAssignmentService.isWorkerAvailable(workerId, 5); // Max 5 assignments
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("workerId", workerId);
            stats.put("assignmentCount", assignmentCount);
            stats.put("isAvailable", isAvailable);
            stats.put("maxAssignments", 5);
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    /**
     * Manually assign a specific pickup to the nearest worker
     */
    @PostMapping("/pickup/{pickupId}/assign")
    public ResponseEntity<Map<String, Object>> assignSpecificPickup(@PathVariable Long pickupId) {
        try {
            // Get the pickup request
            List<PickupRequest> allPickups = pickupRequestService.getPickupsByUserId(1L); // This is a simplified approach
            PickupRequest pickupRequest = allPickups.stream()
                .filter(p -> p.getId().equals(pickupId))
                .findFirst()
                .orElse(null);
            
            if (pickupRequest == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("error", "Pickup request not found");
                return ResponseEntity.badRequest().body(response);
            }
            
            Worker assignedWorker = autoAssignmentService.autoAssignPickup(pickupRequest);
            
            Map<String, Object> response = new HashMap<>();
            if (assignedWorker != null) {
                response.put("success", true);
                response.put("assignedWorker", assignedWorker.getUsername());
                response.put("message", "Pickup assigned to " + assignedWorker.getUsername());
            } else {
                response.put("success", false);
                response.put("message", "No suitable worker found for assignment");
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Get auto-assignment configuration and statistics
     */
    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getAutoAssignmentConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("maxAssignmentsPerWorker", 5);
        config.put("autoAssignmentEnabled", true);
        config.put("distanceCalculationMethod", "Haversine formula with pincode mapping");
        config.put("supportedFeatures", List.of(
            "Distance-based assignment",
            "Load balancing",
            "Worker availability checking",
            "Manual assignment override"
        ));
        
        return ResponseEntity.ok(config);
    }
}
