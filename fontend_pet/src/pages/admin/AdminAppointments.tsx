import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { adminApi } from '../../api/adminApi';
import type { AdminAppointment, DoctorInfo } from '../../api/adminApi';

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

interface AdminBookingGroup {
  bookingCode: string;
  representativeId: number; // id của appointment đầu tiên — dùng cho API call
  serviceTitle: string;
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
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [doctors, setDoctors] = useState<DoctorInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');

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
      return {
        bookingCode,
        representativeId: first.id,
        serviceTitle: first.serviceTitle,
        appointmentDate: first.appointmentDate,
        appointmentTime: first.appointmentTime,
        ownerName: first.ownerName,
        status: first.status,
        notes: first.notes,
        totalPrice: items.reduce((sum, item) => sum + item.servicePrice, 0),
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý lịch khám</h1>
        <p className="text-gray-500 text-sm mt-1">Tổng: {bookingGroups.length} lượt đặt khám</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['ALL', ...STATUS_OPTIONS].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
              filterStatus === s
                ? 'bg-sky-600 text-white border-sky-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-sky-400'
            }`}
          >
            {s === 'ALL' ? 'Tất cả' : STATUS_LABEL[s]}
            {s !== 'ALL' && (
              <span className="ml-1 text-xs">
                ({bookingGroups.filter((g) => g.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow text-gray-400">
          Không có lịch khám nào
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Mã đặt</th>
                <th className="px-4 py-3 font-semibold">Chủ / Thú cưng</th>
                <th className="px-4 py-3 font-semibold">Dịch vụ</th>
                <th className="px-4 py-3 font-semibold">Ngày - Giờ</th>
                <th className="px-4 py-3 font-semibold">Bác sĩ</th>
                <th className="px-4 py-3 font-semibold">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((group) => (
                <tr key={group.bookingCode} className="hover:bg-gray-50">
                  {/* Mã đặt */}
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {group.bookingCode}
                  </td>

                  {/* Chủ / Thú cưng */}
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-800">{group.ownerName}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {group.pets.map((pet) => (
                        <span
                          key={pet.id}
                          className="text-xs bg-sky-50 border border-sky-100 rounded px-2 py-0.5 text-gray-600"
                        >
                          {pet.name}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Dịch vụ */}
                  <td className="px-4 py-3">
                    <p className="font-medium">{group.serviceTitle}</p>
                    <p className="text-gray-400">{group.totalPrice.toLocaleString('vi-VN')}đ</p>
                    {group.pets.length > 1 && (
                      <p className="text-xs text-gray-400">{group.pets.length} thú cưng</p>
                    )}
                  </td>

                  {/* Ngày - Giờ */}
                  <td className="px-4 py-3">
                    <p>{new Date(group.appointmentDate).toLocaleDateString('vi-VN')}</p>
                    <p className="text-gray-500">{group.appointmentTime}</p>
                  </td>

                  {/* Bác sĩ — 1 dropdown cho cả nhóm */}
                  <td className="px-4 py-3">
                    <select
                      value={group.doctorId ?? ''}
                      onChange={(e) =>
                        handleAssignDoctor(group.representativeId, e.target.value)
                      }
                      className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-sky-400"
                      disabled={group.status === 'CANCELLED' || group.status === 'COMPLETED'}
                    >
                      <option value="">-- Chưa phân công --</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.fullName}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Trạng thái — 1 dropdown cho cả nhóm */}
                  <td className="px-4 py-3">
                    <select
                      value={group.status}
                      onChange={(e) =>
                        handleUpdateStatus(group.representativeId, e.target.value)
                      }
                      className={`border rounded px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-sky-400 ${STATUS_COLOR[group.status]}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
