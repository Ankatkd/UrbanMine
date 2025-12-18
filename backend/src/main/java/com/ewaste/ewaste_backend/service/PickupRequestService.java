package com.ewaste.ewaste_backend.service;

import com.ewaste.ewaste_backend.dto.PickupUpdateDTO;
import com.ewaste.ewaste_backend.model.PickupRequest;
import com.ewaste.ewaste_backend.model.Worker;
import com.ewaste.ewaste_backend.model.PickupLog;
import com.ewaste.ewaste_backend.repository.PickupRequestRepository;
import com.ewaste.ewaste_backend.repository.WorkerRepository;
import com.ewaste.ewaste_backend.repository.PickupLogRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PickupRequestService {

    @Autowired
    private PickupRequestRepository pickupRequestRepository;

    @Autowired
    private WorkerRepository workerRepository;

    @Autowired
    private PickupLogRepository pickupLogRepository;

    @Autowired
    private AutoAssignmentService autoAssignmentService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Transactional
    public PickupRequest savePickupRequest(PickupRequest pickupRequest) {
        if (pickupRequest.getAssignedWorkerId() != null) {
            pickupRequest.setAssignedWorkerId(null);
        }

        if (pickupRequest.getStatus() == null || pickupRequest.getStatus().isEmpty()) {
            pickupRequest.setStatus("PENDING");
        }

        // Save the pickup request first
        PickupRequest savedRequest = pickupRequestRepository.save(pickupRequest);

        // Try to auto-assign to the nearest worker
        try {
            System.out.println("Attempting auto-assignment for pickup request ID: " + savedRequest.getId() + 
                             ", Pincode: " + savedRequest.getPincode() + 
                             ", Address: " + savedRequest.getAddress());
            
            Worker assignedWorker = autoAssignmentService.smartAutoAssignPickup(savedRequest, 5); // Max 5 assignments per worker
            if (assignedWorker != null) {
                System.out.println("✅ SUCCESS: Auto-assigned pickup " + savedRequest.getId() + 
                                " to worker " + assignedWorker.getUsername() + 
                                " (ID: " + assignedWorker.getId() + 
                                ", Pincode: " + assignedWorker.getPincode() + ")");
            } else {
                System.out.println("⚠️ WARNING: No suitable worker found for pickup " + savedRequest.getId());
            }
        } catch (Exception e) {
            System.err.println("❌ ERROR: Auto-assignment failed for pickup " + savedRequest.getId() + ": " + e.getMessage());
            e.printStackTrace();
        }

        return savedRequest;
    }

    public List<PickupRequest> getPickupsByUserId(Long userId) {
        return pickupRequestRepository.findByUserId(userId);
    }

    public Map<String, Long> getDailyPickupCounts(LocalDate startDate, LocalDate endDate) {
        String startDateStr = startDate.format(DATE_FORMATTER);
        String endDateStr = endDate.format(DATE_FORMATTER);

        List<Object[]> results = pickupRequestRepository.countPickupsByDateRange(startDateStr, endDateStr);

        return results.stream()
            .collect(Collectors.toMap(
                arr -> (String) arr[0],
                arr -> (Long) arr[1]
            ));
    }

    @Transactional
    public PickupRequest assignWorkerToPickupRequest(Long requestId, Long workerId) {
        Optional<PickupRequest> requestOptional = pickupRequestRepository.findById(requestId);
        if (requestOptional.isEmpty()) {
            throw new RuntimeException("Pickup request not found with ID: " + requestId);
        }

        PickupRequest request = requestOptional.get();

        if (request.getAssignedWorkerId() != null && !request.getAssignedWorkerId().equals(workerId)) {
            throw new RuntimeException("Pickup request already assigned to a different worker.");
        }

        Optional<Worker> assignedWorkerOptional = workerRepository.findById(workerId);
        if (assignedWorkerOptional.isEmpty()) {
            throw new RuntimeException("Worker not found with ID: " + workerId);
        }

        Worker assignedWorker = assignedWorkerOptional.get();
        String oldStatus = request.getStatus();

        request.setAssignedWorkerId(assignedWorker.getId());

        if (!"COMPLETED".equals(oldStatus) && !"CANCELLED".equals(oldStatus)) {
            request.setStatus("ASSIGNED");
        }

        PickupRequest updatedRequest = pickupRequestRepository.save(request);

        pickupLogRepository.save(new PickupLog(
            updatedRequest,
            assignedWorker,
            oldStatus,
            request.getStatus(),
            null,
            "Pickup assigned to worker: " + assignedWorker.getUsername()
        ));

        return updatedRequest;
    }

    public List<PickupRequest> getPickupRequestsForWorker(Long workerId) {
        return pickupRequestRepository.findByAssignedWorkerIdOrderByDateAscTimeAsc(workerId);
    }

    public List<PickupRequest> getTodaysPendingPickupsForWorker(Long workerId) {
        String todayDateString = LocalDate.now().format(DATE_FORMATTER);
        return pickupRequestRepository.findByAssignedWorkerIdAndDateAndStatus(workerId, todayDateString, "ASSIGNED");
    }

    public List<PickupRequest> getUnassignedPendingPickups() {
        return pickupRequestRepository.findByAssignedWorkerIdIsNullAndStatusIn(
            List.of("PENDING", "Paid - Pending Pickup")
        );
    }

    @Transactional
    public PickupRequest updatePickupStatus(Long requestId, String newStatus, Long workerId, Double weightKg, String notes, String brand, String itemDetails, Double estimatedValue) {
        Optional<PickupRequest> requestOptional = pickupRequestRepository.findById(requestId);
        if (requestOptional.isEmpty()) {
            throw new RuntimeException("Pickup request not found with ID: " + requestId);
        }

        PickupRequest request = requestOptional.get();

        Optional<Worker> workerOptional = workerRepository.findById(workerId);
        if (workerOptional.isEmpty()) {
            throw new RuntimeException("Worker not found with ID: " + workerId);
        }

        Worker worker = workerOptional.get();
        String oldStatus = request.getStatus();

        if (!isValidStatus(newStatus)) {
            throw new IllegalArgumentException("Invalid status provided: " + newStatus);
        }

        request.setStatus(newStatus);

        if ("COMPLETED".equals(newStatus)) {
            request.setWeightKg(weightKg);
        } else if ("COMPLETED".equals(oldStatus)) {
            request.setWeightKg(null);
        }

        // Update editable fields if provided
        if (brand != null) request.setBrand(brand);
        if (itemDetails != null) request.setItemDetails(itemDetails);
        if (estimatedValue != null) request.setEstimatedValue(estimatedValue);

        PickupRequest updatedRequest = pickupRequestRepository.save(request);

        PickupLog log = new PickupLog(
            updatedRequest,
            worker,
            oldStatus,
            newStatus,
            weightKg,
            notes
        );
        pickupLogRepository.save(log);

        return updatedRequest;
    }

    @Transactional
    public PickupRequest updatePickupStatusAndWeight(PickupUpdateDTO updateDTO) {
        Optional<PickupRequest> pickupOpt = pickupRequestRepository.findById(updateDTO.getPickupId());

        if (pickupOpt.isPresent()) {
            PickupRequest pickup = pickupOpt.get();

            if (updateDTO.getStatus() != null && !updateDTO.getStatus().isEmpty()) {
                pickup.setStatus(updateDTO.getStatus());
            }
            if (updateDTO.getWeightKg() != null) {
                pickup.setWeightKg(updateDTO.getWeightKg());
            }

            return pickupRequestRepository.save(pickup);
        } else {
            throw new RuntimeException("Pickup request not found with ID: " + updateDTO.getPickupId());
        }
    }

    private boolean isValidStatus(String status) {
        return status.equals("PENDING") || status.equals("ASSIGNED") ||
               status.equals("COMPLETED") || status.equals("CANCELLED") ||
               status.equals("Paid - Pending Pickup");
    }

    public List<PickupLog> getPickupLogsForRequest(Long requestId) {
        return pickupLogRepository.findByPickupRequestIdOrderByTimestampDesc(requestId);
    }

    public List<PickupLog> getPickupLogsByWorker(Long workerId) {
        return pickupLogRepository.findByWorkerIdOrderByTimestampDesc(workerId);
    }

    public List<PickupRequest> getAllPickupRequests() {
        return pickupRequestRepository.findAll();
    }

    public PickupRequest getPickupRequestById(Long requestId) {
        return pickupRequestRepository.findById(requestId).orElse(null);
    }
    @Transactional
    public PickupRequest markReached(Long requestId, Long workerId) {
        PickupRequest request = getPickupRequestById(requestId);
        if (request == null) throw new RuntimeException("Pickup not found");
        if (!workerId.equals(request.getAssignedWorkerId())) throw new RuntimeException("Unauthorized");

        request.setTrackingStatus("REACHED");
        return pickupRequestRepository.save(request);
    }

    @Transactional
    public PickupRequest reschedulePickup(Long requestId, Long workerId, String newDate, String reason) {
        PickupRequest request = getPickupRequestById(requestId);
        if (request == null) throw new RuntimeException("Pickup not found");
        if (!workerId.equals(request.getAssignedWorkerId())) throw new RuntimeException("Unauthorized");

        String oldDate = request.getDate();
        request.setDate(newDate);
        request.setRescheduleReason(reason);
        request.setStatus("RESCHEDULED");
        
        Optional<Worker> worker = workerRepository.findById(workerId);
        pickupLogRepository.save(new PickupLog(request, worker.orElse(null), "ASSIGNED", "RESCHEDULED", null, "Rescheduled from " + oldDate + " to " + newDate + ". Reason: " + reason));

        return pickupRequestRepository.save(request);
    }

    @Transactional
    public PickupRequest addPickupItem(Long requestId, com.ewaste.ewaste_backend.model.PickupItem item) {
        PickupRequest request = getPickupRequestById(requestId);
        if (request == null) throw new RuntimeException("Pickup not found");
        
        request.addItem(item);
        
        // Recalculate totals
        double totalValue = request.getEstimatedValue() != null ? request.getEstimatedValue() : 0.0;
        totalValue += item.getEstimatedValue() != null ? item.getEstimatedValue() : 0.0;
        request.setEstimatedValue(totalValue);

        return pickupRequestRepository.save(request);
    }

    public List<PickupRequest> getMissedPickupsForWorker(Long workerId) {
        String today = LocalDate.now().format(DATE_FORMATTER);
        // Logic: Date < Today AND Status != COMPLETED/CANCELLED
        // Note: JPA Query derivation might be complex for string dates, using filtered stream for simplicity in prototype
        List<PickupRequest> allAssigned = pickupRequestRepository.findByAssignedWorkerIdOrderByDateAscTimeAsc(workerId);
        return allAssigned.stream()
            .filter(p -> p.getDate().compareTo(today) < 0 && !List.of("COMPLETED", "CANCELLED", "RESCHEDULED").contains(p.getStatus()))
            .collect(Collectors.toList());
    }
}
