package com.example.backend_pet.controller;

import com.example.backend_pet.dto.ReviewRequest;
import com.example.backend_pet.dto.ReviewResponse;
import com.example.backend_pet.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping
    public ResponseEntity<List<ReviewResponse>> getAllReviews() {
        return ResponseEntity.ok(reviewService.getAllReviews());
    }

    @PostMapping
    public ResponseEntity<ReviewResponse> createReview(@RequestBody ReviewRequest request) {
        return ResponseEntity.ok(reviewService.createReview(request));
    }

    @GetMapping("/user/{userId}/booking-codes")
    public ResponseEntity<List<String>> getReviewedBookingCodes(@PathVariable Long userId) {
        return ResponseEntity.ok(reviewService.getReviewedBookingCodes(userId));
    }
}
