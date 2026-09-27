# Báo cáo kết quả thí nghiệm R1 — Dự đoán bệnh trên chó từ triệu chứng lâm sàng

**Đề tài:** Ứng dụng học máy dự đoán bệnh thú y trong hệ thống quản lý phòng khám PawCare
**Sinh viên:** *[Họ tên]* — *[MSSV]* — *[Lớp]*
**Giảng viên hướng dẫn:** *[Họ tên]*
**Ngày báo cáo:** 15/09/2026 · **Ngày chạy thí nghiệm:** 14/09/2026

---

## Tóm tắt

Theo yêu cầu của thầy/cô ở buổi trao đổi ngày 13/09, em đã thu hẹp đề tài về **một loài (chó)** và thực hiện trước bước **chia 8/2 train–test trên dữ liệu lâm sàng thật**, ghi nhận kết quả làm mốc đối chứng trước khi sinh dữ liệu từ y văn.

Kết quả trên tập dữ liệu **141 ca khám thật / 6 bệnh**:

| Chỉ số | Random Forest (mô hình chính) |
|---|---|
| Accuracy — tập test 80/20 (n = 29) | **0,862** |
| Accuracy — 5-fold cross-validation | **0,886 ± 0,042** |
| Macro-F1 — 5-fold cross-validation | **0,882 ± 0,045** |
| Sàn ngẫu nhiên để so sánh | 0,177 |

Mô hình vượt sàn ngẫu nhiên **5 lần**. Toàn bộ các cặp nhầm lẫn đều hợp lý về mặt lâm sàng (nhầm trong cùng nhóm hô hấp, cùng nhóm tiêu hóa). Báo cáo có nêu đầy đủ các giới hạn đã đo được, trong đó có mức rò rỉ dữ liệu 6,9% do tập gốc có dòng trùng lặp.

**Giai đoạn 1A đã hoàn tất.** Bước tiếp theo là xây ma trận xác suất triệu chứng–bệnh từ y văn thú y để chạy hai thí nghiệm đối chứng R2 và R3.

---

## 1. Bối cảnh và yêu cầu

Ở buổi trao đổi trước, sau khi em báo cáo rằng hai bộ dữ liệu Kaggle được chỉ định đều **không đủ điều kiện để huấn luyện** (bộ [12] chỉ có 431 dòng trên 135 nhãn; bộ [13] không có cột nhãn), thầy/cô đã đưa ra hai điều chỉnh:

1. **Thu hẹp phạm vi còn một loài** — chó hoặc mèo, được phép làm cả hai nếu tìm đủ dữ liệu.
2. **Chia 8/2 train–test trên dữ liệu thật, ghi nhận kết quả trước**, sau đó mới sinh dữ liệu từ y văn và kiểm tra lại.

Em chọn **chó**, không phải theo sở thích mà theo dữ liệu sẵn có: khảo sát lần hai không tìm được bộ dữ liệu dạng bảng nào cho mèo, trong khi toàn bộ nguồn dùng được đều là chó.

Phạm vi bệnh rút từ 34 xuống **20 bệnh chó**. Thí nghiệm R1 trong báo cáo này chính là mốc đối chứng theo yêu cầu thứ hai ở trên.

### Thiết kế ba thí nghiệm

Để trả lời được câu hỏi "dữ liệu sinh từ y văn có thực sự cải thiện kết quả không", em thiết kế ba chế độ dùng **chung một tập test**:

| | Huấn luyện bằng | Kiểm tra trên | Trả lời câu hỏi |
|---|---|---|---|
| **R1** *(báo cáo này)* | 112 dòng thật (80%) | 29 dòng thật (20%) | Mốc đối chứng theo yêu cầu |
| **R2** | Chỉ dữ liệu sinh từ y văn | 29 dòng thật | Ma trận y văn có khớp với lâm sàng thật không? |
| **R3** | Dữ liệu sinh + 112 dòng thật | 29 dòng thật | Kết hợp có tốt hơn từng cái riêng lẻ không? |

R2 là con số em cho là có giá trị khoa học nhất của đồ án: nó đo trực tiếp **khoảng cách giữa mô tả trong y văn và thực tế ghi chép ở phòng khám**, vì mô hình R2 không nhìn thấy một dòng dữ liệu thật nào khi huấn luyện.

---

## 2. Dữ liệu

### 2.1 Nguồn

