import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Products from "./pages/Products";
import { CartProvider } from "./contexts/CartContext";
import "./index.css"
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "products", element: <Products /> },
      { path: "about", element: <Home /> },
      { path: "services", element: <Home /> },
      { path: "*", element: <div className="p-12 text-center">404 — Trang không tồn tại</div> },
    ],
  },
]);

export default function App() {
  return (
    <CartProvider>
      <RouterProvider router={router} />
    </CartProvider>
  );
}
