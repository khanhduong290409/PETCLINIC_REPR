import { useState, useEffect, useRef } from 'react';
import { Pencil, Trash2, Plus, X, Stethoscope, Camera } from 'lucide-react';
import { adminApi, type PetServiceData } from '../../api/adminApi';
import { useToast } from '../../contexts/ToastContext';

const CATEGORY_SUGGESTIONS = ['vaccination', 'surgery', 'dental', 'grooming', 'checkup', 'dermatology'];

const CATEGORY_LABEL: Record<string, string> = {
  vaccination: 'Tiêm phòng',
  surgery: 'Phẫu thuật',
  dental: 'Nha khoa',
  grooming: 'Làm đẹp',
  checkup: 'Khám tổng quát',
  dermatology: 'Da liễu',
};

const getCategoryLabel = (cat: string) => CATEGORY_LABEL[cat] ?? cat;

const emptyForm = {
  title: '',
  description: '',
  price: '',
  duration: '',
  category: '',
};

type FormData = typeof emptyForm;

const PAGE_SIZE = 10;

export default function AdminServices() {
  const { showToast } = useToast();

  const [services, setServices] = useState<PetServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editService, setEditService] = useState<PetServiceData | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Upload ảnh — giống AdminProducts
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getServices();
      setServices(data.sort((a, b) => a.id - b.id));
    } catch {
      showToast('Không thể tải danh sách dịch vụ', 'error');
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(services.map((s) => s.category)));


  const filtered = services.filter((s) => {
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === '' || s.category === filterCategory;
    return matchSearch && matchCategory;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterCategory]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // --- Xử lý file ảnh ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Chỉ cho phép upload ảnh (JPG, PNG, ...)', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Ảnh không được quá 5MB', 'error');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeSelectedImage = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    /*
fileInputRef.current là phần tử DOM thật (HTMLInputElement), không phải React state.
DOM quy định input.value luôn là string — không chấp nhận null:
    */
  };

  // --- Modal ---
  const openAdd = () => {
    setEditService(null);
    setForm(emptyForm);
    setSelectedFile(null);
    setPreviewUrl('');
    setCurrentImageUrl('');
    setModalOpen(true);
  };

  const openEdit = (s: PetServiceData) => {
    setEditService(s);
    setForm({
      title: s.title,
      description: s.description ?? '',
      price: String(s.price),
      duration: String(s.duration),
      category: s.category,
    });
    setSelectedFile(null);
    setPreviewUrl('');
    // Chỉ giữ ảnh cũ nếu là URL hợp lệ (Cloudinary), bỏ qua /assets/...
    setCurrentImageUrl(s.imageUrl ? s.imageUrl : '');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditService(null);
    setSelectedFile(null);
    setPreviewUrl('');
    setCurrentImageUrl('');
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.price || !form.duration || !form.category.trim()) {
      showToast('Vui lòng điền đủ tên, giá, thời gian và danh mục', 'error');
      return;
    }

    setSaving(true);

    // Upload ảnh lên Cloudinary nếu có file mới, không thì giữ ảnh cũ
    let imageUrl = currentImageUrl;
    if (selectedFile) {
      try {
        imageUrl = await adminApi.uploadServiceImage(selectedFile);
      } catch {
        showToast('Upload ảnh thất bại, thử lại', 'error');
        setSaving(false);
        return;
      }
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      imageUrl: imageUrl,
      price: parseFloat(form.price),
      duration: parseInt(form.duration),
      category: form.category.trim(),
    };

    try {
      if (editService) {
        const updated = await adminApi.updateService(editService.id, payload);
        setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        showToast('Cập nhật dịch vụ thành công');
      } else {
        const created = await adminApi.createService(payload);
        setServices((prev) => [...prev, created].sort((a, b) => a.id - b.id));
        showToast('Thêm dịch vụ thành công');
      }
      closeModal();
    } catch {
      showToast('Lưu thất bại, thử lại', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await adminApi.deleteService(deleteId);
      setServices((prev) => prev.filter((s) => s.id !== deleteId));
      showToast('Đã xóa dịch vụ');
      setDeleteId(null);
    } catch {
      showToast('Không thể xóa dịch vụ', 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý dịch vụ khám</h1>
          <p className="text-gray-500 text-sm mt-1">
            Hiển thị {filtered.length} / {services.length} dịch vụ
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Thêm dịch vụ
        </button>
      </div>

      {/* Search + Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 space-y-3">
        <input
          type="text"
          placeholder="Tìm theo tên dịch vụ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
        />
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-500 font-medium">Danh mục:</span>
            <button
              onClick={() => setFilterCategory('')}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                filterCategory === ''
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-sky-400'
              }`}
            >
              Tất cả ({services.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  filterCategory === cat
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-sky-400'
                }`}
              >
                {getCategoryLabel(cat)} ({services.filter((s) => s.category === cat).length})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow text-gray-400 gap-3">
          <Stethoscope size={40} />
          <p>Không có dịch vụ nào</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold w-16">Ảnh</th>
                <th className="px-4 py-3 font-semibold">Tên dịch vụ</th>
                <th className="px-4 py-3 font-semibold">Danh mục</th>
                <th className="px-4 py-3 font-semibold text-right">Giá</th>
                <th className="px-4 py-3 font-semibold text-center">Thời gian</th>
                <th className="px-4 py-3 font-semibold text-center w-28">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  {/* Ảnh — chỉ hiện nếu là URL tuyệt đối hợp lệ */}
                  <td className="px-4 py-3">
                    {s.imageUrl ? (
                      <img
                        src={s.imageUrl}
                        alt={s.title}
                        className="w-12 h-12 object-cover rounded-md border border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center text-gray-300">
                        <Stethoscope size={20} />
                      </div>
                    )}
                  </td>

                  {/* Tên */}
                  <td className="px-4 py-3 font-medium text-gray-800 max-w-64">
                    <p className="line-clamp-1">{s.title}</p>
                    {s.description && (
                      <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{s.description}</p>
                    )}
                  </td>

                  {/* Danh mục */}
                  <td className="px-4 py-3">
                    <span className="bg-teal-50 text-teal-700 border border-teal-100 rounded-full px-2 py-0.5 text-xs">
                      {getCategoryLabel(s.category)}
                    </span>
                  </td>

                  {/* Giá */}
                  <td className="px-4 py-3 text-right font-medium text-gray-800">
                    {Number(s.price).toLocaleString('vi-VN')}đ
                  </td>

                  {/* Thời gian */}
                  <td className="px-4 py-3 text-center text-gray-600">
                    {s.duration} phút
                  </td>

                  {/* Hành động */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(s)}
                        className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-md transition-colors"
                        title="Sửa"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteId(s.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="Xóa"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 py-4 border-t border-gray-100">
              <button
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              >
                Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 rounded-lg border text-sm font-medium transition ${
                    currentPage === page
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal thêm/sửa */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">
                {editService ? 'Sửa dịch vụ' : 'Thêm dịch vụ mới'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-4 space-y-4">
              {/* Tên dịch vụ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên dịch vụ <span className="text-red-500">*</span>
                </label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  placeholder="VD: Tiêm phòng dại"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              {/* Giá + Thời gian — 2 cột */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giá (VND) <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="price"
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={handleFormChange}
                    placeholder="200000"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thời gian (phút) <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="duration"
                    type="number"
                    min="1"
                    value={form.duration}
                    onChange={handleFormChange}
                    placeholder="30"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
              </div>

              {/* Danh mục */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  name="category"
                  value={form.category}
                  onChange={handleFormChange}
                  list="service-category-suggestions"
                  placeholder="vaccination, surgery..."
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
                <datalist id="service-category-suggestions">
                  {CATEGORY_SUGGESTIONS.map((c) => (
                    <option key={c} value={c}>{CATEGORY_LABEL[c] ?? c}</option>
                  ))}
                </datalist>
              </div>

              {/* Upload ảnh — giống AdminProducts */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh dịch vụ</label>
                <div className="flex items-center gap-4">
                  {/* Preview */}
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 shrink-0">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : currentImageUrl ? (
                      <img src={currentImageUrl} alt="Current" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-300 text-xs text-center px-1">Chưa có ảnh</span>
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
                        <span className="text-xs text-gray-500 truncate max-w-37.5">{selectedFile.name}</span>
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
                      {editService ? 'Chọn ảnh mới hoặc giữ ảnh cũ' : 'Tối đa 5MB (JPG, PNG...)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mô tả */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="Mô tả chi tiết dịch vụ..."
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors disabled:opacity-60"
              >
                {saving ? 'Đang lưu...' : editService ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận xóa */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Xác nhận xóa</h2>
            <p className="text-gray-600 text-sm mb-6">
              Bạn có chắc muốn xóa dịch vụ này? Hành động không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-60"
              >
                {deleting ? 'Đang xóa...' : 'Xóa dịch vụ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
