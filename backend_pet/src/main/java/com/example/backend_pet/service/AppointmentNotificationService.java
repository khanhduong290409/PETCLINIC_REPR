package com.example.backend_pet.service;

import com.example.backend_pet.entity.Appointment;
import com.example.backend_pet.entity.Notification;
import com.example.backend_pet.entity.PetService;
import com.example.backend_pet.entity.User;
import com.example.backend_pet.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.HtmlUtils;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// Thông báo lịch khám:
// - Email cho khách: khi đặt lịch thành công và nhắc trước ngày khám.
// - Thông báo trong app (chuông) cho khách và bác sĩ: mọi thay đổi của lịch.
// Mỗi lượt đặt (cùng bookingCode, có thể nhiều pet) chỉ gửi 1 email / 1 thông báo cho mỗi người nhận.
@Service
@RequiredArgsConstructor
public class AppointmentNotificationService {

    // Server Render chạy giờ UTC — phải tính "ngày mai" và giờ chạy job theo giờ Việt Nam
    private static final String CLINIC_TIME_ZONE = "Asia/Ho_Chi_Minh";

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");

    // Trang frontend mở khi bấm vào thông báo
    private static final String CUSTOMER_LINK = "/appointments";
    private static final String DOCTOR_LINK = "/doctor/appointments";

    private final AppointmentRepository appointmentRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;

    // Gọi từ controller SAU KHI transaction đặt lịch đã commit, để không gửi mail cho lịch bị rollback.
    // Bắt mọi lỗi: lịch đã lưu xong rồi, gửi mail hỏng thì khách vẫn phải nhận được kết quả đặt lịch.
    @Transactional(readOnly = true)
    public void sendBookingCreatedEmail(String bookingCode) {
        try {
            List<Appointment> group = appointmentRepository.findByBookingCode(bookingCode);
            if (group.isEmpty()) {
                return;
            }

            String introMessage;
            if (group.get(0).getStatus() == Appointment.AppointmentStatus.CONFIRMED) {
                // Lịch tại quầy do admin tạo được xác nhận luôn
                introMessage = "Lịch khám của bạn tại PawCare đã được đặt và xác nhận.";
            } else {
                introMessage = "PawCare đã nhận được yêu cầu đặt lịch khám của bạn. "
                        + "Phòng khám sẽ xác nhận và phân công bác sĩ trong thời gian sớm nhất.";
            }

            String subject = "[PawCare] Đặt lịch khám thành công - " + bookingCode;
            sendBookingEmail(group, subject, introMessage);
        } catch (Exception e) {
            System.err.println("Lỗi gửi email đặt lịch " + bookingCode + ": " + e.getMessage());
        }
    }

    // 8h sáng mỗi ngày: nhắc các lịch đã xác nhận của ngày mai.
    // Lịch còn PENDING không nhắc vì phòng khám chưa xác nhận là khám được.
    @Scheduled(cron = "0 0 8 * * *", zone = CLINIC_TIME_ZONE)
    @Transactional
    public void sendTomorrowReminders() {
        LocalDate tomorrow = LocalDate.now(ZoneId.of(CLINIC_TIME_ZONE)).plusDays(1);
        List<Appointment> appointments = appointmentRepository.findNotRemindedAppointments(
                tomorrow, Appointment.AppointmentStatus.CONFIRMED);

        Map<String, List<Appointment>> groupsByBookingCode = groupByBookingCode(appointments);

        int sentCount = 0;
        for (List<Appointment> group : groupsByBookingCode.values()) {
            // Thông báo trong app không phụ thuộc email gửi được hay không.
            // Job chạy 1 lần/ngày và hôm sau lịch không còn là "ngày mai" → không bị nhắc trùng
            notifyCustomer(group, Notification.NotificationType.REMINDER, "Nhắc lịch khám ngày mai",
                    "Bạn có " + describeBooking(group) + ". Vui lòng đến đúng giờ.");

            String bookingCode = group.get(0).getBookingCode();
            String subject = "[PawCare] Nhắc lịch khám ngày mai - " + bookingCode;
            String introMessage = "PawCare xin nhắc bạn có lịch khám vào ngày mai. "
                    + "Vui lòng đến đúng giờ, nếu không thể đến hãy hủy lịch trong mục \"Lịch khám của tôi\".";

            boolean sent = sendBookingEmail(group, subject, introMessage);
            // Chỉ đánh dấu khi gửi thành công — gửi lỗi thì lần chạy sau (nếu vẫn trước ngày khám) còn cơ hội gửi lại
            if (sent) {
                for (Appointment appointment : group) {
                    appointment.setReminderSent(true);
                    appointmentRepository.save(appointment);
                }
                sentCount++;
            }
        }

        System.out.println("Nhắc lịch ngày " + tomorrow.format(DATE_FORMAT) + ": đã gửi "
                + sentCount + "/" + groupsByBookingCode.size() + " email");
    }

