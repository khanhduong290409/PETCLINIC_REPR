export default function Footer() {
  return (
    <footer className="mt-10 border-t bg-sky-950">
      <div className="mx-auto max-w-7xl px-4 py-8 grid md:grid-cols-3 gap-6 text-sm text-white">
        <div>
          <div className="font-semibold text-white">PetClinic</div>
          <p className="mt-2">123 Đường ABC, Quận XYZ, TP.HCM</p>
          <p>Hotline: 0900 000 000</p>
        </div>
        <div>
          <div className="font-semibold text-white">Liên kết</div>
          <ul className="mt-2 space-y-1">
            <li><a href="#about" className="hover:underline">Giới thiệu</a></li>
            <li><a href="#services" className="hover:underline">Dịch vụ</a></li>
            <li><a href="#products" className="hover:underline">Sản phẩm</a></li>
            <li><a href="/appointments/new" className="hover:underline">Đặt lịch</a></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-white">Kết nối</div>
          <p className="mt-2">Facebook • Zalo • Instagram</p>
        </div>
      </div>
      <div className="text-center text-xs text-white py-4">© {new Date().getFullYear()} PetClinic</div>
    </footer>
  );
}
