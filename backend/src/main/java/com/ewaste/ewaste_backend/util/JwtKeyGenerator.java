package com.ewaste.ewaste_backend.util; // Or any temporary package

import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.util.Base64;

public class JwtKeyGenerator {
    public static void main(String[] args) {
        // Generate a secure random key for HS256 algorithm (256-bit key)
        byte[] keyBytes = Keys.secretKeyFor(SignatureAlgorithm.HS256).getEncoded();
        // Base64 encode the key to make it a string suitable for properties file
        String base64Key = Base64.getEncoder().encodeToString(keyBytes);
        System.out.println("--- COPY THIS GENERATED JWT SECRET KEY ---");
        System.out.println(base64Key);
        System.out.println("----------------------------------------");
    }
}