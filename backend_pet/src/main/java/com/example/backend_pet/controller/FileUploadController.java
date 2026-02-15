package com.example.backend_pet.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
public class FileUploadController {

    // Thư mục lưu file upload (dùng absolute path để tránh Tomcat resolve sai)
    private final Path uploadPath = Paths.get(System.getProperty("user.dir"), "uploads").toAbsolutePath();

    // POST /api/upload - Upload 1 file ảnh, trả về URL
    @PostMapping
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) throws IOException {
        // Kiểm tra file trống
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File trống"));
        }

        // Kiểm tra loại file (chỉ cho phép ảnh)
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Chỉ cho phép upload ảnh"));
        }

        // Tạo thư mục uploads nếu chưa có
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Tạo tên file duy nhất: UUID + đuôi file gốc
        String originalName = file.getOriginalFilename();
        String extension = "";
        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf("."));
        }
        String newFileName = UUID.randomUUID() + extension;

        // Lưu file vào thư mục uploads (absolute path)
        Path filePath = uploadPath.resolve(newFileName);
        file.transferTo(filePath.toFile());

        // Trả về URL để frontend lưu vào pet
        String fileUrl = "/uploads/" + newFileName;
        return ResponseEntity.ok(Map.of("url", fileUrl));
    }
}
