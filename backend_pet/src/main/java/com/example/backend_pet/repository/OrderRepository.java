package com.example.backend_pet.repository;

import com.example.backend_pet.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Order> findAllByOrderByCreatedAtDesc();

    boolean existsByOrderNumber(String orderNumber);

    Optional<Order> findByOrderNumberAndPaymentStatus(String orderNumber, Order.PaymentStatus paymentStatus);
}
