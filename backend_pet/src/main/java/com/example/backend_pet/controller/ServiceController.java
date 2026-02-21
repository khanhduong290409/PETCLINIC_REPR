package com.example.backend_pet.controller;

import com.example.backend_pet.entity.PetService;
import com.example.backend_pet.repository.PetServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
public class ServiceController {

    private final PetServiceRepository petServiceRepository;

    // GET /api/services - Lấy danh sách dịch vụ
    @GetMapping
    public ResponseEntity<List<PetService>> getServices() {
        return ResponseEntity.ok(petServiceRepository.findAll());
    }
}
