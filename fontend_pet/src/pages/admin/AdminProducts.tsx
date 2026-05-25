import { useState, useEffect, useRef } from 'react';
import {
  Pencil,
  Trash2,
  Plus,
  X,
  PackageSearch,
  Camera,
  Package,
  Search,
  Check,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Tag,
  DollarSign,
  Box,
  Layers,
  Weight,
  Droplets,
  Hammer,
  FileText,
} from 'lucide-react';
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

  // Stock filter config
  const STOCK_FILTERS = [
    { key: 'all' as const, label: 'Tất cả', activeClass: 'bg-sky-600 text-white shadow-md' },
    { key: 'in_stock' as const, label: 'Còn hàng', activeClass: 'bg-emerald-600 text-white shadow-md' },
    { key: 'low' as const, label: 'Sắp hết', activeClass: 'bg-amber-500 text-white shadow-md' },
    { key: 'out' as const, label: 'Hết hàng', activeClass: 'bg-rose-600 text-white shadow-md' },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center text-white shadow-sm">
            <Package size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Quản lý sản phẩm</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Hiển thị <span className="font-semibold text-gray-700">{filtered.length}</span>/<span className="font-semibold text-gray-700">{products.length}</span> sản phẩm
            </p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm hover:shadow-md"
        >
          <Plus size={16} />
          Thêm sản phẩm
        </button>
      </div>

      {/* Toolbar: search + filters */}
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
              placeholder="Tên sản phẩm..."
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
                count={products.length}
                onClick={() => setFilterCategory('')}
              />
              {categories.map((cat) => (
                <FilterPill
                  key={cat}
                  active={filterCategory === cat}
                  label={getCategoryLabel(cat)}
                  count={products.filter((p) => p.category === cat).length}
                  onClick={() => setFilterCategory(cat)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Lọc theo tồn kho */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Tồn kho
          </p>
          <div className="flex flex-wrap gap-2">
            {STOCK_FILTERS.map(({ key, label, activeClass }) => {
              const isActive = filterStock === key;
              const count = stockCounts[key];
              return (
                <button
                  key={key}
                  onClick={() => setFilterStock(key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap ${
                    isActive
                      ? activeClass
                      : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-sky-50 hover:text-sky-700'
                  }`}
                >
                  {label}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 py-16 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-sky-50 flex items-center justify-center">
            <PackageSearch size={36} className="text-sky-500" />
          </div>
          <p className="text-gray-700 text-lg font-semibold mb-1">Không có sản phẩm nào</p>
          <p className="text-gray-500 text-sm">Thử thay đổi bộ lọc hoặc thêm sản phẩm mới</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 text-gray-600 text-left text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 font-bold w-16">Ảnh</th>
                  <th className="px-4 py-3 font-bold">Tên sản phẩm</th>
                  <th className="px-4 py-3 font-bold">Danh mục</th>
                  <th className="px-4 py-3 font-bold">Thương hiệu</th>
                  <th className="px-4 py-3 font-bold text-right">Giá</th>
                  <th className="px-4 py-3 font-bold text-center">Tồn kho</th>
                  <th className="px-4 py-3 font-bold text-center w-28">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((p) => (
                  <tr key={p.id} className="hover:bg-sky-50/30 transition">
                    {/* Ảnh */}
                    <td className="px-4 py-3">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-12 h-12 object-cover rounded-lg ring-1 ring-gray-200 bg-white"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-50 rounded-lg ring-1 ring-gray-200 flex items-center justify-center text-gray-300">
                          <ImageOff size={18} />
                        </div>
                      )}
                    </td>

                    {/* Tên */}
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-semibold text-gray-800 line-clamp-2">{p.name}</p>
                      {p.brand && <p className="text-xs text-gray-400 mt-0.5">{p.brand}</p>}
                    </td>

                    {/* Danh mục */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-sky-50 ring-1 ring-sky-100 text-sky-700 rounded-md px-2 py-0.5">
                        <Tag size={10} />
                        {getCategoryLabel(p.category)}
                      </span>
                    </td>

                    {/* Thương hiệu */}
                    <td className="px-4 py-3 text-gray-600">{p.brand || '—'}</td>

                    {/* Giá */}
                    <td className="px-4 py-3 text-right font-bold text-rose-600 whitespace-nowrap">
                      {Number(p.price).toLocaleString('vi-VN')}đ
                    </td>

                    {/* Tồn kho — inline edit */}
                    <td className="px-4 py-3 text-center">
                      {stockEdit?.id === p.id ? (
                        <div className="inline-flex items-center gap-1 bg-white ring-1 ring-sky-300 rounded-lg p-0.5">
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
                            className="w-14 border-0 px-1.5 py-0.5 text-sm text-center focus:outline-none"
                          />
                          <button
                            onClick={handleStockSave}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition"
                            title="Lưu (Enter)"
                          >
                            <Check size={13} />
                          </button>
                          <button
                            onClick={() => setStockEdit(null)}
                            className="p-1 text-gray-400 hover:bg-gray-100 rounded transition"
                            title="Hủy (Esc)"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setStockEdit({ id: p.id, value: String(p.stock) })}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold cursor-pointer hover:scale-105 transition ${
                            p.stock === 0
                              ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-200'
                              : p.stock <= 5
                              ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
                              : 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                          }`}
                          title="Click để sửa tồn kho"
                        >
                          {p.stock === 0 && <AlertTriangle size={10} />}
                          {p.stock}
                        </button>
                      )}
                    </td>

                    {/* Hành động */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition"
                          title="Sửa"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteId(p.id)}
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
                  {editProduct ? <Pencil size={16} className="text-white" /> : <Plus size={16} className="text-white" />}
                </div>
                <h2 className="text-lg font-bold text-white">
                  {editProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body modal — scrollable */}
            <div className="overflow-y-auto px-6 py-5 space-y-4">
              {/* Tên sản phẩm */}
              <FormField
                icon={<Package size={13} className="text-sky-600" />}
                label="Tên sản phẩm"
                required
              >
                <input
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="VD: Thức ăn hạt cho chó Royal Canin"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </FormField>

              {/* Giá + Danh mục */}
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
                    placeholder="150000"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </FormField>
                <FormField
                  icon={<Tag size={13} className="text-sky-600" />}
                  label="Danh mục"
                  required
                >
                  <input
                    name="category"
                    value={form.category}
                    onChange={handleFormChange}
                    list="category-suggestions"
                    placeholder="food, accessories..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                  <datalist id="category-suggestions">
                    {CATEGORY_SUGGESTIONS.map((c) => (
                      <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
                    ))}
                  </datalist>
                </FormField>
              </div>
              {/* datalist cho phep input vừa được gõ tự do vừa được gợi ý thả xuống để chọn */}

              {/* Tồn kho + Thương hiệu */}
              <div className="grid grid-cols-2 gap-3">
                <FormField icon={<Box size={13} className="text-emerald-600" />} label="Tồn kho">
                  <input
                    name="stock"
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={handleFormChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </FormField>
                <FormField icon={<Layers size={13} className="text-violet-600" />} label="Thương hiệu">
                  <input
                    name="brand"
                    value={form.brand}
                    onChange={handleFormChange}
                    placeholder="Royal Canin, Whiskas..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </FormField>
              </div>

              {/* Upload ảnh sản phẩm */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Camera size={13} className="text-sky-600" />
                  Ảnh sản phẩm
                </p>
                <div className="bg-gray-50/70 ring-1 ring-gray-100 rounded-xl p-3 flex items-center gap-4">
                  {/* Preview ảnh */}
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
                      {editProduct ? 'Chọn ảnh mới hoặc giữ ảnh cũ' : 'Tối đa 5MB (JPG, PNG...)'}
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
                  placeholder="Mô tả chi tiết sản phẩm..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 resize-none"
                />
              </FormField>

              {/* Cân nặng + Thể tích + Chất liệu */}
              <div className="grid grid-cols-3 gap-3">
                <FormField icon={<Weight size={13} className="text-gray-500" />} label="Cân nặng">
                  <input
                    name="weight"
                    value={form.weight}
                    onChange={handleFormChange}
                    placeholder="1kg, 500g..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </FormField>
                <FormField icon={<Droplets size={13} className="text-gray-500" />} label="Thể tích">
                  <input
                    name="volume"
                    value={form.volume}
                    onChange={handleFormChange}
                    placeholder="500ml..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </FormField>
                <FormField icon={<Hammer size={13} className="text-gray-500" />} label="Chất liệu">
                  <input
                    name="material"
                    value={form.material}
                    onChange={handleFormChange}
                    placeholder="Nhựa, vải..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </FormField>
              </div>
            </div>

            {/* Footer modal */}
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
                {editProduct ? <Check size={14} /> : <Plus size={14} />}
                {saving ? 'Đang lưu...' : editProduct ? 'Cập nhật' : 'Thêm mới'}
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
                Bạn có chắc muốn xóa sản phẩm này? Hành động không thể hoàn tác.
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
                  {deleting ? 'Đang xóa...' : 'Xóa sản phẩm'}
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
