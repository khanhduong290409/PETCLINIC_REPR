import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useEffect, useState } from "react";
import { medicalRecordApi } from "../../api/medicalRecordApi";
import type { MedicalResponse, MedicalRequest } from "../../api/medicalRecordApi";
import { ArrowLeft } from "lucide-react";

const SPECIES_EMOJI: Record<string, string> = {
  DOG: '🐕', CAT: '🐱', BIRD: '🐦',
  RABBIT: '🐰', HAMSTER: '🐹', OTHER: '🐾',
};

// Form data riêng cho từng pet
type FormData = Omit<MedicalRequest, never>;
const emptyForm = (): FormData => ({
  diagnosis: '',
  treatment: '',
  prescription: '',
  notes: '',
  followUpDate: '',
});

export default function MedicalRecord() {
  const { user } = useAuth();
  const { bookingCode } = useParams();
  const navigate = useNavigate();

  const [records, setRecords] = useState<MedicalResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Lưu form state riêng cho từng pet — key là appointmentId
  const [forms, setForms] = useState<Record<number, FormData>>({});
  // Theo dõi pet nào đang lưu
  const [saving, setSaving] = useState<number | null>(null);
  // Theo dõi pet nào đã lưu thành công (để hiện badge)
  const [saved, setSaved] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!user || user.role !== 'DOCTOR') {
      navigate('/');
      return;
    }
    loadRecords();
  }, [user]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await medicalRecordApi.getRecord(bookingCode ?? '');
      setRecords(data);

      // Khởi tạo form từ dữ liệu cũ (nếu đã ghi trước đó)
      const initialForms: Record<number, FormData> = {};
      for (const r of data) {
        initialForms[r.appointmentId] = {
          diagnosis: r.diagnosis ?? '',
          treatment: r.treatment ?? '',
          prescription: r.prescription ?? '',
          notes: r.notes ?? '',
          followUpDate: r.followUpDate ?? '',
        };
      }
      setForms(initialForms);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật 1 field trong form của 1 pet
  const updateField = (appointmentId: number, field: keyof FormData, value: string) => {
    setForms(prev => ({
      ...prev,
      [appointmentId]: { ...prev[appointmentId], [field]: value },
    }));
    // Bỏ badge "Đã lưu" khi người dùng chỉnh sửa lại
    setSaved(prev => ({ ...prev, [appointmentId]: false }));
  };

  // Lưu bệnh án cho 1 pet
  const handleSave = async (appointmentId: number) => {
    setSaving(appointmentId);
    try {
      await medicalRecordApi.saveRecord(appointmentId, forms[appointmentId]);
      setSaved(prev => ({ ...prev, [appointmentId]: true }));
    } catch (err) {
      alert('Không thể lưu bệnh án. Thử lại.');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <Link
        to="/doctor/appointments"
        className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-800 mb-6"
      >
        <ArrowLeft size={18} /> Quay lại lịch khám
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Ghi bệnh án</h1>
        <p className="text-gray-400 font-mono text-sm mt-1">{bookingCode}</p>
      </div>

      {/* Danh sách bệnh án từng pet */}
      <div className="space-y-6">
        {records.map((record) => {
          const form = forms[record.appointmentId] ?? emptyForm();
          const isSaving = saving === record.appointmentId;
          const isSaved = saved[record.appointmentId];

          return (
            <div key={record.appointmentId} className="bg-white rounded-lg shadow p-6">
              {/* Header pet */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{SPECIES_EMOJI[record.petSpecies] || '🐾'}</span>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">{record.petName}</h2>
                    <p className="text-sm text-gray-400">{record.petSpecies}</p>
                  </div>
                </div>
                {isSaved && (
                  <span className="text-sm text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-full border border-green-200">
                    ✓ Đã lưu
                  </span>
                )}
              </div>

              {/* Form bệnh án */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Chẩn đoán
                  </label>
                  <textarea
                    rows={2}
                    value={form.diagnosis}
                    onChange={(e) => updateField(record.appointmentId, 'diagnosis', e.target.value)}
                    placeholder="Nhập chẩn đoán bệnh..."
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Điều trị
                  </label>
                  <textarea
                    rows={2}
                    value={form.treatment}
                    onChange={(e) => updateField(record.appointmentId, 'treatment', e.target.value)}
                    placeholder="Phác đồ điều trị..."
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Đơn thuốc
                  </label>
                  <textarea
                    rows={2}
                    value={form.prescription}
                    onChange={(e) => updateField(record.appointmentId, 'prescription', e.target.value)}
                    placeholder="Tên thuốc, liều lượng, cách dùng..."
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Ghi chú của bác sĩ
                  </label>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => updateField(record.appointmentId, 'notes', e.target.value)}
                    placeholder="Lưu ý đặc biệt, khuyến nghị cho chủ..."
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Ngày tái khám
                  </label>
                  <input
                    type="date"
                    value={form.followUpDate}
                    onChange={(e) => updateField(record.appointmentId, 'followUpDate', e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
              </div>

              {/* Nút lưu */}
              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => handleSave(record.appointmentId)}
                  disabled={isSaving}
                  className="bg-sky-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-sky-700 transition disabled:opacity-50"
                >
                  {isSaving ? 'Đang lưu...' : 'Lưu bệnh án'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
