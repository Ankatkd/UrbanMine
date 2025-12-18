package com.ewaste.ewaste_backend.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "employees")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String role; // e.g., Engineer, Manager

    private String department; // e.g., Operations, Tech

    private String project; // current assigned project name/id

    private String status; // Active, On Leave, Inactive

    private LocalDate dateHired;

    private Double salary;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getProject() { return project; }
    public void setProject(String project) { this.project = project; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDate getDateHired() { return dateHired; }
    public void setDateHired(LocalDate dateHired) { this.dateHired = dateHired; }

    public Double getSalary() { return salary; }
    public void setSalary(Double salary) { this.salary = salary; }
}


