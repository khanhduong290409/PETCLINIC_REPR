package com.example.backend_pet.dto;

import lombok.Data;

// Admin khóa / mở khóa toàn bộ khung giờ của một ngày
@Data
public class DayLockRequest {
    private String date;        // "2026-10-10"
    private Boolean disabled;   // true = khóa cả ngày, false = mở lại
    private String note;        // ví dụ "Nghỉ lễ"
}
