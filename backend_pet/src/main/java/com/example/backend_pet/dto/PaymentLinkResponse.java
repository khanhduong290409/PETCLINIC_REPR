package com.example.backend_pet.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentLinkResponse {
    private long orderCode;
    private String checkoutUrl;
    private String qrCode;
    private String paymentLinkId;
    // paymentStatus: PENDING | PAID | CANCELLED
    private String paymentStatus;
}
