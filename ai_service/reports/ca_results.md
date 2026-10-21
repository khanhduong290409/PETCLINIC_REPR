# Đánh giá kết quả — `cleaned_animal`, 8 loài, 44 bệnh

> Viết tay, diễn giải số liệu trong [`ca_metrics.md`](ca_metrics.md) (file sinh tự động, chạy ngày 2026-10-18).
> Chạy lại `ai_service/scripts/train_cleaned_animal.py` mà số liệu đổi thì phải sửa file này cho khớp.

## 1. Kết quả chính

Random Forest (300 cây, `random_state=42`), 3-fold stratified CV, 351 dòng / 44 bệnh, có species mask:

| Chỉ số | Macro | Weighted |
|---|---|---|
| **Accuracy** | **0.425 ± 0.052** | |
| **Precision** | 0.309 ± 0.033 | 0.378 ± 0.029 |
| **Recall** | 0.349 ± 0.066 | 0.425 ± 0.052 |
| **F1-score** | 0.305 ± 0.047 | 0.375 ± 0.038 |

- **Macro**: trung bình cộng của từng bệnh, mỗi bệnh nặng như nhau.
- **Weighted**: trung bình có trọng số theo số ca, nên gần với accuracy.

## 2. So với mức sàn và model khác

| Model | Accuracy | Precision (macro) | Recall (macro) | F1 (macro) |
|---|---|---|---|---|
| Dummy — luôn đoán bệnh nhiều ca nhất của loài | 0.330 | 0.065 | 0.182 | 0.094 |
| Logistic Regression | 0.359 | 0.251 | 0.299 | 0.257 |
| **Random Forest** | **0.425** | **0.309** | **0.349** | **0.305** |

- RF hơn Dummy ~10 điểm accuracy và **gấp 3 lần F1 macro**. Dummy đạt accuracy 0.33 chỉ nhờ luôn đoán bệnh đông ca nhất (parvo, cow_brd...), nên F1 macro của nó gần 0. Chênh lệch F1 macro cho thấy model **có học được** tín hiệu từ dữ liệu, dù tín hiệu yếu.
- RF hơn LR ở mọi chỉ số, phù hợp với việc chọn RF làm model chính.

## 3. Theo loài (trung bình per-class của RF)

| Loài | Số bệnh | Precision | Recall | F1 |
|---|---|---|---|---|
| Ngựa | 8 | 0.42 | 0.46 | 0.44 |
| Bò | 6 | 0.38 | 0.38 | 0.38 |
| Lợn | 5 | 0.47 | 0.34 | 0.36 |
| Chó | 6 | 0.32 | 0.35 | 0.33 |
| Thỏ | 4 | 0.27 | 0.30 | 0.29 |
| Cừu | 4 | 0.21 | 0.28 | 0.24 |
| Dê | 4 | 0.21 | 0.27 | 0.23 |
| Mèo | 7 | 0.23 | 0.24 | 0.22 |

**Nhận diện tốt** (đọc từ confusion matrix): `goat_cae` 15/17, `rabbit_rhd` 11/13, `parvo` 12/21, `kennel_cough` 9/11, `horse_influenza` 9/14, `cow_johnes` 7/9, `horse_epm` 3/3.

**Hay nhầm:**
- `cow_tuberculosis` ↔ `cow_brd`: 8/16 ca lao bị đoán là bệnh hô hấp phức hợp. Cả hai đều ho, sốt, li bì, chán ăn (xem mục 6).
- Mèo: `cat_herpesvirus`, `cat_calicivirus`, `cat_uri` lẫn vào nhau. Trên thực tế cả ba đều là bệnh hô hấp trên với triệu chứng gần như trùng nhau.
- Dê: gần như mọi ca đều bị kéo về `goat_cae` (lớp đông nhất); `goat_pneumonia`, `goat_respiratory` có recall 0.
- Bệnh chỉ có 3 ca (`cat_asthma`, `sheep_chlamydia`, `pig_classical_swine_fever`, `rabbit_syphilis`...) phần lớn có recall 0: mỗi fold chỉ có 2 ca để học.

## 4. So sánh cách chia dữ liệu: 3-fold CV, 70/30, 80/20

Hold-out chạy với 5 seed khác nhau, lấy trung bình ± độ lệch chuẩn (mục 3 của `ca_metrics.md`):

