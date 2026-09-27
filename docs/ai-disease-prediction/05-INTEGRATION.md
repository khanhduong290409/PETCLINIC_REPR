# 05 — Tích hợp Spring Boot & React

## Phần 1 — FastAPI service

### File cần tạo

```
ai_service/
├── app.py             # FastAPI: /predict, /health
├── predict.py         # load model, build feature vector, species mask, abstention
├── requirements.txt   # fastapi, uvicorn, scikit-learn, xgboost, pandas, numpy, joblib
└── Dockerfile         # python:3.11-slim
```

### Điểm cần cẩn thận

- **Load model một lần** khi khởi động (biến module-level), không load mỗi request
- **Kiểm tra `symptoms_version`** giữa `model.joblib` và `shared/symptoms.json` lúc khởi động → lệch thì raise, không cho service chạy với model sai
- **Dựng feature vector đúng thứ tự `feature_columns`** đã lưu trong model, không dựa vào thứ tự dict
- `/health` phải nhẹ, không đụng model — để UptimeRobot ping liên tục không tốn CPU
- Không cần xử lý JWT/CORS: service chỉ được gọi từ Spring Boot

---

## Phần 2 — Spring Boot

### Entity mới: `DiseasePrediction`

`backend_pet/src/main/java/com/example/backend_pet/entity/DiseasePrediction.java`, kế thừa `BaseEntity` như các entity khác.

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `pet` | `@ManyToOne Pet` | Bắt buộc |
| `appointment` | `@ManyToOne Appointment` | Nullable — USER dự đoán lúc đặt lịch thì chưa có appointment |
| `createdBy` | `@ManyToOne User` | Ai bấm dự đoán — phục vụ truy vết |
| `symptoms` | `TEXT` | Danh sách symptom code, nối bằng dấu phẩy |
| `durationDays` | `Integer` | |
| `resultJson` | `TEXT` | Nguyên văn JSON top-3 trả về từ FastAPI |
| `top1Disease` | `String` | Tách riêng để query thống kê cho nhanh |
| `top1Confidence` | `Double` | |
| `abstained` | `Boolean` | Model có từ chối trả lời không |
| `llmExplanation` | `TEXT` | Đoạn diễn giải Groq sinh ra |
| `modelVersion` | `String` | Để so sánh giữa các phiên bản model |
| `doctorConfirmed` | `Boolean` | **Nullable** — null = bác sĩ chưa phản hồi |
| `actualDiagnosis` | `String` | Chẩn đoán thật của bác sĩ |

> Ba trường `doctorConfirmed`, `actualDiagnosis`, `modelVersion` là **thứ tạo nên giá trị học thuật của đồ án** — chúng cho phép dựng confusion matrix trên dữ liệu thật. Đừng cắt bỏ khi rút gọn phạm vi.

Dùng `spring.jpa.hibernate.ddl-auto=update` như hiện tại nên bảng tự sinh, không cần migration script.

### Service: `PredictionService`

Copy pattern từ `ChatService.java` (`RestTemplate` + `HttpHeaders` + `postForEntity`).

Luồng xử lý `predict()`:

1. Nạp `Pet` từ DB → lấy species, breed, ageMonths, gender, weightKg
2. Chặn sớm nếu `species == OTHER` → ném lỗi thân thiện, không gọi FastAPI
3. Gọi `POST {ai.service.url}/predict`, bọc try/catch — lỗi thì ném `ServiceUnavailableException`
4. Nếu `abstained == false` → gọi Groq sinh diễn giải tiếng Việt. **Groq lỗi thì bỏ qua**, vẫn trả kết quả (đây không phải lỗi chí mạng)
5. Lưu `DiseasePrediction` rồi trả DTO

Prompt cho Groq nên ràng buộc chặt: nhận vào tên bệnh + % + triệu chứng, yêu cầu viết 3–4 câu tiếng Việt gồm *lý do nghĩ tới bệnh này* và *xét nghiệm nên làm để xác nhận*, cấm kê đơn thuốc, cấm khẳng định chắc chắn.

