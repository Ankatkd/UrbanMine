package com.ewaste.ewaste_backend.service;

import com.ewaste.ewaste_backend.model.PickupRequest;
import com.ewaste.ewaste_backend.model.Worker;
import com.ewaste.ewaste_backend.repository.WorkerRepository;
import com.ewaste.ewaste_backend.repository.PickupRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AutoAssignmentService {

    @Autowired
    private DistanceCalculationService distanceCalculationService;

    @Autowired
    private PickupRequestRepository pickupRequestRepository;

    @Autowired
    private WorkerRepository workerRepository;

    /**
     * Automatically assign a pickup request to the nearest available worker
     * @param pickupRequest The pickup request to assign
     * @return The assigned worker, or null if no suitable worker found
     */
    @Transactional
    public Worker autoAssignPickup(PickupRequest pickupRequest) {
        if (pickupRequest == null || pickupRequest.getPincode() == null) {
            return null;
        }

        // Get all available workers (you might want to add filters like active status, availability, etc.)
        List<Worker> availableWorkers = workerRepository.findAll();
        
        if (availableWorkers.isEmpty()) {
            return null;
        }

        // Find the nearest worker
        Worker nearestWorker = distanceCalculationService.findNearestWorker(
            pickupRequest.getPincode(), 
            availableWorkers
        );

        if (nearestWorker != null) {
            try {
                // Assign the pickup to the nearest worker directly
                pickupRequest.setAssignedWorkerId(nearestWorker.getId());
                pickupRequest.setStatus("ASSIGNED");
                pickupRequestRepository.save(pickupRequest);
                return nearestWorker;
            } catch (Exception e) {
                // Log the error and return null
                System.err.println("Failed to assign pickup to worker: " + e.getMessage());
                return null;
            }
        }

        return null;
    }

    /**
     * Automatically assign multiple pickup requests to workers
     * @param pickupRequests List of pickup requests to assign
     * @return Number of successfully assigned pickups
     */
    @Transactional
    public int autoAssignMultiplePickups(List<PickupRequest> pickupRequests) {
        int assignedCount = 0;
        
        for (PickupRequest pickupRequest : pickupRequests) {
            Worker assignedWorker = autoAssignPickup(pickupRequest);
            if (assignedWorker != null) {
                assignedCount++;
            }
        }
        
        return assignedCount;
    }

    /**
     * Find workers within a specific radius of a pickup location
     * @param pickupPincode Pincode of the pickup location
     * @param radiusKm Radius in kilometers
     * @return List of workers within the radius
     */
    public List<Worker> findNearbyWorkers(String pickupPincode, double radiusKm) {
        List<Worker> allWorkers = workerRepository.findAll();
        return distanceCalculationService.findWorkersWithinRadius(pickupPincode, allWorkers, radiusKm);
    }

    /**
     * Get assignment statistics for a worker
     * @param workerId Worker ID
     * @return Number of assigned pickups
     */
    public long getWorkerAssignmentCount(Long workerId) {
        return pickupRequestRepository.findByAssignedWorkerId(workerId).size();
    }

    /**
     * Check if a worker is available for new assignments
     * @param workerId Worker ID
     * @param maxAssignments Maximum number of assignments per worker
     * @return true if worker is available, false otherwise
     */
    public boolean isWorkerAvailable(Long workerId, int maxAssignments) {
        long currentAssignments = getWorkerAssignmentCount(workerId);
        return currentAssignments < maxAssignments;
    }

    /**
     * Smart auto-assignment that considers worker availability and load balancing
     * @param pickupRequest The pickup request to assign
     * @param maxAssignmentsPerWorker Maximum assignments per worker
     * @return The assigned worker, or null if no suitable worker found
     */
    @Transactional
    public Worker smartAutoAssignPickup(PickupRequest pickupRequest, int maxAssignmentsPerWorker) {
        if (pickupRequest == null || pickupRequest.getPincode() == null) {
            System.out.println("❌ Invalid pickup request or missing pincode");
            return null;
        }

        // Get all workers
        List<Worker> allWorkers = workerRepository.findAll();
        System.out.println("📋 Found " + allWorkers.size() + " total workers in database");
        
        if (allWorkers.isEmpty()) {
            System.out.println("❌ No workers found in database");
            return null;
        }

        // Filter available workers (not at max capacity)
        List<Worker> availableWorkers = allWorkers.stream()
            .filter(worker -> {
                boolean available = isWorkerAvailable(worker.getId(), maxAssignmentsPerWorker);
                if (!available) {
                    System.out.println("⚠️ Worker " + worker.getUsername() + " (ID: " + worker.getId() + 
                                     ", Pincode: " + worker.getPincode() + ") is at max capacity");
                }
                return available;
            })
            .toList();

        System.out.println("✅ Found " + availableWorkers.size() + " available workers");

        if (availableWorkers.isEmpty()) {
            // If no workers are available, assign to the nearest worker anyway
            System.out.println("⚠️ No available workers found, assigning to nearest worker regardless of capacity");
            availableWorkers = allWorkers;
        }

        // Find the nearest available worker
        Worker nearestWorker;
        if (pickupRequest.getLatitude() != null && pickupRequest.getLongitude() != null) {
            System.out.println("✅ Using coordinates for assignment: " + pickupRequest.getLatitude() + ", " + pickupRequest.getLongitude());
            nearestWorker = distanceCalculationService.findNearestWorker(
                pickupRequest.getLatitude(),
                pickupRequest.getLongitude(),
                availableWorkers
            );
        } else {
            System.out.println("⚠️ No coordinates found, falling back to pincode assignment: " + pickupRequest.getPincode());
            nearestWorker = distanceCalculationService.findNearestWorker(
                pickupRequest.getPincode(), 
                availableWorkers
            );
        }

        if (nearestWorker != null) {
            try {
                System.out.println("🎯 Nearest worker found: " + nearestWorker.getUsername() + 
                                 " (ID: " + nearestWorker.getId() + 
                                 ", Pincode: " + nearestWorker.getPincode() + ")");
                
                // Assign the pickup to the nearest worker directly
                pickupRequest.setAssignedWorkerId(nearestWorker.getId());
                pickupRequest.setStatus("ASSIGNED");
                pickupRequestRepository.save(pickupRequest);
                return nearestWorker;
            } catch (Exception e) {
                System.err.println("❌ Failed to assign pickup to worker: " + e.getMessage());
                e.printStackTrace();
                return null;
            }
        } else {
            System.out.println("❌ No nearest worker found");
        }

        return null;
    }
}
