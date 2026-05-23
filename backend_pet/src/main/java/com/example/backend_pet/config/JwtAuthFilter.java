package com.example.backend_pet.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

public class JwtAuthFilter extends OncePerRequestFilter {
//OncePerRequestFilter đây là 1 class spring dùng để chặn mọi http request trước khi request đến controller. 
//mỗi request chỉ chạy filter này đúng 1 lần ( tránh trường hợp filter bị gọi nhiều lần do redirect nội bộ)
private final JwtUtils jwtUtils;

    public JwtAuthFilter(JwtUtils jwtUtils) {
        this.jwtUtils = jwtUtils;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtUtils.isTokenValid(token)) {
                String email = jwtUtils.extractEmail(token);
                String role = jwtUtils.extractRole(token);
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                        email, null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + role))
                );
                SecurityContextHolder.getContext().setAuthentication(auth);
                
                /*
                SecurityContextHolder      // kho lưu trữ toàn cục của Spring Security
                .getContext()              // lấy ra SecurityContext của request hiện tại
                .setAuthentication(auth)   // lưu thông tin user đã xác thực vào đó
 
                 */
                //Sau khi setAuthentication(auth):
                // Bất kỳ chỗ nào trong code cũng có thể đọc được
                //SecurityContextHolder.getContext().getAuthentication().getName()
                // → "user@gmail.com"



            }
        }

        filterChain.doFilter(request, response); // cho request đi tiếp -> chuyển sang filter tiếp theo hoặc controller
        
    }
}