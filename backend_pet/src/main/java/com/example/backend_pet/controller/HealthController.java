package com.example.backend_pet.controller;

import com.example.backend_pet.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class HealthController {

    private final UserRepository userRepository;

    // GET /api/health - ping giữ Render và Neon DB cùng sống
    @GetMapping("/api/health")
    public ResponseEntity<Map<String, String>> health() {
        userRepository.count();
        return ResponseEntity.ok(Map.of("status", "ok"));
    }
}
