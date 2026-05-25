import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Shield, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { userApi } from '../api/userApi';

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase();
}

function getRoleLabel(role: string) {
  if (role === 'ADMIN') return 'Quản trị viên';
  if (role === 'DOCTOR') return 'Bác sĩ';
  return 'Khách hàng';
}

function getRoleBadgeClass(role: string) {
  if (role === 'ADMIN') return 'bg-rose-100 text-rose-700 border-rose-200';
  if (role === 'DOCTOR') return 'bg-violet-100 text-violet-700 border-violet-200';
  return 'bg-emerald-100 text-emerald-700 border-emerald-200';
}

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={36} className="text-sky-400" />
          </div>
          <p className="text-gray-500 text-lg mb-4">Vui lòng đăng nhập</p>
          <Link to="/login" className="bg-sky-600 text-white px-6 py-2.5 rounded-xl font-semibold">
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Họ tên không được để trống');
      return;
    }

    setLoading(true);
    try {
      await userApi.updateProfile(user.id, { fullName: fullName.trim(), phone: phone.trim() });
      updateUser(fullName.trim(), phone.trim());
      showToast('Cập nhật thông tin thành công');
    } catch {
      setError('Không thể cập nhật. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero banner */}
      <div className="relative bg-linear-to-br from-sky-600 via-sky-500 to-teal-500 h-56 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/10 rounded-full" />
        <div className="absolute -bottom-16 -left-8 w-48 h-48 bg-white/10 rounded-full" />
        <div className="absolute top-8 left-1/3 w-24 h-24 bg-white/5 rounded-full" />
        <div className="absolute bottom-4 right-1/4 w-16 h-16 bg-white/10 rounded-full" />

        {/* Paw print decorations (SVG paths) */}
        <svg className="absolute top-6 right-32 opacity-10 w-16 h-16" viewBox="0 0 100 100" fill="white">
          <ellipse cx="30" cy="20" rx="10" ry="13" />
          <ellipse cx="60" cy="15" rx="8" ry="11" />
          <ellipse cx="78" cy="35" rx="8" ry="11" />
          <ellipse cx="15" cy="42" rx="8" ry="11" />
          <path d="M47 45 C25 40 15 60 25 78 C32 90 65 90 75 78 C85 60 70 40 47 45Z" />
        </svg>
        <svg className="absolute bottom-4 left-16 opacity-10 w-10 h-10" viewBox="0 0 100 100" fill="white">
          <ellipse cx="30" cy="20" rx="10" ry="13" />
          <ellipse cx="60" cy="15" rx="8" ry="11" />
          <ellipse cx="78" cy="35" rx="8" ry="11" />
          <ellipse cx="15" cy="42" rx="8" ry="11" />
          <path d="M47 45 C25 40 15 60 25 78 C32 90 65 90 75 78 C85 60 70 40 47 45Z" />
        </svg>

        {/* Back button */}
        <div className="relative max-w-5xl mx-auto px-6 pt-5">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} />
            Trang chủ
          </Link>
        </div>
      </div>

      {/* Content — overlaps hero */}
      <div className="max-w-5xl mx-auto px-4 -mt-20 pb-12">
        <div className="grid md:grid-cols-5 gap-6 items-start">

          {/* Left: Profile card */}
          <div className="md:col-span-2 space-y-4">
            {/* Avatar + name card */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 text-center">
              {/* Avatar */}
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 rounded-full bg-linear-to-br from-sky-400 to-teal-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-white mx-auto">
                  {user.fullName ? getInitials(user.fullName) : <User size={36} />}
                </div>
                <div className="absolute bottom-0 right-0 w-7 h-7 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center">
                  <CheckCircle size={14} className="text-white" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-800 mb-1">{user.fullName}</h2>
              <p className="text-sm text-gray-400 mb-3">{user.email}</p>

              {user.role && (
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${getRoleBadgeClass(user.role)}`}>
                  <Shield size={12} />
                  {getRoleLabel(user.role)}
                </span>
              )}
            </div>

            {/* Info summary card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Thông tin tài khoản</p>
              </div>
              <div className="divide-y divide-gray-50">
                <div className="flex items-center gap-3 px-5 py-4">
                  <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center shrink-0">
                    <Mail size={15} className="text-sky-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">Email</p>
                    <p className="text-sm font-medium text-gray-700 truncate">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 px-5 py-4">
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                    <Phone size={15} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Điện thoại</p>
                    {user.phone ? (
                      <p className="text-sm font-medium text-gray-700">{user.phone}</p>
                    ) : (
                      <p className="text-sm text-amber-500 font-medium">Chưa cập nhật</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 px-5 py-4">
                  <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center shrink-0">
                    <Lock size={15} className="text-violet-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Mật khẩu</p>
                    <p className="text-sm font-medium text-gray-700">••••••••</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Edit form */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              {/* Form header */}
              <div className="bg-linear-to-r from-gray-50 to-white px-7 py-5 border-b border-gray-100">
                <h1 className="text-lg font-bold text-gray-800">Chỉnh sửa thông tin</h1>
                <p className="text-sm text-gray-400 mt-0.5">Cập nhật thông tin cá nhân của bạn</p>
              </div>

              <div className="px-7 py-6">
                {error && (
                  <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl mb-5 text-sm">
                    <AlertCircle size={16} className="shrink-0" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Full name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Họ và tên <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition"
                        placeholder="Nhập họ và tên"
                        required
                      />
                    </div>
                  </div>

                  {/* Email (readonly) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input
                        type="email"
                        value={user.email}
                        disabled
                        className="w-full pl-10 pr-4 py-3 border border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                      />
                    </div>
                    <p className="flex items-center gap-1 text-xs text-gray-400 mt-1.5">
                      <Lock size={11} /> Email không thể thay đổi
                    </p>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Số điện thoại
                      {!user.phone && (
                        <span className="ml-2 text-xs font-normal text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                          Chưa cập nhật
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition"
                        placeholder="Nhập số điện thoại"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">
                      Dùng để đặt lịch khám và liên hệ giao hàng
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-100 pt-2" />

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-linear-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-md shadow-sky-200 hover:shadow-sky-300 transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang lưu...
                      </span>
                    ) : (
                      'Lưu thay đổi'
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Tip card */}
            <div className="mt-4 bg-sky-50 border border-sky-100 rounded-2xl px-5 py-4 flex gap-3 items-start">
              <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <Shield size={15} className="text-sky-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-sky-700 mb-0.5">Bảo mật tài khoản</p>
                <p className="text-xs text-sky-600 leading-relaxed">
                  Thông tin cá nhân của bạn được mã hóa và bảo mật. Chúng tôi không chia sẻ dữ liệu với bên thứ ba.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
