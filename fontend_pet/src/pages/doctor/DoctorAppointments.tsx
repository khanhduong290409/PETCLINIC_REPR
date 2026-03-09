import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doctorApi } from '../../api/doctorApi';
import type { DoctorAppointment } from '../../api/doctorApi';

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

const SPECIES_EMOJI: Record<string, string> = {
  DOG: '🐕', CAT: '🐱', BIRD: '🐦',
  RABBIT: '🐰', HAMSTER: '🐹', OTHER: '🐾',
};

// Kiểu dữ liệu sau khi group
interface BookingGroup {
  bookingCode: string;
  serviceTitle: string;
  appointmentDate: string;
  appointmentTime: string;
  ownerName: string;
  status: string;
  notes: string;
  totalPrice: number;
  pets: { id: number; name: string; species: string; imageUrl: string }[];
}

export default function DoctorAppointments() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [completing, setCompleting] = useState<string | null>(null); // bookingCode đang xử lý

  useEffect(() => {
    loadAppointments();
  }, [user]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await doctorApi.getMyAppointments(user!.id); 
      setAppointments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (group: BookingGroup) => {
    if (!confirm(`Xác nhận đã khám xong cho ${group.pets.length} thú cưng?`)) return;
    setCompleting(group.bookingCode);
    try {
      // Dùng id của pet đầu tiên (= appointmentId) để backend tìm bookingCode
      await doctorApi.completeAppointment(group.pets[0].id, user!.id);
      // Reload lại danh sách để cập nhật trạng thái
      await loadAppointments();
    } catch (err) {
      alert('Không thể cập nhật. Thử lại.');
    } finally {
      setCompleting(null);
    }
  };

  // Group các appointment có cùng bookingCode thành 1 nhóm
  const bookingGroups: BookingGroup[] = useMemo(() => {
    const map = new Map<string, DoctorAppointment[]>();
    for (const apt of appointments) {
      if (!map.has(apt.bookingCode)) map.set(apt.bookingCode, []);
      map.get(apt.bookingCode)!.push(apt);
    }
    return Array.from(map.entries()).map(([bookingCode, items]) => {
      const first = items[0];
      return {
        bookingCode,
        serviceTitle: first.serviceTitle,
        appointmentDate: first.appointmentDate,
        appointmentTime: first.appointmentTime,
        ownerName: first.ownerName,
        status: first.status,
        notes: first.notes,
        totalPrice: items.reduce((sum, item) => sum + item.servicePrice, 0),
        pets: items.map((item) => ({
          id: item.id,
          name: item.petName,
          species: item.petSpecies,
          imageUrl: item.petImageUrl,
        })),
      };
    });
  }, [appointments]);

  const today = new Date().toISOString().split('T')[0];
  const todayCount = bookingGroups.filter((g) => g.appointmentDate === today).length;

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
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Lịch khám của tôi</h1>
        <p className="text-gray-500 text-sm mt-1">
          Xin chào, {user?.fullName} —{' '}
          {todayCount > 0 ? (
            <span className="text-sky-600 font-medium">Hôm nay có {todayCount} lượt khám</span>
          ) : (
            'Hôm nay không có lịch khám'
          )}
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
              filterStatus === s
                ? 'bg-sky-600 text-white border-sky-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-sky-400'
            }`}
          >
            {s === 'ALL'
              ? `Tất cả (${bookingGroups.length})`
              : `${STATUS_LABEL[s]} (${bookingGroups.filter((g) => g.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Danh sách lịch khám đã group */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow text-gray-400">
          Không có lịch khám nào
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((group) => (
            <div key={group.bookingCode} className="bg-white rounded-lg shadow p-5">

              {/* Header: dịch vụ + trạng thái */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-400 font-mono">{group.bookingCode}</p>
                  <h3 className="text-lg font-bold text-sky-600">{group.serviceTitle}</h3>
                  <p className="text-sm text-gray-500">Chủ: <span className="font-semibold text-gray-700">{group.ownerName}</span></p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLOR[group.status]}`}>
                  {STATUS_LABEL[group.status]}
                </span>
              </div>

              {/* Danh sách thú cưng */}
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">
                  Thú cưng cần khám ({group.pets.length} con)
                </p>
                <div className="flex flex-wrap gap-3">
                  {group.pets.map((pet) => (
                    <div
                      key={pet.id}
                      className="flex items-center gap-2 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2"
                    >
                      {pet.imageUrl ? (
                        <img
                          src={pet.imageUrl}
                          alt={pet.name}
                          className="w-9 h-9 rounded-full object-cover border"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <span className="text-xl">{SPECIES_EMOJI[pet.species] || '🐾'}</span>
                      )}
                      <span className="font-semibold text-sm text-gray-700">{pet.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ngày, giờ, tổng phí */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm border-t pt-4">
                <div>
                  <p className="text-gray-400">Ngày khám</p>
                  <p className="font-semibold">
                    {new Date(group.appointmentDate).toLocaleDateString('vi-VN')}
                    {group.appointmentDate === today && (
                      <span className="ml-2 text-xs bg-sky-100 text-sky-600 px-2 py-0.5 rounded-full">
                        Hôm nay
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Giờ khám</p>
                  <p className="font-semibold">{group.appointmentTime}</p>
                </div>
                <div>
                  <p className="text-gray-400">Tổng phí</p>
                  <p className="font-semibold text-rose-600">
                    {group.totalPrice.toLocaleString('vi-VN')}đ
                  </p>
                  {group.pets.length > 1 && (
                    <p className="text-xs text-gray-400">
                      ({(group.totalPrice / group.pets.length).toLocaleString('vi-VN')}đ × {group.pets.length})
                    </p>
                  )}
                </div>
              </div>

              {/* Ghi chú của chủ */}
              {group.notes && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800">
                  <span className="font-semibold">Ghi chú của chủ: </span>"{group.notes}"
                </div>
              )}

              {/* Nút hành động */}
              {(group.status === 'CONFIRMED' || group.status === 'COMPLETED') && (
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => navigate(`/doctor/medical/${group.bookingCode}`)}
                    className="bg-sky-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-sky-700 transition"
                  >
                    Ghi bệnh án
                  </button>
                  {group.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleComplete(group)}
                      disabled={completing === group.bookingCode}
                      className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50"
                    >
                      {completing === group.bookingCode ? 'Đang xử lý...' : 'Xác nhận đã khám xong'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
