# 04 — Kế hoạch mô hình & đánh giá

> Sản phẩm chính của giai đoạn này là notebook `ai_service/notebooks/03_train_evaluate.ipynb` — đây là thứ giảng viên đọc kỹ nhất.

## Bài toán

**Multi-class classification** — 34 lớp (bệnh), ~67 feature, ~7.400 mẫu.

Không phải multi-label: một ca chỉ gán một bệnh chính. Bệnh đồng mắc được xử lý gián tiếp qua `label noise` khi sinh dữ liệu và qua việc trả về top-3 thay vì top-1.

Đầu ra dùng `predict_proba` để lấy top-3 kèm % — đúng tinh thần "sàng lọc sơ bộ" của đề bài, chứ không phải phán một đáp án duy nhất.

## Thuật toán so sánh

Đề bài đề xuất Random Forest hoặc XGBoost. Nên chạy cả 3 để có bảng so sánh — làm báo cáo dày dặn hơn nhiều mà chi phí gần như bằng 0:

| Thuật toán | Vai trò | Lý do |
|---|---|---|
| **Logistic Regression** | Baseline | Mốc so sánh. Nếu RF không hơn baseline đáng kể thì dữ liệu có vấn đề |
| **Random Forest** | Ứng viên chính | Đề bài đề xuất, dễ giải thích qua `feature_importances_`, train nhanh |
| **XGBoost** | Ứng viên chính | Thường nhỉnh hơn RF trên dữ liệu bảng, xử lý mất cân bằng tốt |

Chọn model đưa lên production dựa trên **macro F1**, không phải accuracy — vì dữ liệu mất cân bằng cố ý.

## Thiết lập huấn luyện

```
train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
```

- `stratify=y` **bắt buộc** — không có nó thì các lớp hamster/chim (70–90 mẫu) có thể lệch nặng giữa train và test
- `random_state=42` cố định để kết quả tái lập được, ghi rõ trong báo cáo
- Thêm **5-fold Stratified Cross-Validation** trên tập train để báo cáo mean ± std, chứng minh kết quả không phải may mắn
- `class_weight='balanced'` (RF) / `scale_pos_weight` hoặc sample weight (XGBoost)

Tuning siêu tham số: `GridSearchCV` gọn, đừng sa đà.

| Model | Tham số dò |
|---|---|
| RF | `n_estimators` [100, 300], `max_depth` [None, 15, 25], `min_samples_leaf` [1, 3] |
| XGBoost | `n_estimators` [200, 400], `max_depth` [4, 6, 8], `learning_rate` [0.05, 0.1] |

## Ba cơ chế xử lý mất cân bằng 6 loài

Người dùng chọn phủ cả 6 loài, kéo theo nhóm thỏ/hamster/chim chỉ có 70–90 mẫu/bệnh so với 350–400 của chó/mèo. Ba biện pháp dùng đồng thời:

### 1. Species mask khi suy luận

Model cho ra xác suất trên toàn bộ 34 bệnh. Ở bước hậu xử lý, **zero-out** những bệnh không thể xảy ra với loài đó rồi chuẩn hóa lại:

```
probs = model.predict_proba(x)[0]
mask  = np.array([species in DISEASE_SPECIES[d] for d in classes])
probs = probs * mask
probs = probs / probs.sum()
```

Áp dụng cùng nguyên tắc cho ràng buộc giới tính (`pyometra` chỉ FEMALE).

**Đây là nguồn cho một bảng ablation rất đẹp trong báo cáo:**

| Cấu hình | Accuracy | Macro F1 |
|---|---|---|
| RF thuần | *(điền sau)* | |
| RF + species mask | | |
| RF + species mask + gender mask | | |

### 2. Báo cáo metrics tách theo nhóm loài

Một con số tổng duy nhất che giấu vấn đề. Bảng bắt buộc có trong báo cáo:

| Nhóm | Số bệnh | Mẫu test | Accuracy | Precision (macro) | Recall (macro) | F1 (macro) |
|---|---|---|---|---|---|---|
| Chó | 10 | ~600 | | | | |
| Mèo | 9 | ~495 | | | | |
| Chó+mèo chung | 4 | ~200 | | | | |
| Thỏ / Hamster / Chim | 11 | ~178 | | | | |
| **Toàn bộ** | **34** | **~1.472** | | | | |

Dự kiến nhóm exotic sẽ thấp hơn rõ rệt. **Đừng giấu** — hãy phân tích nguyên nhân (ít mẫu, ít tài liệu y khoa) và đề xuất hướng khắc phục. Đó chính là phần "đánh giá và bàn luận" mà giảng viên muốn thấy.

### 3. Cơ chế từ chối trả lời (abstention)

Nếu xác suất top-1 sau khi mask < **0.40**, không đoán mà trả về *"Không đủ dữ kiện để sàng lọc — cần khám lâm sàng và xét nghiệm"*.

Ba lợi ích:
- **Y đức**: đúng tinh thần "không thay thế bác sĩ" của đề bài
- **Metrics**: loại bỏ các ca mơ hồ nhất, kéo độ chính xác trên phần trả lời lên
- **Báo cáo**: cho một biểu đồ **coverage–accuracy trade-off** — trục x là ngưỡng, trục y là % ca trả lời và accuracy trên số ca đó. Đây là thứ hiếm gặp ở đồ án sinh viên

