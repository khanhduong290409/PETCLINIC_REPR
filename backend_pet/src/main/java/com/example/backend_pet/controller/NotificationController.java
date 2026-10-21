package com.example.backend_pet.controller;

import com.example.backend_pet.config.JwtUtils;
import com.example.backend_pet.dto.NotificationResponse;
import com.example.backend_pet.service.NotificationService;
import com.example.backend_pet.service.NotificationStreamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

// Thông báo trong app của người đang đăng nhập (khách / bác sĩ) — userId luôn lấy từ JWT
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationStreamService notificationStreamService;
    private final JwtUtils jwtUtils;

    private Long extractUserId(String authHeader) {
        String token = authHeader.substring(7);
        return jwtUtils.extractClaims(token).get("userId", Long.class);
    }

    // GET /api/notifications - 30 thông báo mới nhất
    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications(
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(notificationService.getLatest(extractUserId(authHeader)));
    }

    // GET /api/notifications/unread-count - Số thông báo chưa đọc (badge trên chuông)
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @RequestHeader("Authorization") String authHeader) {
        long count = notificationService.countUnread(extractUserId(authHeader));
        return ResponseEntity.ok(Map.of("count", count));
    }

    // PUT /api/notifications/5/read - Đánh dấu 1 thông báo đã đọc
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markRead(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        notificationService.markRead(id, extractUserId(authHeader));
        return ResponseEntity.ok().build();
    }

    // PUT /api/notifications/read-all - Đánh dấu tất cả đã đọc
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllRead(@RequestHeader("Authorization") String authHeader) {
        notificationService.markAllRead(extractUserId(authHeader));
        return ResponseEntity.ok().build();
    }

    // GET /api/notifications/stream - Kết nối SSE giữ mở để nhận thông báo realtime
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@RequestHeader("Authorization") String authHeader) {
        return notificationStreamService.subscribe(extractUserId(authHeader));
    }
}
