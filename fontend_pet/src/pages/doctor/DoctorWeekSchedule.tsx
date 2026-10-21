import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

// Chỉ cần các trường này — BookingGroup của DoctorAppointments đã có đủ
export interface ScheduleGroup {
  bookingCode: string;
  appointmentDate: string; // "2026-10-09"
  appointmentTime: string; // "08:30"
  ownerName: string;
  status: string;
  pets: { name: string }[];
}

// 08:00 → 17:00, mỗi 30 phút — phải khớp danh sách giờ trong TimeSlotService ở backend
const TIME_ROWS: string[] = [];
for (let hour = 8; hour <= 17; hour++) {
  TIME_ROWS.push(`${String(hour).padStart(2, '0')}:00`);
  if (hour < 17) {
    TIME_ROWS.push(`${String(hour).padStart(2, '0')}:30`);
  }
}

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

// Màu thẻ theo trạng thái (lượt đã hủy không hiện trên lịch)
const CARD_CLASS: Record<string, string> = {
  PENDING: 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100',
  CONFIRMED: 'bg-sky-50 border-sky-300 text-sky-800 hover:bg-sky-100',
  COMPLETED: 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100',
};

// "yyyy-mm-dd" theo giờ máy — không dùng toISOString vì nó đổi sang UTC, trước 7h sáng sẽ lệch 1 ngày
function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + days);
  return result;
}

// Thứ Hai của tuần chứa ngày truyền vào (getDay: CN = 0, T2 = 1, ...)
function getMonday(date: Date): Date {
  const dayOfWeek = date.getDay();
  let daysBack = dayOfWeek - 1;
  if (dayOfWeek === 0) {
    daysBack = 6;
  }
  return addDays(date, -daysBack);
}

function formatDayMonth(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default function DoctorWeekSchedule({ groups }: { groups: ScheduleGroup[] }) {
  const navigate = useNavigate();
  const [weekStart, setWeekStart] = useState<Date>(getMonday(new Date()));

  const weekDays: Date[] = [];
  for (let i = 0; i < 7; i++) {
    weekDays.push(addDays(weekStart, i));
  }
  const weekDayKeys = weekDays.map(toDateKey);
  const todayKey = toDateKey(new Date());

  // Gom lượt đặt vào từng ô "ngày|giờ" của tuần đang xem
  const groupsByCell = new Map<string, ScheduleGroup[]>();
  let weekBookingCount = 0;
  for (const group of groups) {
    if (group.status === 'CANCELLED') continue;
    if (!weekDayKeys.includes(group.appointmentDate)) continue;

    const time = group.appointmentTime.substring(0, 5);
    const cellKey = `${group.appointmentDate}|${time}`;
    const cellGroups = groupsByCell.get(cellKey) || [];
    cellGroups.push(group);
    groupsByCell.set(cellKey, cellGroups);
    weekBookingCount++;
  }

  const weekLabel = `${formatDayMonth(weekDays[0])} – ${formatDayMonth(weekDays[6])}/${weekDays[6].getFullYear()}`;

  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
      {/* Điều hướng tuần */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-gray-100">
        <div>
          <p className="font-bold text-gray-800 flex items-center gap-2">
            <CalendarDays size={18} className="text-sky-600" />
            {weekLabel}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Tuần này: <span className="font-semibold text-gray-700">{weekBookingCount}</span> lượt khám
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
          >
            <ChevronLeft size={14} /> Tuần trước
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(getMonday(new Date()))}
            className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-semibold text-sky-700"
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
          >
            Tuần sau <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Lưới tuần — điện thoại cuộn ngang */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[840px] table-fixed text-xs border-collapse">
          <thead>
            <tr>
              <th className="w-16 bg-gray-50 border-b border-gray-200" />
              {weekDays.map((day, index) => {
                const isToday = weekDayKeys[index] === todayKey;
                return (
                  <th
                    key={weekDayKeys[index]}
                    className={`py-2 border-b border-l border-gray-200 font-semibold ${
                      isToday ? 'bg-sky-600 text-white' : 'bg-gray-50 text-gray-600'
                    }`}
                  >
                    <div>{DAY_LABELS[index]}</div>
                    <div className={isToday ? 'text-sky-100' : 'text-gray-400'}>{formatDayMonth(day)}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {TIME_ROWS.map((time) => (
              <tr key={time}>
                <td className="px-2 py-1.5 border-b border-gray-100 text-gray-500 font-semibold align-top text-right">
                  {time}
                </td>
                {weekDayKeys.map((dayKey) => {
                  const isToday = dayKey === todayKey;
                  const cellGroups = groupsByCell.get(`${dayKey}|${time}`) || [];
                  return (
                    <td
                      key={dayKey}
                      className={`p-1 border-b border-l border-gray-100 align-top h-10 ${isToday ? 'bg-sky-50/50' : ''}`}
                    >
                      <div className="space-y-1">
                        {cellGroups.map((group) => {
                          const petNames = group.pets.map((pet) => pet.name).join(', ');
                          const cardClass = CARD_CLASS[group.status] || 'bg-gray-50 border-gray-300 text-gray-700';
                          return (
                            <button
                              key={group.bookingCode}
                              type="button"
                              onClick={() => navigate(`/doctor/medical/${group.bookingCode}`)}
                              title={`${petNames} · ${group.ownerName}`}
                              className={`w-full text-left border-l-4 rounded-md px-1.5 py-1 transition ${cardClass}`}
                            >
                              <p className="font-semibold truncate">{petNames}</p>
                              <p className="truncate opacity-75">{group.ownerName}</p>
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Chú thích màu */}
      <div className="flex flex-wrap gap-4 px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
        <Legend className="bg-amber-50 border-amber-300" label="Chờ xác nhận" />
        <Legend className="bg-sky-50 border-sky-300" label="Đã xác nhận" />
        <Legend className="bg-emerald-50 border-emerald-300" label="Hoàn thành" />
        <span className="text-gray-400">· Bấm vào lượt khám để mở bệnh án</span>
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-3.5 h-3.5 rounded border-l-4 ${className}`} />
      {label}
    </span>
  );
}
