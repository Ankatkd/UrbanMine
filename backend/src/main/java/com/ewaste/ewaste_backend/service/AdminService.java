package com.ewaste.ewaste_backend.service;

import com.ewaste.ewaste_backend.model.Employee;
import com.ewaste.ewaste_backend.repository.AdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminService {

    @Autowired
    private AdminRepository adminRepository;

    public List<Employee> getAllEmployees() {
        return adminRepository.findAll();
    }

    public Employee createEmployee(Employee employee) {
        if (adminRepository.existsByEmail(employee.getEmail())) {
            throw new IllegalArgumentException("Employee with email already exists");
        }
        return adminRepository.save(employee);
    }

    public Employee updateEmployee(Long id, Employee update) {
        Employee existing = adminRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Employee not found"));
        existing.setName(update.getName());
        existing.setEmail(update.getEmail());
        existing.setRole(update.getRole());
        existing.setDepartment(update.getDepartment());
        existing.setProject(update.getProject());
        existing.setStatus(update.getStatus());
        existing.setDateHired(update.getDateHired());
        existing.setSalary(update.getSalary());
        return adminRepository.save(existing);
    }

    public void deleteEmployee(Long id) {
        adminRepository.deleteById(id);
    }

    public Map<String, Object> buildSummaryAnalytics() {
        List<Employee> all = adminRepository.findAll();
        long totalEmployees = all.size();
        long activeEmployees = all.stream().filter(e -> "Active".equalsIgnoreCase(e.getStatus())).count();
        long uniqueProjects = all.stream().map(Employee::getProject).filter(Objects::nonNull).filter(p -> !p.isBlank()).distinct().count();
        Map<String, Long> byDepartment = all.stream()
                .collect(Collectors.groupingBy(e -> Optional.ofNullable(e.getDepartment()).orElse("Unknown"), Collectors.counting()));

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalEmployees", totalEmployees);
        summary.put("activeEmployees", activeEmployees);
        summary.put("activeProjects", uniqueProjects);
        summary.put("employeesByDepartment", byDepartment);
        return summary;
    }

    public List<Employee> reportByDateRange(LocalDate start, LocalDate end) {
        return adminRepository.findHiredBetween(start, end);
    }

    public List<Employee> reportByProject(String project) {
        return adminRepository.findByProject(project);
    }

    public List<Employee> reportByStatus(String status) {
        return adminRepository.findByStatus(status);
    }
}


