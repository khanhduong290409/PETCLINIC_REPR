package com.example.backend_pet.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class NotificationResponse {
    private Long id;
    private String type;
    private String title;
    private String message;
    private String link;
    private String bookingCode;
    private boolean read;
    // Instant (JSON có hậu tố "Z") thay vì LocalDateTime: server Render chạy giờ UTC còn máy dev giờ VN,
    // LocalDateTime không kèm múi giờ nên trình duyệt sẽ hiểu sai lệch 7 tiếng
    private Instant createdAt;
}
