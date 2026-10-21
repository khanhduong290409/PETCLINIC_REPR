# Nhật ký quyết định

> Ghi lại các quyết định đã chốt **cùng lý do**.
> Muốn đổi một quyết định ở đây → nêu vấn đề với người dùng trước, đừng tự đổi.
>
> File chia hai phần: **Phần A — đang hiệu lực** (đọc phần này là đủ để làm việc) và **Phần B — đã thay thế** (chỉ để tra cứu lịch sử).
> Toàn văn các quyết định cũ trước lần dọn 2026-10-05 nằm ở commit `6e430a9`.

## Tóm tắt — đang hiệu lực

| QĐ | Nội dung một dòng |
|---|---|
| **16** | **Đổi dữ liệu sang `cleaned_animal`: nhiều loài, bệnh ≥ 3 dòng (44 bệnh / 351 dòng), 3-fold stratified CV** |
| **15** | **Chẩn đoán AI là trang riêng `/ai-diagnosis`, người dùng thấy tên bệnh, bắt buộc đăng nhập, không lưu lịch sử** *(phần "chỉ chó, 6 bệnh" của khung lưu ý đổi theo QĐ-16)* |
| 12 | Đánh giá: báo cáo per-class, có Dummy, không trộn nguồn *(phần split 80/20 + 5-fold đổi theo QĐ-16)* |
| 01 | Model chạy trong FastAPI riêng, Spring Boot gọi sang |
| 04 | `shared/symptoms.json` là nguồn sự thật duy nhất cho danh sách triệu chứng |
| 06 | Chỉ tách một service — gọi đúng tên Strangler Fig |
| 07 | `ai_service` stateless, không có database riêng |

---

# Phần A — Đang hiệu lực

## QĐ-16 · Đổi dữ liệu sang `cleaned_animal`, quay lại nhiều loài

**Ngày:** 2026-10-17 · **Trạng thái:** Đã chốt (quyết định của người dùng) · **Thay thế QĐ-10, QĐ-14, phần split của QĐ-12**

**Bối cảnh:** giảng viên không chấp nhận `dogfinal3` vì không phải nguồn chính thống, và hỏi vì sao không dùng 2 dataset trong `ai_service/data/`. Giảng viên chấp nhận "dữ liệu ít thì train ít". Đo lại cả 2 dataset (2026-10-17):

| Dataset | Kết luận | Lý do (số đo được) |
|---|---|---|
| `cleaned_animal_disease_prediction.csv` — tài liệu tham khảo [12] của đề bài | **Dùng** | 431 dòng, 8 loài, có giống/tuổi/giới tính/cân nặng/nhiệt độ/nhịp tim. 139 nhãn gốc nhưng nhiều nhãn là tên đồng nghĩa (`Parvovirus` / `Canine Parvovirus`) → gộp tay trong cùng loài (`mapping_cleaned_animal.csv`) còn **44 bệnh có ≥ 3 dòng, 351 dòng** |
| `veterinary_clinical_data.csv` | **Loại, kể cả học không giám sát** | Dữ liệu sinh ngẫu nhiên: 324/5.020 dòng chó có triệu chứng gia súc/gia cầm (*giảm đẻ trứng, sưng bầu vú, "Signs in ewe"*), có "Death" là triệu chứng; 28,6% dòng lặp cùng một triệu chứng 2–3 lần (nếu chọn ngẫu nhiên đều chỉ ~1,1%); `MedicalHistory` chia đều ~800–1.000 mỗi loại, tuổi trung bình giống nhau giữa các nhóm. KMeans k = 5/10/20/40 cho silhouette 0,06–0,11 (≈ không có cụm). Dù có cụm thì cụm không mang tên bệnh → không tính được precision/recall/F1/confusion matrix |

**Quyết định:**

