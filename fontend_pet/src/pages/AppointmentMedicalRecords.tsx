import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Clock } from 'lucide-react';
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

  const appointmentDate = records.length > 0
    ? new Date(records[0].appointmentDate).toLocaleDateString('vi-VN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : '';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/appointments" className="inline-flex items-center gap-1 text-sky-600 hover:underline text-sm mb-6">
        <ArrowLeft size={16} /> Quay lại lịch khám
      </Link>

      {/* Page header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText size={20} className="text-sky-600" />
              <h1 className="text-2xl font-bold text-gray-800">Hồ sơ bệnh án</h1>
            </div>
            {appointmentDate && (
              <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                <Clock size={14} />
                <span>Ngày khám: {appointmentDate}</span>
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-1">Mã lịch khám</p>
            <p className="font-mono text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">
              {bookingCode}
            </p>
          </div>
        </div>
        {records.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
            <span className="font-medium text-gray-700">{records.length} thú cưng</span> có hồ sơ trong lần khám này
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      {!error && records.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
          <FileText size={52} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 font-semibold text-lg mb-1">Chưa có bệnh án</p>
          <p className="text-gray-400 text-sm">Bệnh án sẽ được bác sĩ cập nhật sau buổi khám</p>
        </div>
      )}

      <div className="space-y-6">
        {records.map((record) => (
          <MedicalRecordCard key={record.id} record={record} showPetHeader />
        ))}
      </div>
    </div>
  );
}
