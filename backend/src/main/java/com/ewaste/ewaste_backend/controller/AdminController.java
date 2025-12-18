package com.ewaste.ewaste_backend.controller;

import com.ewaste.ewaste_backend.model.Employee;
import com.ewaste.ewaste_backend.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAuthority('ADMIN')")
@CrossOrigin(origins = "http://localhost:3000")
public class AdminController {

    @Autowired
    private AdminService adminService;

    // Employee CRUD
    @GetMapping("/employees")
    public ResponseEntity<List<Employee>> getAllEmployees() {
        return ResponseEntity.ok(adminService.getAllEmployees());
    }

    @PostMapping("/employees")
    public ResponseEntity<Employee> createEmployee(@RequestBody Employee employee) {
        return ResponseEntity.ok(adminService.createEmployee(employee));
    }

    @PutMapping("/employees/{id}")
    public ResponseEntity<Employee> updateEmployee(@PathVariable Long id, @RequestBody Employee employee) {
        return ResponseEntity.ok(adminService.updateEmployee(id, employee));
    }

    @DeleteMapping("/employees/{id}")
    public ResponseEntity<Void> deleteEmployee(@PathVariable Long id) {
        adminService.deleteEmployee(id);
        return ResponseEntity.noContent().build();
    }

    // Analytics Summary
    @GetMapping("/analytics/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {
        return ResponseEntity.ok(adminService.buildSummaryAnalytics());
    }

    // Reports JSON
    @GetMapping("/reports/hired")
    public ResponseEntity<List<Employee>> reportHiredBetween(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(adminService.reportByDateRange(start, end));
    }

    @GetMapping("/reports/by-project")
    public ResponseEntity<List<Employee>> reportByProject(@RequestParam String project) {
        return ResponseEntity.ok(adminService.reportByProject(project));
    }

    @GetMapping("/reports/by-status")
    public ResponseEntity<List<Employee>> reportByStatus(@RequestParam String status) {
        return ResponseEntity.ok(adminService.reportByStatus(status));
    }

    // CSV export helpers
    private String toCsv(List<Employee> employees) {
        StringBuilder sb = new StringBuilder();
        sb.append("id,name,email,role,department,project,status,dateHired,salary\n");
        for (Employee e : employees) {
            sb.append(e.getId()).append(',')
              .append(escapeCsv(e.getName())).append(',')
              .append(escapeCsv(e.getEmail())).append(',')
              .append(escapeCsv(e.getRole())).append(',')
              .append(escapeCsv(e.getDepartment())).append(',')
              .append(escapeCsv(e.getProject())).append(',')
              .append(escapeCsv(e.getStatus())).append(',')
              .append(e.getDateHired() != null ? e.getDateHired() : "").append(',')
              .append(e.getSalary() != null ? e.getSalary() : "")
              .append('\n');
        }
        return sb.toString();
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        String v = value.replace("\"", "\"\"");
        if (v.contains(",") || v.contains("\n") || v.contains("\r")) {
            return "\"" + v + "\"";
        }
        return v;
    }

    private ResponseEntity<byte[]> csvResponse(String filename, List<Employee> data) {
        String csv = toCsv(data);
        byte[] bytes = csv.getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(bytes);
    }

    // CSV downloads
    @GetMapping("/reports/hired.csv")
    public ResponseEntity<byte[]> downloadHiredCsv(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return csvResponse("hired.csv", adminService.reportByDateRange(start, end));
    }

    @GetMapping("/reports/by-project.csv")
    public ResponseEntity<byte[]> downloadByProjectCsv(@RequestParam String project) {
        return csvResponse("by-project.csv", adminService.reportByProject(project));
    }

    @GetMapping("/reports/by-status.csv")
    public ResponseEntity<byte[]> downloadByStatusCsv(@RequestParam String status) {
        return csvResponse("by-status.csv", adminService.reportByStatus(status));
    }
}
