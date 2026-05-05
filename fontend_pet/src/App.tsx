import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import MyPets from "./pages/MyPets";
import PetMedicalRecords from "./pages/PetMedicalRecords";
import AppointmentMedicalRecords from "./pages/AppointmentMedicalRecords";
import BookAppointment from "./pages/BookAppointment";
import MyAppointments from "./pages/MyAppointments";
import AdminAppointments from "./pages/admin/AdminAppointments";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminServices from "./pages/admin/AdminServices";
import AdminUsers from "./pages/admin/AdminUsers";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import MedicalRecord from "./pages/doctor/MedicalRecord";
import Login from "./pages/Login";
import Register from "./pages/Register";
import OAuth2Callback from "./pages/OAuth2Callback";
import { CartProvider } from "./contexts/CartContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import "./index.css"
import ProtectedRoute from "./components/ProtectedRoute";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "products", element: <Products /> },
      { path: "products/:id", element: <ProductDetail /> },
      { path: "checkout", element: <Checkout /> },
      { path: "orders", element: <Orders /> },//lich su don hang
      { path: "orders/:id", element: <OrderDetail /> },
      { path: "my-pets", element: <MyPets /> },
      { path: "my-pets/:petId/records", element: <PetMedicalRecords /> },
      { path: "book-appointment", element: <BookAppointment /> },
      { path: "appointments", element: <MyAppointments /> },
      { path: "appointments/:bookingCode/records", element: <AppointmentMedicalRecords /> },
      { path: "admin/appointments", element: (
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminAppointments />
        </ProtectedRoute>
      ) },
      { path: "admin/products", element: (
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminProducts />
        </ProtectedRoute>
      ) },
      { path: "admin/services", element: (
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminServices />
        </ProtectedRoute>
      ) },
      { path: "admin/users", element: (
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminUsers />
        </ProtectedRoute>
      ) },
      { path: "doctor/appointments", element: (
        <ProtectedRoute allowedRoles={['DOCTOR']}>
          <DoctorAppointments />
        </ProtectedRoute>
      ) },
      { path: "doctor/medical/:bookingCode", element: 
      (
        <ProtectedRoute allowedRoles={['DOCTOR']}>
          <MedicalRecord />
        </ProtectedRoute>
      ) },
      { path: "about", element: <Home /> },
      { path: "services", element: <Home /> },
      { path: "*", element: <div className="p-12 text-center">404 — Trang không tồn tại</div> },
    ],
  },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/oauth2/callback", element: <OAuth2Callback /> },
]);

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <RouterProvider router={router} />
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
