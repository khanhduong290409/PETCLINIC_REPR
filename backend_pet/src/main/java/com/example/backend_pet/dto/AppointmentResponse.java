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
    private Long doctorId;            // thêm để frontend pre-select dropdown
    private String doctorName;        // null nếu chưa assign
    private String ownerName;         // thêm để admin biết ai đặt
    private String appointmentDate;
    private String appointmentTime;
    private String status;
    private String notes;
    private LocalDateTime createdAt;
}
