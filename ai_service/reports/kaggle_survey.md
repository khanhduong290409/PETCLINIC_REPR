# Khảo sát 2 dataset Kaggle được chỉ định

**Ngày khảo sát:** 2026-08-12
**Mục đích:** đánh giá xem [12] `animal-disease-prediction` và [13] `veterinary-clinical-dataset` có dùng để huấn luyện mô hình được không.

## Kết luận

**Cả hai dataset đều KHÔNG dùng để huấn luyện được.** Chi tiết lý do bên dưới. Đây là căn cứ cho quyết định sinh dữ liệu tổng hợp từ y văn (QĐ-02).

Tuy nhiên [12] vẫn được giữ lại làm **tập đối chứng ngoại lai** quy mô nhỏ.

---

## Tổng quan

| | [12] `cleaned_animal_disease_prediction.csv` | [13] `veterinary_clinical_data.csv` |
|---|---|---|
| Kích thước file | 60 KB | 955 KB |
| Số dòng | 431 | 10.000 |
| Số cột | 22 | 10 |
| Có cột nhãn (bệnh) | ✅ `Disease_Prediction` | ❌ **không có** |
| Loài chó/mèo/thỏ | 181 dòng (42%) | 10.000 dòng (100%) |
| Loài gia súc | 250 dòng (58%) | 0 |
| **Dùng huấn luyện được** | ❌ | ❌ |

---

## [12] `animal-disease-prediction`

### Cấu trúc

```
Animal_Type, Breed, Age, Gender, Weight,
Symptom_1..Symptom_4,          (văn bản tự do)
Duration,
Appetite_Loss, Vomiting, Diarrhea, Coughing, Labored_Breathing,
Lameness, Skin_Lesions, Nasal_Discharge, Eye_Discharge,   (nhị phân Yes/No)
Body_Temperature, Heart_Rate,
Disease_Prediction              (nhãn)
```

Ví dụ một dòng:
> `Dog, Labrador, 4, Male, 25.0, Fever, Lethargy, Appetite Loss, Vomiting, 3 days, Yes, Yes, No, ..., 39.5°C, 120, Parvovirus`

### Phân bố loài

| Loài | Số dòng |
|---|---|
| Dog | 75 |
| Cat | 72 |
| Cow | 68 |
| Horse | 66 |
| Goat | 39 |
| Sheep | 39 |
| Pig | 38 |
| Rabbit | 34 |

Gia súc (bò, ngựa, dê, cừu, lợn) chiếm **58%** — nằm ngoài phạm vi đề tài (chó, mèo, thỏ, hamster, chim).

### Vấn đề chí mạng: quá ít dòng trên mỗi nhãn

**431 dòng chia cho khoảng 135 nhãn bệnh khác nhau ≈ 3 dòng mỗi bệnh.**

Nhãn có nhiều dòng nhất cũng chỉ đạt 15 (`Bovine Tuberculosis`), và phần lớn nhãn chỉ có **1–2 dòng**. Không thể chia train/test, không thể học được quy luật nào.

### Vấn đề thứ hai: nhãn không được chuẩn hóa

Cùng một bệnh xuất hiện dưới nhiều tên khác nhau:

| Bệnh | Các biến thể trong dataset |
|---|---|
| Parvovirus | `Parvovirus` (9), `Canine Parvovirus` (12) |
| Care | `Distemper` (2), `Canine Distemper` (10) |
| Ho cũi chó | `Kennel Cough` (9), `Canine Cough` (1), `Bordetella Infection` (1) |
| Giảm bạch cầu mèo | `Feline Panleukopenia` (3), `Panleukopenia` (3), `Feline Panleukopenia Virus` (1) |
| Lưỡi xanh | `Bluetongue` (5), `Blue Tongue` (1), `Bluetongue Virus` (2), `Blue Tongue Virus` (2), `Blue Tongue Disease` (1) |
| Lở mồm long móng | `Foot-and-Mouth Disease` (6), `Foot and Mouth Disease` (4) |

Sau khi lọc riêng chó/mèo và gộp các nhãn trùng nghĩa, còn khoảng **147 dòng**.

### Giá trị vớt lại được

