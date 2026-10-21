package com.example.backend_pet.service;

import com.example.backend_pet.dto.NotificationResponse;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

// Giữ các kết nối SSE đang mở để đẩy thông báo realtime tới trình duyệt.
// Lưu trong bộ nhớ là đủ vì backend chỉ chạy 1 instance trên Render.
// Đây chỉ là "tín hiệu": dữ liệu gốc nằm trong DB, frontend kết nối lại sẽ tự tải lại danh sách.
@Service
public class NotificationStreamService {

    // Hết 30 phút thì đóng, frontend tự mở lại — tránh giữ kết nối "chết" mãi khi mạng client rớt im lặng
    private static final long EMITTER_TIMEOUT_MS = 30 * 60 * 1000L;

    // Một user có thể mở nhiều tab → nhiều emitter
    private final Map<Long, List<SseEmitter>> emittersByUserId = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long userId) {
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        // Thêm bên trong compute để không chen giữa lúc removeEmitter đang xóa key
        emittersByUserId.compute(userId, (id, emitters) -> {
            if (emitters == null) {
                emitters = new CopyOnWriteArrayList<>();
            }
            emitters.add(emitter);
            return emitters;
        });

        emitter.onCompletion(() -> removeEmitter(userId, emitter));
        // Phải complete() khi hết giờ: nếu không Spring ném AsyncRequestTimeoutException,
        // GlobalExceptionHandler lại cố trả JSON vào response text/event-stream → log lỗi rác mỗi 30 phút
        emitter.onTimeout(() -> {
            removeEmitter(userId, emitter);
            emitter.complete();
        });
        emitter.onError(error -> removeEmitter(userId, emitter));

        // Gửi ngay 1 event để trình duyệt nhận header và biết kết nối đã mở
        try {
            emitter.send(SseEmitter.event().name("connected").data("ok"));
        } catch (IOException e) {
            removeEmitter(userId, emitter);
        }
        return emitter;
    }

    public void sendToUser(Long userId, NotificationResponse notification) {
        List<SseEmitter> emitters = emittersByUserId.get(userId);
        if (emitters == null) {
            return; // user không mở trang nào — lần sau vào web sẽ tải từ DB
        }
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("notification").data(notification));
            } catch (IOException | IllegalStateException e) {
                // Tab đã đóng mà server chưa biết
                removeEmitter(userId, emitter);
            }
        }
    }

    // Proxy của Render/Vercel cắt kết nối im lặng quá lâu → gửi comment ": ping" định kỳ để giữ kết nối
    @Scheduled(fixedRate = 25000)
    public void sendHeartbeat() {
        for (Map.Entry<Long, List<SseEmitter>> entry : emittersByUserId.entrySet()) {
            Long userId = entry.getKey();
            for (SseEmitter emitter : entry.getValue()) {
                try {
                    emitter.send(SseEmitter.event().comment("ping"));
                } catch (IOException | IllegalStateException e) {
                    removeEmitter(userId, emitter);
                }
            }
        }
    }

    // Dùng computeIfPresent để "xóa emitter + xóa key khi rỗng" là 1 thao tác nguyên tử,
    // không làm mất emitter của tab khác vừa subscribe đúng lúc đó
    private void removeEmitter(Long userId, SseEmitter emitter) {
        emittersByUserId.computeIfPresent(userId, (id, emitters) -> {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                return null; // trả về null → ConcurrentHashMap xóa key
            }
            return emitters;
        });
    }
}
