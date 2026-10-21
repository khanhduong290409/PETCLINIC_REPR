# Kết quả đánh giá — `cleaned_animal`, 8 loài

> ⚠️ **File này sinh tự động bởi `ai_service/scripts/train_cleaned_animal.py`. Đừng sửa tay.**
> Phần nhận xét, đánh giá nằm ở `ca_results.md`.

**Ngày chạy:** 2026-10-18
**Dữ liệu:** `cleaned_animal_disease_prediction.csv` qua `mapping_cleaned_animal.csv` — **351 dòng / 44 bệnh** (bệnh ≥ 3 dòng sau khi gộp tên đồng nghĩa)
**Feature:** 173 cột = loài (one-hot) + giống (one-hot) + triệu chứng (0/1, chỉ từ 4 cột chữ `Symptom_1..4`) + tuổi, cân nặng, nhiệt độ, nhịp tim, số ngày bệnh, giới tính
**Đánh giá:** 3-fold stratified CV, `shuffle=True`, `random_state=42`. Hold-out 70/30 và 80/20 chỉ là thí nghiệm so sánh ở mục 3 (QĐ-16)
**Dự đoán:** mọi model đều qua species mask — chỉ chọn trong các bệnh của đúng loài, giống `app.py`

| Loài | Số bệnh | Số dòng |
|---|---|---|
| Chó | 6 | 63 |
| Mèo | 7 | 56 |
| Bò | 6 | 57 |
| Ngựa | 8 | 56 |
| Cừu | 4 | 32 |
| Dê | 4 | 31 |
| Lợn | 5 | 29 |
| Thỏ | 4 | 27 |

---

## 1. So sánh model — Accuracy, Precision, Recall, F1

Mỗi ô là `trung bình ± độ lệch chuẩn` qua 3 fold.

| Model | Accuracy | Precision (macro) | Recall (macro) | F1 (macro) | Precision (weighted) | Recall (weighted) | F1 (weighted) |
|---|---|---|---|---|---|---|---|
| Dummy (bệnh phổ biến nhất của loài) | 0.330 ± 0.004 | 0.065 ± 0.001 | 0.182 ± 0.000 | 0.094 ± 0.000 | 0.121 ± 0.001 | 0.330 ± 0.004 | 0.173 ± 0.002 |
| Logistic Regression | 0.359 ± 0.021 | 0.251 ± 0.023 | 0.299 ± 0.011 | 0.257 ± 0.014 | 0.323 ± 0.028 | 0.359 ± 0.021 | 0.326 ± 0.025 |
| Random Forest | 0.425 ± 0.052 | 0.309 ± 0.033 | 0.349 ± 0.066 | 0.305 ± 0.047 | 0.378 ± 0.029 | 0.425 ± 0.052 | 0.375 ± 0.038 |

- **Macro**: trung bình cộng của từng bệnh, mỗi bệnh nặng như nhau — bệnh 3 dòng có tiếng nói ngang bệnh 21 dòng.
- **Weighted**: trung bình có trọng số theo số ca — gần với accuracy hơn.
- Dummy ở đây luôn đoán bệnh có nhiều ca nhất **của loài đó**, nên đã là mức sàn cao hơn đoán ngẫu nhiên.

---

## 2. Thí nghiệm so sánh — Random Forest

