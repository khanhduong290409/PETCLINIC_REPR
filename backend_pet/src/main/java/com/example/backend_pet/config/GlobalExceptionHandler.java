package com.example.backend_pet.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
import java.util.stream.Collectors;

// class này là nơi xử lý lỗi tập trung cho toàn bộ controller
//thay vì mỗi controller phải tự try/catch, mọi exception bắn ra từ bất kỳ đâu đều được class này đón và xử lý
@RestControllerAdvice

public class GlobalExceptionHandler {

    // Bắt lỗi @Valid — khi field không qua validation (email sai định dạng, password quá ngắn,...)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationException(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", message));
    }

    @ExceptionHandler(RuntimeException.class) // khai báo method này sẽ xử lý khi có RuntimException bị throw, spring tự gọi method này
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        String message = ex.getMessage();

        if (message != null && message.equalsIgnoreCase("Unauthorized")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", message));
        }

        if (message != null && message.toLowerCase().contains("not found")) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", message));
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", message != null ? message : "Đã xảy ra lỗi"));
    }
}

/**
Điều kiện 1 — "Unauthorized"


if (message != null && message.equalsIgnoreCase("Unauthorized")) {
    return ResponseEntity.status(HttpStatus.FORBIDDEN) // 403
Grep trong code thấy các service throw đúng chữ "Unauthorized" khi user cố truy cập dữ liệu không phải của mình:


// PetService.java
throw new RuntimeException("Unauthorized");
// OrderService.java  
throw new RuntimeException("Unauthorized");
// AppointmentService.java
throw new RuntimeException("Unauthorized");
equalsIgnoreCase để match chính xác, không phân biệt hoa thường.

Điều kiện 2 — "not found"


if (message != null && message.toLowerCase().contains("not found")) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND) // 404
Dùng contains vì message dạng này có nhiều biến thể:


throw new RuntimeException("User not found");
throw new RuntimeException("Order not found: " + orderId);
throw new RuntimeException("Pet not found: " + petId);
throw new RuntimeException("Service not found: " + serviceId);
Tất cả đều chứa "not found" nên dùng contains bắt hết một lần.

Điều kiện 3 — fallback còn lại


return ResponseEntity.status(HttpStatus.BAD_REQUEST) // 400
    .body(Map.of("error", message != null ? message : "Đã xảy ra lỗi"));
Mọi exception không khớp 2 điều kiện trên đều rơi vào đây — đây là lỗi business logic:


throw new RuntimeException("Giỏ hàng trống");
throw new RuntimeException("Bạn đã đánh giá rồi");
throw new RuntimeException("Không thể hủy lịch đã hoàn thành");
throw new RuntimeException("Số lượng tồn kho không hợp lệ");
message != null ? message : "Đã xảy ra lỗi" — phòng trường hợp có exception không có message thì vẫn trả về chữ thay vì null.
 */