package com.example.backend_pet.controller;

import com.example.backend_pet.config.JwtUtils;
import com.example.backend_pet.dto.MedicalRequest;
import com.example.backend_pet.dto.MedicalResponse;
import com.example.backend_pet.service.MedicalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medical")
@RequiredArgsConstructor
public class MedicalController  {
    private final MedicalService medicalService;
    private final JwtUtils jwtUtils;

    @GetMapping("/{bookingCode}")
    public ResponseEntity<List<MedicalResponse>> getRecord(@PathVariable String bookingCode) {
        return ResponseEntity.ok(medicalService.getRecord(bookingCode));
    }

    @GetMapping("/pet/{petId}")
    public ResponseEntity<List<MedicalResponse>> getRecordsByPet(@PathVariable Long petId) {
        return ResponseEntity.ok(medicalService.getRecordsByPet(petId));
    }

    // Ghi bệnh án — SecurityConfig chỉ cho role DOCTOR, service kiểm tra thêm đúng bác sĩ được phân công
    @PostMapping("/{appointmentId}")
    public ResponseEntity<MedicalResponse> saveRecord(
            @PathVariable Long appointmentId,
            @RequestBody MedicalRequest medicalRequest,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        Long doctorId = jwtUtils.extractClaims(token).get("userId", Long.class);
        return ResponseEntity.ok(medicalService.saveRecord(appointmentId, doctorId, medicalRequest));
    }

}