| Model | Accuracy | Precision (macro) | Recall (macro) | F1 (macro) | Precision (weighted) | Recall (weighted) | F1 (weighted) |
|---|---|---|---|---|---|---|---|
| Mô hình chính: ≥ 3 dòng, đủ feature, 3-fold | 0.425 ± 0.052 | 0.309 ± 0.033 | 0.349 ± 0.066 | 0.305 ± 0.047 | 0.378 ± 0.029 | 0.425 ± 0.052 | 0.375 ± 0.038 |
| Giữ 9 cột Yes/No | 0.385 ± 0.012 | 0.245 ± 0.032 | 0.287 ± 0.009 | 0.248 ± 0.014 | 0.322 ± 0.035 | 0.385 ± 0.012 | 0.334 ± 0.017 |
| Bỏ feature giống | 0.390 ± 0.046 | 0.307 ± 0.046 | 0.338 ± 0.054 | 0.307 ± 0.045 | 0.354 ± 0.036 | 0.390 ± 0.046 | 0.356 ± 0.039 |
| Chỉ loài + triệu chứng | 0.362 ± 0.020 | 0.202 ± 0.013 | 0.267 ± 0.022 | 0.207 ± 0.013 | 0.272 ± 0.019 | 0.362 ± 0.020 | 0.283 ± 0.016 |
| Không dùng species mask | 0.422 ± 0.052 | 0.301 ± 0.033 | 0.346 ± 0.067 | 0.300 ± 0.048 | 0.371 ± 0.027 | 0.422 ± 0.052 | 0.371 ± 0.038 |
| Ngưỡng ≥ 5 dòng (32 bệnh / 310 dòng), 5-fold | 0.497 ± 0.019 | 0.384 ± 0.032 | 0.440 ± 0.031 | 0.389 ± 0.025 | 0.450 ± 0.023 | 0.497 ± 0.019 | 0.449 ± 0.015 |

---

## 3. So sánh cách chia dữ liệu — Random Forest

Hold-out chia **một lần**, nên mỗi tỉ lệ chạy với 5 seed khác nhau (`random_state` = 0, 1, 2, 3, 4) và lấy `trung bình ± độ lệch chuẩn` qua các seed.

| Model | Accuracy | Precision (macro) | Recall (macro) | F1 (macro) | Precision (weighted) | Recall (weighted) | F1 (weighted) |
|---|---|---|---|---|---|---|---|
| 3-fold CV (mô hình chính) | 0.425 ± 0.052 | 0.309 ± 0.033 | 0.349 ± 0.066 | 0.305 ± 0.047 | 0.378 ± 0.029 | 0.425 ± 0.052 | 0.375 ± 0.038 |
| Hold-out 70/30 (245 train / 106 test) | 0.402 ± 0.045 | 0.291 ± 0.046 | 0.326 ± 0.036 | 0.289 ± 0.038 | 0.353 ± 0.048 | 0.402 ± 0.045 | 0.355 ± 0.041 |
| Hold-out 80/20 (280 train / 71 test) | 0.431 ± 0.034 | 0.295 ± 0.027 | 0.363 ± 0.033 | 0.309 ± 0.025 | 0.361 ± 0.041 | 0.431 ± 0.034 | 0.373 ± 0.032 |

- **70/30**: accuracy thấp nhất 0.349, cao nhất 0.472 qua 5 seed
- **80/20**: accuracy thấp nhất 0.380, cao nhất 0.479 qua 5 seed

Đổi cách chia chỉ đổi **cách đo**, không làm model học tốt hơn. Bệnh 3 dòng: 70/30 chỉ còn 2 dòng train / 1 dòng test.

---

## 4. Trước và sau tăng cường dữ liệu — Random Forest, 3-fold CV

Mỗi dòng **train** sinh thêm N bản sao: đảo ngẫu nhiên một tỉ lệ cột triệu chứng (0 ↔ 1) và nhân các cột số với (1 + nhiễu chuẩn 5%).
Chỉ tăng cường tập train của từng fold — tập test giữ nguyên dữ liệu thật. Tăng cường trước khi chia thì bản sao của dòng test lọt vào train, số sẽ đẹp giả.

| Model | Accuracy | Precision (macro) | Recall (macro) | F1 (macro) | Precision (weighted) | Recall (weighted) | F1 (weighted) |
|---|---|---|---|---|---|---|---|
| Trước tăng cường (dữ liệu gốc) | 0.425 ± 0.052 | 0.309 ± 0.033 | 0.349 ± 0.066 | 0.305 ± 0.047 | 0.378 ± 0.029 | 0.425 ± 0.052 | 0.375 ± 0.038 |
| Sau tăng cường: ×2 bản sao, đảo 5% triệu chứng | 0.413 ± 0.029 | 0.284 ± 0.032 | 0.338 ± 0.047 | 0.291 ± 0.043 | 0.353 ± 0.019 | 0.413 ± 0.029 | 0.363 ± 0.024 |
| Sau tăng cường: ×5 bản sao, đảo 5% triệu chứng | 0.419 ± 0.018 | 0.279 ± 0.016 | 0.339 ± 0.023 | 0.289 ± 0.009 | 0.352 ± 0.027 | 0.419 ± 0.018 | 0.365 ± 0.013 |
| Sau tăng cường: ×5 bản sao, đảo 10% triệu chứng | 0.390 ± 0.031 | 0.270 ± 0.028 | 0.323 ± 0.045 | 0.278 ± 0.037 | 0.333 ± 0.022 | 0.390 ± 0.031 | 0.344 ± 0.023 |

