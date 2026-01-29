// src/components/Hero.tsx
import bgUrl from "../../assets/clinic-hero.png";
import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section
      className="relative min-h-[560px] h-[78vh] w-full overflow-hidden"
      aria-label="Hero"
    >
      {/* Ảnh nền */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgUrl})` }}
      />

      

      {/* Nội dung text + CTA (đặt trên mảng trắng) */}
      <div className="relative z-10 h-full max-w-7xl px-6 md:px-10">
        <div className="h-full grid grid-cols-1 md:grid-cols-2 items-center">
          <div className="order-1 md:order-none max-w-xl">
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight text-amber-400">
              Veterinary Hospital<br />
              <span className="text-sky-700">PET HEALTH CENTRE</span>
            </h1>

            <p className="mt-4 text-sky-700/80 md:text-lg font-bold">
              “Khỏe mạnh cho Boss, an tâm cho Sen”
            </p>
            <p className=" text-sky-800 ml-2 text-sm font-bold">
               Khám & điều trị, tiêm phòng, dinh dưỡng, grooming & spa.
            </p>
            

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/appointments/new"
                className="bg-amber-400 text-sky-900 px-5 py-2.5 rounded-xl font-semibold shadow hover:bg-amber-300 transition"
              >
                Đặt lịch khám ngay
              </Link>
              <a
                href="#services"
                className="border border-sky-700 text-sky-800 px-5 py-2.5 rounded-xl font-semibold hover:bg-sky-50 transition"
              >
                Xem dịch vụ
              </a>
            </div>
          </div>

          {/* khoảng trống phía phải để lộ ảnh nền + overlay (không cần nội dung) */}
          <div className="hidden md:block" />
        </div>
      </div>
    </section>
  );
}
