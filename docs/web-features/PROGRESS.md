# Tiến độ — các chức năng web (ngoài phần AI)

> Tiến độ của phần AI chẩn đoán xem ở [`docs/ai-disease-prediction/PROGRESS.md`](../ai-disease-prediction/PROGRESS.md).
> Chỉ tick `[x]` khi đã thực sự chạy được.
> Cách làm từng bước chức năng thông báo lịch khám (email + trong app): [`APPOINTMENT-NOTIFICATIONS.md`](APPOINTMENT-NOTIFICATIONS.md).

## Bảng điều khiển

| | |
|---|---|
| **Cập nhật lần cuối** | 2026-10-21 |
| **Trạng thái code** | Xong, build sạch, **chưa commit** |
| **Đã test tay** | Đặt lịch giới hạn slot, trang admin khung giờ, lịch tuần bác sĩ |
| **Chưa test** | Đặt đồng thời 2 request, chặn quyền API (403), khách tại quầy end-to-end |

---

## 1. Quản lý khung giờ đặt lịch

**Quyết định thiết kế**
- Sức chứa **đếm theo số pet** (mỗi pet = 1 `Appointment` = 1 chỗ). Một lượt nhiều pet vẫn chỉ 1 bác sĩ — chấp nhận ở quy mô đồ án.
- Hai tầng: `clinic_settings.default_slot_capacity` (mặc định 3) + `time_slots.capacity` chỉnh riêng (`null` = theo mặc định).
- **Không lưu bộ đếm** số đã đặt — luôn đếm trực tiếp từ `appointments` (trạng thái khác `CANCELLED`), tránh lệch khi đổi trạng thái ở nhiều chỗ.
- Chống đặt trùng: khóa dòng `time_slots` (`INSERT ... ON CONFLICT DO NOTHING` + `SELECT ... FOR UPDATE`) — `TimeSlotService.lockSlot`.
- Đổi sức chứa mặc định **không hủy lịch nào**; slot đang vượt chỉ chuyển sang "đầy", có modal cảnh báo trước khi lưu.
- Khóa slot / khóa ngày **không tự hủy** lịch đã đặt — admin tự liên hệ khách.
- Khách tại quầy = lịch hẹn thật do admin tạo (`CONFIRMED`, có bác sĩ), chiếm chỗ chung với khách online. Khách chưa có tài khoản → tạo user `walkin-<sđt>@pawcare.local`, mật khẩu ngẫu nhiên.
- Khách online **không chọn bác sĩ**; admin phân công. Chặn 1 bác sĩ nhận 2 lượt cùng ngày + giờ.

**Đã xong**
- [x] Backend: `ClinicSetting`, `TimeSlot`, `TimeSlotService`, availability API, kiểm tra sức chứa khi đặt / khôi phục lịch hủy
- [x] `POST /api/appointments` lấy `userId` từ JWT (trước đây nhận từ body — lỗ hổng)
- [x] Trang đặt lịch: lưới giờ lấy từ backend, hiện "Còn X chỗ / Đầy / Khóa / Đã qua"
- [x] Trang admin `/admin/time-slots`: sức chứa mặc định, chỉnh riêng / khóa slot, khóa cả ngày
- [x] Modal "Tạo lịch tại quầy" trong trang Quản lý lịch khám; dropdown bác sĩ chỉ hiện bác sĩ rảnh
- [x] `ConfirmModal` dùng chung — thay toàn bộ `alert` / `confirm` / `prompt` trong project

## 2. Lịch tuần cho bác sĩ + vá bảo mật

- [x] `DoctorWeekSchedule.tsx`: lưới 7 ngày × 19 khung giờ, nút chuyển "Danh sách | Lịch tuần" ở `/doctor/appointments` (chỉ frontend)
- [x] `/api/doctor/**` chỉ role DOCTOR, `doctorId` lấy từ JWT (trước đây nhận từ URL)
- [x] `POST /api/medical/**` chỉ bác sĩ được phân công lịch đó mới ghi được bệnh án

## 3. Thông báo lịch khám qua email (2026-10-15 — code xong, build sạch, chưa test runtime)

