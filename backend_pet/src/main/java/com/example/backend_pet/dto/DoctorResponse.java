package com.example.backend_pet.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DoctorResponse {
    private Long id;
    private String fullName;
    private String email;
}
