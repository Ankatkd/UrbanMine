package com.ewaste.ewaste_backend.repository;

import com.ewaste.ewaste_backend.model.Admin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AdminTableRepository extends JpaRepository<Admin, Long> {
    Optional<Admin> findByEmailId(String emailId);
}


