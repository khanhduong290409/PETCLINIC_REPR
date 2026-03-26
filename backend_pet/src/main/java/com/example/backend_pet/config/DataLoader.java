package com.example.backend_pet.config;

import com.example.backend_pet.entity.PetService;
import com.example.backend_pet.entity.Product;
import com.example.backend_pet.entity.User;
import com.example.backend_pet.repository.PetServiceRepository;
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
    private final PetServiceRepository petServiceRepository;

    @Override
    public void run(String... args) {
        // Tạo user test
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

        // Tạo tài khoản ADMIN mẫu
        if (!userRepository.existsByEmail("admin@petclinic.com")) {
            User admin = User.builder()
                .email("admin@petclinic.com")
                .password("admin123")
                .fullName("Admin")
                .role(User.Role.ADMIN)
                .status(User.Status.ACTIVE)
                .build();
            userRepository.save(admin);
            System.out.println("✅ Created admin: admin@petclinic.com / admin123");
        }

        // Tạo tài khoản DOCTOR mẫu
        if (!userRepository.existsByEmail("doctor@petclinic.com")) {
            User doctor = User.builder()
                .email("doctor@petclinic.com")
                .password("doctor123")
                .fullName("BS. Nguyễn Văn An")
                .role(User.Role.DOCTOR)
                .status(User.Status.ACTIVE)
                .build();
            userRepository.save(doctor);
            System.out.println("✅ Created doctor: doctor@petclinic.com / doctor123");
        }

        // Tạo sample pet services (dịch vụ khám)
        if (petServiceRepository.count() == 0) {
            petServiceRepository.save(PetService.builder()
                    .title("Khám tổng quát")
                    .description("Kiểm tra sức khỏe toàn diện cho thú cưng")
                    .price(new BigDecimal("200000"))
                    .duration(30)
                    .category("checkup")
                    .build());

            petServiceRepository.save(PetService.builder()
                    .title("Tiêm phòng")
                    .description("Tiêm vaccine phòng bệnh cho chó mèo")
                    .price(new BigDecimal("150000"))
                    .duration(15)
                    .category("vaccination")
                    .build());

            petServiceRepository.save(PetService.builder()
                    .title("Tắm spa")
                    .description("Tắm sạch, sấy khô, xịt thơm cho thú cưng")
                    .price(new BigDecimal("120000"))
                    .duration(45)
                    .category("grooming")
                    .build());

            petServiceRepository.save(PetService.builder()
                    .title("Cắt tỉa lông")
                    .description("Cắt tỉa lông tạo kiểu đẹp cho thú cưng")
                    .price(new BigDecimal("180000"))
                    .duration(60)
                    .category("grooming")
                    .build());

            petServiceRepository.save(PetService.builder()
                    .title("Khám răng")
                    .description("Kiểm tra và vệ sinh răng miệng cho thú cưng")
                    .price(new BigDecimal("250000"))
                    .duration(30)
                    .category("dental")
                    .build());

            System.out.println("✅ Created 5 sample pet services");
        }
    }
}