---

## 5. Vì sao bỏ 9 cột Yes/No

Mỗi dòng ghi triệu chứng ở hai nơi: 4 cột chữ `Symptom_1..4` và 9 cột Yes/No (`Vomiting`, `Diarrhea`...).
Dữ liệu nhất quán thì cột chữ có ghi → cột Yes/No phải gần 100% Yes, không ghi → gần 0%. Đo trên toàn bộ 431 dòng, **không nhìn nhãn bệnh**:

| Cột Yes/No | Số dòng cột chữ có ghi | Tỉ lệ Yes khi cột chữ **có** ghi | Tỉ lệ Yes khi cột chữ **không** ghi |
|---|---|---|---|
| `Appetite_Loss` | 341 | 89% | 84% |
| `Vomiting` | 106 | 78% | 50% |
| `Diarrhea` | 75 | 56% | 48% |
| `Coughing` | 187 | 76% | 59% |
| `Labored_Breathing` | 30 | 70% | 54% |
| `Lameness` | 59 | 59% | 57% |
| `Skin_Lesions` | 9 | 89% | 55% |
| `Nasal_Discharge` | 120 | 50% | 47% |
| `Eye_Discharge` | 25 | 64% | 51% |

Hai cột tỉ lệ gần bằng nhau → cột Yes/No gần như điền ngẫu nhiên, mâu thuẫn với cột chữ. Vì phép đo không dùng nhãn,
việc bỏ cột là sửa lỗi dữ liệu chứ không phải chọn feature theo kết quả. Kết quả khi vẫn giữ các cột này: xem dòng "Giữ 9 cột Yes/No" ở mục 2.

---

## 6. Kiểm tra rò rỉ dữ liệu do dòng trùng lặp

Số dòng test có bản sao y hệt (cả feature lẫn nhãn) trong tập train của cùng fold: **2, 1, 1** (tổng 4/351).
Những dòng này model chỉ cần nhớ lại là đúng — kết quả bị nâng lên tương ứng. Không xóa dòng trùng (QĐ-12).

---

## 7. Precision / Recall / F1 từng bệnh — Random Forest, out-of-fold

Mỗi dòng dữ liệu được dự đoán đúng một lần bởi model **không** thấy dòng đó lúc train.
Bệnh chỉ có 3 ca thì recall chỉ có thể là 0.00 / 0.33 / 0.67 / 1.00.

### Chó

| Bệnh | Mã | Precision | Recall | F1 | Số ca |
|---|---|---|---|---|---|
| Bệnh Care (Carré) | `distemper` | 0.14 | 0.08 | 0.11 | 12 |
| Viêm gan truyền nhiễm ở chó | `dog_hepatitis` | 0.00 | 0.00 | 0.00 | 4 |
| Viêm dạ dày - ruột cấp | `gastroenteritis` | 0.57 | 0.50 | 0.53 | 8 |
| Ho cũi chó | `kennel_cough` | 0.64 | 0.82 | 0.72 | 11 |
| Bệnh do xoắn khuẩn Leptospira | `leptospirosis` | 0.17 | 0.14 | 0.15 | 7 |
| Parvovirus (Parvo) | `parvo` | 0.41 | 0.57 | 0.48 | 21 |
| **Trung bình loài** | | **0.32** | **0.35** | **0.33** | |

### Mèo

