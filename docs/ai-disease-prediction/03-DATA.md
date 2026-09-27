# 03 — Thiết kế dữ liệu

> **Đây là phần chiếm ~70% công sức của đề tài và cũng là phần được chấm điểm nặng nhất.**

## Chiến lược 3 nguồn

| Nguồn | Vai trò | Ước lượng số mẫu |
|---|---|---|
| **A. Sinh tổng hợp từ y văn** | Xương sống của tập dữ liệu | ~6.000–8.000 |
| **B. Kaggle [12][13]** | Trộn phần dùng được sau khi chuẩn hóa cột | Chưa rõ — phải khảo sát trước |
| **C. `medical_records` của PawCare** | Tập validation "đời thực" + vòng phản hồi | Vài chục, tăng dần |

Nguồn A là chính. Nguồn B để trả lời câu hỏi "sao không dùng dataset thầy chỉ định". Nguồn C là điểm khác biệt của đồ án.

---

## Nguồn A — Sinh tổng hợp từ y văn

### Nguyên lý

Với mỗi bệnh, xây một vector xác suất **P(triệu chứng | bệnh)** dựa trên mô tả lâm sàng trong [10] Ettinger và [11] Nelson & Couto. Sinh mỗi ca bệnh bằng Bernoulli sampling trên vector đó, cộng thêm ràng buộc về loài / tuổi / giới tính.

Ví dụ với Parvo: nôn 0.95, tiêu chảy ra máu 0.90, bỏ ăn 0.95, sốt 0.70, li bì 0.85, mất nước 0.85, tuổi < 6 tháng ở 85% số ca. Sinh 1 ca = tung đồng xu lệch cho từng triệu chứng theo xác suất đó.

Đây là phương pháp có tên gọi trong tài liệu: **probabilistic synthetic data generation grounded in clinical literature**. Hợp lệ và bảo vệ được khi trình bày, **với điều kiện** nêu rõ trong báo cáo.

### ⚠️ Cái bẫy phải tránh: accuracy giả tạo

Nếu sinh dữ liệu "sạch" hoàn toàn theo rule, model sẽ học lại đúng cái rule đó và cho **accuracy 97–99%**. Con số này vô nghĩa và chỉ cần một câu hỏi của giảng viên là lộ.

Bắt buộc tiêm nhiễu, gồm 4 loại:

| Loại nhiễu | Mô tả | Mức đề xuất |
|---|---|---|
| **Missing symptom** | Chủ nuôi không để ý / không kể → xóa ngẫu nhiên triệu chứng đã sinh | 15–20% mỗi triệu chứng |
| **Spurious symptom** | Triệu chứng nền không liên quan tới bệnh chính | 5% cho mỗi triệu chứng không thuộc bệnh |
| **Label noise** | Chẩn đoán ban đầu sai, bệnh đồng mắc | 5% số ca đảo nhãn sang bệnh gần giống |
| **Overlap có chủ ý** | Các cặp bệnh vốn khó phân biệt trên lâm sàng phải được sinh với vector xác suất gần nhau | xem bảng dưới |

Các cặp bệnh **phải** để chồng lấn (nếu model phân biệt được 100% là dấu hiệu dữ liệu bị giả) :

- Parvo ↔ Viêm dạ dày–ruột cấp ↔ Ngộ độc thức ăn
- Ho cũi chó ↔ Cúm mèo (khác loài nên species mask giải quyết) ↔ Viêm phổi
- Nấm da ↔ Viêm da mủ ↔ Dị ứng thức ăn
- Bệnh thận mạn ↔ Tiểu đường ↔ Cường giáp (cùng có uống nhiều/tiểu nhiều/sụt cân)
- Ve tai ↔ Viêm tai ngoài

**Mục tiêu accuracy thực tế: 78–88%.** Nếu ra cao hơn 92% thì phải quay lại tăng nhiễu — con số thấp mà trung thực đáng tin hơn nhiều.

### Phân bố số mẫu theo tỷ lệ mắc thực tế

