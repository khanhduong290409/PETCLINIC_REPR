# Chức năng AI chẩn đoán bệnh thú y — Giải thích cho người mới

> Tài liệu này viết cho người **chưa quen Python và Machine Learning**.
> Đọc từ trên xuống: phần 1–2 giải thích khái niệm, phần 3–9 đi qua từng bước đã làm, phần 10–12 là cách chạy, thuật ngữ và câu hỏi hay gặp khi bảo vệ.
>
> Số liệu và quyết định trong file này lấy từ [DECISIONS.md](DECISIONS.md), [PROGRESS.md](PROGRESS.md) và [`ca_results.md`](../../ai_service/reports/ca_results.md) (cập nhật 2026-10-18). Nếu các file đó thay đổi, chúng là nguồn đúng.

---

## 1. Chức năng này làm gì?

Người dùng vào trang **"Chẩn đoán AI"** (`/ai-diagnosis`), chọn **loài** (chó, mèo, bò, ngựa, cừu, dê, lợn, thỏ), chọn **triệu chứng**, có thể nhập thêm giống, giới tính, tuổi, cân nặng, nhiệt độ, nhịp tim, số ngày bệnh. Bấm "Phân tích" → hệ thống trả về **3 bệnh có khả năng cao nhất** kèm phần trăm, mức độ khẩn cấp, mô tả và lời khuyên.

Kết quả **chỉ để tham khảo**, không thay bác sĩ. Trang luôn có lời nhắc này và nút "Đặt lịch khám".

```
 Trình duyệt (React)          Spring Boot (Java)           ai_service (Python)
 ┌──────────────────┐  HTTP   ┌──────────────────┐  HTTP   ┌────────────────────────┐
 │ AiDiagnosis.tsx  │ ──────► │ AiController     │ ──────► │ app.py (FastAPI)       │
 │ chọn loài,       │         │ kiểm tra đăng    │         │ model Random Forest    │
 │ triệu chứng...   │ ◄────── │ nhập, chuyển     │ ◄────── │ trả top-3 bệnh + %     │
 └──────────────────┘  JSON   │ tiếp request     │  JSON   └────────────────────────┘
                              └──────────────────┘
```

---

## 2. Kiến thức nền tối thiểu

### 2.1. Machine Learning là gì?
Thay vì lập trình viên tự viết luật kiểu *"nếu sốt + nôn + tiêu chảy thì là Parvo"*, ta đưa cho máy **nhiều ca bệnh đã có đáp án**, máy **tự tìm ra quy luật**. Quá trình máy tìm quy luật gọi là **train (huấn luyện)**. Kết quả của việc train là một **model (mô hình)**: đưa ca mới vào, model đoán ra bệnh.

### 2.2. Feature và label
Mỗi ca bệnh trong dữ liệu là **một dòng**:
- **Feature (đặc trưng)**: thông tin đầu vào — loài, giống, tuổi, nhiệt độ, có sốt không, có ho không...
- **Label (nhãn)**: đáp án — tên bệnh.

Model học cách đi từ feature → label.

### 2.3. Máy chỉ hiểu số
Model không đọc được chữ "Sốt" hay "Labrador". Phải đổi hết sang số:
- Triệu chứng → **0/1**: có sốt = 1, không sốt = 0. Mỗi triệu chứng là một cột.
- Loài, giống, giới tính → **one-hot**: mỗi giá trị một cột, đúng giá trị thì 1, còn lại 0. Ví dụ loài chó: `species_DOG = 1`, `species_CAT = 0`, `species_COW = 0`...
- Tuổi, cân nặng, nhiệt độ, nhịp tim, số ngày bệnh → giữ nguyên số.

Ví dụ một dòng dữ liệu gốc:

| Loài | Giống | Tuổi | Giới | Cân nặng | Triệu chứng | Thời gian | Nhiệt độ | Nhịp tim | Bệnh |
|---|---|---|---|---|---|---|---|---|---|
| Dog | Labrador | 4 | Male | 25 | Fever, Lethargy, Appetite Loss, Vomiting | 3 days | 39.5°C | 120 | Parvovirus |

