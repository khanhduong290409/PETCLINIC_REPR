import { useState, useEffect } from 'react';
import { X, Search, UserPlus, PawPrint, Save } from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import type {
  AdminAppointment,
  CustomerSearchResult,
  DoctorInfo,
  PetServiceData,
} from '../../api/adminApi';
import type { SlotAvailability } from '../../api/appointmentApi';

const SPECIES_OPTIONS = [
  { value: 'DOG', label: 'Chó' },
  { value: 'CAT', label: 'Mèo' },
  { value: 'BIRD', label: 'Chim' },
  { value: 'RABBIT', label: 'Thỏ' },
  { value: 'HAMSTER', label: 'Hamster' },
  { value: 'OTHER', label: 'Khác' },
];

// "yyyy-mm-dd" theo giờ máy — không dùng toISOString vì nó đổi sang UTC
function todayInputValue(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

const inputClass =
  'w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500';

export default function WalkInAppointmentModal({
  getAvailableDoctors,
  onClose,
  onCreated,
}: {
  // Bác sĩ chưa có lượt nào ở ngày + giờ này — tính từ danh sách lịch trang cha đã tải
  getAvailableDoctors: (date: string, time: string) => DoctorInfo[];
  onClose: () => void;
  onCreated: (created: AdminAppointment[]) => void;
}) {
  // Khách hàng
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  // Thú cưng
  const [selectedPetIds, setSelectedPetIds] = useState<number[]>([]);
  const [newPetName, setNewPetName] = useState('');
  const [newPetSpecies, setNewPetSpecies] = useState('DOG');

  // Dịch vụ
  const [services, setServices] = useState<PetServiceData[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);

  // Ngày giờ + bác sĩ
  const [date, setDate] = useState(todayInputValue());
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [time, setTime] = useState('');
  const [doctorId, setDoctorId] = useState('');

  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.getServices()
      .then(setServices)
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!date) return;
    const loadSlots = async () => {
      try {
        setLoadingSlots(true);
        setSlots(await adminApi.getTimeSlots(date));
      } catch (err) {
        console.error(err);
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    loadSlots();
    // Đổi ngày → giờ và bác sĩ đã chọn không còn đúng
    setTime('');
    setDoctorId('');
  }, [date]);

  const handleSearch = async () => {
    if (keyword.trim().length < 2) {
      setError('Nhập ít nhất 2 ký tự để tìm khách');
      return;
    }
    try {
      setSearching(true);
      setError('');
      setSearchResults(await adminApi.searchCustomers(keyword.trim()));
      setSearched(true);
    } catch (err) {
      console.error(err);
      setError('Không tìm được khách hàng');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectCustomer = (customer: CustomerSearchResult) => {
    setSelectedCustomer(customer);
    setSelectedPetIds([]);
  };

  const switchToNewCustomer = () => {
    setIsNewCustomer(true);
    setSelectedCustomer(null);
    setSelectedPetIds([]);
    // Gợi ý sẵn SĐT nếu admin vừa tìm bằng số
    if (/^\d+$/.test(keyword.trim())) {
      setNewCustomerPhone(keyword.trim());
    }
  };

  const togglePet = (petId: number) => {
    if (selectedPetIds.includes(petId)) {
      setSelectedPetIds(selectedPetIds.filter((id) => id !== petId));
    } else {
      setSelectedPetIds([...selectedPetIds, petId]);
    }
  };

  const toggleService = (serviceId: number) => {
    if (selectedServiceIds.includes(serviceId)) {
      setSelectedServiceIds(selectedServiceIds.filter((id) => id !== serviceId));
    } else {
      setSelectedServiceIds([...selectedServiceIds, serviceId]);
    }
  };

  const handleSelectTime = (slotTime: string) => {
    setTime(slotTime);
    setDoctorId('');
  };

  // Tổng số pet của lượt đặt = pet có sẵn được chọn + pet mới (nếu có nhập tên)
  const hasNewPet = newPetName.trim() !== '';
  let petCount = selectedPetIds.length;
  if (hasNewPet) {
    petCount = petCount + 1;
  }

  let availableDoctors: DoctorInfo[] = [];
  if (time) {
    availableDoctors = getAvailableDoctors(date, time);
  }

  const validate = (): string | null => {
    if (isNewCustomer) {
      if (!newCustomerName.trim() || !newCustomerPhone.trim()) {
        return 'Vui lòng nhập họ tên và số điện thoại khách';
      }
    } else if (!selectedCustomer) {
      return 'Vui lòng tìm và chọn khách hàng, hoặc tạo khách mới';
    }
    if (petCount === 0) return 'Vui lòng chọn hoặc thêm ít nhất 1 thú cưng';
    if (selectedServiceIds.length === 0) return 'Vui lòng chọn ít nhất 1 dịch vụ';
    if (!time) return 'Vui lòng chọn giờ khám';
    if (!doctorId) return 'Vui lòng chọn bác sĩ';

    const selectedSlot = slots.find((s) => s.time === time);
    if (selectedSlot && selectedSlot.remaining < petCount) {
      return `Khung giờ ${time} chỉ còn ${selectedSlot.remaining} chỗ, không đủ cho ${petCount} thú cưng`;
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    let customerId: number | null = null;
    if (!isNewCustomer && selectedCustomer) {
      customerId = selectedCustomer.id;
    }

    try {
      setSubmitting(true);
      setError('');
      const created = await adminApi.createWalkInAppointments({
        customerId,
        newCustomerName: newCustomerName.trim(),
        newCustomerPhone: newCustomerPhone.trim(),
        petIds: selectedPetIds,
        newPetName: newPetName.trim(),
        newPetSpecies,
        serviceIds: selectedServiceIds,
        appointmentDate: date,
        appointmentTime: time,
        doctorId: Number(doctorId),
        notes,
      });
      onCreated(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo lịch');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Tạo lịch tại quầy</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto">
          {/* 1. Khách hàng */}
          <section>
            <SectionTitle num={1} title="Khách hàng" />
            {!isNewCustomer && !selectedCustomer && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearch();
                    }}
                    placeholder="Số điện thoại, email hoặc tên"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={searching}
                    className="inline-flex items-center gap-1.5 bg-sky-600 text-white px-4 rounded-xl text-sm font-semibold hover:bg-sky-700 disabled:opacity-50 shrink-0"
                  >
                    <Search size={15} /> Tìm
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <ul className="border border-gray-100 rounded-xl divide-y divide-gray-100">
                    {searchResults.map((customer) => (
                      <li key={customer.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectCustomer(customer)}
                          className="w-full text-left px-3 py-2 hover:bg-sky-50 text-sm"
                        >
                          <span className="font-semibold">{customer.fullName}</span>
                          <span className="text-gray-500"> · {customer.phone || 'Chưa có SĐT'}</span>
                          <span className="text-gray-400"> · {customer.pets.length} thú cưng</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {searched && searchResults.length === 0 && (
                  <p className="text-sm text-gray-500">Không tìm thấy khách nào.</p>
                )}

                <button
                  type="button"
                  onClick={switchToNewCustomer}
                  className="inline-flex items-center gap-1.5 text-sm text-sky-700 font-semibold hover:underline"
                >
                  <UserPlus size={15} /> Khách chưa có tài khoản — tạo mới
                </button>
              </div>
            )}

            {!isNewCustomer && selectedCustomer && (
              <div className="flex items-center justify-between bg-sky-50 rounded-xl px-3 py-2 text-sm">
                <span>
                  <span className="font-semibold">{selectedCustomer.fullName}</span>
                  <span className="text-gray-500"> · {selectedCustomer.phone || selectedCustomer.email}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="text-sky-700 font-semibold hover:underline"
                >
                  Đổi
                </button>
              </div>
            )}

            {isNewCustomer && (
              <div className="space-y-2">
                <div className="grid sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="Họ tên khách"
                    className={inputClass}
                  />
                  <input
                    type="tel"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    placeholder="Số điện thoại"
                    className={inputClass}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewCustomer(false)}
                  className="text-sm text-sky-700 font-semibold hover:underline"
                >
                  ← Quay lại tìm khách có sẵn
                </button>
              </div>
            )}
          </section>

          {/* 2. Thú cưng */}
          <section>
            <SectionTitle num={2} title="Thú cưng" />
            {selectedCustomer && selectedCustomer.pets.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedCustomer.pets.map((pet) => {
                  const checked = selectedPetIds.includes(pet.id);
                  return (
                    <label
                      key={pet.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-sm cursor-pointer ${
                        checked ? 'border-sky-500 bg-sky-50' : 'border-gray-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePet(pet.id)}
                        className="sr-only"
                      />
                      <PawPrint size={13} className="text-sky-500" />
                      {pet.name}
                    </label>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-gray-500 mb-1.5">Thêm thú cưng mới (để trống nếu không cần)</p>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={newPetName}
                onChange={(e) => setNewPetName(e.target.value)}
                placeholder="Tên thú cưng"
                className={`${inputClass} col-span-2`}
              />
              <select
                value={newPetSpecies}
                onChange={(e) => setNewPetSpecies(e.target.value)}
                className={inputClass}
              >
                {SPECIES_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* 3. Dịch vụ */}
          <section>
            <SectionTitle num={3} title="Dịch vụ" />
            <div className="flex flex-wrap gap-2">
              {services.map((service) => {
                const checked = selectedServiceIds.includes(service.id);
                return (
                  <label
                    key={service.id}
                    className={`px-3 py-1.5 rounded-lg border-2 text-sm cursor-pointer ${
                      checked ? 'border-sky-500 bg-sky-50 text-sky-800' : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleService(service.id)}
                      className="sr-only"
                    />
                    {service.title}
                  </label>
                );
              })}
            </div>
          </section>

          {/* 4. Ngày giờ */}
          <section>
            <SectionTitle num={4} title="Ngày giờ" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`${inputClass} sm:w-48 mb-3`}
            />
            {loadingSlots ? (
              <p className="text-sm text-gray-400">Đang tải khung giờ...</p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {slots.map((slot) => {
                  // Admin được chọn giờ đã qua (khách vào khám ngay), chỉ chặn slot khóa hoặc hết chỗ
                  const selectable = !slot.disabled && slot.remaining > 0;
                  const active = time === slot.time;

                  let buttonClass = 'bg-white border-gray-200 hover:border-sky-400';
                  if (!selectable) {
                    buttonClass = 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed';
                  } else if (active) {
                    buttonClass = 'bg-sky-600 border-sky-600 text-white';
                  }

                  let label = `Còn ${slot.remaining}`;
                  if (slot.disabled) {
                    label = 'Khóa';
                  } else if (slot.remaining === 0) {
                    label = 'Đầy';
                  }

                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!selectable}
                      onClick={() => handleSelectTime(slot.time)}
                      className={`py-1.5 rounded-lg border-2 text-sm font-semibold flex flex-col items-center ${buttonClass}`}
                    >
                      {slot.time}
                      <span className="text-[10px] font-medium">{label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* 5. Bác sĩ */}
          <section>
            <SectionTitle num={5} title="Bác sĩ" />
            {!time && <p className="text-sm text-gray-400 italic">Chọn giờ để xem bác sĩ còn rảnh</p>}
            {time && availableDoctors.length === 0 && (
              <p className="text-sm text-rose-600">Không còn bác sĩ nào rảnh lúc {time}</p>
            )}
            {time && availableDoctors.length > 0 && (
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className={inputClass}
              >
                <option value="">-- Chọn bác sĩ --</option>
                {availableDoctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.fullName}
                  </option>
                ))}
              </select>
            )}
          </section>

          {/* Ghi chú */}
          <section>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Ghi chú</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Triệu chứng, yêu cầu..."
              className={inputClass}
            />
          </section>
        </div>

        <div className="px-5 py-4 border-t border-gray-100">
          {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-sky-700 transition disabled:opacity-50"
            >
              <Save size={15} /> {submitting ? 'Đang tạo...' : `Tạo lịch (${petCount} thú cưng)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ num, title }: { num: number; title: string }) {
  return (
    <p className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
      <span className="w-5 h-5 rounded-md bg-sky-100 text-sky-700 text-xs flex items-center justify-center">
        {num}
      </span>
      {title}
    </p>
  );
}
