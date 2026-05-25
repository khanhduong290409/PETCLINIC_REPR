import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Minus, Plus, Star, Package, Tag, CheckCircle, XCircle } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-sky-100 border-t-sky-600"></div>
          <p className="text-gray-400 text-sm">Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg mb-4">Không tìm thấy sản phẩm</p>
          <Link to="/products" className="text-sky-600 hover:underline font-medium">
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stock === 0;
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-sm text-sky-600 hover:text-sky-800 font-medium transition-colors"
          >
            <ArrowLeft size={16} />
            Quay lại danh sách sản phẩm
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Product card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Image section */}
            <div className="relative bg-linear-to-br from-gray-50 to-gray-100 min-h-105 flex items-center justify-center p-6">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full max-h-105 object-contain drop-shadow-lg"
              />
              {isOutOfStock && (
                <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
                  Hết hàng
                </div>
              )}
            </div>

            {/* Info section */}
            <div className="p-8 flex flex-col justify-between border-l border-gray-100">
              <div>
                {/* Category + Brand */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {product.category && (
                    <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 text-xs font-semibold px-3 py-1 rounded-full border border-sky-100">
                      <Tag size={11} />
                      {getCategoryName(product.category)}
                    </span>
                  )}
                  {product.brand && (
                    <span className="text-xs text-gray-400 font-medium">{product.brand}</span>
                  )}
                </div>

                {/* Product name */}
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-snug mb-4">
                  {product.name}
                </h1>

                {/* Rating summary (if exists) */}
                {avgRating !== null && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className={i < Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'} />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500 font-medium">{avgRating.toFixed(1)}</span>
                    <span className="text-sm text-gray-400">({reviews.length} đánh giá)</span>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-gray-100 my-5" />

                {/* Price */}
                <div className="mb-5">
                  <p className="text-sm text-gray-400 mb-1 uppercase tracking-wide font-medium">Giá bán</p>
                  <p className="text-4xl font-extrabold text-rose-500 tracking-tight">
                    {product.price.toLocaleString('vi-VN')}
                    <span className="text-2xl ml-1">đ</span>
                  </p>
                </div>

                {/* Description */}
                {product.description && (
                  <div className="mb-5">
                    <p className="text-sm text-gray-400 mb-2 uppercase tracking-wide font-medium">Mô tả sản phẩm</p>
                    <p className="text-gray-600 leading-relaxed text-sm">{product.description}</p>
                  </div>
                )}

                {/* Stock status */}
                <div className="flex items-center gap-2 mb-6">
                  {isOutOfStock ? (
                    <>
                      <XCircle size={16} className="text-red-500" />
                      <span className="text-red-600 font-semibold text-sm">Hết hàng</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} className="text-emerald-500" />
                      <span className="text-emerald-600 font-semibold text-sm">
                        Còn {product.stock} sản phẩm
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Quantity + Add to cart */}
              {!isOutOfStock && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    {/* Quantity selector */}
                    <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-3 hover:bg-gray-50 transition text-gray-600 hover:text-gray-900"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-12 text-center font-bold text-gray-800 text-base select-none">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        className="p-3 hover:bg-gray-50 transition text-gray-600 hover:text-gray-900"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    {/* Add to cart button */}
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 flex items-center justify-center gap-2 bg-linear-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white py-3.5 px-6 rounded-xl font-bold text-base shadow-md shadow-sky-200 hover:shadow-sky-300 transition-all active:scale-[0.98]"
                    >
                      <ShoppingCart size={20} />
                      Thêm vào giỏ hàng
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 text-center">Miễn phí đổi trả trong 7 ngày</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews section */}
        <div className="mt-10">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Star size={20} className="fill-amber-400 text-amber-400" />
            Đánh giá sản phẩm
            {reviews.length > 0 && (
              <span className="text-sm font-normal text-gray-400 ml-1">({reviews.length})</span>
            )}
          </h2>

          {reviews.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-50 rounded-full mb-4">
                <Star size={28} className="text-amber-300" />
              </div>
              <p className="text-gray-600 font-semibold mb-1">Chưa có đánh giá nào</p>
              <p className="text-sm text-gray-400">Hãy là người đầu tiên đánh giá sản phẩm này!</p>
            </div>
          ) : (
            <div className="space-y-6">
              <ProductReviewSummary reviews={reviews} />
              <div className="grid md:grid-cols-2 gap-4">
                {reviews.map((review) => (
                  <ProductReviewItem key={review.id} review={review} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const AVATAR_COLORS = ['bg-sky-500', 'bg-violet-500', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500'];

function getAvatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase();
}

function ProductReviewSummary({ reviews }: { reviews: ProductReviewResponse[] }) {
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const starCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-8">
        {/* Average score */}
        <div className="text-center shrink-0 bg-amber-50 rounded-2xl px-8 py-5 border border-amber-100">
          <p className="text-5xl font-extrabold text-gray-800 leading-none">{avg.toFixed(1)}</p>
          <div className="flex gap-0.5 justify-center mt-2.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} className={i < Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'} />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2 font-medium">{reviews.length} đánh giá</p>
        </div>

        {/* Star distribution */}
        <div className="flex-1 space-y-2">
          {starCounts.map(({ star, count }) => (
            <div key={star} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-12 justify-end shrink-0">
                <span className="text-xs font-semibold text-gray-500">{star}</span>
                <Star size={11} className="fill-amber-400 text-amber-400 shrink-0" />
              </div>
              <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-linear-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: reviews.length > 0 ? `${(count / reviews.length) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-xs text-gray-400 font-medium w-6 text-right shrink-0">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductReviewItem({ review }: { review: ProductReviewResponse }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-gray-200 transition-all duration-200">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full ${getAvatarColor(review.customerName)} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm`}>
          {getInitials(review.customerName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="font-semibold text-gray-800 text-sm">{review.customerName}</span>
            <span className="text-xs text-gray-400 shrink-0 bg-gray-50 px-2 py-0.5 rounded-full">
              {new Date(review.createdAt).toLocaleDateString('vi-VN')}
            </span>
          </div>
          <div className="flex gap-0.5 mb-2.5">
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
