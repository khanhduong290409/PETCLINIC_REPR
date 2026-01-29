// frontend/src/pages/Home.tsx
import React from "react";
import Hero from "../components/home/Hero";
import About from "../components/home/About";
import Services from "../components/home/Services";
import FeaturedProducts from "../components/home/FeaturedProducts";
import AppointmentCTA from "../components/home/AppointmentCTA";
import Testimonials from "../components/home/Testimonials";

/**
 * Home - Trang chủ của website
 * Composite page bao gồm nhiều sections
 */
export default function Home() {
  return (
    <>
      {/* Hero Section - Banner chính với CTA */}
      <Hero />
      
      {/* About Section - Giới thiệu về PetClinic */}
      <About />
      
      {/* Services Section - Các dịch vụ chính (3 columns layout) */}
      <Services />
      
      {/* Featured Products - Sản phẩm nổi bật */}
      <FeaturedProducts />
      
      {/* Appointment CTA - Call to action đặt lịch */}
      <AppointmentCTA />
      
      {/* Testimonials - Đánh giá từ khách hàng */}
      <Testimonials />
    </>
  );
}