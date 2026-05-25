import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import doctorImg from "../../assets/doctor.jpg";
import { CalendarCheck2 } from "lucide-react";

export default function AppointmentCTA() {
  const { user } = useAuth();

  return (
    <section id="appointment-cta" className="py-20 md:py-28 bg-white">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col lg:flex-row items-stretch rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-100 bg-white">
          
          {/* Left: Image */}
          <div className="w-full lg:w-5/12 min-h-[250px] lg:min-h-full relative">
            <div className="absolute inset-0 bg-sky-900/10 mix-blend-multiply z-10"></div>
            <img 
              src={doctorImg} 
              alt="Bác sĩ thú y" 
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          {/* Right: Content */}
          <div className="w-full lg:w-7/12 p-10 md:p-14 lg:p-16 flex flex-col justify-center bg-slate-50/50">
            <div className="inline-flex items-center gap-2 text-sky-700 font-bold text-sm tracking-widest uppercase mb-4">
              <CalendarCheck2 size={18} />
              <span>Dịch vụ tiện lợi</span>
            </div>
            
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-5 leading-[1.2]">
              Chủ động thời gian, <br />
              <span className="text-sky-700">yên tâm chăm sóc</span>
            </h3>
            
            <p className="text-slate-500 text-lg mb-8 leading-relaxed max-w-lg">
              Tránh thời gian chờ đợi mệt mỏi. Đặt lịch trực tuyến nhanh chóng để bác sĩ của PawCare có thể chuẩn bị tốt nhất cho bé thú cưng của bạn.
            </p>
            
            <div>
              <Link
                to={user ? "/book-appointment" : "/login"}
                className="inline-flex items-center justify-center bg-sky-700 text-white px-8 py-4 rounded-xl font-bold text-base hover:bg-sky-800 transition-all shadow-md hover:shadow-lg hover:shadow-sky-700/20 active:scale-95"
              >
                Đặt lịch khám ngay
              </Link>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
