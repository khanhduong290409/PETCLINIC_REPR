// frontend/src/components/home/Testimonials.tsx
import React from "react";
import { Star, Quote } from "lucide-react";
import { TESTIMONIAL_DATA } from "../../utils/constants";
import type { Testimonial } from "../../types";

/**
 * Testimonials - Section hiển thị đánh giá từ khách hàng
 */
export default function Testimonials() {
  return (
    <section id="feedback" className="py-12 bg-sky-50">
      <div className="mx-auto max-w-7xl px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-sky-900 mb-2">
            Khách hàng nói gì?
          </h2>
          <p className="text-gray-600">
            Những phản hồi chân thực từ các "Sen" đã sử dụng dịch vụ
          </p>
        </div>
        
        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIAL_DATA.map(testimonial => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ==================== SUB-COMPONENTS ====================

interface TestimonialCardProps {
  testimonial: Testimonial;
}

/**
 * TestimonialCard - Card component cho mỗi testimonial
 */
function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <div className="group rounded-xl bg-white p-6 border shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative">
      {/* Quote Icon */}
      <div className="absolute top-4 right-4 text-sky-100 group-hover:text-sky-200 transition-colors">
        <Quote size={40} />
      </div>
      
      {/* Rating Stars */}
      <div className="flex gap-1 mb-3 relative z-10">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={18}
            className={
              i < testimonial.rating 
                ? "fill-amber-400 text-amber-400" 
                : "fill-gray-200 text-gray-200"
            }
          />
        ))}
      </div>
      
      {/* Comment */}
      <blockquote className="text-gray-700 leading-relaxed mb-4 relative z-10">
        "{testimonial.comment}"
      </blockquote>
      
      {/* Customer Info */}
      <div className="flex items-center justify-between pt-4 border-t relative z-10">
        <div>
          <div className="font-semibold text-sky-900">
            {testimonial.customerName}
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <span className="text-rose-500">🐾</span>
            <span>Pet: {testimonial.petName}</span>
          </div>
        </div>
        
        {/* Date */}
        <div className="text-xs text-gray-400">
          {formatDate(testimonial.date)}
        </div>
      </div>
      
      {/* Verified Badge (Optional) */}
      <div className="absolute bottom-6 right-6 bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
        <span>✓</span>
        <span>Đã xác thực</span>
      </div>
    </div>
  );
}

/**
 * StarRating - Reusable star rating component
 */
interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  showNumber?: boolean;
}

export function StarRating({ 
  rating, 
  maxRating = 5, 
  size = 18,
  showNumber = false 
}: StarRatingProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[...Array(maxRating)].map((_, i) => (
          <Star
            key={i}
            size={size}
            className={
              i < rating 
                ? "fill-amber-400 text-amber-400" 
                : "fill-gray-200 text-gray-200"
            }
          />
        ))}
      </div>
      {showNumber && (
        <span className="text-sm text-gray-600 font-medium">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Format date to Vietnamese format
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}