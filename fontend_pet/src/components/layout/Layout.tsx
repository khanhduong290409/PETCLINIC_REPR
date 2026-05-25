// frontend/src/components/layout/Layout.tsx
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import AdminLayout from "./AdminLayout";
import CartDrawer from "../cart/CartDrawer";
import ChatWidget from "../ChatWidget";

/**
 * Layout - Main layout wrapper cho tất cả pages
 * Bao gồm Navbar, main content area, và Footer
 */
export default function Layout() {
  const location = useLocation();

  // Cuộn lên đầu trang mỗi khi chuyển route
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Có thể customize layout dựa trên route
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isDoctorRoute = location.pathname.startsWith('/doctor');
  const isAuthRoute = ['/login', '/register'].includes(location.pathname);

  // Ẩn ChatWidget với admin và doctor (chỉ hiện cho khách/user thường)
  const showChatWidget = !isAdminRoute && !isDoctorRoute;

  // Admin routes — dùng AdminLayout riêng (sidebar dọc + topbar)
  if (isAdminRoute) {
    return (
      <>
        <AdminLayout />
        <CartDrawer />
      </>
    );
  }

  // Auth routes không có Navbar/Footer
  if (isAuthRoute) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
        <main>
          <Outlet />
        </main>
      </div>
    );
  }

  // Default layout cho public pages
  return (
    <div className="min-h-screen flex flex-col">
      {/* Fixed Navbar */}
      <Navbar />

      {/* Main Content - với padding-top để tránh bị Navbar che */}
      <main className="flex-grow pt-14">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Chat Widget - chỉ hiện cho khách/user thường, ẩn với admin & doctor */}
      {showChatWidget && <ChatWidget />}
    </div>
  );
}