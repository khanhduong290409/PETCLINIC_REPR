import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, ChevronDown, User, PawPrint, CalendarDays, ClipboardList, Package, Settings, Stethoscope, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import logoUrl from "../../assets/logo.png";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";

export default function Navbar() {
  const { totalItems, toggleDrawer } = useCart();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [closingDropdown, setClosingDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Đóng dropdown khi click ra ngoài

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      //cần check dropdown đã được mount vào DOM chưa bởi vì nếu chưa đăng nhập thì dropdown không xuất hiện
      //bên dưới file có giải thích dòng check này 
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && dropdownOpen) {
        setClosingDropdown(true);
        setTimeout(() => {
          setDropdownOpen(false);
          setClosingDropdown(false);
        }, 300);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);
      //gắn thì pahir gỡ, ko thì listender "trôi nổi" trên document mãi mãi dù component đã chết


  // Custom smooth scroll — easeInOutCubic, 900ms
  const smoothScrollTo = (targetY: number) => {
    const startY = window.scrollY;// vi tri cuon hien tai cua trang dang dung o dau 
    const distance = targetY - startY;// tinh khoang cach tu vi tri hien tai va vi tri cua target
    const duration = 900; // thoi gian cuon la 0.9s
    let startTime: number | null = null; // bien luu thoi gian bat dau animation

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      window.scrollTo(0, startY + distance * easeInOutCubic(progress));
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  // Smooth scroll cho anchor nội trang
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLAnchorElement;
     // Chỉ xử lý khi click vào thẻ <a href="#...">
      if (target.tagName === "A" && target.getAttribute("href")?.startsWith("#")) {
        //lấy giá trị href rồi cắt bỏ ký tự đầu tiên ( dấu # )
        //"#about"    → "about"
        //"#services" → "services"
        const id = target.getAttribute("href")!.slice(1);
        // tìm element có id tương ứng trên trang 
        /*
        <section id="about">
        </section>
        ↑
        el = phần tử này
         */
        const el = document.getElementById(id);
        if (el) {
          //chặn browser nhảy cóc mặc định đến #about
          e.preventDefault();
          // Trừ 56px chiều cao navbar để không bị che(tại vì navbar luôn hiện khi cuộn theo chứ ko phải bị mất khi cuộn xuống)
          const offsetTop = el.getBoundingClientRect().top + window.scrollY - 56;
          smoothScrollTo(offsetTop);
        }
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `nav-link text-sm font-medium transition-colors ${isActive ? "text-white active" : "text-white/70 hover:text-white"}`;

  const anchorClass = "nav-link text-sm font-medium text-white/70 hover:text-white transition-colors";

  // Khi click "Đặt lịch" trên navbar:
  // - Đang ở trang chủ → scroll đến section
  // - Đang ở trang khác → navigate về home, chờ render xong rồi scroll
  const handleBookClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const scrollToSection = () => {
      const el = document.getElementById('appointment-cta');
      if (el) {
        const offsetTop = el.getBoundingClientRect().top + window.scrollY - 56;
        smoothScrollTo(offsetTop);
      }
    };

    if (location.pathname === '/') {
      scrollToSection();
    } else {
      navigate('/');
      setTimeout(scrollToSection, 300);
    }
  };

  // Đóng dropdown có animation: fade-out 200ms rồi mới unmount
  const handleCloseDropdown = () => {
    setClosingDropdown(true);
    setTimeout(() => {
      setDropdownOpen(false);
      setClosingDropdown(false);
    }, 200);
  };

  const dropdownItemClass = "flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors";

  return (
    <header className="fixed inset-x-0 top-0 z-30 bg-sky-900 text-white border-b border-white/10 shadow-md">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-6">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <img src={logoUrl} className="h-7 w-7" />
          <span className="font-semibold text-sm tracking-wide">PetClinic</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-7">
          <NavLink to="/" className={navLinkClass} onClick={() => smoothScrollTo(0)}>Trang chủ</NavLink>
          <a href="#about"    className={anchorClass}>Giới thiệu</a>
          <a href="#services" className={anchorClass}>Dịch vụ</a>
          <a href="#products" className={anchorClass}>Sản phẩm</a>
          <a href="#appointment-cta" className={anchorClass} onClick={handleBookClick}>
            Đặt lịch
          </a>
          <a href="#feedback" className={anchorClass}>Feedback</a>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-1">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => dropdownOpen ? handleCloseDropdown() : setDropdownOpen(true)}
                className="flex items-center gap-2 text-sm text-white/80 hover:text-white px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors"
              >
                <User size={15} className="shrink-0" />
                <span className="max-w-32 truncate">{user.fullName}</span>
                <ChevronDown size={13} className={`shrink-0 transition-transform duration-150 ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown */}
              {(dropdownOpen || closingDropdown) && (
                <div className={`absolute right-0 top-full mt-1.5 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 ${closingDropdown ? 'animate-fade-out' : 'animate-fade-in'}`}>

                  {/* Header */}
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="text-xs text-gray-400 mb-0.5">Tài khoản</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{user.fullName}</p>
                  </div>

                  <div className="py-1">
                    <Link to="/my-pets" onClick={handleCloseDropdown} className={dropdownItemClass}>
                      <PawPrint size={15} className="text-gray-400" /> Thú cưng
                    </Link>
                    <Link to="/book-appointment" onClick={handleCloseDropdown} className={dropdownItemClass}>
                      <CalendarDays size={15} className="text-gray-400" /> Đặt lịch
                    </Link>
                    <Link to="/appointments" onClick={handleCloseDropdown} className={dropdownItemClass}>
                      <ClipboardList size={15} className="text-gray-400" /> Lịch khám
                    </Link>
                    <Link to="/orders" onClick={handleCloseDropdown} className={dropdownItemClass}>
                      <Package size={15} className="text-gray-400" /> Đơn hàng
                    </Link>
                  </div>

                  {user.role === 'ADMIN' && (
                    <>
                      <div className="border-t border-gray-100" />
                      <div className="py-1">
                        <Link to="/admin/appointments" onClick={handleCloseDropdown}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-sky-700 hover:bg-sky-50 transition-colors font-medium"
                        >
                          <Settings size={15} /> Admin
                        </Link>
                      </div>
                    </>
                  )}

                  {user.role === 'DOCTOR' && (
                    <>
                      <div className="border-t border-gray-100" />
                      <div className="py-1">
                        <Link to="/doctor/appointments" onClick={handleCloseDropdown}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-green-700 hover:bg-green-50 transition-colors font-medium"
                        >
                          <Stethoscope size={15} /> Lịch của tôi
                        </Link>
                      </div>
                    </>
                  )}

                  <div className="border-t border-gray-100" />
                  <div className="py-1">
                    <button
                      onClick={() => { logout(); handleCloseDropdown(); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={15} /> Đăng xuất
                    </button>
                  </div>

                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login"
                className="text-sm text-white/70 hover:text-white px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors"
              >
                Đăng nhập
              </Link>
              <Link to="/register"
                className="text-sm bg-white text-sky-900 px-4 py-1.5 rounded-md font-semibold hover:bg-white/90 transition-colors ml-1"
              >
                Đăng ký
              </Link>
            </>
          )}

          {/* Cart */}
          <button
            onClick={toggleDrawer}
            className="relative ml-2 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            aria-label="Giỏ hàng"
          >
            <ShoppingCart size={19} />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-amber-400 text-sky-900 text-xs font-bold w-4.5 h-4.5 min-w-4 min-h-4 flex items-center justify-center rounded-full text-[10px]">
                {totalItems}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
/**
 dropdownRef.current
→ Kiểm tra cái <div ref={dropdownRef}> đã được mount vào DOM chưa. Lúc component mới render có thể current vẫn là null.

dropdownRef.current.contains(e.target as Node)
→ "Click vừa rồi có nằm bên trong div dropdown không?"
click vào tên user      → contains = true  (trong dropdown)
click vào menu item     → contains = true  (trong dropdown)
click ra ngoài trang    → contains = false (ngoài dropdown)
check cả nút bật dropdown ( toogle )
 */