import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { CartItem, Product } from '../types';
import { cartApi } from '../api/cartApi';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  totalItems: number;
  totalPrice: number;
  loading: boolean;
  addItem: (product: Product) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  toggleDrawer: () => void;
  closeDrawer: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Lấy user từ AuthContext
  const { user } = useAuth();

  // Fetch cart khi user thay đổi (login/logout)
  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      // Nếu logout thì xóa giỏ hàng
      setItems([]);
    }
  }, [user]);

  // Fetch cart từ API
  const fetchCart = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await cartApi.getCart(user.id);

      // Convert response sang CartItem[]
      const cartItems: CartItem[] = response.items.map(item => ({
        product: item.product,
        quantity: item.quantity,
      }));

      setItems(cartItems);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tính tổng số lượng sản phẩm
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // Tính tổng tiền
  const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Thêm sản phẩm vào giỏ hàng (gọi API)
  const addItem = async (product: Product) => {
    if (!user) {
      alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      return;
    }

    try {
      setLoading(true);
      const response = await cartApi.addItem(user.id, product.id, 1);

      // Update state từ response
      const cartItems: CartItem[] = response.items.map(item => ({
        product: item.product,
        quantity: item.quantity,
      }));

      setItems(cartItems);
    } catch (error) {
      console.error('Failed to add item:', error);
      alert('Không thể thêm sản phẩm vào giỏ hàng');
    } finally {
      setLoading(false);
    }
  };

  // Xóa sản phẩm khỏi giỏ hàng (gọi API)
  const removeItem = async (productId: number) => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await cartApi.removeItem(user.id, productId);

      // Update state từ response
      const cartItems: CartItem[] = response.items.map(item => ({
        product: item.product,
        quantity: item.quantity,
      }));

      setItems(cartItems);
    } catch (error) {
      console.error('Failed to remove item:', error);
      alert('Không thể xóa sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật số lượng (gọi API)
  const updateQuantity = async (productId: number, quantity: number) => {
    if (!user) return;

    if (quantity <= 0) {
      await removeItem(productId);
      return;
    }

    try {
      setLoading(true);
      const response = await cartApi.updateQuantity(user.id, productId, quantity);

      // Update state từ response
      const cartItems: CartItem[] = response.items.map(item => ({
        product: item.product,
        quantity: item.quantity,
      }));

      setItems(cartItems);
    } catch (error) {
      console.error('Failed to update quantity:', error);
      alert('Không thể cập nhật số lượng');
    } finally {
      setLoading(false);
    }
  };

  // Toggle drawer
  const toggleDrawer = () => setIsOpen((prev) => !prev);

  // Đóng drawer
  const closeDrawer = () => setIsOpen(false);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        totalItems,
        totalPrice,
        loading,
        addItem,
        removeItem,
        updateQuantity,
        toggleDrawer,
        closeDrawer,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Hook để sử dụng CartContext
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart phải được dùng trong CartProvider');
  }
  return context;
}