Không chia đều mỗi bệnh 300 mẫu — như vậy là giả tạo. Phân bổ theo mức độ phổ biến thực tế ở phòng khám Việt Nam:

| Nhóm | Số bệnh | Mẫu/bệnh | Tổng |
|---|---|---|---|
| Chỉ chó | 5 | ~350 | 1.750 |
| Chỉ mèo | 6 | ~320 | 1.920 |
| Cả chó và mèo | 12 | ~280 | 3.360 |
| Thỏ | 4 | ~90 | 360 |
| Hamster | 3 | ~70 | 210 |
| Chim | 4 | ~80 | 320 |
| | **34** | | **~7.920** |

Số mẫu chính xác cho từng bệnh đặt trong `disease_constraints.csv`, không cố định theo nhóm.

Mất cân bằng này là **có chủ ý và phản ánh thực tế** — cách xử lý ở [04-MODEL.md](04-MODEL.md) (`class_weight='balanced'`, báo cáo metrics tách nhóm, cơ chế từ chối trả lời).

---

## Danh sách bệnh (34 bệnh)

> ✅ **Đã chốt và đưa vào [`shared/symptoms.json`](../../shared/symptoms.json) version 2.** File JSON là nguồn sự thật; bảng dưới đây chỉ để tra cứu và theo dõi việc đối chiếu sách.

Phân bố theo loài (một bệnh có thể thuộc nhiều loài):

| Loài | Số bệnh |
|---|---|
| CAT | 18 |
| DOG | 17 |
| BIRD | 4 |
| RABBIT | 4 |
| HAMSTER | 3 |

⚠️ Các bảng dưới nhóm theo **loài chính**, nhưng khi đưa vào JSON có **7 bệnh được mở rộng sang cả chó lẫn mèo** vì trên lâm sàng cả hai loài đều mắc: `intestinal_worms`, `flea_tick_infestation`, `otitis_externa`, `arthritis_dysplasia`, `pyometra`, `dermatophytosis`, `ear_mites`. Ngoài ra `feline_diabetes` đổi tên thành `diabetes_mellitus` (chó cũng mắc). Lấy danh sách loài chính xác từ file JSON, không lấy từ bảng này.

Cột **Xác minh** theo dõi việc đối chiếu với sách — `[ ]` = chưa tra, `[x]` = đã đối chiếu [10] và/hoặc [11].

### Chó (10)

| # | code | Tên tiếng Việt | severity | Ghi chú | Xác minh |
|---|---|---|---|---|---|
| 1 | `parvo` | Parvovirus (Parvo) | URGENT | Chủ yếu chó con < 6 tháng chưa tiêm đủ | [ ] |
| 2 | `distemper` | Bệnh Care (Carré) | URGENT | Có thể kèm triệu chứng thần kinh giai đoạn muộn | [ ] |
| 3 | `kennel_cough` | Ho cũi chó | SOON | Tiền sử tiếp xúc nơi đông chó | [ ] |
| 4 | `tick_borne_disease` | Ký sinh trùng máu do ve (Ehrlichia/Babesia) | URGENT | Rất phổ biến ở VN | [ ] |
| 5 | `intestinal_worms` | Giun sán đường ruột | NORMAL | Phổ biến ở chó con chưa tẩy giun | [ ] |
| 6 | `flea_tick_infestation` | Ve, bọ chét | NORMAL | | [ ] |
| 7 | `otitis_externa` | Viêm tai ngoài | SOON | Hay gặp ở giống tai cụp (Poodle, Cocker) | [ ] |
| 8 | `pyoderma` | Viêm da mủ | SOON | | [ ] |
| 9 | `arthritis_dysplasia` | Viêm khớp / loạn sản khớp háng | NORMAL | Chó lớn tuổi, giống lớn | [ ] |
| 10 | `pyometra` | Viêm tử cung tích mủ | URGENT | **Chỉ con cái chưa triệt sản, thường > 5 tuổi** | [ ] |

### Mèo (9)

