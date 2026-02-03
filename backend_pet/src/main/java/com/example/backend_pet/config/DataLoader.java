package com.example.backend_pet.config;

import com.example.backend_pet.entity.Product;
import com.example.backend_pet.entity.User;
import com.example.backend_pet.repository.ProductRepository;
import com.example.backend_pet.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Override
    public void run(String... args) {
        // Tạo user test (ID = 1)
        if (userRepository.count() == 0) {
            User user = User.builder()
                .email("test@example.com")
                .password("password123")
                .fullName("Test User")
                .phone("0123456789")
                .address("123 Test Street")
                .role(User.Role.USER)
                .status(User.Status.ACTIVE)
                .build();
            userRepository.save(user);
            System.out.println("✅ Created test user: test@example.com");
        }

        // Tạo sample products
        if (productRepository.count() == 0) {
            Product p1 = Product.builder()
                .name("Hạt cho mèo Royal Canin")
                .price(new BigDecimal("180000"))
                .imageUrl("/assets/hatmeo.jpg")
                .category("food")
                .stock(50)
                .description("Thức ăn cao cấp dành cho mèo trưởng thành, giàu dinh dưỡng")
                .brand("Royal Canin")
                .build();

            Product p2 = Product.builder()
                .name("Dây dắt chó PetLove")
                .price(new BigDecimal("120000"))
                .imageUrl("/assets/daydatcho.webp")
                .category("accessories")
                .stock(30)
                .description("Dây dắt chó chất lượng cao, bền đẹp, nhiều màu sắc")
                .brand("PetLove")
                .build();

            Product p3 = Product.builder()
                .name("Sữa tắm thú cưng Bio-Groom")
                .price(new BigDecimal("140000"))
                .imageUrl("/assets/suatamchomeo.jpg")
                .category("grooming")
                .stock(45)
                .description("Sữa tắm dịu nhẹ, an toàn cho da thú cưng, mùi hương dễ chịu")
                .brand("Bio-Groom")
                .build();

            Product p4 = Product.builder()
                .name("Pate cho mèo Me-O")
                .price(new BigDecimal("48000"))
                .imageUrl("/assets/patechomeo.webp")
                .category("food")
                .stock(100)
                .description("Pate dinh dưỡng cho mèo, nhiều vị khác nhau")
                .brand("Me-O")
                .build();

            productRepository.save(p1);
            productRepository.save(p2);
            productRepository.save(p3);
            productRepository.save(p4);

            System.out.println("✅ Created 4 sample products");
        }
    }
}
