// src/components/home/Hero.tsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

import img1 from "../../assets/clinic-hero.png";
import img2 from "../../assets/clinic-hero-dog.png";
import img3 from "../../assets/clinic-hero-bird.png";
import img4 from "../../assets/clinic-hero-hamster-2.png";
import img5 from "../../assets/clinic-hero-rabbit.png"
const slides = [img1, img2, img3, img4, img5];

// Mau text khop voi tone tung poster (nen trai deu trang nen can mau dam)
const slideThemes = [
  {
    title:    "text-amber-400",
    subtitle: "text-sky-700",
    body:     "text-sky-800",
    btn:      "border-sky-700 text-sky-800 hover:bg-sky-50",
  },
  {
    title:    "text-lime-700",
    subtitle: "text-green-800",
    body:     "text-green-900",
    btn:      "border-green-700 text-green-800 hover:bg-green-50",
  },
  {
    title:    "text-sky-700",
    subtitle: "text-teal-600",
    body:     "text-slate-700",
    btn:      "border-teal-700 text-teal-800 hover:bg-teal-50",
  },
{
  title:    "text-teal-900",    // teal đậm, liên quan tới khung lồng xanh
  subtitle: "text-slate-700",  
  body:     "text-slate-600",  
  btn:      "border-teal-800 text-teal-900 hover:bg-teal-50",
},
  {
  title:    "text-amber-900",    // nâu đậm, khớp sóng chocolate
  subtitle: "text-stone-700",   // nâu xám trung tính, chuyên nghiệp
  body:     "text-stone-600",   // nhạt hơn subtitle, dễ đọc
  btn:      "border-stone-600 text-stone-700 hover:bg-stone-50",
},
];

export default function Hero() {
  const { user } = useAuth();
  const [current, setCurrent] = useState(0);
  // Tang resetKey de restart interval (khi bam mui ten)
  const [resetKey, setResetKey] = useState(0);

  const theme = slideThemes[current]; // màu text poster

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [resetKey]);

  const goPrev = () => {
    setCurrent(prev => (prev - 1 + slides.length) % slides.length);
    setResetKey(k => k + 1);
  };

  const goNext = () => {
    setCurrent(prev => (prev + 1) % slides.length);
    setResetKey(k => k + 1);
  };

  return (
    <section
      className="relative min-h-[500px] h-[calc(100vh-3.5rem)] w-full overflow-hidden"
      aria-label="Hero"
    >
      {/* Cac slide anh nen — cross-fade bang opacity */}
      {slides.map((src, i) => (
        <div
          key={i}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[900ms] ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}

      {/* Text + CTA — hien thi ca 4 slide, mau thay doi theo theme */}
      <div className="relative z-10 h-full max-w-7xl px-6 md:px-10">
        <div className="h-full grid grid-cols-1 md:grid-cols-2 items-center">
          <div className="order-1 md:order-0 max-w-xl">
            <h1 className={`text-3xl md:text-5xl font-extrabold leading-tight transition-colors duration-700 animate-hero-fade-in ${theme.title}`}>
              Veterinary Hospital<br />
              <span className={`transition-colors duration-700 ${theme.subtitle}`}>PET HEALTH CENTRE</span>
            </h1>

            <p
              className={`mt-4 md:text-lg font-bold transition-colors duration-700 animate-hero-fade-in ${theme.subtitle}`}
              style={{ animationDelay: "0.15s" }}
            >
              "Khoẻ mạnh cho Boss, an toàn cho Sen"
            </p>
            <p
              className={`ml-2 text-sm font-bold transition-colors duration-700 animate-hero-fade-in ${theme.body}`}
              style={{ animationDelay: "0.25s" }}
            >
              Khám & điều trị, tiêm phòng, dinh dưỡng, grooming & spa.
            </p>

            <div
              className="mt-6 flex flex-wrap gap-3 animate-hero-fade-in"
              style={{ animationDelay: "0.38s" }}
            >
              <Link
                to={user ? "/book-appointment" : "/login"}
                className="bg-amber-400 text-sky-900 px-5 py-2.5 rounded-xl font-semibold shadow hover:bg-amber-300 transition"
              >
                Đặt lịch khám ngay
              </Link>
              <a
                href="#services"
                className={`border px-5 py-2.5 rounded-xl font-semibold transition ${theme.btn}`}
              >
                Xem dịch vụ
              </a>
            </div>
          </div>

          <div className="hidden md:block" />
        </div>
      </div>

      {/* Nut mui ten trai */}
      <button
        onClick={goPrev}
        aria-label="Slide truoc"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition backdrop-blur-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Nut mui ten phai */}
      <button
        onClick={goNext}
        aria-label="Slide sau"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition backdrop-blur-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Dots chi vi tri slide */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => { setCurrent(i); setResetKey(k => k + 1); }}
            aria-label={`Slide ${i + 1}`}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              i === current ? "w-6 bg-amber-400" : "w-2.5 bg-white/60 hover:bg-white/90"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
