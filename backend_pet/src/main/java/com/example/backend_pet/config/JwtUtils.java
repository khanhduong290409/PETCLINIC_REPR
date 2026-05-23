package com.example.backend_pet.config;

import com.example.backend_pet.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtils {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    //có file giải thích về công dụng của jwts
    public String generateToken(User user) {
        return Jwts.builder()//header(chứa dạng mã hoá) và payload chỉ chuyển sang base64 còn lại signature thì được mã hoá bằng secret key
                .subject(user.getEmail())
                .claim("userId", user.getId())
                .claim("role", user.getRole().name())
                .claim("fullName", user.getFullName())
                .issuedAt(new Date())//ngày tạo token
                .expiration(new Date(System.currentTimeMillis() + expiration))//ngày hết hạn
                .signWith(getKey())//dùng secret key để mã hoá
                .compact();
    }

    //method dùng để giải mã JWT(token) để lấy dữ liệu bên trong ra
    public Claims extractClaims(String token) {
        return Jwts.parser()//tạo parser để đọc token
                .verifyWith(getKey())//set cái key này khi mã hoá
                .build()//tạo parser hoàn chỉnh
                .parseSignedClaims(token)//thực hiện tính lại signature và so sánh 2 signature cũ và mới sau đó mã hoá
                .getPayload();
    }

    /*
Jws<Claims>
├── getHeader()   → {"alg":"HS256"}
└── getPayload()  → Claims {
                        sub      = "user@gmail.com",
                        userId   = 42,
                        role     = "ADMIN",
                        iat      = Date(...),
                        exp      = Date(...)
                    }
     */
    public String extractEmail(String token) {
        return extractClaims(token).getSubject();// lấy email user
    }

    public String extractRole(String token) {
        return extractClaims(token).get("role", String.class);
    }

    public boolean isTokenValid(String token) {
        try {
            Claims claims = extractClaims(token);
            return claims.getExpiration().after(new Date());
        } catch (Exception e) {
            return false;
        }
    }
}