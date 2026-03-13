import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Trang này không hiển thị gì cả
// Nhiệm vụ duy nhất: đọc thông tin user từ URL, lưu vào AuthContext, rồi chuyển trang
//
// Luồng:
// 1. User bấm "Đăng nhập bằng Google" ở trang Login
// 2. Redirect sang Google → user chọn tài khoản
// 3. Backend nhận thông tin từ Google, tìm/tạo user trong DB
// 4. Backend redirect về đây: /oauth2/callback?id=1&email=...&fullName=...&role=USER
// 5. Trang này đọc các param đó, lưu vào AuthContext + localStorage
// 6. Redirect về trang chủ

export default function OAuth2Callback() {
  const navigate = useNavigate();
  const { loginWithData } = useAuth();
  const [ searchParams ] = useSearchParams(); // dùng hook của React Router thay vì window.location
  // đọc url 
  /*
  searchParams = {
    "id"       → "1"
    "email"    → "abc@gmail.com"
    "fullName" → "Nguyen Van A"
    "role"     → "USER"
}
   */


  useEffect(() => {
    const id       = searchParams.get('id');
    const email    = searchParams.get('email');
    const fullName = searchParams.get('fullName');
    const role     = searchParams.get('role');

    // Kiểm tra đủ thông tin không
    if (id && email && fullName && role) {
      // Lưu user vào AuthContext (giống như đăng nhập thường)
      loginWithData({
        id: Number(id),
        email: email,
        fullName: fullName,
        phone: '',
        role: role,
      });

      // Chuyển về trang chủ
      navigate('/');
    } else {
      // Thiếu thông tin → quay về trang login
      navigate('/login');
    }
  }, [searchParams]);

  // Hiện spinner trong lúc xử lý
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  );
}
