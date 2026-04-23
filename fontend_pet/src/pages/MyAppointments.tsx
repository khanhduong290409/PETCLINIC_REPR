import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Plus, FileText, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { appointmentApi } from '../api/appointmentApi';
import { reviewApi } from '../api/reviewApi';
import type { AppointmentResponse } from '../api/appointmentApi';
import type { ReviewRequest } from '../api/reviewApi';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-700' },
};

const DEFAULT_PET_IMAGES: Record<string, string> = {
  DOG: '/assets/default-dog.svg',
  CAT: '/assets/default-cat.svg',
  BIRD: '/assets/default-bird.svg',
  RABBIT: '/assets/default-rabbit.svg',
  HAMSTER: '/assets/default-hamster.svg',
  OTHER: '/assets/default-pet.svg',
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
  pets: { name: string; species: string; imageUrl: string }[];
  firstAppointmentId: number;
}

export default function MyAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // State cho modal đánh giá
  const [reviewModal, setReviewModal] = useState<{ bookingCode: string } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewedCodes, setReviewedCodes] = useState<Set<string>>(new Set());// tậpcác bookingcode đã được user đánh giá rồi

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
      setReviewedCodes(new Set(codes)); // lấy tập bookingcode từ reviewrepo ( tức là đã đánh giá rồi )
    } catch (err) { // và là tập bookingcode ko trùng phần tử nên ko cần đưa vào tập set ( đưa vào vì chỉ để chắc chắn )
      console.error('Failed to fetch reviewed codes:', err);
    }
  };

  const openReviewModal = (bookingCode: string) => {
    setReviewModal({ bookingCode });
    setReviewRating(5);
    setReviewComment('');
  }; // set viewmodal khi user mở lên ( user chưa đánh giá )

  const closeReviewModal = () => {
    setReviewModal(null); // cần set lại null
    setReviewRating(5);
    setReviewComment('');
  };

  const handleSubmitReview = async () => {
    if (!user || !reviewModal) return; // check
    setReviewSubmitting(true); // set để disable nút submit tránh submit 2 lần trong khi hàm submit đang thực thi
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
      const data = await appointmentApi.getAppointments(user.id);
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
                {/* Header */}
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
                      <div key={pet.name} className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2">
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
                        ) :
                        <img
                        src = {DEFAULT_PET_IMAGES[pet.species]}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                        /> 
                        }
                        {/* <span className={`text-xl ${pet.imageUrl ? 'hidden' : ''}`}>
                          {SPECIES_EMOJI[pet.species] || '🐾'}
                        </span> */}
                        <span className="font-semibold text-sm text-gray-700">{pet.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chi tiết */}
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

                {/* Actions */}
                <div className="flex items-center justify-between">
                  {group.notes ? (
                    <p className="text-sm text-gray-400 italic">"{group.notes}"</p>
                  ) : (
                    <div />
                  )}
                  <div className="flex items-center gap-3">
                    {group.status === 'COMPLETED' && (
                      <Link
                        to={`/appointments/${group.bookingCode}/records`}
                        className="flex items-center gap-1 text-sm text-sky-600 hover:text-sky-800 hover:underline transition"
                      >
                        <FileText size={14} /> Xem bệnh án
                      </Link>
                    )}
                    {group.status === 'COMPLETED' && (
                      reviewedCodes.has(group.bookingCode) ? (
                        <span className="text-sm text-green-600 font-medium">✓ Đã đánh giá</span>
                      ) : (
                        <button
                          onClick={() => openReviewModal(group.bookingCode)}
                          className="text-sm text-amber-500 hover:text-amber-700 hover:underline transition"
                        >
                          ⭐ Đánh giá
                        </button>
                      )
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
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-bold text-gray-800">Đánh giá lịch khám</h2>
                <button onClick={closeReviewModal} className="p-1 hover:bg-gray-100 rounded-full">
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
                        className={`text-3xl transition ${star <= reviewRating ? 'text-amber-400' : 'text-gray-300'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 font-semibold block">Nhận xét</label>
                  <textarea
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Chia sẻ trải nghiệm của bạn..."
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={closeReviewModal} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition text-sm">
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
  );
}
