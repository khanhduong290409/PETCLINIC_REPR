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

**Thực tế:** đã khảo sát [12] và [13] — cả hai không train được ([12] chỉ 431 dòng / 135 nhãn, [13] không có cột nhãn). Chi tiết ở `ai_service/reports/kaggle_survey.md`. [10] [11] không dùng vì đã bỏ nhánh sinh dữ liệu từ y văn (QĐ-14). Dữ liệu train thực tế là `dogfinal3.csv`.

## Mục tiêu cụ thể của hệ thống

**Đầu vào**

| Nhóm | Trường | Nguồn |
|---|---|---|
| Triệu chứng | mảng symptom code (nhị phân; giao diện hiện 31 mã có trong dữ liệu train) | Người dùng tick chọn ở trang `/ai-diagnosis` |

Giống, tuổi, giới tính, cân nặng, tiền sử **không** đưa vào model — `dogfinal3` không có các cột này (QĐ-14). Phải nêu rõ là giới hạn trong báo cáo.

**Đầu ra**

- Top-3 bệnh nghi ngờ, mỗi bệnh kèm % xác suất
- Mức độ khẩn cấp URGENT / SOON, mô tả và khuyến nghị cho bệnh khả năng cao nhất
- Cảnh báo khi xác suất top-1 < 50%

## Phạm vi

**Trong phạm vi**

- Chỉ loài **chó**
- **6 bệnh** của `dogfinal3`: `parvo` · `distemper` · `kennel_cough` · `leptospirosis` · `ckd_dog` · `rabies`
- Dữ liệu train/test: **chỉ dữ liệu thật** — 141 ca của `dogfinal3.csv`

**Ngoài phạm vi**

- Loài khác, bệnh khác ngoài 6 bệnh trên
- Dữ liệu sinh từ y văn
- Chẩn đoán qua hình ảnh (X-quang, siêu âm)
- Kê đơn thuốc tự động

## Ràng buộc y đức và pháp lý

Đây là phần bắt buộc phải thể hiện trong cả sản phẩm lẫn báo cáo:

1. **Luôn hiển thị disclaimer** trên mọi giao diện có kết quả AI: *"Kết quả mang tính tham khảo, không thay thế chẩn đoán của bác sĩ thú y."*
2. **Nói rõ giới hạn ngay trên giao diện**: chỉ áp dụng cho chó, chỉ nhận diện được 6 bệnh — bệnh khác sẽ không được phát hiện.
3. **Khuyến nghị luôn dẫn về phòng khám**, không gợi ý thuốc. Có nút đặt lịch khám ngay dưới kết quả (QĐ-15).
4. **Nêu rõ giới hạn dữ liệu trong báo cáo**: chỉ 141 ca thật, chỉ có triệu chứng, chỉ 6 bệnh.

## Tiêu chí "xong"

Theo dõi ở [PROGRESS.md](PROGRESS.md). Tóm tắt:

- [x] Script đánh giá: split 80/20 stratified, so sánh 3 model, confusion matrix, Accuracy/Precision/Recall/F1 (macro + per-class)
- [ ] FastAPI service deploy public, có `/health`
- [x] Trang `/ai-diagnosis` dùng được end-to-end ở local *(xác nhận 2026-10-05)*
