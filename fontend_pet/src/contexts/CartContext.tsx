import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { CartItem, Product } from '../types';
import { cartApi } from '../api/cartApi';

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

// Mock user ID (sau này sẽ lấy từ auth)
const MOCK_USER_ID = 1;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch cart khi component mount
  useEffect(() => {
    fetchCart();
  }, []);

  // Fetch cart từ API
  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartApi.getCart(MOCK_USER_ID);

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
    try {
      setLoading(true);
      const response = await cartApi.addItem(MOCK_USER_ID, product.id, 1);

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
    try {
      setLoading(true);
      const response = await cartApi.removeItem(MOCK_USER_ID, productId);

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
    if (quantity <= 0) {
      await removeItem(productId);
      return;
    }

    try {
      setLoading(true);
      const response = await cartApi.updateQuantity(MOCK_USER_ID, productId, quantity);

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
