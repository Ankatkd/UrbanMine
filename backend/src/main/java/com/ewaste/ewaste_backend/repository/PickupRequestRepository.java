package com.ewaste.ewaste_backend.repository;

import com.ewaste.ewaste_backend.model.PickupRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

@Repository
public interface PickupRequestRepository extends JpaRepository<PickupRequest, Long> {

    List<PickupRequest> findByUserId(Long userId);

    @Query("SELECT pr.date, COUNT(pr) FROM PickupRequest pr WHERE pr.date BETWEEN :startDate AND :endDate GROUP BY pr.date ORDER BY pr.date ASC")
    List<Object[]> countPickupsByDateRange(@Param("startDate") String startDate, @Param("endDate") String endDate);

    List<PickupRequest> findByAssignedWorkerIdOrderByDateAscTimeAsc(Long assignedWorkerId);

    List<PickupRequest> findByAssignedWorkerIdAndDateAndStatus(Long assignedWorkerId, String date, String status);

    List<PickupRequest> findByAssignedWorkerIdIsNullAndStatusIn(List<String> statuses);

    // NEW METHOD: Find pickup requests by status (for AdminController)
    List<PickupRequest> findByStatus(String status);
}
