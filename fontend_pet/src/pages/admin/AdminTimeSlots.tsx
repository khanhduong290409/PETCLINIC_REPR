import { useState, useEffect } from 'react';
import { Clock, Lock, Unlock, Save, X, AlertTriangle, PawPrint } from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import type { AdminAppointment } from '../../api/adminApi';
import type { SlotAvailability } from '../../api/appointmentApi';
import { useToast } from '../../contexts/ToastContext';
import ConfirmModal from '../../components/ConfirmModal';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  COMPLETED: 'Hoàn thành',
};

// "yyyy-mm-dd" theo giờ máy — không dùng toISOString vì nó đổi sang UTC, trước 7h sáng sẽ lệch 1 ngày
function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Màu ô theo mức độ đầy
function getSlotCellClass(slot: SlotAvailability): string {
  if (slot.disabled) {
    return 'bg-gray-100 border-gray-300 text-gray-500';
  }
  if (slot.remaining === 0) {
    return 'bg-rose-50 border-rose-300 text-rose-700';
  }
  // Còn ít hơn 1/3 chỗ
  if (slot.remaining * 3 < slot.capacity) {
    return 'bg-amber-50 border-amber-300 text-amber-700';
  }
  return 'bg-emerald-50 border-emerald-300 text-emerald-700';
}

