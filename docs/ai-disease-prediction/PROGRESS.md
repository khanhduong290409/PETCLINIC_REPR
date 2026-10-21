# Tiến độ

> **Đọc file này đầu mỗi session. Cập nhật cuối mỗi session có thay đổi thực tế.**
> Chỉ tick `[x]` khi việc đã thực sự xong và chạy được — không tick theo dự định.

## Bảng điều khiển

| | |
|---|---|
| **Phạm vi** | **8 loài · 44 bệnh · dữ liệu `cleaned_animal`** (tài liệu [12] của đề bài) — xem [QĐ-16](DECISIONS.md) |
| **Giao diện** | Trang riêng `/ai-diagnosis`, chọn loài → thông tin thêm (không bắt buộc) → triệu chứng — xem [QĐ-15](DECISIONS.md) |
| **Giai đoạn hiện tại** | Đã chuyển xong sang `cleaned_animal` (code + báo cáo số liệu). **Chưa chạy thử trên trình duyệt**, chưa commit |
| **Cập nhật lần cuối** | 2026-10-18 |
| **Đang chặn** | Không |

**Lý do đổi dữ liệu:** giảng viên không chấp nhận `dogfinal3` (không chính thống). `veterinary_clinical_data` bị loại vì là dữ liệu sinh ngẫu nhiên (QĐ-16).

**Kết quả chính (351 dòng, 3-fold CV, có species mask):** Random Forest accuracy `0.425 ± 0.052`, precision / recall / F1 macro `0.309 / 0.349 / 0.305`. Dummy (bệnh phổ biến nhất của loài) `0.330`, F1 macro `0.094`. Chi tiết: [`ca_metrics.md`](../../ai_service/reports/ca_metrics.md), nhận xét: [`ca_results.md`](../../ai_service/reports/ca_results.md).

**Môi trường:** Python 3.14.7, venv ở `ai_service/.venv`. Chạy script bằng `ai_service/.venv/Scripts/python.exe`. Chạy service bằng `ai_service/start_api.ps1` (cổng 8001).

---

## Đã xong

### Dữ liệu — `cleaned_animal` (QĐ-16, 2026-10-18)
- [x] `mapping_cleaned_animal.csv` — 139 nhãn gốc → 44 bệnh (gộp tay tên đồng nghĩa trong cùng loài, bỏ bệnh < 3 dòng); 25 chuỗi triệu chứng → 19 mã
- [x] `shared/symptoms.json` **v5** — mảng `species` 8 loài; thêm 4 mã triệu chứng ở cuối (`swollen_legs`, `swollen_joints`, `decreased_milk_yield`, `reduced_wool`); 39 bệnh mới + `description`/`advice` cho 44 bệnh đang dùng
- [x] `scripts/load_cleaned_animal.py` — đọc dữ liệu + dựng feature (173 cột), **dùng chung** cho script đánh giá và `app.py`; đo độ khớp cột Yes/No
- [x] Phát hiện 9 cột Yes/No mâu thuẫn với 4 cột chữ → **bỏ** (QĐ-16)

### Đánh giá mô hình
- [x] `scripts/train_cleaned_animal.py` — Dummy / LR / RF, 3-fold CV, Accuracy + Precision/Recall/F1 (macro + weighted), per-class theo loài, confusion matrix theo loài, kiểm tra rò rỉ, 5 thí nghiệm so sánh → [`ca_metrics.md`](../../ai_service/reports/ca_metrics.md), [`ca_confusion_matrix.png`](../../ai_service/reports/ca_confusion_matrix.png)
- [x] Thí nghiệm so sánh cách chia (3-fold CV / 70/30 / 80/20, hold-out chạy 5 seed) và trước/sau tăng cường dữ liệu (chỉ tăng cường tập train) — cả hai không cải thiện, đã có trong `ca_metrics.md` mục 3–4
- [x] Nhận xét kết quả viết tay, gồm lý do chỉ số thấp (83% dòng có bộ triệu chứng trùng với bệnh khác cùng loài) → [`ca_results.md`](../../ai_service/reports/ca_results.md)

### FastAPI service — `ai_service/app.py` (viết lại 2026-10-18)
- [x] Train RF 300 cây trên toàn bộ 351 dòng lúc khởi động
- [x] `POST /predict` — nhận loài (bắt buộc), triệu chứng, giống/giới tính/tuổi/cân nặng/nhiệt độ/nhịp tim/số ngày (không bắt buộc); điền giá trị thiếu theo loài; species mask; trả `imputed_fields`
- [x] `GET /symptoms` — loài kèm triệu chứng, giống, bệnh, giá trị mặc định; thông tin bệnh (mô tả, khuyến nghị)
- [x] Chạy thử bằng uvicorn + TestClient: 8 loài, lỗi 400/422 đúng

