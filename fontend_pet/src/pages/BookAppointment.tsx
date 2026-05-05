import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Stethoscope, CheckCircle } from 'lucide-react';

const isAbsoluteUrl = (url: string) => url.startsWith('http://') || url.startsWith('https://');
import { useAuth } from '../contexts/AuthContext';
import { appointmentApi } from '../api/appointmentApi';
import { petApi } from '../api/petApi';
import type { ServiceResponse } from '../api/appointmentApi';
import type { PetResponse } from '../api/petApi';

const SPECIES_MAP: Record<string, string> = {
  DOG: 'Chó', CAT: 'Mèo', BIRD: 'Chim',
  RABBIT: 'Thỏ', HAMSTER: 'Hamster', OTHER: 'Khác',
};

const SPECIES_EMOJI: Record<string, string> = {
  DOG: '🐕', CAT: '🐱', BIRD: '🐦',
  RABBIT: '🐰', HAMSTER: '🐹', OTHER: '🐾',
};

// Tạo danh sách giờ: 08:00 → 17:00, bước 30 phút
const TIME_SLOTS = Array.from({ length: 19 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8;
  const minute = i % 2 === 0 ? '00' : '30';
  return `${String(hour).padStart(2, '0')}:${minute}`;
});

export default function BookAppointment() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [services, setServices] = useState<ServiceResponse[]>([]);
  const [pets, setPets] = useState<PetResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form state
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [selectedPetIds, setSelectedPetIds] = useState<number[]>([]);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [servicesData, petsData] = await Promise.all([
        appointmentApi.getServices(),
        petApi.getPets(user!.id),
      ]);
      setServices(servicesData);
      setPets(petsData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle chọn dịch vụ (checkbox)
  const toggleService = (serviceId: number) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // Toggle chọn pet (checkbox)
  const togglePet = (petId: number) => {
    setSelectedPetIds((prev) =>
      prev.includes(petId)
        ? prev.filter((id) => id !== petId)
        : [...prev, petId]
    );
  };

  // Tính tổng tiền
  const selectedServices = services.filter((s) => selectedServiceIds.includes(s.id));
  const totalServicePrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalPrice = totalServicePrice * selectedPetIds.length;

  // Ngày tối thiểu = ngày mai
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate
    if (selectedServiceIds.length === 0) { setError('Vui lòng chọn ít nhất 1 dịch vụ'); return; }
    if (selectedPetIds.length === 0) { setError('Vui lòng chọn ít nhất 1 thú cưng'); return; }
    if (!appointmentDate) { setError('Vui lòng chọn ngày khám'); return; }
    if (!appointmentTime) { setError('Vui lòng chọn giờ khám'); return; }

    setSubmitting(true);
    setError('');

    try {
      await appointmentApi.createAppointments({
        userId: user.id,
        petIds: selectedPetIds,
        serviceIds: selectedServiceIds,
        appointmentDate,
        appointmentTime,
        notes,
      });
      setSuccess(true);
    window.scrollTo({top: 0, behavior: 'smooth'});
    } catch (err) {
      console.error('Failed to book:', err);
      setError('Không thể đặt lịch. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  // Chưa đăng nhập
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">Vui lòng đăng nhập để đặt lịch</p>
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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white p-10 rounded-xl shadow-lg max-w-sm w-full">
          <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Đặt lịch thành công!</h2>
          <p className="text-gray-500 mb-6">Lịch khám của bạn đã được ghi nhận. Chúng tôi sẽ xác nhận sớm nhất có thể.</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/appointments')}
              className="w-full bg-sky-600 text-white py-2 rounded-lg font-semibold hover:bg-sky-700 transition"
            >
              Xem lịch khám của tôi
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full border border-gray-300 text-gray-600 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/" className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-800 mb-6">
        <ArrowLeft size={20} /> Trang chủ
      </Link>

      <h1 className="text-3xl font-bold text-gray-800 mb-8">Đặt lịch khám</h1>

      {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-6">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-5 gap-8">
          {/* Form chính - 3 cột */}
          <div className="md:col-span-3 space-y-6">

            {/* 1. Chọn dịch vụ */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Stethoscope size={20} /> Chọn dịch vụ
              </h2>
              <div className="space-y-3">
                {services.map((service) => {
                  const isSelected = selectedServiceIds.includes(service.id);
                  return (
                    <label
                      key={service.id}
                      className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50 shadow-sm'
                          : 'border-gray-200 hover:border-sky-300 hover:shadow-sm'
                      }`}
                    >
                      {/* Checkbox ẩn — cả card là vùng click */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleService(service.id)}
                        className="sr-only"
                      />

                      {/* Ảnh lớn hơn, bo góc vuông */}
                      {service.imageUrl && isAbsoluteUrl(service.imageUrl) ? (
                        <img
                          src={service.imageUrl}
                          alt={service.title}
                          className="w-16 h-16 rounded-xl object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                          <Stethoscope size={24} className="text-sky-400" />
                        </div>
                      )}

                      {/* Nội dung */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800">{service.title}</p>
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{service.description}</p>
                        <p className="text-xs text-gray-400 mt-1">{service.duration} phút</p>
                      </div>

                      {/* Giá + dấu tick khi chọn */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="font-bold text-rose-600 text-base">
                          {service.price.toLocaleString('vi-VN')}đ
                        </span>
                        <CheckCircle
                          size={20}
                          className={`transition-all ${isSelected ? 'text-sky-500 opacity-100' : 'text-gray-300 opacity-60'}`}
                        />
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 2. Chọn thú cưng */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Chọn thú cưng</h2>
              {pets.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-2">Chưa có thú cưng nào</p>
                  <Link to="/my-pets" className="text-sky-600 hover:underline text-sm">
                    Thêm thú cưng
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {pets.map((pet) => (
                    <label
                      key={pet.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition ${
                        selectedPetIds.includes(pet.id) ? 'border-sky-500 bg-sky-50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPetIds.includes(pet.id)}
                        onChange={() => togglePet(pet.id)}
                        className="text-sky-600 rounded"
                      />
                      {pet.imageUrl ? (
                        <img
                          src={pet.imageUrl}
                          alt={pet.name}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-2xl">{SPECIES_EMOJI[pet.species] || '🐾'}</span>
                      )}
                      <div>
                        <p className="font-semibold">{pet.name}</p>
                        <p className="text-sm text-gray-500">
                          {SPECIES_MAP[pet.species] || pet.species}
                          {pet.breed ? ` - ${pet.breed}` : ''}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Chọn ngày giờ */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar size={20} /> Chọn ngày giờ
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-1 text-sm font-semibold">Ngày khám *</label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    min={minDate}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1 text-sm font-semibold">Giờ khám *</label>
                  <select
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  >
                    <option value="">-- Chọn giờ --</option>
                    {TIME_SLOTS.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 4. Ghi chú */}
            <div className="bg-white p-6 rounded-lg shadow">
              <label className="block text-gray-700 mb-1 text-sm font-semibold">Ghi chú</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Triệu chứng, yêu cầu đặc biệt... (không bắt buộc)"
              />
            </div>
          </div>

          {/* Tóm tắt - 2 cột */}
          <div className="md:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow sticky top-24">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Tóm tắt đặt lịch</h2>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Dịch vụ ({selectedServiceIds.length}):</span>
                  {selectedServices.length > 0 ? (
                    <div className="mt-1 space-y-1">
                      {selectedServices.map((s) => (
                        <div key={s.id} className="flex justify-between">
                          <span className="font-semibold">{s.title}</span>
                          <span className="text-rose-600">{s.price.toLocaleString('vi-VN')}đ</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="ml-1 font-semibold">—</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Số thú cưng:</span>
                  <span className="font-semibold">{selectedPetIds.length}</span>
                </div>
                {selectedPetIds.length > 0 && (
                  <div className="text-gray-500">
                    {pets.filter((p) => selectedPetIds.includes(p.id)).map((p) => (
                      <span key={p.id} className="inline-block bg-gray-100 px-2 py-1 rounded mr-1 mb-1 text-xs">
                        {SPECIES_EMOJI[p.species]} {p.name}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Ngày:</span>
                  <span className="font-semibold">
                    {appointmentDate
                      ? new Date(appointmentDate).toLocaleDateString('vi-VN')
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Giờ:</span>
                  <span className="font-semibold">{appointmentTime || '—'}</span>
                </div>
                {selectedServices.length > 0 && selectedPetIds.length > 0 && (
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>({totalServicePrice.toLocaleString('vi-VN')}đ/dịch vụ) x {selectedPetIds.length} thú cưng</span>
                  </div>
                )}
              </div>

              <div className="border-t mt-4 pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng cộng:</span>
                  <span className="text-rose-600">{totalPrice.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-4 bg-sky-600 text-white py-3 rounded-lg font-semibold hover:bg-sky-700 transition disabled:opacity-50"
              >
                {submitting ? 'Đang đặt lịch...' : 'Xác nhận đặt lịch'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