| Cách chia | Train / Test | Accuracy | Precision (macro) | Recall (macro) | F1 (macro) | Accuracy thấp nhất – cao nhất |
|---|---|---|---|---|---|---|
| **3-fold CV** (mô hình chính) | 234 / 117 mỗi fold | **0.425 ± 0.052** | 0.309 | 0.349 | 0.305 | — |
| Hold-out 70/30 | 245 / 106 | 0.402 ± 0.045 | 0.291 | 0.326 | 0.289 | 0.349 – 0.472 |
| Hold-out 80/20 | 280 / 71 | 0.431 ± 0.034 | 0.295 | 0.363 | 0.309 | 0.380 – 0.479 |

**Nhận xét:**
- Ba cách chia cho kết quả **xấp xỉ nhau** (0.40–0.43). Đổi cách chia chỉ đổi **cách đo**, không làm model học tốt hơn.
- 80/20 nhỉnh hơn 70/30 một chút vì có thêm 35 dòng để train. Với dữ liệu ít, mỗi dòng train thêm đều có ích.
- **Một lần chia hold-out không đáng tin:** cùng là 70/30, đổi seed là accuracy nhảy từ 0.349 lên 0.472 (chênh 12 điểm). Bệnh 3 dòng chia 70/30 thì chỉ có 1 dòng test, nên đoán đúng hay sai một ca làm recall của bệnh đó nhảy giữa 0 và 100%.
- Vì vậy **3-fold CV là con số chính**: mọi dòng đều được test đúng một lần, nên không phụ thuộc may rủi của một lần chia.

## 5. Trước và sau tăng cường dữ liệu

**Cách tăng cường:** mỗi dòng train sinh thêm N bản sao. Mỗi bản sao đảo ngẫu nhiên một tỉ lệ cột triệu chứng (có ↔ không), và nhân các cột số (tuổi, cân nặng, nhiệt độ, nhịp tim, số ngày) với nhiễu ±5%. **Chỉ tăng cường tập train của từng fold**; tập test giữ nguyên dữ liệu thật. Nếu tăng cường trước khi chia, bản sao của dòng test sẽ lọt vào train và cho số đẹp giả.

| Cấu hình | Accuracy | Precision (macro) | Recall (macro) | F1 (macro) |
|---|---|---|---|---|
| **Trước tăng cường** | **0.425 ± 0.052** | **0.309** | **0.349** | **0.305** |
| Sau: ×2 bản sao, đảo 5% | 0.413 ± 0.029 | 0.284 | 0.338 | 0.291 |
| Sau: ×5 bản sao, đảo 5% | 0.419 ± 0.018 | 0.279 | 0.339 | 0.289 |
| Sau: ×5 bản sao, đảo 10% | 0.390 ± 0.031 | 0.270 | 0.323 | 0.278 |

**Nhận xét:**
- Tăng cường **không cải thiện**, mọi chỉ số đều giảm nhẹ, và càng đảo nhiều (10%) càng giảm. Kết quả này giống thí nghiệm tăng cường trên `dogfinal3` trước đây (RF 0.862 → 0.828).
- Lý do: bản sao được tạo từ chính dữ liệu cũ nên **không mang thêm thông tin mới**. Đảo bit chỉ thêm nhiễu, có thể tạo ra tổ hợp triệu chứng không có thật. Vấn đề của dataset là triệu chứng trùng nhau giữa các bệnh (mục 6), mà nhân bản không giải quyết được.
- Theo nguyên tắc đã áp dụng với `dogfinal3` (giảng viên đồng ý): tăng cường không cải thiện thì **dùng model chưa tăng cường**. Thí nghiệm này chỉ ghi trong báo cáo.

## 6. Vì sao chỉ số thấp

### 6.1. Triệu chứng của các bệnh trùng nhau, nguyên nhân chính

Đo trên 351 dòng (triệu chứng lấy từ 4 cột chữ):

| Chỉ số | Giá trị |
|---|---|
| Số triệu chứng mỗi dòng | trung bình **3.99** (tối đa 4, vì dataset chỉ có 4 cột triệu chứng) |
| Số **bộ triệu chứng khác nhau** trong cả dataset | chỉ **64** bộ cho 351 dòng |
| Dòng có bộ triệu chứng **giống hệt** một dòng của **bệnh khác cùng loài** | **292/351 (83%)** |
| Tần suất triệu chứng phổ biến nhất | chán ăn 80%, sốt 74%, li bì 65%, ho 45% |
| Dòng có cả 3 triệu chứng sốt + li bì + chán ăn | 122/351 (35%) |