| # | code | Tên tiếng Việt | severity | Ghi chú | Xác minh |
|---|---|---|---|---|---|
| 11 | `fpv` | Giảm bạch cầu mèo (FPV) | URGENT | Mèo con chưa tiêm | [ ] |
| 12 | `flutd` | Hội chứng đường tiết niệu dưới / tắc niệu | URGENT | **Mèo đực nguy hiểm hơn nhiều** | [ ] |
| 13 | `ckd_cat` | Bệnh thận mạn | SOON | Mèo già > 7 tuổi | [ ] |
| 14 | `feline_uri` | Cúm mèo / viêm hô hấp trên | SOON | | [ ] |
| 15 | `dermatophytosis` | Nấm da (nấm vòng) | NORMAL | Lây sang người | [ ] |
| 16 | `ear_mites` | Ve tai (Otodectes) | NORMAL | | [ ] |
| 17 | `hairball_obstruction` | Búi lông / tắc nghẽn tiêu hóa | SOON | Mèo lông dài | [ ] |
| 18 | `feline_diabetes` | Tiểu đường | SOON | Liên quan béo phì | [ ] |
| 19 | `hyperthyroidism_cat` | Cường giáp | SOON | Mèo già, ăn nhiều mà sụt cân | [ ] |

### Chung chó + mèo (4)

| # | code | Tên tiếng Việt | severity | Ghi chú | Xác minh |
|---|---|---|---|---|---|
| 20 | `gastroenteritis` | Viêm dạ dày – ruột cấp | SOON | Chẩn đoán "nền", hay chồng lấn | [ ] |
| 21 | `food_poisoning` | Ngộ độc thức ăn | URGENT | | [ ] |
| 22 | `periodontal_disease` | Viêm nha chu | NORMAL | | [ ] |
| 23 | `food_allergy` | Dị ứng thức ăn / viêm da dị ứng | NORMAL | | [ ] |

### Thỏ (4)

| # | code | Tên tiếng Việt | severity | Ghi chú | Xác minh |
|---|---|---|---|---|---|
| 24 | `gi_stasis` | Ứ trệ tiêu hóa | URGENT | Cấp cứu ở thỏ | [ ] |
| 25 | `malocclusion` | Răng mọc lệch / quá dài | SOON | | [ ] |
| 26 | `ear_mange_rabbit` | Ghẻ tai (Psoroptes cuniculi) | NORMAL | | [ ] |
| 27 | `rabbit_snuffles` | Viêm mũi (Pasteurella) | SOON | | [ ] |

### Hamster (3)

| # | code | Tên tiếng Việt | severity | Ghi chú | Xác minh |
|---|---|---|---|---|---|
| 28 | `wet_tail` | Wet tail (viêm ruột tăng sinh) | URGENT | Tỷ lệ tử vong cao | [ ] |
| 29 | `demodex_hamster` | Ghẻ Demodex | NORMAL | | [ ] |
| 30 | `hamster_tumor` | U bướu | SOON | Hamster > 1 tuổi | [ ] |

### Chim (4)

| # | code | Tên tiếng Việt | severity | Ghi chú | Xác minh |
|---|---|---|---|---|---|
| 31 | `air_sac_disease` | Viêm túi khí / bệnh hô hấp | URGENT | | [ ] |
| 32 | `trichomoniasis` | Trichomonas (canker) | SOON | | [ ] |
| 33 | `coccidiosis_bird` | Cầu trùng | SOON | | [ ] |
| 34 | `feather_plucking` | Rụng lông / tự nhổ lông | NORMAL | Thường do stress | [ ] |

> **Cân nhắc:** 34 lớp là khá nhiều cho một đồ án. Nếu tới giai đoạn 2 thấy macro F1 quá thấp, phương án cắt giảm là bỏ 4 bệnh chim và 3 bệnh hamster (còn 27 lớp) — nhưng phải bàn với người dùng trước vì họ đã chủ động chọn phủ đủ 6 loài.

---

## Danh sách triệu chứng (46 triệu chứng)

