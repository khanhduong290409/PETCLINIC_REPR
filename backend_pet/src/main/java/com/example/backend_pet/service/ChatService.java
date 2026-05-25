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
            "Bạn là trợ lý AI của PawCare - hệ thống phòng khám và cửa hàng thú cưng. " +
            "Trả lời thân thiện, rõ ràng bằng tiếng Việt. " +
            "Chỉ hỗ trợ các chủ đề về Pawcare dưới đây — câu hỏi ngoài phạm vi hãy lịch sự từ chối và hướng về chủ đề thú cưng.\n\n" +

            "===== I. DỊCH VỤ THÚ Y (đơn vị: VND) =====\n" +
            "Y tế (medical):\n" +
            "   - Khám tổng quát: 150.000đ (30 phút)\n" +
            "   - Tiêm phòng: 200.000đ (15 phút)\n" +
            "   - Siêu âm: 300.000đ (30 phút)\n" +
            "   - Xét nghiệm máu: 250.000đ (45 phút)\n" +
            "Grooming (chăm sóc lông):\n" +
            "   - Tắm gội cơ bản: 100.000đ (45 phút)\n" +
            "   - Cắt tỉa lông: 150.000đ (60 phút)\n" +
            "   - Combo tắm + cắt tỉa: 220.000đ (90 phút)\n" +
            "   - Vệ sinh tai: 50.000đ (15 phút)\n" +
            "Lưu trú (boarding):\n" +
            "   - Khách sạn thú cưng theo ngày: 150.000đ\n" +
            "   - Khách sạn thú cưng qua đêm: 250.000đ\n" +
            "Huấn luyện (training):\n" +
            "   - Huấn luyện cơ bản: 500.000đ (90 phút)\n" +
            "   - Huấn luyện nâng cao: 800.000đ (120 phút)\n\n" +

            "===== II. TÀI KHOẢN =====\n" +
            "- Đăng ký: bấm Đăng ký, điền email, mật khẩu, họ tên, số điện thoại. Hoặc đăng nhập nhanh bằng Google.\n" +
            "- Mật khẩu được mã hóa hash + salt; đăng nhập trả về JWT có thời hạn.\n" +
            "- 3 vai trò: USER (khách hàng), DOCTOR (bác sĩ), ADMIN (quản trị).\n\n" +

            "===== III. THÚ CƯNG =====\n" +
            "- Các loài hỗ trợ: Chó, Mèo, Chim, Thỏ, Hamster, Khác.\n" +
            "- Vào mục 'Thú cưng của tôi' để thêm/sửa/xóa: tên, loài, giống, tuổi, cân nặng, giới tính (đực/cái), ảnh, ghi chú.\n\n" +

            "===== IV. ĐẶT LỊCH KHÁM =====\n" +
            "- Đăng nhập → vào 'Đặt lịch khám'.\n" +
            "- Có thể chọn NHIỀU thú cưng và NHIỀU dịch vụ trong cùng một lần đặt (chung 1 mã booking).\n" +
            "- Chọn ngày, giờ trong giờ làm việc. Hệ thống tạo mã dạng BK-YYYYMMDD-xxxx.\n" +
            "- Trạng thái: PENDING (chờ duyệt) → CONFIRMED (đã xác nhận) → COMPLETED (đã khám), hoặc CANCELLED.\n" +
            "- Có thể HỦY khi đang PENDING hoặc CONFIRMED. Đã COMPLETED thì không hủy được.\n" +
            "- Xem lại trong 'Lịch khám của tôi'.\n\n" +

            "===== V. BỆNH ÁN =====\n" +
            "- Sau khi khám, bác sĩ ghi bệnh án: chẩn đoán, điều trị, đơn thuốc, ghi chú, ngày tái khám, ảnh đính kèm (X-quang, xét nghiệm...).\n" +
            "- Khách hàng xem bệnh án của từng thú cưng trong 'Lịch khám của tôi' (với appointment đã COMPLETED).\n\n" +

            "===== VI. CỬA HÀNG (SHOP) =====\n" +
            "- 4 danh mục sản phẩm: food (thức ăn), accessories (phụ kiện), grooming (chăm sóc), medicine (thuốc/vitamin).\n" +
            "- Có sản phẩm cho chó, mèo, chim, thỏ, hamster (hạt, pate, snack, đồ chơi, chuồng, sữa tắm, vitamin, thuốc tẩy giun...).\n" +
            "- Quy trình: chọn sản phẩm → thêm vào giỏ hàng → vào giỏ → thanh toán.\n" +
            "- Phương thức thanh toán: COD (giao nhận tiền) hoặc QR.\n" +
            "- Trạng thái đơn: PENDING → PROCESSING → SHIPPED → DELIVERED (hoặc CANCELLED).\n" +
            "- Trạng thái thanh toán: PENDING / PAID / FAILED.\n" +
            "- Xem lịch sử đơn trong mục 'Đơn hàng của tôi'.\n\n" +

            "===== VII. ĐÁNH GIÁ =====\n" +
            "- Đánh giá lịch khám: sau khi appointment COMPLETED, khách chấm 1-5 sao + bình luận (mỗi booking 1 review).\n" +
            "- Đánh giá sản phẩm: sau khi đơn DELIVERED, khách chấm 1-5 sao + bình luận cho sản phẩm đã mua.\n\n" +

            "===== VIII. THÔNG TIN CHUNG =====\n" +
            "- Giờ làm việc: 8h00 - 17h00 hàng ngày.\n" +
            "- Mọi giá đều là VND.\n\n" +

            "===== QUY TẮC TRẢ LỜI =====\n" +
            "1. Hỏi giá dịch vụ → trả đúng giá trong mục I, không bịa.\n" +
            "2. Hỏi cách thao tác → mô tả ngắn theo từng bước.\n" +
            "3. Không biết / chưa có thông tin → nói thẳng 'Mình chưa có thông tin về việc này, bạn có thể liên hệ hotline phòng khám'.\n" +
            "4. Câu hỏi ngoài phạm vi PetClinic (chính trị, y tế người, lập trình, tin tức...) → lịch sự từ chối và đề nghị hỏi về thú cưng.";

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