Luồng `triage()` cho USER dùng chung `POST /predict` nhưng ánh xạ kết quả sang `severity` rồi **loại bỏ hoàn toàn tên bệnh** trước khi trả về. Việc lọc phải làm ở tầng service — nếu để React ẩn đi thì tên bệnh vẫn nằm trong network response, khách mở DevTools là thấy.

### Controller: `PredictionController`

| Method | Path | Role | Trả về |
|---|---|---|---|
| `POST` | `/api/predictions` | DOCTOR | Top-3 bệnh + % + diễn giải |
| `POST` | `/api/predictions/triage` | USER | Chỉ severity + thông điệp |
| `GET` | `/api/predictions/pet/{petId}` | DOCTOR, chủ pet | Lịch sử dự đoán |
| `PATCH` | `/api/predictions/{id}/confirm` | DOCTOR | Ghi nhận phản hồi |
| `GET` | `/api/admin/predictions/stats` | ADMIN | Thống kê độ chính xác |

`SecurityConfig` hiện chỉ chặn `/api/admin/**` ở mức role; các endpoint còn lại chỉ yêu cầu đăng nhập. Nên phân quyền chi tiết bằng `@PreAuthorize` trên method, hoặc thêm matcher trong `SecurityConfig`. Endpoint stats đặt dưới `/api/admin/` để hưởng sẵn rule `hasRole("ADMIN")`.

### DTO cần thêm

`PredictionRequest` (petId, symptoms, durationDays, appointmentId nullable), `PredictionResponse` (predictions, abstained, explanation, modelVersion, id), `TriageResponse` (severity, message — **không có tên bệnh**), `PredictionStatsResponse`.

### Cấu hình

```properties
ai.service.url=${AI_SERVICE_URL:http://localhost:8000}
ai.service.timeout-ms=${AI_SERVICE_TIMEOUT:15000}
ai.prediction.confidence-threshold=0.40
```

`RestTemplate` mặc định **không có timeout** — phải cấu hình `SimpleClientHttpRequestFactory` với connect/read timeout, nếu không một lần FastAPI treo sẽ giữ luôn thread của Spring Boot. (`ChatService` hiện tại cũng đang thiếu timeout — có thể sửa luôn thể.)

---

## Phần 3 — React

### 3.1 Bác sĩ — `fontend_pet/src/pages/doctor/MedicalRecord.tsx` (actor chính)

Chèn một panel **ngay phía trên** ô "Chẩn đoán" trong mỗi card pet, dạng có thể thu gọn để không làm rối form hiện tại.

```
┌─ 🤖 Gợi ý chẩn đoán AI ──────────────────── [Thu gọn] ─┐
│                                                        │
│  Triệu chứng quan sát được:                            │
│  ┌ Tiêu hóa ───────────────────────────────────────┐   │
│  │ [✓] Nôn   [✓] Tiêu chảy ra máu   [ ] Bỏ ăn ...  │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌ Toàn thân ──────────────────────────────────────┐   │
│  │ [✓] Sốt   [ ] Li bì   [✓] Mất nước  ...         │   │
│  └─────────────────────────────────────────────────┘   │
│  ... (thu gọn theo nhóm, mặc định mở nhóm Tiêu hóa)    │
│                                                        │
│  Số ngày có triệu chứng: [ 2 ]                         │
│                                                        │
│          [ 🔍 Phân tích ]                              │
│  ─────────────────────────────────────────────────     │
│  Kết quả:                                              │
│   1. Parvovirus            ████████████░░  87%  [Dùng] │
│   2. Viêm dạ dày–ruột cấp  █░░░░░░░░░░░░░   8%  [Dùng] │
│   3. Giun sán đường ruột   ░░░░░░░░░░░░░░   3%  [Dùng] │
│                                                        │
│  💬 Chó con 5 tháng, tiêu chảy ra máu kèm nôn và       │
│     mất nước là bộ ba gợi ý mạnh tới Parvo. Nên làm    │
│     test nhanh CPV và công thức máu để xác nhận.       │
│                                                        │
│  ⚠️ Kết quả tham khảo, không thay thế chẩn đoán của    │
│     bác sĩ thú y.                                      │
│                                                        │
│  Phản hồi: [ ✓ AI đúng ]  [ ✗ AI sai ]                 │
└────────────────────────────────────────────────────────┘
```

