package com.app.auth;

import com.app.auth.dto.AuthResponse;
import com.app.auth.dto.LoginRequest;
import com.app.auth.dto.RefreshRequest;
import com.app.domain.entity.User;
import com.app.exception.ResourceNotFoundException;
import com.app.repository.UserRepository;
import com.app.security.UserPrincipal;
import com.app.security.jwt.JwtService;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    public AuthResponse login(LoginRequest request) {
        // Delegates to DaoAuthenticationProvider -> CustomUserDetailsService + BCrypt
        // check.
        // Throws BadCredentialsException / DisabledException, both handled globally.
        var authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password()));

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = principal.getUser();

        String accessToken = jwtService.generateAccessToken(
                user.getId(), user.getUsername(), (List<? extends GrantedAuthority>) principal.getAuthorities());
        String refreshToken = jwtService.generateRefreshToken(user.getId(), user.getUsername());

        return new AuthResponse(accessToken, refreshToken, user.getUsername(), user.getRole().name());
    }

    public AuthResponse refresh(RefreshRequest request) {
        String token = request.refreshToken();

        if (!jwtService.isTokenValid(token) || !"refresh".equals(jwtService.extractTokenType(token))) {
            throw new JwtException("Invalid or expired refresh token");
        }

        String username = jwtService.extractUsername(token);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (!user.isActive()) {
            throw new DisabledException("This account has been deactivated");
        }

        UserPrincipal principal = new UserPrincipal(user);
        String newAccessToken = jwtService.generateAccessToken(
                user.getId(), user.getUsername(), (List<? extends GrantedAuthority>) principal.getAuthorities());
        // Rotate the refresh token too (single-use pattern reduces replay window)
        String newRefreshToken = jwtService.generateRefreshToken(user.getId(), user.getUsername());

        return new AuthResponse(newAccessToken, newRefreshToken, user.getUsername(), user.getRole().name());
    }
}