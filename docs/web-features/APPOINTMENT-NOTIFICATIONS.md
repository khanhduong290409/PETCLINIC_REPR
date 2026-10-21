# Thông báo lịch khám: Email + Trong app

> Tài liệu mô tả từng bước xây dựng chức năng thông báo lịch khám của PawCare.
> Phần email làm ngày 2026-10-15, phần trong app làm ngày 2026-10-21.
> Tiến độ / checklist kiểm thử xem ở [PROGRESS.md](PROGRESS.md) (mục 3 và 4).

---

## 1. Tổng quan

| | Email | Trong app (chuông) |
|---|---|---|
| Người nhận | Khách | Khách + bác sĩ |
| Khi nào | Đặt lịch thành công, nhắc trước 1 ngày | Mọi thay đổi của lịch (đặt, xác nhận, hủy, phân công, khám xong, nhắc lịch) |
| Kênh | Brevo HTTP API | Lưu DB + đẩy realtime bằng SSE |
| Thư viện mới | Không | Không |

```
              ┌──────────────────── AppointmentService (trong transaction) ────────────────────┐
 Khách/Admin  │ đổi dữ liệu lịch  ──►  AppointmentNotificationService.notifyXxx()               │
 /Bác sĩ ───► │                         └─► NotificationService.create()  ──► bảng notifications│
              └──────────────────────────────────────────┬─────────────────────────────────────┘
                                                         │ sau khi commit
                                                         ▼
                                    NotificationStreamService.sendToUser() ──SSE──► trình duyệt
                                                                                     (chuông + toast)
 Controller (sau khi service commit) ──► sendBookingCreatedEmail() ──► EmailService ──► Brevo ──► hộp thư
 Job 8h sáng ──► sendTomorrowReminders() ──► email nhắc + thông báo trong app
```

---

## 2. Phần A — Thông báo qua email

### Bước 1: Chọn cách gửi mail
- Gói free của Render **chặn cổng SMTP** (25/465/587), nên không dùng Gmail SMTP / `spring-boot-starter-mail` được.
- Chọn **Brevo HTTP API**: gửi mail bằng một request HTTPS, gọi bằng `RestTemplate` có sẵn trong Spring → không thêm thư viện.

### Bước 2: Cấu hình
`application.properties`:
```properties
brevo.api-key=${BREVO_API_KEY:}
mail.sender-email=${MAIL_SENDER_EMAIL:}
mail.sender-name=PawCare
```
- Đọc từ biến môi trường, không ghi key vào code.
- Để trống thì app vẫn chạy, chỉ ghi log "bỏ qua gửi mail" (máy dev không cần key).
- Trên Brevo: xác minh email người gửi (Senders) và tạo API key.

### Bước 3: `EmailService` — lớp gửi mail chung
File: `service/EmailService.java`
- Gửi `POST https://api.brevo.com/v3/smtp/email`, header `api-key`, body `{ sender, to, subject, htmlContent }`.
- **Đặt timeout** (kết nối 5s, đọc 10s): `RestTemplate` mặc định chờ vô hạn → Brevo treo thì request đặt lịch của khách treo theo.
- **Không bao giờ ném exception**, chỉ trả `true/false`: gửi mail lỗi không được làm hỏng việc đặt lịch.
- Bỏ qua email giả `@pawcare.local` của khách tại quầy (không có hộp thư thật).

### Bước 4: Nội dung mail — `AppointmentNotificationService`
File: `service/AppointmentNotificationService.java`
- Một lượt đặt có thể nhiều pet (nhiều `Appointment` chung `bookingCode`) → **gom theo `bookingCode`, mỗi lượt chỉ 1 mail**, liệt kê tất cả pet.
- Mail HTML dạng bảng: mã đặt lịch, ngày, giờ, thú cưng, dịch vụ, bác sĩ, ghi chú.
- **Escape HTML** tên pet, ghi chú (`HtmlUtils.htmlEscape`) vì đây là dữ liệu người dùng nhập — tránh chèn HTML vào mail.

### Bước 5: Mail "đặt lịch thành công"
- Gọi `sendBookingCreatedEmail(bookingCode)` ở **controller**, sau khi service đã trả về:
  - `AppointmentController.createAppointments` (khách đặt online)
  - `AdminController.createWalkInAppointments` (lịch tại quầy)
