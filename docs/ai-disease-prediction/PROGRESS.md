# Tiến độ

> **Đọc file này đầu mỗi session. Cập nhật cuối mỗi session có thay đổi thực tế.**
> Chỉ tick `[x]` khi việc đã thực sự xong và chạy được — không tick theo dự định.

## Bảng điều khiển

| | |
|---|---|
| **Giai đoạn hiện tại** | 1A — Dữ liệu thật + mốc đối chứng R1 (**10/11 việc**) |
| **Tiến độ tổng** | 0 / 5 giai đoạn |
| **Cập nhật lần cuối** | 2026-09-14 |
| **Đang chặn** | Không. Chỉ còn báo cáo R1 cho giảng viên |

> ### ✅ R1 ĐÃ CHẠY XONG — 2026-09-14
>
> **Random Forest: accuracy `0.886 ± 0.042`, macro-F1 `0.882 ± 0.045`** (5-fold CV / 141 dòng).
> Hold-out n=29: accuracy `0.862`. Sàn ngẫu nhiên `0.177`.
>
> Số liệu: [`ai_service/reports/r1_metrics.md`](../../ai_service/reports/r1_metrics.md) *(sinh tự động)*
> Diễn giải: [`ai_service/reports/R1_results.md`](../../ai_service/reports/R1_results.md)

> ### 🔴 PHẠM VI ĐÃ ĐỔI LỚN — 2026-09-13
>
> Giảng viên **thu hẹp đề tài còn một loài**. Nhiều phần của `01-OVERVIEW.md` và `03-DATA.md` giờ đã cũ.
> **Đọc [QĐ-10, QĐ-11, QĐ-12](DECISIONS.md) trước khi làm bất cứ việc gì.**
>
> | | Cũ | Mới |
> |---|---|---|
> | Loài | 6 loài | **Chỉ DOG** |
> | Bệnh | 34 | **20** |
> | Feature | 60 | **65** (51 triệu chứng + 14 tiền sử) |
> | `symptoms.json` | v2 | **v4** |
> | Thứ tự làm việc | Tra sách → sinh dữ liệu → train | **Train dữ liệu thật trước (R1)** → rồi mới tra sách |

**Việc tiếp theo:** báo cáo số liệu R1 cho giảng viên, rồi sang **giai đoạn 1B** — tra MSD Vet Manual điền `disease_matrix_source.csv`.

**Hai câu treo từ phiên trước — đã chốt 2026-09-14:** cài cả 4 gói (`scikit-learn` `pandas` `matplotlib` `jupyter`); viết bằng **script `.py`**, không dùng notebook. Notebook để sau cùng nếu cần trình bày.

**Nguồn y văn đã giải quyết:** dùng **MSD/Merck Veterinary Manual** bản online miễn phí — đã kiểm tra có đủ trang cho cả 20 bệnh, có mục *Clinical Findings* và *Epidemiology*, trích dẫn được. Không còn bị chặn vì thiếu Ettinger/Nelson.

**Môi trường:** Python **3.14.7**, venv ở `ai_service/.venv`, thư viện ghim trong `ai_service/requirements.txt` (`scikit-learn 1.9.1` · `pandas 3.0.5` · `matplotlib 3.11.2` · `numpy 2.5.3`). Chạy script bằng `ai_service/.venv/Scripts/python.exe`.

---

## Giai đoạn 1A — Dữ liệu thật + mốc đối chứng R1

*Mục tiêu: có số liệu thật để báo cáo giảng viên, không cần chờ tra y văn. Xem [QĐ-12](DECISIONS.md).*

- [x] Chốt phạm vi mới: chỉ chó, 20 bệnh (QĐ-10)
- [x] Chốt vai trò 3 nguồn dữ liệu (QĐ-11) và thiết kế thí nghiệm R1/R2/R3 (QĐ-12)
- [x] `shared/symptoms.json` **v4** — 51 triệu chứng + 14 tiền sử + 20 bệnh = **65 feature**
- [x] `disease_constraints.csv` viết lại — 20 dòng × 15 cột, bỏ cột `species`, thêm cột `verified`
- [x] `check_constraints.py` cập nhật theo schema mới — đã test ngược bằng 5 lỗi cố ý
- [x] `ai_service/data/external/dogfinal3.csv` + `external/README.md` — nguồn, giấy phép, SHA256
- [x] `mapping_dogfinal3.csv` — ánh xạ 52 cột + 7 nhãn sang mã `symptoms.json`
- [x] `check_mapping.py` — đã test ngược bằng 4 lỗi cố ý
- [x] Cài thư viện + `ai_service/requirements.txt` ghim phiên bản
- [x] `load_real_data.py` — áp bảng ánh xạ, ra ma trận 141 × 51 *(tách file riêng vì R3 dùng lại)*
- [x] **`train_baseline.py` chạy R1** — 141 dòng / 6 bệnh, split 80/20 stratified `random_state=42` + 5-fold CV, xuất confusion matrix và bảng metrics vào `reports/`
- [ ] Báo cáo kết quả R1 cho giảng viên