| Bệnh | Mã | Precision | Recall | F1 | Số ca |
|---|---|---|---|---|---|
| Hen suyễn ở mèo | `cat_asthma` | 0.00 | 0.00 | 0.00 | 3 |
| Nhiễm Calicivirus ở mèo | `cat_calicivirus` | 0.33 | 0.12 | 0.18 | 8 |
| Bệnh bạch cầu ở mèo (FeLV) | `cat_felv` | 0.20 | 0.25 | 0.22 | 8 |
| Viêm phúc mạc truyền nhiễm ở mèo (FIP) | `cat_fip` | 0.17 | 0.12 | 0.14 | 8 |
| Viêm mũi khí quản do Herpesvirus ở mèo | `cat_herpesvirus` | 0.08 | 0.09 | 0.09 | 11 |
| Bệnh giảm bạch cầu ở mèo | `cat_panleukopenia` | 0.33 | 0.43 | 0.38 | 7 |
| Nhiễm trùng đường hô hấp trên ở mèo | `cat_uri` | 0.47 | 0.64 | 0.54 | 11 |
| **Trung bình loài** | | **0.23** | **0.24** | **0.22** | |

### Bò

| Bệnh | Mã | Precision | Recall | F1 | Số ca |
|---|---|---|---|---|---|
| Bệnh hô hấp phức hợp ở bò | `cow_brd` | 0.45 | 0.53 | 0.49 | 17 |
| Nhiễm virus hợp bào hô hấp ở bò (BRSV) | `cow_brsv` | 0.00 | 0.00 | 0.00 | 4 |
| Tiêu chảy do virus ở bò (BVD) | `cow_bvd` | 0.33 | 0.25 | 0.29 | 4 |
| Bệnh Johne (viêm ruột mạn tính ở bò) | `cow_johnes` | 0.58 | 0.78 | 0.67 | 9 |
| Viêm vú ở bò | `cow_mastitis` | 0.60 | 0.43 | 0.50 | 7 |
| Bệnh lao bò | `cow_tuberculosis` | 0.31 | 0.31 | 0.31 | 16 |
| **Trung bình loài** | | **0.38** | **0.38** | **0.38** | |

### Ngựa

| Bệnh | Mã | Precision | Recall | F1 | Số ca |
|---|---|---|---|---|---|
| Viêm khớp, thoái hóa khớp ở ngựa | `horse_arthritis` | 0.50 | 0.71 | 0.59 | 7 |
| Bệnh thiếu máu truyền nhiễm ở ngựa | `horse_eia` | 0.38 | 0.33 | 0.35 | 9 |
| Viêm não tủy ở ngựa | `horse_encephalomyelitis` | 0.75 | 0.60 | 0.67 | 5 |
| Viêm não tủy do đơn bào ở ngựa (EPM) | `horse_epm` | 0.75 | 1.00 | 0.86 | 3 |
| Nhiễm Herpesvirus ở ngựa | `horse_herpesvirus` | 0.44 | 0.40 | 0.42 | 10 |
| Cúm ngựa | `horse_influenza` | 0.56 | 0.64 | 0.60 | 14 |
| Viêm lá móng ở ngựa | `horse_laminitis` | 0.00 | 0.00 | 0.00 | 5 |
| Bệnh do virus Tây sông Nile ở ngựa | `horse_west_nile` | 0.00 | 0.00 | 0.00 | 3 |
| **Trung bình loài** | | **0.42** | **0.46** | **0.44** | |

### Cừu

| Bệnh | Mã | Precision | Recall | F1 | Số ca |
|---|---|---|---|---|---|
| Bệnh lưỡi xanh ở cừu | `sheep_bluetongue` | 0.45 | 0.45 | 0.45 | 11 |
| Sảy thai truyền nhiễm do Chlamydia ở cừu | `sheep_chlamydia` | 0.00 | 0.00 | 0.00 | 3 |
| Bệnh lở mồm long móng ở cừu | `sheep_fmd` | 0.00 | 0.00 | 0.00 | 6 |
| Bệnh Scrapie ở cừu | `sheep_scrapie` | 0.40 | 0.67 | 0.50 | 12 |
| **Trung bình loài** | | **0.21** | **0.28** | **0.24** | |

### Dê

