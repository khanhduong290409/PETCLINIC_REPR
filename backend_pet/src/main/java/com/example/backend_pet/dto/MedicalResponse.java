package com.example.backend_pet.dto;

import com.example.backend_pet.entity.Appointment;
import lombok.Builder;
import lombok.Data;
import lombok.ToString;

import java.time.LocalDate;

@Data
@Builder
@ToString
public class MedicalResponse {
    private Long id;
    private Long appointmentId;
    private String petName;
    private String petImageUrl;
    private String petSpecies;
    private String diagnosis;
    private String treatment;
    private String prescription;
    private String notes;
    private LocalDate followUpDate;

}