## Giai đoạn 1B — Ma trận y văn + sinh dữ liệu (R2, R3)

*Chỉ bắt đầu sau khi có số R1. Đây vẫn là phần nặng nhất.*

- [ ] Tra MSD Vet Manual, điền `disease_matrix_source.csv` (dạng dài, có câu trích + URL) — **20 lượt**, làm theo lô 5 bệnh
  - [ ] Lô 1: `parvo` `distemper` `kennel_cough` `leptospirosis` `ckd_dog` *(4 bệnh đã có sẵn trích dẫn từ phiên 2026-09-13, xem QĐ-12)*
  - [ ] Lô 2, 3, 4: 15 bệnh còn lại
- [ ] Bổ sung dòng mới vào bảng thang quy đổi ở `03-DATA.md`: **"clinical signs include ... không kèm trạng từ" → 0.83** (gặp ở MSD, bảng cũ không có)
- [ ] Script xoay `disease_matrix_source.csv` → `disease_matrix.csv` (20 × 65)
- [ ] Trả nợ `disease_constraints.csv`: tạo `disease_constraints_source.csv`, lật cột `verified` sang 1
- [ ] `generate_data.py` — sinh ~6.380 dòng + tiêm 4 loại nhiễu
- [ ] Kiểm tra tỉnh táo: phân bố lớp, tỷ lệ dòng trùng lặp hoàn toàn
- [ ] Chạy **R2** (train thuần dữ liệu sinh) và **R3** (sinh + 113 dòng thật), cùng tập test 28 dòng
- [ ] Bảng so sánh R1 / R2 / R3 — đây là kết quả trung tâm của báo cáo
- [ ] *(tùy chọn)* Kiểm định phụ trên 71 dòng chó của `cleaned_animal`
- [ ] *(tùy chọn)* Mở rộng `kaggle_survey.md` → `dataset_survey.md`, thêm bảng tần suất ~0.44 của `symtomdata` (QĐ-11)

## Giai đoạn 2 — Mô hình

*Mục tiêu: `model.joblib` + toàn bộ số liệu cho báo cáo.*

- [ ] Pipeline tiền xử lý (breed_group, chuẩn hóa cân nặng theo loài, xử lý thiếu dữ liệu)
- [ ] Train/test split 80/20 stratified, `random_state=42`
- [ ] Baseline Logistic Regression
- [ ] Random Forest + GridSearchCV
- [ ] XGBoost + GridSearchCV
- [ ] 5-fold Stratified CV — báo cáo mean ± std
- [ ] Cài species mask + gender mask, đo bảng ablation
- [ ] Cài cơ chế từ chối trả lời, vẽ biểu đồ coverage–accuracy, chốt ngưỡng
- [ ] Bảng metrics tách theo nhóm loài
- [ ] Confusion matrix: bản 34×34 chuẩn hóa + bản gộp 6×6 + bảng top-10 cặp nhầm lẫn
- [ ] Biểu đồ feature importance top-20 + kiểm tra tính hợp lý y khoa
- [ ] **Kiểm tra chốt chặn: accuracy có nằm trong 78–88% không?** Nếu > 92% phải quay lại giai đoạn 1 tăng nhiễu
- [ ] Xuất `model.joblib` (kèm label_encoder, feature_columns, symptoms_version)
- [ ] Xuất toàn bộ hình + `reports/metrics.md`

## Giai đoạn 3 — FastAPI service

