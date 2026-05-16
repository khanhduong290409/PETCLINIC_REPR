package com.example.backend_pet.service;

import com.example.backend_pet.dto.OrderResponse;
import com.example.backend_pet.entity.*;
import com.example.backend_pet.repository.CartRepository;
import com.example.backend_pet.repository.OrderRepository;
import com.example.backend_pet.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final CartService cartService;

    // Tạo đơn hàng từ giỏ hàng
    @Transactional
    public OrderResponse createOrderFromCart(Long userId, String shippingAddress, String paymentMethod, String notes) {
        // 1. Lấy user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 2. Lấy cart có items
        Cart cart = cartRepository.findByUserIdWithItems(userId)
                .orElseThrow(() -> new RuntimeException("Cart not found"));

        // 3. Kiểm tra giỏ hàng có trống không
        if (cart.getItems().isEmpty()) {
            throw new RuntimeException("Giỏ hàng trống");
        }

        // 4. Tính tổng tiền
        BigDecimal totalAmount = cart.getItems().stream()
                .map(item -> item.getProduct().getPrice()
                        .multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 5. Tạo Order (orderNumber đặt tạm, sẽ cập nhật sau khi có ID từ DB)
        Order order = Order.builder()
                .user(user)
                .orderNumber("TEMP")
                .totalAmount(totalAmount)
                .shippingAddress(shippingAddress)
                .paymentMethod(paymentMethod)
                .notes(notes)
                .build();

        // 7. Chuyển CartItem → OrderItem
        for (CartItem cartItem : cart.getItems()) {
            OrderItem orderItem = OrderItem.builder()
                    .product(cartItem.getProduct())
                    .quantity(cartItem.getQuantity())
                    .price(cartItem.getProduct().getPrice()) // Lưu giá tại thời điểm mua
                    .build();
            order.addItem(orderItem);
        }

        // 8. Lưu order lần 1 để lấy ID từ DB
        Order savedOrder = orderRepository.save(order);

        // Cập nhật orderNumber = ORD{id} — không có dấu gạch ngang, bank không strip được
        savedOrder.setOrderNumber("ORD" + savedOrder.getId());
        savedOrder = orderRepository.save(savedOrder);

        // 9. Xóa giỏ hàng sau khi đặt hàng
        cartService.clearCart(userId);

        // 10. Trả về response
        return mapToOrderResponse(savedOrder);
    }

    // Lấy danh sách đơn hàng theo user
    public List<OrderResponse> getOrdersByUser(Long userId) {
        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return orders.stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    // Lấy chi tiết 1 đơn hàng
    public OrderResponse getOrderById(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Kiểm tra đơn hàng có thuộc user này không
        if (!order.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        return mapToOrderResponse(order);
    }

    // Lấy tất cả đơn hàng (dành cho admin)
    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    // Cập nhật trạng thái đơn hàng (dành cho admin)
    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
        order.setStatus(Order.OrderStatus.valueOf(status));
        Order saved = orderRepository.save(order);
        return mapToOrderResponse(saved);
    }

    // Map Order entity sang DTO
    private OrderResponse mapToOrderResponse(Order order) {
        List<OrderResponse.OrderItemResponse> items = order.getItems().stream()
                .map(item -> OrderResponse.OrderItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProduct().getId())
                        .productName(item.getProduct().getName())
                        .productImageUrl(item.getProduct().getImageUrl())
                        .quantity(item.getQuantity())
                        .price(item.getPrice())
                        .build())
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .userName(order.getUser().getFullName())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus().name())
                .shippingAddress(order.getShippingAddress())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus().name())
                .notes(order.getNotes())
                .createdAt(order.getCreatedAt())
                .items(items)
                .build();
    }
}

//response tra ve fontend se co dang nhu the nay
/*
{
  "id": 1,
  "orderNumber": "ORD-20260208143025-1",
  "totalAmount": 480000,
  "status": "PENDING",
  "shippingAddress": "123 Nguyen Hue, Q1, HCM",
  "paymentMethod": "COD",
  "paymentStatus": "PENDING",
  "notes": "Giao buổi sáng",
  "createdAt": "2026-02-08T14:30:25",
  "items": [
    {
      "id": 1,
      "productName": "Hạt cho mèo Royal Canin",
      "productImageUrl": "/assets/hatmeo.jpg",
      "quantity": 2,
      "price": 180000
    },
    {
      "id": 2,
      "productName": "Dây dắt chó PetLove",
      "productImageUrl": "/assets/daydatcho.webp",
      "quantity": 1,
      "price": 120000
    }
  ]
}

 */