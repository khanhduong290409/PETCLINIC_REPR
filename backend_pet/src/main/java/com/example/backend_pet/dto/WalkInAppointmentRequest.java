package com.example.backend_pet.dto;

import lombok.Data;

import java.util.List;

// Admin tạo lịch cho khách đến đặt trực tiếp tại quầy
@Data
public class WalkInAppointmentRequest {
    // Khách đã có tài khoản → gửi customerId.
    // Khách mới → để customerId null, gửi newCustomerName + newCustomerPhone
    private Long customerId;
    private String newCustomerName;
    private String newCustomerPhone;

    // Pet đã có của khách (có thể rỗng nếu chỉ thêm pet mới)
    private List<Long> petIds;
    // Thêm nhanh 1 pet mới (để trống nếu không cần)
    private String newPetName;
    private String newPetSpecies;   // DOG, CAT, ...

    private List<Long> serviceIds;
    private String appointmentDate; // "2026-10-10"
    private String appointmentTime; // "09:00"
    private Long doctorId;
    private String notes;
}