- [ ] `ai_service/app.py` — `/predict`, `/health`
- [ ] `ai_service/predict.py` — feature vector, species mask, abstention
- [ ] Kiểm tra `symptoms_version` lúc khởi động
- [ ] `requirements.txt` + `Dockerfile`
- [ ] Chạy được ở local, test bằng curl
- [ ] Deploy (Hugging Face Spaces hoặc Render)
- [ ] Thêm job UptimeRobot ping `/health`

## Giai đoạn 4 — Spring Boot

- [ ] Entity `DiseasePrediction`
- [ ] `DiseasePredictionRepository`
- [ ] DTO: `PredictionRequest`, `PredictionResponse`, `TriageResponse`, `PredictionStatsResponse`
- [ ] `PredictionService` — gọi FastAPI, có timeout, có suy giảm mềm
- [ ] Tích hợp Groq sinh diễn giải (Groq lỗi không được làm hỏng kết quả)
- [ ] `PredictionController` — 5 endpoint
- [ ] Phân quyền theo role
- [ ] Cấu hình `ai.service.url` + khai biến môi trường trên Render
- [ ] Test toàn bộ endpoint bằng Postman

### Resilience pattern *(phần thể hiện hiểu biết microservices — xem QĐ-06)*

- [ ] Cấu hình timeout cho `RestTemplate` (`SimpleClientHttpRequestFactory`) — hiện `ChatService` cũng đang thiếu, sửa luôn thể
- [ ] **Circuit breaker** bằng Resilience4j cho lời gọi `ai_service`
- [ ] **Retry** cho cold start (lần gọi đầu hay fail)
- [ ] **Correlation ID** — sinh `X-Request-Id` ở Spring Boot, truyền sang FastAPI, đưa vào MDC log cả hai phía
- [ ] **Graceful degradation** — xác minh: tắt hẳn `ai_service` thì trang ghi bệnh án vẫn dùng bình thường
- [ ] Ghi lại các pattern đã áp dụng + lý do **cố ý bỏ** Eureka/Config Server (dùng cho báo cáo và phỏng vấn)

## Giai đoạn 5 — React + vòng phản hồi

- [ ] `src/api/predictionApi.ts`
- [ ] `SymptomPicker.tsx` (dùng chung bác sĩ + khách)
- [ ] `AiPredictionPanel.tsx` — gắn vào `doctor/MedicalRecord.tsx`
- [ ] Nút "Dùng kết quả này" điền vào ô chẩn đoán
- [ ] Nút phản hồi đúng/sai của bác sĩ
- [ ] Bước triage trong `BookAppointment.tsx` (chỉ mức ưu tiên)
- [ ] Khối thống kê trong `AdminDashboard.tsx`
- [ ] Disclaimer trên mọi giao diện có kết quả AI
- [ ] Kiểm thử end-to-end với 3 role

## Giai đoạn 6 — Báo cáo *(song song, không chặn code)*

- [ ] Chương: thu thập & tiền xử lý dữ liệu (kèm bảng quy đổi diễn đạt → xác suất)
- [ ] Chương: mô hình & thuật toán
- [ ] Chương: đánh giá (metrics, confusion matrix, ablation, coverage-accuracy)
- [ ] Chương: đánh giá trên dữ liệu thực tế từ vòng phản hồi bác sĩ
- [ ] Mục giới hạn: nêu rõ dữ liệu chủ yếu là sinh tổng hợp
- [ ] Phụ lục: nguồn tra cứu cho từng bệnh trong ma trận xác suất

---

## Nhật ký session

### 2026-09-14 — Chạy xong R1 · chốt QĐ-13

**Đã làm:**

- Cài `ai_service/.venv` + `requirements.txt` ghim phiên bản (kèm `numpy`/`scipy`/`joblib` để kết quả lặp lại được)
- `load_real_data.py` — đọc `dogfinal3.csv`, áp bảng ánh xạ, bỏ 24 dòng `heartworm` → **141 dòng × 51 cột**, khớp đúng phân bố ghi ở QĐ-12
- `train_baseline.py` — chạy R1 với 3 model, hold-out 80/20 + 5-fold CV, xuất `r1_metrics.md` và `r1_confusion_matrix.png`
- `R1_results.md` — phần diễn giải
- Chốt **QĐ-13**: R2 chấm thêm trên cả 141 dòng · không trộn `cleaned_animal` vào R1 · khóa 2 quy tắc trình bày
- Hiệu chỉnh mô tả rủi ro `rabies` ở **QĐ-10** cho khớp số đo thật

**Kết quả R1:**