| Hạng mục | Quyết định |
|---|---|
| Dữ liệu train | **Chỉ** `cleaned_animal`, qua `mapping_cleaned_animal.csv` (gộp tên đồng nghĩa, ánh xạ triệu chứng) |
| Phạm vi | **Tất cả 8 loài** (số bệnh / số dòng): Chó 6 / 63 · Mèo 7 / 56 · Bò 6 / 57 · Ngựa 8 / 56 · Cừu 4 / 32 · Dê 4 / 31 · Lợn 5 / 29 · Thỏ 4 / 27 |
| Ngưỡng | Bệnh **≥ 3 dòng** là model chính. Bệnh dưới ngưỡng liệt kê trong báo cáo là "chưa đủ dữ liệu" |
| Đánh giá | **3-fold stratified CV** (mỗi lượt 2 train / 1 test mỗi bệnh, xoay 3 lượt để mọi dòng được test đúng 1 lần), báo cáo `mean ± std`. Không dùng hold-out 80/20 vì lớp 3 dòng không chia được |
| Thí nghiệm so sánh | Ngưỡng ≥ 5 dòng (32 bệnh / 310 dòng, 5-fold CV) |
| Feature | 173 cột: loài (one-hot) + **giống** (one-hot, theo yêu cầu người dùng) + cờ triệu chứng + tuổi, cân nặng, nhiệt độ, nhịp tim, số ngày bệnh, giới tính |
| Nguồn triệu chứng | **Chỉ 4 cột chữ `Symptom_1..4`. Bỏ 9 cột Yes/No** (`Vomiting`, `Diarrhea`...) — đo trên 431 dòng, không nhìn nhãn: cột Yes/No gần như ngẫu nhiên, mâu thuẫn với cột chữ (vd. cột chữ ghi Diarrhea → cột `Diarrhea` = Yes 56%, không ghi → vẫn 48%). Giữ chúng làm RF giảm 0.425 → 0.385 |
| Ô bỏ trống khi dự đoán | Ô số → trung vị của loài. Giống / giới tính → dự đoán với mọi giống / giới tính của loài rồi lấy trung bình có trọng số theo tần suất. Response trả `imputed_fields` để giao diện báo cho người dùng |
| Model chạy trong `app.py` | RF 300 cây, `random_state=42`, train trên **toàn bộ** 351 dòng (hiệu năng đã báo cáo bằng CV) |
| Loài | Species mask trong `app.py`: chỉ trả về bệnh của đúng loài đã chọn |

**Kết quả (2026-10-18, [`ca_metrics.md`](../../ai_service/reports/ca_metrics.md), đánh giá ở [`ca_results.md`](../../ai_service/reports/ca_results.md)):** RF accuracy **0.425 ± 0.052**, precision / recall / F1 macro **0.309 / 0.349 / 0.305**. Dummy (bệnh phổ biến nhất của loài) 0.330 / F1 macro 0.094. Thấp hơn nhiều so với `dogfinal3` (0.886) vì 44 bệnh / 8 loài, mỗi dòng chỉ ≤ 4 triệu chứng chung chung. **Không tinh chỉnh tham số để nâng số.**

**Giới hạn phải nêu trong báo cáo:** ~3–21 dòng mỗi bệnh là rất nhỏ; với lớp 3 dòng, recall chỉ nhận các giá trị 0 / 33 / 67 / 100%, sai một ca là lệch 33 điểm. Nguồn Kaggle không mô tả quy trình thu thập. Model chỉ phù hợp gợi ý top-3 tham khảo.

`dogfinal3.csv` không còn dùng trong train/test; chỉ còn ở chương khảo sát dataset của báo cáo (kèm lý do: giảng viên đánh giá không chính thống).

---

## QĐ-15 · Chẩn đoán AI là một trang riêng, hiện tên bệnh cho người dùng