Nhóm để tiện dựng UI (bác sĩ tick theo nhóm), không ảnh hưởng tới model.

**Tiêu hóa (9):** `vomiting` Nôn · `diarrhea` Tiêu chảy · `bloody_diarrhea` Tiêu chảy ra máu · `anorexia` Bỏ ăn / chán ăn · `weight_loss` Sụt cân · `abdominal_distension` Chướng bụng · `constipation` Táo bón, không đi ngoài · `drooling` Chảy dãi · `increased_appetite` Ăn nhiều bất thường

**Toàn thân (6):** `fever` Sốt · `lethargy` Li bì, mệt mỏi · `dehydration` Mất nước · `pale_gums` Niêm mạc nhợt · `jaundice` Vàng da, vàng niêm mạc · `sudden_collapse` Ngã quỵ đột ngột

**Hô hấp (6):** `coughing` Ho · `sneezing` Hắt hơi · `nasal_discharge` Chảy nước mũi · `dyspnea` Khó thở · `open_mouth_breathing` Thở há mồm · `tail_bobbing` Đuôi nhấp nhô theo nhịp thở *(chim)*

**Da lông (7):** `itching` Ngứa, gãi nhiều · `hair_loss` Rụng lông · `skin_redness` Đỏ da · `skin_lesion` Lở loét, vảy da · `visible_parasites` Thấy ve/bọ chét trên lông · `lump_mass` Khối u sờ thấy · `self_plucking` Tự nhổ lông *(chim)*

**Tai mắt (5):** `head_shaking` Lắc đầu, gãi tai · `ear_discharge` Chảy dịch tai · `ear_odor` Tai có mùi hôi · `eye_discharge` Chảy ghèn, chảy nước mắt · `conjunctivitis` Mắt đỏ, sưng mí

**Tiết niệu – sinh dục (6):** `polydipsia` Uống nhiều nước · `polyuria` Tiểu nhiều · `dysuria` Rặn tiểu, tiểu khó · `hematuria` Tiểu ra máu · `no_urination` Không tiểu được · `vaginal_discharge` Chảy dịch mủ âm đạo

**Vận động – thần kinh (4):** `lameness` Đi khập khiễng · `seizure` Co giật · `ataxia` Đi loạng choạng, mất thăng bằng · `reluctance_to_move` Ngại vận động

**Răng miệng (3):** `bad_breath` Hôi miệng · `difficulty_eating` Khó nhai, rơi thức ăn · `gum_swelling` Sưng lợi

---

## Tiền sử bệnh (14 mục)

Đề bài yêu cầu dùng **tiền sử bệnh** làm đầu vào. Nhóm này bổ sung ở `symptoms.json` version 2, sau khi khảo sát dataset [13] (xem `ai_service/reports/kaggle_survey.md`).

Cũng là cờ nhị phân như triệu chứng, **nối tiếp vào sau** mảng `symptoms` trong feature vector.

`vaccinated` Đã tiêm phòng đầy đủ · `not_vaccinated` Chưa tiêm hoặc tiêm chưa đủ · `neutered` Đã triệt sản · `not_neutered` Chưa triệt sản · `deworming_overdue` Chưa tẩy giun định kỳ · `chronic_illness` Có bệnh mạn tính · `allergy_history` Tiền sử dị ứng · `parasite_history` Tiền sử ký sinh trùng · `skin_condition_history` Tiền sử bệnh da liễu · `kidney_disease_history` Tiền sử bệnh thận · `urinary_history` Tiền sử bệnh đường tiết niệu · `dental_issue_history` Tiền sử bệnh răng miệng · `heart_condition_history` Tiền sử bệnh tim · `recent_surgery` Mới phẫu thuật gần đây

**Vì sao tách `vaccinated` và `not_vaccinated` thành hai cờ riêng** (thay vì một cờ bật/tắt): tick một trong hai nghĩa là *đã biết chắc*, không tick cái nào nghĩa là *không rõ*. Nếu chỉ dùng một cờ thì không phân biệt được "đã tiêm" với "không biết" — mà đây là khác biệt quan trọng khi loại trừ Parvo/FPV. Tương tự với cặp triệt sản (`neutered` loại trừ `pyometra`).