| Model | Accuracy hold-out (n=29) | Accuracy 5-fold CV |
|---|---|---|
| Dummy | 0.172 | 0.177 ± 0.002 |
| Logistic Regression | 0.931 | 0.893 ± 0.051 |
| **Random Forest** | 0.862 | **0.886 ± 0.042** |

**Phát hiện / vấn đề:**

- **Split thật là 112/29, không phải 113/28** như QĐ-12 ước tính tay. `test_size=0.2` × 141 = 28,2 và scikit-learn **làm tròn lên**. Đã sửa số trong báo cáo; giữ `test_size=0.2` vì "chia 8/2" mới là thứ giảng viên yêu cầu, còn 113/28 chỉ là phép tính nhẩm
- **Logistic Regression thắng RF trên hold-out (7 điểm) nhưng chỉ hơn 0,7 điểm trên CV** — nằm gọn trong độ lệch chuẩn. Đúng lý do QĐ-12 bắt buộc có CV: chỉ nhìn hold-out là kết luận sai. Không đổi model chính, nhưng **phải báo cáo cả LR**
- **`rabies` ra đúng y như dự đoán trước khi train**: precision `1.00`, recall `0.80`. Xác nhận phần hiệu chỉnh QĐ-10 — lo ngại "quá dễ, luôn 100%" sai ở vế recall
- **Rò rỉ 2/29 dòng (6,9%)** do bản sao rơi vào cả train lẫn test. Đã thêm hàm đo vào script. **Không xóa dòng trùng** — xóa là bóp méo phân bố thật; cách đúng là công bố con số
- **Accuracy vượt ngưỡng 78–88% của QĐ-02 nhưng không phải dấu hiệu xấu** — ngưỡng đó đặt cho 34 lớp dữ liệu sinh, đây là 6 lớp dữ liệu thật. Ngưỡng vẫn giữ hiệu lực cho R2/R3
- Mọi cặp nhầm lẫn đều hợp lý về lâm sàng (hô hấp lẫn với hô hấp, tiêu hóa lẫn với tiêu hóa) → model học đúng cấu trúc bệnh lý
- **Tự gây 2 lỗi rồi tự bắt lúc review:** hard-code chuỗi `"n=28"` vào tiêu đề bảng trong khi tập test thật có 29 dòng; và chưa đo rò rỉ dù đã biết tập có 6,4% dòng trùng lặp

**Việc tiếp theo:** báo cáo R1 cho giảng viên → sang giai đoạn 1B, tra MSD Vet Manual theo lô 5 bệnh.

### 2026-09-13 — Giảng viên thu hẹp phạm vi · chuyển sang thiết kế 3 chế độ

**Bối cảnh:** sau khi báo cáo 2 dataset được chỉ định không train được, giảng viên **thu hẹp đề tài còn một loài** (chó hoặc mèo, được phép làm cả hai nếu đủ dữ liệu), và yêu cầu **chia 8/2 train/test trên dữ liệu thật, ghi kết quả trước**, rồi mới sinh dữ liệu và test lại.

**Đã làm:**

- Khảo sát lại dataset theo phạm vi một loài (mở lại QĐ-09). **Không có tập nào cho mèo** → chọn chó, không phải theo sở thích mà theo dữ liệu sẵn có
- Tìm được **2 tập mới**, đo trực tiếp chứ không tin mô tả:
  - `dogfinal3.csv` — **165 dòng dữ liệu phòng khám THẬT** (Cagayan de Oro, Philippines), 7 bệnh, 52 cột nhị phân, giấy phép Unlicense
  - `symtomdata.csv` — 23.999 dòng nhưng **loại**: đúng 2.000 mẫu/bệnh, 29,2% dòng trùng lặp hoàn toàn, tần suất mọi triệu chứng đều ~0.44
- Đo lại `cleaned_animal` (dataset [12]) **theo riêng loài chó**: 75 dòng → 71 dòng / 10 bệnh sau khi gộp nhãn. **Nó có cột giống/tuổi/giới tính/cân nặng** — thứ hai tập GitHub kia không có
- Chốt **QĐ-10** (20 bệnh chó), **QĐ-11** (vai trò 3 nguồn), **QĐ-12** (thí nghiệm 3 chế độ R1/R2/R3)
- `symptoms.json` **v2 → v4**, `disease_constraints.csv` viết lại 20 dòng, `check_constraints.py` cập nhật
- `mapping_dogfinal3.csv` + `check_mapping.py` — 52 cột → 46 ánh xạ được, gom về 33 mã
- Tra MSD Vet Manual cho 4 bệnh mới (`parvo` `leptospirosis` `ckd_dog` `rabies`) — **chứng minh quy trình trích dẫn chạy được**, và 3 con số mình đoán trong `disease_constraints.csv` bị sai thật

