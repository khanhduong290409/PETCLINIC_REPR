// frontend/src/components/features/products/ProductCard.tsx
import React from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Star } from "lucide-react";
import type { Product } from "../../../types";

interface ProductCardProps {
  product: Product;
  showAddToCart?: boolean;
  onAddToCart?: (product: Product) => void;
}

/**
 * ProductCard - Reusable product card component
 * Có thể dùng ở Home page, Product List page, Related Products, etc.
 */
export default function ProductCard({ 
  product, 
  showAddToCart = true,
  onAddToCart 
}: ProductCardProps) {
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    e.stopPropagation();
    
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      // Default behavior: log or show toast
      console.log("Add to cart:", product.name);
      // TODO: Integrate with CartContext
    }
  };

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock < 10;

  return (
    <Link 
      to={`/products/${product.id}`}
      className="group block rounded-xl overflow-hidden shadow-xl bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
    >
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img 
          src={product.imageUrl} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
        />
        
        {/* Stock Badge */}
        {isOutOfStock && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            Hết hàng
          </div>
        )}
        
        {isLowStock && (
          <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            Chỉ còn {product.stock}
          </div>
        )}
        
        {/* Category Badge */}
        {product.categoryName && (
          <div className="absolute top-2 left-2 bg-sky-700 text-white text-xs font-semibold px-3 py-1 rounded-full">
            {product.categoryName}
          </div>
        )}
      </div>
      
      {/* Product Info */}
      <div className="p-4">
        {/* Brand */}
        {product.brand && (
          <p className="text-xs text-gray-500 mb-1">{product.brand}</p>
        )}
        
        {/* Product Name */}
        <h3 className="font-semibold text-gray-800 group-hover:text-sky-700 transition-colors mb-2 line-clamp-2">
          {product.name}
        </h3>
        
        {/* Product Specs */}
        {(product.weight || product.volume || product.material) && (
          <p className="text-xs text-gray-500 mb-2">
            {product.weight || product.volume || product.material}
          </p>
        )}
        
        {/* Price & Add to Cart */}
        <div className="flex items-center justify-between mt-3">
          <div>
            <span className="text-rose-700 font-bold text-lg">
              {product.price.toLocaleString()}đ
            </span>
          </div>
          
          {showAddToCart && (
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`
                p-2 rounded-lg transition-all duration-300
                ${isOutOfStock 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-sky-700 text-white hover:bg-sky-800 hover:scale-110'
                }
              `}
              aria-label={`Thêm ${product.name} vào giỏ hàng`}
            >
              <ShoppingCart size={18} />
            </button>
          )}
        </div>
        
        {/* Stock Warning */}
        {isLowStock && (
          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
            <span>⚠️</span>
            Sắp hết hàng
          </p>
        )}
      </div>
    </Link>
  );
}

/**
 * ProductCardSkeleton - Loading skeleton cho ProductCard
 */
export function ProductCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden shadow-xl bg-white animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-4">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
        <div className="flex justify-between items-center">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-8 w-8 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * ProductGrid - Grid layout cho danh sách products
 */
interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  columns?: 2 | 3 | 4;
}

export function ProductGrid({ 
  products, 
  loading = false,
  columns = 4 
}: ProductGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4'
  }[columns];

  if (loading) {
    return (
      <div className={`grid sm:grid-cols-2 md:${gridCols} gap-5`}>
        {[...Array(columns * 2)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Không tìm thấy sản phẩm nào</p>
      </div>
    );
  }

  return (
    <div className={`grid sm:grid-cols-2 md:grid-cols-3 lg:${gridCols} gap-5`}>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}