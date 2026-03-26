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
    // resttemplate là 1 công cụ của spring để gọi HTTP request ra ngoài  
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
            
            //Groq API yêu cầu mảng messages có role và content:
            //role: "system" → hướng dẫn cho AI
            //role: "user" → câu hỏi thực tế của người dùng

            // Request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "llama-3.1-8b-instant");
            requestBody.put("messages", List.of(systemMsg, userMsg));

            // Headers với Bearer token
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            //HttpEntity là class của Spring, dùng để gói body + headers lại thành 1 object trước khi gửi.
            //<Map<String, Object>> → khai báo kiểu dữ liệu của body bên trong (generic)
            //(requestBody, headers) → truyền 2 tham số vào constructor của HttpEntity: tham số 1 là body, tham sô 2: headers

            ResponseEntity<Map> response = restTemplate.postForEntity(GROQ_URL, entity, Map.class);
            /*
            restTemplate.postForEntity(url, body, kiểu_trả_về) → gửi POST đến Groq, chờ response
            GROQ_URL → địa chỉ gửi đến
            entity → kiện hàng vừa đóng gói ở trên
            Map.class → báo cho Spring parse JSON response thành Map
            ResponseEntity<Map> → object chứa toàn bộ response (status code + headers + body)
             

            Groq trả về JSON như này:

            {
    "choices": [
        {
            "message": {
                "role": "assistant",
                "content": "Khám tổng quát 150.000đ ạ!"
            }
        }
    ]
}
            */
            // Parse response (OpenAI-compatible format)
            List<Map> choices = (List<Map>) response.getBody().get("choices");
            //response.getBody() → lấy phần body của response (cái JSON trên)
            //.get("choices") → lấy giá trị của key "choices" → ra một mảng
            //(List<Map>) → ép kiểu về List vì Java không tự biết đó là mảng
            Map message = (Map) choices.get(0).get("message");
            /*
            choices.get(0) → lấy phần tử đầu tiên trong mảng (Groq chỉ trả 1 phần tử)
            .get("message") → lấy object message bên trong
            (Map) → ép kiểu về Map
             */
            return (String) message.get("content");

        } catch (Exception e) {
            System.err.println("Groq API error: " + e.getMessage());
            return "Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau.";
        }
    }
}


