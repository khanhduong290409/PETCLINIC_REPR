# AI Dự đoán bệnh thú y — Tài liệu chức năng

> **Đọc file này đầu tiên khi bắt đầu session mới.**
> Đây là index của toàn bộ tài liệu cho chức năng "Dự đoán bệnh thú y bằng AI" của project PawCare.

## Trạng thái hiện tại

| | |
|---|---|
| **Phạm vi** | **8 loài · 44 bệnh · dữ liệu `cleaned_animal`** ([QĐ-16](DECISIONS.md)) |
| **Giao diện** | Trang riêng `/ai-diagnosis` ([QĐ-15](DECISIONS.md)) |
| **Giai đoạn** | Chạy thử trên trình duyệt → commit → deploy → viết báo cáo |
| **Kết quả** | Random Forest accuracy **`0.425 ± 0.052`**, F1 macro `0.305 ± 0.047` (3-fold CV / 351 dòng) — xem [`ca_results.md`](../../ai_service/reports/ca_results.md) |
| **Cập nhật lần cuối** | 2026-10-18 |

Chi tiết tiến độ và việc còn lại → [PROGRESS.md](PROGRESS.md)

## Tóm tắt 30 giây

Người dùng đã đăng nhập vào trang **"Chẩn đoán AI"** (`/ai-diagnosis`), chọn **loài** (chó, mèo, bò, ngựa, cừu, dê, lợn, thỏ), nhập thêm giống/giới tính/tuổi/cân nặng/nhiệt độ/nhịp tim/số ngày bệnh nếu biết (không bắt buộc), chọn triệu chứng, bấm "Phân tích" → `ai_service` (FastAPI, Random Forest) trả về **top-3 bệnh của loài đó** kèm xác suất. Trang hiện tên bệnh, mức độ khẩn cấp, mô tả, khuyến nghị và lưu ý rằng kết quả chỉ để tham khảo. Không lưu lịch sử, không thay thế chẩn đoán của bác sĩ.

**Dữ liệu:** `cleaned_animal_disease_prediction.csv` (Kaggle, tài liệu [12] của đề bài) — 351/431 dòng, 44 bệnh có ≥ 3 dòng sau khi gộp tên đồng nghĩa. Triệu chứng chỉ lấy từ 4 cột chữ (9 cột Yes/No bị bỏ vì mâu thuẫn). `dogfinal3` chỉ còn trong chương khảo sát.

## Bản đồ tài liệu

| File | Nội dung | Trạng thái |
|---|---|---|
| [PROGRESS.md](PROGRESS.md) | Việc đã xong, việc còn lại, câu hỏi treo | ✅ **Mỗi session — đọc đầu, cập nhật cuối** |
| [HUONG-DAN-NGUOI-MOI.md](HUONG-DAN-NGUOI-MOI.md) | Giải thích từng bước cho người mới: khái niệm ML, dữ liệu, train, đánh giá, service, cách chạy, câu hỏi bảo vệ | ✅ Đọc khi cần hiểu hoặc trình bày chức năng |
| [DECISIONS.md](DECISIONS.md) | Quyết định đã chốt (phần A) và đã thay thế (phần B) | ✅ Đọc khi định đổi hướng |
| [01-OVERVIEW.md](01-OVERVIEW.md) | Đề bài nguyên văn của giảng viên, phạm vi, ràng buộc y đức | ✅ Đọc khi cần hiểu "phải làm gì và tại sao" |
| [02-ARCHITECTURE.md](02-ARCHITECTURE.md) | Sơ đồ hệ thống, định vị Strangler Fig | ⚠️ Sơ đồ còn đúng; hợp đồng API và cấu trúc thư mục là bản dự kiến cũ |
| [05-INTEGRATION.md](05-INTEGRATION.md) | Kế hoạch tích hợp Spring Boot + React | ⚠️ Bản kế hoạch cũ. Thực tế đã làm khác — xem mục "Đã xong" trong PROGRESS.md |

**Khi tài liệu mâu thuẫn nhau:** `DECISIONS.md` phần A và `PROGRESS.md` là nguồn đúng.

## File code chính

| File | Vai trò |
|---|---|
| `ai_service/app.py` | FastAPI service — train RF lúc khởi động, `/predict`, `/symptoms` (loài, triệu chứng, giống, bệnh), `/health` |
| `ai_service/data/cleaned_animal_disease_prediction.csv` | Dữ liệu train |
| `ai_service/data/mapping_cleaned_animal.csv` | Gộp nhãn đồng nghĩa → mã bệnh, chuỗi triệu chứng → mã `symptoms.json` |
| `ai_service/scripts/load_cleaned_animal.py` | Đọc dữ liệu + dựng feature — dùng chung cho đánh giá và `app.py` |
| `ai_service/scripts/train_cleaned_animal.py` | Script đánh giá cho báo cáo → `reports/ca_metrics.md` |
| `ai_service/scripts/` (còn lại) | Script R1 cũ trên `dogfinal3` — giữ cho chương khảo sát |
| `ai_service/reports/` | Số liệu và báo cáo đã sinh |
| `shared/symptoms.json` | Loài, triệu chứng, bệnh (mô tả + khuyến nghị) — thứ tự mảng = thứ tự cột feature |
| `backend_pet/.../controller/AiController.java` | Proxy Spring Boot → FastAPI, URL từ `ai.service.url`, có timeout |
| `fontend_pet/src/api/aiApi.ts` | API client phía React |
| `fontend_pet/src/pages/AiDiagnosis.tsx` | Trang chẩn đoán — chọn loài, thông tin thêm, triệu chứng, xem kết quả |

## Quy ước làm việc trong chức năng này

1. **Đọc [PROGRESS.md](PROGRESS.md) trước, cập nhật sau** mỗi phiên làm việc có thay đổi thực tế.
2. **Không tự ý đảo quyết định** trong [DECISIONS.md](DECISIONS.md) — thấy cần đổi thì nêu với người dùng trước.
3. **Không thêm bệnh** ngoài 44 bệnh khi chưa có dữ liệu cho bệnh đó.
4. **Không chỉnh dữ liệu hay thử tham số cho tới khi ra số đẹp** — số nào ra thì báo cáo số đó.
5. **Nguyên tắc code của project:** code đơn giản, hạn chế thêm thư viện mới, plan được duyệt thì làm từng file, tự review, tự sang file tiếp (xem `WORKING-STYLE.md`).
