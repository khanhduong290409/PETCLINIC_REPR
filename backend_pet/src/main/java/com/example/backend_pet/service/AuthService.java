package com.example.backend_pet.service;

import com.example.backend_pet.dto.AuthResponse;
import com.example.backend_pet.dto.LoginRequest;
import com.example.backend_pet.dto.RegisterRequest;
import com.example.backend_pet.entity.User;
import com.example.backend_pet.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Đăng ký tài khoản mới
    public AuthResponse register(RegisterRequest request) {
        // Kiểm tra email đã tồn tại chưa
        if (userRepository.existsByEmail(request.getEmail())) {
            return AuthResponse.builder()
                    .message("Email đã được sử dụng")
                    .build();
        }

        // Tạo user mới (password lưu thẳng, không mã hóa - đơn giản cho học tập)
        User user = User.builder()
                .email(request.getEmail())
                .password(request.getPassword())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .build();

        User savedUser = userRepository.save(user);

        return AuthResponse.builder()
                .id(savedUser.getId())
                .email(savedUser.getEmail())
                .fullName(savedUser.getFullName())
                .phone(savedUser.getPhone())
                .role(savedUser.getRole().name())
                .message("Đăng ký thành công")
                .build();
    }

    // Đăng nhập
    public AuthResponse login(LoginRequest request) {
        // Tìm user theo email
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);

        // Kiểm tra user có tồn tại không
        if (user == null) {
            return AuthResponse.builder()
                    .message("Email không tồn tại")
                    .build();
        }

        // Kiểm tra password (so sánh thẳng, không mã hóa)
        if (!user.getPassword().equals(request.getPassword())) {
            return AuthResponse.builder()
                    .message("Sai mật khẩu")
                    .build();
        }

        // Đăng nhập thành công
        return AuthResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .message("Đăng nhập thành công")
                .build();
    }
}
