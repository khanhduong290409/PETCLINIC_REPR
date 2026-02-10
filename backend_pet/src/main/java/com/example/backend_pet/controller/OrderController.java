package com.example.backend_pet.controller;

import com.example.backend_pet.dto.OrderRequest;
import com.example.backend_pet.dto.OrderResponse;
import com.example.backend_pet.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    // POST /api/orders - Tạo đơn hàng từ giỏ hàng
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@RequestBody OrderRequest request) {
        OrderResponse order = orderService.createOrderFromCart(
                request.getUserId(),
                request.getShippingAddress(),
                request.getPaymentMethod(),
                request.getNotes()
        );
        return ResponseEntity.ok(order);
    }

    // GET /api/orders?userId=1 - Lấy danh sách đơn hàng
    @GetMapping
    public ResponseEntity<List<OrderResponse>> getOrders(@RequestParam Long userId) {
        List<OrderResponse> orders = orderService.getOrdersByUser(userId);
        return ResponseEntity.ok(orders);
    }

    // GET /api/orders/1?userId=1 - Lấy chi tiết đơn hàng
    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrderDetail(
            @PathVariable Long orderId,
            @RequestParam Long userId) {
        OrderResponse order = orderService.getOrderById(orderId, userId);
        return ResponseEntity.ok(order);
    }
}