- Lý do gọi ở controller chứ không trong service: transaction của service đã **commit xong** → không gửi mail cho lịch bị rollback.
- Nội dung khác nhau theo trạng thái: `PENDING` → "đã nhận yêu cầu, chờ xác nhận"; `CONFIRMED` (tại quầy) → "đã đặt và xác nhận".

### Bước 6: Mail nhắc lịch trước 1 ngày
- Bật scheduler: `@EnableScheduling` trong `BackendPetApplication`.
- `sendTomorrowReminders()` chạy `@Scheduled(cron = "0 0 8 * * *", zone = "Asia/Ho_Chi_Minh")`.
  - Phải ghi rõ `zone`: server Render chạy giờ UTC, không ghi thì job chạy lúc 15h giờ VN.
  - "Ngày mai" cũng tính theo giờ VN: `LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).plusDays(1)`.
- Chỉ nhắc lịch `CONFIRMED` (lịch `PENDING` phòng khám chưa nhận).

### Bước 7: Chống gửi nhắc trùng
- Thêm cột `appointments.reminder_sent` (`Boolean`, **cho phép null**):
  - `ddl-auto=update` không thêm được cột `NOT NULL` vào bảng đã có dữ liệu → để null, hiểu null = chưa gửi.
- Query `findNotRemindedAppointments`: lịch đúng ngày, đúng trạng thái, `reminder_sent` null hoặc false.
- Chỉ set `reminder_sent = true` khi Brevo trả 2xx — gửi lỗi thì không đánh dấu.

---

## 3. Phần B — Thông báo trong app

### Bước 1: Chốt phạm vi và cách realtime
- Người nhận: **khách và bác sĩ** (admin chưa làm).
- Realtime bằng **SSE (Server-Sent Events)**: server đẩy một chiều xuống trình duyệt, đủ cho thông báo, đơn giản hơn WebSocket.
  - Backend: `SseEmitter` có sẵn trong Spring Web.
  - Frontend: `fetch` + đọc stream, có sẵn trong trình duyệt.
  - Render không ngủ (UptimeRobot ping định kỳ) nên giữ được kết nối lâu.
- Nguyên tắc quan trọng: **DB là nguồn sự thật, SSE chỉ là "tín hiệu"**. Mất kết nối thì lần nối lại tải lại từ DB → không mất thông báo.

### Bước 2: Bảng `notifications`
File: `entity/Notification.java`

| Cột | Ý nghĩa |
|---|---|
| `recipient_id` | Người nhận (có index để lấy nhanh theo người dùng) |
| `type` | `BOOKING_CREATED, CONFIRMED, CANCELLED, COMPLETED, DOCTOR_ASSIGNED, DOCTOR_UNASSIGNED, REMINDER` |
| `title`, `message` | Nội dung hiển thị |
| `link` | Trang mở khi bấm: khách `/appointments`, bác sĩ `/doctor/appointments` |
| `booking_code` | Lượt đặt liên quan |
| `is_read` | Đã đọc chưa (bảng mới nên để `NOT NULL` được) |

Kèm `NotificationRepository` (30 thông báo mới nhất, đếm chưa đọc, đánh dấu tất cả đã đọc) và `NotificationResponse` (DTO).

### Bước 3: `NotificationStreamService` — giữ kết nối SSE
- Lưu `Map<userId, danh sách SseEmitter>` trong bộ nhớ (1 user mở nhiều tab = nhiều emitter). Đủ dùng vì backend chạy 1 instance.
- Thêm / xóa emitter bằng `compute` / `computeIfPresent` để là thao tác nguyên tử — tránh mất emitter của tab vừa mở đúng lúc tab khác đóng.
- **Heartbeat** `: ping` mỗi 25s: proxy Render/Vercel cắt kết nối im lặng quá lâu.
- Timeout 30 phút rồi đóng, frontend tự mở lại. Khi hết giờ phải gọi `emitter.complete()`, nếu không Spring ném `AsyncRequestTimeoutException` và ghi log lỗi rác.

