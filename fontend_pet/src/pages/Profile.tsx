import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { userApi } from '../api/userApi';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">Vui lòng đăng nhập</p>
          <Link to="/login" className="bg-sky-600 text-white px-6 py-2 rounded-lg">
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
    <div className="max-w-lg mx-auto px-4 py-8">
      <Link to="/" className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-800 mb-6">
        <ArrowLeft size={20} /> Trang chủ
      </Link>

      <h1 className="text-3xl font-bold text-gray-800 mb-8">Thông tin cá nhân</h1>

      <div className="bg-white rounded-lg shadow p-6">
        {/* Avatar placeholder */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b">
          <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center">
            <User size={32} className="text-sky-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-lg">{user.fullName}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-1 font-medium">Họ tên</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Nhập họ tên"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1 font-medium">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-400 mt-1">Email không thể thay đổi</p>
          </div>

          <div>
            <label className="block text-gray-700 mb-1 font-medium">
              Số điện thoại
              {!user.phone && (
                <span className="ml-2 text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  Chưa cập nhật
                </span>
              )}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Nhập số điện thoại"
            />
            <p className="text-xs text-gray-400 mt-1">
              Số điện thoại dùng để đặt lịch khám và liên hệ giao hàng
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 text-white py-2.5 rounded-lg font-semibold hover:bg-sky-700 transition disabled:opacity-50 mt-2"
          >
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>
      </div>
    </div>
  );
}
