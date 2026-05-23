package com.example.backend_pet.dto;

import lombok.Data;

@Data
public class OrderRequest {
    private Long userId;
    private String shippingAddress;
    private String paymentMethod; // "COD" hoặc "BANKING"
    private String notes;
    private String contactPhone;
}