sau khi đổi sang số (rút gọn):

| species_DOG | species_CAT | breed_DOG_Labrador | fever | lethargy | anorexia | vomiting | coughing | ... | age | weight | temperature | heart_rate | duration_days | gender_male |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 0 | 1 | 1 | 1 | 1 | 1 | 0 | ... | 4 | 25 | 39.5 | 120 | 3 | 1 |

Label của dòng này là `parvo`. Tổng cộng mỗi dòng có **173 cột feature**.

### 2.4. Random Forest là gì?
**Cây quyết định** giống một chuỗi câu hỏi có/không:

```
Có ho không?
├─ Có → Nhiệt độ > 39.5?
│       ├─ Có → Bệnh hô hấp phức hợp
│       └─ Không → Lao bò
└─ Không → ...
```

Một cây dễ học thuộc lòng dữ liệu và đoán sai ca mới. **Random Forest (rừng ngẫu nhiên)** tạo ra **300 cây**, mỗi cây học trên một phần dữ liệu và một phần câu hỏi được chọn ngẫu nhiên, rồi cho **300 cây bỏ phiếu**. Ví dụ 180/300 cây chọn Parvo → xác suất Parvo ≈ 60%. Nhờ vậy model ổn định hơn và cho ra được phần trăm cho từng bệnh.

Chọn Random Forest vì: đề bài yêu cầu, chạy tốt với dữ liệu ít, không cần chuẩn hóa số, và cho xác suất để hiện top-3.

### 2.5. Train / test — vì sao phải chia dữ liệu?
Nếu kiểm tra model bằng chính các ca nó đã học thì giống **cho học sinh làm lại đúng đề đã chữa** — điểm cao nhưng không nói lên gì. Phải giữ riêng một phần dữ liệu (**tập test**) mà model **chưa từng thấy** để chấm điểm.

### 2.6. Cross-validation (CV) — chấm nhiều lần cho công bằng
Dữ liệu ít, chia một lần thì kết quả phụ thuộc may rủi (ca khó rơi vào test hay không). **3-fold CV**: chia dữ liệu làm 3 phần, chạy 3 lượt, mỗi lượt lấy 1 phần làm test và 2 phần làm train. Mọi dòng đều được làm test đúng một lần. Kết quả báo cáo là **trung bình ± độ lệch** của 3 lượt.

**Stratified** nghĩa là khi chia, mỗi phần giữ đúng tỉ lệ các bệnh — bệnh nào cũng có mặt trong cả train lẫn test.

### 2.7. Các chỉ số đánh giá
Lấy một bệnh, ví dụ Parvo:

| Chỉ số | Câu hỏi nó trả lời |
|---|---|
| **Accuracy** | Trong tất cả ca, đoán đúng bao nhiêu %? |
| **Precision** | Trong những ca model *nói* là Parvo, bao nhiêu % *thật sự* là Parvo? (đoán ra có đáng tin không) |
| **Recall** | Trong những ca *thật sự* là Parvo, model *bắt được* bao nhiêu %? (có bỏ sót không) |
| **F1-score** | Trung bình hài hòa của Precision và Recall — một con số gộp cả hai |

- **Macro**: tính chỉ số cho từng bệnh rồi lấy trung bình, bệnh nào cũng nặng như nhau → phản ánh cả bệnh hiếm.
- **Weighted**: trung bình có trọng số theo số ca → gần với accuracy.
- **Confusion matrix (ma trận nhầm lẫn)**: bảng hàng = bệnh thật, cột = bệnh đoán. Đường chéo là đoán đúng, ô ngoài đường chéo cho biết bệnh nào hay bị nhầm với bệnh nào.

