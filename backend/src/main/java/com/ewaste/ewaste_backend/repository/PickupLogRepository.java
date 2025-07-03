package com.ewaste.ewaste_backend.repository;

import com.ewaste.ewaste_backend.model.PickupLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PickupLogRepository extends JpaRepository<PickupLog, Long> {

    List<PickupLog> findByPickupRequestIdOrderByTimestampDesc(Long pickupRequestId);

    List<PickupLog> findByWorkerIdOrderByTimestampDesc(Long workerId);
}
