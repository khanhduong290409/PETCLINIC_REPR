package com.example.backend_pet.service;

import com.example.backend_pet.config.JwtUtils;
import com.example.backend_pet.dto.AuthResponse;
import com.example.backend_pet.dto.LoginRequest;
import com.example.backend_pet.dto.RegisterRequest;
import com.example.backend_pet.entity.User;
import com.example.backend_pet.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return AuthResponse.builder()
                    .message("Email đã được sử dụng")
                    .build();
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .build();

        User savedUser = userRepository.save(user);
        String token = jwtUtils.generateToken(savedUser);

        return AuthResponse.builder()
                .id(savedUser.getId())
                .email(savedUser.getEmail())
                .fullName(savedUser.getFullName())
                .phone(savedUser.getPhone())
                .role(savedUser.getRole().name())
                .token(token)
                .message("Đăng ký thành công")
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);

        if (user == null) {
            return AuthResponse.builder()
                    .message("Email không tồn tại")
                    .build();
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return AuthResponse.builder()
                    .message("Sai mật khẩu")
                    .build();
        }

        if (user.getStatus() == User.Status.INACTIVE) {
            return AuthResponse.builder()
                    .message("Tài khoản đã bị khóa. Vui lòng liên hệ admin.")
                    .build();
        }

        String token = jwtUtils.generateToken(user);

        return AuthResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .token(token)
                .message("Đăng nhập thành công")
                .build();
    }
}