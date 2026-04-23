package com.example.backend_pet.dto;

import lombok.Data;

@Data
public class ProductReviewRequest {
    private Long userId;
    private Long productId;
    private int rating;
    private String comment;
}
