import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Stethoscope,
  CheckCircle,
  Clock,
  PawPrint,
  StickyNote,
  Wallet,
  AlertCircle,
} from 'lucide-react';

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

// const SPECIES_EMOJI: Record<string, string> = {
//   DOG: '🐕', CAT: '🐱', BIRD: '🐦',
//   RABBIT: '🐰', HAMSTER: '🐹', OTHER: '🐾',
// };

const DEFAULT_PET_IMAGES: Record<string, string> = {
  DOG: '/assets/default-dog.svg',
  CAT: '/assets/default-cat.svg',
  BIRD: '/assets/default-bird.svg',
  RABBIT: '/assets/default-rabbit.svg',
  HAMSTER: '/assets/default-hamster.svg',
  OTHER: '/assets/default-pet.svg',
};

const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

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

  // 7 ngày tới (từ ngày mai) cho quick-pick chips
  const quickDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + 1 + i);
    const iso = d.toISOString().split('T')[0];
    const label =
      i === 0 ? 'Ngày mai' : `${DAY_NAMES[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
    return { iso, label };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate
    if (!user.phone) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setError('Vui lòng cập nhật số điện thoại trước khi đặt lịch'); return;
    }
    if (selectedServiceIds.length === 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setError('Vui lòng chọn ít nhất 1 dịch vụ'); return;
    }
    if (selectedPetIds.length === 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setError('Vui lòng chọn ít nhất 1 thú cưng'); return;
    }
    if (!appointmentDate) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setError('Vui lòng chọn ngày khám'); return;
    }
    if (!appointmentTime) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setError('Vui lòng chọn giờ khám'); return;
    }

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
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-50/60 via-white to-white px-4">
        <div className="text-center bg-white p-10 rounded-2xl shadow-lg max-w-sm w-full ring-1 ring-gray-100">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
            <CheckCircle size={48} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Đặt lịch thành công!</h2>
          <p className="text-gray-500 mb-6">Lịch khám của bạn đã được ghi nhận. Chúng tôi sẽ xác nhận sớm nhất có thể.</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/appointments')}
              className="w-full bg-sky-600 text-white py-2.5 rounded-xl font-semibold hover:bg-sky-700 transition"
            >
              Xem lịch khám của tôi
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full border border-gray-300 text-gray-600 py-2.5 rounded-xl hover:bg-gray-50 transition"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Bước nào đã hoàn thành — để hiển thị trên step indicator + summary
  const stepDone = {
    service: selectedServiceIds.length > 0,
    pet: selectedPetIds.length > 0,
    date: !!appointmentDate && !!appointmentTime,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/60 via-white to-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 p-6 md:p-8 mb-6 shadow-lg">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -left-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

          <div className="relative">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sky-100 hover:text-white text-sm mb-3 transition"
            >
              <ArrowLeft size={16} /> Trang chủ
            </Link>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/20 backdrop-blur items-center justify-center ring-1 ring-white/30">
                  <Calendar size={28} className="text-white" />
                </div>
                <div>
                  <p className="text-sky-100 text-sm font-medium tracking-wide uppercase">
                    Đặt lịch khám
                  </p>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">Lịch khám mới</h1>
                  <p className="text-sky-100 text-sm mt-1">
                    Chọn dịch vụ, thú cưng và thời gian — chúng tôi sẽ chăm sóc phần còn lại
                  </p>
                </div>
              </div>
            </div>

            {/* Step indicator */}
            <div className="relative grid grid-cols-4 gap-2 mt-6">
              <StepChip num={1} label="Dịch vụ" done={stepDone.service} />
              <StepChip num={2} label="Thú cưng" done={stepDone.pet} />
              <StepChip num={3} label="Ngày giờ" done={stepDone.date} />
              <StepChip num={4} label="Ghi chú" done={true} />
            </div>
          </div>
        </div>

        {!user.phone && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl mb-4 flex items-start gap-3">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Bạn chưa có số điện thoại</p>
              <p className="text-sm mt-0.5">
                Phòng khám cần số điện thoại để liên hệ xác nhận lịch.{' '}
                <a href="/profile" className="underline font-semibold hover:text-amber-900">
                  Cập nhật ngay
                </a>
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 ring-1 ring-rose-200 text-rose-700 p-3.5 rounded-xl mb-4 flex items-start gap-2.5">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-5 gap-6">
            {/* Form chính - 3 cột */}
            <div className="md:col-span-3 space-y-5">

              {/* 1. Chọn dịch vụ */}
              <SectionCard
                num={1}
                icon={<Stethoscope size={18} />}
                title="Chọn dịch vụ"
                hint={`${selectedServiceIds.length} đã chọn`}
                active={stepDone.service}
              >
                <div className="space-y-2.5">
                  {services.map((service) => {
                    const isSelected = selectedServiceIds.includes(service.id);
                    return (
                      <label
                        key={service.id}
                        className={`flex items-center gap-4 p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'border-sky-500 bg-sky-50/50 shadow-sm'
                            : 'border-gray-200 hover:border-sky-300 hover:bg-gray-50/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleService(service.id)}
                          className="sr-only"
                        />

                        {service.imageUrl && isAbsoluteUrl(service.imageUrl) ? (
                          <img
                            src={service.imageUrl}
                            alt={service.title}
                            className="w-16 h-16 rounded-xl object-cover shrink-0 ring-1 ring-gray-100"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                            <Stethoscope size={24} className="text-sky-400" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800">{service.title}</p>
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{service.description}</p>
                          <p className="text-xs text-gray-400 mt-1 inline-flex items-center gap-1">
                            <Clock size={11} /> {service.duration} phút
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="font-bold text-rose-600 text-base">
                            {service.price.toLocaleString('vi-VN')}đ
                          </span>
                          <CheckCircle
                            size={20}
                            className={`transition-all ${isSelected ? 'text-sky-500' : 'text-gray-300'}`}
                          />
                        </div>
                      </label>
                    );
                  })}
                </div>
              </SectionCard>

              {/* 2. Chọn thú cưng */}
              <SectionCard
                num={2}
                icon={<PawPrint size={18} />}
                title="Chọn thú cưng"
                hint={`${selectedPetIds.length} đã chọn`}
                active={stepDone.pet}
              >
                {pets.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50/60 rounded-xl ring-1 ring-gray-100">
                    <PawPrint size={28} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500 mb-2">Chưa có thú cưng nào</p>
                    <Link to="/my-pets" className="text-sky-600 hover:underline text-sm font-semibold">
                      + Thêm thú cưng
                    </Link>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {pets.map((pet) => {
                      const isSelected = selectedPetIds.includes(pet.id);
                      return (
                        <label
                          key={pet.id}
                          className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                            isSelected
                              ? 'border-sky-500 bg-sky-50/50 shadow-sm'
                              : 'border-gray-200 hover:border-sky-300 hover:bg-gray-50/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => togglePet(pet.id)}
                            className="sr-only"
                          />
                          {pet.imageUrl ? (
                            <img
                              src={pet.imageUrl}
                              alt={pet.name}
                              className="w-11 h-11 rounded-xl object-cover ring-1 ring-gray-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            // <span className="text-3xl w-11 h-11 flex items-center justify-center bg-gray-50 rounded-xl">
                            //   {SPECIES_EMOJI[pet.species] || '🐾'}
                            // </span>
                            <img
                              src={DEFAULT_PET_IMAGES[pet.species]}
                              alt={pet.name}
                              className="w-11 h-11 rounded-xl object-cover ring-1 ring-gray-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{pet.name}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {SPECIES_MAP[pet.species] || pet.species}
                              {pet.breed ? ` · ${pet.breed}` : ''}
                            </p>
                          </div>
                          <CheckCircle
                            size={18}
                            className={`shrink-0 transition-all ${isSelected ? 'text-sky-500' : 'text-gray-300'}`}
                          />
                        </label>
                      );
                    })}
                  </div>
                )}
              </SectionCard>

              {/* 3. Chọn ngày giờ */}
              <SectionCard
                num={3}
                icon={<Calendar size={18} />}
                title="Chọn ngày giờ"
                hint={appointmentDate && appointmentTime ? '✓ Đã chọn' : 'Chưa chọn'}
                active={stepDone.date}
              >
                {/* Quick-pick chips ngày */}
                <div className="mb-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">
                    Ngày gần
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {quickDates.map((d) => {
                      const active = appointmentDate === d.iso;
                      return (
                        <button
                          key={d.iso}
                          type="button"
                          onClick={() => setAppointmentDate(d.iso)}
                          className={`px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition ${
                            active
                              ? 'bg-sky-600 text-white shadow'
                              : 'bg-gray-100 text-gray-600 hover:bg-sky-50 hover:text-sky-700'
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date input */}
                <div className="mb-5">
                  <label className="block text-gray-700 mb-1.5 text-sm font-semibold">
                    Hoặc chọn ngày khác *
                  </label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    min={minDate}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    required
                  />
                </div>

                {/* Time grid */}
                <div>
                  <label className="text-gray-700 mb-2 text-sm font-semibold flex items-center gap-1.5">
                    <Clock size={14} /> Giờ khám *
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {TIME_SLOTS.map((time) => {
                      const active = appointmentTime === time;
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setAppointmentTime(time)}
                          className={`py-2 rounded-lg text-sm font-semibold transition border-2 ${
                            active
                              ? 'bg-sky-600 text-white border-sky-600 shadow'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-sky-400 hover:text-sky-700'
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </SectionCard>

              {/* 4. Ghi chú */}
              <SectionCard
                num={4}
                icon={<StickyNote size={18} />}
                title="Ghi chú"
                hint="Không bắt buộc"
                active={false}
              >
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 placeholder:text-gray-400"
                  placeholder="Triệu chứng, yêu cầu đặc biệt..."
                />
              </SectionCard>
            </div>

            {/* Tóm tắt - 2 cột */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden sticky top-24">
                {/* Header gradient */}
                <div className="bg-gradient-to-r from-sky-600 to-cyan-500 px-5 py-4">
                  <div className="flex items-center gap-2 text-white">
                    <Wallet size={20} />
                    <h2 className="text-lg font-bold">Tóm tắt đặt lịch</h2>
                  </div>
                </div>

                <div className="p-5">
                  <div className="space-y-3 text-sm">
                    {/* Dịch vụ */}
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1.5">
                        Dịch vụ ({selectedServiceIds.length})
                      </p>
                      {selectedServices.length > 0 ? (
                        <div className="space-y-1">
                          {selectedServices.map((s) => (
                            <div key={s.id} className="flex justify-between gap-2">
                              <span className="font-medium text-gray-700 truncate">{s.title}</span>
                              <span className="text-rose-600 font-semibold shrink-0">
                                {s.price.toLocaleString('vi-VN')}đ
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 italic">Chưa chọn</p>
                      )}
                    </div>

                    <div className="border-t border-dashed border-gray-200" />

                    {/* Thú cưng */}
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1.5">
                        Thú cưng ({selectedPetIds.length})
                      </p>
                      {selectedPetIds.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {pets.filter((p) => selectedPetIds.includes(p.id)).map((p) => (
                            <span
                              key={p.id}
                              className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-700 ring-1 ring-sky-100 pl-0.5 pr-2 py-0.5 rounded-lg text-xs font-semibold"
                            >
                              <img
                                src={p.imageUrl || DEFAULT_PET_IMAGES[p.species] || DEFAULT_PET_IMAGES.OTHER}
                                alt={p.name}
                                className="w-5 h-5 rounded-md object-cover bg-white ring-1 ring-sky-100"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    DEFAULT_PET_IMAGES[p.species] || DEFAULT_PET_IMAGES.OTHER;
                                }}
                              />
                              {p.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 italic">Chưa chọn</p>
                      )}
                    </div>

                    <div className="border-t border-dashed border-gray-200" />

                    {/* Ngày + giờ */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-0.5">Ngày</p>
                        <p className="font-semibold text-gray-800">
                          {appointmentDate
                            ? new Date(appointmentDate).toLocaleDateString('vi-VN')
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-0.5">Giờ</p>
                        <p className="font-semibold text-gray-800">{appointmentTime || '—'}</p>
                      </div>
                    </div>

                    {selectedServices.length > 0 && selectedPetIds.length > 0 && (
                      <p className="text-xs text-gray-400 italic">
                        ({totalServicePrice.toLocaleString('vi-VN')}đ/dịch vụ) × {selectedPetIds.length} thú cưng
                      </p>
                    )}
                  </div>

                  {/* Tổng */}
                  <div className="bg-gradient-to-r from-rose-50 to-amber-50 ring-1 ring-rose-100 rounded-xl px-4 py-3 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-600">Tổng cộng</span>
                      <span className="text-2xl font-extrabold text-rose-600">
                        {totalPrice.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-4 bg-sky-600 text-white py-3 rounded-xl font-semibold hover:bg-sky-700 active:scale-[0.99] transition shadow-md disabled:opacity-50"
                  >
                    {submitting ? 'Đang đặt lịch...' : 'Xác nhận đặt lịch'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Step chip trên header
function StepChip({ num, label, done }: { num: number; label: string; done: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-xl ring-1 transition ${
        done
          ? 'bg-white/25 ring-white/40 text-white'
          : 'bg-white/10 ring-white/20 text-sky-50'
      }`}
    >
      <span
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
          done ? 'bg-white text-sky-700' : 'bg-white/30 text-white'
        }`}
      >
        {done ? '✓' : num}
      </span>
      <span className="text-sm font-semibold truncate">{label}</span>
    </div>
  );
}

// Card section: số bước + icon + tiêu đề + viền trái màu khi active
function SectionCard({
  num,
  icon,
  title,
  hint,
  active,
  children,
}: {
  num: number;
  icon: React.ReactNode;
  title: string;
  hint?: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`relative bg-white rounded-2xl shadow-sm ring-1 overflow-hidden transition ${
        active ? 'ring-sky-200' : 'ring-gray-100'
      }`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${active ? 'bg-sky-500' : 'bg-gray-200'}`} />
      <div className="p-5 md:p-6 pl-6 md:pl-7">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                active ? 'bg-sky-100 text-sky-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {num}
            </span>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className={active ? 'text-sky-600' : 'text-gray-500'}>{icon}</span>
              {title}
            </h2>
          </div>
          {hint && <span className="text-xs font-semibold text-gray-500">{hint}</span>}
        </div>
        {children}
      </div>
    </div>
  );
}
