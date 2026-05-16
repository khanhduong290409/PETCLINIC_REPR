package com.example.backend_pet.service;

import com.example.backend_pet.dto.DashboardResponse;
import com.example.backend_pet.entity.Appointment;
import com.example.backend_pet.entity.Order;
import com.example.backend_pet.entity.User;
import com.example.backend_pet.repository.AppointmentRepository;
import com.example.backend_pet.repository.OrderRepository;
import com.example.backend_pet.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collector;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final OrderRepository orderRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;

    /**
     * GET /api/admin/dashboard — trả về toàn bộ data cho trang Dashboard Admin.
     * Bao gồm: 6 thẻ KPI, biểu đồ doanh thu 30 ngày, 2 biểu đồ trạng thái,
     * top 5 sản phẩm, 5 đơn mới nhất, 5 lịch khám sắp tới.
     */
    public DashboardResponse getDashboard() {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfToday = today.atStartOfDay();      // 2026-05-15T00:00:00
        LocalDateTime startOfMonth = today.withDayOfMonth(1).atStartOfDay(); // 2026-05-01T00:00:00

        List<Order> allOrders = orderRepository.findAll();
        List<Appointment> allAppointments = appointmentRepository.findAll();

        // ── 6 thẻ KPI ────────────────────────────────────────────────────────
        long totalOrders       = allOrders.size();                             // Thẻ "Tổng đơn hàng"
        long todayOrders       = allOrders.stream()
                .filter(o -> !o.getCreatedAt().isBefore(startOfToday))
                .count();                                                       // Thẻ "Đơn hôm nay"

        long totalAppointments = allAppointments.size();                       // Thẻ "Tổng lịch khám"
        long todayAppointments = allAppointments.stream()
                .filter(a -> a.getAppointmentDate().equals(today))
                .count();                                                       // Thẻ "Lịch khám hôm nay"

        long totalCustomers    = userRepository.findByRole(User.Role.USER).size(); // Thẻ "Tổng khách hàng"

        // Thẻ "Doanh thu tháng này" — chỉ tính đơn DELIVERED trong tháng hiện tại
        BigDecimal revenueThisMonth = allOrders.stream()
                .filter(o -> !o.getCreatedAt().isBefore(startOfMonth)
                        && o.getStatus() == Order.OrderStatus.DELIVERED)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // ── Biểu đồ doanh thu 30 ngày (chart đường) ──────────────────────────
        // Map: ngày → tổng doanh thu trong ngày đó (chỉ đơn DELIVERED)
        LocalDate thirtyDaysAgo = today.minusDays(29);
        Map<LocalDate, BigDecimal> revenueMap = allOrders.stream()
                .filter(o -> !o.getCreatedAt().toLocalDate().isBefore(thirtyDaysAgo)
                        && o.getStatus() == Order.OrderStatus.DELIVERED)
                .collect(Collectors.groupingBy(
                        o -> o.getCreatedAt().toLocalDate(),
                        Collectors.reducing(BigDecimal.ZERO, Order::getTotalAmount, BigDecimal::add)
                ));

        // Đảm bảo đủ 30 điểm ngày, mỗi điểm ngày trả về tổng thu nhập ngày đó
        List<DashboardResponse.DailyRevenue> revenueByDay = new ArrayList<>();
        for (int i = 29; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            revenueByDay.add(DashboardResponse.DailyRevenue.builder()
                    .date(date.toString())
                    .revenue(revenueMap.getOrDefault(date, BigDecimal.ZERO))//.getOrDefault giống get trong map nhưng dùng orDefault vì 
                    .build());//nó trả về 0 nếu ko tìm được value trong key đó 
        }

        // ── Biểu đồ tròn: trạng thái đơn hàng ───────────────────────────────
        // Mỗi phần tử = { status: "PENDING", count: 12 } → hiển thị pie chart
        Map<Order.OrderStatus, Long> orderStatusMap = allOrders.stream()
                .collect(Collectors.groupingBy(Order::getStatus, Collectors.counting()));
        List<DashboardResponse.StatusCount> orderStatusCounts = Arrays.stream(Order.OrderStatus.values())
                .map(s -> DashboardResponse.StatusCount.builder()
                        .status(s.name())
                        .count(orderStatusMap.getOrDefault(s, 0L))
                        .build())
                .collect(Collectors.toList());

        // ── Biểu đồ tròn: trạng thái lịch khám ──────────────────────────────
        // Mỗi phần tử = { status: "CONFIRMED", count: 5 } → hiển thị pie chart
        Map<Appointment.AppointmentStatus, Long> apptStatusMap = allAppointments.stream()
                .collect(Collectors.groupingBy(Appointment::getStatus, Collectors.counting()));
        List<DashboardResponse.StatusCount> appointmentStatusCounts = Arrays.stream(Appointment.AppointmentStatus.values())
                .map(s -> DashboardResponse.StatusCount.builder()
                        .status(s.name())
                        .count(apptStatusMap.getOrDefault(s, 0L))
                        .build())
                .collect(Collectors.toList());

        // ── Bảng Top 5 sản phẩm bán chạy ─────────────────────────────────────
        // Gộp tất cả items trong tất cả đơn, đếm tổng quantity theo tên sản phẩm
        /**
Order1.getItems().stream() → [ItemA, ItemB]
Order2.getItems().stream() → [ItemC]
Order3.getItems().stream() → [ItemD, ItemE]
 Nếu chỉ dùng .map():
 stream of streams: [[ItemA, ItemB], [ItemC], [ItemD, ItemE]]
flatMap mới là thứ gộp tất cả lại thành 1 stream duy nhất:
flatMap → [ItemA, ItemB, ItemC, ItemD, ItemE]

         */
        Map<String, Long> productSaleMap = allOrders.stream()
                .flatMap(o -> o.getItems().stream())
                .collect(Collectors.groupingBy(
                        item -> item.getProduct().getName(),
                        Collectors.summingLong(item -> item.getQuantity().longValue())
                ));
        List<DashboardResponse.ProductSale> topProducts = productSaleMap.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed()) //reversed để đảo ngược comparing từ tăng dần -> giảm dần
                .limit(5)
                .map(e -> DashboardResponse.ProductSale.builder()
                        .productName(e.getKey())
                        .totalQuantity(e.getValue())
                        .build())
                .collect(Collectors.toList());

        // ── Bảng 5 đơn hàng mới nhất ─────────────────────────────────────────
        List<DashboardResponse.RecentOrder> recentOrders = allOrders.stream()
                .sorted(Comparator.comparing(Order::getCreatedAt).reversed()) // mới nhất lên đầu
                .limit(5)
                .map(o -> DashboardResponse.RecentOrder.builder()
                        .orderNumber(o.getOrderNumber())
                        .userName(o.getUser().getFullName())
                        .totalAmount(o.getTotalAmount())
                        .status(o.getStatus().name())
                        .createdAt(o.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        // ── Bảng 5 lịch khám sắp tới ─────────────────────────────────────────
        // Lọc: từ hôm nay trở đi + không bị CANCELLED, sắp xếp ngày/giờ tăng dần
        List<DashboardResponse.UpcomingAppointment> upcomingAppointments = allAppointments.stream()
                .filter(a -> !a.getAppointmentDate().isBefore(today)
                        && a.getStatus() != Appointment.AppointmentStatus.CANCELLED)
                .sorted(Comparator.comparing(Appointment::getAppointmentDate)
                        .thenComparing(Appointment::getAppointmentTime))
                .limit(5)
                .map(a -> DashboardResponse.UpcomingAppointment.builder()
                        .bookingCode(a.getBookingCode())
                        .petName(a.getPet().getName())
                        .ownerName(a.getUser().getFullName())
                        .appointmentDate(a.getAppointmentDate())
                        .appointmentTime(a.getAppointmentTime())
                        .status(a.getStatus().name())
                        .build())
                .collect(Collectors.toList());

        return DashboardResponse.builder()
                .totalOrders(totalOrders)
                .todayOrders(todayOrders)
                .totalAppointments(totalAppointments)
                .todayAppointments(todayAppointments)
                .totalCustomers(totalCustomers)
                .revenueThisMonth(revenueThisMonth)
                .revenueByDay(revenueByDay)
                .orderStatusCounts(orderStatusCounts)
                .appointmentStatusCounts(appointmentStatusCounts)
                .topProducts(topProducts)
                .recentOrders(recentOrders)
                .upcomingAppointments(upcomingAppointments)
                .build();
    }

    /**
     * GET /api/admin/dashboard/revenue?period=day|month|quarter|year
     * Trả về doanh thu theo kỳ — dùng cho chart đường có bộ lọc thời gian.
     * period="day"     → 30 ngày gần nhất
     * period="month"   → 12 tháng gần nhất
     * period="quarter" → 8 quý gần nhất
     * period="year"    → từ năm đầu tiên có đơn đến nay
     */
    public List<DashboardResponse.DailyRevenue> getRevenue(String period) {
        List<Order> delivered = orderRepository.findAll().stream()
                .filter(o -> o.getStatus() == Order.OrderStatus.DELIVERED)
                .collect(Collectors.toList());

        return switch (period) {
            case "month"   -> revenueByMonth(delivered);
            case "quarter" -> revenueByQuarter(delivered);
            case "year"    -> revenueByYear(delivered);
            default        -> revenueByDay(delivered); // mặc định = "day"
        };
    }

    // Doanh thu 30 ngày gần nhất — mỗi điểm = 1 ngày
    private List<DashboardResponse.DailyRevenue> revenueByDay(List<Order> orders) {
        LocalDate today = LocalDate.now();
        LocalDate from = today.minusDays(29);
        Map<LocalDate, BigDecimal> map = orders.stream()
                .filter(o -> !o.getCreatedAt().toLocalDate().isBefore(from))
                .collect(Collectors.groupingBy(
                        o -> o.getCreatedAt().toLocalDate(),
                        Collectors.reducing(BigDecimal.ZERO, Order::getTotalAmount, BigDecimal::add)
                ));
        List<DashboardResponse.DailyRevenue> result = new ArrayList<>();
        for (int i = 29; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            result.add(build(d.toString(), map.getOrDefault(d, BigDecimal.ZERO)));
        }
        return result;
    }

    // Doanh thu 12 tháng gần nhất — mỗi điểm = 1 tháng (label: "2026-05")
    private List<DashboardResponse.DailyRevenue> revenueByMonth(List<Order> orders) {
        YearMonth current = YearMonth.now();
        YearMonth from = current.minusMonths(11);
        Map<YearMonth, BigDecimal> map = orders.stream()
                .filter(o -> {
                    YearMonth ym = YearMonth.from(o.getCreatedAt());
                    return !ym.isBefore(from);
                })
                .collect(Collectors.groupingBy(
                        o -> YearMonth.from(o.getCreatedAt()),
                        Collectors.reducing(BigDecimal.ZERO, Order::getTotalAmount, BigDecimal::add)
                ));
        List<DashboardResponse.DailyRevenue> result = new ArrayList<>();
        for (int i = 11; i >= 0; i--) {
            YearMonth ym = current.minusMonths(i);
            result.add(build(ym.toString(), map.getOrDefault(ym, BigDecimal.ZERO)));
        }
        return result;
    }

    // Doanh thu 8 quý gần nhất — mỗi điểm = 1 quý (label: "2026-Q2")
    private List<DashboardResponse.DailyRevenue> revenueByQuarter(List<Order> orders) {
        LocalDate today = LocalDate.now();
        List<String> labels = new ArrayList<>();
        for (int i = 7; i >= 0; i--) {
            LocalDate d = today.minusMonths((long) i * 3);
            int q = (d.getMonthValue() - 1) / 3 + 1;
            String label = d.getYear() + "-Q" + q;
            if (!labels.contains(label)) labels.add(label);
        }
        Map<String, BigDecimal> map = orders.stream()
                .collect(Collectors.groupingBy(
                        o -> {
                            LocalDate d = o.getCreatedAt().toLocalDate();
                            int q = (d.getMonthValue() - 1) / 3 + 1;
                            return d.getYear() + "-Q" + q;
                        },
                        Collectors.reducing(BigDecimal.ZERO, Order::getTotalAmount, BigDecimal::add)
                ));
        return labels.stream()
                .map(label -> build(label, map.getOrDefault(label, BigDecimal.ZERO)))
                .collect(Collectors.toList());
    }

    // Doanh thu theo năm — từ năm đầu tiên có đơn đến năm hiện tại (label: "2025")
    private List<DashboardResponse.DailyRevenue> revenueByYear(List<Order> orders) {
        int currentYear = LocalDate.now().getYear();
        Map<Integer, BigDecimal> map = orders.stream()
                .collect(Collectors.groupingBy(
                        o -> o.getCreatedAt().getYear(),
                        Collectors.reducing(BigDecimal.ZERO, Order::getTotalAmount, BigDecimal::add)
                ));
        int minYear = map.isEmpty() ? currentYear : Collections.min(map.keySet());
        List<DashboardResponse.DailyRevenue> result = new ArrayList<>();
        for (int y = minYear; y <= currentYear; y++) {
            result.add(build(String.valueOf(y), map.getOrDefault(y, BigDecimal.ZERO)));
        }
        return result;
    }

    // Helper: tạo 1 điểm dữ liệu { date, revenue } cho chart
    private DashboardResponse.DailyRevenue build(String date, BigDecimal revenue) {
        return DashboardResponse.DailyRevenue.builder().date(date).revenue(revenue).build();
    }
}