package com.example.backend_pet.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private Long id;
    private String email;
    private String fullName;
    private String phone;
    private String role;
    private String message;
}
