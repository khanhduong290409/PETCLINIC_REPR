package com.example.backend_pet.controller;

import com.example.backend_pet.config.JwtUtils;
import com.example.backend_pet.dto.AppointmentResponse;
import com.example.backend_pet.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctor")
@RequiredArgsConstructor
public class DoctorController {

    private final AppointmentService appointmentService;
    private final JwtUtils jwtUtils;

    // doctorId lấy từ JWT, không nhận từ URL — tránh xem / sửa lịch của bác sĩ khác bằng cách đổi số
    private Long extractDoctorId(String authHeader) {
        String token = authHeader.substring(7);
        return jwtUtils.extractClaims(token).get("userId", Long.class);
    }

    // GET /api/doctor/appointments - Lịch khám được phân công cho bác sĩ đang đăng nhập
    @GetMapping("/appointments")
    public ResponseEntity<List<AppointmentResponse>> getMyAppointments(
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(appointmentService.getAppointmentsByDoctor(extractDoctorId(authHeader)));
    }

    // PUT /api/doctor/appointments/{id}/complete - Xác nhận khám xong (service kiểm tra đúng bác sĩ được phân công)
    @PutMapping("/appointments/{id}/complete")
    public ResponseEntity<List<AppointmentResponse>> completeAppointment(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(appointmentService.completeAppointmentGroup(id, extractDoctorId(authHeader)));
    }
}
