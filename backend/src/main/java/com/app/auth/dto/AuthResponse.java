package com.app.auth.dto;

public record AuthResponse(String accessToken, String refreshToken, String username, String role) {
}
