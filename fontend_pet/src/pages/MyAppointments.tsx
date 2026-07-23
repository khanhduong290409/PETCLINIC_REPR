import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Plus,
  FileText,
  X,
  Clock,
  Stethoscope,
  Wallet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarCheck,
  PawPrint,
  Sparkles,
  Star,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { appointmentApi } from '../api/appointmentApi';
import { reviewApi } from '../api/reviewApi';
import type { AppointmentResponse } from '../api/appointmentApi';
import type { ReviewRequest } from '../api/reviewApi';

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

const DEFAULT_PET_IMAGES: Record<string, string> = {
  DOG: '/assets/default-dog.svg',
  CAT: '/assets/default-cat.svg',
  BIRD: '/assets/default-bird.svg',
  RABBIT: '/assets/default-rabbit.svg',
  HAMSTER: '/assets/default-hamster.svg',
  OTHER: '/assets/default-pet.svg',
};

type FilterKey = 'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED';

interface BookingGroup {
  bookingCode: string;
  services: { title: string; price: number }[];
  appointmentDate: string;
  appointmentTime: string;
  doctorName: string | null;
  status: string;
  notes: string;
  totalPrice: number;
  pets: { name: string; species: string; imageUrl: string }[];
  firstAppointmentId: number;
}

export default function MyAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('ALL');

  // State cho modal đánh giá
  const [reviewModal, setReviewModal] = useState<{ bookingCode: string } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewedCodes, setReviewedCodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchAppointments();
      fetchReviewedCodes();
    }
  }, [user]);

  const fetchReviewedCodes = async () => {
    if (!user) return;
    try {
      const codes = await reviewApi.getReviewedBookingCodes(user.id);
      setReviewedCodes(new Set(codes));
    } catch (err) {
      console.error('Failed to fetch reviewed codes:', err);
    }
  };

  const openReviewModal = (bookingCode: string) => {
    setReviewModal({ bookingCode });
    setReviewRating(5);
    setReviewComment('');
  };

  const closeReviewModal = () => {
    setReviewModal(null);
    setReviewRating(5);
    setReviewComment('');
  };

  const handleSubmitReview = async () => {
    if (!user || !reviewModal) return;
    setReviewSubmitting(true);
    try {
      const data: ReviewRequest = {
        userId: user.id,
        bookingCode: reviewModal.bookingCode,
        rating: reviewRating,
        comment: reviewComment,
      };
      await reviewApi.createReview(data);
      setReviewedCodes((prev) => new Set([...prev, reviewModal.bookingCode]));
      closeReviewModal();
    } catch (err) {
      console.error('Failed to submit review:', err);
      alert('Không thể gửi đánh giá. Vui lòng thử lại.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const fetchAppointments = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await appointmentApi.getAppointments();
      setAppointments(data);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const bookingGroups: BookingGroup[] = useMemo(() => {
    const map = new Map<string, AppointmentResponse[]>();
    for (const apt of appointments) {
      if (!map.has(apt.bookingCode)) map.set(apt.bookingCode, []);
      map.get(apt.bookingCode)!.push(apt);
    }

    return Array.from(map.entries()).map(([bookingCode, items]) => {
      const first = items[0];
      const pets = items.map((item) => ({
        name: item.petName,
        species: item.petSpecies,
        imageUrl: item.petImageUrl,
      }));
      const services = first.services.map((s) => ({ title: s.title, price: s.price }));
      const totalPrice = services.reduce((sum, s) => sum + s.price, 0) * pets.length;

      return {
        bookingCode,
        services,
        appointmentDate: first.appointmentDate,
        appointmentTime: first.appointmentTime,
        doctorName: first.doctorName,
        status: first.status,
        notes: first.notes,
        totalPrice,
        pets,
        firstAppointmentId: first.id,
      };
    });
  }, [appointments]);

  // Đếm theo từng trạng thái để hiển thị ô thống kê + filter tabs
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

  const filteredGroups = useMemo(() => {
    if (filter === 'ALL') return bookingGroups;
    if (filter === 'UPCOMING')
      return bookingGroups.filter((g) => g.status === 'PENDING' || g.status === 'CONFIRMED');
    if (filter === 'COMPLETED') return bookingGroups.filter((g) => g.status === 'COMPLETED');
    if (filter === 'CANCELLED') return bookingGroups.filter((g) => g.status === 'CANCELLED');
    return bookingGroups;
  }, [bookingGroups, filter]);

  const handleCancel = async (group: BookingGroup) => {
    if (!user) return;
    const petNames = group.pets.map((p) => p.name).join(', ');
    if (!confirm(`Bạn có chắc muốn hủy lịch khám cho ${petNames}?`)) return;

    try {
      await appointmentApi.cancelAppointment(group.firstAppointmentId);
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
          <Link to="/login" className="bg-sky-600 text-white px-6 py-2 rounded-lg">
            Đăng nhập
          </Link>
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

  const FILTER_TABS: { key: FilterKey; label: string; count: number }[] = [
    { key: 'ALL', label: 'Tất cả', count: counts.total },
    { key: 'UPCOMING', label: 'Sắp tới', count: counts.pending + counts.confirmed },
    { key: 'COMPLETED', label: 'Hoàn thành', count: counts.completed },
    { key: 'CANCELLED', label: 'Đã hủy', count: counts.cancelled },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/60 via-white to-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header gradient + thống kê */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 p-6 md:p-8 mb-6 shadow-lg">
          {/* Decoration */}
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -left-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/20 backdrop-blur items-center justify-center ring-1 ring-white/30">
                <Calendar size={28} className="text-white" />
              </div>
              <div>
                <p className="text-sky-100 text-sm font-medium tracking-wide uppercase">
                  Quản lý lịch khám
                </p>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Lịch khám của tôi</h1>
                <p className="text-sky-100 text-sm mt-1">
                  Theo dõi và quản lý tất cả lịch khám cho thú cưng của bạn
                </p>
              </div>
            </div>
            <Link
              to="/book-appointment"
              className="inline-flex items-center gap-2 bg-white text-sky-700 px-5 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-xl hover:-translate-y-0.5 transition"
            >
              <Plus size={20} /> Đặt lịch mới
            </Link>
          </div>

          {/* Stats */}
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <StatCard
              label="Tổng lịch"
              value={counts.total}
              icon={<Calendar size={18} />}
            />
            <StatCard
              label="Chờ xác nhận"
              value={counts.pending}
              icon={<AlertCircle size={18} />}
            />
            <StatCard
              label="Đã xác nhận"
              value={counts.confirmed}
              icon={<CalendarCheck size={18} />}
            />
            <StatCard
              label="Hoàn thành"
              value={counts.completed}
              icon={<CheckCircle2 size={18} />}
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {FILTER_TABS.map((tab) => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap ${
                  active
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-sky-50 hover:text-sky-700'
                }`}
              >
                {tab.label}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    active ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Danh sách */}
        {filteredGroups.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 py-16 px-6 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-sky-50 flex items-center justify-center">
              <Calendar size={36} className="text-sky-500" />
            </div>
            <p className="text-gray-700 text-lg font-semibold mb-1">
              {filter === 'ALL'
                ? 'Chưa có lịch khám nào'
                : 'Không có lịch khám phù hợp'}
            </p>
            <p className="text-gray-500 text-sm mb-5">
              Hãy đặt lịch để chăm sóc thú cưng của bạn ngay hôm nay
            </p>
            <Link
              to="/book-appointment"
              className="inline-flex items-center gap-2 bg-sky-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-sky-700 transition shadow"
            >
              <Plus size={18} /> Đặt lịch ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGroups.map((group) => {
              const status =
                STATUS_MAP[group.status] || {
                  label: group.status,
                  badge: 'bg-gray-100 text-gray-700',
                  bar: 'bg-gray-300',
                  icon: <AlertCircle size={14} />,
                };
              const canCancel = group.status === 'PENDING' || group.status === 'CONFIRMED';

              return (
                <div
                  key={group.bookingCode}
                  className="relative bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 hover:shadow-md transition overflow-hidden"
                >
                  {/* Thanh màu trạng thái bên trái */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${status.bar}`} />

                  <div className="p-5 md:p-6 pl-6 md:pl-7">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400 font-mono mb-1.5">
                          #{group.bookingCode}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
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
                        <PawPrint size={12} /> Thú cưng ({group.pets.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {group.pets.map((pet, idx) => (
                          <div
                            key={`${pet.name}-${idx}`}
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

                    {/* Chi tiết */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                      <InfoBox
                        icon={<Calendar size={16} className="text-sky-600" />}
                        label="Ngày khám"
                        value={new Date(group.appointmentDate).toLocaleDateString('vi-VN')}
                      />
                      <InfoBox
                        icon={<Clock size={16} className="text-sky-600" />}
                        label="Giờ khám"
                        value={group.appointmentTime}
                      />
                      <InfoBox
                        icon={<Stethoscope size={16} className="text-sky-600" />}
                        label="Bác sĩ"
                        value={group.doctorName || 'Chưa phân công'}
                      />
                      <InfoBox
                        icon={<Wallet size={16} className="text-rose-600" />}
                        label="Tổng giá"
                        value={`${group.totalPrice.toLocaleString('vi-VN')}đ`}
                        valueClass="text-rose-600 font-bold"
                        hint={
                          group.pets.length > 1 || group.services.length > 1
                            ? `${group.services.length} dịch vụ × ${group.pets.length} thú cưng`
                            : undefined
                        }
                      />
                    </div>

                    {/* Notes */}
                    {group.notes && (
                      <div className="bg-amber-50/60 ring-1 ring-amber-100 rounded-lg px-3 py-2 mb-4">
                        <p className="text-sm text-amber-800 italic">"{group.notes}"</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-gray-100">
                      {group.status === 'COMPLETED' && (
                        <Link
                          to={`/appointments/${group.bookingCode}/records`}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition"
                        >
                          <FileText size={14} /> Xem bệnh án
                        </Link>
                      )}
                      {group.status === 'COMPLETED' &&
                        (reviewedCodes.has(group.bookingCode) ? (
                          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
                            <CheckCircle2 size={14} /> Đã đánh giá
                          </span>
                        ) : (
                          <button
                            onClick={() => openReviewModal(group.bookingCode)}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition"
                          >
                            <Star size={14} /> Đánh giá
                          </button>
                        ))}
                      {canCancel && (
                        <button
                          onClick={() => handleCancel(group)}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition"
                        >
                          <X size={14} /> Hủy lịch
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal đánh giá */}
        {reviewModal && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={closeReviewModal} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-lg font-bold text-gray-800">Đánh giá lịch khám</h2>
                  <button
                    onClick={closeReviewModal}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2 font-semibold">Mức độ hài lòng</p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className={`transition ${
                            star <= reviewRating ? 'text-amber-400' : 'text-gray-300'
                          }`}
                        >
                          <Star size={28} fill="currentColor" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 font-semibold block">
                      Nhận xét
                    </label>
                    <textarea
                      rows={4}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Chia sẻ trải nghiệm của bạn..."
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={closeReviewModal}
                      className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition text-sm"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSubmitReview}
                      disabled={reviewSubmitting || !reviewComment.trim()}
                      className="flex-1 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition disabled:opacity-50 text-sm"
                    >
                      {reviewSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
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

// Ô thông tin trong card
function InfoBox({
  icon,
  label,
  value,
  valueClass,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
  hint?: string;
}) {
  return (
    <div className="bg-gray-50/70 ring-1 ring-gray-100 rounded-lg px-3 py-2">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-0.5">
        {icon}
        <span>{label}</span>
      </div>
      <p className={`text-sm font-semibold text-gray-800 ${valueClass || ''}`}>{value}</p>
      {hint && <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}
