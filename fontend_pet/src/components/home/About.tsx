import { Stethoscope, Syringe, Bone, Scissors, ArrowRight } from 'lucide-react';

export default function About() {
  const features = [
    { icon: Stethoscope, title: "Khám tổng quát", desc: "Chẩn đoán chính xác, điều trị dứt điểm", color: "text-sky-600", bg: "bg-sky-100" },
    { icon: Syringe, title: "Tiêm phòng", desc: "Phòng ngừa bệnh tật, bảo vệ sức khoẻ", color: "text-rose-500", bg: "bg-rose-100" },
    { icon: Bone, title: "Dinh dưỡng", desc: "Thực đơn khoa học cho từng giống loài", color: "text-amber-500", bg: "bg-amber-100" },
    { icon: Scissors, title: "Grooming & Spa", desc: "Cắt tỉa lông, tắm sấy thơm tho sạch sẽ", color: "text-emerald-500", bg: "bg-emerald-100" },
  ];

  return (
    <section id="about" className="py-20 md:py-28 bg-white relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-sky-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-rose-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
      </div>

      <div className="mx-auto max-w-7xl px-4 grid lg:grid-cols-2 gap-12 lg:gap-24 items-center relative z-10">
        {/* Left side: Text */}
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-100 text-sky-700 text-sm font-semibold mb-6">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
            </span>
            Về PawCare
          </div>
          
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-800 leading-[1.15] mb-6 tracking-tight">
            Chăm Sóc Tận Tâm, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-sky-400">Yêu Thương Trọn Vẹn</span>
          </h2>
          
          <p className="text-lg text-slate-600 leading-relaxed mb-8">
            <span className="font-semibold text-sky-900">PawCare</span> là phòng khám thú y chuyên nghiệp, cung cấp giải pháp chăm sóc toàn diện cho thú cưng của bạn. Với đội ngũ bác sĩ nhiệt huyết và hệ thống máy móc hiện đại, chúng tôi tự hào là nơi gửi gắm niềm tin của hàng ngàn "Sen".
          </p>
          
          <a href="#services" className="inline-flex items-center gap-2 text-white bg-sky-700 px-7 py-3.5 rounded-full font-semibold hover:bg-sky-800 transition-all shadow-lg hover:shadow-sky-700/30 hover:-translate-y-0.5 group">
            Xem chi tiết dịch vụ
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Right side: Features Grid */}
        <div className="grid sm:grid-cols-2 gap-5 lg:gap-6">
          {features.map((item, idx) => (
            <div 
              key={idx} 
              className="group bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:border-sky-100 hover:shadow-xl hover:shadow-sky-900/5 transition-all duration-300 hover:-translate-y-1.5"
            >
              <div className={`w-14 h-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                <item.icon size={26} strokeWidth={2} />
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
