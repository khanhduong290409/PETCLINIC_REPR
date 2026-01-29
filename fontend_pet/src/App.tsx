import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import "./index.css"
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "about", element: <Home /> },
      { path: "services", element: <Home /> },
      { path: "*", element: <div className="p-12 text-center">404 — Trang không tồn tại</div> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
