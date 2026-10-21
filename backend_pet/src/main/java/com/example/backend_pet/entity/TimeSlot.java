package com.example.backend_pet.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

// Một khung giờ của một ngày cụ thể.
// Dòng này chỉ được tạo khi có người đặt hoặc admin chỉnh slot đó,
// và còn đóng vai trò "ổ khóa" để hai request đặt cùng lúc phải xếp hàng.
// Số lịch đã đặt KHÔNG lưu ở đây mà đếm trực tiếp từ bảng appointments.
@Entity
@Table(
    name = "time_slots",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_time_slots_date_time",
        columnNames = {"slot_date", "slot_time"}
    )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeSlot extends BaseEntity {

    @Column(name = "slot_date", nullable = false)
    private LocalDate slotDate;

    @Column(name = "slot_time", nullable = false)
    private LocalTime slotTime;

    // null = dùng sức chứa mặc định trong clinic_settings
    private Integer capacity;

    @Column(nullable = false)
    @Builder.Default
    private Boolean disabled = false;

    // Lý do khóa hoặc chỉnh riêng, ví dụ "Bác sĩ nghỉ"
    private String note;
}