    // ===== Thông báo trong app =====
    // Các hàm dưới được gọi từ AppointmentService, BÊN TRONG transaction của nghiệp vụ:
    // thông báo được lưu cùng lúc với thay đổi lịch, rollback thì mất cả hai.
    // group = toàn bộ appointment cùng bookingCode (cùng chủ, ngày giờ, bác sĩ — chỉ khác pet).

    // Lịch mới: khách online (PENDING) hoặc tại quầy (CONFIRMED, đã có bác sĩ)
    public void notifyBookingCreated(List<Appointment> group) {
        Appointment first = group.get(0);
        if (first.getStatus() == Appointment.AppointmentStatus.CONFIRMED) {
            notifyCustomer(group, Notification.NotificationType.CONFIRMED, "Đặt lịch khám thành công",
                    "Đã đặt và xác nhận " + describeBooking(group) + ".");
        } else {
            notifyCustomer(group, Notification.NotificationType.BOOKING_CREATED, "Đã nhận yêu cầu đặt lịch",
                    "PawCare đã nhận " + describeBooking(group)
                            + ". Phòng khám sẽ xác nhận và phân công bác sĩ sớm nhất.");
        }

        if (first.getDoctor() != null) {
            notifyDoctor(first.getDoctor(), group, Notification.NotificationType.DOCTOR_ASSIGNED,
                    "Bạn có lịch khám mới",
                    "Bạn được phân công " + describeBooking(group) + " của khách " + first.getUser().getFullName() + ".");
        }
    }

    // Admin đổi trạng thái cả lượt đặt
    public void notifyStatusChanged(List<Appointment> group, Appointment.AppointmentStatus newStatus) {
        Appointment first = group.get(0);
        if (newStatus == Appointment.AppointmentStatus.CONFIRMED) {
            notifyCustomer(group, Notification.NotificationType.CONFIRMED, "Lịch khám đã được xác nhận",
                    "Phòng khám đã xác nhận " + describeBooking(group) + ".");
        } else if (newStatus == Appointment.AppointmentStatus.CANCELLED) {
            notifyCustomer(group, Notification.NotificationType.CANCELLED, "Lịch khám đã bị hủy",
                    "Phòng khám đã hủy " + describeBooking(group) + ". Vui lòng liên hệ phòng khám nếu cần đặt lại.");
            if (first.getDoctor() != null) {
                notifyDoctor(first.getDoctor(), group, Notification.NotificationType.CANCELLED,
                        "Lịch khám đã bị hủy", "Phòng khám đã hủy " + describeBooking(group) + ".");
            }
        } else if (newStatus == Appointment.AppointmentStatus.COMPLETED) {
            notifyCompleted(group);
        }
        // PENDING (đưa lịch về chờ xác nhận): không báo, tránh làm khách bối rối
    }

    public void notifyDoctorAssigned(List<Appointment> group, User doctor) {
        notifyCustomer(group, Notification.NotificationType.DOCTOR_ASSIGNED, "Đã phân công bác sĩ",
                "Bác sĩ " + doctor.getFullName() + " sẽ phụ trách " + describeBooking(group) + ".");
        notifyDoctor(doctor, group, Notification.NotificationType.DOCTOR_ASSIGNED, "Bạn có lịch khám mới",
                "Bạn được phân công " + describeBooking(group) + " của khách " + group.get(0).getUser().getFullName() + ".");
    }

    // Chỉ báo bác sĩ cũ — với khách, lịch vẫn còn nguyên, chỉ chờ phân công lại
    public void notifyDoctorUnassigned(List<Appointment> group, User oldDoctor) {
        notifyDoctor(oldDoctor, group, Notification.NotificationType.DOCTOR_UNASSIGNED, "Lịch khám đã được chuyển",
                "Bạn không còn phụ trách " + describeBooking(group) + ".");
    }

    // Khách tự hủy → báo bác sĩ phụ trách (nếu đã phân công)
    public void notifyCancelledByCustomer(List<Appointment> group) {
        User doctor = group.get(0).getDoctor();
        if (doctor == null) {
            return;
        }
        notifyDoctor(doctor, group, Notification.NotificationType.CANCELLED, "Khách đã hủy lịch",
                "Khách " + group.get(0).getUser().getFullName() + " đã hủy " + describeBooking(group) + ".");
    }

    public void notifyCompleted(List<Appointment> group) {
        notifyCustomer(group, Notification.NotificationType.COMPLETED, "Đã khám xong",
                "Đã hoàn thành " + describeBooking(group) + ". Bạn có thể xem kết quả khám trong mục Lịch khám.");
    }

