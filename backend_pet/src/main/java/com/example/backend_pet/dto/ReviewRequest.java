package com.example.backend_pet.dto;

import lombok.Data;

@Data
public class ReviewRequest {
    private Long userId;
    private String bookingCode;
    private int rating;
    private String comment;
}