Nguồn dữ liệu khi chạy thật: lấy từ các bản ghi `medical_records` trước đó của cùng thú cưng, phần còn thiếu thì bác sĩ tick tay.

---

## Ma trận P(triệu chứng | bệnh)

Lưu ở `ai_service/data/disease_matrix.csv` — 34 dòng (bệnh) × **60 cột**, giá trị 0.0–1.0.

60 cột = 46 triệu chứng + 14 tiền sử bệnh, **đúng thứ tự trong [`shared/symptoms.json`](../../shared/symptoms.json)**. Nhóm tiền sử cũng cần xác suất riêng cho từng bệnh, không phải chỉ triệu chứng: ví dụ `P(not_vaccinated | parvo) = 0.85` (phần lớn chó mắc Parvo là chưa tiêm đủ), còn `P(not_neutered | pyometra) = 1.00` (đã triệt sản thì không thể viêm tử cung).

### 🚨 Trạng thái: BẢN NHÁP — CHƯA ĐỐI CHIẾU SÁCH

Các con số dưới đây là **suy luận lâm sàng làm mẫu để minh họa định dạng**, **KHÔNG** phải trích từ [10] hay [11]. Bắt buộc phải tra sách và sửa lại trước khi dùng để sinh dữ liệu thật, và **không được trích dẫn số trang của Ettinger/Nelson cho tới khi đã thực sự đối chiếu**. Việc bịa trích dẫn là lỗi nghiêm trọng trong báo cáo khoa học.

Ví dụ định dạng (3 bệnh đầu, chỉ hiện các triệu chứng khác 0):

```csv
disease,vomiting,diarrhea,bloody_diarrhea,anorexia,fever,lethargy,dehydration,...
parvo,0.95,0.85,0.90,0.95,0.70,0.85,0.85,...
distemper,0.60,0.65,0.15,0.85,0.80,0.90,0.50,...
kennel_cough,0.10,0.05,0.02,0.30,0.40,0.35,0.05,...
```

### Ràng buộc phi triệu chứng

Ngoài ma trận trên, mỗi bệnh còn có ràng buộc về nhân khẩu học, lưu riêng ở `ai_service/data/disease_constraints.csv`.

✅ **Đã viết xong (2026-09-07)** — 34 dòng × 15 cột. Kiểm tra bằng `ai_service/scripts/check_constraints.py`.
⚠️ Các con số y khoa trong đó **chưa tra sách** — xem mục "Nợ kỹ thuật" ở [PROGRESS.md](PROGRESS.md).

| Trường | Ý nghĩa | Ví dụ |
|---|---|---|
| `disease` | Mã bệnh, khớp `symptoms.json` | `parvo` |
| `species` | Loài có thể mắc, nhiều loài ngăn bằng `\|` | `intestinal_worms` → `DOG\|CAT` |
| `age_months_min` / `max` | Khoảng tuổi **có thể** mắc | `parvo` → 0–240 |
| `age_peak_min` / `max` | Khoảng tuổi **tập trung** | `parvo` → 2–6 |
| `age_peak_ratio` | Tỷ lệ ca rơi vào khoảng peak | `parvo` → 0.85 |
| `gender` | Giới hạn giới tính cứng: `ANY` / `MALE` / `FEMALE` | `pyometra` → `FEMALE` |
| `male_ratio` | Tỷ lệ con đực (lệch, không tuyệt đối) | `flutd` → 0.70; mặc định 0.50 |
| `breed_hint` | Nhóm giống nguy cơ cao, `any` nếu không lệch | `arthritis_dysplasia` → `large\|giant` |
| `breed_hint_ratio` | Tỷ lệ ca thuộc nhóm giống đó | `arthritis_dysplasia` → 0.70 |
| `duration_days_mean` / `sd` | Diễn biến điển hình | `parvo` → 3 ± 1; `ckd_cat` → 120 ± 45 |
| `n_samples` | Số ca sinh ra cho bệnh này | `parvo` → 350 |
| `note` | Ghi chú tiếng Việt không dấu | |

