package com.example.backend_pet.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
public class DashboardResponse {

    // ── KPI thẻ tóm tắt (hiển thị 6 thẻ số trên cùng) ──────────────────────
    private long totalOrders;           // Tổng đơn hàng (tất cả thời gian)
    private long todayOrders;           // Đơn hàng hôm nay
    private long totalAppointments;     // Tổng lịch khám (tất cả thời gian)
    private long todayAppointments;     // Lịch khám hôm nay
    private long totalCustomers;        // Tổng số khách hàng (role=USER)
    private BigDecimal revenueThisMonth;// Doanh thu tháng này (chỉ đơn DELIVERED)

    // ── Biểu đồ doanh thu ───────────────────────────────────────────────────
    private List<DailyRevenue> revenueByDay;        // Doanh thu theo ngày/tháng/quý/năm — dùng cho chart đường

    // ── Biểu đồ tròn (pie/donut) trạng thái ────────────────────────────────
    private List<StatusCount> orderStatusCounts;        // Phân bổ trạng thái đơn hàng  (PENDING/CONFIRMED/...)
    private List<StatusCount> appointmentStatusCounts;  // Phân bổ trạng thái lịch khám (PENDING/CONFIRMED/CANCELLED)

    // ── Bảng / danh sách ────────────────────────────────────────────────────
    private List<ProductSale> topProducts;              // Top 5 sản phẩm bán chạy nhất (theo số lượng)
    private List<RecentOrder> recentOrders;             // 5 đơn hàng mới nhất
    private List<UpcomingAppointment> upcomingAppointments; // 5 lịch khám sắp tới (từ hôm nay)

    // ── Inner classes ────────────────────────────────────────────────────────

    @Data
    @Builder
    public static class DailyRevenue {
        private String date;        // Nhãn thời gian: "2026-05-15" | "2026-05" | "2026-Q2" | "2026"
        private BigDecimal revenue; // Doanh thu tương ứng (chỉ đơn DELIVERED)
    }

    @Data
    @Builder
    public static class StatusCount {
        private String status; // Tên trạng thái: "PENDING", "CONFIRMED", "DELIVERED", "CANCELLED", ...
        private long count;    // Số lượng đơn/lịch có trạng thái đó
    }

    @Data
    @Builder
    public static class ProductSale {
        private String productName; // Tên sản phẩm
        private long totalQuantity; // Tổng số lượng đã bán (gộp tất cả đơn hàng)
    }

    @Data
    @Builder
    public static class RecentOrder {
        private String orderNumber;      // Mã đơn hàng (VD: ORD-20260515-001)
        private String userName;         // Tên khách hàng đặt đơn
        private BigDecimal totalAmount;  // Tổng tiền đơn hàng
        private String status;           // Trạng thái đơn: "PENDING" / "DELIVERED" / ...
        private LocalDateTime createdAt; // Thời điểm tạo đơn
    }

    @Data
    @Builder
    public static class UpcomingAppointment {
        private String bookingCode;         // Mã lịch khám (VD: APT-20260515-001)
        private String petName;             // Tên thú cưng
        private String ownerName;           // Tên chủ thú cưng
        private LocalDate appointmentDate;  // Ngày hẹn khám
        private LocalTime appointmentTime;  // Giờ hẹn khám
        private String status;              // Trạng thái: "PENDING" / "CONFIRMED"
    }
}