### 2.8. Dummy — mức sàn để so sánh
**Dummy** là "model ngốc": lúc nào cũng đoán bệnh có nhiều ca nhất của loài đó. Model thật phải **hơn Dummy rõ ràng** thì mới chứng tỏ là có học được gì đó. Không có mức sàn thì con số 0.425 không biết là tốt hay tệ.

---

## 3. Bước 1 — Tìm và chọn dữ liệu

Đây là bước tốn thời gian nhất và đã **đổi hướng nhiều lần**. Ghi lại để hiểu vì sao dữ liệu cuối cùng là `cleaned_animal`.

| Giai đoạn | Dữ liệu | Kết cục |
|---|---|---|
| 08–09/2026 | Tự sinh ~7.900 ca từ sách thú y (y văn) | **Bỏ** — giảng viên yêu cầu chỉ dùng dữ liệu thật |
| 09/2026 | `symtomdata.csv` (Kaggle) | **Loại** — 2.000 mẫu mỗi bệnh đều tăm tắp, 29% dòng trùng → dữ liệu giả |
| 09–10/2026 | `dogfinal3.csv` (165 ca chó, Philippines) | Đạt accuracy 0.886 nhưng **giảng viên không chấp nhận** vì nguồn không chính thống |
| 10/2026 | `veterinary_clinical_data.csv` | **Loại** — sinh ngẫu nhiên: chó có triệu chứng "giảm đẻ trứng", "sưng bầu vú" |
| **10/2026 — hiện tại** | **`cleaned_animal_disease_prediction.csv`** (Kaggle, tài liệu [12] của đề bài) | **Dùng** — 431 dòng, 8 loài, có đủ giống/tuổi/giới/cân nặng/nhiệt độ/nhịp tim |

**Bài học:** trước khi train, phải **kiểm tra dữ liệu có thật không**. Dữ liệu giả thường lộ ra qua: số mẫu mỗi lớp bằng nhau tăm tắp, triệu chứng vô lý với loài, tỉ lệ dòng trùng cao bất thường.

File: `ai_service/data/cleaned_animal_disease_prediction.csv`

---

## 4. Bước 2 — Làm sạch dữ liệu

Dữ liệu Kaggle thô có nhiều vấn đề, phải xử lý trước khi train.

### 4.1. Cùng một bệnh nhưng viết nhiều tên
Ví dụ `Parvovirus` và `Canine Parvovirus` là một bệnh; Bluetongue có tới 5 cách viết. Nếu để nguyên, model coi đó là các bệnh khác nhau.
→ Gộp tay trong file **`ai_service/data/mapping_cleaned_animal.csv`**: 139 tên gốc → **44 mã bệnh**.

```csv
kind,source,target,note
disease,Cat|Feline Herpesvirus,cat_herpesvirus,""
disease,Cat|Feline Rhinotracheitis,cat_herpesvirus,"do FHV-1 gây ra -> cùng bệnh"
symptom,Loss of Appetite,anorexia,"3 cách viết cùng một triệu chứng -> gộp"
symptom,Appetite Loss,anorexia,"gộp với Loss of Appetite"
```

Tên bệnh có kèm loài (`Cat|...`) vì cùng một tên có thể là bệnh khác nhau ở loài khác.

### 4.2. Bệnh quá ít dữ liệu
Bệnh chỉ có 1–2 dòng thì không thể vừa train vừa test. → Chỉ giữ bệnh có **≥ 3 dòng** (tính sau khi gộp tên). Còn lại **351 dòng / 44 bệnh**.

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

### 4.3. Hai nguồn triệu chứng mâu thuẫn nhau
File có 4 cột chữ `Symptom_1..4` **và** 9 cột Yes/No (`Vomiting`, `Diarrhea`...). Đo thử: khi cột chữ ghi "Diarrhea", cột `Diarrhea` = Yes chỉ 56%; khi cột chữ không ghi, vẫn Yes 48% → 9 cột Yes/No gần như **điền ngẫu nhiên**.
→ **Bỏ 9 cột Yes/No**, chỉ dùng 4 cột chữ. (Phép đo này không nhìn tên bệnh, nên đây là sửa lỗi dữ liệu chứ không phải chọn cột để số đẹp. Thử giữ lại thì accuracy còn giảm từ 0.425 xuống 0.385.)

