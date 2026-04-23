import { useState, useEffect } from "react";
import { Star, Quote } from "lucide-react";
import { reviewApi } from "../../api/reviewApi";
import type { ReviewResponse } from "../../api/reviewApi";

const PAGE_SIZE = 4;

const AVATAR_COLORS = [
  'bg-sky-500', 'bg-violet-500', 'bg-rose-500',
  'bg-emerald-500', 'bg-amber-500', 'bg-pink-500',
];
function getAvatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}
function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase();
}

export default function Testimonials() {
  const [allReviews, setAllReviews] = useState<ReviewResponse[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    reviewApi.getAllReviews()
      .then((data) => setAllReviews(data))
      .catch(() => setAllReviews([]));
  }, []);

  if (allReviews.length === 0) return null;

  const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

  const starCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: allReviews.filter((r) => r.rating === star).length,
  }));

  // Review nổi bật: rating cao nhất, nếu bằng nhau thì lấy cái mới nhất
  const featuredReview = [...allReviews].sort((a, b) =>
    b.rating !== a.rating ? b.rating - a.rating : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];

  // List bên phải: bỏ featured ra, rồi load dần
  const listReviews = allReviews.filter((r) => r.id !== featuredReview.id);
  const visibleReviews = listReviews.slice(0, visibleCount);
  const hasMore = visibleCount < listReviews.length;

  return (
    <section id="feedback" className="py-20 bg-sky-50">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-sky-900 mb-3">
            Khách hàng nói gì?
          </h2>
          <p className="text-gray-500">
            Những phản hồi chân thực từ các "Sen" đã sử dụng dịch vụ
          </p>
        </div>

        {/* 2 cột chính */}
        <div className="grid md:grid-cols-[2fr_3fr] gap-8 items-start">

          {/* CỘT TRÁI — sticky: thống kê + review nổi bật */}
          <div className="md:sticky md:top-24 space-y-5">
            {/* Stats card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-end gap-3 mb-4">
                <span className="text-5xl font-bold text-gray-800 leading-none">
                  {avgRating.toFixed(1)}
                </span>
                <div className="mb-1">
                  <div className="flex gap-0.5 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">{allReviews.length} đánh giá đã xác thực</p>
                </div>
              </div>

              {/* Phân phối sao */}
              <div className="space-y-2">
                {starCounts.map(({ star, count }) => (
                  <div key={star} className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="w-3 text-right font-medium text-gray-600">{star}</span>
                    <Star size={10} className="fill-amber-400 text-amber-400 shrink-0" />
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-amber-400 h-full rounded-full transition-all duration-500"
                        style={{ width: allReviews.length > 0 ? `${(count / allReviews.length) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="w-4 text-right text-gray-400">{count}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-1.5 text-green-600 text-sm">
                <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold">✓</div>
                <span className="font-medium">100% đánh giá đã xác thực</span>
              </div>
            </div>

            {/* Review nổi bật */}
            <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
              <div className="bg-amber-400 px-5 py-2 flex items-center gap-1.5">
                <Star size={13} className="fill-white text-white" />
                <span className="text-white text-xs font-semibold">Đánh giá nổi bật</span>
              </div>
              <div className="p-5">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={15}
                      className={i < featuredReview.rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}
                    />
                  ))}
                </div>
                <Quote size={22} className="text-amber-200 mb-2" />
                <blockquote className="text-gray-700 leading-relaxed text-sm mb-4">
                  {featuredReview.comment}
                </blockquote>
                <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                  <div className={`w-9 h-9 rounded-full ${getAvatarColor(featuredReview.customerName)} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                    {getInitials(featuredReview.customerName)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{featuredReview.customerName}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(featuredReview.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI — list review dọc + load more */}
          <div className="space-y-3">
            {visibleReviews.map((review) => (
              <ReviewListItem key={review.id} review={review} />
            ))}

            {hasMore && (
              <button
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="w-full py-3 border-2 border-dashed border-sky-200 text-sky-600 rounded-xl hover:border-sky-400 hover:bg-sky-50 transition text-sm font-medium"
              >
                Xem thêm {Math.min(PAGE_SIZE, listReviews.length - visibleCount)} đánh giá
                <span className="text-gray-400 ml-1">({listReviews.length - visibleCount} còn lại)</span>
              </button>
            )}

            {!hasMore && listReviews.length > 0 && (
              <p className="text-center text-xs text-gray-400 py-2">Đã hiển thị tất cả đánh giá</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ReviewListItem({ review }: { review: ReviewResponse }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-sm transition-all">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full ${getAvatarColor(review.customerName)} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
          {getInitials(review.customerName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-semibold text-gray-800 text-sm">{review.customerName}</span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">✓</span>
              <span className="text-xs text-gray-400">
                {new Date(review.createdAt).toLocaleDateString('vi-VN')}
              </span>
            </div>
          </div>
          <div className="flex gap-0.5 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={12} className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'} />
            ))}
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
        </div>
      </div>
    </div>
  );
}

export function StarRating({
  rating, maxRating = 5, size = 18, showNumber = false
}: { rating: number; maxRating?: number; size?: number; showNumber?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[...Array(maxRating)].map((_, i) => (
          <Star key={i} size={size} className={i < rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'} />
        ))}
      </div>
      {showNumber && <span className="text-sm text-gray-600 font-medium">{rating.toFixed(1)}</span>}
    </div>
  );
}
