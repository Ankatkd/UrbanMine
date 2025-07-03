package com.ewaste.ewaste_backend.repository;

import com.ewaste.ewaste_backend.model.Worker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkerRepository extends JpaRepository<Worker, Long> {

    Optional<Worker> findByUsername(String username);

    // NEW METHOD: Find worker by email
    Optional<Worker> findByEmail(String email);

    // NEW METHOD: Find worker by ID
    Optional<Worker> findById(Long id);

    List<Worker> findByCityAndPincode(String city, String pincode);
    List<Worker> findByCity(String city);
    List<Worker> findByPincode(String pincode);
}
