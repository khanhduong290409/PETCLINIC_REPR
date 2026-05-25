// frontend/src/components/home/FeaturedProducts.tsx
import { Link } from "react-router-dom";
import { ChevronRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { productApi } from "../../api/productApi";
import ProductCard from "../features/products/ProductCard";
import type { Product } from "../../types";

export default function FeaturedProducts() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);

  useEffect(() => {
    productApi.getAll().then(products => setFeaturedProducts(products.slice(0, 4)));
  }, []);

  return (
    <section id="products" className="py-20 md:py-24 bg-slate-50 relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-sky-50 to-transparent pointer-events-none" />
      
      <div className="mx-auto max-w-7xl px-4 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-rose-600 font-semibold text-sm mb-3">
              <Sparkles size={16} />
              <span>Dành cho thú cưng</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-800 tracking-tight mb-4">
              Sản phẩm tiêu biểu
            </h2>
            <p className="text-lg text-slate-500 leading-relaxed">
              Khám phá bộ sưu tập những sản phẩm cao cấp, được bác sĩ thú y khuyên dùng để mang lại cuộc sống khoẻ mạnh và hạnh phúc nhất cho các "Boss".
            </p>
          </div>
          
          <Link 
            to="/products" 
            className="hidden md:inline-flex items-center gap-2 text-white bg-slate-800 px-6 py-3 rounded-full font-semibold hover:bg-sky-700 transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 group whitespace-nowrap"
          >
            <span>Xem tất cả sản phẩm</span>
            <ChevronRight 
              size={18} 
              className="group-hover:translate-x-1 transition-transform" 
            />
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
          {featuredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Mobile View All Link */}
        <div className="mt-10 text-center md:hidden">
          <Link 
            to="/products" 
            className="inline-flex items-center gap-2 text-white bg-slate-800 px-6 py-3 rounded-full font-semibold hover:bg-sky-700 transition-all shadow-md active:scale-95"
          >
            <span>Xem tất cả sản phẩm</span>
            <ChevronRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}