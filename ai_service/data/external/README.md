# Dữ liệu ngoài

Dữ liệu thật, không do project này sinh ra.

> ⚠️ **Từ 2026-10-18 (QĐ-16): `dogfinal3.csv` không còn dùng để train.** Giảng viên đánh giá nguồn này không chính thống. Dữ liệu train hiện tại là `../cleaned_animal_disease_prediction.csv` — xem mục cuối file. `dogfinal3` chỉ còn cho chương khảo sát của báo cáo và để chạy lại số liệu R1 cũ.

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

## Dữ liệu train hiện tại — `../cleaned_animal_disease_prediction.csv` (QĐ-16)

| | |
|---|---|
| **Nguồn** | Kaggle, dataset `animal-disease-prediction` — tài liệu tham khảo [12] của đề bài |
| **Kích thước** | 61,768 byte · 431 dòng dữ liệu + 1 dòng tiêu đề · 8 loài, 139 nhãn gốc |
| **SHA256** | `769D56C41C6B8616BFBE696FB20CCA0052EA469B70F92E58C18845D22372166E` |
| **Dùng như thế nào** | Qua [`../mapping_cleaned_animal.csv`](../mapping_cleaned_animal.csv) → 44 bệnh / 351 dòng. Đọc bằng `ai_service/scripts/load_cleaned_animal.py` |
| **Trong repo?** | Có — nằm thẳng trong `ai_service/data/` vì `app.py` train từ file này lúc khởi động. *Điều khoản phân phối lại của Kaggle không ghi rõ — kiểm tra lại trước khi để repo public* |

`../veterinary_clinical_data.csv` (tài liệu [13]) cũng nằm trong `data/` nhưng **không dùng** — dữ liệu sinh ngẫu nhiên, lý do ở QĐ-16.

---

## Không có ở đây

`symtomdata.csv` (23.999 dòng, 12 bệnh chó) — **đã loại**, xem QĐ-11. Lý do tóm tắt: đúng 2.000 mẫu mỗi bệnh, 29,2% dòng trùng lặp hoàn toàn, và tần suất mọi triệu chứng trong một bệnh đều xấp xỉ 0,44 → không mang thông tin xác suất lâm sàng nào.

Nguồn nếu cần kiểm chứng lại: https://github.com/1zuu/Doggy-Disease-Detection/blob/master/data/symtomdata.csv
