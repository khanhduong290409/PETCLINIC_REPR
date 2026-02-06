import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../api/authApi';
import type { LoginRequest, RegisterRequest } from '../api/authApi';

// User type
interface User {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  role: string;
}

// Context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<string | null>;
  register: (data: RegisterRequest) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Khi mount, kiểm tra localStorage xem đã login chưa
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Đăng nhập
  const login = async (data: LoginRequest): Promise<string | null> => {
    try {
      const response = await authApi.login(data);

      // Nếu có id = thành công
      if (response.id) {
        const loggedInUser: User = {
          id: response.id,
          email: response.email,
          fullName: response.fullName,
          phone: response.phone,
          role: response.role,
        };
        setUser(loggedInUser);
        localStorage.setItem('user', JSON.stringify(loggedInUser));
        return null; // Không có lỗi
      }

      // Có lỗi
      return response.message;
    } catch (error) {
      console.error('Login error:', error);
      return 'Lỗi kết nối server';
    }
  };

  // Đăng ký
  const register = async (data: RegisterRequest): Promise<string | null> => {
    try {
      const response = await authApi.register(data);

      // Nếu có id = thành công
      if (response.id) {
        const registeredUser: User = {
          id: response.id,
          email: response.email,
          fullName: response.fullName,
          phone: response.phone,
          role: response.role,
        };
        setUser(registeredUser);
        localStorage.setItem('user', JSON.stringify(registeredUser));
        return null; // Không có lỗi
      }

      // Có lỗi
      return response.message;
    } catch (error) {
      console.error('Register error:', error);
      return 'Lỗi kết nối server';
    }
  };

  // Đăng xuất
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook để sử dụng AuthContext
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được dùng trong AuthProvider');
  }
  return context;
}
