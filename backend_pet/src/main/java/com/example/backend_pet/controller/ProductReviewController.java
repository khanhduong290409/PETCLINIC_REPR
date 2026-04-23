package com.example.backend_pet.controller;

import com.example.backend_pet.dto.ProductReviewRequest;
import com.example.backend_pet.dto.ProductReviewResponse;
import com.example.backend_pet.service.ProductReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/product-reviews")
@RequiredArgsConstructor
public class ProductReviewController {

    private final ProductReviewService productReviewService;

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ProductReviewResponse>> getReviewsByProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(productReviewService.getReviewsByProduct(productId));
    }

    @PostMapping
    public ResponseEntity<ProductReviewResponse> createReview(@RequestBody ProductReviewRequest request) {
        return ResponseEntity.ok(productReviewService.createReview(request));
    }

    @GetMapping("/user/{userId}/product-ids")
    public ResponseEntity<List<Long>> getReviewedProductIds(@PathVariable Long userId) {
        return ResponseEntity.ok(productReviewService.getReviewedProductIds(userId));
    }
}
