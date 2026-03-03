package com.example.backend_pet.controller;

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

    @GetMapping("/{bookingCode}")
    public ResponseEntity<List<MedicalResponse>> getRecord(@PathVariable String bookingCode) {
        return ResponseEntity.ok(medicalService.getRecord(bookingCode));
    }
    @PostMapping("/{appointmentId}")
    public ResponseEntity<MedicalResponse> saveRecord(@PathVariable Long appointmentId, @RequestBody MedicalRequest medicalRequest) {
        return ResponseEntity.ok(medicalService.saveRecord(appointmentId, medicalRequest));
    }

}
