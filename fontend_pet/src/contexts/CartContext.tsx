import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { CartItem, Product } from '../types';
import { cartApi } from '../api/cartApi';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  totalItems: number;
  totalPrice: number;
  loading: boolean;
  loadingProductId: number | null;
  addItem: (product: Product, quantity?: number) => Promise<void>;
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
  const [loadingProductId, setLoadingProductId] = useState<number | null>(null);

  const { user } = useAuth();
  const { showToast } = useToast();

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
  const addItem = async (product: Product, quantity: number = 1) => {
    if (!user) {
      showToast('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng', 'info');
      return;
    }

    try {
      setLoading(true);
      setLoadingProductId(product.id);
      const response = await cartApi.addItem(user.id, product.id, quantity);

      // Update state từ response
      const cartItems: CartItem[] = response.items.map(item => ({
        product: item.product,
        quantity: item.quantity,
      }));

      setItems(cartItems);
      showToast(`Đã thêm ${quantity} "${product.name}" vào giỏ hàng`, 'success');
    } catch (error) {
      console.error('Failed to add item:', error);
      showToast('Không thể thêm sản phẩm vào giỏ hàng', 'error');
    } finally {
      setLoading(false);
      setLoadingProductId(null);
    }
  };

  // Xóa sản phẩm khỏi giỏ hàng — optimistic: xóa UI ngay, rollback nếu API lỗi
  const removeItem = async (productId: number) => {
    if (!user) return;

    // Lưu lại để rollback nếu cần
    const previousItems = items;

    // Xóa ngay khỏi UI (không đợi API)
    setItems(prev => prev.filter(item => item.product.id !== productId));

    try {
      await cartApi.removeItem(user.id, productId);
    } catch (error) {
      console.error('Failed to remove item:', error);
      // Rollback nếu API lỗi
      setItems(previousItems);
      showToast('Không thể xóa sản phẩm', 'error');
    }
  };

  // Cập nhật số lượng — optimistic: đổi qty UI ngay, đồng bộ API ngầm
  const updateQuantity = async (productId: number, quantity: number) => {
    if (!user) return;

    if (quantity <= 0) {
      await removeItem(productId);
      return;
    }

    const previousItems = items;

    // Cập nhật qty ngay trên UI
    setItems(prev => prev.map(item =>
      item.product.id === productId ? { ...item, quantity } : item
    ));

    try {
      const response = await cartApi.updateQuantity(user.id, productId, quantity);
      // Đồng bộ lại với server sau khi API thành công
      const cartItems: CartItem[] = response.items.map(item => ({
        product: item.product,
        quantity: item.quantity,
      }));
      setItems(cartItems);
    } catch (error) {
      console.error('Failed to update quantity:', error);
      setItems(previousItems);
      showToast('Không thể cập nhật số lượng', 'error');
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
        loadingProductId,
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