**Cơ chế cặp peak** — ví dụ Parvo: 85% số ca bốc tuổi trong 2–6 tháng, 15% còn lại bốc trong toàn khoảng 0–240. Chó già vẫn mắc Parvo được, chỉ là hiếm. Giữ đúng tinh thần "không dùng luật cứng" của QĐ-08 quy tắc 2. `breed_hint_ratio` chạy cùng cơ chế.

**Ba thay đổi so với bảng nháp trước đó:** `gender_bias` đổi tên thành `male_ratio` (0.70 không nói rõ lệch về phía nào); thêm `duration_days_sd` (chỉ có `mean` thì mọi ca cùng bệnh ra đúng một số ngày, model học thành luật cứng); thêm `age_peak_ratio` / `breed_hint_ratio` (không có tỷ lệ thì "peak" không có nghĩa định lượng).

**Hai ràng buộc không diễn đạt được** bằng `breed_group`: `otitis_externa` (giống tai cụp) và `hairball_obstruction` (mèo lông dài) — `breed_group` chỉ có toy/small/medium/large/giant. Để `any`, chấp nhận mất một chút đặc trưng.

Tổng `n_samples` hiện tại = **7.950**, so với ~7.920 của bảng phân bổ ở trên. Lệch theo nhóm: chó −30, mèo +20, chó+mèo +40; thỏ/hamster/chim khớp chính xác.

### Quy trình tra sách (giai đoạn 1)

1. Với mỗi bệnh, tìm mục tương ứng trong [10] hoặc [11], đọc phần *Clinical Signs*.
2. Sách mô tả định tính ("vomiting is almost always present"). Quy đổi sang số theo **bảng thang đo** ở mục dưới.
3. Ghi lại **nguyên văn câu trong sách** + nguồn (sách nào, chương/mục nào) vào file chi tiết — xem mục "Định dạng file khi nhập liệu".
4. Đánh dấu `[x]` vào cột Xác minh ở bảng bệnh phía trên.

### Thang quy đổi định tính → định lượng

Sách y văn không cho số, chỉ cho chữ. Bảng này đổi chữ thành số, dùng **thống nhất cho cả 34 bệnh**.

| Diễn đạt trong sách | Khoảng | **Lấy** |
|---|---|---|
| almost always / hallmark / characteristic | 0.90 – 0.95 | **0.93** |
| most cases / hầu hết các ca | 0.80 – 0.90 | **0.85** |
| frequently / commonly / usually | 0.65 – 0.80 | **0.73** |
| often / may be seen | 0.40 – 0.60 | **0.50** |
| occasionally / sometimes | 0.20 – 0.35 | **0.28** |
| rarely / uncommon | 0.05 – 0.15 | **0.10** |
| không được nhắc tới | 0.00 – 0.03 | **0.02** |

**Quy tắc chọn số trong khoảng: lấy điểm giữa.** File CSV cần đúng một con số vì bộ sinh dữ liệu cần một ngưỡng duy nhất để so sánh. Lấy điểm giữa vì: (a) ai làm lại quy trình cũng ra đúng con số đó, (b) không bị nghi chọn số cho đẹp kết quả, (c) nhiễu đã được tiêm có kiểm soát ở bước sau rồi, không cần thêm ngẫu nhiên ở đây.

**Thứ tự ưu tiên khi chọn số:**

| Tình huống | Xử lý |
|---|---|
| Sách cho số cụ thể (*"in approximately 60% of cases"*) | Dùng luôn `0.60`, bỏ qua bảng |
| Sách cho diễn đạt định tính | Tra bảng, lấy cột **Lấy** |
| Hai sách nói khác nhau | Lấy trung bình, ghi cả hai câu trích |
| Sách không nhắc tới | `0.02` |

