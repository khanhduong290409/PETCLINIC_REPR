import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  PawPrint,
  Calendar,
  Image as ImageIcon,
  CalendarCheck,
  Plus,
  Scale,
  Heart,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { medicalRecordApi } from '../api/medicalRecordApi';
import { petApi } from '../api/petApi';
import { MedicalRecordCard } from '../components/medical/MedicalRecordCard';
import type { MedicalResponse } from '../api/medicalRecordApi';
import type { PetResponse } from '../api/petApi';

const DEFAULT_PET_IMAGES: Record<string, string> = {
  DOG: '/assets/default-dog.svg',
  CAT: '/assets/default-cat.svg',
  BIRD: '/assets/default-bird.svg',
  RABBIT: '/assets/default-rabbit.svg',
  HAMSTER: '/assets/default-hamster.svg',
  OTHER: '/assets/default-pet.svg',
};

const SPECIES_MAP: Record<string, string> = {
  DOG: 'Chó',
  CAT: 'Mèo',
  BIRD: 'Chim',
  RABBIT: 'Thỏ',
  HAMSTER: 'Hamster',
  OTHER: 'Khác',
};

const GENDER_MAP: Record<string, string> = {
  MALE: 'Đực',
  FEMALE: 'Cái',
};

export default function PetMedicalRecords() {
  const { petId } = useParams<{ petId: string }>();
  const { user } = useAuth();

  const [pet, setPet] = useState<PetResponse | null>(null);
  const [records, setRecords] = useState<MedicalResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && petId) fetchData();
  }, [user, petId]);

  const fetchData = async () => {
    if (!user || !petId) return;
    try {
      setLoading(true);
      const [pet, medicalRecords] = await Promise.all([
        petApi.getById(Number(petId), Number(user.id)),
        medicalRecordApi.getRecordsByPet(Number(petId)),
      ]);
      setPet(pet);
      console.log(pet);
      setRecords(medicalRecords);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Stats từ records (chỉ tính, không gọi API thêm)
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
    const latest = records[0]?.appointmentDate || null;
    return { total: records.length, withImages, upcoming, latest };
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

  const petImage = pet?.imageUrl || DEFAULT_PET_IMAGES[pet?.species || 'OTHER'] || DEFAULT_PET_IMAGES.OTHER;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/60 via-white to-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header gradient với pet info */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 p-6 md:p-8 mb-6 shadow-lg">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -left-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

          <div className="relative">
            <Link
              to="/my-pets"
              className="inline-flex items-center gap-1.5 text-sky-100 hover:text-white text-sm mb-3 transition"
            >
              <ArrowLeft size={16} /> Quay lại Thú cưng
            </Link>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={petImage}
                  alt={pet?.name || 'pet'}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover bg-white ring-4 ring-white/30 shadow-md shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      DEFAULT_PET_IMAGES[pet?.species || 'OTHER'] || DEFAULT_PET_IMAGES.OTHER;
                  }}
                />
                <div className="min-w-0">
                  <p className="text-sky-100 text-sm font-medium tracking-wide uppercase">
                    Hồ sơ bệnh án
                  </p>
                  <h1 className="text-2xl md:text-3xl font-bold text-white truncate">
                    {pet?.name || 'Thú cưng'}
                  </h1>
                  {/* Chips info pet */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {pet?.species && (
                      <InfoChip icon={<PawPrint size={12} />} text={SPECIES_MAP[pet.species] || pet.species} />
                    )}
                    {pet?.breed && <InfoChip text={pet.breed} />}
                    {pet?.age != null && <InfoChip text={`${pet.age} tháng`} />}
                    {pet?.weight != null && (
                      <InfoChip icon={<Scale size={12} />} text={`${pet.weight} kg`} />
                    )}
                    {pet?.gender && (
                      <InfoChip text={GENDER_MAP[pet.gender] || pet.gender} />
                    )}
                  </div>
                </div>
              </div>

              <Link
                to="/book-appointment"
                className="inline-flex items-center gap-2 bg-white text-sky-700 px-5 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-xl hover:-translate-y-0.5 transition self-start md:self-auto"
              >
                <Plus size={20} /> Đặt lịch khám mới
              </Link>
            </div>

            {/* Stats */}
            <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              <StatCard
                label="Tổng bệnh án"
                value={String(stats.total)}
                icon={<FileText size={18} />}
              />
              <StatCard
                label="Lần gần nhất"
                value={
                  stats.latest
                    ? new Date(stats.latest).toLocaleDateString('vi-VN')
                    : '—'
                }
                icon={<Calendar size={18} />}
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
          </div>
        </div>

        {/* Empty state */}
        {records.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 py-16 px-6 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-sky-50 flex items-center justify-center">
              <FileText size={36} className="text-sky-500" />
            </div>
            <p className="text-gray-700 text-lg font-semibold mb-1">Chưa có bệnh án nào</p>
            <p className="text-gray-500 text-sm mb-5">
              Bệnh án sẽ xuất hiện sau khi bác sĩ hoàn tất khám
            </p>
            <Link
              to="/book-appointment"
              className="inline-flex items-center gap-2 bg-sky-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-sky-700 transition shadow"
            >
              <Heart size={18} /> Đặt lịch khám đầu tiên
            </Link>
          </div>
        ) : (
          /* Records list — mỗi lần khám là 1 card */
          <div className="space-y-5">
            {records.map((record, index) => (
              <MedicalRecordCard
                key={record.id}
                record={record}
                showPetHeader={false}
                badgeLabel={index === 0 ? 'Gần nhất' : undefined}
              />
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

// Chip thông tin pet trên header
function InfoChip({ icon, text }: { icon?: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur ring-1 ring-white/25 text-white text-xs font-semibold px-2 py-0.5 rounded-md">
      {icon}
      {text}
    </span>
  );
}
