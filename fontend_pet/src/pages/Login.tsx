import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const isBlocked = searchParams.get('error') === 'blocked';
  const [error, setError] = useState(isBlocked ? 'Tài khoản đã bị khóa. Vui lòng liên hệ admin.' : '');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const errorMsg = await login({ email, password });

    if (errorMsg) {
      setError(errorMsg);
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="h-screen overflow-hidden w-full flex bg-slate-50 font-sans">
            {/* CỘT TRÁI: Hình ảnh & Branding đồng bộ với Trang chủ */}
      <div className="hidden lg:flex w-1/2 relative bg-[#144F5D] items-center justify-center overflow-hidden">
        
        {/* Hình nền mờ phía sau */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')" }}
        ></div>
        
        {/* Đồ họa lượn sóng (Wave) */}
        <div className="absolute bottom-0 left-0 right-0 opacity-90">
          <svg viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill="#006699" d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,197.3C960,213,1056,203,1152,176C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>

        {/* NỘI DUNG GOM NHÓM (LOCKUP) NẰM CHÍNH GIỮA */}
        <div className="relative z-10 px-16 text-white w-full max-w-2xl flex flex-col justify-center">
          
          {/* 1. Logo được mang xuống, làm to hơn một chút */}
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-12 h-12 text-[#FFB700]" fill="currentColor" viewBox="0 0 24 24">
               <path d="M12 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm4 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-8 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-3.5 3.5c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm15 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-2.2 4.1c-1.2-1-2.9-1.3-4.3-.8-.4.2-.9.2-1.3 0-1.4-.5-3.1-.2-4.3.8-1.5 1.3-2.1 3.5-1.4 5.3.7 1.8 2.6 3.2 4.6 3.2s3.9-1.4 4.6-3.2c.7-1.8.1-4-1.4-5.3z" />
            </svg>
            <span className="text-4xl font-extrabold tracking-widest text-white drop-shadow-sm">
              PAWCARE
            </span>
          </div>

          {/* 2. Đường kẻ phân cách nghệ thuật tạo sự vững chãi */}
          <div className="w-16 h-1.5 bg-[#FFB700] mb-8 rounded-full shadow-md"></div>

          {/* 3. Tiêu đề và nội dung */}
          <h1 className="text-5xl font-extrabold mb-4 leading-tight drop-shadow-md">
            <span className="text-[#FFB700]">Veterinary Hospital</span><br/>
            <span className="text-white">PET HEALTH CENTRE</span>
          </h1>
          <p className="text-blue-100 text-xl font-bold mb-3 tracking-wide">
            "Khoẻ mạnh cho Boss, an toàn cho Sen"
          </p>
          <p className="text-white/90 text-lg max-w-lg leading-relaxed">
            Khám & điều trị, tiêm phòng, dinh dưỡng, grooming & spa.
          </p>
        </div>

      </div>

      {/* CỘT PHẢI: Form Đăng nhập */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white relative">
        
        {/* Hiển thị Logo trên Mobile */}
        <div className="absolute top-8 left-8 lg:hidden">
            <img src="/logo.png" alt="PawCare Logo" className="h-10 object-contain" />
        </div>

        <div className="w-full max-w-md">
          {/* Tiêu đề Form */}
          <div className="mb-10 text-center lg:text-left mt-8 lg:mt-0">
            <h2 className="text-3xl font-extrabold text-[#006699] mb-3">Đăng nhập</h2>
            <p className="text-slate-500 font-medium">Chào mừng bạn quay trở lại hệ thống PawCare!</p>
          </div>

          {/* Thông báo lỗi */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-start gap-3 animate-pulse">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input Email */}
            <div>
              <label className="block text-sm font-bold text-[#144F5D] mb-1.5">Email của bạn</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006699]/30 focus:border-[#006699] focus:bg-white transition-all text-slate-800"
                  placeholder="admin@pawcare.com"
                  required
                />
              </div>
            </div>

            {/* Input Mật khẩu */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-bold text-[#144F5D]">Mật khẩu</label>
                <Link to="/forgot-password" className="text-sm text-[#006699] hover:text-[#004d73] font-bold hover:underline transition-colors">Quên mật khẩu?</Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006699]/30 focus:border-[#006699] focus:bg-white transition-all text-slate-800"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Nút Đăng nhập - Đã đồng bộ màu vàng với nút trên Trang chủ */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFB700] hover:bg-[#e5a400] text-[#144F5D] font-extrabold py-3 rounded-xl transition-all shadow-md shadow-[#FFB700]/20 hover:shadow-lg hover:shadow-[#FFB700]/40 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-[#144F5D]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xử lý...
                </>
              ) : 'Đăng nhập vào hệ thống'}
            </button>
          </form>

          {/* Đường kẻ phân cách */}
          <div className="mt-8 flex items-center">
            <div className="flex-1 border-t border-slate-200"></div>
            <span className="px-4 text-sm text-slate-400 bg-white font-medium">Hoặc tiếp tục với</span>
            <div className="flex-1 border-t border-slate-200"></div>
          </div>

          {/* Nút đăng nhập Google */}
          <div className="mt-6">
            <a
              href={`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/oauth2/authorization/google`}
              className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 rounded-xl py-3 hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-700 font-bold shadow-sm"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="w-5 h-5"
              />
              Đăng nhập bằng Google
            </a>
          </div>

          {/* Đăng ký */}
          <p className="text-center mt-10 text-slate-600 font-medium">
            Bạn chưa có tài khoản?{' '}
            <Link to="/register" className="text-[#006699] font-bold hover:text-[#004d73] hover:underline transition-colors">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}