package com.ewaste.ewaste_backend.dto;

public class LoginResponse {

    public String message;
    public Long userId;
    public String token;
    public String role;

    public LoginResponse(String message, Long userId, String token, String role) {
        this.message = message;
        this.userId = userId;
        this.token = token;
        this.role = role;
    }

    public String getMessage() {
        return message;
    }

    public Long getUserId() {
        return userId;
    }

    public String getToken() {
        return token;
    }

    public String getRole() {
        return role;
    }
}
