import { useState, useEffect } from "react";
import { Star, Quote, MessageCircleHeart, Check } from "lucide-react";
import { reviewApi } from "../../api/reviewApi";
import type { ReviewResponse } from "../../api/reviewApi";

const PAGE_SIZE = 4;

const AVATAR_COLORS = [
  'bg-sky-500', 'bg-violet-500', 'bg-rose-500',
  'bg-emerald-500', 'bg-amber-500', 'bg-teal-500',
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
    <section id="feedback" className="py-24 bg-white relative">
      {/* Decorative background */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-sky-50/50 skew-y-3 origin-top-left -z-10"></div>

      <div className="mx-auto max-w-6xl px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center gap-2 mb-3 text-sky-600">
            <MessageCircleHeart size={24} />
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight mb-4">
            Khách hàng nói gì?
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Những phản hồi chân thực và yêu thương từ các "Sen" đã tin tưởng sử dụng dịch vụ tại PawCare.
          </p>
        </div>

        {/* 2 cột chính */}
        <div className="grid lg:grid-cols-[2fr_3fr] gap-10 items-start">

          {/* CỘT TRÁI — sticky: thống kê + review nổi bật */}
          <div className="lg:sticky lg:top-24 space-y-6">
            {/* Stats card */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
              <div className="flex items-end gap-4 mb-6">
                <span className="text-6xl font-black text-slate-800 leading-none tracking-tighter">
                  {avgRating.toFixed(1)}
                </span>
                <div className="mb-1.5">
                  <div className="flex gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={18}
                        className={i < Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-100'}
                      />
                    ))}
                  </div>
                  <p className="text-sm font-medium text-slate-400">{allReviews.length} đánh giá đã xác thực</p>
                </div>
              </div>

              {/* Phân phối sao */}
              <div className="space-y-3">
                {starCounts.map(({ star, count }) => (
                  <div key={star} className="flex items-center gap-3 text-sm text-slate-500">
                    <span className="w-3 text-right font-semibold text-slate-700">{star}</span>
                    <Star size={12} className="fill-amber-400 text-amber-400 shrink-0" />
                    <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-amber-400 h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: allReviews.length > 0 ? `${(count / allReviews.length) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="w-5 text-right font-medium text-slate-400">{count}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-2 text-emerald-600 text-sm">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center font-bold"><Check size={12} /></div>
                <span className="font-semibold">100% đánh giá đã xác thực</span>
              </div>
            </div>

            {/* Review nổi bật */}
            {featuredReview && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-3xl border border-amber-100 shadow-lg shadow-amber-900/5 overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Quote size={80} className="text-amber-500" />
                </div>
                <div className="px-6 py-3 border-b border-amber-100/50 flex items-center gap-2">
                  <Star size={14} className="fill-amber-500 text-amber-500" />
                  <span className="text-amber-700 text-xs font-bold uppercase tracking-wider">Đánh giá nổi bật</span>
                </div>
                <div className="p-6 relative z-10">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < featuredReview.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}
                      />
                    ))}
                  </div>
                  <blockquote className="text-slate-700 leading-relaxed text-base italic mb-6">
                    "{featuredReview.comment}"
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full shadow-sm ${getAvatarColor(featuredReview.customerName)} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                      {getInitials(featuredReview.customerName)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{featuredReview.customerName}</p>
                      <p className="text-xs font-medium text-slate-400">
                        {new Date(featuredReview.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CỘT PHẢI — list review dọc + load more */}
          <div className="space-y-4">
            {visibleReviews.map((review) => (
              <ReviewListItem key={review.id} review={review} />
            ))}

            {hasMore && (
              <button
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="w-full mt-6 py-4 border-2 border-dashed border-sky-200 text-sky-700 rounded-2xl hover:border-sky-400 hover:bg-sky-50 transition-all text-sm font-bold tracking-wide"
              >
                Xem thêm {Math.min(PAGE_SIZE, listReviews.length - visibleCount)} đánh giá
                <span className="text-sky-400/80 ml-1 font-medium">({listReviews.length - visibleCount} còn lại)</span>
              </button>
            )}

            {!hasMore && listReviews.length > 0 && (
              <p className="text-center text-sm text-slate-400 py-6 font-medium">Đã hiển thị tất cả đánh giá</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ReviewListItem({ review }: { review: ReviewResponse }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 hover:border-sky-100 transition-all duration-300 group">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-full shadow-sm ${getAvatarColor(review.customerName)} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
          {getInitials(review.customerName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="font-bold text-slate-800 text-base">{review.customerName}</span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Đã xác thực <Check size={10} /></span>
              <span className="text-xs font-medium text-slate-400">
                {new Date(review.createdAt).toLocaleDateString('vi-VN')}
              </span>
            </div>
          </div>
          <div className="flex gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-100'} />
            ))}
          </div>
          <p className="text-slate-600 leading-relaxed group-hover:text-slate-800 transition-colors">{review.comment}</p>
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
          <Star key={i} size={size} className={i < rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'} />
        ))}
      </div>
      {showNumber && <span className="text-sm text-slate-600 font-semibold">{rating.toFixed(1)}</span>}
    </div>
  );
}
