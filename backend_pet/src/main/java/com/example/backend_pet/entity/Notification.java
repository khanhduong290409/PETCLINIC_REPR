package com.example.backend_pet.entity;

import jakarta.persistence.*;
import lombok.*;

// Thông báo trong app (chuông trên Navbar) cho khách và bác sĩ
@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_notifications_recipient", columnList = "recipient_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    // Đường dẫn trang frontend mở khi bấm vào thông báo, vd "/appointments"
    private String link;

    @Column(name = "booking_code")
    private String bookingCode;

    // Bảng mới nên để NOT NULL được (ddl-auto=update tạo cả bảng, không phải thêm cột vào bảng cũ)
    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private boolean read = false;

    public enum NotificationType {
        BOOKING_CREATED, CONFIRMED, CANCELLED, COMPLETED, DOCTOR_ASSIGNED, DOCTOR_UNASSIGNED, REMINDER
    }
}
