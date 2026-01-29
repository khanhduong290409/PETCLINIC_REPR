export default function About() {
  return (
    <section id="about" className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-sky-900 mb-12">Về PetClinic</h2>
          <p className="mt-3 text-gray-600">
            PetClinic là phòng khám thú y chuyên nghiệp, chăm sóc toàn diện cho thú cưng: khám chữa bệnh,
            tiêm phòng – xét nghiệm, tư vấn dinh dưỡng, grooming & spa. Đội ngũ bác sĩ nhiệt tình, quy trình
            đặt lịch tiện lợi.
          </p>
          <a href="#services" className="mt-5 inline-block text-sky-700 font-semibold hover:underline">
            Xem chi tiết dịch vụ →
          </a>
        </div>
        <div className="rounded-xl bg-sky-50 shadow-2xs p-6">
          <ul className="space-y-3 text-sky-900">
            <li>🩺 Khám tổng quát & điều trị</li>
            <li>💉 Tiêm phòng – xét nghiệm</li>
            <li>🍖 Tư vấn dinh dưỡng</li>
            <li>✂️ Grooming & Spa</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
