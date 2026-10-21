package com.example.backend_pet.controller;

import com.example.backend_pet.config.JwtUtils;
import com.example.backend_pet.dto.AppointmentRequest;
import com.example.backend_pet.dto.AppointmentResponse;
import com.example.backend_pet.dto.SlotAvailabilityResponse;
import com.example.backend_pet.service.AppointmentNotificationService;
import com.example.backend_pet.service.AppointmentService;
import com.example.backend_pet.service.TimeSlotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final AppointmentNotificationService appointmentNotificationService;
    private final TimeSlotService timeSlotService;
    private final JwtUtils jwtUtils;

    private Long extractUserId(String authHeader) {
        String token = authHeader.substring(7);
        return jwtUtils.extractClaims(token).get("userId", Long.class);
    }

    // POST /api/appointments - Đặt lịch khám (có thể nhiều pet), userId lấy từ JWT
    @PostMapping
    public ResponseEntity<List<AppointmentResponse>> createAppointments(
            @RequestBody AppointmentRequest request,
            @RequestHeader("Authorization") String authHeader) {
        List<AppointmentResponse> created = appointmentService.createAppointments(request, extractUserId(authHeader));
        // Gửi mail ở đây (sau khi service đã commit) chứ không gửi trong service, để lịch bị rollback thì không có mail
        appointmentNotificationService.sendBookingCreatedEmail(created.get(0).getBookingCode());
        return ResponseEntity.ok(created);
    }

    // GET /api/appointments/availability?date=2026-10-10 - Tình trạng chỗ trống từng khung giờ trong ngày
    @GetMapping("/availability")
    public ResponseEntity<List<SlotAvailabilityResponse>> getAvailability(@RequestParam String date) {
        return ResponseEntity.ok(timeSlotService.getAvailability(LocalDate.parse(date)));
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
