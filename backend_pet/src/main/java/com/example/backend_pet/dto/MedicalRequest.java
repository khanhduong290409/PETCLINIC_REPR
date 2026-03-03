package com.example.backend_pet.dto;

import lombok.Data;
import lombok.ToString;

import java.time.LocalDate;
@ToString
@Data
public class MedicalRequest {
    private String diagnosis;
    private String treatment;
    private String prescription;
    private String notes;
    private LocalDate followUpDate;
}
