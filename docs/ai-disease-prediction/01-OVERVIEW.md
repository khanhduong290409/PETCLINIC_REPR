# 01 — Tổng quan chức năng

## Đề bài (nguyên văn từ giảng viên)

> **Mục đích:** Hỗ trợ bác sĩ thú y sàng lọc sơ bộ các bệnh có khả năng mắc phải dựa trên đặc điểm và triệu chứng của thú cưng, giúp rút ngắn thời gian chẩn đoán ban đầu và làm tài liệu tham khảo trong quá trình khám — không thay thế chẩn đoán chuyên môn của bác sĩ.
>
> **Actor:**
> - Chính: Bác sĩ thú y (DOCTOR) — thực hiện trong lúc khám, gắn kết quả vào hồ sơ bệnh án.
> - Phụ (tùy chọn): Khách hàng (USER) — có thể nhập triệu chứng khi đặt lịch để hệ thống gợi ý mức độ ưu tiên khám, nhưng kết quả cuối cùng vẫn cần bác sĩ xác nhận.
>
> **Nghiên cứu ứng dụng trí tuệ nhân tạo trong hỗ trợ chẩn đoán bệnh thú y:**
> - Thu thập và tiền xử lý dữ liệu triệu chứng, giống, độ tuổi, giới tính và tiền sử bệnh của thú cưng.
> - Nghiên cứu mô hình học máy hoặc mô hình ngôn ngữ lớn (LLM) để dự đoán các bệnh có khả năng xảy ra dựa trên thông tin đầu vào.
> - Đánh giá độ chính xác của mô hình bằng các chỉ số Accuracy, Precision, Recall và F1-score.
>
> **Yêu cầu phi chức năng:**
> - Model được train và test trên tập dữ liệu tách biệt (train/test split, ví dụ 80/20).
> - Đánh giá bằng Accuracy, Precision, Recall, F1-score trên tập test.
> - Ghi rõ thuật toán sử dụng (đề xuất: Random Forest hoặc XGBoost — phù hợp dữ liệu dạng bảng, ít dữ liệu, dễ giải thích, thời gian train nhanh).
> - Có confusion matrix để minh họa trong báo cáo.

## Tài liệu tham khảo được chỉ định

| Mã | Nguồn | Vai trò trong đề tài |
|---|---|---|
| [10] | *Ettinger's Textbook of Veterinary Internal Medicine* (Ettinger, Feldman, Côté, 2024) | Nguồn y khoa cho ma trận P(triệu chứng \| bệnh) — chó/mèo |
| [11] | *Small Animal Internal Medicine* (Nelson & Couto, 2019) | Đối chiếu chéo với [10], bổ sung tỷ lệ mắc theo tuổi/giống |
| [12] | Dataset `animal-disease-prediction` | Baseline, trộn phần dùng được |
| [13] | Dataset `veterinary-clinical-dataset` | Baseline, trộn phần dùng được |

⚠️ **Cảnh báo thực tế về [12] và [13]:** các dataset thú y trên Kaggle thường nhỏ, nhiễu, và phần lớn là **gia súc** (bò, trâu, dê, cừu) chứ không phải chó/mèo. Phải khảo sát trước rồi mới quyết định trộn bao nhiêu — xem [03-DATA.md](03-DATA.md).

## Mục tiêu cụ thể của hệ thống

**Đầu vào**

| Nhóm | Trường | Nguồn |
|---|---|---|
| Đặc điểm | species, breed, ageMonths, gender, weightKg | Lấy tự động từ entity `Pet` |
| Triệu chứng | mảng symptom code (nhị phân) | Bác sĩ / khách tick chọn trên UI |
| Diễn biến | durationDays | Nhập tay |
| Tiền sử | chẩn đoán các lần khám trước | Lấy từ `MedicalRecord` của cùng pet |

**Đầu ra**

- Top-3 bệnh nghi ngờ, mỗi bệnh kèm % tin cậy
- Mức độ khẩn cấp (dùng cho actor phụ)
- Đoạn diễn giải tiếng Việt do Groq LLM sinh (vì sao nghĩ tới bệnh này, nên làm xét nghiệm gì để xác nhận)
- Nếu độ tin cậy top-1 < 40% → trả về "không đủ dữ kiện, cần khám lâm sàng" thay vì đoán bừa

## Phạm vi

**Trong phạm vi**

- 6 loài theo enum `Pet.Species`: DOG, CAT, BIRD, RABBIT, HAMSTER, OTHER
  - Người dùng đã chọn phủ cả 6 loài thay vì chỉ chó/mèo. Kéo theo vấn đề mất cân bằng lớp nghiêm trọng ở nhóm thỏ/hamster/chim — biện pháp xử lý xem [04-MODEL.md](04-MODEL.md).
  - `OTHER` không có bệnh riêng; hệ thống trả về thông báo chưa hỗ trợ.
- ~30 bệnh phổ biến (xem [03-DATA.md](03-DATA.md))
- Vòng phản hồi: bác sĩ xác nhận AI đúng/sai → tích lũy dữ liệu thật để đánh giá và retrain

**Ngoài phạm vi**

- Chẩn đoán qua hình ảnh (X-quang, siêu âm) — ảnh trong `MedicalRecord.imageUrls` không đưa vào model
- Kê đơn thuốc tự động
- Dự đoán cho gia súc / vật nuôi kinh tế

## Ràng buộc y đức và pháp lý

Đây là phần bắt buộc phải thể hiện trong cả sản phẩm lẫn báo cáo:

1. **Luôn hiển thị disclaimer** trên mọi giao diện có kết quả AI: *"Kết quả mang tính tham khảo, không thay thế chẩn đoán của bác sĩ thú y."*
2. **Không tự động điền** vào ô `diagnosis` — bác sĩ phải chủ động bấm nút chấp nhận.
3. **Khách hàng (USER) không được thấy tên bệnh cụ thể** — chỉ thấy mức độ ưu tiên khám (Thường / Nên khám sớm / Khẩn cấp). Tránh việc khách tự chẩn đoán, hoảng loạn, hoặc tự mua thuốc.
4. **Ghi log mọi lần dự đoán** kèm người thực hiện và thời điểm, phục vụ truy vết.
5. **Nêu rõ giới hạn dữ liệu trong báo cáo**: phần lớn dữ liệu train là sinh tổng hợp từ ma trận xác suất trích từ y văn, không phải hồ sơ bệnh án thật.

## Tiêu chí "xong"

- [ ] Notebook train có đầy đủ: train/test split 80/20 stratified, so sánh ≥3 thuật toán, confusion matrix, bảng Accuracy/Precision/Recall/F1 (macro + per-class)
- [ ] FastAPI service chạy được, deploy public, có `/health`
- [ ] Bác sĩ dùng được trong trang ghi bệnh án end-to-end
- [ ] Khách hàng thấy mức ưu tiên khi đặt lịch
- [ ] Bảng `disease_predictions` ghi nhận được phản hồi đúng/sai của bác sĩ
- [ ] Trang thống kê Admin hiển thị độ chính xác trên dữ liệu thực tế
