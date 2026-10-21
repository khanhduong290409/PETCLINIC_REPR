package com.example.backend_pet.dto;

import lombok.Data;

// Admin chỉnh riêng một khung giờ
@Data
public class TimeSlotUpdateRequest {
    private String date;        // "2026-10-10"
    private String time;        // "09:00"
    private Integer capacity;   // null = quay về sức chứa mặc định
    private Boolean disabled;
    private String note;
}
