package com.ewaste.ewaste_backend.controller;

import com.ewaste.ewaste_backend.model.PickupRequest;
import com.ewaste.ewaste_backend.model.User;
import com.ewaste.ewaste_backend.model.Worker;
import com.ewaste.ewaste_backend.repository.PickupRequestRepository;
import com.ewaste.ewaste_backend.service.PickupRequestService;
import com.ewaste.ewaste_backend.service.UserService;
import com.ewaste.ewaste_backend.service.WorkerService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAuthority('ADMIN')") // Only ADMIN role can access these endpoints
@CrossOrigin
public class AdminController {

    @Autowired
    private UserService userService;

    @Autowired
    private WorkerService workerService;

    @Autowired
    private PickupRequestService pickupRequestService;

    @Autowired
    private PickupRequestRepository pickupRequestRepository; // Injecting repository for direct query

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        // Remove passwords before sending to frontend
        users.forEach(user -> user.setPassword(null));
        return ResponseEntity.ok(users);
    }

    @GetMapping("/workers")
    public ResponseEntity<List<Worker>> getAllWorkers() {
        List<Worker> workers = workerService.getAllWorkers();
        // Remove passwords before sending to frontend
        workers.forEach(worker -> worker.setPassword(null));
        return ResponseEntity.ok(workers);
    }

    @GetMapping("/pickups")
    public ResponseEntity<List<PickupRequest>> getAllPickups() {
        List<PickupRequest> pickups = pickupRequestService.getAllPickupRequests();
        return ResponseEntity.ok(pickups);
    }

    // FIXED: Endpoint to get pickups by status (now correctly calls findByStatus)
    @GetMapping("/pickups/status/{status}")
    public ResponseEntity<List<PickupRequest>> getPickupsByStatus(@PathVariable String status) {
        // Using the newly added findByStatus method in repository
        List<PickupRequest> pickups = pickupRequestRepository.findByStatus(status);
        return ResponseEntity.ok(pickups);
    }

    // Endpoint to manually assign a pickup to a worker by admin
    @PostMapping("/pickups/{requestId}/assign/{workerId}")
    public ResponseEntity<PickupRequest> assignPickupAdmin(
            @PathVariable Long requestId,
            @PathVariable Long workerId) {
        try {
            // Validate worker exists
            Optional<Worker> workerOptional = workerService.findWorkerById(workerId);
            if (workerOptional.isEmpty()) {
                return ResponseEntity.badRequest().body(null); // Or custom error response
            }

            // Call service method to assign, passing the specific workerId
            PickupRequest assignedPickup = pickupRequestService.assignWorkerToPickupRequest(requestId, workerId);
            return ResponseEntity.ok(assignedPickup);
        } catch (RuntimeException e) {
            // Provide a more descriptive error message
            return ResponseEntity.badRequest().body(null); // Handle specific exceptions
        }
    }

    // Endpoint to update pickup status by admin (e.g., if re-assigning or correcting status)
    @PutMapping("/pickups/{requestId}/status")
    public ResponseEntity<PickupRequest> updatePickupStatusAdmin(
            @PathVariable Long requestId,
            @RequestBody Map<String, String> payload) {
        try {
            String status = payload.get("status");
            if (status == null || status.isEmpty()) {
                return ResponseEntity.badRequest().body(null);
            }

            PickupRequest existingRequest = pickupRequestService.getPickupRequestById(requestId);
            if (existingRequest == null) {
                return ResponseEntity.notFound().build();
            }

            String oldStatus = existingRequest.getStatus();
            existingRequest.setStatus(status);

            PickupRequest updatedRequest = pickupRequestRepository.save(existingRequest);
            return ResponseEntity.ok(updatedRequest);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/pickups/{requestId}")
    public ResponseEntity<Void> deletePickupRequest(@PathVariable Long requestId) {
        try {
            pickupRequestRepository.deleteById(requestId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}
