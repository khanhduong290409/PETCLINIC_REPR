import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { appointmentApi } from '../api/appointmentApi';
import type { AppointmentResponse } from '../api/appointmentApi';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-700' },
};

const SPECIES_EMOJI: Record<string, string> = {
  DOG: '🐕', CAT: '🐱', BIRD: '🐦',
  RABBIT: '🐰', HAMSTER: '🐹', OTHER: '🐾',
};

interface BookingGroup {
  bookingCode: string;
  services: { title: string; price: number }[];
  appointmentDate: string;
  appointmentTime: string;
  doctorName: string | null;
  status: string;
  notes: string;
  totalPrice: number;
  pets: {
    name: string;
    species: string;
    imageUrl: string;
  }[];
  firstAppointmentId: number;
}

export default function MyAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchAppointments();
  }, [user]);

  const fetchAppointments = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await appointmentApi.getAppointments(user.id);
      setAppointments(data);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group appointments theo bookingCode
  const bookingGroups: BookingGroup[] = useMemo(() => {
    const map = new Map<string, AppointmentResponse[]>();
    for (const apt of appointments) {
      const key = apt.bookingCode;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(apt);
    }
    /**
     * map = Map {
  'BK001' => [
    { id: 101, petName: 'Milo', serviceTitle: 'Khám TQ', date: '2024-03-15', ... },
    { id: 102, petName: 'Luna', serviceTitle: 'Khám TQ', date: '2024-03-15', ... }
  ],
  'BK002' => [
    { id: 103, petName: 'Max', serviceTitle: 'Tiêm phòng', date: '2024-03-16', ... }
  ]
}
     */

    return Array.from(map.entries()).map(([bookingCode, items]) => {
      const first = items[0];

      // Deduplicate pets theo tên
      const petsMap = new Map<string, { name: string; species: string; imageUrl: string }>();
      for (const item of items) {
        if (!petsMap.has(item.petName)) {
          petsMap.set(item.petName, {
            name: item.petName,
            species: item.petSpecies,
            imageUrl: item.petImageUrl,
          });
        }
      }

      // Deduplicate services theo title
      const servicesMap = new Map<string, { title: string; price: number }>();
      for (const item of items) {
        if (!servicesMap.has(item.serviceTitle)) {
          servicesMap.set(item.serviceTitle, {
            title: item.serviceTitle,
            price: item.servicePrice,
          });
        }
      }

      const uniquePets = Array.from(petsMap.values());
      const uniqueServices = Array.from(servicesMap.values());
      const totalPrice = uniqueServices.reduce((sum, s) => sum + s.price, 0) * uniquePets.length;

      return {
        bookingCode,
        services: uniqueServices,
        appointmentDate: first.appointmentDate,
        appointmentTime: first.appointmentTime,
        doctorName: first.doctorName,
        status: first.status,
        notes: first.notes,
        totalPrice,
        pets: uniquePets,
        firstAppointmentId: first.id,
      };
    });
  }, [appointments]);

  const handleCancel = async (group: BookingGroup) => {
    if (!user) return;
    const petNames = group.pets.map((p) => p.name).join(', ');
    if (!confirm(`Bạn có chắc muốn hủy lịch khám cho ${petNames}?`)) return;

    try {
      await appointmentApi.cancelAppointment(group.firstAppointmentId, user.id);
      fetchAppointments();
    } catch (err) {
      console.error('Failed to cancel:', err);
      alert('Không thể hủy. Vui lòng thử lại.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">Vui lòng đăng nhập</p>
          <Link to="/login" className="bg-sky-600 text-white px-6 py-2 rounded-lg">Đăng nhập</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Lịch khám của tôi</h1>
        <Link
          to="/book-appointment"
          className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition"
        >
          <Plus size={20} /> Đặt lịch mới
        </Link>
      </div>

      {bookingGroups.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg mb-2">Chưa có lịch khám nào</p>
          <Link to="/book-appointment" className="text-sky-600 hover:underline">
            Đặt lịch ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookingGroups.map((group) => {
            const status = STATUS_MAP[group.status] || { label: group.status, color: 'bg-gray-100 text-gray-700' };
            const canCancel = group.status === 'PENDING' || group.status === 'CONFIRMED';

            return (
              <div key={group.bookingCode} className="bg-white p-5 rounded-lg shadow">
                {/* Header: mã lịch khám + dịch vụ + trạng thái */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-400 font-mono mb-1">{group.bookingCode}</p>
                    <div className="flex flex-wrap gap-1">
                      {group.services.map((s) => (
                        <span key={s.title} className="text-sm font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
                          {s.title}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                {/* Danh sách thú cưng */}
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-2">Thú cưng ({group.pets.length})</p>
                  <div className="flex flex-wrap gap-3">
                    {group.pets.map((pet) => (
                      <div
                        key={pet.name}
                        className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2"
                      >
                        {pet.imageUrl ? (
                          <img
                            src={pet.imageUrl}
                            alt={pet.name}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <span className={`text-xl ${pet.imageUrl ? 'hidden' : ''}`}>
                          {SPECIES_EMOJI[pet.species] || '🐾'}
                        </span>
                        <span className="font-semibold text-sm text-gray-700">{pet.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chi tiết: ngày, giờ, bác sĩ, tổng giá */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-gray-600 mb-3">
                  <div>
                    <span className="text-gray-400">Ngày:</span>
                    <p className="font-semibold">
                      {new Date(group.appointmentDate).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Giờ:</span>
                    <p className="font-semibold">{group.appointmentTime}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Bác sĩ:</span>
                    <p className="font-semibold">{group.doctorName || 'Chưa phân công'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Tổng giá:</span>
                    <p className="font-bold text-rose-600">
                      {group.totalPrice.toLocaleString('vi-VN')}đ
                    </p>
                    {(group.pets.length > 1 || group.services.length > 1) && (
                      <p className="text-xs text-gray-400">
                        {group.services.length} dịch vụ x {group.pets.length} thú cưng
                      </p>
                    )}
                  </div>
                </div>

                {/* Ghi chú + Nút hủy */}
                <div className="flex items-center justify-between">
                  {group.notes ? (
                    <p className="text-sm text-gray-400 italic">"{group.notes}"</p>
                  ) : (
                    <div />
                  )}
                  {canCancel && (
                    <button
                      onClick={() => handleCancel(group)}
                      className="text-sm text-red-500 hover:text-red-700 hover:underline transition"
                    >
                      Hủy lịch
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
