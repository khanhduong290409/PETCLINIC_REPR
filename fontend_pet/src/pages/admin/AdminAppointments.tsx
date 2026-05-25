import { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays,
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  PawPrint,
  User,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { adminApi } from '../../api/adminApi';
import type { AdminAppointment, DoctorInfo } from '../../api/adminApi';

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

const PAGE_SIZE = 10;

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

// Style cho select status — class dùng cho dropdown
const STATUS_SELECT_CLASS: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-sky-50 text-sky-700 border-sky-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  PENDING: <AlertCircle size={12} />,
  CONFIRMED: <CalendarCheck size={12} />,
  COMPLETED: <CheckCircle2 size={12} />,
  CANCELLED: <XCircle size={12} />,
};

interface AdminBookingGroup {
  bookingCode: string;
  representativeId: number; // id của appointment đầu tiên — dùng cho API call
  services: { title: string; price: number }[];
  appointmentDate: string;
  appointmentTime: string;
  ownerName: string;
  status: string;
  notes: string;
  totalPrice: number;
  doctorId: number | null;
  doctorName: string | null;
  pets: { id: number; name: string; species: string }[];
}

export default function AdminAppointments() {
  const { user } = useAuth();

  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [doctors, setDoctors] = useState<DoctorInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appts, docs] = await Promise.all([
        adminApi.getAppointments(),
        adminApi.getDoctors(),
      ]);
      setAppointments(appts);
      setDoctors(docs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Gom nhóm các appointment có cùng bookingCode thành 1 group
  const bookingGroups: AdminBookingGroup[] = useMemo(() => {
    const map = new Map<string, AdminAppointment[]>();
    for (const apt of appointments) {
      if (!map.has(apt.bookingCode)) map.set(apt.bookingCode, []);
      map.get(apt.bookingCode)!.push(apt);
    }
    return Array.from(map.entries()).map(([bookingCode, items]) => {
      const first = items[0];

      // Services lấy từ appointment đầu tiên (tất cả pets cùng booking có cùng services)
      const services = first.services.map((s) => ({ title: s.title, price: s.price }));

      // Tổng = giá các dịch vụ × số pet
      const totalPrice = services.reduce((sum, s) => sum + s.price, 0) * items.length;

      return {
        bookingCode,
        representativeId: first.id,
        services,
        appointmentDate: first.appointmentDate,
        appointmentTime: first.appointmentTime,
        ownerName: first.ownerName,
        status: first.status,
        notes: first.notes,
        totalPrice,
        doctorId: first.doctorId,
        doctorName: first.doctorName,
        pets: items.map((item) => ({
          id: item.id,
          name: item.petName,
          species: item.petSpecies,
        })),
      };
    });
  }, [appointments]);

  // Đếm theo trạng thái — cho stats + filter
  const counts = useMemo(() => {
    const c = { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    for (const g of bookingGroups) {
      c.total++;
      if (g.status === 'PENDING') c.pending++;
      else if (g.status === 'CONFIRMED') c.confirmed++;
      else if (g.status === 'COMPLETED') c.completed++;
      else if (g.status === 'CANCELLED') c.cancelled++;
    }
    return c;
  }, [bookingGroups]);

  const handleAssignDoctor = async (
    representativeId: number,
    value: string
  ) => {
    try {
      const updatedList = value === ''
        ? await adminApi.unassignDoctor(representativeId)
        : await adminApi.assignDoctor(representativeId, Number(value));
      // Merge toàn bộ appointments được cập nhật vào state theo id
      setAppointments((prev) => {
        const updatedMap = new Map(updatedList.map((a) => [a.id, a]));
        return prev.map((a) => updatedMap.get(a.id) ?? a);
      });
    } catch (err) {
      alert('Không thể phân công bác sĩ. Thử lại.');
    }
  };

  const handleUpdateStatus = async (
    representativeId: number,
    status: string
  ) => {
    try {
      const updatedList = await adminApi.updateStatus(representativeId, status);
      setAppointments((prev) => {
        const updatedMap = new Map(updatedList.map((a) => [a.id, a]));
        return prev.map((a) => updatedMap.get(a.id) ?? a);
      });
    } catch (err) {
      alert('Không thể cập nhật trạng thái. Thử lại.');
    }
  };

  const filtered =
    filterStatus === 'ALL'
      ? bookingGroups
      : bookingGroups.filter((g) => g.status === filterStatus);

  useEffect(() => { setCurrentPage(1); }, [filterStatus]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  const FILTER_TABS = [
    { key: 'ALL', label: 'Tất cả', count: counts.total },
    { key: 'PENDING', label: 'Chờ xác nhận', count: counts.pending },
    { key: 'CONFIRMED', label: 'Đã xác nhận', count: counts.confirmed },
    { key: 'COMPLETED', label: 'Hoàn thành', count: counts.completed },
    { key: 'CANCELLED', label: 'Đã hủy', count: counts.cancelled },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý lịch khám</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Tổng <span className="font-semibold text-gray-700">{bookingGroups.length}</span> lượt đặt khám · Phân công bác sĩ và cập nhật trạng thái
          </p>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map((tab) => (
          <FilterPill
            key={tab.key}
            active={filterStatus === tab.key}
            label={tab.label}
            count={tab.count}
            onClick={() => setFilterStatus(tab.key)}
          />
        ))}
      </div>

      {/* Table card */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 py-16 px-6 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-sky-50 flex items-center justify-center">
            <CalendarDays size={36} className="text-sky-500" />
          </div>
          <p className="text-gray-700 text-lg font-semibold mb-1">Không có lịch khám nào</p>
          <p className="text-gray-500 text-sm">
            {filterStatus === 'ALL' ? 'Chưa có lượt đặt khám nào trong hệ thống' : 'Thử chọn trạng thái khác'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 text-gray-600 text-left text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 font-bold">Mã đặt</th>
                  <th className="px-4 py-3 font-bold">Chủ / Thú cưng</th>
                  <th className="px-4 py-3 font-bold">Dịch vụ</th>
                  <th className="px-4 py-3 font-bold">Ngày - Giờ</th>
                  <th className="px-4 py-3 font-bold">Bác sĩ</th>
                  <th className="px-4 py-3 font-bold">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((group) => {
                  const lockDoctorAssign = group.status === 'CANCELLED' || group.status === 'COMPLETED';
                  return (
                    <tr key={group.bookingCode} className="hover:bg-sky-50/30 transition">
                      {/* Mã đặt */}
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">
                        #{group.bookingCode}
                      </td>

                      {/* Chủ / Thú cưng */}
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800 inline-flex items-center gap-1.5">
                          <User size={13} className="text-gray-400" />
                          {group.ownerName}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {group.pets.map((pet) => (
                            <span
                              key={pet.id}
                              className="inline-flex items-center gap-1 text-xs bg-gray-50 ring-1 ring-gray-200 rounded-md px-2 py-0.5 text-gray-700"
                            >
                              <PawPrint size={10} className="text-gray-400" />
                              {pet.name}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Dịch vụ */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 mb-1">
                          {group.services.map((s) => (
                            <span
                              key={s.title}
                              className="inline-flex items-center gap-1 text-xs bg-sky-50 ring-1 ring-sky-100 rounded-md px-2 py-0.5 text-sky-700 font-semibold"
                            >
                              <Sparkles size={10} />
                              {s.title}
                            </span>
                          ))}
                        </div>
                        <p className="font-semibold text-rose-600 text-sm">
                          {group.totalPrice.toLocaleString('vi-VN')}đ
                        </p>
                        {group.pets.length > 1 && (
                          <p className="text-[11px] text-gray-400">{group.pets.length} thú cưng</p>
                        )}
                      </td>

                      {/* Ngày - Giờ */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-gray-800 font-medium">
                          {new Date(group.appointmentDate).toLocaleDateString('vi-VN')}
                        </p>
                        <p className="text-xs text-gray-500">{group.appointmentTime}</p>
                      </td>

                      {/* Bác sĩ — 1 dropdown cho cả nhóm */}
                      <td className="px-4 py-3">
                        <div className="relative">
                          <Stethoscope
                            size={13}
                            className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                          />
                          <select
                            value={group.doctorId ?? ''}
                            onChange={(e) =>
                              handleAssignDoctor(group.representativeId, e.target.value)
                            }
                            className="border border-gray-200 rounded-lg pl-7 pr-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 disabled:opacity-50 disabled:bg-gray-50"
                            disabled={lockDoctorAssign}
                          >
                            <option value="">-- Chưa phân công --</option>
                            {doctors.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.fullName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Trạng thái — 1 dropdown cho cả nhóm */}
                      <td className="px-4 py-3">
                        <div className="relative inline-flex items-center">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
                            {STATUS_ICONS[group.status]}
                          </span>
                          <select
                            value={group.status}
                            onChange={(e) =>
                              handleUpdateStatus(group.representativeId, e.target.value)
                            }
                            className={`border rounded-lg pl-7 pr-2 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20 ${
                              STATUS_SELECT_CLASS[group.status] || 'bg-gray-50 text-gray-700 border-gray-200'
                            }`}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {STATUS_LABEL[s]}
                              </option>
                            ))}
                          </select>
                        </div>
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
