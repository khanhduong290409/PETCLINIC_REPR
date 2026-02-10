package com.example.backend_pet.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class OrderResponse {
    private Long id;
    private String orderNumber;
    private BigDecimal totalAmount;
    private String status;
    private String shippingAddress;
    private String paymentMethod;
    private String paymentStatus;
    private String notes;
    private LocalDateTime createdAt;
    private List<OrderItemResponse> items;

    @Data
    @Builder
    public static class OrderItemResponse {
        private Long id;
        private String productName;
        private String productImageUrl;
        private Integer quantity;
        private BigDecimal price;
    }
}