### 4.4. Đổi chuỗi sang số
`"39.5°C"` → `39.5`; `"1 week"` → `7` ngày; `"3 days"` → `3`.

---

## 5. Bước 3 — Một danh sách triệu chứng dùng chung

File **`shared/symptoms.json`** chứa: 8 loài, danh sách mã triệu chứng (kèm tên tiếng Việt, nhóm), 44 bệnh (tên tiếng Việt, mức độ khẩn cấp, mô tả, lời khuyên).

Quy tắc quan trọng: **thứ tự mảng triệu chứng = thứ tự cột feature**. Nếu Python lúc train và lúc dự đoán xếp cột khác nhau dù chỉ một cột, model vẫn chạy nhưng **đoán sai hoàn toàn mà không báo lỗi**. Vì vậy:
- Cả Python (dựng feature) lẫn React (hiện danh sách triệu chứng) đều đọc từ file này.
- Chỉ được thêm triệu chứng vào **cuối** mảng, không chèn giữa, không xóa.

---

## 6. Bước 4 — Code đọc dữ liệu và dựng feature

File: **`ai_service/scripts/load_cleaned_animal.py`**

| Hàm | Việc |
|---|---|
| `load_mapping()` | Đọc file mapping ở bước 2 |
| `load_records()` | Đọc CSV từng dòng → gộp tên bệnh, đổi triệu chứng sang mã, đổi chuỗi sang số, bỏ bệnh < 3 dòng |
| `build_feature_columns()` | Quyết định danh sách 173 cột theo thứ tự cố định: loài → giống → triệu chứng → các cột số → giới tính |
| `records_to_matrix()` | Biến danh sách ca bệnh thành bảng số (DataFrame) đúng thứ tự cột |

Điểm mấu chốt: **cả script đánh giá lẫn service dự đoán đều gọi chung file này**. Dữ liệu lúc train và lúc dự đoán đi qua cùng một hàm, nên không thể lệch cột.

Chạy riêng để xem thống kê dữ liệu:
```powershell
ai_service\.venv\Scripts\python.exe ai_service\scripts\load_cleaned_animal.py
```

---

## 7. Bước 5 — Train và đánh giá model

File: **`ai_service/scripts/train_cleaned_animal.py`** → sinh ra báo cáo `ai_service/reports/ca_metrics.md` và ảnh `ca_confusion_matrix.png`.

### 7.1. Script làm gì
1. Gọi `load_cleaned_animal.py` lấy bảng feature `X` và nhãn `y`.
2. Tạo 3 model để so sánh: **Dummy**, **Logistic Regression** (model tuyến tính đơn giản), **Random Forest** (300 cây, `random_state=42` để chạy lại ra đúng kết quả cũ).
3. Chạy **3-fold stratified CV** cho từng model.
4. **Species mask**: model có thể đoán ra bệnh của loài khác (ví dụ chó mà đoán ra bệnh của bò). Sau khi model đoán, chỉ giữ các bệnh thuộc đúng loài đã chọn rồi chia lại cho tổng = 100%.
5. Tính Accuracy, Precision, Recall, F1 (macro + weighted), per-class theo từng loài, confusion matrix.
6. Đo **rò rỉ dữ liệu**: dòng ở test trùng y hệt dòng ở train thì model "chép bài". Có 6 dòng trùng, 4 dòng rò rỉ — đo và công bố, không xóa.
7. Chạy thêm các **thí nghiệm so sánh** (mục 7.3).

### 7.2. Kết quả chính

| Model | Accuracy | F1 macro |
|---|---|---|
| Dummy (luôn đoán bệnh nhiều ca nhất) | 0.330 | 0.094 |
| Logistic Regression | 0.359 | 0.257 |
| **Random Forest** | **0.425 ± 0.052** | **0.305** |

