import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Trang này không hiển thị gì cả
// Nhiệm vụ duy nhất: đọc JWT token từ URL, lưu vào AuthContext, rồi chuyển trang
//
// Luồng:
// 1. User bấm "Đăng nhập bằng Google" ở trang Login
// 2. Redirect sang Google → user chọn tài khoản
// 3. Backend nhận thông tin từ Google, tạo JWT
// 4. Backend redirect về đây: /oauth2/callback?token=<jwt>
// 5. Trang này lưu token vào AuthContext + localStorage
// 6. Redirect về trang chủ

export default function OAuth2Callback() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      loginWithToken(token);
      navigate('/');
    } else {
      navigate('/login');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  );
}