**Phát hiện / vấn đề:**

- **Thang quy đổi ở `03-DATA.md` thiếu một dòng.** MSD hay viết *"clinical signs include anorexia, lethargy, vomiting"* — **không kèm trạng từ tần suất nào**. Phải thêm dòng mới → **0.83** (không ép vào nhóm gần nhất, theo đúng quy ước đã chốt)
- **Quy tắc "sách cho số cụ thể" dùng được ngay:** MSD ghi *"Approximately 25% of dogs may have nonhemorrhagic diarrhea"* → `P(bloody_diarrhea | parvo) = 0.75`, có câu trích làm bằng
- **`heartworm` bị loại** vì chẩn đoán thật dựa trên xét nghiệm kháng nguyên chứ không dựa triệu chứng, và MSD ghi *"Most dogs have no, or only mild, clinical signs"*. ⚠️ Lý do "xác suất triệu chứng đều bằng 0" là **sai**, đã ghi rõ trong QĐ-10 để không ai viết lại vào báo cáo
- **`jaw_drop` có trong dữ liệu sinh nhưng không bao giờ có trong tập test thật** → recall của dại ở R2 sẽ thấp hơn ở test nội bộ. Là kết quả hợp lệ, không phải lỗi ma trận — biết trước để không đi sửa nhầm chỗ
- **Mục tiêu accuracy 78–88% (QĐ-02) đặt cho bài toán 34 lớp.** Còn 20 lớp thì bài dễ hơn, rất có thể vượt 92%. Lúc đó **đừng vội tăng nhiễu** — kiểm tra xem do ít lớp hơn hay do dữ liệu quá sạch
- **Excel khóa file CSV** khi đang mở → script ghi file thất bại. Đóng Excel trước khi chạy script
- Bỏ species mask làm mất một bảng ablation của báo cáo. Bù bằng phần so sánh R1/R2/R3 — đổi này có lợi

**Việc tiếp theo:** trả lời 2 câu ở đầu file, rồi viết `train_baseline.py` chạy R1.

### 2026-09-07 (phiên 2) — Viết `disease_constraints.csv` + script kiểm tra

**Đã làm:**

- Chốt hai câu treo: **có** thêm `age_peak_min`/`age_peak_max`; máy **đã có Python 3.14.7**
- Viết `ai_service/data/disease_constraints.csv` — 34 dòng × 15 cột, tổng `n_samples` = **7.950** (mục tiêu ~7.920)
- Viết `ai_service/scripts/check_constraints.py` — chỉ dùng thư viện chuẩn, exit code 1 khi có lỗi để sau cắm được vào CI
- **Test ngược script** bằng 5 lỗi cố ý trên bản sao (lệch cột, xóa dòng bệnh, mâu thuẫn gender/male_ratio, peak vượt khoảng tuổi, thêm loài `OTHER`) → bắt đủ, ra 7 thông báo
- Cập nhật bảng trường trong [03-DATA.md](03-DATA.md) cho khớp schema thật

**Quyết định nhỏ khi viết file** (khác bảng nháp cũ trong 03-DATA.md):

| Thay đổi | Lý do |
|---|---|
| `gender_bias` → **`male_ratio`** | `gender_bias=0.70` không nói rõ lệch về phía nào |
| Thêm **`duration_days_sd`** | Chỉ có `mean` thì mọi ca cùng bệnh ra đúng một số ngày → model học được luật cứng |
| Thêm **`age_peak_ratio`**, **`breed_hint_ratio`** | Cần tỷ lệ đi kèm khoảng peak, nếu không thì "peak" không có nghĩa định lượng |
| Thêm cột **`note`** tiếng Việt không dấu | Ghi lý do ngay tại dòng, khỏi phải tra ngược tài liệu |

**Phát hiện / vấn đề:**

