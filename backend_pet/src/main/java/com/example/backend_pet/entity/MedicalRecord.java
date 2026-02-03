package com.example.backend_pet.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "medical_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicalRecord extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false, unique = true)
    private Appointment appointment;

    @Column(columnDefinition = "TEXT")
    private String diagnosis; // Chẩn đoán

    @Column(columnDefinition = "TEXT")
    private String treatment; // Điều trị

    @Column(columnDefinition = "TEXT")
    private String prescription; // Đơn thuốc

    @Column(columnDefinition = "TEXT")
    private String notes; // Ghi chú của bác sĩ

    @Column(name = "follow_up_date")
    private LocalDate followUpDate; // Ngày tái khám
}
