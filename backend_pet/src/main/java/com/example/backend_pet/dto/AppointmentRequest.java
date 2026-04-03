package com.example.backend_pet.dto;

import lombok.Data;

import java.util.List;

@Data
public class AppointmentRequest {
    private Long userId;
    private List<Long> petIds;        // Hỗ trợ đặt nhiều pet 1 lần
    private List<Long> serviceIds;  // Hỗ trợ đặt nhiều dịch vụ 1 lần
    private String appointmentDate;   // "2026-02-20"
    private String appointmentTime;   // "09:00"
    private String notes;
}
