package com.example.backend_pet.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Proxy endpoint để frontend gọi FastAPI AI service qua Spring Boot.
 * FastAPI chạy riêng (mặc định localhost:8001), không expose ra ngoài trực tiếp.
 *
 * POST /api/ai/predict  — nhận {symptom_codes}, trả JSON từ FastAPI (cần đăng nhập)
 * GET  /api/ai/symptoms — trả danh sách triệu chứng theo nhóm (public)
 */
@RestController
@RequestMapping("/api/ai")
public class AiController {

    // Lỗi trả về là chuỗi cố định, không nối e.getMessage() vào để JSON không bị hỏng
    private static final String SERVICE_UNAVAILABLE_JSON =
            "{\"error\":\"Dịch vụ AI tạm thời không khả dụng, vui lòng thử lại sau\"}";

    @Value("${ai.service.url:http://localhost:8001}")
    private String aiBaseUrl;

    // Timeout kết nối ngắn: service chết thì báo lỗi ngay, không treo request
    private final HttpClient httpClient = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_1_1)
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    // Timeout đọc dài hơn vì free tier có cold start, lần gọi đầu chậm
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(15);

    /** Proxy POST /predict */
    @PostMapping("/predict")
    public ResponseEntity<String> predict(@RequestBody String body) {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(aiBaseUrl + "/predict"))
                .timeout(REQUEST_TIMEOUT)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        return forward(request);
    }

    /** Proxy GET /symptoms */
    @GetMapping("/symptoms")
    public ResponseEntity<String> getSymptoms() {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(aiBaseUrl + "/symptoms"))
                .timeout(REQUEST_TIMEOUT)
                .GET()
                .build();
        return forward(request);
    }

    /** Gửi request sang FastAPI và trả nguyên status + body về cho frontend */
    private ResponseEntity<String> forward(HttpRequest request) {
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return ResponseEntity.status(response.statusCode())
                    .header("Content-Type", "application/json")
                    .body(response.body());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            System.err.println("[AI] Request bị gián đoạn: " + e.getMessage());
            return serviceUnavailable();
        } catch (Exception e) {
            System.err.println("[AI] Không gọi được AI service: " + e.getMessage());
            return serviceUnavailable();
        }
    }

    private ResponseEntity<String> serviceUnavailable() {
        return ResponseEntity.status(503)
                .header("Content-Type", "application/json")
                .body(SERVICE_UNAVAILABLE_JSON);
    }
}
