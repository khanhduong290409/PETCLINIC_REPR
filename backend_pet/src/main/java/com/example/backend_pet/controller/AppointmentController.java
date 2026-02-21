package com.example.backend_pet.controller;

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

    // POST /api/appointments - Đặt lịch khám (có thể nhiều pet)
    @PostMapping
    public ResponseEntity<List<AppointmentResponse>> createAppointments(@RequestBody AppointmentRequest request) {
        return ResponseEntity.ok(appointmentService.createAppointments(request));
    }

    // GET /api/appointments?userId=1 - Lấy danh sách lịch khám của user
    @GetMapping
    public ResponseEntity<List<AppointmentResponse>> getAppointments(@RequestParam Long userId) {
        return ResponseEntity.ok(appointmentService.getAppointmentsByUser(userId));
    }

    // PUT /api/appointments/1/cancel?userId=1 - Hủy lịch khám (hủy cả nhóm cùng bookingCode)
    @PutMapping("/{appointmentId}/cancel")
    public ResponseEntity<List<AppointmentResponse>> cancelAppointment(
            @PathVariable Long appointmentId,
            @RequestParam Long userId) {
        return ResponseEntity.ok(appointmentService.cancelAppointment(appointmentId, userId));
    }
}
