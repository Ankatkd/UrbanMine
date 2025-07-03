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
}

@RestController
@RequestMapping("/api/worker")
@CrossOrigin
public class WorkerController {

    @Autowired
    private PickupRequestService pickupRequestService;

    @Autowired
    private WorkerService workerService;

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
                    updateDTO.getNotes()
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
}
