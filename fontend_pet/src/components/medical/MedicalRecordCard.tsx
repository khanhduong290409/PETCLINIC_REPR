import { FileText, Stethoscope, Pill, ClipboardList, CalendarCheck, Clock, Paperclip } from 'lucide-react';
import type { MedicalResponse } from '../../api/medicalRecordApi';

const DEFAULT_PET_IMAGES: Record<string, string> = {
  DOG: '/assets/default-dog.svg',
  CAT: '/assets/default-cat.svg',
  BIRD: '/assets/default-bird.svg',
  RABBIT: '/assets/default-rabbit.svg',
  HAMSTER: '/assets/default-hamster.svg',
  OTHER: '/assets/default-pet.svg',
};
//tức là 2 chỗ xem medical ở appointment và mypets dẫn đến 2 nơi hiển thị khác nhau 
//MyAppointment -> AppointmentMedicalRecord
//MyPets -> PetMedicalRecord
//và cả 2 đều dùng chung MedicalRecordCard để hiển thị thẻ medical
export function MedicalRecordCard({
  record,
  showPetHeader = false,
  badgeLabel,
}: {
  record: MedicalResponse;
  showPetHeader?: boolean;
  badgeLabel?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Pet header — dùng khi 1 trang có nhiều pet (AppointmentMedicalRecords) */}
      {showPetHeader && (
        <div className="flex items-center gap-4 px-6 py-4 bg-sky-50 border-b border-sky-100">
          {record.petImageUrl ? (
            <img
              src={record.petImageUrl}
              alt={record.petName}
              className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
            />
          ) : (
            // <div className="w-14 h-14 rounded-full bg-white border-2 border-sky-200 flex items-center justify-center text-3xl shadow-sm">
            //   {SPECIES_EMOJI[record.petSpecies] || '🐾'}
            // </div>
            <img
            src={DEFAULT_PET_IMAGES[record.petSpecies]}
            className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
            />
          )}
          <div>
            <h2 className="text-lg font-bold text-gray-800">{record.petName}</h2>
            <p className="text-sm text-sky-600">Kết quả khám lâm sàng</p>
          </div>
        </div>
      )}

      {/* Date + booking badge — dùng khi list nhiều lần khám của 1 pet (PetMedicalRecords) */}
      {!showPetHeader && (
        <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-gray-400" />
            <span className="text-sm font-semibold text-sky-700">
              {new Date(record.appointmentDate).toLocaleDateString('vi-VN', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </span>
            {badgeLabel && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                {badgeLabel}
              </span>
            )}
          </div>
          <span className="font-mono text-xs text-gray-400">{record.bookingCode}</span>
        </div>
      )}

      {/* Medical content */}
      <div className="p-6 space-y-5">
        <MedicalSection
          icon={<Stethoscope size={16} className="text-rose-500" />}
          label="Chẩn đoán"
          value={record.diagnosis}
          colorClass="border-rose-200 bg-rose-50 text-rose-900"
          emptyText="Chưa có chẩn đoán"
        />
        <MedicalSection
          icon={<ClipboardList size={16} className="text-sky-500" />}
          label="Phương pháp điều trị"
          value={record.treatment}
          colorClass="border-sky-200 bg-sky-50 text-sky-900"
          emptyText="Chưa có thông tin điều trị"
        />
        <MedicalSection
          icon={<Pill size={16} className="text-violet-500" />}
          label="Đơn thuốc"
          value={record.prescription}
          colorClass="border-violet-200 bg-violet-50 text-violet-900"
          emptyText="Không có đơn thuốc"
        />
        {record.notes && (
          <MedicalSection
            icon={<FileText size={16} className="text-amber-500" />}
            label="Ghi chú của bác sĩ"
            value={record.notes}
            colorClass="border-amber-200 bg-amber-50 text-amber-900"
            emptyText=""
          />
        )}

        {record.followUpDate && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <CalendarCheck size={18} className="text-green-600 shrink-0" />
            <div>
              <p className="text-xs text-green-600 font-medium">Lịch tái khám</p>
              <p className="text-sm font-bold text-green-700">
                {new Date(record.followUpDate).toLocaleDateString('vi-VN', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
            </div>
          </div>
        )}

        {/* Placeholder tài liệu đính kèm */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Paperclip size={15} className="text-gray-400" />
            <p className="text-sm font-semibold text-gray-500">Tài liệu đính kèm</p>
          </div>
          <div className="border-2 border-dashed border-gray-200 rounded-lg px-4 py-5 text-center">
            <p className="text-gray-400 text-sm">Chưa có tài liệu (X-quang, ảnh bệnh án,...)</p>
            <p className="text-gray-300 text-xs mt-0.5">Tính năng đang được phát triển</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MedicalSection({
  icon,
  label,
  value,
  colorClass,
  emptyText,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  colorClass: string;
  emptyText: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-sm font-semibold text-gray-700">{label}</p>
      </div>
      {value ? (
        <div className={`border rounded-lg px-4 py-3 ${colorClass}`}>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{value}</p>
        </div>
      ) : (
        emptyText && <p className="text-sm text-gray-400 italic px-1">{emptyText}</p>
      )}
    </div>
  );
}