**Quyết định thiết kế**
- Gửi qua **Brevo HTTP API** bằng `RestTemplate`, không dùng SMTP: Render free chặn cổng SMTP. Không thêm thư viện.
- 2 loại mail: **đặt lịch thành công** (online + tại quầy) và **nhắc trước 1 ngày** (job 8h sáng giờ VN, chỉ lịch `CONFIRMED`).
- Mỗi lượt đặt (`bookingCode`) chỉ gửi 1 mail, liệt kê tất cả pet.
- Mail đặt lịch được gửi ở **controller, sau khi service đã commit**. Gửi lỗi chỉ ghi log, không làm hỏng việc đặt lịch.
- Bỏ qua email giả `@pawcare.local` của khách tại quầy.
- Cột `appointments.reminder_sent` (cho phép null, null = chưa gửi) chống nhắc trùng; chỉ set `true` khi Brevo trả 2xx.
- Thiếu `BREVO_API_KEY` thì chỉ ghi log "bỏ qua", app vẫn chạy.

**File**: mới `service/EmailService`, `service/AppointmentNotificationService`; sửa `entity/Appointment`, `AppointmentRepository`, `AppointmentController`, `AdminController`, `BackendPetApplication` (`@EnableScheduling`), `application.properties`.

**Cần làm trước khi test**
- [ ] Đăng ký Brevo, xác minh email người gửi (Senders), tạo API key
- [ ] Đặt biến môi trường `BREVO_API_KEY`, `MAIL_SENDER_EMAIL` (local + Render)

**Kiểm thử**
- [ ] Đặt lịch online bằng tài khoản email thật → nhận mail (kiểm tra cả Spam)
- [ ] Lịch tại quầy khách mới → log "bỏ qua", API vẫn 200
- [ ] Sai api key → đặt lịch vẫn thành công, log báo lỗi
- [ ] Nhắc lịch: tạm đổi cron thành mỗi phút, lịch `CONFIRMED` ngày mai → nhận 1 mail, `reminder_sent = true`, lần sau không gửi lại

## 4. Thông báo lịch khám trong app (2026-10-21 — code xong, build sạch, chưa test runtime)

**Quyết định thiết kế**
- Chuông trên Navbar cho **khách (USER) và bác sĩ (DOCTOR)**; admin chưa có.
- Realtime bằng **SSE** (`SseEmitter` của Spring + `fetch` đọc stream) — không thêm thư viện. Frontend dùng `fetch` chứ không dùng `EventSource` để gửi JWT qua header, không để token trên URL.
- **DB là nguồn sự thật**, SSE chỉ là tín hiệu: mỗi lần (kết nối lại) frontend tải lại danh sách + số chưa đọc → mất kết nối không mất thông báo. Đứt kết nối thì 5s sau tự nối lại; 401/403 thì dừng.
- Thông báo được lưu **trong transaction** của nghiệp vụ (rollback thì mất cả hai), chỉ đẩy SSE **sau khi commit** (`TransactionSynchronization.afterCommit`).
- 1 thông báo / lượt đặt (`bookingCode`) / người nhận. Chọn lại đúng trạng thái / đúng bác sĩ đang có → không báo.
- Emitter lưu trong bộ nhớ (đủ vì Render 1 instance), heartbeat `: ping` mỗi 25s, timeout 30 phút.
- `SecurityConfig` mở dispatcher `ASYNC`/`ERROR`: lượt async của SSE không chạy lại `JwtAuthFilter`, không mở thì bị chặn 403 giữa chừng.
- `createdAt` trả về dạng `Instant` (có `Z`) vì Render chạy UTC, máy dev giờ VN.

**Sự kiện**: đặt lịch online / tại quầy, admin đổi trạng thái (xác nhận / hủy / hoàn thành), phân công / bỏ phân công / đổi bác sĩ, khách hủy (báo bác sĩ), bác sĩ khám xong, nhắc lịch ngày mai (job 8h, không phụ thuộc email).

**File**: backend mới `entity/Notification`, `repository/NotificationRepository`, `dto/NotificationResponse`, `service/NotificationService`, `service/NotificationStreamService`, `controller/NotificationController`; sửa `service/AppointmentNotificationService`, `service/AppointmentService`, `config/SecurityConfig`. Frontend mới `api/notificationApi.ts`, `contexts/NotificationContext.tsx`, `components/NotificationBell.tsx`; sửa `components/layout/Navbar.tsx`, `App.tsx`.

**Kiểm thử**
- [ ] 2 trình duyệt: khách đặt lịch → admin xác nhận + phân công → khách thấy toast + badge ngay, bác sĩ nhận thông báo phân công
- [ ] Bác sĩ khám xong → khách nhận; khách hủy → bác sĩ nhận
- [ ] Bấm thông báo → đúng trang, badge giảm; "Đánh dấu tất cả" → F5 vẫn 0
- [ ] Tắt backend rồi bật lại → frontend tự nối lại, thông báo phát sinh lúc mất kết nối vẫn hiện
- [ ] `PUT /api/notifications/{id}/read` với id của người khác → 403
- [ ] DevTools: request `/stream` giữ mở, thấy `: ping` mỗi 25s; sau deploy giữ được > 1 phút qua Render

