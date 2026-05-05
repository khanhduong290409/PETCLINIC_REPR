import { useState, useEffect } from 'react';
import { Users, Lock, LockOpen } from 'lucide-react';
import { adminApi, type UserInfo } from '../../api/adminApi';
import { useToast } from '../../contexts/ToastContext';

const ROLE_LABEL: Record<string, string> = {
  USER: 'Người dùng',
  DOCTOR: 'Bác sĩ',
  ADMIN: 'Admin',
};

const ROLE_COLOR: Record<string, string> = {
  USER: 'bg-gray-100 text-gray-700',
  DOCTOR: 'bg-green-100 text-green-700',
  ADMIN: 'bg-sky-100 text-sky-700',
};

const PAGE_SIZE = 15;

export default function AdminUsers() {
  const { showToast } = useToast();

  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [changingRoleId, setChangingRoleId] = useState<number | null>(null);
  const [changingStatusId, setChangingStatusId] = useState<number | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAllUsers();
      setUsers(data.sort((a, b) => a.id - b.id));
    } catch {
      showToast('Không thể tải danh sách người dùng', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (u: UserInfo) => {
    const newStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      setChangingStatusId(u.id);
      const updated = await adminApi.updateUserStatus(u.id, newStatus);
      setUsers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      showToast(newStatus === 'ACTIVE' ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản');
    } catch {
      showToast('Thao tác thất bại', 'error');
    } finally {
      setChangingStatusId(null);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      setChangingRoleId(userId);
      const updated = await adminApi.updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      showToast(`Đã đổi role thành ${ROLE_LABEL[newRole] ?? newRole}`);
    } catch {
      showToast('Đổi role thất bại', 'error');
    } finally {
      setChangingRoleId(null);
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === '' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterRole]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const roleCounts = {
    USER: users.filter((u) => u.role === 'USER').length,
    DOCTOR: users.filter((u) => u.role === 'DOCTOR').length,
    ADMIN: users.filter((u) => u.role === 'ADMIN').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý người dùng</h1>
        <p className="text-gray-500 text-sm mt-1">
          Tổng {users.length} tài khoản — {roleCounts.DOCTOR} bác sĩ, {roleCounts.ADMIN} admin
        </p>
      </div>

      {/* Search + Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 space-y-3">
        <input
          type="text"
          placeholder="Tìm theo tên hoặc email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
        />
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-500 font-medium">Role:</span>
          {[
            { key: '', label: `Tất cả (${users.length})` },
            { key: 'USER',   label: `Người dùng (${roleCounts.USER})` },
            { key: 'DOCTOR', label: `Bác sĩ (${roleCounts.DOCTOR})` },
            { key: 'ADMIN',  label: `Admin (${roleCounts.ADMIN})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterRole(key)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                filterRole === key
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-sky-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow text-gray-400 gap-3">
          <Users size={40} />
          <p>Không tìm thấy người dùng</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold w-12">#</th>
                <th className="px-4 py-3 font-semibold">Họ tên</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">SĐT</th>
                <th className="px-4 py-3 font-semibold text-center">Trạng thái</th>
                <th className="px-4 py-3 font-semibold text-center w-44">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{u.id}</td>

                  <td className="px-4 py-3 font-medium text-gray-800">{u.fullName}</td>

                  <td className="px-4 py-3 text-gray-600">{u.email}</td>

                  <td className="px-4 py-3 text-gray-600">{u.phone || '—'}</td>

                  {/* Trạng thái + nút khóa */}
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {u.status === 'ACTIVE' ? 'Hoạt động' : 'Vô hiệu'}
                      </span>
                      {changingStatusId === u.id ? (
                        <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin inline-block" />
                      ) : (
                        <button
                          onClick={() => handleStatusToggle(u)}
                          title={u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}
                          className={`p-1 rounded transition-colors ${
                            u.status === 'ACTIVE'
                              ? 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                              : 'text-red-400 hover:text-green-600 hover:bg-green-50'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? <Lock size={14} /> : <LockOpen size={14} />}
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Role dropdown */}
                  <td className="px-4 py-3 text-center">
                    {changingRoleId === u.id ? (
                      <span className="inline-block w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className={`px-2 py-1 rounded-lg text-xs font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400 ${ROLE_COLOR[u.role] ?? 'bg-gray-100 text-gray-700'}`}
                      >
                        <option value="USER">Người dùng</option>
                        <option value="DOCTOR">Bác sĩ</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 py-4 border-t border-gray-100">
              <button
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              >
                Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 rounded-lg border text-sm font-medium transition ${
                    currentPage === page
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
