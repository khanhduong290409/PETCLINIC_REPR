package com.example.backend_pet.controller;

import com.example.backend_pet.dto.CartItemRequest;
import com.example.backend_pet.dto.CartResponse;
import com.example.backend_pet.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    // GET /api/cart?userId=1 - Lấy giỏ hàng của user
    @GetMapping
    public ResponseEntity<CartResponse> getCart(@RequestParam Long userId) {
        return ResponseEntity.ok(cartService.getCart(userId));
    }

    // POST /api/cart/items?userId=1 - Thêm sản phẩm vào giỏ
    @PostMapping("/items")
    public ResponseEntity<CartResponse> addItemToCart(
        @RequestParam Long userId,
        @Valid @RequestBody CartItemRequest request
    ) {
        CartResponse cart = cartService.addItemToCart(
            userId,
            request.getProductId(),
            request.getQuantity()
        );
        return ResponseEntity.ok(cart);
    }

    // PUT /api/cart/items/{productId}?userId=1 - Cập nhật số lượng
    @PutMapping("/items/{productId}")
    public ResponseEntity<CartResponse> updateItemQuantity(
        @RequestParam Long userId,
        @PathVariable Long productId,
        @Valid @RequestBody CartItemRequest request
    ) {
        CartResponse cart = cartService.updateItemQuantity(
            userId,
            productId,
            request.getQuantity()
        );
        return ResponseEntity.ok(cart);
    }

    // DELETE /api/cart/items/{productId}?userId=1 - Xóa sản phẩm
    @DeleteMapping("/items/{productId}")
    public ResponseEntity<CartResponse> removeItemFromCart(
        @RequestParam Long userId,
        @PathVariable Long productId
    ) {
        CartResponse cart = cartService.removeItemFromCart(userId, productId);
        return ResponseEntity.ok(cart);
    }

    // DELETE /api/cart?userId=1 - Xóa toàn bộ giỏ hàng
    @DeleteMapping
    public ResponseEntity<Void> clearCart(@RequestParam Long userId) {
        cartService.clearCart(userId);
        return ResponseEntity.noContent().build();
    }
}
