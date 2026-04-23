package com.example.backend_pet.repository;

import com.example.backend_pet.entity.ProductReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {

    List<ProductReview> findByProductIdOrderByCreatedAtDesc(Long productId);

    List<ProductReview> findByUserId(Long userId);

    boolean existsByUserIdAndProductId(Long userId, Long productId);
}
