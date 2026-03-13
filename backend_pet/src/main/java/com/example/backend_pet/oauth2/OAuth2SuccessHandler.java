package com.example.backend_pet.oauth2;

import com.example.backend_pet.entity.User;
import com.example.backend_pet.repository.UserRepository;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {
        // authenticationsuccesshandler là interface quyết định việc làm gì sau khi đăng nhập thành công 
        private final UserRepository userRepository;


        @Override
        public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                        Authentication authentication) throws IOException, ServletException {
        //authentication: object spring security lưu thông tin user vừa đăng nhập
        //getprincipal lấy ra chủ thể vừa đăng nhập ( trả về object nên cần phải ép kiểu)
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("user not found"));
        String redirectUrl = "http://localhost:5173/oauth2/callback"
        + "?id=" + user.getId()
        + "&email=" + URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8)
        + "&fullName=" + URLEncoder.encode(user.getFullName(), StandardCharsets.UTF_8)
        + "&role=" + user.getRole().name();
        response.sendRedirect(redirectUrl);
        }

}