**Cách đọc:**
- Accuracy 0.425 nghĩa là bệnh đứng đầu đúng khoảng 42,5% số ca — **thấp**.
- Nhưng F1 macro của RF **gấp 3 lần Dummy** → model **có học được** tín hiệu, chỉ là tín hiệu yếu.
- RF hơn Logistic Regression ở mọi chỉ số → giữ RF làm model chính.

### 7.3. Các thí nghiệm đã thử (đều không cải thiện)

| Thử | Kết quả | Vì sao |
|---|---|---|
| Chia 70/30 hoặc 80/20 thay vì CV | 0.402 / 0.431 | Chỉ đổi cách đo, model không học tốt hơn |
| **Tăng cường dữ liệu** (nhân bản dòng train, đảo ngẫu nhiên vài triệu chứng, thêm nhiễu ±5% vào số) | Giảm còn 0.390–0.419 | Bản sao từ dữ liệu cũ không có thông tin mới, chỉ thêm nhiễu |
| Bỏ cột giống | 0.390 | Giống có giúp một chút |
| Chỉ dùng loài + triệu chứng | 0.362 | Tuổi, nhiệt độ, nhịp tim có đóng góp |
| Chỉ giữ bệnh ≥ 5 dòng (32 bệnh) | **0.497** | Bằng chứng: nhiều dữ liệu hơn mỗi bệnh thì tốt hơn |

Lưu ý về tăng cường dữ liệu: **chỉ tăng cường tập train của từng lượt**, tập test giữ nguyên. Nếu tăng cường trước khi chia, bản sao của ca test lọt vào train → số đẹp giả.

**Nguyên tắc:** không tinh chỉnh tham số (số cây, độ sâu...) cho tới khi ra số đẹp. Số nào ra thì báo cáo số đó.

### 7.4. Vì sao accuracy thấp
- **83% số ca** có bộ triệu chứng **giống hệt** một ca của **bệnh khác cùng loài**. Ví dụ ở bò, lao và bệnh hô hấp phức hợp đều ho, sốt, li bì, chán ăn với tỉ lệ gần như nhau. Chỉ nhìn triệu chứng thì đến người cũng không phân biệt được (thực tế lao bò chẩn đoán bằng xét nghiệm).
- Mỗi ca chỉ có tối đa **4 triệu chứng chung chung** (chán ăn 80%, sốt 74%, li bì 65%).
- Mỗi bệnh chỉ **3–21 dòng**. Bệnh 3 dòng thì mỗi lượt CV chỉ có 2 ca để học.

→ Model phù hợp **gợi ý top-3 để tham khảo**, không đủ tin cậy để đưa ra một chẩn đoán duy nhất. Hướng cải thiện thật sự là **dữ liệu tốt hơn**, không phải chỉnh model.

Chi tiết đầy đủ: [`ca_results.md`](../../ai_service/reports/ca_results.md).

---

## 8. Bước 6 — Đưa model thành dịch vụ (FastAPI)

File: **`ai_service/app.py`**

**FastAPI** là thư viện Python để viết API web (giống `@RestController` bên Spring Boot). Service này chạy riêng ở cổng **8001**.

### 8.1. Lúc khởi động
1. Đọc dữ liệu bằng `load_cleaned_animal.py`.
2. Train Random Forest 300 cây trên **toàn bộ 351 dòng** (đánh giá đã làm bằng CV ở bước 5, nên lúc chạy thật dùng hết dữ liệu để model học được nhiều nhất).
3. Tính sẵn thống kê theo từng loài: triệu chứng nào, giống nào xuất hiện, trung vị tuổi/cân nặng/nhiệt độ...
4. In log: `Train xong: 351 dòng, 44 bệnh, 173 cột feature`.

Train chỉ mất vài giây, nên mỗi lần khởi động train lại luôn, không cần lưu file model.

### 8.2. Các API

