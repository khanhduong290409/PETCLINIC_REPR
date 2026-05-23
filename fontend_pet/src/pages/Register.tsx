import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const errorMsg = await register({ email, password, fullName, phone });

    if (errorMsg) {
      setError(errorMsg);
      setLoading(false);
    } else {
      // Đăng ký thành công, chuyển về trang chủ
      navigate('/');
    }
  };

  return (
    <div className="h-screen w-full flex bg-slate-50 font-sans overflow-hidden">
      
      {/* CỘT TRÁI: Đồng bộ 100% với trang Đăng nhập */}
      <div className="hidden lg:flex w-1/2 relative bg-[#144F5D] items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')" }}
        ></div>
        
        <div className="absolute bottom-0 left-0 right-0 opacity-90">
          <svg viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill="#006699" d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,197.3C960,213,1056,203,1152,176C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>

        <div className="relative z-10 px-16 text-white w-full max-w-2xl flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-12 h-12 text-[#FFB700]" fill="currentColor" viewBox="0 0 24 24">
               <path d="M12 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm4 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-8 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-3.5 3.5c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm15 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-2.2 4.1c-1.2-1-2.9-1.3-4.3-.8-.4.2-.9.2-1.3 0-1.4-.5-3.1-.2-4.3.8-1.5 1.3-2.1 3.5-1.4 5.3.7 1.8 2.6 3.2 4.6 3.2s3.9-1.4 4.6-3.2c.7-1.8.1-4-1.4-5.3z" />
            </svg>
            <span className="text-4xl font-extrabold tracking-widest text-white drop-shadow-sm">
              PAWCARE
            </span>
          </div>

          <div className="w-16 h-1.5 bg-[#FFB700] mb-8 rounded-full shadow-md"></div>

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

      {/* CỘT PHẢI: Form Đăng ký */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-white relative overflow-y-auto">
        
        <div className="absolute top-6 left-6 lg:hidden">
            <span className="text-xl font-extrabold text-[#144F5D]">PAWCARE</span>
        </div>

        <div className="w-full max-w-md my-auto mt-12 lg:mt-auto py-8">
          
          <div className="mb-6 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-[#006699] mb-2">Tạo tài khoản</h2>
            <p className="text-slate-500 font-medium">Gia nhập hệ thống PawCare ngay hôm nay!</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl mb-6 flex items-start gap-3 animate-pulse">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Form đăng ký */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Input Họ Tên */}
            <div>
              <label className="block text-sm font-bold text-[#144F5D] mb-1.5">Họ và tên</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006699]/30 focus:border-[#006699] focus:bg-white transition-all text-slate-800"
                  placeholder="Nguyễn Văn A"
                  required
                />
              </div>
            </div>

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
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006699]/30 focus:border-[#006699] focus:bg-white transition-all text-slate-800"
                  placeholder="admin@pawcare.com"
                  required
                />
              </div>
            </div>

            {/* Input Số điện thoại */}
            <div>
              <label className="block text-sm font-bold text-[#144F5D] mb-1.5">Số điện thoại</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006699]/30 focus:border-[#006699] focus:bg-white transition-all text-slate-800"
                  placeholder="0912 345 678"
                />
              </div>
            </div>

            {/* Input Mật khẩu */}
            <div>
              <label className="block text-sm font-bold text-[#144F5D] mb-1.5">Mật khẩu</label>
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
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006699]/30 focus:border-[#006699] focus:bg-white transition-all text-slate-800"
                  placeholder="Ít nhất 6 ký tự"
                  minLength={6}
                  required
                />
              </div>
            </div>

            {/* Nút Đăng ký */}
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
              ) : 'Đăng ký tài khoản'}
            </button>
          </form>

          {/* Link chuyển sang Đăng nhập */}
          <p className="text-center mt-6 text-slate-600 font-medium">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-[#006699] font-bold hover:text-[#004d73] hover:underline transition-colors">
              Đăng nhập tại đây
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}