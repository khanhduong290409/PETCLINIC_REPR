import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Minus, Plus, Star } from 'lucide-react';
import { productApi } from '../api/productApi';
import { productReviewApi } from '../api/productReviewApi';
import { useCart } from '../contexts/CartContext';
import { getCategoryName } from '../utils/category';
import type { Product } from '../types';
import type { ProductReviewResponse } from '../api/productReviewApi';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<ProductReviewResponse[]>([]);
  const { addItem } = useCart();

  useEffect(() => {
    if (id) {
      fetchProduct(Number(id));
      fetchReviews(Number(id));
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

  const fetchReviews = async (productId: number) => {
    try {
      const data = await productReviewApi.getReviewsByProduct(productId);
      setReviews(data);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    await addItem(product, quantity);
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

      {/* Section đánh giá sản phẩm */}
      <div className="mt-12 max-w-2xl">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Đánh giá sản phẩm</h2>

        {reviews.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <Star size={36} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Chưa có đánh giá nào</p>
            <p className="text-sm text-gray-400 mt-1">Hãy là người đầu tiên đánh giá sản phẩm này!</p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <ProductReviewSummary reviews={reviews} />
            {/* List */}
            <div className="space-y-3 mt-6">
              {reviews.map((review) => (
                <ProductReviewItem key={review.id} review={review} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const AVATAR_COLORS = ['bg-sky-500', 'bg-violet-500', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500'];

function getAvatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}
/*
"Nguyễn Văn An"
  .split(' ')       // → ['Nguyễn', 'Văn', 'An']
  .map((w) => w[0]) // → ['N', 'V', 'A']
  .slice(-2)        // lấy 2 phần tử cuối → ['V', 'A']
  .join('')         // → 'VA'
  .toUpperCase()    // → 'VA'

 */
function getInitials(name: string) { // lấy tên viết tắt của user 
  return name.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase();
}

function ProductReviewSummary({ reviews }: { reviews: ProductReviewResponse[] }) {
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const starCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="flex gap-6 bg-amber-50 border border-amber-100 rounded-xl p-5">
      {/* Điểm trung bình */}
      <div className="text-center shrink-0">
        <p className="text-4xl font-bold text-gray-800 leading-none">{avg.toFixed(1)}</p>
        <div className="flex gap-0.5 justify-center mt-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={14} className={i < Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'fill-gray-300 text-gray-300'} />
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1">{reviews.length} đánh giá</p>
      </div>

      {/* Divider */}
      <div className="w-px bg-amber-200 self-stretch" />

      {/* Phân phối sao */}
      <div className="flex-1 space-y-1.5 justify-center flex flex-col">
        {starCounts.map(({ star, count }) => (
          <div key={star} className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-3 text-right font-medium">{star}</span>
            <Star size={10} className="fill-amber-400 text-amber-400 shrink-0" />
            <div className="flex-1 bg-amber-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full"
                style={{ width: reviews.length > 0 ? `${(count / reviews.length) * 100}%` : '0%' }}
              />
            </div>
            <span className="w-4 text-right text-gray-400">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductReviewItem({ review }: { review: ProductReviewResponse }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-200 hover:shadow-sm transition-all">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full ${getAvatarColor(review.customerName)} flex items-center justify-center text-white text-sm font-bold shrink-0 ring-2 ring-white shadow-sm`}>
          {getInitials(review.customerName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-semibold text-gray-800 text-sm">{review.customerName}</span>
            <span className="text-xs text-gray-400 shrink-0">
              {new Date(review.createdAt).toLocaleDateString('vi-VN')}
            </span>
          </div>
          <div className="flex gap-0.5 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={13} className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'} />
            ))}
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
        </div>
      </div>
    </div>
  );
}
