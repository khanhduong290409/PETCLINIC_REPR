# PawCare — Hệ thống quản lý phòng khám thú y

## Ngăn xếp công nghệ

- **Backend**: `backend_pet/` — Spring Boot 3, Java 21, PostgreSQL (Neon), JWT + Google OAuth2, deploy Render qua Docker
- **Frontend**: `fontend_pet/` — React + TypeScript + Vite + TailwindCSS, deploy Vercel *(tên thư mục viết thiếu chữ 'r' — đúng như vậy, không phải lỗi)*
- **Tích hợp ngoài**: Groq LLM (chatbot), SePay (thanh toán QR), Cloudinary (ảnh)
- **Role**: `USER`, `DOCTOR`, `ADMIN`

## 🔬 Chức năng đang phát triển: AI Dự đoán bệnh thú y

Đây là đề tài đồ án chính đang triển khai.
**Đọc [docs/ai-disease-prediction/README.md](docs/ai-disease-prediction/README.md) trước khi làm bất cứ việc gì liên quan.**

Folder đó chứa: tổng quan đề bài, kiến trúc, thiết kế dữ liệu, kế hoạch mô hình, chi tiết tích hợp, **tiến độ** (`PROGRESS.md`) và **nhật ký quyết định** (`DECISIONS.md`).

Quy ước: đọc `PROGRESS.md` đầu session, cập nhật cuối session. Không tự ý đảo ngược quyết định đã ghi trong `DECISIONS.md`.

## Các chức năng web khác (khung giờ đặt lịch, lịch bác sĩ, bảo mật API)

Tiến độ và quyết định thiết kế: **[docs/web-features/PROGRESS.md](docs/web-features/PROGRESS.md)**.

## ⚠️ Quy ước làm việc — BẮT BUỘC ĐỌC

**[WORKING-STYLE.md](WORKING-STYLE.md)** — style code, workflow, cách giải thích. Đọc đầu mỗi session.

Tóm tắt:

- **Code**: rõ ràng > ngắn gọn. Tránh stream lồng nhau, ternary lồng nhau, viết tắt "thông minh"
- **Workflow**: lên plan → chờ duyệt → code **từng file một** → tự review, tự fix → tự sang file tiếp (không chờ xác nhận giữa các file)
- **Giải thích**: ngắn gọn, đúng trọng tâm; chỉ giải thích thêm khi thật sự quan trọng
- Comment và chuỗi hiển thị: **tiếng Việt**. Tên biến, hàm, class: tiếng Anh
- Hạn chế thêm thư viện mới — nêu lý do trước
- Commit message: tiếng Việt không dấu, không thêm `Co-Authored-By: Claude`

## Lệnh thường dùng

```powershell
# Backend
cd backend_pet; .\mvnw spring-boot:run

# Frontend
cd fontend_pet; npm run dev
```
