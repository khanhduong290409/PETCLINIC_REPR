// frontend/src/components/home/FeaturedProducts.tsx
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { PRODUCT_DATA } from "../../utils/constants";
import ProductCard from "../features/products/ProductCard";
import { useCart } from "../../contexts/CartContext";

/**
 * FeaturedProducts - Section hiển thị sản phẩm nổi bật trên trang chủ
 * Chỉ hiển thị 4 sản phẩm đầu tiên
 */
export default function FeaturedProducts() {
  const { addItem } = useCart();

  // Lấy 4 sản phẩm featured đầu tiên
  const featuredProducts = PRODUCT_DATA.slice(0, 4);

  return (
    <section id="products" className="py-12 bg-sky-50">
      <div className="mx-auto max-w-7xl px-4">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-sky-900 mb-2">
              Sản phẩm tiêu biểu
            </h2>
            <p className="text-gray-600">
              Những sản phẩm chất lượng cao cho thú cưng của bạn
            </p>
          </div>
          
          <Link 
            to="/products" 
            className="hidden sm:flex items-center gap-2 text-rose-700 hover:text-rose-800 font-semibold transition-colors group"
          >
            <span>Xem tất cả</span>
            <ChevronRight 
              size={20} 
              className="group-hover:translate-x-1 transition-transform" 
            />
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {featuredProducts.map(product => (
            <ProductCard key={product.id} product={product} onAddToCart={addItem} />
          ))}
        </div>

        {/* Mobile View All Link */}
        <div className="mt-6 text-center sm:hidden">
          <Link 
            to="/products" 
            className="inline-flex items-center gap-2 text-rose-700 hover:text-rose-800 font-semibold"
          >
            <span>Xem tất cả sản phẩm</span>
            <ChevronRight size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
}