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

    // Thông tin hiển thị trong modal thanh toán
    private String orderNumber;      // VD: ORD-20260208143025-1
    private String transferContent;  // VD: SEVQR ORD-20260208143025-1 -> NỘI DUNG CHUYỂN KHOẢN
    private String accountNumber;    // Số tài khoản ngân hàng
    private String bankName;         // Tên ngân hàng
    private int amount;              // Số tiền (VND)
}
