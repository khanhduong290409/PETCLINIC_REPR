package com.example.backend_pet.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDate;
@ToString
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalRequest {
    private String diagnosis;
    private String treatment;
    private String prescription;
    private String notes;
    private LocalDate followUpDate;
}
