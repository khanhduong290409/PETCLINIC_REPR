import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Stethoscope } from 'lucide-react';
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

  // Form state
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
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

  // Toggle chọn pet (checkbox)
  const togglePet = (petId: number) => {
    setSelectedPetIds((prev) =>
      prev.includes(petId)
        ? prev.filter((id) => id !== petId)
        : [...prev, petId]
    );
  };

  // Tính tổng tiền
  const selectedService = services.find((s) => s.id === selectedServiceId);
  const totalPrice = selectedService ? selectedService.price * selectedPetIds.length : 0;

  // Ngày tối thiểu = ngày mai
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate
    if (!selectedServiceId) { setError('Vui lòng chọn dịch vụ'); return; }
    if (selectedPetIds.length === 0) { setError('Vui lòng chọn ít nhất 1 thú cưng'); return; }
    if (!appointmentDate) { setError('Vui lòng chọn ngày khám'); return; }
    if (!appointmentTime) { setError('Vui lòng chọn giờ khám'); return; }

    setSubmitting(true);
    setError('');

    try {
      await appointmentApi.createAppointments({
        userId: user.id,
        petIds: selectedPetIds,
        serviceId: selectedServiceId,
        appointmentDate,
        appointmentTime,
        notes,
      });
      navigate('/appointments');
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
                {services.map((service) => (
                  <label
                    key={service.id}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition ${
                      selectedServiceId === service.id ? 'border-sky-500 bg-sky-50' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="service"
                      value={service.id}
                      checked={selectedServiceId === service.id}
                      onChange={() => setSelectedServiceId(service.id)}
                      className="text-sky-600"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{service.title}</p>
                      <p className="text-sm text-gray-500">{service.description}</p>
                      <p className="text-sm text-gray-400">{service.duration} phút</p>
                    </div>
                    <span className="font-bold text-rose-600">
                      {service.price.toLocaleString('vi-VN')}đ
                    </span>
                  </label>
                ))}
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
                <div className="flex justify-between">
                  <span className="text-gray-500">Dịch vụ:</span>
                  <span className="font-semibold">{selectedService?.title || '—'}</span>
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
                {selectedService && (
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Đơn giá:</span>
                    <span>{selectedService.price.toLocaleString('vi-VN')}đ x {selectedPetIds.length}</span>
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
