import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Package,
  Tag,
  DollarSign,
  Layers,
  CheckCircle2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  PackageSearch,
} from 'lucide-react';
import { productApi } from '../api/productApi';
import ProductCard from '../components/features/products/ProductCard';
import type { Product } from '../types';

const PAGE_SIZE = 12;

// Map category sang tiếng Việt (gợi ý, không bắt buộc khớp 100%)
const CATEGORY_LABEL: Record<string, string> = {
  food: 'Thức ăn',
  accessories: 'Phụ kiện',
  grooming: 'Làm đẹp',
  medicine: 'Y tế',
  toys: 'Đồ chơi',
};
const getCategoryLabel = (cat: string) => CATEGORY_LABEL[cat] ?? cat;

// Các khoảng giá để lọc
const PRICE_RANGES = [
  { label: 'Tất cả', min: 0, max: Infinity },
  { label: 'Dưới 100.000đ', min: 0, max: 100000 },
  { label: '100.000 - 300.000đ', min: 100000, max: 300000 },
  { label: '300.000 - 500.000đ', min: 300000, max: 500000 },
  { label: 'Trên 500.000đ', min: 500000, max: Infinity },
];

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState(0); // index của PRICE_RANGES
  const [inStockOnly, setInStockOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const productsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productApi.getAll();
      setProducts(data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách category + brand duy nhất từ data
  const categories = Array.from(new Set(products.map((p) => p.category)));
  const brands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean))) as string[];
  //filter(Boolean) -> loại ra các phần tử  null hoặc undefined, rỗng khỏi mãng
  //set : loại bỏ trùng lặp, set chỉ giữ các giá trị duy nhất
  //array.from -> chuyển set về thành mãng

  // Filter tổng hợp: giu lai cac phan tu thoa dieu kien
  // dấu || ở đây có nghĩa : nếu điều kiện 1 khỏi cần set đk 2
  const filteredProducts = products.filter((p) => {
    const range = PRICE_RANGES[selectedPriceRange];
    const matchSearch = p.name.toLowerCase().includes(searchText.toLowerCase());
    const matchCategory = selectedCategory === '' || p.category === selectedCategory;
    const matchBrand = selectedBrand === '' || p.brand === selectedBrand;
    const matchPrice = p.price >= range.min && p.price <= range.max;
    const matchStock = !inStockOnly || p.stock > 0;
    return matchSearch && matchCategory && matchBrand && matchPrice && matchStock;
  });

  // Scroll lên đầu khu vực sản phẩm khi filter/search thay đổi
  useEffect(() => {
    // productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.scrollTo({top: 0, behavior: 'smooth'});

  }, [filteredProducts, currentPage]);

  // Phân trang
  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Reset page khi đổi bất kỳ filter nào
  const resetPage = () => setCurrentPage(1);

  const handleSearch = (value: string) => { setSearchText(value); resetPage(); };
  // Nếu click vào filter đang chọn thì bỏ chọn (toggle)
  const handleCategory = (value: string) => { setSelectedCategory(selectedCategory === value ? '' : value); resetPage(); };
  const handleBrand = (value: string) => { setSelectedBrand(selectedBrand === value ? '' : value); resetPage(); };
  const handlePriceRange = (index: number) => { setSelectedPriceRange(selectedPriceRange === index ? 0 : index); resetPage(); };
  const handleInStock = (value: boolean) => { setInStockOnly(value); resetPage(); };

  // Reset toàn bộ filter
  const handleResetAll = () => {
    setSearchText('');
    setSelectedCategory('');
    setSelectedBrand('');
    setSelectedPriceRange(0);
    setInStockOnly(false);
    resetPage();
  };

  // Có filter nào đang active không?
  const hasActiveFilter =
    searchText !== '' ||
    selectedCategory !== '' ||
    selectedBrand !== '' ||
    selectedPriceRange !== 0 ||
    inStockOnly;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-50/60 via-white to-white">
        <div className="text-center bg-white p-10 rounded-2xl shadow-sm ring-1 ring-gray-100 max-w-sm w-full">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-rose-50 flex items-center justify-center">
            <PackageSearch size={36} className="text-rose-500" />
          </div>
          <p className="text-gray-700 text-lg font-semibold mb-2">{error}</p>
          <button
            onClick={fetchProducts}
            className="bg-sky-600 text-white px-6 py-2.5 rounded-xl hover:bg-sky-700 transition shadow"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/60 via-white to-white">
      <div id="products" className="max-w-7xl mx-auto px-4 py-8">
        {/* Header gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 p-6 md:p-8 mb-6 shadow-lg">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -left-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/20 backdrop-blur items-center justify-center ring-1 ring-white/30">
                <Package size={28} className="text-white" />
              </div>
              <div>
                <p className="text-sky-100 text-sm font-medium tracking-wide uppercase">
                  Cửa hàng
                </p>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Sản phẩm cho thú cưng</h1>
                <p className="text-sky-100 text-sm mt-1">
                  {products.length} sản phẩm chăm sóc, dinh dưỡng và phụ kiện cho boss
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-white/15 backdrop-blur ring-1 ring-white/25 rounded-xl px-4 py-2.5">
              <Sparkles size={18} className="text-white" />
              <span className="text-white text-sm font-semibold">
                {filteredProducts.length} kết quả
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* ===== SIDEBAR BỘ LỌC ===== */}
          <aside className="lg:w-72 shrink-0">
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-5 sticky top-24 space-y-5">
              {/* Header sidebar */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={16} className="text-sky-600" />
                  <h2 className="font-bold text-gray-800">Bộ lọc</h2>
                </div>
                {hasActiveFilter && (
                  <button
                    onClick={handleResetAll}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              {/* Search */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Search size={11} /> Tìm kiếm
                </p>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Tên sản phẩm..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Lọc danh mục */}
              <FilterSection icon={<Tag size={11} />} label="Danh mục">
                <FilterButton
                  active={selectedCategory === ''}
                  label="Tất cả"
                  onClick={() => handleCategory('')}
                />
                {categories.map((cat) => (
                  <FilterButton
                    key={cat}
                    active={selectedCategory === cat}
                    label={getCategoryLabel(cat)}
                    onClick={() => handleCategory(cat)}
                  />
                ))}
              </FilterSection>

              {/* Lọc khoảng giá */}
              <FilterSection icon={<DollarSign size={11} />} label="Khoảng giá">
                {PRICE_RANGES.map((range, index) => (
                  <FilterButton
                    key={index}
                    active={selectedPriceRange === index}
                    label={range.label}
                    onClick={() => handlePriceRange(index)}
                  />
                ))}
              </FilterSection>

              {/* Lọc thương hiệu */}
              {brands.length > 0 && (
                <FilterSection icon={<Layers size={11} />} label="Thương hiệu">
                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                    <FilterButton
                      active={selectedBrand === ''}
                      label="Tất cả"
                      onClick={() => handleBrand('')}
                    />
                    {brands.map((brand) => (
                      <FilterButton
                        key={brand}
                        active={selectedBrand === brand}
                        label={brand}
                        onClick={() => handleBrand(brand)}
                      />
                    ))}
                  </div>
                </FilterSection>
              )}

              {/* Lọc còn hàng */}
              <div className="pt-3 border-t border-gray-100">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => handleInStock(e.target.checked)}
                    className="w-4 h-4 accent-sky-600"
                  />
                  <span className="text-sm text-gray-700 font-medium group-hover:text-sky-700 transition flex items-center gap-1.5">
                    <CheckCircle2 size={14} className={inStockOnly ? 'text-emerald-500' : 'text-gray-400'} />
                    Chỉ còn hàng
                  </span>
                </label>
              </div>
            </div>
          </aside>

          {/* ===== KHU VỰC SẢN PHẨM ===== */}
          <div ref={productsRef} className="flex-1 min-w-0">
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 py-20 px-6 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-sky-50 flex items-center justify-center">
                  <PackageSearch size={36} className="text-sky-500" />
                </div>
                <p className="text-gray-700 text-lg font-semibold mb-1">Không tìm thấy sản phẩm nào</p>
                <p className="text-gray-500 text-sm mb-5">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                {hasActiveFilter && (
                  <button
                    onClick={handleResetAll}
                    className="inline-flex items-center gap-2 bg-sky-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-sky-700 transition shadow"
                  >
                    Xóa tất cả bộ lọc
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Result count + active filter chips */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <p className="text-sm text-gray-600">
                    Hiển thị <span className="font-semibold text-gray-800">{paginatedProducts.length}</span> trên <span className="font-semibold text-gray-800">{filteredProducts.length}</span> sản phẩm
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Phân trang */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-8 bg-white rounded-2xl ring-1 ring-gray-100 px-4 py-3">
                    <p className="text-xs text-gray-500">
                      Trang <span className="font-semibold text-gray-700">{currentPage}</span> / <span className="font-semibold text-gray-700">{totalPages}</span>
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage((p) => p - 1)}
                        disabled={currentPage === 1}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-sky-50 hover:border-sky-300 hover:text-sky-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white text-sm font-medium text-gray-700 transition"
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-sky-50 hover:border-sky-300 hover:text-sky-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white text-sm font-medium text-gray-700 transition"
                      >
                        Sau <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Section wrapper trong sidebar: icon + label uppercase
function FilterSection({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
        {icon}
        {label}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

// Filter button (radio-style row trong sidebar)
function FilterButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
        active
          ? 'bg-sky-600 text-white font-semibold shadow-sm'
          : 'text-gray-600 hover:bg-sky-50 hover:text-sky-700'
      }`}
    >
      {label}
    </button>
  );
}
