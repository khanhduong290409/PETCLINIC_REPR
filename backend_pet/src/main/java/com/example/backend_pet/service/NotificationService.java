package com.example.backend_pet.service;

import com.example.backend_pet.dto.NotificationResponse;
import com.example.backend_pet.entity.Notification;
import com.example.backend_pet.entity.User;
import com.example.backend_pet.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationStreamService notificationStreamService;

    // Lưu thông báo trong transaction của nghiệp vụ gọi tới (đặt lịch, đổi trạng thái...) — nghiệp vụ rollback thì
    // thông báo cũng mất theo. Chỉ đẩy realtime SAU KHI commit, để trình duyệt tải lại không bị thiếu dữ liệu.
    @Transactional
    public void create(User recipient, Notification.NotificationType type, String title, String message,
                       String link, String bookingCode) {
        Notification notification = Notification.builder()
                .recipient(recipient)
                .type(type)
                .title(title)
                .message(message)
                .link(link)
                .bookingCode(bookingCode)
                .build();
        Notification saved = notificationRepository.save(notification);

        Long recipientId = recipient.getId();
        NotificationResponse response = mapToResponse(saved);
        pushAfterCommit(recipientId, response);
    }

    public List<NotificationResponse> getLatest(Long userId) {
        List<NotificationResponse> result = new ArrayList<>();
        for (Notification notification : notificationRepository.findTop30ByRecipientIdOrderByCreatedAtDesc(userId)) {
            result.add(mapToResponse(notification));
        }
        return result;
    }

    public long countUnread(Long userId) {
        return notificationRepository.countByRecipientIdAndReadFalse(userId);
    }

    @Transactional
    public void markRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông báo"));
        if (!notification.getRecipient().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllRead(Long userId) {
        notificationRepository.markAllRead(userId);
    }

    // create() luôn chạy trong transaction (@Transactional) nên đăng ký được callback afterCommit
    private void pushAfterCommit(Long recipientId, NotificationResponse response) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                notificationStreamService.sendToUser(recipientId, response);
            }
        });
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getType().name())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .link(notification.getLink())
                .bookingCode(notification.getBookingCode())
                .read(notification.isRead())
                // @CreationTimestamp ghi theo múi giờ của JVM → quy đổi bằng đúng múi giờ đó
                .createdAt(notification.getCreatedAt().atZone(ZoneId.systemDefault()).toInstant())
                .build();
    }
}
