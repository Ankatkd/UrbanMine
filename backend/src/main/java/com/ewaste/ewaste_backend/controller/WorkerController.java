package com.ewaste.ewaste_backend.controller;

import com.ewaste.ewaste_backend.model.PickupRequest;
import com.ewaste.ewaste_backend.model.PickupLog;
import com.ewaste.ewaste_backend.model.Worker;
import com.ewaste.ewaste_backend.service.PickupRequestService;
import com.ewaste.ewaste_backend.service.WorkerService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

class PickupStatusUpdateDTO {
    private String status;
    private Double collectedKgs;
    private String notes;

    private String brand;
    private String itemDetails;
    private Double estimatedValue;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Double getCollectedKgs() {
        return collectedKgs;
    }

    public void setCollectedKgs(Double collectedKgs) {
        this.collectedKgs = collectedKgs;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getItemDetails() { return itemDetails; }
    public void setItemDetails(String itemDetails) { this.itemDetails = itemDetails; }

    public Double getEstimatedValue() { return estimatedValue; }
    public void setEstimatedValue(Double estimatedValue) { this.estimatedValue = estimatedValue; }
}

class RescheduleDTO {
    private String newDate;
    private String reason;
    public String getNewDate() { return newDate; }
    public void setNewDate(String newDate) { this.newDate = newDate; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}


@RestController
@RequestMapping("/api/worker")
@CrossOrigin
public class WorkerController {

    @Autowired
    private PickupRequestService pickupRequestService;

    @Autowired
    private WorkerService workerService;

    @Autowired
    private com.ewaste.ewaste_backend.service.WasteAnalysisService wasteAnalysisService;

    private Optional<Worker> getAuthenticatedWorker() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.empty();
        }

        Object principal = authentication.getPrincipal();
        String username;
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else {
            return Optional.empty();
        }
        return workerService.findWorkerByUsername(username);
    }

