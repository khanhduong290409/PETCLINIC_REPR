import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';

export default function CartDrawer() {
  const { items, isOpen, totalPrice, updateQuantity, removeItem, closeDrawer } = useCart();
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Giỏ hàng</h2>
          <button
            onClick={closeDrawer}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            aria-label="Đóng giỏ hàng"
          >
            <X size={24} />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">Giỏ hàng trống</p>
              <p className="text-sm mt-2">Thêm sản phẩm để tiếp tục mua sắm</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-3 border rounded-lg p-3">
                  {/* Product Image */}
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded"
                  />

                  {/* Product Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800 line-clamp-1">
                        {item.product.name}
                      </h3>
                      <p className="text-sky-600 font-bold mt-1">
                        {item.product.price.toLocaleString('vi-VN')}đ
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 border rounded">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100 transition"
                          aria-label="Giảm số lượng"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100 transition"
                          aria-label="Tăng số lượng"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                        aria-label="Xóa sản phẩm"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-4">
            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-800">Tổng cộng:</span>
              <span className="text-2xl font-bold text-sky-600">
                {totalPrice.toLocaleString('vi-VN')}đ
              </span>
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => {
                closeDrawer();
                navigate('/checkout');
              }}
              className="w-full bg-sky-600 text-white py-3 rounded-lg font-semibold hover:bg-sky-700 transition"
            >
              Thanh toán
            </button>
          </div>
        )}
      </div>
    </>
  );
}
