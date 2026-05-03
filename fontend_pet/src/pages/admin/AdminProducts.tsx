import { useState, useEffect, useRef } from 'react';
import { Pencil, Trash2, Plus, X, PackageSearch, Camera } from 'lucide-react';
import { productApi } from '../../api/productApi';
import { useToast } from '../../contexts/ToastContext';
import type { Product } from '../../types';

// Danh mục gợi ý — admin vẫn có thể gõ tùy ý
const CATEGORY_SUGGESTIONS = ['food', 'accessories', 'grooming', 'medicine', 'toys'];

const CATEGORY_LABEL: Record<string, string> = {
  food: 'Thức ăn',
  accessories: 'Phụ kiện',
  grooming: 'Làm đẹp',
  medicine: 'Y tế',
  toys: 'Đồ chơi',
};

const getCategoryLabel = (cat: string) => CATEGORY_LABEL[cat] ?? cat;

// Form rỗng để reset
const emptyForm = {
  name: '',
  price: '',
  imageUrl: '',
  category: '',
  stock: '0',
  description: '',
  brand: '',
  weight: '',
  volume: '',
  material: '',
};

type FormData = typeof emptyForm;

const PAGE_SIZE = 10;

export default function AdminProducts() {
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStock, setFilterStock] = useState<'all' | 'in_stock' | 'low' | 'out'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal thêm/sửa
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  // State cho upload ảnh
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Xác nhận xóa
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Sửa tồn kho nhanh (inline)
  const [stockEdit, setStockEdit] = useState<{ id: number; value: string } | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productApi.getAll();
      setProducts(data.sort((a, b) => a.id - b.id));
    } catch {
      showToast('Không thể tải danh sách sản phẩm', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Danh sách category duy nhất từ data (động theo data thực)
  const categories = Array.from(new Set(products.map((p) => p.category)));

  // Đếm tồn kho để hiện số trên filter
  const stockCounts = {
    all: products.length,
    in_stock: products.filter((p) => p.stock > 5).length,
    low: products.filter((p) => p.stock > 0 && p.stock <= 5).length,
    out: products.filter((p) => p.stock === 0).length,
  };

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === '' || p.category === filterCategory;
    const matchStock =
      filterStock === 'all' ? true :
      filterStock === 'in_stock' ? p.stock > 5 :
      filterStock === 'low' ? p.stock > 0 && p.stock <= 5 :
      p.stock === 0;
    return matchSearch && matchCategory && matchStock;
  });

  // Reset về trang 1 mỗi khi filter thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterCategory, filterStock]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Xử lý chọn file ảnh
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

  // --- Modal add/edit ---
  const openAdd = () => {
    setEditProduct(null);
    setForm(emptyForm);
    setSelectedFile(null);
    setPreviewUrl('');
    setCurrentImageUrl('');
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({
      name: p.name,
      price: String(p.price),
      imageUrl: p.imageUrl ?? '',
      category: p.category,
      stock: String(p.stock),
      description: p.description ?? '',
      brand: p.brand ?? '',
      weight: p.weight ?? '',
      volume: p.volume ?? '',
      material: p.material ?? '',
    });
    setSelectedFile(null);
    setPreviewUrl('');
    setCurrentImageUrl(p.imageUrl ?? '');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditProduct(null);
    setSelectedFile(null);
    setPreviewUrl('');
    setCurrentImageUrl('');
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }; // trong trường hợp target.name là 1 field khác hoàn toàn với các field trong prev thì xem như là thêm 1 field mới
  // nó như là cú pháp khi thêm 1 phần tử trong array
  //còn nếu trùng field trong pre thì tức là gán đúng value cho field đó

  const handleSave = async () => {
    if (!form.name.trim() || !form.price || !form.category.trim()) {
      showToast('Vui lòng điền đủ tên, giá và danh mục', 'error');
      return;
    }

    // Upload ảnh mới nếu có chọn file, không thì giữ ảnh cũ
    let imageUrl = currentImageUrl;
    if (selectedFile) {
      try {
        imageUrl = await productApi.uploadImage(selectedFile);
      } catch {
        showToast('Upload ảnh thất bại, thử lại', 'error');
        setSaving(false);
        return;
      }
    }

    const payload = {
      name: form.name.trim(),
      price: parseFloat(form.price),
      imageUrl: imageUrl,
      category: form.category.trim(),
      stock: parseInt(form.stock) || 0,
      description: form.description.trim(),
      brand: form.brand.trim(),
      weight: form.weight.trim(),
      volume: form.volume.trim(),
      material: form.material.trim(),
    };

    try {
      setSaving(true);
      if (editProduct) {
        const updated = await productApi.update(editProduct.id, payload);
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        showToast('Cập nhật sản phẩm thành công');
      } else {
        const created = await productApi.create(payload);
        setProducts((prev) => [...prev, created].sort((a, b) => a.id - b.id));
        showToast('Thêm sản phẩm thành công');
      }
      closeModal();
    } catch {
      showToast('Lưu thất bại, thử lại', 'error');
    } finally {
      setSaving(false);
    }
  };

  // --- Xóa ---
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await productApi.delete(deleteId);
      setProducts((prev) => prev.filter((p) => p.id !== deleteId));
      showToast('Đã xóa sản phẩm');
      setDeleteId(null);
    } catch {
      showToast('Không thể xóa sản phẩm', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // --- Cập nhật tồn kho nhanh ---
  const handleStockSave = async () => {
    if (!stockEdit) return;
    const newStock = parseInt(stockEdit.value);
    if (isNaN(newStock) || newStock < 0) {//Nan -> not a number
      showToast('Số lượng không hợp lệ', 'error');
      return;
    }
    try {
      const updated = await productApi.updateStock(stockEdit.id, newStock);
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      showToast('Đã cập nhật tồn kho');
      setStockEdit(null);
    } catch {
      showToast('Cập nhật tồn kho thất bại', 'error');
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
          <h1 className="text-2xl font-bold text-gray-800">Quản lý sản phẩm</h1>
          <p className="text-gray-500 text-sm mt-1">
            Hiển thị {filtered.length} / {products.length} sản phẩm
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Thêm sản phẩm
        </button>
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 space-y-3">
        {/* Search */}
        <input
          type="text"
          placeholder="Tìm theo tên sản phẩm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
        />

        {/* Lọc theo danh mục */}
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
              Tất cả ({products.length})
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
                {getCategoryLabel(cat)} ({products.filter((p) => p.category === cat).length})
              </button>
            ))}
          </div>
        )}

        {/* Lọc theo tồn kho */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-500 font-medium">Tồn kho:</span>
          {(
            [
              { key: 'all',      label: 'Tất cả',    color: 'sky' },
              { key: 'in_stock', label: 'Còn hàng',  color: 'green' },
              { key: 'low',      label: 'Sắp hết',   color: 'amber' },
              { key: 'out',      label: 'Hết hàng',  color: 'red' },
            ] as const
          ).map(({ key, label, color }) => {
            const isActive = filterStock === key;
            const count = stockCounts[key];
            const activeClass =
              color === 'sky'   ? 'bg-sky-600 text-white border-sky-600' :
              color === 'green' ? 'bg-green-600 text-white border-green-600' :
              color === 'amber' ? 'bg-amber-500 text-white border-amber-500' :
                                  'bg-red-600 text-white border-red-600';
            return (
              <button
                key={key}
                onClick={() => setFilterStock(key)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  isActive ? activeClass : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      </div> 

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow text-gray-400 gap-3">
          <PackageSearch size={40} />
          <p>Không có sản phẩm nào</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold w-16">Ảnh</th>
                <th className="px-4 py-3 font-semibold">Tên sản phẩm</th>
                <th className="px-4 py-3 font-semibold">Danh mục</th>
                <th className="px-4 py-3 font-semibold">Thương hiệu</th>
                <th className="px-4 py-3 font-semibold text-right">Giá</th>
                <th className="px-4 py-3 font-semibold text-center">Tồn kho</th>
                <th className="px-4 py-3 font-semibold text-center w-28">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  {/* Ảnh */}
                  <td className="px-4 py-3">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-12 h-12 object-cover rounded-md border border-gray-200"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center text-gray-300 text-xs">
                        No img
                      </div>
                    )}
                  </td>

                  {/* Tên */}
                  <td className="px-4 py-3 font-medium text-gray-800 max-w-48">
                    <p className="line-clamp-2">{p.name}</p>
                    {p.brand && <p className="text-xs text-gray-400">{p.brand}</p>}
                  </td>

                  {/* Danh mục */}
                  <td className="px-4 py-3">
                    <span className="bg-sky-50 text-sky-700 border border-sky-100 rounded-full px-2 py-0.5 text-xs">
                      {getCategoryLabel(p.category)}
                    </span>
                  </td>

                  {/* Thương hiệu */}
                  <td className="px-4 py-3 text-gray-600">{p.brand || '—'}</td>

                  {/* Giá */}
                  <td className="px-4 py-3 text-right font-medium text-gray-800">
                    {Number(p.price).toLocaleString('vi-VN')}đ
                  </td>

                  {/* Tồn kho — inline edit */}
                  <td className="px-4 py-3 text-center">
                    {stockEdit?.id === p.id ? (
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          min="0"
                          value={stockEdit.value}
                          onChange={(e) => setStockEdit({ id: p.id, value: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleStockSave();
                            if (e.key === 'Escape') setStockEdit(null);
                          }}
                          autoFocus
                          className="w-16 border rounded px-1 py-0.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-sky-400"
                        />
                        <button
                          onClick={handleStockSave}
                          className="text-green-600 hover:text-green-700 text-xs font-semibold"
                        >
                          Lưu
                        </button>
                        <button
                          onClick={() => setStockEdit(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setStockEdit({ id: p.id, value: String(p.stock) })}
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity ${
                          p.stock === 0
                            ? 'bg-red-100 text-red-700'
                            : p.stock <= 5
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                        title="Click để sửa tồn kho"
                      >
                        {p.stock}
                      </button>
                    )}
                  </td>

                  {/* Hành động */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-md transition-colors"
                        title="Sửa"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteId(p.id)}
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
            {/* Header modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">
                {editProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Body modal — scrollable */}
            <div className="overflow-y-auto px-6 py-4 space-y-4">

              {/* Tên sản phẩm */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên sản phẩm <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="VD: Thức ăn hạt cho chó Royal Canin"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              {/* Giá + Danh mục — 2 cột */}
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
                    placeholder="150000"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Danh mục <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="category"
                    value={form.category}
                    onChange={handleFormChange}
                    list="category-suggestions"
                    placeholder="food, accessories..."
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                  <datalist id="category-suggestions">
                    {CATEGORY_SUGGESTIONS.map((c) => (
                      <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
                    ))}
                  </datalist>
                </div>
              </div>
              {/* datalist cho phep input vừa được gõ tự do vừa được gợi ý thả xuống để chọn */}

              {/* Tồn kho + Thương hiệu — 2 cột */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tồn kho</label>
                  <input
                    name="stock"
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={handleFormChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thương hiệu</label>
                  <input
                    name="brand"
                    value={form.brand}
                    onChange={handleFormChange}
                    placeholder="Royal Canin, Whiskas..."
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
              </div>

              {/* Upload ảnh sản phẩm */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh sản phẩm</label>
                <div className="flex items-center gap-4">
                  {/* Preview ảnh */}
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
                      {editProduct ? 'Chọn ảnh mới hoặc giữ ảnh cũ' : 'Tối đa 5MB (JPG, PNG...)'}
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
                  placeholder="Mô tả chi tiết sản phẩm..."
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
                />
              </div>

              {/* Cân nặng + Thể tích + Chất liệu — 3 cột */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cân nặng</label>
                  <input
                    name="weight"
                    value={form.weight}
                    onChange={handleFormChange}
                    placeholder="1kg, 500g..."
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thể tích</label>
                  <input
                    name="volume"
                    value={form.volume}
                    onChange={handleFormChange}
                    placeholder="500ml..."
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chất liệu</label>
                  <input
                    name="material"
                    value={form.material}
                    onChange={handleFormChange}
                    placeholder="Nhựa, vải..."
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
              </div>
            </div>

            {/* Footer modal */}
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
                {saving ? 'Đang lưu...' : editProduct ? 'Cập nhật' : 'Thêm mới'}
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
              Bạn có chắc muốn xóa sản phẩm này? Hành động không thể hoàn tác.
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
                className="px-4 py-2 text-sm bg-red-700 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-60"
              >
                {deleting ? 'Đang xóa...' : 'Xóa sản phẩm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
