# AI Dự đoán bệnh thú y — Tài liệu chức năng

> **Đọc file này đầu tiên khi bắt đầu session mới.**
> Đây là index của toàn bộ tài liệu cho chức năng "Dự đoán bệnh thú y bằng AI" của project PawCare.

## Trạng thái hiện tại

| | |
|---|---|
| **Giai đoạn** | 1A — Dữ liệu thật + mốc đối chứng R1 (**10/11 việc**) |
| **Cập nhật lần cuối** | 2026-09-14 |
| **Code đã viết** | `check_constraints.py` · `check_mapping.py` · `load_real_data.py` · `train_baseline.py` |
| **Đã xong** | `symptoms.json` **v4** · `disease_constraints.csv` 20 dòng · `mapping_dogfinal3.csv` · khảo sát dataset · ✅ **R1 đã chạy** |
| **Kết quả R1** | Random Forest **accuracy `0.886 ± 0.042`**, macro-F1 `0.882 ± 0.045` (5-fold CV / 141 dòng) |
| **Việc tiếp theo** | Báo cáo R1 cho giảng viên → giai đoạn 1B: tra MSD Vet Manual |

> ### 🔴 Phạm vi đã đổi lớn — 2026-09-13
>
> Giảng viên thu hẹp đề tài: **chỉ loài CHÓ, 20 bệnh** (trước là 6 loài, 34 bệnh), và yêu cầu **train/test trên dữ liệu thật trước**, rồi mới sinh dữ liệu từ y văn và so sánh.
>
> **Đọc [QĐ-10, QĐ-11, QĐ-12 trong DECISIONS.md](DECISIONS.md) trước khi làm bất cứ việc gì.**
>
> `03-DATA.md`, `01-OVERVIEW.md`, `04-MODEL.md` **chưa cập nhật** theo phạm vi mới — xem mục "Nợ kỹ thuật" trong [PROGRESS.md](PROGRESS.md).

Chi tiết tiến độ → [PROGRESS.md](PROGRESS.md)

## Tóm tắt 30 giây

Bác sĩ thú y nhập triệu chứng + đặc điểm **chó** (giống, tuổi, giới tính, cân nặng) → hệ thống trả về **top-3 bệnh nghi ngờ kèm % tin cậy** để sàng lọc sơ bộ. Không thay thế chẩn đoán của bác sĩ.

Dữ liệu train gồm hai phần, đo tách bạch qua 3 chế độ (QĐ-12): **R1** dữ liệu thật · **R2** dữ liệu sinh từ y văn · **R3** kết hợp. Cùng một tập test 28 ca thật.

Model **RandomForest / XGBoost** chạy trong một **FastAPI service riêng**, Spring Boot gọi sang qua RestTemplate (đúng pattern `ChatService` đang gọi Groq). Groq LLM được dùng ở tầng Spring Boot để diễn giải kết quả thành tiếng Việt — **không** tham gia vào việc dự đoán, để không ảnh hưởng tới metrics trong báo cáo.

## Bản đồ tài liệu

| File | Nội dung | Đọc khi nào |
|---|---|---|
| [01-OVERVIEW.md](01-OVERVIEW.md) | Đề bài của giảng viên, mục tiêu, actor, yêu cầu phi chức năng, phạm vi | Cần hiểu "phải làm gì và tại sao" |
| [02-ARCHITECTURE.md](02-ARCHITECTURE.md) | Sơ đồ hệ thống, hợp đồng `symptoms.json`, hợp đồng API, cấu trúc thư mục | Trước khi viết bất kỳ code nào |
| [03-DATA.md](03-DATA.md) | Danh sách bệnh 6 loài, danh sách triệu chứng, chiến lược sinh dữ liệu | Giai đoạn 1 |
| [04-MODEL.md](04-MODEL.md) | Kế hoạch train, đánh giá, species mask, cơ chế từ chối trả lời | Giai đoạn 2 |
| [05-INTEGRATION.md](05-INTEGRATION.md) | Chi tiết Spring Boot (entity, endpoint) + React (UI ở đâu, thế nào) | Giai đoạn 3–5 |
| [PROGRESS.md](PROGRESS.md) | Checklist theo giai đoạn + nhật ký từng session | **Mỗi session — đọc đầu, cập nhật cuối** |
| [DECISIONS.md](DECISIONS.md) | Các quyết định đã chốt và lý do (kèm phương án đã loại) | Khi định thay đổi hướng đi |

## Quy ước làm việc trong chức năng này

1. **Đọc [PROGRESS.md](PROGRESS.md) trước, cập nhật sau** mỗi phiên làm việc có thay đổi thực tế.
2. **Không tự ý đảo quyết định** đã ghi trong [DECISIONS.md](DECISIONS.md) — nếu thấy cần đổi, nêu vấn đề với người dùng trước.
3. **`symptoms.json` là nguồn sự thật duy nhất** cho danh sách triệu chứng/bệnh. Python, Java, React đều đọc từ đó. Thứ tự phần tử = thứ tự cột feature vector — đổi thứ tự là hỏng model mà không báo lỗi.
4. **Không bịa trích dẫn y khoa.** Các con số xác suất triệu chứng trong [03-DATA.md](03-DATA.md) hiện là bản nháp suy luận lâm sàng, đang chờ đối chiếu với sách. Trạng thái xác minh được ghi rõ trong từng bảng — giữ nguyên cột đó.
5. **Nguyên tắc code của project** (theo yêu cầu người dùng): code đơn giản, hạn chế thêm thư viện mới, chia kế hoạch mỗi task thành 5 bước.

## Bối cảnh project gốc

PawCare — hệ thống quản lý phòng khám thú y.

- **Backend**: Spring Boot 3 / Java 21 / PostgreSQL (Neon) / JWT / deploy Render qua Docker
- **Frontend**: React + TypeScript + Vite + TailwindCSS / deploy Vercel
- **Đã có sẵn**: Groq LLM chatbot (`llama-3.1-8b-instant`), 3 role USER/DOCTOR/ADMIN, entity Pet đã có đủ species/breed/age/weight/gender, entity MedicalRecord đã có diagnosis

Các file gốc liên quan nhiều nhất tới chức năng này:

- `backend_pet/src/main/java/com/example/backend_pet/entity/Pet.java` — nguồn feature đầu vào
- `backend_pet/src/main/java/com/example/backend_pet/entity/MedicalRecord.java` — nơi gắn kết quả
- `backend_pet/src/main/java/com/example/backend_pet/service/ChatService.java` — pattern gọi AI service ngoài, sẽ copy
- `fontend_pet/src/pages/doctor/MedicalRecord.tsx` — UI chính của bác sĩ
- `fontend_pet/src/pages/BookAppointment.tsx` — UI phụ của khách hàng
