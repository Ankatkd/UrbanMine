package com.ewaste.ewaste_backend.repository;

import com.ewaste.ewaste_backend.model.PickupItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PickupItemRepository extends JpaRepository<PickupItem, Long> {
    List<PickupItem> findByPickupRequestId(Long pickupRequestId);
}
