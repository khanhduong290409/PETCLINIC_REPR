// frontend/src/utils/constants.ts
import khamTongQuatUrl from "../assets/kham-tong-quat-pet.webp";
import vacxinUrl from "../assets/tiem-vacxin-pet.webp";
import cattiaUrl from "../assets/cattiapet.jpg";
import khachsanUrl from "../assets/khach-san-pet.webp";
import huanluyenUrl from "../assets/huan-luyen-pet.webp";
import noikhoaUrl from "../assets/kham-noi-khoa-pet.webp";

// ==================== SERVICE DATA ====================
export const SERVICE_DATA = [
  {
    id: 1,
    title: "Khám ngoại khoa",
    description: "Cung cấp dịch vụ khám các bệnh lí và biểu hiện bên ngoài của thú cưng.",
    imageUrl: khamTongQuatUrl,
    price: 300000,
    duration: 30,
    category: "checkup",
    position: "left",
  },
  {
    id: 2,
    title: "Tiêm Phòng Vacxin",
    description: "Tiêm Vacxin phòng bệnh phổ biến ở các loài động vật.",
    imageUrl: vacxinUrl,
    price: 200000,
    duration: 15,
    category: "internal",
    position: "left",
  },
  {
    id: 3,
    title: "Khám nội khoa",
    description: "Cung cấp dịch vụ X-quang, siêu âm, xét nghiệm máu chính xác.",
    imageUrl: noikhoaUrl,
    price: 250000,
    duration: 90,
    category: "diagnostic",
    position: "left",
  },
  {
    id: 4,
    title: "Khách Sạn Thú Cưng	",
    description: "Nhận giữ pet và chăm sóc cho pet tại cửa hàng ngày và đêm",
    imageUrl: khachsanUrl,
    price: 250000,
    duration: 11 +" giờ " + 30,
    category: "emergency",
    position: "right",
  },
  {
    id: 5,
    title: "Huấn Luyện",
    description: "Huấn luyện thú cưng các động tác và thói quen đơn giản.",
    imageUrl: huanluyenUrl,
    price: 800000,
    duration: 150,
    category: "surgery",
    position: "right",
  },
  {
    id: 6,
    title: "TGrooming & Spa",
    description: "Tắm gội, Cắt tỉa, Combo tắm cắt tia, Vệ sinh tai",
    imageUrl: cattiaUrl,
    price: 150000,
    duration: 60,
    category: "obstetrics",
    position: "right",
  },
];


// ==================== TESTIMONIAL DATA ====================
export const TESTIMONIAL_DATA = [
  {
    id: 1,
    customerName: "Anh Khoa",
    petName: "Milu",
    rating: 5,
    comment: "Bác sĩ tận tâm, đặt lịch nhanh gọn, dịch vụ tốt giá vừa phải.",
    date: "2024-01-15",
    avatar: null,
  },
  {
    id: 2,
    customerName: "Chị Linh",
    petName: "Na",
    rating: 5,
    comment: "Grooming rất ok, mèo thơm phức, cắt tỉa đẹp.",
    date: "2024-01-20",
    avatar: null,
  },
  {
    id: 3,
    customerName: "Bạn Huy",
    petName: "Bé Bông",
    rating: 5,
    comment: "Tư vấn dinh dưỡng hợp lý, boss ăn ngon.",
    date: "2024-01-25",
    avatar: null,
  },
];

// ==================== FEATURE DATA ====================
export const FEATURES = [
  {
    id: 1,
    icon: "🩺",
    title: "Khám tổng quát & điều trị",
    description: "Khám sức khỏe định kỳ và điều trị các bệnh lý thường gặp",
  },
  {
    id: 2,
    icon: "💉",
    title: "Tiêm phòng – xét nghiệm",
    description: "Tiêm phòng đầy đủ và xét nghiệm chính xác",
  },
  {
    id: 3,
    icon: "🍖",
    title: "Tư vấn dinh dưỡng",
    description: "Tư vấn chế độ ăn phù hợp cho từng giai đoạn",
  },
  {
    id: 4,
    icon: "✂️",
    title: "Grooming & Spa",
    description: "Dịch vụ làm đẹp chuyên nghiệp cho thú cưng",
  },
];

// ==================== APP CONFIG ====================
export const APP_CONFIG = {
  name: "PetClinic",
  tagline: "Khỏe mạnh cho Boss, an tâm cho Sen",
  contact: {
    phone: "1900 XXX XXX",
    email: "info@petclinic.vn",
    address: "123 Đường ABC, Quận XYZ, TP.HCM",
  },
  social: {
    facebook: "#",
    youtube: "#",
    instagram: "#",
    tiktok: "#",
  },
  businessHours: "24/7 - Cả tuần",
};

// ==================== NAVIGATION ====================
export const NAV_LINKS = [
  { path: "/", label: "Trang chủ", anchor: null },
  { path: "/#about", label: "Giới thiệu", anchor: "about" },
  { path: "/#services", label: "Dịch vụ", anchor: "services" },
  { path: "/products", label: "Sản phẩm", anchor: null },
  { path: "/#feedback", label: "Feedback", anchor: "feedback" },
];

// ==================== CATEGORIES ====================
export const PRODUCT_CATEGORIES = [
  { id: "all", name: "Tất cả", slug: "all" },
  { id: "food", name: "Thức ăn", slug: "food" },
  { id: "accessories", name: "Phụ kiện", slug: "accessories" },
  { id: "grooming", name: "Grooming", slug: "grooming" },
  { id: "medicine", name: "Thuốc & Y tế", slug: "medicine" },
];

export const SERVICE_CATEGORIES = [
  { id: "all", name: "Tất cả dịch vụ", slug: "all" },
  { id: "checkup", name: "Khám tổng quát", slug: "checkup" },
  { id: "internal", name: "Nội khoa", slug: "internal" },
  { id: "surgery", name: "Ngoại khoa", slug: "surgery" },
  { id: "emergency", name: "Cấp cứu", slug: "emergency" },
  { id: "diagnostic", name: "Chẩn đoán", slug: "diagnostic" },
  { id: "obstetrics", name: "Sản khoa", slug: "obstetrics" },
];