| | |
|---|---|
| **Tên tập** | `dogfinal3.csv` |
| **Nguồn** | Kho GitHub *Predicting Dog Common Diseases Using Supervised Machine Learning Classification* |
| **Bản chất** | **Hồ sơ lâm sàng thật** từ một phòng khám thú y tại Cagayan de Oro, Philippines — không phải dữ liệu sinh tổng hợp |
| **Giấy phép** | The Unlicense (miền công cộng, được phép phân phối lại) |
| **Kích thước gốc** | 165 dòng · 7 bệnh · 52 cột triệu chứng nhị phân |
| **Kiểm chứng** | Đã ghi lại SHA256 của file để kết quả tái lập được |

Tập này **không có** cột giống, tuổi, giới tính, cân nặng — đây là một giới hạn của R1, em nêu rõ ở mục 6.

### 2.2 Tiền xử lý

**Loại bỏ 24 dòng `heartworm` (bệnh giun tim).** Bệnh này được loại khỏi phạm vi 20 bệnh vì ba lý do: chẩn đoán thật dựa trên **xét nghiệm kháng nguyên**, không dựa trên triệu chứng; tài liệu MSD Veterinary Manual ghi *"Most dogs have no, or only mild, clinical signs"* nên các ca có triệu chứng là một tập con thiên lệch; và bộ triệu chứng của nó trùng lặp nặng với bệnh ho cũi chó.

**Ánh xạ từ vựng.** 52 tên cột của tập gốc và 7 nhãn bệnh được ánh xạ sang bộ mã chuẩn của hệ thống (`shared/symptoms.json` — 51 mã triệu chứng, dùng chung cho cả Python, Spring Boot và React). Bảng ánh xạ được lưu thành file riêng `mapping_dogfinal3.csv` và có script kiểm tra tự động đi kèm. 46/52 cột ánh xạ được, gom về 33 mã.

**Kết quả:** ma trận **141 dòng × 51 cột** nhị phân.

### 2.3 Phân bố nhãn

| Bệnh | Nhãn gốc | Số ca |
|---|---|---|
| `distemper` — Sài sốt chó (Carê) | `caninedistemper` | 25 |
| `rabies` — Dại | `rabies` | 25 |
| `parvo` — Viêm ruột do Parvovirus | `canineparvovirus` | 24 |
| `leptospirosis` — Xoắn khuẩn Lepto | `leptospirosis` | 24 |
| `kennel_cough` — Ho cũi chó | `kennelcough` | 22 |
| `ckd_dog` — Bệnh thận mạn | `kidneydisease` | 21 |
| | | **141** |

Phân bố khá cân bằng (21–25 ca mỗi lớp), nên accuracy là chỉ số đọc được; em vẫn báo cáo kèm macro-F1 và bảng per-class.

---

## 3. Phương pháp thí nghiệm

| Hạng mục | Cấu hình |
|---|---|
| Bài toán | Phân loại đa lớp, 6 lớp |
| Đặc trưng | 51 cờ triệu chứng nhị phân |
| Chia dữ liệu | **80/20 stratified**, `random_state = 42` → **112 train / 29 test** |
| Đánh giá bổ sung | **5-fold stratified cross-validation**, `shuffle = True`, `random_state = 42` |
| Mô hình | Dummy (sàn), Logistic Regression, Random Forest |
| Chỉ số | Accuracy, Precision, Recall, F1 (per-class và macro), confusion matrix |
| Môi trường | Python 3.14.7 · scikit-learn 1.9.1 · pandas 3.0.5 · phiên bản ghim trong `requirements.txt` |

**Ghi chú về con số 112/29.** Trong kế hoạch em ước tính tay là 113/28. Thực tế `test_size = 0.2 × 141 = 28,2` và scikit-learn làm tròn lên, nên số thật là 112/29. Em giữ nguyên `test_size = 0.2` vì tỷ lệ 8/2 mới là điều thầy/cô yêu cầu, còn 113/28 chỉ là phép tính nhẩm.

**Vì sao bổ sung cross-validation.** Tập test 29 dòng tương ứng khoảng 4–5 ca mỗi lớp — sai một ca là recall của lớp đó nhảy khoảng 20 điểm. Với 5-fold, mỗi dòng được dùng làm test đúng một lần, tức đánh giá trên cả 141 dòng thay vì 29. Đây là cách xử lý tiêu chuẩn cho tập nhỏ. **Em báo cáo cả hai con số**: con số 80/20 theo đúng yêu cầu, và con số CV vì nó đáng tin hơn.

**Mô hình Dummy** luôn đoán lớp phổ biến nhất, dùng làm sàn so sánh. Không có sàn này thì không đọc được con số 0,886 là tốt hay tầm thường.