### Bước 4: `NotificationService` — lưu và đẩy
- `create(...)` lưu thông báo **trong cùng transaction** với thay đổi lịch: nghiệp vụ rollback thì thông báo cũng mất.
- Chỉ đẩy SSE **sau khi commit** (`TransactionSynchronization.afterCommit`): nếu đẩy sớm, trình duyệt gọi API tải lại có thể chưa thấy dữ liệu.
- `markRead` kiểm tra thông báo đúng là của người gọi, sai → 403.
- `createdAt` trả về dạng `Instant` (có hậu tố `Z`): server Render chạy UTC, máy dev giờ VN; `LocalDateTime` không kèm múi giờ sẽ làm "x phút trước" lệch 7 tiếng.

### Bước 5: Nội dung từng sự kiện
Thêm vào `AppointmentNotificationService` (dùng chung cách gom theo `bookingCode` và định dạng ngày giờ với phần email):

| Hàm | Gọi ở (`AppointmentService`) | Khách | Bác sĩ |
|---|---|---|---|
| `notifyBookingCreated` | `saveBookingGroup` (online + tại quầy) | ✔ | ✔ nếu lịch tại quầy có bác sĩ |
| `notifyStatusChanged` | `updateStatus` (admin) | ✔ xác nhận / hủy / hoàn thành | ✔ khi bị hủy |
| `notifyDoctorAssigned` | `assignDoctor` | ✔ | ✔ bác sĩ mới |
| `notifyDoctorUnassigned` | `unassignDoctor`, đổi bác sĩ | — | ✔ bác sĩ cũ |
| `notifyCancelledByCustomer` | `cancelAppointment` | — | ✔ |
| `notifyCompleted` | `completeAppointmentGroup` | ✔ | — |
| (nhắc lịch) | job 8h `sendTomorrowReminders` | ✔ không phụ thuộc email gửi được hay không | — |

Quy tắc tránh báo thừa: chọn lại đúng trạng thái / đúng bác sĩ đang có thì không báo; đưa lịch về `PENDING` không báo; khách bấm hủy lịch đã hủy không báo lại.

### Bước 6: API — `NotificationController`
`userId` luôn lấy từ JWT, không nhận từ URL/body.

| Method | URL | Việc |
|---|---|---|
| GET | `/api/notifications` | 30 thông báo mới nhất |
| GET | `/api/notifications/unread-count` | Số chưa đọc |
| PUT | `/api/notifications/{id}/read` | Đánh dấu 1 cái đã đọc |
| PUT | `/api/notifications/read-all` | Đánh dấu tất cả |
| GET | `/api/notifications/stream` | Kết nối SSE |

### Bước 7: Sửa `SecurityConfig`
- SSE gửi dữ liệu qua lượt dispatch **ASYNC**; `JwtAuthFilter` (`OncePerRequestFilter`) không chạy lại ở lượt đó → Spring Security chặn 403 giữa chừng.
- Thêm `dispatcherTypeMatchers(DispatcherType.ASYNC, DispatcherType.ERROR).permitAll()`. Lượt request đầu tiên vẫn kiểm tra JWT bình thường.

### Bước 8: Frontend — `api/notificationApi.ts`
- Các hàm gọi API theo pattern `appointmentApi.ts`.
- `openStream`: dùng **`fetch` thay cho `EventSource`** vì `EventSource` không gửi được header `Authorization` (phải đưa token lên URL → lộ token trong log).
- Tự tách event SSE: các event cách nhau bởi dòng trống, đọc dòng `event:` / `data:`, bỏ qua dòng `:` (heartbeat).
- Gặp 401/403 → báo lỗi riêng để không thử kết nối lại vô ích.

### Bước 9: Frontend — `contexts/NotificationContext.tsx`
- Khi user là USER/DOCTOR: **mở stream trước, tải danh sách sau** → thông báo phát sinh lúc mất kết nối có trong danh sách, thông báo mới đi qua stream.
- Stream đứt → chờ 5s nối lại (mỗi lần nối lại đều tải lại danh sách). Logout / đổi tài khoản → `AbortController.abort()` đóng stream.
- Thông báo mới: thêm đầu danh sách (bỏ qua nếu trùng id), tăng badge, hiện toast (dùng `ToastContext` có sẵn).
- `markRead` / `markAllRead`: cập nhật giao diện trước rồi mới gọi API cho mượt.

