package com.example.backend_pet.controller;

import com.example.backend_pet.config.JwtUtils;
import com.example.backend_pet.dto.AppointmentRequest;
import com.example.backend_pet.dto.AppointmentResponse;
import com.example.backend_pet.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final JwtUtils jwtUtils;

    private Long extractUserId(String authHeader) {
        String token = authHeader.substring(7);
        return jwtUtils.extractClaims(token).get("userId", Long.class);
    }

    // POST /api/appointments - Đặt lịch khám (có thể nhiều pet)
    @PostMapping
    public ResponseEntity<List<AppointmentResponse>> createAppointments(@RequestBody AppointmentRequest request) {
        return ResponseEntity.ok(appointmentService.createAppointments(request));
    }

    // GET /api/appointments - Lấy danh sách lịch khám của user (userId lấy từ JWT)
    @GetMapping
    public ResponseEntity<List<AppointmentResponse>> getAppointments(
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(appointmentService.getAppointmentsByUser(extractUserId(authHeader)));
    }

    // PUT /api/appointments/1/cancel - Hủy lịch khám (userId lấy từ JWT)
    @PutMapping("/{appointmentId}/cancel")
    public ResponseEntity<List<AppointmentResponse>> cancelAppointment(
            @PathVariable Long appointmentId,
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(appointmentService.cancelAppointment(appointmentId, extractUserId(authHeader)));
    }
}