| API | Việc |
|---|---|
| `GET /health` | Kiểm tra service còn sống, model đã sẵn sàng chưa |
| `GET /symptoms` | Trả danh sách loài, triệu chứng (chỉ những triệu chứng có trong dữ liệu của loài đó), giống, giá trị mặc định, thông tin bệnh |
| `POST /predict` | Nhận thông tin ca bệnh → trả top-3 bệnh |

### 8.3. `/predict` xử lý thế nào
1. Kiểm tra: loài có được hỗ trợ không, có chọn ít nhất 1 triệu chứng không (sai → lỗi 400).
2. **Ô người dùng bỏ trống**:
   - Ô số (tuổi, cân nặng...) → điền **trung vị** của loài đó.
   - Giống / giới tính → không đoán bừa một giá trị, mà **thử với mọi giống / giới tính** của loài, rồi lấy trung bình có trọng số theo độ phổ biến.
   - Trả về danh sách ô đã tự điền (`imputed_fields`) để giao diện báo cho người dùng biết.
3. Dựng feature bằng đúng hàm `records_to_matrix()` như lúc train.
4. Model trả xác suất cho cả 44 bệnh → **species mask** chỉ giữ bệnh của đúng loài → chuẩn hóa lại tổng = 100% → lấy 3 bệnh cao nhất.
5. Gắn tên tiếng Việt và mức độ khẩn cấp từ `symptoms.json`.

Ví dụ request / response:
```json
// POST /predict
{ "species": "DOG", "symptom_codes": ["fever", "vomiting", "lethargy"], "age": 1 }

// Response
{
  "species": "DOG",
  "top_disease": "parvo",
  "top_disease_vi": "Parvovirus (Parvo)",
  "confidence": 0.61,
  "severity": "URGENT",
  "top3": [
    { "disease_code": "parvo", "disease_vi": "Parvovirus (Parvo)", "probability": 0.61, "severity": "URGENT" },
    { "...": "..." }
  ],
  "imputed_fields": ["cân nặng", "nhiệt độ", "nhịp tim", "số ngày bệnh", "giống", "giới tính"],
  "supported": true,
  "message": ""
}
```
*(Con số trong ví dụ chỉ minh họa.)*

---

## 9. Bước 7 — Nối vào website

### 9.1. Vì sao phải đi qua Spring Boot?
Trình duyệt không gọi thẳng sang Python mà đi qua backend Java:
- Kiểm tra **đăng nhập** (JWT) một chỗ duy nhất — `/api/ai/predict` bắt buộc đăng nhập, `/api/ai/symptoms` thì công khai.
- `ai_service` không phải mở ra Internet, không cần cấu hình CORS.
- `ai_service` chết thì backend trả lỗi 503 gọn gàng, các chức năng khác của web vẫn chạy.

Cách làm này gọi là **Strangler Fig**: tách dần **một** chức năng ra khỏi hệ thống chính thành service riêng. Chỉ tách đúng một service, không gọi là "kiến trúc microservices".

### 9.2. Các file

| File | Việc |
|---|---|
| `backend_pet/.../controller/AiController.java` | Chuyển tiếp nguyên request sang `ai_service`, URL đọc từ `ai.service.url` (biến môi trường `AI_SERVICE_URL`). Timeout kết nối 5s; timeout đọc dài hơn vì server miễn phí có thể "ngủ", lần gọi đầu chậm |
| `fontend_pet/src/api/aiApi.ts` | Hàm gọi API từ React; lỗi 400 hiện nguyên văn, 422 báo nhập sai |
| `fontend_pet/src/pages/AiDiagnosis.tsx` | Trang chẩn đoán: chọn loài → thông tin thêm (không bắt buộc) → triệu chứng (lọc theo loài) → kết quả top-3 |

