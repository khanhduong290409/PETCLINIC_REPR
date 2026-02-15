package com.example.backend_pet.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PetResponse {
    private Long id;
    private String name;
    private String species;
    private String breed;
    private Integer age;
    private Double weight;
    private String gender;
    private String notes;
    private String imageUrl;
    private LocalDateTime createdAt;
}
