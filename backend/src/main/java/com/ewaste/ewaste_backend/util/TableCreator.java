package com.ewaste.ewaste_backend.util;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class TableCreator {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public void createUserHistoryTable(Long userId, String fullName) {
        String tableName = getTableName(userId, fullName);

        // CHANGED: image_data VARCHAR(255) to store the file path/URL
        String sql = "CREATE TABLE IF NOT EXISTS `" + tableName + "` (" +
                "`id` BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                "`date` DATE NOT NULL, " +
                "`time` TIME NOT NULL, " +
                "`address` VARCHAR(255) NOT NULL, " +
                "`pincode` CHAR(6) NOT NULL, " +
                "`city` VARCHAR(100) NOT NULL, " +
                "`state` VARCHAR(100) NOT NULL, " +
                "`scheduler_name` VARCHAR(100) NOT NULL, " +
                "`phone` CHAR(10) NOT NULL, " +
                "`email` VARCHAR(100) NOT NULL, " +
                "`waste_type` VARCHAR(50) NOT NULL, " +
                "`status` VARCHAR(20) DEFAULT 'Pending', " +
                "`image_data` VARCHAR(255), " + // Changed to VARCHAR(255)
                "`user_id` BIGINT NOT NULL, " +
                "`created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                "FOREIGN KEY (`user_id`) REFERENCES `ewasteusers`(`id`)" +
                ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

        try {
            jdbcTemplate.execute(sql);
            System.out.println("Ensured history table exists: " + tableName);
        } catch (Exception e) {
            System.err.println("Error creating table " + tableName + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

    public String getTableName(Long userId, String fullName) {
        String sanitized = fullName.trim().replaceAll("[^a-zA-Z0-9]", "_").replaceAll("_+", "_");
        return "history_" + userId + "_" + sanitized;
    }
}
