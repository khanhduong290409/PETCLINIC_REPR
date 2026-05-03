package com.example.backend_pet.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.example.backend_pet.oauth2.CustomOAuth2UserService;
import com.example.backend_pet.oauth2.OAuth2SuccessHandler;

import lombok.RequiredArgsConstructor;

@Configuration // đánh dấu đây là class config, spring sẽ đọc và áp dụng
@EnableWebSecurity // bật tính năng bảo mật của spring security
@RequiredArgsConstructor
public class SecurityConfig {
    // sau khi google xác thự xong, spring security sẽ gọi customoauth2userservice để lấy thông tin user trong google.
    private final CustomOAuth2UserService customOAuth2UserService;
    // xử lý sau khi customoauth2userservice
    private final OAuth2SuccessHandler oAuth2SuccessHandler;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) {
        http
        .csrf(c -> c.disable())//csrf là 1 cơ chế bảo vệ form submit mặc định của spring 
        // tắt đi bởi vì mình dùng react + api riêng , ko dùng form html của spring 
        //nếu ko tắt thì  -> mọi request đều bị từ react đều bị chặn
        .cors(c -> c.configurationSource(corsConfigurationSource()))//Cho phép React ở localhost:5173 gọi API sang Spring ở port khác
        .authorizeHttpRequests(a -> a.anyRequest().permitAll())//Quy định ai được truy cập endpoint nào, tất cả mọi người đều gọi được api ko cần đăng nhập 
        .oauth2Login(o -> o.userInfoEndpoint(u -> u.userService(customOAuth2UserService)).successHandler(oAuth2SuccessHandler));
        //.userService(customOAuth2UserService) → Sau khi Google xác thực xong, gọi CustomOAuth2UserService để lấy/lưu thông tin user
        //.successHandler(oAuth2SuccessHandler) → Đăng nhập thành công thì làm gì (thường là tạo JWT rồi redirect về React)
        return http.build();

    }
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        String frontendUrl = System.getenv("FRONTEND_URL") != null ? System.getenv("FRONTEND_URL") : "http://localhost:5173";
        config.setAllowedOrigins(List.of("http://localhost:5173", frontendUrl));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }



}
