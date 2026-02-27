package com.example.backend_pet.controller;

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

    // GET /api/doctor/appointments?doctorId=2
    @GetMapping("/appointments")
    public ResponseEntity<List<AppointmentResponse>> getMyAppointments(@RequestParam Long doctorId) {
        return ResponseEntity.ok(appointmentService.getAppointmentsByDoctor(doctorId));
    }

    // PUT /api/doctor/appointments/{id}/complete?doctorId=2
    @PutMapping("/appointments/{id}/complete")
    public ResponseEntity<List<AppointmentResponse>> completeAppointment(
            @PathVariable Long id,
            @RequestParam Long doctorId) {
        return ResponseEntity.ok(appointmentService.completeAppointmentGroup(id, doctorId));
    }
}
