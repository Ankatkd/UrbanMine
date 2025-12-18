package com.ewaste.ewaste_backend.config;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class bycrypt {

    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String rawPassword = "admin123";
        String encodedPassword = encoder.encode(rawPassword);
        System.out.println("Raw password: " + rawPassword);
        System.out.println("Encoded password: " + encodedPassword);
    }
}