### Spring Boot
- [x] `AiController` — proxy nguyên body, **không cần sửa** khi đổi dữ liệu

### React
- [x] `src/api/aiApi.ts` — types mới, `predict(request)`; lỗi 400 hiện nguyên văn, 422 báo nhập sai
- [x] `src/pages/AiDiagnosis.tsx` — chọn loài, form thông tin thêm, triệu chứng lọc theo loài, thông tin bệnh lấy từ API, báo các ô đã tự điền. `npm run build` + eslint sạch

### Phần cũ — `dogfinal3` *(giữ cho chương khảo sát của báo cáo)*
- [x] R1 trên `dogfinal3`: `load_real_data.py`, `train_baseline.py`, `train_split_73.py`, `train_augmented.py`, báo cáo `r1_*`, `R1_*` — vẫn chạy được với `symptoms.json` v5 (`check_mapping.py` sạch). *Lưu ý: v5 thêm 4 cột luôn = 0 cho `dogfinal3`, chạy lại có thể lệch nhẹ so với số cũ*

---

## Việc còn lại

### Kiểm thử
- [ ] **Chạy thử `/ai-diagnosis` trên trình duyệt với cả 3 service** (đổi loài, bỏ trống ô, kết quả, lỗi)
- [ ] Kiểm tra giao diện ở màn hình điện thoại — *hoãn: làm chung khi chỉnh responsive cả website*
- [ ] Tắt `ai_service` khi đang mở trang → trang báo lỗi, không trắng trang

### Deploy
- [ ] Ghim phiên bản trong `requirements_api.txt` (đang dùng `>=`)
- [ ] `Dockerfile` cho `ai_service` + deploy (Hugging Face Spaces hoặc Render) + UptimeRobot ping `/health`
- [ ] Khai `AI_SERVICE_URL` trên Render cho backend
- [ ] *(tùy chọn)* Xóa 2 cột thừa `symptom_codes`, `ai_prediction` trong bảng `appointments` nếu DB đã có (xem ghi chú QĐ-07)

### Báo cáo đồ án
- [ ] Chương dữ liệu: khảo sát 3 dataset (`cleaned_animal`, `veterinary_clinical_data`, `dogfinal3`) và lý do chọn/loại (QĐ-16); gộp tên đồng nghĩa; bỏ cột Yes/No kèm bảng đo
- [ ] Chương mô hình & đánh giá: 3 model, 3-fold CV, Accuracy/Precision/Recall/F1, per-class, confusion matrix, thí nghiệm so sánh — lấy từ `ca_metrics.md` + `ca_results.md`
- [ ] Mục giới hạn: 3–21 dòng/bệnh, triệu chứng chung chung, accuracy 0.425 — chỉ phù hợp gợi ý top-3
- [ ] Ảnh chụp trang `/ai-diagnosis` (trạng thái trống, có kết quả, cảnh báo độ tin cậy thấp)

---

## Nhật ký session *(rút gọn — chi tiết đầy đủ xem git history)*

### 2026-10-18 — Đổi sang `cleaned_animal`, 8 loài
- Giảng viên không chấp nhận `dogfinal3`. Đo lại 2 dataset: `veterinary_clinical_data` sinh ngẫu nhiên (chó có triệu chứng "giảm đẻ trứng", KMeans silhouette ≈ 0.1) → loại kể cả học không giám sát; `cleaned_animal` dùng được sau khi gộp tên đồng nghĩa → **QĐ-16**
- Viết mapping, `symptoms.json` v5, loader, script đánh giá, `app.py`, `aiApi.ts`, `AiDiagnosis.tsx`
- Phát hiện 9 cột Yes/No gần như ngẫu nhiên → bỏ (người dùng đồng ý)
- Kết quả RF 0.425 / F1 macro 0.305 — thấp, báo cáo trung thực, không tinh chỉnh
- Đổi quy ước làm việc: tự review, tự fix, tự sang file tiếp (WORKING-STYLE.md)
- **Việc tiếp theo:** chạy thử trên trình duyệt, commit, sửa báo cáo theo dữ liệu mới

### 2026-10-07 — Rà tiến độ, hoãn deploy
- Người dùng đã kiểm tra giao diện `/ai-diagnosis` trên máy tính: ổn
- Hoãn kiểm tra điện thoại (làm chung khi chỉnh responsive toàn site) và hoãn deploy (làm thêm chức năng web trước)
- Phần tích hợp AI (`app.py`, `AiController`, `aiApi.ts`, `AiDiagnosis.tsx`) **vẫn chưa commit**
- Lưu ý deploy sau này: `app.py` đọc `shared/symptoms.json` nằm **ngoài** `ai_service/` → Dockerfile phải build từ gốc repo hoặc copy file này
- Mục 7 của `R1_bao_cao_giang_vien.md` còn nhắc R2/R3 (đã bỏ theo QĐ-14) — sửa trước khi nộp

