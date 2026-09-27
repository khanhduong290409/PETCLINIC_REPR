# R1 — Diễn giải kết quả

**Ngày:** 2026-09-14
**Số liệu gốc:** [`r1_metrics.md`](r1_metrics.md) *(sinh tự động, chạy lại script là cập nhật)*
**Chạy lại:** `ai_service/.venv/Scripts/python.exe ai_service/scripts/train_baseline.py`

> Đây là **mốc đối chứng R1** theo QĐ-12 — con số giảng viên yêu cầu: chia 8/2 trên dữ
> liệu thật, ghi nhận kết quả trước khi sinh dữ liệu từ y văn.

---

## Kết luận ngắn

**Model chính thức (Random Forest): accuracy `0.886 ± 0.042`, macro-F1 `0.882 ± 0.045`** (5-fold CV trên cả 141 dòng).

Trên tập hold-out 29 dòng: accuracy `0.862`, macro-F1 `0.869`.

Để so sánh, sàn ngẫu nhiên (luôn đoán lớp phổ biến nhất) chỉ đạt `0.177`. Model vượt sàn **5 lần**.

**R1 đã xong. Có đủ số liệu để báo cáo giảng viên.**

---

## Năm phát hiện

### 1. Logistic Regression thắng Random Forest — nhưng phần lớn là nhiễu

| Model | Accuracy hold-out (n=29) | Accuracy 5-fold CV |
|---|---|---|
| Logistic Regression | **0.931** | **0.893 ± 0.051** |
| Random Forest | 0.862 | 0.886 ± 0.042 |

Chênh lệch trên hold-out là **7 điểm**, nhưng trên CV chỉ còn **0,7 điểm** — nằm gọn trong độ lệch chuẩn của cả hai. Nói cách khác: **hai model ngang nhau**, còn con số 7 điểm kia chủ yếu là nhiễu của tập test 29 dòng.

Đây chính là lý do QĐ-12 bắt buộc có cross-validation. Nếu chỉ nhìn hold-out thì đã kết luận sai rằng LR tốt hơn hẳn.

**Vì sao model tuyến tính lại đủ sức:** 51 feature nhị phân, 6 bệnh, mỗi bệnh có nhóm triệu chứng tương đối riêng. Ranh giới giữa các lớp gần như tuyến tính, nên Random Forest không có chỗ phát huy thế mạnh (bắt tương tác phi tuyến) — đặc biệt khi chỉ có 112 dòng train.

**Không đổi model chính.** Yêu cầu phi chức năng của đề bài là Random Forest/XGBoost, và ở R2/R3 (dữ liệu nhiều hơn, feature rộng hơn có cả giống/tuổi/cân nặng) thì RF nhiều khả năng sẽ vượt lên.

**Nhưng phải báo cáo cả Logistic Regression.** Giấu đi thì khi bị hỏi *"sao không thử model đơn giản hơn trước"* sẽ không có câu trả lời. Chủ động đưa vào thì đây là một mục phân tích tốt.

### 2. `rabies` ra đúng như dự đoán trước khi train

| | Dự đoán từ phân tích dữ liệu | Kết quả thật |
|---|---|---|
| Precision | ≈ 1.00 (`aggression` gần như độc quyền) | **1.00** |
| Recall | 70–85% (7/25 ca không có `aggression`) | **0.80** |

Đây là xác nhận trực tiếp cho phần hiệu chỉnh QĐ-10 ngày 2026-09-14. Lo ngại ban đầu rằng *"rabies quá dễ, sẽ luôn 100%"* là **sai ở vế recall**: model bỏ sót 1/5 ca.

Ca bị bỏ sót nhiều khả năng chính là **dòng vector toàn 0** — ca `rabies` chỉ ghi mỗi `pica`, và nó rơi vào tập test. Model không có thông tin gì để dựa vào nên đoán sang `parvo`.

> Dùng đoạn này trong báo cáo: nó cho thấy phân tích dữ liệu **trước** khi train đã dự đoán đúng hành vi của model — mạnh hơn nhiều so với việc giải thích ngược sau khi thấy kết quả.

### 3. Accuracy vượt ngưỡng 78–88% của QĐ-02 — nhưng đây không phải dấu hiệu xấu

QĐ-02 quy định: accuracy > 92% là dấu hiệu dữ liệu giả, phải quay lại tăng nhiễu.

**Ngưỡng đó không áp vào đây.** Nó được đặt cho bài toán **34 lớp trên dữ liệu sinh tổng hợp**. R1 là **6 lớp trên dữ liệu lâm sàng thật** — bài dễ hơn hẳn, và không có nhiễu nhân tạo nào để mà tăng.

`PROGRESS.md` đã cảnh báo trước tình huống này: *"Còn 20 lớp thì bài dễ hơn, rất có thể vượt 92%. Lúc đó đừng vội tăng nhiễu."*

**Ngưỡng 78–88% vẫn giữ nguyên hiệu lực cho R2 và R3** — đó mới là nơi dùng dữ liệu sinh.

