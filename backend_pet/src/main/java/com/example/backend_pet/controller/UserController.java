package com.example.backend_pet.controller;

import com.example.backend_pet.config.JwtUtils;
import com.example.backend_pet.dto.UpdateProfileRequest;
import com.example.backend_pet.entity.User;
import com.example.backend_pet.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;

    private Long extractUserId(String authHeader) {
        String token = authHeader.substring(7);
        return jwtUtils.extractClaims(token).get("userId", Long.class);
    }

    // PUT /api/users/{id}/profile - Cập nhật thông tin cá nhân (yêu cầu đăng nhập)
    // Ô để trống = giữ nguyên giá trị cũ (trước đây SĐT trống bị ghi "" đè mất SĐT trong DB)
    @PutMapping("/{id}/profile")
    public ResponseEntity<?> updateProfile(
            @PathVariable Long id,
            @RequestBody UpdateProfileRequest request,
            @RequestHeader("Authorization") String authHeader) {
        // Chỉ được sửa thông tin của chính mình — id trên URL không đáng tin
        if (!id.equals(extractUserId(authHeader))) {
            throw new RuntimeException("Unauthorized");
        }

        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            String phone = request.getPhone().trim();
            if (!phone.matches("\\d{9,11}")) {
                throw new RuntimeException("Số điện thoại không hợp lệ");
            }
            user.setPhone(phone);
        }

        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "fullName", user.getFullName(),
                "phone", user.getPhone() != null ? user.getPhone() : ""
        ));
    }
}
