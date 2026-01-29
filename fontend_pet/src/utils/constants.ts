// frontend/src/utils/constants.ts
import khamTongQuatUrl from "../assets/doctor.jpg";
import noikhoaUrl from "../assets/doctor.jpg";
import sanUrl from "../assets/doctor.jpg";
import capcuuUrl from "../assets/doctor.jpg";
import ngoaikhoaUrl from "../assets/doctor.jpg";
import chandoanUrl from "../assets/doctor.jpg";

import hatmeoUrl from "../assets/hatmeo.jpg";
import daydatchoUrl from "../assets/daydatcho.webp";
import suatamtucungUrl from "../assets/suatamchomeo.jpg";
import pateUrl from "../assets/patechomeo.webp";

// ==================== SERVICE DATA ====================
export const SERVICE_DATA = [
  {
    id: 1,
    title: "Khám & Điều Trị Tổng Quát Thú Cưng",
    description: "Cung cấp dịch vụ khám sức khỏe định kỳ, tư vấn dinh dưỡng, tiêm phòng...",
    imageUrl: khamTongQuatUrl,
    price: 200000,
    duration: 30,
    category: "checkup",
    position: "left",
  },
  {
    id: 2,
    title: "Chuyên Khoa Nội",
    description: "Điều trị bệnh lý nội khoa ở chó mèo như tim mạch, tiêu hóa, hô hấp...",
    imageUrl: noikhoaUrl,
    price: 300000,
    duration: 45,
    category: "internal",
    position: "left",
  },
  {
    id: 3,
    title: "Chuyên Khoa Sản",
    description: "Chăm sóc sức khỏe sinh sản toàn diện cho thú cưng, hỗ trợ đỡ đẻ...",
    imageUrl: sanUrl,
    price: 500000,
    duration: 60,
    category: "obstetrics",
    position: "left",
  },
  {
    id: 4,
    title: "Cấp Cứu Thú Cưng 24/7",
    description: "Đội ngũ bác sĩ thú y nhiều kinh nghiệm, sẵn sàng mọi lúc với thiết bị hiện đại.",
    imageUrl: capcuuUrl,
    price: 400000,
    duration: 30,
    category: "emergency",
    position: "right",
  },
  {
    id: 5,
    title: "Chuyên Khoa Ngoại",
    description: "Phẫu thuật an toàn, hiệu quả cho thú cưng, từ triệt sản đến phẫu thuật phức tạp.",
    imageUrl: ngoaikhoaUrl,
    price: 800000,
    duration: 90,
    category: "surgery",
    position: "right",
  },
  {
    id: 6,
    title: "Chẩn Đoán Hình Ảnh",
    description: "Cung cấp dịch vụ X-quang, siêu âm, xét nghiệm máu chính xác.",
    imageUrl: chandoanUrl,
    price: 250000,
    duration: 30,
    category: "diagnostic",
    position: "right",
  },
];

// ==================== PRODUCT DATA ====================
export const PRODUCT_DATA = [
  {
    id: 1,
    name: "Hạt cho mèo",
    price: 180000,
    imageUrl: hatmeoUrl,
    category: "food",
    categoryName: "Thức ăn",
    stock: 50,
    description: "Thức ăn cao cấp dành cho mèo trưởng thành, giàu dinh dưỡng",
    brand: "Royal Canin",
    weight: "2kg",
  },
  {
    id: 2,
    name: "Dây dắt chó",
    price: 120000,
    imageUrl: daydatchoUrl,
    category: "accessories",
    categoryName: "Phụ kiện",
    stock: 30,
    description: "Dây dắt chó chất lượng cao, bền đẹp, nhiều màu sắc",
    brand: "PetLove",
    material: "Nylon",
  },
  {
    id: 3,
    name: "Sữa tắm thú cưng",
    price: 140000,
    imageUrl: suatamtucungUrl,
    category: "grooming",
    categoryName: "Grooming",
    stock: 45,
    description: "Sữa tắm dịu nhẹ, an toàn cho da thú cưng, mùi hương dễ chịu",
    brand: "Bio-Groom",
    volume: "500ml",
  },
  {
    id: 4,
    name: "Pate cho mèo",
    price: 48000,
    imageUrl: pateUrl,
    category: "food",
    categoryName: "Thức ăn",
    stock: 100,
    description: "Pate dinh dưỡng cho mèo, nhiều vị khác nhau",
    brand: "Me-O",
    weight: "80g",
  },
];

// ==================== TESTIMONIAL DATA ====================
export const TESTIMONIAL_DATA = [
  {
    id: 1,
    customerName: "Anh Khoa",
    petName: "Milu",
    rating: 5,
    comment: "Bác sĩ tận tâm, đặt lịch nhanh gọn. Boss khỏe hơn hẳn!",
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
    comment: "Tư vấn dinh dưỡng hợp lý, boss ăn ngon miệng.",
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