    @GetMapping("/profile")
    public ResponseEntity<Worker> getWorkerProfile() {
        try {
            Optional<Worker> workerOptional = getAuthenticatedWorker();
            if (workerOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            Worker worker = workerOptional.get();
            worker.setPassword(null);
            return ResponseEntity.ok(worker);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/pickups")
    public ResponseEntity<List<PickupRequest>> getAllWorkerPickups() {
        try {
            Optional<Worker> workerOptional = getAuthenticatedWorker();
            if (workerOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
            }

            Worker worker = workerOptional.get();
            List<PickupRequest> requests = pickupRequestService.getPickupRequestsForWorker(worker.getId());
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/pickups/today/pending")
    public ResponseEntity<List<PickupRequest>> getTodaysPendingWorkerPickups() {
        try {
            Optional<Worker> workerOptional = getAuthenticatedWorker();
            if (workerOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
            }

            Worker worker = workerOptional.get();
            List<PickupRequest> requests = pickupRequestService.getTodaysPendingPickupsForWorker(worker.getId());
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/pickups/unassigned")
    public ResponseEntity<List<PickupRequest>> getUnassignedPendingPickups() {
        try {
            Optional<Worker> workerOptional = getAuthenticatedWorker();
            if (workerOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
            }

            List<PickupRequest> unassignedRequests = pickupRequestService.getUnassignedPendingPickups();
            return ResponseEntity.ok(unassignedRequests);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/pickups/{requestId}/assign")
    public ResponseEntity<PickupRequest> assignPickupToSelf(@PathVariable Long requestId) {
        try {
            Optional<Worker> workerOptional = getAuthenticatedWorker();
            if (workerOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            Worker worker = workerOptional.get();
            PickupRequest updatedRequest = pickupRequestService.assignWorkerToPickupRequest(requestId, worker.getId());
            return ResponseEntity.ok(updatedRequest);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(null);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/pickups/{requestId}/status")
    public ResponseEntity<PickupRequest> updatePickupStatus(
            @PathVariable Long requestId,
            @RequestBody PickupStatusUpdateDTO updateDTO) {
        try {
            Optional<Worker> workerOptional = getAuthenticatedWorker();
            if (workerOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            Worker worker = workerOptional.get();
            PickupRequest existingRequest = pickupRequestService.getPickupRequestById(requestId);

            if (existingRequest == null || !worker.getId().equals(existingRequest.getAssignedWorkerId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            PickupRequest updatedRequest = pickupRequestService.updatePickupStatus(
                    requestId,
                    updateDTO.getStatus(),
                    worker.getId(),
                    updateDTO.getCollectedKgs(),
                    updateDTO.getNotes(),
                    updateDTO.getBrand(),
                    updateDTO.getItemDetails(),
                    updateDTO.getEstimatedValue()
            );
            return ResponseEntity.ok(updatedRequest);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/pickups/{requestId}/history")
    public ResponseEntity<List<PickupLog>> getPickupHistoryForRequest(@PathVariable Long requestId) {
        try {
            List<PickupLog> logs = pickupRequestService.getPickupLogsForRequest(requestId);
            return ResponseEntity.ok(logs);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/logs")
    public ResponseEntity<List<PickupLog>> getAllWorkerPickupLogs() {
        try {
            Optional<Worker> workerOptional = getAuthenticatedWorker();
            if (workerOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
            }

            Worker worker = workerOptional.get();
            List<PickupLog> logs = pickupRequestService.getPickupLogsByWorker(worker.getId());
            return ResponseEntity.ok(logs);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/pickups/missed")
    public ResponseEntity<List<PickupRequest>> getMissedWorkerPickups() {
        try {
            Optional<Worker> workerOptional = getAuthenticatedWorker();
            if (workerOptional.isEmpty()) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            return ResponseEntity.ok(pickupRequestService.getMissedPickupsForWorker(workerOptional.get().getId()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/pickups/{requestId}/reached")
    public ResponseEntity<PickupRequest> markReached(@PathVariable Long requestId) {
        try {
            Optional<Worker> workerOptional = getAuthenticatedWorker();
            if (workerOptional.isEmpty()) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            return ResponseEntity.ok(pickupRequestService.markReached(requestId, workerOptional.get().getId()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/pickups/{requestId}/reschedule")
    public ResponseEntity<PickupRequest> reschedulePickup(@PathVariable Long requestId, @RequestBody RescheduleDTO dto) {
        try {
            Optional<Worker> workerOptional = getAuthenticatedWorker();
            if (workerOptional.isEmpty()) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            return ResponseEntity.ok(pickupRequestService.reschedulePickup(requestId, workerOptional.get().getId(), dto.getNewDate(), dto.getReason()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/pickups/{requestId}/items")
    public ResponseEntity<?> addPickupItem(@PathVariable Long requestId, 
                                                     @RequestParam("images") org.springframework.web.multipart.MultipartFile[] images,
                                                     @RequestParam(value = "brand", required = false) String brand,
                                                     @RequestParam(value = "details", required = false) String details) {
        try {
             Optional<Worker> workerOptional = getAuthenticatedWorker();
            if (workerOptional.isEmpty()) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

            if (images == null || images.length == 0) {
                 return ResponseEntity.badRequest().body("No images uploaded.");
            }

            // Primary image for AI analysis is the first one
            org.springframework.web.multipart.MultipartFile primaryImage = images[0];
            
            // AI Analysis
            java.util.Map<String, Object> analysis = wasteAnalysisService.analyzeWasteImage(primaryImage);
            String aiBrand = (String) analysis.get("brand");
            String aiItem = (String) analysis.getOrDefault("detectedItem", "Unknown");
            double confidence = 0.0;
             Object conf = analysis.get("confidence");
             if (conf instanceof Number) {
                confidence = ((Number) conf).doubleValue();
            }

            // Manual Override Check: If brand is provided manually and differs from AI, require > 1 image
            if (brand != null && !brand.trim().isEmpty() && !brand.equalsIgnoreCase(aiBrand)) {
                if (images.length < 2) {
                     return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Manual Brand verification requires at least 2 images for confidence building.");
                }
            }
            
            com.ewaste.ewaste_backend.model.PickupItem item = new com.ewaste.ewaste_backend.model.PickupItem();
            item.setImageData(primaryImage.getBytes()); // Main thumbnail
            
            // Add all images to ItemImage relationship
            for (org.springframework.web.multipart.MultipartFile img : images) {
                com.ewaste.ewaste_backend.model.ItemImage itemImage = new com.ewaste.ewaste_backend.model.ItemImage();
                itemImage.setImageData(img.getBytes());
                item.addImage(itemImage);
            }

            item.setWasteType(aiItem);
            item.setBrand(brand != null ? brand : aiBrand);
            item.setItemDetails(details != null ? details : "Added by Worker");
            
            Object val = analysis.get("totalEstimatedValue");
             if (val instanceof Number) {
                item.setEstimatedValue(((Number) val).doubleValue());
            } else {
                 item.setEstimatedValue(0.0);
            }
            
            item.setAiConfidence(confidence);
            item.setStatus("VERIFIED"); 

            return ResponseEntity.ok(pickupRequestService.addPickupItem(requestId, item));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
