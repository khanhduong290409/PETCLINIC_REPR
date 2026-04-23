package com.example.backend_pet.service;

import com.example.backend_pet.dto.ReviewRequest;
import com.example.backend_pet.dto.ReviewResponse;
import com.example.backend_pet.entity.Review;
import com.example.backend_pet.entity.User;
import com.example.backend_pet.repository.ReviewRepository;
import com.example.backend_pet.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;

    public ReviewResponse createReview(ReviewRequest request) {
        if (reviewRepository.existsByUserIdAndBookingCode(request.getUserId(), request.getBookingCode())) {
            throw new RuntimeException("Bạn đã đánh giá lịch khám này rồi");
        }
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Review review = Review.builder()
                .user(user)
                .bookingCode(request.getBookingCode())
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        Review saved = reviewRepository.save(review);
        return mapToResponse(saved);
    }

    public List<ReviewResponse> getAllReviews() {
        return reviewRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<String> getReviewedBookingCodes(Long userId) {
        return reviewRepository.findByUserId(userId)
                .stream()
                .map(Review::getBookingCode)
                .collect(Collectors.toList());
    }

    private ReviewResponse mapToResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .customerName(review.getUser().getFullName())
                .bookingCode(review.getBookingCode())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
