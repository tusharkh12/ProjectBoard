package com.projectboard.service;

import com.projectboard.dto.LoginRequest;
import com.projectboard.dto.LoginResponse;
import com.projectboard.entity.User;
import com.projectboard.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;

/**
 * Authentication Service
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        log.info("Login attempt for username: {}", request.getUsername());

        User user = userService.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));

        if (!user.getEnabled()) {
            throw new IllegalArgumentException("User account is disabled");
        }

        if (!userService.validatePassword(request.getPassword(), user.getPassword())) {
            log.warn("Invalid password attempt for username: {}", request.getUsername());
            throw new IllegalArgumentException("Invalid username or password");
        }

        String token = jwtUtil.generateToken(user.getUsername());
        Date expiryDate = new Date(System.currentTimeMillis() + jwtUtil.getExpiration());

        log.info("Login successful for username: {}", request.getUsername());

        return LoginResponse.builder()
                .token(token)
                .username(user.getUsername())
                .expiresAt(LocalDateTime.ofInstant(expiryDate.toInstant(), ZoneId.systemDefault()))
                .type("Bearer")
                .build();
    }
}

