# R1 — Kết quả trên dữ liệu thật

> ⚠️ **File này sinh tự động bởi `ai_service/scripts/train_baseline.py`. Đừng sửa tay.**
> Phần diễn giải và nhận xét nằm ở `R1_results.md`.

**Ngày chạy:** 2026-09-14
**Chế độ:** R1 — train và test đều trên dữ liệu lâm sàng thật (QĐ-12)
**Dữ liệu:** `dogfinal3.csv` — 141 dòng / 6 bệnh, sau khi bỏ 24 dòng `heartworm`
**Split:** 80/20 stratified, `random_state=42` → **112 dòng train / 29 dòng test**
*(QĐ-12 ước tính tay là 113/28; `test_size=0.2` × 141 = 28,2 và scikit-learn làm tròn lên, nên số thật là 112/29.)*
**Cross-validation:** 5-fold stratified, `shuffle=True`, `random_state=42`

**Phạm vi feature:** chỉ 51 mã triệu chứng. `dogfinal3` không có cột
giống/tuổi/giới tính/cân nặng, nên R1 chạy trên tập feature **hẹp hơn R2/R3** (QĐ-12, rủi ro 3).

---

## Phân bố nhãn

| Bệnh | Số dòng |
|---|---|
| `ckd_dog` | 21 |
| `distemper` | 25 |
| `kennel_cough` | 22 |
| `leptospirosis` | 24 |
| `parvo` | 24 |
| `rabies` | 25 |

---

## Bảng so sánh model

| Model | Accuracy (n=29) | Macro-F1 (n=29) | Accuracy 5-fold CV | Macro-F1 5-fold CV |
|---|---|---|---|---|
| Dummy (luon doan lop pho bien nhat) | 0.172 | 0.049 | 0.177 ± 0.002 | 0.050 ± 0.001 |
| Logistic Regression | 0.931 | 0.935 | 0.893 ± 0.051 | 0.890 ± 0.052 |
| Random Forest | 0.862 | 0.869 | 0.886 ± 0.042 | 0.882 ± 0.045 |

Con số `n=29` là kết quả trên tập test 80/20 — đúng yêu cầu giảng viên.
Con số CV đo trên cả 141 dòng nên **đáng tin hơn**; báo cáo cả hai (QĐ-12).

---

## Kiểm tra rò rỉ dữ liệu do dòng trùng lặp

⚠️ **2/29 dòng (6.9%)** của tập test có bản sao y hệt nằm trong tập train. Model chỉ cần nhớ lại là đúng, nên accuracy ở trên **cao hơn thực lực**. Phải nêu rõ con số này khi báo cáo.

---

## Metrics từng lớp — Random Forest, tập test n=29

| Bệnh | Precision | Recall | F1 | Số ca trong tập test |
|---|---|---|---|---|
| `ckd_dog` | 1.00 | 1.00 | 1.00 | 4 |
| `distemper` | 0.80 | 0.80 | 0.80 | 5 |
| `kennel_cough` | 0.83 | 1.00 | 0.91 | 5 |
| `leptospirosis` | 1.00 | 0.80 | 0.89 | 5 |
| `parvo` | 0.67 | 0.80 | 0.73 | 5 |
| `rabies` | 1.00 | 0.80 | 0.89 | 5 |

> Bảng per-class là **bắt buộc**, không được chỉ báo cáo macro-F1 (QĐ-10).
> Precision của `rabies` cao là **đặc tính của bệnh** — `aggression` gần như độc quyền
> cho lớp này — chứ không phải thành tích của model.

---

## Confusion matrix — Random Forest, tập test n=29

| thật \ đoán | `ckd_dog` | `distemper` | `kennel_cough` | `leptospirosis` | `parvo` | `rabies` |
|---|---|---|---|---|---|---|
| **`ckd_dog`** | **4** | 0 | 0 | 0 | 0 | 0 |
| **`distemper`** | 0 | **4** | 1 | 0 | 0 | 0 |
| **`kennel_cough`** | 0 | 0 | **5** | 0 | 0 | 0 |
| **`leptospirosis`** | 0 | 0 | 0 | **4** | 1 | 0 |
| **`parvo`** | 0 | 1 | 0 | 0 | **4** | 0 |
| **`rabies`** | 0 | 0 | 0 | 0 | 1 | **4** |

Bản hình: `r1_confusion_matrix.png`

---

## Ghi chú về chất lượng dữ liệu

- **Dòng vector toàn 0:** 0 ở tập train, 1 ở tập test.
  Đây là ca `rabies` chỉ ghi mỗi triệu chứng `pica` — mã đã cố ý bỏ khi ánh xạ.
  Giữ dòng này là có chủ đích (hiệu chỉnh QĐ-10 ngày 2026-09-14): bỏ một dòng vì
  biết trước model sẽ đoán sai chính là chọn dữ liệu theo kết quả mong muốn.
- **Cột luôn bằng 0:** 20/51 mã
  không có dòng nào bật lên. Giữ đủ cột để R1/R2/R3 cùng một không gian feature.