**Vì sao "không nhắc tới" là `0.02` chứ không phải `0.00`:** `0.00` nghĩa là *tuyệt đối không bao giờ*. Model sẽ học thành luật cứng, và chỉ cần gặp một ca thật có triệu chứng đó là nó loại thẳng bệnh đúng ra khỏi danh sách. "Sách không nhắc" chỉ có nghĩa là *hiếm*, không phải *bất khả*. Để `0.02` giữ cho ranh giới mềm.

**Gặp diễn đạt mới không có trong bảng → thêm dòng mới, không ép vào nhóm gần nhất.** Bảng dài ra là dấu hiệu tốt: chứng tỏ đọc sách thật và gặp diễn đạt thật.

**Bảng này phải đưa vào báo cáo** — nó chính là phần "phương pháp" của chương tiền xử lý dữ liệu. Tiền lệ trích dẫn được: **Sherman Kent, *Words of Estimative Probability*, CIA, 1964** — thang quy đổi từ ngữ định tính sang xác suất số, kể cả cách cho khoảng ± thay vì một số cứng.

### 🔒 Quy tắc chốt chặn: không sửa ma trận sau khi đã train

**Ma trận phải chốt xong TRƯỚC khi train lần đầu.**

Nếu train ra 71%, rồi chỉnh vài con số, train lại được 85% — con số 85% đó **vô nghĩa**. Đó là điều chỉnh dữ liệu cho khớp kết quả mong muốn, lập luận thành vòng tròn, và không có câu trả lời nào cho "sao chọn 0.85 mà không phải 0.70" ngoài "vì nó cho accuracy đẹp hơn".

Sau khi đã train, chỉ được sửa một con số khi **tra lại sách và phát hiện đọc nhầm** — và mỗi lần sửa phải ghi vào [DECISIONS.md](DECISIONS.md) kèm câu trích trong sách.

Accuracy thấp thì xử lý ở tầng model (đổi thuật toán, tune hyperparameter, thêm feature), **không** xử lý bằng cách sửa dữ liệu.

Riêng phần **chồng lấn có chủ ý** giữa các cặp bệnh khó phân biệt: không ép, không chỉnh tay. Đọc sách trung thực thì chồng lấn tự khắc xuất hiện, vì các bệnh đó vốn được mô tả bằng những từ gần giống nhau. Nếu tra xong mà hai bệnh nổi tiếng khó phân biệt lại ra vector rất khác nhau → dấu hiệu **đọc thiếu**, quay lại đọc kỹ hơn.

### Định dạng file khi nhập liệu

Nhập vào file dạng dài `disease_matrix_source.csv` — mỗi dòng một cặp bệnh–triệu chứng, kèm câu trích:

```csv
disease,feature,probability,book_phrase,source
parvo,anorexia,0.85,"most affected dogs are anorectic","Ettinger 8th ed, Ch.223"
parvo,fever,0.50,"fever may be present","Ettinger 8th ed, Ch.223"
parvo,coughing,0.02,"(khong nhac toi)","-"
```

Sau đó một script ngắn xoay thành ma trận 34×60 (`disease_matrix.csv`) để sinh dữ liệu.

Tốn công hơn lúc nhập, đổi lại: phụ lục báo cáo tự có sẵn, bị hỏi con số nào cũng tra ra ngay, và sau này nghi ngờ một giá trị thì biết đường kiểm lại.

---

## Nguồn B — Dataset Kaggle

✅ **Đã khảo sát xong (2026-08-12).** Báo cáo đầy đủ: [`ai_service/reports/kaggle_survey.md`](../../ai_service/reports/kaggle_survey.md).

**Kết luận: cả hai dataset đều không dùng để huấn luyện được.**

| | [12] `animal-disease-prediction` | [13] `veterinary-clinical-dataset` |
|---|---|---|
| Số dòng | 431 | 10.000 |
| Có cột nhãn | ✅ | ❌ **không có** |
| Chó/mèo/thỏ | 181 dòng (42%) | 10.000 dòng (100%) |
| Gia súc | 250 dòng (58%) | 0 |
| Dùng train được | ❌ | ❌ |

