import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/my-pets" className="inline-flex items-center gap-1 text-sky-600 hover:underline text-sm mb-6">
        <ArrowLeft size={16} /> Quay lại Thú cưng
      </Link>

      {/* Pet header card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-5">
          {pet?.imageUrl ? (
            <img
              src={pet.imageUrl}
              alt={pet.name}
              className="w-20 h-20 rounded-full object-cover border-4 border-sky-100 shadow-sm"
            />
          ) : (
            <img
            src={DEFAULT_PET_IMAGES[pet?.species || 'OTHER']}
            className="w-20 h-20 rounded-full object-cover border-4 border-sky-100 shadow-sm"

            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Hồ sơ bệnh án — {pet?.name || 'Thú cưng'}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {records.length > 0
                ? `${records.length} lần khám có hồ sơ`
                : 'Chưa có hồ sơ nào'}
            </p>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {records.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
          <FileText size={52} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 font-semibold text-lg mb-1">Chưa có bệnh án nào</p>
          <p className="text-gray-400 text-sm">Bệnh án sẽ xuất hiện sau khi bác sĩ hoàn tất khám</p>
        </div>
      )}

      {/* Records list — mỗi lần khám là 1 card, hiển thị ngày + booking code ở header */}
      <div className="space-y-6">
        {records.map((record, index) => (
          <MedicalRecordCard
            key={record.id}
            record={record}
            showPetHeader={false}
            badgeLabel={index === 0 ? 'Gần nhất' : undefined}
          />
        ))}
      </div>
    </div>
  );
}
