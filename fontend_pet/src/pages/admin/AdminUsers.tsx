import { useState, useEffect } from 'react';
import {
  Users,
  Lock,
  LockOpen,
  Search,
  Mail,
  Phone,
  ShieldCheck,
  Stethoscope,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { adminApi, type UserInfo } from '../../api/adminApi';
import { useToast } from '../../contexts/ToastContext';

const ROLE_LABEL: Record<string, string> = {
  USER: 'Người dùng',
  DOCTOR: 'Bác sĩ',
  ADMIN: 'Admin',
};

// Style cho role select — class dùng cho dropdown
const ROLE_SELECT_CLASS: Record<string, string> = {
  USER: 'bg-gray-50 text-gray-700 border-gray-200',
  DOCTOR: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ADMIN: 'bg-sky-50 text-sky-700 border-sky-200',
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  USER: <UserIcon size={12} />,
  DOCTOR: <Stethoscope size={12} />,
  ADMIN: <ShieldCheck size={12} />,
};

// Màu nền avatar theo role (xét nét nhỏ)
const ROLE_AVATAR_BG: Record<string, string> = {
  USER: 'from-gray-400 to-gray-500',
  DOCTOR: 'from-emerald-500 to-teal-600',
  ADMIN: 'from-sky-500 to-cyan-500',
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

  const statusCounts = {
    active: users.filter((u) => u.status === 'ACTIVE').length,
    inactive: users.filter((u) => u.status === 'INACTIVE').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center text-white shadow-sm">
            <Users size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Quản lý người dùng</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Tổng <span className="font-semibold text-gray-700">{users.length}</span> tài khoản · {' '}
              <span className="text-emerald-600 font-semibold">{statusCounts.active} hoạt động</span> · {' '}
              <span className="text-rose-600 font-semibold">{statusCounts.inactive} vô hiệu</span>
            </p>
          </div>
        </div>
      </div>

      {/* Mini stats: 3 ô role */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MiniStatCard
          icon={<UserIcon size={18} />}
          label="Người dùng"
          value={roleCounts.USER}
          iconBg="bg-gradient-to-br from-gray-400 to-gray-500"
        />
        <MiniStatCard
          icon={<Stethoscope size={18} />}
          label="Bác sĩ"
          value={roleCounts.DOCTOR}
          iconBg="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
        <MiniStatCard
          icon={<ShieldCheck size={18} />}
          label="Admin"
          value={roleCounts.ADMIN}
          iconBg="bg-gradient-to-br from-sky-500 to-cyan-500"
        />
      </div>

      {/* Toolbar: search + filter role */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-4 space-y-4">
        {/* Search */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Tìm kiếm
          </label>
          <div className="relative max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tên hoặc email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>
        </div>

        {/* Filter role */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Role
          </p>
          <div className="flex flex-wrap gap-2">
            <FilterPill
              active={filterRole === ''}
              label="Tất cả"
              count={users.length}
              onClick={() => setFilterRole('')}
            />
            <FilterPill
              active={filterRole === 'USER'}
              label="Người dùng"
              count={roleCounts.USER}
              onClick={() => setFilterRole('USER')}
            />
            <FilterPill
              active={filterRole === 'DOCTOR'}
              label="Bác sĩ"
              count={roleCounts.DOCTOR}
              onClick={() => setFilterRole('DOCTOR')}
            />
            <FilterPill
              active={filterRole === 'ADMIN'}
              label="Admin"
              count={roleCounts.ADMIN}
              onClick={() => setFilterRole('ADMIN')}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 py-16 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-sky-50 flex items-center justify-center">
            <Users size={36} className="text-sky-500" />
          </div>
          <p className="text-gray-700 text-lg font-semibold mb-1">Không tìm thấy người dùng</p>
          <p className="text-gray-500 text-sm">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 text-gray-600 text-left text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 font-bold w-12">#</th>
                  <th className="px-4 py-3 font-bold">Họ tên</th>
                  <th className="px-4 py-3 font-bold">Liên hệ</th>
                  <th className="px-4 py-3 font-bold text-center">Trạng thái</th>
                  <th className="px-4 py-3 font-bold text-center w-44">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((u) => {
                  const isActive = u.status === 'ACTIVE';
                  const avatarBg = ROLE_AVATAR_BG[u.role] || ROLE_AVATAR_BG.USER;
                  return (
                    <tr key={u.id} className="hover:bg-sky-50/30 transition">
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">{u.id}</td>

                      {/* Avatar + Họ tên */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarBg} text-white flex items-center justify-center text-sm font-bold ring-2 ring-white shadow-sm shrink-0`}>
                            {u.fullName?.[0]?.toUpperCase() || '?'}
                          </div>
                          <p className="font-semibold text-gray-800">{u.fullName}</p>
                        </div>
                      </td>

                      {/* Email + SĐT gộp 1 cột */}
                      <td className="px-4 py-3 text-gray-600">
                        <p className="inline-flex items-center gap-1.5 text-sm">
                          <Mail size={12} className="text-gray-400" />
                          {u.email}
                        </p>
                        {u.phone ? (
                          <p className="inline-flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                            <Phone size={11} className="text-gray-400" />
                            {u.phone}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 italic mt-0.5">— chưa có SĐT</p>
                        )}
                      </td>

                      {/* Trạng thái + nút khóa */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                              : 'bg-rose-50 text-rose-700 ring-rose-200'
                          }`}>
                            {isActive ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                            {isActive ? 'Hoạt động' : 'Vô hiệu'}
                          </span>
                          {changingStatusId === u.id ? (
                            <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin inline-block" />
                          ) : (
                            <button
                              onClick={() => handleStatusToggle(u)}
                              title={isActive ? 'Khóa tài khoản' : 'Mở khóa'}
                              className={`p-1.5 rounded-lg transition ${
                                isActive
                                  ? 'text-gray-400 hover:text-rose-600 hover:bg-rose-50'
                                  : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'
                              }`}
                            >
                              {isActive ? <Lock size={13} /> : <LockOpen size={13} />}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Role dropdown */}
                      <td className="px-4 py-3 text-center">
                        {changingRoleId === u.id ? (
                          <span className="inline-block w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <div className="relative inline-flex items-center">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
                              {ROLE_ICONS[u.role]}
                            </span>
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className={`border rounded-lg pl-7 pr-2 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20 cursor-pointer ${
                                ROLE_SELECT_CLASS[u.role] || 'bg-gray-50 text-gray-700 border-gray-200'
                              }`}
                            >
                              <option value="USER">Người dùng</option>
                              <option value="DOCTOR">Bác sĩ</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50/40">
              <p className="text-xs text-gray-500">
                Hiển thị <span className="font-semibold text-gray-700">{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)}</span> trong <span className="font-semibold text-gray-700">{filtered.length}</span>
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => p - 1)}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium text-gray-700 transition"
                >
                  <ChevronLeft size={14} /> Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 rounded-lg border text-sm font-semibold transition ${
                      currentPage === page
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-sky-50 hover:border-sky-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium text-gray-700 transition"
                >
                  Sau <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Mini stat card cho 3 ô role ở trên
function MiniStatCard({
  icon,
  label,
  value,
  iconBg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  iconBg: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-4 flex items-center gap-3 hover:shadow-md transition">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-white shadow-sm ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// Filter pill — đồng bộ với các trang khác
function FilterPill({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap ${
        active
          ? 'bg-sky-600 text-white shadow-md'
          : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-sky-50 hover:text-sky-700'
      }`}
    >
      {label}
      <span
        className={`text-xs px-2 py-0.5 rounded-full ${
          active ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
        }`}
      >
        {count}
      </span>
    </button>
  );
}

