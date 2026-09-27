# 02 — Kiến trúc & hợp đồng

## Sơ đồ hệ thống

```
┌─────────────────────────┐
│  React (Vercel)         │
│  ├ BookAppointment.tsx  │  USER: tick triệu chứng → thấy MỨC ƯU TIÊN
│  └ doctor/MedicalRec... │  DOCTOR: tick triệu chứng → thấy TOP-3 BỆNH
└───────────┬─────────────┘
            │ JWT, /api/predictions
            ▼
┌─────────────────────────┐        ┌──────────────────────────┐
│  Spring Boot (Render)   │───────>│  FastAPI (HF Spaces)     │
│  PredictionController   │  HTTP  │  POST /predict           │
│  PredictionService      │        │  GET  /health            │
│  DiseasePrediction ent. │<───────│  model.joblib (RF)       │
└───────────┬─────────────┘        │  + species mask          │
            │                      └──────────────────────────┘
            │ diễn giải tiếng Việt
            ▼
┌─────────────────────────┐
│  Groq LLM (đã có sẵn)   │  llama-3.1-8b-instant
└─────────────────────────┘
            │
            ▼
┌─────────────────────────┐
│  PostgreSQL (Neon)      │  bảng disease_predictions
└─────────────────────────┘
```

**Nguyên tắc:** FastAPI **không** lộ ra internet cho frontend. Frontend chỉ nói chuyện với Spring Boot. Nhờ vậy FastAPI không phải tự xử lý JWT, CORS, phân quyền.

**Vì sao Groq nằm ở tầng Spring Boot chứ không phải trong FastAPI:** để LLM hoàn toàn tách khỏi đường đi của con số dự đoán. Metrics trong báo cáo chỉ phản ánh RandomForest, không bị LLM làm nhiễu. Đồng thời tận dụng luôn `GROQ_API_KEY` đã cấu hình sẵn.

---

## Định vị kiến trúc — gọi đúng tên

⚠️ **Không viết "hệ thống áp dụng kiến trúc Microservices" vào báo cáo hay CV.** Microservices là thuộc tính của cách chia **toàn bộ** hệ thống, không phải của một service đơn lẻ. PawCare vẫn là monolith (một Spring Boot, một database, mọi nghiệp vụ). Thêm `ai_service` cho ra **monolith + một service được trích xuất**, không phải microservices.

Đối chiếu:

| Tiêu chí microservices | PawCare |
|---|---|
| Tách theo bounded context nghiệp vụ | ❌ chỉ 1 service nghiệp vụ |
| Database per service | ❌ `ai_service` stateless, monolith giữ tất cả |
| Deploy độc lập | ✅ |
| Đa ngôn ngữ (polyglot) | ✅ Java + Python |
| Giao tiếp qua network | ✅ REST |
| API Gateway / Service Discovery | ❌ không có, và **cố ý không làm** |

### Cách diễn đạt đúng

Việc bóc tách từng chức năng khỏi một monolith có sẵn là một pattern có tên chính thức: **Strangler Fig Pattern** (Martin Fowler). Dùng tên này.

> "Áp dụng **Strangler Fig Pattern** để bóc tách dần monolith: chức năng dự đoán bệnh được trích xuất thành một **dedicated ML inference service** (Python/FastAPI), giao tiếp với backend Spring Boot qua REST, kèm các resilience pattern."

Bốn lý do bảo vệ khi bị hỏi "sao phải tách?":
1. **Ràng buộc công nghệ** — hệ sinh thái ML (scikit-learn, XGBoost) chỉ có ở Python (lý do mạnh nhất)
2. **Vòng đời khác nhau** — retrain model không cần redeploy backend
3. **Tài nguyên khác nhau** — inference tiêu thụ CPU/RAM khác request web
4. **Cô lập lỗi** — `ai_service` chết thì bác sĩ vẫn ghi bệnh án bình thường

Khi bị hỏi *"đây có phải microservices không?"* → trả lời thẳng là **không hẳn**, hệ thống chính vẫn là monolith, chỉ tách riêng phần suy luận ML. Tự nhận đúng giới hạn ăn điểm hơn nhiều so với dùng buzzword rồi bị đào.

### Phạm vi đã chốt: chỉ một service

Không tách thêm `notification-service` hay `payment-service`. Xem QĐ-06 trong [DECISIONS.md](DECISIONS.md).

### Pattern áp dụng và pattern cố ý bỏ

