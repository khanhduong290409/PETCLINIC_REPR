import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Clock,
  PawPrint,
  Image as ImageIcon,
  CalendarCheck,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { medicalRecordApi } from '../api/medicalRecordApi';
import { MedicalRecordCard } from '../components/medical/MedicalRecordCard';
import type { MedicalResponse } from '../api/medicalRecordApi';

export default function AppointmentMedicalRecords() {
  const { bookingCode } = useParams<{ bookingCode: string }>();
  const { user } = useAuth();

  const [records, setRecords] = useState<MedicalResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (bookingCode) fetchRecords();
  }, [bookingCode]);

  const fetchRecords = async () => {
    if (!bookingCode) return;
    try {
      setLoading(true);
      setError('');
      const data = await medicalRecordApi.getRecord(bookingCode);
      setRecords(data);
    } catch (err) {
      console.error('Failed to fetch medical records:', err);
      setError('Không thể tải bệnh án. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Stats từ records
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const withImages = records.filter((r) => r.imageUrls && r.imageUrls.length > 0).length;
    const upcoming = records.filter((r) => {
      if (!r.followUpDate) return false;
      const d = new Date(r.followUpDate);
      d.setHours(0, 0, 0, 0);
      return d.getTime() >= today.getTime();
    }).length;
    return { total: records.length, withImages, upcoming };
  }, [records]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Vui lòng đăng nhập</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600" />
      </div>
    );
  }

  const appointmentDate =
    records.length > 0
      ? new Date(records[0].appointmentDate).toLocaleDateString('vi-VN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/60 via-white to-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 p-6 md:p-8 mb-6 shadow-lg">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -left-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

          <div className="relative">
            <Link
              to="/appointments"
              className="inline-flex items-center gap-1.5 text-sky-100 hover:text-white text-sm mb-3 transition"
            >
              <ArrowLeft size={16} /> Quay lại lịch khám
            </Link>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/20 backdrop-blur items-center justify-center ring-1 ring-white/30">
                <FileText size={28} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sky-100 text-sm font-medium tracking-wide uppercase">
                  Chi tiết lần khám
                </p>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Hồ sơ bệnh án</h1>
                {/* Chips: ngày + mã booking */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {appointmentDate && (
                    <InfoChip icon={<Clock size={12} />} text={appointmentDate} />
                  )}
                  {bookingCode && (
                    <InfoChip text={`#${bookingCode}`} mono />
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            {records.length > 0 && (
              <div className="relative grid grid-cols-3 gap-3 mt-6">
                <StatCard
                  label="Thú cưng"
                  value={String(stats.total)}
                  icon={<PawPrint size={18} />}
                />
                <StatCard
                  label="Có ảnh đính kèm"
                  value={String(stats.withImages)}
                  icon={<ImageIcon size={18} />}
                />
                <StatCard
                  label="Tái khám sắp tới"
                  value={String(stats.upcoming)}
                  icon={<CalendarCheck size={18} />}
                />
              </div>
            )}
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-rose-50 ring-1 ring-rose-200 text-rose-700 p-3.5 rounded-xl mb-4 flex items-start gap-2.5">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Empty state */}
        {!error && records.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 py-16 px-6 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-sky-50 flex items-center justify-center">
              <FileText size={36} className="text-sky-500" />
            </div>
            <p className="text-gray-700 text-lg font-semibold mb-1">Chưa có bệnh án</p>
            <p className="text-gray-500 text-sm">
              Bệnh án sẽ được bác sĩ cập nhật sau buổi khám
            </p>
          </div>
        )}

        {/* Records list */}
        {records.length > 0 && (
          <div className="space-y-5">
            {records.map((record) => (
              <MedicalRecordCard key={record.id} record={record} showPetHeader />
            ))}
          </div>
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
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white/15 backdrop-blur ring-1 ring-white/25 rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-2 text-sky-50 text-xs font-medium">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-xl font-bold text-white mt-0.5 truncate">{value}</p>
    </div>
  );
}

// Chip thông tin trên header
function InfoChip({
  icon,
  text,
  mono,
}: {
  icon?: React.ReactNode;
  text: string;
  mono?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 bg-white/20 backdrop-blur ring-1 ring-white/25 text-white text-xs font-semibold px-2 py-0.5 rounded-md ${
        mono ? 'font-mono' : ''
      }`}
    >
      {icon}
      {text}
    </span>
  );
}
