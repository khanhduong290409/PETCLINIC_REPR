package com.example.backend_pet.dto;

import lombok.Builder;
import lombok.Data;

// Tình trạng chỗ trống của một khung giờ trong một ngày
@Data
@Builder
public class SlotAvailabilityResponse {
    private String time;            // "09:00"
    private int bookedCount;        // số pet đã đặt (không tính lịch đã hủy)
    private int capacity;           // sức chứa thực tế: chỉnh riêng nếu có, ngược lại là mặc định
    private Integer customCapacity; // sức chứa admin chỉnh riêng, null = đang theo mặc định
    private int remaining;          // số chỗ còn lại, không âm
    private boolean disabled;       // admin khóa tay
    private boolean past;           // giờ đã qua
    private boolean available;      // còn đặt được: chưa khóa, chưa qua, còn chỗ
    private String note;            // lý do khóa (nếu có)
}