| Pattern | Quyết định | Ghi chú |
|---|---|---|
| Strangler Fig | ✅ | Cách tiếp cận tổng thể |
| REST đồng bộ giữa service | ✅ | |
| **Circuit breaker** (Resilience4j) | ✅ | Free tier hay ngủ → thực sự cần, không phải làm cho có |
| **Retry + timeout** | ✅ | Cold start lần đầu thường fail |
| **Health check / readiness** | ✅ | `/health` + UptimeRobot |
| **Correlation ID** | ✅ | Header `X-Request-Id` + MDC log, trace xuyên 2 service |
| **Graceful degradation** | ✅ | Xem mục "Xử lý lỗi" bên dưới |
| Database per service | ➖ | Không áp dụng — `ai_service` stateless theo thiết kế |
| Async messaging | ➖ | Không cần cho luồng request–response này |
| API Gateway | ❌ | Thêm một cold start nữa trên free tier, không đáng |
| Service Discovery (Eureka) | ❌ | 3 endpoint cố định → thuần trang trí |
| Config Server | ❌ | Tương tự |

Việc **cố ý bỏ** Eureka và Config Server là một quyết định kỹ thuật đúng, nên nêu rõ khi trình bày: *"chỉ có endpoint cố định, thêm service discovery là over-engineering"*. Đó là câu trả lời của người hiểu việc.

## Cấu trúc thư mục dự kiến

```
d:\PETCLINIC_REPR\
├── shared/
│   └── symptoms.json              ← NGUỒN SỰ THẬT DUY NHẤT (cả 3 tầng đọc)
├── ai_service/                    ← service Python mới
│   ├── data/
│   │   ├── disease_matrix.csv     ← ma trận P(triệu chứng|bệnh)
│   │   ├── kaggle_raw/            ← dataset [12][13] tải về
│   │   └── dataset.csv            ← dữ liệu cuối cùng sau khi sinh + trộn
│   ├── notebooks/
│   │   ├── 01_explore_kaggle.ipynb
│   │   ├── 02_generate_data.ipynb
│   │   └── 03_train_evaluate.ipynb   ← notebook chấm điểm chính
│   ├── models/
│   │   └── model.joblib
│   ├── reports/                   ← hình ảnh xuất ra cho báo cáo
│   │   ├── confusion_matrix.png
│   │   └── metrics_table.md
│   ├── app.py                     ← FastAPI
│   ├── predict.py                 ← load model + species mask + abstention
│   ├── requirements.txt
│   └── Dockerfile
├── backend_pet/                   ← Spring Boot (có sẵn)
└── fontend_pet/                   ← React (có sẵn)
```

`symptoms.json` đặt ở `shared/` chứ không nằm trong `ai_service/` để nhấn mạnh nó thuộc về cả ba tầng. Java đọc qua classpath resource (copy khi build), React import trực tiếp, Python đọc bằng đường dẫn tương đối.

## Hợp đồng 1 — `shared/symptoms.json`

⚠️ **Đây là chỗ dễ gây bug âm thầm nhất trong toàn bộ chức năng.** Thứ tự phần tử trong mảng `symptoms` **chính là thứ tự cột của feature vector** đưa vào model. Chèn/xóa/đảo một phần tử mà không retrain là model dự đoán sai hoàn toàn nhưng **không hề báo lỗi**.

Quy tắc bảo vệ:
- Chỉ được **thêm vào cuối** mảng, không bao giờ chèn giữa hay xóa.
- Mỗi lần thay đổi phải tăng `version` và retrain lại model.
- FastAPI kiểm tra `version` khi khởi động, lệch thì từ chối chạy.

```jsonc
{
  "version": 1,
  "symptoms": [
    { "code": "vomiting",        "vi": "Nôn",                "group": "tiêu hóa" },
    { "code": "bloody_diarrhea", "vi": "Tiêu chảy ra máu",   "group": "tiêu hóa" }
    // ... thứ tự cố định, chỉ thêm vào cuối
  ],
  "diseases": [
    {
      "code": "parvo",
      "vi": "Parvovirus (Parvo)",
      "species": ["DOG"],          // dùng cho species mask
      "severity": "URGENT",        // NORMAL | SOON | URGENT — dùng cho actor USER
      "note": "Chủ yếu ở chó con dưới 6 tháng chưa tiêm đủ vaccine"
    }
  ]
}
```

Giá trị `severity` ánh xạ sang thông điệp cho khách hàng:

| severity | Hiển thị cho USER | Màu |
|---|---|---|
| `NORMAL` | "Có thể đặt lịch khám thông thường" | xám |
| `SOON` | "Nên đưa đi khám trong 1–2 ngày tới" | vàng |
| `URGENT` | "Nên đưa đi khám ngay hôm nay" | đỏ |

