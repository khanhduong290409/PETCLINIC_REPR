package com.example.backend_pet.service;

import com.example.backend_pet.dto.CartResponse;
import com.example.backend_pet.entity.Cart;
import com.example.backend_pet.entity.CartItem;
import com.example.backend_pet.entity.Product;
import com.example.backend_pet.entity.User;
import com.example.backend_pet.repository.CartItemRepository;
import com.example.backend_pet.repository.CartRepository;
import com.example.backend_pet.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductService productService;

    // Lấy hoặc tạo cart cho user
    @Transactional
    public Cart getOrCreateCart(Long userId) {
        return cartRepository.findByUserIdWithItems(userId)
            .orElseGet(() -> createCartForUser(userId));
    }

    // Tạo cart mới cho user
    private Cart createCartForUser(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        Cart cart = Cart.builder()
            .user(user)
            .build();

        return cartRepository.save(cart);
    }

    // Lấy cart của user (dạng DTO)
    public CartResponse getCart(Long userId) {
        Cart cart = getOrCreateCart(userId);
        return mapToCartResponse(cart);
    }

    // Thêm sản phẩm vào giỏ hàng
    @Transactional
    public CartResponse addItemToCart(Long userId, Long productId, Integer quantity) {
        Cart cart = getOrCreateCart(userId);
        Product product = productService.getProductById(productId);

        // Kiểm tra stock
        if (product.getStock() < quantity) {
            throw new RuntimeException("Not enough stock for product: " + product.getName());
        }

        // Kiểm tra đã có sản phẩm này chưa
        CartItem existingItem = cartItemRepository
            .findByCartIdAndProductId(cart.getId(), productId)
            .orElse(null);

        if (existingItem != null) {
            // Đã có → Tăng số lượng
            existingItem.setQuantity(existingItem.getQuantity() + quantity);
            cartItemRepository.save(existingItem);
        } else {
            // Chưa có → Thêm mới
            CartItem newItem = CartItem.builder()
                .cart(cart)
                .product(product)
                .quantity(quantity)
                .build();
            cart.addItem(newItem);
            cartItemRepository.save(newItem);
        }

        return mapToCartResponse(cart);
    }

    // Cập nhật số lượng
    @Transactional
    public CartResponse updateItemQuantity(Long userId, Long productId, Integer quantity) {
        Cart cart = getOrCreateCart(userId);

        if (quantity <= 0) {
            // Số lượng <= 0 → Xóa item
            return removeItemFromCart(userId, productId);
        }

        CartItem item = cartItemRepository
            .findByCartIdAndProductId(cart.getId(), productId)
            .orElseThrow(() -> new RuntimeException("Item not found in cart"));

        // Kiểm tra stock
        if (item.getProduct().getStock() < quantity) {
            throw new RuntimeException("Not enough stock");
        }

        item.setQuantity(quantity);
        cartItemRepository.save(item);

        return mapToCartResponse(cart);
    }

    // Xóa sản phẩm khỏi giỏ
    @Transactional
    public CartResponse removeItemFromCart(Long userId, Long productId) {
        Cart cart = getOrCreateCart(userId);
        cartItemRepository.deleteByCartIdAndProductId(cart.getId(), productId);

        // Refresh cart
        cart = cartRepository.findByUserIdWithItems(userId)
            .orElseThrow(() -> new RuntimeException("Cart not found"));

        return mapToCartResponse(cart);
    }

    // Xóa toàn bộ giỏ hàng
    @Transactional
    public void clearCart(Long userId) {
        Cart cart = getOrCreateCart(userId);
        cart.getItems().clear();
        cartRepository.save(cart);
    }

    // Map Cart entity sang DTO
    private CartResponse mapToCartResponse(Cart cart) {
        var items = cart.getItems().stream()
            .sorted(Comparator.comparing(CartItem::getId)) // Sắp xếp theo ID để giữ thứ tự ổn định
            .map(item -> CartResponse.CartItemResponse.builder()
                .id(item.getId())
                .product(mapToProductResponse(item.getProduct()))
                .quantity(item.getQuantity())
                .build())
            .collect(Collectors.toList());

        int totalItems = cart.getItems().stream()
            .mapToInt(CartItem::getQuantity)
            .sum();

        BigDecimal totalPrice = cart.getItems().stream()
            .map(item -> item.getProduct().getPrice()
                .multiply(BigDecimal.valueOf(item.getQuantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CartResponse.builder()
            .id(cart.getId())
            .userId(cart.getUser().getId())
            .items(items)
            .totalItems(totalItems)
            .totalPrice(totalPrice)
            .build();
    }

    // Map Product sang DTO
    private CartResponse.ProductResponse mapToProductResponse(Product product) {
        return CartResponse.ProductResponse.builder()
            .id(product.getId())
            .name(product.getName())
            .price(product.getPrice())
            .imageUrl(product.getImageUrl())
            .category(product.getCategory())
            .stock(product.getStock())
            .description(product.getDescription())
            .brand(product.getBrand())
            .build();
    }
}