### 9.3. Những gì trang hiển thị để dùng an toàn
- Khung lưu ý **luôn hiện**: chỉ để tham khảo, không thay bác sĩ, ca nguy kịch đi khám ngay.
- Xác suất bệnh đứng đầu **< 50%** → cảnh báo "độ tin cậy thấp".
- Báo các ô đã được tự điền.
- Mỗi bệnh có lời khuyên dẫn về phòng khám (không gợi ý thuốc) + nút **"Đặt lịch khám"**.
- **Không lưu lịch sử** chẩn đoán; `ai_service` không có database.

---

## 10. Cách chạy trên máy

### 10.1. Cài Python lần đầu
```powershell
cd ai_service
python -m venv .venv                                  # tạo môi trường riêng cho project
.\.venv\Scripts\python.exe -m pip install -r requirements_api.txt
```
**venv** là một thư mục chứa Python và thư viện riêng của project, để không lẫn với các project khác. `requirements_api.txt` liệt kê thư viện cần cài: `fastapi`, `uvicorn` (chạy server), `scikit-learn` (Random Forest), `pandas` (bảng dữ liệu), `numpy` (tính toán số).

### 10.2. Chạy đủ 3 phần
```powershell
# 1. AI service (cổng 8001) — log phải có "Train xong: 351 dòng, 44 bệnh, 173 cột feature"
cd ai_service; .\start_api.ps1

# 2. Backend (cửa sổ khác) — cần đặt các biến môi trường như JWT_SECRET... trước
cd backend_pet; .\mvnw spring-boot:run

# 3. Frontend (cửa sổ khác)
cd fontend_pet; npm run dev
```
Mở `http://localhost:5173/ai-diagnosis` (phải đăng nhập).

Thử nhanh service Python mà không cần web: mở `http://localhost:8001/docs` — FastAPI tự sinh trang thử API.

### 10.3. Chạy lại đánh giá cho báo cáo
```powershell
ai_service\.venv\Scripts\python.exe ai_service\scripts\train_cleaned_animal.py
```
Đóng Excel trước khi chạy (Excel khóa file CSV). Đổi `symptoms.json` hoặc file mapping thì **phải chạy lại** script này để số liệu báo cáo còn khớp.

---

## 11. Bảng thuật ngữ

| Thuật ngữ | Nghĩa ngắn gọn |
|---|---|
| Dataset | Bộ dữ liệu, mỗi dòng một ca bệnh |
| Feature | Thông tin đầu vào của một ca (loài, triệu chứng, tuổi...) |
| Label / nhãn | Đáp án (tên bệnh) |
| One-hot | Đổi giá trị chữ thành nhiều cột 0/1 |
| Train | Cho model học từ dữ liệu có đáp án |
| Model | Kết quả sau khi train, dùng để dự đoán |
| Random Forest | Nhiều cây quyết định bỏ phiếu chung |
| Train set / Test set | Phần dữ liệu để học / phần giữ riêng để chấm điểm |
| Cross-validation (k-fold) | Chia k phần, chạy k lượt, mỗi phần làm test một lần |
| Stratified | Khi chia, giữ đúng tỉ lệ các bệnh ở mỗi phần |
| Accuracy / Precision / Recall / F1 | Các thước đo độ đúng (mục 2.7) |
| Macro / Weighted | Trung bình đều giữa các bệnh / trung bình theo số ca |
| Confusion matrix | Bảng bệnh thật × bệnh đoán, xem bệnh nào hay bị nhầm |
| Baseline / Dummy | Model đơn giản nhất làm mức sàn so sánh |
| Data leakage (rò rỉ) | Thông tin của tập test lọt vào lúc train → điểm cao giả |
| Data augmentation | Tạo thêm dữ liệu giả từ dữ liệu có sẵn |
| Overfitting | Model học thuộc lòng dữ liệu train, gặp ca mới thì đoán kém |
| Species mask | Chỉ giữ bệnh của đúng loài trong kết quả |
| Imputation | Tự điền giá trị khi người dùng bỏ trống |
| `random_state` | Hạt giống ngẫu nhiên — cố định để chạy lại ra đúng kết quả |
| FastAPI / uvicorn | Thư viện viết API bằng Python / chương trình chạy server đó |
| venv | Môi trường Python riêng của project |