---

## 4. Kết quả

### 4.1 So sánh ba mô hình

| Mô hình | Accuracy (n = 29) | Macro-F1 (n = 29) | Accuracy 5-fold CV | Macro-F1 5-fold CV |
|---|---|---|---|---|
| Dummy (sàn) | 0,172 | 0,049 | 0,177 ± 0,002 | 0,050 ± 0,001 |
| Logistic Regression | **0,931** | **0,935** | **0,893 ± 0,051** | **0,890 ± 0,052** |
| **Random Forest** *(mô hình chính)* | 0,862 | 0,869 | 0,886 ± 0,042 | 0,882 ± 0,045 |

### 4.2 Chỉ số từng lớp — Random Forest, tập test n = 29

| Bệnh | Precision | Recall | F1 | Số ca test |
|---|---|---|---|---|
| `ckd_dog` | 1,00 | 1,00 | 1,00 | 4 |
| `distemper` | 0,80 | 0,80 | 0,80 | 5 |
| `kennel_cough` | 0,83 | 1,00 | 0,91 | 5 |
| `leptospirosis` | 1,00 | 0,80 | 0,89 | 5 |
| `parvo` | 0,67 | 0,80 | 0,73 | 5 |
| `rabies` | 1,00 | 0,80 | 0,89 | 5 |

### 4.3 Confusion matrix — Random Forest, tập test n = 29

| Thật \ Đoán | `ckd_dog` | `distemper` | `kennel_cough` | `leptospirosis` | `parvo` | `rabies` |
|---|---|---|---|---|---|---|
| **`ckd_dog`** | **4** | 0 | 0 | 0 | 0 | 0 |
| **`distemper`** | 0 | **4** | 1 | 0 | 0 | 0 |
| **`kennel_cough`** | 0 | 0 | **5** | 0 | 0 | 0 |
| **`leptospirosis`** | 0 | 0 | 0 | **4** | 1 | 0 |
| **`parvo`** | 0 | 1 | 0 | 0 | **4** | 0 |
| **`rabies`** | 0 | 0 | 0 | 0 | 1 | **4** |

Bản đồ họa: `ai_service/reports/r1_confusion_matrix.png`

---

## 5. Phân tích

### 5.1 Logistic Regression thắng Random Forest — nhưng phần lớn là nhiễu

Trên tập hold-out, Logistic Regression hơn Random Forest **7 điểm** (0,931 so với 0,862). Nhưng trên cross-validation, khoảng cách chỉ còn **0,7 điểm** (0,893 so với 0,886) — nằm gọn trong độ lệch chuẩn của cả hai mô hình.

Kết luận đúng là **hai mô hình ngang nhau**, còn con số 7 điểm kia chủ yếu là nhiễu của một tập test 29 dòng. Đây chính là lý do em bổ sung cross-validation: nếu chỉ nhìn hold-out thì đã kết luận sai.

**Vì sao mô hình tuyến tính đủ sức:** 51 đặc trưng nhị phân, 6 bệnh, mỗi bệnh có nhóm triệu chứng tương đối riêng biệt — ranh giới giữa các lớp gần như tuyến tính, nên Random Forest không có chỗ phát huy thế mạnh bắt tương tác phi tuyến, đặc biệt khi chỉ có 112 dòng huấn luyện.

Em **giữ Random Forest làm mô hình chính** theo yêu cầu phi chức năng của đề bài, và dự kiến ở R2/R3 (dữ liệu nhiều hơn, có thêm đặc trưng giống/tuổi/cân nặng) thì Random Forest sẽ vượt lên. Nhưng em **vẫn báo cáo Logistic Regression** vì giấu đi thì không trả lời được câu hỏi "sao không thử mô hình đơn giản hơn trước".

### 5.2 Kết quả của lớp `rabies` đúng như phân tích trước khi huấn luyện

Trước khi chạy mô hình, em đã đo phân bố của hai triệu chứng đặc trưng cho bệnh dại trong 141 dòng và dự đoán trước hành vi của mô hình:

| | Dự đoán trước khi train | Kết quả thật |
|---|---|---|
| Precision | ≈ 1,00 — triệu chứng `aggression` gần như độc quyền cho lớp này (18/18 ca có `aggression` đều là dại) | **1,00** |
| Recall | 70–85% — còn 7/25 ca dại **không hề có** `aggression`, chỉ có liệt, chảy dãi, sốt | **0,80** |

