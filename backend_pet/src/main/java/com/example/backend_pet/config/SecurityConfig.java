package com.example.backend_pet.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.example.backend_pet.oauth2.CustomOAuth2UserService;
import com.example.backend_pet.oauth2.OAuth2SuccessHandler;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final JwtUtils jwtUtils;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(c -> c.disable())
            .cors(c -> c.configurationSource(corsConfigurationSource()))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(new JwtAuthFilter(jwtUtils), UsernamePasswordAuthenticationFilter.class)
            //UsernamePasswordAuthenticationFilter fitler này xử lí với form truyền thông bằng submit form còn project mình dùng api 
            //nhưng đây là filter mặc định của spring nên ta chỉ viết chứ thực chất filter này không có tác dụng gì

            //.authorizeHttpRequests nó sẽ tự động SecurityContextHolder.getContext().getAuthentication() để lấy authentication để lọc request thoả yêu cầu
            .authorizeHttpRequests(a -> a
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/oauth2/**", "/login/**").permitAll()
                // Public GET — khách chưa đăng nhập vẫn xem được
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/products/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/services/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/reviews/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/product-reviews/**").permitAll()
                .anyRequest().authenticated()
                //từ chối request và trả về lỗi với các request còn lại
                // Tất cả còn lại phải đăng nhập(check trong SecurityContextHolder.getContext() có lưu auth không nếu có thì cho qua, không thì ném lỗi )
            )
            //o là 1 object duy nhất — OAuth2LoginConfigurer
            .oauth2Login(o -> o.userInfoEndpoint
                (u -> u.userService(customOAuth2UserService))
                .successHandler(oAuth2SuccessHandler));
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