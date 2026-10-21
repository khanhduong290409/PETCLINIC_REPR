package com.example.backend_pet.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

// Kết quả tìm khách khi admin tạo lịch tại quầy — kèm danh sách pet để chọn luôn
@Data
@AllArgsConstructor
public class CustomerSearchResponse {
    private Long id;
    private String fullName;
    private String phone;
    private String email;
    private List<PetInfo> pets;

    @Data
    @AllArgsConstructor
    public static class PetInfo {
        private Long id;
        private String name;
        private String species;
    }
}
