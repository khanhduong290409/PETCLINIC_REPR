package com.example.backend_pet.controller;

import com.example.backend_pet.dto.PetRequest;
import com.example.backend_pet.dto.PetResponse;
import com.example.backend_pet.service.PetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pets")
@RequiredArgsConstructor
public class PetController {

    private final PetService petService;

    // GET /api/pets?userId=1 - Lấy danh sách pet của user
    @GetMapping
    public ResponseEntity<List<PetResponse>> getPets(@RequestParam Long userId) {
        return ResponseEntity.ok(petService.getPetsByUser(userId));
    }

    // GET /api/pets/1?userId=1 - Lấy chi tiết 1 pet
    @GetMapping("/{petId}")
    public ResponseEntity<PetResponse> getPetById(
            @PathVariable Long petId,
            @RequestParam Long userId) {
        return ResponseEntity.ok(petService.getPetById(petId, userId));
    }

    // POST /api/pets - Thêm pet mới
    @PostMapping
    public ResponseEntity<PetResponse> createPet(@RequestBody PetRequest request) {
        return ResponseEntity.ok(petService.createPet(request));
    }

    // PUT /api/pets/1 - Sửa pet
    @PutMapping("/{petId}")
    public ResponseEntity<PetResponse> updatePet(
            @PathVariable Long petId,
            @RequestBody PetRequest request) {
        return ResponseEntity.ok(petService.updatePet(petId, request));
    }

    // DELETE /api/pets/1?userId=1 - Xóa pet
    @DeleteMapping("/{petId}")
    public ResponseEntity<Void> deletePet(
            @PathVariable Long petId,
            @RequestParam Long userId) {
        petService.deletePet(petId, userId);
        return ResponseEntity.ok().build();
    }
}
