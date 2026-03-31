package com.example.backend_pet.config;

import com.example.backend_pet.entity.User;
import com.example.backend_pet.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    private final UserRepository userRepository;

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
    }
}
