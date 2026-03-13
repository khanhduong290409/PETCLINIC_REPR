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
        .csrf(c -> c.disable())
        .cors(c -> c.configurationSource(corsConfigurationSource()))
        .authorizeHttpRequests(a -> a.anyRequest().permitAll())
        .oauth2Login(o -> o.userInfoEndpoint(u -> u.userService(customOAuth2UserService)).successHandler(oAuth2SuccessHandler));
        return http.build();

    }
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }



}
