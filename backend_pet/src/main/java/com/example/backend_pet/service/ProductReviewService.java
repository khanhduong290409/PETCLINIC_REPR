package com.example.backend_pet.service;

import com.example.backend_pet.dto.ProductReviewRequest;
import com.example.backend_pet.dto.ProductReviewResponse;
import com.example.backend_pet.entity.Product;
import com.example.backend_pet.entity.ProductReview;
import com.example.backend_pet.entity.User;
import com.example.backend_pet.repository.ProductRepository;
import com.example.backend_pet.repository.ProductReviewRepository;
import com.example.backend_pet.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductReviewService {

    private final ProductReviewRepository productReviewRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public ProductReviewResponse createReview(ProductReviewRequest request) {
        if (productReviewRepository.existsByUserIdAndProductId(request.getUserId(), request.getProductId())) {
            throw new RuntimeException("Bạn đã đánh giá sản phẩm này rồi");
        }
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        ProductReview review = ProductReview.builder()
                .user(user)
                .product(product)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        return mapToResponse(productReviewRepository.save(review));
    }

    public List<ProductReviewResponse> getReviewsByProduct(Long productId) {
        return productReviewRepository.findByProductIdOrderByCreatedAtDesc(productId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<Long> getReviewedProductIds(Long userId) {
        return productReviewRepository.findByUserId(userId)
                .stream().map(r -> r.getProduct().getId()).collect(Collectors.toList());
    }

    private ProductReviewResponse mapToResponse(ProductReview review) {
        return ProductReviewResponse.builder()
                .id(review.getId())
                .productId(review.getProduct().getId())
                .customerName(review.getUser().getFullName())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