- **Tự gây lỗi lệch cột** ở 2 dòng `arthritis_dysplasia` và `periodontal_disease` (`breed_hint` rơi vào ô `gender`), tự bắt được lúc review. Đây chính là loại lỗi CSV không báo gì cả — là lý do `check_constraints.py` tồn tại
- **File CSV bị Excel khóa** khi đang mở → script sửa file thất bại. Nhớ đóng Excel trước khi chạy script ghi file
- Hai ràng buộc **không diễn đạt được** bằng `breed_group`: `otitis_externa` (giống tai cụp) và `hairball_obstruction` (mèo lông dài). Đã để `any` + ghi vào cột `note`, chấp nhận mất một chút đặc trưng
- **Làm rõ lại phạm vi:** xong `disease_constraints.csv` **không** phải là xong phần ma trận. `disease_matrix.csv` vẫn 0/34 bệnh và là việc nặng nhất còn lại

**Việc tiếp theo:** xác nhận nguồn sách [10][11] — xem 3 nhánh ở đầu file.

### 2026-09-07 — Chốt phương pháp sinh dữ liệu

**Đã làm:**

- Khảo sát mở rộng dataset ngoài 2 tập Kaggle được chỉ định — tìm thêm 5 nguồn (Pet Health Symptoms, UCI Horse Colic, Disease Symptom Prediction, VetCompass, SAVSNET). **Không tập nào thay thế được kế hoạch sinh dữ liệu** → chốt QĐ-09, dừng tìm
- Chốt **thang quy đổi định tính → định lượng**: thêm dòng "most cases", thêm cột "Lấy" (giá trị điểm giữa để dùng trực tiếp)
- Chốt **QĐ-08 — 3 quy tắc gán số**: lấy điểm giữa khoảng · "không nhắc tới" = 0.02 chứ không phải 0.00 · ma trận chốt trước khi train, không sửa sau khi thấy accuracy
- Đặt **tên chính thức cho phương pháp** + tìm được tiền lệ trích dẫn: SymCAT (arXiv:2012.01065) cho Bernoulli sampling, Sherman Kent 1964 cho bảng quy đổi. Ghi vào QĐ-02
- Ghi nhận **giả định Naive Bayes / conditional independence** là giới hạn đã biết, kèm hướng phát triển (Bayesian network) — bắt buộc đưa vào mục Giới hạn của báo cáo

**Phát hiện / vấn đề:**

- **Ma trận phải là 34 × 60, không phải 34 × 46.** Con số 46 sót lại từ `symptoms.json` v1, trước khi thêm 14 mục tiền sử. Nhóm tiền sử cũng cần xác suất riêng theo bệnh — `P(not_vaccinated | parvo) = 0.85`, `P(not_neutered | pyometra) = 1.00`. Nếu để nguyên 46 thì lúc code sẽ hụt 14 cột. Đã sửa trong 03-DATA.md
- Diễn đạt "most cases" **không có trong bảng quy đổi cũ** — nằm giữa "almost always" và "frequently". Đã thêm dòng riêng thay vì ép vào nhóm gần nhất. Quy ước: gặp diễn đạt mới thì thêm dòng, bảng dài ra là dấu hiệu tốt
- Tập "Pet Health Symptoms" trên Kaggle **cũng là dữ liệu sinh tổng hợp, bằng LLM** — xác nhận cách làm của đồ án hợp lệ, mà lại chặt chẽ hơn. Dùng làm so sánh trong chương phương pháp
- QĐ-02 ghi "~7.400 ca" trong khi bảng phân bổ cộng lại ra ~7.920 → đã sửa thành ~7.900

**Việc tiếp theo:** `disease_constraints.csv` — plan 5 bước đã lên, còn 2 câu chờ chốt (xem phần đầu file).

### 2026-08-12 — Thiết kế & khởi tạo tài liệu