Điểm quan trọng: **precision 1,00 của lớp dại là đặc tính của bệnh, không phải thành tích của mô hình.** Nếu chỉ khoe macro-F1 mà không tách per-class thì con số sẽ bị hiểu nhầm. Đây là lý do em đưa bảng per-class vào báo cáo như một mục bắt buộc.

Ca dại bị bỏ sót nhiều khả năng chính là **dòng có vector toàn 0** — một ca chỉ được ghi duy nhất triệu chứng `pica` (ăn bậy), mã này đã cố ý bỏ khi ánh xạ. Mô hình không có thông tin gì để dựa vào nên đoán sang `parvo`.

### 5.3 Rò rỉ dữ liệu nhẹ do dòng trùng lặp — 2/29 dòng (6,9%)

Hai dòng trong tập test có bản sao y hệt (cả triệu chứng lẫn nhãn) nằm trong tập train. Mô hình chỉ cần nhớ lại là đúng, nên **accuracy hold-out cao hơn thực lực một chút**.

Đây là hệ quả tự nhiên của việc tập dữ liệu gốc có 6,4% dòng trùng lặp — hai con chó khác nhau, cùng bệnh, được bác sĩ ghi cùng một bộ triệu chứng.

**Em không xử lý bằng cách xóa dòng trùng.** Xóa đi là bóp méo phân bố thật, vì bệnh phổ biến vốn có nhiều ca giống nhau. Cách đúng là **đo và công bố con số này**, và đã bổ sung hàm đo tự động vào script để lần chạy nào cũng in ra.

### 5.4 Mọi cặp nhầm lẫn đều hợp lý về lâm sàng

| Nhầm | Số ca | Giải thích |
|---|---|---|
| `distemper` → `kennel_cough` | 1 | Cùng nhóm hô hấp: ho, chảy mũi, hắt hơi |
| `leptospirosis` → `parvo` | 1 | Cùng sốt kèm rối loạn tiêu hóa |
| `parvo` → `distemper` | 1 | Cùng nôn, bỏ ăn, lờ đờ |
| `rabies` → `parvo` | 1 | Ca vector rỗng đã nêu ở mục 5.2 |

Không có cặp nhầm lẫn nào vô lý về mặt y học. Đây là dấu hiệu tốt: mô hình học đúng cấu trúc bệnh lý chứ không bắt vào đặc trưng rác.

`kennel_cough` đạt recall 1,00 (5/5) — dễ nhất trong sáu bệnh, vì bộ triệu chứng hô hấp của nó ít chồng lấn nhất.

### 5.5 Về việc accuracy cao hơn ngưỡng dự kiến ban đầu

Trong kế hoạch ban đầu em đặt ngưỡng mục tiêu **78–88%** và quy ước rằng nếu vượt 92% thì phải nghi ngờ dữ liệu quá sạch.

Ngưỡng đó **không áp dụng cho R1**: nó được đặt cho bài toán **34 lớp trên dữ liệu sinh tổng hợp**, trong khi R1 là **6 lớp trên dữ liệu lâm sàng thật**. Bài toán 6 lớp dễ hơn hẳn, và ở đây không có nhiễu nhân tạo nào để điều chỉnh.

Ngưỡng 78–88% **vẫn giữ nguyên hiệu lực cho R2 và R3** — đó mới là nơi dùng dữ liệu sinh từ y văn.

---

## 6. Giới hạn của kết quả R1

Em nêu đầy đủ, kể cả những điểm làm con số trông kém đẹp hơn:

1. **Tập test 29 dòng là rất nhỏ** — khoảng 4–5 ca mỗi lớp. Mọi kết luận trong báo cáo đều dựa trên con số cross-validation, không dựa trên hold-out.
2. **R1 chạy trên tập đặc trưng hẹp hơn R2/R3.** Tập `dogfinal3` không có cột giống/tuổi/giới tính/cân nặng, nên R1 chỉ dùng 51 mã triệu chứng. Khi so sánh R1 với R2/R3 phải kèm lưu ý này.
3. **Chỉ 6/20 bệnh được đánh giá.** 14 bệnh còn lại trong phạm vi đề tài chưa có dữ liệu thật nào để kiểm chứng.
4. **20/51 cột đặc trưng luôn bằng 0** trong dữ liệu thật. Em giữ đủ cột là có chủ đích, để ba chế độ R1/R2/R3 dùng chung một không gian đặc trưng; nhưng thực chất R1 chỉ dùng 31 mã có thông tin.
5. **Rò rỉ 2/29 dòng (6,9%)** như đã nêu ở mục 5.3.
6. **Một dòng test không mang thông tin nào** (vector toàn 0). Em giữ lại có chủ đích: bỏ một dòng vì biết trước mô hình sẽ đoán sai chính là chọn dữ liệu theo kết quả mong muốn. Chi phí chỉ khoảng 0,7% accuracy.

