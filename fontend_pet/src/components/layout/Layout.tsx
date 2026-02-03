// frontend/src/components/layout/Layout.tsx
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import CartDrawer from "../cart/CartDrawer";

/**
 * Layout - Main layout wrapper cho tất cả pages
 * Bao gồm Navbar, main content area, và Footer
 */
export default function Layout() {
  const location = useLocation();

  // Có thể customize layout dựa trên route
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAuthRoute = ['/login', '/register'].includes(location.pathname);

  // Admin routes có thể có layout khác
  if (isAdminRoute) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        {/* Admin Navbar sẽ khác với Navbar thường */}
        <Navbar />
        <main className="flex-grow">
          <Outlet />
        </main>
        <CartDrawer />
      </div>
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
      <main className="flex-grow pt-16">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />

      {/* Cart Drawer */}
      <CartDrawer />
    </div>
  );
}