Dù không huấn luyện được, dataset này vẫn hữu ích ở ba điểm:

1. **Xác nhận thiết kế feature là đúng.** Bộ cột của nó (`Animal_Type, Breed, Age, Gender, Weight, triệu chứng, Duration`) trùng khớp gần như 1:1 với thiết kế đầu vào của hệ thống. Đây là bằng chứng khách quan cho chương thiết kế dữ liệu của báo cáo.
2. **Tập đối chứng ngoại lai.** ~147 dòng chó/mèo sau chuẩn hóa nhãn dùng để kiểm tra mô hình trên dữ liệu **không do mình sinh ra**. Số lượng quá ít để kết luận thống kê, nhưng vẫn là một phép thử tỉnh táo có giá trị.
3. **Từ vựng triệu chứng và giống** để đối chiếu với `symptoms.json`.

**Hai cột không dùng:** `Body_Temperature` và `Heart_Rate` — hệ thống PawCare không thu thập hai chỉ số này, và bác sĩ nhập tay khi khám thì tăng ma sát sử dụng.

---

## [13] `veterinary-clinical-dataset`

### Cấu trúc

```
AnimalName, Breed, Age, Weight_kg, MedicalHistory,
Symptom_1..Symptom_5
```

Chỉ có 10 cột.

### Vấn đề chí mạng: không có cột nhãn

**Không có cột nào chứa tên bệnh.** Đây là dữ liệu không nhãn, nên **không thể dùng cho học có giám sát** — không có gì để mô hình học cách dự đoán.

### Dấu hiệu dữ liệu được sinh ngẫu nhiên

Phân bố cột `MedicalHistory` gần như đều tuyệt đối trên 11 giá trị:

| Giá trị | Số dòng |
|---|---|
| Skin conditions history | 1.017 |
| No previous conditions | 995 |
| Recent surgery | 953 |
| Chronic illness | 940 |
| Not vaccinated | 922 |
| Allergies | 897 |
| Dental issues | 889 |
| Parasite history | 888 |
| Previous kidney disease | 870 |
| Vaccinated | 832 |
| Previous heart condition | 797 |

Dữ liệu lâm sàng thật không bao giờ phân bố đều như vậy. Ngoài ra các dòng vô lý về mặt y khoa, ví dụ một con chó cùng lúc có `Hydrophobia` (dấu hiệu dại), `drooping ears`, `Diarrhea` và `Shyness or aggression`.

Loài chỉ có `Dog` (5.020) và `cat` (4.980) — lưu ý chữ `cat` viết thường, thêm một dấu hiệu thiếu chuẩn hóa.

### Giá trị vớt lại được

Một điểm duy nhất, nhưng có ích: **bộ phân loại tiền sử bệnh**. Đề bài yêu cầu dùng tiền sử bệnh làm đầu vào, mà thiết kế ban đầu của `symptoms.json` chưa có. Danh mục của dataset này gợi ý một khung phân loại hợp lý, đã được bổ sung và mở rộng thành nhóm `medicalHistory` (14 mục) trong `symptoms.json` phiên bản 2 — có thêm `neutered` (loại trừ viêm tử cung tích mủ) và `urinary_history` (liên quan FLUTD) mà dataset gốc không có.

---

## Ảnh hưởng tới kế hoạch

| Nội dung | Quyết định |
|---|---|
| Dùng [12] hoặc [13] để huấn luyện | ❌ Không |
| Trộn vào tập huấn luyện | ❌ Không — quá ít dòng, nhãn bẩn, [13] không có nhãn |
| Giữ [12] làm tập đối chứng | ✅ Có — ~147 dòng chó/mèo sau chuẩn hóa nhãn |
| Sinh dữ liệu tổng hợp từ y văn | ✅ Giữ nguyên QĐ-02 |
| Bổ sung nhóm `medicalHistory` | ✅ Đã làm — `symptoms.json` version 2 |

Trong báo cáo, phần khảo sát này nên được trình bày như một mục riêng của chương thu thập dữ liệu. Việc chứng minh đã khảo sát nghiêm túc hai dataset được chỉ định rồi kết luận có căn cứ vì sao không dùng, có giá trị hơn nhiều so với im lặng bỏ qua chúng.
