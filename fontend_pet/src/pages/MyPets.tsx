import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, X, Camera, FileText } from 'lucide-react';
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
    setCurrentImageUrl(pet.imageUrl?pet.imageUrl : '');
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
    /**
     Hộp thoại mở ra → User chọn "milo.jpg" → Nhấn Open
       │
       ▼
Trình duyệt đóng gói file vào e.target.files
       │
       ▼
Gọi onChange={handleFileChange} → truyền e vào
       │
       ▼
const file = e.target.files?.[0]    ← Lấy file ra
       │
       ├── file.type → validate loại ảnh
       ├── file.size → validate kích thước
       ├── setSelectedFile(file)    → lưu file gốc (để upload sau)
       └── FileReader → setPreviewUrl(...)  → hiển thị xem trước
     */
    if (!file) return;

    // Kiểm tra loại file
    if (!file.type.startsWith('image/')) {
      setError('Chỉ cho phép upload ảnh (JPG, PNG, ...)');
      return;
    }

    // Kiểm tra kích thước (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Ảnh không được quá 5MB');
      return;
    }

    setSelectedFile(file);// Lưu file gốc (sau này upload lên server)
    setError('');

    // Tạo preview URL
    const reader = new FileReader();//API có sẵn để đọc file từ máy user
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    }; // reader.onloadend chỉ được gọi khi ta gọi 1 lệnh đọc ( ở đây là readasurl)
    reader.readAsDataURL(file); // đây là lí do vì sao viết reader.onloadend trước reader.readasurl
      // reader.result chứa kết quả  là 1 một chuỗi base64 dạng:
      //"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDA..."
      /**
data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...
│    │              │   │
│    │              │   └── Nội dung ảnh được mã hóa thành chữ
│    │              └────── Kiểu mã hóa: base64
│    └───────────────────── Loại file: image/jpeg
└────────────────────────── Đây là data URL (không phải link HTTP)
<img src="data:image/jpeg;base64,/9j/4AAQ..." />
Browser: "À, đây là ảnh jpeg, data nằm ngay trong chuỗi, để tao render"

       * 
       */
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
      // Upload ảnh trước nếu có chọn file
      let imageUrl;
      if (selectedFile) {
        imageUrl = await petApi.uploadImage(selectedFile);
      } else if(currentImageUrl != '' && !Object.values(DEFAULT_PET_IMAGES).includes(currentImageUrl)) {
        imageUrl = currentImageUrl;
      } else {
        imageUrl = DEFAULT_PET_IMAGES[form.species] || DEFAULT_PET_IMAGES.OTHER;
      };


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

  // Lấy URL ảnh hiển thị cho pet (fallback sang emoji nếu ảnh lỗi)
  const getPetImageUrl = (pet: PetResponse) => {
    if (pet.imageUrl && !Object.values(DEFAULT_PET_IMAGES).includes(pet.imageUrl)) {
      return pet.imageUrl;
    }
    return DEFAULT_PET_IMAGES[pet.species] || DEFAULT_PET_IMAGES.OTHER;
  };

  // Chưa đăng nhập
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">Vui lòng đăng nhập</p>
          <Link to="/login" className="bg-sky-600 text-white px-6 py-2 rounded-lg">
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Thú cưng của tôi</h1>
        <button
          onClick={openAddForm}
          className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition"
        >
          <Plus size={20} />
          Thêm thú cưng
        </button>
      </div>

      {/* Danh sách pet */}
      {pets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg mb-2">Chưa có thú cưng nào</p>
          <p className="text-gray-400 text-sm">Nhấn "Thêm thú cưng" để bắt đầu</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {pets.map((pet) => (
            <div key={pet.id} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Ảnh pet */}
              <div className="h-48 bg-gray-100 relative">
                <img
                  src={getPetImageUrl(pet)}
                  alt={pet.name}
                  className={`w-full h-full ${Object.values(DEFAULT_PET_IMAGES).includes(getPetImageUrl(pet)) ? 'object-contain p-4' : 'object-cover'}`}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement; // nếu ảnh lỗi, lấy thẻ img bị lỗi
                    target.onerror = null; // tắt error để tránh vòng lặp vô tận 
                    target.src = DEFAULT_PET_IMAGES[pet.species] || DEFAULT_PET_IMAGES.OTHER; //set lại ảnh default
                    target.className = 'w-full h-full object-contain p-4'; // set lại css 
                  }}
                />
              </div>

              {/* Thông tin pet */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{pet.name}</h3>
                    <span className="text-sm text-sky-600 font-semibold">
                      {SPECIES_MAP[pet.species] || pet.species}
                    </span>
                  </div>
                  {/* Nút bệnh án / sửa / xóa */}
                  <div className="flex gap-2">
                    <Link
                      to={`/my-pets/${pet.id}/records`}
                      className="p-2 text-sky-500 hover:bg-sky-50 rounded transition"
                      title="Xem bệnh án"
                    >
                      <FileText size={16} />
                    </Link>
                    <button
                      onClick={() => openEditForm(pet)}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded transition"
                      title="Sửa"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(pet.id, pet.name)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded transition"
                      title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Thông tin chi tiết */}
                <div className="text-sm text-gray-600 space-y-1">
                  {pet.breed && <p>Giống: {pet.breed}</p>}
                  {pet.age && <p>Tuổi: {pet.age} tháng</p>}
                  {pet.weight && <p>Cân nặng: {pet.weight} kg</p>}
                  {pet.gender && <p>Giới tính: {GENDER_MAP[pet.gender] || pet.gender}</p>}
                  {pet.notes && <p className="text-gray-400 italic">"{pet.notes}"</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== MODAL FORM THÊM/SỬA ===== */}
      {showForm && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 bg-black/50 z-40" onClick={closeForm} />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingPetId ? 'Sửa thú cưng' : 'Thêm thú cưng mới'}
                </h2>
                <button onClick={closeForm} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {error && (
                  <div className="bg-red-100 text-red-600 p-3 rounded">{error}</div>
                )}

                {/* Upload ảnh */}
                <div>
                  <label className="block text-gray-700 mb-1 text-sm font-semibold">Ảnh thú cưng</label>
                  <div className="flex items-center gap-4">
                    {/* Preview ảnh */}
                    <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : currentImageUrl && !Object.values(DEFAULT_PET_IMAGES).includes(currentImageUrl) ? (
                        <img src={currentImageUrl} alt="Current" className="w-full h-full object-cover" />
                      ) : (
                        <img src={DEFAULT_PET_IMAGES[form.species] || DEFAULT_PET_IMAGES.OTHER} alt="Default" className="w-full h-full object-contain p-2" />
                      )}
                    </div>

                    <div className="flex-1">
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
                        className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 transition text-sm"
                      >
                        <Camera size={16} />
                        Chọn ảnh
                      </button>
                      {selectedFile && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-gray-500 truncate max-w-[150px]">{selectedFile.name}</span>
                          <button
                            type="button"
                            onClick={removeSelectedImage}
                            className="text-red-500 text-xs hover:underline"
                          >
                            Xóa
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {editingPetId ? 'Chọn ảnh mới hoặc giữ ảnh cũ' : 'Không chọn sẽ dùng ảnh mặc định'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tên */}
                <div>
                  <label className="block text-gray-700 mb-1 text-sm font-semibold">Tên thú cưng *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="VD: Miu Miu, Lucky..."
                    required
                  />
                </div>

                {/* Loài + Giống */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-1 text-sm font-semibold">Loài *</label>
                    <select
                      value={form.species}
                      onChange={(e) => setForm({ ...form, species: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                    <label className="block text-gray-700 mb-1 text-sm font-semibold">Giống</label>
                    <input
                      type="text"
                      value={form.breed}
                      onChange={(e) => setForm({ ...form, breed: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="VD: Corgi, Mèo Ba Tư..."
                    />
                  </div>
                </div>

                {/* Tuổi + Cân nặng */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-1 text-sm font-semibold">Tuổi (tháng)</label>
                    <input
                      type="number"
                      value={form.age}
                      onChange={(e) => setForm({ ...form, age: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                      min="0"
                      placeholder="VD: 12"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1 text-sm font-semibold">Cân nặng (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={form.weight}
                      onChange={(e) => setForm({ ...form, weight: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                      min="0"
                      placeholder="VD: 4.5"
                    />
                  </div>
                </div>

                {/* Giới tính */}
                <div>
                  <label className="block text-gray-700 mb-1 text-sm font-semibold">Giới tính</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="MALE"
                        checked={form.gender === 'MALE'}
                        onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      />
                      Đực
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="FEMALE"
                        checked={form.gender === 'FEMALE'}
                        onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      />
                      Cái
                    </label>
                  </div>
                </div>

                {/* Ghi chú */}
                <div>
                  <label className="block text-gray-700 mb-1 text-sm font-semibold">Ghi chú</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="VD: Dị ứng thức ăn, bệnh lý..."
                  />
                </div>

                {/* Nút submit */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition disabled:opacity-50"
                  >
                    {submitting ? 'Đang lưu...' : editingPetId ? 'Cập nhật' : 'Thêm'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
