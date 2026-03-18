package com.example.backend_pet.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class ChatService {

    @Value("${groq.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

    private static final String SYSTEM_PROMPT =
            "Bạn là trợ lý AI của PetClinic - phòng khám thú cưng. " +
            "Nhiệm vụ của bạn là hỗ trợ khách hàng về các vấn đề sau:\n" +
            "1. DỊCH VỤ VÀ GIÁ:\n" +
            "   - Khám tổng quát: 150.000đ / lượt\n" +
            "   - Tiêm phòng: 200.000đ / mũi\n" +
            "   - Tư vấn dinh dưỡng: 100.000đ / lần\n" +
            "   - Grooming (tắm, cắt lông): 250.000đ / lần\n" +
            "2. HƯỚNG DẪN ĐĂNG KÝ TÀI KHOẢN:\n" +
            "   - Vào trang web, bấm Đăng ký\n" +
            "   - Điền email, mật khẩu, họ tên, số điện thoại\n" +
            "   - Hoặc đăng nhập nhanh bằng Google\n" +
            "3. HƯỚNG DẪN ĐẶT LỊCH KHÁM:\n" +
            "   - Đăng nhập tài khoản\n" +
            "   - Thêm thú cưng vào mục Thú cưng của tôi\n" +
            "   - Vào Đặt lịch khám, chọn dịch vụ, chọn thú cưng, chọn ngày giờ\n" +
            "   - Có thể đặt nhiều thú cưng trong 1 lần đặt\n" +
            "4. THÔNG TIN KHÁC:\n" +
            "   - Giờ làm việc: 8h00 - 17h00 hàng ngày\n" +
            "   - Xem lịch sử đặt khám trong mục Lịch khám của tôi\n" +
            "   - Có thể hủy lịch khi trạng thái còn PENDING hoặc CONFIRMED\n" +
            "Trả lời ngắn gọn, thân thiện bằng tiếng Việt. " +
            "Nếu câu hỏi không liên quan đến PetClinic, hãy lịch sự từ chối và hướng về đúng chủ đề.";

    public String chat(String userMessage) {
        try {
            // Messages array: system + user
            Map<String, String> systemMsg = new HashMap<>();
            systemMsg.put("role", "system");
            systemMsg.put("content", SYSTEM_PROMPT);

            Map<String, String> userMsg = new HashMap<>();
            userMsg.put("role", "user");
            userMsg.put("content", userMessage);

            // Request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "llama-3.1-8b-instant");
            requestBody.put("messages", List.of(systemMsg, userMsg));

            // Headers với Bearer token
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(GROQ_URL, entity, Map.class);

            // Parse response (OpenAI-compatible format)
            List<Map> choices = (List<Map>) response.getBody().get("choices");
            Map message = (Map) choices.get(0).get("message");
            return (String) message.get("content");

        } catch (Exception e) {
            System.err.println("Groq API error: " + e.getMessage());
            return "Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau.";
        }
    }
}
