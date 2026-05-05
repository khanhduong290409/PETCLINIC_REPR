package com.example.backend_pet.controller;

import com.example.backend_pet.dto.AppointmentResponse;
import com.example.backend_pet.dto.DoctorResponse;
import com.example.backend_pet.dto.UserResponse;
import com.example.backend_pet.entity.User;
import com.example.backend_pet.repository.UserRepository;
import com.example.backend_pet.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AppointmentService appointmentService;
    private final UserRepository userRepository;

    // GET /api/admin/appointments - Lấy tất cả lịch khám
    @GetMapping("/appointments")
    public ResponseEntity<List<AppointmentResponse>> getAllAppointments() {
        return ResponseEntity.ok(appointmentService.getAllAppointments());
    }

    // PUT /api/admin/appointments/{id}/assign-doctor?doctorId=2
    @PutMapping("/appointments/{id}/assign-doctor")
    public ResponseEntity<List<AppointmentResponse>> assignDoctor(
            @PathVariable Long id,
            @RequestParam Long doctorId) {
        return ResponseEntity.ok(appointmentService.assignDoctor(id, doctorId));
    }

    // PUT /api/admin/appointments/{id}/unassign-doctor
    @PutMapping("/appointments/{id}/unassign-doctor")
    public ResponseEntity<List<AppointmentResponse>> unassignDoctor(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.unassignDoctor(id));
    }

    // PUT /api/admin/appointments/{id}/status?status=CONFIRMED
    @PutMapping("/appointments/{id}/status")
    public ResponseEntity<List<AppointmentResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        return ResponseEntity.ok(appointmentService.updateStatus(id, status));
    }

    // GET /api/admin/doctors - Lấy danh sách bác sĩ (để admin chọn assign)
    @GetMapping("/doctors")
    public ResponseEntity<List<DoctorResponse>> getDoctors() {
        List<DoctorResponse> doctors = userRepository.findByRole(User.Role.DOCTOR)
                .stream()
                .map(d -> new DoctorResponse(d.getId(), d.getFullName(), d.getEmail()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(doctors);
    }

    // GET /api/admin/users - Lấy tất cả người dùng
    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = userRepository.findAll()
                .stream()
                .map(u -> new UserResponse(
                        u.getId(),
                        u.getFullName(),
                        u.getEmail(),
                        u.getPhone(),
                        u.getRole().name(),
                        u.getStatus().name()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    // PUT /api/admin/users/{id}/status?status=INACTIVE
    @PutMapping("/users/{id}/status")
    public ResponseEntity<UserResponse> updateUserStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
        user.setStatus(User.Status.valueOf(status));
        userRepository.save(user);
        return ResponseEntity.ok(new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole().name(),
                user.getStatus().name()
        ));
    }

    // PUT /api/admin/users/{id}/role?role=DOCTOR
    @PutMapping("/users/{id}/role")
    public ResponseEntity<UserResponse> updateUserRole(
            @PathVariable Long id,
            @RequestParam String role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
        user.setRole(User.Role.valueOf(role));
        userRepository.save(user);
        return ResponseEntity.ok(new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole().name(),
                user.getStatus().name()
        ));
    }
}
