import { useState, useEffect, useRef } from 'react';
import {
  Pencil,
  Trash2,
  Plus,
  X,
  Stethoscope,
  Camera,
  Search,
  Tag,
  DollarSign,
  Clock,
  FileText,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Check,
} from 'lucide-react';
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
    <div className="space-y-6 pb-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center text-white shadow-sm">
            <Stethoscope size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Quản lý dịch vụ khám</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Hiển thị <span className="font-semibold text-gray-700">{filtered.length}</span>/<span className="font-semibold text-gray-700">{services.length}</span> dịch vụ
            </p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm hover:shadow-md"
        >
          <Plus size={16} />
          Thêm dịch vụ
        </button>
      </div>

      {/* Toolbar: search + filter */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-4 space-y-4">
        {/* Search */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Tìm kiếm
          </label>
          <div className="relative max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tên dịch vụ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>
        </div>

        {/* Lọc theo danh mục */}
        {categories.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Danh mục
            </p>
            <div className="flex flex-wrap gap-2">
              <FilterPill
                active={filterCategory === ''}
                label="Tất cả"
                count={services.length}
                onClick={() => setFilterCategory('')}
              />
              {categories.map((cat) => (
                <FilterPill
                  key={cat}
                  active={filterCategory === cat}
                  label={getCategoryLabel(cat)}
                  count={services.filter((s) => s.category === cat).length}
                  onClick={() => setFilterCategory(cat)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 py-16 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-sky-50 flex items-center justify-center">
            <Stethoscope size={36} className="text-sky-500" />
          </div>
          <p className="text-gray-700 text-lg font-semibold mb-1">Không có dịch vụ nào</p>
          <p className="text-gray-500 text-sm">Thử thay đổi bộ lọc hoặc thêm dịch vụ mới</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 text-gray-600 text-left text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 font-bold w-16">Ảnh</th>
                  <th className="px-4 py-3 font-bold">Tên dịch vụ</th>
                  <th className="px-4 py-3 font-bold">Danh mục</th>
                  <th className="px-4 py-3 font-bold text-right">Giá</th>
                  <th className="px-4 py-3 font-bold text-center">Thời gian</th>
                  <th className="px-4 py-3 font-bold text-center w-28">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((s) => (
                  <tr key={s.id} className="hover:bg-sky-50/30 transition">
                    {/* Ảnh */}
                    <td className="px-4 py-3">
                      {s.imageUrl ? (
                        <img
                          src={s.imageUrl}
                          alt={s.title}
                          className="w-12 h-12 object-cover rounded-lg ring-1 ring-gray-200 bg-white"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-50 rounded-lg ring-1 ring-gray-200 flex items-center justify-center text-gray-300">
                          <Stethoscope size={20} />
                        </div>
                      )}
                    </td>

                    {/* Tên */}
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-semibold text-gray-800 line-clamp-1">{s.title}</p>
                      {s.description && (
                        <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{s.description}</p>
                      )}
                    </td>

                    {/* Danh mục */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-teal-50 ring-1 ring-teal-100 text-teal-700 rounded-md px-2 py-0.5">
                        <Tag size={10} />
                        {getCategoryLabel(s.category)}
                      </span>
                    </td>

                    {/* Giá */}
                    <td className="px-4 py-3 text-right font-bold text-rose-600 whitespace-nowrap">
                      {Number(s.price).toLocaleString('vi-VN')}đ
                    </td>

                    {/* Thời gian */}
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 bg-gray-50 ring-1 ring-gray-200 rounded-md px-2 py-0.5">
                        <Clock size={10} />
                        {s.duration} phút
                      </span>
                    </td>

                    {/* Hành động */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEdit(s)}
                          className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition"
                          title="Sửa"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteId(s.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                          title="Xóa"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50/40">
              <p className="text-xs text-gray-500">
                Hiển thị <span className="font-semibold text-gray-700">{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)}</span> trong <span className="font-semibold text-gray-700">{filtered.length}</span>
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => p - 1)}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium text-gray-700 transition"
                >
                  <ChevronLeft size={14} /> Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 rounded-lg border text-sm font-semibold transition ${
                      currentPage === page
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-sky-50 hover:border-sky-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium text-gray-700 transition"
                >
                  Sau <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal thêm/sửa */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            {/* Header gradient */}
            <div className="relative bg-gradient-to-r from-sky-600 to-cyan-500 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur ring-1 ring-white/30 flex items-center justify-center">
                  {editService ? <Pencil size={16} className="text-white" /> : <Plus size={16} className="text-white" />}
                </div>
                <h2 className="text-lg font-bold text-white">
                  {editService ? 'Sửa dịch vụ' : 'Thêm dịch vụ mới'}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5 space-y-4">
              {/* Tên dịch vụ */}
              <FormField
                icon={<Stethoscope size={13} className="text-sky-600" />}
                label="Tên dịch vụ"
                required
              >
                <input
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  placeholder="VD: Tiêm phòng dại"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </FormField>

              {/* Giá + Thời gian — 2 cột */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  icon={<DollarSign size={13} className="text-rose-600" />}
                  label="Giá (VND)"
                  required
                >
                  <input
                    name="price"
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={handleFormChange}
                    placeholder="200000"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </FormField>
                <FormField
                  icon={<Clock size={13} className="text-emerald-600" />}
                  label="Thời gian (phút)"
                  required
                >
                  <input
                    name="duration"
                    type="number"
                    min="1"
                    value={form.duration}
                    onChange={handleFormChange}
                    placeholder="30"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </FormField>
              </div>

              {/* Danh mục */}
              <FormField icon={<Tag size={13} className="text-teal-600" />} label="Danh mục" required>
                <input
                  name="category"
                  value={form.category}
                  onChange={handleFormChange}
                  list="service-category-suggestions"
                  placeholder="vaccination, surgery..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
                <datalist id="service-category-suggestions">
                  {CATEGORY_SUGGESTIONS.map((c) => (
                    <option key={c} value={c}>{CATEGORY_LABEL[c] ?? c}</option>
                  ))}
                </datalist>
              </FormField>

              {/* Upload ảnh */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Camera size={13} className="text-sky-600" />
                  Ảnh dịch vụ
                </p>
                <div className="bg-gray-50/70 ring-1 ring-gray-100 rounded-xl p-3 flex items-center gap-4">
                  {/* Preview */}
                  <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-white shrink-0">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : currentImageUrl ? (
                      <img src={currentImageUrl} alt="Current" className="w-full h-full object-cover" />
                    ) : (
                      <ImageOff size={24} className="text-gray-300" />
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
                      className="inline-flex items-center gap-2 px-3.5 py-2 border border-gray-200 rounded-xl bg-white text-gray-700 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-700 transition text-sm font-semibold shadow-sm"
                    >
                      <Camera size={15} />
                      Chọn ảnh
                    </button>
                    {selectedFile && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs font-medium text-sky-600 truncate max-w-[150px]">{selectedFile.name}</span>
                        <button
                          type="button"
                          onClick={removeSelectedImage}
                          className="text-rose-500 text-xs font-semibold hover:underline"
                        >
                          Xóa
                        </button>
                      </div>
                    )}
                    <p className="text-[11px] text-gray-500 mt-1.5">
                      {editService ? 'Chọn ảnh mới hoặc giữ ảnh cũ' : 'Tối đa 5MB (JPG, PNG...)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mô tả */}
              <FormField icon={<FileText size={13} className="text-amber-600" />} label="Mô tả">
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="Mô tả chi tiết dịch vụ..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 resize-none"
                />
              </FormField>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/40 rounded-b-2xl">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-white transition"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold transition shadow-sm disabled:opacity-60"
              >
                {editService ? <Check size={14} /> : <Plus size={14} />}
                {saving ? 'Đang lưu...' : editService ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận xóa */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 flex items-center justify-center mb-3">
                <AlertTriangle size={24} className="text-rose-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-800 mb-2 text-center">Xác nhận xóa</h2>
              <p className="text-gray-600 text-sm mb-6 text-center">
                Bạn có chắc muốn xóa dịch vụ này? Hành động không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold transition shadow-sm disabled:opacity-60"
                >
                  <Trash2 size={14} />
                  {deleting ? 'Đang xóa...' : 'Xóa dịch vụ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Filter pill — đồng bộ với các trang khác
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

// Form field wrapper
function FormField({
  icon,
  label,
  required,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
        {icon}
        {label}
        {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}
