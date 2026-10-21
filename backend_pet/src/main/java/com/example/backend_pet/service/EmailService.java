package com.example.backend_pet.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

// Gửi email qua Brevo HTTP API.
// Không dùng SMTP vì gói free của Render chặn cổng SMTP (25/465/587), chỉ HTTPS là đi ra ngoài được.
@Service
public class EmailService {

    private static final String BREVO_URL = "https://api.brevo.com/v3/smtp/email";

    // Email giả của khách tại quầy (xem AppointmentService.findOrCreateWalkInCustomer) — không có hộp thư thật
    private static final String WALK_IN_EMAIL_DOMAIN = "@pawcare.local";

    @Value("${brevo.api-key}")
    private String apiKey;

    @Value("${mail.sender-email}")
    private String senderEmail;

    @Value("${mail.sender-name}")
    private String senderName;

    private final RestTemplate restTemplate = createRestTemplate();

    // Đặt timeout vì mặc định RestTemplate chờ vô hạn — Brevo treo thì request đặt lịch của khách cũng treo theo
    private static RestTemplate createRestTemplate() {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(5));
        requestFactory.setReadTimeout(Duration.ofSeconds(10));
        return new RestTemplate(requestFactory);
    }

    // Trả về true nếu Brevo nhận mail thành công.
    // Không bao giờ ném exception: lỗi gửi mail không được làm hỏng nghiệp vụ chính (đặt lịch, nhắc lịch).
    public boolean sendEmail(String toEmail, String toName, String subject, String htmlContent) {
        if (apiKey == null || apiKey.isBlank() || senderEmail == null || senderEmail.isBlank()) {
            System.out.println("Chưa cấu hình BREVO_API_KEY / MAIL_SENDER_EMAIL — bỏ qua gửi mail tới " + toEmail);
            return false;
        }
        if (toEmail == null || toEmail.isBlank() || toEmail.endsWith(WALK_IN_EMAIL_DOMAIN)) {
            System.out.println("Không có email thật — bỏ qua gửi mail: " + toEmail);
            return false;
        }

        try {
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(
                    buildRequestBody(toEmail, toName, subject, htmlContent),
                    buildHeaders());

            ResponseEntity<String> response = restTemplate.postForEntity(BREVO_URL, request, String.class);
            // Brevo trả 201 Created khi đã nhận mail vào hàng đợi gửi
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            // RestTemplate ném exception với mọi mã 4xx/5xx (sai api key, sender chưa xác minh, hết quota...)
            System.err.println("Gửi mail tới " + toEmail + " thất bại: " + e.getMessage());
            return false;
        }
    }

    // Body theo định dạng Brevo: { sender, to: [ {email, name} ], subject, htmlContent }
    private Map<String, Object> buildRequestBody(String toEmail, String toName, String subject, String htmlContent) {
        Map<String, String> sender = new HashMap<>();
        sender.put("email", senderEmail);
        sender.put("name", senderName);

        Map<String, String> recipient = new HashMap<>();
        recipient.put("email", toEmail);
        if (toName != null && !toName.isBlank()) {
            recipient.put("name", toName);
        }

        Map<String, Object> body = new HashMap<>();
        body.put("sender", sender);
        body.put("to", List.of(recipient));
        body.put("subject", subject);
        body.put("htmlContent", htmlContent);
        return body;
    }

    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        // Brevo xác thực bằng header "api-key", không phải "Authorization: Bearer"
        headers.set("api-key", apiKey);
        return headers;
    }
}
