package com.example.backend_pet.controller;

import com.example.backend_pet.dto.AuthResponse;
import com.example.backend_pet.dto.LoginRequest;
import com.example.backend_pet.dto.RegisterRequest;
import com.example.backend_pet.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // POST /api/auth/register - Đăng ký
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);

        // Nếu có id = đăng ký thành công
        if (response.getId() != null) {
            return ResponseEntity.ok(response);
        }
        // Nếu không có id = lỗi (email đã tồn tại)
        return ResponseEntity.badRequest().body(response);
    }

    // POST /api/auth/login - Đăng nhập
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);

        // Nếu có id = đăng nhập thành công
        if (response.getId() != null) {
            return ResponseEntity.ok(response);
        }
        // Nếu không có id = lỗi (sai email hoặc password)
        return ResponseEntity.badRequest().body(response);
    }
}
