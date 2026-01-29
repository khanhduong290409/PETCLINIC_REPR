// frontend/src/types/index.ts

// ==================== SERVICE TYPES ====================
export interface Service {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  duration: number; // minutes
  category: string;
  position?: 'left' | 'right';
}

// ==================== PRODUCT TYPES ====================
export interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  categoryName: string;
  stock: number;
  description?: string;
  brand?: string;
  weight?: string;
  volume?: string;
  material?: string;
}

// ==================== TESTIMONIAL TYPES ====================
export interface Testimonial {
  id: number;
  customerName: string;
  petName: string;
  rating: number;
  comment: string;
  date: string;
  avatar?: string | null;
}

// ==================== USER & AUTH TYPES ====================
export interface User {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  role: 'ADMIN' | 'CUSTOMER';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

// ==================== PET TYPES ====================
export interface Pet {
  id: number;
  userId: number;
  name: string;
  species: 'DOG' | 'CAT' | 'BIRD' | 'OTHER';
  breed?: string;
  age?: number;
  weight?: number;
  gender?: 'MALE' | 'FEMALE';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== APPOINTMENT TYPES ====================
export interface Appointment {
  id: number;
  userId: number;
  petId: number;
  serviceId: number;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:mm
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Populated fields
  petName?: string;
  serviceName?: string;
  userName?: string;
  pet?: Pet;
  service?: Service;
}

export interface CreateAppointmentData {
  petId: number;
  serviceId: number;
  appointmentDate: string;
  appointmentTime: string;
  notes?: string;
}

// ==================== ORDER & CART TYPES ====================
export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: number;
  userId: number;
  orderNumber: string;
  totalAmount: number;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  shippingAddress: string;
  paymentMethod: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  notes?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  product?: Product;
}

export interface CreateOrderData {
  items: {
    productId: number;
    quantity: number;
  }[];
  shippingAddress: string;
  paymentMethod: string;
  notes?: string;
}

// ==================== REVIEW TYPES ====================
export interface Review {
  id: number;
  userId: number;
  appointmentId?: number;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  userName?: string;
  userAvatar?: string;
}

export interface CreateReviewData {
  appointmentId?: number;
  rating: number;
  comment: string;
}

// ==================== API RESPONSE TYPES ====================
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
}

// ==================== FILTER TYPES ====================
export interface ProductFilter extends PaginationParams {
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export interface AppointmentFilter extends PaginationParams {
  status?: Appointment['status'];
  fromDate?: string;
  toDate?: string;
}

// ==================== FORM TYPES ====================
export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export interface ProfileUpdateData {
  fullName: string;
  phone?: string;
  address?: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ==================== CATEGORY TYPES ====================
export interface Category {
  id: string;
  name: string;
  slug: string;
}

// ==================== FEATURE TYPES ====================
export interface Feature {
  id: number;
  icon: string;
  title: string;
  description: string;
}

// ==================== ERROR TYPES ====================
export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}