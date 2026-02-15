// src/components/Navbar.tsx
import { Link, NavLink } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useEffect } from "react";
import logoUrl from "../../assets/logo.png";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";

export default function Navbar() {
  const { totalItems, toggleDrawer } = useCart();
  const { user, logout } = useAuth();
  const item = "text-white/90 hover:text-amber-300 transition font-medium";
  const active = ({ isActive }: { isActive: boolean }) =>
    (isActive ? "text-white font-semibold" : "text-white/80") + "transition";

  // Smooth scroll cho anchor nội trang
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLAnchorElement;
      if (target.tagName === "A" && target.getAttribute("href")?.startsWith("#")) {
        const id = target.getAttribute("href")!.slice(1);
        const el = document.getElementById(id);
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: "smooth" });
        }
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-30 bg-sky-900 backdrop-blur text-white">
      <div className="max-w-360 mx-auto px-5 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          {/* <div className="w-9 h-9 rounded-full bg-white text-sky-700 grid place-items-center font-bold">
            PC
          </div> */}
          <img src = {logoUrl} className = "h-9 w-9"></img>
          <span className="font-semibold text-lg tracking-wide">PetClinic</span>
        </Link>

        {/* Menu */}
        <nav className="hidden md:flex items-center gap-6 ml-120">
          <NavLink to="/" className={active}>Trang chủ</NavLink>
          <a href="#about" className={item}>Giới thiệu</a>
          <a href="#services" className={item}>Dịch vụ</a>
          <a href="#products" className={item}>Sản phẩm</a>
          <a href="#feedback" className={item}>Feedback</a>
        </nav>

        {/* Auth + Cart */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-white/90">Xin chào, {user.fullName}</span>
              <Link to="/my-pets" className="hover:text-amber-300 text-white/90 transition">
                Thú cưng
              </Link>
              <Link to="/orders" className="hover:text-amber-300 text-white/90 transition">
                Đơn hàng
              </Link>
              <button
                onClick={logout}
                className="hover:underline text-white/90"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:underline text-white/90">Đăng nhập</Link>
              <Link
                to="/register"
                className="bg-white text-sky-700 px-3 py-1.5 rounded-md font-semibold hover:bg-white/90 transition"
              >
                Đăng ký
              </Link>
            </>
          )}
          <button
            onClick={toggleDrawer}
            className="ml-3 relative hover:text-amber-300 transition"
            aria-label="Giỏ hàng"
          >
            <ShoppingCart size={22} />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-amber-400 text-sky-900 text-xs font-bold w-5 h-5 grid place-items-center rounded-full">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
