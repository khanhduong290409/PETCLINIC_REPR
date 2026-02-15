package com.example.backend_pet.dto;

import lombok.Data;

@Data
public class PetRequest {
    private Long userId;
    private String name;
    private String species;   // "DOG", "CAT", "BIRD", "RABBIT", "HAMSTER", "OTHER"
    private String breed;
    private Integer age;      // tuổi tính theo tháng
    private Double weight;    // cân nặng (kg)
    private String gender;    // "MALE", "FEMALE"
    private String notes;
    private String imageUrl;
}