Khách hàng **không bao giờ** thấy trường `vi` của disease — chỉ thấy severity. Việc lọc này làm ở **tầng Spring Boot**, không phải ở React, để tên bệnh không lọt xuống network response.

## Hợp đồng 2 — API giữa Spring Boot ↔ FastAPI

### `POST /predict`

Request:
```json
{
  "species": "DOG",
  "breed": "Poodle",
  "ageMonths": 5,
  "gender": "MALE",
  "weightKg": 3.2,
  "symptoms": ["vomiting", "bloody_diarrhea", "anorexia", "fever"],
  "durationDays": 2
}
```

Response:
```json
{
  "predictions": [
    { "disease": "parvo",            "confidence": 0.87 },
    { "disease": "gastroenteritis",  "confidence": 0.08 },
    { "disease": "intestinal_worms", "confidence": 0.03 }
  ],
  "abstained": false,
  "modelVersion": "rf-v1",
  "symptomsVersion": 1
}
```

Khi độ tin cậy top-1 < ngưỡng 0.40:
```json
{
  "predictions": [],
  "abstained": true,
  "abstainReason": "Độ tin cậy thấp — triệu chứng không đủ đặc hiệu",
  "modelVersion": "rf-v1",
  "symptomsVersion": 1
}
```

### `GET /health`

```json
{ "status": "ok", "modelVersion": "rf-v1", "symptomsVersion": 1 }
```

Dùng cho UptimeRobot ping giữ service khỏi ngủ, và cho Spring Boot kiểm tra trước khi gọi.

## Hợp đồng 3 — API giữa React ↔ Spring Boot

| Method | Endpoint | Role | Mô tả |
|---|---|---|---|
| `POST` | `/api/predictions` | DOCTOR | Dự đoán đầy đủ — trả top-3 bệnh + % + diễn giải LLM |
| `POST` | `/api/predictions/triage` | USER | Chỉ trả mức độ ưu tiên, **không** trả tên bệnh |
| `GET` | `/api/predictions/pet/{petId}` | DOCTOR, USER (chủ pet) | Lịch sử dự đoán của một thú cưng |
| `PATCH` | `/api/predictions/{id}/confirm` | DOCTOR | Bác sĩ xác nhận AI đúng/sai + ghi chẩn đoán thật |
| `GET` | `/api/admin/predictions/stats` | ADMIN | Thống kê độ chính xác trên dữ liệu thực tế |

Chi tiết DTO và entity → [05-INTEGRATION.md](05-INTEGRATION.md)

## Cấu hình mới cần thêm

`backend_pet/src/main/resources/application.properties`:
```properties
# AI Disease Prediction Service
ai.service.url=${AI_SERVICE_URL:http://localhost:8000}
ai.service.timeout-ms=${AI_SERVICE_TIMEOUT:15000}
ai.prediction.confidence-threshold=0.40
```

Biến môi trường cần khai trên Render: `AI_SERVICE_URL`.

## Xử lý lỗi và suy giảm mềm

FastAPI trên free tier **sẽ** có lúc ngủ hoặc chết. Trang ghi bệnh án của bác sĩ tuyệt đối không được sập vì việc đó.

| Tình huống | Xử lý |
|---|---|
| FastAPI không phản hồi / timeout | Trả 503 kèm thông điệp thân thiện, UI hiện "Dịch vụ AI tạm thời không khả dụng, vui lòng thử lại sau" — phần ghi bệnh án vẫn dùng bình thường |
| Cold start (~50s lần gọi đầu) | Timeout đặt 15s, UI hiện trạng thái "Đang khởi động dịch vụ AI..."; giảm thiểu bằng UptimeRobot ping `/health` |
| Groq lỗi | Vẫn trả kết quả top-3 bệnh, chỉ thiếu phần diễn giải — không coi là thất bại |
| Lệch `symptomsVersion` | FastAPI từ chối khởi động; Spring Boot log cảnh báo rõ ràng |
| Loài `OTHER` | Chặn ngay ở Spring Boot, không gọi sang FastAPI |

## Lựa chọn nơi deploy FastAPI

| Nền tảng | Ưu | Nhược |
|---|---|---|
| **Hugging Face Spaces** (đề xuất) | Free, ngủ sau ~48h không dùng chứ không phải 15 phút, hợp ngữ cảnh ML | Cần tài khoản HF, build từ Dockerfile |
| Render free | Cùng nền tảng với backend, đã quen | Ngủ sau 15 phút → cold start ~50s mỗi lần |
| Railway / Fly.io | Nhanh | Giới hạn free hẹp hơn |

Dù chọn nền nào cũng thêm một job UptimeRobot ping `/health`, giống cách đang giữ Render + Neon sống.