### 2026-10-05 — Dọn phạm vi, viết lại tài liệu
- Chốt **QĐ-14**: chỉ 6 bệnh `dogfinal3`, chỉ dữ liệu thật, bỏ hẳn nhánh y văn R2/R3
- Viết lại `PROGRESS.md`, `DECISIONS.md`, `README.md`, `01-OVERVIEW.md` theo phạm vi mới
- Xóa file không còn dùng: `03-DATA.md`, `04-MODEL.md`, `disease_constraints.csv`, `check_constraints.py`, 2 dataset Kaggle thô (`kaggle_raw/`), thư mục rỗng `models/` `notebooks/`, gói `jupyter`
- **Bỏ augmentation khỏi `app.py`** theo ý giảng viên: augmentation không cải thiện → dùng model chưa tăng cường. Đã chạy thử: accuracy test `0.862`, khớp `r1_metrics.md`
- Chốt **QĐ-15**: chẩn đoán AI thành trang riêng `/ai-diagnosis`, hiện tên bệnh (thay QĐ-05), bắt buộc login, không lưu lịch sử, ngưỡng tin cậy 0.5
- Gỡ toàn bộ AI khỏi đặt lịch/bệnh án (`git checkout` 11 file); viết `AiDiagnosis.tsx`; `AiController` đọc URL từ config + timeout; `/symptoms` chỉ trả 31 mã
- Chạy thử end-to-end ở local: **ổn**
- Vướng khi chạy backend: thiếu biến môi trường `JWT_SECRET` (xem "Ghi nhớ thực tế")
- **Việc tiếp theo:** deploy `ai_service` + khai `AI_SERVICE_URL` trên Render, rồi viết báo cáo

### 2026-09-20 → 09-28 — Mở rộng R1 + tích hợp
- Theo yêu cầu mới: chỉ làm 6 bệnh, không dùng y văn, so sánh 70/30 với 80/20, thử augmentation
- Augmentation lật bit **không cải thiện** (RF 0.862 → 0.828, LR giữ 0.931)
- Viết `app.py`, `AiController`, tích hợp vào đặt lịch và bệnh án *(đã gỡ 2026-10-05, QĐ-15)*

### 2026-09-14 — Chạy xong R1
- Split thật là **112/29** (scikit-learn làm tròn lên), không phải 113/28
- LR thắng RF trên hold-out 7 điểm nhưng chỉ hơn 0,7 điểm trên CV → hai model ngang nhau, vẫn giữ RF làm model chính
- `rabies`: precision 1.00, recall 0.80 — đúng dự đoán trước khi train
- Rò rỉ 2/29 dòng do trùng lặp — đo và công bố, không xóa dòng

### 2026-09-13 — Giảng viên thu hẹp phạm vi
- Chỉ còn loài chó; tìm được `dogfinal3.csv` (165 ca thật, Philippines); loại `symtomdata.csv`
- Lập bảng ánh xạ `mapping_dogfinal3.csv`, thêm mã `paralysis` (`symptoms.json` v4)

### 2026-08-12 → 09-07 — Thiết kế ban đầu *(phần lớn đã bị thay thế)*
- Thiết kế 6 loài / 34 bệnh / sinh dữ liệu từ y văn — đã bỏ, xem phần "Đã thay thế" trong DECISIONS.md
- Khảo sát 2 dataset Kaggle được chỉ định → cả hai không train được ([`kaggle_survey.md`](../../ai_service/reports/kaggle_survey.md))

---

## Ghi nhớ thực tế

- **Excel khóa file CSV** khi đang mở → script ghi file thất bại. Đóng Excel trước khi chạy
- **Chạy local đủ 3 service:**
  1. `cd ai_service; .\.venv\Scripts\python.exe -m uvicorn app:app --port 8001 --reload` — log phải có `Train xong: 351 dòng, 44 bệnh, 173 cột feature`
  2. Backend: đặt biến môi trường trong **cùng cửa sổ PowerShell** trước khi `.\mvnw spring-boot:run` — `JWT_SECRET` (≥ 32 ký tự), `GOOGLE_CLIENT_ID/SECRET`, `GROQ_API_KEY`, `SEPAY_*`, DB nếu dùng Neon. Thiếu là báo `Could not resolve placeholder`. Spring Boot không tự đọc file `.env`
  3. `cd fontend_pet; npm run dev`
- `symptoms.json`: thứ tự mảng `symptoms` = thứ tự cột feature. `app.py` train lại mỗi lần khởi động nên đổi file xong chỉ cần restart service, nhưng **các script đánh giá phải chạy lại** để số liệu báo cáo còn khớp

<!-- Mẫu cho session sau:
### YYYY-MM-DD — Tiêu đề ngắn
- Đã làm: ...
- Phát hiện / vấn đề: ...
- Việc tiếp theo: ...
-->