**Ngày:** 2026-10-05 · **Trạng thái:** Đã chốt (quyết định của người dùng) · **Thay thế [QĐ-05](#phần-b--đã-thay-thế-chỉ-để-tra-cứu)**

Chẩn đoán AI **tách khỏi luồng đặt lịch**, thành trang độc lập `/ai-diagnosis` (link "Chẩn đoán AI" trên navbar). Người dùng tự chọn triệu chứng, bấm "Phân tích", xem **tên bệnh**, % xác suất, mức độ khẩn cấp, mô tả và khuyến nghị.

| Hạng mục | Quyết định |
|---|---|
| Vị trí | Trang riêng `fontend_pet/src/pages/AiDiagnosis.tsx`. Đặt lịch và bệnh án **không còn** dính AI (đã gỡ toàn bộ) |
| Tên bệnh | **Hiện cho người dùng** — đảo ngược QĐ-05 |
| Đăng nhập | **Bắt buộc** (`ProtectedRoute` + `/api/ai/predict` cần JWT). `/api/ai/symptoms` vẫn public |
| Lịch sử | **Không lưu** — `ai_service` và Spring Boot đều không ghi kết quả |
| Lưu ý bắt buộc trên trang | Chỉ tham khảo, không thay thế bác sĩ · chỉ áp dụng cho chó · **chỉ nhận diện được 6 bệnh** (liệt kê tên) · ca nguy kịch đi khám ngay |
| Độ tin cậy thấp | Xác suất top-1 **< 0.5** → hiện cảnh báo "triệu chứng chưa khớp rõ với 6 bệnh" |
| Danh sách triệu chứng | Chỉ **31 mã** có trong dữ liệu train (`/symptoms` tự lọc). 20 mã luôn = 0 không hiện vì chọn vào cũng không đổi kết quả |

**Vì sao bù được rủi ro mà QĐ-05 lo:** lo ngại cũ là khách tự chẩn đoán, hoảng loạn, tự mua thuốc. Trang mới giảm thiểu bằng: khung lưu ý luôn hiện, mỗi bệnh có khuyến nghị dẫn về phòng khám (không gợi ý thuốc), cảnh báo độ tin cậy thấp, nút "Đặt lịch khám với bác sĩ" ngay dưới kết quả.

---

## QĐ-14 · Phạm vi chốt cuối: 6 bệnh của `dogfinal3`, chỉ dữ liệu thật

**Ngày:** 2026-10-05 · **Trạng thái:** ⚠️ **Đã bị QĐ-16 thay thế** (2026-10-17) — giữ lại để tra cứu · *Từng thay thế phần còn lại của QĐ-02, QĐ-08, QĐ-11, QĐ-12 (R2/R3), QĐ-13*

Chức năng chỉ chẩn đoán **6 bệnh** có trong `dogfinal3.csv`:

| Mã | Tên | Nhãn gốc `dogfinal3` | Số ca | Mức độ |
|---|---|---|---|---|
| `distemper` | Bệnh Care (Carré) | `caninedistemper` | 25 | URGENT |
| `rabies` | Bệnh dại | `rabies` | 25 | URGENT |
| `parvo` | Parvovirus | `canineparvovirus` | 24 | URGENT |
| `leptospirosis` | Bệnh Leptospira | `leptospirosis` | 24 | URGENT |
| `kennel_cough` | Ho cũi chó | `kennelcough` | 22 | SOON |
| `ckd_dog` | Bệnh thận mạn | `kidneydisease` | 21 | SOON |
| | | | **141** | |

**Bối cảnh:** sau báo cáo R1 (15/09), yêu cầu mới là chỉ làm đúng các bệnh có dữ liệu thật và **không dùng dữ liệu sinh từ y văn**. Xem [`R1_extended_summary.md`](../../ai_service/reports/R1_extended_summary.md).

**Hệ quả:**

| Hạng mục | Quyết định |
|---|---|
| Dữ liệu train | **Chỉ** `dogfinal3.csv` (141 dòng sau khi bỏ `heartworm`), qua `mapping_dogfinal3.csv` |
| Feature | 51 cờ triệu chứng nhị phân của `symptoms.json`. **Không** dùng giống/tuổi/giới tính/cân nặng/tiền sử — `dogfinal3` không có các cột này |
| Nhánh y văn (ma trận xác suất, sinh dữ liệu, R2, R3) | **Bỏ hẳn** |
| `cleaned_animal`, `veterinary_clinical_data`, `symtomdata` | Không dùng trong train/test. Chỉ còn xuất hiện ở chương khảo sát dataset của báo cáo |
| Model | Random Forest là model chính (yêu cầu phi chức năng). Logistic Regression + Dummy chỉ để so sánh trong báo cáo |
| Model chạy trong `app.py` | **Đúng model R1**: RF 300 cây, `random_state=42`, train 112 dòng của split 80/20, **không augmentation** |
| Thí nghiệm phụ đã làm | So sánh 70/30 vs 80/20; augmentation lật bit (kết quả âm tính — báo cáo trung thực, **không** thử tham số tới khi ra số đẹp) |

**Vì sao bỏ augmentation (2026-10-05):** đã đo, augmentation không cải thiện (LR giữ 0.931, RF giảm 0.862 → 0.828). Giảng viên đồng ý: tăng cường không thay đổi nhiều thì dùng model chưa tăng cường. Augmentation chỉ còn là một thí nghiệm trong báo cáo.
| 14 bệnh còn lại trong `symptoms.json` | Không dùng. Không mở rộng khi chưa có dữ liệu thật |

**Giới hạn phải nêu trong báo cáo:** 141 dòng là nhỏ; đầu vào chỉ có triệu chứng nên chưa đáp ứng đủ phần "giống, tuổi, giới tính, tiền sử" của đề bài — đây là hệ quả của việc chỉ dùng dữ liệu thật, phải nói rõ chứ không che.

---

## QĐ-10 · Chỉ loài chó · bỏ `heartworm` · giữ `rabies`

**Ngày:** 2026-09-13 · **Trạng thái:** ⚠️ **Đã bị QĐ-16 thay thế** (2026-10-17, quay lại nhiều loài) — giữ lại để tra cứu

**Chỉ chó:** yêu cầu của giảng viên là thu hẹp còn một loài. Chọn chó vì không tìm được tập dữ liệu dạng bảng nào cho mèo.

**Bỏ `heartworm`** (mất 24/165 dòng của `dogfinal3`):

1. Chẩn đoán thật dựa trên **xét nghiệm kháng nguyên**, không dựa trên triệu chứng
2. MSD ghi *"Most dogs have no, or only mild, clinical signs"* → ca có triệu chứng là tập con thiên lệch
3. Triệu chứng trùng lặp nặng với `kennel_cough` (ho, khó thở, ngất)

⚠️ Không dùng lý do "xác suất triệu chứng đều bằng 0" — câu đó sai.

**Giữ `rabies`** — đã đo trên 141 dòng:

| | Kết quả đo |
|---|---|
| `aggression` | 18 dòng, **cả 18 đều là rabies** → precision gần 1.00 |
| Ca rabies không có `aggression` | 7/25 → recall không thể đạt 100% (đo được 0.80) |
| `jaw_drop` | 0/141 dòng — không xuất hiện |

**Bắt buộc khi báo cáo:** báo cáo per-class; nêu rõ precision rabies cao là **đặc tính của bệnh**, không phải thành tích của model.

**Dòng 52 (vector toàn 0, chỉ có `pica` — mã đã bỏ khi ánh xạ): giữ, không xóa.** Bỏ một dòng vì biết trước model sẽ đoán sai là chọn dữ liệu theo kết quả mong muốn.

---

## QĐ-12 · Giao thức đánh giá

**Ngày:** 2026-09-13 · **Trạng thái:** Đã chốt *(phần R2/R3 đã bỏ theo QĐ-14)*

> ⚠️ Hai gạch đầu dòng về split 80/20 và 5-fold dưới đây là của `dogfinal3`, đã đổi thành **3-fold stratified CV** theo QĐ-16. Các quy tắc còn lại vẫn hiệu lực.

- Split **80/20 stratified**, `random_state=42` → 112 train / 29 test *(scikit-learn làm tròn lên, không phải 113/28)*
- **Kèm 5-fold stratified CV**, báo cáo `mean ± std`. Lý do: test 29 dòng ≈ 5 ca/lớp, sai một ca là recall nhảy ~20 điểm
- **Báo cáo cả hai con số** (hold-out và CV), bất kể con số nào đẹp hơn
- Báo cáo **per-class** precision/recall/F1 + confusion matrix
- Có model **Dummy** làm sàn so sánh
- **Đo và công bố** rò rỉ do dòng trùng lặp (2/29 dòng test), **không** xóa dòng trùng
- Không trộn dữ liệu nguồn khác vào tập train (model sẽ học nguồn dữ liệu thay vì học bệnh)

---

## QĐ-01 · Kiến trúc: FastAPI riêng

**Ngày:** 2026-08-12 · **Trạng thái:** Đã chốt

Model chạy trong service Python FastAPI độc lập (`ai_service/app.py`). Spring Boot gọi sang qua HTTP.

**Lý do:** yêu cầu Random Forest + confusion matrix + Accuracy/Precision/Recall/F1 là hệ sinh thái scikit-learn. Dùng Python thì script đánh giá và service dùng chung một code đọc dữ liệu.

**Đã loại:**
- *Export ONNX chạy trong Java* — thêm thư viện nặng, khó debug
- *Chỉ prompt Groq LLM* — không có train/test split, không có confusion matrix → không đáp ứng yêu cầu phi chức năng

**Groq diễn giải kết quả:** chưa làm, là tùy chọn. Nếu làm thì Groq chỉ viết diễn giải **sau khi** đã có kết quả, không tham gia vào con số dự đoán.

**Đánh đổi:** phải deploy thêm một service, free tier có cold start → Hugging Face Spaces + UptimeRobot ping.

---

## QĐ-04 · `symptoms.json` là nguồn sự thật duy nhất

**Ngày:** 2026-08-12 · **Trạng thái:** Đã chốt

Danh sách triệu chứng nằm ở một file duy nhất `shared/symptoms.json`. FastAPI đọc để dựng feature vector, React lấy qua `/api/ai/symptoms`.

**Lý do:** thứ tự phần tử trong mảng `symptoms` chính là thứ tự cột feature vector. Khai báo riêng ở nhiều nơi thì lệch một dòng là model đoán sai hoàn toàn **mà không báo lỗi**.

**Quy tắc:** chỉ thêm vào cuối mảng, không chèn giữa, không xóa. Đổi file thì tăng `version` và **chạy lại các script đánh giá** để số liệu báo cáo còn khớp. (`app.py` train lại mỗi lần khởi động nên service tự khớp.)

---

## QĐ-06 · Chỉ tách một service — gọi đúng tên Strangler Fig

**Ngày:** 2026-08-12 · **Trạng thái:** Đã chốt

Chỉ trích xuất **duy nhất** `ai_service`. Không tách thêm service nào khác.

**Lý do:** microservices là thuộc tính của cả hệ thống, không phải của một service. Đập monolith ra mất 3–5 tuần, phá nhiều khóa ngoại, thêm cold start trên Render — demo sẽ tệ đi rõ rệt.

**Cách bù giá trị chứng minh:** tăng chất lượng pattern thay vì số lượng service — timeout, retry, circuit breaker, graceful degradation; **cố ý bỏ** Eureka/Config Server và giải thích được vì sao (over-engineering với vài endpoint cố định).

**Cách viết vào báo cáo/CV** (không viết "áp dụng kiến trúc Microservices"):

> Áp dụng Strangler Fig Pattern để bóc tách dần monolith: trích xuất chức năng dự đoán bệnh thành ML inference service riêng (Python/FastAPI, Random Forest, 6 lớp bệnh), tích hợp với Spring Boot qua REST; cấu hình timeout và trả lỗi mềm để hệ thống chính vẫn hoạt động khi service AI gián đoạn.

---

## QĐ-07 · `ai_service` stateless, không có database riêng

**Ngày:** 2026-08-12 · **Trạng thái:** Đã chốt

`ai_service` không có database. Hiện kết quả dự đoán **không được lưu ở đâu** (QĐ-15). Nếu sau này cần lưu thì lưu trong Postgres (Neon) của monolith.

**Lý do:**
1. "Database per service" nghĩa là *không dùng chung DB*, không phải *mỗi service phải có DB*
2. Inference service chuẩn (TF Serving, TorchServe, SageMaker Endpoint) đều không có DB — feature vào, prediction ra
3. Nếu lưu, kết quả dự đoán gắn với `Pet`/`User` — thuộc dữ liệu của monolith

*Ghi chú:* nếu backend đã từng chạy với bản tích hợp cũ thì DB còn 2 cột `symptom_codes`, `ai_prediction` trong bảng `appointments` (Hibernate `ddl-auto=update` không tự xóa cột). Code không còn dùng; có thể `ALTER TABLE appointments DROP COLUMN ...` bằng tay nếu muốn dọn.

**Tuyệt đối không** cho `ai_service` cắm thẳng vào DB của monolith.

---

# Phần B — Đã thay thế *(chỉ để tra cứu)*

| QĐ | Nội dung cũ | Bị thay bởi | Còn giữ lại gì |
|---|---|---|---|
| 02 | Sinh ~7.900 ca từ ma trận xác suất y văn (Ettinger, Nelson), trộn Kaggle | QĐ-14 | Không |
| 03 | Phủ 6 loài, 34 bệnh, species mask, metrics tách theo loài | QĐ-10 → QĐ-14 | Không |
| 05 | Khách không được thấy tên bệnh, chỉ thấy mức ưu tiên; lọc ở Spring Boot | QĐ-15 | Tinh thần "kết quả cuối do bác sĩ xác nhận" → thành khung lưu ý + nút đặt lịch trên trang mới |
| 08 | Quy tắc gán số trong ma trận xác suất | QĐ-14 (bỏ ma trận) | Tinh thần "chốt giao thức trước khi thấy kết quả" → đã chuyển vào QĐ-12 |
| 09 | Dừng tìm thêm dataset | Mở lại khi đổi phạm vi, tìm được `dogfinal3` | Bảng lý do loại 5 dataset — dùng cho chương khảo sát |
| 11 | Ba nguồn dữ liệu: y văn (train chính) + `dogfinal3` + `cleaned_animal` | QĐ-14 | Lý do loại `symtomdata.csv` (2.000 mẫu/bệnh đều tăm tắp, 29,2% dòng trùng, tần suất triệu chứng đều ~0.44) — dùng cho chương khảo sát |
| 12 (R2/R3) | Ba chế độ R1/R2/R3 so sánh dữ liệu thật với dữ liệu sinh | QĐ-14 | Chỉ còn R1 = giao thức đánh giá ở QĐ-12 phần A |
| 13 | Chấm R2 trên 141 dòng; `cleaned_animal` làm tập kiểm định thứ hai | QĐ-14 | Lý do không trộn `cleaned_animal` vào train → đã chuyển vào QĐ-12 |
