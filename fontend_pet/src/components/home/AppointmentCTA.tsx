import { Link } from "react-router-dom";

export default function AppointmentCTA() {
  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="rounded-2xl bg-gradient-to-r from-amber-600 to-amber-400 text-white p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xl md:text-2xl font-bold">Đặt lịch khám cho Boss ngay hôm nay</h3>
            <p className="text-white/90 mt-1">Chọn thú cưng, chọn thời gian – thao tác chỉ trong 1 phút.</p>
          </div>
          <Link to="/appointments/new" className="bg-white text-rose-700 px-5 py-2.5 rounded-lg font-semibold">
            Đặt lịch ngay
          </Link>
        </div>
      </div>
    </section>
  );
}
