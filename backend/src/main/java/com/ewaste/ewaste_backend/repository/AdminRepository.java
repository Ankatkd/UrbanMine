package com.ewaste.ewaste_backend.repository;

import com.ewaste.ewaste_backend.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface AdminRepository extends JpaRepository<Employee, Long> {
    boolean existsByEmail(String email);

    List<Employee> findByProject(String project);

    List<Employee> findByStatus(String status);

    @Query("SELECT e FROM Employee e WHERE e.dateHired BETWEEN :start AND :end")
    List<Employee> findHiredBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);
}


