package com.example.backend_pet.controller;

import com.example.backend_pet.dto.AppointmentResponse;
import com.example.backend_pet.dto.CustomerSearchResponse;
import com.example.backend_pet.dto.DashboardResponse;
import com.example.backend_pet.dto.DayLockRequest;
import com.example.backend_pet.dto.DoctorResponse;
import com.example.backend_pet.dto.OrderResponse;
import com.example.backend_pet.dto.SlotAvailabilityResponse;
import com.example.backend_pet.dto.TimeSlotUpdateRequest;
import com.example.backend_pet.dto.UserResponse;
import com.example.backend_pet.dto.WalkInAppointmentRequest;
import com.example.backend_pet.entity.Pet;
import com.example.backend_pet.entity.User;
import com.example.backend_pet.repository.PetRepository;
import com.example.backend_pet.repository.UserRepository;
import com.example.backend_pet.service.AppointmentNotificationService;
import com.example.backend_pet.service.AppointmentService;
import com.example.backend_pet.service.DashboardService;
import com.example.backend_pet.service.OrderService;
import com.example.backend_pet.service.TimeSlotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AppointmentService appointmentService;
    private final AppointmentNotificationService appointmentNotificationService;
    private final UserRepository userRepository;
    private final PetRepository petRepository;
    private final OrderService orderService;
    private final DashboardService dashboardService;
    private final TimeSlotService timeSlotService;

    // GET /api/admin/dashboard - Số liệu tổng quan
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardResponse> getDashboard() {
        return ResponseEntity.ok(dashboardService.getDashboard());
    }

    // GET /api/admin/revenue?period=day|month|quarter|year
    @GetMapping("/revenue")
    public ResponseEntity<List<DashboardResponse.DailyRevenue>> getRevenue(
            @RequestParam(defaultValue = "day") String period) {
        return ResponseEntity.ok(dashboardService.getRevenue(period));
    }

    // GET /api/admin/orders - Lấy tất cả đơn hàng
    @GetMapping("/orders")
    public ResponseEntity<List<OrderResponse>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    // PUT /api/admin/orders/{id}/status?status=SHIPPED
    @PutMapping("/orders/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
    }

    // GET /api/admin/appointments - Lấy tất cả lịch khám
    @GetMapping("/appointments")
    public ResponseEntity<List<AppointmentResponse>> getAllAppointments() {
        return ResponseEntity.ok(appointmentService.getAllAppointments());
    }

    // PUT /api/admin/appointments/{id}/assign-doctor?doctorId=2
    @PutMapping("/appointments/{id}/assign-doctor")
    public ResponseEntity<List<AppointmentResponse>> assignDoctor(
            @PathVariable Long id,
            @RequestParam Long doctorId) {
        return ResponseEntity.ok(appointmentService.assignDoctor(id, doctorId));
    }

    // PUT /api/admin/appointments/{id}/unassign-doctor
    @PutMapping("/appointments/{id}/unassign-doctor")
    public ResponseEntity<List<AppointmentResponse>> unassignDoctor(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.unassignDoctor(id));
    }

    // PUT /api/admin/appointments/{id}/status?status=CONFIRMED
    @PutMapping("/appointments/{id}/status")
    public ResponseEntity<List<AppointmentResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        return ResponseEntity.ok(appointmentService.updateStatus(id, status));
    }

    // === Khách đặt tại quầy ===

    // GET /api/admin/customers/search?q=0901 - Tìm khách theo SĐT / email / tên, kèm danh sách pet
    @GetMapping("/customers/search")
    public ResponseEntity<List<CustomerSearchResponse>> searchCustomers(@RequestParam String q) {
        String keyword = q.trim();
        List<CustomerSearchResponse> result = new ArrayList<>();
        // Từ khóa quá ngắn sẽ trả về gần như toàn bộ user
        if (keyword.length() < 2) {
            return ResponseEntity.ok(result);
        }

        List<User> customers = userRepository.searchByKeyword(User.Role.USER, keyword);
        int maxResults = 10;
        for (User customer : customers) {
            if (result.size() >= maxResults) {
                break;
            }
            List<CustomerSearchResponse.PetInfo> pets = new ArrayList<>();
            for (Pet pet : petRepository.findByOwnerId(customer.getId())) {
                pets.add(new CustomerSearchResponse.PetInfo(pet.getId(), pet.getName(), pet.getSpecies().name()));
            }
            result.add(new CustomerSearchResponse(
                    customer.getId(), customer.getFullName(), customer.getPhone(), customer.getEmail(), pets));
        }
        return ResponseEntity.ok(result);
    }

    // POST /api/admin/walk-in-appointments - Tạo lịch cho khách tại quầy (đã xác nhận, có bác sĩ)
    @PostMapping("/walk-in-appointments")
    public ResponseEntity<List<AppointmentResponse>> createWalkInAppointments(
            @RequestBody WalkInAppointmentRequest request) {
        List<AppointmentResponse> created = appointmentService.createWalkInAppointments(request);
        // Khách mới tại quầy dùng email giả → EmailService tự bỏ qua; khách đã có tài khoản thật thì vẫn nhận mail
        appointmentNotificationService.sendBookingCreatedEmail(created.get(0).getBookingCode());
        return ResponseEntity.ok(created);
    }

    // === Quản lý khung giờ ===

    // GET /api/admin/slot-settings - Sức chứa mặc định hiện tại
    @GetMapping("/slot-settings")
    public ResponseEntity<Map<String, Integer>> getSlotSettings() {
        return ResponseEntity.ok(Map.of("defaultSlotCapacity", timeSlotService.getDefaultCapacity()));
    }

    // GET /api/admin/slot-settings/over-capacity?capacity=2
    // Số khung giờ sắp tới sẽ bị vượt nếu đổi mặc định sang capacity — để cảnh báo trước khi lưu
    @GetMapping("/slot-settings/over-capacity")
    public ResponseEntity<Map<String, Integer>> countSlotsOverCapacity(@RequestParam int capacity) {
        return ResponseEntity.ok(Map.of("count", timeSlotService.countSlotsOverCapacity(capacity)));
    }

    // PUT /api/admin/slot-settings?capacity=4 - Đổi sức chứa mặc định
    @PutMapping("/slot-settings")
    public ResponseEntity<Map<String, Integer>> updateSlotSettings(@RequestParam int capacity) {
        int savedCapacity = timeSlotService.updateDefaultCapacity(capacity);
        return ResponseEntity.ok(Map.of("defaultSlotCapacity", savedCapacity));
    }

    // GET /api/admin/time-slots?date=2026-10-10 - Tình trạng 19 khung giờ trong ngày
    @GetMapping("/time-slots")
    public ResponseEntity<List<SlotAvailabilityResponse>> getTimeSlots(@RequestParam String date) {
        return ResponseEntity.ok(timeSlotService.getAvailability(LocalDate.parse(date)));
    }

    // GET /api/admin/time-slots/appointments?date=2026-10-10&time=09:00 - Lịch trong một khung giờ
    @GetMapping("/time-slots/appointments")
    public ResponseEntity<List<AppointmentResponse>> getAppointmentsInSlot(
            @RequestParam String date,
            @RequestParam String time) {
        return ResponseEntity.ok(appointmentService.getAppointmentsInSlot(
                LocalDate.parse(date), LocalTime.parse(time)));
    }

    // PUT /api/admin/time-slots - Chỉnh riêng một khung giờ, trả về tình trạng cả ngày sau khi sửa
    @PutMapping("/time-slots")
    public ResponseEntity<List<SlotAvailabilityResponse>> updateTimeSlot(@RequestBody TimeSlotUpdateRequest request) {
        LocalDate date = LocalDate.parse(request.getDate());
        boolean disabled = Boolean.TRUE.equals(request.getDisabled());
        timeSlotService.updateSlot(date, LocalTime.parse(request.getTime()),
                request.getCapacity(), disabled, request.getNote());
        return ResponseEntity.ok(timeSlotService.getAvailability(date));
    }

    // PUT /api/admin/time-slots/day - Khóa / mở lại cả ngày
    @PutMapping("/time-slots/day")
    public ResponseEntity<List<SlotAvailabilityResponse>> setDayDisabled(@RequestBody DayLockRequest request) {
        LocalDate date = LocalDate.parse(request.getDate());
        boolean disabled = Boolean.TRUE.equals(request.getDisabled());
        timeSlotService.setDayDisabled(date, disabled, request.getNote());
        return ResponseEntity.ok(timeSlotService.getAvailability(date));
    }

    // GET /api/admin/doctors - Lấy danh sách bác sĩ (để admin chọn assign)
    @GetMapping("/doctors")
    public ResponseEntity<List<DoctorResponse>> getDoctors() {
        List<DoctorResponse> doctors = userRepository.findByRole(User.Role.DOCTOR)
                .stream()
                .map(d -> new DoctorResponse(d.getId(), d.getFullName(), d.getEmail()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(doctors);
    }

    // GET /api/admin/users - Lấy tất cả người dùng
    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = userRepository.findAll()
                .stream()
                .map(u -> new UserResponse(
                        u.getId(),
                        u.getFullName(),
                        u.getEmail(),
                        u.getPhone(),
                        u.getRole().name(),
                        u.getStatus().name()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    // PUT /api/admin/users/{id}/status?status=INACTIVE
    @PutMapping("/users/{id}/status")
    public ResponseEntity<UserResponse> updateUserStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
        user.setStatus(User.Status.valueOf(status));
        userRepository.save(user);
        return ResponseEntity.ok(new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole().name(),
                user.getStatus().name()
        ));
    }

    // PUT /api/admin/users/{id}/role?role=DOCTOR
    @PutMapping("/users/{id}/role")
    public ResponseEntity<UserResponse> updateUserRole(
            @PathVariable Long id,
            @RequestParam String role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
        user.setRole(User.Role.valueOf(role));
        userRepository.save(user);
        return ResponseEntity.ok(new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole().name(),
                user.getStatus().name()
        ));
    }
}
