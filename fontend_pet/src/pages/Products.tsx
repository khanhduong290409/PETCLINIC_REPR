import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { productApi } from '../api/productApi';
import ProductCard from '../components/features/products/ProductCard';
import type { Product } from '../types';

const PAGE_SIZE = 8;

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={fetchProducts}
            className="bg-sky-600 text-white px-6 py-2 rounded-lg hover:bg-sky-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Sản phẩm</h1>

      <div className="flex gap-6">
        {/* ===== SIDEBAR BỘ LỌC ===== */}
        <aside className="w-60 shrink-0">
          <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 sticky top-24 space-y-6">


            {/* Search */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Tìm kiếm</p>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Tên sản phẩm..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-sky-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
            </div>

            {/* Lọc danh mục */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Danh mục</p>
              <div className="space-y-1">
                <button
                  onClick={() => handleCategory('')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                    selectedCategory === ''
                      ? 'bg-sky-600 text-white font-medium'
                      : 'text-gray-600 hover:bg-sky-100'
                  }`}
                >
                  Tất cả
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition capitalize ${
                      selectedCategory === cat
                        ? 'bg-sky-600 text-white font-medium'
                        : 'text-gray-600 hover:bg-sky-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Lọc khoảng giá */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Khoảng giá</p>
              <div className="space-y-1">
                {PRICE_RANGES.map((range, index) => (
                  <button
                    key={index}
                    onClick={() => handlePriceRange(index)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                      selectedPriceRange === index
                        ? 'bg-sky-600 text-white font-medium'
                        : 'text-gray-600 hover:bg-sky-100'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lọc thương hiệu */}
            {brands.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Thương hiệu</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  <button
                    onClick={() => handleBrand('')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                      selectedBrand === ''
                        ? 'bg-sky-600 text-white font-medium'
                        : 'text-gray-600 hover:bg-sky-100'
                    }`}
                  >
                    Tất cả
                  </button>
                  {brands.map((brand) => (
                    <button
                      key={brand}
                      onClick={() => handleBrand(brand)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                        selectedBrand === brand
                          ? 'bg-sky-600 text-white font-medium'
                          : 'text-gray-600 hover:bg-sky-100'
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Lọc còn hàng */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => handleInStock(e.target.checked)}
                  className="w-4 h-4 accent-sky-600"
                />
                <span className="text-sm text-gray-700 font-medium">Chỉ còn hàng</span>
              </label>
            </div>

          </div>
        </aside>

        {/* ===== KHU VỰC SẢN PHẨM ===== */}
        <div ref={productsRef} className="flex-1 min-w-0">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">Không tìm thấy sản phẩm nào</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">
                Hiển thị {paginatedProducts.length} / {filteredProducts.length} sản phẩm
              </p>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Phân trang */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