- **[12]**: 431 dòng chia cho ~135 nhãn ≈ **3 dòng mỗi bệnh**. Nhãn còn không chuẩn hóa (`Parvovirus` vs `Canine Parvovirus`, `Bluetongue` có 5 biến thể). Sau khi lọc chó/mèo và gộp nhãn chỉ còn ~147 dòng.
- **[13]**: **không có cột bệnh** → không thể học có giám sát. Phân bố `MedicalHistory` đều tăm tắp (~900–1000 trên mỗi giá trị) chứng tỏ dữ liệu sinh ngẫu nhiên.

**Vẫn vớt được 3 thứ:**

1. **[12] làm tập đối chứng ngoại lai** — ~147 dòng chó/mèo sau chuẩn hóa nhãn, dùng kiểm tra model trên dữ liệu không do mình sinh. Quá ít để kết luận thống kê nhưng vẫn là phép thử tỉnh táo.
2. **Xác nhận thiết kế feature đúng** — bộ cột của [12] trùng khớp gần 1:1 với thiết kế đầu vào của ta.
3. **Bộ phân loại tiền sử bệnh** từ [13] → đã bổ sung thành nhóm `medicalHistory` 14 mục ở trên.

Không dùng 2 cột `Body_Temperature` và `Heart_Rate` của [12] — PawCare không thu thập hai chỉ số này.

---

## Nguồn C — Dữ liệu thật từ PawCare

Bảng `disease_predictions` (xem [05-INTEGRATION.md](05-INTEGRATION.md)) lưu mỗi lần dự đoán kèm phản hồi của bác sĩ:

- `predicted_top1` — bệnh AI đoán
- `doctor_confirmed` — bác sĩ đồng ý hay không
- `actual_diagnosis` — chẩn đoán cuối cùng thật

Từ đó dựng **confusion matrix trên dữ liệu production**, không chỉ trên test set. Rất hiếm đồ án sinh viên có phần này — nên đây là điểm nhấn của báo cáo.

Trước khi có dữ liệu thật, có thể tận dụng các bản ghi `medical_records.diagnosis` sẵn có: trích thủ công triệu chứng từ trường `notes` để tạo vài chục ca đối chứng.

---

## Tiền xử lý (cho chương "Tiền xử lý dữ liệu")

| Bước | Xử lý |
|---|---|
| Triệu chứng | One-hot / nhị phân sẵn — 46 cột 0/1 |
| Tiền sử bệnh | Nhị phân sẵn — 14 cột 0/1, **nối tiếp ngay sau 46 cột triệu chứng** |
| `species` | One-hot 6 cột |
| `gender` | Nhị phân 1 cột (+ 1 cột `unknown`) |
| `breed` | **Không one-hot trực tiếp** (quá nhiều giá trị, nhiều typo). Gom về `breed_group`: toy / small / medium / large / giant / unknown, dựa trên bảng ánh xạ thủ công + cân nặng |
| `ageMonths` | Giữ dạng số + thêm cột `age_group`: puppy/kitten (<12), adult (12–84), senior (>84) |
| `weightKg` | Chuẩn hóa **theo loài** (3kg là bình thường với mèo, nhẹ cân với chó lớn) → dùng z-score trong nhóm loài |
| `durationDays` | Giữ dạng số, cắt ngưỡng trên ở 90 ngày |
| Thiếu dữ liệu | `weightKg`/`ageMonths` thiếu → điền median theo loài + thêm cột cờ `_missing` |

Tổng số feature ước tính:

| Nhóm | Số cột |
|---|---|
| Triệu chứng | 46 |
| Tiền sử bệnh | 14 |
| `species` one-hot | 6 |
| `gender` | 2 |
| `breed_group` one-hot | 6 |
| `ageMonths` + `age_group` | 1 + 3 |
| `weightKg` (z-score theo loài) | 1 |
| `durationDays` | 1 |
| Cờ thiếu dữ liệu | 2 |
| **Tổng** | **≈ 82 cột** |