---

## 7. Kế hoạch tiếp theo

**Giai đoạn 1B — xây ma trận xác suất triệu chứng–bệnh từ y văn.**

Em dùng **MSD/Merck Veterinary Manual** bản online miễn phí làm nguồn — đã kiểm tra có đủ trang cho cả 20 bệnh, có mục *Clinical Findings* và *Epidemiology*, trích dẫn được. Quy trình: đọc phần mô tả định tính trong sách, quy đổi sang xác suất số theo một **bảng thang đo cố định** (ví dụ *"almost always"* → 0,93; *"most cases"* → 0,85), ghi lại **nguyên văn câu trong sách kèm đường dẫn** cho từng con số.

Ba quy tắc em tự đặt ra và tuân thủ nghiêm:

1. Luôn lấy **điểm giữa khoảng** của thang đo, để ai làm lại cũng ra đúng con số đó.
2. **"Sách không nhắc tới" gán 0,02, không gán 0,00** — vì 0,00 nghĩa là tuyệt đối không bao giờ, mô hình sẽ học thành luật cứng.
3. **Ma trận chốt xong trước khi huấn luyện lần đầu, không sửa sau khi đã nhìn thấy accuracy.** Nếu train ra 71%, chỉnh vài con số rồi train lại được 85% thì con số 85% đó vô nghĩa.

Sau khi có ma trận, em sinh khoảng 6.000 ca bằng Bernoulli sampling có tiêm nhiễu, rồi chạy **R2** và **R3** trên cùng tập test 29 dòng để hoàn thành bảng so sánh ba chế độ — đây là kết quả trung tâm của đồ án.

**Về phương pháp sinh dữ liệu,** em xin nêu trước tiền lệ để thầy/cô đánh giá: đây là quy trình chuẩn của mảng *automatic diagnosis* khi không tiếp cận được hồ sơ bệnh án điện tử thật. Cơ sở dữ liệu SymCAT và các nghiên cứu dựa trên nó (ví dụ BSODA, arXiv:2012.01065) đều sinh bệnh nhân tổng hợp bằng đúng cách này. Điểm khác của đồ án là nguồn xác suất lấy từ y văn thú y thay vì cơ sở dữ liệu y khoa người, vì mảng thú y chưa có tài nguyên tương đương.

Em cũng ghi nhận trước một **giới hạn đã biết** của phương pháp: ma trận cộng với tung xu độc lập chính là một mô hình sinh Naive Bayes, mang giả định *conditional independence* — giả định này sai trên lâm sàng (nôn nhiều và mất nước đi kèm nhau chặt hơn hai đồng xu độc lập). Bản nâng cấp là Bayesian network, em cố ý không làm vì nhân đôi khối lượng tra sách, nhưng sẽ nêu rõ trong mục Giới hạn của báo cáo cuối kỳ.

---

## Phụ lục — Tái lập kết quả

Toàn bộ số liệu trong báo cáo này sinh ra từ script, chạy lại là ra đúng con số:

```
ai_service/.venv/Scripts/python.exe ai_service/scripts/train_baseline.py
```

| File | Nội dung |
|---|---|
| `ai_service/scripts/load_real_data.py` | Đọc dữ liệu gốc, áp bảng ánh xạ, xuất ma trận 141 × 51 |
| `ai_service/scripts/train_baseline.py` | Chạy R1: split 80/20 + 5-fold CV, ba mô hình |
| `ai_service/scripts/check_mapping.py` | Kiểm tra bảng ánh xạ còn khớp với `symptoms.json` không |
| `ai_service/reports/r1_metrics.md` | Bảng số liệu **sinh tự động**, không sửa tay |
| `ai_service/reports/r1_confusion_matrix.png` | Confusion matrix dạng hình |
| `ai_service/data/external/README.md` | Nguồn, giấy phép, SHA256 của tập dữ liệu |

Mọi phiên bản thư viện đều được ghim trong `ai_service/requirements.txt`, và mọi bước có yếu tố ngẫu nhiên đều đặt `random_state = 42`.

---

*Em xin cảm ơn thầy/cô đã điều chỉnh phạm vi đề tài — nhờ thu hẹp về một loài và ưu tiên dữ liệu thật trước, em đã có số liệu đối chứng để báo cáo mà không phải chờ hoàn thành phần tra cứu y văn.*
