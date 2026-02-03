package com.example.backend_pet.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "carts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cart extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CartItem> items = new ArrayList<>();

    // Helper method để thêm item
    public void addItem(CartItem item) {
        items.add(item);
        item.setCart(this);
    }

    // Helper method để xóa item
    public void removeItem(CartItem item) {
        items.remove(item);
        item.setCart(null);
    }
}
