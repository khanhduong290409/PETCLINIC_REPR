import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Calendar,
  Clock,
  Wallet,
  User,
  PawPrint,
  Sparkles,
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  FileText,
  Check,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { doctorApi } from '../../api/doctorApi';
import type { DoctorAppointment } from '../../api/doctorApi';

const DEFAULT_PET_IMAGES: Record<string, string> = {
  DOG: '/assets/default-dog.svg',
  CAT: '/assets/default-cat.svg',
  BIRD: '/assets/default-bird.svg',
  RABBIT: '/assets/default-rabbit.svg',
  HAMSTER: '/assets/default-hamster.svg',
  OTHER: '/assets/default-pet.svg',
};

const STATUS_MAP: Record<
  string,
  { label: string; badge: string; bar: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: 'Chờ xác nhận',
    badge: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
    bar: 'bg-amber-400',
    icon: <AlertCircle size={14} />,
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    badge: 'bg-sky-100 text-sky-700 ring-1 ring-sky-200',
    bar: 'bg-sky-500',
    icon: <CalendarCheck size={14} />,
  },
  COMPLETED: {
    label: 'Hoàn thành',
    badge: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
    bar: 'bg-emerald-500',
    icon: <CheckCircle2 size={14} />,
  },
  CANCELLED: {
    label: 'Đã hủy',
    badge: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200',
    bar: 'bg-rose-400',
    icon: <XCircle size={14} />,
  },
};