### Bước 10: Frontend — chuông và gắn vào app
- `components/NotificationBell.tsx`: icon chuông + badge số chưa đọc (quá 9 hiện "9+"), dropdown danh sách, chấm xanh = chưa đọc, thời gian dạng "5 phút trước", nút "Đánh dấu tất cả đã đọc". Bấm vào → đánh dấu đã đọc và chuyển tới `link`.
- `Navbar.tsx`: hiện chuông khi role là USER hoặc DOCTOR.
- `App.tsx`: bọc `NotificationProvider` bên trong `AuthProvider` (cần biết user đang đăng nhập).

---

## 4. Những cái bẫy đã gặp

| Bẫy | Hậu quả nếu không xử lý | Cách xử lý |
|---|---|---|
| Render chặn cổng SMTP | Không gửi được mail | Dùng Brevo HTTP API |
| `RestTemplate` không có timeout | Brevo treo → đặt lịch treo | Timeout 5s / 10s |
| Server chạy giờ UTC | Job chạy sai giờ, "ngày mai" sai, giờ thông báo lệch 7 tiếng | `zone` trong `@Scheduled`, `ZoneId` VN, trả `Instant` |
| Gửi mail trong transaction | Lịch rollback vẫn có mail | Gửi ở controller sau khi commit |
| Đẩy SSE trước khi commit | Trình duyệt tải lại không thấy thông báo | `afterCommit` |
| SSE + Spring Security | 403 ở lượt dispatch ASYNC | Mở `DispatcherType.ASYNC/ERROR` |
| Proxy cắt kết nối rảnh | Mất realtime sau vài chục giây | Heartbeat 25s |
| `EventSource` không gửi header | Phải để token trên URL | Đọc stream bằng `fetch` |
| VS Code Java extension build hỏng class Lombok | Backend không khởi động ("Flexible Constructor Bodies") | Tắt `java.autobuild.enabled`, build bằng `.\mvnw clean compile` |

---

## 5. Danh sách file

**Email**
- Mới: `service/EmailService`, `service/AppointmentNotificationService`
- Sửa: `entity/Appointment` (cột `reminder_sent`), `repository/AppointmentRepository`, `controller/AppointmentController`, `controller/AdminController`, `BackendPetApplication`, `application.properties`

**Trong app**
- Backend mới: `entity/Notification`, `repository/NotificationRepository`, `dto/NotificationResponse`, `service/NotificationService`, `service/NotificationStreamService`, `controller/NotificationController`
- Backend sửa: `service/AppointmentNotificationService`, `service/AppointmentService`, `config/SecurityConfig`
- Frontend mới: `api/notificationApi.ts`, `contexts/NotificationContext.tsx`, `components/NotificationBell.tsx`
- Frontend sửa: `components/layout/Navbar.tsx`, `App.tsx`

---

## 6. Cách kiểm thử nhanh

1. Đặt biến môi trường `BREVO_API_KEY`, `MAIL_SENDER_EMAIL`, chạy `cd backend_pet; .\mvnw clean spring-boot:run` và `cd fontend_pet; npm run dev`.
2. Mở 2 trình duyệt: một tài khoản khách, một tài khoản admin (thêm một tài khoản bác sĩ nếu được).
3. Khách đặt lịch → nhận mail + chuông có thông báo "Đã nhận yêu cầu đặt lịch".
4. Admin xác nhận và phân công bác sĩ → khách thấy toast + badge ngay, không cần F5; bác sĩ nhận "Bạn có lịch khám mới".
5. Bác sĩ bấm khám xong → khách nhận "Đã khám xong". Khách hủy một lịch khác → bác sĩ nhận "Khách đã hủy lịch".
6. Tắt backend 30s rồi bật lại → frontend tự nối lại, không mất thông báo.
7. Nhắc lịch: tạm đổi cron thành mỗi phút, có lịch `CONFIRMED` ngày mai → nhận 1 mail + 1 thông báo, `reminder_sent = true`.
