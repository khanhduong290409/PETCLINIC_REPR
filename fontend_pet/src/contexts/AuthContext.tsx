import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../api/authApi';
import type { LoginRequest, RegisterRequest } from '../api/authApi';
import { parseJwt, isTokenExpired } from '../api/apiClient';

interface User {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<string | null>;
  register: (data: RegisterRequest) => Promise<string | null>;
  logout: () => void;
  loginWithToken: (token: string) => void; // dùng cho đăng nhập Google
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Khi mount, kiểm tra token còn hạn không rồi mới restore session
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !isTokenExpired(token)) {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } else if (token) {
      // Token hết hạn → xóa session
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    setLoading(false);
  }, []);

  const saveSession = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  };

  const login = async (data: LoginRequest): Promise<string | null> => {
    try {
      const response = await authApi.login(data);
      if (response.id) {
        saveSession(
          { id: response.id, email: response.email, fullName: response.fullName, phone: response.phone, role: response.role },
          response.token
        );
        return null;
      }
      return response.message;
    } catch {
      return 'Lỗi kết nối server';
    }
  };

  const register = async (data: RegisterRequest): Promise<string | null> => {
    try {
      const response = await authApi.register(data);
      if (response.id) {
        saveSession(
          { id: response.id, email: response.email, fullName: response.fullName, phone: response.phone, role: response.role },
          response.token
        );
        return null;
      }
      return response.message;
    } catch {
      return 'Lỗi kết nối server';
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // Đăng nhập bằng Google — nhận JWT token, decode để lấy user info
  const loginWithToken = (token: string) => {
    const payload = parseJwt(token);
    const userData: User = {
      id: payload.userId as number,
      email: payload.sub as string,
      fullName: payload.fullName as string,
      phone: '',
      role: payload.role as string,
    };
    saveSession(userData, token);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loginWithToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được dùng trong AuthProvider');
  }
  return context;
}
