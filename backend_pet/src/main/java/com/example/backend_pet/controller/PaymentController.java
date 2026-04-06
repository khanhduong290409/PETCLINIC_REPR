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

    // ──────────────────────────────────────────────────────────────
    // POST /api/payment/webhook
    // SePay gọi endpoint này khi có giao dịch chuyển khoản vào
    // Header: Authorization: Apikey YOUR_API_KEY
    // ──────────────────────────────────────────────────────────────
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
