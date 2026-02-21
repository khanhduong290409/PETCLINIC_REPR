package com.example.backend_pet.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class AppointmentResponse {
    private Long id;
    private String bookingCode;
    private String petName;
    private String petSpecies;
    private String petImageUrl;
    private String serviceTitle;
    private BigDecimal servicePrice;
    private String doctorName;        // null nếu chưa assign
    private String appointmentDate;
    private String appointmentTime;
    private String status;
    private String notes;
    private LocalDateTime createdAt;
}
