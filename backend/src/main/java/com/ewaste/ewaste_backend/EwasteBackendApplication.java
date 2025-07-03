package com.ewaste.ewaste_backend;

import jakarta.annotation.PostConstruct; // Import PostConstruct
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.jdbc.core.JdbcTemplate; // Import JdbcTemplate

@SpringBootApplication
public class EwasteBackendApplication {

    @Autowired
    private JdbcTemplate jdbcTemplate; // Inject JdbcTemplate

    public static void main(String[] args) {
        SpringApplication.run(EwasteBackendApplication.class, args);
    }

    /**
     * This method runs after the application context has been initialized.
     * It checks if the 'workers' table exists and creates it if not.
     */
    @PostConstruct
    public void createWorkerTableIfNotExist() {
        // SQL statement to create the workers table if it doesn't exist
        String createTableSql = "CREATE TABLE IF NOT EXISTS `workers` (" +
                                "`id` BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                                "`username` VARCHAR(255) NOT NULL UNIQUE, " +
                                "`password` VARCHAR(255) NOT NULL, " +
                                "`fullname` VARCHAR(255), " +
                                "`phone` VARCHAR(20), " +
                                "`email` VARCHAR(255), " +
                                "`location` VARCHAR(255)" +
                                ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
        try {
            jdbcTemplate.execute(createTableSql);
            System.out.println("Ensured 'workers' table exists.");
        } catch (Exception e) {
            System.err.println("Error creating 'workers' table: " + e.getMessage());
            e.printStackTrace();
        }
    }
}