# Dữ liệu ngoài

Dữ liệu thật, không do project này sinh ra. Dùng cho thí nghiệm 3 chế độ R1/R2/R3 — xem [QĐ-12](../../../docs/ai-disease-prediction/DECISIONS.md).

---

## `dogfinal3.csv`

| | |
|---|---|
| **Nguồn** | https://github.com/anonymooshe/Predicting-Dog-Common-Diseases-Using-Supervised-Machine-Learning-Classification |
| **Giấy phép** | The Unlicense — miền công cộng, dùng và phân phối lại tự do |
| **Ngày tải** | 2026-09-12 |
| **Kích thước** | 19.914 byte · 165 dòng dữ liệu + 1 dòng tiêu đề |
| **SHA256** | `9C0E9E81E07086DFCF8A2FF0BE2E799AABC175B698C9B72ECBECF6629613F9EF` |

**Dữ liệu là gì:** hồ sơ từ một phòng khám thú y ở Cagayan de Oro, Philippines. Đây là **dữ liệu lâm sàng thật**, không phải sinh tổng hợp — đó là lý do nó là nguồn giá trị nhất của đồ án.

**Cấu trúc:** cột `diseases` là nhãn, 52 cột còn lại là cờ triệu chứng 0/1. **Không có** cột giống, tuổi, giới tính, cân nặng.

**Phân bố nhãn:**

| Nhãn gốc | Số dòng | Mã trong project |
|---|---|---|
| `caninedistemper` | 25 | `distemper` |
| `rabies` | 25 | `rabies` |
| `heartworm` | 24 | *(bỏ — QĐ-10)* |
| `canineparvovirus` | 24 | `parvo` |
| `leptospirosis` | 24 | `leptospirosis` |
| `kennelcough` | 22 | `kennel_cough` |
| `kidneydisease` | 21 | `ckd_dog` |
| | **165** | **141 dòng dùng được / 6 bệnh** |

**Cách dùng:** phải đi qua [`../mapping_dogfinal3.csv`](../mapping_dogfinal3.csv) để đổi tên cột và nhãn sang mã của `shared/symptoms.json`. Chạy `python ai_service/scripts/check_mapping.py` để kiểm tra bảng ánh xạ còn khớp không.

⚠️ **Ghi nhận minh bạch:** ngày 2026-09-07 đã mở xem tần suất triệu chứng của riêng `canineparvovirus` (1/7 bệnh) để minh họa phương pháp đối chiếu. Nêu điều này khi báo cáo kết quả R2. Sáu bệnh còn lại chưa bị xem.

---

## Vì sao file này được commit còn dataset Kaggle thì không

`ai_service/.gitignore` chặn `data/kaggle_raw/*`, nhưng **không** chặn thư mục này. Cố ý:

| | `dogfinal3.csv` | `kaggle_raw/cleaned_animal_disease_prediction.csv` |
|---|---|---|
| Giấy phép | Unlicense — miền công cộng, **phân phối lại được** | Kaggle, điều khoản không rõ ràng |
| Vai trò | **Tập train của R1** + tập test của cả 3 chế độ | Tập kiểm định thứ hai |
| Trong repo? | ✅ Commit | ❌ Gitignore, tải lại thủ công |

Lý do chính: `dogfinal3` **nằm trong đường đi của con số báo cáo**. Kết quả R1/R2/R3 không lặp lại được nếu file này không đi cùng code. Dataset Kaggle chỉ dùng kiểm định phụ nên tải lại được, và giấy phép không cho phân phối lại chắc chắn.

Muốn lấy lại `cleaned_animal_disease_prediction.csv`: tải dataset `animal-disease-prediction` (tài liệu tham khảo [12] của đề bài) từ Kaggle, đặt vào `ai_service/data/kaggle_raw/`.

---

## Không có ở đây

`symtomdata.csv` (23.999 dòng, 12 bệnh chó) — **đã loại**, xem QĐ-11. Lý do tóm tắt: đúng 2.000 mẫu mỗi bệnh, 29,2% dòng trùng lặp hoàn toàn, và tần suất mọi triệu chứng trong một bệnh đều xấp xỉ 0,44 → không mang thông tin xác suất lâm sàng nào.

Nguồn nếu cần kiểm chứng lại: https://github.com/1zuu/Doggy-Disease-Detection/blob/master/data/symtomdata.csv