    private void notifyCustomer(List<Appointment> group, Notification.NotificationType type,
                                String title, String message) {
        Appointment first = group.get(0);
        notificationService.create(first.getUser(), type, title, message, CUSTOMER_LINK, first.getBookingCode());
    }

    private void notifyDoctor(User doctor, List<Appointment> group, Notification.NotificationType type,
                              String title, String message) {
        notificationService.create(doctor, type, title, message, DOCTOR_LINK, group.get(0).getBookingCode());
    }

    // Vd: "lịch khám ngày 22/10/2026 lúc 09:00 cho Lu, Mi"
    private String describeBooking(List<Appointment> group) {
        Appointment first = group.get(0);
        List<String> petNames = new ArrayList<>();
        for (Appointment appointment : group) {
            petNames.add(appointment.getPet().getName());
        }
        return "lịch khám ngày " + first.getAppointmentDate().format(DATE_FORMAT)
                + " lúc " + first.getAppointmentTime().format(TIME_FORMAT)
                + " cho " + String.join(", ", petNames);
    }

    // LinkedHashMap để giữ thứ tự như kết quả query
    private Map<String, List<Appointment>> groupByBookingCode(List<Appointment> appointments) {
        Map<String, List<Appointment>> groups = new LinkedHashMap<>();
        for (Appointment appointment : appointments) {
            String bookingCode = appointment.getBookingCode();
            if (!groups.containsKey(bookingCode)) {
                groups.put(bookingCode, new ArrayList<>());
            }
            groups.get(bookingCode).add(appointment);
        }
        return groups;
    }

    // Các appointment trong group cùng chủ, cùng ngày giờ, cùng dịch vụ, cùng bác sĩ — chỉ khác pet
    private boolean sendBookingEmail(List<Appointment> group, String subject, String introMessage) {
        User owner = group.get(0).getUser();
        String htmlContent = buildBookingHtml(group, introMessage);
        return emailService.sendEmail(owner.getEmail(), owner.getFullName(), subject, htmlContent);
    }

    private String buildBookingHtml(List<Appointment> group, String introMessage) {
        Appointment first = group.get(0);

        List<String> petNames = new ArrayList<>();
        for (Appointment appointment : group) {
            petNames.add(appointment.getPet().getName());
        }

        List<String> serviceTitles = new ArrayList<>();
        for (PetService service : first.getServices()) {
            serviceTitles.add(service.getTitle());
        }

        String doctorName;
        if (first.getDoctor() != null) {
            doctorName = first.getDoctor().getFullName();
        } else {
            doctorName = "Phòng khám sẽ phân công khi xác nhận lịch";
        }

        StringBuilder html = new StringBuilder();
        html.append("<div style=\"font-family: Arial, sans-serif; font-size: 15px; color: #333;\">");
        html.append("<p>Xin chào <b>").append(escape(first.getUser().getFullName())).append("</b>,</p>");
        html.append("<p>").append(escape(introMessage)).append("</p>");

        html.append("<table cellpadding=\"6\" style=\"border-collapse: collapse;\">");
        appendRow(html, "Mã đặt lịch", first.getBookingCode());
        appendRow(html, "Ngày khám", first.getAppointmentDate().format(DATE_FORMAT));
        appendRow(html, "Giờ khám", first.getAppointmentTime().format(TIME_FORMAT));
        appendRow(html, "Thú cưng", String.join(", ", petNames));
        appendRow(html, "Dịch vụ", String.join(", ", serviceTitles));
        appendRow(html, "Bác sĩ", doctorName);
        if (first.getNotes() != null && !first.getNotes().isBlank()) {
            appendRow(html, "Ghi chú", first.getNotes());
        }
        html.append("</table>");

        html.append("<p>Bạn có thể xem chi tiết trong mục \"Lịch khám của tôi\" trên website PawCare.</p>");
        html.append("<p>Trân trọng,<br>Phòng khám thú y PawCare</p>");
        html.append("</div>");
        return html.toString();
    }

    private void appendRow(StringBuilder html, String label, String value) {
        html.append("<tr>");
        html.append("<td style=\"color: #666;\">").append(escape(label)).append("</td>");
        html.append("<td><b>").append(escape(value)).append("</b></td>");
        html.append("</tr>");
    }

    // Tên pet, ghi chú... do người dùng nhập — phải escape để không chèn được HTML vào email
    private String escape(String text) {
        if (text == null) {
            return "";
        }
        // Truyền UTF-8 để chỉ escape ký tự đặc biệt (< > & " '), giữ nguyên chữ tiếng Việt
        return HtmlUtils.htmlEscape(text, "UTF-8");
    }
}
