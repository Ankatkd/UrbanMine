package com.ewaste.ewaste_backend.repository;

import com.ewaste.ewaste_backend.model.UserProfileData;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserProfileDataRepository extends JpaRepository<UserProfileData, Long> {
    List<UserProfileData> findByUserId(Long userId);
}
