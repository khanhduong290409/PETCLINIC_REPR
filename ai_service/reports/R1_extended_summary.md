# R1 mở rộng — tổng hợp theo 4 yêu cầu mới

**Ngày:** 2026-09-20
**Dữ liệu dùng:** chỉ `dogfinal3.csv` — 141 dòng lâm sàng thật / 6 bệnh. **Không dùng bất kỳ dữ liệu nào sinh từ y văn.**
**Không gian feature:** đúng **51 cột** của `shared/symptoms.json` (v4) — bạn đã gửi
file này, nên các script dưới đây dùng `load_real_data.py` **gốc**, không còn dùng
bản rút gọn 33 cột nữa. Số liệu 80/20 tái lập **khớp 100%** với `r1_metrics.md` gốc.

> ⚠️ Yêu cầu "không dùng dữ liệu từ y văn" đảo ngược kế hoạch R2/R3 đã nêu trong
> `R1_bao_cao_giang_vien.md` (dùng MSD Veterinary Manual để sinh ~6.000 ca). Các
> script dưới đây **chỉ dùng 141 dòng thật**. Nếu giảng viên vẫn yêu cầu nhánh
> R2/R3, cần trao đổi lại trước khi làm tiếp.

---

## 1. Chỉ làm đúng 6 bệnh có dữ liệu thật

`ckd_dog`, `distemper`, `kennel_cough`, `leptospirosis`, `parvo`, `rabies` —
141 dòng, 21–25 ca/bệnh. Không mở rộng ra 20/21 bệnh còn thiếu dữ liệu.

## 2. Không dùng dữ liệu từ y văn

Cả 3 script chỉ đọc `dogfinal3.csv` (dữ liệu thật) + `mapping_dogfinal3.csv` (bảng
ánh xạ tên cột) + `shared/symptoms.json` (định nghĩa 51 mã triệu chứng). Không đụng
tới `disease_constraints.csv` (vốn xây từ y văn cho nhánh R2/R3) hay nguồn ngoài nào.

## 3. Chia 7/3, đối chiếu với 8/2

File: `scripts/train_split_73.py` → `reports/split_comparison_70_30_vs_80_20.md`

| Model | Acc 70/30 (n=43) | Acc 80/20 (n=29) | Acc 5-fold CV (cả 141 dòng) |
|---|---|---|---|
| Dummy (sàn) | 0.186 | 0.172 | 0.177 ± 0.002 |
| Logistic Regression | 0.953 | 0.931 | 0.893 ± 0.051 |
| Random Forest | 0.953 | 0.862 | 0.886 ± 0.042 |

*(Cột 80/20 khớp đúng số của `r1_metrics.md` gốc — xác nhận loader và split đúng.)*

Cả hai split chạy trên cùng 141 dòng, chỉ khác tỷ lệ chia. Cột CV không đổi vì CV
luôn dùng hết 141 dòng bất kể split ban đầu là gì. Split 70/30 có tập test lớn hơn
(43 so với 29 dòng) nên số liệu hold-out ổn định hơn, ít bị một ca đoán sai làm
nhảy điểm mạnh — nhưng đổi lại tập train chỉ còn 98 dòng thay vì 112. Đây là đánh
đổi kinh điển giữa độ tin cậy của đánh giá và lượng dữ liệu để học; không có lựa
chọn nào "đúng tuyệt đối" với 141 dòng — nên báo cáo cả hai, giống cách R1 gốc đã
báo cả hold-out lẫn CV.

## 4. Học tăng cường trên tập 8, so sánh với chưa tăng cường

File: `scripts/train_augmented.py` → `reports/augmentation_comparison.md`

Đã xác nhận với bạn: "học tăng cường" = **data augmentation** (sinh thêm mẫu từ
112 dòng train bằng bit-flip nhiễu thấp, không dùng y văn), không phải reinforcement
learning.

| Model | Acc baseline (train=112) | Acc augmented (train=447) | Chênh |
|---|---|---|---|
| Dummy (sàn) | 0.172 | 0.172 | +0.000 |
| Logistic Regression | 0.931 | 0.931 | +0.000 |
| Random Forest | 0.862 | 0.828 | −0.034 |

*(Cột baseline khớp đúng số 0.931 / 0.862 của `r1_metrics.md` gốc.)*

**Kết quả thật, không chỉnh sửa:** tăng cường kiểu lát-bit nhiễu thấp trên tập này
**không cải thiện** — Logistic Regression gần như không đổi, Random Forest giảm nhẹ.
Hợp lý về mặt kỹ thuật: dữ liệu đã khá cân bằng sẵn (21–25 ca/lớp), và nhiễu ngẫu
nhiên trên vector nhị phân chủ yếu làm mờ ranh giới lớp thay vì bổ sung thông tin
mới — khác với augmentation có cấu trúc dựa trên tri thức miền (như ma trận từ y
văn ở R2/R3, hiện đã loại khỏi phạm vi). Đã kiểm tra và loại 1 dòng tăng cường vô
tình trùng khớp với tập test trước khi so sánh, để đảm bảo không rò rỉ dữ liệu.

---

## Việc cần làm tiếp / cần xác nhận với giảng viên

1. Yêu cầu "không dùng y văn" khác với kế hoạch R2/R3 đã thống nhất trước đó (QĐ-12)
   — nên trao đổi lại xem đây là thay đổi phạm vi đồ án hay chỉ tạm dừng nhánh đó.
2. Kết quả augmentation là một phát hiện âm tính hợp lệ (không cải thiện) — nên báo
   cáo trung thực thay vì thử nhiều tham số (flip_prob, số bản sao) cho tới khi ra
   số đẹp hơn, vì đó chính là "chọn dữ liệu theo kết quả mong muốn" mà báo cáo R1
   gốc đã tự đặt nguyên tắc tránh.
3. `shared/symptoms.json` giờ đã có trong gói này (`shared/symptoms.json`) — giữ lại
   để lần sau không cần gửi lại.