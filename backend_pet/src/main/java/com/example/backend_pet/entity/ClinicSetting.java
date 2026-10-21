package com.example.backend_pet.entity;

import jakarta.persistence.*;
import lombok.*;

// Cấu hình chung của phòng khám — bảng chỉ có 1 dòng
@Entity
@Table(name = "clinic_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClinicSetting extends BaseEntity {

    // Số pet tối đa mỗi khung giờ, áp cho mọi slot chưa được chỉnh riêng
    @Column(name = "default_slot_capacity", nullable = false)
    private Integer defaultSlotCapacity;
}
