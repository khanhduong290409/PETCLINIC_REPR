import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Minus, Plus } from 'lucide-react';
import { productApi } from '../api/productApi';
import { useCart } from '../contexts/CartContext';
import { getCategoryName } from '../utils/category';
import type { Product } from '../types';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  useEffect(() => {
    if (id) {
      fetchProduct(Number(id));//number chuyển string sang number
    }
  }, [id]);


  const fetchProduct = async (productId: number) => {
    try {
      setLoading(true);
      const data = await productApi.getById(productId);
      setProduct(data);
    } catch (err) {
      console.error('Failed to fetch product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }
    alert(`Đã thêm ${quantity} sản phẩm vào giỏ hàng`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">Không tìm thấy sản phẩm</p>
          <Link to="/products" className="text-sky-600 hover:underline">
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stock === 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Nút quay lại */}
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-800 mb-6"
      >
        <ArrowLeft size={20} />
        Quay lại danh sách sản phẩm
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Ảnh sản phẩm */}
        <div className="bg-gray-100 rounded-xl overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-[400px] object-cover"
          />
        </div>

        {/* Thông tin sản phẩm */}
        <div>
          {/* Category */}
          {product.category && (
            <span className="inline-block bg-sky-100 text-sky-700 text-sm font-semibold px-3 py-1 rounded-full mb-3">
              {getCategoryName(product.category)}
            </span>
          )}

          {/* Tên sản phẩm */}
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {product.name}
          </h1>

          {/* Thương hiệu */}
          {product.brand && (
            <p className="text-gray-500 mb-4">Thương hiệu: {product.brand}</p>
          )}

          {/* Giá */}
          <p className="text-3xl font-bold text-rose-600 mb-4">
            {product.price.toLocaleString('vi-VN')}đ
          </p>

          {/* Mô tả */}
          {product.description && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Mô tả sản phẩm</h3>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Tình trạng kho */}
          <div className="mb-6">
            <span className="text-gray-600">Tình trạng: </span>
            {isOutOfStock ? (
              <span className="text-red-600 font-semibold">Hết hàng</span>
            ) : (
              <span className="text-green-600 font-semibold">Còn {product.stock} sản phẩm</span>
            )}
          </div>

          {/* Chọn số lượng + Thêm vào giỏ */}
          {!isOutOfStock && (
            <div className="flex items-center gap-4">
              {/* Số lượng */}
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-gray-100 transition"
                >
                  <Minus size={18} />
                </button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="p-3 hover:bg-gray-100 transition"
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* Nút thêm vào giỏ */}
              <button
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2 bg-sky-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-sky-700 transition"
              >
                <ShoppingCart size={20} />
                Thêm vào giỏ hàng
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