Chi tiết hành vi:

- Nút **[Dùng]** ghi tên bệnh vào ô `diagnosis` của form (qua `updateField`), **không tự động ghi** — bác sĩ phải chủ động bấm
- Nút phản hồi gọi `PATCH /api/predictions/{id}/confirm`. Đây là nguồn dữ liệu thật, đừng bỏ qua
- Trạng thái AI lưu **theo `appointmentId`** giống các state hiện có (`forms`, `images`, `saved`) — trang này xử lý nhiều pet cùng lúc
- Khi FastAPI lỗi: hiện thông báo trong panel, **không** dùng `alert()`, phần ghi bệnh án phía dưới vẫn hoạt động bình thường
- Cold start: nếu request quá 5 giây, đổi chữ nút thành "Đang khởi động dịch vụ AI..."

### 3.2 Khách hàng — `fontend_pet/src/pages/BookAppointment.tsx` (actor phụ)

Một bước tùy chọn: *"Thú cưng của bạn có biểu hiện bất thường không? (không bắt buộc)"* → tick triệu chứng bằng ngôn ngữ đời thường → hiện kết quả dạng:

```
🟠  Nên đưa đi khám trong 1–2 ngày tới
    Các biểu hiện bạn mô tả cần được bác sĩ kiểm tra sớm.
    ⚠️ Đây chỉ là gợi ý mức độ ưu tiên, không phải chẩn đoán.
```

Ba mức NORMAL / SOON / URGENT theo `severity`. **Tuyệt đối không hiện tên bệnh.** Triệu chứng đã tick được lưu vào `Appointment.notes` để bác sĩ đọc trước khi khám.

### 3.3 Admin — `fontend_pet/src/pages/admin/AdminDashboard.tsx`

Thêm một khối thống kê:

- Tổng số lần dự đoán
- Tỷ lệ bác sĩ xác nhận AI đúng (**đây là "accuracy trên dữ liệu thật"**)
- Top-3 bệnh AI hay đoán nhất
- Top-5 cặp nhầm lẫn nhiều nhất (AI đoán X, thực tế Y)
- Tỷ lệ ca model từ chối trả lời

Khối này là bằng chứng trực quan cho chương "đánh giá trên dữ liệu thực tế" của báo cáo.

### 3.4 File frontend cần tạo

| File | Nội dung |
|---|---|
| `src/api/predictionApi.ts` | Gọi 5 endpoint, theo pattern các file api hiện có |
| `src/components/medical/AiPredictionPanel.tsx` | Panel bác sĩ |
| `src/components/medical/SymptomPicker.tsx` | Chọn triệu chứng theo nhóm — **dùng lại cho cả bác sĩ và khách** |
| `src/types/prediction.ts` | Kiểu dữ liệu |
| `src/constants/symptoms.ts` | Import từ `shared/symptoms.json` (không chép tay lại!) |

---

## Thứ tự triển khai đề xuất

Làm theo chiều dọc, mỗi bước đều chạy được end-to-end:

1. FastAPI + model giả (trả kết quả cứng) → deploy → xác nhận kiến trúc thông
2. Spring Boot: entity + service + endpoint `POST /api/predictions` → test bằng Postman
3. React: `SymptomPicker` + panel bác sĩ → chạy thật với model giả
4. Thay model giả bằng model thật đã train
5. Bổ sung triage cho USER, phản hồi bác sĩ, thống kê Admin

Cách này giúp phát hiện sớm các vấn đề hạ tầng (CORS, timeout, cold start, biến môi trường) khi chưa tốn công vào model.
