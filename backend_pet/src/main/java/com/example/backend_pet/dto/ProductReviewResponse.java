package com.example.backend_pet.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ProductReviewResponse {
    private Long id;
    private Long productId;
    private String customerName;
    private int rating;
    private String comment;
    private LocalDateTime createdAt;
}