const STATUS_FLOW = ['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const;
type StatusKey = (typeof STATUS_FLOW)[number];

// Kiểu dữ liệu sau khi group
interface BookingGroup {
  bookingCode: string;
  services: { title: string; price: number }[];
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
  const { showToast } = useToast();

  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<StatusKey>('ALL');
  const [completing, setCompleting] = useState<string | null>(null); // bookingCode đang xử lý
  const [confirmGroup, setConfirmGroup] = useState<BookingGroup | null>(null); // group đang chờ xác nhận trong modal

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

  // Người dùng đã bấm xác nhận trong modal → gọi API
  const handleComplete = async (group: BookingGroup) => {
    setCompleting(group.bookingCode);
    try {
      // Dùng id của pet đầu tiên (= appointmentId) để backend tìm bookingCode
      await doctorApi.completeAppointment(group.pets[0].id, user!.id);
      // Reload lại danh sách để cập nhật trạng thái
      await loadAppointments();
      setConfirmGroup(null);
      showToast('Đã xác nhận hoàn thành lịch khám', 'success');
    } catch (err) {
      console.error(err);
      showToast('Không thể cập nhật. Thử lại.', 'error');
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

      const services = first.services.map((s) => ({ title: s.title, price: s.price }));
      const totalPrice = services.reduce((sum, s) => sum + s.price, 0) * items.length;

      return {
        bookingCode,
        services,
        appointmentDate: first.appointmentDate,
        appointmentTime: first.appointmentTime,
        ownerName: first.ownerName,
        status: first.status,
        notes: first.notes,
        totalPrice,
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

  // Đếm theo từng trạng thái (cho stats + filter pills)
  const counts = useMemo(() => {
    const c = { total: 0, today: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    for (const g of bookingGroups) {
      c.total++;
      if (g.appointmentDate === today) c.today++;
      if (g.status === 'PENDING') c.pending++;
      else if (g.status === 'CONFIRMED') c.confirmed++;
      else if (g.status === 'COMPLETED') c.completed++;
      else if (g.status === 'CANCELLED') c.cancelled++;
    }
    return c;
  }, [bookingGroups, today]);

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

  const FILTER_TABS: { key: StatusKey; label: string; count: number }[] = [
    { key: 'ALL', label: 'Tất cả', count: counts.total },
    { key: 'PENDING', label: 'Chờ xác nhận', count: counts.pending },
    { key: 'CONFIRMED', label: 'Đã xác nhận', count: counts.confirmed },
    { key: 'COMPLETED', label: 'Hoàn thành', count: counts.completed },
    { key: 'CANCELLED', label: 'Đã hủy', count: counts.cancelled },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/60 via-white to-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 p-6 md:p-8 mb-6 shadow-lg">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -left-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/20 backdrop-blur items-center justify-center ring-1 ring-white/30">
                <Stethoscope size={28} className="text-white" />
              </div>
              <div>
                <p className="text-sky-100 text-sm font-medium tracking-wide uppercase">
                  Phòng khám
                </p>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Lịch khám của tôi</h1>
                <p className="text-sky-100 text-sm mt-1">
                  Xin chào, <span className="font-semibold text-white">BS. {user?.fullName}</span>
                  {counts.today > 0 ? (
                    <> — Hôm nay có <span className="font-semibold text-white">{counts.today}</span> lượt khám</>
                  ) : (
                    <> — Hôm nay không có lịch khám</>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <StatCard label="Tổng lịch" value={counts.total} icon={<Calendar size={18} />} />
            <StatCard label="Hôm nay" value={counts.today} icon={<Sparkles size={18} />} />
            <StatCard label="Cần khám" value={counts.confirmed} icon={<CalendarCheck size={18} />} />
            <StatCard label="Đã hoàn thành" value={counts.completed} icon={<CheckCircle2 size={18} />} />
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
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

        {/* Danh sách lịch khám đã group */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 py-16 px-6 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-sky-50 flex items-center justify-center">
              <Calendar size={36} className="text-sky-500" />
            </div>
            <p className="text-gray-700 text-lg font-semibold mb-1">Không có lịch khám nào</p>
            <p className="text-gray-500 text-sm">
              {filterStatus === 'ALL'
                ? 'Bạn chưa được phân công lịch khám'
                : 'Thử chọn trạng thái khác'}
            </p>
            {filterStatus !== 'ALL' && (
              <button
                onClick={() => setFilterStatus('ALL')}
                className="mt-4 text-sm font-semibold text-sky-600 hover:underline"
              >
                Xem tất cả
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((group) => {
              const status = STATUS_MAP[group.status] || {
                label: group.status,
                badge: 'bg-gray-100 text-gray-700',
                bar: 'bg-gray-300',
                icon: <AlertCircle size={14} />,
              };
              const isToday = group.appointmentDate === today;
              const showActions = group.status === 'CONFIRMED' || group.status === 'COMPLETED';

              return (
                <div
                  key={group.bookingCode}
                  className="relative bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 hover:shadow-md transition overflow-hidden"
                >
                  {/* Thanh màu trạng thái bên trái */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${status.bar}`} />

                  <div className="p-5 md:p-6 pl-6 md:pl-7">
                    {/* Header: code + services + status */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400 font-mono mb-1.5">#{group.bookingCode}</p>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {group.services.map((s) => (
                            <span
                              key={s.title}
                              className="inline-flex items-center gap-1 text-sm font-semibold text-sky-700 bg-sky-50 ring-1 ring-sky-100 px-2.5 py-1 rounded-lg"
                            >
                              <Sparkles size={12} />
                              {s.title}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-gray-600 inline-flex items-center gap-1.5">
                          <User size={14} className="text-gray-400" />
                          Chủ: <span className="font-semibold text-gray-800">{group.ownerName}</span>
                        </p>
                      </div>
                      <span
                        className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${status.badge}`}
                      >
                        {status.icon}
                        {status.label}
                      </span>
                    </div>

                    {/* Danh sách thú cưng */}
                    <div className="mb-4">
                      <p className="text-xs uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1.5">
                        <PawPrint size={12} /> Thú cưng cần khám ({group.pets.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {group.pets.map((pet) => (
                          <div
                            key={pet.id}
                            className="flex items-center gap-2 bg-gradient-to-r from-gray-50 to-white ring-1 ring-gray-200 rounded-xl pl-1 pr-3 py-1"
                          >
                            <img
                              src={pet.imageUrl || DEFAULT_PET_IMAGES[pet.species] || DEFAULT_PET_IMAGES.OTHER}
                              alt={pet.name}
                              className="w-9 h-9 rounded-lg object-cover bg-white ring-1 ring-gray-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  DEFAULT_PET_IMAGES[pet.species] || DEFAULT_PET_IMAGES.OTHER;
                              }}
                            />
                            <span className="font-semibold text-sm text-gray-700">{pet.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Info grid: ngày + giờ + tổng phí */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                      <InfoBox
                        icon={<Calendar size={16} className="text-sky-600" />}
                        label="Ngày khám"
                        value={new Date(group.appointmentDate).toLocaleDateString('vi-VN')}
                        badge={isToday ? 'Hôm nay' : undefined}
                      />
                      <InfoBox
                        icon={<Clock size={16} className="text-sky-600" />}
                        label="Giờ khám"
                        value={group.appointmentTime}
                      />
                      <InfoBox
                        icon={<Wallet size={16} className="text-rose-600" />}
                        label="Tổng phí"
                        value={`${group.totalPrice.toLocaleString('vi-VN')}đ`}
                        valueClass="text-rose-600 font-bold"
                        hint={
                          group.pets.length > 1
                            ? `${(group.totalPrice / group.pets.length).toLocaleString('vi-VN')}đ × ${group.pets.length}`
                            : undefined
                        }
                      />
                    </div>

                    {/* Ghi chú của chủ */}
                    {group.notes && (
                      <div className="bg-amber-50/60 ring-1 ring-amber-100 rounded-lg px-3 py-2 mb-4 flex items-start gap-2">
                        <FileText size={14} className="text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800">
                          <span className="font-semibold">Ghi chú của chủ: </span>
                          <span className="italic">"{group.notes}"</span>
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    {showActions && (
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => navigate(`/doctor/medical/${group.bookingCode}`)}
                          className="inline-flex items-center gap-1.5 bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-sky-700 transition shadow-sm"
                        >
                          <FileText size={14} /> Ghi bệnh án
                        </button>
                        {group.status === 'CONFIRMED' && (
                          <button
                            onClick={() => setConfirmGroup(group)}
                            disabled={completing === group.bookingCode}
                            className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
                          >
                            <Check size={14} />
                            {completing === group.bookingCode ? 'Đang xử lý...' : 'Xác nhận đã khám xong'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal xác nhận đã khám xong */}
      {confirmGroup && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => {
            // Đang xử lý thì không cho đóng bằng click overlay
            if (completing === confirmGroup.bookingCode) return;
            setConfirmGroup(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Xác nhận đã khám xong</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Mã lịch khám <span className="font-mono">#{confirmGroup.bookingCode}</span>
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-700 mb-5">
              Bạn xác nhận đã khám xong cho{' '}
              <span className="font-semibold">{confirmGroup.pets.length} thú cưng</span>{' '}
              của chủ <span className="font-semibold">{confirmGroup.ownerName}</span>?
              <br />
              Lịch khám sẽ chuyển sang trạng thái Hoàn thành.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmGroup(null)}
                disabled={completing === confirmGroup.bookingCode}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={() => handleComplete(confirmGroup)}
                disabled={completing === confirmGroup.bookingCode}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition disabled:opacity-50"
              >
                <Check size={14} />
                {completing === confirmGroup.bookingCode ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Ô thống kê trên header
function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white/15 backdrop-blur ring-1 ring-white/25 rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-2 text-sky-50 text-xs font-medium">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
    </div>
  );
}

// Filter pill
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

// Ô thông tin trong card
function InfoBox({
  icon,
  label,
  value,
  valueClass,
  hint,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
  hint?: string;
  badge?: string;
}) {
  return (
    <div className="bg-gray-50/70 ring-1 ring-gray-100 rounded-lg px-3 py-2">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-0.5">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <p className={`text-sm font-semibold text-gray-800 ${valueClass || ''}`}>{value}</p>
        {badge && (
          <span className="text-[10px] font-bold bg-sky-100 text-sky-700 ring-1 ring-sky-200 px-1.5 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      {hint && <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}