### 4. Có rò rỉ nhẹ do dòng trùng lặp — 2/29 dòng (6,9%)

Hai dòng trong tập test có bản sao y hệt (cả triệu chứng lẫn nhãn) nằm trong tập train. Model chỉ cần nhớ lại là đúng, nên **accuracy hold-out cao hơn thực lực đôi chút**.

Đây là hệ quả tự nhiên của việc tập dữ liệu có 6,4% dòng trùng lặp — hai con chó khác nhau, cùng bệnh, được ghi cùng một bộ triệu chứng. Khác hẳn với 29,2% trùng lặp của `symtomdata.csv` (lý do loại tập đó ở QĐ-11): ở đây là trùng lặp tự nhiên của dữ liệu lâm sàng, không phải sản phẩm của máy sinh dữ liệu.

**Không xử lý bằng cách xóa dòng trùng.** Xóa đi là bóp méo phân bố thật — bệnh phổ biến vốn có nhiều ca giống nhau. Cách đúng là **đo và công bố con số này**, đã làm.

### 5. Các cặp nhầm lẫn đều hợp lý về lâm sàng

| Nhầm | Số ca | Giải thích |
|---|---|---|
| `distemper` → `kennel_cough` | 1 | Cùng nhóm hô hấp: ho, chảy mũi, hắt hơi |
| `leptospirosis` → `parvo` | 1 | Cùng sốt + rối loạn tiêu hóa |
| `parvo` → `distemper` | 1 | Cùng nôn, bỏ ăn, lờ đờ |
| `rabies` → `parvo` | 1 | Ca vector rỗng, model đoán bừa |

Không có cặp nhầm lẫn nào vô lý. Đây là dấu hiệu tốt: model học đúng cấu trúc bệnh lý chứ không bắt vào đặc trưng rác.

`kennel_cough` đạt recall `1.00` (5/5) — dễ nhất, vì bộ triệu chứng hô hấp của nó ít chồng lấn nhất trong 6 bệnh.

---

## Hàm ý cho R2 và R3

**Mốc để so sánh: CV accuracy `0.886` của Random Forest.**

Khi có R2 (train thuần từ y văn), cách đọc kết quả:

| R2 so với R1 | Nghĩa là |
|---|---|
| Xấp xỉ hoặc cao hơn | Ma trận y văn **khớp tốt** với lâm sàng thật — kết quả mạnh, đáng là điểm nhấn của báo cáo |
| Thấp hơn rõ rệt | Có khoảng cách giữa y văn và thực tế ghi chép ở phòng khám. **Cũng là kết quả có giá trị** — chính là đại lượng R2 sinh ra để đo |
| Rất thấp (gần sàn 0.177) | Bảng ánh xạ hoặc ma trận có lỗi kỹ thuật, phải kiểm tra lại trước khi kết luận |

⚠️ **Dù R2 ra thế nào cũng không được sửa ma trận xác suất** (QĐ-08 luật 3). R2 thấp là một phát hiện, không phải một lỗi cần vá.

**Một bất lợi đã biết của R2:** `jaw_drop` có trong dữ liệu sinh nhưng **không xuất hiện ở bất kỳ dòng thật nào** (0/141). Model R2 sẽ trông cậy vào nó để nhận diện `rabies`, nhưng tập test không bao giờ cung cấp. Recall `rabies` ở R2 sẽ thấp hơn ở R1 — **đây là kết quả hợp lệ, không phải lỗi ma trận.**

---

## Giới hạn phải nêu rõ trong báo cáo

1. **R1 chạy trên tập feature hẹp hơn R2/R3.** `dogfinal3` không có cột giống/tuổi/giới tính/cân nặng, nên R1 chỉ dùng 51 mã triệu chứng. So sánh R1 với R2/R3 phải kèm lưu ý này.
2. **Tập test 29 dòng là rất nhỏ** — khoảng 4–5 dòng mỗi lớp. Sai một ca là recall của lớp đó nhảy 20 điểm. Đây là lý do mọi kết luận đều dựa trên con số CV, không dựa trên hold-out.
3. **Chỉ 6/20 bệnh được đánh giá.** `dogfinal3` chỉ phủ 6 bệnh; 14 bệnh còn lại chưa có dữ liệu thật nào để kiểm chứng.
4. **20/51 cột feature luôn bằng 0** trong dữ liệu thật. Giữ đủ cột là có chủ đích để R1/R2/R3 cùng một không gian feature, nhưng nghĩa là R1 thực chất chỉ dùng 31 mã có thông tin.
5. **Rò rỉ 2/29 dòng** như mục 4 ở trên.
6. **Một dòng test không có thông tin** (vector toàn 0). Giữ lại là có chủ đích — xem hiệu chỉnh QĐ-10.

---

## Việc tiếp theo

1. Báo cáo số liệu R1 cho giảng viên → **kết thúc giai đoạn 1A**
2. Sang giai đoạn 1B: tra MSD Vet Manual, điền `disease_matrix_source.csv` — 20 lượt, làm theo lô 5 bệnh
