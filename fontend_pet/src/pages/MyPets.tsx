import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, X, Camera, FileText, Scale, Calendar, Heart, PawPrint, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { petApi } from '../api/petApi';
import type { PetResponse, PetRequest } from '../api/petApi';

// Map species sang tiếng Việt
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

// Ảnh mặc định theo loài (dùng emoji placeholder)
const DEFAULT_PET_IMAGES: Record<string, string> = {
  DOG: '/assets/default-dog.svg',
  CAT: '/assets/default-cat.svg',
  BIRD: '/assets/default-bird.svg',
  RABBIT: '/assets/default-rabbit.svg',
  HAMSTER: '/assets/default-hamster.svg',
  OTHER: '/assets/default-pet.svg',
};

// Form trống ban đầu
const EMPTY_FORM = {
  name: '',
  species: 'DOG',
  breed: '',
  age: '',
  weight: '',
  gender: 'MALE',
  notes: '',
};

export default function MyPets() {
  const { user } = useAuth();
  const [pets, setPets] = useState<PetResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // State cho form thêm/sửa
  const [showForm, setShowForm] = useState(false);
  const [editingPetId, setEditingPetId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // State cho ảnh upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [currentImageUrl, setCurrentImageUrl] = useState<string>(''); // ảnh hiện tại khi sửa
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter theo loài (chỉ ảnh hưởng hiển thị, không động tới data gốc)
  const [speciesFilter, setSpeciesFilter] = useState<string>('ALL');

  useEffect(() => {
    if (user) fetchPets();
  }, [user]);

  const fetchPets = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await petApi.getPets(user.id);
      setPets(data);
    } catch (err) {
      console.error('Failed to fetch pets:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mở form THÊM
  const openAddForm = () => {
    setEditingPetId(null);
    setForm(EMPTY_FORM);
    setSelectedFile(null);
    setPreviewUrl('');
    setCurrentImageUrl('');
    setError('');
    setShowForm(true);
  };

  // Mở form SỬA (điền sẵn data)
  const openEditForm = (pet: PetResponse) => {
    setEditingPetId(pet.id);
    setForm({
      name: pet.name,
      species: pet.species,
      breed: pet.breed || '',
      age: pet.age ? String(pet.age) : '',
      weight: pet.weight ? String(pet.weight) : '',
      gender: pet.gender || 'MALE',
      notes: pet.notes || '',
    });
    setSelectedFile(null);
    setPreviewUrl('');
    setCurrentImageUrl(pet.imageUrl ? pet.imageUrl : '');
    setError('');
    setShowForm(true);
  };

  // Đóng form
  const closeForm = () => {
    setShowForm(false);
    setEditingPetId(null);
    setForm(EMPTY_FORM);
    setSelectedFile(null);
    setPreviewUrl('');
    setCurrentImageUrl('');
    setError('');
  };

  // Xử lý chọn file ảnh
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Chỉ cho phép upload ảnh (JPG, PNG, ...)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Ảnh không được quá 5MB');
      return;
    }

    setSelectedFile(file);
    setError('');

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Xóa ảnh đã chọn
  const removeSelectedImage = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Xử lý submit form (thêm hoặc sửa)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!form.name.trim()) {
      setError('Vui lòng nhập tên thú cưng');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      let imageUrl;
      if (selectedFile) {
        imageUrl = await petApi.uploadImage(selectedFile);
      } else if (currentImageUrl != '' && !Object.values(DEFAULT_PET_IMAGES).includes(currentImageUrl)) {
        imageUrl = currentImageUrl;
      } else {
        imageUrl = DEFAULT_PET_IMAGES[form.species] || DEFAULT_PET_IMAGES.OTHER;
      }

      const petData: PetRequest = {
        userId: user.id,
        name: form.name,
        species: form.species,
        breed: form.breed,
        age: form.age ? Number(form.age) : null,
        weight: form.weight ? Number(form.weight) : null,
        gender: form.gender,
        notes: form.notes,
        imageUrl: imageUrl,
      };

      if (editingPetId) {
        await petApi.updatePet(editingPetId, petData);
      } else {
        await petApi.createPet(petData);
      }
      closeForm();
      fetchPets();
    } catch (err) {
      console.error('Failed to save pet:', err);
      setError('Không thể lưu. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  // Xóa pet
  const handleDelete = async (petId: number, petName: string) => {
    if (!user) return;
    if (!confirm(`Bạn có chắc muốn xóa ${petName}?`)) return;

    try {
      await petApi.deletePet(petId, user.id);
      fetchPets();
    } catch (err) {
      console.error('Failed to delete pet:', err);
      alert('Không thể xóa. Vui lòng thử lại.');
    }
  };

  // Lấy URL ảnh hiển thị cho pet
  const getPetImageUrl = (pet: PetResponse) => {
    if (pet.imageUrl && !Object.values(DEFAULT_PET_IMAGES).includes(pet.imageUrl)) {
      return pet.imageUrl;
    }
    return DEFAULT_PET_IMAGES[pet.species] || DEFAULT_PET_IMAGES.OTHER;
  };

  // Đếm theo loài (cho stats + filter pills)
  const speciesCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: pets.length };
    for (const pet of pets) {
      counts[pet.species] = (counts[pet.species] || 0) + 1;
    }
    return counts;
  }, [pets]);

  // Pets sau khi lọc theo loài
  const filteredPets = useMemo(() => {
    if (speciesFilter === 'ALL') return pets;
    return pets.filter((p) => p.species === speciesFilter);
  }, [pets, speciesFilter]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-sm w-full">
          <p className="text-gray-500 text-lg mb-6 font-medium">Vui lòng đăng nhập để tiếp tục</p>
          <Link to="/login" className="block w-full bg-sky-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md shadow-sky-600/10 hover:bg-sky-700 transition">
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-sky-600"></div>
          <span className="text-sm font-medium text-gray-500">Đang tải danh sách...</span>
        </div>
      </div>
    );
  }

  // Các loài user thực sự có pet (để build filter pills)
  const availableSpecies = Object.keys(speciesCounts).filter((k) => k !== 'ALL');

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/60 via-white to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header gradient + thống kê */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 p-6 md:p-8 mb-6 shadow-lg">
          {/* Decoration */}
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -left-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/20 backdrop-blur items-center justify-center ring-1 ring-white/30">
                <PawPrint size={28} className="text-white" />
              </div>
              <div>
                <p className="text-sky-100 text-sm font-medium tracking-wide uppercase">
                  Hồ sơ thú cưng
                </p>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Thú cưng của tôi</h1>
                <p className="text-sky-100 text-sm mt-1">
                  Quản lý hồ sơ, thông tin sức khỏe và bệnh án của các bé
                </p>
              </div>
            </div>
            <button
              onClick={openAddForm}
              className="inline-flex items-center justify-center gap-2 bg-white text-sky-700 px-5 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-xl hover:-translate-y-0.5 transition self-start md:self-auto"
            >
              <Plus size={20} className="stroke-[2.5]" />
              Thêm thú cưng
            </button>
          </div>

          {/* Stats */}
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <StatCard label="Tổng thú cưng" value={speciesCounts.ALL || 0} icon={<Heart size={18} />} />
            <StatCard label="Chó" value={speciesCounts.DOG || 0} icon={<PawPrint size={18} />} />
            <StatCard label="Mèo" value={speciesCounts.CAT || 0} icon={<PawPrint size={18} />} />
            <StatCard
              label="Loài khác"
              value={(speciesCounts.ALL || 0) - (speciesCounts.DOG || 0) - (speciesCounts.CAT || 0)}
              icon={<Sparkles size={18} />}
            />
          </div>
        </div>

        {/* Filter pills theo loài — chỉ hiện khi có pet */}
        {pets.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            <FilterPill
              active={speciesFilter === 'ALL'}
              label="Tất cả"
              count={speciesCounts.ALL || 0}
              onClick={() => setSpeciesFilter('ALL')}
            />
            {availableSpecies.map((sp) => (
              <FilterPill
                key={sp}
                active={speciesFilter === sp}
                label={SPECIES_MAP[sp] || sp}
                count={speciesCounts[sp] || 0}
                onClick={() => setSpeciesFilter(sp)}
              />
            ))}
          </div>
        )}

        {/* Main Content Area */}
        {pets.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 max-w-md mx-auto">
            <div className="w-16 h-16 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-4 text-sky-500">
              <Heart size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Chưa có thú cưng nào</h3>
            <p className="text-gray-500 text-sm mb-6">Hãy thêm bé cưng đầu tiên để trải nghiệm các dịch vụ chăm sóc tốt nhất.</p>
            <button
              onClick={openAddForm}
              className="text-sm font-semibold bg-sky-50 text-sky-600 px-4 py-2 rounded-lg hover:bg-sky-100 transition"
            >
              Nhấp vào đây để thêm ngay
            </button>
          </div>
        ) : filteredPets.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl ring-1 ring-gray-100 max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
              <PawPrint size={28} />
            </div>
            <p className="text-gray-700 font-semibold mb-1">Không có {SPECIES_MAP[speciesFilter] || 'thú cưng'} nào</p>
            <p className="text-gray-500 text-sm mb-4">Thử chọn loài khác hoặc thêm bé mới</p>
            <button
              onClick={() => setSpeciesFilter('ALL')}
              className="text-sm font-semibold text-sky-600 hover:underline"
            >
              Xem tất cả
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPets.map((pet) => {
            const isDefaultImage = Object.values(DEFAULT_PET_IMAGES).includes(getPetImageUrl(pet));
            return (
              <div key={pet.id} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                {/* Pet Image Frame */}
                <div className="h-52 bg-gradient-to-b from-gray-50 to-gray-100/50 relative overflow-hidden">
                  <img
                    src={getPetImageUrl(pet)}
                    alt={pet.name}
                    className={`w-full h-full transition-transform duration-500 group-hover:scale-105 ${isDefaultImage ? 'object-contain p-8' : 'object-cover'}`}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = DEFAULT_PET_IMAGES[pet.species] || DEFAULT_PET_IMAGES.OTHER;
                      target.className = 'w-full h-full object-contain p-8';
                    }}
                  />
                  
                  {/* Floating Gender/Species Badge */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 pointer-events-none">
                    <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white/90 backdrop-blur-sm text-sky-700 shadow-sm border border-gray-100">
                      {SPECIES_MAP[pet.species] || pet.species}
                    </span>
                    {pet.gender && (
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg backdrop-blur-sm text-white shadow-sm ${pet.gender === 'MALE' ? 'bg-blue-500/90' : 'bg-pink-500/90'}`}>
                        {GENDER_MAP[pet.gender] || pet.gender}
                      </span>
                    )}
                  </div>

                  {/* Actions Hover Overlays */}
                  <div className="absolute top-3 right-3 flex gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Link
                      to={`/my-pets/${pet.id}/records`}
                      className="p-2 bg-white/90 backdrop-blur-sm text-sky-600 hover:bg-sky-600 hover:text-white rounded-xl shadow-sm transition-all duration-200"
                      title="Xem bệnh án"
                    >
                      <FileText size={16} />
                    </Link>
                    <button
                      onClick={() => openEditForm(pet)}
                      className="p-2 bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-gray-800 hover:text-white rounded-xl shadow-sm transition-all duration-200"
                      title="Sửa"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(pet.id, pet.name)}
                      className="p-2 bg-white/90 backdrop-blur-sm text-red-500 hover:bg-red-600 hover:text-white rounded-xl shadow-sm transition-all duration-200"
                      title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Pet Information Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-sky-600 transition-colors line-clamp-1">{pet.name}</h3>
                    <p className="text-xs font-medium text-gray-400 mt-0.5 mb-4 truncate">
                      {pet.breed ? `Giống: ${pet.breed}` : 'Chưa cập nhật dòng giống'}
                    </p>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={15} className="text-gray-400 shrink-0" />
                        <span className="text-xs font-medium truncate">
                          {pet.age ? `${pet.age} tháng` : '--'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Scale size={15} className="text-gray-400 shrink-0" />
                        <span className="text-xs font-medium truncate">
                          {pet.weight ? `${pet.weight} kg` : '--'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notes & Bottom Section */}
                  {pet.notes && (
                    <p className="text-xs text-gray-400 italic bg-amber-50/60 border border-amber-100/50 rounded-lg p-2 line-clamp-2 mt-auto">
                      "{pet.notes}"
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== MODAL FORM THÊM/SỬA (Đã căn chỉnh tinh tế, mượt mà hơn) ===== */}
      {showForm && (
        <>
          {/* Overlay với hiệu ứng làm mờ nền */}
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 transition-opacity" onClick={closeForm} />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingPetId ? '✏️ Cập nhật thông tin bé' : '🐾 Thêm thú cưng mới'}
                </h2>
                <button onClick={closeForm} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition">
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={handleSubmit} className="p-5 space-y-5">
                {error && (
                  <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-sm font-medium border border-red-100">{error}</div>
                )}

                {/* Upload ảnh */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <label className="block text-gray-700 mb-2 text-xs font-bold uppercase tracking-wider">Ảnh thú cưng</label>
                  <div className="flex items-center gap-4">
                    {/* Preview ảnh */}
                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-white shrink-0 shadow-inner">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : currentImageUrl && !Object.values(DEFAULT_PET_IMAGES).includes(currentImageUrl) ? (
                        <img src={currentImageUrl} alt="Current" className="w-full h-full object-cover" />
                      ) : (
                        <img src={DEFAULT_PET_IMAGES[form.species] || DEFAULT_PET_IMAGES.OTHER} alt="Default" className="w-full h-full object-contain p-2" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-3.5 py-2 border border-gray-200 rounded-xl bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition text-sm font-semibold shadow-sm"
                      >
                        <Camera size={16} className="text-gray-500" />
                        Chọn ảnh từ máy
                      </button>
                      
                      {selectedFile && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs font-medium text-sky-600 truncate max-w-[150px]">{selectedFile.name}</span>
                          <button
                            type="button"
                            onClick={removeSelectedImage}
                            className="text-red-500 text-xs font-semibold hover:underline"
                          >
                            Xóa
                          </button>
                        </div>
                      )}
                      <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
                        {editingPetId ? 'Chọn ảnh mới hoặc giữ ảnh cũ' : 'Không chọn hệ thống sẽ áp dụng ảnh đại diện mặc định.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tên */}
                <div>
                  <label className="block text-gray-800 mb-1.5 text-sm font-bold">Tên thú cưng <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-gray-300"
                    placeholder="VD: Miu Miu, Lucky..."
                    required
                  />
                </div>

                {/* Loài + Giống */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-800 mb-1.5 text-sm font-bold">Loài <span className="text-red-500">*</span></label>
                    <select
                      value={form.species}
                      onChange={(e) => setForm({ ...form, species: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                    >
                      <option value="DOG">Chó</option>
                      <option value="CAT">Mèo</option>
                      <option value="BIRD">Chim</option>
                      <option value="RABBIT">Thỏ</option>
                      <option value="HAMSTER">Hamster</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-800 mb-1.5 text-sm font-bold">Giống chủng</label>
                    <input
                      type="text"
                      value={form.breed}
                      onChange={(e) => setForm({ ...form, breed: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-gray-300"
                      placeholder="VD: Corgi, Poodle..."
                    />
                  </div>
                </div>

                {/* Tuổi + Cân nặng */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-800 mb-1.5 text-sm font-bold">Tuổi (tháng)</label>
                    <input
                      type="number"
                      value={form.age}
                      onChange={(e) => setForm({ ...form, age: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-gray-300"
                      min="0"
                      placeholder="VD: 12"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-800 mb-1.5 text-sm font-bold">Cân nặng (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={form.weight}
                      onChange={(e) => setForm({ ...form, weight: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-gray-300"
                      min="0"
                      placeholder="VD: 4.5"
                    />
                  </div>
                </div>

                {/* Giới tính */}
                <div>
                  <label className="block text-gray-800 mb-2 text-sm font-bold">Giới tính sinh học</label>
                  <div className="flex gap-6 bg-gray-50 p-3 rounded-xl border border-gray-100 w-fit">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-700">
                      <input
                        type="radio"
                        name="gender"
                        value="MALE"
                        checked={form.gender === 'MALE'}
                        onChange={(e) => setForm({ ...form, gender: e.target.value })}
                        className="w-4 h-4 text-sky-600 focus:ring-sky-500 border-gray-300"
                      />
                      Đực
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-700">
                      <input
                        type="radio"
                        name="gender"
                        value="FEMALE"
                        checked={form.gender === 'FEMALE'}
                        onChange={(e) => setForm({ ...form, gender: e.target.value })}
                        className="w-4 h-4 text-sky-600 focus:ring-sky-500 border-gray-300"
                      />
                      Cái
                    </label>
                  </div>
                </div>

                {/* Ghi chú */}
                <div>
                  <label className="block text-gray-800 mb-1.5 text-sm font-bold">Tiền sử / Ghi chú đặc biệt</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={2.5}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-gray-300"
                    placeholder="Ví dụ: Kén ăn, dị ứng thuốc gây mê hoặc các bệnh lý nền..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-3 border-t border-gray-100 sticky bottom-0 bg-white">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-sky-600 text-white px-4 py-3 rounded-xl font-semibold shadow-md shadow-sky-600/10 hover:bg-sky-700 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Đang xử lý...' : editingPetId ? 'Cập nhật bé' : 'Lưu thông tin'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
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
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white/15 backdrop-blur ring-1 ring-white/25 rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-2 text-sky-50 text-xs font-medium">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
    </div>
  );
}

// Filter pill theo loài
function FilterPill({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap ${
        active
          ? 'bg-sky-600 text-white shadow-md'
          : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-sky-50 hover:text-sky-700'
      }`}
    >
      {label}
      <span
        className={`text-xs px-2 py-0.5 rounded-full ${
          active ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
        }`}
      >
        {count}
      </span>
    </button>
  );
}