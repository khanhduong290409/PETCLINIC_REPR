import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  ShoppingBag,
  Users,
  Package,
  Stethoscope,
  LogOut,
  Menu,
  X,
  Bell,
  ExternalLink,
} from "lucide-react";
import logoUrl from "../../assets/pawcare-logo.png";
import { useAuth } from "../../contexts/AuthContext";

const NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { to: "/admin/appointments", label: "Lịch khám", icon: CalendarDays },
  { to: "/admin/orders", label: "Đơn hàng", icon: ShoppingBag },
  { to: "/admin/users", label: "Người dùng", icon: Users },
  { to: "/admin/products", label: "Sản phẩm", icon: Package },
  { to: "/admin/services", label: "Dịch vụ", icon: Stethoscope },
];

// Tách ra module-level để tránh re-create mỗi render của AdminLayout
function SidebarContent({
  onItemClick,
  onLogout,
}: {
  onItemClick?: () => void;
  onLogout: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-gray-100 shrink-0">
        <Link
          to="/admin/dashboard"
          className="flex items-center gap-2.5"
          onClick={onItemClick}
        >
          <img src={logoUrl} className="h-9 w-auto" alt="PawCare" />
          <div className="leading-tight">
            <p className="font-bold text-sky-900 text-sm">PawCare</p>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
              Admin Panel
            </p>
          </div>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold px-3 mb-2">
          Quản lý
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onItemClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-sky-50 text-sky-700 ring-1 ring-sky-100 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer: link về user site + logout */}
      <div className="px-3 pb-4 space-y-0.5 border-t border-gray-100 pt-3 shrink-0">
        <Link
          to="/"
          onClick={onItemClick}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
        >
          <ExternalLink size={16} />
          Trang khách hàng
        </Link>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50 transition"
        >
          <LogOut size={16} />
          Đăng xuất
        </button>
      </div>
    </>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-60 bg-white border-r border-gray-200 flex-col fixed inset-y-0 left-0 z-30">
        <SidebarContent onLogout={handleLogout} />
      </aside>

      {/* Sidebar mobile (drawer) */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-60 bg-white flex flex-col md:hidden shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 p-1.5 hover:bg-gray-100 rounded-lg z-10"
              aria-label="Đóng menu"
            >
              <X size={18} />
            </button>
            <SidebarContent
              onItemClick={() => setMobileOpen(false)}
              onLogout={handleLogout}
            />
          </aside>
        </>
      )}

      {/* Main wrapper */}
      <div className="md:ml-60 min-h-screen flex flex-col">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-600"
              aria-label="Mở menu"
            >
              <Menu size={20} />
            </button>
            <p className="text-sm text-gray-500 hidden sm:block">
              Chào mừng quay lại, <span className="font-semibold text-gray-800">{user?.fullName}</span>
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 relative"
              aria-label="Thông báo"
            >
              <Bell size={18} />
            </button>
            <div className="h-6 w-px bg-gray-200 mx-1" />
            <div className="flex items-center gap-2.5 px-2 py-1 rounded-lg">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 text-white flex items-center justify-center text-sm font-bold ring-2 ring-white shadow-sm shrink-0">
                {user?.fullName?.[0]?.toUpperCase() || "A"}
              </div>
              <div className="hidden md:block min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate max-w-36">
                  {user?.fullName}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-sky-600 font-bold">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