Nghĩa là với **83% số ca**, chỉ nhìn triệu chứng thì **không thể** phân biệt được bệnh: cùng một bộ triệu chứng có ở ít nhất 2 bệnh khác nhau. Model phải dựa vào tuổi, cân nặng, nhiệt độ, nhịp tim, giống, vốn là tín hiệu yếu.

Ví dụ ở bò, tần suất triệu chứng của hai bệnh gần như giống hệt:

| Triệu chứng | Lao bò (16 ca) | Bệnh hô hấp phức hợp (17 ca) |
|---|---|---|
| Ho | 94% | 88% |
| Li bì | 88% | 82% |
| Chán ăn | 88% | 71% |
| Sốt | 81% | 94% |

Trên thực tế lao bò được chẩn đoán bằng xét nghiệm (tuberculin), không phải bằng triệu chứng, nên model nhầm 8/16 ca lao sang bệnh hô hấp là điều dễ hiểu.

### 6.2. Quá ít dữ liệu mỗi bệnh

- 44 bệnh chia nhau 351 dòng, mỗi bệnh **3–21 dòng**, trung bình 8.
- Với 3-fold CV, bệnh 3 dòng chỉ có **2 ca để học** mỗi lượt. Recall của bệnh đó chỉ nhận các giá trị 0 / 33 / 67 / 100%.
- Bằng chứng: khi chỉ giữ bệnh ≥ 5 dòng (32 bệnh), accuracy tăng từ 0.425 lên **0.497**, F1 macro từ 0.305 lên **0.389** (mục 2 của `ca_metrics.md`).

### 6.3. Chất lượng dữ liệu

- 9 cột Yes/No (`Vomiting`, `Diarrhea`...) mâu thuẫn với 4 cột chữ, gần như điền ngẫu nhiên (bảng ở mục 5 của `ca_metrics.md`). Đã bỏ; nếu giữ thì RF giảm còn 0.385.
- Nhiều tên bệnh viết khác nhau cho cùng một bệnh (5 cách viết của Bluetongue), đã phải gộp tay.
- 6 dòng trùng lặp hoàn toàn (4 dòng rò rỉ giữa train và test trong CV, ảnh hưởng không đáng kể).
- Kaggle không mô tả nguồn gốc và cách thu thập dữ liệu.

### 6.4. Những gì đã thử nhưng không cải thiện

| Thử | Kết quả | Lý do |
|---|---|---|
| Chia 70/30 hoặc 80/20 thay vì CV | 0.402 / 0.431, không khác biệt | Chỉ đổi cách đo, không đổi model |
| Tăng cường dữ liệu | Giảm còn 0.390–0.419 | Bản sao không có thông tin mới |
| Logistic Regression thay RF | 0.359, thấp hơn | Bài toán cần model phi tuyến |
| Bỏ feature giống | 0.390, thấp hơn | Giống có giúp nhẹ |
| Chỉ dùng loài + triệu chứng | 0.362, thấp hơn | Tuổi, nhiệt độ, nhịp tim... có đóng góp |

**Không tinh chỉnh tham số** (số cây, độ sâu...) để nâng số: số nào ra thì báo cáo số đó.

### 6.5. So với `dogfinal3`

`dogfinal3` đạt 0.886 nhưng là bài toán khác hẳn: 6 bệnh của 1 loài, **51 cột triệu chứng** chi tiết, mỗi ca trung bình nhiều triệu chứng đặc trưng (ví dụ "hung dữ" chỉ có ở bệnh dại). `cleaned_animal` là 44 bệnh của 8 loài, mỗi ca chỉ **4 triệu chứng chung chung**. Hai con số không so sánh trực tiếp được.

## 7. Kết luận

- Model **có học được** (F1 macro gấp 3 lần mức sàn) nhưng độ chính xác top-1 còn thấp (0.425), do giới hạn của dữ liệu chứ không phải do cách chia hay thiếu tăng cường.
- Model phù hợp làm công cụ **gợi ý top-3 để tham khảo**, không đủ tin cậy để đưa ra một chẩn đoán duy nhất. Giao diện hiển thị top-3, cảnh báo độ tin cậy thấp và nút đặt lịch khám, đúng thiết kế QĐ-15.
- Hướng cải thiện thật sự là **dữ liệu tốt hơn**: nhiều ca hơn mỗi bệnh, nhiều triệu chứng đặc trưng hơn mỗi ca, có kết quả xét nghiệm.
