package com.example.backend_pet.service;

import com.example.backend_pet.dto.PaymentLinkResponse;
import com.example.backend_pet.entity.Order;
import com.example.backend_pet.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaymentService {

    @Value("${sepay.api-key}")
    private String apiKey;

    @Value("${sepay.account-number}")
    private String accountNumber;

    @Value("${sepay.account-name}")
    private String accountName;

    @Value("${sepay.bank-code}")
    private String bankCode;

    private final OrderRepository orderRepository;

    // ──────────────────────────────────────────────────────────────
    // Tạo QR VietQR cho đơn hàng
    // Không cần gọi API SePay — dùng VietQR public API để tạo ảnh QR
    // User quét QR → chuyển khoản với nội dung = orderNumber
    // SePay detect giao dịch → gọi webhook về server
    // ──────────────────────────────────────────────────────────────
    public PaymentLinkResponse createPaymentLink(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        int amount = order.getTotalAmount().intValue();
        // Vietinbank yêu cầu nội dung phải bắt đầu bằng SEVQR thì SePay mới detect được
        String content = "SEVQR " + order.getOrderNumber();

        // Tạo URL ảnh QR từ VietQR (free, không cần đăng ký)
        // Format: https://img.vietqr.io/image/{bankCode}-{accountNumber}-{template}.png
        String encodedContent = URLEncoder.encode(content, StandardCharsets.UTF_8);
        String encodedName = URLEncoder.encode(accountName, StandardCharsets.UTF_8);
        String qrUrl = String.format(
                "https://img.vietqr.io/image/%s-%s-compact2.png?amount=%d&addInfo=%s&accountName=%s",
                bankCode, accountNumber, amount, encodedContent, encodedName
        );
        //    // VD: https://img.vietqr.io/image/ICB-1234567890-compact2.png?amount=150000&addInfo=SEVQR+ORD-xxx

        return PaymentLinkResponse.builder()
                .orderCode(order.getId())
                .qrCode(qrUrl)
                .checkoutUrl(qrUrl)
                .paymentLinkId(order.getOrderNumber())
                .paymentStatus("PENDING")
                .orderNumber(order.getOrderNumber())
                .transferContent(content)
                .accountNumber(accountNumber)
                .bankName(bankCode)
                .amount(amount)
                .build();
    }

    // ──────────────────────────────────────────────────────────────
    // Verify request webhook đến từ SePay thật
    // SePay gửi header: Authorization: Apikey YOUR_API_KEY
    // ──────────────────────────────────────────────────────────────
    public boolean verifyWebhookApiKey(String authorizationHeader) {
        if (authorizationHeader == null) return false;
        String expected = "Apikey " + apiKey;
        return expected.equals(authorizationHeader);
    }

    // ──────────────────────────────────────────────────────────────
    // Match giao dịch SePay với đơn hàng
    // SePay gửi field "content" = nội dung chuyển khoản
    // Ta tìm đơn hàng có orderNumber nằm trong content đó
    // ──────────────────────────────────────────────────────────────
    public void processWebhookTransaction(Map<String, Object> data) {
        String content = (String) data.get("content");
        String transferType = (String) data.get("transferType");
        Object amountObj = data.get("transferAmount");

        // Chỉ xử lý giao dịch tiền VÀO
        if (!"in".equals(transferType)) return;
        if (content == null || amountObj == null) return;

        int transferAmount = Integer.parseInt(amountObj.toString());

        // Tìm đơn hàng có orderNumber khớp với nội dung chuyển khoản
        // orderNumber có dạng ORD-20260208143025-1
        orderRepository.findAll().stream()
                .filter(order -> content.contains(order.getOrderNumber()))
                .filter(order -> order.getPaymentStatus() == Order.PaymentStatus.PENDING)
                .filter(order -> order.getTotalAmount().intValue() == transferAmount)
                .findFirst()
                .ifPresent(order -> {
                    order.setPaymentStatus(Order.PaymentStatus.PAID);
                    orderRepository.save(order);
                });
    }

    // ──────────────────────────────────────────────────────────────
    // Kiểm tra trạng thái thanh toán của đơn hàng (dùng cho polling)
    // SePay không có API check status → đọc thẳng từ DB
    // ──────────────────────────────────────────────────────────────
    public String checkPaymentStatus(long orderId) {
        return orderRepository.findById(orderId)
                .map(order -> order.getPaymentStatus().name())
                .orElse("NOT_FOUND");
    }
}