---

## 12. Câu hỏi hay gặp khi bảo vệ

**Accuracy 42,5% có phải là model tệ?**
Thấp, và báo cáo nói thẳng điều đó. Nhưng so với mức sàn Dummy (F1 macro 0.094), RF đạt 0.305 — gấp 3 lần, chứng tỏ model có học. Giới hạn đến từ dữ liệu (83% ca có bộ triệu chứng trùng với bệnh khác), không phải từ cách làm. Vì vậy trang hiện **top-3** chứ không khẳng định một bệnh.

**Sao không chỉnh tham số cho accuracy cao hơn?**
Thử nhiều cấu hình rồi chọn cái đẹp nhất trên chính tập test là gian lận gián tiếp — con số sẽ cao hơn thực tế. Giao thức đánh giá được chốt trước, số nào ra báo cáo số đó.

**Sao dùng 3-fold CV mà không chia 80/20?**
Nhiều bệnh chỉ có 3 dòng; chia 80/20 thì bệnh đó có khi 0 hoặc 1 dòng test, kết quả nhảy lung tung (đổi seed là accuracy 70/30 dao động từ 0.349 đến 0.472). CV cho mọi dòng được test đúng một lần. Báo cáo vẫn có so sánh 70/30 và 80/20 để đối chiếu.

**Tăng cường dữ liệu sao không dùng?**
Đã thử, kết quả giảm nhẹ. Bản sao không mang thông tin mới. Theo thống nhất với giảng viên: tăng cường không cải thiện thì dùng model chưa tăng cường.

**Sao bỏ 9 cột Yes/No?**
Đo độ khớp giữa 9 cột này và 4 cột chữ trên toàn bộ dữ liệu (không nhìn tên bệnh): gần như ngẫu nhiên, mâu thuẫn nhau. Đây là lỗi dữ liệu nên bỏ.

**Sao không dùng LLM (Groq) để chẩn đoán luôn?**
LLM không có tập train/test, không tính được precision/recall/confusion matrix — không đáp ứng yêu cầu đánh giá của đề bài.

**Sao tách Python riêng mà không viết bằng Java?**
Random Forest, cross-validation, các chỉ số đánh giá đều có sẵn và chuẩn trong scikit-learn (Python). Script đánh giá và service dùng chung code đọc dữ liệu, tránh lệch cột.

**Người dùng bỏ trống tuổi, giống thì sao?**
Ô số điền trung vị của loài; giống/giới tính thì dự đoán với mọi giống/giới tính rồi lấy trung bình có trọng số. Trang báo rõ ô nào đã tự điền.

---

## Danh sách file liên quan

| File | Vai trò |
|---|---|
| `ai_service/data/cleaned_animal_disease_prediction.csv` | Dữ liệu train |
| `ai_service/data/mapping_cleaned_animal.csv` | Gộp tên bệnh, đổi triệu chứng sang mã |
| `shared/symptoms.json` | Loài, triệu chứng, bệnh (tên Việt, mức độ, mô tả, khuyến nghị) |
| `ai_service/scripts/load_cleaned_animal.py` | Đọc dữ liệu + dựng feature (dùng chung) |
| `ai_service/scripts/train_cleaned_animal.py` | Đánh giá model → báo cáo |
| `ai_service/reports/ca_metrics.md`, `ca_results.md`, `ca_confusion_matrix.png` | Số liệu tự sinh, nhận xét viết tay, ảnh ma trận nhầm lẫn |
| `ai_service/app.py` | Service FastAPI |
| `ai_service/start_api.ps1`, `requirements_api.txt` | Chạy service, danh sách thư viện |
| `backend_pet/.../controller/AiController.java` | Cầu nối Spring Boot → Python |
| `fontend_pet/src/api/aiApi.ts`, `src/pages/AiDiagnosis.tsx` | Giao diện React |
