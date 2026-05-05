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

    // GET /api/services
    @GetMapping
    public ResponseEntity<List<PetService>> getServices() {
        return ResponseEntity.ok(petServiceRepository.findAll());
    }

    // POST /api/services
    @PostMapping
    public ResponseEntity<PetService> createService(@RequestBody PetService body) {
        PetService saved = petServiceRepository.save(body);
        return ResponseEntity.ok(saved);
    }

    // PUT /api/services/{id}
    @PutMapping("/{id}")
    public ResponseEntity<PetService> updateService(@PathVariable Long id, @RequestBody PetService body) {
        PetService existing = petServiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found: " + id));
        existing.setTitle(body.getTitle());
        existing.setDescription(body.getDescription());
        existing.setImageUrl(body.getImageUrl());
        existing.setPrice(body.getPrice());
        existing.setDuration(body.getDuration());
        existing.setCategory(body.getCategory());
        return ResponseEntity.ok(petServiceRepository.save(existing));
    }

    // DELETE /api/services/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteService(@PathVariable Long id) {
        petServiceRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
