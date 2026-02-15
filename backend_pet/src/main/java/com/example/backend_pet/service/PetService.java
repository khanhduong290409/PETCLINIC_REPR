package com.example.backend_pet.service;

import com.example.backend_pet.dto.PetRequest;
import com.example.backend_pet.dto.PetResponse;
import com.example.backend_pet.entity.Pet;
import com.example.backend_pet.entity.User;
import com.example.backend_pet.repository.PetRepository;
import com.example.backend_pet.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PetService {

    private final PetRepository petRepository;
    private final UserRepository userRepository;

    // Ảnh mặc định theo loài
    private static final Map<String, String> DEFAULT_IMAGES = Map.of(
            "DOG", "/assets/default-dog.svg",
            "CAT", "/assets/default-cat.svg",
            "BIRD", "/assets/default-bird.svg",
            "RABBIT", "/assets/default-rabbit.svg",
            "HAMSTER", "/assets/default-hamster.svg",
            "OTHER", "/assets/default-pet.svg"
    );

    // Lấy danh sách pet của user
    public List<PetResponse> getPetsByUser(Long userId) {
        List<Pet> pets = petRepository.findByOwnerId(userId);
        return pets.stream()
                .sorted(Comparator.comparing(Pet::getId))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Lấy chi tiết 1 pet
    public PetResponse getPetById(Long petId, Long userId) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new RuntimeException("Pet not found"));

        if (!pet.getOwner().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        return mapToResponse(pet);
    }

    // Thêm pet mới
    @Transactional
    public PetResponse createPet(PetRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Nếu không upload ảnh → dùng ảnh mặc định theo loài
        String imageUrl = request.getImageUrl();
        if (imageUrl == null || imageUrl.isBlank()) {
            imageUrl = DEFAULT_IMAGES.getOrDefault(request.getSpecies(), "/assets/default-pet.svg");
        }

        Pet pet = Pet.builder()
                .owner(user)
                .name(request.getName())
                .species(Pet.Species.valueOf(request.getSpecies()))
                .breed(request.getBreed())
                .age(request.getAge())
                .weight(request.getWeight())
                .gender(request.getGender() != null ? Pet.Gender.valueOf(request.getGender()) : null)
                .notes(request.getNotes())
                .imageUrl(imageUrl)
                .build();

        Pet savedPet = petRepository.save(pet);
        return mapToResponse(savedPet);
    }

    // Sửa pet
    @Transactional
    public PetResponse updatePet(Long petId, PetRequest request) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new RuntimeException("Pet not found"));

        if (!pet.getOwner().getId().equals(request.getUserId())) {
            throw new RuntimeException("Unauthorized");
        }

        pet.setName(request.getName());
        pet.setSpecies(Pet.Species.valueOf(request.getSpecies()));
        pet.setBreed(request.getBreed());
        pet.setAge(request.getAge());
        pet.setWeight(request.getWeight());
        pet.setGender(request.getGender() != null ? Pet.Gender.valueOf(request.getGender()) : null);
        pet.setNotes(request.getNotes());

        // Cập nhật ảnh nếu có gửi lên, nếu không giữ ảnh cũ
        if (request.getImageUrl() != null && !request.getImageUrl().isBlank()) {
            pet.setImageUrl(request.getImageUrl());
        }

        Pet savedPet = petRepository.save(pet);
        return mapToResponse(savedPet);
    }

    // Xóa pet
    @Transactional
    public void deletePet(Long petId, Long userId) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new RuntimeException("Pet not found"));

        if (!pet.getOwner().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        petRepository.delete(pet);
    }

    // Map entity sang DTO
    private PetResponse mapToResponse(Pet pet) {
        return PetResponse.builder()
                .id(pet.getId())
                .name(pet.getName())
                .species(pet.getSpecies().name())
                .breed(pet.getBreed())
                .age(pet.getAge())
                .weight(pet.getWeight())
                .gender(pet.getGender() != null ? pet.getGender().name() : null)
                .notes(pet.getNotes())
                .imageUrl(pet.getImageUrl())
                .createdAt(pet.getCreatedAt())
                .build();
    }
}