| Bệnh | Mã | Precision | Recall | F1 | Số ca |
|---|---|---|---|---|---|
| Viêm khớp - viêm não do virus ở dê (CAE) | `goat_cae` | 0.58 | 0.88 | 0.70 | 17 |
| Viêm phổi - màng phổi truyền nhiễm ở dê | `goat_ccpp` | 0.25 | 0.20 | 0.22 | 5 |
| Viêm phổi ở dê | `goat_pneumonia` | 0.00 | 0.00 | 0.00 | 5 |
| Bệnh đường hô hấp ở dê | `goat_respiratory` | 0.00 | 0.00 | 0.00 | 4 |
| **Trung bình loài** | | **0.21** | **0.27** | **0.23** | |

### Lợn

| Bệnh | Mã | Precision | Recall | F1 | Số ca |
|---|---|---|---|---|---|
| Viêm phổi màng phổi ở lợn (APP) | `pig_app` | 0.38 | 0.43 | 0.40 | 7 |
| Dịch tả lợn cổ điển | `pig_classical_swine_fever` | 0.00 | 0.00 | 0.00 | 3 |
| Bệnh đóng dấu lợn | `pig_erysipelas` | 1.00 | 0.33 | 0.50 | 3 |
| Cúm lợn | `pig_influenza` | 0.47 | 0.67 | 0.55 | 12 |
| Tiêu chảy cấp do virus ở lợn (PED) | `pig_ped` | 0.50 | 0.25 | 0.33 | 4 |
| **Trung bình loài** | | **0.47** | **0.34** | **0.36** | |

### Thỏ

| Bệnh | Mã | Precision | Recall | F1 | Số ca |
|---|---|---|---|---|---|
| Bệnh u nhầy ở thỏ | `rabbit_myxomatosis` | 0.20 | 0.17 | 0.18 | 6 |
| Bệnh Pasteurella ở thỏ | `rabbit_pasteurellosis` | 0.20 | 0.20 | 0.20 | 5 |
| Bệnh xuất huyết ở thỏ | `rabbit_rhd` | 0.69 | 0.85 | 0.76 | 13 |
| Bệnh giang mai thỏ | `rabbit_syphilis` | 0.00 | 0.00 | 0.00 | 3 |
| **Trung bình loài** | | **0.27** | **0.30** | **0.29** | |

---

## 8. Confusion matrix — Random Forest, out-of-fold, theo loài

Có species mask nên model chỉ có thể nhầm giữa các bệnh **cùng loài**.

### Chó

| thật \ đoán | `distemper` | `dog_hepatitis` | `gastroenteritis` | `kennel_cough` | `leptospirosis` | `parvo` |
|---|---|---|---|---|---|---|
| **`distemper`** | **1** | 0 | 0 | 3 | 3 | 5 |
| **`dog_hepatitis`** | 1 | **0** | 0 | 0 | 0 | 3 |
| **`gastroenteritis`** | 0 | 0 | **4** | 0 | 0 | 4 |
| **`kennel_cough`** | 1 | 0 | 0 | **9** | 0 | 1 |
| **`leptospirosis`** | 2 | 0 | 0 | 0 | **1** | 4 |
| **`parvo`** | 2 | 0 | 3 | 2 | 2 | **12** |

### Mèo

| thật \ đoán | `cat_asthma` | `cat_calicivirus` | `cat_felv` | `cat_fip` | `cat_herpesvirus` | `cat_panleukopenia` | `cat_uri` |
|---|---|---|---|---|---|---|---|
| **`cat_asthma`** | **0** | 0 | 2 | 0 | 0 | 1 | 0 |
| **`cat_calicivirus`** | 0 | **1** | 0 | 0 | 4 | 1 | 2 |
| **`cat_felv`** | 0 | 0 | **2** | 3 | 2 | 0 | 1 |
| **`cat_fip`** | 0 | 0 | 2 | **1** | 2 | 3 | 0 |
| **`cat_herpesvirus`** | 0 | 2 | 2 | 0 | **1** | 1 | 5 |
| **`cat_panleukopenia`** | 1 | 0 | 0 | 2 | 1 | **3** | 0 |
| **`cat_uri`** | 0 | 0 | 2 | 0 | 2 | 0 | **7** |