Cách trình bày ngưỡng trong báo cáo:

| Ngưỡng | Coverage (% ca trả lời) | Accuracy trên phần trả lời |
|---|---|---|
| 0.0 (không từ chối) | 100% | |
| 0.30 | | |
| **0.40 (chọn)** | | |
| 0.50 | | |

Ngưỡng 0.40 là giá trị khởi điểm — chốt lại sau khi có biểu đồ thực tế.

## Bộ chỉ số phải báo cáo

Đề bài yêu cầu Accuracy, Precision, Recall, F1. Cụ thể hóa:

| Chỉ số | Cách tính | Vì sao |
|---|---|---|
| Accuracy | `accuracy_score` | Đề bài yêu cầu |
| Precision / Recall / F1 — **macro** | `average='macro'` | **Chỉ số quan trọng nhất** — coi mọi bệnh ngang nhau, không để lớp đông lấn át |
| Precision / Recall / F1 — **weighted** | `average='weighted'` | Phản ánh trải nghiệm thực tế theo tần suất mắc |
| Per-class | `classification_report` | Chỉ ra bệnh nào model yếu |
| **Top-3 accuracy** | tự tính | Sát với cách dùng thật (UI hiện 3 bệnh) — thường cao hơn top-1 khá nhiều, con số đẹp và trung thực |
| Confusion matrix | `ConfusionMatrixDisplay` | Đề bài yêu cầu |

**Lưu ý về confusion matrix 34×34:** vẽ thẳng ra sẽ không đọc được khi in vào báo cáo. Ba cách xử lý, nên làm cả ba:
1. Ma trận **chuẩn hóa theo dòng** (`normalize='true'`), heatmap seaborn, cỡ hình lớn — dùng cho phụ lục
2. Ma trận **gộp theo loài** (6×6) — dùng cho phần thân báo cáo
3. Bảng **top-10 cặp nhầm lẫn nhiều nhất** — dạng chữ, dễ phân tích nhất. Kỳ vọng sẽ thấy Parvo ↔ Viêm dạ dày ruột, CKD ↔ Tiểu đường ↔ Cường giáp. Nếu **không** thấy các cặp này thì dữ liệu bị giả quá mức, phải quay lại tăng nhiễu

## Giải thích mô hình (explainability)

Đề bài nhấn mạnh "làm tài liệu tham khảo cho bác sĩ" — bác sĩ cần biết *vì sao*, không chỉ *cái gì*.

- **Toàn cục**: `feature_importances_` → biểu đồ top-20 triệu chứng quan trọng nhất. Kiểm tra tính hợp lý y khoa — nếu `weightKg` quan trọng hơn `bloody_diarrhea` thì có gì đó sai
- **Từng ca**: đơn giản nhất là liệt kê các triệu chứng bệnh nhân có mà trùng với vector xác suất cao của bệnh được dự đoán. Không cần SHAP (thêm thư viện nặng, trái nguyên tắc "ít lib" của project) — nếu muốn làm đẹp báo cáo thì dùng SHAP **chỉ trong notebook**, không đưa vào service

## Sản phẩm đầu ra của giai đoạn

| File | Nội dung |
|---|---|
| `ai_service/models/model.joblib` | Model + label encoder + danh sách cột, đóng gói một lần |
| `ai_service/reports/confusion_matrix.png` | Bản chuẩn hóa 34×34 |
| `ai_service/reports/confusion_matrix_species.png` | Bản gộp 6×6 |
| `ai_service/reports/feature_importance.png` | Top-20 |
| `ai_service/reports/coverage_accuracy.png` | Biểu đồ trade-off ngưỡng |
| `ai_service/reports/metrics.md` | Toàn bộ bảng số, copy thẳng vào báo cáo |

`model.joblib` nên đóng gói dạng dict để tránh lệch phiên bản:
```python
{ "model": clf, "label_encoder": le, "feature_columns": [...],
  "symptoms_version": 1, "model_version": "rf-v1",
  "trained_at": "...", "test_metrics": {...} }
```

FastAPI đọc `symptoms_version` từ đây và đối chiếu với `shared/symptoms.json` khi khởi động — lệch thì từ chối chạy. Đây là hàng rào chặn lỗi âm thầm đã cảnh báo ở [02-ARCHITECTURE.md](02-ARCHITECTURE.md).

## Những cái bẫy cần tránh

| Bẫy | Hậu quả | Phòng tránh |
|---|---|---|
| Accuracy > 92% | Dữ liệu sinh quá sạch, lộ khi bị hỏi | Tăng nhiễu, mục tiêu 78–88% |
| Không `stratify` | Lớp hiếm biến mất khỏi test set | Luôn `stratify=y` |
| Chỉ báo cáo accuracy | Che giấu việc lớp hiếm bị bỏ rơi | Luôn kèm macro F1 |
| Tune siêu tham số trên test set | Rò rỉ dữ liệu, kết quả vô nghĩa | Tune bằng CV trên train, test chỉ chạm **một lần cuối cùng** |
| Quên lưu `feature_columns` | Thứ tự cột lệch khi suy luận, sai âm thầm | Đóng gói trong `model.joblib` và kiểm tra khi load |
| Trộn Kaggle mà không chuẩn hóa nhãn | Nhãn trùng lặp/mâu thuẫn | Khảo sát kỹ ở `01_explore_kaggle.ipynb` trước |
