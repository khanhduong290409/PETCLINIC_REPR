package com.example.backend_pet.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReviewResponse {
    private Long id;
    private String customerName;
    private String bookingCode;
    private int rating;
    private String comment;
    private LocalDateTime createdAt;
}