---

## Việc còn lại

### Kiểm thử
- [ ] Đặt đồng thời: slot còn 1 chỗ, 2 request cùng lúc → đúng 1 thành công
- [ ] Token khách gọi `GET /api/doctor/appointments` và `POST /api/medical/{id}` → 403
- [ ] Bác sĩ A lưu bệnh án lịch của bác sĩ B → bị từ chối
- [ ] Tạo lịch tại quầy cho khách mới → bác sĩ thấy lịch và ghi được bệnh án

### Bảo mật còn mở
- [ ] **`GET /api/medical/...` chưa kiểm tra quyền** — ai đăng nhập cũng đọc được bệnh án bất kỳ pet / mã đặt. Cần: chỉ chủ pet, bác sĩ phụ trách, admin
- [x] `PUT /api/users/{id}/profile` chỉ cho sửa chính mình (2026-10-21)
- [ ] Nhiều API khác vẫn nhận `userId` từ body (`PetService`, `ReviewService`, `ProductReviewService`, `OrderController`) — cùng kiểu lỗi đã sửa ở đặt lịch

### Commit & deploy
- [ ] Commit (tiếng Việt không dấu, không `Co-Authored-By`)
- [ ] Deploy **backend và frontend cùng lúc** (đặt lịch và API bác sĩ đổi cách lấy id). `ddl-auto=update` tự tạo `clinic_settings`, `time_slots` trên Neon

### Để sau
- [ ] Responsive điện thoại cho cả website (lịch tuần hiện đang cuộn ngang)
- [ ] (Nếu cần) lịch ca trực bác sĩ → sức chứa tính theo số bác sĩ trực, cho khách chọn bác sĩ

---

## File liên quan

**Khung giờ** — backend: `entity/ClinicSetting`, `entity/TimeSlot`, `repository/ClinicSettingRepository`, `repository/TimeSlotRepository`, `service/TimeSlotService`, `dto/SlotAvailabilityResponse`, `dto/TimeSlotUpdateRequest`, `dto/DayLockRequest`, `dto/WalkInAppointmentRequest`, `dto/CustomerSearchResponse`; sửa `AppointmentRepository`, `UserRepository`, `AppointmentService`, `AppointmentController`, `AdminController`, `dto/AppointmentRequest`.
Frontend: mới `components/ConfirmModal`, `pages/admin/AdminTimeSlots`, `pages/admin/WalkInAppointmentModal`; sửa `api/apiClient`, `api/appointmentApi`, `api/adminApi`, `pages/BookAppointment`, `pages/admin/AdminAppointments`, `App.tsx`, `AdminLayout`, `Navbar`, `MyAppointments`, `MyPets`, `Orders`, `doctor/MedicalRecord`.

**Lịch tuần + bảo mật** — backend: `SecurityConfig`, `DoctorController`, `MedicalController`, `MedicalService`. Frontend: `api/doctorApi`, mới `pages/doctor/DoctorWeekSchedule`, sửa `pages/doctor/DoctorAppointments`.

## Nhật ký session

### 2026-10-21
- Làm thông báo lịch khám trong app (chuông + SSE realtime) cho khách và bác sĩ. Build sạch (backend + frontend), chưa test runtime
- Sửa lỗi đăng nhập Google luôn bị bắt cập nhật SĐT: JWT thêm claim `phone`, `loginWithToken` đọc SĐT từ token; `Profile` đổ lại form khi F5, tên không bắt buộc, ô trống = giữ nguyên; `PUT /api/users/{id}/profile` bỏ qua SĐT trống (trước đây ghi `""` đè mất SĐT) và chỉ cho sửa chính mình (id phải khớp JWT). Token Google cũ cần đăng nhập lại 1 lần

### 2026-10-15
- Làm thông báo lịch khám qua email (Brevo): mail đặt lịch thành công + job nhắc trước 1 ngày. Build sạch, chưa test runtime

### 2026-10-07
- Thiết kế + làm quản lý khung giờ (3 đợt: giới hạn slot → trang admin → khách tại quầy)
- Thay `alert`/`confirm`/`prompt` bằng `ConfirmModal`
- Lịch tuần bác sĩ; vá `/api/doctor` và ghi bệnh án
- Test tay: lịch 2 pet chiếm đúng 2 chỗ (lúc đầu tưởng sai vì xem nhầm ngày — trang admin khung giờ mặc định mở hôm nay, còn khách chỉ đặt được từ ngày mai)
