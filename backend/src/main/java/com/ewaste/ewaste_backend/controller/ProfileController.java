package com.ewaste.ewaste_backend.controller;

import com.ewaste.ewaste_backend.model.User;
import com.ewaste.ewaste_backend.repository.UserRepository;
import com.ewaste.ewaste_backend.util.TableCreator;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.Base64; // Re-added import Base64

@RestController
@RequestMapping("/api")
@CrossOrigin
public class ProfileController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private TableCreator tableCreator;

    @GetMapping("/profile/{id}")
    public User getUserProfile(@PathVariable Long id) {
        return userRepository.findById(id).orElse(null);
    }

    @PutMapping("/user/update")
    public String updateUser(@RequestBody User user) {
        Optional<User> existing = userRepository.findById(user.getId());
        if (existing.isPresent()) {
            userRepository.save(user);
            return "Profile updated successfully!";
        }
        return "User not found!";
    }

    @GetMapping("/pickups/{id}")
    public List<Map<String, Object>> getPickupHistory(@PathVariable Long id) {
        Optional<User> user = userRepository.findById(id);
        if (!user.isPresent()) {
            System.err.println("User not found for ID: " + id);
            return Collections.emptyList();
        }

        String tableName = tableCreator.getTableName(user.get().getId(), user.get().getFullname());
        System.out.println("Fetching history from table: " + tableName);

        try {
            List<Map<String, Object>> history = jdbcTemplate.queryForList("SELECT * FROM `" + tableName + "` ORDER BY date DESC, time DESC");
            System.out.println("Fetched " + history.size() + " records from " + tableName);

            // Re-added Base64 conversion because imageData in DB is byte[]
            for (Map<String, Object> record : history) {
                if (record.containsKey("image_data") && record.get("image_data") instanceof byte[]) {
                    byte[] imageData = (byte[]) record.get("image_data");
                    String base64Image = Base64.getEncoder().encodeToString(imageData);
                    record.put("image_data_base64", base64Image); // New key for the Base64 string
                    record.remove("image_data"); // Remove the raw byte[]
                }
            }
            return history;
        } catch (Exception e) {
            System.err.println("Error fetching pickup history from table " + tableName + ": " + e.getMessage());
            e.printStackTrace();
            return Collections.emptyList();
        }
    }
}
