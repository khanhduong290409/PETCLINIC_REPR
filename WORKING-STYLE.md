# Quy ước làm việc

> Áp dụng cho mọi công việc trong project này.

---

## 1. Style code

**Nguyên tắc: rõ ràng > ngắn gọn.** Code được đọc nhiều hơn được viết. Nếu phải dừng lại 3 giây để hiểu một dòng, dòng đó cần viết lại dài hơn.

### Nên

- Vòng lặp `for` thường thay vì chuỗi stream lồng nhau
- Tách biến trung gian có tên rõ nghĩa, thay vì nhồi hết vào một biểu thức
- `if/else` tường minh thay vì toán tử ba ngôi lồng nhau
- Tên biến đầy đủ nghĩa: `appointmentDate`, không phải `aptDt` hay `d`
- Một hàm làm một việc

### Tránh

- Stream/lambda nhiều tầng khó lần theo
- Toán tử ba ngôi lồng nhau (`a ? b : c ? d : e`)
- Destructuring hoặc optional chaining dài dòng (`a?.b?.c?.[0]?.d`)
- Viết tắt "thông minh" tiết kiệm được 2 dòng nhưng tốn 30 giây để hiểu
- Trừu tượng hóa sớm — chỉ tách hàm/class khi thực sự có chỗ dùng lại

### Ví dụ

```java
// ❌ Ngắn nhưng khó đọc
return records.stream()
    .filter(r -> r.getAppointment().getStatus() == COMPLETED)
    .collect(groupingBy(r -> r.getAppointment().getPet().getSpecies(),
             counting()));

// ✅ Dài hơn nhưng đọc là hiểu
Map<Species, Long> countBySpecies = new HashMap<>();
for (MedicalRecord record : records) {
    Appointment apt = record.getAppointment();
    if (apt.getStatus() != AppointmentStatus.COMPLETED) {
        continue;
    }
    Species species = apt.getPet().getSpecies();
    countBySpecies.merge(species, 1L, Long::sum);
}
return countBySpecies;
```

### Quy ước khác

- **Comment và chuỗi hiển thị cho người dùng: tiếng Việt.** Tên biến, hàm, class: tiếng Anh
- Comment giải thích **tại sao**, không phải **cái gì** (code đã nói cái gì rồi)
- **Hạn chế thêm thư viện mới** — nếu cần thì nêu lý do và chờ đồng ý trước
- Bám theo pattern có sẵn trong project, không tự nghĩ ra cách mới cho việc cũ

---

## 2. Workflow

**Quy trình bắt buộc cho mọi task:**

```
1. Lên plan  →  chờ duyệt
2. Code file thứ nhất
3. Tự review file đó
4. Có sai sót  →  tự fix, review lại
5. File đã ổn  →  tự sang file tiếp theo (không chờ xác nhận)
```

Quy tắc:

- **Lên plan trước khi code** và chờ duyệt plan
- **Mỗi lần chỉ code một file**, xong file nào review file đó
- **Tự review và tự fix** — không để lại bản nháp đầu tiên
- Plan đã duyệt thì **không dừng chờ xác nhận giữa các file** *(đổi ngày 2026-10-18)*; chỉ dừng hỏi khi gặp quyết định người dùng phải chọn
- Cuối task tóm tắt từng file đã làm gì

### Checklist tự review

Trước khi gửi mỗi file, kiểm tra:

- [ ] Có lỗi cú pháp / thiếu import không?
- [ ] Có chỗ nào viết đơn giản hơn được không?
- [ ] Có trùng lặp với code đã có trong project không?
- [ ] Tên biến, tên hàm đã rõ nghĩa chưa?
- [ ] Trường hợp lỗi (null, rỗng, service chết) đã xử lý chưa?
- [ ] Có bám đúng pattern của các file cùng loại trong project không?

---

## 3. Cách giải thích

**Nguyên tắc: ngắn gọn, đúng trọng tâm.**

### Nên

- Trả lời thẳng câu hỏi trước, chi tiết sau (nếu cần)
- Dùng bảng hoặc gạch đầu dòng khi so sánh nhiều thứ
- Một ý một câu

### Chỉ giải thích thêm khi

- Đó là quyết định ảnh hưởng lâu dài, khó sửa về sau
- Đó là cái bẫy dễ sai mà không báo lỗi
- Kết quả trái với trực giác thông thường

### Không cần giải thích

- Cú pháp cơ bản của Java / TypeScript / SQL
- Những gì đọc code là hiểu ngay
- Nhắc lại điều đã nói ở lượt trước
- Liệt kê các phương án sẽ không dùng

### Khi có lỗi hoặc rủi ro

Nói thẳng trong 1–2 câu, kèm cách xử lý. Không vòng vo, không xin lỗi dài dòng.
