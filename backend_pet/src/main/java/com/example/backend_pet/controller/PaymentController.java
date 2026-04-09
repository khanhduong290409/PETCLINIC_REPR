package com.example.backend_pet.controller;

import com.example.backend_pet.dto.PaymentLinkResponse;
import com.example.backend_pet.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    // ──────────────────────────────────────────────────────────────
    // POST /api/payment/create
    // Body: { "orderId": 1 }
    // Trả về: { qrCode, orderCode, ... }
    // ──────────────────────────────────────────────────────────────
    @PostMapping("/create")
    public ResponseEntity<PaymentLinkResponse> createPayment(@RequestBody Map<String, Long> body) {
        Long orderId = body.get("orderId");
        if (orderId == null) {
            return ResponseEntity.badRequest().build();
        }
        PaymentLinkResponse response = paymentService.createPaymentLink(orderId);
        return ResponseEntity.ok(response);
    }

    // ──────────────────────────────────────────────────────────────
    // GET /api/payment/status/{orderId}
    // Frontend polling mỗi 4 giây để kiểm tra đã thanh toán chưa
    // Trả về: { "status": "PENDING" | "PAID" | "FAILED" }
    // ──────────────────────────────────────────────────────────────
    @GetMapping("/status/{orderId}")
    public ResponseEntity<Map<String, String>> checkStatus(@PathVariable long orderId) {
        String status = paymentService.checkPaymentStatus(orderId);
        return ResponseEntity.ok(Map.of("status", status));
    }
                            
    //giải thích bên dưới   
    @PostMapping("/webhook")
    public ResponseEntity<Map<String, Object>> handleWebhook(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody Map<String, Object> data) {

        // Verify API key từ SePay
        if (!paymentService.verifyWebhookApiKey(authorization)) {
            return ResponseEntity.status(401)
                    .body(Map.of("success", false, "message", "Unauthorized"));
        }

        // Xử lý giao dịch — match với đơn hàng và cập nhật trạng thái
        paymentService.processWebhookTransaction(data);

        // SePay yêu cầu trả về {"success": true} với HTTP 200
        return ResponseEntity.ok(Map.of("success", true));
    }
}
// ──────────────────────────────────────────────────────────────
/**
 sau khi đăng ký webhook trên sepay, sepay sẽ đọc các giao dịch có format
 Để SePay có thể nhận thông báo biến động số dư từ giao dịch của VietinBank, bắt buộc mọi giao dịch có nội dung thanh toán đều phải bắt đầu bằng từ khóa SEVQR. Ví dụ: SEVQR Chuyen tien

 sau khi sepay check thấy giao dịch có format trên thì gọi webhook đến endpoint mình đã đăng ký với json như sau(ví dụ): 
 {
    "id": 92704,                              // ID giao dịch trên SePay
    "gateway":"Vietcombank",                  // Brand name của ngân hàng
    "transactionDate":"2023-03-25 14:02:37",  // Thời gian xảy ra giao dịch phía ngân hàng
    "accountNumber":"0123499999",              // Số tài khoản ngân hàng
    "code":null,                               // Mã code thanh toán (sepay tự nhận diện dựa vào cấu hình tại Công ty -> Cấu hình chung)
    "content":"chuyen tien mua iphone",        // Nội dung chuyển khoản
    "transferType":"in",                       // Loại giao dịch. in là tiền vào, out là tiền ra
    "transferAmount":2277000,                  // Số tiền giao dịch
    "accumulated":19077000,                    // Số dư tài khoản (lũy kế)
    "subAccount":null,                         // Tài khoản ngân hàng phụ (tài khoản định danh),
    "referenceCode":"MBVCB.3278907687",         // Mã tham chiếu của tin nhắn sms
    "description":""                           // Toàn bộ nội dung tin nhắn sms
}
Với chứng thực là API Key, SePay sẽ gửi với header là "Authorization":"Apikey API_KEY_CUA_BAN"
có trong tài liệu sepay: https://docs.sepay.vn/tich-hop-webhooks.html


Nếu không có required = false:
// Spring mặc định required = true
@RequestHeader("Authorization") String authorization
// → Không có header này → Spring tự động throw exception 400 Bad Request
// → Code bên dưới không chạy được

Có required = false:
@RequestHeader(value = "Authorization", required = false) String authorization
// → Không có header → authorization = null, tiếp tục chạy bình thường
// → Code bên dưới tự xử lý null

 */