- Đọc toàn bộ project, xác định các điểm tích hợp
- Thảo luận và chốt 3 quyết định lớn (xem [DECISIONS.md](DECISIONS.md)): kiến trúc FastAPI + Groq, dữ liệu sinh từ sách trộn Kaggle, phủ cả 6 loài
- Soạn danh sách nháp 34 bệnh + 46 triệu chứng
- Tạo folder tài liệu này
- Bàn kỹ về microservices → chốt QĐ-06: chỉ tách một service, gọi đúng tên là Strangler Fig Pattern, bù bằng resilience pattern thay vì tăng số lượng service
- Chốt QĐ-07: `ai_service` stateless, không có DB riêng — bảng `disease_predictions` thuộc monolith
- Tạo `WORKING-STYLE.md` — quy ước style code, workflow, cách giải thích
- Tạo `shared/symptoms.json` v2 và cấu trúc thư mục `ai_service/`
- Khảo sát 2 dataset Kaggle → **cả hai không train được**: [12] chỉ 431 dòng / 135 nhãn, [13] không có cột nhãn. Vớt được bộ phân loại tiền sử bệnh từ [13]
- **Phát hiện thiếu sót:** đề bài yêu cầu dùng tiền sử bệnh nhưng thiết kế ban đầu không có → đã thêm nhóm `medicalHistory` 14 mục

---

## Nợ kỹ thuật — phải trả trước khi train

### Tài liệu đã cũ so với phạm vi mới *(2026-09-13)*

`DECISIONS.md`, `PROGRESS.md`, `symptoms.json` đã cập nhật. **Ba file sau chưa:**

| File | Chỗ đã cũ |
|---|---|
| `03-DATA.md` | Toàn bộ danh sách 34 bệnh 6 loài · 46 triệu chứng · ma trận 34×60 · bảng phân bổ 350/320/280 · mục nguồn B. Bảng trường `disease_constraints` thì **đã đúng**, chỉ thiếu cột `verified` |
| `01-OVERVIEW.md` | Mục Phạm vi vẫn ghi 6 loài và ~30 bệnh |
| `04-MODEL.md` | Species mask + bảng metrics tách nhóm loài — **không còn dùng** (QĐ-10) |

Chưa sửa vì muốn gom một lượt sau khi có số R1. **Trong lúc đó đừng đọc 3 file này làm chuẩn** — `DECISIONS.md` mới là nguồn đúng.

### `disease_constraints.csv` — 7 cột số chưa có nguồn

File đã đúng cấu trúc và qua được script kiểm tra, **nhưng các con số y khoa trong đó là ước lượng của Claude, không tra nguồn nào**. Đủ dùng để dựng script và chạy thử, **không đủ để trích dẫn trong báo cáo**.

| Cột | Nguồn thật sự | Cần tra sách? |
|---|---|---|
| `disease`, `species`, `gender` | Copy từ `symptoms.json` | ❌ Đã chốt ở QĐ-03 |
| `n_samples` | Bảng phân bổ [03-DATA.md](03-DATA.md) | ❌ Là **quyết định thiết kế**, không phải mệnh đề y khoa |
| `age_months_min` / `max` | Tuổi thọ loài, kiến thức chung | ⚠️ Nhẹ |
| **`age_peak_min` / `max` / `age_peak_ratio`** | **Ước lượng** | ✅ **Bắt buộc** — là mệnh đề dịch tễ |
| **`male_ratio`** (FLUTD 0.70) | **Ước lượng** | ✅ **Bắt buộc** — mèo đực hay tắc niệu là thật, con số 0.70 thì không có nguồn |
| **`breed_hint_ratio`** | **Ước lượng** | ✅ Bắt buộc |
| `duration_days_mean` / `sd` | Ước lượng | ⚠️ Vừa |

**Cách trả nợ:** khi tra sách cho `disease_matrix.csv`, mở luôn phần *Signalment* / *Epidemiology* của cùng mục bệnh — sách thú y luôn đặt hai phần này ngay cạnh *Clinical Signs*. Tra một lượt được cả hai file.

**Chưa làm, cần làm khi bắt đầu tra sách:**

- [ ] Thêm cột `verified` (0/1) vào `disease_constraints.csv`, y hệt cột Xác minh ở bảng bệnh trong 03-DATA.md
- [ ] Tạo `ai_service/data/disease_constraints_source.csv` — định dạng dài `disease,field,value,book_phrase,source`, cùng kiểu với `disease_matrix_source.csv`
- [ ] Bổ sung kiểm tra cột `verified` vào `check_constraints.py`

QĐ-08 quy tắc 3 (chốt dữ liệu trước khi train, không sửa sau khi thấy accuracy) **áp cho cả file này**, không riêng ma trận.

---

<!-- Mẫu cho session sau:
### YYYY-MM-DD — Tiêu đề ngắn
- Đã làm: ...
- Phát hiện / vấn đề: ...
- Việc tiếp theo: ...
-->