export default function AdminTimeSlots() {
  const { showToast } = useToast();

  // Sức chứa mặc định
  const [defaultCapacity, setDefaultCapacity] = useState<number | null>(null);
  const [capacityInput, setCapacityInput] = useState('');
  const [savingDefault, setSavingDefault] = useState(false);

  // Lưới khung giờ của ngày đang chọn
  const [selectedDate, setSelectedDate] = useState(toDateInputValue(new Date()));
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);

  // Khung giờ đang mở popup
  const [editingSlot, setEditingSlot] = useState<SlotAvailability | null>(null);

  // Modal cảnh báo khi đổi sức chứa mặc định làm một số khung giờ bị vượt
  const [capacityWarning, setCapacityWarning] = useState<{ capacity: number; overCount: number } | null>(null);

  // Modal khóa / mở lại cả ngày
  const [dayAction, setDayAction] = useState<'lock' | 'unlock' | null>(null);
  const [dayLockNote, setDayLockNote] = useState('');
  const [savingDayAction, setSavingDayAction] = useState(false);

  useEffect(() => {
    loadDefaultCapacity();
  }, []);

  useEffect(() => {
    loadSlots(selectedDate);
  }, [selectedDate]);

  const loadDefaultCapacity = async () => {
    try {
      const settings = await adminApi.getSlotSettings();
      setDefaultCapacity(settings.defaultSlotCapacity);
      setCapacityInput(String(settings.defaultSlotCapacity));
    } catch (err) {
      console.error(err);
      showToast('Không tải được sức chứa mặc định', 'error');
    }
  };

  const loadSlots = async (date: string) => {
    if (!date) return;
    try {
      setLoadingSlots(true);
      setSlots(await adminApi.getTimeSlots(date));
    } catch (err) {
      console.error(err);
      showToast('Không tải được khung giờ', 'error');
    } finally {
      setLoadingSlots(false);
    }
  };

  // Bước 1: kiểm tra trước. Nếu có khung giờ sắp tới bị vượt thì mở modal cảnh báo, chưa lưu
  const handleSaveDefaultCapacity = async () => {
    const newCapacity = Number(capacityInput);
    if (!Number.isInteger(newCapacity) || newCapacity < 1) {
      showToast('Sức chứa phải là số nguyên từ 1 trở lên', 'error');
      return;
    }

    try {
      setSavingDefault(true);
      const overCount = await adminApi.countSlotsOverCapacity(newCapacity);
      if (overCount > 0) {
        setCapacityWarning({ capacity: newCapacity, overCount });
        return;
      }
      await saveDefaultCapacity(newCapacity);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể lưu', 'error');
    } finally {
      setSavingDefault(false);
    }
  };

  // Bước 2: lưu thật (gọi thẳng, hoặc sau khi admin bấm đồng ý trong modal cảnh báo)
  const saveDefaultCapacity = async (newCapacity: number) => {
    const saved = await adminApi.updateDefaultCapacity(newCapacity);
    setDefaultCapacity(saved.defaultSlotCapacity);
    showToast(`Đã đổi sức chứa mặc định thành ${saved.defaultSlotCapacity}`);
    loadSlots(selectedDate);
  };

  const handleConfirmCapacityWarning = async () => {
    if (!capacityWarning) return;
    try {
      setSavingDefault(true);
      await saveDefaultCapacity(capacityWarning.capacity);
      setCapacityWarning(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể lưu', 'error');
    } finally {
      setSavingDefault(false);
    }
  };

  const openDayAction = (action: 'lock' | 'unlock') => {
    setDayLockNote('');
    setDayAction(action);
  };

  const handleConfirmDayAction = async () => {
    if (!dayAction) return;
    const disabled = dayAction === 'lock';
    try {
      setSavingDayAction(true);
      setSlots(await adminApi.setDayDisabled(selectedDate, disabled, dayLockNote.trim()));
      if (disabled) {
        showToast('Đã khóa cả ngày');
      } else {
        showToast('Đã mở lại cả ngày');
      }
      setDayAction(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể cập nhật', 'error');
    } finally {
      setSavingDayAction(false);
    }
  };

  const allDisabled = slots.length > 0 && slots.every((s) => s.disabled);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Quản lý khung giờ</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Số thú cưng tối đa mỗi khung giờ · Khóa khung giờ khi bác sĩ nghỉ hoặc ngày lễ
        </p>
      </div>

      {/* Sức chứa mặc định */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-5">
        <h2 className="font-bold text-gray-800 mb-1">Sức chứa mặc định</h2>
        <p className="text-sm text-gray-500 mb-3">
          Áp dụng cho mọi khung giờ chưa được chỉnh riêng. Đổi số này không hủy lịch nào đã đặt.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            value={capacityInput}
            onChange={(e) => setCapacityInput(e.target.value)}
            className="w-24 px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
          <span className="text-sm text-gray-500">thú cưng / khung giờ</span>
          <button
            type="button"
            onClick={handleSaveDefaultCapacity}
            disabled={savingDefault || capacityInput === String(defaultCapacity)}
            className="ml-auto inline-flex items-center gap-1.5 bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-sky-700 transition disabled:opacity-40"
          >
            <Save size={15} /> {savingDefault ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>

      {/* Lưới khung giờ theo ngày */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
          <div className="sm:ml-auto">
            {allDisabled ? (
              <button
                type="button"
                onClick={() => openDayAction('unlock')}
                className="inline-flex items-center gap-1.5 border border-emerald-300 text-emerald-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-50 transition"
              >
                <Unlock size={15} /> Mở lại cả ngày
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openDayAction('lock')}
                className="inline-flex items-center gap-1.5 border border-gray-300 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
              >
                <Lock size={15} /> Khóa cả ngày
              </button>
            )}
          </div>
        </div>

        {/* Chú thích màu */}
        <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-4">
          <Legend className="bg-emerald-50 border-emerald-300" label="Còn nhiều chỗ" />
          <Legend className="bg-amber-50 border-amber-300" label="Sắp đầy" />
          <Legend className="bg-rose-50 border-rose-300" label="Đã đầy" />
          <Legend className="bg-gray-100 border-gray-300" label="Đã khóa" />
        </div>

        {loadingSlots ? (
          <div className="py-10 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {slots.map((slot) => (
              <button
                key={slot.time}
                type="button"
                onClick={() => setEditingSlot(slot)}
                title={slot.note || undefined}
                className={`relative border-2 rounded-xl py-2.5 px-2 text-center transition hover:shadow ${getSlotCellClass(slot)} ${slot.past ? 'opacity-50' : ''}`}
              >
                <p className="font-bold flex items-center justify-center gap-1">
                  {slot.disabled && <Lock size={12} />}
                  {slot.time}
                </p>
                <p className="text-xs font-semibold mt-0.5">
                  {slot.bookedCount} / {slot.capacity}
                </p>
                {slot.customCapacity !== null && (
                  <span className="absolute top-1 right-1 text-[9px] font-bold bg-white/80 px-1 rounded">
                    Riêng
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {editingSlot && defaultCapacity !== null && (
        <SlotEditModal
          date={selectedDate}
          slot={editingSlot}
          defaultCapacity={defaultCapacity}
          onClose={() => setEditingSlot(null)}
          onSaved={(updatedSlots) => {
            setSlots(updatedSlots);
            setEditingSlot(null);
            showToast(`Đã lưu khung giờ ${editingSlot.time}`);
          }}
        />
      )}

      <ConfirmModal
        open={capacityWarning !== null}
        variant="warning"
        title="Một số khung giờ sẽ bị vượt"
        message={
          capacityWarning && (
            <>
              Có <b>{capacityWarning.overCount}</b> khung giờ sắp tới đang có nhiều hơn{' '}
              <b>{capacityWarning.capacity}</b> thú cưng.
              {'\n'}Các lịch đã đặt vẫn giữ nguyên, chỉ là những khung giờ đó sẽ không nhận thêm lịch.
            </>
          )
        }
        confirmLabel="Vẫn lưu"
        loading={savingDefault}
        onConfirm={handleConfirmCapacityWarning}
        onCancel={() => setCapacityWarning(null)}
      />

      <ConfirmModal
        open={dayAction === 'lock'}
        variant="warning"
        title="Khóa cả ngày"
        message={`Khách sẽ không đặt được bất kỳ khung giờ nào ngày ${new Date(selectedDate).toLocaleDateString('vi-VN')}. Lịch đã đặt vẫn giữ nguyên.`}
        confirmLabel="Khóa cả ngày"
        loading={savingDayAction}
        onConfirm={handleConfirmDayAction}
        onCancel={() => setDayAction(null)}
      >
        <input
          type="text"
          value={dayLockNote}
          onChange={(e) => setDayLockNote(e.target.value)}
          placeholder="Lý do (ví dụ: Nghỉ lễ)"
          autoFocus
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
        />
      </ConfirmModal>

      <ConfirmModal
        open={dayAction === 'unlock'}
        variant="info"
        title="Mở lại cả ngày"
        message={`Mở lại tất cả khung giờ ngày ${new Date(selectedDate).toLocaleDateString('vi-VN')}?`}
        confirmLabel="Mở lại"
        loading={savingDayAction}
        onConfirm={handleConfirmDayAction}
        onCancel={() => setDayAction(null)}
      />
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-3.5 h-3.5 rounded border-2 ${className}`} />
      {label}
    </span>
  );
}

// Popup chỉnh riêng một khung giờ
function SlotEditModal({
  date,
  slot,
  defaultCapacity,
  onClose,
  onSaved,
}: {
  date: string;
  slot: SlotAvailability;
  defaultCapacity: number;
  onClose: () => void;
  onSaved: (updatedSlots: SlotAvailability[]) => void;
}) {
  const [useDefault, setUseDefault] = useState(slot.customCapacity === null);
  const [customCapacityInput, setCustomCapacityInput] = useState(String(slot.capacity));
  const [disabled, setDisabled] = useState(slot.disabled);
  const [note, setNote] = useState(slot.note || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setAppointments(await adminApi.getAppointmentsInSlot(date, slot.time));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingAppointments(false);
      }
    };
    loadAppointments();
  }, [date, slot.time]);

  // Sức chứa sẽ áp dụng sau khi lưu — để cảnh báo nếu thấp hơn số đã đặt
  let newCapacity = defaultCapacity;
  if (!useDefault) {
    newCapacity = Number(customCapacityInput);
  }
  const belowBooked = newCapacity < slot.bookedCount;

  const handleSave = async () => {
    let capacityToSave: number | null = null;
    if (!useDefault) {
      const parsed = Number(customCapacityInput);
      if (!Number.isInteger(parsed) || parsed < 1) {
        setError('Sức chứa phải là số nguyên từ 1 trở lên');
        return;
      }
      capacityToSave = parsed;
    }

    try {
      setSaving(true);
      setError('');
      const updatedSlots = await adminApi.updateTimeSlot({
        date,
        time: slot.time,
        capacity: capacityToSave,
        disabled,
        note,
      });
      onSaved(updatedSlots);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Clock size={18} className="text-sky-600" />
            {slot.time} · {new Date(date).toLocaleDateString('vi-VN')}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600">
            Đã đặt: <span className="font-semibold">{slot.bookedCount}</span> thú cưng
          </p>

          {/* Sức chứa */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={useDefault}
                onChange={(e) => setUseDefault(e.target.checked)}
              />
              Dùng sức chứa mặc định ({defaultCapacity})
            </label>
            {!useDefault && (
              <div className="flex items-center gap-2 mt-2 ml-6">
                <input
                  type="number"
                  min={1}
                  value={customCapacityInput}
                  onChange={(e) => setCustomCapacityInput(e.target.value)}
                  className="w-20 px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
                <span className="text-sm text-gray-500">thú cưng</span>
              </div>
            )}
            {belowBooked && (
              <p className="mt-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 flex gap-1.5">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                Khung giờ đang có {slot.bookedCount} thú cưng, nhiều hơn sức chứa mới. Lịch cũ vẫn giữ nguyên, chỉ không nhận thêm.
              </p>
            )}
          </div>

          {/* Khóa */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={disabled}
                onChange={(e) => setDisabled(e.target.checked)}
              />
              Khóa khung giờ này
            </label>
            {disabled && slot.bookedCount > 0 && (
              <p className="mt-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 flex gap-1.5">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                Khóa không tự hủy {slot.bookedCount} lịch bên dưới — hãy liên hệ khách nếu cần dời lịch.
              </p>
            )}
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Ghi chú</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Bác sĩ nghỉ"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          {/* Lịch trong khung giờ */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Lịch trong khung giờ</p>
            {loadingAppointments && <p className="text-sm text-gray-400">Đang tải...</p>}
            {!loadingAppointments && appointments.length === 0 && (
              <p className="text-sm text-gray-400 italic">Chưa có lịch nào</p>
            )}
            {!loadingAppointments && appointments.length > 0 && (
              <ul className="space-y-1.5">
                {appointments.map((appointment) => (
                  <li
                    key={appointment.id}
                    className="flex items-center justify-between gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <span className="flex items-center gap-1.5 min-w-0">
                      <PawPrint size={13} className="text-sky-500 shrink-0" />
                      <span className="font-medium truncate">{appointment.petName}</span>
                      <span className="text-gray-400 truncate">· {appointment.ownerName}</span>
                    </span>
                    <span className="text-xs text-gray-500 shrink-0">
                      {STATUS_LABEL[appointment.status] || appointment.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-sky-700 transition disabled:opacity-50"
          >
            <Save size={15} /> {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}