### Bò

| thật \ đoán | `cow_brd` | `cow_brsv` | `cow_bvd` | `cow_johnes` | `cow_mastitis` | `cow_tuberculosis` |
|---|---|---|---|---|---|---|
| **`cow_brd`** | **9** | 1 | 0 | 1 | 0 | 6 |
| **`cow_brsv`** | 1 | **0** | 0 | 0 | 1 | 2 |
| **`cow_bvd`** | 0 | 0 | **1** | 2 | 0 | 1 |
| **`cow_johnes`** | 0 | 0 | 0 | **7** | 1 | 1 |
| **`cow_mastitis`** | 2 | 0 | 0 | 1 | **3** | 1 |
| **`cow_tuberculosis`** | 8 | 0 | 2 | 1 | 0 | **5** |

### Ngựa

| thật \ đoán | `horse_arthritis` | `horse_eia` | `horse_encephalomyelitis` | `horse_epm` | `horse_herpesvirus` | `horse_influenza` | `horse_laminitis` | `horse_west_nile` |
|---|---|---|---|---|---|---|---|---|
| **`horse_arthritis`** | **5** | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| **`horse_eia`** | 2 | **3** | 0 | 0 | 0 | 2 | 1 | 1 |
| **`horse_encephalomyelitis`** | 0 | 1 | **3** | 0 | 0 | 0 | 1 | 0 |
| **`horse_epm`** | 0 | 0 | 0 | **3** | 0 | 0 | 0 | 0 |
| **`horse_herpesvirus`** | 0 | 0 | 1 | 0 | **4** | 4 | 0 | 1 |
| **`horse_influenza`** | 0 | 2 | 0 | 0 | 3 | **9** | 0 | 0 |
| **`horse_laminitis`** | 3 | 0 | 0 | 0 | 1 | 1 | **0** | 0 |
| **`horse_west_nile`** | 0 | 1 | 0 | 1 | 1 | 0 | 0 | **0** |

### Cừu

| thật \ đoán | `sheep_bluetongue` | `sheep_chlamydia` | `sheep_fmd` | `sheep_scrapie` |
|---|---|---|---|---|
| **`sheep_bluetongue`** | **5** | 0 | 1 | 5 |
| **`sheep_chlamydia`** | 0 | **0** | 0 | 3 |
| **`sheep_fmd`** | 2 | 0 | **0** | 4 |
| **`sheep_scrapie`** | 4 | 0 | 0 | **8** |

### Dê

| thật \ đoán | `goat_cae` | `goat_ccpp` | `goat_pneumonia` | `goat_respiratory` |
|---|---|---|---|---|
| **`goat_cae`** | **15** | 1 | 1 | 0 |
| **`goat_ccpp`** | 4 | **1** | 0 | 0 |
| **`goat_pneumonia`** | 4 | 1 | **0** | 0 |
| **`goat_respiratory`** | 3 | 1 | 0 | **0** |

### Lợn

| thật \ đoán | `pig_app` | `pig_classical_swine_fever` | `pig_erysipelas` | `pig_influenza` | `pig_ped` |
|---|---|---|---|---|---|
| **`pig_app`** | **3** | 0 | 0 | 3 | 1 |
| **`pig_classical_swine_fever`** | 0 | **0** | 0 | 3 | 0 |
| **`pig_erysipelas`** | 0 | 1 | **1** | 1 | 0 |
| **`pig_influenza`** | 4 | 0 | 0 | **8** | 0 |
| **`pig_ped`** | 1 | 0 | 0 | 2 | **1** |

### Thỏ

| thật \ đoán | `rabbit_myxomatosis` | `rabbit_pasteurellosis` | `rabbit_rhd` | `rabbit_syphilis` |
|---|---|---|---|---|
| **`rabbit_myxomatosis`** | **1** | 2 | 2 | 1 |
| **`rabbit_pasteurellosis`** | 1 | **1** | 3 | 0 |
| **`rabbit_rhd`** | 1 | 1 | **11** | 0 |
| **`rabbit_syphilis`** | 2 | 1 | 0 | **0** |

Bản hình: `ca_confusion_matrix.png`
