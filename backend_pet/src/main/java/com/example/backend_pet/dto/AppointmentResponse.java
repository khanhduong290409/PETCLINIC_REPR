package com.example.backend_pet.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class AppointmentResponse {
    private Long id;
    private String bookingCode;
    private String petName;
    private String petSpecies;
    private String petImageUrl;
    private List<ServiceInfo> services;  // thay cho serviceTitle + servicePrice
    private Long doctorId;
    private String doctorName;
    private String ownerName;
    private String appointmentDate;
    private String appointmentTime;
    private String status;
    private String notes;
    private LocalDateTime createdAt;

    @Data
    @Builder
    public static class ServiceInfo {
        private Long id;
        private String title;
        private BigDecimal price;
    }
}
