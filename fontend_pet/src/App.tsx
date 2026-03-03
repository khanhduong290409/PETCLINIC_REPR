import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import MyPets from "./pages/MyPets";
import BookAppointment from "./pages/BookAppointment";
import MyAppointments from "./pages/MyAppointments";
import AdminAppointments from "./pages/admin/AdminAppointments";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import MedicalRecord from "./pages/doctor/MedicalRecord";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { CartProvider } from "./contexts/CartContext";
import { AuthProvider } from "./contexts/AuthContext";
import "./index.css"

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
      { path: "book-appointment", element: <BookAppointment /> },
      { path: "appointments", element: <MyAppointments /> },
      { path: "admin/appointments", element: <AdminAppointments /> },
      { path: "doctor/appointments", element: <DoctorAppointments /> },
      { path: "doctor/medical/:bookingCode", element: <MedicalRecord /> },
      { path: "about", element: <Home /> },
      { path: "services", element: <Home /> },
      { path: "*", element: <div className="p-12 text-center">404 — Trang không tồn tại</div> },
    ],
  },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
]);

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </AuthProvider>
  );
}
